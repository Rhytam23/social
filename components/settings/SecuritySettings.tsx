import React, { useState } from 'react';
import { DeviceItem } from '../../types/ui';
import { IconCheck, IconLaptop, IconMobile, IconShield } from '../ui/icons';

export interface SecuritySettingsProps {
  devices: DeviceItem[];
  identityFingerprint: string;
  registrationId: number;
  onExportKeyBackup: (passphrase: string) => Promise<void>;
  onRestoreKeyBackup: (passphrase: string, backupJson: string) => Promise<void>;
  onRevokeDevice: (deviceId: string) => void;
  onLogout?: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  devices,
  identityFingerprint,
  registrationId,
  onExportKeyBackup,
  onRestoreKeyBackup,
  onRevokeDevice,
  onLogout,
}) => {
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreJson, setRestoreJson] = useState('');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFingerprint = (fp: string) => {
    return fp.match(/.{1,4}/g)?.join(' ') || fp;
  };

  const handleExport = async () => {
    if (!backupPassphrase || backupPassphrase.length < 8) {
      setErrorMessage('Backup passphrase must be at least 8 characters long.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setBackupMessage(null);
    try {
      await onExportKeyBackup(backupPassphrase);
      setBackupMessage('Encrypted key backup generated using Argon2id + AES-256-GCM.');
      setBackupPassphrase('');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to generate key backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!restorePassphrase || !restoreJson) {
      setErrorMessage('Please provide both the backup JSON string and passphrase.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    setBackupMessage(null);
    try {
      await onRestoreKeyBackup(restorePassphrase, restoreJson);
      setBackupMessage('Key store restored successfully!');
      setRestorePassphrase('');
      setRestoreJson('');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Invalid passphrase or corrupted backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-y-auto p-6 sm:p-8 gap-6 font-sans max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] pb-5">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">
          Security & Keys
        </h2>
        <p className="text-xs text-slate-400">
          Manage identity key fingerprints, active devices, and Argon2id encrypted key backups.
        </p>
      </div>

      {/* Status Messages */}
      {backupMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-2">
          <IconCheck className="w-4 h-4" />
          <span>{backupMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium rounded-xl flex items-center gap-2">
          <span>✕ {errorMessage}</span>
        </div>
      )}

      {/* 1. Identity Key Details */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconShield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Identity & Registration Profile
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
            Session Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-1">
            <span className="text-slate-400">Local Registration ID:</span>
            <span className="text-sm font-bold font-mono text-slate-100">#{registrationId}</span>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col gap-1">
            <span className="text-slate-400">Cryptographic Engine:</span>
            <span className="text-xs font-medium text-slate-200">
              @signalapp/libsignal-client v0.102.0
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <span className="text-slate-400">Public Safety Fingerprint:</span>
          <p className="break-all p-3.5 bg-slate-950/60 border border-slate-800 font-mono text-xs text-emerald-400 rounded-xl tracking-wider select-all">
            {formatFingerprint(identityFingerprint)}
          </p>
        </div>
      </div>

      {/* 2. Registered Devices */}
      <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-100">
          Registered Devices
        </h3>

        <div className="flex flex-col gap-2.5">
          {devices.map((d) => {
            const isMobile = d.deviceName.toLowerCase().includes('phone') || d.deviceName.toLowerCase().includes('ios');
            return (
              <div
                key={d.id}
                className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-400">
                    {isMobile ? <IconMobile className="w-4 h-4" /> : <IconLaptop className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{d.deviceName}</span>
                      {d.isCurrentDevice && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                          This Device
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Reg ID: #{d.registrationId} • Active: {d.lastActive}
                    </span>
                  </div>
                </div>

                {!d.isCurrentDevice && (
                  <button
                    onClick={() => onRevokeDevice(d.id)}
                    className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition-colors"
                  >
                    Revoke device
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Key Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-100">
            Create Key Backup
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Derives a 256-bit AES key using Argon2id. Private keys remain encrypted before export.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-300">Backup Passphrase</label>
            <input
              type="password"
              placeholder="Enter passphrase (min 8 chars)..."
              value={backupPassphrase}
              onChange={(e) => setBackupPassphrase(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 p-2.5 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-slate-700"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={isProcessing || !backupPassphrase}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            Export Key Backup
          </button>
        </div>

        {/* Restore */}
        <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-100">
            Restore Key Store
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Import an encrypted backup JSON file to restore prekeys, identity keys, and Signal session state.
          </p>

          <div className="flex flex-col gap-2">
            <input
              type="password"
              placeholder="Backup Passphrase..."
              value={restorePassphrase}
              onChange={(e) => setRestorePassphrase(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 p-2.5 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-slate-700"
            />
            <textarea
              placeholder="Paste encrypted backup JSON ciphertext..."
              value={restoreJson}
              onChange={(e) => setRestoreJson(e.target.value)}
              rows={2}
              className="w-full bg-slate-950/60 text-slate-200 border border-slate-800 p-2.5 text-xs font-mono rounded-xl focus:outline-none focus:border-slate-700 resize-none"
            />
          </div>

          <button
            onClick={handleRestore}
            disabled={isProcessing || !restorePassphrase || !restoreJson}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
          >
            Restore Backup
          </button>
        </div>
      </div>

      {/* 4. Session Sign Out */}
      {onLogout && (
        <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-slate-100">Sign Out</span>
            <span className="text-xs text-slate-400">Lock your keys and end your session on this browser.</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="py-2.5 px-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
