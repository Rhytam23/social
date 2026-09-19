import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './themeScript';

export type ThemePreference = 'dark' | 'light' | 'system';

const KEY = THEME_STORAGE_KEY;
const listeners = new Set<() => void>();

export function readTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {
    // storage unavailable (private mode): fall back to the default
  }
  return 'dark';
}

export function applyTheme(pref: ThemePreference) {
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
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as ThemePreference);
  return [theme, setTheme];
}
