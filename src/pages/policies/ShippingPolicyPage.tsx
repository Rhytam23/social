import { Link } from 'react-router-dom'
import { Icon, Button } from '../../components/ui'

export function ShippingPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-6">
          <Link to="/" className="hover:text-(--text-primary) transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">SHIPPING POLICY</span>
        </nav>

        <header className="mb-10 border-b border-(--border-theme) pb-6">
          <h1 className="text-(--text-primary) font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Shipping & Order Dispatch Guidelines
          </h1>
          <p className="text-(--text-secondary) text-sm max-w-2xl leading-relaxed">
            Information regarding carrier partners, dispatch timelines, signature requirements, and freight insurance.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-(--text-secondary) leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">Dispatch Cutoff Times</h2>
              <p>
                Orders for individual retail hardware components placed before 2:00 PM EST ship the same business day.
              </p>
              <div className="p-4 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl text-xs font-mono space-y-1 text-(--text-secondary)">
                <div><span className="text-(--text-primary) font-semibold">Standard Shipping:</span> 2 to 3 business days</div>
                <div><span className="text-(--text-primary) font-semibold">Priority Overnight:</span> Next business day</div>
                <div><span className="text-(--text-primary) font-semibold">Free standard shipping:</span> on orders over $500</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-(--text-primary) font-bold text-base flex items-center gap-2">
                <Icon name="local_shipping" size={18} className="text-(--accent-blue)" />
                Track Your Shipment
              </h3>
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                Check live carrier scan updates using your order reference number.
              </p>
              <Link to="/order-tracking">
                <Button variant="primary" size="md" fullWidth>
                  Track Existing Order
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
