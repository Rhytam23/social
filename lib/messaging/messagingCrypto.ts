import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import {
  DeviceKeyStore,
  generateDeviceKeys,
  registerPeerKey,
  computeDeviceFingerprint,
  encrypt1to1Message,
  decrypt1to1Message,
  generateGroupKey,
  distributeGroupKey,
  unwrapGroupKeyEnvelope,
  encryptGroupMessage,
  decryptGroupMessage,
  bytesToBase64,
  type EncryptedMessagePayload,
} from '../../crypto';
import { type MessageEnvelope, serializeEnvelope, parseEnvelope } from './envelope';

interface PeerDevice {
  deviceId: string;
  publicKeyB64: string;
}

/**
 * Owns this browser's E2EE identity and drives every encrypt/decrypt
 * operation the app needs: 1:1 message envelopes, group message envelopes,
 * and group key distribution. One instance is created per logged-in session
 * (see app/page.tsx) and torn down on logout.
 */
export class MessagingCrypto {
  private keyStore: DeviceKeyStore = new DeviceKeyStore();
  private readonly readyPromise: Promise<void>;
  private peerDeviceCache = new Map<string, PeerDevice>();

  constructor(private supabase: SupabaseClient<Database>, private myUserId: string) {
    this.readyPromise = this.init();
  }

  private linkRequired = false;

  private async init(): Promise<void> {
    const loaded = await DeviceKeyStore.load();
    if (loaded && loaded.getIdentity()) {
      this.keyStore = loaded;
      // Keep last_seen_at fresh so other clients' device lists are accurate.
      await this.supabase
        .from('user_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', this.myUserId)
        .eq('device_id', this.keyStore.requireIdentity().deviceId);
      return;
    }

    // No key on this browser. If the account already has an identity, a new one must NOT be
    // minted silently: peers would start encrypting to it and the first device would go blind.
    // The person links this browser with their encrypted backup instead (or starts fresh).
    const { count, error } = await this.supabase
      .from('user_devices')
      .select('device_id', { count: 'exact', head: true })
      .eq('user_id', this.myUserId);
    if (error) throw new Error('Could not check this account devices. Please try again.');
    if ((count ?? 0) > 0) {
      this.linkRequired = true;
      return;
    }
    await this.createIdentity();
  }

  private async createIdentity(): Promise<void> {
    const bundle = await generateDeviceKeys(this.keyStore);
    await this.keyStore.persist();
    await this.registerDevice(bundle.deviceId, bundle.identityPublicKey);
  }

  private async registerDevice(deviceId: string, publicKeyB64: string): Promise<void> {
    const { error } = await this.supabase.from('user_devices').upsert(
      {
        user_id: this.myUserId,
        device_id: deviceId,
        identity_public_key: publicKeyB64,
        signed_prekey: publicKeyB64,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_id' }
    );
    if (error) throw new Error('Could not register this device. Every account can link up to 3 devices.');
  }

  /** True when this browser has no key yet but the account already has one to link with. */
  needsLink(): boolean {
    return this.linkRequired;
  }

  /**
   * Call after a backup was restored into this browser's key store. Persists it and makes sure
   * the account's device registry lists that identity. `previousDeviceId` is the identity this
   * browser used before (if any); its registry row is removed so peers stop encrypting to it.
   */
  async completeLinking(previousDeviceId?: string | null): Promise<void> {
    const identity = this.keyStore.getIdentity();
    if (!identity) throw new Error('That backup does not contain an account key.');
    await this.keyStore.persist();
    await this.registerDevice(identity.deviceId, bytesToBase64(identity.publicKey));
    if (previousDeviceId && previousDeviceId !== identity.deviceId) {
      await this.supabase.from('user_devices').delete().eq('user_id', this.myUserId).eq('device_id', previousDeviceId);
    }
    this.peerDeviceCache.clear();
    this.linkRequired = false;
  }

  /** Replaces the account's key with a brand-new one. Old messages become unreadable. */
  async startFresh(): Promise<void> {
    const { error } = await this.supabase.from('user_devices').delete().eq('user_id', this.myUserId);
    if (error) throw new Error('Could not reset this account keys. Please try again.');
    this.keyStore = new DeviceKeyStore();
    this.peerDeviceCache.clear();
    await this.createIdentity();
    this.linkRequired = false;
  }

  async waitReady(): Promise<void> {
    await this.readyPromise;
  }

  hasIdentity(): boolean {
    return this.keyStore.getIdentity() !== null;
  }

  getKeyStore(): DeviceKeyStore {
    return this.keyStore;
  }

  myPublicKeyB64(): string {
    return bytesToBase64(this.keyStore.requireIdentity().publicKey);
  }

  private myPrivateKeyB64(): string {
    return bytesToBase64(this.keyStore.requireIdentity().privateKey);
  }

  myDeviceId(): string {
    return this.keyStore.requireIdentity().deviceId;
  }

  async myFingerprint(): Promise<string> {
    return computeDeviceFingerprint(this.myPublicKeyB64());
  }

  /** Fetches (and caches) the most recently active device for a user. */
  async getPeerDevice(userId: string): Promise<PeerDevice | null> {
    const cached = this.peerDeviceCache.get(userId);
    if (cached) return cached;

    const { data } = await this.supabase
      .from('user_devices')
      .select('device_id, identity_public_key')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const device: PeerDevice = { deviceId: data.device_id, publicKeyB64: data.identity_public_key };
    this.peerDeviceCache.set(userId, device);
    registerPeerKey(this.keyStore, userId, device.deviceId, device.publicKeyB64);
    return device;
  }

  // --- 1:1 messages ---

  async encryptForRecipient(recipientUserId: string, envelope: MessageEnvelope): Promise<EncryptedMessagePayload> {
    const peer = await this.getPeerDevice(recipientUserId);
    if (!peer) {
      throw new Error('This person has not finished setting up encryption on any device yet');
    }
    return encrypt1to1Message(serializeEnvelope(envelope), this.myPrivateKeyB64(), peer.publicKeyB64);
  }

  /**
   * Decrypts a message from a 1:1 conversation. `otherParticipantUserId` is
   * always the OTHER party in the conversation, never `payload`'s sender -
   * crypto_box's shared secret is symmetric (my_priv x their_pub ==
   * their_priv x my_pub), so a message I sent and a message I received in
   * the same conversation decrypt with the exact same key pair. Passing the
   * sender's own key here for a message I sent myself would silently
   * produce garbage instead of failing loudly, which is worse.
   */
  async decryptWithParticipant(otherParticipantUserId: string, payload: EncryptedMessagePayload): Promise<MessageEnvelope> {
    const peer = await this.getPeerDevice(otherParticipantUserId);
    if (!peer) {
      throw new Error('Cannot verify the other participant\'s identity key');
    }

    const json = await decrypt1to1Message(payload, this.myPrivateKeyB64(), peer.publicKeyB64);
    return parseEnvelope(json);
  }

  // --- Groups ---

  /** Generates a new group key and distributes it to every given member. */
  async createAndDistributeGroupKey(
    conversationId: string,
    keyVersion: number,
    members: Array<{ userId: string; deviceId: string; publicKeyB64: string }>
  ) {
    const groupKey = await generateGroupKey();
    const envelopes = await distributeGroupKey(groupKey, keyVersion, members);
    this.keyStore.saveGroupKey(conversationId, groupKey, keyVersion);
    await this.keyStore.persist();
    return envelopes;
  }

  /** Loads (from local cache or a fetched envelope) the key for a group. */
  async ensureGroupKey(conversationId: string): Promise<{ key: Uint8Array; version: number } | null> {
    const cached = this.keyStore.getGroupKey(conversationId);
    if (cached) return cached;

    const { data } = await this.supabase
      .from('group_key_envelopes')
      .select('encrypted_group_key, key_version')
      .eq('conversation_id', conversationId)
      .eq('user_id', this.myUserId)
      .eq('device_id', this.myDeviceId())
      .order('key_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const key = await unwrapGroupKeyEnvelope(data.encrypted_group_key, this.myPublicKeyB64(), this.myPrivateKeyB64());
    this.keyStore.saveGroupKey(conversationId, key, data.key_version);
    await this.keyStore.persist();
    return { key, version: data.key_version };
  }

  async encryptGroupEnvelope(conversationId: string, envelope: MessageEnvelope) {
    const group = await this.ensureGroupKey(conversationId);
    if (!group) {
      throw new Error('No group key available yet - ask another member to re-share access');
    }
    return encryptGroupMessage(serializeEnvelope(envelope), group.key, group.version);
  }

  async decryptGroupEnvelope(
    conversationId: string,
    payload: { ciphertext: string; nonce: string; keyVersion: number; encryptionVersion: number }
  ): Promise<MessageEnvelope> {
    const group = await this.ensureGroupKey(conversationId);
    if (!group || group.version !== payload.keyVersion) {
      throw new Error('This message was encrypted with a group key version this device does not have');
    }
    const json = await decryptGroupMessage(payload, group.key);
    return parseEnvelope(json);
  }
}
