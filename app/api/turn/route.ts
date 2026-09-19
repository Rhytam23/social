import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { buildIceServers } from '@/lib/calls/iceConfig';

/** ICE servers for a call. Signed-in users only; TURN credentials are short-lived and never cached. */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`turn:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const result = buildIceServers(process.env, user.id);
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
