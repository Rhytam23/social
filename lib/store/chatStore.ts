import { ConversationItem, MessageData, UserItem, DeviceItem, InviteItem } from '../../types/ui';

export type StoreMode = 'connected' | 'demo';

export interface ChatStoreState {
  mode: StoreMode;
  isLoading: boolean;
  currentUser: UserItem;
  allUsers: UserItem[];
  conversations: ConversationItem[];
  activeConversationId: string;
  messagesMap: Record<string, MessageData[]>;
  devices: DeviceItem[];
  invites: InviteItem[];
}

type Listener = () => void;

const STORAGE_KEY = 'private_chat_v1_store_data';
const CURRENT_USER_KEY = 'private_chat_v1_current_user_id';
const BROADCAST_CHANNEL_NAME = 'private_chat_v1_channel';

const INITIAL_USERS: UserItem[] = [
  {
    id: 'usr-alice',
    name: 'Alice Vance',
    registrationId: 84920,
    role: 'admin',
    deviceCount: 2,
    joinedAt: 'Sep 1, 2026',
    identityFingerprint: '45A8-99F1-20B3-881C-00D9-FF41-92A3-77E5',
    presence: 'online',
  },
  {
    id: 'usr-bob',
    name: 'Bob Miller',
    registrationId: 10482,
    role: 'member',
    deviceCount: 1,
    joinedAt: 'Sep 1, 2026',
    identityFingerprint: '992A-44B1-0081-F09C-1192-33E4-AA11-22BB',
    presence: 'online',
  },
  {
    id: 'usr-carol',
    name: 'Carol Danvers',
    registrationId: 30291,
    role: 'member',
    deviceCount: 1,
    joinedAt: 'Sep 2, 2026',
    identityFingerprint: '77A1-88C2-11D0-99E1-44B2-55C3-CC33-44DD',
    presence: 'away',
  },
  {
    id: 'usr-david',
    name: 'David Wright',
    registrationId: 90218,
    role: 'member',
    deviceCount: 3,
    joinedAt: 'Aug 28, 2026',
    identityFingerprint: '11B2-22C3-33D4-44E5-55F6-66A7-EE55-66FF',
    presence: 'offline',
  },
];

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv-alice-bob',
    title: 'Bob Miller',
    type: 'direct',
    unreadCount: 0,
    isPinned: true,
    lastMessage: {
      snippet: 'Welcome to Private Chat! Signals are verified.',
      timestamp: '10:30 AM',
      status: 'read',
    },
    recipientUser: {
      id: 'usr-bob',
      name: 'Bob Miller',
      registrationId: 10482,
      identityFingerprint: '992A-44B1-0081-F09C-1192-33E4-AA11-22BB',
      isVerified: true,
      presence: 'online',
    },
  },
  {
    id: 'conv-security-team',
    title: 'Security Architecture Group',
    type: 'group',
    unreadCount: 0,
    lastMessage: {
      snippet: 'End-to-end Signal Sender Keys initialized.',
      timestamp: '09:15 AM',
      status: 'read',
    },
    groupMeta: {
      groupId: 'grp-security',
      memberCount: 4,
      senderKeyVersion: 1,
    },
  },
];

const INITIAL_MESSAGES: Record<string, MessageData[]> = {
  'conv-alice-bob': [
    {
      id: 'msg-init-1',
      conversationId: 'conv-alice-bob',
      senderId: 'usr-bob',
      senderName: 'Bob Miller',
      isSelf: false,
      content: 'Hey Alice! Ready to test client-side private messaging.',
      timestamp: '10:28 AM',
      status: 'read',
      reactions: [{ emoji: '👋', count: 1, userReacted: true }],
      encryptionVersion: 1,
    },
    {
      id: 'msg-init-2',
      conversationId: 'conv-alice-bob',
      senderId: 'usr-alice',
      senderName: 'Alice Vance',
      isSelf: true,
      content: 'Welcome to Private Chat! Signals are verified.',
      timestamp: '10:30 AM',
      status: 'read',
      replyTo: {
        id: 'msg-init-1',
        senderName: 'Bob Miller',
        snippet: 'Hey Alice! Ready to test client-side private messaging.',
      },
      reactions: [{ emoji: '🔒', count: 1, userReacted: false }],
      encryptionVersion: 1,
    },
  ],
  'conv-security-team': [
    {
      id: 'gmsg-init-1',
      conversationId: 'conv-security-team',
      senderId: 'usr-alice',
      senderName: 'Alice Vance',
      isSelf: true,
      content: 'End-to-end Signal Sender Keys initialized.',
      timestamp: '09:15 AM',
      status: 'read',
      reactions: [{ emoji: '🚀', count: 3, userReacted: true }],
      encryptionVersion: 1,
    },
  ],
};

const INITIAL_DEVICES: DeviceItem[] = [
  {
    id: 'dev-primary',
    deviceName: 'Primary Workstation (Web)',
    registrationId: 84920,
    lastActive: 'Active now',
    isCurrentDevice: true,
  },
  {
    id: 'dev-mobile',
    deviceName: 'Mobile Client (iOS)',
    registrationId: 84921,
    lastActive: '20 minutes ago',
    isCurrentDevice: false,
  },
];

const INITIAL_INVITES: InviteItem[] = [
  {
    id: 'inv-1',
    token: 'INV-SEC-8821-V1',
    createdByName: 'Alice Vance',
    createdAt: 'Sep 3, 2026',
    status: 'pending',
  },
];

export class ChatStore {
  private state: ChatStoreState;
  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    const isSupabaseConfigured =
      typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    const mode: StoreMode = isSupabaseConfigured ? 'connected' : 'demo';

    this.state = {
      mode,
      isLoading: true,
      currentUser: INITIAL_USERS[0],
      allUsers: INITIAL_USERS,
      conversations: INITIAL_CONVERSATIONS,
      activeConversationId: INITIAL_CONVERSATIONS[0].id,
      messagesMap: INITIAL_MESSAGES,
      devices: INITIAL_DEVICES,
      invites: INITIAL_INVITES,
    };

    if (typeof window !== 'undefined') {
      this.initClientStore();
    }
  }

  private initClientStore() {
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastEvent(event.data);
        };
      }

      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedUserId = localStorage.getItem(CURRENT_USER_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.allUsers && parsed.conversations && parsed.messagesMap) {
          this.state.allUsers = parsed.allUsers;
          this.state.conversations = parsed.conversations;
          this.state.messagesMap = parsed.messagesMap;
          this.state.devices = parsed.devices || INITIAL_DEVICES;
          this.state.invites = parsed.invites || INITIAL_INVITES;
        }
      }

      const activeUser =
        this.state.allUsers.find((u) => u.id === savedUserId) || this.state.allUsers[0];
      this.state.currentUser = activeUser;

      if (this.state.conversations.length > 0) {
        this.state.activeConversationId = this.state.conversations[0].id;
      }

      this.state.isLoading = false;
      this.notify();
    } catch {
      this.state.isLoading = false;
      this.notify();
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      const dataToSave = {
        allUsers: this.state.allUsers,
        conversations: this.state.conversations,
        messagesMap: this.state.messagesMap,
        devices: this.state.devices,
        invites: this.state.invites,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(CURRENT_USER_KEY, this.state.currentUser.id);
    } catch {
      // Ignore local storage quota limits safely
    }
  }

  private broadcast(type: string, payload: unknown) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, payload, senderId: this.state.currentUser.id });
    }
  }

  private handleBroadcastEvent(data: { type: string; payload: unknown; senderId?: string }) {
    if (!data) return;

    if (data.type === 'MESSAGE_SENT') {
      const newMsg = data.payload as MessageData;
      const convId = newMsg.conversationId;

      this.state.messagesMap = {
        ...this.state.messagesMap,
        [convId]: [...(this.state.messagesMap[convId] || []).filter((m) => m.id !== newMsg.id), newMsg],
      };

      this.state.conversations = this.state.conversations.map((c) => {
        if (c.id === convId) {
          const isCurrentActive = this.state.activeConversationId === convId;
          const isSender = newMsg.senderId === this.state.currentUser.id;
          const newUnread = !isCurrentActive && !isSender ? c.unreadCount + 1 : c.unreadCount;
          return {
            ...c,
            unreadCount: newUnread,
            lastMessage: {
              snippet: newMsg.content || (newMsg.attachments?.[0]?.fileName ? `Attachment: ${newMsg.attachments[0].fileName}` : 'New message'),
              timestamp: newMsg.timestamp,
              status: newMsg.status,
            },
          };
        }
        return c;
      });

      this.persist();
      this.notify();
    } else if (data.type === 'CONVERSATION_CREATED') {
      const newConv = data.payload as ConversationItem;
      if (!this.state.conversations.some((c) => c.id === newConv.id)) {
        this.state.conversations = [newConv, ...this.state.conversations];
        this.persist();
        this.notify();
      }
    } else if (data.type === 'REACTION_UPDATED' || data.type === 'MESSAGE_EDITED' || data.type === 'MESSAGE_DELETED') {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.messagesMap) {
          this.state.messagesMap = parsed.messagesMap;
          this.notify();
        }
      }
    }
  }

  public getState(): ChatStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public selectConversation(conversationId: string) {
    this.state.activeConversationId = conversationId;
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    this.persist();
    this.notify();
  }

  public sendMessage(content: string, replyToId?: string, attachmentFile?: File) {
    const activeConvId = this.state.activeConversationId;
    if (!activeConvId) return;

    const currentMsgs = this.state.messagesMap[activeConvId] || [];
    let replyRef;
    if (replyToId) {
      const target = currentMsgs.find((m) => m.id === replyToId);
      if (target) {
        replyRef = {
          id: target.id,
          senderName: target.senderName,
          snippet: target.content,
        };
      }
    }

    const attachments = attachmentFile
      ? [
          {
            id: `att-${Date.now()}`,
            fileName: attachmentFile.name,
            fileSize: `${(attachmentFile.size / 1024).toFixed(1)} KB`,
            mimeType: attachmentFile.type || 'application/octet-stream',
            isEncrypted: true,
            isVoiceNote: attachmentFile.name.startsWith('voice-note-'),
            duration: attachmentFile.name.startsWith('voice-note-') ? '0:03' : undefined,
          },
        ]
      : undefined;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: MessageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: activeConvId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      isSelf: true,
      content,
      timestamp,
      status: 'delivered',
      replyTo: replyRef,
      reactions: [],
      attachments,
      encryptionVersion: 1,
    };

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [activeConvId]: [...currentMsgs, newMsg],
    };

    this.state.conversations = this.state.conversations.map((c) =>
      c.id === activeConvId
        ? {
            ...c,
            lastMessage: {
              snippet: content || (attachmentFile ? `Attachment: ${attachmentFile.name}` : 'Sent attachment'),
              timestamp,
              status: 'delivered',
            },
          }
        : c
    );

    this.persist();
    this.broadcast('MESSAGE_SENT', newMsg);
    this.notify();
  }

  public reactToMessage(msgId: string, emoji: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];

    const updated = list.map((m) => {
      if (m.id !== msgId) return m;
      const existingIdx = m.reactions.findIndex((r) => r.emoji === emoji);
      const newReactions = [...m.reactions];
      if (existingIdx >= 0) {
        const current = newReactions[existingIdx];
        if (current.userReacted) {
          if (current.count <= 1) {
            newReactions.splice(existingIdx, 1);
          } else {
            newReactions[existingIdx] = {
              ...current,
              count: current.count - 1,
              userReacted: false,
            };
          }
        } else {
          newReactions[existingIdx] = {
            ...current,
            count: current.count + 1,
            userReacted: true,
          };
        }
      } else {
        newReactions.push({ emoji, count: 1, userReacted: true });
      }
      return { ...m, reactions: newReactions };
    });

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: updated,
    };

    this.persist();
    this.broadcast('REACTION_UPDATED', { msgId, emoji });
    this.notify();
  }

  public editMessage(msgId: string, newContent: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];

    const updated = list.map((m) =>
      m.id === msgId ? { ...m, content: newContent, isEdited: true } : m
    );

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: updated,
    };

    this.persist();
    this.broadcast('MESSAGE_EDITED', { msgId, newContent });
    this.notify();
  }

  public deleteMessage(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];

    const updated = list.map((m) =>
      m.id === msgId ? { ...m, isDeletedLocally: true } : m
    );

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: updated,
    };

    this.persist();
    this.broadcast('MESSAGE_DELETED', { msgId });
    this.notify();
  }

  public forwardMessage(targetConvId: string, msgToForward: MessageData) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fwdMsg: MessageData = {
      id: `fwd-${Date.now()}`,
      conversationId: targetConvId,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.name,
      isSelf: true,
      content: msgToForward.content,
      timestamp,
      status: 'delivered',
      reactions: [],
      attachments: msgToForward.attachments,
      encryptionVersion: 1,
    };

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [targetConvId]: [...(this.state.messagesMap[targetConvId] || []), fwdMsg],
    };

    this.state.conversations = this.state.conversations.map((c) =>
      c.id === targetConvId
        ? {
            ...c,
            lastMessage: {
              snippet: fwdMsg.content || 'Forwarded attachment',
              timestamp,
              status: 'delivered',
            },
          }
        : c
    );

    this.persist();
    this.broadcast('MESSAGE_SENT', fwdMsg);
    this.notify();
  }

  public pinMessage(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];

    const updated = list.map((m) =>
      m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
    );

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: updated,
    };

    this.state.conversations = this.state.conversations.map((c) =>
      c.id === convId
        ? { ...c, pinnedMessageId: c.pinnedMessageId === msgId ? undefined : msgId }
        : c
    );

    this.persist();
    this.notify();
  }

  public starMessage(msgId: string) {
    const convId = this.state.activeConversationId;
    const list = this.state.messagesMap[convId] || [];

    const updated = list.map((m) =>
      m.id === msgId ? { ...m, isStarred: !m.isStarred } : m
    );

    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: updated,
    };

    this.persist();
    this.notify();
  }

  public createDirectConversation(targetUser: UserItem): string {
    const existing = this.state.conversations.find(
      (c) => c.type === 'direct' && c.recipientUser?.id === targetUser.id
    );

    if (existing) {
      this.selectConversation(existing.id);
      return existing.id;
    }

    const newId = `conv-dm-${Date.now()}`;
    const newConv: ConversationItem = {
      id: newId,
      title: targetUser.name,
      type: 'direct',
      unreadCount: 0,
      lastMessage: {
        snippet: 'Conversation established',
        timestamp: 'Just now',
      },
      recipientUser: {
        id: targetUser.id,
        name: targetUser.name,
        registrationId: targetUser.registrationId,
        identityFingerprint: targetUser.identityFingerprint,
        isVerified: true,
        presence: targetUser.presence || 'online',
      },
    };

    this.state.conversations = [newConv, ...this.state.conversations];
    this.state.messagesMap = {
      ...this.state.messagesMap,
      [newId]: [],
    };
    this.state.activeConversationId = newId;

    this.persist();
    this.broadcast('CONVERSATION_CREATED', newConv);
    this.notify();
    return newId;
  }

  public createGroupConversation(groupName: string, memberUserIds: string[]): string {
    const newId = `grp-${Date.now()}`;
    const membersCount = memberUserIds.length + 1;

    const newConv: ConversationItem = {
      id: newId,
      title: groupName,
      type: 'group',
      unreadCount: 0,
      lastMessage: {
        snippet: `Group created with ${membersCount} members`,
        timestamp: 'Just now',
      },
      groupMeta: {
        groupId: newId,
        memberCount: membersCount,
        senderKeyVersion: 1,
      },
    };

    this.state.conversations = [newConv, ...this.state.conversations];
    this.state.messagesMap = {
      ...this.state.messagesMap,
      [newId]: [
        {
          id: `gmsg-${Date.now()}`,
          conversationId: newId,
          senderId: this.state.currentUser.id,
          senderName: this.state.currentUser.name,
          isSelf: true,
          content: `Created group "${groupName}" with encrypted Signal Sender Keys.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered',
          reactions: [],
          encryptionVersion: 1,
        },
      ],
    };
    this.state.activeConversationId = newId;

    this.persist();
    this.broadcast('CONVERSATION_CREATED', newConv);
    this.notify();
    return newId;
  }

  public pinConversation(convId: string) {
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === convId ? { ...c, isPinned: !c.isPinned } : c
    );
    this.persist();
    this.notify();
  }

  public muteConversation(convId: string) {
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === convId ? { ...c, isMuted: !c.isMuted } : c
    );
    this.persist();
    this.notify();
  }

  public archiveConversation(convId: string) {
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === convId ? { ...c, isArchived: !c.isArchived } : c
    );
    this.persist();
    this.notify();
  }

  public markUnreadConversation(convId: string) {
    this.state.conversations = this.state.conversations.map((c) =>
      c.id === convId ? { ...c, unreadCount: c.unreadCount > 0 ? 0 : 1 } : c
    );
    this.persist();
    this.notify();
  }

  public clearHistoryConversation(convId: string) {
    this.state.messagesMap = {
      ...this.state.messagesMap,
      [convId]: [],
    };
    this.persist();
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
    this.persist();
    this.notify();
  }

  public generateInvite(): string {
    const newToken = `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const newInv: InviteItem = {
      id: `inv-${Date.now()}`,
      token: newToken,
      createdByName: this.state.currentUser.name,
      createdAt: 'Just now',
      status: 'pending',
    };
    this.state.invites = [newInv, ...this.state.invites];
    this.persist();
    this.notify();
    return newToken;
  }

  public revokeInvite(inviteId: string) {
    this.state.invites = this.state.invites.map((i) =>
      i.id === inviteId ? { ...i, status: 'revoked' } : i
    );
    this.persist();
    this.notify();
  }

  public toggleUserRole(userId: string, currentRole: 'admin' | 'member') {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    this.state.allUsers = this.state.allUsers.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    this.persist();
    this.notify();
  }

  public revokeDevice(deviceId: string) {
    this.state.devices = this.state.devices.filter((d) => d.id !== deviceId);
    this.persist();
    this.notify();
  }

  public switchDemoUser(userId: string) {
    const target = this.state.allUsers.find((u) => u.id === userId);
    if (!target) return;

    this.state.currentUser = target;

    const updatedMessagesMap: Record<string, MessageData[]> = {};
    for (const [convId, msgs] of Object.entries(this.state.messagesMap)) {
      updatedMessagesMap[convId] = msgs.map((m) => ({
        ...m,
        isSelf: m.senderId === target.id,
      }));
    }
    this.state.messagesMap = updatedMessagesMap;

    this.persist();
    this.notify();
  }

  public registerUser(name: string): UserItem {
    const newId = `usr-${Date.now()}`;
    const newUser: UserItem = {
      id: newId,
      name: name.trim(),
      registrationId: Math.floor(10000 + Math.random() * 90000),
      role: 'member',
      deviceCount: 1,
      joinedAt: 'Just now',
      identityFingerprint: Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 65536)
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')
      ).join('-'),
      presence: 'online',
    };

    this.state.allUsers = [...this.state.allUsers, newUser];
    this.state.currentUser = newUser;
    this.persist();
    this.notify();
    return newUser;
  }
}

let storeInstance: ChatStore | null = null;

export function getChatStore(): ChatStore {
  if (!storeInstance) {
    storeInstance = new ChatStore();
  }
  return storeInstance;
}
