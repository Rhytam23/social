'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '../hooks/useChatStore';
import { AppShell } from '../components/layout/AppShell';
import { NewConversationModal } from '../components/chat/NewConversationModal';
import { LoginForm } from '../components/auth/LoginForm';
import { LandingPage } from '../components/landing/LandingPage';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { UserItem, MessageData } from '../types/ui';
import { loadOwnProfile, saveOwnProfile } from '../lib/profile/profileClient';
import { initPreferences, type Preferences } from '../lib/prefs/preferences';
import { LiveChannels } from '../lib/realtime/liveChannels';
import { handleIncoming, markConversationNotificationsRead } from '../lib/notifications/notifier';
import { AppLockGate } from '../components/privacy/AppLockGate';
import { CallManager, IDLE_CALL_STATE, type CallState } from '../lib/calls/CallManager';
import { CallOverlay } from '../components/calls/CallOverlay';
import { playBeep } from '../lib/notifications/notifier';
import { toast } from '../lib/ui/toastStore';
import { getPreferences } from '../lib/prefs/preferences';
import { createClient } from '../lib/supabase/client';
import { isSupabaseConfigured, isDemoModeAllowed } from '../lib/supabase/env';
import { MessagingCrypto } from '../lib/messaging/messagingCrypto';
import type { RealtimeMessageRow } from '../lib/store/chatStore';
import { createKeyBackup, restoreKeyBackup } from '../crypto';
import type { RealtimeChannel } from '@supabase/supabase-js';


import { Button } from '../components/ui/button';
import { LinkDevice } from '../components/auth/LinkDevice';
export default function HomePage() {
  const [state, store] = useChatStore();
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [linkCrypto, setLinkCrypto] = useState<MessagingCrypto | null>(null);
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const cryptoRef = useRef<MessagingCrypto | null>(null);
  const initedRef = useRef(false);
  const liveRef = useRef<LiveChannels | null>(null);
  const callsRef = useRef<CallManager | null>(null);
  const ringRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [callState, setCallState] = useState<CallState>(IDLE_CALL_STATE);

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (payload) => {
        store.applyReactionEvent('INSERT', payload.new as { message_id?: string; user_id?: string; reaction?: string });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, (payload) => {
        store.applyReactionEvent('DELETE', payload.old as { message_id?: string; user_id?: string; reaction?: string });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, () => {
        store.refreshConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, () => {
        void store.loadCommunities();
        store.refreshConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        store.refreshConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_receipts' }, (payload) => {
        store.applyReceiptRow(payload.new as { message_id?: string; user_id?: string; delivered_at?: string | null; read_at?: string | null });
      })
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [configured, state.conversations, store]);

  const bootstrapSession = useCallback(async () => {
    if (!configured) {
      if (isDemoModeAllowed()) {
        store.initDemoMode();
        initPreferences('demo');
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

      const profile = await loadOwnProfile(supabase, user);
      initPreferences(user.id, profile?.preferences, (prefs: Preferences) => {
        void saveOwnProfile(supabase, user.id, { preferences: prefs as unknown as Record<string, unknown> }).catch(() => {});
      });

      const displayName =
        profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

      if (typeof window !== 'undefined') {
        const completed =
          profile?.onboarding_completed === true || localStorage.getItem(`private_chat_onboarding_completed_${user.id}`);
        if (!completed && (!profile?.display_name || profile.display_name === 'User' || profile?.onboarding_completed === false)) {
          setOnboardingOpen(true);
        }
      }

      const crypto = new MessagingCrypto(supabase, user.id);
      await crypto.waitReady();
      cryptoRef.current = crypto;

      // A new browser on an account that already has a key must be linked, not given a new key.
      if (crypto.needsLink()) {
        setLinkCrypto(crypto);
        return;
      }

      await store.initializeForUser(supabase, crypto, {
        id: user.id,
        name: displayName,
        username: profile?.username || user.email?.split('@')[0],
        email: user.email,
        phoneNumber: profile?.phone_number ?? undefined,
        bio: profile?.bio ?? undefined,
        pronouns: profile?.pronouns ?? undefined,
        timezone: profile?.timezone ?? undefined,
        role: profile?.is_admin ? 'admin' : 'member',
      });

      if (profile?.avatar_url) {
        store.updateCurrentUserProfile({ avatarUrl: profile.avatar_url });
      }

      // Presence, typing and bookmarks are best effort: a failure here must not block the app.
      try {
        liveRef.current?.stop();
        const live = new LiveChannels(supabase, user.id, store);
        liveRef.current = live;
        live.start();
        void store.loadSavedMessages();
        void store.loadCommunities();
        void store.loadBlocked();

        callsRef.current?.stop();
        const stopRinging = () => {
          if (ringRef.current) clearInterval(ringRef.current);
          ringRef.current = null;
        };
        const calls = new CallManager(supabase, crypto, user.id, {
          getPeer: (peerId) => {
            const s = store.getState();
            if (s.blocked.includes(peerId)) return null;
            const conv = s.conversations.find((c) => c.type === 'direct' && c.recipientUser?.id === peerId);
            return conv ? { name: conv.title, conversationId: conv.id, verified: !!conv.recipientUser?.isVerified } : null;
          },
          logCall: (conversationId, callId, outcome, video, durationMs) => void store.sendCallLog(conversationId, callId, outcome, video, durationMs),
          canRing: () => {
            const choice = getPreferences().status.choice;
            return choice !== 'dnd' && choice !== 'meeting';
          },
          startRinging: () => {
            stopRinging();
            playBeep();
            ringRef.current = setInterval(playBeep, 2200);
          },
          stopRinging,
        });
        callsRef.current = calls;
        calls.subscribe(() => setCallState(calls.getState()));
        calls.start();
      } catch (liveErr) {
        console.warn('Live channels unavailable', liveErr);
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
      liveRef.current?.stop();
      callsRef.current?.stop();
      if (ringRef.current) clearInterval(ringRef.current);
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

  // An invite link (?join=CODE) is remembered across the sign-in redirect, then offered once signed in.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('join');
      if (code) {
        sessionStorage.setItem('pc_pending_join', code);
        params.delete('join');
        const qs = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
      }
    } catch {
      // storage unavailable: the link simply has to be opened again after signing in
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || state.mode !== 'connected') return;
    try {
      const pending = sessionStorage.getItem('pc_pending_join');
      if (pending) {
        sessionStorage.removeItem('pc_pending_join');
        setInviteCode(pending);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated, state.mode]);

  // Alerts for incoming messages (toast, desktop notification, sound), decided on this device.
  useEffect(() => {
    if (!isAuthenticated) return;
    return store.onIncoming((event) =>
      handleIncoming(event, {
        me: { id: state.currentUser.id, name: state.currentUser.name, username: state.currentUser.username },
        openConversation: (id) => store.selectConversation(id),
      })
    );
  }, [isAuthenticated, store, state.currentUser.id, state.currentUser.name, state.currentUser.username]);

  useEffect(() => {
    markConversationNotificationsRead(state.activeConversationId);
  }, [state.activeConversationId]);

  // Call problems (no microphone, blocked permission, connection lost) are shown as a message.
  useEffect(() => {
    if (callState.error && callState.phase === 'idle') {
      toast(callState.error, { kind: 'error', ms: 8000 });
      callsRef.current?.clearError();
    }
  }, [callState.error, callState.phase]);

  // Disappearing messages: drop expired ones from view and ask the server to delete them.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => {
      setClockTick((n) => n + 1);
      void store.purgeExpired();
    }, 30_000);
    return () => clearInterval(t);
  }, [isAuthenticated, store]);

  // Unread count in the browser tab title.
  const totalUnread = state.conversations.reduce((sum, c) => (c.isMuted ? sum : sum + c.unreadCount), 0);
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? '99+' : totalUnread}) Private Chat` : 'Private Chat';
  }, [totalUnread]);

  // Typing indicators follow the conversation the user is looking at.
  useEffect(() => {
    liveRef.current?.watchConversation(state.mode === 'connected' && isAuthenticated ? state.activeConversationId || null : null);
  }, [state.activeConversationId, state.mode, isAuthenticated]);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ||
    state.conversations[0];

  const activeMessages = (activeConversation ? state.messagesMap[activeConversation.id] || [] : []).filter(
    (m) => !m.expiresAt || Date.parse(m.expiresAt) > Date.now()
  );

  const handleExportData = () => {
    const me = state.currentUser;
    const data = {
      exportedAt: new Date().toISOString(),
      note: 'Messages are end-to-end encrypted and are not included in this export.',
      profile: { name: me.name, username: me.username, email: me.email, phone: me.phoneNumber, bio: me.bio, pronouns: me.pronouns, timezone: me.timezone },
      preferences: getPreferences(),
      blockedUserIds: state.blocked,
      communities: state.communities.map((c) => ({ name: c.name, role: c.role })),
      devices: state.devices.map((d) => ({ name: d.deviceName, lastActive: d.lastActive })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'private-chat-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = (content: string, replyToId?: string, attachmentFile?: File, voiceDurationMs?: number, threadRootId?: string) => {
    void store.sendMessage(content, replyToId, attachmentFile, voiceDurationMs, threadRootId);
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
    void store.toggleSaved(msgId);
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
    const previousDeviceId = crypto.hasIdentity() ? crypto.myDeviceId() : null;
    const backup = JSON.parse(backupJson);
    await restoreKeyBackup(passphrase, backup, crypto.getKeyStore());
    await crypto.completeLinking(previousDeviceId);
  };

  const finishLinking = () => {
    setLinkCrypto(null);
    setAuthLoading(true);
    void bootstrapSession();
  };

  const handleRevokeDevice = (deviceId: string) => {
    void store.revokeDevice(deviceId);
  };

  const handleStartDirectChat = async (user: UserItem) => {
    setNewChatModalOpen(false);
    await store.createDirectConversation(user);
  };

  const handleCreateGroupChat = async (groupName: string, memberIds: string[]): Promise<boolean> => {
    const id = await store.createGroupConversation(groupName, memberIds);
    return id !== '';
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
    liveRef.current?.stop();
    liveRef.current = null;
    callsRef.current?.hangup();
    callsRef.current?.stop();
    callsRef.current = null;
    store.logout();
    setIsAuthenticated(false);
  };

  if (linkCrypto && isAuthenticated) {
    return (
      <LinkDevice
        onLink={async (passphrase, backupJson) => {
          const backup = JSON.parse(backupJson);
          await restoreKeyBackup(passphrase, backup, linkCrypto.getKeyStore());
          await linkCrypto.completeLinking(null);
          finishLinking();
        }}
        onStartFresh={async () => {
          await linkCrypto.startFresh();
          finishLinking();
        }}
        onLogout={() => {
          setLinkCrypto(null);
          void handleLogout();
        }}
      />
    );
  }

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
      <div className="h-screen w-screen bg-[var(--canvas-bg)] flex flex-col items-center justify-center font-sans text-center p-6">
        <h1 className="text-sm font-bold text-rose-400 mb-2">Server misconfiguration</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. This deployment cannot authenticate users.
        </p>
      </div>
    );
  }

  if (isAuthenticated && bootError) {
    return (
      <div className="h-screen w-screen bg-[var(--canvas-bg)] flex flex-col items-center justify-center font-sans text-center p-6 gap-3">
        <h1 className="text-sm font-bold text-rose-400">You&apos;re signed in, but setup didn&apos;t finish</h1>
        <p className="text-xs text-slate-400 max-w-sm break-words">{bootError}</p>
        <Button
          variant="secondary"
          onClick={() => {
            setBootError(null);
            setAuthLoading(true);
            void bootstrapSession();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  // Not Authenticated -> Show Landing Page or Login / Register Flow
  if (configured && !isAuthenticated) {
    if (authModalTab) {
      return (
        <div data-theme="dark" className="relative min-h-screen bg-[var(--canvas-bg)]">
          <div className="absolute top-4 left-4 z-50">
            <Button variant="tertiary" size="sm" onClick={() => setAuthModalTab(null)}>
              ← Back to overview
            </Button>
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
        <div className="bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-4 py-1.5 flex items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)] font-sans z-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
            <span className="truncate">Local demo: sample data, not connected to Supabase</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="demo-persona" className="text-[var(--text-muted)]">Persona</label>
            <select
              id="demo-persona"
              value={state.currentUser.id}
              onChange={(e) => store.switchDemoUser(e.target.value)}
              className="field !w-auto !py-0.5 !text-[11px]"
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
        <div role="alert" className="bg-[var(--danger-subtle)] border-b border-[var(--danger-neutral)]/25 px-4 py-1.5 flex items-center justify-between text-[11px] text-[var(--danger-neutral)] font-sans z-50">
          <span>{state.error}</span>
          <button onClick={() => store.clearError()} className="font-semibold hover:underline">
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
        onStartDirectChat={handleStartDirectChat}
        onLookupUser={(raw) => store.lookupUsername(raw)}
        onCreateGroup={handleCreateGroupChat}
        onPinConversation={(id) => store.pinConversation(id)}
        onMuteConversation={(id) => store.muteConversation(id)}
        onArchiveConversation={(id) => store.archiveConversation(id)}
        onMarkUnreadConversation={(id) => store.markUnreadConversation(id)}
        onClearHistoryConversation={(id) => store.clearHistoryConversation(id)}
        onDeleteConversationLocally={(id) => store.deleteConversationLocally(id)}
        onLogout={handleLogout}
        isLoading={state.isLoading}
        onStatusChanged={() => void liveRef.current?.publishSelf()}
        typingNames={(state.typing[state.activeConversationId] || []).map((id) => store.nameOf(id))}
        onTyping={() => liveRef.current?.sendTyping()}
        isLoadingMessages={!!state.messagesLoading[state.activeConversationId]}
        canLoadOlder={state.mode === 'connected' && store.hasMoreHistory(state.activeConversationId) && activeMessages.length >= 50}
        onLoadOlder={() => void store.loadOlderMessages(state.activeConversationId)}
        savedMessages={state.saved
          .map((s) => state.messagesMap[s.conversationId]?.find((m) => m.id === s.messageId))
          .filter((m): m is MessageData => !!m)}
        onToggleSaved={handleStarMessageToggle}
        onSetConversationNotify={(id, level, ms) => store.setConversationNotify(id, level, ms)}
        onStartCall={state.mode === 'connected' ? (peerId, video) => void callsRef.current?.startCall(peerId, video) : undefined}
        callActive={callState.phase !== 'idle'}
        currentUser={state.currentUser}
        blockedIds={state.blocked}
        onBlockUser={(id) => void store.blockUser(id)}
        onUnblockUser={(id) => void store.unblockUser(id)}
        onReportMessage={state.mode === 'connected' ? (id, reason, includeText) => store.reportMessage(id, reason, includeText) : undefined}
        onSetDisappearing={state.mode === 'connected' ? (id, seconds) => void store.setDisappearing(id, seconds) : undefined}
        onVerifyPeer={(id) => store.verifyConversationPeer(id)}
        onAcceptKeyChange={(id) => store.acceptKeyChange(id)}
        privacyProps={{
          blockedUsers: state.blocked.map((id) => {
            const u = state.allUsers.find((x) => x.id === id);
            return { id, name: u?.name ?? 'Unknown user', avatarUrl: u?.avatarUrl };
          }),
          canBlock: state.mode === 'connected',
          onUnblock: (id) => void store.unblockUser(id),
          onSignOutOtherSessions: async () => {
            await createClient().auth.signOut({ scope: 'others' });
          },
          onExportData: handleExportData,
        }}
        communities={state.mode === 'connected' ? state.communities : undefined}
        communityMembers={state.communityMembers}
        initialInviteCode={inviteCode}
        onLoadCommunityMembers={(id) => store.loadCommunityMembers(id)}
        onCreateCommunity={(name, description) => store.createCommunity(name, description)}
        onJoinCommunity={(code) => store.joinCommunity(code)}
        onCreateChannel={(communityId, name, isPrivate, memberIds) => store.createChannel(communityId, name, isPrivate, memberIds)}
        onCreateInvite={(id) => store.createInvite(id)}
        onSetCommunityRole={(id, userId, role) => store.setCommunityRole(id, userId, role)}
        onRemoveCommunityMember={(id, userId) => store.removeCommunityMember(id, userId)}
        onLeaveCommunity={(id) => store.leaveCommunity(id)}
        onSetMemberRole={(groupId, userId, role) => store.setMemberRole(groupId, userId, role)}
        onUpdateGroupSettings={(groupId, patch) => store.updateGroupSettings(groupId, patch)}
        onLeaveGroup={(groupId) => store.leaveGroup(groupId)}
      />

      <CallOverlay
        state={callState}
        onAccept={() => void callsRef.current?.accept()}
        onDecline={() => callsRef.current?.decline()}
        onHangup={() => callsRef.current?.hangup()}
        onToggleMute={() => callsRef.current?.toggleMute()}
        onToggleCamera={() => callsRef.current?.toggleCamera()}
      />

      {configured && state.mode === 'connected' && <AppLockGate userId={state.currentUser.id} onSignOut={handleLogout} />}

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        userId={state.currentUser.id}
        initialName={state.currentUser.name}
        onProfileUpdated={(name) => store.updateCurrentUserProfile({ name })}
        onStartFirstChat={() => setNewChatModalOpen(true)}
        onExportKeyBackup={handleExportKeyBackup}
      />

      <NewConversationModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        contacts={state.allUsers}
        currentUserId={state.currentUser.id}
        onLookup={(raw) => store.lookupUsername(raw)}
        onStartDirectChat={handleStartDirectChat}
        blockedIds={state.blocked}
      />
    </div>
  );
}
