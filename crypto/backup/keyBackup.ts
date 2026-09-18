import { argon2id } from 'hash-wasm';
import { SignalKeyStore } from '../storage/keyStorage';

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

function toUint8Array(buf: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (buf instanceof Uint8Array) {
    return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return new Uint8Array(buf);
}

export async function deriveBackupKey(
  passphrase: string,
  saltBytes: Uint8Array
): Promise<CryptoKey> {
  const hashHex = await argon2id({
    password: passphrase,
    salt: saltBytes,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'hex',
  });

  const rawKeyBuf = Buffer.from(hashHex, 'hex');
  const rawKeyBytes = toUint8Array(rawKeyBuf);

  return await globalThis.crypto.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function createKeyBackup(
  passphrase: string,
  store: SignalKeyStore
): Promise<KeyBackupPayload> {
  const exportedJson = await store.exportSerializedState();
  const plaintextBytes = toUint8Array(Buffer.from(exportedJson, 'utf-8'));

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
    saltB64: Buffer.from(saltBytes).toString('base64'),
    nonceB64: Buffer.from(nonceBytes).toString('base64'),
    ciphertextB64: Buffer.from(encryptedBuffer).toString('base64'),
  };
}

export async function restoreKeyBackup(
  passphrase: string,
  backup: KeyBackupPayload,
  targetStore: SignalKeyStore
): Promise<void> {
  const saltBuf = Buffer.from(backup.saltB64, 'base64');
  const nonceBuf = Buffer.from(backup.nonceB64, 'base64');
  const cipherBuf = Buffer.from(backup.ciphertextB64, 'base64');

  const saltBytes = toUint8Array(saltBuf);
  const nonceBytes = toUint8Array(nonceBuf);
  const cipherBytes = toUint8Array(cipherBuf);

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

  const jsonStr = Buffer.from(decryptedBuffer).toString('utf-8');
  await targetStore.importSerializedState(jsonStr);
}
