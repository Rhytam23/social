import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { ProductGrid } from '../components/products/ProductCard'
import { useShop } from '../context/ShopContext'


const CATEGORY_NAMES = [
  'All',
  'Gaming PCs',
  'Components',
  'Graphics Cards',
  'CPUs',
  'Motherboards',
  'RAM',
  'Storage',
  'Cooling',
  'Cases',
  'Power Supplies',
  'Monitors',
  'Peripherals',
  'Streaming',
  'Deals',
]

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { products, addToCart, toggleWishlist, wishlist } = useShop()

  // Determine active category from path or query params
  const activeCategoryFromUrl = useMemo(() => {
    const qCat = searchParams.get('category')
    if (qCat) return qCat

    // check pathname
    const path = location.pathname.replace(/^\//, '')
    if (path === 'graphics-cards') return 'Graphics Cards'
    if (path === 'cpus') return 'CPUs'
    if (path === 'motherboards') return 'Motherboards'
    if (path === 'ram') return 'RAM'
    if (path === 'storage') return 'Storage'
    if (path === 'cooling') return 'Cooling'
    if (path === 'cases') return 'Cases'
    if (path === 'power-supplies') return 'Power Supplies'
    if (path === 'monitors') return 'Monitors'
    if (path === 'peripherals') return 'Peripherals'
    if (path === 'deals') return 'Deals'
    if (path === 'components') return 'Components'
    return 'All'
  }, [searchParams, location.pathname])

  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategoryFromUrl)
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || 'All')
  const [selectedGpu, setSelectedGpu] = useState<string>(searchParams.get('gpu') || 'All')
  const [selectedCpu, setSelectedCpu] = useState<string>(searchParams.get('cpu') || 'All')
  const [selectedRam, setSelectedRam] = useState<string>('All')
  const [selectedStorage, setSelectedStorage] = useState<string>('All')
  const [selectedFormFactor, setSelectedFormFactor] = useState<string>('All')
  const [selectedPerformance, setSelectedPerformance] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('featured')
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false)
  const [priceMax, setPriceMax] = useState<number>(3000)
  const [minRating, setMinRating] = useState<number>(0)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Sync category state when URL changes
  useEffect(() => {
    setSelectedCategory(activeCategoryFromUrl)
  }, [activeCategoryFromUrl])

  // Extract all unique brands
  const brands = useMemo(() => {
    const bSet = new Set<string>()
    products.forEach((p) => bSet.add(p.brand))
    return ['All', ...Array.from(bSet)]
  }, [products])

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      if (selectedCategory === 'Deals') {
        list = list.filter((p) => (p.discount || 0) > 0)
      } else if (selectedCategory === 'Components') {
        const compCats = ['Graphics Cards', 'CPUs', 'Motherboards', 'RAM', 'Storage', 'Cooling', 'Cases', 'Power Supplies']
        list = list.filter((p) => compCats.includes(p.category))
      } else {
        list = list.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase())
      }
    }

    // Brand filter
    if (selectedBrand && selectedBrand !== 'All') {
      list = list.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase())
    }

    // GPU Chipset Filter
    if (selectedGpu && selectedGpu !== 'All') {
      const gQuery = selectedGpu.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(gQuery) ||
        p.specifications.some((s) => s.value.toLowerCase().includes(gQuery)) ||
        p.tags?.some((t) => t.toLowerCase().includes(gQuery))
      )
    }

    // CPU Filter
    if (selectedCpu && selectedCpu !== 'All') {
      const cQuery = selectedCpu.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(cQuery) ||
        p.brand.toLowerCase().includes(cQuery) ||
        p.specifications.some((s) => s.value.toLowerCase().includes(cQuery))
      )
    }

    // RAM Filter
    if (selectedRam && selectedRam !== 'All') {
      const rQuery = selectedRam.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(rQuery) ||
        p.specifications.some((s) => s.value.toLowerCase().includes(rQuery))
      )
    }

    // Storage Filter
    if (selectedStorage && selectedStorage !== 'All') {
      const sQuery = selectedStorage.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(sQuery) ||
        p.specifications.some((s) => s.value.toLowerCase().includes(sQuery))
      )
    }

    // Form Factor Filter
    if (selectedFormFactor && selectedFormFactor !== 'All') {
      const ffQuery = selectedFormFactor.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(ffQuery) ||
        p.specifications.some((s) => s.value.toLowerCase().includes(ffQuery))
      )
    }

    // Performance Tier Filter
    if (selectedPerformance && selectedPerformance !== 'All') {
      const pQuery = selectedPerformance.toLowerCase()
      list = list.filter((p) =>
        ('performanceTier' in p && (p as any).performanceTier.toLowerCase().includes(pQuery)) ||
        p.name.toLowerCase().includes(pQuery) ||
        p.description?.toLowerCase().includes(pQuery)
      )
    }

    // In-Stock filter
    if (onlyInStock) {
      list = list.filter((p) => p.stockStatus === 'in-stock')
    }

    // Price Max filter
    list = list.filter((p) => p.price <= priceMax)

    // Rating filter
    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating)
    }

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0))
    }

    return list
  }, [products, selectedCategory, selectedBrand, selectedGpu, selectedCpu, selectedRam, selectedStorage, selectedFormFactor, selectedPerformance, onlyInStock, priceMax, minRating, sortBy])

  const clearAllFilters = () => {
    setSelectedCategory('All')
    setSelectedBrand('All')
    setSelectedGpu('All')
    setSelectedCpu('All')
    setSelectedRam('All')
    setSelectedStorage('All')
    setSelectedFormFactor('All')
    setSelectedPerformance('All')
    setOnlyInStock(false)
    setPriceMax(3000)
    setMinRating(0)
    setSortBy('featured')
    setSearchParams({})
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#292a2e]">
          <div>
            <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-1">
              <Link to="/" className="hover:text-white">HOME</Link>
              <Icon name="chevron_right" size={12} />
              <span className="text-[#adc6ff] uppercase">{selectedCategory}</span>
            </nav>
            <h1 className="text-white font-bold text-2xl tracking-tight">
              {selectedCategory === 'All' ? 'Complete Hardware Catalog' : selectedCategory}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 bg-[#1a1b1f] border border-[#414755] text-white text-xs font-mono rounded flex items-center gap-1.5"
            >
              <Icon name="tune" size={16} /> FILTERS
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#8b90a0] hidden sm:inline">SORT BY:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-[#007aff]"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Desktop Filter Sidebar (3 cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Active Filters Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#292a2e]">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="filter_list" size={16} className="text-[#007aff]" /> FILTER CATALOG
              </span>
              {(selectedCategory !== 'All' || selectedBrand !== 'All' || onlyInStock || priceMax < 3000 || minRating > 0) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-mono text-[#ff453a] hover:underline"
                >
                  RESET ALL
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">CATEGORY</span>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto scrollbar-none pr-1">
                {CATEGORY_NAMES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat)
                      if (cat !== 'All') setSearchParams({ category: cat })
                      else setSearchParams({})
                    }}
                    className={`text-left text-xs py-1.5 px-2 rounded font-mono transition-colors flex items-center justify-between ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#007aff20] text-[#007aff] font-bold border-l-2 border-[#007aff]'
                        : 'text-[#c1c6d7] hover:bg-[#1a1b1f] hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPU Chipset Filter */}
            <div className="pt-4 border-t border-[#292a2e]">
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">GPU CHIPSET</span>
              <select
                value={selectedGpu}
                onChange={(e) => setSelectedGpu(e.target.value)}
                className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007aff]"
              >
                <option value="All">All Graphics Chipsets</option>
                <option value="RTX 5090">GeForce RTX 5090</option>
                <option value="RTX 4090">GeForce RTX 4090</option>
                <option value="RTX 4080">GeForce RTX 4080 / Super</option>
                <option value="RTX 4070">GeForce RTX 4070 / Ti</option>
                <option value="RX 7900">Radeon RX 7900 XTX / XT</option>
                <option value="RX 7800">Radeon RX 7800 XT</option>
              </select>
            </div>

            {/* CPU Filter */}
            <div className="pt-4 border-t border-[#292a2e]">
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">PROCESSOR (CPU)</span>
              <select
                value={selectedCpu}
                onChange={(e) => setSelectedCpu(e.target.value)}
                className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007aff]"
              >
                <option value="All">All Processors</option>
                <option value="Intel Core Ultra">Intel Core Ultra (Arrow Lake)</option>
                <option value="14900">Intel Core i9-14900K / KS</option>
                <option value="7800X3D">AMD Ryzen 7 7800X3D</option>
                <option value="7950X3D">AMD Ryzen 9 7950X3D</option>
                <option value="Ryzen 9">AMD Ryzen 9 Series</option>
              </select>
            </div>

            {/* RAM Filter */}
            <div className="pt-4 border-t border-[#292a2e]">
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">RAM SPEED & TYPE</span>
              <select
                value={selectedRam}
                onChange={(e) => setSelectedRam(e.target.value)}
                className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007aff]"
              >
                <option value="All">All Memory Types</option>
                <option value="DDR5-8000">DDR5-8000+ Extreme</option>
                <option value="DDR5-7200">DDR5-7200 High Speed</option>
                <option value="DDR5-6000">DDR5-6000 Low Latency</option>
                <option value="DDR4">DDR4 Memory</option>
              </select>
            </div>

            {/* Storage & Form Factor Filter */}
            <div className="pt-4 border-t border-[#292a2e] grid grid-cols-2 gap-2">
              <div>
                <span className="font-mono text-[10px] font-semibold text-[#8b90a0] uppercase block mb-1">STORAGE</span>
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-[11px] rounded p-1.5"
                >
                  <option value="All">All</option>
                  <option value="PCIe 5.0">PCIe 5.0</option>
                  <option value="PCIe 4.0">PCIe 4.0</option>
                  <option value="NVMe">NVMe</option>
                </select>
              </div>
              <div>
                <span className="font-mono text-[10px] font-semibold text-[#8b90a0] uppercase block mb-1">FORM FACTOR</span>
                <select
                  value={selectedFormFactor}
                  onChange={(e) => setSelectedFormFactor(e.target.value)}
                  className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-[11px] rounded p-1.5"
                >
                  <option value="All">All</option>
                  <option value="ATX">ATX</option>
                  <option value="Micro-ATX">mATX</option>
                  <option value="Mini-ITX">ITX</option>
                </select>
              </div>
            </div>

            {/* Performance Tier */}
            <div className="pt-4 border-t border-[#292a2e]">
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">PERFORMANCE TIER</span>
              <select
                value={selectedPerformance}
                onChange={(e) => setSelectedPerformance(e.target.value)}
                className="w-full bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007aff]"
              >
                <option value="All">All Tiers</option>
                <option value="Tier 4">Tier 4 - Enthusiast Extreme (4K Path Tracing)</option>
                <option value="Tier 3">Tier 3 - 4K Ultra Gaming</option>
                <option value="Tier 2">Tier 2 - 1440p High Refresh Pro</option>
                <option value="Tier 1">Tier 1 - Esports Ready</option>
              </select>
            </div>

            {/* Price Max Range Slider */}
            <div className="pt-4 border-t border-[#292a2e]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase">MAX PRICE</span>
                <span className="font-mono text-xs font-bold text-white">${priceMax.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#007aff] bg-[#292a2e] rounded h-1.5"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8b90a0] mt-1">
                <span>$50</span>
                <span>$3,000+</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="pt-4 border-t border-[#292a2e]">
              <span className="font-mono text-[11px] font-semibold text-[#8b90a0] uppercase block mb-2">MINIMUM RATING</span>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'All Ratings', value: 0 },
                  { label: '4.5 & up', value: 4.5 },
                  { label: '4.0 & up', value: 4 },
                  { label: '3.0 & up', value: 3 },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setMinRating(r.value)}
                    className={`text-left text-xs py-1.5 px-2 rounded font-mono transition-colors flex items-center gap-1.5 ${
                      minRating === r.value ? 'bg-[#007aff20] text-[#007aff] font-bold border-l-2 border-[#007aff]' : 'text-[#c1c6d7] hover:bg-[#1a1b1f] hover:text-white'
                    }`}
                  >
                    {r.value > 0 && <Icon name="star" size={12} className="text-[#ffd60a]" filled />}
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Only Toggle */}
            <div className="pt-4 border-t border-[#292a2e]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1e1f23] border-[#414755] text-[#007aff] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-white">IN-STOCK ONLY</span>
              </label>
            </div>
          </aside>

          {/* Product Results Column (9 cols) */}
          <div className="lg:col-span-9">
            {/* Active Result Count */}
            <div className="flex items-center justify-between mb-4 text-xs text-[var(--text-secondary)]">
              <span>Showing {filteredProducts.length} products</span>
              {selectedBrand !== 'All' && (
                <span className="text-xs text-[var(--accent-blue)] bg-[var(--bg-surface-secondary)] px-2 py-0.5 rounded border border-[var(--border-theme)] font-medium">
                  Brand: {selectedBrand}
                </span>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                wishlistedIds={wishlist}
                columns={3}
              />
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl p-12 text-center">
                <Icon name="search_off" size={40} className="text-[var(--text-muted)] mb-3" />
                <h3 className="text-[var(--text-primary)] font-bold text-base mb-1">No Hardware Matches Found</h3>
                <p className="text-[var(--text-secondary)] text-xs max-w-sm mx-auto mb-4">
                  Try adjusting your price filter or selecting a different category from the sidebar.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--accent-blue-hover)]"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Filter Modal / Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-[var(--bg-surface)] border-l border-[var(--border-theme)] h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-theme)] mb-6">
                <span className="font-bold text-[var(--text-primary)] text-sm">Filter Products</span>
                <button onClick={() => setMobileFilterOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <Icon name="close" size={20} />
                </button>
              </div>

              {/* Mobile Category */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">Category</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2 text-xs text-[var(--text-primary)]"
                >
                  {CATEGORY_NAMES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Brand */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">Brand</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2 text-xs text-[var(--text-primary)]"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Price */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Max Price: ${priceMax}</span>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="50"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>

              {/* Mobile In-Stock */}
              <label className="flex items-center gap-2 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-[var(--bg-surface-secondary)] border-[var(--border-theme)] text-[var(--accent-blue)]"
                />
                <span className="text-xs text-[var(--text-primary)]">In-stock only</span>
              </label>
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--border-theme)]">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-[var(--accent-blue)] text-white text-xs font-semibold rounded-lg"
              >
                Apply Filters ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllFilters()
                  setMobileFilterOpen(false)
                }}
                className="w-full py-2 bg-transparent border border-[var(--border-theme)] text-[var(--text-secondary)] text-xs rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
