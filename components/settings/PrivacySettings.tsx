'use client';

import React, { useState } from 'react';
import { updatePreferences, usePreferences } from '../../lib/prefs/preferences';
import { SettingRow, Switch } from '../ui/primitives';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { toast } from '../../lib/ui/toastStore';
import { technicalNote } from '../../lib/ui/errors';
import { checkPin, createPinRecord, isValidPin, loadPinRecord, removePinRecord, savePinRecord } from '../../lib/privacy/appLock';

const inputClass =
  'bg-[var(--surface-2)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60';

type PrivacyPart = 'privacy' | 'security' | 'devices' | 'data';

export interface PrivacySettingsProps {
  userId: string;
  blockedUsers: Array<{ id: string; name: string; avatarUrl?: string }>;
  onUnblock: (userId: string) => void;
  onSignOutOtherSessions: () => Promise<void>;
  onExportData: () => void;
  canBlock: boolean;
}

interface PartProps {
  /** Which group of controls to show; Settings has a page for each. */
  part: PrivacyPart;
}

export const PrivacySettings: React.FC<PrivacySettingsProps & PartProps> = ({ part, userId, blockedUsers, onUnblock, onSignOutOtherSessions, onExportData, canBlock }) => {
  const prefs = usePreferences();
  const p = prefs.privacy;
  const setP = (patch: Partial<typeof p>) => updatePreferences((d) => ({ ...d, privacy: { ...d.privacy, ...patch } }));

  const hasPin = typeof window !== 'undefined' && !!loadPinRecord(userId);
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [settingPin, setSettingPin] = useState(false);
  const [offPin, setOffPin] = useState('');
  const [busy, setBusy] = useState(false);

  const enableLock = async () => {
    if (!isValidPin(pinDraft)) return setPinError('Use 4 to 8 digits.');
    if (pinDraft !== pinConfirm) return setPinError('The two PINs do not match.');
    setBusy(true);
    try {
      savePinRecord(userId, await createPinRecord(pinDraft));
      setP({ appLock: { ...p.appLock, enabled: true } });
      setSettingPin(false);
      setPinDraft('');
      setPinConfirm('');
      setPinError(null);
      toast('App lock is on. It will lock when you reopen the app or after being idle.', { kind: 'success' });
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Could not set the PIN.');
    } finally {
      setBusy(false);
    }
  };

  const disableLock = async () => {
    const record = loadPinRecord(userId);
    if (record && !(await checkPin(offPin, record))) return setPinError('Wrong PIN.');
    removePinRecord(userId);
    setP({ appLock: { ...p.appLock, enabled: false } });
    setOffPin('');
    setPinError(null);
  };

  return (
    <section aria-label="Privacy controls" className="panel flex flex-col">
      {part === 'privacy' && (
        <>
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Who can find you</h3>
      <p className="text-xs text-[var(--text-muted)] pb-3">
        People can only find you by your username (typing its first letters shows it). Your name, email address and phone number are never searchable.
      </p>

      <h3 className="text-sm font-bold text-[var(--text-primary)] mt-4 mb-1">What others can see</h3>
      <SettingRow title="Read receipts" description="Show when you have read messages. If you turn this off you also stop seeing when others read yours.">
        <Switch label="Read receipts" checked={p.readReceipts} onChange={(v) => setP({ readReceipts: v })} />
      </SettingRow>
      <SettingRow title="Typing indicators" description="Show when you are typing, and see when others are.">
        <Switch label="Typing indicators" checked={p.typingIndicators} onChange={(v) => setP({ typingIndicators: v })} />
      </SettingRow>
      <SettingRow title="Show when I am online" description="Off: you appear offline to everyone, and can still see others.">
        <Switch label="Show when I am online" checked={p.showOnline} onChange={(v) => setP({ showOnline: v })} />
      </SettingRow>

        </>
      )}

      {part === 'security' && (
        <>
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">App lock</h3>
      {hasPin && p.appLock.enabled ? (
        <>
          <SettingRow title="Lock after" description="Also locks whenever the app is reopened.">
            <select
              aria-label="Lock after"
              value={p.appLock.timeoutMin}
              onChange={(e) => setP({ appLock: { ...p.appLock, timeoutMin: Number(e.target.value) } })}
              className={inputClass}
            >
              {[1, 5, 15, 60].map((m) => (
                <option key={m} value={m}>{m === 60 ? '1 hour' : `${m} minute${m > 1 ? 's' : ''}`}</option>
              ))}
            </select>
          </SettingRow>
          <SettingRow title="Turn off app lock" description="Enter your PIN to confirm.">
            <div className="flex items-center gap-2">
              <input aria-label="Current PIN" type="password" inputMode="numeric" maxLength={8} value={offPin} onChange={(e) => setOffPin(e.target.value.replace(/\D/g, ''))} className={`${inputClass} w-24`} />
              <Button size="sm" variant="danger" disabled={offPin.length < 4} onClick={disableLock}>Turn off</Button>
            </div>
          </SettingRow>
        </>
      ) : settingPin ? (
        <div className="py-3 flex flex-col gap-2 max-w-xs">
          <input aria-label="New PIN" type="password" inputMode="numeric" maxLength={8} placeholder="New PIN (4 to 8 digits)" value={pinDraft} onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ''))} className={inputClass} />
          <input aria-label="Repeat PIN" type="password" inputMode="numeric" maxLength={8} placeholder="Repeat PIN" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} className={inputClass} />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" loading={busy} onClick={enableLock}>Turn on</Button>
            <Button size="sm" variant="tertiary" onClick={() => { setSettingPin(false); setPinError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <SettingRow title="Require a PIN to open the app" description="A screen lock for this device. It does not encrypt the keys stored in this browser.">
          <Button size="sm" variant="secondary" onClick={() => setSettingPin(true)}>Set up</Button>
        </SettingRow>
      )}
      {pinError && <p role="alert" className="text-xs text-[var(--danger-neutral)] pb-2">{pinError}</p>}
        </>
      )}

      {part === 'privacy' && (
        <>
      <h3 className="text-sm font-bold text-[var(--text-primary)] mt-6 mb-1">Blocked people</h3>
      {!canBlock ? (
        <p className="text-xs text-[var(--text-muted)] py-2">{technicalNote('Blocking needs the latest database update (migration 015).', 'Blocking is not available right now.')}</p>
      ) : blockedUsers.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-2">You have not blocked anyone. Blocked people cannot send you direct messages.</p>
      ) : (
        <ul className="flex flex-col gap-1 py-1">
          {blockedUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--surface-2)]">
              <span className="flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
                <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                {u.name}
              </span>
              <Button size="sm" variant="tertiary" onClick={() => onUnblock(u.id)}>Unblock</Button>
            </li>
          ))}
        </ul>
      )}

        </>
      )}

      {part === 'devices' && (
      <SettingRow title="Sign out of other devices" description="Ends your login on every other browser and device. Encrypted keys stay where they are.">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await onSignOutOtherSessions();
            toast('Other sessions were signed out.', { kind: 'success' });
          }}
        >
          Sign out others
        </Button>
      </SettingRow>
      )}

      {part === 'data' && (
      <SettingRow title="Export my data" description="Downloads your profile, settings and blocked list as a file. Messages stay encrypted on the server, so they are not included.">
        <Button size="sm" variant="secondary" onClick={onExportData}>Download</Button>
      </SettingRow>
      )}
    </section>
  );
};
