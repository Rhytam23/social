import type { GroupRole } from '../lib/groups/roles';

export type ViewCategory = 'chats' | 'groups' | 'people' | 'saved' | 'settings' | 'admin';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type UserPresence = 'online' | 'away' | 'dnd' | 'meeting' | 'offline';

export interface ReactionItem {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  /** Populated only after the user triggers decryption (see onDownloadAttachment). */
  url?: string;
  isEncrypted: boolean;
  isVoiceNote?: boolean;
  duration?: string;
  /** Encrypted-storage coordinates, needed to lazily download + decrypt on demand. */
  storagePath: string;
  keyB64: string;
  ivB64: string;
  isDownloading?: boolean;
  downloadError?: string;
}

export interface ReplyReference {
  id: string;
  senderName: string;
  snippet: string;
}

export type MessageKind = 'text' | 'attachment' | 'voice' | 'system' | 'poll' | 'call' | 'unsupported';

export interface MessageData {
  id: string;
  kind?: MessageKind;
  /** Set on replies that live in a thread under another message. */
  threadRootId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isSelf: boolean;
  content: string;
  timestamp: string;
  status: MessageStatus;
  replyTo?: ReplyReference;
  reactions: ReactionItem[];
  attachments?: AttachmentItem[];
  encryptionVersion: number;
  isEdited?: boolean;
  isPinned?: boolean;
  isStarred?: boolean;
  isDeletedLocally?: boolean;
}

export interface DeviceItem {
  id: string;
  deviceName: string;
  registrationId: number;
  lastActive: string;
  isCurrentDevice: boolean;
}

export interface ConversationItem {
  id: string;
  title: string;
  type: 'direct' | 'group';
  subtitle?: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  /** Per-conversation notification override ('default' follows Settings). */
  notifyLevel?: 'all' | 'mentions' | 'none';
  /** Epoch ms; the conversation is silent until then. */
  mutedUntil?: number;
  isArchived?: boolean;
  draftText?: string;
  pinnedMessageId?: string;
  /** Set on channels that belong to a community. */
  communityId?: string;
  topic?: string;
  isPrivateChannel?: boolean;
  lastMessage?: {
    snippet: string;
    timestamp: string;
    status?: MessageStatus;
  };
  recipientUser?: {
    id: string;
    name: string;
    registrationId: number;
    identityFingerprint: string;
    isVerified: boolean;
    presence?: UserPresence;
  };
  groupMeta?: {
    groupId: string;
    memberCount: number;
    senderKeyVersion: number;
    memberIds?: string[];
    /** Needs migration 013. Undefined means roles are not available yet. */
    roles?: Record<string, GroupRole>;
    description?: string;
    onlyAdminsPost?: boolean;
  };
}

export interface UserItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  pronouns?: string;
  timezone?: string;
  registrationId: number;
  role: 'admin' | 'member';
  deviceCount: number;
  joinedAt: string;
  identityFingerprint: string;
  presence?: UserPresence;
}

export interface CommunityItem {
  id: string;
  name: string;
  description?: string;
  /** Your role in the community. */
  role: GroupRole;
  ownerId?: string;
}

export interface CommunityMemberItem {
  userId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role: GroupRole;
  joinedAt: string;
}
