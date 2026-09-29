import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: { user: string | null; rpcError: { message: string } | null; calls: Array<Record<string, unknown>> } = { user: null, rpcError: null, calls: [] };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (_fn: string, args: Record<string, unknown>) => {
      state.calls.push(args);
      return { error: state.rpcError };
    },
  }),
}));

import { POST } from '../../app/api/session/seen/route';

const U = 'aaaaaaaa-0000-4000-8000-000000000071';
let n = 0;
const seen = (headers: Record<string, string> = {}) =>
  POST(new NextRequest(new Request('http://localhost:3000/api/session/seen', { method: 'POST', headers: { 'x-real-ip': `192.0.2.${++n % 250}`, ...headers } })));

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  Object.assign(state, { user: null, rpcError: null, calls: [] });
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/session/seen', () => {
  it('needs a session', async () => {
    expect((await seen()).status).toBe(401);
  });

  it('records the address the request really came from, for the signed-in account only', async () => {
    state.user = U;
    const res = await seen({ 'x-real-ip': '203.0.113.9' });
    expect(res.status).toBe(204);
    expect(state.calls).toEqual([{ p_user: U, p_ip: '203.0.113.9' }]);
  });

  it('never trusts an address the client claims for itself', async () => {
    state.user = U;
    await seen({ 'x-real-ip': '203.0.113.10', 'x-forwarded-for': '6.6.6.6, 7.7.7.7' });
    expect(state.calls[0].p_ip).toBe('203.0.113.10');
  });

  it('records nothing when the address is unknown or malformed', async () => {
    state.user = U;
    expect((await seen({ 'x-real-ip': 'not an ip' })).status).toBe(204);
    expect(state.calls).toHaveLength(0);
  });

  it('refuses other sites', async () => {
    state.user = U;
    expect((await seen({ origin: 'https://evil.example', host: 'localhost:3000' })).status).toBe(403);
    expect(state.calls).toHaveLength(0);
  });

  it('never fails the session: a database problem still answers 204 with no body', async () => {
    state.user = U;
    state.rpcError = { message: 'function record_user_ip does not exist' };
    const res = await seen({ 'x-real-ip': '203.0.113.11' });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('does nothing without the server key', async () => {
    state.user = U;
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect((await seen({ 'x-real-ip': '203.0.113.12' })).status).toBe(204);
    expect(state.calls).toHaveLength(0);
  });

  it('limits how often one account can call it', async () => {
    state.user = U;
    const codes: number[] = [];
    for (let i = 0; i < 24; i++) codes.push((await seen({ 'x-real-ip': `198.51.100.${i + 1}` })).status);
    expect(codes.filter((c) => c === 204).length).toBeLessThanOrEqual(20);
    expect(codes).toContain(429);
  });
});
