import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`user-search:${ip}`, { limit: 60, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Search rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q') || '';
  const sanitizedQuery = query.replace(/[%_]/g, '').trim();

    let dbQuery = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, email, phone_number, created_at')
      .neq('id', user.id)
      .limit(25);

    if (sanitizedQuery.length > 0) {
      dbQuery = dbQuery.or(
        `username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,phone_number.ilike.%${sanitizedQuery}%`
      );
    }

    const { data: profiles, error: searchError } = await dbQuery;

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 });
  }

  return NextResponse.json(profiles || []);
}
