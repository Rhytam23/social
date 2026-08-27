import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function RefundPolicyPage() {
  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 md:px-6 py-10 md:py-16 max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-bold">REFUND & CANCELLATION POLICY</span>
        </nav>

        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
            <Icon name="assignment_return" size={14} /> GUARANTEE & PROTECTION
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed max-w-2xl">
            At PREMIUM PC, customer satisfaction and order confidence are our highest priorities. Review our policies regarding order modifications, returns, and refunds below.
          </p>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-3">Last Updated: August 27, 2026</p>
        </header>

        <div className="space-y-8 text-sm text-[var(--text-secondary)] leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">01</span>
              Order Cancellation Eligibility & Timing
            </h2>
            <p>
              Orders for individual PC components and accessories can be cancelled penalty-free at any time prior to shipment dispatch. Once an order enters the <strong>Shipped</strong> state, standard return procedures apply.
            </p>
            <p>
              For <strong>Custom Gaming Rigs & Workstations</strong>, cancellations are fully accepted prior to component assembly. Orders cancelled after assembly or stress testing has commenced are subject to a 10% restock fee to cover custom wiring and bench time.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">02</span>
              Return & Refund Eligibility
            </h2>
            <p>
              We offer a <strong>30-Day Satisfaction Guarantee</strong> on most unopened and brand-new hardware. Items must be returned in their original factory packaging with all serial numbers, manual inserts, accessories, and anti-static bags intact.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">03</span>
              Damaged, Defective, or Incorrect Items
            </h2>
            <p>
              If your shipment arrives damaged, defective, or containing an incorrect component, notify our support team within <strong>48 hours</strong> of package delivery. We will immediately issue a prepaid return shipping label and prioritize a expedited replacement dispatch.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">04</span>
              Refund Processing & Payment Methods
            </h2>
            <p>
              Once your returned package is received and inspected at our warehouse facility (typically 2-3 business days), refunds are credited back to the original payment method:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Credit / Debit Cards:</strong> 3 – 5 business days depending on issuing bank.</li>
              <li><strong>Store Credit & Gift Cards:</strong> Instant credit to your PREMIUM PC account balance.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-xs font-mono font-bold flex items-center justify-center">05</span>
              Non-Refundable Items & Conditions
            </h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Digital software license keys (Windows OS, antivirus, game bundles) once unsealed or redeemed.</li>
              <li>Products showing physical damage, pin bends, liquid spills, or overclocking abuse.</li>
              <li>Items returned missing original box barcodes, serial numbers, or included accessories.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <h3 className="font-bold text-base text-[var(--text-primary)]">How to Initiate a Return or Cancellation</h3>
            <p>
              To request a return authorization (RMA) or cancel an active order, navigate to your <Link to="/account/orders" className="text-[var(--accent-blue)] underline">Account Orders</Link> dashboard, or contact our dedicated support team directly at <Link to="/support" className="text-[var(--accent-blue)] underline">PREMIUM PC Support Center</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
