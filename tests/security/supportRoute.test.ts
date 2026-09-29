import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: { user: { id: string; email: string } | null; rpcError: { message: string } | null; calls: Array<Record<string, unknown>> } = { user: null, rpcError: null, calls: [] };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: null }) } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (_fn: string, args: Record<string, unknown>) => {
      state.calls.push(args);
      return state.rpcError ? { data: null, error: state.rpcError } : { data: 'new-id', error: null };
    },
  }),
}));

import { POST } from '../../app/api/support/route';

let n = 0;
const send = (body: unknown, headers: Record<string, string> = {}, raw?: string) =>
  POST(new NextRequest(new Request('http://localhost:3000/api/support', { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': `203.0.113.${++n % 250}`, ...headers }, body: raw ?? JSON.stringify(body) })));

const good = { topic: 'question', name: 'Pat', email: 'pat@example.com', message: 'How do I link my phone to my account?', website: '' };

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  Object.assign(state, { user: null, rpcError: null, calls: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/support', () => {
  it('accepts a message without an account and stores it through the server function', async () => {
    const res = await send(good);
    expect(res.status).toBe(201);
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0]).toMatchObject({ p_user_id: null, p_email: 'pat@example.com', p_topic: 'question', p_name: 'Pat' });
  });

  it('a signed-in person is identified by the session, whatever the body says', async () => {
    state.user = { id: 'aaaaaaaa-0000-4000-8000-000000000051', email: 'real@example.com' };
    const res = await send({ ...good, email: 'someone-else@example.com' });
    expect(res.status).toBe(201);
    expect(state.calls[0]).toMatchObject({ p_user_id: 'aaaaaaaa-0000-4000-8000-000000000051', p_email: 'real@example.com' });
  });

  it('a filled honeypot looks like success but stores nothing', async () => {
    const res = await send({ ...good, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(state.calls).toHaveLength(0);
  });

  it('refuses other sites, oversized and malformed bodies', async () => {
    expect((await send(good, { origin: 'https://evil.example', host: 'localhost:3000' })).status).toBe(403);
    expect((await send(null, {}, JSON.stringify({ ...good, message: 'x'.repeat(9000) }))).status).toBe(413);
    expect((await send(null, {}, 'not json')).status).toBe(400);
    expect((await send(null, {}, '[1,2]')).status).toBe(400);
  });

  it('validates topic, message length and email', async () => {
    for (const bad of [
      { ...good, topic: 'spam' },
      { ...good, message: 'short' },
      { ...good, message: 'x'.repeat(2001) },
      { ...good, email: 'not-an-email' },
      { ...good, email: 'a@b' },
      { ...good, email: 'a b@example.com' },
      { ...good, email: 'x@example.com\r\nBcc: victim@example.com' },
      { ...good, email: `${'a'.repeat(250)}@example.com` },
    ]) {
      expect((await send(bad)).status, JSON.stringify(bad).slice(0, 80)).toBe(400);
    }
    expect(state.calls).toHaveLength(0);
  });

  it('strips control characters from the message and name', async () => {
    await send({ ...good, name: `Pat${String.fromCharCode(0, 7)}`, message: `Hello${String.fromCharCode(0)} there, this is my message.` });
    expect(state.calls[0].p_name).toBe('Pat');
    expect(state.calls[0].p_message).toBe('Hello there, this is my message.');
  });

  it('limits how many messages one address can send', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 8; i++) codes.push((await send(good, { 'x-real-ip': '198.51.100.77' })).status);
    expect(codes.filter((c) => c === 201)).toHaveLength(5);
    expect(codes.slice(5).every((c) => c === 429)).toBe(true);
  });

  it('tells a person who wrote too many times today, without database detail', async () => {
    state.rpcError = { message: 'too_many_requests' };
    const res = await send(good);
    expect(res.status).toBe(429);
    state.rpcError = { message: 'constraint detail secret internals' };
    const failed = await send(good);
    expect(failed.status).toBe(500);
    expect(JSON.stringify(await failed.json())).not.toContain('secret internals');
  });

  it('is unavailable, with a way out, when the server key is missing', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await send(good);
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/email us/i);
  });
});
