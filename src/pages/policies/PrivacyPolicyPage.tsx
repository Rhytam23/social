import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function PrivacyPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-6">
          <Link to="/" className="hover:text-(--text-primary) transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">PRIVACY POLICY</span>
        </nav>

        <header className="mb-10 border-b border-(--border-theme) pb-6">
          <h1 className="text-(--text-primary) font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Privacy Policy & Data Security
          </h1>
          <p className="text-(--text-secondary) text-sm max-w-2xl leading-relaxed">
            How PREMIUM PC collects, protects, and handles personal information, payment processing tokens, and telemetry data.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-(--text-secondary) leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">1. Information Collection & Usage</h2>
              <p>
                We collect essential contact details and saved PC configuration specs required to process checkout orders and provide hardware support.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">2. Payment Gateway Encryption</h2>
              <p>
                All payment transactions are encrypted using TLS 1.3 encryption. We never store raw credit card credentials on our servers.
              </p>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-(--text-primary) font-bold text-base flex items-center gap-2">
                <Icon name="shield" size={18} className="text-(--accent-blue)" />
                Data Privacy Officer
              </h3>
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                Inquiries regarding data retention or account deletion requests.
              </p>
              <Link to="/support" className="text-(--accent-blue) font-sans text-xs font-semibold hover:underline block pt-1">
                Privacy Officer Desk →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
