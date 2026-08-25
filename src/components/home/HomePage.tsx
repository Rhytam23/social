import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Price } from '../ui'
import { ProductCard } from '../products/ProductCard'
import { HeroSection } from './HeroSection'
import { useShop } from '../../context/ShopContext'

interface CategoryCard {
  id: string
  title: string
  itemCount: number
  href: string
  image: string
}

function CategoryTile({ cat }: { cat: CategoryCard }) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      to={cat.href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-(--bg-surface-secondary) hover:shadow-md transition-all p-4 min-h-30"
    >
      {!imageError ? (
        <img
          src={cat.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 dark:opacity-20"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            setImageError(true)
          }}
          loading="lazy"
        />
      ) : null}
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--bg-surface-secondary)">
          <Icon name="category" size={40} className="text-(--text-muted)" />
        </div>
      )}

      {/* Subtle overlay so text is readable without washing out the image */}
      <div className="absolute inset-0 bg-linear-to-t from-(--bg-surface)/90 via-(--bg-surface)/30 to-transparent" />
      
      <div className="relative z-10 flex items-start justify-between">
        <span className="text-[10px] font-semibold text-(--text-primary) bg-(--bg-surface) border border-(--border-theme) px-2.5 py-0.5 rounded shadow-xs">
          {cat.itemCount} items
        </span>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-(--text-primary) group-hover:text-(--accent-blue) transition-colors">
          {cat.title}
        </h3>
      </div>
    </Link>
  )
}

export function HomePage() {
  const { products, categories, gamingPCs, addToCart, toggleWishlist, wishlist } = useShop()

  const [pcImageErrors, setPcImageErrors] = useState<Record<string, boolean>>({})
  const [trendingImageErrors, setTrendingImageErrors] = useState<Record<string, boolean>>({})
  const [promoImageErrors, setPromoImageErrors] = useState<Record<string, boolean>>({})

  // 1. Filter Flash Deals
  const dealProducts = products.filter((p) => (p.discount || 0) > 0)
  const visibleDeals = dealProducts.slice(0, 4)

  // 2. Filter Best Sellers (ensure distinct from visibleDeals)
  const bestSellers = products
    .filter((p) => p.rating >= 4.5 && !visibleDeals.some((d) => d.id === p.id))
    .slice(0, 5)

  // 3. Filter Trending Hardware (distinct from deals and best sellers)
  const trendingProducts = products
    .filter((p) => !visibleDeals.some((d) => d.id === p.id) && !bestSellers.some((b) => b.id === p.id))
    .slice(0, 4)

  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary) pb-24 pt-6 select-none">
      <div className="container-max px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Today's Flash Deals */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Today's Flash Deals</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 text-amber-500 text-xs font-semibold rounded-md border border-amber-500/30">
                  <Icon name="timer" size={14} />
                  <span>04:12:35 remaining</span>
                </span>
              </div>
              <p className="text-(--text-secondary) text-sm">Limited-time prices on selected hardware</p>
            </div>
            <Link to="/deals" className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0">
              <span>View All Deals →</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibleDeals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.has(product.id)}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Link to="/deals" className="text-xs font-bold text-(--accent-blue) hover:underline flex items-center gap-1">
              View All Deals <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        </section>

        {/* 3. Best Sellers */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Best Sellers</h2>
              <p className="text-(--text-secondary) text-sm">Popular hardware chosen by our customers</p>
            </div>
            <Link to="/products" className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0">
              <span>View All →</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.has(product.id)}
              />
            ))}
          </div>
        </section>

        {/* 4. Trending Hardware */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Trending Now</h2>
              <p className="text-(--text-secondary) text-sm">Most popular gear in our community this week</p>
            </div>
            <Link to="/products" className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0">
              <span>Explore More →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trendingProducts.map((product) => (
              <article key={product.id} className="group flex bg-transparent transition-all py-4 border-b border-(--border-theme) gap-4 items-center">
                <Link to={`/products/${product.slug}`} className="w-24 h-24 bg-white dark:bg-(--bg-surface-secondary) rounded-xl p-2 flex items-center justify-center shrink-0 border border-(--border-theme)/20">
                  {!trendingImageErrors[product.id] ? (
                    <img
                      src={product.image}
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
                    <span className="text-[10px] font-bold text-(--accent-blue) uppercase tracking-wider">{product.brand}</span>
                    <Link to={`/products/${product.slug}`} className="block">
                      <h3 className="text-(--text-primary) text-sm font-bold truncate hover:text-(--accent-blue) transition-colors">{product.name}</h3>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stockStatus === 'out-of-stock'}
                      className="px-3.5 py-1.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Icon name="add_shopping_cart" size={14} /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 5. Shop by Category */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Shop by Category</h2>
              <p className="text-(--text-secondary) text-sm">Explore component categories and pre-built systems</p>
            </div>
            <Link to="/categories" className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0">
              <span>All Categories →</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((cat) => (
              <CategoryTile key={cat.id} cat={cat} />
            ))}
          </div>
        </section>

        {/* 6. Gaming PCs */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Gaming PCs</h2>
              <p className="text-(--text-secondary) text-sm">Ready-to-play systems built for serious performance</p>
            </div>
            <Link to="/gaming-pcs" className="text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1 shrink-0">
              <span>Shop Gaming PCs →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamingPCs.slice(0, 3).map((pc) => (
              <article key={pc.id} className="group relative flex flex-col bg-(--bg-surface) hover:shadow-md transition-all duration-300 overflow-hidden h-full rounded-2xl border border-(--border-theme)">
                <div className="px-5 py-3.5 bg-(--bg-surface-secondary) flex items-center justify-between z-10 border-b border-(--border-theme)">
                  <span className="font-mono text-[10px] text-(--accent-blue) bg-(--accent-blue)/10 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    {pc.performanceTier}
                  </span>
                  <span className="text-(--color-stock-green) font-mono text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-stock-green)" /> IN STOCK
                  </span>
                </div>

                <Link to={`/gaming-pc/${pc.id}`} className="relative bg-(--bg-surface-secondary) overflow-hidden block aspect-16/10">
                  {!pcImageErrors[pc.id] ? (
                    <img
                      src={pc.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={() => setPcImageErrors((prev) => ({ ...prev, [pc.id]: true }))}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-(--bg-surface-secondary)">
                      <Icon name="desktop_windows" size={64} className="text-(--text-muted)" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 bg-(--bg-surface)/90 text-(--text-secondary) px-2.5 py-1 rounded text-xs font-semibold border border-(--border-theme)">
                    {pc.caseName}
                  </div>
                </Link>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <Link to={`/gaming-pc/${pc.id}`}>
                      <h3 className="text-(--text-primary) font-bold text-lg hover:text-(--accent-blue) transition-colors line-clamp-1">
                        {pc.name}
                      </h3>
                    </Link>
                    
                    <div className="bg-(--bg-surface-secondary) rounded-xl p-3.5 space-y-2 text-xs border border-(--border-theme)">
                      <div className="flex justify-between gap-2">
                        <span className="text-(--text-secondary) flex items-center gap-1.5 font-medium">
                          <Icon name="memory" size={14} className="text-(--accent-blue)" /> CPU
                        </span>
                        <span className="text-(--text-primary) font-semibold truncate text-right">{pc.cpu}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-(--text-secondary) flex items-center gap-1.5 font-medium">
                          <Icon name="videogame_asset" size={14} className="text-(--accent-orange)" /> GPU
                        </span>
                        <span className="text-(--text-primary) font-semibold truncate text-right">{pc.gpu}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-(--text-secondary) flex items-center gap-1.5 font-medium">
                          <Icon name="storage" size={14} className="text-(--color-stock-green)" /> RAM
                        </span>
                        <span className="text-(--text-primary) font-semibold truncate text-right">{pc.ram}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-(--border-theme)">
                    <div>
                      <span className="text-[10px] text-(--text-secondary) font-mono uppercase block font-bold">Price</span>
                      <span className="text-(--text-primary) font-bold text-lg">${pc.price.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(pc, 1)}
                      className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="shopping_cart" size={14} /> ORDER
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 7. Deals by Category */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Deals by Category</h2>
            <p className="text-(--text-secondary) text-sm">Save big on hardware upgrades</p>
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
                desc: 'Blazing fast PCIe 5.0 speeds',
                cta: 'Shop Storage →',
                href: '/storage',
                img: 'https://images.unsplash.com/photo-1600267204026-85c3cc8e96cd?w=600&q=80',
              },
            ].map((block) => {
              const hasError = promoImageErrors[block.name]
              return (
                <div key={block.name} className="group relative flex flex-col justify-end overflow-hidden rounded-xl bg-(--bg-surface-secondary) p-6 min-h-50 border border-(--border-theme)">
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
            <img src="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&q=80" alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-linear-to-r from-(--bg-surface)/90 via-(--bg-surface)/30 to-transparent" />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <span className="text-xs font-bold text-(--accent-blue) uppercase tracking-wider block">PC Configurator</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-(--text-primary) tracking-tight">Build Your Own PC</h2>
            <p className="text-(--text-secondary) text-sm leading-relaxed">
              Choose your components and check compatibility before you build. Our builder tracks real-time power requirements and motherboard compatibility.
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

        {/* 9. Popular Brands */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary)">Popular Brands</h2>
            <p className="text-(--text-secondary) text-sm font-medium">Authorized partner with official manufacturer warranty support</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {['NVIDIA', 'AMD', 'Intel', 'ASUS', 'MSI', 'Gigabyte', 'Corsair', 'Kingston'].map((brand) => (
              <Link
                key={brand}
                to={`/products?brand=${encodeURIComponent(brand)}`}
                className="flex items-center justify-center p-4 bg-(--bg-surface-secondary) border border-(--border-theme)/50 text-(--text-secondary) hover:text-(--text-primary) font-bold text-xs tracking-wider transition-all h-14 text-center cursor-pointer"
              >
                {brand}
              </Link>
            ))}
          </div>
        </section>

        {/* 10. Newsletter */}
        <section className="bg-(--bg-surface-secondary) rounded-xl p-8 max-w-3xl mx-auto text-center space-y-4 border border-(--border-theme)">
          <h2 className="text-xl font-bold text-(--text-primary)">Stay updated on new hardware and deals</h2>
          <p className="text-(--text-secondary) text-xs max-w-md mx-auto">
            Subscribe for early access to product launches, exclusive deals, and community builds.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert("Subscribed!"); }} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 bg-(--bg-surface) border border-(--border-theme) text-(--text-primary) text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-(--accent-blue) placeholder:text-(--text-secondary) transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </section>

      </div>
    </main>
  )
}
