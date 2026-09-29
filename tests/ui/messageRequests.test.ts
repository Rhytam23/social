import { describe, it, expect, vi } from 'vitest';
import { MESSAGE_REQUEST_LIMIT, MESSAGE_REQUEST_NOTICE, isMessageRequestLimit } from '../../lib/messaging/messageRequests';
import { lookupUsernameRemote } from '../../lib/people/lookup';

describe('message requests', () => {
  it('recognises the database error', () => {
    expect(isMessageRequestLimit({ message: 'message_request_limit' })).toBe(true);
    expect(isMessageRequestLimit(new Error('P0001: message_request_limit'))).toBe(true);
    expect(isMessageRequestLimit({ message: 'rate_limit_exceeded' })).toBe(false);
    expect(isMessageRequestLimit(null)).toBe(false);
  });

  it('the notice names the limit that migration 026 enforces', () => {
    expect(MESSAGE_REQUEST_NOTICE).toContain(String(MESSAGE_REQUEST_LIMIT));
    expect(MESSAGE_REQUEST_LIMIT).toBe(3);
  });
});

describe('lookupUsernameRemote (start-of-username search)', () => {
  const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it('returns every match with its blocked flag', async () => {
    const out = await lookupUsernameRemote(
      '@ars',
      respond(200, { users: [{ id: '1', username: 'arsh', display_name: 'Arsh', blocked: false }, { id: '2', username: 'arsalan', display_name: 'Arsalan', blocked: true }] })
    );
    expect(out.status).toBe('found');
    if (out.status !== 'found') return;
    expect(out.matches.map((m) => m.user.username)).toEqual(['arsh', 'arsalan']);
    expect(out.matches.map((m) => m.blocked)).toEqual([false, true]);
  });

  it('says none when nothing starts with it', async () => {
    expect((await lookupUsernameRemote('zzz', respond(200, { users: [] }))).status).toBe('none');
  });

  it('does not call the server for fewer than 3 characters', async () => {
    const f = respond(200, { users: [] });
    expect((await lookupUsernameRemote('ar', f)).status).toBe('invalid');
    expect(f).not.toHaveBeenCalled();
  });

  it('turns a rate limit into a plain message', async () => {
    const out = await lookupUsernameRemote('ars', respond(429, {}));
    expect(out.status).toBe('error');
  });
});
