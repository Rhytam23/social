import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, StarRating, Price, EmptyState, Button } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useShop } from '../context/ShopContext'
import { productService, type ProductDetail } from '../services/productService'

// Prebuilt systems are ordinary products in the `gaming-pcs` category. The
// listing needs their specs and benchmarks, so each summary is expanded to its
// detail record (a handful of systems, fetched in parallel).
async function loadGamingPCs(): Promise<ProductDetail[]> {
  const list = await productService.list({ category: 'gaming-pcs', limit: 24 })
  return Promise.all(list.data.map((p) => productService.getBySlug(p.slug)))
}

function specValue(pc: ProductDetail, labels: string[]): string | null {
  for (const label of labels) {
    const match = pc.specs.find((s) => s.label.toLowerCase() === label.toLowerCase())
    if (match) return match.value
  }
  return null
}

export function GamingPCsPage() {
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { showToast } = useShop()
  const [activeTier, setActiveTier] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('featured')

  const { data, loading, error, reload } = useApi(useCallback(loadGamingPCs, []), [])
  const pcs = useMemo(() => data ?? [], [data])

  // Tier options come from the data itself — no invented tiers.
  const tiers = useMemo(() => {
    const set = new Set<string>()
    pcs.forEach((pc) => {
      if (pc.performanceTier) set.add(pc.performanceTier)
    })
    return ['All', ...Array.from(set)]
  }, [pcs])

  const filteredPCs = useMemo(() => {
    let result = [...pcs]
    if (activeTier !== 'All') {
      result = result.filter((pc) => pc.performanceTier === activeTier)
    }
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price)
    return result
  }, [pcs, activeTier, sortBy])

  const handleAdd = async (pc: ProductDetail) => {
    try {
      await addItem(pc.id, 1)
      showToast('Added to cart', 'cart')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    }
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">GAMING PCS &amp; PREBUILTS</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-(--text-primary) font-bold text-2xl md:text-3xl tracking-tight mb-1">
              Custom Prebuilt Gaming PCs
            </h1>
            <p className="text-(--text-secondary) text-xs md:text-sm max-w-xl">
              Fully assembled and cable-managed gaming computers, ready to ship.
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

        {/* Filters */}
        {tiers.length > 1 && (
          <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {tiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTier === tier
                      ? 'bg-(--accent-blue) text-white'
                      : 'bg-(--bg-surface-secondary) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-theme)'
                  }`}
                >
                  {tier === 'All' ? 'All Prebuilts' : tier}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-(--border-theme)">
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort systems"
                  className="bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filteredPCs.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No systems available"
            message={
              activeTier === 'All'
                ? 'No prebuilt systems are published yet.'
                : 'No systems match this performance tier.'
            }
            action={
              activeTier !== 'All' ? (
                <Button variant="primary" size="md" onClick={() => setActiveTier('All')}>
                  RESET FILTERS
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredPCs.map((pc) => {
              const wishlisted = isInWishlist(pc.id)
              const cpu = specValue(pc, ['Processor', 'CPU'])
              const gpu = specValue(pc, ['Graphics Card', 'GPU'])
              const ram = specValue(pc, ['Memory', 'RAM'])
              const storage = specValue(pc, ['Primary Storage', 'Storage'])
              const rows = [
                { icon: 'memory', color: 'text-(--accent-blue)', label: 'CPU', value: cpu },
                { icon: 'videogame_asset', color: 'text-(--accent-orange)', label: 'GPU', value: gpu },
                { icon: 'storage', color: 'text-(--color-stock-green)', label: 'RAM', value: ram },
                { icon: 'hard_drive', color: 'text-amber-400', label: 'SSD', value: storage },
              ].filter((r) => r.value)

              return (
                <article
                  key={pc.id}
                  className="bg-(--bg-surface) border border-(--border-theme) rounded-xl hover:border-(--text-secondary) transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-sm"
                >
                  <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) flex items-center justify-between">
                    <span className="font-mono text-[10px] text-(--accent-blue) font-bold tracking-wider bg-(--accent-blue)/10 px-2 py-0.5 rounded-md border border-(--accent-blue)/20">
                      {pc.performanceTier ?? 'PREBUILT SYSTEM'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleWishlist(pc.id)}
                      className={`p-1 transition-colors cursor-pointer ${
                        wishlisted ? 'text-rose-500' : 'text-(--text-secondary) hover:text-rose-500'
                      }`}
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Icon name="favorite" size={18} filled={wishlisted} />
                    </button>
                  </div>

                  <Link
                    to={`/gaming-pc/${pc.slug}`}
                    className="relative bg-(--bg-surface-secondary) overflow-hidden block"
                    style={{ aspectRatio: '16/10' }}
                  >
                    {pc.primaryImage ? (
                      <img
                        src={pc.primaryImage}
                        alt={pc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="desktop_windows" size={48} className="text-(--accent-blue)/40" />
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link to={`/gaming-pc/${pc.slug}`}>
                        <h2 className="text-(--text-primary) font-bold text-base leading-snug group-hover:text-(--accent-blue) transition-colors mb-2">
                          {pc.name}
                        </h2>
                      </Link>

                      {pc.reviewCount > 0 ? (
                        <StarRating rating={pc.rating} count={pc.reviewCount} />
                      ) : (
                        <span className="font-mono text-[10px] text-(--text-muted)">NO REVIEWS YET</span>
                      )}

                      {rows.length > 0 && (
                        <div className="mt-4 bg-(--bg-surface-secondary) rounded-lg p-3 border border-(--border-theme) space-y-2 text-xs font-mono">
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between gap-2">
                              <span className="text-(--text-secondary) flex items-center gap-1.5 shrink-0">
                                <Icon name={r.icon} size={14} className={r.color} /> {r.label}
                              </span>
                              <span className="text-(--text-primary) font-semibold truncate max-w-[160px] text-right">
                                {r.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Benchmarks — supplied figures, pending verification */}
                      {!!pc.benchmarks?.length && (
                        <div className="mt-4 p-3 bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme)">
                          <div className="text-[11px] font-mono text-(--text-secondary) mb-2 font-semibold uppercase">
                            Manufacturer-supplied benchmarks
                          </div>
                          <div className="space-y-1.5">
                            {pc.benchmarks.map((b) => (
                              <div key={b.game} className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-(--text-secondary) text-[11px] truncate">{b.game}</span>
                                {b.fps4K !== null && (
                                  <span className="font-mono text-(--accent-blue) font-bold shrink-0">
                                    {b.fps4K} FPS (4K)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-(--border-theme) flex items-center justify-between gap-3 flex-wrap">
                      <Price
                        price={pc.price}
                        previousPrice={pc.previousPrice ?? undefined}
                        discount={pc.discountPercent || undefined}
                        size="md"
                      />
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/gaming-pc/${pc.slug}`}
                          className="px-3 py-2 border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) text-xs font-sans rounded-lg font-semibold transition-colors bg-(--bg-surface-secondary)"
                        >
                          Specs
                        </Link>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={pc.stockStatus === 'out-of-stock'}
                          onClick={() => void handleAdd(pc)}
                        >
                          <Icon name="shopping_cart" size={14} />
                          {pc.stockStatus === 'out-of-stock' ? 'Sold Out' : 'Order'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
