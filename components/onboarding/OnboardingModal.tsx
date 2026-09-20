'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { IconLock, IconShield, IconUsers } from '../ui/icons';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured } from '../../lib/supabase/env';
import { saveOwnProfile } from '../../lib/profile/profileClient';
import { userError } from '../../lib/ui/errors';
import { updatePreferences } from '../../lib/prefs/preferences';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialName: string;
  onProfileUpdated: (newName: string) => void;
  onStartFirstChat: () => void;
  /** Creates the encrypted key backup file (Argon2id + AES-256-GCM) with the given passphrase. */
  onExportKeyBackup?: (passphrase: string) => Promise<void>;
}

const STEP_TITLES = ['Welcome to Nook', 'Protect your keys', 'Notifications', 'Ready to message'] as const;
const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-[var(--text-primary)] text-xs focus:outline-none focus:border-emerald-500/60 transition-all';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialName,
  onProfileUpdated,
  onStartFirstChat,
  onExportKeyBackup,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [displayName, setDisplayName] = useState(initialName || 'New User');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [backupDone, setBackupDone] = useState(false);
  const [notifChoice, setNotifChoice] = useState<'all' | 'mentions'>('all');
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  const markCompleted = () => {
    try {
      localStorage.setItem(`private_chat_onboarding_completed_${userId}`, 'true');
    } catch {
      // ignore: the server copy below is the source of truth
    }
    if (isSupabaseConfigured()) {
      void saveOwnProfile(createClient(), userId, { onboarding_completed: true }).catch(() => {});
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (isSupabaseConfigured()) {
        await saveOwnProfile(createClient(), userId, { display_name: displayName.trim() });
      }
      onProfileUpdated(displayName.trim());
      setStep(2);
    } catch (err) {
      setSaveError(userError(err, 'Could not save your profile. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    if (!onExportKeyBackup) return;
    if (passphrase.length < 8) {
      setSaveError('Use a passphrase of at least 8 characters.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onExportKeyBackup(passphrase);
      setBackupDone(true);
      setPassphrase('');
    } catch (err) {
      setSaveError(userError(err, 'Could not create the backup. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotifications = async () => {
    updatePreferences((d) => ({ ...d, notifications: { ...d.notifications, level: notifChoice } }));
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        setNotifStatus(result === 'granted' ? 'Desktop notifications are on.' : 'You can turn them on later in Settings.');
      } catch {
        setNotifStatus('You can turn them on later in Settings.');
      }
    }
    setStep(4);
  };

  const finish = (startChat: boolean) => {
    markCompleted();
    onClose();
    if (startChat) onStartFirstChat();
  };

  const footer =
    step === 1 ? (
      <Button variant="primary" size="sm" onClick={handleSaveProfile} loading={isSaving} disabled={!displayName.trim()}>
        Continue
      </Button>
    ) : step === 2 ? (
      <div className="flex gap-2">
        {!backupDone && (
          <Button variant="tertiary" size="sm" onClick={() => setStep(3)}>
            Skip for now
          </Button>
        )}
        {onExportKeyBackup && !backupDone ? (
          <Button variant="primary" size="sm" onClick={handleBackup} loading={isSaving} disabled={passphrase.length < 8}>
            Create backup
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setStep(3)}>
            Continue
          </Button>
        )}
      </div>
    ) : step === 3 ? (
      <Button variant="primary" size="sm" onClick={handleNotifications}>
        Continue
      </Button>
    ) : (
      <Button variant="primary" size="sm" onClick={() => finish(true)}>
        Start first chat
      </Button>
    );

  return (
    <Dialog isOpen={isOpen} onClose={() => finish(false)} title={STEP_TITLES[step - 1]} footerAction={footer} hideCancel>
      <div className="flex flex-col gap-4 font-sans text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--border-subtle)]" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= n ? 'bg-emerald-500' : 'bg-[var(--surface-hover)]'}`} />
          ))}
        </div>

        {saveError && (
          <div role="alert" className="p-3 bg-[var(--danger-subtle)] border border-[var(--danger-neutral)]/30 text-[var(--danger-neutral)] rounded-xl text-[11px]">
            {saveError}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3 py-1">
            <p className="leading-relaxed">Choose the name other people see. You can add a photo, bio and pronouns later in Settings.</p>
            <label htmlFor="ob-name" className="text-[11px] font-semibold text-[var(--text-primary)]">Your display name</label>
            <input id="ob-name" data-autofocus type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Sarah Jenkins" className={inputClass} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3 py-1">
            <div className="p-3.5 bg-[var(--accent-subtle)] border border-emerald-500/30 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <IconShield className="w-4 h-4" />
              </div>
              <p className="leading-relaxed text-[var(--text-primary)]">
                Your messages are encrypted with keys that live only on this device. <strong>If you lose this device or clear your browser data, nobody, including us, can recover them.</strong>
              </p>
            </div>
            {backupDone ? (
              <p role="status" className="p-3 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)] font-medium">
                Backup created. Keep the file and your passphrase somewhere safe.
              </p>
            ) : (
              <>
                <p className="leading-relaxed">Make an encrypted backup now. It is protected by a passphrase you choose (Argon2id + AES-256-GCM).</p>
                <label htmlFor="ob-pass" className="text-[11px] font-semibold text-[var(--text-primary)]">Backup passphrase (8+ characters)</label>
                <input id="ob-pass" type="password" autoComplete="new-password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className={inputClass} />
                <p className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <IconLock className="w-3.5 h-3.5 shrink-0" />
                  You can skip this and do it later under Settings, Privacy &amp; Security.
                </p>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3 py-1">
            <p className="leading-relaxed">How much should we interrupt you? Message text is only shown on this device, never sent through a notification server.</p>
            <div role="radiogroup" aria-label="Notification level" className="flex flex-col gap-2">
              {([
                ['all', 'Every message', 'Best for close friends and small groups.'],
                ['mentions', 'Mentions and replies only', 'Quieter. Busy groups only alert you when you are addressed.'],
              ] as const).map(([value, title, desc]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={notifChoice === value}
                  onClick={() => setNotifChoice(value)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    notifChoice === value ? 'border-emerald-500/60 bg-[var(--accent-subtle)]' : 'border-[var(--border-subtle)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="block font-semibold text-[var(--text-primary)]">{title}</span>
                  <span className="block text-[11px] text-[var(--text-muted)]">{desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Continuing will ask your browser for permission to show desktop notifications.</p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3 py-2 text-center items-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] border border-emerald-500/30 text-[var(--accent-text)] flex items-center justify-center mb-1">
              <IconUsers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Your encrypted workspace is ready</h4>
            {notifStatus && <p role="status" className="text-[11px]">{notifStatus}</p>}
            <p className="max-w-xs text-[11px] leading-relaxed">Find people by name, username, or an exact email or phone number, then say hello. Press Ctrl+K anytime to jump anywhere.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
