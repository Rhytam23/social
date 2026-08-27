import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function PrivacyPolicyPage() {
  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <div className="container-max px-4 md:px-6 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--accent-blue)] font-bold">PRIVACY POLICY</span>
        </nav>

        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
            <Icon name="shield" size={14} /> PRIVACY & PROTECTION
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed max-w-2xl">
            This Privacy Policy details how PREMIUM PC collects, processes, protects, and stores personal data, transaction records, and device telemetry.
          </p>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-3">Last Updated: August 27, 2026</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">01</span>
                Information We Collect
              </h2>
              <p>
                We collect personal information necessary to manage customer accounts, fulfill hardware orders, and provide technical warranty support:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, password hash, phone number, and OAuth provider IDs (Google, GitHub).</li>
                <li><strong>Order & Shipping Information:</strong> Delivery street address, billing contact details, items ordered, and custom PC configuration specs.</li>
                <li><strong>Payment Information:</strong> Tokenized payment confirmations. Raw credit card numbers are processed directly by PCI-DSS compliant payment gateways and are never stored on our servers.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">02</span>
                Cookies & Analytics
              </h2>
              <p>
                We use strictly necessary cookies for session authentication, shopping cart retention, and security protection. Optional analytics and functional cookies help us analyze aggregate search trends and remember user layout preferences. You can manage your preferences at any time on our <Link to="/cookie-preferences" className="text-[var(--accent-blue)] underline">Cookie Preferences</Link> page.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">03</span>
                Communications & Notifications
              </h2>
              <p>
                Transactional email notifications (OTP login verification codes, order confirmations, tracking numbers) are dispatched to your registered email address. You may opt out of promotional newsletters via your account settings.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">04</span>
                Third-Party Services & Data Security
              </h2>
              <p>
                We partner with trusted third-party providers (Neon PostgreSQL, Resend transactional email, Google Cloud, and GitHub) strictly to facilitate system authentication, database operations, and order delivery. Data transmitted to third parties is encrypted via TLS 1.3 in transit and AES-256 at rest.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">05</span>
                Data Retention & User Rights
              </h2>
              <p>
                You have the right to access, correct, export, or request permanent deletion of your personal data. Contact our Data Privacy Officer at <Link to="/support" className="text-[var(--accent-blue)] underline">PREMIUM PC Support</Link> to initiate a request.
              </p>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
                <Icon name="verified_user" size={18} className="text-[var(--accent-blue)]" />
                Data Privacy Officer
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Have questions regarding your account data, GDPR requests, or data deletion? Contact our dedicated privacy desk.
              </p>
              <Link to="/support" className="text-[var(--accent-blue)] font-mono text-xs font-bold hover:underline block pt-1">
                Contact Privacy Desk →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
