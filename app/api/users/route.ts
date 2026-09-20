import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { clientIp, serverError } from '@/lib/api/security';
import { parseUsernameQuery } from '@/lib/people/username';

/**
 * GET /api/users?username=<start of a username>
 *   The only way to find someone you have not talked to yet. Matches usernames that START WITH the text
 *   (case-insensitive, at least 3 characters, at most MAX_MATCHES results, exact match first). Display name,
 *   email, phone number and bio are never searched, and email/phone are never returned. Platform admins are
 *   not returned to people they have not talked to (row security, migration 023). Rate limited per person,
 *   per address and per day, because a prefix search can be walked to list people.
 *
 * GET /api/users
 *   People you already share a conversation with (platform admins get the
 *   full directory for the admin dashboard). Not a discovery feature.
 */

// Columns other people may see. bio/pronouns/timezone come from migration 011.
const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, created_at, bio, pronouns, timezone';
const BASE_COLUMNS = 'id, username, display_name, avatar_url, created_at';

const MAX_MATCHES = 8;

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

  // Live search sends a request at each pause in typing, so the per-minute limit is higher than an exact lookup
  // needed. The daily cap is what makes walking the whole directory impractical.
  const perUser = await checkRateLimit(`user-lookup:${myId}`, { limit: 40, windowMs: 60 * 1000 });
  if (!perUser.success) {
    return NextResponse.json({ error: 'Search rate limit exceeded.' }, { status: 429 });
  }
  const perDay = await checkRateLimit(`user-lookup-day:${myId}`, { limit: 1500, windowMs: 24 * 60 * 60 * 1000 });
  if (!perDay.success) {
    return NextResponse.json({ error: 'Search rate limit exceeded.' }, { status: 429 });
  }

  // ILIKE with the wildcards in the text escaped and one "%" added on the end means "starts with". The JS check
  // below is the final say, so a wildcard typed by the caller can never widen the result.
  const pattern = parsed.value.replace(/[\\%_]/g, (c) => `\\${c}`) + '%';
  const build = (columns: string) =>
    supabase.from('profiles').select(columns).ilike('username', pattern).neq('id', myId).order('username', { ascending: true }).limit(MAX_MATCHES);

  let { data, error } = await build(PROFILE_COLUMNS);
  if (error) ({ data, error } = await build(BASE_COLUMNS));
  if (error) return serverError('users.lookup', error, 500, 'Search failed.', myId);

  const isExact = (r: Row) => (r.username ?? '').toLowerCase() === parsed.value;
  const rows = ((data as unknown as Array<Row & Record<string, unknown>>) || [])
    .filter((r) => (r.username ?? '').toLowerCase().startsWith(parsed.value))
    // The exact match first, then alphabetical (the query already ordered them).
    .sort((x, y) => Number(isExact(y)) - Number(isExact(x)));
  if (rows.length === 0) return NextResponse.json({ users: [] });

  // People you blocked are flagged so the UI can say so. (Blocks are only visible to the
  // blocker, so this cannot reveal who blocked you. Migration 015 must be applied.)
  const blockedIds = new Set<string>();
  const { data: blocks, error: blockError } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', myId)
    .in('blocked_id', rows.map((r) => r.id));
  if (!blockError) for (const b of (blocks as Array<{ blocked_id: string }> | null) || []) blockedIds.add(b.blocked_id);

  return NextResponse.json({ users: rows.map((r) => ({ ...r, blocked: blockedIds.has(r.id) })) });
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
