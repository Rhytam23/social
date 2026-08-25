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
    <article className="group flex flex-col bg-(--bg-surface) rounded-2xl transition-all duration-200 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative bg-(--bg-surface-secondary) overflow-hidden block" style={{ aspectRatio: '4/3' }}>
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-(--bg-surface-secondary)">
            <Icon name="memory" size={36} className="text-(--text-secondary)" />
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
            className={`w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-md transition-all duration-200 cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500/20 text-rose-500'
                : 'bg-black/40 text-(--text-secondary) opacity-0 group-hover:opacity-100 hover:text-rose-500'
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
            className={`w-7 h-7 flex items-center justify-center rounded-lg backdrop-blur-md transition-all duration-200 cursor-pointer ${
              comparing
                ? 'bg-(--accent-blue)/20 text-(--accent-blue)'
                : 'bg-black/40 text-(--text-secondary) opacity-0 group-hover:opacity-100 hover:text-(--accent-blue)'
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
            <span className="font-mono text-[10px] tracking-[0.08em] text-(--text-secondary) uppercase font-semibold">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="block mb-2">
            <h3 className="text-(--text-primary) text-xs font-semibold leading-snug hover:text-(--accent-blue) transition-colors line-clamp-2 min-h-8.5">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-2">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2.5 border-t border-(--border-theme) flex flex-col gap-2">
          <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stockStatus === 'out-of-stock'}
            className="w-full py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-sans text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Icon name="add_shopping_cart" size={15} />
            <span>Add to Cart</span>
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
  const [showMore, setShowMore] = useState(false)
  const visibleDeals = showMore ? products.slice(0, 8) : products.slice(0, 4)

  return (
    <section className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 sm:p-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-(--border-theme)">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-(--text-primary) font-bold text-xl tracking-tight">Today's Flash Deals</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-md">
              <Icon name="timer" size={14} /> 04:12:35 remaining
            </span>
          </div>
          <p className="text-(--text-secondary) text-xs md:text-sm">
            Limited-time discount pricing on processors, graphics cards, and storage
          </p>
        </div>

        <Link
          to="/deals"
          className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
        >
          <span>All Deals</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      </div>

      {/* Deals Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleDeals.map((product) => (
          <DealCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistedIds.has(product.id)}
          />
        ))}
      </div>

      {/* Show More Toggle Button */}
      {products.length > 4 && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="px-5 py-2 bg-(--bg-surface-secondary) border border-(--border-theme) hover:border-(--accent-blue) text-(--text-primary) text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            {showMore ? 'Show Fewer Deals' : `Show More Deals (${products.length - 4} more)`}
          </button>
        </div>
      )}
    </section>
  )
}
