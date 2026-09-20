import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientIp, limitByIp, limitByUser, rejectCrossSite, serverError } from '@/lib/api/security';

/**
 * POST /api/session/seen
 *
 * The app calls this once per browser session after sign-in. It records the network address the request came
 * from against the signed-in account (the 20 most recent per account, kept 180 days). The only use is safety:
 * when an account is banned for repeated reports, its email and these addresses are blocked from creating new
 * accounts for the same period (migration 024). Readable by platform admins only. The privacy policy says so.
 * Nothing is returned, and a failure here never affects the person's session.
 */
export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'session-seen', { limit: 30, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const perUser = await limitByUser(user.id, 'session-seen', { limit: 20, windowMs: 60 * 60 * 1000 });
  if (perUser) return perUser;

  const ip = clientIp(request);
  if (ip === 'unknown' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse(null, { status: 204 });
  }

  const untyped = createAdminClient() as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
  };
  const { error } = await untyped.rpc('record_user_ip', { p_user: user.id, p_ip: ip });
  if (error) {
    // Migration 024 not applied yet, or a database problem: log it for admins, never surface it.
    serverError('session.seen', error, 500, undefined, user.id);
  }
  return new NextResponse(null, { status: 204 });
}
