'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { IconLock, IconShield, IconUsers } from '../ui/icons';
import { createClient } from '../../lib/supabase/client';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialName: string;
  onProfileUpdated: (newName: string) => void;
  onStartFirstChat: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialName,
  onProfileUpdated,
  onStartFirstChat,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState(initialName || 'New User');
  const [avatarColor, setAvatarColor] = useState('emerald');
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { name: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-300', border: 'border-emerald-500' },
    { name: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-300', border: 'border-indigo-500' },
    { name: 'amber', bg: 'bg-amber-600', text: 'text-amber-300', border: 'border-amber-500' },
    { name: 'rose', bg: 'bg-rose-600', text: 'text-rose-300', border: 'border-rose-500' },
    { name: 'cyan', bg: 'bg-cyan-600', text: 'text-cyan-300', border: 'border-cyan-500' },
  ];

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      const isSupabaseConfigured =
        typeof process !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isSupabaseConfigured) {
        const supabase = createClient();
        await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', userId);
      }
      onProfileUpdated(displayName.trim());
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`private_chat_onboarding_completed_${userId}`, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
    onStartFirstChat();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 1
          ? 'Welcome to Private Chat'
          : step === 2
          ? 'End-to-End Encryption'
          : 'Ready to Message'
      }
      footerAction={
        step === 1 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveProfile}
            disabled={!displayName.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Continue'}
          </Button>
        ) : step === 2 ? (
          <Button variant="primary" size="sm" onClick={() => setStep(3)}>
            Got It
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleComplete}>
            Start First Chat
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 font-sans text-xs text-slate-300">
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
        </div>

        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <div className="flex flex-col gap-4 py-1">
            <p className="text-slate-400 leading-relaxed">
              Let&apos;s personalize how other verified contacts see you in conversations.
            </p>

            <div className="flex items-center gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div
                className={`w-12 h-12 rounded-2xl ${
                  colors.find((c) => c.name === avatarColor)?.bg || 'bg-emerald-600'
                } text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}
              >
                {displayName.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[11px] font-semibold text-slate-300">Avatar Accent</span>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setAvatarColor(c.name)}
                      className={`w-5 h-5 rounded-full ${c.bg} border-2 ${
                        avatarColor === c.name ? 'border-white scale-110' : 'border-transparent opacity-70'
                      } transition-all`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Your Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 2: Privacy / Cryptographic Explanation */}
        {step === 2 && (
          <div className="flex flex-col gap-3 py-1">
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <IconShield className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-emerald-300">Signal Double Ratchet Active</span>
                <p className="text-slate-300 leading-relaxed">
                  Every direct message, voice note, and group communication is encrypted with ratchet keys stored only on your current device.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
              <IconLock className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-slate-400 leading-relaxed text-[11px]">
                You can export an encrypted passphrase backup of your key store at any time under Settings.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Quick Start */}
        {step === 3 && (
          <div className="flex flex-col gap-3 py-2 text-center items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-1">
              <IconUsers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Your encrypted workspace is ready</h4>
            <p className="text-slate-400 max-w-xs text-[11px] leading-relaxed">
              Search for registered members by display name, username, email, or phone number to begin messaging.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
