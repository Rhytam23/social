import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { limitByIp, limitByUser, serverError } from '@/lib/api/security';

// The most conversations answered in one call. The sidebar never needs more, and it bounds the work.
const MAX_CONVERSATIONS = 200;

const COLUMNS = ['id', 'conversation_id', 'sender_id', 'ciphertext', 'nonce', 'encryption_version', 'reply_to_message_id', 'thread_root_id', 'expires_at', 'created_at', 'edited_at', 'deleted_at'] as const;

/**
 * GET /api/messages/latest
 *   The newest message (ciphertext) of every conversation the caller is an active member of, in one
 *   round trip. Replaces one request per conversation when the sidebar loads its previews.
 *   The conversation list is derived here from the caller's own memberships, never taken from the request.
 *   `501` means migration 020 is not applied yet; the client then falls back to per-conversation requests.
 */
export async function GET(request: NextRequest) {
  const limited = await limitByIp(request, 'msg-latest', { limit: 120, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const perUser = await limitByUser(user.id, 'msg-latest', { limit: 60, windowMs: 60 * 1000 });
  if (perUser) return perUser;

  const { data: memberships, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)
    .is('left_at', null)
    .limit(MAX_CONVERSATIONS);
  if (memberError) return serverError('messages.latest.members', memberError, 500, undefined, user.id);

  const ids = ((memberships as Array<{ conversation_id: string }> | null) || []).map((m) => m.conversation_id);
  if (ids.length === 0) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });

  const untyped = supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: Array<Record<string, unknown>> | null; error: { code?: string; message?: string } | null }>;
  };
  const { data, error } = await untyped.rpc('get_latest_messages', { p_conversation_ids: ids });
  if (error) {
    // 42883 / PGRST202: the function does not exist yet (migration 020 not applied).
    if (error.code === '42883' || error.code === 'PGRST202') {
      return NextResponse.json({ error: 'Not available yet.' }, { status: 501 });
    }
    return serverError('messages.latest', error, 500, undefined, user.id);
  }

  // Only the columns the client needs, in the same shape as GET /api/messages.
  const rows = (data || []).map((row) => Object.fromEntries(COLUMNS.filter((c) => c in row).map((c) => [c, row[c]])));
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
}
