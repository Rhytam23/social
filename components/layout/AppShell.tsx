import React, { useState } from 'react';
import { ViewCategory, ConversationItem, MessageData, DeviceItem, UserItem, InviteItem } from '../../types/ui';
import { NavDeck } from './NavDeck';
import { MobileNav } from './MobileNav';
import { ChatCanvas } from '../chat/ChatCanvas';
import { InspectorDeck } from '../chat/InspectorDeck';
import { PeopleDirectory } from '../people/PeopleDirectory';
import { SecuritySettings } from '../settings/SecuritySettings';
import { AdminDashboard } from '../admin/AdminDashboard';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
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
  onSendMessage: (content: string, replyToId?: string, attachmentFile?: File) => void;
  onReactToMessage: (msgId: string, emoji: string) => void;
  onEditMessageSubmit?: (msgId: string, newContent: string) => void;
  onDeleteMessageLocal?: (msgId: string) => void;
  onForwardMessageToTarget?: (targetConvId: string, msg: MessageData) => void;
  onPinMessageToggle?: (msgId: string) => void;
  onStarMessageToggle?: (msgId: string) => void;

  devices: DeviceItem[];
  users: UserItem[];
  invites: InviteItem[];

  onGenerateInvite: () => Promise<string>;
  onRevokeInvite: (inviteId: string) => void;
  onToggleUserRole: (userId: string, currentRole: 'admin' | 'member') => void;

  onExportKeyBackup: (passphrase: string) => Promise<void>;
  onRestoreKeyBackup: (passphrase: string, backupJson: string) => Promise<void>;
  onRevokeDevice: (deviceId: string) => void;

  onNewMessage: () => void;
  onInviteMember: () => void;

  // Conversation Management Handlers
  onPinConversation?: (convId: string) => void;
  onMuteConversation?: (convId: string) => void;
  onArchiveConversation?: (convId: string) => void;
  onMarkUnreadConversation?: (convId: string) => void;
  onClearHistoryConversation?: (convId: string) => void;
  onDeleteConversationLocally?: (convId: string) => void;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
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
  devices,
  users,
  invites,
  onGenerateInvite,
  onRevokeInvite,
  onToggleUserRole,
  onExportKeyBackup,
  onRestoreKeyBackup,
  onRevokeDevice,
  onNewMessage,
  onInviteMember,
  onPinConversation,
  onMuteConversation,
  onArchiveConversation,
  onMarkUnreadConversation,
  onClearHistoryConversation,
  onDeleteConversationLocally,
  onLogout,
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

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

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
    <div className="flex flex-col h-screen w-screen bg-[var(--canvas-bg)] overflow-hidden font-sans pb-16 md:pb-0">
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
            onInviteMember={onInviteMember}
            unreadTotal={unreadTotal}
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
        <div
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
                onStarMessage={onStarMessageToggle}
                editingMessage={editingMessage}
                onSaveEditMessage={(msgId, newContent) => {
                  if (onEditMessageSubmit) onEditMessageSubmit(msgId, newContent);
                  setEditingMessage(undefined);
                }}
                onCancelEdit={() => setEditingMessage(undefined)}
                onBackToList={() => setMobileChatView(false)}
              />

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

          {activeCategory === 'groups' && activeConversation && (
            <GroupSpaceView
              group={activeConversation}
              members={users}
              messages={messages}
              onOpenChat={() => setActiveCategory('chats')}
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
            <SecuritySettings
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
              invites={invites}
              users={users}
              onGenerateInvite={onGenerateInvite}
              onRevokeInvite={onRevokeInvite}
              onToggleUserRole={onToggleUserRole}
            />
          )}
        </div>

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
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        conversations={conversations}
        users={users}
        messagesMap={messagesMap}
        onSelectConversation={(id) => {
          onSelectConversation(id);
          setActiveCategory('chats');
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
