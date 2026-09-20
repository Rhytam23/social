import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: { user: string | null; memberships: Array<{ conversation_id: string }>; rpc: { data: unknown; error: { code?: string; message?: string } | null }; rpcArgs: unknown } = {
  user: null,
  memberships: [],
  rpc: { data: [], error: null },
  rpcArgs: null,
};

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) },
    from: () => {
      const q: Record<string, unknown> = {
        select: () => q,
        eq: () => q,
        is: () => q,
        limit: async () => ({ data: state.memberships, error: null }),
      };
      return q;
    },
    rpc: async (_fn: string, args: unknown) => {
      state.rpcArgs = args;
      return state.rpc;
    },
  }),
}));

import { GET } from '../../app/api/messages/latest/route';

const U = 'aaaaaaaa-0000-4000-8000-000000000031';
const C1 = 'bbbbbbbb-0000-4000-8000-000000000031';
const C2 = 'bbbbbbbb-0000-4000-8000-000000000032';
let n = 0;
const call = () => GET(new NextRequest(new Request('http://localhost:3000/api/messages/latest', { headers: { 'x-real-ip': `198.51.100.${++n % 250}` } })));

beforeEach(() => {
  state.user = null;
  state.memberships = [];
  state.rpc = { data: [], error: null };
  state.rpcArgs = null;
});

describe('GET /api/messages/latest', () => {
  it('needs a session', async () => {
    expect((await call()).status).toBe(401);
  });

  it('asks only about the caller\'s own conversations and returns only the known columns', async () => {
    state.user = U;
    state.memberships = [{ conversation_id: C1 }, { conversation_id: C2 }];
    state.rpc = { data: [{ id: 'm1', conversation_id: C1, sender_id: U, ciphertext: 'c', nonce: 'n', encryption_version: 1, created_at: 't', internal_note: 'must not leak' }], error: null };
    const res = await call();
    expect(res.status).toBe(200);
    expect(state.rpcArgs).toEqual({ p_conversation_ids: [C1, C2] });
    const body = (await res.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(body[0].ciphertext).toBe('c');
    expect(body[0]).not.toHaveProperty('internal_note');
  });

  it('returns an empty list without touching the database function when the user has no conversations', async () => {
    state.user = U;
    const res = await call();
    expect(await res.json()).toEqual([]);
    expect(state.rpcArgs).toBeNull();
  });

  it('answers 501 while migration 020 is not applied, so the client can fall back', async () => {
    state.user = U;
    state.memberships = [{ conversation_id: C1 }];
    state.rpc = { data: null, error: { code: 'PGRST202', message: 'function not found' } };
    expect((await call()).status).toBe(501);
  });

  it('keeps database error text out of the response', async () => {
    state.user = U;
    state.memberships = [{ conversation_id: C1 }];
    state.rpc = { data: null, error: { code: 'XX000', message: 'secret internal detail' } };
    const res = await call();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret internal detail');
  });
});
