import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { clientIp, serverError } from '@/lib/api/security';
import { parseUsernameQuery } from '@/lib/people/username';

/**
 * GET /api/users?username=<exact username>
 *   The only way to find someone you have not talked to yet. Matches the
 *   username exactly (case-insensitive). Display name, email, phone number and
 *   bio are never searched, and email/phone are never returned.
 *
 * GET /api/users
 *   People you already share a conversation with (platform admins get the
 *   full directory for the admin dashboard). Not a discovery feature.
 */

// Columns other people may see. bio/pronouns/timezone come from migration 011.
const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, created_at, bio, pronouns, timezone';
const BASE_COLUMNS = 'id, username, display_name, avatar_url, created_at';

type Row = { id: string; username: string | null };

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(`user-search:${clientIp(request)}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Search rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const usernameParam = request.nextUrl.searchParams.get('username');
  if (usernameParam !== null) {
    return lookupByUsername(supabase, user.id, usernameParam);
  }
  return listKnownPeople(supabase, user.id);
}

async function lookupByUsername(supabase: Awaited<ReturnType<typeof createServerClient>>, myId: string, raw: string) {
  const parsed = parseUsernameQuery(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const perUser = await checkRateLimit(`user-lookup:${myId}`, { limit: 30, windowMs: 60 * 1000 });
  if (!perUser.success) {
    return NextResponse.json({ error: 'Search rate limit exceeded.' }, { status: 429 });
  }

  // ILIKE with the "_" wildcard escaped is an exact, case-insensitive match; the
  // JS check below is the final say, so a wildcard can never widen the result.
  const pattern = parsed.value.replace(/[\\%_]/g, (c) => `\\${c}`);
  const build = (columns: string) =>
    supabase.from('profiles').select(columns).ilike('username', pattern).neq('id', myId).limit(5);

  let { data, error } = await build(PROFILE_COLUMNS);
  if (error) ({ data, error } = await build(BASE_COLUMNS));
  if (error) return serverError('users.lookup', error, 500, 'Search failed.', myId);

  const rows = (data as unknown as Array<Row & Record<string, unknown>>) || [];
  const match = rows.find((r) => (r.username ?? '').toLowerCase() === parsed.value);
  if (!match) return NextResponse.json({ user: null });

  // People you blocked are flagged so the UI can say so. (Blocks are only visible to the
  // blocker, so this cannot reveal who blocked you. Migration 015 must be applied.)
  let blocked = false;
  const { data: block, error: blockError } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', myId)
    .eq('blocked_id', match.id)
    .maybeSingle();
  if (!blockError && block) blocked = true;

  return NextResponse.json({ user: { ...match, blocked } });
}

async function listKnownPeople(supabase: Awaited<ReturnType<typeof createServerClient>>, myId: string) {
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', myId).maybeSingle();
  const isAdmin = !!(me as { is_admin?: boolean } | null)?.is_admin;

  const select = async (columns: string, ids: string[] | null) => {
    let q = supabase.from('profiles').select(columns).neq('id', myId).limit(200);
    if (ids) q = q.in('id', ids);
    return q;
  };
  const fetchProfiles = async (ids: string[] | null) => {
    let res = await select(PROFILE_COLUMNS, ids);
    if (res.error) res = await select(BASE_COLUMNS, ids);
    return res;
  };

  let ids: string[] | null = null;
  if (!isAdmin) {
    const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', myId).is('left_at', null);
    const conversationIds = ((mine as Array<{ conversation_id: string }> | null) || []).map((r) => r.conversation_id);
    if (conversationIds.length === 0) return NextResponse.json([]);

    const { data: others } = await supabase.from('conversation_members').select('user_id').in('conversation_id', conversationIds).is('left_at', null);
    ids = [...new Set(((others as Array<{ user_id: string }> | null) || []).map((r) => r.user_id))].filter((id) => id !== myId);
    if (ids.length === 0) return NextResponse.json([]);
  }

  const { data, error } = await fetchProfiles(ids);
  if (error) return serverError('users.list', error, 500, undefined, myId);
  return NextResponse.json(data || []);
}
