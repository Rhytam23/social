import { bytesToBase64, base64ToBytes } from '../utils/encoding';

export interface DeviceIdentity {
  deviceId: string;
  publicKey: Uint8Array; // X25519 public key
  privateKey: Uint8Array; // X25519 secret key - NEVER leaves the device unencrypted
}

interface StoredGroupKey {
  key: Uint8Array;
  version: number;
}

interface SerializedState {
  version: 2;
  identity: { deviceId: string; publicKeyB64: string; privateKeyB64: string } | null;
  peerKeys: Array<[string, string]>; // [`${userId}:${deviceId}`, publicKeyB64]
  groupKeys: Array<[string, { keyB64: string; version: number }]>; // [conversationId, {...}]
}

const DB_NAME = 'private-chat-keystore';
const STORE_NAME = 'device-state';
const RECORD_KEY = 'current-device';

/**
 * Holds this browser's E2EE identity key pair, cached peer public keys, and
 * per-conversation group keys. Private key material never leaves this class
 * except through `exportSerializedState`, which is only ever handed to the
 * passphrase-encrypted backup flow (crypto/backup/keyBackup.ts).
 */
export class DeviceKeyStore {
  private identity: DeviceIdentity | null = null;
  private peerKeys: Map<string, Uint8Array> = new Map();
  private groupKeys: Map<string, StoredGroupKey> = new Map();

  setIdentity(identity: DeviceIdentity): void {
    this.identity = identity;
  }

  getIdentity(): DeviceIdentity | null {
    return this.identity;
  }

  requireIdentity(): DeviceIdentity {
    if (!this.identity) {
      throw new Error('Device identity has not been generated yet');
    }
    return this.identity;
  }

  private peerKeyMapKey(userId: string, deviceId: string): string {
    return `${userId}::${deviceId}`;
  }

  savePeerKey(userId: string, deviceId: string, publicKey: Uint8Array): void {
    this.peerKeys.set(this.peerKeyMapKey(userId, deviceId), publicKey);
  }

  getPeerKey(userId: string, deviceId: string): Uint8Array | null {
    return this.peerKeys.get(this.peerKeyMapKey(userId, deviceId)) || null;
  }

  saveGroupKey(conversationId: string, key: Uint8Array, version: number): void {
    this.groupKeys.set(conversationId, { key, version });
  }

  getGroupKey(conversationId: string): StoredGroupKey | null {
    return this.groupKeys.get(conversationId) || null;
  }

  // --- Serialization (used by crypto/backup/keyBackup.ts) ---

  exportSerializedState(): string {
    if (!this.identity) {
      throw new Error('Cannot export an empty key store');
    }

    const state: SerializedState = {
      version: 2,
      identity: {
        deviceId: this.identity.deviceId,
        publicKeyB64: bytesToBase64(this.identity.publicKey),
        privateKeyB64: bytesToBase64(this.identity.privateKey),
      },
      peerKeys: Array.from(this.peerKeys.entries()).map(([key, pub]) => [key, bytesToBase64(pub)]),
      groupKeys: Array.from(this.groupKeys.entries()).map(([convId, g]) => [
        convId,
        { keyB64: bytesToBase64(g.key), version: g.version },
      ]),
    };

    return JSON.stringify(state);
  }

  importSerializedState(jsonStr: string): void {
    const state = JSON.parse(jsonStr) as SerializedState;

    this.identity = state.identity
      ? {
          deviceId: state.identity.deviceId,
          publicKey: base64ToBytes(state.identity.publicKeyB64),
          privateKey: base64ToBytes(state.identity.privateKeyB64),
        }
      : null;

    this.peerKeys = new Map(state.peerKeys.map(([key, b64]) => [key, base64ToBytes(b64)]));
    this.groupKeys = new Map(
      state.groupKeys.map(([convId, g]) => [convId, { key: base64ToBytes(g.keyB64), version: g.version }])
    );
  }

  // --- Browser persistence (IndexedDB) ---
  // Without this, a page refresh would lose the device's private key and the
  // user would be permanently unable to decrypt their own message history.

  async persist(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const db = await openDb();
    try {
      await idbPut(db, RECORD_KEY, this.exportSerializedState());
    } finally {
      db.close();
    }
  }

  static async load(): Promise<DeviceKeyStore | null> {
    if (typeof indexedDB === 'undefined') return null;
    const db = await openDb();
    try {
      const raw = await idbGet(db, RECORD_KEY);
      if (!raw) return null;
      const store = new DeviceKeyStore();
      store.importSerializedState(raw);
      return store;
    } finally {
      db.close();
    }
  }

  static async clear(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    const db = await openDb();
    try {
      await idbDelete(db, RECORD_KEY);
    } finally {
      db.close();
    }
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open key store database'));
  });
}

function idbPut(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to persist key store'));
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => reject(req.error || new Error('Failed to read key store'));
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to clear key store'));
  });
}
