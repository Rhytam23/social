import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs, Price, StarRating, StockBadge, Button } from '../components/ui'
import { gamingPCsData } from '../data'
import type { GamingPC } from '../types'
import { useShop } from '../context/ShopContext'

const SPEC_ICONS: Record<string, string> = {
  cpu: 'memory', gpu: 'videogame_asset', ram: 'storage', storage: 'hard_drive',
  powerSupply: 'power', coolingType: 'mode_fan', caseName: 'inventory_2',
}

export function GamingPCDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useShop()
  const pc = gamingPCsData.find((p) => p.id === id || p.slug === id) as GamingPC | undefined

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!pc) {
    return (
      <main className="flex-1 container-max px-4 py-16 text-center">
        <Icon name="desktop_windows" size={48} className="text-(--text-secondary) mb-4 mx-auto" />
        <h1 className="text-(--text-primary) font-bold text-2xl mb-2">System Not Found</h1>
        <Link to="/gaming-pcs">
          <Button variant="primary" size="md" className="mt-4">
            Browse Gaming PCs
          </Button>
        </Link>
      </main>
    )
  }

  const gallery = pc.gallery || [pc.image]
  const wishlisted = isInWishlist(pc.id)
  const coreSpecs: { label: string; key: keyof GamingPC }[] = [
    { label: 'Processor (CPU)', key: 'cpu' },
    { label: 'Graphics (GPU)', key: 'gpu' },
    { label: 'Memory (RAM)', key: 'ram' },
    { label: 'Storage', key: 'storage' },
    { label: 'Power Supply', key: 'powerSupply' },
    { label: 'Cooling', key: 'coolingType' },
    { label: 'Chassis', key: 'caseName' },
  ]
  const otherPCs = gamingPCsData.filter((p) => p.id !== pc.id)

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Gaming PCs', href: '/gaming-pcs' }, { label: pc.name.split(' - ')[0] }]}
          className="mb-5"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div>
            <div className="relative bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img src={gallery[activeImage]} alt={pc.name} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 font-mono text-[10px] text-(--accent-blue) font-bold bg-(--accent-blue)/10 px-2.5 py-1 rounded-md border border-(--accent-blue)/20">
                {pc.performanceTier}
              </span>
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border transition-colors cursor-pointer ${i === activeImage ? 'border-(--accent-blue)' : 'border-(--border-theme) hover:border-(--text-secondary)'}`}
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
            <span className="font-mono text-[11px] text-(--accent-blue) uppercase font-bold tracking-wider">{pc.brand}</span>
            <h1 className="text-(--text-primary) font-bold text-2xl lg:text-3xl tracking-tight mt-1 mb-3">{pc.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <StarRating rating={pc.rating} count={pc.reviewCount} size="md" />
              <StockBadge status={pc.stockStatus} />
              <span className="font-mono text-[11px] text-(--text-secondary)">SKU: {pc.sku || pc.id.toUpperCase()}</span>
            </div>

            <p className="text-(--text-secondary) text-sm leading-relaxed mb-5">{pc.description}</p>

            {/* Core spec highlights */}
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-4 space-y-2.5 mb-5">
              {coreSpecs.map((s) => (
                <div key={s.key} className="flex items-center gap-3 text-xs">
                  <Icon name={SPEC_ICONS[s.key] || 'chevron_right'} size={16} className="text-(--accent-blue) shrink-0" />
                  <span className="text-(--text-secondary) font-mono uppercase w-28 shrink-0">{s.label}</span>
                  <span className="text-(--text-primary) font-medium">{String(pc[s.key])}</span>
                </div>
              ))}
            </div>

            {/* Price + actions */}
            <div className="bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl p-5 mt-auto">
              <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="lg" />
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-(--color-stock-green) font-semibold">
                <Icon name="local_shipping" size={14} /> Free express dispatch · Est. delivery 3–5 business days
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center border border-(--border-theme) rounded-lg bg-(--bg-surface-secondary) px-2 py-1.5">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer" aria-label="Decrease quantity">
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-(--text-primary)">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer" aria-label="Increase quantity">
                    <Icon name="add" size={16} />
                  </button>
                </div>
                <button
                  onClick={() => toggleWishlist(pc.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${wishlisted ? 'border-rose-500/40 text-rose-500 bg-rose-500/10' : 'border-(--border-theme) text-(--text-secondary) hover:text-rose-500'}`}
                  aria-label="Toggle wishlist"
                >
                  <Icon name="favorite" size={20} filled={wishlisted} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => addToCart(pc, quantity)}
                >
                  <Icon name="add_shopping_cart" size={16} /> Add to Cart
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => { addToCart(pc, quantity); navigate('/checkout') }}
                >
                  Buy Now <Icon name="bolt" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance benchmarks */}
        <section className="mb-12">
          <h2 className="text-(--text-primary) font-bold text-lg mb-4 flex items-center gap-2">
            <Icon name="speed" size={20} className="text-(--accent-blue)" /> Gaming Performance Benchmarks
          </h2>
          <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-(--bg-surface-secondary) border-b border-(--border-theme) font-mono text-[10px] text-(--text-secondary) uppercase font-bold">
              <span className="col-span-6">Title</span>
              <span className="col-span-3 text-center">1440p Ultra</span>
              <span className="col-span-3 text-center">4K Ultra</span>
            </div>
            {pc.fpsBenchmarks.map((b) => {
              const maxFps = Math.max(...pc.fpsBenchmarks.map((x) => x.fps1440p))
              return (
                <div key={b.game} className="grid grid-cols-12 gap-2 items-center px-5 py-3 border-b border-(--border-theme) last:border-0 text-xs">
                  <span className="col-span-6 text-(--text-primary)">{b.game}</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-(--bg-surface-secondary) rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-(--color-stock-green)" style={{ width: `${(b.fps1440p / maxFps) * 100}%` }} />
                    </div>
                    <span className="font-mono text-(--color-stock-green) font-bold w-14 text-right">{b.fps1440p} fps</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-(--bg-surface-secondary) rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-(--accent-blue)" style={{ width: `${(b.fps4K / maxFps) * 100}%` }} />
                    </div>
                    <span className="font-mono text-(--accent-blue) font-bold w-14 text-right">{b.fps4K} fps</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Full specs + warranty/upgrade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2 bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
            <h2 className="text-(--text-primary) font-bold text-base mb-4 border-b border-(--border-theme) pb-3">Full Technical Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {pc.specifications.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 text-xs py-1 border-b border-(--border-theme)/60">
                  <span className="text-(--text-secondary) font-mono">{s.label}</span>
                  <span className="text-(--text-primary) text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
              <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
                <Icon name="upgrade" size={16} className="text-(--accent-blue)" /> Upgrade Options
              </h3>
              <ul className="space-y-2 text-xs text-(--text-secondary)">
                <li className="flex justify-between"><span>+ 32GB RAM (96GB total)</span><span className="font-mono text-(--text-primary)">+$189</span></li>
                <li className="flex justify-between"><span>+ 4TB Gen5 NVMe SSD</span><span className="font-mono text-(--text-primary)">+$249</span></li>
                <li className="flex justify-between"><span>Custom cable & RGB kit</span><span className="font-mono text-(--text-primary)">+$79</span></li>
              </ul>
            </div>
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
              <h3 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
                <Icon name="verified" size={16} className="text-(--color-stock-green)" /> Warranty & Support
              </h3>
              <ul className="space-y-2 text-xs text-(--text-secondary)">
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-(--color-stock-green)" /> 3-year parts & labor warranty</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-(--color-stock-green)" /> Lifetime technical support</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-(--color-stock-green)" /> 72-hour burn-in tested</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related systems */}
        {otherPCs.length > 0 && (
          <section>
            <h2 className="text-(--text-primary) font-bold text-lg mb-4">Compare Other Systems</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPCs.map((o) => (
                <Link key={o.id} to={`/gaming-pc/${o.id}`} className="group flex gap-3 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-xl p-3 transition-colors">
                  <img src={o.image} alt={o.name} className="w-24 h-20 object-cover rounded-lg bg-(--bg-surface-secondary) shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-(--text-primary) text-xs font-bold leading-snug line-clamp-2 group-hover:text-(--accent-blue)">{o.name}</h3>
                    <span className="font-mono text-[10px] text-(--text-secondary) block mt-1">{o.performanceTier}</span>
                    <span className="font-mono text-sm text-(--accent-blue) font-bold block mt-1">${o.price.toFixed(2)}</span>
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
