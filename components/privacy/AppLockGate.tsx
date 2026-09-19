'use client';

import React, { useEffect, useRef, useState } from 'react';
import { checkPin, loadPinRecord, lockNow, lockoutMs, unlock, useLocked } from '../../lib/privacy/appLock';
import { usePreferences } from '../../lib/prefs/preferences';
import { IconLock } from '../ui/icons';
import { Button } from '../ui/button';

/** Locks the app behind the user's PIN: on open, after idle time, and after the tab has been hidden for that long. */
export const AppLockGate: React.FC<{ userId: string; onSignOut: () => void }> = ({ userId, onSignOut }) => {
  const prefs = usePreferences();
  const locked = useLocked();
  const enabled = prefs.privacy.appLock.enabled && typeof window !== 'undefined' && !!loadPinRecord(userId);
  const timeoutMs = prefs.privacy.appLock.timeoutMin * 60_000;
  const startedRef = useRef(false);
  const lastActivity = useRef(Date.now());
  const hiddenAt = useRef<number | null>(null);

  // Lock once when the app opens (not when the user merely switches the setting on).
  useEffect(() => {
    if (!startedRef.current && enabled) {
      startedRef.current = true;
      lockNow();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      unlock();
      return;
    }
    const touch = () => {
      lastActivity.current = Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else {
        if (hiddenAt.current && Date.now() - hiddenAt.current >= timeoutMs) lockNow();
        hiddenAt.current = null;
        touch();
      }
    };
    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= timeoutMs) lockNow();
    }, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, [enabled, timeoutMs]);

  if (!enabled || !locked) return null;
  return <LockScreen userId={userId} onSignOut={onSignOut} />;
};

const LockScreen: React.FC<{ userId: string; onSignOut: () => void }> = ({ userId, onSignOut }) => {
  const [pin, setPin] = useState('');
  const [failures, setFailures] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (waitUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [waitUntil]);

  const waiting = waitUntil > now;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waiting || checking) return;
    const record = loadPinRecord(userId);
    if (!record) {
      unlock();
      return;
    }
    setChecking(true);
    const ok = await checkPin(pin, record);
    setChecking(false);
    setPin('');
    if (ok) {
      setFailures(0);
      setError(null);
      unlock();
      return;
    }
    const next = failures + 1;
    setFailures(next);
    const wait = lockoutMs(next);
    if (wait > 0) {
      setWaitUntil(Date.now() + wait);
      setNow(Date.now());
      setError(`Too many attempts. Try again in ${Math.ceil(wait / 1000)} seconds.`);
    } else {
      setError('Wrong PIN.');
    }
  };

  return (
    <div data-theme="dark" role="dialog" aria-modal="true" aria-label="App locked" className="fixed inset-0 z-[100] bg-[var(--canvas-bg)] flex items-center justify-center p-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] border border-emerald-500/30 flex items-center justify-center text-[var(--accent-text)]">
          <IconLock className="w-7 h-7" />
        </div>
        <h1 className="text-base font-bold text-[var(--text-primary)]">Private Chat is locked</h1>
        <label htmlFor="lock-pin" className="sr-only">PIN</label>
        <input
          id="lock-pin"
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          value={pin}
          disabled={waiting}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter PIN"
          className="w-full text-center tracking-[0.5em] bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 rounded-xl text-lg text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60 disabled:opacity-50"
        />
        {error && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">
            {waiting ? `Too many attempts. Try again in ${Math.max(1, Math.ceil((waitUntil - now) / 1000))} seconds.` : error}
          </p>
        )}
        <Button type="submit" variant="primary" fullWidth loading={checking} disabled={waiting || pin.length < 4}>
          Unlock
        </Button>
        <button type="button" onClick={onSignOut} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline">
          Forgot PIN? Sign out
        </button>
      </form>
    </div>
  );
};
