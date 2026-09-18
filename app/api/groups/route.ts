import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { ConversationType, Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`grp-get:${ip}`, { limit: 60, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get('groupId');
  if (!groupId) {
    return NextResponse.json({ error: 'groupId parameter is required.' }, { status: 400 });
  }

  // IDOR Protection: Verify caller is an active member of this group
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', groupId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'Forbidden. You are not a member of this group.' },
      { status: 403 }
    );
  }

  const { data: group, error: groupError } = await supabase
    .from('conversations')
    .select('id, type, name, avatar_url, created_at, updated_at')
    .eq('id', groupId)
    .eq('type', 'group')
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group space not found.' }, { status: 404 });
  }

  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id, joined_at, profiles(id, username, display_name, avatar_url)')
    .eq('conversation_id', groupId)
    .is('left_at', null);

  const groupData = group as { id: string; type: string; name: string | null; avatar_url: string | null; created_at: string; updated_at: string };

  return NextResponse.json({
    ...groupData,
    members: members || [],
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`grp-create:${ip}`, { limit: 20, windowMs: 60 * 1000 });

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
    const { name, memberIds } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name is required.' }, { status: 400 });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'At least one group member must be invited.' }, { status: 400 });
    }

    const insertData: Database['public']['Tables']['conversations']['Insert'] = {
      type: 'group' as ConversationType,
      name: name.trim(),
      created_by: user.id,
    };

    const { data: group, error: createError } = await supabase
      .from('conversations')
      .insert(insertData as unknown as never)
      .select('id, type, name, created_at')
      .single();

    if (createError || !group) {
      return NextResponse.json({ error: createError?.message || 'Failed to create group.' }, { status: 500 });
    }

    const createdGroup = group as { id: string; type: string; name: string | null; created_at: string };

    const uniqueMembers = Array.from(new Set([user.id, ...memberIds]));
    const memberRows: Database['public']['Tables']['conversation_members']['Insert'][] = uniqueMembers.map((uid) => ({
      conversation_id: createdGroup.id,
      user_id: uid,
    }));

    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert(memberRows as unknown as never);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    return NextResponse.json(createdGroup, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
