import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * POST /api/groups and POST /api/groups/members with migration 027: the routes never insert anyone but the creator;
 * everybody else goes through add_group_member, and the answer says who was added and who was only invited.
 */

const ME = 'aaaaaaaa-0000-4000-8000-0000000000a1';
const G = 'bbbbbbbb-0000-4000-8000-0000000000b1';
const P1 = 'cccccccc-0000-4000-8000-0000000000c1'; // known: added
const P2 = 'cccccccc-0000-4000-8000-0000000000c2'; // stranger: invited
const P3 = 'cccccccc-0000-4000-8000-0000000000c3'; // the database refuses (for example a rate limit)

const state: { inserted: Array<Record<string, unknown>>; rpcCalls: Array<Record<string, unknown>>; myRole: string | null } = { inserted: [], rpcCalls: [], myRole: 'owner' };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: ME } }, error: null }) },
    rpc: async (fn: string, args: Record<string, string>) => {
      state.rpcCalls.push({ fn, ...args });
      if (args.p_user === P1) return { data: 'added', error: null };
      if (args.p_user === P2) return { data: 'invited', error: null };
      return { data: null, error: { message: 'rate_limit_exceeded' } };
    },
    from: (table: string) => {
      const b: Record<string, unknown> = {
        insert: (row: unknown) => {
          const rows = Array.isArray(row) ? row : [row];
          for (const r of rows) state.inserted.push({ table, ...(r as Record<string, unknown>) });
          return b;
        },
        select: () => b,
        eq: () => b,
        is: () => b,
        single: async () => ({ data: { id: G, type: 'group', name: 'team', created_at: '2026-09-20T00:00:00Z' }, error: null }),
        maybeSingle: async () => (table === 'conversation_members' ? (state.myRole ? { data: { role: state.myRole }, error: null } : { data: null, error: null }) : { data: { id: G }, error: null }),
        then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      };
      return b;
    },
  }),
}));

import { POST as createGroup } from '../../app/api/groups/route';
import { POST as addMember } from '../../app/api/groups/members/route';

let n = 0;
const post = (path: string, body: unknown) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': `192.0.2.${(++n % 240) + 1}` },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  Object.assign(state, { inserted: [], rpcCalls: [], myRole: 'owner' });
});

describe('POST /api/groups', () => {
  it('seats only the creator, sends everyone else through add_group_member, and reports who was added or invited', async () => {
    const res = await createGroup(post('/api/groups', { name: 'team', memberIds: [P1, P2, P3] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ id: G, added: [P1], invited: [P2], failed: 1 });

    const memberRows = state.inserted.filter((r) => r.table === 'conversation_members');
    expect(memberRows).toHaveLength(1);
    expect(memberRows[0]).toMatchObject({ user_id: ME, role: 'owner' });
    expect(state.rpcCalls.map((c) => c.p_user)).toEqual([P1, P2, P3]);
    expect(state.rpcCalls.every((c) => c.fn === 'add_group_member' && c.p_conversation === G)).toBe(true);
  });

  it('still needs a name and at least one other person', async () => {
    expect((await createGroup(post('/api/groups', { name: '', memberIds: [P1] }))).status).toBe(400);
    expect((await createGroup(post('/api/groups', { name: 'x', memberIds: [ME] }))).status).toBe(400);
  });
});

describe('POST /api/groups/members', () => {
  it('reports "added" for someone known and "invited" for a stranger, and inserts nothing itself', async () => {
    const known = await addMember(post('/api/groups/members', { groupId: G, userId: P1 }));
    expect(known.status).toBe(201);
    expect(await known.json()).toEqual({ success: true, result: 'added' });
    const stranger = await addMember(post('/api/groups/members', { groupId: G, userId: P2 }));
    expect(await stranger.json()).toEqual({ success: true, result: 'invited' });
    expect(state.inserted.filter((r) => r.table === 'conversation_members')).toHaveLength(0);
  });

  it('turns a database refusal into a plain error', async () => {
    const res = await addMember(post('/api/groups/members', { groupId: G, userId: P3 }));
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toContain('rate_limit_exceeded');
  });

  it('a plain member is refused before the database is asked', async () => {
    state.myRole = 'member';
    expect((await addMember(post('/api/groups/members', { groupId: G, userId: P1 }))).status).toBe(403);
    expect(state.rpcCalls).toHaveLength(0);
  });
});
