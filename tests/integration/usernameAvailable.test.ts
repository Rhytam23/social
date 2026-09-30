import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: { me: string; taken: string[]; rpcCalls: string[][] } = { me: 'me', taken: [], rpcCalls: [] };

/** The real filtering is tested on Postgres (tests/security/uniqueIdentity.test.ts); here only the route around it. */
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (fn: string, args: { p_candidates: string[] }) => {
      if (fn !== 'available_usernames') return { data: null, error: { message: 'unknown' } };
      state.rpcCalls.push(args.p_candidates);
      return { data: args.p_candidates.filter((c) => !state.taken.includes(c.toLowerCase())), error: null };
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.me ? { id: state.me } : null }, error: null }) },
  }),
}));

import { GET } from '../../app/api/users/username-available/route';

let call = 0;
const get = async (qs: string) => {
  const req = new NextRequest(new Request(`http://localhost:3000/api/users/username-available${qs}`, { headers: { 'x-forwarded-for': `10.1.0.${++call}` } }));
  const res = await GET(req);
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');
  state.me = `user-${Math.random().toString(36).slice(2)}`;
  state.taken = ['alice'];
  state.rpcCalls = [];
});

describe('GET /api/users/username-available', () => {
  it('requires a signed-in user', async () => {
    state.me = '';
    expect((await get('?u=bob_1')).status).toBe(401);
  });

  it('says a free name is available', async () => {
    const { status, body } = await get('?u=bob_1');
    expect(status).toBe(200);
    expect(body).toEqual({ available: true, suggestions: [] });
  });

  it('says a taken name is unavailable, in any letter case, and offers free alternatives', async () => {
    const { body } = await get('?u=ALICE');
    expect(body.available).toBe(false);
    expect(body.suggestions.length).toBeGreaterThan(0);
    expect(body.suggestions.length).toBeLessThanOrEqual(3);
    expect(body.suggestions).not.toContain('alice');
  });

  it('accepts a leading @ and never reveals who owns a name', async () => {
    const { body } = await get('?u=%40alice');
    expect(body.available).toBe(false);
    expect(Object.keys(body).sort()).toEqual(['available', 'suggestions']);
  });

  it.each(['', 'ab', 'has space', 'semi;colon', "x'or'1", '../etc', 'a'.repeat(31), 'emoji😀name'])('rejects the invalid name %j before touching the database', async (u) => {
    const { status } = await get(`?u=${encodeURIComponent(u)}`);
    expect(status).toBe(400);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it('limits how often one account can check', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 35; i++) statuses.push((await get('?u=bob_1')).status);
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(30).every((s) => s === 429)).toBe(true);
  });

  it('is unavailable (not open) when the server key is missing', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect((await get('?u=bob_1')).status).toBe(503);
  });
});
