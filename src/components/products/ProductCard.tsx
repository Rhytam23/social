import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { Icon, Badge, StockBadge, StarRating, Price } from '../ui'
import { useShop } from '../../context/ShopContext'

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: string) => void
  isWishlisted?: boolean
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const { toggleCompare, isInCompare } = useShop()
  const comparing = isInCompare(product.id)

  return (
    <article className="product-card-container group relative flex flex-col justify-between bg-transparent transition-all duration-200 h-full select-none">
      {/* ── Main Product Image Area ── */}
      <Link
        to={`/products/${product.slug}`}
        className="product-card-img-area relative w-full h-48 md:h-52 bg-white dark:bg-[var(--bg-surface-secondary)] rounded-xl flex items-center justify-center p-4 overflow-hidden shrink-0"
      >
        {!imageError ? (
          <img
            src={product.image}
            alt=""
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              setImageError(true)
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface-secondary)] relative z-10 text-[var(--text-muted)] rounded-xl">
            <Icon name="memory" size={44} className="text-[var(--accent-blue)]" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20 pointer-events-none">
          {product.isNew && <Badge variant="primary">NEW</Badge>}
          {product.discount && <Badge variant="orange">-{product.discount}%</Badge>}
        </div>

        {/* Action Buttons (Wishlist & Compare) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-150 ${
              isWishlisted
                ? 'bg-[var(--bg-surface)] border-rose-500/50 text-rose-500'
                : 'bg-[var(--bg-surface)]/90 border-[var(--border-theme)] text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-500/30'
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
            className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-150 ${
              comparing
                ? 'bg-[var(--bg-surface)] border-[var(--accent-blue)] text-[var(--accent-blue)]'
                : 'bg-[var(--bg-surface)]/90 border-[var(--border-theme)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)]'
            }`}
          >
            <Icon name="balance" size={14} />
          </button>
        </div>
      </Link>

      {/* ── Content & Details ── */}
      <div className="pt-3 px-1 pb-1 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-[var(--accent-blue)] uppercase">
              {product.brand}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="group/link block mb-1.5">
            <h3 className="product-card-title text-[var(--text-primary)] text-sm font-bold leading-snug group-hover/link:text-[var(--accent-blue)] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        </div>

        {/* ── Price & Add to Cart Action ── */}
        <div className="pt-2 flex flex-col gap-2.5">
          <Price
            price={product.price}
            previousPrice={product.previousPrice}
            discount={product.discount}
            size="sm"
          />

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stockStatus === 'out-of-stock'}
            aria-label={`Add ${product.name} to cart`}
            className="w-full h-9 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            <Icon name="add_shopping_cart" size={16} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onToggleWishlist: (productId: string) => void
  wishlistedIds: Set<string>
  columns?: 2 | 3 | 4
}

export function ProductGrid({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistedIds,
  columns = 4,
}: ProductGridProps) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-5 md:gap-6 ${colClasses[columns]}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isWishlisted={wishlistedIds.has(product.id)}
        />
      ))}
    </div>
  )
}
