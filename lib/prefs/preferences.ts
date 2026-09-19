import { useSyncExternalStore } from 'react';

export type StatusChoice = 'auto' | 'dnd' | 'away' | 'meeting' | 'invisible';
export type NotifyLevel = 'all' | 'mentions' | 'none';

export interface Preferences {
  appearance: { density: 'comfortable' | 'compact'; fontScale: 'sm' | 'md' | 'lg' };
  notifications: {
    level: NotifyLevel;
    preview: boolean;
    sound: boolean;
    quietHours: { enabled: boolean; start: string; end: string };
    keywords: string[];
  };
  privacy: {
    readReceipts: boolean;
    typingIndicators: boolean;
    showOnline: boolean;
    appLock: { enabled: boolean; timeoutMin: number };
  };
  status: { choice: StatusChoice; text: string };
}

export const DEFAULT_PREFERENCES: Preferences = {
  appearance: { density: 'comfortable', fontScale: 'md' },
  notifications: {
    level: 'all',
    preview: true,
    sound: true,
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    keywords: [],
  },
  privacy: {
    readReceipts: true,
    typingIndicators: true,
    showOnline: true,
    appLock: { enabled: false, timeoutMin: 5 },
  },
  status: { choice: 'auto', text: '' },
};

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Preferences = DEFAULT_PREFERENCES;
let storageKey = 'private_chat_prefs_anon';
let remoteSaver: ((prefs: Preferences) => void) | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Deep-merges saved data over the defaults so newly added settings always have a value. */
export function mergePreferences(base: Preferences, saved: unknown): Preferences {
  if (!saved || typeof saved !== 'object') return base;
  const merge = (a: unknown, b: unknown): unknown => {
    if (b === undefined) return a;
    if (a && typeof a === 'object' && !Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
      const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
      for (const k of Object.keys(a as object)) out[k] = merge((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
      return out;
    }
    return typeof b === typeof a ? b : a;
  };
  return merge(base, saved) as Preferences;
}

function emit() {
  current = { ...current };
  listeners.forEach((l) => l());
}

function applyToDocument(p: Preferences) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.density = p.appearance.density;
  document.documentElement.dataset.font = p.appearance.fontScale;
}

/** Call after sign-in: loads this user's saved preferences (device copy first, then the server copy). */
export function initPreferences(userId: string, serverCopy?: unknown, saveRemote?: (prefs: Preferences) => void) {
  storageKey = `private_chat_prefs_${userId}`;
  remoteSaver = saveRemote ?? null;
  let local: unknown = null;
  try {
    local = JSON.parse(localStorage.getItem(storageKey) || 'null');
  } catch {
    // corrupt or unavailable storage: ignore
  }
  current = mergePreferences(mergePreferences(DEFAULT_PREFERENCES, serverCopy), local);
  applyToDocument(current);
  emit();
}

export function getPreferences(): Preferences {
  return current;
}

export function updatePreferences(mutate: (draft: Preferences) => Preferences) {
  current = mutate(structuredClone(current));
  try {
    localStorage.setItem(storageKey, JSON.stringify(current));
  } catch {
    // ignore: preferences still apply for this session
  }
  applyToDocument(current);
  if (remoteSaver) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => remoteSaver?.(current), 800);
  }
  emit();
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => current,
    () => DEFAULT_PREFERENCES
  );
}

/** True while the user's quiet hours are active (handles ranges that cross midnight). */
export function inQuietHours(q: Preferences['notifications']['quietHours'], now: Date = new Date()): boolean {
  if (!q.enabled) return false;
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMin(q.start);
  const end = toMin(q.end);
  if (start === end) return false;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}
