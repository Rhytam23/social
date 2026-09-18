import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { Database } from '@/types/database';

async function requireActiveMember(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  conversationId: string,
  userId: string
) {
  const { data } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  return !!data;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`grp-member-add:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { groupId, userId } = body;

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'groupId and userId are required.' }, { status: 400 });
    }

    const { data: group } = await supabase
      .from('conversations')
      .select('id, type')
      .eq('id', groupId)
      .eq('type', 'group')
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    if (!(await requireActiveMember(supabase, groupId, user.id))) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this group.' }, { status: 403 });
    }

    const insertData: Database['public']['Tables']['conversation_members']['Insert'] = {
      conversation_id: groupId,
      user_id: userId,
    };

    const { error: insertError } = await supabase
      .from('conversation_members')
      .insert(insertData as unknown as never);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`grp-member-remove:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get('groupId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!groupId || !userId) {
    return NextResponse.json({ error: 'groupId and userId query params are required.' }, { status: 400 });
  }

  // RLS (conversation_members_delete_policy) restricts this to removing
  // yourself or - if the caller is a platform admin - anyone. Membership
  // removal is what actually revokes access (see messages_select_policy);
  // the group's encryption key is separately rotated by the client after
  // this call succeeds so past ciphertext also becomes unreadable to them.
  const { error: deleteError } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', groupId)
    .eq('user_id', userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
