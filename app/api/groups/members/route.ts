import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { Database } from '@/types/database';
import { canAddMembers, canChangeRole, canRemoveMember, isGroupRole, pickSuccessor, type GroupRole } from '@/lib/groups/roles';

type Supabase = Awaited<ReturnType<typeof createServerClient>>;

interface MemberLookup {
  active: boolean;
  role?: GroupRole;
  /** False when migration 013 has not been applied: roles do not exist yet. */
  rolesEnabled: boolean;
}

async function lookupMember(supabase: Supabase, conversationId: string, userId: string): Promise<MemberLookup> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (!error) {
    const role = (data as { role?: string } | null)?.role;
    return { active: !!data, role: isGroupRole(role) ? role : 'member', rolesEnabled: true };
  }

  // Roles column missing (migration 013 not applied): fall back to plain membership.
  const { data: plain } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  return { active: !!plain, rolesEnabled: false };
}

async function authenticate(request: NextRequest, bucket: string, limit: number) {
  const cross = rejectCrossSite(request);
  if (cross) return { error: cross };
  const limited = await limitByIp(request, bucket, { limit: limit * 2, windowMs: 60 * 1000 });
  if (limited) return { error: limited };
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }
  const userLimited = await limitByUser(user.id, bucket, { limit, windowMs: 60 * 1000 });
  if (userLimited) return { error: userLimited };
  return { supabase, user };
}

/** These endpoints manage groups only: never direct chats or community channels. */
async function isPlainGroup(supabase: Supabase, groupId: string): Promise<boolean> {
  const { data } = await supabase.from('conversations').select('id').eq('id', groupId).eq('type', 'group').maybeSingle();
  return !!data;
}

/** Add a member. Only group admins and the owner may do this (plain members are refused). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request, 'grp-member-add', 30);
  if ('error' in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  {
    const parsed = await readJson(request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    if (!isUuid(parsed.body.groupId) || !isUuid(parsed.body.userId)) {
      return NextResponse.json({ error: 'A valid groupId and userId are required.' }, { status: 400 });
    }
    const groupId = parsed.body.groupId.toLowerCase();
    const userId = parsed.body.userId.toLowerCase();

    if (!(await isPlainGroup(supabase, groupId))) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    const me = await lookupMember(supabase, groupId, user.id);
    if (!me.active) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this group.' }, { status: 403 });
    }
    if (me.rolesEnabled && !canAddMembers(me.role)) {
      return NextResponse.json({ error: 'Only group admins can add members.' }, { status: 403 });
    }

    const insertData: Database['public']['Tables']['conversation_members']['Insert'] = {
      conversation_id: groupId,
      user_id: userId,
    };
    const { error: insertError } = await supabase.from('conversation_members').insert(insertData as unknown as never);
    if (insertError) return serverError('groups.members.add', insertError, 400, 'Could not add that person.');
    return NextResponse.json({ success: true }, { status: 201 });
  }
}

/** Remove a member, or leave (userId = yourself). Admins cannot remove other admins or the owner. */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request, 'grp-member-remove', 30);
  if ('error' in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  const rawGroup = request.nextUrl.searchParams.get('groupId');
  const rawUser = request.nextUrl.searchParams.get('userId');
  if (!isUuid(rawGroup) || !isUuid(rawUser)) {
    return NextResponse.json({ error: 'A valid groupId and userId are required.' }, { status: 400 });
  }
  const groupId = rawGroup.toLowerCase();
  const userId = rawUser.toLowerCase();
  if (!(await isPlainGroup(supabase, groupId))) {
    return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
  }

  const me = await lookupMember(supabase, groupId, user.id);
  if (!me.active) {
    return NextResponse.json({ error: 'Forbidden. You are not a member of this group.' }, { status: 403 });
  }

  const isSelf = userId === user.id;
  if (me.rolesEnabled) {
    const target = isSelf ? me : await lookupMember(supabase, groupId, userId);
    if (!target.active) {
      return NextResponse.json({ error: 'That person is not in this group.' }, { status: 404 });
    }
    if (!canRemoveMember(me.role, target.role, isSelf)) {
      return NextResponse.json({ error: 'You do not have permission to remove this member.' }, { status: 403 });
    }

    // The owner leaving hands the group to the longest-serving admin (else member) first.
    if (isSelf && me.role === 'owner') {
      const { data: rows } = await supabase
        .from('conversation_members')
        .select('user_id, role, joined_at')
        .eq('conversation_id', groupId)
        .is('left_at', null);
      const successor = pickSuccessor(
        ((rows as Array<{ user_id: string; role: string; joined_at: string }> | null) || []).map((r) => ({
          userId: r.user_id,
          role: isGroupRole(r.role) ? r.role : 'member',
          joinedAt: r.joined_at,
        })),
        user.id
      );
      if (successor) {
        const { error: promoteError } = await supabase
          .from('conversation_members')
          .update({ role: 'owner' } as never)
          .eq('conversation_id', groupId)
          .eq('user_id', successor);
        if (promoteError) return serverError('groups.members.transfer', promoteError, 500, 'Could not transfer ownership.');
      }
    }
  }

  const { error: deleteError } = await supabase.from('conversation_members').delete().eq('conversation_id', groupId).eq('user_id', userId);
  if (deleteError) return serverError('groups.members.remove', deleteError);
  return NextResponse.json({ success: true });
}

/** Change a member's role. Owner only. Promoting someone to owner makes the caller an admin. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request, 'grp-member-role', 30);
  if ('error' in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  {
    const parsed = await readJson(request, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const { role } = parsed.body;
    if (!isUuid(parsed.body.groupId) || !isUuid(parsed.body.userId) || !isGroupRole(role)) {
      return NextResponse.json({ error: 'A valid groupId, userId and role are required.' }, { status: 400 });
    }
    const groupId = parsed.body.groupId.toLowerCase();
    const userId = parsed.body.userId.toLowerCase();
    if (!(await isPlainGroup(supabase, groupId))) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    const me = await lookupMember(supabase, groupId, user.id);
    if (!me.active) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this group.' }, { status: 403 });
    }
    if (!me.rolesEnabled) {
      return NextResponse.json({ error: 'Group roles are not available yet.' }, { status: 409 });
    }

    const target = await lookupMember(supabase, groupId, userId);
    if (!target.active) {
      return NextResponse.json({ error: 'That person is not in this group.' }, { status: 404 });
    }
    if (!canChangeRole(me.role, target.role, role, userId === user.id)) {
      return NextResponse.json({ error: 'Only the group owner can change roles.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('conversation_members')
      .update({ role } as never)
      .eq('conversation_id', groupId)
      .eq('user_id', userId);
    if (updateError) return serverError('groups.members.role', updateError);

    if (role === 'owner') {
      const { error: demoteError } = await supabase
        .from('conversation_members')
        .update({ role: 'admin' } as never)
        .eq('conversation_id', groupId)
        .eq('user_id', user.id);
      if (demoteError) return serverError('groups.members.demote', demoteError);
    }
    return NextResponse.json({ success: true });
  }
}
