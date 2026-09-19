import { describe, it, expect } from 'vitest';
import { envelopeToDisplay, isHiddenEnvelope } from '../../lib/messaging/envelopeDisplay';
import type { MessageEnvelope } from '../../lib/messaging/envelope';

const attachment = {
  storagePath: 'conv/file.bin',
  keyB64: 'k',
  ivB64: 'i',
  mimeType: 'image/png',
  fileName: 'photo.png',
  size: 2048,
};

describe('envelopeToDisplay', () => {
  it('renders text', () => {
    expect(envelopeToDisplay({ v: 1, kind: 'text', text: 'hi' })).toMatchObject({ content: 'hi', snippet: 'hi', kind: 'text' });
  });

  it('shows a decrypt failure instead of throwing', () => {
    const d = envelopeToDisplay(null, 'bad key');
    expect(d.content).toBe('[Unable to decrypt: bad key]');
    expect(d.snippet).toBe(d.content);
  });

  it('uses the file name as the snippet for attachments without text', () => {
    const d = envelopeToDisplay({ v: 1, kind: 'attachment', attachment });
    expect(d.snippet).toBe('photo.png');
    expect(d.kind).toBe('attachment');
    expect(d.attachments?.[0].fileSize).toBe('2.0 KB');
  });

  it('prefers the caption over the file name', () => {
    expect(envelopeToDisplay({ v: 1, kind: 'attachment', text: 'look', attachment }).snippet).toBe('look');
  });

  it('labels voice notes and formats their duration', () => {
    const d = envelopeToDisplay({ v: 1, kind: 'voice', attachment, durationMs: 65_000 });
    expect(d.snippet).toBe('Voice message');
    expect(d.attachments?.[0].duration).toBe('1:05');
    expect(d.attachments?.[0].isVoiceNote).toBe(true);
  });

  it('renders system, poll and call envelopes as readable text', () => {
    expect(envelopeToDisplay({ v: 1, kind: 'system', text: 'Sam joined' })).toMatchObject({ content: 'Sam joined', kind: 'system' });
    expect(
      envelopeToDisplay({ v: 1, kind: 'poll', question: 'Lunch?', options: [{ id: 'a', text: 'Pizza' }], multi: false }).content
    ).toBe('Poll: Lunch?');
    const call = (outcome: 'ended' | 'missed' | 'declined' | 'busy', video: boolean, durationMs?: number): MessageEnvelope => ({
      v: 1, kind: 'call', callId: 'c1', outcome, video, durationMs,
    });
    expect(envelopeToDisplay(call('missed', false)).content).toBe('Missed voice call');
    expect(envelopeToDisplay(call('declined', true)).content).toBe('Declined video call');
    expect(envelopeToDisplay(call('busy', false)).content).toBe('Voice call - busy');
    expect(envelopeToDisplay(call('ended', true, 125_000)).content).toBe('Video call - 2:05');
    expect(envelopeToDisplay(call('ended', false)).content).toBe('Voice call');
  });

  it('does not crash on an envelope kind from a newer app version', () => {
    const future = { v: 1, kind: 'hologram', payload: {} } as unknown as MessageEnvelope;
    const d = envelopeToDisplay(future);
    expect(d.kind).toBe('unsupported');
    expect(d.content).toMatch(/not supported/i);
  });
});

describe('isHiddenEnvelope', () => {
  it('hides poll votes only', () => {
    expect(isHiddenEnvelope({ v: 1, kind: 'poll_vote', pollId: 'p', optionIds: ['a'] })).toBe(true);
    expect(isHiddenEnvelope({ v: 1, kind: 'text', text: 'x' })).toBe(false);
    expect(isHiddenEnvelope(null)).toBe(false);
  });
});
