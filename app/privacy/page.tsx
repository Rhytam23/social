'use client';

import React from 'react';
import Link from 'next/link';
import { IconLock, IconShield } from '../../components/ui/icons';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[var(--canvas-bg)]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IconLock className="w-4 h-4" />
            </div>
            <span>Private Chat</span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 text-xs leading-relaxed text-slate-300">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <IconShield className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Privacy Commitment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <span className="text-slate-500 text-[11px]">Last Updated: September 18, 2026</span>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">1. Core Privacy Philosophy</h2>
          <p>
            Private Chat is architected with a zero-knowledge security standard. We believe your private communications are solely your property. We do not inspect, analyze, or monetize your message content, conversation lists, or attachments.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">2. Cryptographic Message Content</h2>
          <p>
            All messages, voice recordings, and file attachments are encrypted client-side on your device before transmission using the Signal Protocol Double Ratchet and 256-bit AES-GCM.
          </p>
          <p>
            Because private keys never leave your device, neither Private Chat administrators nor third-party infrastructure providers possess the capability to decrypt your communications.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">3. Information We Collect</h2>
          <p>
            To provide basic account authentication and contact discovery, we retain only minimal public profile information:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-400">
            <li><strong>Account Identity:</strong> Display name, optional @username, and email address for login verification.</li>
            <li><strong>Public Encryption Key:</strong> The public half of your account key, which your contacts use to encrypt messages to you. The private half never leaves your devices.</li>
            <li><strong>Encrypted Ciphertext:</strong> Encrypted message payloads and their nonces, stored until they are deleted (or expire, if you turn on disappearing messages). We cannot read them.</li>
            <li><strong>Anonymous Page-View Statistics:</strong> We use Vercel Web Analytics to count visits to our pages. It uses no cookies and is not linked to your account or your messages. We send it only the page path, never the part of an address after a question mark (so invite codes and sign-in links are not shared), and it records general information such as approximate country, browser and device type, as described in Vercel&apos;s documentation.</li>
            <li><strong>Error Reports:</strong> When something goes wrong, a short technical error description (never message text, keys or passwords) may be sent to our administrators so they can fix it. These are deleted after 30 days.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">4. Key Storage and Local Backups</h2>
          <p>
            Your private encryption key is stored locally within your browser storage. You may export a passphrase-protected backup encrypted with Argon2id at any time under Settings → Security, and use it to link another device to your account.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">5. Account Deletion & Rights</h2>
          <p>
            You may terminate your account and wipe your public prekey registrations at any time through the application settings.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[11px] text-slate-600 bg-[var(--canvas-bg)]">
        Private Chat V1 • Genuine Client-Side Privacy
      </footer>
    </div>
  );
}
