import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth/roles';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';

/**
 * Toggling is_admin cannot go through ordinary RLS-protected client writes:
 * profiles_update_policy only lets a user update their own row, and
 * is_admin can only ever legitimately change via the service role (see
 * prevent_profile_admin_escalation in 002/003_*.sql). This route is that
 * privileged path, gated by a real server-side admin check.
 */
export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`admin-role:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden. Administrator privileges are required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, isAdmin: nextIsAdmin } = body;

    if (!userId || typeof nextIsAdmin !== 'boolean') {
      return NextResponse.json({ error: 'userId and boolean isAdmin are required.' }, { status: 400 });
    }

    if (userId === user.id && !nextIsAdmin) {
      return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({ is_admin: nextIsAdmin })
      .eq('id', userId)
      .select('id, username, display_name, is_admin')
      .maybeSingle();

    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message || 'User not found.' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
