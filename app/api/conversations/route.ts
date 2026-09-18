import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { ConversationType, Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`conv-list:${ip}`, { limit: 120, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Fetch only conversations where current user is an active member
  const { data: memberships, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)
    .is('left_at', null);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const conversationIds = (memberships as Array<{ conversation_id: string }> | null)?.map((m) => m.conversation_id) || [];

  if (conversationIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, type, name, avatar_url, created_at, updated_at')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`conv-create:${ip}`, { limit: 30, windowMs: 60 * 1000 });

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
    const { type, name, participantIds } = body;

    if (type !== 'private' && type !== 'group') {
      return NextResponse.json({ error: 'Invalid conversation type. Must be "private" or "group".' }, { status: 400 });
    }

    if (type === 'group' && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Group conversations require a valid name.' }, { status: 400 });
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'At least one participant ID is required.' }, { status: 400 });
    }

    const insertData: Database['public']['Tables']['conversations']['Insert'] = {
      type: type as ConversationType,
      name: type === 'group' ? name.trim() : null,
      created_by: user.id,
    };

    const { data: conv, error: insertError } = await supabase
      .from('conversations')
      .insert(insertData as unknown as never)
      .select('id, type, name, created_at')
      .single();

    if (insertError || !conv) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create conversation.' }, { status: 500 });
    }

    const createdConv = conv as { id: string; type: string; name: string | null; created_at: string };

    const uniqueParticipants = Array.from(new Set([user.id, ...participantIds]));
    const memberRows: Database['public']['Tables']['conversation_members']['Insert'][] = uniqueParticipants.map((uid) => ({
      conversation_id: createdConv.id,
      user_id: uid,
    }));

    const { error: membersInsertError } = await supabase
      .from('conversation_members')
      .insert(memberRows as unknown as never);

    if (membersInsertError) {
      return NextResponse.json({ error: membersInsertError.message }, { status: 500 });
    }

    return NextResponse.json(createdConv, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
