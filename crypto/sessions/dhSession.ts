import { getSodium } from '../sodium';
import { DeviceKeyStore } from '../storage/keyStorage';
import { base64ToBytes, concatBytes } from '../utils/encoding';

/**
 * "Session establishment" for a crypto_box (X25519) scheme is simply trusting
 * the peer's long-term public key. There is no negotiated ratchet state to
 * set up ahead of time - the first message IS the session. This module's job
 * is caching that trusted key and computing a human-verifiable fingerprint of
 * it, so the UI can show users something they can compare out-of-band (the
 * same purpose Signal's "safety number" serves).
 */
export function registerPeerKey(
  store: DeviceKeyStore,
  userId: string,
  deviceId: string,
  identityPublicKeyB64: string
): void {
  store.savePeerKey(userId, deviceId, base64ToBytes(identityPublicKeyB64));
}

function toHexGroups(bytes: Uint8Array, groupSize = 4): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const groups: string[] = [];
  for (let i = 0; i < hex.length; i += groupSize) {
    groups.push(hex.slice(i, i + groupSize));
  }
  return groups.join('-');
}

/** A short fingerprint of a single device's public key, for device lists. */
export async function computeDeviceFingerprint(identityPublicKeyB64: string): Promise<string> {
  const sodium = await getSodium();
  const publicKey = base64ToBytes(identityPublicKeyB64);
  const digest = sodium.crypto_generichash(16, publicKey, null);
  return toHexGroups(digest);
}

/**
 * A combined, order-independent fingerprint of two parties' public keys -
 * a "safety number" both sides can compute and compare to detect a
 * man-in-the-middle key substitution.
 */
export async function computeSafetyNumber(
  myPublicKeyB64: string,
  theirPublicKeyB64: string
): Promise<string> {
  const sodium = await getSodium();
  const a = myPublicKeyB64 < theirPublicKeyB64 ? myPublicKeyB64 : theirPublicKeyB64;
  const b = myPublicKeyB64 < theirPublicKeyB64 ? theirPublicKeyB64 : myPublicKeyB64;
  const combined = concatBytes(base64ToBytes(a), base64ToBytes(b));
  const digest = sodium.crypto_generichash(20, combined, null);
  return toHexGroups(digest, 5);
}
