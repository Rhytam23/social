import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { limitByIp } from '@/lib/api/security';

export async function GET(request: NextRequest) {
  const limited = await limitByIp(request, 'auth', { limit: 120, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  // getUser() asks Supabase to validate the token; getSession() alone would trust the cookie.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_admin, created_at')
    .eq('id', user.id)
    .single();

  return NextResponse.json(
    { authenticated: true, user: { id: user.id, email: user.email, profile: profile || null } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
