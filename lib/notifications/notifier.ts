import { useSyncExternalStore } from 'react';
import type { ConversationItem, MessageData } from '../../types/ui';
import { getPreferences, inQuietHours } from '../prefs/preferences';
import { matchesKeyword, mentionsUser, shouldNotify } from './rules';
import { toast } from '../ui/toastStore';

export interface CenterItem {
  id: string;
  conversationId: string;
  messageId: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

// ---- Notification center (in memory: alerts are about now, not history) ----
let items: CenterItem[] = [];
const listeners = new Set<() => void>();
const MAX_ITEMS = 50;

function emit() {
  items = [...items];
  listeners.forEach((l) => l());
}

export function useNotificationCenter(): CenterItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => items,
    () => []
  );
}

export function markAllNotificationsRead() {
  items = items.map((i) => ({ ...i, read: true }));
  emit();
}

export function clearNotifications() {
  items = [];
  emit();
}

export function markConversationNotificationsRead(conversationId: string) {
  if (!items.some((i) => i.conversationId === conversationId && !i.read)) return;
  items = items.map((i) => (i.conversationId === conversationId ? { ...i, read: true } : i));
  emit();
}

// ---- Delivery ----
let audio: AudioContext | null = null;

export function playBeep() {
  try {
    audio = audio ?? new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.26);
  } catch {
    // audio blocked until the user interacts with the page: stay silent
  }
}

export interface IncomingEvent {
  message: MessageData;
  conversation: ConversationItem;
  /** True when the user is looking at this conversation in a visible tab. */
  isViewing: boolean;
}

export interface NotifierEnv {
  me: { id: string; name: string; username?: string };
  openConversation: (id: string) => void;
}

/** Decides what to do about one incoming message and does it. All text stays on this device. */
export function handleIncoming(event: IncomingEvent, env: NotifierEnv): void {
  const { message, conversation, isViewing } = event;
  if (message.kind === 'system' || message.isSelf) return;
  const prefs = getPreferences();
  const text = message.content || (message.attachments?.[0] ? `Sent ${message.attachments[0].fileName}` : 'New message');

  const isMention = mentionsUser(message.content, env.me);
  const isKeyword = matchesKeyword(message.content, prefs.notifications.keywords);

  // Mentions and keyword hits are kept in the notification center even when the alert itself is silenced.
  if ((isMention || isKeyword) && !isViewing) {
    items = [
      { id: message.id, conversationId: conversation.id, messageId: message.id, title: conversation.title, body: text.slice(0, 140), at: Date.now(), read: false },
      ...items,
    ].slice(0, MAX_ITEMS);
    emit();
  }

  const alert = shouldNotify({
    globalLevel: prefs.notifications.level,
    conversationLevel: conversation.notifyLevel ?? 'default',
    mutedUntil: conversation.mutedUntil,
    status: prefs.status.choice,
    quietHours: inQuietHours(prefs.notifications.quietHours),
    isDirect: conversation.type === 'direct',
    isMention,
    isKeyword,
    now: Date.now(),
  });
  if (!alert || isViewing) return;

  const body = prefs.notifications.preview ? `${message.senderName}: ${text}`.slice(0, 140) : 'New message';
  if (prefs.notifications.sound) playBeep();

  const canDesktop = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  if (canDesktop && document.visibilityState === 'hidden') {
    try {
      const n = new Notification(conversation.title, { body, tag: conversation.id });
      n.onclick = () => {
        window.focus();
        env.openConversation(conversation.id);
        n.close();
      };
    } catch {
      // some browsers only allow notifications from a service worker
    }
  } else {
    toast(`${conversation.title}: ${body}`, { actionLabel: 'Open', onAction: () => env.openConversation(conversation.id), ms: 6000 });
  }
}
