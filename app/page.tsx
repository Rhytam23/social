'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '../hooks/useChatStore';
import { AppShell } from '../components/layout/AppShell';
import { NewConversationModal } from '../components/chat/NewConversationModal';
import { LoginForm } from '../components/auth/LoginForm';
import { LandingPage } from '../components/landing/LandingPage';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { UserItem, MessageData } from '../types/ui';
import { createClient } from '../lib/supabase/client';
import { isSupabaseConfigured, isDemoModeAllowed } from '../lib/supabase/env';
import { MessagingCrypto } from '../lib/messaging/messagingCrypto';
import type { RealtimeMessageRow } from '../lib/store/chatStore';
import { createKeyBackup, restoreKeyBackup } from '../crypto';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProfileRow {
  id: string;
  display_name?: string;
  username?: string;
  phone_number?: string;
  avatar_url?: string | null;
  is_admin?: boolean;
}

export default function HomePage() {
  const [state, store] = useChatStore();
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const cryptoRef = useRef<MessagingCrypto | null>(null);
  const initedRef = useRef(false);

  const configured = isSupabaseConfigured();

  const setupRealtimeSubscription = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const conversationIds = state.conversations.map((c) => c.id);
    // Filtered by our known conversation ids as defense-in-depth; RLS
    // (messages_select_policy) is the authoritative backstop even if this
    // filter is momentarily stale (e.g. right after being added to a group).
    const messageFilter = conversationIds.length > 0 ? { filter: `conversation_id=in.(${conversationIds.join(',')})` } : {};
    const channel = supabase
      .channel('realtime-messages-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', ...messageFilter },
        (payload) => {
          void store.receiveRealtimeMessageRow(payload.new as RealtimeMessageRow);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', ...messageFilter },
        (payload) => {
          void store.receiveRealtimeMessageUpdate(payload.new as RealtimeMessageRow);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [configured, state.conversations, store]);

  const bootstrapSession = useCallback(async () => {
    if (!configured) {
      if (isDemoModeAllowed()) {
        store.initDemoMode();
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
      return;
    }

    let signedIn = false;
    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        return;
      }

      signedIn = true;
      setBootError(null);
      setIsAuthenticated(true);

      const { data: profile } = (await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()) as { data: ProfileRow | null };

      const displayName =
        profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

      if (typeof window !== 'undefined') {
        const completed = localStorage.getItem(`private_chat_onboarding_completed_${user.id}`);
        if (!completed && (!profile?.display_name || profile.display_name === 'User')) {
          setOnboardingOpen(true);
        }
      }

      const crypto = new MessagingCrypto(supabase, user.id);
      await crypto.waitReady();
      cryptoRef.current = crypto;

      await store.initializeForUser(supabase, crypto, {
        id: user.id,
        name: displayName,
        username: profile?.username || user.email?.split('@')[0],
        email: user.email,
        phoneNumber: profile?.phone_number,
        role: profile?.is_admin ? 'admin' : 'member',
      });

      if (profile?.avatar_url) {
        store.updateCurrentUserProfile({ avatarUrl: profile.avatar_url });
      }
    } catch (err) {
      // Only a failed auth check may send the user back to the landing page.
      // If we already know they're signed in, a later setup failure (profile
      // fetch, key setup, store init) must not look like being logged out.
      if (signedIn) {
        console.error('Post-login setup failed', err);
        setBootError(err instanceof Error ? err.message : 'Could not finish setting up your session.');
      } else {
        setIsAuthenticated(false);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [configured, store]);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    void bootstrapSession();

    return () => {
      if (realtimeChannelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re-)subscribe to realtime whenever the set of conversations we belong
  // to changes, so newly created/joined conversations are actually covered.
  const conversationIdsKey = state.conversations.map((c) => c.id).sort().join(',');
  useEffect(() => {
    if (isAuthenticated && configured && state.mode === 'connected') {
      void setupRealtimeSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, configured, state.mode, conversationIdsKey]);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ||
    state.conversations[0];

  const activeMessages = activeConversation
    ? state.messagesMap[activeConversation.id] || []
    : [];

  const handleSendMessage = (content: string, replyToId?: string, attachmentFile?: File, voiceDurationMs?: number) => {
    void store.sendMessage(content, replyToId, attachmentFile, voiceDurationMs);
  };

  const handleDownloadAttachment = (msgId: string, attachmentId: string) => {
    void store.downloadAttachment(msgId, attachmentId);
  };

  const handleRetryFailedMessage = (msgId: string) => {
    void store.retryFailedMessage(msgId);
  };

  const handleAddGroupMember = (groupId: string, userId: string) => {
    void store.addGroupMember(groupId, userId);
  };

  const handleRemoveGroupMember = (groupId: string, userId: string) => {
    void store.removeGroupMember(groupId, userId);
  };

  const handleReactToMessage = (msgId: string, emoji: string) => {
    void store.reactToMessage(msgId, emoji);
  };

  const handleEditMessageSubmit = (msgId: string, newContent: string) => {
    void store.editMessage(msgId, newContent);
  };

  const handleDeleteMessageLocal = (msgId: string) => {
    void store.deleteMessage(msgId);
  };

  const handleForwardMessageToTarget = (targetConvId: string, msg: MessageData) => {
    void store.forwardMessage(targetConvId, msg);
  };

  const handlePinMessageToggle = (msgId: string) => {
    store.pinMessage(msgId);
  };

  const handleStarMessageToggle = (msgId: string) => {
    store.starMessage(msgId);
  };

  const handleToggleUserRole = (userId: string, currentRole: 'admin' | 'member') => {
    void store.toggleUserRole(userId, currentRole);
  };

  const handleExportKeyBackup = async (passphrase: string) => {
    const crypto = cryptoRef.current;
    if (!crypto) throw new Error('Encryption is not ready yet');
    const backup = await createKeyBackup(passphrase, crypto.getKeyStore());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `private-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRestoreKeyBackup = async (passphrase: string, backupJson: string) => {
    const crypto = cryptoRef.current;
    if (!crypto) throw new Error('Encryption is not ready yet');
    const backup = JSON.parse(backupJson);
    await restoreKeyBackup(passphrase, backup, crypto.getKeyStore());
    await crypto.getKeyStore().persist();
  };

  const handleRevokeDevice = (deviceId: string) => {
    void store.revokeDevice(deviceId);
  };

  const handleStartDirectChat = async (user: UserItem) => {
    setNewChatModalOpen(false);
    await store.createDirectConversation(user);
  };

  const handleCreateGroupChat = async (groupName: string, memberIds: string[]) => {
    setNewChatModalOpen(false);
    await store.createGroupConversation(groupName, memberIds);
  };

  const handleLogout = async () => {
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    }
    cryptoRef.current = null;
    store.logout();
    setIsAuthenticated(false);
  };

  // Loading State
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[var(--canvas-bg)] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-300">Unlocking Private Chat...</span>
        </div>
      </div>
    );
  }

  // Server misconfigured in production and middleware somehow didn't already
  // catch it (e.g. a static/prerendered edge case) - fail loudly rather than
  // silently granting access.
  if (configured === false && !isDemoModeAllowed() && isAuthenticated === false) {
    return (
      <div className="h-screen w-screen bg-[#070b14] flex flex-col items-center justify-center font-sans text-center p-6">
        <h1 className="text-sm font-bold text-rose-400 mb-2">Server misconfiguration</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. This deployment cannot authenticate users.
        </p>
      </div>
    );
  }

  if (isAuthenticated && bootError) {
    return (
      <div className="h-screen w-screen bg-[#070b14] flex flex-col items-center justify-center font-sans text-center p-6 gap-3">
        <h1 className="text-sm font-bold text-rose-400">You&apos;re signed in, but setup didn&apos;t finish</h1>
        <p className="text-xs text-slate-400 max-w-sm break-words">{bootError}</p>
        <button
          onClick={() => {
            setBootError(null);
            setAuthLoading(true);
            void bootstrapSession();
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // Not Authenticated -> Show Landing Page or Login / Register Flow
  if (configured && !isAuthenticated) {
    if (authModalTab) {
      return (
        <div className="relative min-h-screen bg-[#070b14]">
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => setAuthModalTab(null)}
              className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              ← Back to Overview
            </button>
          </div>
          <LoginForm
            initialTab={authModalTab}
            onLoginSuccess={() => {
              setAuthModalTab(null);
              initedRef.current = false;
              setAuthLoading(true);
              void bootstrapSession();
            }}
          />
        </div>
      );
    }

    return <LandingPage onOpenAuth={(mode) => setAuthModalTab(mode || 'signin')} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {state.mode === 'demo' && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-300 font-sans z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Local Demo Environment (development only, not connected to Supabase)</span>
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

      {state.error && (
        <div className="bg-rose-950/60 border-b border-rose-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-rose-300 font-sans z-50">
          <span>{state.error}</span>
          <button onClick={() => store.clearError()} className="text-rose-400 hover:text-white font-semibold">
            Dismiss
          </button>
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
        onDownloadAttachment={handleDownloadAttachment}
        onRetryFailedMessage={handleRetryFailedMessage}
        onAddGroupMember={handleAddGroupMember}
        onRemoveGroupMember={handleRemoveGroupMember}
        devices={state.devices}
        users={state.allUsers}
        onToggleUserRole={handleToggleUserRole}
        onExportKeyBackup={handleExportKeyBackup}
        onRestoreKeyBackup={handleRestoreKeyBackup}
        onRevokeDevice={handleRevokeDevice}
        onNewMessage={() => setNewChatModalOpen(true)}
        onPinConversation={(id) => store.pinConversation(id)}
        onMuteConversation={(id) => store.muteConversation(id)}
        onArchiveConversation={(id) => store.archiveConversation(id)}
        onMarkUnreadConversation={(id) => store.markUnreadConversation(id)}
        onClearHistoryConversation={(id) => store.clearHistoryConversation(id)}
        onDeleteConversationLocally={(id) => store.deleteConversationLocally(id)}
        onLogout={handleLogout}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        userId={state.currentUser.id}
        initialName={state.currentUser.name}
        onProfileUpdated={(name) => store.updateCurrentUserProfile({ name })}
        onStartFirstChat={() => setNewChatModalOpen(true)}
      />

      <NewConversationModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        users={state.allUsers}
        currentUserId={state.currentUser.id}
        onStartDirectChat={handleStartDirectChat}
        onCreateGroupChat={handleCreateGroupChat}
      />
    </div>
  );
}
