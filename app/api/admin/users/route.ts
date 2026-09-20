import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth/roles';
import { isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';

/**
 * Toggling is_admin cannot go through ordinary RLS-protected client writes:
 * profiles_update_policy only lets a user update their own row, and
 * is_admin can only ever legitimately change via the service role (see
 * prevent_profile_admin_escalation in 002/003_*.sql). This route is that
 * privileged path, gated by a real server-side admin check.
 */
export async function PATCH(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'admin-role', { limit: 30, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'admin-role', { limit: 20, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  // Checked on the server against the database, never from anything the client sends.
  if (!(await isUserAdmin(user.id))) {
    return NextResponse.json({ error: 'Forbidden. Administrator privileges are required.' }, { status: 403 });
  }

  const parsed = await readJson(request, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  const { userId, isAdmin: nextIsAdmin } = parsed.body;
  if (!isUuid(userId) || typeof nextIsAdmin !== 'boolean') {
    return NextResponse.json({ error: 'A valid userId and boolean isAdmin are required.' }, { status: 400 });
  }
  const targetId = userId.toLowerCase();
  if (targetId === user.id && !nextIsAdmin) {
    return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from('profiles')
    .update({ is_admin: nextIsAdmin })
    .eq('id', targetId)
    .select('id, username, display_name, is_admin')
    .maybeSingle();

  if (updateError) return serverError('admin.users.update', updateError);
  if (!updated) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  console.info(`[audit] admin ${user.id} set is_admin=${nextIsAdmin} on ${targetId}`);
  return NextResponse.json(updated);
}
