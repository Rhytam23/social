import {
  ProtocolAddress,
  signalEncrypt,
  signalDecrypt,
  signalDecryptPreKey,
  PreKeySignalMessage,
  SignalMessage,
  CiphertextMessageType,
} from '@signalapp/libsignal-client';
import { SignalKeyStore } from '../storage/keyStorage';

function wasmToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

export interface EncryptedMessagePayload {
  ciphertext: string; // Base64 encoded payload
  nonce: string; // Base64 encoded message type & metadata
  encryptionVersion: number;
}

export async function encrypt1to1Message(
  plaintext: string,
  localAddress: ProtocolAddress,
  remoteAddress: ProtocolAddress,
  store: SignalKeyStore
): Promise<EncryptedMessagePayload> {
  const plaintextBuffer = Buffer.from(plaintext, 'utf-8');
  const ciphertextMessage = await signalEncrypt(
    plaintextBuffer,
    remoteAddress,
    localAddress,
    store,
    store
  );

  const serializedCiphertext = wasmToBuffer(ciphertextMessage.serialize()).toString('base64');
  const messageType = ciphertextMessage.type();

  const metadataJson = JSON.stringify({
    type: messageType,
    senderDevice: localAddress.deviceId(),
  });

  return {
    ciphertext: serializedCiphertext,
    nonce: Buffer.from(metadataJson, 'utf-8').toString('base64'),
    encryptionVersion: 1,
  };
}

export async function decrypt1to1Message(
  payload: EncryptedMessagePayload,
  localAddress: ProtocolAddress,
  remoteAddress: ProtocolAddress,
  store: SignalKeyStore
): Promise<string> {
  const ciphertextBuffer = Buffer.from(payload.ciphertext, 'base64');
  const metadataJson = Buffer.from(payload.nonce, 'base64').toString('utf-8');
  const metadata = JSON.parse(metadataJson);

  let decryptedBuffer: Buffer;

  if (metadata.type === CiphertextMessageType.PreKey) {
    const preKeyMsg = PreKeySignalMessage.deserialize(ciphertextBuffer);
    decryptedBuffer = Buffer.from(
      await signalDecryptPreKey(
        preKeyMsg,
        remoteAddress,
        localAddress,
        store,
        store,
        store,
        store,
        store
      )
    );
  } else if (metadata.type === CiphertextMessageType.Whisper) {
    const signalMsg = SignalMessage.deserialize(ciphertextBuffer);
    decryptedBuffer = Buffer.from(
      await signalDecrypt(
        signalMsg,
        remoteAddress,
        localAddress,
        store,
        store
      )
    );
  } else {
    throw new Error(`Unsupported Signal message type: ${metadata.type}`);
  }

  return Buffer.from(decryptedBuffer).toString('utf-8');
}
