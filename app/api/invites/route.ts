import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/auth/roles';
import { generateInvite } from '@/lib/invites/generateInvite';
import { validateInvite } from '@/lib/invites/validateInvite';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`invite-val:${ip}`, { limit: 30, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const token = request.nextUrl.searchParams.get('token');
  if (!token || typeof token !== 'string' || token.length < 8) {
    return NextResponse.json({ valid: false, error: 'Invalid token format.' }, { status: 400 });
  }

  const result = await validateInvite(token);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`invite-gen:${ip}`, { limit: 15, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Strict Admin Authorization Check
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden. Administrator privileges are required to generate platform invites.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { assignedEmail, expiresInDays } = body;

    if (!assignedEmail || typeof assignedEmail !== 'string' || !assignedEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid recipient email address is required.' }, { status: 400 });
    }

    const invite = await generateInvite({
      assignedEmail,
      createdBy: user.id,
      expiresInDays: typeof expiresInDays === 'number' ? Math.min(Math.max(1, expiresInDays), 30) : 7,
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error generating invite token.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
