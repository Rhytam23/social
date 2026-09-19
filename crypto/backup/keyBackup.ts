import { argon2id } from 'hash-wasm';
import { DeviceKeyStore } from '../storage/keyStorage';
import { bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from '../utils/encoding';

export interface KeyBackupPayload {
  version: number;
  kdfParams: {
    algorithm: string;
    timeCost: number;
    memoryCost: number;
    parallelism: number;
    hashLength: number;
  };
  saltB64: string;
  nonceB64: string;
  ciphertextB64: string;
}

async function deriveBackupKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const hashHex = await argon2id({
    password: passphrase,
    salt: saltBytes,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'hex',
  });

  const rawKeyBytes = new Uint8Array(hashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

  return await globalThis.crypto.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function createKeyBackup(passphrase: string, store: DeviceKeyStore): Promise<KeyBackupPayload> {
  const exportedJson = store.exportSerializedState();
  const plaintextBytes = utf8ToBytes(exportedJson);

  const saltBytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const nonceBytes = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const derivedKey = await deriveBackupKey(passphrase, saltBytes);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonceBytes as unknown as BufferSource },
    derivedKey,
    plaintextBytes as unknown as BufferSource
  );

  return {
    version: 1,
    kdfParams: {
      algorithm: 'Argon2id',
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 4,
      hashLength: 32,
    },
    saltB64: bytesToBase64(saltBytes),
    nonceB64: bytesToBase64(nonceBytes),
    ciphertextB64: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };
}

export async function restoreKeyBackup(
  passphrase: string,
  backup: KeyBackupPayload,
  targetStore: DeviceKeyStore
): Promise<void> {
  const saltBytes = base64ToBytes(backup.saltB64);
  const nonceBytes = base64ToBytes(backup.nonceB64);
  const cipherBytes = base64ToBytes(backup.ciphertextB64);

  const derivedKey = await deriveBackupKey(passphrase, saltBytes);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonceBytes as unknown as BufferSource },
      derivedKey,
      cipherBytes as unknown as BufferSource
    );
  } catch {
    throw new Error('Failed to restore backup: Invalid passphrase or corrupted backup ciphertext');
  }

  const jsonStr = bytesToUtf8(new Uint8Array(decryptedBuffer));
  targetStore.importSerializedState(jsonStr);
}
