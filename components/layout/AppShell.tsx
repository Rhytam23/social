import React, { useEffect, useState } from 'react';
import { ViewCategory, ConversationItem, MessageData, DeviceItem, UserItem, CommunityItem, CommunityMemberItem } from '../../types/ui';
import { NavDeck } from './NavDeck';
import { MobileNav } from './MobileNav';
import { ChatCanvas } from '../chat/ChatCanvas';
import { InspectorDeck } from '../chat/InspectorDeck';
import { PeopleDirectory } from '../people/PeopleDirectory';
import { SettingsView } from '../settings/SettingsView';
import { AdminDashboard } from '../admin/AdminDashboard';
import { CommandPalette, type PaletteAction } from '../search/CommandPalette';
import { ShortcutsDialog } from '../ui/ShortcutsDialog';
import { SavedMessagesView } from '../saved/SavedMessagesView';
import { ThreadPanel } from '../chat/ThreadPanel';
import { ReportDialog } from '../privacy/ReportDialog';
import type { PrivacySettingsProps } from '../settings/PrivacySettings';
import { ServerRail } from '../community/ServerRail';
import { CommunitySidebar } from '../community/CommunitySidebar';
import { CreateOrJoinDialog, CreateChannelDialog, CommunitySettingsDialog } from '../community/CommunityDialogs';
import { isGroupManager, type GroupRole } from '../../lib/groups/roles';
import { setTheme, readTheme } from '../../lib/ui/theme';
import { toast } from '../../lib/ui/toastStore';
import { UserProfileModal } from '../profile/UserProfileModal';
import { GroupSpaceView } from '../groups/GroupSpaceView';
import { ForwardMessageModal } from '../messages/ForwardMessageModal';
import { IconLock, IconPlus } from '../ui/icons';
import { Button } from '../ui/button';

export interface AppShellProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRegistrationId: number;
  currentUserRole: 'admin' | 'member';

  conversations: ConversationItem[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;

  messagesMap: Record<string, MessageData[]>;
  messages: MessageData[];
  onSendMessage: (content: string, replyToId?: string, attachmentFile?: File, voiceDurationMs?: number, threadRootId?: string) => void;
  onReactToMessage: (msgId: string, emoji: string) => void;
  onEditMessageSubmit?: (msgId: string, newContent: string) => void;
  onDeleteMessageLocal?: (msgId: string) => void;
  onForwardMessageToTarget?: (targetConvId: string, msg: MessageData) => void;
  onPinMessageToggle?: (msgId: string) => void;
  onStarMessageToggle?: (msgId: string) => void;
  onDownloadAttachment?: (msgId: string, attachmentId: string) => void;
  onRetryFailedMessage?: (msgId: string) => void;
  onAddGroupMember?: (groupId: string, userId: string) => void;
  onRemoveGroupMember?: (groupId: string, userId: string) => void;

  devices: DeviceItem[];
  users: UserItem[];
  onToggleUserRole: (userId: string, currentRole: 'admin' | 'member') => void;

  onExportKeyBackup: (passphrase: string) => Promise<void>;
  onRestoreKeyBackup: (passphrase: string, backupJson: string) => Promise<void>;
  onRevokeDevice: (deviceId: string) => void;

  onNewMessage: () => void;

  // Conversation Management Handlers
  onPinConversation?: (convId: string) => void;
  onMuteConversation?: (convId: string) => void;
  onArchiveConversation?: (convId: string) => void;
  onMarkUnreadConversation?: (convId: string) => void;
  onClearHistoryConversation?: (convId: string) => void;
  onDeleteConversationLocally?: (convId: string) => void;
  onLogout?: () => void;
  isLoading?: boolean;
  onStatusChanged?: () => void;
  typingNames?: string[];
  onTyping?: () => void;
  canLoadOlder?: boolean;
  onLoadOlder?: () => void;
  isLoadingMessages?: boolean;
  savedMessages?: MessageData[];
  onToggleSaved?: (messageId: string) => void;
  onSetMemberRole?: (groupId: string, userId: string, role: GroupRole) => void | Promise<void>;
  onUpdateGroupSettings?: (groupId: string, patch: { name?: string; description?: string; onlyAdminsPost?: boolean }) => Promise<boolean>;
  onLeaveGroup?: (groupId: string) => void | Promise<void>;
  onSetConversationNotify?: (conversationId: string, level: 'all' | 'mentions' | 'none' | 'default', muteMs?: number) => void;

  // Communities (shown only when provided, i.e. in connected mode)
  communities?: CommunityItem[];
  communityMembers?: Record<string, CommunityMemberItem[]>;
  initialInviteCode?: string;
  onLoadCommunityMembers?: (communityId: string) => void | Promise<void>;
  onCreateCommunity?: (name: string, description: string) => Promise<{ communityId: string; channelId: string } | null>;
  onJoinCommunity?: (code: string) => Promise<string | null>;
  onCreateChannel?: (communityId: string, name: string, isPrivate: boolean, memberIds: string[]) => Promise<string | null>;
  onCreateInvite?: (communityId: string) => Promise<string | null>;
  onSetCommunityRole?: (communityId: string, userId: string, role: 'owner' | 'admin' | 'member') => Promise<void>;
  onRemoveCommunityMember?: (communityId: string, userId: string) => Promise<void>;
  onLeaveCommunity?: (communityId: string) => Promise<boolean>;

  // Signed-in user's full profile (bio, email, fingerprint...). allUsers never contains yourself.
  currentUser?: UserItem;

  // Privacy
  blockedIds?: string[];
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onReportMessage?: (messageId: string, reason: string, includeText: boolean) => Promise<boolean>;
  onSetDisappearing?: (conversationId: string, seconds: number | null) => void;
  onVerifyPeer?: (conversationId: string) => void;
  onAcceptKeyChange?: (conversationId: string) => void;
  privacyProps?: Omit<PrivacySettingsProps, 'userId'>;
  /** Places a call to a contact. Provided in connected mode only. */
  onStartCall?: (peerUserId: string, video: boolean) => void;
  callActive?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUserId,
  currentUserName,
  currentUserRegistrationId,
  currentUserRole,
  conversations,
  activeConversationId,
  onSelectConversation,
  messagesMap,
  messages,
  onSendMessage,
  onReactToMessage,
  onEditMessageSubmit,
  onDeleteMessageLocal,
  onForwardMessageToTarget,
  onPinMessageToggle,
  onStarMessageToggle,
  onDownloadAttachment,
  onRetryFailedMessage,
  onAddGroupMember,
  onRemoveGroupMember,
  devices,
  users,
  onToggleUserRole,
  onExportKeyBackup,
  onRestoreKeyBackup,
  onRevokeDevice,
  onNewMessage,
  onPinConversation,
  onMuteConversation,
  onArchiveConversation,
  onMarkUnreadConversation,
  onClearHistoryConversation,
  onDeleteConversationLocally,
  onLogout,
  isLoading,
  onStatusChanged,
  typingNames,
  onTyping,
  canLoadOlder,
  onLoadOlder,
  isLoadingMessages,
  savedMessages = [],
  onToggleSaved,
  onSetMemberRole,
  onUpdateGroupSettings,
  onLeaveGroup,
  onSetConversationNotify,
  communities,
  communityMembers = {},
  initialInviteCode,
  onLoadCommunityMembers,
  onCreateCommunity,
  onJoinCommunity,
  onCreateChannel,
  onCreateInvite,
  onSetCommunityRole,
  onRemoveCommunityMember,
  onLeaveCommunity,
  currentUser,
  blockedIds = [],
  onBlockUser,
  onUnblockUser,
  onReportMessage,
  onSetDisappearing,
  onVerifyPeer,
  onAcceptKeyChange,
  privacyProps,
  onStartCall,
  callActive,
}) => {
  const [activeCategory, setActiveCategory] = useState<ViewCategory>('chats');
  const [showInspector, setShowInspector] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserItem | null>(null);
  const [replyTargetMessage, setReplyTargetMessage] = useState<MessageData | undefined>(undefined);
  const [editingMessage, setEditingMessage] = useState<MessageData | undefined>(undefined);
  const [forwardingMessage, setForwardingMessage] = useState<MessageData | null>(null);
  const [mobileChatView, setMobileChatView] = useState<boolean>(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [createOrJoinOpen, setCreateOrJoinOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [communitySettingsOpen, setCommunitySettingsOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<MessageData | null>(null);

  // An invite link (?join=CODE) opens the join dialog once.
  useEffect(() => {
    if (initialInviteCode) setCreateOrJoinOpen(true);
  }, [initialInviteCode]);
  const [online, setOnline] = useState(true);

  // Global shortcuts: Ctrl/Cmd+K toggles the quick switcher, "?" lists shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((o) => !o);
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (e.key === '?' && !typing) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  // A thread belongs to one conversation: close it when the user switches away.
  useEffect(() => {
    setThreadRootId(null);
  }, [activeConversationId]);

  const paletteActions: PaletteAction[] = [
    { id: 'new-chat', label: 'Start a new chat', run: onNewMessage },
    { id: 'go-chats', label: 'Go to Chats', run: () => { setActiveCategory('chats'); setMobileChatView(false); } },
    { id: 'go-groups', label: 'Go to Groups', run: () => setActiveCategory('groups') },
    { id: 'go-people', label: 'Go to People', run: () => setActiveCategory('people') },
    { id: 'go-settings', label: 'Open Settings', run: () => setActiveCategory('settings') },
    {
      id: 'theme',
      label: 'Switch theme (dark / light)',
      run: () => {
        const next = readTheme() === 'light' ? 'dark' : 'light';
        setTheme(next);
        toast(`Switched to ${next} theme`, { kind: 'success' });
      },
    },
    { id: 'shortcuts', label: 'Show keyboard shortcuts', hint: '?', run: () => setShortcutsOpen(true) },
  ];

  const communitiesEnabled = communities !== undefined;
  const activeCommunity = communities?.find((c) => c.id === activeCommunityId) ?? null;
  // Channels live inside their community; Home shows only direct messages and plain groups.
  const homeConversations = conversations.filter((c) => !c.communityId);
  const communityChannels = activeCommunity ? conversations.filter((c) => c.communityId === activeCommunity.id) : [];
  const visibleConversations = activeCommunity ? communityChannels : homeConversations;

  const activeConversation =
    visibleConversations.find((c) => c.id === activeConversationId) || visibleConversations[0];

  const groupConversations = homeConversations.filter((c) => c.type === 'group');
  const activeGroupConversation =
    (activeConversation?.type === 'group' ? activeConversation : undefined) || groupConversations[0];

  const unreadTotal = homeConversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadByCommunity: Record<string, number> = {};
  for (const c of conversations) {
    if (c.communityId && !c.isMuted) unreadByCommunity[c.communityId] = (unreadByCommunity[c.communityId] ?? 0) + c.unreadCount;
  }

  const selectCommunity = (id: string) => {
    setActiveCommunityId(id);
    setActiveCategory('chats');
    setMobileChatView(false);
    void onLoadCommunityMembers?.(id);
    const first = conversations.find((c) => c.communityId === id);
    if (first) onSelectConversation(first.id);
  };
  const selectHome = () => {
    setActiveCommunityId(null);
    setActiveCategory('chats');
    setMobileChatView(false);
    const first = homeConversations[0];
    if (first) onSelectConversation(first.id);
  };

  const threadRoot = threadRootId ? messages.find((m) => m.id === threadRootId) : undefined;
  const threadReplies = threadRootId ? messages.filter((m) => m.threadRootId === threadRootId) : [];
  const activeRoles = activeConversation?.groupMeta?.roles;
  const blockedDirect =
    activeConversation?.type === 'direct' && !!activeConversation.recipientUser && blockedIds.includes(activeConversation.recipientUser.id);
  // Messages from people you blocked are hidden inside groups and channels.
  const shownMessages = blockedIds.length === 0
    ? messages
    : messages.map((m) => (!m.isSelf && blockedIds.includes(m.senderId) ? { ...m, kind: 'system' as const, content: 'Message from someone you blocked', attachments: undefined, reactions: [] } : m));
  const iCanPost = !(activeConversation?.groupMeta?.onlyAdminsPost && activeRoles && !isGroupManager(activeRoles[currentUserId]));

  const handleStartDirectChat = (user: UserItem) => {
    const existing = conversations.find((c) => c.recipientUser?.id === user.id);
    if (existing) {
      onSelectConversation(existing.id);
    } else {
      onNewMessage();
    }
    setActiveCategory('chats');
    setMobileChatView(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-[var(--canvas-bg)] overflow-hidden font-sans pb-16 md:pb-0">
      {!online && (
        <div role="status" className="shrink-0 bg-amber-500/15 border-b border-amber-500/30 text-[var(--warning)] text-xs text-center py-1.5 px-3">
          You&apos;re offline. Messages will send when you reconnect.
        </div>
      )}
      {/* Main Workspace Body - Pure 2-Pane Edge-to-Edge Architecture */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {communitiesEnabled && (
        <div className={`${mobileChatView && activeCategory === 'chats' ? 'hidden md:flex' : 'flex'} md:h-full`}>
          <ServerRail
            communities={communities}
            activeCommunityId={activeCommunityId}
            unreadByCommunity={unreadByCommunity}
            homeUnread={unreadTotal}
            onSelectHome={selectHome}
            onSelectCommunity={selectCommunity}
            onAdd={() => setCreateOrJoinOpen(true)}
          />
        </div>
      )}
      <div className="flex-1 flex overflow-hidden relative h-full w-full">
        {/* Navigation Deck Pane (Desktop: Side Pane; Mobile: Single Pane when !mobileChatView) */}
        <div
          className={`${
            mobileChatView && activeCategory === 'chats' ? 'hidden md:flex' : 'flex'
          } h-full w-full md:w-80 lg:w-96 shrink-0`}
        >
          {activeCommunity ? (
            <CommunitySidebar
              community={activeCommunity}
              channels={communityChannels}
              activeConversationId={activeConversationId}
              onSelectChannel={(id) => {
                onSelectConversation(id);
                setMobileChatView(true);
              }}
              onOpenSettings={() => {
                void onLoadCommunityMembers?.(activeCommunity.id);
                setCommunitySettingsOpen(true);
              }}
              onCreateChannel={() => {
                void onLoadCommunityMembers?.(activeCommunity.id);
                setChannelDialogOpen(true);
              }}
            />
          ) : (
          <NavDeck
            currentUserName={currentUserName}
            currentUserRegistrationId={currentUserRegistrationId}
            userRole={currentUserRole}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setMobileChatView(false);
            }}
            conversations={homeConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              onSelectConversation(id);
              setMobileChatView(true);
              if (activeCategory !== 'chats' && activeCategory !== 'groups') {
                setActiveCategory('chats');
              }
            }}
            onNewMessage={onNewMessage}
            unreadTotal={unreadTotal}
            isLoading={isLoading}
            onStatusChanged={onStatusChanged}
            onGlobalSearchTrigger={() => setSearchModalOpen(true)}
            onPinConversation={onPinConversation}
            onMuteConversation={onMuteConversation}
            onArchiveConversation={onArchiveConversation}
            onMarkUnreadConversation={onMarkUnreadConversation}
            onClearHistoryConversation={onClearHistoryConversation}
            onDeleteConversationLocally={onDeleteConversationLocally}
          />
          )}
        </div>

        {/* Active Workspace / Conversation Pane */}
        <main
          id="main"
          tabIndex={-1}
          className={`${
            !mobileChatView && activeCategory === 'chats' ? 'hidden md:flex' : 'flex'
          } flex-1 h-full overflow-hidden relative`}
        >
          {activeCategory === 'chats' && activeConversation && (
            <>
              <ChatCanvas
                conversation={activeConversation}
                messages={shownMessages}
                onSendMessage={onSendMessage}
                replyTarget={
                  replyTargetMessage
                    ? {
                        id: replyTargetMessage.id,
                        senderName: replyTargetMessage.senderName,
                        snippet: replyTargetMessage.content,
                      }
                    : undefined
                }
                onReplyToMessage={(msg) => setReplyTargetMessage(msg)}
                onClearReply={() => setReplyTargetMessage(undefined)}
                onReactToMessage={onReactToMessage}
                onToggleInspector={() => setShowInspector(!showInspector)}
                onEditMessage={(msg) => setEditingMessage(msg)}
                onDeleteMessage={onDeleteMessageLocal}
                onForwardMessage={(msg) => setForwardingMessage(msg)}
                onPinMessage={onPinMessageToggle}
                onStarMessage={onToggleSaved ?? onStarMessageToggle}
                onOpenThread={(msg) => setThreadRootId(msg.id)}
                readOnlyReason={
                  blockedDirect
                    ? `You blocked ${activeConversation.title}. Unblock them in Settings, Privacy & Security, to message them.`
                    : iCanPost
                    ? undefined
                    : 'Only admins can post in this group.'
                }
                onSetDisappear={
                  onSetDisappearing && (activeConversation.type === 'direct' || (activeRoles && isGroupManager(activeRoles[currentUserId])))
                    ? (seconds) => onSetDisappearing(activeConversation.id, seconds)
                    : undefined
                }
                onAcceptKeyChange={onAcceptKeyChange ? () => onAcceptKeyChange(activeConversation.id) : undefined}
                onVerifyPeer={onVerifyPeer ? () => onVerifyPeer(activeConversation.id) : undefined}
                onReportMessage={onReportMessage ? (m) => setReportingMessage(m) : undefined}
                onStartCall={
                  onStartCall && !callActive && activeConversation.type === 'direct' && activeConversation.recipientUser && !blockedDirect
                    ? (video) => onStartCall(activeConversation.recipientUser!.id, video)
                    : undefined
                }
                onSetNotify={onSetConversationNotify ? (level, ms) => onSetConversationNotify(activeConversation.id, level, ms) : undefined}
                mentionCandidates={users.filter((u) => u.id !== currentUserId && (activeConversation.groupMeta?.memberIds?.includes(u.id) ?? false))}
                typingNames={typingNames}
                onTyping={onTyping}
                canLoadOlder={canLoadOlder}
                onLoadOlder={onLoadOlder}
                isLoadingMessages={isLoadingMessages}
                onDownloadAttachment={onDownloadAttachment}
                onRetryFailedMessage={onRetryFailedMessage}
                editingMessage={editingMessage}
                onSaveEditMessage={(msgId, newContent) => {
                  if (onEditMessageSubmit) onEditMessageSubmit(msgId, newContent);
                  setEditingMessage(undefined);
                }}
                onCancelEdit={() => setEditingMessage(undefined)}
                onBackToList={() => setMobileChatView(false)}
              />

              {threadRoot && (
                <ThreadPanel
                  root={threadRoot}
                  replies={threadReplies}
                  canPost={iCanPost}
                  onClose={() => setThreadRootId(null)}
                  onSend={(content, file, voiceMs) => onSendMessage(content, undefined, file, voiceMs, threadRoot.id)}
                  onReactToMessage={onReactToMessage}
                  onDownloadAttachment={onDownloadAttachment}
                  onRetryFailedMessage={onRetryFailedMessage}
                  onTyping={onTyping}
                />
              )}

              {/* Context Inspector Deck (Desktop slide-over) */}
              {showInspector && (
                <div className="absolute top-0 right-0 bottom-0 w-80 lg:w-96 bg-[var(--surface-1)] border-l border-[var(--border-subtle)] shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-slate-950/40">
                    <span className="text-xs font-bold text-slate-100">Conversation Details</span>
                    <button
                      onClick={() => setShowInspector(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <InspectorDeck
                      conversation={activeConversation}
                      devices={devices}
                      members={users}
                      messages={messages}
                      onDownloadAttachment={onDownloadAttachment}
                      onVerifyIdentityKey={onVerifyPeer ? () => onVerifyPeer(activeConversation.id) : undefined}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty Conversation State */}
          {activeCategory === 'chats' && !activeConversation && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--canvas-bg)]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-md">
                <IconLock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">No Conversations Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                Your messages are end-to-end encrypted. Start a direct conversation or group space to begin messaging securely.
              </p>
              <Button variant="primary" size="md" onClick={onNewMessage} className="gap-2">
                <IconPlus className="w-4 h-4" />
                <span>Start New Chat</span>
              </Button>
            </div>
          )}

          {activeCategory === 'groups' && activeGroupConversation && (
            <GroupSpaceView
              group={activeGroupConversation}
              currentUserId={currentUserId}
              onSetRole={onSetMemberRole ? (userId, role) => onSetMemberRole(activeGroupConversation.id, userId, role) : undefined}
              onUpdateSettings={onUpdateGroupSettings ? (patch) => onUpdateGroupSettings(activeGroupConversation.id, patch) : undefined}
              onLeaveGroup={onLeaveGroup}
              members={[
                ...(activeGroupConversation.groupMeta?.memberIds?.includes(currentUserId)
                  ? [{ id: currentUserId, name: currentUserName, registrationId: currentUserRegistrationId, role: currentUserRole, deviceCount: 1, joinedAt: '', identityFingerprint: '', presence: 'online' as const }]
                  : []),
                ...users.filter((u) => u.id !== currentUserId && activeGroupConversation.groupMeta?.memberIds?.includes(u.id)),
              ]}
              availableUsersToAdd={users.filter((u) => u.id !== currentUserId && !activeGroupConversation.groupMeta?.memberIds?.includes(u.id))}
              messages={messagesMap[activeGroupConversation.id] || []}
              onOpenChat={(id) => {
                onSelectConversation(id);
                setActiveCategory('chats');
              }}
              onAddMember={onAddGroupMember ? (userId) => onAddGroupMember(activeGroupConversation.id, userId) : undefined}
              onRemoveMember={onRemoveGroupMember ? (userId) => onRemoveGroupMember(activeGroupConversation.id, userId) : undefined}
            />
          )}

          {activeCategory === 'groups' && !activeGroupConversation && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <p className="text-sm text-slate-400 max-w-xs">You&apos;re not in any groups yet. Start a new chat and choose &quot;Group&quot; to create one.</p>
              <Button variant="primary" size="sm" onClick={onNewMessage} className="flex items-center gap-1.5">
                <IconPlus className="w-4 h-4" />
                <span>Create Group</span>
              </Button>
            </div>
          )}

          {activeCategory === 'saved' && (
            <SavedMessagesView
              saved={savedMessages}
              conversations={conversations}
              onOpenConversation={(id) => {
                onSelectConversation(id);
                setActiveCategory('chats');
                setMobileChatView(true);
              }}
              onUnsave={(id) => onToggleSaved?.(id)}
            />
          )}

          {activeCategory === 'people' && (
            <PeopleDirectory
              users={users}
              onStartDirectChat={(u) => {
                setSelectedProfileUser(u);
              }}
            />
          )}

          {activeCategory === 'settings' && (
            <SettingsView
              currentUser={
                currentUser || {
                  id: currentUserId,
                  name: currentUserName,
                  registrationId: currentUserRegistrationId,
                  role: currentUserRole,
                  deviceCount: devices.length,
                  joinedAt: 'Active',
                  identityFingerprint: '',
                  presence: 'online',
                }
              }
              devices={devices}
              identityFingerprint={currentUser?.identityFingerprint ?? ''}
              registrationId={currentUserRegistrationId}
              onExportKeyBackup={onExportKeyBackup}
              onRestoreKeyBackup={onRestoreKeyBackup}
              onRevokeDevice={onRevokeDevice}
              onLogout={onLogout}
              privacyProps={privacyProps}
            />
          )}

          {activeCategory === 'admin' && currentUserRole === 'admin' && (
            <AdminDashboard
              users={users}
              onToggleUserRole={onToggleUserRole}
            />
          )}
        </main>

        {/* Mobile Inspector Drawer */}
        {mobileInspectorOpen && activeConversation && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden bg-black/70 backdrop-blur-xs">
            <button
              className="flex-1 h-full"
              onClick={() => setMobileInspectorOpen(false)}
              aria-label="Close inspector"
            />
            <div className="w-80 h-full bg-[var(--surface-1)]">
              <InspectorDeck
                conversation={activeConversation}
                devices={devices}
                members={users}
              />
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        unreadTotal={unreadTotal}
        userRole={currentUserRole}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Quick switcher (Ctrl/Cmd+K) and shortcut list */}
      <ShortcutsDialog isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        conversations={conversations}
        users={users}
        messagesMap={messagesMap}
        actions={paletteActions}
        onSelectConversation={(id) => {
          onSelectConversation(id);
          setActiveCategory('chats');
          setMobileChatView(true);
        }}
        onSelectUser={(u) => {
          setSelectedProfileUser(u);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedProfileUser}
        isOpen={selectedProfileUser !== null}
        onClose={() => setSelectedProfileUser(null)}
        onStartChat={(u) => handleStartDirectChat(u)}
        sharedGroups={conversations.filter((c) => c.type === 'group')}
        isBlocked={!!selectedProfileUser && blockedIds.includes(selectedProfileUser.id)}
        onBlock={onBlockUser && selectedProfileUser?.id !== currentUserId ? (u) => onBlockUser(u.id) : undefined}
        onUnblock={onUnblockUser ? (u) => onUnblockUser(u.id) : undefined}
      />

      <ReportDialog
        message={reportingMessage}
        onClose={() => setReportingMessage(null)}
        onSubmit={async (messageId, reason, includeText) => (await onReportMessage?.(messageId, reason, includeText)) ?? false}
      />

      {communitiesEnabled && (
        <>
          <CreateOrJoinDialog
            isOpen={createOrJoinOpen}
            onClose={() => setCreateOrJoinOpen(false)}
            initialCode={initialInviteCode}
            onCreate={async (name, description) => {
              const res = await onCreateCommunity?.(name, description);
              if (res) {
                setActiveCommunityId(res.communityId);
                setActiveCategory('chats');
                setMobileChatView(true);
                onSelectConversation(res.channelId);
              }
              return !!res;
            }}
            onJoin={async (code) => {
              const id = await onJoinCommunity?.(code);
              if (id) selectCommunity(id);
              return !!id;
            }}
          />
          {activeCommunity && (
            <>
              <CreateChannelDialog
                isOpen={channelDialogOpen}
                onClose={() => setChannelDialogOpen(false)}
                members={communityMembers[activeCommunity.id] ?? []}
                currentUserId={currentUserId}
                onCreate={async (name, isPrivate, memberIds) => {
                  const id = await onCreateChannel?.(activeCommunity.id, name, isPrivate, memberIds);
                  if (id) {
                    onSelectConversation(id);
                    setMobileChatView(true);
                  }
                  return !!id;
                }}
              />
              <CommunitySettingsDialog
                isOpen={communitySettingsOpen}
                onClose={() => setCommunitySettingsOpen(false)}
                community={activeCommunity}
                members={communityMembers[activeCommunity.id] ?? []}
                currentUserId={currentUserId}
                onCreateInvite={async () => (await onCreateInvite?.(activeCommunity.id)) ?? null}
                onSetRole={async (userId, role) => {
                  await onSetCommunityRole?.(activeCommunity.id, userId, role);
                }}
                onRemove={async (userId) => {
                  await onRemoveCommunityMember?.(activeCommunity.id, userId);
                }}
                onLeave={async () => {
                  const ok = (await onLeaveCommunity?.(activeCommunity.id)) ?? false;
                  if (ok) selectHome();
                  return ok;
                }}
              />
            </>
          )}
        </>
      )}

      {/* Forward Message Modal */}
      <ForwardMessageModal
        message={forwardingMessage}
        conversations={conversations}
        isOpen={forwardingMessage !== null}
        onClose={() => setForwardingMessage(null)}
        onForwardToConversation={(targetConvId, msg) => {
          if (onForwardMessageToTarget) onForwardMessageToTarget(targetConvId, msg);
        }}
      />
    </div>
  );
};
