'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '../hooks/useChatStore';
import { AppShell } from '../components/layout/AppShell';
import { NewConversationModal } from '../components/chat/NewConversationModal';
import { LoginForm } from '../components/auth/LoginForm';
import { LandingPage } from '../components/landing/LandingPage';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { UserItem, MessageData, ConversationItem } from '../types/ui';
import { createClient } from '../lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProfileRow {
  id: string;
  display_name?: string;
  username?: string;
  phone_number?: string;
  is_admin?: boolean;
}

interface MemberConversationJoin {
  conversation_id: string;
  conversations: {
    id: string;
    name?: string;
    type?: 'direct' | 'group';
  } | null;
}

interface RealtimeMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  nonce: string;
  created_at: string;
  reply_to_message_id?: string | null;
}

export default function HomePage() {
  const [state, store] = useChatStore();
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Landing & Onboarding State
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Supabase Auth & Live State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const isSupabaseConfigured =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const checkUserSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsAuthenticated(true);
      setAuthLoading(false);
      return;
    }

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

      setIsAuthenticated(true);

      // Fetch user profile
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

      store.setUserProfile({
        id: user.id,
        name: displayName,
        username: profile?.username || user.email?.split('@')[0],
        email: user.email,
        phoneNumber: profile?.phone_number,
        role: profile?.is_admin ? 'admin' : 'member',
      });

      // Load user conversations
      const { data: memberRows } = (await supabase
        .from('conversation_members')
        .select('conversation_id, conversations(*)')
        .eq('user_id', user.id)
        .is('left_at', null)) as { data: MemberConversationJoin[] | null };

      if (memberRows && memberRows.length > 0) {
        const conversations: ConversationItem[] = memberRows.map((row: MemberConversationJoin) => {
          const conv = row.conversations;
          return {
            id: conv?.id || row.conversation_id,
            title: conv?.name || 'Direct Chat',
            type: conv?.type === 'group' ? 'group' : 'direct',
            unreadCount: 0,
            lastMessage: {
              snippet: 'Tap to view messages',
              timestamp: 'Recently',
              status: 'delivered',
            },
          };
        });
        store.setConversations(conversations);
      }

      // Initialize Supabase Realtime Subscription for incoming messages
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = supabase
        .channel('realtime-messages-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new) {
              store.receiveSupabaseMessage(payload.new as RealtimeMessageRow);
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    } catch {
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [isSupabaseConfigured, store]);

  useEffect(() => {
    checkUserSession();

    return () => {
      if (realtimeChannelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [checkUserSession]);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ||
    state.conversations[0];

  const activeMessages = activeConversation
    ? state.messagesMap[activeConversation.id] || []
    : [];

  const handleSendMessage = async (content: string, replyToId?: string, attachmentFile?: File) => {
    // 1. Optimistic UI update in local store
    store.sendMessage(content, replyToId, attachmentFile);

    // 2. Persist to live Supabase if connected
    if (isSupabaseConfigured && state.activeConversationId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const ciphertext =
            typeof window !== 'undefined' && window.btoa ? window.btoa(content) : content;
          const nonce = typeof window !== 'undefined' && window.btoa ? window.btoa(Math.random().toString()) : 'nonce';

          await supabase.from('messages').insert([
            {
              conversation_id: state.activeConversationId,
              sender_id: user.id,
              ciphertext,
              nonce,
              encryption_version: 1,
              reply_to_message_id: replyToId || null,
            },
          ]);
        }
      } catch {
        // Local store already holds message optimistically
      }
    }
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

  const handleStartDirectChat = async (user: UserItem) => {
    // 1. Optimistic store creation
    store.createDirectConversation(user);
    setNewChatModalOpen(false);

    // 2. Persist to Supabase if connected
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          const { data: convData } = await supabase
            .from('conversations')
            .insert({
              type: 'private',
              created_by: currentUser.id,
            })
            .select('id')
            .single();

          if (convData) {
            await supabase.from('conversation_members').insert([
              { conversation_id: convData.id, user_id: currentUser.id },
              { conversation_id: convData.id, user_id: user.id },
            ]);
          }
        }
      } catch {
        // Fallback to local store
      }
    }
  };

  const handleCreateGroupChat = async (groupName: string, memberIds: string[]) => {
    // 1. Optimistic store creation
    store.createGroupConversation(groupName, memberIds);
    setNewChatModalOpen(false);

    // 2. Persist to Supabase if connected
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          const { data: convData } = await supabase
            .from('conversations')
            .insert({
              type: 'group',
              name: groupName,
              created_by: currentUser.id,
            })
            .select('id')
            .single();

          if (convData) {
            const allMembers = Array.from(new Set([currentUser.id, ...memberIds]));
            await supabase.from('conversation_members').insert(
              allMembers.map((uid) => ({ conversation_id: convData.id, user_id: uid }))
            );
          }
        }
      } catch {
        // Fallback to local store
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
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

  // Not Authenticated -> Show Landing Page or Login / Register Flow
  if (isSupabaseConfigured && !isAuthenticated) {
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
              checkUserSession();
            }}
            onNavigateInvite={() => {
              setNewChatModalOpen(false);
            }}
          />
        </div>
      );
    }

    return (
      <LandingPage
        onOpenAuth={(mode) => setAuthModalTab(mode || 'signin')}
      />
    );
  }

  return (
    <>
      {/* Development / Multi-Tab Synchronization Indicator Bar (Only in local placeholder mode) */}
      {state.mode === 'demo' && !isSupabaseConfigured && (
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
        onLogout={handleLogout}
      />

      {/* First-Time User Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        userId={state.currentUser.id}
        initialName={state.currentUser.name}
        onProfileUpdated={(name) =>
          store.setUserProfile({ id: state.currentUser.id, name })
        }
        onStartFirstChat={() => setNewChatModalOpen(true)}
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
