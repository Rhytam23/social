import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function AboutPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">ABOUT US</span>
        </nav>

        <header className="mb-10 border-b border-[#292a2e] pb-6">
          <h1 className="text-white font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            About PREMIUM PC
          </h1>
          <p className="text-[#8b90a0] text-sm max-w-2xl leading-relaxed">
            PREMIUM PC provides enthusiast hardware, custom PC configuration tools, prebuilt gaming systems, and computational workstations.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-[#c1c6d7] leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-xl tracking-tight">System Building & Hardware Catalog</h2>
              <p>
                Our store features high-performance graphics cards, desktop processors, motherboards, high-speed RAM, PCIe SSDs, cooling solutions, and prebuilt gaming systems.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-xl tracking-tight">Corporate Verification Details</h2>
              <div className="p-4 bg-[#16171d] border border-[#292a2e] rounded-lg text-xs font-mono space-y-1 text-[#8b90a0]">
                <div><span className="text-white font-semibold">Store Operator:</span> [CLIENT CONFIRMATION REQUIRED: Operator Name]</div>
                <div><span className="text-white font-semibold">Headquarters:</span> [CLIENT CONFIRMATION REQUIRED: Physical Business Location]</div>
                <div><span className="text-white font-semibold">Customer Service Phone:</span> [CLIENT CONFIRMATION REQUIRED: Phone Number]</div>
                <div><span className="text-white font-semibold">Support Hours:</span> [CLIENT CONFIRMATION REQUIRED: Operating Hours]</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[#16171d] border border-[#292a2e] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Icon name="memory" size={18} className="text-[#007aff]" />
                Interactive Configurator
              </h3>
              <p className="text-xs text-[#8b90a0] leading-relaxed">
                Build and test system component configurations with live wattage checking.
              </p>
              <Link
                to="/builder"
                className="w-full py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded-lg transition-colors block text-center"
              >
                LAUNCH PC BUILDER →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
