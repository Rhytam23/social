import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const state: { user: string | null; isAdmin: boolean; audited: Array<unknown[]> } = { user: null, isAdmin: false, audited: [] };

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) },
    rpc: async () => ({ data: state.isAdmin, error: null }),
    from: (table: string) => {
      const q: Record<string, unknown> = {
        insert: () => q,
        select: () => q,
        single: async () => ({ data: { id: 'conv-1', type: 'private', name: null, created_at: 't' }, error: null }),
        then: (resolve: (v: unknown) => unknown) => resolve({ error: null, data: table === 'conversation_members' ? [] : null }),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/logging/errorLog', () => ({
  writeAdminAction: async (...args: unknown[]) => void state.audited.push(args),
}));

import { POST } from '../../app/api/conversations/route';

const ME = 'aaaaaaaa-0000-4000-8000-000000000061';
const YOU = 'aaaaaaaa-0000-4000-8000-000000000062';
let n = 0;
const create = (body: unknown) =>
  POST(new NextRequest(new Request('http://localhost:3000/api/conversations', { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': `198.18.0.${++n % 250}` }, body: JSON.stringify(body) })));

beforeEach(() => Object.assign(state, { user: ME, isAdmin: false, audited: [] }));

describe('admin-started chats are audited', () => {
  it('a platform admin starting a direct chat is written to the activity log', async () => {
    state.isAdmin = true;
    const res = await create({ type: 'private', participantIds: [YOU] });
    expect(res.status).toBe(201);
    expect(state.audited).toEqual([[ME, 'admin_start_chat', 'user', YOU, undefined]]);
  });

  it('an ordinary person starting a chat is not', async () => {
    const res = await create({ type: 'private', participantIds: [YOU] });
    expect(res.status).toBe(201);
    expect(state.audited).toHaveLength(0);
  });

  it('a group created by an admin is not logged as a chat with one person', async () => {
    state.isAdmin = true;
    const res = await create({ type: 'group', name: 'team', participantIds: [YOU] });
    expect(res.status).toBe(201);
    expect(state.audited).toHaveLength(0);
  });
});
