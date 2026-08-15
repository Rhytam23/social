import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { Icon, Price, StarRating, StockBadge, Badge } from '../ui'
import { useShop } from '../../context/ShopContext'

interface DealCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: string) => void
  isWishlisted?: boolean
}

function DealCard({ product, onAddToCart, onToggleWishlist, isWishlisted = false }: DealCardProps) {
  const [imageError, setImageError] = useState(false)
  const { toggleCompare, isInCompare } = useShop()
  const comparing = isInCompare(product.id)

  return (
    <article className="group flex flex-col bg-[#1a1b1f] border border-[#292a2e] rounded hover:border-[#007aff] transition-all duration-200 overflow-hidden">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative bg-[#16171d] overflow-hidden block" style={{ aspectRatio: '4/3' }}>
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#16171d]">
            <Icon name="memory" size={36} className="text-[#414755]" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.discount && <Badge variant="orange">SAVE {product.discount}%</Badge>}
        </div>

        {/* Action icons (Wishlist & Compare) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-7 h-7 flex items-center justify-center rounded border transition-all duration-200 ${
              isWishlisted
                ? 'bg-[#ff453a20] border-[#ff453a] text-[#ff453a]'
                : 'bg-[#12131790] border-[#414755] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#ff453a] hover:text-[#ff453a]'
            }`}
          >
            <Icon name="favorite" size={14} filled={isWishlisted} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleCompare(product.id)
            }}
            aria-label={comparing ? 'Remove from comparison' : 'Add to comparison'}
            className={`w-7 h-7 flex items-center justify-center rounded border transition-all duration-200 ${
              comparing
                ? 'bg-[#007aff20] border-[#007aff] text-[#007aff]'
                : 'bg-[#12131790] border-[#414755] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#007aff] hover:text-[#007aff]'
            }`}
          >
            <Icon name="balance" size={14} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 justify-between">
        <div>
          {/* Brand + Stock Status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.08em] text-[#8b90a0] uppercase font-semibold">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="block mb-2">
            <h3 className="text-[#e3e2e7] text-xs font-semibold leading-snug hover:text-[#adc6ff] transition-colors line-clamp-2 min-h-[34px]">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-2">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2.5 border-t border-[#292a2e] flex flex-col gap-2">
          <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stockStatus === 'out-of-stock'}
            className="w-full py-1.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-[10px] font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Icon name="add_shopping_cart" size={14} />
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  )
}

interface DealsSectionProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: string) => void
  wishlistedIds: Set<string>
}

export function DealsSection({ products, onAddToCart, onToggleWishlist, wishlistedIds }: DealsSectionProps) {
  // Curated selection: 4 to 6 products max on homepage
  const curatedDeals = products.slice(0, 6)

  return (
    <section>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3 pb-3 border-b border-[#292a2e]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5c00] animate-pulse inline-block" />
            <h2 className="text-white font-bold text-xl tracking-tight">Today's Deals</h2>
            <span className="font-mono text-[10px] bg-[#ff5c0015] text-[#ff5c00] border border-[#ff5c0040] px-2 py-0.5 rounded font-bold">
              LIMITED TIME
            </span>
          </div>
          <p className="text-[#8b90a0] text-xs mt-1">
            Exclusive limited-time savings on flagship GPUs, CPUs, monitors, and custom hardware.
          </p>
        </div>

        {/* View All Link */}
        <Link
          to="/deals"
          className="text-[#007aff] hover:text-[#adc6ff] font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 group self-start sm:self-auto"
        >
          <span>View All Deals</span>
          <Icon name="arrow_forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Curated Product Grid (Show 2 on mobile, 4-6 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {curatedDeals.map((product) => (
          <DealCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistedIds.has(product.id)}
          />
        ))}
      </div>
    </section>
  )
}
