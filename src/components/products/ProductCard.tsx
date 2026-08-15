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
    <article className="group relative flex flex-col bg-[#16171d] border border-[#292a2e] hover:border-[#007aff]/60 rounded-xl transition-all duration-300 overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1">
      {/* Image Container with Radial Glow */}
      <Link
        to={`/products/${product.slug}`}
        className="relative bg-[#121317] overflow-hidden block group/img"
        style={{ aspectRatio: '4/3' }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#007aff]/5 via-transparent to-transparent pointer-events-none z-0" />
        
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out relative z-1"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#121317] relative z-1">
            <Icon name="memory" size={44} className="text-[#414755]" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isNew && <Badge variant="primary">NEW ARRIVAL</Badge>}
          {product.discount && <Badge variant="orange">-{product.discount}% OFF</Badge>}
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 shadow-md ${
              isWishlisted
                ? 'bg-[#ff453a20] border-[#ff453a] text-[#ff453a]'
                : 'bg-[#121317]/80 border-[#292a2e] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#ff453a] hover:text-[#ff453a]'
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
            className={`w-8 h-8 flex items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 shadow-md ${
              comparing
                ? 'bg-[#007aff20] border-[#007aff] text-[#007aff]'
                : 'bg-[#121317]/80 border-[#292a2e] text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:border-[#007aff] hover:text-[#007aff]'
            }`}
          >
            <Icon name="balance" size={16} />
          </button>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Brand & Stock Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] tracking-wider text-[#007aff] uppercase font-bold">
            {product.brand}
          </span>
          <StockBadge status={product.stockStatus} />
        </div>

        {/* Product Name */}
        <Link to={`/products/${product.slug}`} className="group/link mb-2.5">
          <h3 className="text-white text-sm sm:text-base leading-snug font-bold group-hover/link:text-[#007aff] transition-colors line-clamp-2 min-h-[44px]">
            {product.name}
          </h3>
        </Link>

        {/* Star Rating */}
        <div className="mb-3">
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>

        {/* Key Specifications Preview */}
        <div className="mb-4 flex flex-col gap-1.5 border-t border-[#292a2e] pt-3 bg-[#121317]/50 rounded-lg p-2.5">
          {product.specifications.slice(0, 2).map((spec) => (
            <div key={spec.label} className="flex items-center justify-between gap-2">
              <span className="text-[#8b90a0] font-mono text-[10px] uppercase tracking-wider">{spec.label}</span>
              <span className="text-[#c1c6d7] font-mono text-[11px] font-semibold truncate max-w-[130px] text-right">
                {spec.value}
              </span>
            </div>
          ))}
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-[#292a2e]">
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
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-[#007aff] text-white font-mono text-xs tracking-wider rounded-lg hover:bg-[#0066d6] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-md shadow-[#007aff]/20"
          >
            <Icon name="add_shopping_cart" size={15} />
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
    <div className={`grid gap-5 ${colClasses[columns]}`}>
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
