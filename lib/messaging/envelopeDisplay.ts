import type { AttachmentItem, MessageKind } from '../../types/ui';
import type { MessageEnvelope } from './envelope';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export interface EnvelopeDisplay {
  content: string;
  /** Short text for the conversation list preview. */
  snippet: string;
  kind: MessageKind;
  attachments?: AttachmentItem[];
}

function callLabel(envelope: Extract<MessageEnvelope, { kind: 'call' }>): string {
  const type = envelope.video ? 'video call' : 'voice call';
  switch (envelope.outcome) {
    case 'missed':
      return `Missed ${type}`;
    case 'declined':
      return `Declined ${type}`;
    case 'busy':
      return `${type[0].toUpperCase()}${type.slice(1)} - busy`;
    default:
      return envelope.durationMs
        ? `${type[0].toUpperCase()}${type.slice(1)} - ${formatDuration(envelope.durationMs)}`
        : `${type[0].toUpperCase()}${type.slice(1)}`;
  }
}

/** Envelopes that carry data for other messages and never render as their own bubble. */
export function isHiddenEnvelope(envelope: MessageEnvelope | null): boolean {
  return envelope?.kind === 'poll_vote';
}

export function envelopeToDisplay(envelope: MessageEnvelope | null, decryptError?: string): EnvelopeDisplay {
  if (!envelope) {
    const content = decryptError ? `[Unable to decrypt: ${decryptError}]` : '';
    return { content, snippet: content, kind: 'text' };
  }

  switch (envelope.kind) {
    case 'text':
      return { content: envelope.text, snippet: envelope.text, kind: 'text' };

    case 'system':
      return { content: envelope.text, snippet: envelope.text, kind: 'system' };

    case 'poll': {
      const content = `Poll: ${envelope.question}`;
      return { content, snippet: content, kind: 'poll' };
    }

    case 'poll_vote':
      return { content: '', snippet: '', kind: 'poll' };

    case 'call': {
      const content = callLabel(envelope);
      return { content, snippet: content, kind: 'call' };
    }

    case 'attachment':
    case 'voice': {
      const isVoice = envelope.kind === 'voice';
      const attachment: AttachmentItem = {
        id: envelope.attachment.storagePath,
        fileName: envelope.attachment.fileName,
        fileSize: formatFileSize(envelope.attachment.size),
        mimeType: envelope.attachment.mimeType,
        isEncrypted: true,
        isVoiceNote: isVoice,
        duration: isVoice ? formatDuration(envelope.durationMs) : undefined,
        storagePath: envelope.attachment.storagePath,
        keyB64: envelope.attachment.keyB64,
        ivB64: envelope.attachment.ivB64,
      };
      const text = envelope.kind === 'attachment' ? envelope.text || '' : '';
      return {
        content: text,
        snippet: isVoice ? 'Voice message' : text || envelope.attachment.fileName || 'Attachment',
        kind: isVoice ? 'voice' : 'attachment',
        attachments: [attachment],
      };
    }

    default: {
      // Envelopes are only version-checked on parse, so a newer client can
      // send a kind this build doesn't know about.
      return {
        content: 'This message type is not supported by your app version.',
        snippet: 'Unsupported message',
        kind: 'unsupported',
      };
    }
  }
}
