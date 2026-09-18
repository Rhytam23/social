export type ViewCategory = 'chats' | 'groups' | 'people' | 'settings' | 'admin';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type UserPresence = 'online' | 'away' | 'dnd' | 'offline';

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
  url?: string;
  isEncrypted: boolean;
  isVoiceNote?: boolean;
  duration?: string;
}

export interface ReplyReference {
  id: string;
  senderName: string;
  snippet: string;
}

export interface MessageData {
  id: string;
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
  isArchived?: boolean;
  draftText?: string;
  pinnedMessageId?: string;
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
  };
}

export interface UserItem {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  registrationId: number;
  role: 'admin' | 'member';
  deviceCount: number;
  joinedAt: string;
  identityFingerprint: string;
  presence?: UserPresence;
}

export interface InviteItem {
  id: string;
  token: string;
  createdByName: string;
  createdAt: string;
  status: 'pending' | 'consumed' | 'revoked';
  consumedByName?: string;
}
