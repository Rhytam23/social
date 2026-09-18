'use client';

import React, { useState } from 'react';
import { useChatStore } from '../hooks/useChatStore';
import { AppShell } from '../components/layout/AppShell';
import { NewConversationModal } from '../components/chat/NewConversationModal';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { UserItem, MessageData } from '../types/ui';

export default function HomePage() {
  const [state, store] = useChatStore();
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ||
    state.conversations[0];

  const activeMessages = activeConversation
    ? state.messagesMap[activeConversation.id] || []
    : [];

  const handleSendMessage = (content: string, replyToId?: string, attachmentFile?: File) => {
    store.sendMessage(content, replyToId, attachmentFile);
  };

  const handleReactToMessage = (msgId: string, emoji: string) => {
    store.reactToMessage(msgId, emoji);
  };

  const handleEditMessageSubmit = (msgId: string, newContent: string) => {
    store.editMessage(msgId, newContent);
  };

  const handleDeleteMessageLocal = (msgId: string) => {
    store.deleteMessage(msgId);
  };

  const handleForwardMessageToTarget = (targetConvId: string, msg: MessageData) => {
    store.forwardMessage(targetConvId, msg);
  };

  const handlePinMessageToggle = (msgId: string) => {
    store.pinMessage(msgId);
  };

  const handleStarMessageToggle = (msgId: string) => {
    store.starMessage(msgId);
  };

  const handleGenerateInvite = async (): Promise<string> => {
    const token = store.generateInvite();
    setGeneratedToken(token);
    return token;
  };

  const handleRevokeInvite = (inviteId: string) => {
    store.revokeInvite(inviteId);
  };

  const handleToggleUserRole = (userId: string, currentRole: 'admin' | 'member') => {
    store.toggleUserRole(userId, currentRole);
  };

  const handleExportKeyBackup = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  const handleRestoreKeyBackup = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  const handleRevokeDevice = (deviceId: string) => {
    store.revokeDevice(deviceId);
  };

  const handleStartDirectChat = (user: UserItem) => {
    store.createDirectConversation(user);
    setNewChatModalOpen(false);
  };

  const handleCreateGroupChat = (groupName: string, memberIds: string[]) => {
    store.createGroupConversation(groupName, memberIds);
    setNewChatModalOpen(false);
  };

  return (
    <>
      {/* Development / Multi-Tab Synchronization Indicator Bar */}
      {state.mode === 'demo' && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-300 font-sans z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Local Demo Environment</span>
            <span className="text-emerald-400/70 hidden sm:inline">
              • Real-time multi-tab synchronization active (BroadcastChannel + LocalStorage)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400/80">Active Persona:</span>
            <select
              value={state.currentUser.id}
              onChange={(e) => store.switchDemoUser(e.target.value)}
              className="bg-emerald-900/80 border border-emerald-600/40 text-emerald-100 text-xs rounded px-2 py-0.5 font-medium focus:outline-none"
            >
              {state.allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <AppShell
        currentUserId={state.currentUser.id}
        currentUserName={state.currentUser.name}
        currentUserRegistrationId={state.currentUser.registrationId}
        currentUserRole={state.currentUser.role}
        conversations={state.conversations}
        activeConversationId={state.activeConversationId}
        onSelectConversation={(id) => store.selectConversation(id)}
        messagesMap={state.messagesMap}
        messages={activeMessages}
        onSendMessage={handleSendMessage}
        onReactToMessage={handleReactToMessage}
        onEditMessageSubmit={handleEditMessageSubmit}
        onDeleteMessageLocal={handleDeleteMessageLocal}
        onForwardMessageToTarget={handleForwardMessageToTarget}
        onPinMessageToggle={handlePinMessageToggle}
        onStarMessageToggle={handleStarMessageToggle}
        devices={state.devices}
        users={state.allUsers}
        invites={state.invites}
        onGenerateInvite={handleGenerateInvite}
        onRevokeInvite={handleRevokeInvite}
        onToggleUserRole={handleToggleUserRole}
        onExportKeyBackup={handleExportKeyBackup}
        onRestoreKeyBackup={handleRestoreKeyBackup}
        onRevokeDevice={handleRevokeDevice}
        onNewMessage={() => setNewChatModalOpen(true)}
        onInviteMember={() => {
          setGeneratedToken(null);
          setInviteModalOpen(true);
        }}
        onPinConversation={(id) => store.pinConversation(id)}
        onMuteConversation={(id) => store.muteConversation(id)}
        onArchiveConversation={(id) => store.archiveConversation(id)}
        onMarkUnreadConversation={(id) => store.markUnreadConversation(id)}
        onClearHistoryConversation={(id) => store.clearHistoryConversation(id)}
        onDeleteConversationLocally={(id) => store.deleteConversationLocally(id)}
      />

      {/* New Direct / Group Conversation Modal */}
      <NewConversationModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        users={state.allUsers}
        currentUserId={state.currentUser.id}
        onStartDirectChat={handleStartDirectChat}
        onCreateGroupChat={handleCreateGroupChat}
      />

      {/* Invite Member Dialog */}
      <Dialog
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Generate Platform Invite Token"
        footerAction={
          !generatedToken ? (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await handleGenerateInvite();
              }}
            >
              Generate Token
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setInviteModalOpen(false)}>
              Done
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-3 font-sans text-xs">
          {generatedToken ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col gap-1.5">
              <span className="text-emerald-400 font-semibold">Invite Token Generated:</span>
              <span className="font-mono text-xs bg-slate-900 p-2 rounded border border-slate-800 text-slate-100 select-all">
                {generatedToken}
              </span>
              <span className="text-[11px] text-slate-400">
                Share this token with the new member to redeem upon registration.
              </span>
            </div>
          ) : (
            <p className="text-slate-400">
              This issues a single-use invite token. Once redeemed during registration, it establishes cryptographic device registration for the new user.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
