import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { boundedString, limitByIp, limitByUser, readJson, rejectCrossSite, serverError, uuidList } from '@/lib/api/security';
import { ConversationType, Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const limited = await limitByIp(request, 'conv-list', { limit: 240, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Only conversations where the caller is an active member (RLS enforces the same rule).
  const { data: memberships, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id)
    .is('left_at', null);
  if (memberError) return serverError('conversations.list.members', memberError, 500, undefined, user.id);

  const conversationIds = (memberships as Array<{ conversation_id: string }> | null)?.map((m) => m.conversation_id) || [];
  if (conversationIds.length === 0) return NextResponse.json([]);

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, type, name, avatar_url, created_at, updated_at')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });
  if (convError) return serverError('conversations.list', convError, 500, undefined, user.id);

  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'conv-create', { limit: 60, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'conv-create', { limit: 20, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const { type, name } = parsed.body;

  if (type !== 'private' && type !== 'group') {
    return NextResponse.json({ error: 'Invalid conversation type. Must be "private" or "group".' }, { status: 400 });
  }
  const groupName = type === 'group' ? boundedString(typeof name === 'string' ? name.trim() : name, 1, 80) : null;
  if (type === 'group' && !groupName) {
    return NextResponse.json({ error: 'Group conversations require a name of 1 to 80 characters.' }, { status: 400 });
  }

  const listed = uuidList(parsed.body.participantIds, 50);
  const others = (listed ?? []).filter((id) => id !== user.id);
  if (!listed || others.length === 0) {
    return NextResponse.json({ error: 'Provide 1 to 50 valid participant IDs.' }, { status: 400 });
  }
  if (type === 'private' && others.length !== 1) {
    return NextResponse.json({ error: 'A private conversation has exactly two people.' }, { status: 400 });
  }

  const insertData: Database['public']['Tables']['conversations']['Insert'] = {
    type: type as ConversationType,
    name: type === 'group' ? groupName : null,
    created_by: user.id,
  };
  const { data: conv, error: insertError } = await supabase
    .from('conversations')
    .insert(insertData as unknown as never)
    .select('id, type, name, created_at')
    .single();
  if (insertError || !conv) return serverError('conversations.create', insertError, 500, undefined, user.id);

  const createdConv = conv as { id: string; type: string; name: string | null; created_at: string };
  const memberRows: Database['public']['Tables']['conversation_members']['Insert'][] = [user.id, ...others].map((uid) => ({
    conversation_id: createdConv.id,
    user_id: uid,
  }));
  const { error: membersInsertError } = await supabase.from('conversation_members').insert(memberRows as unknown as never);
  if (membersInsertError) return serverError('conversations.create.members', membersInsertError, 400, 'Could not add those people.', user.id);

  return NextResponse.json(createdConv, { status: 201 });
}
