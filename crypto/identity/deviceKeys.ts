import { getSodium } from '../sodium';
import { DeviceKeyStore } from '../storage/keyStorage';
import { bytesToBase64 } from '../utils/encoding';

export interface DevicePublicBundle {
  deviceId: string;
  identityPublicKey: string; // Base64 X25519 public key
}

function randomDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Node < 19 fallback for the vitest environment.
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Generates this device's long-term X25519 identity key pair and stores the
 * private key in `store` (never returned to the caller). The returned bundle
 * is the only thing that should ever be published to `user_devices`.
 */
export async function generateDeviceKeys(store: DeviceKeyStore): Promise<DevicePublicBundle> {
  const sodium = await getSodium();
  const keyPair = sodium.crypto_box_keypair();
  const deviceId = randomDeviceId();

  store.setIdentity({
    deviceId,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  });

  return {
    deviceId,
    identityPublicKey: bytesToBase64(keyPair.publicKey),
  };
}
