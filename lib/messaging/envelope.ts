export interface AttachmentEnvelope {
  storagePath: string;
  keyB64: string;
  ivB64: string;
  mimeType: string;
  fileName: string;
  size: number;
}

interface PollOptionEnvelope {
  id: string;
  text: string;
}

export type CallOutcome = 'ended' | 'missed' | 'declined' | 'busy';

export type MessageEnvelope =
  | { v: 1; kind: 'text'; text: string; mentions?: string[] }
  | { v: 1; kind: 'attachment'; text?: string; attachment: AttachmentEnvelope }
  | { v: 1; kind: 'voice'; attachment: AttachmentEnvelope; durationMs: number }
  | { v: 1; kind: 'system'; text: string }
  | { v: 1; kind: 'poll'; question: string; options: PollOptionEnvelope[]; multi: boolean; closesAt?: string }
  | { v: 1; kind: 'poll_vote'; pollId: string; optionIds: string[] }
  | { v: 1; kind: 'call'; callId: string; outcome: CallOutcome; video: boolean; durationMs?: number }
  /** Call signalling. Encrypted like a message but sent over a live channel and never stored. */
  | { v: 1; kind: 'call_signal'; callId: string; signal: 'offer' | 'answer' | 'ice' | 'hangup' | 'decline' | 'busy'; video: boolean; sdp?: string; candidate?: RTCIceCandidateInit };

/**
 * Everything about a message - including that it has an attachment at all,
 * its file name, and its type - lives inside the encrypted envelope. Only
 * `ciphertext`/`nonce`/`encryption_version` are ever written to `messages`
 * (see docs/SECURITY.md, "Rules for contributors"): no attachment metadata table exists or
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
