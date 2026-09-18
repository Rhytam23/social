import {
  PreKeyBundle,
  PublicKey,
  KEMPublicKey,
  KEMKeyPair,
  ProtocolAddress,
  processPreKeyBundle,
} from '@signalapp/libsignal-client';
import { SignalKeyStore } from '../storage/keyStorage';

export interface RemotePreKeyBundleParams {
  registrationId: number;
  deviceId: number;
  identityPublicKeyB64: string;
  signedPreKeyId: number;
  signedPreKeyPublicKeyB64: string;
  signedPreKeySignatureB64: string;
  oneTimePreKeyId?: number;
  oneTimePreKeyPublicKeyB64?: string;
  kyberPreKeyId?: number;
  kyberPreKeyPublicKeyB64?: string;
  kyberPreKeySignatureB64?: string;
}

export async function establishOutboundSession(
  localAddress: ProtocolAddress,
  remoteAddress: ProtocolAddress,
  remoteBundleParams: RemotePreKeyBundleParams,
  store: SignalKeyStore
): Promise<void> {
  const identityKey = PublicKey.deserialize(Buffer.from(remoteBundleParams.identityPublicKeyB64, 'base64'));
  const signedPreKey = PublicKey.deserialize(Buffer.from(remoteBundleParams.signedPreKeyPublicKeyB64, 'base64'));
  const signedPreKeySignature = Buffer.from(remoteBundleParams.signedPreKeySignatureB64, 'base64');

  let oneTimePreKey: PublicKey | null = null;
  if (remoteBundleParams.oneTimePreKeyPublicKeyB64) {
    oneTimePreKey = PublicKey.deserialize(Buffer.from(remoteBundleParams.oneTimePreKeyPublicKeyB64, 'base64'));
  }

  let kyberPublicKey: KEMPublicKey;
  let kyberSignature: Uint8Array;
  if (remoteBundleParams.kyberPreKeyPublicKeyB64 && remoteBundleParams.kyberPreKeySignatureB64) {
    kyberPublicKey = KEMPublicKey.deserialize(Buffer.from(remoteBundleParams.kyberPreKeyPublicKeyB64, 'base64'));
    kyberSignature = Buffer.from(remoteBundleParams.kyberPreKeySignatureB64, 'base64');
  } else {
    const dummyKp = KEMKeyPair.generate();
    kyberPublicKey = dummyKp.getPublicKey();
    kyberSignature = new Uint8Array(64);
  }

  const bundle = PreKeyBundle.new(
    remoteBundleParams.registrationId,
    remoteBundleParams.deviceId,
    remoteBundleParams.oneTimePreKeyId ?? null,
    oneTimePreKey,
    remoteBundleParams.signedPreKeyId,
    signedPreKey,
    signedPreKeySignature,
    identityKey,
    remoteBundleParams.kyberPreKeyId ?? 0,
    kyberPublicKey,
    kyberSignature as unknown as Uint8Array<ArrayBuffer>
  );

  await processPreKeyBundle(bundle, remoteAddress, localAddress, store, store);
}
