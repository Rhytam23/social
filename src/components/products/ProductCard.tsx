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

export function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted = false }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const { toggleCompare, isInCompare } = useShop()
  const comparing = isInCompare(product.id)

  return (
    <article className="group flex flex-col bg-[#1a1b1f] border border-[#414755] rounded hover:border-[#8b90a0] transition-all duration-200 overflow-hidden">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative bg-[#1e1f23] overflow-hidden block" style={{ aspectRatio: '4/3' }}>
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1e1f23]">
            <Icon name="memory" size={40} className="text-[#414755]" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.isNew && <Badge variant="primary">NEW</Badge>}
          {product.discount && <Badge variant="orange">-{product.discount}%</Badge>}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-8 h-8 flex items-center justify-center rounded border transition-all duration-200
              ${isWishlisted
                ? 'bg-[#ff453a20] border-[#ff453a] text-[#ff453a]'
                : 'bg-[#12131790] border-[#414755] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#ff453a] hover:text-[#ff453a]'
              }`}
          >
            <Icon name="favorite" size={16} filled={isWishlisted} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleCompare(product.id)
            }}
            aria-label={comparing ? 'Remove from comparison' : 'Add to comparison'}
            className={`w-8 h-8 flex items-center justify-center rounded border transition-all duration-200
              ${comparing
                ? 'bg-[#007aff20] border-[#007aff] text-[#007aff]'
                : 'bg-[#12131790] border-[#414755] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#007aff] hover:text-[#007aff]'
              }`}
          >
            <Icon name="balance" size={16} />
          </button>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Brand + Stock */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[10px] tracking-[0.08em] text-[#8b90a0] uppercase font-semibold">{product.brand}</span>
          <StockBadge status={product.stockStatus} />
        </div>

        {/* Product Name */}
        <Link to={`/products/${product.slug}`} className="group/link mb-2">
          <h3 className="text-[#e3e2e7] text-sm leading-snug font-medium group-hover/link:text-[#adc6ff] transition-colors line-clamp-2 min-h-[38px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <StarRating rating={product.rating} count={product.reviewCount} />

        {/* Specs Preview */}
        <div className="mt-3 mb-3 flex flex-col gap-1 border-t border-[#292a2e] pt-3">
          {product.specifications.slice(0, 2).map((spec) => (
            <div key={spec.label} className="flex items-center justify-between">
              <span className="text-[#8b90a0] font-mono text-[10px]">{spec.label}</span>
              <span className="text-[#e3e2e7] font-mono text-[10px] truncate max-w-[140px] text-right">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-[#292a2e]">
          <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stockStatus === 'out-of-stock'}
            aria-label={`Add ${product.name} to cart`}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#007aff] text-white font-mono text-[10px] tracking-[0.05em] rounded hover:bg-[#0066d6] active:bg-[#004fc2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
          >
            <Icon name="add_shopping_cart" size={14} />
            ADD
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

export function ProductGrid({ products, onAddToCart, onToggleWishlist, wishlistedIds, columns = 4 }: ProductGridProps) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${colClasses[columns]}`}>
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
