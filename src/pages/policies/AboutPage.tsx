import { Link } from 'react-router-dom'
import { Icon, Button } from '../../components/ui'

export function AboutPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-6">
          <Link to="/" className="hover:text-(--text-primary) transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">ABOUT US</span>
        </nav>

        <header className="mb-10 border-b border-(--border-theme) pb-6">
          <h1 className="text-(--text-primary) font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            About PREMIUM PC
          </h1>
          <p className="text-(--text-secondary) text-sm max-w-2xl leading-relaxed">
            PREMIUM PC provides enthusiast hardware, custom PC configuration tools, prebuilt gaming systems, and computational workstations.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-(--text-secondary) leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">System Building & Hardware Catalog</h2>
              <p>
                Our store features high-performance graphics cards, desktop processors, motherboards, high-speed RAM, PCIe SSDs, cooling solutions, and prebuilt gaming systems.
              </p>
            </section>

            {/*
              Business registration details are supplied by the store operator.
              Nothing is asserted here until those details are provided.
            */}
            <section className="space-y-3">
              <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">Contact</h2>
              <div className="p-4 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl text-xs font-mono space-y-1 text-(--text-secondary)">
                <div>
                  <span className="text-(--text-primary) font-semibold">Support email:</span>{' '}
                  <a href="mailto:support@premiumpc.com" className="text-(--accent-blue) hover:underline">
                    support@premiumpc.com
                  </a>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-(--text-primary) font-bold text-base flex items-center gap-2">
                <Icon name="memory" size={18} className="text-(--accent-blue)" />
                Interactive Configurator
              </h3>
              <p className="text-xs text-(--text-secondary) leading-relaxed">
                Build and test system component configurations with live wattage checking.
              </p>
              <Link to="/builder">
                <Button variant="primary" size="md" fullWidth>
                  Launch PC Builder →
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
