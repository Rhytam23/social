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

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, reply_to_message_id, created_at, edited_at, deleted_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json(messages);
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
    const { conversationId, ciphertext, nonce, encryptionVersion = 1, replyToMessageId } = body;

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

    const { data: newMsg, error: insertError } = await supabase
      .from('messages')
      .insert(insertData as unknown as never)
      .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, created_at')
      .single();

    if (insertError || !newMsg) {
      return NextResponse.json({ error: insertError?.message || 'Failed to persist message.' }, { status: 500 });
    }

    return NextResponse.json(newMsg, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
