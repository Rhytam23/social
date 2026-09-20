import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface LinkDeviceProps {
  /** Restores the encrypted backup into this browser. Throws with a readable message on failure. */
  onLink: (passphrase: string, backupJson: string) => Promise<void>;
  /** Replaces the account key with a new one (old messages become unreadable). */
  onStartFresh: () => Promise<void>;
  onLogout: () => void;
}

const MAX_BACKUP_BYTES = 200_000;

/**
 * Shown when someone signs in on a browser that has no key yet, but the account already has one.
 * Linking uses the encrypted backup file made on the first device, so every linked device reads
 * the same conversations. Nothing is minted silently: that would cut the first device off.
 */
export const LinkDevice: React.FC<LinkDeviceProps> = ({ onLink, onStartFresh, onLogout }) => {
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmFresh, setConfirmFresh] = useState(false);

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setError('That file is too large to be a Private Chat backup.');
      return;
    }
    setFileText(await file.text());
    setFileName(file.name);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--canvas-bg)] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Link this device</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
            Your account already has an encryption key on another device. To read your chats here, link this browser with the encrypted backup you made
            there (Settings, Security, Export backup). Up to 3 devices can be linked to one account.
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
          Backup file
          <input type="file" accept="application/json,.json" onChange={pickFile} className="field text-xs" />
          {fileName && <span className="text-[var(--text-muted)]">{fileName}</span>}
        </label>

        <Input
          label="Backup passphrase"
          type="password"
          autoComplete="off"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="The passphrase you chose for the backup"
        />

        {error && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">
            {error}
          </p>
        )}

        <Button variant="primary" loading={busy} disabled={!fileText || passphrase.length === 0} onClick={() => run(() => onLink(passphrase, fileText))}>
          Link this device
        </Button>

        <div className="border-t border-[var(--border-subtle)] pt-4 flex flex-col gap-2">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            No backup? You can start fresh, but your old messages will not be readable and your contacts will see a security-code change.
          </p>
          {confirmFresh ? (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" loading={busy} onClick={() => run(onStartFresh)}>
                Yes, replace my key
              </Button>
              <Button variant="tertiary" size="sm" disabled={busy} onClick={() => setConfirmFresh(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="tertiary" size="sm" disabled={busy} onClick={() => setConfirmFresh(true)}>
              Start fresh
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled={busy} onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};
