import {
  ProtocolAddress,
  SenderKeyDistributionMessage,
  groupEncrypt,
  groupDecrypt,
  processSenderKeyDistributionMessage,
} from '@signalapp/libsignal-client';
import { SignalKeyStore } from '../storage/keyStorage';
import { encrypt1to1Message } from '../messages/messageEncryptor';

function wasmToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

export interface GroupKeyEnvelopePayload {
  conversationId: string;
  recipientUserId: string;
  recipientDeviceId: string;
  distributionId: string;
  keyVersion: number;
  encryptedDistributionMessage: string; // Base64 1-to-1 encrypted SenderKeyDistributionMessage
}

export interface EncryptedGroupMessagePayload {
  conversationId: string;
  distributionId: string;
  keyVersion: number;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
}

export async function createGroupSenderKey(
  senderAddress: ProtocolAddress,
  distributionId: string,
  store: SignalKeyStore
): Promise<string> {
  const distributionMessage = await SenderKeyDistributionMessage.create(
    senderAddress,
    distributionId,
    store
  );

  return wasmToBuffer(distributionMessage.serialize()).toString('base64');
}

export async function processReceivedGroupSenderKey(
  senderAddress: ProtocolAddress,
  distributionMessageB64: string,
  store: SignalKeyStore
): Promise<void> {
  const messageBytes = Buffer.from(distributionMessageB64, 'base64');
  const distMsg = SenderKeyDistributionMessage.deserialize(messageBytes);
  await processSenderKeyDistributionMessage(senderAddress, distMsg, store);
}

export async function rotateGroupKeysForMembers(
  conversationId: string,
  newDistributionId: string,
  newKeyVersion: number,
  senderAddress: ProtocolAddress,
  activeMembers: Array<{ userId: string; deviceId: string; address: ProtocolAddress }>,
  store: SignalKeyStore
): Promise<GroupKeyEnvelopePayload[]> {
  const rawDistB64 = await createGroupSenderKey(senderAddress, newDistributionId, store);
  const envelopes: GroupKeyEnvelopePayload[] = [];

  for (const member of activeMembers) {
    if (member.address.toString() === senderAddress.toString()) {
      continue;
    }

    const encryptedPayload = await encrypt1to1Message(
      rawDistB64,
      senderAddress,
      member.address,
      store
    );

    envelopes.push({
      conversationId,
      recipientUserId: member.userId,
      recipientDeviceId: member.deviceId,
      distributionId: newDistributionId,
      keyVersion: newKeyVersion,
      encryptedDistributionMessage: JSON.stringify(encryptedPayload),
    });
  }

  return envelopes;
}

export async function encryptGroupMessage(
  plaintext: string,
  senderAddress: ProtocolAddress,
  distributionId: string,
  keyVersion: number,
  store: SignalKeyStore
): Promise<EncryptedGroupMessagePayload> {
  const plaintextBuffer = Buffer.from(plaintext, 'utf-8');
  const ciphertextMessage = await groupEncrypt(
    senderAddress,
    distributionId,
    store,
    plaintextBuffer
  );

  const serialized = wasmToBuffer(ciphertextMessage.serialize()).toString('base64');

  return {
    conversationId: distributionId,
    distributionId,
    keyVersion,
    ciphertext: serialized,
    nonce: Buffer.from(JSON.stringify({ distributionId, keyVersion }), 'utf-8').toString('base64'),
    encryptionVersion: 1,
  };
}

export async function decryptGroupMessage(
  payload: EncryptedGroupMessagePayload,
  senderAddress: ProtocolAddress,
  store: SignalKeyStore
): Promise<string> {
  const ciphertextBuffer = Buffer.from(payload.ciphertext, 'base64');

  const decryptedBuffer = await groupDecrypt(
    senderAddress,
    store,
    ciphertextBuffer
  );

  return Buffer.from(decryptedBuffer).toString('utf-8');
}
