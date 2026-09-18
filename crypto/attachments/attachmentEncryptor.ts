export interface EncryptedAttachmentResult {
  encryptedBuffer: ArrayBuffer;
  attachmentKeyB64: string;
  ivB64: string;
  originalName: string;
  mimeType: string;
}

function toUint8Array(buf: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (buf instanceof Uint8Array) {
    return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
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
    attachmentKeyB64: Buffer.from(attachmentKeyBytes).toString('base64'),
    ivB64: Buffer.from(ivBytes).toString('base64'),
    originalName: fileName,
    mimeType,
  };
}

export async function decryptAttachment(
  encryptedBuffer: ArrayBuffer | Uint8Array,
  attachmentKeyB64: string,
  ivB64: string
): Promise<ArrayBuffer> {
  const keyBuf = Buffer.from(attachmentKeyB64, 'base64');
  const ivBuf = Buffer.from(ivB64, 'base64');

  const attachmentKeyBytes = toUint8Array(keyBuf);
  const ivBytes = toUint8Array(ivBuf);
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
