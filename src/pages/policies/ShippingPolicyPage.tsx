import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function ShippingPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">SHIPPING POLICY</span>
        </nav>

        <header className="mb-10 border-b border-[#292a2e] pb-6">
          <h1 className="text-white font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Shipping & Order Dispatch
          </h1>
          <p className="text-[#8b90a0] text-sm max-w-2xl leading-relaxed">
            Information regarding product shipping, order fulfillment, and package tracking.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-[#c1c6d7] leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">1. Order Dispatch Parameters</h2>
              <p>
                In-stock hardware orders are packed and processed for shipping during business operating days.
              </p>
              <div className="p-4 bg-[#16171d] border border-[#292a2e] rounded-lg text-xs font-mono space-y-1 text-[#8b90a0]">
                <div><span className="text-white font-semibold">Order Dispatch Cutoff:</span> [CLIENT CONFIRMATION REQUIRED: Daily Dispatch Cutoff Time]</div>
                <div><span className="text-white font-semibold">Custom Assembly Lead Time:</span> [CLIENT CONFIRMATION REQUIRED: Custom PC Lead Time]</div>
                <div><span className="text-white font-semibold">Carrier Partners:</span> [CLIENT CONFIRMATION REQUIRED: Shipping Carriers]</div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">2. Order Tracking</h2>
              <p>
                Once your package has been scanned by the logistics carrier, a tracking number is generated and attached to your order record.
              </p>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[#16171d] border border-[#292a2e] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Icon name="local_shipping" size={18} className="text-[#007aff]" />
                Track an Order
              </h3>
              <p className="text-xs text-[#8b90a0] leading-relaxed">
                Check courier status for an active order using your order ID.
              </p>
              <Link
                to="/track-order"
                className="w-full py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded-lg transition-colors block text-center"
              >
                GO TO ORDER TRACKING →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
