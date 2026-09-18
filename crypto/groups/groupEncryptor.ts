import { getSodium } from '../sodium';
import { bytesToBase64, base64ToBytes, bytesToUtf8, utf8ToBytes } from '../utils/encoding';

export interface EncryptedGroupMessagePayload {
  ciphertext: string; // Base64
  nonce: string; // Base64, crypto_secretbox_NONCEBYTES random bytes
  keyVersion: number;
  encryptionVersion: number;
}

export interface GroupKeyEnvelopePayload {
  recipientUserId: string;
  recipientDeviceId: string;
  keyVersion: number;
  encryptedGroupKey: string; // Base64 JSON of {ciphertext, nonce} - crypto_box(groupKey) to the recipient
}

export const GROUP_ENCRYPTION_VERSION = 2;

/** Generates a fresh random 256-bit symmetric group key. */
export async function generateGroupKey(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_secretbox_keygen();
}

/**
 * Wraps a group's symmetric key individually for each member device using an
 * anonymous sealed box (crypto_box_seal) addressed to that device's identity
 * key. Sealed boxes don't require the recipient to know who distributed the
 * key - any current member can (re-)distribute it, which matters because
 * membership changes (and therefore key rotation) can be triggered by any
 * member, not just the group's original creator. Only devices that receive
 * an envelope for a given key version can ever decrypt messages under it -
 * this is how member removal + key rotation revokes access.
 */
export async function distributeGroupKey(
  groupKey: Uint8Array,
  keyVersion: number,
  members: Array<{ userId: string; deviceId: string; publicKeyB64: string }>
): Promise<GroupKeyEnvelopePayload[]> {
  const sodium = await getSodium();

  const envelopes: GroupKeyEnvelopePayload[] = [];
  for (const member of members) {
    const sealed = sodium.crypto_box_seal(groupKey, base64ToBytes(member.publicKeyB64));

    envelopes.push({
      recipientUserId: member.userId,
      recipientDeviceId: member.deviceId,
      keyVersion,
      encryptedGroupKey: JSON.stringify({ sealed: bytesToBase64(sealed) }),
    });
  }

  return envelopes;
}

/** Unwraps a group key envelope addressed to this device. */
export async function unwrapGroupKeyEnvelope(
  encryptedGroupKey: string,
  myPublicKeyB64: string,
  myPrivateKeyB64: string
): Promise<Uint8Array> {
  const sodium = await getSodium();
  const { sealed } = JSON.parse(encryptedGroupKey) as { sealed: string };

  const groupKey = sodium.crypto_box_seal_open(
    base64ToBytes(sealed),
    base64ToBytes(myPublicKeyB64),
    base64ToBytes(myPrivateKeyB64)
  );

  if (!groupKey) {
    throw new Error('Failed to unwrap group key envelope: invalid or tampered payload');
  }

  return groupKey;
}

export async function encryptGroupMessage(
  plaintext: string,
  groupKey: Uint8Array,
  keyVersion: number
): Promise<EncryptedGroupMessagePayload> {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(utf8ToBytes(plaintext), nonce, groupKey);

  return {
    ciphertext: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
    keyVersion,
    encryptionVersion: GROUP_ENCRYPTION_VERSION,
  };
}

export async function decryptGroupMessage(
  payload: EncryptedGroupMessagePayload,
  groupKey: Uint8Array
): Promise<string> {
  if (payload.encryptionVersion !== GROUP_ENCRYPTION_VERSION) {
    throw new Error(`Unsupported group message encryption version: ${payload.encryptionVersion}`);
  }

  const sodium = await getSodium();
  const plaintextBytes = sodium.crypto_secretbox_open_easy(
    base64ToBytes(payload.ciphertext),
    base64ToBytes(payload.nonce),
    groupKey
  );

  if (!plaintextBytes) {
    throw new Error('Group message decryption failed: wrong key version or tampered ciphertext');
  }

  return bytesToUtf8(plaintextBytes);
}
