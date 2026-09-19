import type { NotifyLevel, StatusChoice } from '../prefs/preferences';

export interface NotifyContext {
  /** Global notification level from Settings. */
  globalLevel: NotifyLevel;
  /** This conversation's own setting; 'all' means "follow the global level". */
  conversationLevel: NotifyLevel | 'default';
  /** Epoch ms until which the conversation is muted. */
  mutedUntil?: number;
  status: StatusChoice;
  quietHours: boolean;
  isDirect: boolean;
  isMention: boolean;
  isKeyword: boolean;
  now: number;
}

/** True when the message should raise an alert (sound, desktop notification, toast). */
export function shouldNotify(c: NotifyContext): boolean {
  // Presence statuses that mean "leave me alone".
  if (c.status === 'dnd' || c.status === 'meeting') return false;
  if (c.quietHours) return false;
  if (c.mutedUntil && c.mutedUntil > c.now) return false;

  const level = c.conversationLevel === 'default' ? c.globalLevel : c.conversationLevel;
  if (level === 'none') return false;
  if (level === 'all') return true;
  // "Mentions only": direct messages are always addressed to you.
  return c.isDirect || c.isMention || c.isKeyword;
}

/** Whether the text addresses this user with @username, @first-name, or a mention id list. */
export function mentionsUser(
  text: string,
  me: { id: string; name: string; username?: string },
  mentionIds?: string[]
): boolean {
  if (mentionIds?.includes(me.id)) return true;
  const lower = text.toLowerCase();
  const handles = [me.username, me.name.split(/\s+/)[0]].filter((h): h is string => !!h && h.length >= 2);
  return handles.some((h) => {
    const re = new RegExp(`(^|[^\\w])@${h.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`);
    return re.test(lower);
  });
}

export function matchesKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => k.trim().length >= 2 && lower.includes(k.trim().toLowerCase()));
}

/** Extracts the user ids for @handles that appear in a message, so recipients can be alerted reliably. */
export function extractMentionIds(text: string, candidates: Array<{ id: string; name: string; username?: string }>): string[] {
  const ids = new Set<string>();
  for (const c of candidates) {
    if (mentionsUser(text, { id: c.id, name: c.name, username: c.username })) ids.add(c.id);
  }
  return [...ids];
}
