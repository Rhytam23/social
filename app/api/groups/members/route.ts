import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
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
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`${bucket}:${ip}`, { limit, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return { error: NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 }) };
  }
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }
  return { supabase, user };
}

/** Add a member. Only group admins and the owner may do this (plain members are refused). */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request, 'grp-member-add', 30);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  try {
    const { groupId, userId } = await request.json();
    if (!groupId || !userId) {
      return NextResponse.json({ error: 'groupId and userId are required.' }, { status: 400 });
    }

    const { data: group } = await supabase.from('conversations').select('id, type').eq('id', groupId).eq('type', 'group').maybeSingle();
    if (!group) {
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
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid request payload.' }, { status: 400 });
  }
}

/** Remove a member, or leave (userId = yourself). Admins cannot remove other admins or the owner. */
export async function DELETE(request: NextRequest) {
  const auth = await authenticate(request, 'grp-member-remove', 30);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const groupId = request.nextUrl.searchParams.get('groupId');
  const userId = request.nextUrl.searchParams.get('userId');
  if (!groupId || !userId) {
    return NextResponse.json({ error: 'groupId and userId query params are required.' }, { status: 400 });
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
        if (promoteError) {
          return NextResponse.json({ error: 'Could not transfer ownership: ' + promoteError.message }, { status: 500 });
        }
      }
    }
  }

  const { error: deleteError } = await supabase.from('conversation_members').delete().eq('conversation_id', groupId).eq('user_id', userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

/** Change a member's role. Owner only. Promoting someone to owner makes the caller an admin. */
export async function PATCH(request: NextRequest) {
  const auth = await authenticate(request, 'grp-member-role', 30);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  try {
    const { groupId, userId, role } = await request.json();
    if (!groupId || !userId || !isGroupRole(role)) {
      return NextResponse.json({ error: 'groupId, userId and a valid role are required.' }, { status: 400 });
    }

    const me = await lookupMember(supabase, groupId, user.id);
    if (!me.active) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this group.' }, { status: 403 });
    }
    if (!me.rolesEnabled) {
      return NextResponse.json({ error: 'Group roles need the latest database update (migration 013).' }, { status: 409 });
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
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (role === 'owner') {
      const { error: demoteError } = await supabase
        .from('conversation_members')
        .update({ role: 'admin' } as never)
        .eq('conversation_id', groupId)
        .eq('user_id', user.id);
      if (demoteError) {
        return NextResponse.json({ error: demoteError.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid request payload.' }, { status: 400 });
  }
}
