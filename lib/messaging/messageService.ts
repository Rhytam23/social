import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { MessagingCrypto } from './messagingCrypto';
import type { MessageEnvelope } from './envelope';

export interface ConversationSummary {
  id: string;
  type: 'private' | 'group';
  name: string | null;
  updatedAt: string;
  memberCount: number;
  memberIds: string[];
  otherParticipant?: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

export interface DecryptedMessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  replyToMessageId: string | null;
  envelope: MessageEnvelope | null;
  decryptError?: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

/** Loads every conversation the caller is an active member of. */
export async function fetchConversations(
  supabase: SupabaseClient<Database>,
  myUserId: string
): Promise<ConversationSummary[]> {
  const { data: memberRows, error: memberErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', myUserId)
    .is('left_at', null);

  if (memberErr) throw new Error(memberErr.message);
  const conversationIds = (memberRows || []).map((r) => r.conversation_id);
  if (conversationIds.length === 0) return [];

  const { data: conversations, error: convErr } = await supabase
    .from('conversations')
    .select('id, type, name, updated_at')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convErr) throw new Error(convErr.message);

  const { data: allMembers, error: allMembersErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, profiles(id, username, display_name, avatar_url)')
    .in('conversation_id', conversationIds)
    .is('left_at', null);

  if (allMembersErr) throw new Error(allMembersErr.message);

  const membersByConversation = new Map<string, Array<{ userId: string; profile: ProfileRow | null }>>();
  for (const row of (allMembers || []) as Array<{ conversation_id: string; user_id: string; profiles: ProfileRow | null }>) {
    const list = membersByConversation.get(row.conversation_id) || [];
    list.push({ userId: row.user_id, profile: row.profiles });
    membersByConversation.set(row.conversation_id, list);
  }

  return (conversations || []).map((conv) => {
    const members = membersByConversation.get(conv.id) || [];
    const summary: ConversationSummary = {
      id: conv.id,
      type: conv.type as 'private' | 'group',
      name: conv.name,
      updatedAt: conv.updated_at,
      memberCount: members.length,
      memberIds: members.map((m) => m.userId),
    };

    if (conv.type === 'private') {
      const other = members.find((m) => m.userId !== myUserId);
      if (other?.profile) {
        summary.otherParticipant = {
          id: other.profile.id,
          username: other.profile.username,
          displayName: other.profile.display_name,
          avatarUrl: other.profile.avatar_url,
        };
      }
    }

    return summary;
  });
}

async function decryptRow(
  crypto: MessagingCrypto,
  conversation: ConversationSummary,
  row: { id: string; conversation_id: string; sender_id: string; ciphertext: string; nonce: string; encryption_version: number; created_at: string; edited_at: string | null; deleted_at: string | null; reply_to_message_id: string | null }
): Promise<DecryptedMessageRow> {
  const base = {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    replyToMessageId: row.reply_to_message_id,
  };

  if (row.deleted_at) {
    return { ...base, envelope: null };
  }

  try {
    let envelope: MessageEnvelope;
    if (conversation.type === 'private') {
      if (!conversation.otherParticipant) {
        throw new Error('This conversation has no other participant to decrypt against');
      }
      envelope = await crypto.decryptWithParticipant(conversation.otherParticipant.id, {
        ciphertext: row.ciphertext,
        nonce: row.nonce,
        encryptionVersion: row.encryption_version,
      });
    } else {
      const { nonce, keyVersion } = JSON.parse(row.nonce) as { nonce: string; keyVersion: number };
      envelope = await crypto.decryptGroupEnvelope(conversation.id, {
        ciphertext: row.ciphertext,
        nonce,
        keyVersion,
        encryptionVersion: row.encryption_version,
      });
    }
    return { ...base, envelope };
  } catch (err) {
    return { ...base, envelope: null, decryptError: err instanceof Error ? err.message : 'Decryption failed' };
  }
}

/** Loads message history for a conversation (most recent `limit`, ascending). */
export async function fetchMessageHistory(
  supabase: SupabaseClient<Database>,
  crypto: MessagingCrypto,
  conversation: ConversationSummary,
  limit = 100
): Promise<DecryptedMessageRow[]> {
  const params = new URLSearchParams({ conversationId: conversation.id, limit: String(limit) });
  const res = await fetch(`/api/messages?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load messages (${res.status})`);
  }

  const rows = (await res.json()) as Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    ciphertext: string;
    nonce: string;
    encryption_version: number;
    reply_to_message_id: string | null;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
  }>;

  return Promise.all(rows.map((row) => decryptRow(crypto, conversation, row)));
}

interface SendResult {
  row: { id: string; conversation_id: string; sender_id: string; created_at: string };
}

/**
 * Encrypts `envelope` for the conversation and persists it via /api/messages
 * (server-verified sender identity + membership check + rate limit). Group
 * ciphertext carries its key version inside `nonce` as JSON, since the group
 * scheme needs {ciphertext, nonce, keyVersion} but `messages` only has two
 * free-form ciphertext/nonce columns.
 */
export async function sendEnvelope(
  crypto: MessagingCrypto,
  conversation: ConversationSummary,
  envelope: MessageEnvelope,
  replyToMessageId?: string
): Promise<SendResult> {
  let ciphertext: string;
  let nonce: string;
  let encryptionVersion: number;

  if (conversation.type === 'private') {
    if (!conversation.otherParticipant) {
      throw new Error('This conversation has no other participant to encrypt for');
    }
    const payload = await crypto.encryptForRecipient(conversation.otherParticipant.id, envelope);
    ciphertext = payload.ciphertext;
    nonce = payload.nonce;
    encryptionVersion = payload.encryptionVersion;
  } else {
    const payload = await crypto.encryptGroupEnvelope(conversation.id, envelope);
    ciphertext = payload.ciphertext;
    nonce = JSON.stringify({ nonce: payload.nonce, keyVersion: payload.keyVersion });
    encryptionVersion = payload.encryptionVersion;
  }

  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversation.id,
      ciphertext,
      nonce,
      encryptionVersion,
      replyToMessageId: replyToMessageId || null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to send message (${res.status})`);
  }

  const row = await res.json();
  return { row };
}
