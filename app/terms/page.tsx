import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '../../components/landing/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using Nook.',
  alternates: { canonical: '/terms' },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="September 20, 2026">
      <LegalSection title="1. Acceptance">
        <p>
          By using the Nook web application you agree to these terms. If you do not agree, do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          Nook provides end-to-end encrypted direct messages, groups, communities, voice notes, calls and file sharing.
        </p>
      </LegalSection>

      <LegalSection title="3. Your keys">
        <p>
          Your encryption key is held in your browser, and the service cannot recover it for you. You are responsible for the security of your devices and of any passphrase backup you export. Without the key or a backup, encrypted messages cannot be read again.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree not to use Nook to:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Break the law or send malicious code.</li>
          <li>Disrupt, overload, probe or reverse-engineer the service infrastructure.</li>
          <li>Impersonate another person or misrepresent your affiliation.</li>
          <li>Harass other people. Reports you send are reviewed by the administrators of the deployment.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Warnings, suspension and blocks">
        <p>
          Accounts that many different people report can be warned, suspended or blocked, automatically or by an administrator, as described in the Privacy Policy. Suspended and blocked accounts, and the email addresses and network addresses tied to them, cannot be used to create new accounts. You can ask for a decision to be reviewed from the Contact page.
        </p>
      </LegalSection>

      <LegalSection title="6. No warranty">
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, express or implied. It has not had an independent security audit and should not be relied on for information whose exposure could cause serious harm.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
