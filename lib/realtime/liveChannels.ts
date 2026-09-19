import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { ChatStore } from '../store/chatStore';
import { getPreferences, type StatusChoice } from '../prefs/preferences';
import type { UserPresence } from '../../types/ui';

const IDLE_MS = 5 * 60 * 1000;
const TYPING_TTL_MS = 4000;
const TYPING_THROTTLE_MS = 2500;

/** Maps what someone chose (or the idle timer decided) to what other people see. */
function presenceFor(choice: StatusChoice, idle: boolean): UserPresence | 'invisible' {
  if (choice === 'invisible') return 'invisible';
  if (choice === 'dnd') return 'dnd';
  if (choice === 'meeting') return 'meeting';
  if (choice === 'away') return 'away';
  return idle ? 'away' : 'online';
}

interface PresencePayload {
  userId: string;
  status: UserPresence;
  text?: string;
}

/**
 * Ephemeral live state over Supabase Realtime: who is online (Presence) and
 * who is typing (Broadcast). Nothing here is written to the database, and
 * both are switched off by the matching privacy settings.
 *
 * Limitation: these channels are public to any signed-in client of the
 * project (Realtime Authorization is not enabled), so presence and typing
 * carry only user ids and a status, never message content.
 */
export class LiveChannels {
  private presence: RealtimeChannel | null = null;
  private typingChannel: RealtimeChannel | null = null;
  private typingConversation: string | null = null;
  private typingSeen = new Map<string, Map<string, number>>();
  private lastActivity = Date.now();
  private lastPublished = '';
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTypingSent = 0;
  private onActivity = () => {
    this.lastActivity = Date.now();
  };

  constructor(
    private supabase: SupabaseClient,
    private userId: string,
    private store: ChatStore
  ) {}

  start(): void {
    this.presence = this.supabase.channel('pc-presence', { config: { presence: { key: this.userId } } });
    this.presence
      .on('presence', { event: 'sync' }, () => this.publishMap())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void this.publishSelf();
      });

    for (const evt of ['mousemove', 'keydown', 'touchstart', 'click']) window.addEventListener(evt, this.onActivity, { passive: true });
    document.addEventListener('visibilitychange', this.onActivity);
    this.timer = setInterval(() => {
      void this.publishSelf();
      this.expireTyping();
    }, 20000);
  }

  stop(): void {
    for (const evt of ['mousemove', 'keydown', 'touchstart', 'click']) window.removeEventListener(evt, this.onActivity);
    document.removeEventListener('visibilitychange', this.onActivity);
    if (this.timer) clearInterval(this.timer);
    if (this.presence) void this.supabase.removeChannel(this.presence);
    if (this.typingChannel) void this.supabase.removeChannel(this.typingChannel);
    this.presence = null;
    this.typingChannel = null;
  }

  /** Re-publishes our status (call after the user changes it in the status menu). */
  async publishSelf(): Promise<void> {
    if (!this.presence) return;
    const { status } = getPreferences();
    const idle = Date.now() - this.lastActivity > IDLE_MS;
    const shown = getPreferences().privacy.showOnline ? presenceFor(status.choice, idle) : 'invisible';
    const key = `${shown}|${status.text}`;
    if (key === this.lastPublished) return;
    this.lastPublished = key;
    try {
      if (shown === 'invisible') {
        await this.presence.untrack();
      } else {
        await this.presence.track({ userId: this.userId, status: shown, text: status.text } satisfies PresencePayload);
      }
    } catch {
      // not connected yet: the next tick retries
    }
  }

  private publishMap(): void {
    if (!this.presence) return;
    const state = this.presence.presenceState() as Record<string, PresencePayload[]>;
    const map: Record<string, UserPresence> = {};
    for (const [key, metas] of Object.entries(state)) {
      const latest = metas[metas.length - 1];
      if (latest) map[key] = latest.status;
    }
    map[this.userId] = presenceFor(getPreferences().status.choice, false) === 'invisible' ? 'offline' : (map[this.userId] ?? 'online');
    this.store.setPresence(map);
  }

  /** Switches the typing channel to the conversation the user is looking at. */
  watchConversation(conversationId: string | null): void {
    if (this.typingConversation === conversationId) return;
    if (this.typingChannel) void this.supabase.removeChannel(this.typingChannel);
    this.typingChannel = null;
    this.typingConversation = conversationId;
    if (!conversationId) return;
    this.typingChannel = this.supabase
      .channel(`pc-typing:${conversationId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!getPreferences().privacy.typingIndicators) return;
        const uid = (payload as { userId?: string })?.userId;
        if (!uid || uid === this.userId) return;
        const seen = this.typingSeen.get(conversationId) ?? new Map<string, number>();
        seen.set(uid, Date.now());
        this.typingSeen.set(conversationId, seen);
        this.expireTyping();
        setTimeout(() => this.expireTyping(), TYPING_TTL_MS + 150);
      })
      .subscribe();
  }

  /** Call on every keystroke; throttled, and a no-op when the user turned typing indicators off. */
  sendTyping(): void {
    if (!this.typingChannel || !getPreferences().privacy.typingIndicators) return;
    const now = Date.now();
    if (now - this.lastTypingSent < TYPING_THROTTLE_MS) return;
    this.lastTypingSent = now;
    void this.typingChannel.send({ type: 'broadcast', event: 'typing', payload: { userId: this.userId } });
  }

  private expireTyping(): void {
    const now = Date.now();
    for (const [conv, seen] of this.typingSeen) {
      for (const [uid, at] of seen) if (now - at > TYPING_TTL_MS) seen.delete(uid);
      this.store.setTyping(conv, [...seen.keys()]);
    }
  }
}
