import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { limitByIp, limitByUser } from '@/lib/api/security';
import { buildIceServers } from '@/lib/calls/iceConfig';

/** ICE servers for a call. Signed-in users only; TURN credentials are short-lived and never cached. */
export async function GET(request: NextRequest) {
  const limited = await limitByIp(request, 'turn', { limit: 60, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'turn', { limit: 20, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const result = buildIceServers(process.env, user.id);
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
