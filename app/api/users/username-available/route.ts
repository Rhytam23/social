import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { limitByIp, limitByUser, serverError } from '@/lib/api/security';

/**
 * GET /api/users/username-available?u=<username>
 *   { available: boolean, suggestions: string[] }
 *
 * Used by the "choose your username" step. Answers only free or taken for the exact name asked (never who owns
 * it), and offers a few free alternatives when it is taken. The lookup function is callable only with the service
 * key (migration 030), so the limits below cannot be skipped by asking the database API directly.
 */

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

function candidatesFor(base: string): string[] {
  const stem = base.slice(0, 26);
  const digits = () => String(Math.floor(10 + Math.random() * 990));
  return [base, `${stem}${digits()}`, `${stem}_${digits()}`, `${stem}.${digits()}`, `${stem}${digits()}`, `${stem}_${digits()}`, `the_${stem}`.slice(0, 30)];
}

export async function GET(request: NextRequest) {
  const ipLimited = await limitByIp(request, 'username-available', { limit: 120, windowMs: 60 * 1000 });
  if (ipLimited) return ipLimited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  // Typing checks at each pause, so a minute is generous; the daily cap stops anyone listing names.
  const perMinute = await limitByUser(user.id, 'username-available', { limit: 30, windowMs: 60 * 1000 });
  if (perMinute) return perMinute;
  const perDay = await limitByUser(user.id, 'username-available-day', { limit: 1000, windowMs: 24 * 60 * 60 * 1000 });
  if (perDay) return perDay;

  const raw = (request.nextUrl.searchParams.get('u') ?? '').trim();
  const value = (raw.startsWith('@') ? raw.slice(1) : raw).toLowerCase();
  if (!USERNAME_RE.test(value)) {
    return NextResponse.json({ error: 'A username is 3 to 30 letters, numbers, dots or underscores.' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Username check is not available right now.' }, { status: 503 });
  }
  const server = createAdminClient() as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
  const candidates = candidatesFor(value);
  const { data, error } = await server.rpc('available_usernames', { p_candidates: candidates });
  if (error) return serverError('users.username-available', error, 500, 'Could not check that username.', user.id);

  const free = Array.isArray(data) ? (data as string[]).filter((c) => typeof c === 'string') : [];
  const available = free.includes(value);
  return NextResponse.json({ available, suggestions: available ? [] : [...new Set(free)].slice(0, 3) });
}
