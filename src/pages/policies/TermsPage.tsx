import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function TermsPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">TERMS OF SERVICE</span>
        </nav>

        <header className="mb-10 border-b border-[#292a2e] pb-6">
          <h1 className="text-white font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Terms of Service & Sale
          </h1>
          <p className="text-[#8b90a0] text-sm max-w-2xl leading-relaxed">
            These terms govern product catalog browsing, hardware purchases, custom PC configurator orders, and service usage.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-[#c1c6d7] leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">1. Product Pricing & Specifications</h2>
              <p>
                We maintain real hardware component catalog pricing and stock levels. In the event of a pricing or stock discrepancy, orders will be verified prior to processing.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">2. Custom PC Assembly Orders</h2>
              <p>
                Custom PC builder configurations are reviewed for component compatibility prior to assembly. Assembly timelines and testing procedures are subject to client agreement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">3. Warranty & Terms</h2>
              <div className="p-4 bg-[#16171d] border border-[#292a2e] rounded-lg text-xs font-mono space-y-1 text-[#8b90a0]">
                <div><span className="text-white font-semibold">Prebuilt System Warranty:</span> [CLIENT CONFIRMATION REQUIRED: System Warranty Duration]</div>
                <div><span className="text-white font-semibold">Component Warranty:</span> Manufacturer standard warranty terms apply</div>
                <div><span className="text-white font-semibold">Legal Jurisdiction:</span> [CLIENT CONFIRMATION REQUIRED: Governing Law Jurisdiction]</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[#16171d] border border-[#292a2e] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Icon name="gavel" size={18} className="text-[#007aff]" />
                Terms Assistance
              </h3>
              <p className="text-xs text-[#8b90a0] leading-relaxed">
                For sales terms, order support, or B2B inquiries.
              </p>
              <Link to="/support" className="text-[#007aff] font-mono text-xs hover:underline block pt-1">
                Contact Support Desk →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
