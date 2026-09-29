import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * The browser error ingest route and the server error logging: who may send, what is accepted, what
 * is stored, and that nothing sensitive reaches the client.
 */

const state: { user: string | null } = { user: null };
const written: Array<Record<string, unknown>> = [];

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: state.user ? null : { message: 'no session' } }) },
  }),
}));
vi.mock('@/lib/logging/errorLog', () => ({
  writeErrorLog: async (entry: Record<string, unknown>) => {
    written.push(entry);
  },
}));

import { POST } from '../../app/api/logs/client/route';
import { serverError } from '../../lib/api/security';

let n = 100;
const post = (body: unknown, headers: Record<string, string> = {}, raw?: string) =>
  new NextRequest(
    new Request('http://localhost:3000/api/logs/client', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': `198.51.100.${++n % 250}`, 'user-agent': 'TestBrowser/1.0', ...headers },
      body: raw ?? JSON.stringify(body),
    })
  );

let userCounter = 0;
const freshUser = () => `dddddddd-0000-4000-8000-${String(++userCounter).padStart(12, '0')}`;

beforeEach(() => {
  written.length = 0;
  state.user = null;
});

describe('POST /api/logs/client', () => {
  it('refuses people who are not signed in', async () => {
    const r = await POST(post({ area: 'ui', message: 'x' }));
    expect(r.status).toBe(401);
    expect(written).toHaveLength(0);
  });

  it('refuses cross-site requests before doing anything', async () => {
    state.user = freshUser();
    const r = await POST(post({ area: 'ui', message: 'x' }, { origin: 'https://evil.example' }));
    expect(r.status).toBe(403);
    expect(written).toHaveLength(0);
  });

  it('refuses oversized bodies', async () => {
    state.user = freshUser();
    const r = await POST(post({ area: 'ui', message: 'x'.repeat(20000) }));
    expect(r.status).toBe(413);
    expect(written).toHaveLength(0);
  });

  it.each([
    ['no message', { area: 'ui' }],
    ['no area', { message: 'x' }],
    ['message of the wrong type', { area: 'ui', message: { a: 1 } }],
    ['unknown level', { area: 'ui', message: 'x', level: 'fatal' }],
    ['detail of the wrong type', { area: 'ui', message: 'x', detail: 42 }],
    ['path too long', { area: 'ui', message: 'x', path: 'p'.repeat(400) }],
  ])('rejects malformed input: %s', async (_name, body) => {
    state.user = freshUser();
    const r = await POST(post(body));
    expect(r.status).toBe(400);
    expect(written).toHaveLength(0);
  });

  it('rejects a body that is not a JSON object', async () => {
    state.user = freshUser();
    expect((await POST(post(null, {}, '[1,2,3]'))).status).toBe(400);
    expect((await POST(post(null, {}, 'not json'))).status).toBe(400);
  });

  it('stores a valid report against the signed-in user, ignoring any identity or source in the body', async () => {
    const me = freshUser();
    state.user = me;
    const r = await POST(post({ area: 'ui: Could not send', message: 'boom', detail: 'stack', level: 'warn', path: '/chat', userId: 'someone-else', source: 'server' }));
    expect(r.status).toBe(202);
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ source: 'client', level: 'warn', area: 'ui: Could not send', message: 'boom', userId: me, path: '/chat', userAgent: 'TestBrowser/1.0' });
  });

  it('limits how many reports one account can send', async () => {
    state.user = freshUser();
    let limited = 0;
    for (let i = 0; i < 30; i++) {
      const r = await POST(post({ area: 'ui', message: `m${i}` }));
      if (r.status === 429) limited++;
    }
    expect(limited).toBeGreaterThan(0);
    expect(written.length).toBeLessThanOrEqual(20);
  });
});

describe('server errors', () => {
  it('are logged for admins with the user, and the client only gets a generic message', async () => {
    const res = serverError('messages.insert', new Error('duplicate key value violates unique constraint "messages_pkey"'), 500, undefined, 'user-1');
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain('Something went wrong');
    expect(text).not.toMatch(/duplicate key|messages_pkey/);

    await Promise.resolve();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ source: 'server', area: 'messages.insert', userId: 'user-1' });
    expect(String(written[0].message)).toContain('duplicate key');
  });
});
