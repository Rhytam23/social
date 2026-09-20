import { describe, it, expect } from 'vitest';
import { SUPPORT_TOPICS, filterSupportRows, isSupportTopic, replyHref, type SupportRow } from '../../lib/support';

const row = (over: Partial<SupportRow> = {}): SupportRow => ({
  id: '1',
  user_id: null,
  name: 'Pat',
  email: 'pat@example.com',
  topic: 'question',
  message: 'How do I link my phone?',
  context: null,
  status: 'open',
  created_at: '2026-09-20T10:00:00Z',
  ...over,
});

describe('support helpers', () => {
  it('knows the topics', () => {
    for (const t of SUPPORT_TOPICS) expect(isSupportTopic(t)).toBe(true);
    expect(isSupportTopic('spam')).toBe(false);
    expect(isSupportTopic(undefined)).toBe(false);
  });

  it('filters by status and searches name, email and message', () => {
    const rows = [row(), row({ id: '2', status: 'resolved', email: 'kim@example.com', name: null, message: 'Calls do not connect' })];
    expect(filterSupportRows(rows, 'open', '')).toHaveLength(1);
    expect(filterSupportRows(rows, 'resolved', '')).toHaveLength(1);
    expect(filterSupportRows(rows, 'all', '')).toHaveLength(2);
    expect(filterSupportRows(rows, 'all', 'CALLS')).toHaveLength(1);
    expect(filterSupportRows(rows, 'all', 'pat@')).toHaveLength(1);
    expect(filterSupportRows(rows, 'all', 'nothing')).toHaveLength(0);
  });

  it('builds a reply link that can only carry the address and a fixed subject', () => {
    expect(replyHref(row())).toBe('mailto:pat@example.com?subject=Re%3A%20A%20question');
    const tricky = replyHref(row({ email: 'a@b.co?cc=evil@x.com&body=hi' }));
    expect(tricky.startsWith('mailto:a@b.co%3Fcc%3Devil@x.com%26body%3Dhi?subject=')).toBe(true);
    expect(tricky.split('?')).toHaveLength(2);
  });
});
