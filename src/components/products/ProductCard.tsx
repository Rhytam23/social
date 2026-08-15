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
    <article className="product-card-container group relative flex flex-col justify-between bg-[#17191E] rounded-2xl transition-all duration-250 overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 h-full select-none">
      {/* ── Top Header Section (Brand + Stock) ── */}
      <div className="p-4 sm:p-5 pb-0">
        {/* Brand & Stock Row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[11px] sm:text-xs tracking-wider text-[#007aff] uppercase font-bold">
            {product.brand}
          </span>
          <StockBadge status={product.stockStatus} />
        </div>

        {/* Product Title (18–20px desktop, font-weight 700, 1.25 line-height) */}
        <Link to={`/products/${product.slug}`} className="group/link block mb-2">
          <h3 className="product-card-title text-[#FFFFFF] text-base md:text-[18px] leading-[1.25] font-bold group-hover/link:text-[#007aff] transition-colors line-clamp-2 min-h-[46px]">
            {product.name}
          </h3>
        </Link>

        {/* Star Rating & Reviews */}
        <div className="mb-3">
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>
      </div>

      {/* ── Main Product Image Area (180–220px Height, Contain Fit, Soft Radial Glow) ── */}
      <Link
        to={`/products/${product.slug}`}
        className="product-card-img-area relative w-full h-[190px] md:h-[210px] bg-[#121317] flex items-center justify-center p-3 overflow-hidden group/img shrink-0"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#007aff]/10 via-transparent to-transparent pointer-events-none z-0" />

        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-10"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#121317] relative z-10 text-[#414755]">
            <Icon name="memory" size={48} className="text-[#007aff]" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20 pointer-events-none">
          {product.isNew && <Badge variant="primary">NEW</Badge>}
          {product.discount && <Badge variant="orange">-{product.discount}% OFF</Badge>}
        </div>

        {/* Floating Action Buttons (Wishlist & Compare) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleWishlist(product.id)
            }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md transition-all duration-200 shadow-md ${
              isWishlisted
                ? 'bg-[#ff453a]/20 text-[#ff453a]'
                : 'bg-[#121317]/80 text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:text-[#ff453a]'
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
            className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md transition-all duration-200 shadow-md ${
              comparing
                ? 'bg-[#007aff]/20 text-[#007aff]'
                : 'bg-[#121317]/80 text-[#8b90a0] opacity-0 group-hover:opacity-100 hover:text-[#007aff]'
            }`}
          >
            <Icon name="balance" size={16} />
          </button>
        </div>
      </Link>

      {/* ── Key Specifications Panel ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="product-spec-panel mb-4 bg-[#1B1E24] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
          {product.specifications.slice(0, 2).map((spec) => (
            <div key={spec.label} className="flex flex-col">
              <span className="product-spec-label font-mono text-[9px] sm:text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold">
                {spec.label}
              </span>
              <span className="product-spec-value font-mono text-xs text-white font-bold truncate">
                {spec.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Price & Add to Cart Action Area ── */}
        <div className="pt-2 product-card-footer flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Price
              price={product.price}
              previousPrice={product.previousPrice}
              discount={product.discount}
              size="md"
            />
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stockStatus === 'out-of-stock'}
            aria-label={`Add ${product.name} to cart`}
            className="w-full h-11 md:h-12 bg-[#007aff] hover:bg-[#0066d6] active:scale-[0.98] text-white font-mono text-xs md:text-sm font-bold tracking-wider rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-[#007aff]/20"
          >
            <Icon name="add_shopping_cart" size={18} />
            <span>ADD TO CART</span>
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
