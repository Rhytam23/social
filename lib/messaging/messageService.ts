import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { MessagingCrypto } from './messagingCrypto';
import type { MessageEnvelope } from './envelope';
import { adminDetail } from '../ui/errors';
import { isGroupRole, type GroupRole } from '../groups/roles';

export interface ConversationSummary {
  id: string;
  type: 'private' | 'group';
  name: string | null;
  updatedAt: string;
  memberCount: number;
  memberIds: string[];
  /** Group only (needs migration 013). */
  roles?: Record<string, GroupRole>;
  description?: string | null;
  onlyAdminsPost?: boolean;
  disappearAfter?: number | null;
  /** Set when this conversation is a community channel (needs migration 014). */
  communityId?: string;
  topic?: string | null;
  isPrivateChannel?: boolean;
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
  threadRootId?: string | null;
  expiresAt?: string | null;
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

  // description / only_admins_post / role come from migration 013; fall back if it is not applied yet.
  type ConvRow = {
    id: string;
    type: string;
    name: string | null;
    updated_at: string;
    description?: string | null;
    only_admins_post?: boolean;
    community_id?: string | null;
    topic?: string | null;
    is_private?: boolean;
    disappear_after?: number | null;
  };
  // Newest column set first; each older migration level is a fallback.
  const columnSets = [
    'id, type, name, updated_at, description, only_admins_post, community_id, topic, is_private, disappear_after',
    'id, type, name, updated_at, description, only_admins_post, community_id, topic, is_private',
    'id, type, name, updated_at, description, only_admins_post',
    'id, type, name, updated_at',
  ];
  let conversations: ConvRow[] = [];
  let lastError = '';
  for (const columns of columnSets) {
    const res = await supabase.from('conversations').select(columns).in('id', conversationIds).order('updated_at', { ascending: false });
    if (!res.error) {
      conversations = (res.data as unknown as ConvRow[]) || [];
      lastError = '';
      break;
    }
    lastError = res.error.message;
  }
  if (lastError) throw new Error(lastError);

  type MemberRow = { conversation_id: string; user_id: string; role?: string; profiles: ProfileRow | null };
  let allMembers: MemberRow[] | null = null;
  const withRoles = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, role, profiles(id, username, display_name, avatar_url)')
    .in('conversation_id', conversationIds)
    .is('left_at', null);
  if (withRoles.error) {
    const plainMembers = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id, profiles(id, username, display_name, avatar_url)')
      .in('conversation_id', conversationIds)
      .is('left_at', null);
    if (plainMembers.error) throw new Error(plainMembers.error.message);
    allMembers = plainMembers.data as unknown as MemberRow[];
  } else {
    allMembers = withRoles.data as unknown as MemberRow[];
  }

  const membersByConversation = new Map<string, Array<{ userId: string; role?: GroupRole; profile: ProfileRow | null }>>();
  for (const row of allMembers || []) {
    const list = membersByConversation.get(row.conversation_id) || [];
    list.push({ userId: row.user_id, role: isGroupRole(row.role) ? row.role : undefined, profile: row.profiles });
    membersByConversation.set(row.conversation_id, list);
  }

  return (conversations || []).map((conv) => {
    const members = membersByConversation.get(conv.id) || [];
    const summary: ConversationSummary = {
      id: conv.id,
      // A community channel behaves like a group for encryption and membership.
      type: conv.type === 'private' ? 'private' : 'group',
      name: conv.name,
      updatedAt: conv.updated_at,
      memberCount: members.length,
      memberIds: members.map((m) => m.userId),
    };

    summary.disappearAfter = conv.disappear_after ?? null;

    if (conv.community_id) {
      summary.communityId = conv.community_id;
      summary.topic = conv.topic ?? null;
      summary.isPrivateChannel = !!conv.is_private;
    }

    if (conv.type !== 'private') {
      if (members.some((m) => m.role)) {
        summary.roles = Object.fromEntries(members.map((m) => [m.userId, m.role ?? 'member'])) as Record<string, GroupRole>;
      }
      summary.description = conv.description ?? null;
      summary.onlyAdminsPost = conv.only_admins_post ?? false;
    }

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
  row: { id: string; conversation_id: string; sender_id: string; ciphertext: string; nonce: string; encryption_version: number; created_at: string; edited_at: string | null; deleted_at: string | null; reply_to_message_id: string | null; thread_root_id?: string | null; expires_at?: string | null }
): Promise<DecryptedMessageRow> {
  const base = {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    replyToMessageId: row.reply_to_message_id,
    threadRootId: row.thread_root_id ?? null,
    expiresAt: row.expires_at ?? null,
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
    return { ...base, envelope: null, decryptError: adminDetail(err, 'this message could not be read on this device') };
  }
}

/** Loads message history for a conversation (most recent `limit`, ascending). */
export async function fetchMessageHistory(
  crypto: MessagingCrypto,
  conversation: ConversationSummary,
  limit = 100,
  before?: string
): Promise<DecryptedMessageRow[]> {
  const params = new URLSearchParams({ conversationId: conversation.id, limit: String(limit) });
  if (before) params.set('before', before);
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
    thread_root_id?: string | null;
    expires_at?: string | null;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
  }>;

  return Promise.all(rows.map((row) => decryptRow(crypto, conversation, row)));
}

/**
 * The newest message of every conversation, in ONE request (needs migration 020 on the server).
 * Returns null when that is not available, so the caller can fall back to per-conversation requests.
 * Conversations without messages are simply absent from the map.
 */
export async function fetchLatestMessages(
  crypto: MessagingCrypto,
  conversations: ConversationSummary[]
): Promise<Map<string, DecryptedMessageRow> | null> {
  if (conversations.length === 0) return new Map();
  const res = await fetch('/api/messages/latest');
  if (!res.ok) return null;

  const rows = (await res.json()) as Array<Parameters<typeof decryptRow>[2]>;
  const byId = new Map(conversations.map((c) => [c.id, c]));
  const decrypted = await Promise.all(
    rows.flatMap((row) => {
      const conversation = byId.get(row.conversation_id);
      return conversation ? [decryptRow(crypto, conversation, row).then((d) => [row.conversation_id, d] as const)] : [];
    })
  );
  return new Map(decrypted);
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
  replyToMessageId?: string,
  threadRootId?: string
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
      threadRootId: threadRootId || null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to send message (${res.status})`);
  }

  const row = await res.json();
  return { row };
}
