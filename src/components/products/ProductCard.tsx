import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductSummary } from '../../services/productService'
import { Icon, Badge, StockBadge, StarRating, Price } from '../ui'
import { useShop } from '../../context/ShopContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductSummary
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [adding, setAdding] = useState(false)
  const { toggleCompare, isInCompare, showToast } = useShop()
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  const comparing = isInCompare(product.id)
  const isWishlisted = isInWishlist(product.id)
  const outOfStock = product.stockStatus === 'out-of-stock'

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await addItem(product.id, 1)
      const shortName = product.name.length > 34 ? `${product.name.slice(0, 34)}…` : product.name
      showToast(`Added "${shortName}" to cart`, 'cart')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleWishlist = async () => {
    try {
      await toggleWishlist(product.id)
      showToast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist', 'wishlist')
    } catch {
      showToast('Sign in to save items to your wishlist', 'info')
    }
  }

  return (
    <article className="product-card-container group relative flex flex-col justify-between bg-transparent transition-all duration-200 h-full select-none">
      {/* ── Main Product Image Area ── */}
      <Link
        to={`/products/${product.slug}`}
        className="product-card-img-area relative w-full h-48 md:h-52 bg-white dark:bg-(--bg-surface-secondary) rounded-xl flex items-center justify-center p-4 overflow-hidden shrink-0"
      >
        {product.primaryImage && !imageError ? (
          <img
            src={product.primaryImage}
            alt=""
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              setImageError(true)
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-(--bg-surface-secondary) relative z-10 text-(--text-muted) rounded-xl">
            <Icon name="memory" size={44} className="text-(--accent-blue)" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20 pointer-events-none">
          {product.isNew && <Badge variant="primary">NEW</Badge>}
          {product.discountPercent > 0 && <Badge variant="orange">-{product.discountPercent}%</Badge>}
        </div>

        {/* Action Buttons (Wishlist & Compare) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void handleToggleWishlist()
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-150 ${
              isWishlisted
                ? 'bg-(--bg-surface) border-rose-500/50 text-rose-500'
                : 'bg-(--bg-surface)/90 border-(--border-theme) text-(--text-secondary) hover:text-rose-500 hover:border-rose-500/30'
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
                ? 'bg-(--bg-surface) border-(--accent-blue) text-(--accent-blue)'
                : 'bg-(--bg-surface)/90 border-(--border-theme) text-(--text-secondary) hover:text-(--accent-blue)'
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
            <span className="text-[11px] font-bold text-(--accent-blue) uppercase">
              {product.brandName ?? ''}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="group/link block mb-1.5">
            <h3 className="product-card-title text-(--text-primary) text-sm font-bold leading-snug group-hover/link:text-(--accent-blue) transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Rating — only shown once real reviews exist */}
          <div className="mb-3 min-h-[18px]">
            {product.reviewCount > 0 ? (
              <StarRating rating={product.rating} count={product.reviewCount} />
            ) : (
              <span className="font-mono text-[10px] text-(--text-muted)">NO REVIEWS YET</span>
            )}
          </div>
        </div>

        {/* ── Price & Add to Cart Action ── */}
        <div className="pt-2 flex flex-col gap-2.5">
          <Price
            price={product.price}
            previousPrice={product.previousPrice ?? undefined}
            discount={product.discountPercent || undefined}
            size="sm"
          />

          <button
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={outOfStock || adding}
            aria-label={`Add ${product.name} to cart`}
            className="w-full h-9 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            <Icon name="add_shopping_cart" size={16} />
            <span>{outOfStock ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────

interface ProductGridProps {
  products: ProductSummary[]
  columns?: 2 | 3 | 4
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-5 md:gap-6 ${colClasses[columns]}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
