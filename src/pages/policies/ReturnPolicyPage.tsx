import { Link } from 'react-router-dom'
import { Icon, Button } from '../../components/ui'

export function ReturnPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-6">
          <Link to="/" className="hover:text-(--text-primary) transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">RETURN POLICY</span>
        </nav>

        <header className="mb-10 border-b border-(--border-theme) pb-6">
          <h1 className="text-(--text-primary) font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Returns, Refunds & RMA Guidelines
          </h1>
          <p className="text-(--text-secondary) text-sm max-w-2xl leading-relaxed">
            Our return process, price match guarantees, and manufacturer RMA replacement procedure.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-(--text-secondary) leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">30-Day Return Window</h2>
              <p>
                Unopened hardware components and custom systems may be returned within 30 days of receipt for a full refund.
              </p>
              <div className="p-4 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl text-xs font-mono space-y-1 text-(--text-secondary)">
                <div><span className="text-(--text-primary) font-semibold">Standard Return Period:</span> 30 Days from Delivery Scan</div>
                <div><span className="text-(--text-primary) font-semibold">Restocking Fee:</span> 0% for unopened retail boxes</div>
                <div><span className="text-(--text-primary) font-semibold">RMA Ticket SLA:</span> Initial response within 4 hours</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-(--text-primary) font-bold text-base flex items-center gap-2">
                <Icon name="autorenew" size={18} className="text-(--accent-blue)" />
                Initiate Return Ticket
              </h3>
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                Contact technician support with your order number to generate a prepaid shipping label.
              </p>
              <Link to="/support">
                <Button variant="primary" size="md" fullWidth>
                  Request RMA Support
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
