import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Price } from '../ui'
import { ProductCard } from '../products/ProductCard'
import { ProductCardSkeleton } from '../ui/SkeletonLoader'
import { HeroSection } from './HeroSection'
import { useApi } from '../../hooks/useApi'
import { useCart } from '../../context/CartContext'
import { useShop } from '../../context/ShopContext'
import { productService, type ProductSummary } from '../../services/productService'
import { categoryService, type Category } from '../../services/categoryService'
import { brandService } from '../../services/brandService'

function CategoryTile({ cat }: { cat: Category }) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      to={`/products?category=${encodeURIComponent(cat.slug)}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-(--bg-surface-secondary) hover:shadow-md transition-all p-4 min-h-30"
    >
      {cat.imageUrl && !imageError ? (
        <img
          src={cat.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 dark:opacity-20"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            setImageError(true)
          }}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-(--bg-surface-secondary)">
          <Icon name="category" size={40} className="text-(--text-muted)" />
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-(--bg-surface)/90 via-(--bg-surface)/30 to-transparent" />

      <div className="relative z-10 flex items-start justify-between">
        {typeof cat.productCount === 'number' && (
          <span className="text-[10px] font-semibold text-(--text-primary) bg-(--bg-surface) border border-(--border-theme) px-2.5 py-0.5 rounded shadow-xs">
            {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-bold text-(--text-primary) group-hover:text-(--accent-blue) transition-colors">
          {cat.name}
        </h3>
      </div>
    </Link>
  )
}

function RailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HomePage() {
  const { addItem } = useCart()
  const { showToast } = useShop()
  const [trendingImageErrors, setTrendingImageErrors] = useState<Record<string, boolean>>({})
  const [promoImageErrors, setPromoImageErrors] = useState<Record<string, boolean>>({})

  const { data: deals, loading: dealsLoading } = useApi(
    useCallback(() => productService.list({ hasDiscount: true, limit: 4 }), []),
    []
  )
  const { data: featured, loading: featuredLoading } = useApi(
    useCallback(() => productService.list({ isFeatured: true, limit: 5 }), []),
    []
  )
  const { data: newArrivals, loading: newLoading } = useApi(
    useCallback(() => productService.list({ isNew: true, sort: 'newest', limit: 4 }), []),
    []
  )
  const { data: categories } = useApi(useCallback(() => categoryService.list(), []), [])
  const { data: brands } = useApi(useCallback(() => brandService.list(), []), [])
  const { data: gamingPCs } = useApi(
    useCallback(() => productService.list({ category: 'gaming-pcs', limit: 3 }), []),
    []
  )

  const dealProducts = deals?.data ?? []
  const featuredProducts = featured?.data ?? []
  const trendingProducts = newArrivals?.data ?? []
  const pcs = gamingPCs?.data ?? []
  const visibleCategories = (categories ?? []).slice(0, 12)
  const visibleBrands = (brands ?? []).slice(0, 8)

  const quickAdd = async (product: ProductSummary) => {
    try {
      await addItem(product.id, 1)
      showToast('Added to cart', 'cart')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    }
  }

  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary) pb-24 pt-6 select-none">
      <div className="container-max px-4 sm:px-6 lg:px-8 space-y-20">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Current Deals */}
        {(dealsLoading || dealProducts.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Current Deals</h2>
                <p className="text-(--text-secondary) text-sm">Reduced prices on selected hardware</p>
              </div>
              <Link
                to="/deals"
                className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View All Deals →</span>
              </Link>
            </div>

            {dealsLoading ? (
              <RailSkeleton />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {dealProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Featured */}
        {(featuredLoading || featuredProducts.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Featured Hardware</h2>
                <p className="text-(--text-secondary) text-sm">Highlighted components from our catalog</p>
              </div>
              <Link
                to="/products"
                className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View All →</span>
              </Link>
            </div>

            {featuredLoading ? (
              <RailSkeleton count={5} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 4. New Arrivals */}
        {(newLoading || trendingProducts.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">New Arrivals</h2>
                <p className="text-(--text-secondary) text-sm">Recently added to the catalog</p>
              </div>
              <Link
                to="/products?sort=newest"
                className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Explore More →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {trendingProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex bg-transparent transition-all py-4 border-b border-(--border-theme) gap-4 items-center"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="w-24 h-24 bg-white dark:bg-(--bg-surface-secondary) rounded-xl p-2 flex items-center justify-center shrink-0 border border-(--border-theme)/20"
                  >
                    {product.primaryImage && !trendingImageErrors[product.id] ? (
                      <img
                        src={product.primaryImage}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                        onError={() => setTrendingImageErrors((prev) => ({ ...prev, [product.id]: true }))}
                        loading="lazy"
                      />
                    ) : (
                      <Icon name="memory" size={32} className="text-(--text-muted)" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-(--accent-blue) uppercase tracking-wider">
                        {product.brandName}
                      </span>
                      <Link to={`/products/${product.slug}`} className="block">
                        <h3 className="text-(--text-primary) text-sm font-bold truncate hover:text-(--accent-blue) transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Price
                        price={product.price}
                        previousPrice={product.previousPrice ?? undefined}
                        discount={product.discountPercent || undefined}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => void quickAdd(product)}
                        disabled={product.stockStatus === 'out-of-stock'}
                        className="px-3.5 py-1.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Icon name="add_shopping_cart" size={14} /> Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 5. Shop by Category — real counts from the database */}
        {visibleCategories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Shop by Category</h2>
                <p className="text-(--text-secondary) text-sm">Explore component categories and pre-built systems</p>
              </div>
              <Link
                to="/categories"
                className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
              >
                <span>All Categories →</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visibleCategories.map((cat) => (
                <CategoryTile key={cat.id} cat={cat} />
              ))}
            </div>
          </section>
        )}

        {/* 6. Gaming PCs */}
        {pcs.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Gaming PCs</h2>
                <p className="text-(--text-secondary) text-sm">Ready-to-play systems built for serious performance</p>
              </div>
              <Link
                to="/gaming-pcs"
                className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Shop Gaming PCs →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pcs.map((pc) => (
                <article
                  key={pc.id}
                  className="group relative flex flex-col bg-(--bg-surface) hover:shadow-md transition-all duration-300 overflow-hidden h-full rounded-2xl border border-(--border-theme)"
                >
                  <div className="px-5 py-3.5 bg-(--bg-surface-secondary) flex items-center justify-between z-10 border-b border-(--border-theme)">
                    <span className="font-mono text-[10px] text-(--accent-blue) bg-(--accent-blue)/10 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                      {pc.performanceTier ?? 'PREBUILT'}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold flex items-center gap-1 ${
                        pc.stockStatus === 'out-of-stock'
                          ? 'text-(--color-stock-red)'
                          : pc.stockStatus === 'low-stock'
                            ? 'text-(--color-stock-yellow-val)'
                            : 'text-(--color-stock-green)'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {pc.stockStatus === 'out-of-stock'
                        ? 'OUT OF STOCK'
                        : pc.stockStatus === 'low-stock'
                          ? 'LOW STOCK'
                          : 'IN STOCK'}
                    </span>
                  </div>

                  <Link
                    to={`/gaming-pc/${pc.slug}`}
                    className="relative bg-(--bg-surface-secondary) overflow-hidden block aspect-16/10"
                  >
                    {pc.primaryImage ? (
                      <img
                        src={pc.primaryImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-(--bg-surface-secondary)">
                        <Icon name="desktop_windows" size={64} className="text-(--text-muted)" />
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <Link to={`/gaming-pc/${pc.slug}`}>
                      <h3 className="text-(--text-primary) font-bold text-lg hover:text-(--accent-blue) transition-colors line-clamp-2">
                        {pc.name}
                      </h3>
                    </Link>

                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-(--border-theme)">
                      <div>
                        <span className="text-[10px] text-(--text-secondary) font-mono uppercase block font-bold">Price</span>
                        <span className="text-(--text-primary) font-bold text-lg">${pc.price.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void quickAdd(pc)}
                        disabled={pc.stockStatus === 'out-of-stock'}
                        className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Icon name="shopping_cart" size={14} /> ORDER
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7. Category navigation blocks */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Browse by Component</h2>
            <p className="text-(--text-secondary) text-sm">Jump straight to the parts you need</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: 'Graphics Cards',
                desc: 'Upgrade your gaming performance',
                cta: 'Shop GPUs →',
                href: '/graphics-cards',
                img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
              },
              {
                name: 'Processors',
                desc: 'Power your next-gen build',
                cta: 'Shop CPUs →',
                href: '/cpus',
                img: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&q=80',
              },
              {
                name: 'Gaming Peripherals',
                desc: 'Precision keyboards and mice',
                cta: 'Shop Peripherals →',
                href: '/peripherals',
                img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
              },
              {
                name: 'Storage',
                desc: 'High-speed NVMe drives',
                cta: 'Shop Storage →',
                href: '/storage',
                img: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=600&q=80',
              },
            ].map((block) => {
              const hasError = promoImageErrors[block.name]
              return (
                <div
                  key={block.name}
                  className="group relative flex flex-col justify-end overflow-hidden rounded-xl bg-(--bg-surface-secondary) p-6 min-h-50 border border-(--border-theme)"
                >
                  {!hasError ? (
                    <img
                      src={block.img}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 dark:opacity-20"
                      onError={() => setPromoImageErrors((prev) => ({ ...prev, [block.name]: true }))}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-(--bg-surface-secondary)">
                      <Icon name="sell" size={48} className="text-(--text-muted)" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-(--bg-surface)/90 via-(--bg-surface)/30 to-transparent" />
                  <div className="relative z-10 space-y-2">
                    <h3 className="text-base font-bold text-(--text-primary)">{block.name}</h3>
                    <p className="text-(--text-secondary) text-xs">{block.desc}</p>
                    <Link to={block.href} className="inline-block pt-1 text-xs font-bold text-(--accent-blue) group-hover:underline">
                      {block.cta}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 8. PC Builder Promotion */}
        <section className="relative rounded-2xl overflow-hidden bg-(--bg-surface-secondary) p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-(--border-theme)">
          <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-20">
            <img
              src="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&q=80"
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-r from-(--bg-surface)/90 via-(--bg-surface)/30 to-transparent" />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-bold text-(--accent-blue) uppercase tracking-wider block">PC Configurator</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-(--text-primary) tracking-tight">Build Your Own PC</h2>
            <p className="text-(--text-secondary) text-sm leading-relaxed">
              Choose your components and check basic compatibility before you build. The builder tracks estimated power
              draw and flags CPU/socket mismatches as you add parts.
            </p>
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Icon name="build" size={16} />
              <span>Start Building →</span>
            </Link>
          </div>

          <div className="relative z-10 w-full md:w-72 h-44 bg-(--bg-surface) rounded-xl flex items-center justify-center p-6 shrink-0 border border-(--border-theme)/30">
            <Icon name="desktop_windows" size={64} className="text-(--accent-blue)" />
          </div>
        </section>

        {/* 9. Brands — real brands from the catalog */}
        {visibleBrands.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Brands We Carry</h2>
              <p className="text-(--text-secondary) text-sm font-medium">Browse the catalog by manufacturer</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {visibleBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brand=${encodeURIComponent(brand.slug)}`}
                  className="flex items-center justify-center p-4 bg-(--bg-surface-secondary) border border-(--border-theme)/50 text-(--text-secondary) hover:text-(--text-primary) font-bold text-xs tracking-wider transition-all h-14 text-center cursor-pointer rounded-lg"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
