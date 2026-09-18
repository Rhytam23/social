'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DeviceItem, UserItem } from '../../types/ui';
import {
  IconCheck,
  IconLaptop,
  IconLock,
  IconMobile,
  IconShield,
} from '../ui/icons';
import { createClient } from '../../lib/supabase/client';

export type SettingsTab = 'profile' | 'account' | 'privacy' | 'appearance' | 'notifications' | 'about';

export interface SettingsViewProps {
  currentUser: UserItem;
  devices: DeviceItem[];
  identityFingerprint: string;
  registrationId: number;
  onUpdateProfile?: (updated: Partial<UserItem>) => void;
  onExportKeyBackup: (passphrase: string) => Promise<void>;
  onRestoreKeyBackup: (passphrase: string, backupJson: string) => Promise<void>;
  onRevokeDevice: (deviceId: string) => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  devices,
  identityFingerprint,
  registrationId,
  onUpdateProfile,
  onExportKeyBackup,
  onRestoreKeyBackup,
  onRevokeDevice,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Security / Backup State
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreJson, setRestoreJson] = useState('');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  // Appearance State
  const [theme, setTheme] = useState<'dark' | 'system'>('dark');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Notifications State
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [browserPermStatus, setBrowserPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  const formatFingerprint = (fp: string) => {
    return fp.match(/.{1,4}/g)?.join(' ') || fp;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingProfile(true);
    setProfileSuccess(null);
    setErrorMessage(null);

    try {
      const isSupabaseConfigured =
        typeof process !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isSupabaseConfigured) {
        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            username: username.trim() || undefined,
            phone_number: phoneNumber.trim() || undefined,
          })
          .eq('id', currentUser.id);
      }

      if (onUpdateProfile) {
        onUpdateProfile({
          name: displayName.trim(),
          username: username.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
        });
      }

      setProfileSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExportBackup = async () => {
    if (!backupPassphrase || backupPassphrase.length < 8) {
      setErrorMessage('Backup passphrase must be at least 8 characters long.');
      return;
    }
    setIsProcessingBackup(true);
    setErrorMessage(null);
    setBackupMessage(null);
    try {
      await onExportKeyBackup(backupPassphrase);
      setBackupMessage('Encrypted key backup generated using Argon2id + AES-256-GCM.');
      setBackupPassphrase('');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to generate key backup.');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restorePassphrase || !restoreJson) {
      setErrorMessage('Please provide both the backup JSON string and passphrase.');
      return;
    }
    setIsProcessingBackup(true);
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
      setIsProcessingBackup(false);
    }
  };

  const requestBrowserNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermStatus(perm);
      } catch {
        // ignore
      }
    }
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy & Security' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-y-auto p-4 sm:p-8 font-sans max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Settings</h2>
        <p className="text-xs text-slate-400">
          Manage your profile identity, security keys, devices, and messaging preferences.
        </p>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/40 border border-slate-800/80 rounded-2xl mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id);
              setErrorMessage(null);
              setBackupMessage(null);
              setProfileSuccess(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status Alerts */}
      {profileSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-2 mb-4">
          <IconCheck className="w-4 h-4" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {backupMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-2 mb-4">
          <IconCheck className="w-4 h-4" />
          <span>{backupMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium rounded-xl flex items-center gap-2 mb-4">
          <span>✕ {errorMessage}</span>
        </div>
      )}

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-md shrink-0">
                {displayName.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-sm">{displayName}</span>
                <span className="text-xs text-slate-400 font-mono">Registration #{registrationId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold text-xs">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-slate-600 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold text-xs">Username (@handle)</label>
                <input
                  type="text"
                  placeholder="e.g. alex_m"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-slate-600 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold text-xs">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email || 'Registered account'}
                  className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold text-xs">Phone Number (Discovery)</label>
                <input
                  type="tel"
                  placeholder="+1 555-0199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-slate-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile || !displayName.trim()}
              className="self-end py-2 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ACCOUNT */}
      {activeTab === 'account' && (
        <div className="flex flex-col gap-5">
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-100">Account Credentials</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account is authenticated via Supabase Auth with bcrypt/scrypt hashed password credentials.
            </p>

            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200">Account Password</span>
                <span className="text-[11px] text-slate-400">Last updated upon registration</span>
              </div>
              <Link
                href="/forgot-password"
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
              >
                Reset Password
              </Link>
            </div>
          </div>

          {onLogout && (
            <div className="p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-rose-300">End Session</span>
                <span className="text-xs text-slate-400">Lock your cryptographic key store and sign out from this device.</span>
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
      )}

      {/* TAB 3: PRIVACY & SECURITY */}
      {activeTab === 'privacy' && (
        <div className="flex flex-col gap-6">
          {/* Identity Fingerprint Card */}
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <IconShield className="w-4 h-4 text-emerald-400" />
              <span>Signal Identity Key Fingerprint</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare this cryptographic public fingerprint out-of-band with contacts to verify no man-in-the-middle exists.
            </p>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 tracking-wider select-all break-all">
              {formatFingerprint(identityFingerprint)}
            </div>
          </div>

          {/* Active Devices */}
          <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-100">Registered Devices</h3>
            <div className="flex flex-col gap-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                      {device.deviceName.toLowerCase().includes('mobile') ? (
                        <IconMobile className="w-4 h-4" />
                      ) : (
                        <IconLaptop className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{device.deviceName}</span>
                        {device.isCurrentDevice && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">#{device.registrationId} • {device.lastActive}</span>
                    </div>
                  </div>

                  {!device.isCurrentDevice && (
                    <button
                      onClick={() => onRevokeDevice(device.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Argon2id Key Backup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-100">Export Encrypted Key Backup</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Derive an Argon2id key to export your Double Ratchet sessions.
              </p>
              <input
                type="password"
                placeholder="Passphrase (8+ chars)..."
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isProcessingBackup || !backupPassphrase}
                className="py-2 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Export Backup
              </button>
            </div>

            <div className="p-5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-100">Restore Key Backup</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Restore prekeys and sessions from an encrypted JSON payload.
              </p>
              <input
                type="password"
                placeholder="Backup Passphrase..."
                value={restorePassphrase}
                onChange={(e) => setRestorePassphrase(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
              <textarea
                placeholder="Paste backup ciphertext..."
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                rows={1}
                className="bg-slate-950/60 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 font-mono focus:outline-none resize-none"
              />
              <button
                type="button"
                onClick={handleRestoreBackup}
                disabled={isProcessingBackup || !restorePassphrase || !restoreJson}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-6 shadow-xs">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200">Theme</span>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-emerald-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>Dark (Standard)</span>
                {theme === 'dark' && <IconCheck className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  theme === 'system'
                    ? 'bg-slate-900 border-emerald-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>System</span>
                {theme === 'system' && <IconCheck className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-200">Chat Bubble Density</span>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  density === 'comfortable'
                    ? 'bg-slate-900 border-emerald-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>Comfortable</span>
                {density === 'comfortable' && <IconCheck className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  density === 'compact'
                    ? 'bg-slate-900 border-emerald-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span>Compact</span>
                {density === 'compact' && <IconCheck className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Message Audio Chimes</span>
              <span className="text-[11px] text-slate-400">Play subtle audio alert on new incoming message</span>
            </div>
            <input
              type="checkbox"
              checked={soundsEnabled}
              onChange={(e) => setSoundsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Browser Push Alerts</span>
              <span className="text-[11px] text-slate-400">
                Current status: <span className="font-mono text-emerald-400">{browserPermStatus}</span>
              </span>
            </div>
            {browserPermStatus !== 'granted' && browserPermStatus !== 'unsupported' && (
              <button
                type="button"
                onClick={requestBrowserNotifications}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Enable Alerts
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ABOUT */}
      {activeTab === 'about' && (
        <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-4 shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <IconLock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">Private Chat</span>
              <span className="text-slate-400 text-[11px] font-mono">Version 1.0.0 (Production V1)</span>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed pt-2">
            Private Chat is an open-standard messaging client engineered with genuine zero-knowledge guarantees. Built using Signal Protocol Double Ratchet, Sender Keys, and AES-256-GCM.
          </p>

          <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      )}
    </div>
  );
};
