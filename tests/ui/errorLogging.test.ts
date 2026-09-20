import { describe, it, expect, beforeEach } from 'vitest';
import { scrubPath, scrubText, normalizeForFingerprint } from '../../lib/logging/scrub';
import { fingerprintOf } from '../../lib/logging/errorLog';
import { ClientLogger } from '../../lib/logging/clientLogger';
import { UserMessageError, setErrorReporter, setErrorViewer, userError } from '../../lib/ui/errors';
import { describeErrorRow, filterErrorRows, type ErrorLogRow } from '../../lib/logging/errorRows';

describe('scrubbing before anything is stored', () => {
  it('removes login tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop';
    expect(scrubText(`failed with ${jwt}`, 500)).toBe('failed with [token]');
    expect(scrubText('Authorization: Bearer abc.def-123_xyz', 500)).not.toMatch(/abc\.def/);
  });

  it('removes email addresses, including ones quoted in database detail', () => {
    const s = scrubText('Key (email)=(alex@example.com) already exists', 500);
    expect(s).not.toContain('alex@example.com');
    expect(s).toContain('[email]');
  });

  it('removes passwords, keys and long encoded values', () => {
    expect(scrubText('password=hunter2 and secret: abc', 500)).not.toMatch(/hunter2|abc/);
    expect(scrubText(`key ${'A'.repeat(64)}`, 500)).toBe('key [redacted]');
    expect(scrubText(`hash ${'0123456789abcdef'.repeat(4)}`, 500)).toBe('hash [redacted]');
  });

  it('removes URL query strings but keeps the address', () => {
    expect(scrubText('GET https://x.supabase.co/rest/v1/profiles?select=email&token=zzz failed', 500)).toBe('GET https://x.supabase.co/rest/v1/profiles?[query] failed');
    expect(scrubPath('/chat?invite=SECRET#frag')).toBe('/chat');
  });

  it('keeps ordinary ids and file paths readable', () => {
    const s = scrubText('conversation 3f2b8c1e-1111-4222-8333-444455556666 in /_next/static/chunks/app/page.js', 500);
    expect(s).toContain('3f2b8c1e-1111-4222-8333-444455556666');
    expect(s).toContain('/_next/static/chunks/app/page.js');
  });

  it('strips control characters and caps length', () => {
    expect(scrubText('a' + String.fromCharCode(0) + 'b' + String.fromCharCode(7) + 'c', 50)).toBe('a b c');
    expect(scrubText('word '.repeat(300), 100).length).toBe(101);
    expect(scrubText(null, 10)).toBe('');
  });
});

describe('grouping the same error', () => {
  it('ignores ids and numbers when comparing', () => {
    expect(normalizeForFingerprint('Timeout after 5000ms for 3f2b8c1e-1111-4222-8333-444455556666')).toBe(
      normalizeForFingerprint('Timeout after 30000ms for aaaaaaaa-1111-4222-8333-444455556666')
    );
  });

  it('gives the same fingerprint for the same problem and different ones otherwise', async () => {
    const a = await fingerprintOf('server', 'api.x', 'Failed for row 12');
    expect(a).toBe(await fingerprintOf('server', 'api.x', 'Failed for row 99'));
    expect(a).not.toBe(await fingerprintOf('client', 'api.x', 'Failed for row 12'));
    expect(a).not.toBe(await fingerprintOf('server', 'api.y', 'Failed for row 12'));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('the browser logger', () => {
  let t = 0;
  let sent: Array<Record<string, unknown>> = [];
  const make = () =>
    new ClientLogger({ send: (b) => sent.push(b), now: () => t, path: () => '/chat' });

  beforeEach(() => {
    t = 1_000_000;
    sent = [];
  });

  it('sends the message, the top of the stack and the page', () => {
    make().report('ui: Could not send', new Error('boom'));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ area: 'ui: Could not send', message: 'boom', level: 'error', path: '/chat' });
    expect(String(sent[0].detail)).toContain('boom');
  });

  it('sends the same error only once a minute', () => {
    const l = make();
    expect(l.report('a', new Error('same'))).toBe(true);
    expect(l.report('a', new Error('same'))).toBe(false);
    t += 61_000;
    expect(l.report('a', new Error('same'))).toBe(true);
  });

  it('sends at most 10 different errors a minute', () => {
    const l = make();
    for (let i = 0; i < 25; i++) l.report('a', new Error(`different ${i}`));
    expect(sent).toHaveLength(10);
    t += 61_000;
    expect(l.report('a', new Error('after the minute'))).toBe(true);
  });

  it('ignores things that carry no message', () => {
    expect(make().report('a', undefined)).toBe(false);
    expect(make().report('a', 42)).toBe(false);
  });
});

describe('every handled error reaches the reporter, except messages written for people', () => {
  const seen: Array<[unknown, string]> = [];
  beforeEach(() => {
    seen.length = 0;
    setErrorViewer(false);
    setErrorReporter((err, friendly) => seen.push([err, friendly]));
  });

  it('reports a technical failure and still shows only the friendly text', () => {
    const err = new Error('relation "communities" does not exist');
    expect(userError(err, 'Could not load.')).toBe('Could not load.');
    expect(seen).toEqual([[err, 'Could not load.']]);
  });

  it('does not report a UserMessageError', () => {
    userError(new UserMessageError('Use 4 to 8 digits'), 'x');
    expect(seen).toHaveLength(0);
  });

  it('keeps working if the reporter throws', () => {
    setErrorReporter(() => {
      throw new Error('reporter down');
    });
    expect(userError(new Error('x'), 'Friendly.')).toBe('Friendly.');
  });

  it('stops reporting once cleared', () => {
    setErrorReporter(null);
    userError(new Error('x'), 'Friendly.');
    expect(seen).toHaveLength(0);
  });
});

describe('the admin error list', () => {
  const row = (over: Partial<ErrorLogRow>): ErrorLogRow => ({
    id: 'r', level: 'error', source: 'server', area: 'api.messages.send', message: 'boom', detail: null, user_id: null, path: null,
    user_agent: null, release: null, status: 'open', occurrences: 1, first_seen_at: '2026-09-20T10:00:00Z', last_seen_at: '2026-09-20T11:00:00Z',
    resolved_by: null, resolved_at: null, ...over,
  });
  const rows = [
    row({ id: '1' }),
    row({ id: '2', status: 'resolved', area: 'api.uploads.store', message: 'storage full' }),
    row({ id: '3', source: 'client', area: 'ui: Could not save your profile', message: 'bio missing (migration 011)' }),
  ];

  it('filters by status and by where it happened', () => {
    expect(filterErrorRows(rows, 'open', 'all', '').map((r) => r.id)).toEqual(['1', '3']);
    expect(filterErrorRows(rows, 'resolved', 'all', '').map((r) => r.id)).toEqual(['2']);
    expect(filterErrorRows(rows, 'all', 'client', '').map((r) => r.id)).toEqual(['3']);
  });

  it('searches area, message and path, ignoring case', () => {
    expect(filterErrorRows(rows, 'all', 'all', 'STORAGE').map((r) => r.id)).toEqual(['2']);
    expect(filterErrorRows(rows, 'all', 'all', 'migration 011').map((r) => r.id)).toEqual(['3']);
    expect(filterErrorRows(rows, 'all', 'all', 'nothing like this')).toEqual([]);
  });

  it('produces plain text an admin can paste', () => {
    const text = describeErrorRow(row({ occurrences: 4, path: '/chat', detail: 'at foo' }), 'Alex (1234abcd)');
    expect(text).toContain('SERVER ERROR  api.messages.send');
    expect(text).toContain('Seen 4x');
    expect(text).toContain('Affected: Alex (1234abcd)');
    expect(text).toContain('at foo');
  });
});
