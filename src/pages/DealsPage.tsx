import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Breadcrumbs } from '../components/ui'
import { ProductCard } from '../components/products/ProductCard'
import { dealProducts, allProducts } from '../data'
import { useShop } from '../context/ShopContext'
import type { Product } from '../types'

// Dynamic countdown hook
function useCountdown(hoursFromNow: number) {
  const [target] = useState(() => Date.now() + hoursFromNow * 3600 * 1000)
  const [remaining, setRemaining] = useState(target - Date.now())

  useMemo(() => {
    const t = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(t)
  }, [target])

  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return { h, m, s }
}

function CountdownPill() {
  const { h, m, s } = useCountdown(11.5)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-1.5 font-mono">
      <div className="flex items-center gap-1 bg-[#121317] border border-[#ff5c0050] px-2.5 py-1 rounded text-[#ff5c00] font-bold text-xs">
        <Icon name="timer" size={14} />
        <span>{pad(h)}h {pad(m)}m {pad(s)}s</span>
      </div>
    </div>
  )
}

export function DealsPage() {
  const { addToCart, toggleWishlist, wishlist } = useShop()

  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedBrand, setSelectedBrand] = useState<string>('All')
  const [minDiscount, setMinDiscount] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(3500)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState<string>('highest-discount')

  // All deal products catalog
  const catalogDeals = useMemo(() => {
    // Combine explicit dealProducts + any product with discount
    const poolMap = new Map<string, Product>()
    dealProducts.forEach((p) => poolMap.set(p.id, p))
    allProducts.filter((p) => p.discount && p.discount > 0).forEach((p) => poolMap.set(p.id, p))
    return Array.from(poolMap.values())
  }, [])

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set(catalogDeals.map((p) => p.category))
    return ['All', ...Array.from(set)]
  }, [catalogDeals])

  // Brands list
  const brandsList = useMemo(() => {
    const set = new Set(catalogDeals.map((p) => p.brand))
    return ['All', ...Array.from(set)]
  }, [catalogDeals])

  // Filtered & sorted products
  const filteredDeals = useMemo(() => {
    return catalogDeals
      .filter((p) => {
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
        if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false
        if (p.price > maxPrice) return false
        if (p.discount && p.discount < minDiscount) return false
        if (inStockOnly && p.stockStatus === 'out-of-stock') return false
        if (minRating > 0 && p.rating < minRating) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'highest-discount') return (b.discount || 0) - (a.discount || 0)
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        if (sortBy === 'rating') return b.rating - a.rating
        return 0
      })
  }, [catalogDeals, selectedCategory, selectedBrand, maxPrice, minDiscount, inStockOnly, minRating, sortBy])

  // Flash top 3 deals
  const flashDeals = useMemo(() => {
    return [...catalogDeals].sort((a, b) => (b.discount || 0) - (a.discount || 0)).slice(0, 3)
  }, [catalogDeals])

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: "Today's Deals" }]} className="mb-5" />

        {/* Hero Banner */}
        <section className="relative rounded-lg overflow-hidden border border-[#ff5c0040] bg-gradient-to-r from-[#ff5c0015] via-[#16171d] to-[#121317] p-6 md:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] text-[#ff5c00] bg-[#ff5c0020] px-2.5 py-1 rounded border border-[#ff5c0040] font-bold">
                  LIMITED TIME HARDWARE SAVINGS
                </span>
                <span className="font-mono text-[10px] text-[#30d158] bg-[#30d15815] px-2.5 py-1 rounded border border-[#30d15830] font-bold">
                  100% FACTORY WARRANTY
                </span>
              </div>
              <h1 className="text-white font-black text-2xl md:text-4xl tracking-tight mb-2">Today's Deals</h1>
              <p className="text-[#c1c6d7] text-xs md:text-sm max-w-2xl leading-relaxed">
                Explore hand-picked discounts, flash sales, and bundle offers on GPUs, CPUs, monitors, memory, and custom liquid cooling hardware.
              </p>
            </div>

            <div className="bg-[#121317] border border-[#292a2e] p-4 rounded-md shrink-0 flex flex-col items-start gap-1">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-bold">DAILY FLASH TIMER</span>
              <CountdownPill />
              <span className="text-[11px] text-[#8b90a0] mt-1 font-mono">Refreshes every 24 Hours</span>
            </div>
          </div>
        </section>

        {/* Flash Deals Row */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Icon name="bolt" size={20} className="text-[#ff5c00]" filled /> Daily Flash Deals
            </h2>
            <span className="font-mono text-xs text-[#8b90a0]">{flashDeals.length} Top Picked Deals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flashDeals.map((p) => (
              <div key={p.id} className="bg-[#16171d] border border-[#ff5c0050] rounded-md p-4 flex gap-4 items-center">
                <Link to={`/products/${p.slug}`} className="shrink-0 relative">
                  <img src={p.image} alt={p.name} className="w-20 h-20 object-cover rounded bg-[#0d0e12]" />
                  <span className="absolute -top-2 -left-2 bg-[#ff5c00] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    -{p.discount}%
                  </span>
                </Link>

                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-semibold">{p.brand}</span>
                  <Link to={`/products/${p.slug}`} className="block">
                    <h3 className="text-white text-xs font-semibold leading-tight truncate hover:text-[#adc6ff] mt-0.5">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[#ff5c00] font-bold font-mono text-sm">${p.price.toFixed(2)}</span>
                    {p.previousPrice && (
                      <span className="text-[#8b90a0] line-through font-mono text-xs">${p.previousPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-2 text-[10px] font-mono bg-[#007aff] hover:bg-[#0066d6] text-white px-2.5 py-1 rounded font-bold transition-colors flex items-center gap-1"
                  >
                    <Icon name="add_shopping_cart" size={12} /> Claim Deal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Complete Catalog Header & Controls */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6 bg-[#16171d] border border-[#292a2e] p-5 rounded-md self-start">
            <div className="flex items-center justify-between border-b border-[#292a2e] pb-3">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="filter_list" size={16} className="text-[#007aff]" /> Filter Deals
              </span>
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedBrand('All')
                  setMinDiscount(0)
                  setMaxPrice(3500)
                  setInStockOnly(false)
                  setMinRating(0)
                }}
                className="font-mono text-[10px] text-[#8b90a0] hover:text-[#007aff] transition-colors"
              >
                RESET ALL
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <label className="font-mono text-[11px] text-[#8b90a0] uppercase font-semibold block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#121317] border border-[#292a2e] text-[#e3e2e7] text-xs py-2 px-2.5 rounded focus:outline-none focus:border-[#007aff]"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="font-mono text-[11px] text-[#8b90a0] uppercase font-semibold block mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#121317] border border-[#292a2e] text-[#e3e2e7] text-xs py-2 px-2.5 rounded focus:outline-none focus:border-[#007aff]"
              >
                {brandsList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[11px] text-[#8b90a0] uppercase font-semibold">Max Price</label>
                <span className="font-mono text-xs font-bold text-[#007aff]">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="3500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#007aff] bg-[#292a2e] rounded h-1.5 cursor-pointer"
              />
            </div>

            {/* Minimum Discount Filter */}
            <div>
              <label className="font-mono text-[11px] text-[#8b90a0] uppercase font-semibold block mb-2">Minimum Discount</label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {[0, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => setMinDiscount(d)}
                    className={`py-1.5 px-2 border rounded text-center transition-colors font-semibold ${
                      minDiscount === d
                        ? 'bg-[#007aff15] border-[#007aff] text-[#007aff]'
                        : 'border-[#292a2e] text-[#8b90a0] hover:text-white'
                    }`}
                  >
                    {d === 0 ? 'Any' : `${d}%+ OFF`}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Checkbox */}
            <div className="pt-2 border-t border-[#292a2e]">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c1c6d7]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#007aff] w-4 h-4 rounded bg-[#121317] border-[#292a2e]"
                />
                <span>In-Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Main Catalog View */}
          <main className="flex-1 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16171d] border border-[#292a2e] p-4 rounded-md">
              <div>
                <span className="text-white font-bold text-base">Complete Deals Catalog</span>
                <span className="font-mono text-xs text-[#8b90a0] ml-2">
                  Showing {filteredDeals.length} of {catalogDeals.length} Deals
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#8b90a0] shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#121317] border border-[#292a2e] text-[#e3e2e7] text-xs py-1.5 px-3 rounded focus:outline-none focus:border-[#007aff] font-mono"
                >
                  <option value="highest-discount">Highest Discount %</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Catalog Product Grid */}
            {filteredDeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeals.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={wishlist.has(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#16171d] border border-[#292a2e] p-12 text-center rounded-md">
                <Icon name="sentiment_dissatisfied" size={48} className="text-[#8b90a0] mx-auto mb-3" />
                <h3 className="text-white font-bold text-base mb-1">No deals match your filters</h3>
                <p className="text-[#8b90a0] text-xs max-w-sm mx-auto mb-4">
                  Try adjusting your price range or discount filter criteria to view more deals.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedBrand('All')
                    setMinDiscount(0)
                    setMaxPrice(3500)
                    setInStockOnly(false)
                  }}
                  className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs font-bold rounded"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </main>
  )
}
