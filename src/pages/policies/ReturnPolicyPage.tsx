import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function ReturnPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">RETURN POLICY</span>
        </nav>

        <header className="mb-10 border-b border-[#292a2e] pb-6">
          <h1 className="text-white font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Returns & RMA Guidelines
          </h1>
          <p className="text-[#8b90a0] text-sm max-w-2xl leading-relaxed">
            Guidelines for product returns, RMA requests, and replacement processing.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-[#c1c6d7] leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">1. Return Window & Conditions</h2>
              <p>
                Eligible items may be submitted for return or exchange within the confirmed store return period.
              </p>
              <div className="p-4 bg-[#16171d] border border-[#292a2e] rounded-lg text-xs font-mono space-y-1 text-[#8b90a0]">
                <div><span className="text-white font-semibold">Return Window:</span> [CLIENT CONFIRMATION REQUIRED: Return Window Days]</div>
                <div><span className="text-white font-semibold">Price Match Policy:</span> [CLIENT CONFIRMATION REQUIRED: Price Protection Policy]</div>
                <div><span className="text-white font-semibold">RMA Process:</span> Submit ticket via support portal for authorization</div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">2. RMA Request Steps</h2>
              <ol className="list-decimal pl-5 space-y-1.5 text-[#8b90a0]">
                <li>Log into your account dashboard or support portal.</li>
                <li>Select your Order ID and specify the product serial number.</li>
                <li>Await RMA authorization and return shipping guidance from technical support.</li>
              </ol>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[#16171d] border border-[#292a2e] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Icon name="autorenew" size={18} className="text-[#007aff]" />
                RMA Assistance
              </h3>
              <p className="text-xs text-[#8b90a0] leading-relaxed">
                Need to request a replacement or initiate a warranty claim?
              </p>
              <Link
                to="/support"
                className="w-full py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded-lg transition-colors block text-center"
              >
                OPEN SUPPORT TICKET →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
