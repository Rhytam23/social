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
    <article className="group relative flex flex-col bg-(--bg-surface) rounded-2xl transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1.5 h-full border border-(--border-theme)">
      {/* Top Header Badge Bar */}
      <div className="px-5 py-3.5 bg-(--bg-surface-secondary) flex items-center justify-between z-10 border-b border-(--border-theme)">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-(--accent-blue) bg-(--accent-blue)/15 px-3 py-1 rounded-md font-bold uppercase tracking-widest">
            {pc.performanceTier}
          </span>
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(pc.id)}
          className={`p-2 transition-all rounded-lg backdrop-blur-md cursor-pointer ${
            wishlisted
              ? 'text-rose-500 bg-rose-500/15'
              : 'text-(--text-secondary) hover:text-rose-500 hover:bg-(--bg-surface-secondary)'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Icon name="favorite" size={18} filled={wishlisted} />
        </button>
      </div>

      {/* Large 16:10 Hardware Photography Container */}
      <Link to={`/gaming-pc/${pc.id}`} className="relative bg-(--bg-surface-secondary) overflow-hidden block aspect-16/10 group/img">
        <div className="absolute inset-0 bg-linear-to-t from-(--bg-surface) via-transparent to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-tr from-(--accent-blue)/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

        {!imageError ? (
          <img
            src={pc.image}
            alt={pc.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-(--bg-surface-secondary) text-(--text-secondary)">
            <Icon name="desktop_windows" size={48} className="text-(--accent-blue)/60 mb-2" />
            <span className="font-mono text-[10px] text-(--text-secondary) uppercase tracking-widest font-bold">FLAGSHIP GAMING RIG</span>
          </div>
        )}

        {/* Floating Chassis Label & Stock Status */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20 font-mono text-[11px]">
          <span className="bg-(--bg-surface)/90 text-(--text-primary) px-3 py-1 rounded-md backdrop-blur-md truncate max-w-[60%] shadow-lg border border-(--border-theme)">
            {pc.caseName}
          </span>
          <span className="text-(--color-stock-green) bg-(--bg-surface)/90 px-3 py-1 rounded-md backdrop-blur-md font-bold flex items-center gap-1 shadow-lg border border-(--border-theme)">
            <span className="w-1.5 h-1.5 rounded-full bg-(--color-stock-green) animate-pulse" />
            IN STOCK
          </span>
        </div>
      </Link>

      {/* Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Rig Title */}
          <Link to={`/gaming-pc/${pc.id}`}>
            <h3 className="text-(--text-primary) font-black text-lg sm:text-xl leading-snug group-hover:text-(--accent-blue) transition-colors mb-2 line-clamp-1">
              {pc.name}
            </h3>
          </Link>

          {/* Star Rating */}
          <div className="mb-4">
            <StarRating rating={pc.rating} count={pc.reviewCount} />
          </div>

          {/* Detailed Hardware Spec Table */}
          <div className="bg-(--bg-surface-secondary) rounded-xl p-3.5 space-y-2.5 font-sans text-xs border border-(--border-theme)">
            <div className="flex items-center justify-between gap-2">
              <span className="text-(--text-secondary) font-mono text-[11px] uppercase flex items-center gap-2 shrink-0 font-semibold">
                <Icon name="memory" size={15} className="text-(--accent-blue)" /> CPU
              </span>
              <span className="text-(--text-primary) font-mono text-xs font-bold truncate text-right">{pc.cpu}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-(--text-secondary) font-mono text-[11px] uppercase flex items-center gap-2 shrink-0 font-semibold">
                <Icon name="videogame_asset" size={15} className="text-(--accent-orange)" /> GPU
              </span>
              <span className="text-(--text-primary) font-mono text-xs font-bold truncate text-right">{pc.gpu}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-(--text-secondary) font-mono text-[11px] uppercase flex items-center gap-2 shrink-0 font-semibold">
                <Icon name="storage" size={15} className="text-(--color-stock-green)" /> RAM
              </span>
              <span className="text-(--text-primary) font-mono text-xs font-semibold truncate text-right">{pc.ram}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-(--text-secondary) font-mono text-[11px] uppercase flex items-center gap-2 shrink-0 font-semibold">
                <Icon name="hard_drive" size={15} className="text-amber-400" /> SSD
              </span>
              <span className="text-(--text-primary) font-mono text-xs font-semibold truncate text-right">{pc.storage}</span>
            </div>
          </div>
        </div>

        {/* Price & Action CTA */}
        <div className="mt-6 pt-4 border-t border-(--border-theme) flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-(--text-secondary) block uppercase font-bold tracking-wider">SYSTEM PRICE</span>
            <Price price={pc.price} previousPrice={pc.previousPrice} discount={pc.discount} size="md" />
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/gaming-pc/${pc.id}`}
              className="px-3 py-2 border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) text-xs font-sans rounded-lg font-semibold transition-all bg-(--bg-surface-secondary)"
            >
              Specs
            </Link>
            <button
              type="button"
              onClick={() => addToCart(pc, 1)}
              className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-sans font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Icon name="shopping_cart" size={15} /> Order
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function GamingPCSection({ pcs }: GamingPCSectionProps) {
  return (
    <section className="relative overflow-hidden bg-(--bg-surface) border border-(--border-theme) rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-(--accent-blue)/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div className="max-w-162.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-(--accent-blue) bg-(--accent-blue)/15 px-3 py-1 rounded-md border border-(--accent-blue)/30 font-bold uppercase tracking-widest">
              PRE-TESTED SYSTEMS
            </span>
            <span className="font-mono text-xs text-(--color-stock-green) flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-(--color-stock-green) animate-pulse" /> 72H STRESS TESTED
            </span>
          </div>
          <h2 className="text-(--text-primary) font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight">
            Apex Flagship Prebuilt Rigs
          </h2>
          <p className="text-(--text-secondary) text-sm sm:text-base mt-2 leading-relaxed">
            Custom-crafted, hand-tuned, and thermal-benchmarked using 100% genuine retail componentry. No proprietary bloatware.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            to="/builder"
            className="px-4 py-2.5 bg-transparent border border-(--accent-blue) text-(--accent-blue) hover:bg-(--accent-blue)/15 font-mono text-xs tracking-wider rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <Icon name="build" size={15} /> CUSTOM BUILDER
          </Link>
          <Link
            to="/gaming-pcs"
            className="px-5 py-2.5 bg-(--accent-blue) text-white hover:bg-(--accent-blue-hover) font-mono text-xs tracking-wider rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-(--accent-blue)/20"
          >
            <span>VIEW ALL RIGS</span>
            <Icon name="arrow_forward" size={15} />
          </Link>
        </div>
      </div>

      {/* Rigs Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pcs.map((pc) => (
          <RigCard key={pc.id} pc={pc} />
        ))}
      </div>
    </section>
  )
}
