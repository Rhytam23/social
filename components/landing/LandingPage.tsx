'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconLock,
  IconShield,
  IconUsers,
  IconPaperclip,
  IconMic,
  IconCheckCheck,
  IconMobile,
} from '../ui/icons';

export interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header Navigation */}
      <header className="w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <IconLock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white">Private Chat</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium leading-none">End-to-End Encrypted</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security Architecture</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('signin')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Subtle Security Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <IconShield className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Architecture • Client-Side X25519 Encryption</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.15]">
            Private messaging built for genuine privacy.
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            Direct messages, group spaces, encrypted attachments, and voice notes. Everything is encrypted directly on your device before transmission. No plaintext ever touches our database.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/15 active:scale-95"
            >
              Create Free Account
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm rounded-xl transition-all active:scale-95"
            >
              Open Web App
            </button>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="mt-14 w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col">
            {/* Header bar of preview */}
            <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px] text-emerald-400">
                  BM
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-100">Bob Miller</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Identity Verified • #10482</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Encrypted Channel Active</span>
              </div>
            </div>

            {/* Mock Chat Canvas */}
            <div className="p-4 sm:p-6 flex flex-col gap-3.5 bg-[#0b0f19] text-xs">
              {/* E2EE Info pill */}
              <div className="self-center px-3 py-1 bg-slate-950/80 border border-slate-800/80 rounded-full text-[11px] text-slate-400 font-sans flex items-center gap-1.5 shadow-xs">
                <IconLock className="w-3 h-3 text-emerald-400" />
                <span>Messages and media are end-to-end encrypted on your device before sending.</span>
              </div>

              {/* Incoming Message */}
              <div className="self-start max-w-[85%] sm:max-w-md bg-slate-800/90 border border-slate-700/60 rounded-2xl p-3 shadow-xs flex flex-col gap-1 text-slate-200">
                <p>Hey Alice! Ready to test client-side private messaging?</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>10:28 AM</span>
                </div>
              </div>

              {/* Outgoing Message with Quoted Reply */}
              <div className="self-end max-w-[85%] sm:max-w-md bg-emerald-600 text-slate-950 font-medium rounded-2xl p-3 shadow-md flex flex-col gap-1.5">
                <div className="px-2.5 py-1 bg-emerald-700/60 rounded-lg text-[11px] text-emerald-100 border-l-2 border-emerald-300">
                  <span className="font-semibold block text-[10px] text-emerald-200">Bob Miller</span>
                  <span className="truncate block">Hey Alice! Ready to test client-side private messaging?</span>
                </div>
                <p className="text-slate-950">Welcome to Private Chat! Keys are verified and stored securely on your device.</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-950/80 font-mono">
                  <span>10:30 AM</span>
                  <IconCheckCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Outgoing Voice Note Mock */}
              <div className="self-end max-w-[85%] sm:max-w-xs bg-emerald-600 text-slate-950 rounded-2xl p-2.5 shadow-md flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-emerald-100 shrink-0">
                  <IconMic className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-1.5 w-full bg-emerald-800/40 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-slate-950 rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-emerald-950/80">
                    <span>Voice Note (Encrypted)</span>
                    <span>0:14</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Core Features Grid */}
        <section id="features" className="py-20 bg-slate-950/60 border-t border-slate-900 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Everything you need in a modern messaging client
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-400">
                Designed with standard messaging familiarities, built on strict cryptographic guarantees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <IconLock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Direct 1-on-1 Chats</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by X25519 public-key encryption with per-device cryptographic identity keys.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <IconUsers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Group Spaces</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Group messaging uses a per-group encryption key distributed to each member&apos;s device. Only current members can decrypt messages.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <IconMic className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Encrypted Voice & Media</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Native HTML5 microphone voice notes and file attachments encrypted client-side with 256-bit AES-GCM.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <IconShield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero-Knowledge Storage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our database only stores ciphertext and initialization nonces. We have no keys to read your messages.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <IconPaperclip className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Encrypted Key Backup</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export and restore your device identity key using memory-hard Argon2id key derivation and passphrase encryption.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <IconMobile className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Desktop & Mobile Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Responsive design that adapts seamlessly from ultra-wide displays down to 390px mobile screens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom CTA Section */}
        <section className="py-20 px-4 sm:px-6 text-center max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center gap-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Ready to experience private messaging?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Create an account in seconds. No phone number or credit card required.
            </p>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-slate-900 py-8 bg-[#05080f] text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <IconLock className="w-4 h-4 text-emerald-400" />
            <span>Private Chat V1 • All messages end-to-end encrypted</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <button onClick={() => onOpenAuth('signin')} className="hover:text-slate-300 transition-colors">Sign In</button>
            <button onClick={() => onOpenAuth('signup')} className="hover:text-slate-300 transition-colors">Create Account</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
