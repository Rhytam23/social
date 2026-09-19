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

    // Only non-sensitive, discovery-relevant columns are ever returned here.
    // email/phone_number remain searchable (below) but are never sent to the
    // client - a prior version leaked every user's email/phone to any
    // authenticated caller who searched for them.
    const build = (columns: string) => {
      let q = supabase.from('profiles').select(columns).neq('id', user.id).limit(100);
      if (sanitizedQuery.length > 0) {
        q = q.or(`username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`);
      }
      return q;
    };

    // bio/pronouns/timezone come from migration 011; fall back if it has not run yet.
    let { data: profiles, error: searchError } = await build(
      'id, username, display_name, avatar_url, created_at, bio, pronouns, timezone'
    );
    if (searchError) {
      ({ data: profiles, error: searchError } = await build('id, username, display_name, avatar_url, created_at'));
    }

    if (searchError) {
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    // Email / phone: exact match only, resolved server-side. Partial matching would
    // let anyone probe which addresses are registered.
    const results = [...((profiles as unknown as Array<{ id: string }>) || [])];
    if (sanitizedQuery.length >= 5) {
      const untyped = supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
      };
      const { data: exact } = await untyped.rpc('find_profiles_by_contact', { p_query: query.trim() });
      for (const p of (exact as Array<{ id: string }> | null) || []) {
        if (!results.some((r) => r.id === p.id)) results.push(p);
      }
    }

    return NextResponse.json(results);
}
