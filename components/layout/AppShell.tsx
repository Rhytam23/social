import React, { useEffect, useState } from 'react';
import { ViewCategory, ConversationItem, MessageData, DeviceItem, UserItem } from '../../types/ui';
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

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const groupConversations = conversations.filter((c) => c.type === 'group');
  const activeGroupConversation =
    (activeConversation?.type === 'group' ? activeConversation : undefined) || groupConversations[0];

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const threadRoot = threadRootId ? messages.find((m) => m.id === threadRootId) : undefined;
  const threadReplies = threadRootId ? messages.filter((m) => m.threadRootId === threadRootId) : [];
  const activeRoles = activeConversation?.groupMeta?.roles;
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
      <div className="flex-1 flex overflow-hidden relative h-full w-full">
        {/* Navigation Deck Pane (Desktop: Side Pane; Mobile: Single Pane when !mobileChatView) */}
        <div
          className={`${
            mobileChatView && activeCategory === 'chats' ? 'hidden md:flex' : 'flex'
          } h-full w-full md:w-80 lg:w-96 shrink-0`}
        >
          <NavDeck
            currentUserName={currentUserName}
            currentUserRegistrationId={currentUserRegistrationId}
            userRole={currentUserRole}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setMobileChatView(false);
            }}
            conversations={conversations}
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
                messages={messages}
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
                readOnlyReason={iCanPost ? undefined : 'Only admins can post in this group.'}
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
                users.find((u) => u.id === currentUserId) || {
                  id: currentUserId,
                  name: currentUserName,
                  registrationId: currentUserRegistrationId,
                  role: currentUserRole,
                  deviceCount: devices.length,
                  joinedAt: 'Active',
                  identityFingerprint: '45A8-99F1-20B3-881C-00D9-FF41-92A3-77E5',
                  presence: 'online',
                }
              }
              devices={devices}
              identityFingerprint="45A8-99F1-20B3-881C-00D9-FF41-92A3-77E5"
              registrationId={currentUserRegistrationId}
              onExportKeyBackup={onExportKeyBackup}
              onRestoreKeyBackup={onRestoreKeyBackup}
              onRevokeDevice={onRevokeDevice}
              onLogout={onLogout}
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
      />

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
