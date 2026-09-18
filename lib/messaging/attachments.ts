import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptAttachment, decryptAttachment } from '../../crypto';
import type { AttachmentEnvelope } from './envelope';

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/**
 * Encrypts a file client-side (AES-256-GCM, crypto/attachments) and uploads
 * the ciphertext through the existing IDOR-checked /api/uploads route. The
 * decryption key never leaves this function except inside the returned
 * envelope, which the caller must encrypt (via MessagingCrypto) before it
 * ever touches the network again.
 */
export async function uploadEncryptedAttachment(
  conversationId: string,
  file: File
): Promise<AttachmentEnvelope> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
  }

  const rawBytes = await file.arrayBuffer();
  const encrypted = await encryptAttachment(rawBytes, file.name, file.type || 'application/octet-stream');

  const formData = new FormData();
  formData.append('file', new Blob([encrypted.encryptedBuffer]), file.name);
  formData.append('conversationId', conversationId);

  const res = await fetch('/api/uploads', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }

  const { path } = (await res.json()) as { path: string };

  return {
    storagePath: path,
    keyB64: encrypted.attachmentKeyB64,
    ivB64: encrypted.ivB64,
    mimeType: encrypted.mimeType,
    fileName: encrypted.originalName,
    size: file.size,
  };
}

/** Downloads and decrypts an attachment given its storage coordinates. */
export async function downloadAndDecryptAttachment(
  supabase: SupabaseClient,
  coords: Pick<AttachmentEnvelope, 'storagePath' | 'keyB64' | 'ivB64' | 'mimeType'>
): Promise<Blob> {
  const { data, error } = await supabase.storage.from('encrypted_attachments').download(coords.storagePath);
  if (error || !data) {
    throw new Error(error?.message || 'Failed to download attachment');
  }

  const encryptedBuffer = await data.arrayBuffer();
  const decryptedBuffer = await decryptAttachment(encryptedBuffer, coords.keyB64, coords.ivB64);
  return new Blob([decryptedBuffer], { type: coords.mimeType });
}
