import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, StarRating, Price, EmptyState, Button } from '../components/ui'
import { gamingPCsData } from '../data'
import { useShop } from '../context/ShopContext'

const TIERS = [
  { id: 'All', label: 'All Prebuilts' },
  { id: 'Tier 4 - Enthusiast Extreme', label: 'Tier 4: Enthusiast Extreme' },
  { id: 'Tier 3 - 4K Ultra Gaming', label: 'Tier 3: 4K Ultra' },
  { id: 'Tier 2 - 1440p High Refresh Pro', label: 'Tier 2: 1440p Pro' },
  { id: 'Tier 1 - Esports Ready', label: 'Tier 1: Esports' },
]

export function GamingPCsPage() {
  const { addToCart, toggleWishlist, isInWishlist } = useShop()
  const [activeTier, setActiveTier] = useState<string>('All')
  const [gpuFilter, setGpuFilter] = useState<string>('All')
  const [cpuFilter, setCpuFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('featured')

  const gpuOptions = ['All', 'RTX 5090', 'RTX 4090', 'RTX 4080 Super', 'RTX 4070 Ti Super', 'RX 7900 XTX']
  const cpuOptions = ['All', 'Core Ultra 9', 'i9-14900KS', 'Ryzen 9 7950X3D', 'Ryzen 7 7800X3D']

  const filteredPCs = useMemo(() => {
    let result = [...gamingPCsData]

    if (activeTier !== 'All') {
      result = result.filter((pc) => pc.performanceTier === activeTier)
    }
    if (gpuFilter !== 'All') {
      result = result.filter((pc) => pc.gpu.toLowerCase().includes(gpuFilter.toLowerCase()))
    }
    if (cpuFilter !== 'All') {
      result = result.filter((pc) => pc.cpu.toLowerCase().includes(cpuFilter.toLowerCase()))
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [activeTier, gpuFilter, cpuFilter, sortBy])

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">GAMING PCS & PREBUILTS</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-(--text-primary) font-bold text-2xl md:text-3xl tracking-tight mb-1">
              Custom Prebuilt Gaming PCs
            </h1>
            <p className="text-(--text-secondary) text-xs md:text-sm max-w-xl">
              Fully assembled, cable-managed, and 72-hour stress-tested gaming computers backed by our 3-Year Warranty.
            </p>
          </div>

          <Link
            to="/builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg shadow-xs self-start md:self-auto"
          >
            <Icon name="memory" size={16} />
            <span>Custom PC Builder</span>
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-4 mb-8">
          {/* Performance Tier Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTier === tier.id
                    ? 'bg-(--accent-blue) text-white'
                    : 'bg-(--bg-surface-secondary) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-theme)'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-(--border-theme)">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-semibold">GPU:</span>
              <div className="flex flex-wrap gap-1.5">
                {gpuOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGpuFilter(g)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[10px] border transition-colors cursor-pointer ${
                      gpuFilter === g
                        ? 'bg-(--accent-blue)/10 border-(--accent-blue) text-(--accent-blue) font-bold'
                        : 'bg-(--bg-surface-secondary) border-(--border-theme) text-(--text-secondary) hover:text-(--text-primary)'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-semibold">CPU:</span>
              <div className="flex flex-wrap gap-1.5">
                {cpuOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCpuFilter(c)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[10px] border transition-colors cursor-pointer ${
                      cpuFilter === c
                        ? 'bg-(--accent-blue)/10 border-(--accent-blue) text-(--accent-blue) font-bold'
                        : 'bg-(--bg-surface-secondary) border-(--border-theme) text-(--text-secondary) hover:text-(--text-primary)'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gaming PC Product Cards */}
        {filteredPCs.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No systems match these filters"
            message="Try broadening your GPU, CPU, or performance-tier selection."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => { setActiveTier('All'); setGpuFilter('All'); setCpuFilter('All') }}
              >
                Reset Filters
              </Button>
            }
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredPCs.map((pc) => {
            const wishlisted = isInWishlist(pc.id)

            return (
              <article
                key={pc.id}
                className="bg-(--bg-surface) border border-(--border-theme) rounded-xl hover:border-(--text-secondary) transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-sm"
              >
                {/* Header */}
                <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) flex items-center justify-between">
                  <span className="font-mono text-[10px] text-(--accent-blue) font-bold tracking-wider bg-(--accent-blue)/10 px-2 py-0.5 rounded-md border border-(--accent-blue)/20">
                    {pc.performanceTier}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(pc.id)}
                    className={`p-1 transition-colors cursor-pointer ${wishlisted ? 'text-rose-500' : 'text-(--text-secondary) hover:text-rose-500'}`}
                    aria-label="Wishlist"
                  >
                    <Icon name="favorite" size={18} filled={wishlisted} />
                  </button>
                </div>

                {/* Image */}
                <Link to={`/gaming-pc/${pc.id}`} className="relative bg-(--bg-surface-secondary) overflow-hidden block" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={pc.image}
                    alt={pc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </Link>

                {/* Body Specs */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/gaming-pc/${pc.id}`}>
                      <h2 className="text-(--text-primary) font-bold text-base leading-snug group-hover:text-(--accent-blue) transition-colors mb-2">
                        {pc.name}
                      </h2>
                    </Link>

                    <StarRating rating={pc.rating} count={pc.reviewCount} />

                    {/* Specs Table */}
                    <div className="mt-4 bg-(--bg-surface-secondary) rounded-lg p-3 border border-(--border-theme) space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-(--text-secondary) flex items-center gap-1.5"><Icon name="memory" size={14} className="text-(--accent-blue)" /> CPU</span>
                        <span className="text-(--text-primary) font-semibold truncate max-w-[160px] text-right">{pc.cpu}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-(--text-secondary) flex items-center gap-1.5"><Icon name="videogame_asset" size={14} className="text-(--accent-orange)" /> GPU</span>
                        <span className="text-(--text-primary) font-semibold truncate max-w-[160px] text-right">{pc.gpu}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-(--text-secondary) flex items-center gap-1.5"><Icon name="storage" size={14} className="text-(--color-stock-green)" /> RAM</span>
                        <span className="text-(--text-primary) font-semibold">{pc.ram}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-(--text-secondary) flex items-center gap-1.5"><Icon name="hard_drive" size={14} className="text-amber-400" /> SSD</span>
                        <span className="text-(--text-primary) font-semibold truncate max-w-[160px] text-right">{pc.storage}</span>
                      </div>
                    </div>

                    {/* FPS Benchmarks */}
                    <div className="mt-4 p-3 bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme)">
                      <div className="text-[11px] font-mono text-(--text-secondary) mb-2 font-semibold uppercase">Average Gaming Benchmarks</div>
                      <div className="space-y-1.5">
                        {pc.fpsBenchmarks.map((b) => (
                          <div key={b.game} className="flex items-center justify-between text-xs">
                            <span className="text-(--text-secondary) text-[11px]">{b.game}</span>
                            <span className="font-mono text-(--accent-blue) font-bold">{b.fps4K} FPS (4K)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Actions */}
                  <div className="mt-6 pt-4 border-t border-(--border-theme) flex items-center justify-between gap-3">
                    <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="md" />
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/gaming-pc/${pc.id}`}
                        className="px-3 py-2 border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) text-xs font-sans rounded-lg font-semibold transition-colors bg-(--bg-surface-secondary)"
                      >
                        Specs
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addToCart(pc, 1)}
                      >
                        <Icon name="shopping_cart" size={14} /> Order
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

      </div>
    </main>
  )
}
