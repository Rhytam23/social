import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';
import { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`msg-list:${ip}`, { limit: 120, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId parameter is required.' }, { status: 400 });
  }

  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;
  const before = request.nextUrl.searchParams.get('before'); // ISO timestamp cursor for pagination

  // IDOR Protection: Verify caller is an active member of this conversation
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'Forbidden. You are not a member of this conversation.' },
      { status: 403 }
    );
  }

  // thread_root_id exists after migration 013; fall back to the older column list if it does not.
  const buildQuery = (columns: string) => {
    let q = supabase
      .from('messages')
      .select(columns)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before) q = q.lt('created_at', before);
    return q;
  };
  const baseColumns = 'id, conversation_id, sender_id, ciphertext, nonce, encryption_version, reply_to_message_id, created_at, edited_at, deleted_at';
  let { data: messages, error: msgError } = await buildQuery(baseColumns + ', thread_root_id, expires_at');
  if (msgError) {
    ({ data: messages, error: msgError } = await buildQuery(baseColumns + ', thread_root_id'));
  }
  if (msgError) {
    ({ data: messages, error: msgError } = await buildQuery(baseColumns));
  }

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json((messages || []).reverse());
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`msg-edit:${ip}`, { limit: 60, windowMs: 60 * 1000 });

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
    const { messageId, ciphertext, nonce, encryptionVersion, deleted } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required.' }, { status: 400 });
    }

    const update: Database['public']['Tables']['messages']['Update'] = deleted
      ? { deleted_at: new Date().toISOString() }
      : { ciphertext, nonce, encryption_version: encryptionVersion, edited_at: new Date().toISOString() };

    if (!deleted && (!ciphertext || !nonce)) {
      return NextResponse.json({ error: 'ciphertext and nonce are required for an edit.' }, { status: 400 });
    }

    // RLS (messages_update_policy) additionally enforces sender_id = auth.uid()
    // and current conversation membership - this filter is defense in depth.
    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update(update as unknown as never)
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, edited_at, deleted_at')
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: 'Message not found or you are not its sender.' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`msg-send:${ip}`, { limit: 60, windowMs: 60 * 1000 });

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
    const { conversationId, ciphertext, nonce, encryptionVersion = 1, replyToMessageId, threadRootId } = body;

    if (!conversationId || !ciphertext || !nonce) {
      return NextResponse.json(
        { error: 'Missing required payload: conversationId, ciphertext, and nonce are required.' },
        { status: 400 }
      );
    }

    // IDOR Protection: Verify caller is an active member of this conversation
    const { data: membership } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden. You cannot post messages to a conversation you do not belong to.' },
        { status: 403 }
      );
    }

    const insertData: Database['public']['Tables']['messages']['Insert'] = {
      conversation_id: conversationId,
      sender_id: user.id,
      ciphertext,
      nonce,
      encryption_version: encryptionVersion,
      reply_to_message_id: replyToMessageId || null,
    };

    if (threadRootId) {
      // A thread reply must attach to a message in the same conversation.
      const { data: root } = await supabase
        .from('messages')
        .select('id')
        .eq('id', threadRootId)
        .eq('conversation_id', conversationId)
        .maybeSingle();
      if (!root) {
        return NextResponse.json({ error: 'The thread you are replying to was not found.' }, { status: 404 });
      }
      (insertData as Record<string, unknown>).thread_root_id = threadRootId;
    }

    const { data: newMsg, error: insertError } = await supabase
      .from('messages')
      .insert(insertData as unknown as never)
      .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, created_at')
      .single();

    if (insertError || !newMsg) {
      // Row level security is what refuses a blocked sender; say so plainly instead of leaking policy text.
      const denied = !!insertError && /row-level security/i.test(insertError.message);
      return NextResponse.json(
        { error: denied ? 'You cannot send messages to this conversation right now.' : insertError?.message || 'Failed to persist message.' },
        { status: denied ? 403 : 500 }
      );
    }

    return NextResponse.json(newMsg, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
