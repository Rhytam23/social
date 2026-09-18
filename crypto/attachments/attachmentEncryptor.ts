import { bytesToBase64, base64ToBytes } from '../utils/encoding';

export interface EncryptedAttachmentResult {
  encryptedBuffer: ArrayBuffer;
  attachmentKeyB64: string;
  ivB64: string;
  originalName: string;
  mimeType: string;
}

function toUint8Array(buf: ArrayBuffer | Uint8Array): Uint8Array {
  if (buf instanceof Uint8Array) {
    return buf;
  }
  return new Uint8Array(buf);
}

export async function encryptAttachment(
  fileBuffer: ArrayBuffer | Uint8Array,
  fileName: string,
  mimeType: string
): Promise<EncryptedAttachmentResult> {
  const attachmentKeyBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const ivBytes = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    attachmentKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const dataBytes = toUint8Array(fileBuffer);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
    cryptoKey,
    dataBytes as unknown as BufferSource
  );

  return {
    encryptedBuffer,
    attachmentKeyB64: bytesToBase64(attachmentKeyBytes),
    ivB64: bytesToBase64(ivBytes),
    originalName: fileName,
    mimeType,
  };
}

export async function decryptAttachment(
  encryptedBuffer: ArrayBuffer | Uint8Array,
  attachmentKeyB64: string,
  ivB64: string
): Promise<ArrayBuffer> {
  const attachmentKeyBytes = base64ToBytes(attachmentKeyB64);
  const ivBytes = base64ToBytes(ivB64);
  const dataBytes = toUint8Array(encryptedBuffer);

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    attachmentKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  return await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
    cryptoKey,
    dataBytes as unknown as BufferSource
  );
}
