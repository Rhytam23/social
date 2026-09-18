export interface AttachmentEnvelope {
  storagePath: string;
  keyB64: string;
  ivB64: string;
  mimeType: string;
  fileName: string;
  size: number;
}

export type MessageEnvelope =
  | { v: 1; kind: 'text'; text: string }
  | { v: 1; kind: 'attachment'; text?: string; attachment: AttachmentEnvelope }
  | { v: 1; kind: 'voice'; attachment: AttachmentEnvelope; durationMs: number };

/**
 * Everything about a message - including that it has an attachment at all,
 * its file name, and its type - lives inside the encrypted envelope. Only
 * `ciphertext`/`nonce`/`encryption_version` are ever written to `messages`
 * (see docs/00_MASTER_RULES.md #5): no attachment metadata table exists or
 * is needed.
 */
export function serializeEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope);
}

export function parseEnvelope(json: string): MessageEnvelope {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) {
    throw new Error('Unsupported message envelope version');
  }
  return parsed as MessageEnvelope;
}
