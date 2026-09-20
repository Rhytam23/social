import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './themeScript';

export type ThemePreference = 'dark' | 'light' | 'system';

const KEY = THEME_STORAGE_KEY;
const listeners = new Set<() => void>();

function readTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {
    // storage unavailable (private mode): fall back to the default
  }
  // No saved choice: follow the device's light or dark setting.
  return 'system';
}

/** The theme actually showing right now ('system' resolved through the device setting). */
export function effectiveTheme(): 'dark' | 'light' {
  const pref = readTheme();
  if (pref !== 'system') return pref;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(pref: ThemePreference) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', pref);
}

export function setTheme(pref: ThemePreference) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // ignore: the theme still applies for this session
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useTheme(): [ThemePreference, (t: ThemePreference) => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as ThemePreference);
  return [theme, setTheme];
}
