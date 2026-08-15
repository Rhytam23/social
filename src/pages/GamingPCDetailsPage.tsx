import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs, Price, StarRating, StockBadge } from '../components/ui'
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
        <Icon name="desktop_windows" size={48} className="text-[#8b90a0] mb-4 mx-auto" />
        <h1 className="text-white font-bold text-2xl mb-2">System Not Found</h1>
        <Link to="/gaming-pcs" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block mt-4">
          BROWSE GAMING PCS
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
            <div className="relative bg-[#0d0e12] border border-[#414755] rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img src={gallery[activeImage]} alt={pc.name} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 font-mono text-[10px] text-[#adc6ff] font-bold bg-[#007aff20] px-2.5 py-1 rounded border border-[#007aff40]">
                {pc.performanceTier}
              </span>
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-20 rounded overflow-hidden border transition-colors ${i === activeImage ? 'border-[#007aff]' : 'border-[#414755] hover:border-[#8b90a0]'}`}
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
            <span className="font-mono text-[11px] text-[#007aff] uppercase font-bold tracking-wider">{pc.brand}</span>
            <h1 className="text-white font-bold text-2xl lg:text-3xl tracking-tight mt-1 mb-3">{pc.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <StarRating rating={pc.rating} count={pc.reviewCount} size="md" />
              <StockBadge status={pc.stockStatus} />
              <span className="font-mono text-[11px] text-[#8b90a0]">SKU: {pc.sku || pc.id.toUpperCase()}</span>
            </div>

            <p className="text-[#c1c6d7] text-sm leading-relaxed mb-5">{pc.description}</p>

            {/* Core spec highlights */}
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-4 space-y-2.5 mb-5">
              {coreSpecs.map((s) => (
                <div key={s.key} className="flex items-center gap-3 text-xs">
                  <Icon name={SPEC_ICONS[s.key] || 'chevron_right'} size={16} className="text-[#007aff] shrink-0" />
                  <span className="text-[#8b90a0] font-mono uppercase w-28 shrink-0">{s.label}</span>
                  <span className="text-white font-medium">{String(pc[s.key])}</span>
                </div>
              ))}
            </div>

            {/* Price + actions */}
            <div className="bg-[#16171d] border border-[#414755] rounded p-5 mt-auto">
              <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="lg" />
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[#30d158]">
                <Icon name="local_shipping" size={14} /> Free express dispatch · Est. delivery 3–5 business days
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center border border-[#414755] rounded bg-[#121317] px-2 py-1.5">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-[#8b90a0] hover:text-white p-0.5" aria-label="Decrease quantity">
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-white">{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)} className="text-[#8b90a0] hover:text-white p-0.5" aria-label="Increase quantity">
                    <Icon name="add" size={16} />
                  </button>
                </div>
                <button
                  onClick={() => toggleWishlist(pc.id)}
                  className={`w-11 h-11 flex items-center justify-center rounded border transition-colors ${wishlisted ? 'border-[#ff453a] text-[#ff453a] bg-[#ff453a15]' : 'border-[#414755] text-[#8b90a0] hover:text-[#ff453a] hover:border-[#ff453a]'}`}
                  aria-label="Toggle wishlist"
                >
                  <Icon name="favorite" size={20} filled={wishlisted} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => addToCart(pc, quantity)}
                  className="py-3 bg-[#292a2e] hover:bg-[#343539] border border-[#414755] text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Icon name="add_shopping_cart" size={16} /> ADD TO CART
                </button>
                <button
                  onClick={() => { addToCart(pc, quantity); navigate('/checkout') }}
                  className="py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  BUY NOW <Icon name="bolt" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance benchmarks */}
        <section className="mb-12">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Icon name="speed" size={20} className="text-[#007aff]" /> Gaming Performance Benchmarks
          </h2>
          <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#1e1f23] border-b border-[#292a2e] font-mono text-[10px] text-[#8b90a0] uppercase font-bold">
              <span className="col-span-6">Title</span>
              <span className="col-span-3 text-center">1440p Ultra</span>
              <span className="col-span-3 text-center">4K Ultra</span>
            </div>
            {pc.fpsBenchmarks.map((b) => {
              const maxFps = Math.max(...pc.fpsBenchmarks.map((x) => x.fps1440p))
              return (
                <div key={b.game} className="grid grid-cols-12 gap-2 items-center px-5 py-3 border-b border-[#292a2e] last:border-0 text-xs">
                  <span className="col-span-6 text-[#e3e2e7]">{b.game}</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#121317] rounded overflow-hidden hidden sm:block">
                      <div className="h-full bg-[#30d158]" style={{ width: `${(b.fps1440p / maxFps) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[#30d158] font-bold w-14 text-right">{b.fps1440p} fps</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#121317] rounded overflow-hidden hidden sm:block">
                      <div className="h-full bg-[#007aff]" style={{ width: `${(b.fps4K / maxFps) * 100}%` }} />
                    </div>
                    <span className="font-mono text-[#007aff] font-bold w-14 text-right">{b.fps4K} fps</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Full specs + warranty/upgrade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded p-5">
            <h2 className="text-white font-bold text-base mb-4 border-b border-[#292a2e] pb-3">Full Technical Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {pc.specifications.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 text-xs py-1 border-b border-[#292a2e]/60">
                  <span className="text-[#8b90a0] font-mono">{s.label}</span>
                  <span className="text-white text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
              <h3 className="font-mono text-xs font-bold text-white uppercase mb-3 flex items-center gap-1.5">
                <Icon name="upgrade" size={16} className="text-[#007aff]" /> Upgrade Options
              </h3>
              <ul className="space-y-2 text-xs text-[#c1c6d7]">
                <li className="flex justify-between"><span>+ 32GB RAM (96GB total)</span><span className="font-mono text-white">+$189</span></li>
                <li className="flex justify-between"><span>+ 4TB Gen5 NVMe SSD</span><span className="font-mono text-white">+$249</span></li>
                <li className="flex justify-between"><span>Custom cable & RGB kit</span><span className="font-mono text-white">+$79</span></li>
              </ul>
            </div>
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
              <h3 className="font-mono text-xs font-bold text-white uppercase mb-3 flex items-center gap-1.5">
                <Icon name="verified" size={16} className="text-[#30d158]" /> Warranty & Support
              </h3>
              <ul className="space-y-2 text-xs text-[#8b90a0]">
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-[#30d158]" /> 3-year parts & labor warranty</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-[#30d158]" /> Lifetime technical support</li>
                <li className="flex items-center gap-2"><Icon name="check_circle" size={14} className="text-[#30d158]" /> 72-hour burn-in tested</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related systems */}
        {otherPCs.length > 0 && (
          <section>
            <h2 className="text-white font-bold text-lg mb-4">Compare Other Systems</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPCs.map((o) => (
                <Link key={o.id} to={`/gaming-pc/${o.id}`} className="group flex gap-3 bg-[#1a1b1f] border border-[#414755] hover:border-[#007aff] rounded p-3 transition-colors">
                  <img src={o.image} alt={o.name} className="w-24 h-20 object-cover rounded bg-[#0d0e12] shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-white text-xs font-bold leading-snug line-clamp-2 group-hover:text-[#adc6ff]">{o.name}</h3>
                    <span className="font-mono text-[10px] text-[#8b90a0] block mt-1">{o.performanceTier}</span>
                    <span className="font-mono text-sm text-[#007aff] font-bold block mt-1">${o.price.toFixed(2)}</span>
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
