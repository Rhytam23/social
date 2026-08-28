import { useState, useCallback, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs, Price, StarRating, StockBadge, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { PageSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useShop } from '../context/ShopContext'
import { productService } from '../services/productService'

const SPEC_ICONS: Record<string, string> = {
  processor: 'memory',
  cpu: 'memory',
  'graphics card': 'videogame_asset',
  gpu: 'videogame_asset',
  memory: 'storage',
  ram: 'storage',
  storage: 'hard_drive',
  'primary storage': 'hard_drive',
  'power supply': 'power',
  cooling: 'mode_fan',
  chassis: 'inventory_2',
  motherboard: 'developer_board',
}

export function GamingPCDetailsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { showToast } = useShop()

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  const pcFn = useCallback(() => productService.getBySlug(slug!), [slug])
  const { data: pc, loading, error, reload } = useApi(pcFn, [slug])

  const othersFn = useCallback(
    () => productService.list({ category: 'gaming-pcs', limit: 6 }),
    []
  )
  const { data: others } = useApi(othersFn, [])

  useEffect(() => {
    setActiveImage(0)
    setQuantity(1)
  }, [pc?.id])

  if (loading) return <PageSkeleton />

  if (error || !pc) {
    return (
      <main className="flex-1 container-max px-4 py-16">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            icon="desktop_windows"
            title="System not found"
            message="This prebuilt system may have been discontinued."
            action={
              <Link to="/gaming-pcs">
                <Button variant="primary" size="md">BROWSE GAMING PCS</Button>
              </Link>
            }
          />
        )}
      </main>
    )
  }

  const gallery = pc.images?.length ? pc.images.map((i) => i.url) : pc.primaryImage ? [pc.primaryImage] : []
  const wishlisted = isInWishlist(pc.id)
  const outOfStock = pc.stockStatus === 'out-of-stock'
  const otherPCs = (others?.data ?? []).filter((o) => o.id !== pc.id)
  const maxFps = Math.max(1, ...(pc.benchmarks ?? []).map((x) => x.fps1440p ?? 0))

  const handleAdd = async (thenCheckout = false) => {
    setAdding(true)
    try {
      await addItem(pc.id, quantity)
      showToast('Added to cart', 'cart')
      if (thenCheckout) navigate('/checkout')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Gaming PCs', href: '/gaming-pcs' },
            { label: pc.name.split(' - ')[0] },
          ]}
          className="mb-5"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div>
            <div
              className="relative bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {gallery[activeImage] ? (
                <img src={gallery[activeImage]} alt={pc.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="desktop_windows" size={64} className="text-(--accent-blue)/40" />
                </div>
              )}
              {pc.performanceTier && (
                <span className="absolute top-3 left-3 font-mono text-[10px] text-(--accent-blue) font-bold bg-(--accent-blue)/10 px-2.5 py-1 rounded-md border border-(--accent-blue)/20">
                  {pc.performanceTier}
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border transition-colors cursor-pointer ${
                      i === activeImage ? 'border-(--accent-blue)' : 'border-(--border-theme) hover:border-(--text-secondary)'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <div className="flex flex-col">
            <span className="font-mono text-[11px] text-(--accent-blue) uppercase font-bold tracking-wider">
              {pc.brandName}
            </span>
            <h1 className="text-(--text-primary) font-bold text-2xl lg:text-3xl tracking-tight mt-1 mb-3">{pc.name}</h1>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {pc.reviewCount > 0 ? (
                <StarRating rating={pc.rating} count={pc.reviewCount} size="md" />
              ) : (
                <span className="font-mono text-[11px] text-(--text-muted)">NO REVIEWS YET</span>
              )}
              <StockBadge status={pc.stockStatus} />
              <span className="font-mono text-[11px] text-(--text-secondary)">SKU: {pc.sku}</span>
            </div>

            {pc.description && (
              <p className="text-(--text-secondary) text-sm leading-relaxed mb-5">{pc.description}</p>
            )}

            {/* Core spec highlights */}
            {pc.specs.length > 0 && (
              <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-4 space-y-2.5 mb-5">
                {pc.specs.slice(0, 7).map((s) => (
                  <div key={s.label} className="flex items-center gap-3 text-xs">
                    <Icon
                      name={SPEC_ICONS[s.label.toLowerCase()] || 'chevron_right'}
                      size={16}
                      className="text-(--accent-blue) shrink-0"
                    />
                    <span className="text-(--text-secondary) font-mono uppercase w-28 shrink-0">{s.label}</span>
                    <span className="text-(--text-primary) font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Price + actions */}
            <div className="bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl p-5 mt-auto">
              <Price
                price={pc.price}
                previousPrice={pc.previousPrice ?? undefined}
                discount={pc.discountPercent || undefined}
                size="lg"
              />
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-(--text-secondary)">
                <Icon name="inventory_2" size={14} className="text-(--accent-blue)" />
                {outOfStock ? 'Currently unavailable' : `${pc.stockAvailable} available`}
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center border border-(--border-theme) rounded-lg bg-(--bg-surface-secondary) px-2 py-1.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-(--text-primary)">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(pc.stockAvailable || 1, q + 1))}
                    disabled={quantity >= pc.stockAvailable}
                    className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Icon name="add" size={16} />
                  </button>
                </div>
                <button
                  onClick={() => void toggleWishlist(pc.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    wishlisted
                      ? 'border-rose-500/40 text-rose-500 bg-rose-500/10'
                      : 'border-(--border-theme) text-(--text-secondary) hover:text-rose-500'
                  }`}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Icon name="favorite" size={20} filled={wishlisted} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button variant="secondary" size="md" disabled={outOfStock || adding} onClick={() => void handleAdd()}>
                  <Icon name="add_shopping_cart" size={16} /> Add to Cart
                </Button>
                <Button variant="primary" size="md" disabled={outOfStock || adding} onClick={() => void handleAdd(true)}>
                  Buy Now <Icon name="bolt" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance benchmarks — supplied figures */}
        {!!pc.benchmarks?.length && (
          <section className="mb-12">
            <h2 className="text-(--text-primary) font-bold text-lg mb-1 flex items-center gap-2">
              <Icon name="speed" size={20} className="text-(--accent-blue)" /> Gaming Performance Benchmarks
            </h2>
            <p className="text-(--text-secondary) text-xs mb-4">
              Manufacturer-supplied figures. Actual performance varies by title, settings, and drivers.
            </p>
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-(--bg-surface-secondary) border-b border-(--border-theme) font-mono text-[10px] text-(--text-secondary) uppercase font-bold">
                <span className="col-span-6">Title</span>
                <span className="col-span-3 text-center">1440p Ultra</span>
                <span className="col-span-3 text-center">4K Ultra</span>
              </div>
              {pc.benchmarks.map((b) => (
                <div
                  key={b.game}
                  className="grid grid-cols-12 gap-2 items-center px-5 py-3 border-b border-(--border-theme) last:border-0 text-xs"
                >
                  <span className="col-span-6 text-(--text-primary)">{b.game}</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-(--bg-surface-secondary) rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-(--color-stock-green)"
                        style={{ width: `${((b.fps1440p ?? 0) / maxFps) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-(--color-stock-green) font-bold w-14 text-right">
                      {b.fps1440p ?? '—'} fps
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-(--bg-surface-secondary) rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-(--accent-blue)"
                        style={{ width: `${((b.fps4K ?? 0) / maxFps) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-(--accent-blue) font-bold w-14 text-right">
                      {b.fps4K ?? '—'} fps
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full specs */}
        {pc.specs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
              <h2 className="text-(--text-primary) font-bold text-base mb-4 border-b border-(--border-theme) pb-3">
                Full Technical Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {pc.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 text-xs py-1 border-b border-(--border-theme)/60">
                    <span className="text-(--text-secondary) font-mono">{s.label}</span>
                    <span className="text-(--text-primary) text-right">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 h-fit">
              <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
                <Icon name="verified" size={16} className="text-(--color-stock-green)" /> Warranty &amp; Support
              </h3>
              <p className="text-(--text-secondary) text-xs leading-relaxed mb-3">
                Every system ships with the manufacturer warranty for its components.
              </p>
              <div className="flex flex-col gap-1.5">
                <Link to="/warranty" className="text-xs text-(--accent-blue) hover:underline flex items-center gap-1">
                  <Icon name="chevron_right" size={14} /> Warranty terms
                </Link>
                <Link to="/return-policy" className="text-xs text-(--accent-blue) hover:underline flex items-center gap-1">
                  <Icon name="chevron_right" size={14} /> Returns &amp; RMA
                </Link>
                <Link to="/shipping-policy" className="text-xs text-(--accent-blue) hover:underline flex items-center gap-1">
                  <Icon name="chevron_right" size={14} /> Shipping information
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related systems */}
        {otherPCs.length > 0 && (
          <section>
            <h2 className="text-(--text-primary) font-bold text-lg mb-4">Compare Other Systems</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPCs.map((o) => (
                <Link
                  key={o.id}
                  to={`/gaming-pc/${o.slug}`}
                  className="group flex gap-3 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-xl p-3 transition-colors"
                >
                  {o.primaryImage ? (
                    <img
                      src={o.primaryImage}
                      alt={o.name}
                      className="w-24 h-20 object-cover rounded-lg bg-(--bg-surface-secondary) shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-20 rounded-lg bg-(--bg-surface-secondary) shrink-0 flex items-center justify-center">
                      <Icon name="desktop_windows" size={24} className="text-(--accent-blue)/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-(--text-primary) text-xs font-bold leading-snug line-clamp-2 group-hover:text-(--accent-blue)">
                      {o.name}
                    </h3>
                    {o.performanceTier && (
                      <span className="font-mono text-[10px] text-(--text-secondary) block mt-1">{o.performanceTier}</span>
                    )}
                    <span className="font-mono text-sm text-(--accent-blue) font-bold block mt-1">
                      ${o.price.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
