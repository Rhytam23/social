import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptAttachment, decryptAttachment } from '../../crypto';
import type { AttachmentEnvelope } from './envelope';
import { createClient } from '../supabase/client';
import { UserMessageError } from '../ui/errors';
import { maxUploadBytes, uploadKindFor, uploadLimitMessage } from '../limits';

/**
 * Encrypts a file client-side (AES-256-GCM, crypto/attachments), asks the server for permission and a signed
 * upload address (POST /api/uploads/sign: membership, size per kind, rate and daily quota), sends the
 * ciphertext straight to Storage, and has the server confirm the real size (POST /api/uploads/complete).
 * The decryption key never leaves this function except inside the returned envelope, which the caller must
 * encrypt (via MessagingCrypto) before it ever touches the network again.
 */
export async function uploadEncryptedAttachment(
  conversationId: string,
  file: File
): Promise<AttachmentEnvelope> {
  const mimeType = file.type || 'application/octet-stream';
  const kind = uploadKindFor(mimeType);
  if (file.size > maxUploadBytes(kind)) throw new UserMessageError(uploadLimitMessage(kind, file.size));

  const rawBytes = await file.arrayBuffer();
  const encrypted = await encryptAttachment(rawBytes, file.name, mimeType);
  const size = encrypted.encryptedBuffer.byteLength;
  // The stored file is a little larger than the original (authentication tag): ask for the real size.
  if (size > maxUploadBytes(kind)) throw new UserMessageError(uploadLimitMessage(kind, size));

  const post = async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new UserMessageError(data.error || `Upload failed (${res.status})`);
    }
    return (await res.json()) as T;
  };

  const { path, token } = await post<{ path: string; token: string }>('/api/uploads/sign', { conversationId, kind, size });

  const { error } = await createClient()
    .storage.from('encrypted_attachments')
    .uploadToSignedUrl(path, token, new Blob([encrypted.encryptedBuffer], { type: 'application/octet-stream' }), { contentType: 'application/octet-stream' });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  await post<{ path: string; size: number }>('/api/uploads/complete', { path, kind });

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
