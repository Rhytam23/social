import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { boundedString, isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError, uuidList } from '@/lib/api/security';
import { ConversationType, Database } from '@/types/database';

export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'grp-create', { limit: 40, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'grp-create', { limit: 10, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const name = boundedString(typeof parsed.body.name === 'string' ? parsed.body.name.trim() : parsed.body.name, 1, 80);
  if (!name) return NextResponse.json({ error: 'A group name of 1 to 80 characters is required.' }, { status: 400 });

  const listed = uuidList(parsed.body.memberIds, 99);
  const others = (listed ?? []).filter((id) => id !== user.id);
  if (!listed || others.length === 0) {
    return NextResponse.json({ error: 'Invite 1 to 99 valid people.' }, { status: 400 });
  }

  const insertData: Database['public']['Tables']['conversations']['Insert'] = {
    type: 'group' as ConversationType,
    name,
    created_by: user.id,
  };
  const { data: group, error: createError } = await supabase
    .from('conversations')
    .insert(insertData as unknown as never)
    .select('id, type, name, created_at')
    .single();
  if (createError || !group) return serverError('groups.create', createError, 500, undefined, user.id);

  const createdGroup = group as { id: string; type: string; name: string | null; created_at: string };
  const memberRows: Database['public']['Tables']['conversation_members']['Insert'][] = [user.id, ...others].map((uid) => ({
    conversation_id: createdGroup.id,
    user_id: uid,
  }));

  // The creator becomes the owner. Falls back to plain rows when migration 013 has not been applied.
  const withRoles = memberRows.map((r) => (r.user_id === user.id ? { ...r, role: 'owner' as const } : r));
  let { error: membersError } = await supabase.from('conversation_members').insert(withRoles as unknown as never);
  if (membersError && /role/i.test(membersError.message)) {
    ({ error: membersError } = await supabase.from('conversation_members').insert(memberRows as unknown as never));
  }
  if (membersError) return serverError('groups.create.members', membersError, 400, 'Could not add those people.', user.id);

  return NextResponse.json(createdGroup, { status: 201 });
}

/** Update group settings: name, description, admin-only posting. Group admins only (enforced by RLS too). */
export async function PATCH(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'grp-update', { limit: 60, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'grp-update', { limit: 30, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const { groupId, name, description, onlyAdminsPost } = parsed.body;
  if (!isUuid(groupId)) {
    return NextResponse.json({ error: 'A valid groupId is required.' }, { status: 400 });
  }

  // Only these three fields can ever be changed here, whatever else the body contains.
  const patch: Record<string, unknown> = {};
  if (typeof name === 'string') {
    if (name.trim().length === 0 || name.trim().length > 80) {
      return NextResponse.json({ error: 'Group names need 1 to 80 characters.' }, { status: 400 });
    }
    patch.name = name.trim();
  }
  if (typeof description === 'string') {
    if (description.length > 500) {
      return NextResponse.json({ error: 'Descriptions can be at most 500 characters.' }, { status: 400 });
    }
    patch.description = description.trim() || null;
  }
  if (typeof onlyAdminsPost === 'boolean') patch.only_admins_post = onlyAdminsPost;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(patch as never)
    .eq('id', groupId)
    .eq('type', 'group')
    .select('id')
    .maybeSingle();
  if (error) return serverError('groups.update', error, 500, undefined, user.id);
  if (!data) {
    return NextResponse.json({ error: 'Group not found, or only group admins can change its settings.' }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
