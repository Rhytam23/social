import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Price, StarRating, EmptyState } from '../components/ui'
import { gamingPCsData } from '../data'
import type { PerformanceTier } from '../types'
import { useShop } from '../context/ShopContext'

function gpuFamily(gpu: string): string {
  if (/5090/.test(gpu)) return 'RTX 5090'
  if (/4090/.test(gpu)) return 'RTX 4090'
  if (/4080/.test(gpu)) return 'RTX 4080'
  if (/RX\s?7900/.test(gpu)) return 'RX 7900'
  return 'Other'
}


const TIERS: { label: string; value: PerformanceTier | 'All'; desc: string }[] = [
  { label: 'ALL RIGS', value: 'All', desc: 'Complete lineup of pre-built and custom systems' },
  { label: 'TIER 4 (EXTREME)', value: 'Tier 4 - Enthusiast Extreme', desc: 'RTX 5090 / i9-14900KS 4K Path Tracing Ultra' },
  { label: 'TIER 3 (4K ULTRA)', value: 'Tier 3 - 4K Ultra', desc: 'Ryzen 7 7800X3D + RTX 4090 Gaming Supremacy' },
  { label: 'TIER 2 (1440P PRO)', value: 'Tier 2 - 1440p Pro', desc: 'High Refresh Rate 1440p Competitive Systems' },
]

export function GamingPCsPage() {
  const { addToCart, toggleWishlist, isInWishlist } = useShop()
  const [activeTier, setActiveTier] = useState<PerformanceTier | 'All'>('All')
  const [gpuFilter, setGpuFilter] = useState<string>('All')
  const [cpuFilter, setCpuFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('featured')

  const gpuOptions = useMemo(() => ['All', ...Array.from(new Set(gamingPCsData.map((pc) => gpuFamily(pc.gpu))))], [])
  const cpuOptions = useMemo(() => ['All', 'Intel', 'AMD'], [])

  const filteredPCs = useMemo(() => {
    let list = gamingPCsData.filter((pc) => {
      if (activeTier !== 'All' && pc.performanceTier !== activeTier) return false
      if (gpuFilter !== 'All' && gpuFamily(pc.gpu) !== gpuFilter) return false
      if (cpuFilter === 'Intel' && !/Intel/i.test(pc.cpu)) return false
      if (cpuFilter === 'AMD' && !/AMD|Ryzen/i.test(pc.cpu)) return false
      return true
    })
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [activeTier, gpuFilter, cpuFilter, sortBy])

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">GAMING PCS & PREBUILT SYSTEMS</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative rounded overflow-hidden border border-[#414755] bg-[#16171d] p-6 md:p-10 mb-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs text-[#007aff] bg-[#007aff15] px-2.5 py-1 rounded-[2px] border border-[#007aff30] font-bold inline-block mb-3">
              PREBUILT ARCHITECTURES
            </span>
            <h1 className="text-white font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
              Apex Gaming PCs & High-Performance Rigs
            </h1>
            <p className="text-[#c1c6d7] text-sm md:text-base leading-relaxed mb-6">
              Zero bloatware. 100% off-the-shelf retail components from ASUS ROG, Seasonic, Corsair, and NZXT. Benchmarked with 72-hour thermal stress tests.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/builder"
                className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <Icon name="build" size={16} /> BUILD A CUSTOM PC
              </Link>
              <a
                href="#lineup"
                className="px-5 py-2.5 bg-transparent border border-[#414755] hover:border-white text-white font-mono text-xs font-semibold rounded transition-colors"
              >
                BROWSE READY-TO-SHIP RIGS
              </a>
            </div>
          </div>
        </div>

        {/* Performance Tier Selector Tabs */}
        <div id="lineup" className="mb-8">
          <div className="flex flex-wrap gap-2">
            {TIERS.map((tier) => (
              <button
                key={tier.label}
                type="button"
                onClick={() => setActiveTier(tier.value)}
                className={`px-4 py-2 rounded font-mono text-xs tracking-wider font-bold transition-all ${
                  activeTier === tier.value
                    ? 'bg-[#007aff] text-white shadow-md'
                    : 'bg-[#1a1b1f] border border-[#414755] text-[#8b90a0] hover:text-white hover:border-[#8b90a0]'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#292a2e]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase">GPU:</span>
              <div className="flex flex-wrap gap-1.5">
                {gpuOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGpuFilter(g)}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] border transition-colors ${gpuFilter === g ? 'bg-[#007aff20] border-[#007aff] text-[#adc6ff]' : 'bg-[#1a1b1f] border-[#292a2e] text-[#8b90a0] hover:text-white'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase">CPU:</span>
              <div className="flex flex-wrap gap-1.5">
                {cpuOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCpuFilter(c)}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] border transition-colors ${cpuFilter === c ? 'bg-[#007aff20] border-[#007aff] text-[#adc6ff]' : 'bg-[#1a1b1f] border-[#292a2e] text-[#8b90a0] hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-[11px] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007aff]"
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
              <button
                onClick={() => { setActiveTier('All'); setGpuFilter('All'); setCpuFilter('All') }}
                className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs rounded font-bold hover:bg-[#0066d6]"
              >
                RESET FILTERS
              </button>
            }
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredPCs.map((pc) => {
            const wishlisted = isInWishlist(pc.id)

            return (
              <article
                key={pc.id}
                className="bg-[#1a1b1f] border border-[#414755] rounded hover:border-[#007aff] transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl"
              >
                {/* Header */}
                <div className="p-4 bg-[#1e1f23] border-b border-[#292a2e] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#adc6ff] font-bold tracking-wider bg-[#007aff20] px-2 py-0.5 rounded border border-[#007aff40]">
                    {pc.performanceTier}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(pc.id)}
                    className={`p-1 transition-colors ${wishlisted ? 'text-[#ff453a]' : 'text-[#8b90a0] hover:text-[#ff453a]'}`}
                    aria-label="Wishlist"
                  >
                    <Icon name="favorite" size={18} filled={wishlisted} />
                  </button>
                </div>

                {/* Image */}
                <Link to={`/gaming-pc/${pc.id}`} className="relative bg-[#0d0e12] overflow-hidden block" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={pc.image}
                    alt={pc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1f] via-transparent to-transparent" />
                </Link>

                {/* Body Specs */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/gaming-pc/${pc.id}`}>
                      <h2 className="text-white font-bold text-base leading-snug group-hover:text-[#adc6ff] transition-colors mb-2">
                        {pc.name}
                      </h2>
                    </Link>

                    <StarRating rating={pc.rating} count={pc.reviewCount} />

                    {/* Specs Table */}
                    <div className="mt-4 bg-[#121317] rounded p-3 border border-[#292a2e] space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b90a0] flex items-center gap-1.5"><Icon name="memory" size={14} className="text-[#007aff]" /> CPU</span>
                        <span className="text-white font-semibold truncate max-w-[160px] text-right">{pc.cpu}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b90a0] flex items-center gap-1.5"><Icon name="videogame_asset" size={14} className="text-[#ff5c00]" /> GPU</span>
                        <span className="text-white font-semibold truncate max-w-[160px] text-right">{pc.gpu}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b90a0] flex items-center gap-1.5"><Icon name="storage" size={14} className="text-[#30d158]" /> RAM</span>
                        <span className="text-white font-semibold">{pc.ram}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b90a0] flex items-center gap-1.5"><Icon name="hard_drive" size={14} className="text-[#ffd60a]" /> SSD</span>
                        <span className="text-white font-semibold truncate max-w-[160px] text-right">{pc.storage}</span>
                      </div>
                    </div>

                    {/* FPS Benchmarks */}
                    <div className="mt-4 p-3 bg-[#121317] rounded border border-[#292a2e]">
                      <div className="text-[11px] font-mono text-[#8b90a0] mb-2 font-semibold">AVERAGE GAMING BENCHMARKS</div>
                      <div className="space-y-1.5">
                        {pc.fpsBenchmarks.map((b) => (
                          <div key={b.game} className="flex items-center justify-between text-xs">
                            <span className="text-[#c1c6d7] text-[11px]">{b.game}</span>
                            <span className="font-mono text-[#007aff] font-bold">{b.fps4K} FPS (4K)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Actions */}
                  <div className="mt-6 pt-4 border-t border-[#292a2e] flex items-center justify-between gap-3">
                    <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="md" />
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/gaming-pc/${pc.id}`}
                        className="px-3 py-2 border border-[#414755] hover:border-white text-white text-xs font-mono rounded transition-colors"
                      >
                        SPECS
                      </Link>
                      <button
                        type="button"
                        onClick={() => addToCart(pc, 1)}
                        className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        <Icon name="shopping_cart" size={14} /> ORDER
                      </button>
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
