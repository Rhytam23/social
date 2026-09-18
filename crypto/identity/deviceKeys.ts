import {
  IdentityKeyPair,
  PrivateKey,
  PreKeyRecord,
  SignedPreKeyRecord,
  KyberPreKeyRecord,
  KEMKeyPair,
} from '@signalapp/libsignal-client';
import { SignalKeyStore } from '../storage/keyStorage';

function wasmToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

export interface DevicePublicBundle {
  registrationId: number;
  identityPublicKey: string; // Base64 encoded
  signedPreKeyId: number;
  signedPreKeyPublicKey: string; // Base64 encoded
  signedPreKeySignature: string; // Base64 encoded
  oneTimePreKeys: Array<{
    id: number;
    publicKey: string; // Base64 encoded
  }>;
  kyberPreKeyId: number;
  kyberPreKeyPublicKey: string; // Base64 encoded
  kyberPreKeySignature: string; // Base64 encoded
}

export async function generateDeviceKeys(
  store: SignalKeyStore,
  registrationId: number,
  signedPreKeyId: number = 1,
  numOneTimePreKeys: number = 5,
  kyberPreKeyId: number = 1
): Promise<DevicePublicBundle> {
  const identityKeyPair = IdentityKeyPair.generate();
  await store.setIdentityKeyPair(identityKeyPair, registrationId);

  // Generate Signed PreKey signed with Identity Private Key
  const signedPreKeyPrivate = PrivateKey.generate();
  const signedPreKeyPublic = signedPreKeyPrivate.getPublicKey();
  const timestamp = Date.now();
  const signature = identityKeyPair.privateKey.sign(signedPreKeyPublic.serialize());

  const signedPreKeyRecord = SignedPreKeyRecord.new(
    signedPreKeyId,
    timestamp,
    signedPreKeyPublic,
    signedPreKeyPrivate,
    signature
  );
  await store.saveSignedPreKey(signedPreKeyId, signedPreKeyRecord);

  // Generate Post-Quantum Kyber PreKey
  const kyberKeyPair = KEMKeyPair.generate();
  const kyberPublic = kyberKeyPair.getPublicKey();
  const kyberSignature = identityKeyPair.privateKey.sign(kyberPublic.serialize());

  const kyberPreKeyRecord = KyberPreKeyRecord.new(
    kyberPreKeyId,
    timestamp,
    kyberKeyPair,
    kyberSignature
  );
  await store.saveKyberPreKey(kyberPreKeyId, kyberPreKeyRecord);

  // Generate One-Time PreKeys
  const oneTimePreKeysBundle: Array<{ id: number; publicKey: string }> = [];
  for (let i = 1; i <= numOneTimePreKeys; i++) {
    const preKeyPrivate = PrivateKey.generate();
    const preKeyPublic = preKeyPrivate.getPublicKey();
    const preKeyRecord = PreKeyRecord.new(i, preKeyPublic, preKeyPrivate);
    await store.savePreKey(i, preKeyRecord);

    oneTimePreKeysBundle.push({
      id: i,
      publicKey: wasmToBuffer(preKeyPublic.serialize()).toString('base64'),
    });
  }

  return {
    registrationId,
    identityPublicKey: wasmToBuffer(identityKeyPair.publicKey.serialize()).toString('base64'),
    signedPreKeyId,
    signedPreKeyPublicKey: wasmToBuffer(signedPreKeyPublic.serialize()).toString('base64'),
    signedPreKeySignature: wasmToBuffer(signature).toString('base64'),
    oneTimePreKeys: oneTimePreKeysBundle,
    kyberPreKeyId,
    kyberPreKeyPublicKey: wasmToBuffer(kyberPublic.serialize()).toString('base64'),
    kyberPreKeySignature: wasmToBuffer(kyberSignature).toString('base64'),
  };
}
