import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isIsoDate, isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { Database } from '@/types/database';
import { MESSAGE_REQUEST_CODE, MESSAGE_REQUEST_NOTICE, isMessageRequestLimit } from '@/lib/messaging/messageRequests';

// Ciphertext is base64 of an encrypted envelope. Attachments are separate files, so messages stay small.
const MAX_CIPHERTEXT_CHARS = 200_000;
const MAX_NONCE_CHARS = 128;

type Supabase = Awaited<ReturnType<typeof createServerClient>>;

/** Active membership check, the server-side answer to "may this user touch this conversation?". */
async function isActiveMember(supabase: Supabase, conversationId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  return !!data;
}

export async function GET(request: NextRequest) {
  const limited = await limitByIp(request, 'msg-list', { limit: 240, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get('conversationId');
  if (!isUuid(conversationId)) {
    return NextResponse.json({ error: 'A valid conversationId parameter is required.' }, { status: 400 });
  }
  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;
  const before = request.nextUrl.searchParams.get('before'); // ISO timestamp cursor for pagination
  if (before !== null && !isIsoDate(before)) {
    return NextResponse.json({ error: 'before must be an ISO date-time.' }, { status: 400 });
  }

  // IDOR protection: the caller must be an active member of this conversation.
  if (!(await isActiveMember(supabase, conversationId, user.id))) {
    return NextResponse.json({ error: 'Forbidden. You are not a member of this conversation.' }, { status: 403 });
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
  if (msgError) return serverError('messages.list', msgError, 500, undefined, user.id);

  return NextResponse.json((messages || []).reverse(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'msg-edit', { limit: 240, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'msg-edit', { limit: 60, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request, 512 * 1024);
  if (!parsed.ok) return parsed.response;
  const { messageId, ciphertext, nonce, encryptionVersion, deleted } = parsed.body;

  if (!isUuid(messageId)) {
    return NextResponse.json({ error: 'A valid messageId is required.' }, { status: 400 });
  }
  if (deleted !== undefined && typeof deleted !== 'boolean') {
    return NextResponse.json({ error: 'deleted must be a boolean.' }, { status: 400 });
  }

  let update: Database['public']['Tables']['messages']['Update'];
  if (deleted === true) {
    update = { deleted_at: new Date().toISOString() };
  } else {
    if (typeof ciphertext !== 'string' || ciphertext.length === 0 || ciphertext.length > MAX_CIPHERTEXT_CHARS || typeof nonce !== 'string' || nonce.length === 0 || nonce.length > MAX_NONCE_CHARS) {
      return NextResponse.json({ error: 'A valid ciphertext and nonce are required for an edit.' }, { status: 400 });
    }
    if (encryptionVersion !== undefined && !(Number.isInteger(encryptionVersion) && (encryptionVersion as number) >= 0 && (encryptionVersion as number) <= 10)) {
      return NextResponse.json({ error: 'Invalid encryptionVersion.' }, { status: 400 });
    }
    // Only these columns can change; the sender and conversation never do.
    update = { ciphertext, nonce, edited_at: new Date().toISOString() };
    if (encryptionVersion !== undefined) update.encryption_version = encryptionVersion as number;
  }

  // RLS (messages_update_policy + the immutable-columns trigger from migration 017) also enforce
  // sender and membership; these filters are defence in depth. A deleted message cannot be edited back to life.
  const { data: updated, error: updateError } = await supabase
    .from('messages')
    .update(update as unknown as never)
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, edited_at, deleted_at')
    .maybeSingle();

  if (updateError) return serverError('messages.update', updateError, 500, undefined, user.id);
  if (!updated) {
    return NextResponse.json({ error: 'Message not found or you are not its sender.' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'msg-send', { limit: 240, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  // A person cannot flood conversations by rotating addresses: the limit follows the account.
  const userLimited = await limitByUser(user.id, 'msg-send', { limit: 60, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request, 512 * 1024);
  if (!parsed.ok) return parsed.response;
  const { conversationId, ciphertext, nonce, replyToMessageId, threadRootId } = parsed.body;
  const encryptionVersion = parsed.body.encryptionVersion ?? 1;

  if (!isUuid(conversationId) || typeof ciphertext !== 'string' || typeof nonce !== 'string') {
    return NextResponse.json({ error: 'conversationId, ciphertext and nonce are required.' }, { status: 400 });
  }
  if (ciphertext.length === 0 || ciphertext.length > MAX_CIPHERTEXT_CHARS || nonce.length === 0 || nonce.length > MAX_NONCE_CHARS) {
    return NextResponse.json({ error: 'The message is too large or malformed.' }, { status: 400 });
  }
  if (!(Number.isInteger(encryptionVersion) && (encryptionVersion as number) >= 0 && (encryptionVersion as number) <= 10)) {
    return NextResponse.json({ error: 'Invalid encryptionVersion.' }, { status: 400 });
  }
  if ((replyToMessageId != null && !isUuid(replyToMessageId)) || (threadRootId != null && !isUuid(threadRootId))) {
    return NextResponse.json({ error: 'Invalid reply or thread reference.' }, { status: 400 });
  }

  // IDOR protection: the caller must be an active member of this conversation.
  if (!(await isActiveMember(supabase, conversationId, user.id))) {
    return NextResponse.json({ error: 'Forbidden. You cannot post messages to a conversation you do not belong to.' }, { status: 403 });
  }

  // A reply or thread reference must point at a message in the SAME conversation, never another one.
  for (const [ref, label] of [[replyToMessageId, 'reply'], [threadRootId, 'thread']] as const) {
    if (!ref) continue;
    const { data: target } = await supabase.from('messages').select('id').eq('id', ref as string).eq('conversation_id', conversationId).maybeSingle();
    if (!target) return NextResponse.json({ error: `The ${label} target was not found in this conversation.` }, { status: 404 });
  }

  const insertData: Database['public']['Tables']['messages']['Insert'] = {
    conversation_id: conversationId,
    sender_id: user.id, // always the authenticated user, never taken from the request
    ciphertext,
    nonce,
    encryption_version: encryptionVersion as number,
    reply_to_message_id: (replyToMessageId as string | null | undefined) || null,
  };
  if (threadRootId) (insertData as Record<string, unknown>).thread_root_id = threadRootId;

  const { data: newMsg, error: insertError } = await supabase
    .from('messages')
    .insert(insertData as unknown as never)
    .select('id, conversation_id, sender_id, ciphertext, nonce, encryption_version, created_at')
    .single();

  if (insertError || !newMsg) {
    // Row level security refuses blocked senders and admin-only channels; say so plainly.
    const denied = !!insertError && /row-level security/i.test(insertError.message);
    if (denied) return NextResponse.json({ error: 'You cannot send messages to this conversation right now.' }, { status: 403 });
    if (insertError && isMessageRequestLimit(insertError)) {
      return NextResponse.json({ error: MESSAGE_REQUEST_NOTICE, code: MESSAGE_REQUEST_CODE }, { status: 429 });
    }
    return serverError('messages.insert', insertError, 500, undefined, user.id);
  }
  return NextResponse.json(newMsg, { status: 201 });
}
