import type { SupabaseClient } from '@supabase/supabase-js';
import { ConversationItem, MessageData, UserItem, DeviceItem, UserPresence } from '../../types/ui';
import { getPreferences } from '../prefs/preferences';
import type { Database } from '../../types/database';
import { MessagingCrypto } from '../messaging/messagingCrypto';
import { fetchConversations, fetchMessageHistory, sendEnvelope, type ConversationSummary, type DecryptedMessageRow } from '../messaging/messageService';
import { uploadEncryptedAttachment, downloadAndDecryptAttachment, MAX_ATTACHMENT_BYTES } from '../messaging/attachments';
import type { MessageEnvelope } from '../messaging/envelope';
import { envelopeToDisplay, isHiddenEnvelope, formatFileSize, formatDuration } from '../messaging/envelopeDisplay';
import { computeDeviceFingerprint, computeSafetyNumber } from '../../crypto';

export type StoreMode = 'connected' | 'demo';

/** Shape of a `messages` row as delivered by Supabase Realtime postgres_changes. */
export interface RealtimeMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  nonce: string;
  encryption_version: number;
  created_at: string;
  reply_to_message_id: string | null;
  thread_root_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
}

export interface ChatStoreState {
  mode: StoreMode;
  isLoading: boolean;
  currentUser: UserItem;
  allUsers: UserItem[];
  conversations: ConversationItem[];
  activeConversationId: string;
  messagesMap: Record<string, MessageData[]>;
  messagesLoading: Record<string, boolean>;
  devices: DeviceItem[];
  /** userIds currently typing, per conversation (ephemeral, never stored) */
  typing: Record<string, string[]>;
  /** Bookmarked messages (ids only; text stays end-to-end encrypted) */
  saved: Array<{ messageId: string; conversationId: string }>;
  error: string | null;
}

type Listener = () => void;

const STORAGE_KEY = 'private_chat_v1_demo_store';
const CURRENT_USER_KEY = 'private_chat_v1_demo_current_user_id';
const BROADCAST_CHANNEL_NAME = 'private_chat_v1_demo_channel';
const VIEW_PREFS_KEY_PREFIX = 'private_chat_v1_view_prefs_';

// ============================================================
// Local DEMO mode only (see lib/supabase/env.ts#isDemoModeAllowed).
// Never reachable in production - it exists purely so the UI can be
// previewed without provisioning Supabase. Nothing here talks to a real
// backend, and it must stay unmistakably separate from the real (mode ===
// 'connected') implementation below.
// ============================================================

const DEMO_USERS: UserItem[] = [
  { id: 'usr-alice', name: 'Alice Vance', registrationId: 84920, role: 'admin', deviceCount: 2, joinedAt: 'Sep 1, 2026', identityFingerprint: '45A8-99F1-20B3-881C-00D9-FF41-92A3-77E5', presence: 'online' },
  { id: 'usr-bob', name: 'Bob Miller', registrationId: 10482, role: 'member', deviceCount: 1, joinedAt: 'Sep 1, 2026', identityFingerprint: '992A-44B1-0081-F09C-1192-33E4-AA11-22BB', presence: 'online' },
  { id: 'usr-carol', name: 'Carol Danvers', registrationId: 30291, role: 'member', deviceCount: 1, joinedAt: 'Sep 2, 2026', identityFingerprint: '77A1-88C2-11D0-99E1-44B2-55C3-CC33-44DD', presence: 'away' },
  { id: 'usr-david', name: 'David Wright', registrationId: 90218, role: 'member', deviceCount: 3, joinedAt: 'Aug 28, 2026', identityFingerprint: '11B2-22C3-33D4-44E5-55F6-66A7-EE55-66FF', presence: 'offline' },
];

const DEMO_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-alice-bob', title: 'Bob Miller', type: 'direct', unreadCount: 0, isPinned: true,
    lastMessage: { snippet: 'Welcome to Private Chat! (demo data)', timestamp: '10:30 AM', status: 'read' },
    recipientUser: { id: 'usr-bob', name: 'Bob Miller', registrationId: 10482, identityFingerprint: '992A-44B1-0081-F09C-1192-33E4-AA11-22BB', isVerified: true, presence: 'online' },
  },
  {
    id: 'conv-security-team', title: 'Security Architecture Group', type: 'group', unreadCount: 0,
    lastMessage: { snippet: 'This is local demo data, not a real conversation.', timestamp: '09:15 AM', status: 'read' },
    groupMeta: { groupId: 'grp-security', memberCount: 4, senderKeyVersion: 1, memberIds: ['usr-alice', 'usr-bob', 'usr-carol', 'usr-david'] },
  },
];

const DEMO_MESSAGES: Record<string, MessageData[]> = {
  'conv-alice-bob': [
    { id: 'msg-init-1', conversationId: 'conv-alice-bob', senderId: 'usr-bob', senderName: 'Bob Miller', isSelf: false, content: 'Hey Alice! This is local demo mode - nothing here is sent to a server.', timestamp: '10:28 AM', status: 'read', reactions: [{ emoji: '👋', count: 1, userReacted: true }], encryptionVersion: 0 },
    { id: 'msg-init-2', conversationId: 'conv-alice-bob', senderId: 'usr-alice', senderName: 'Alice Vance', isSelf: true, content: 'Welcome to Private Chat! (demo data, not encrypted)', timestamp: '10:30 AM', status: 'read', replyTo: { id: 'msg-init-1', senderName: 'Bob Miller', snippet: 'Hey Alice! This is local demo mode - nothing here is sent to a server.' }, reactions: [{ emoji: '🔒', count: 1, userReacted: false }], encryptionVersion: 0 },
  ],
  'conv-security-team': [
    { id: 'gmsg-init-1', conversationId: 'conv-security-team', senderId: 'usr-alice', senderName: 'Alice Vance', isSelf: true, content: 'This is local demo data, not a real conversation.', timestamp: '09:15 AM', status: 'read', reactions: [{ emoji: '🚀', count: 3, userReacted: true }], encryptionVersion: 0 },
  ],
};

const DEMO_DEVICES: DeviceItem[] = [
  { id: 'dev-primary', deviceName: 'Primary Workstation (Web)', registrationId: 84920, lastActive: 'Active now', isCurrentDevice: true },
];

// ============================================================
// Shared helpers
// ============================================================

function nowTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function summaryToConversationItem(summary: ConversationSummary, existing?: ConversationItem): ConversationItem {
  return {
    id: summary.id,
    title: summary.type === 'private' ? summary.otherParticipant?.displayName || 'Direct message' : summary.name || 'Group',
    type: summary.type === 'private' ? 'direct' : 'group',
    unreadCount: existing?.unreadCount ?? 0,
    isPinned: existing?.isPinned,
    isMuted: existing?.isMuted,
    isArchived: existing?.isArchived,
    lastMessage: existing?.lastMessage || { snippet: 'No messages yet', timestamp: '' },
    recipientUser:
      summary.type === 'private' && summary.otherParticipant
        ? {
            id: summary.otherParticipant.id,
            name: summary.otherParticipant.displayName,
            registrationId: 0,
            identityFingerprint: '',
            isVerified: false,
            presence: 'offline',
          }
        : undefined,
    groupMeta:
      summary.type === 'group'
        ? {
            groupId: summary.id,
            memberCount: summary.memberCount,
            senderKeyVersion: 1,
            memberIds: summary.memberIds,
            roles: summary.roles,
            description: summary.description ?? undefined,
            onlyAdminsPost: summary.onlyAdminsPost,
          }
        : undefined,
  };
}


/** Derives the tick state of one of our messages from the recipients' receipts. */
function receiptStatus(
  receipts: Array<{ delivered_at: string | null; read_at: string | null }>,
  recipientCount: number
): MessageData['status'] {
  if (!getPreferences().privacy.readReceipts) return receipts.length > 0 ? 'delivered' : 'sent';
  const read = receipts.filter((r) => r.read_at).length;
  if (read >= Math.max(recipientCount, 1)) return 'read';
  if (receipts.length > 0) return 'delivered';
  return 'sent';
}

function decryptedRowToMessage(row: DecryptedMessageRow, currentUserId: string, senderName: string): MessageData {
  const { content, attachments, kind } = row.deletedAt
    ? { content: '', attachments: undefined, kind: 'text' as const }
    : envelopeToDisplay(row.envelope, row.decryptError);

  return {
    id: row.id,
    kind,
    threadRootId: row.threadRootId ?? undefined,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName,
    isSelf: row.senderId === currentUserId,
    content,
    timestamp: new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: row.senderId === currentUserId ? 'sent' : 'delivered',
    reactions: [],
    attachments,
    encryptionVersion: 2,
    isEdited: !!row.editedAt,
    isDeletedLocally: !!row.deletedAt,
  };
}

export class ChatStore {
  private state: ChatStoreState;
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  // Real-mode session context, set by initializeForUser() after login.
  private supabase: SupabaseClient<Database> | null = null;
  private crypto: MessagingCrypto | null = null;
  private conversationSummaries: Map<string, ConversationSummary> = new Map();
  private loadedConversations: Set<string> = new Set();
  private participantNames: Map<string, string> = new Map();

  constructor() {
    this.state = {
      mode: 'demo',
      isLoading: true,
      currentUser: DEMO_USERS[0],
      allUsers: [],
      conversations: [],
      activeConversationId: '',
      messagesMap: {},
      messagesLoading: {},
      devices: [],
      typing: {},
      saved: [],
      error: null,
    };
  }

  // --- Core store plumbing ---

  public getState(): ChatStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    // Many methods in this class mutate individual properties of `this.state`
    // in place (e.g. `this.state.messagesMap = {...}`) rather than going
    // through setState(). That's fine for the nested value itself, but the
    // top-level `this.state` object reference never changes as a result, and
    // useSyncExternalStore only re-renders when getSnapshot() returns a
    // reference that differs (via Object.is) from the last one it read.
    // Cloning the top level here - exactly once per notify(), never between
    // notifies - guarantees every call to notify() produces a genuinely new
    // snapshot without risking the infinite-loop React warns about if
    // getSnapshot() itself always returned a fresh object.
    this.state = { ...this.state };
    this.listeners.forEach((listener) => listener());
  }

  private setState(patch: Partial<ChatStoreState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  private updateMessage(conversationId: string, messageId: string, patch: Partial<MessageData>) {
    const list = this.state.messagesMap[conversationId] || [];
    this.state.messagesMap = {
      ...this.state.messagesMap,
      [conversationId]: list.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    };
    this.notify();
  }

  // --- Local per-device view preferences (pin/mute/archive) ---
  // Legitimate use of localStorage: this is per-viewer UI state, not message
  // content or a substitute for the real Supabase-backed message store.

  private viewPrefsKey(): string {
    return `${VIEW_PREFS_KEY_PREFIX}${this.state.currentUser.id}`;
  }

  private loadViewPrefs(): Record<string, { pinned?: boolean; muted?: boolean; archived?: boolean }> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(this.viewPrefsKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveViewPrefs(prefs: Record<string, { pinned?: boolean; muted?: boolean; archived?: boolean }>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.viewPrefsKey(), JSON.stringify(prefs));
    } catch {
      // Ignore storage quota errors.
    }
  }

  private applyViewPrefs(conversations: ConversationItem[]): ConversationItem[] {
    const prefs = this.loadViewPrefs();
    return conversations
      .map((c) => ({ ...c, isPinned: !!prefs[c.id]?.pinned, isMuted: !!prefs[c.id]?.muted, isArchived: !!prefs[c.id]?.archived }))
      .filter((c) => !c.isArchived);
  }

  // ============================================================
  // REAL (Supabase-backed) mode
  // ============================================================

  public async initializeForUser(
    supabase: SupabaseClient<Database>,
    crypto: MessagingCrypto,
    profile: { id: string; name: string; username?: string; email?: string; phoneNumber?: string; bio?: string; pronouns?: string; timezone?: string; role: 'admin' | 'member' }
  ): Promise<void> {
    this.supabase = supabase;
    this.crypto = crypto;

    const fingerprint = crypto.hasIdentity() ? await crypto.myFingerprint() : '';

    this.setState({
      mode: 'connected',
      isLoading: true,
      error: null,
      currentUser: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        bio: profile.bio,
        pronouns: profile.pronouns,
        timezone: profile.timezone,
        registrationId: Math.abs(hashCode(profile.id)) % 90000 + 10000,
        role: profile.role,
        deviceCount: 1,
        joinedAt: 'Active',
        identityFingerprint: fingerprint,
        presence: 'online',
      },
    });

    try {
      await Promise.all([this.loadConversationsReal(), this.loadAllUsersReal(), this.loadDevicesReal()]);
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Failed to load your data' });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async loadConversationsReal(): Promise<void> {
    if (!this.supabase) return;
    const summaries = await fetchConversations(this.supabase, this.state.currentUser.id);
    this.conversationSummaries = new Map(summaries.map((s) => [s.id, s]));
    for (const s of summaries) {
      if (s.otherParticipant) this.participantNames.set(s.otherParticipant.id, s.otherParticipant.displayName);
    }

    for (const s of summaries) {
      if (s.type === 'group' && !this.lastMemberIds.has(s.id)) this.lastMemberIds.set(s.id, s.memberIds);
    }
    const existingById = new Map(this.state.conversations.map((c) => [c.id, c]));
    const items = this.applyViewPrefs(summaries.map((s) => summaryToConversationItem(s, existingById.get(s.id))));

    this.setState({
      conversations: items,
      activeConversationId: this.state.activeConversationId || items[0]?.id || '',
    });

    // Best-effort safety-number computation for each 1:1 conversation, so
    // Settings -> Verify safety number shows a real, comparable fingerprint
    // instead of an empty string.
    if (this.crypto) {
      await Promise.all(
        summaries
          .filter((s) => s.type === 'private' && s.otherParticipant)
          .map(async (s) => {
            try {
              const peer = await this.crypto!.getPeerDevice(s.otherParticipant!.id);
              if (!peer) return;
              const safetyNumber = await computeSafetyNumber(this.crypto!.myPublicKeyB64(), peer.publicKeyB64);
              this.state.conversations = this.state.conversations.map((c) =>
                c.id === s.id && c.recipientUser ? { ...c, recipientUser: { ...c.recipientUser, identityFingerprint: safetyNumber } } : c
              );
            } catch {
              // Peer hasn't set up a device yet - leave the fingerprint blank.
            }
          })
      );
      this.notify();
    }

    // Best-effort last-message preview for each conversation.
    await Promise.all(
      summaries.map(async (s) => {
        try {
          const history = await fetchMessageHistory(this.crypto!, s, 1);
          const last = history[history.length - 1];
          if (!last) return;
          const lastVisible = [...history].reverse().find((m) => !isHiddenEnvelope(m.envelope));
          if (!lastVisible) return;
          const { snippet } = envelopeToDisplay(lastVisible.envelope, lastVisible.decryptError);
          this.state.conversations = this.state.conversations.map((c) =>
            c.id === s.id
              ? { ...c, lastMessage: { snippet, timestamp: new Date(lastVisible.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } }
              : c
          );
        } catch {
          // Preview is best-effort only; leave the default snippet.
        }
      })
    );
    this.notify();
    void this.loadUnreadCounts();
  }

  private async loadAllUsersReal(): Promise<void> {
    const res = await fetch('/api/users');
    if (!res.ok) return;
    const profiles = (await res.json()) as Array<{ id: string; username: string; display_name: string; avatar_url: string | null; bio?: string | null; pronouns?: string | null; timezone?: string | null }>;
    const users: UserItem[] = profiles.map((p) => ({
      id: p.id,
      name: p.display_name,
      username: p.username,
      avatarUrl: p.avatar_url ?? undefined,
      bio: p.bio ?? undefined,
      pronouns: p.pronouns ?? undefined,
      timezone: p.timezone ?? undefined,
      registrationId: Math.abs(hashCode(p.id)) % 90000 + 10000,
      role: 'member',
      deviceCount: 1,
      joinedAt: '',
      identityFingerprint: '',
      presence: 'offline',
    }));
    this.setState({ allUsers: users });
  }

  private async loadDevicesReal(): Promise<void> {
    if (!this.supabase || !this.crypto) return;
    const { data } = await this.supabase
      .from('user_devices')
      .select('device_id, identity_public_key, last_seen_at')
      .eq('user_id', this.state.currentUser.id)
      .order('last_seen_at', { ascending: false });

    const myDeviceId = this.crypto.myDeviceId();
    const devices: DeviceItem[] = await Promise.all(
      (data || []).map(async (d) => ({
        id: d.device_id,
        deviceName: d.device_id === myDeviceId ? 'This device' : `Device ${(await computeDeviceFingerprint(d.identity_public_key)).slice(0, 9)}`,
        registrationId: 0,
        lastActive: new Date(d.last_seen_at).toLocaleString(),
        isCurrentDevice: d.device_id === myDeviceId,
      }))
    );
    this.setState({ devices });
  }

  public selectConversation(conversationId: string) {
    this.state.activeConversationId = conversationId;
    this.state.conversations = this.state.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    this.notify();

    if (this.state.mode === 'connected') {
      if (!this.loadedConversations.has(conversationId)) {
        void this.loadMessagesForConversation(conversationId);
      } else {
        void this.markConversationRead(conversationId);
      }
    }
  }

  public async loadMessagesForConversation(conversationId: string): Promise<void> {
    if (this.state.mode !== 'connected' || !this.supabase || !this.crypto) return;
    const summary = this.conversationSummaries.get(conversationId);
    if (!summary) return;

    this.state.messagesLoading = { ...this.state.messagesLoading, [conversationId]: true };
    this.notify();

    try {
      const rows = await fetchMessageHistory(this.crypto, summary);
      const senderName = (id: string) =>
        id === this.state.currentUser.id ? this.state.currentUser.name : this.participantNames.get(id) || this.state.allUsers.find((u) => u.id === id)?.name || 'Member';

      const messages = rows
        .filter((r) => r.deletedAt || !isHiddenEnvelope(r.envelope))
        .map((r) => decryptedRowToMessage(r, this.state.currentUser.id, senderName(r.senderId)));
      this.state.messagesMap = { ...this.state.messagesMap, [conversationId]: messages };
      this.loadedConversations.add(conversationId);
      if (rows.length > 0) this.oldestCursor.set(conversationId, rows[0].createdAt);
      this.moreHistory.set(conversationId, rows.length >= 100);
      this.state.messagesLoading = { ...this.state.messagesLoading, [conversationId]: false };
      this.notify();
      void this.loadReactionsAndReceipts(conversationId);
      if (conversationId === this.state.activeConversationId) void this.markConversationRead(conversationId);
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Failed to load messages' });
    } finally {
      this.state.messagesLoading = { ...this.state.messagesLoading, [conversationId]: false };
      this.notify();
    }
  }

  private async decryptRealtimeRow(summary: ConversationSummary, row: RealtimeMessageRow): Promise<DecryptedMessageRow> {
    const base = {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      createdAt: row.created_at,
      editedAt: row.edited_at ?? null,
      deletedAt: row.deleted_at ?? null,
      replyToMessageId: row.reply_to_message_id,
      threadRootId: row.thread_root_id ?? null,
    };
    try {
      if (!this.crypto) throw new Error('Encryption session not ready');
      let envelope: MessageEnvelope;
      if (summary.type === 'private') {
        if (!summary.otherParticipant) throw new Error('Missing participant');
        envelope = await this.crypto.decryptWithParticipant(summary.otherParticipant.id, {
          ciphertext: row.ciphertext,
          nonce: row.nonce,
          encryptionVersion: row.encryption_version,
        });
      } else {
        const { nonce, keyVersion } = JSON.parse(row.nonce) as { nonce: string; keyVersion: number };
        envelope = await this.crypto.decryptGroupEnvelope(row.conversation_id, {
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

  /** Called by the realtime postgres_changes UPDATE subscription: live edits and soft-deletes from other users. */
  public async receiveRealtimeMessageUpdate(row: RealtimeMessageRow): Promise<void> {
    if (!this.crypto) return;
    const summary = this.conversationSummaries.get(row.conversation_id);
    const list = this.state.messagesMap[row.conversation_id];
    const existing = list?.find((m) => m.id === row.id);
    if (!summary || !list || !existing) return;

    if (row.deleted_at) {
      if (existing.isDeletedLocally) return;
      this.updateMessage(row.conversation_id, row.id, { isDeletedLocally: true, content: '', attachments: undefined });
      return;
    }

    if (row.edited_at) {
      const decrypted = await this.decryptRealtimeRow(summary, row);
      if (!decrypted.envelope) return;
      const { content, snippet } = envelopeToDisplay(decrypted.envelope);
      if (existing.content === content && existing.isEdited) return;
      this.updateMessage(row.conversation_id, row.id, { content, isEdited: true });
      if ((this.state.messagesMap[row.conversation_id] || []).at(-1)?.id === row.id) {
        this.state.conversations = this.state.conversations.map((c) =>
          c.id === row.conversation_id ? { ...c, lastMessage: { ...c.lastMessage, snippet, timestamp: c.lastMessage?.timestamp ?? '' } } : c
        );
        this.notify();
      }
    }
  }

  /** Called by the realtime postgres_changes subscription in app/page.tsx. */
  public async receiveRealtimeMessageRow(row: RealtimeMessageRow): Promise<void> {
    if (!this.crypto) return;
    const summary = this.conversationSummaries.get(row.conversation_id);
    if (!summary) {
      // A message arrived for a conversation we don't know about yet
      // (e.g. we were just added to a group) - refresh the list.
      await this.loadConversationsReal();
      return;
    }

    const currentMsgs = this.state.messagesMap[row.conversation_id] || [];
    if (currentMsgs.some((m) => m.id === row.id)) return; // already reconciled from our own send

    const decrypted = await this.decryptRealtimeRow(summary, row);

    if (isHiddenEnvelope(decrypted.envelope)) return;

    const senderName = decrypted.senderId === this.state.currentUser.id ? this.state.currentUser.name : this.participantNames.get(decrypted.senderId) || 'Member';
    const message = decryptedRowToMessage(decrypted, this.state.currentUser.id, senderName);
    const isSelf = decrypted.senderId === this.state.currentUser.id;
    const { snippet } = envelopeToDisplay(decrypted.envelope, decrypted.decryptError);

    this.state.messagesMap = { ...this.state.messagesMap, [row.conversation_id]: [...currentMsgs, message] };
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === row.conversation_id
        ? {
            ...c,
            unreadCount: !isSelf && this.state.activeConversationId !== row.conversation_id ? c.unreadCount + 1 : c.unreadCount,
            lastMessage: { snippet, timestamp: message.timestamp },
          }
        : c
    );
    this.loadedConversations.add(row.conversation_id);
    this.notify();

    if (!isSelf) {
      const viewing = this.state.activeConversationId === row.conversation_id && (typeof document === 'undefined' || document.visibilityState === 'visible');
      if (viewing) void this.markConversationRead(row.conversation_id);
      else void this.writeReceipts([row.id], false);
    }
  }

  public async sendMessage(content: string, replyToId?: string, attachmentFile?: File, voiceDurationMs?: number, threadRootId?: string): Promise<void> {
    if (this.state.mode === 'demo') return this.sendMessageDemo(content, replyToId, attachmentFile, threadRootId);

    const conversationId = this.state.activeConversationId;
    const summary = this.conversationSummaries.get(conversationId);
    if (!conversationId || !summary || !this.crypto) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isVoice = !!attachmentFile && attachmentFile.name.startsWith('voice-note-');

    const optimistic: MessageData = {
      id: localId,
      conversationId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      isSelf: true,
      threadRootId,
      content: isVoice ? '' : content,
      timestamp: nowTimestamp(),
      status: 'sending',
      reactions: [],
      attachments: attachmentFile
        ? [
            {
              id: localId,
              fileName: attachmentFile.name,
              fileSize: formatFileSize(attachmentFile.size),
              mimeType: attachmentFile.type || 'application/octet-stream',
              isEncrypted: true,
              isVoiceNote: isVoice,
              duration: isVoice && voiceDurationMs ? formatDuration(voiceDurationMs) : undefined,
              storagePath: '',
              keyB64: '',
              ivB64: '',
            },
          ]
        : undefined,
      encryptionVersion: 2,
    };

    this.state.messagesMap = { ...this.state.messagesMap, [conversationId]: [...(this.state.messagesMap[conversationId] || []), optimistic] };
    this.notify();

    try {
      let envelope: MessageEnvelope;
      if (attachmentFile) {
        if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
          throw new Error('File exceeds the 25MB limit');
        }
        const attachmentEnvelope = await uploadEncryptedAttachment(conversationId, attachmentFile);
        envelope = isVoice
          ? { v: 1, kind: 'voice', attachment: attachmentEnvelope, durationMs: voiceDurationMs || 0 }
          : { v: 1, kind: 'attachment', text: content || undefined, attachment: attachmentEnvelope };
      } else {
        envelope = { v: 1, kind: 'text', text: content };
      }

      const { row } = await sendEnvelope(this.crypto, summary, envelope, replyToId, threadRootId);

      const { content: finalContent, snippet: finalSnippet, kind: finalKind, attachments } = envelopeToDisplay(envelope);
      this.state.messagesMap = {
        ...this.state.messagesMap,
        [conversationId]: (this.state.messagesMap[conversationId] || []).map((m) =>
          m.id === localId ? { ...m, id: row.id, kind: finalKind, content: finalContent, attachments, status: 'sent' as const, timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : m
        ),
      };
      this.state.conversations = this.state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: { snippet: finalSnippet, timestamp: nowTimestamp() } } : c
      );
      this.notify();
    } catch (err) {
      this.updateMessage(conversationId, localId, { status: 'failed' });
      this.setState({ error: err instanceof Error ? err.message : 'Failed to send message' });
    }
  }

  public async retryFailedMessage(messageId: string): Promise<void> {
    const conversationId = this.state.activeConversationId;
    const list = this.state.messagesMap[conversationId] || [];
    const failed = list.find((m) => m.id === messageId && m.status === 'failed');
    if (!failed) return;
    this.state.messagesMap = { ...this.state.messagesMap, [conversationId]: list.filter((m) => m.id !== messageId) };
    await this.sendMessage(failed.content, failed.replyTo?.id);
  }

  public async downloadAttachment(messageId: string, attachmentId: string): Promise<void> {
    if (!this.supabase) return;
    const conversationId = this.state.activeConversationId;
    const list = this.state.messagesMap[conversationId] || [];
    const msg = list.find((m) => m.id === messageId);
    const attachment = msg?.attachments?.find((a) => a.id === attachmentId);
    if (!attachment || !attachment.storagePath) return;

    this.updateMessage(conversationId, messageId, {
      attachments: msg!.attachments!.map((a) => (a.id === attachmentId ? { ...a, isDownloading: true, downloadError: undefined } : a)),
    });

    try {
      const blob = await downloadAndDecryptAttachment(this.supabase, attachment);
      const url = URL.createObjectURL(blob);
      const current = this.state.messagesMap[conversationId] || [];
      const target = current.find((m) => m.id === messageId);
      this.updateMessage(conversationId, messageId, {
        attachments: target?.attachments?.map((a) => (a.id === attachmentId ? { ...a, url, isDownloading: false } : a)),
      });
    } catch (err) {
      const current = this.state.messagesMap[conversationId] || [];
      const target = current.find((m) => m.id === messageId);
      this.updateMessage(conversationId, messageId, {
        attachments: target?.attachments?.map((a) => (a.id === attachmentId ? { ...a, isDownloading: false, downloadError: err instanceof Error ? err.message : 'Download failed' } : a)),
      });
    }
  }

  public async editMessage(msgId: string, newContent: string): Promise<void> {
    if (this.state.mode === 'demo') return this.editMessageDemo(msgId, newContent);
    const conversationId = this.state.activeConversationId;
    const summary = this.conversationSummaries.get(conversationId);
    if (!summary || !this.crypto) return;

    try {
      const envelope: MessageEnvelope = { v: 1, kind: 'text', text: newContent };
      let ciphertext: string, nonce: string, encryptionVersion: number;
      if (summary.type === 'private') {
        const payload = await this.crypto.encryptForRecipient(summary.otherParticipant!.id, envelope);
        ({ ciphertext, nonce, encryptionVersion } = payload);
      } else {
        const payload = await this.crypto.encryptGroupEnvelope(conversationId, envelope);
        ciphertext = payload.ciphertext;
        nonce = JSON.stringify({ nonce: payload.nonce, keyVersion: payload.keyVersion });
        encryptionVersion = payload.encryptionVersion;
      }

      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, ciphertext, nonce, encryptionVersion }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to edit message');
      }

      this.updateMessage(conversationId, msgId, { content: newContent, isEdited: true });
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Failed to edit message' });
    }
  }

  public async deleteMessage(msgId: string): Promise<void> {
    if (this.state.mode === 'demo') return this.deleteMessageDemo(msgId);
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, deleted: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete message');
      }
      this.updateMessage(this.state.activeConversationId, msgId, { isDeletedLocally: true, content: '' });
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Failed to delete message' });
    }
  }

  public async reactToMessage(msgId: string, emoji: string): Promise<void> {
    if (this.state.mode === 'demo') return this.reactToMessageDemo(msgId, emoji);
    if (!this.supabase) return;
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    const msg = list.find((m) => m.id === msgId);
    if (!msg) return;

    const existing = msg.reactions.find((r) => r.emoji === emoji);
    const optimisticReactions = existing?.userReacted
      ? msg.reactions.map((r) => (r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), userReacted: false } : r)).filter((r) => r.count > 0)
      : [...msg.reactions.filter((r) => r.emoji !== emoji), { emoji, count: (existing?.count || 0) + 1, userReacted: true }];
    this.updateMessage(convId, msgId, { reactions: optimisticReactions });

    try {
      if (existing?.userReacted) {
        await this.supabase.from('message_reactions').delete().eq('message_id', msgId).eq('user_id', this.state.currentUser.id).eq('reaction', emoji);
      } else {
        await this.supabase.from('message_reactions').insert({ message_id: msgId, user_id: this.state.currentUser.id, reaction: emoji } as never);
      }
    } catch (err) {
      this.updateMessage(convId, msgId, { reactions: msg.reactions }); // roll back
      this.setState({ error: err instanceof Error ? err.message : 'Failed to react to message' });
    }
  }

  public async forwardMessage(targetConvId: string, msgToForward: MessageData): Promise<void> {
    if (this.state.mode === 'demo') return this.forwardMessageDemo(targetConvId, msgToForward);
    const summary = this.conversationSummaries.get(targetConvId);
    if (!summary || !this.crypto) return;
    const previousActive = this.state.activeConversationId;
    this.state.activeConversationId = targetConvId;
    await this.sendMessage(msgToForward.content);
    this.state.activeConversationId = previousActive;
    this.notify();
  }

  public async createDirectConversation(targetUser: UserItem): Promise<string> {
    if (this.state.mode === 'demo') return this.createDirectConversationDemo(targetUser);

    const existing = Array.from(this.conversationSummaries.values()).find((s) => s.type === 'private' && s.otherParticipant?.id === targetUser.id);
    if (existing) {
      this.selectConversation(existing.id);
      return existing.id;
    }

    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'private', participantIds: [targetUser.id] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to start conversation' });
      return '';
    }
    const conv = await res.json();
    await this.loadConversationsReal();
    this.selectConversation(conv.id);
    return conv.id;
  }

  public async createGroupConversation(groupName: string, memberUserIds: string[]): Promise<string> {
    if (this.state.mode === 'demo') return this.createGroupConversationDemo(groupName, memberUserIds);
    if (!this.crypto || !this.supabase) return '';

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, memberIds: memberUserIds }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to create group' });
      return '';
    }
    const group = await res.json();

    await this.distributeNewGroupKey(group.id, [this.state.currentUser.id, ...memberUserIds], 1);
    await this.loadConversationsReal();
    this.selectConversation(group.id);
    return group.id;
  }

  /** Generates a fresh group key and re-shares it with exactly `memberUserIds`. */
  private async distributeNewGroupKey(conversationId: string, memberUserIds: string[], keyVersion: number): Promise<void> {
    if (!this.crypto || !this.supabase) return;

    const members: Array<{ userId: string; deviceId: string; publicKeyB64: string }> = [];
    for (const userId of memberUserIds) {
      const device = await this.crypto.getPeerDevice(userId);
      if (device) members.push({ userId, deviceId: device.deviceId, publicKeyB64: device.publicKeyB64 });
    }
    // Always include our own device so we can read our own group messages back.
    if (!members.some((m) => m.userId === this.state.currentUser.id)) {
      members.push({ userId: this.state.currentUser.id, deviceId: this.crypto.myDeviceId(), publicKeyB64: this.crypto.myPublicKeyB64() });
    }

    const envelopes = await this.crypto.createAndDistributeGroupKey(conversationId, keyVersion, members);
    if (envelopes.length === 0) return;

    const rows = envelopes.map((e) => ({
      conversation_id: conversationId,
      user_id: e.recipientUserId,
      device_id: e.recipientDeviceId,
      encrypted_group_key: e.encryptedGroupKey,
      key_version: e.keyVersion,
    }));
    await this.supabase.from('group_key_envelopes').insert(rows as never);
  }

  public async addGroupMember(groupId: string, userId: string): Promise<void> {
    if (!this.supabase) return;
    const res = await fetch('/api/groups/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to add member' });
      return;
    }

    const { data: members } = await this.supabase.from('conversation_members').select('user_id').eq('conversation_id', groupId).is('left_at', null);
    const nextVersion = ((await this.crypto?.ensureGroupKey(groupId))?.version || 0) + 1;
    await this.distributeNewGroupKey(groupId, (members || []).map((m) => m.user_id), nextVersion);
    await this.loadConversationsReal();
    void this.sendSystemNote(groupId, `${this.state.currentUser.name} added ${this.nameOf(userId)}`);
  }

  public async removeGroupMember(groupId: string, userId: string): Promise<void> {
    if (!this.supabase) return;
    const params = new URLSearchParams({ groupId, userId });
    const res = await fetch(`/api/groups/members?${params.toString()}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to remove member' });
      return;
    }

    const { data: members } = await this.supabase.from('conversation_members').select('user_id').eq('conversation_id', groupId).is('left_at', null);
    const nextVersion = ((await this.crypto?.ensureGroupKey(groupId))?.version || 0) + 1;
    // Rotating to only the remaining members means the removed member never
    // receives this envelope and can't decrypt anything sent after this point.
    await this.distributeNewGroupKey(groupId, (members || []).map((m) => m.user_id), nextVersion);
    await this.loadConversationsReal();
    void this.sendSystemNote(groupId, `${this.state.currentUser.name} removed ${this.nameOf(userId)}`);
  }

  public async toggleUserRole(userId: string, currentRole: 'admin' | 'member'): Promise<void> {
    if (this.state.mode === 'demo') return this.toggleUserRoleDemo(userId, currentRole);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: currentRole !== 'admin' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to update role' });
      return;
    }
    this.state.allUsers = this.state.allUsers.map((u) => (u.id === userId ? { ...u, role: currentRole === 'admin' ? 'member' : 'admin' } : u));
    this.notify();
  }

  public async revokeDevice(deviceId: string): Promise<void> {
    if (this.state.mode === 'demo') return this.revokeDeviceDemo(deviceId);
    if (!this.supabase) return;
    const device = this.state.devices.find((d) => d.id === deviceId);
    if (device?.isCurrentDevice) {
      this.setState({ error: 'Use "Log out" to sign out this device.' });
      return;
    }
    await this.supabase.from('user_devices').delete().eq('user_id', this.state.currentUser.id).eq('device_id', deviceId);
    this.state.devices = this.state.devices.filter((d) => d.id !== deviceId);
    this.notify();
  }

  // ============================================================
  // Local, view-only conversation preferences (both modes)
  // ============================================================

  public pinConversation(convId: string) {
    this.toggleViewPref(convId, 'pinned');
  }
  public muteConversation(convId: string) {
    this.toggleViewPref(convId, 'muted');
  }
  public archiveConversation(convId: string) {
    this.toggleViewPref(convId, 'archived');
  }

  private toggleViewPref(convId: string, key: 'pinned' | 'muted' | 'archived') {
    const prefs = this.loadViewPrefs();
    prefs[convId] = { ...prefs[convId], [key]: !prefs[convId]?.[key] };
    this.saveViewPrefs(prefs);
    this.state.conversations =
      key === 'archived' && prefs[convId].archived
        ? this.state.conversations.filter((c) => c.id !== convId)
        : this.state.conversations.map((c) => (c.id === convId ? { ...c, [key === 'pinned' ? 'isPinned' : key === 'muted' ? 'isMuted' : 'isArchived']: prefs[convId][key] } : c));
    this.notify();
  }

  public markUnreadConversation(convId: string) {
    this.state.conversations = this.state.conversations.map((c) => (c.id === convId ? { ...c, unreadCount: c.unreadCount > 0 ? 0 : 1 } : c));
    this.notify();
  }

  public clearHistoryConversation(convId: string) {
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: [] };
    this.notify();
  }

  public deleteConversationLocally(convId: string) {
    this.state.conversations = this.state.conversations.filter((c) => c.id !== convId);
    const nextMap = { ...this.state.messagesMap };
    delete nextMap[convId];
    this.state.messagesMap = nextMap;
    if (this.state.activeConversationId === convId && this.state.conversations.length > 0) {
      this.state.activeConversationId = this.state.conversations[0].id;
    }
    this.notify();
  }

  public pinMessage(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: list.map((m) => (m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)) };
    this.state.conversations = this.state.conversations.map((c) => (c.id === convId ? { ...c, pinnedMessageId: c.pinnedMessageId === msgId ? undefined : msgId } : c));
    this.notify();
  }

  public starMessage(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: list.map((m) => (m.id === msgId ? { ...m, isStarred: !m.isStarred } : m)) };
    this.notify();
  }


  // ============================================================
  // Live state: reactions, receipts, unread, history paging, presence,
  // typing and saved messages. All of it goes through Supabase (RLS
  // applies); nothing here stores message text on the server.
  // ============================================================

  private receiptsWritten: Set<string> = new Set();

  private async unreadCountsFromServer(): Promise<Record<string, number>> {
    if (!this.supabase) return {};
    try {
      const untyped = this.supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: Array<{ conversation_id: string; unread: number }> | null; error: unknown }>;
      };
      const { data, error } = await untyped.rpc('get_unread_counts');
      if (error || !data) return {};
      return Object.fromEntries(data.map((r) => [r.conversation_id, Number(r.unread)]));
    } catch {
      return {}; // migration 012 not applied yet
    }
  }

  /** Replaces the in-memory unread counters with the server's (survives reloads and other tabs). */
  private async loadUnreadCounts(): Promise<void> {
    const counts = await this.unreadCountsFromServer();
    if (Object.keys(counts).length === 0) return;
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === this.state.activeConversationId ? c : { ...c, unreadCount: counts[c.id] ?? c.unreadCount }
    );
    this.notify();
  }

  /** Loads reactions and read receipts for the messages currently in memory for a conversation. */
  public async loadReactionsAndReceipts(conversationId: string): Promise<void> {
    if (this.state.mode !== 'connected' || !this.supabase) return;
    const list = this.state.messagesMap[conversationId] || [];
    const ids = list.filter((m) => !m.id.startsWith('local-')).map((m) => m.id);
    if (ids.length === 0) return;
    const me = this.state.currentUser.id;

    try {
      const { data: reactionRows } = await this.supabase.from('message_reactions').select('message_id, user_id, reaction').in('message_id', ids);
      const byMessage = new Map<string, Map<string, { count: number; mine: boolean }>>();
      for (const r of (reactionRows as Array<{ message_id: string; user_id: string; reaction: string }> | null) || []) {
        const perEmoji = byMessage.get(r.message_id) ?? new Map();
        const cur = perEmoji.get(r.reaction) ?? { count: 0, mine: false };
        perEmoji.set(r.reaction, { count: cur.count + 1, mine: cur.mine || r.user_id === me });
        byMessage.set(r.message_id, perEmoji);
      }

      const ownIds = list.filter((m) => m.isSelf && !m.id.startsWith('local-')).map((m) => m.id);
      const receipts = new Map<string, Array<{ user_id: string; delivered_at: string | null; read_at: string | null }>>();
      if (ownIds.length > 0) {
        const { data: receiptRows } = await this.supabase.from('message_receipts').select('message_id, user_id, delivered_at, read_at').in('message_id', ownIds);
        for (const r of (receiptRows as Array<{ message_id: string; user_id: string; delivered_at: string | null; read_at: string | null }> | null) || []) {
          receipts.set(r.message_id, [...(receipts.get(r.message_id) ?? []), r]);
        }
      }

      const summary = this.conversationSummaries.get(conversationId);
      const others = (summary?.memberIds || []).filter((id) => id !== me);
      this.state.messagesMap = {
        ...this.state.messagesMap,
        [conversationId]: (this.state.messagesMap[conversationId] || []).map((m) => {
          const perEmoji = byMessage.get(m.id);
          const patch: Partial<MessageData> = {
            reactions: perEmoji ? [...perEmoji.entries()].map(([emoji, v]) => ({ emoji, count: v.count, userReacted: v.mine })) : m.reactions,
          };
          if (m.isSelf) patch.status = receiptStatus(receipts.get(m.id) || [], others.length || 1);
          return { ...m, ...patch };
        }),
      };
      this.notify();
    } catch {
      // best effort: reactions/receipts simply stay as loaded
    }
  }

  /** Applies a Realtime change to message_reactions (someone else's reaction, or ours from another tab). */
  public applyReactionEvent(kind: 'INSERT' | 'DELETE', row: { message_id?: string; user_id?: string; reaction?: string }): void {
    if (!row.message_id || !row.reaction || !row.user_id) return;
    if (row.user_id === this.state.currentUser.id) return; // our own change is applied optimistically
    for (const [convId, list] of Object.entries(this.state.messagesMap)) {
      if (!list.some((m) => m.id === row.message_id)) continue;
      this.state.messagesMap = {
        ...this.state.messagesMap,
        [convId]: list.map((m) => {
          if (m.id !== row.message_id) return m;
          const existing = m.reactions.find((r) => r.emoji === row.reaction);
          if (kind === 'INSERT') {
            return {
              ...m,
              reactions: existing
                ? m.reactions.map((r) => (r.emoji === row.reaction ? { ...r, count: r.count + 1 } : r))
                : [...m.reactions, { emoji: row.reaction!, count: 1, userReacted: false }],
            };
          }
          return {
            ...m,
            reactions: m.reactions
              .map((r) => (r.emoji === row.reaction ? { ...r, count: Math.max(0, r.count - 1) } : r))
              .filter((r) => r.count > 0),
          };
        }),
      };
      this.notify();
      return;
    }
  }

  /** Applies a Realtime change to message_receipts so ticks update live. */
  public applyReceiptRow(row: { message_id?: string; user_id?: string; delivered_at?: string | null; read_at?: string | null }): void {
    if (!row.message_id || !row.user_id || row.user_id === this.state.currentUser.id) return;
    if (!getPreferences().privacy.readReceipts) return; // reciprocal: hide theirs if we hide ours
    for (const [convId, list] of Object.entries(this.state.messagesMap)) {
      const msg = list.find((m) => m.id === row.message_id);
      if (!msg || !msg.isSelf) continue;
      const others = (this.conversationSummaries.get(convId)?.memberIds || []).filter((id) => id !== this.state.currentUser.id).length || 1;
      const seen = this.receiptSeen.get(row.message_id) ?? new Map<string, { delivered: boolean; read: boolean }>();
      seen.set(row.user_id, { delivered: !!row.delivered_at || !!row.read_at, read: !!row.read_at });
      this.receiptSeen.set(row.message_id, seen);
      const rows = [...seen.values()].map((v) => ({ user_id: '', delivered_at: v.delivered ? 'x' : null, read_at: v.read ? 'x' : null }));
      this.updateMessage(convId, msg.id, { status: receiptStatus(rows, others) });
      return;
    }
  }

  private receiptSeen: Map<string, Map<string, { delivered: boolean; read: boolean }>> = new Map();

  private async writeReceipts(messageIds: string[], read: boolean): Promise<void> {
    if (!this.supabase || !getPreferences().privacy.readReceipts) return;
    const fresh = messageIds.filter((id) => !this.receiptsWritten.has(`${id}:${read ? 'r' : 'd'}`) && !id.startsWith('local-'));
    if (fresh.length === 0) return;
    const now = new Date().toISOString();
    const me = this.state.currentUser.id;
    try {
      const { error } = await this.supabase.from('message_receipts').upsert(
        fresh.slice(0, 100).map((id) => ({ message_id: id, user_id: me, delivered_at: now, ...(read ? { read_at: now } : {}) })) as never,
        { onConflict: 'message_id,user_id' }
      );
      if (!error) fresh.slice(0, 100).forEach((id) => this.receiptsWritten.add(`${id}:${read ? 'r' : 'd'}`));
    } catch {
      // receipts are best effort
    }
  }

  /** Marks a conversation read: clears the badge, saves last_read_at, and sends read receipts if enabled. */
  public async markConversationRead(conversationId: string): Promise<void> {
    if (!conversationId) return;
    const conv = this.state.conversations.find((c) => c.id === conversationId);
    if (conv && conv.unreadCount !== 0) {
      this.state.conversations = this.state.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      this.notify();
    }
    if (this.state.mode !== 'connected' || !this.supabase) return;
    const me = this.state.currentUser.id;
    try {
      await this.supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() } as never)
        .eq('conversation_id', conversationId)
        .eq('user_id', me);
    } catch {
      // migration 012 not applied yet: unread stays local
    }
    const incoming = (this.state.messagesMap[conversationId] || []).filter((m) => !m.isSelf).map((m) => m.id);
    void this.writeReceipts(incoming, true);
  }

  public hasMoreHistory(conversationId: string): boolean {
    return this.moreHistory.get(conversationId) !== false;
  }

  private moreHistory: Map<string, boolean> = new Map();

  /** Loads the next page of older messages for the conversation (cursor = oldest message we have). */
  public async loadOlderMessages(conversationId: string): Promise<void> {
    if (this.state.mode !== 'connected' || !this.supabase || !this.crypto) return;
    const summary = this.conversationSummaries.get(conversationId);
    const current = this.state.messagesMap[conversationId] || [];
    if (!summary || current.length === 0) return;
    const oldestRow = this.oldestCursor.get(conversationId);
    if (!oldestRow) return;

    try {
      const rows = await fetchMessageHistory(this.crypto, summary, 50, oldestRow);
      this.moreHistory.set(conversationId, rows.length >= 50);
      if (rows.length > 0) this.oldestCursor.set(conversationId, rows[0].createdAt);
      const senderName = (id: string) =>
        id === this.state.currentUser.id ? this.state.currentUser.name : this.participantNames.get(id) || this.state.allUsers.find((u) => u.id === id)?.name || 'Member';
      const older = rows
        .filter((r) => r.deletedAt || !isHiddenEnvelope(r.envelope))
        .map((r) => decryptedRowToMessage(r, this.state.currentUser.id, senderName(r.senderId)))
        .filter((m) => !current.some((c) => c.id === m.id));
      this.state.messagesMap = { ...this.state.messagesMap, [conversationId]: [...older, ...current] };
      this.notify();
      void this.loadReactionsAndReceipts(conversationId);
    } catch (err) {
      this.setState({ error: err instanceof Error ? err.message : 'Failed to load earlier messages' });
    }
  }

  private oldestCursor: Map<string, string> = new Map();

  // --- Presence and typing (fed by lib/realtime/liveChannels.ts) ---

  public setPresence(map: Record<string, UserPresence>): void {
    const apply = (id: string, fallback?: UserPresence) => map[id] ?? fallback ?? 'offline';
    this.state.allUsers = this.state.allUsers.map((u) => ({ ...u, presence: apply(u.id) }));
    this.state.conversations = this.state.conversations.map((c) =>
      c.recipientUser ? { ...c, recipientUser: { ...c.recipientUser, presence: apply(c.recipientUser.id) } } : c
    );
    this.notify();
  }

  public setTyping(conversationId: string, userIds: string[]): void {
    const prev = this.state.typing[conversationId] || [];
    if (prev.length === userIds.length && prev.every((id, i) => id === userIds[i])) return;
    this.state.typing = { ...this.state.typing, [conversationId]: userIds };
    this.notify();
  }

  public nameOf(userId: string): string {
    return this.participantNames.get(userId) || this.state.allUsers.find((u) => u.id === userId)?.name || 'Someone';
  }

  // --- Saved (bookmarked) messages ---

  public async loadSavedMessages(): Promise<void> {
    if (this.state.mode !== 'connected' || !this.supabase) return;
    try {
      const { data } = await this.supabase.from('saved_messages').select('message_id, conversation_id').order('created_at', { ascending: false });
      const rows = (data as Array<{ message_id: string; conversation_id: string }> | null) || [];
      this.setState({ saved: rows.map((r) => ({ messageId: r.message_id, conversationId: r.conversation_id })) });
      const convs = [...new Set(rows.map((r) => r.conversation_id))];
      await Promise.all(convs.filter((id) => !this.loadedConversations.has(id)).map((id) => this.loadMessagesForConversation(id)));
    } catch {
      // migration 012 not applied yet
    }
  }

  public async toggleSaved(messageId: string): Promise<void> {
    const msg = Object.values(this.state.messagesMap).flat().find((m) => m.id === messageId);
    if (!msg) return;
    const already = this.state.saved.some((s) => s.messageId === messageId);
    const next = already
      ? this.state.saved.filter((s) => s.messageId !== messageId)
      : [{ messageId, conversationId: msg.conversationId }, ...this.state.saved];
    const flag = (list: MessageData[]) => list.map((m) => (m.id === messageId ? { ...m, isStarred: !already } : m));
    this.state.messagesMap = { ...this.state.messagesMap, [msg.conversationId]: flag(this.state.messagesMap[msg.conversationId] || []) };
    this.setState({ saved: next });

    if (this.state.mode !== 'connected' || !this.supabase) return;
    try {
      if (already) {
        await this.supabase.from('saved_messages').delete().eq('message_id', messageId).eq('user_id', this.state.currentUser.id);
      } else {
        const { error } = await this.supabase.from('saved_messages').insert({ user_id: this.state.currentUser.id, message_id: messageId, conversation_id: msg.conversationId } as never);
        if (error) throw new Error(error.message);
      }
    } catch (err) {
      this.state.messagesMap = { ...this.state.messagesMap, [msg.conversationId]: (this.state.messagesMap[msg.conversationId] || []).map((m) => (m.id === messageId ? { ...m, isStarred: already } : m)) };
      this.setState({ saved: this.state.saved.filter((s) => s.messageId !== messageId).concat(already ? [{ messageId, conversationId: msg.conversationId }] : []), error: err instanceof Error ? err.message : 'Could not update saved messages' });
    }
  }


  // --- Group management: roles, settings, leaving, system notes ---

  private lastMemberIds: Map<string, string[]> = new Map();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** Posts a small system line ("Ana added Sam") into a conversation. Best effort. */
  private async sendSystemNote(conversationId: string, text: string): Promise<void> {
    const summary = this.conversationSummaries.get(conversationId);
    if (!summary || !this.crypto) return;
    try {
      await sendEnvelope(this.crypto, summary, { v: 1, kind: 'system', text });
    } catch {
      // The change itself succeeded; the note is cosmetic.
    }
  }

  /**
   * Called (debounced) when Realtime reports a membership or group-settings change.
   * If someone left or was removed and we are the lowest-id manager still in the group,
   * we rotate the group key so the departed member cannot read anything new.
   */
  public refreshConversations(): void {
    if (this.state.mode !== 'connected') return;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => void this.doRefreshConversations(), 600);
  }

  private async doRefreshConversations(): Promise<void> {
    const before = new Map(this.lastMemberIds);
    await this.loadConversationsReal();
    const me = this.state.currentUser.id;
    for (const summary of this.conversationSummaries.values()) {
      if (summary.type !== 'group') continue;
      const prev = before.get(summary.id);
      this.lastMemberIds.set(summary.id, summary.memberIds);
      if (!prev || !summary.roles) continue;
      const someoneLeft = prev.some((id) => !summary.memberIds.includes(id));
      if (!someoneLeft) continue;
      const managers = summary.memberIds.filter((id) => summary.roles![id] === 'owner' || summary.roles![id] === 'admin').sort();
      if (managers[0] !== me) continue; // exactly one manager rotates, to avoid racing key versions
      try {
        const nextVersion = ((await this.crypto?.ensureGroupKey(summary.id))?.version || 0) + 1;
        await this.distributeNewGroupKey(summary.id, summary.memberIds, nextVersion);
      } catch (err) {
        this.setState({ error: err instanceof Error ? err.message : 'Could not rotate the group key after a member left' });
      }
    }
  }

  public async setMemberRole(groupId: string, userId: string, role: 'owner' | 'admin' | 'member'): Promise<void> {
    if (this.state.mode !== 'connected') return;
    const res = await fetch('/api/groups/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, userId, role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to change role' });
      return;
    }
    await this.loadConversationsReal();
    const name = this.nameOf(userId);
    const verb = role === 'owner' ? 'is now the owner' : role === 'admin' ? 'is now an admin' : 'is no longer an admin';
    void this.sendSystemNote(groupId, `${name} ${verb}`);
  }

  public async updateGroupSettings(groupId: string, patch: { name?: string; description?: string; onlyAdminsPost?: boolean }): Promise<boolean> {
    if (this.state.mode !== 'connected') return false;
    const res = await fetch('/api/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, ...patch }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to update the group' });
      return false;
    }
    await this.loadConversationsReal();
    if (patch.name) void this.sendSystemNote(groupId, `${this.state.currentUser.name} renamed the group to "${patch.name}"`);
    if (patch.onlyAdminsPost !== undefined) {
      void this.sendSystemNote(groupId, patch.onlyAdminsPost ? 'Only admins can send messages now' : 'Everyone can send messages now');
    }
    return true;
  }

  public async leaveGroup(groupId: string): Promise<void> {
    if (this.state.mode !== 'connected') return;
    // Say goodbye first: after leaving we can no longer post here.
    await this.sendSystemNote(groupId, `${this.state.currentUser.name} left`);
    const params = new URLSearchParams({ groupId, userId: this.state.currentUser.id });
    const res = await fetch(`/api/groups/members?${params.toString()}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.setState({ error: body.error || 'Failed to leave the group' });
      return;
    }
    this.state.conversations = this.state.conversations.filter((c) => c.id !== groupId);
    if (this.state.activeConversationId === groupId) this.state.activeConversationId = this.state.conversations[0]?.id || '';
    this.notify();
  }

  public clearError() {
    this.setState({ error: null });
  }

  /** Updates locally-cached profile fields after a write that already succeeded server-side. */
  public updateCurrentUserProfile(patch: Partial<UserItem>) {
    this.setState({ currentUser: { ...this.state.currentUser, ...patch } });
  }

  public logout() {
    this.supabase = null;
    this.crypto = null;
    this.conversationSummaries.clear();
    this.loadedConversations.clear();
    this.participantNames.clear();
    this.setState({
      mode: 'demo',
      isLoading: false,
      allUsers: [],
      conversations: [],
      messagesMap: {},
      messagesLoading: {},
      activeConversationId: '',
      devices: [],
      typing: {},
      saved: [],
      error: null,
    });
  }

  // ============================================================
  // DEMO mode implementation (see banner at top of file)
  // ============================================================

  public initDemoMode() {
    let allUsers = DEMO_USERS;
    let conversations = DEMO_CONVERSATIONS;
    let messagesMap = DEMO_MESSAGES;
    let devices = DEMO_DEVICES;
    let savedUserId: string | null = null;

    // Browser-only: layer any previously-saved local demo data on top of the
    // defaults, and wire up cross-tab sync. None of this is required for
    // demo mode to function (e.g. under vitest's Node environment) - it's
    // purely a nicer experience in an actual browser tab.
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.broadcastChannel.onmessage = (event) => this.handleBroadcastEvent(event.data);
        }

        const savedData = localStorage.getItem(STORAGE_KEY);
        savedUserId = localStorage.getItem(CURRENT_USER_KEY);

        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.allUsers && parsed.conversations && parsed.messagesMap) {
            allUsers = parsed.allUsers;
            conversations = parsed.conversations;
            messagesMap = parsed.messagesMap;
            devices = parsed.devices || DEMO_DEVICES;
          }
        }
      } catch {
        // Corrupted localStorage - fall back to the defaults set above.
      }
    }

    const currentUser = allUsers.find((u) => u.id === savedUserId) || allUsers[0];

    this.state = {
      mode: 'demo',
      isLoading: false,
      currentUser,
      allUsers,
      conversations,
      activeConversationId: conversations[0]?.id || '',
      messagesMap,
      messagesLoading: {},
      devices,
      typing: {},
      saved: [],
      error: null,
    };
    this.notify();
  }

  private persistDemo() {
    if (typeof window === 'undefined' || this.state.mode !== 'demo') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ allUsers: this.state.allUsers, conversations: this.state.conversations, messagesMap: this.state.messagesMap, devices: this.state.devices })
      );
      localStorage.setItem(CURRENT_USER_KEY, this.state.currentUser.id);
    } catch {
      // Ignore quota errors.
    }
  }

  private broadcast(type: string, payload: unknown) {
    this.broadcastChannel?.postMessage({ type, payload, senderId: this.state.currentUser.id });
  }

  private handleBroadcastEvent(data: { type: string; payload: unknown }) {
    if (!data || this.state.mode !== 'demo') return;
    if (data.type === 'MESSAGE_SENT') {
      const newMsg = data.payload as MessageData;
      const convId = newMsg.conversationId;
      this.state.messagesMap = { ...this.state.messagesMap, [convId]: [...(this.state.messagesMap[convId] || []).filter((m) => m.id !== newMsg.id), newMsg] };
      this.notify();
    }
  }

  private sendMessageDemo(content: string, replyToId?: string, attachmentFile?: File, threadRootId?: string) {
    const activeConvId = this.state.activeConversationId;
    if (!activeConvId) return;
    const currentMsgs = this.state.messagesMap[activeConvId] || [];
    const replyTarget = replyToId ? currentMsgs.find((m) => m.id === replyToId) : undefined;

    const newMsg: MessageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: activeConvId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      isSelf: true,
      threadRootId,
      content,
      timestamp: nowTimestamp(),
      status: 'delivered',
      replyTo: replyTarget ? { id: replyTarget.id, senderName: replyTarget.senderName, snippet: replyTarget.content } : undefined,
      reactions: [],
      attachments: attachmentFile
        ? [{ id: `att-${Date.now()}`, fileName: attachmentFile.name, fileSize: formatFileSize(attachmentFile.size), mimeType: attachmentFile.type, isEncrypted: false, storagePath: '', keyB64: '', ivB64: '' }]
        : undefined,
      encryptionVersion: 0,
    };

    this.state.messagesMap = { ...this.state.messagesMap, [activeConvId]: [...currentMsgs, newMsg] };
    this.state.conversations = this.state.conversations.map((c) => (c.id === activeConvId ? { ...c, lastMessage: { snippet: content || 'Attachment', timestamp: nowTimestamp() } } : c));
    this.persistDemo();
    this.broadcast('MESSAGE_SENT', newMsg);
    this.notify();
  }

  private reactToMessageDemo(msgId: string, emoji: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    const updated = list.map((m) => {
      if (m.id !== msgId) return m;
      const idx = m.reactions.findIndex((r) => r.emoji === emoji);
      const reactions = [...m.reactions];
      if (idx >= 0) {
        const cur = reactions[idx];
        if (cur.userReacted) {
          if (cur.count <= 1) reactions.splice(idx, 1);
          else reactions[idx] = { ...cur, count: cur.count - 1, userReacted: false };
        } else {
          reactions[idx] = { ...cur, count: cur.count + 1, userReacted: true };
        }
      } else {
        reactions.push({ emoji, count: 1, userReacted: true });
      }
      return { ...m, reactions };
    });
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: updated };
    this.persistDemo();
    this.notify();
  }

  private editMessageDemo(msgId: string, newContent: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: list.map((m) => (m.id === msgId ? { ...m, content: newContent, isEdited: true } : m)) };
    this.persistDemo();
    this.notify();
  }

  private deleteMessageDemo(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];
    this.state.messagesMap = { ...this.state.messagesMap, [convId]: list.map((m) => (m.id === msgId ? { ...m, isDeletedLocally: true } : m)) };
    this.persistDemo();
    this.notify();
  }

  private forwardMessageDemo(targetConvId: string, msgToForward: MessageData) {
    const fwdMsg: MessageData = { ...msgToForward, id: `fwd-${Date.now()}`, conversationId: targetConvId, timestamp: nowTimestamp(), isSelf: true, senderId: this.state.currentUser.id, senderName: this.state.currentUser.name };
    this.state.messagesMap = { ...this.state.messagesMap, [targetConvId]: [...(this.state.messagesMap[targetConvId] || []), fwdMsg] };
    this.persistDemo();
    this.notify();
  }

  private createDirectConversationDemo(targetUser: UserItem): string {
    const existing = this.state.conversations.find((c) => c.type === 'direct' && c.recipientUser?.id === targetUser.id);
    if (existing) {
      this.selectConversation(existing.id);
      return existing.id;
    }
    const newId = `conv-dm-${Date.now()}`;
    const newConv: ConversationItem = {
      id: newId, title: targetUser.name, type: 'direct', unreadCount: 0,
      lastMessage: { snippet: 'Conversation established', timestamp: 'Just now' },
      recipientUser: { id: targetUser.id, name: targetUser.name, registrationId: targetUser.registrationId, identityFingerprint: targetUser.identityFingerprint, isVerified: true, presence: targetUser.presence || 'online' },
    };
    this.state.conversations = [newConv, ...this.state.conversations];
    this.state.messagesMap = { ...this.state.messagesMap, [newId]: [] };
    this.state.activeConversationId = newId;
    this.persistDemo();
    this.notify();
    return newId;
  }

  private createGroupConversationDemo(groupName: string, memberUserIds: string[]): string {
    const newId = `grp-${Date.now()}`;
    const membersCount = memberUserIds.length + 1;
    const newConv: ConversationItem = {
      id: newId, title: groupName, type: 'group', unreadCount: 0,
      lastMessage: { snippet: `Group created with ${membersCount} members`, timestamp: 'Just now' },
      groupMeta: { groupId: newId, memberCount: membersCount, senderKeyVersion: 1 },
    };
    this.state.conversations = [newConv, ...this.state.conversations];
    this.state.messagesMap = { ...this.state.messagesMap, [newId]: [{ id: `gmsg-${Date.now()}`, conversationId: newId, senderId: this.state.currentUser.id, senderName: this.state.currentUser.name, isSelf: true, content: `Created group "${groupName}".`, timestamp: nowTimestamp(), status: 'delivered', reactions: [], encryptionVersion: 0 }] };
    this.state.activeConversationId = newId;
    this.persistDemo();
    this.notify();
    return newId;
  }

  private toggleUserRoleDemo(userId: string, currentRole: 'admin' | 'member') {
    this.state.allUsers = this.state.allUsers.map((u) => (u.id === userId ? { ...u, role: currentRole === 'admin' ? 'member' : 'admin' } : u));
    this.persistDemo();
    this.notify();
  }

  private revokeDeviceDemo(deviceId: string) {
    this.state.devices = this.state.devices.filter((d) => d.id !== deviceId);
    this.persistDemo();
    this.notify();
  }

  public switchDemoUser(userId: string) {
    const target = this.state.allUsers.find((u) => u.id === userId);
    if (!target) return;
    this.state.currentUser = target;
    const updated: Record<string, MessageData[]> = {};
    for (const [convId, msgs] of Object.entries(this.state.messagesMap)) {
      updated[convId] = msgs.map((m) => ({ ...m, isSelf: m.senderId === target.id }));
    }
    this.state.messagesMap = updated;
    this.persistDemo();
    this.notify();
  }

  public registerUser(name: string): UserItem {
    const newUser: UserItem = {
      id: `usr-${Date.now()}`, name: name.trim(), registrationId: Math.floor(10000 + Math.random() * 90000), role: 'member', deviceCount: 1, joinedAt: 'Just now',
      identityFingerprint: Array.from({ length: 8 }, () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0')).join('-'),
      presence: 'online',
    };
    this.state.allUsers = [...this.state.allUsers, newUser];
    this.state.currentUser = newUser;
    this.persistDemo();
    this.notify();
    return newUser;
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

let storeInstance: ChatStore | null = null;

export function getChatStore(): ChatStore {
  if (!storeInstance) {
    storeInstance = new ChatStore();
  }
  return storeInstance;
}
