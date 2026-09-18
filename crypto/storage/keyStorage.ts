import {
  IdentityKeyPair,
  PrivateKey,
  PublicKey,
  ProtocolAddress,
  PreKeyRecord,
  SignedPreKeyRecord,
  SessionRecord,
  SenderKeyRecord,
  KyberPreKeyRecord,
  IdentityChange,
} from '@signalapp/libsignal-client';

function wasmToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

export class SignalKeyStore {
  private identityKeyPair: IdentityKeyPair | null = null;
  private localRegistrationId: number = 0;
  private trustedIdentities: Map<string, PublicKey> = new Map();
  private preKeys: Map<number, PreKeyRecord> = new Map();
  private signedPreKeys: Map<number, SignedPreKeyRecord> = new Map();
  private kyberPreKeys: Map<number, KyberPreKeyRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private senderKeys: Map<string, SenderKeyRecord> = new Map();

  constructor() {}

  // --- Identity Key Store ---
  public async getIdentityKeyPair(): Promise<IdentityKeyPair> {
    if (!this.identityKeyPair) {
      throw new Error('Identity key pair not initialized');
    }
    return this.identityKeyPair;
  }

  public async getIdentityKey(): Promise<PrivateKey> {
    if (!this.identityKeyPair) {
      throw new Error('Identity key pair not initialized');
    }
    return this.identityKeyPair.privateKey;
  }

  public async getLocalRegistrationId(): Promise<number> {
    return this.localRegistrationId;
  }

  public async setIdentityKeyPair(keyPair: IdentityKeyPair, registrationId: number): Promise<void> {
    this.identityKeyPair = keyPair;
    this.localRegistrationId = registrationId;
  }

  public async saveIdentity(address: ProtocolAddress, key: PublicKey): Promise<IdentityChange> {
    const keyStr = address.toString();
    const existing = this.trustedIdentities.get(keyStr);
    this.trustedIdentities.set(keyStr, key);
    if (!existing || wasmToBuffer(existing.serialize()).equals(wasmToBuffer(key.serialize()))) {
      return IdentityChange.NewOrUnchanged;
    }
    return IdentityChange.ReplacedExisting;
  }

  public async isTrustedIdentity(address: ProtocolAddress, key: PublicKey): Promise<boolean> {
    const existing = this.trustedIdentities.get(address.toString());
    if (!existing) return true;
    return wasmToBuffer(existing.serialize()).equals(wasmToBuffer(key.serialize()));
  }

  public async getIdentity(address: ProtocolAddress): Promise<PublicKey | null> {
    return this.trustedIdentities.get(address.toString()) || null;
  }

  // --- PreKey Store ---
  public async getPreKey(id: number): Promise<PreKeyRecord> {
    const record = this.preKeys.get(id);
    if (!record) {
      throw new Error(`PreKey ${id} not found`);
    }
    return record;
  }

  public async savePreKey(id: number, record: PreKeyRecord): Promise<void> {
    this.preKeys.set(id, record);
  }

  public async removePreKey(id: number): Promise<void> {
    this.preKeys.delete(id);
  }

  // --- Signed PreKey Store ---
  public async getSignedPreKey(id: number): Promise<SignedPreKeyRecord> {
    const record = this.signedPreKeys.get(id);
    if (!record) {
      throw new Error(`SignedPreKey ${id} not found`);
    }
    return record;
  }

  public async saveSignedPreKey(id: number, record: SignedPreKeyRecord): Promise<void> {
    this.signedPreKeys.set(id, record);
  }

  // --- Kyber PreKey Store ---
  public async getKyberPreKey(id: number): Promise<KyberPreKeyRecord> {
    const record = this.kyberPreKeys.get(id);
    if (!record) {
      throw new Error(`KyberPreKey ${id} not found`);
    }
    return record;
  }

  public async saveKyberPreKey(id: number, record: KyberPreKeyRecord): Promise<void> {
    this.kyberPreKeys.set(id, record);
  }

  public async markKyberPreKeyUsed(): Promise<void> {
    // No-op for testing/local store
  }

  // --- Session Store ---
  public async getSession(address: ProtocolAddress): Promise<SessionRecord | null> {
    return this.sessions.get(address.toString()) || null;
  }

  public async saveSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
    this.sessions.set(address.toString(), record);
  }

  public async getExistingSessions(addresses: ProtocolAddress[]): Promise<SessionRecord[]> {
    const result: SessionRecord[] = [];
    for (const addr of addresses) {
      const s = await this.getSession(addr);
      if (s) result.push(s);
    }
    return result;
  }

  // --- Sender Key Store ---
  private getSenderKeyMapKey(sender: ProtocolAddress, distributionId: string): string {
    return `${sender.toString()}::${distributionId}`;
  }

  public async getSenderKey(sender: ProtocolAddress, distributionId: string): Promise<SenderKeyRecord | null> {
    return this.senderKeys.get(this.getSenderKeyMapKey(sender, distributionId)) || null;
  }

  public async saveSenderKey(sender: ProtocolAddress, distributionId: string, record: SenderKeyRecord): Promise<void> {
    this.senderKeys.set(this.getSenderKeyMapKey(sender, distributionId), record);
  }

  // --- Backup Serialization ---
  public async exportSerializedState(): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Cannot export empty key store');
    }

    const state = {
      registrationId: this.localRegistrationId,
      identityKeyPair: wasmToBuffer(this.identityKeyPair.serialize()).toString('base64'),
      preKeys: Array.from(this.preKeys.entries()).map(([id, rec]) => [id, wasmToBuffer(rec.serialize()).toString('base64')]),
      signedPreKeys: Array.from(this.signedPreKeys.entries()).map(([id, rec]) => [id, wasmToBuffer(rec.serialize()).toString('base64')]),
      kyberPreKeys: Array.from(this.kyberPreKeys.entries()).map(([id, rec]) => [id, wasmToBuffer(rec.serialize()).toString('base64')]),
      sessions: Array.from(this.sessions.entries()).map(([addr, rec]) => [addr, wasmToBuffer(rec.serialize()).toString('base64')]),
      senderKeys: Array.from(this.senderKeys.entries()).map(([key, rec]) => [key, wasmToBuffer(rec.serialize()).toString('base64')]),
    };

    return JSON.stringify(state);
  }

  public async importSerializedState(jsonStr: string): Promise<void> {
    const state = JSON.parse(jsonStr);
    this.localRegistrationId = state.registrationId;
    this.identityKeyPair = IdentityKeyPair.deserialize(Buffer.from(state.identityKeyPair, 'base64'));

    this.preKeys.clear();
    for (const [id, b64] of state.preKeys) {
      this.preKeys.set(id, PreKeyRecord.deserialize(Buffer.from(b64, 'base64')));
    }

    this.signedPreKeys.clear();
    for (const [id, b64] of state.signedPreKeys) {
      this.signedPreKeys.set(id, SignedPreKeyRecord.deserialize(Buffer.from(b64, 'base64')));
    }

    this.kyberPreKeys.clear();
    if (state.kyberPreKeys) {
      for (const [id, b64] of state.kyberPreKeys) {
        this.kyberPreKeys.set(id, KyberPreKeyRecord.deserialize(Buffer.from(b64, 'base64')));
      }
    }

    this.sessions.clear();
    for (const [addr, b64] of state.sessions) {
      this.sessions.set(addr, SessionRecord.deserialize(Buffer.from(b64, 'base64')));
    }

    this.senderKeys.clear();
    for (const [key, b64] of state.senderKeys) {
      this.senderKeys.set(key, SenderKeyRecord.deserialize(Buffer.from(b64, 'base64')));
    }
  }
}

