import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Price, StarRating } from '../ui'
import type { GamingPC } from '../../types'
import { useShop } from '../../context/ShopContext'

interface GamingPCSectionProps {
  pcs: GamingPC[]
}

interface RigCardProps {
  pc: GamingPC
}

function RigCard({ pc }: RigCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop()
  const [imageError, setImageError] = useState(false)
  const wishlisted = isInWishlist(pc.id)

  return (
    <article className="bg-[#121317] border border-[#292a2e] rounded-lg hover:border-[#007aff] transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl h-full">
      {/* Card Header Bar */}
      <div className="p-3.5 bg-[#16171d] border-b border-[#292a2e] flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#007aff] bg-[#007aff15] px-2.5 py-0.5 rounded border border-[#007aff30] font-bold uppercase tracking-wider">
          {pc.performanceTier}
        </span>
        <button
          type="button"
          onClick={() => toggleWishlist(pc.id)}
          className={`p-1.5 transition-colors rounded hover:bg-[#1a1b1f] ${
            wishlisted ? 'text-[#ff453a]' : 'text-[#8b90a0] hover:text-[#ff453a]'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Icon name="favorite" size={18} filled={wishlisted} />
        </button>
      </div>

      {/* Image Container with Aspect Ratio */}
      <Link to={`/gaming-pc/${pc.id}`} className="relative bg-[#0d0e12] overflow-hidden block aspect-[16/10]">
        {!imageError ? (
          <img
            src={pc.image}
            alt={pc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#16171d] to-[#0d0e12] text-[#414755]">
            <Icon name="desktop_windows" size={48} className="text-[#007aff60] mb-2" />
            <span className="font-mono text-[10px] text-[#8b90a0] uppercase tracking-wider">PRELOADED RIG SHOWCASE</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121317] via-transparent to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
          <span className="bg-[#121317d0] text-[#c1c6d7] px-2 py-0.5 rounded backdrop-blur-sm border border-[#292a2e] truncate max-w-[55%]">
            {pc.caseName}
          </span>
          <span className="text-[#30d158] bg-[#121317d0] px-2 py-0.5 rounded backdrop-blur-sm border border-[#30d15830] font-bold">
            READY TO SHIP
          </span>
        </div>
      </Link>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link to={`/gaming-pc/${pc.id}`}>
            <h3 className="text-white font-bold text-base leading-snug group-hover:text-[#adc6ff] transition-colors mb-2 line-clamp-1">
              {pc.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-4">
            <StarRating rating={pc.rating} count={pc.reviewCount} />
          </div>

          {/* Two-Column Specification Panel */}
          <div className="bg-[#16171d] rounded-md p-3 border border-[#292a2e] space-y-2 font-sans text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8b90a0] font-mono text-[11px] uppercase flex items-center gap-1.5 shrink-0">
                <Icon name="memory" size={14} className="text-[#007aff]" /> CPU
              </span>
              <span className="text-[#e3e2e7] font-semibold truncate text-right">{pc.cpu}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8b90a0] font-mono text-[11px] uppercase flex items-center gap-1.5 shrink-0">
                <Icon name="videogame_asset" size={14} className="text-[#ff5c00]" /> GPU
              </span>
              <span className="text-[#e3e2e7] font-semibold truncate text-right">{pc.gpu}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8b90a0] font-mono text-[11px] uppercase flex items-center gap-1.5 shrink-0">
                <Icon name="storage" size={14} className="text-[#30d158]" /> RAM
              </span>
              <span className="text-[#e3e2e7] font-semibold truncate text-right">{pc.ram}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8b90a0] font-mono text-[11px] uppercase flex items-center gap-1.5 shrink-0">
                <Icon name="hard_drive" size={14} className="text-[#ffd60a]" /> SSD
              </span>
              <span className="text-[#e3e2e7] font-semibold truncate text-right">{pc.storage}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Bar */}
        <div className="mt-5 pt-4 border-t border-[#292a2e] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-[#8b90a0] block uppercase font-semibold">RETAIL PRICE</span>
            <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="md" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/gaming-pc/${pc.id}`}
              className="px-3 py-2 border border-[#292a2e] hover:border-white text-white text-xs font-mono rounded font-bold transition-colors"
            >
              SPECS
            </Link>
            <button
              type="button"
              onClick={() => addToCart(pc, 1)}
              className="px-3.5 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Icon name="shopping_cart" size={14} /> ORDER RIG
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function GamingPCSection({ pcs }: GamingPCSectionProps) {
  return (
    <section className="bg-[#16171d] border border-[#292a2e] rounded-lg p-5 md:p-8 shadow-2xl">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b border-[#292a2e]">
        <div className="max-w-[620px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-wider text-[#007aff] bg-[#007aff15] px-2.5 py-0.5 rounded border border-[#007aff30] font-bold">
              SYSTEM INTEGRATION
            </span>
            <span className="font-mono text-[10px] text-[#30d158] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] inline-block animate-pulse" /> 72H STRESS TESTED
            </span>
          </div>
          <h2 className="text-white font-black text-xl md:text-2xl tracking-tight">Apex Series Prebuilt Gaming Rigs</h2>
          <p className="text-[#8b90a0] text-sm mt-1.5 leading-relaxed">
            Custom-built, hand-tuned, and thermal-benchmarked with genuine retail components. Zero proprietary parts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto flex-wrap">
          <Link
            to="/builder"
            className="px-4 py-2.5 bg-transparent border border-[#007aff] text-[#007aff] hover:bg-[#007aff15] font-mono text-xs tracking-wider rounded font-bold transition-colors flex items-center gap-1.5"
          >
            <Icon name="build" size={14} /> CUSTOM RIG CONFIGURATOR
          </Link>
          <Link
            to="/gaming-pcs"
            className="px-4 py-2.5 bg-[#007aff] text-white hover:bg-[#0066d6] font-mono text-xs tracking-wider rounded font-bold transition-colors flex items-center gap-1.5"
          >
            <span>VIEW ALL RIGS</span>
            <Icon name="arrow_forward" size={14} />
          </Link>
        </div>
      </div>

      {/* Product Grid: 3 columns desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pcs.map((pc) => (
          <RigCard key={pc.id} pc={pc} />
        ))}
      </div>
    </section>
  )
}
