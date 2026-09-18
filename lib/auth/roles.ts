import { createAdminClient } from '../supabase/admin';

/**
 * Checks if a user has administrator privileges.
 *
 * Administrative access is a server-controlled property stored in the
 * `profiles.is_admin` column. It is NOT derived from client-controllable
 * JWT/app_metadata, which a normal user cannot be allowed to influence.
 *
 * This function must only be called server-side (it uses the service role).
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return false;
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    return profile?.is_admin === true;
  } catch {
    return false;
  }
}
