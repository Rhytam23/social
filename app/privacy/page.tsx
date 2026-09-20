import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '../../components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Nook stores, what it cannot read, and how long it keeps it.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 20, 2026">
      <LegalSection title="1. What this covers">
        <p>
          Nook is an end-to-end encrypted messenger. The people who run a deployment do not read, analyse or sell your message content, conversation contents or attachments, and the software is built so that they cannot.
        </p>
      </LegalSection>

      <LegalSection title="2. Message content">
        <p>
          Messages, voice notes and files are encrypted on your device before they are sent. Direct messages use X25519 key exchange with XSalsa20-Poly1305 (libsodium), groups use a shared group key, and attachments use AES-256-GCM. Private keys stay on your devices, so the server and its administrators cannot decrypt what you send.
        </p>
        <p>
          The service does not have forward secrecy: anyone who obtains your account key could decrypt messages they have also obtained.
        </p>
      </LegalSection>

      <LegalSection title="3. What is stored">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li><strong className="text-[var(--text-primary)]">Account details:</strong> display name, optional @username, email address, and the profile fields you choose to fill in.</li>
          <li><strong className="text-[var(--text-primary)]">Public key:</strong> the public half of your account key, which your contacts use to encrypt messages to you.</li>
          <li><strong className="text-[var(--text-primary)]">Ciphertext:</strong> encrypted message payloads with their nonces, kept until deleted or, if you turn on disappearing messages, until they expire. Who is in a conversation and when messages were sent is also visible to the server.</li>
          <li><strong className="text-[var(--text-primary)]">Page-view statistics:</strong> Vercel Web Analytics counts visits. It uses no cookies and is not linked to your account or messages. Only the page path is sent, never the part after a question mark, so invite codes and sign-in links are not shared. It records general information such as approximate country, browser and device type, as described in Vercel&apos;s documentation.</li>
          <li><strong className="text-[var(--text-primary)]">Network addresses:</strong> after you sign in, the network (IP) address your connection came from is recorded against your account, up to the 20 most recent, and deleted 180 days after you last used it. It is used only for safety (see section 6), and only platform administrators can read it. Many people share one address (a home network, a workplace, a mobile carrier), so an address does not identify you.</li>
          <li><strong className="text-[var(--text-primary)]">Error reports:</strong> when something goes wrong, a short technical description (never message text, keys or passwords) may be recorded for administrators so they can fix it. Reports are deleted after 30 days.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Keys and backups">
        <p>
          Your private key is kept in your browser&apos;s storage. You can export a backup protected by a passphrase (Argon2id) under Settings, Security, and use it to restore your history or link another device. If you lose both the device and the backup, the messages cannot be recovered.
        </p>
      </LegalSection>

      <LegalSection title="5. Support messages">
        <p>
          If you write to us through the Contact page or Report a problem, we store your message, the email address you give (or your account&apos;s), your account if you were signed in, and the browser you used. Only platform administrators can read them and they are deleted after 90 days.
        </p>
      </LegalSection>

      <LegalSection title="6. Reports, warnings and blocks">
        <p>
          Anyone can report a message. Reports are read by platform administrators only, and the person reported is never told who reported them. When several <em>different</em> people report the same account, the service acts automatically: at 3 the person sees a warning, at 10 the account is suspended for 7 days, and at 20 it is blocked permanently. Reports from accounts less than 24 hours old, and reports an administrator dismisses, do not count. An administrator can review and undo any suspension or block, and can suspend an account directly.
        </p>
        <p>
          When an account is suspended or blocked, its email address and the network addresses recorded for it are also refused when creating new accounts: for the length of the suspension, or permanently after a permanent block. Because addresses are shared, this can affect other people on the same network; if that happened to you, contact us from the Contact page. This does not give anyone access to messages: they stay encrypted and unreadable to us.
        </p>
      </LegalSection>

      <LegalSection title="7. Your data">
        <p>
          You can delete your own messages and leave groups from within the app. There is no self-service account deletion yet: to have an account and its stored data removed, ask the administrator of the deployment you use.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
