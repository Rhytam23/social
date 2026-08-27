import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function TermsPage() {
  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <div className="container-max px-4 md:px-6 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--accent-blue)] font-bold">TERMS & CONDITIONS</span>
        </nav>

        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
            <Icon name="gavel" size={14} /> SALES AGREEMENT & TERMS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed max-w-2xl">
            Please read these Terms & Conditions carefully before creating an account, ordering hardware, or configuring custom PC builds on PREMIUM PC.
          </p>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-3">Last Updated: August 27, 2026</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">01</span>
                Account Registration & Responsibilities
              </h2>
              <p>
                When creating an account or using 2-step OTP / OAuth login, you are responsible for maintaining the confidentiality of your session credentials. You agree to provide accurate email and delivery contact details.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">02</span>
                Product Specs, Pricing & Payments
              </h2>
              <p>
                Component prices and stock statuses are updated in real-time. We reserve the right to correct pricing errors before order dispatch. Payments are processed securely via PCI-compliant gateways.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">03</span>
                Shipping, Returns & Cancellations
              </h2>
              <p>
                Orders are processed and dispatched according to our <Link to="/shipping-policy" className="text-[var(--accent-blue)] underline">Shipping Policy</Link>. Returns and cancellations are governed by our <Link to="/refund-policy" className="text-[var(--accent-blue)] underline">Refund Policy</Link>.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">04</span>
                Intellectual Property & Liability Limits
              </h2>
              <p>
                All trademarks, product names, images, logos, and custom PC configurator logic are the property of PREMIUM PC or their respective manufacturer brand partners. Our maximum financial liability is limited to the purchase price of the affected product order.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">05</span>
                Governing Entity & Contact
              </h2>
              <div className="p-4 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono space-y-1.5 text-[var(--text-secondary)]">
                <div><span className="text-[var(--text-primary)] font-bold">Platform Operator:</span> PREMIUM PC Hardware Platform</div>
                <div><span className="text-[var(--text-primary)] font-bold">Jurisdiction:</span> State & Federal Consumer Protection Laws</div>
                <div><span className="text-[var(--text-primary)] font-bold">Support Contact:</span> support@premiumpc.com</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
                <Icon name="description" size={18} className="text-[var(--accent-blue)]" />
                Legal Help
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Need clarification on sales agreements or custom PC build warranties? Reach out to support.
              </p>
              <Link to="/support" className="text-[var(--accent-blue)] font-mono text-xs font-bold hover:underline block pt-1">
                Open Support Ticket →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
