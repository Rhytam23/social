import { getSodium } from '../sodium';
import { bytesToBase64, base64ToBytes, bytesToUtf8, utf8ToBytes } from '../utils/encoding';

export interface EncryptedMessagePayload {
  ciphertext: string; // Base64
  nonce: string; // Base64, crypto_box_NONCEBYTES random bytes
  encryptionVersion: number;
}

// Version 1 was `window.btoa(content)` - not encryption at all. Version 2 is
// real X25519 + XSalsa20-Poly1305 authenticated public-key encryption
// (libsodium crypto_box). Bumping the version lets old fake-encrypted rows
// (if any exist from a prior deploy) be detected and rejected instead of
// silently mis-decrypted.
export const MESSAGE_ENCRYPTION_VERSION = 2;

/**
 * Encrypts `plaintext` for a specific recipient device using their long-term
 * X25519 public key. Authenticated: the recipient can verify it was sent by
 * the holder of `myPrivateKeyB64`, and nobody without `theirPrivateKey` can
 * read it - real E2EE. (See docs/20_E2EE_SPEC.md for why this replaces the
 * originally-specified Signal Double Ratchet: libsignal-client cannot run in
 * a browser.)
 */
export async function encrypt1to1Message(
  plaintext: string,
  myPrivateKeyB64: string,
  theirPublicKeyB64: string
): Promise<EncryptedMessagePayload> {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(
    utf8ToBytes(plaintext),
    nonce,
    base64ToBytes(theirPublicKeyB64),
    base64ToBytes(myPrivateKeyB64)
  );

  return {
    ciphertext: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
    encryptionVersion: MESSAGE_ENCRYPTION_VERSION,
  };
}

export async function decrypt1to1Message(
  payload: EncryptedMessagePayload,
  myPrivateKeyB64: string,
  theirPublicKeyB64: string
): Promise<string> {
  if (payload.encryptionVersion !== MESSAGE_ENCRYPTION_VERSION) {
    throw new Error(`Unsupported message encryption version: ${payload.encryptionVersion}`);
  }

  const sodium = await getSodium();
  const plaintextBytes = sodium.crypto_box_open_easy(
    base64ToBytes(payload.ciphertext),
    base64ToBytes(payload.nonce),
    base64ToBytes(theirPublicKeyB64),
    base64ToBytes(myPrivateKeyB64)
  );

  if (!plaintextBytes) {
    throw new Error('Decryption failed: ciphertext is invalid, tampered, or from the wrong sender');
  }

  return bytesToUtf8(plaintextBytes);
}
