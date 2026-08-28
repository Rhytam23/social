import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { Icon, EmptyState, Button } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { productService, type PaginationParams } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { brandService } from '../services/brandService'

// Storefront path → API category slug. Keeps existing URLs working while
// filtering happens server-side.
const PATH_TO_CATEGORY: Record<string, string> = {
  'graphics-cards': 'gpus',
  cpus: 'cpus',
  motherboards: 'motherboards',
  ram: 'ram',
  storage: 'storage',
  cooling: 'cooling',
  cases: 'cases',
  'power-supplies': 'psus',
  monitors: 'monitors',
  peripherals: 'peripherals',
  streaming: 'streaming',
  'sim-racing': 'sim-racing',
  accessories: 'accessories',
  'gaming-pcs': 'gaming-pcs',
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured / Best Match' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'newest', label: 'Newest Arrivals' },
]

const PAGE_SIZE = 24

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // Category comes from the route path or ?category=
  const categoryFromUrl = useMemo(() => {
    const qCat = searchParams.get('category')
    if (qCat) return qCat
    const path = location.pathname.replace(/^\//, '')
    return PATH_TO_CATEGORY[path] ?? ''
  }, [searchParams, location.pathname])

  const searchFromUrl = searchParams.get('search') ?? ''
  const brandFromUrl = searchParams.get('brand') ?? ''

  const [sortBy, setSortBy] = useState<string>('featured')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [priceMax, setPriceMax] = useState<number>(0) // 0 = no cap
  const [page, setPage] = useState(1)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Reset paging whenever the query changes
  useEffect(() => {
    setPage(1)
  }, [categoryFromUrl, brandFromUrl, searchFromUrl, sortBy, onlyInStock, priceMax])

  const params: PaginationParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(categoryFromUrl ? { category: categoryFromUrl } : {}),
      ...(brandFromUrl ? { brand: brandFromUrl } : {}),
      ...(searchFromUrl ? { search: searchFromUrl } : {}),
      ...(onlyInStock ? { inStock: true } : {}),
      ...(priceMax > 0 ? { maxPrice: priceMax } : {}),
      sort: sortBy as PaginationParams['sort'],
    }),
    [page, categoryFromUrl, brandFromUrl, searchFromUrl, onlyInStock, priceMax, sortBy]
  )

  const listFn = useCallback(() => productService.list(params), [params])
  const { data, loading, error, reload } = useApi(listFn, [params])

  const categoriesFn = useCallback(() => categoryService.list(), [])
  const { data: categories } = useApi(categoriesFn, [])

  const brandsFn = useCallback(() => brandService.list(), [])
  const { data: brands } = useApi(brandsFn, [])

  const products = data?.data ?? []
  const pagination = data?.pagination
  const activeCategory = categories?.find((c) => c.slug === categoryFromUrl)
  const heading = activeCategory?.name ?? (searchFromUrl ? `Results for “${searchFromUrl}”` : 'Complete Hardware Catalog')

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const clearAllFilters = () => {
    setOnlyInStock(false)
    setPriceMax(0)
    setSortBy('featured')
    setSearchParams({})
  }

  const hasActiveFilters = !!(categoryFromUrl || brandFromUrl || searchFromUrl || onlyInStock || priceMax > 0)

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-(--border-theme)">
          <div>
            <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-1">
              <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
              <Icon name="chevron_right" size={12} />
              <span className="text-(--accent-blue) uppercase">{activeCategory?.name ?? 'ALL'}</span>
            </nav>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">{heading}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) text-xs font-mono rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="tune" size={16} /> FILTERS
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-(--text-secondary) hidden sm:inline">SORT BY:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-(--accent-blue)"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-theme)">
              <span className="font-mono text-xs font-bold text-(--text-primary) uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="filter_list" size={16} className="text-(--accent-blue)" /> FILTER CATALOG
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[10px] font-mono text-rose-500 hover:underline cursor-pointer"
                >
                  RESET ALL
                </button>
              )}
            </div>

            {/* Category Filter — real categories with real product counts */}
            <div>
              <span className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase block mb-2">CATEGORY</span>
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto scrollbar-none pr-1">
                <button
                  type="button"
                  onClick={() => setParam('category', '')}
                  className={`text-left text-xs py-1.5 px-2 rounded-lg font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    !categoryFromUrl
                      ? 'bg-(--accent-blue)/10 text-(--accent-blue) font-bold border-l-2 border-(--accent-blue)'
                      : 'text-(--text-secondary) hover:bg-(--bg-surface-secondary) hover:text-(--text-primary)'
                  }`}
                >
                  <span>All</span>
                </button>
                {(categories ?? []).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setParam('category', cat.slug)}
                    className={`text-left text-xs py-1.5 px-2 rounded-lg font-mono transition-colors flex items-center justify-between cursor-pointer ${
                      categoryFromUrl === cat.slug
                        ? 'bg-(--accent-blue)/10 text-(--accent-blue) font-bold border-l-2 border-(--accent-blue)'
                        : 'text-(--text-secondary) hover:bg-(--bg-surface-secondary) hover:text-(--text-primary)'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {typeof cat.productCount === 'number' && (
                      <span className="text-[10px] text-(--text-muted)">{cat.productCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter — real brands from the database */}
            <div className="pt-4 border-t border-(--border-theme)">
              <span className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase block mb-2">BRAND</span>
              <select
                value={brandFromUrl}
                onChange={(e) => setParam('brand', e.target.value)}
                aria-label="Filter by brand"
                className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
              >
                <option value="">All Brands</option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Price Max */}
            <div className="pt-4 border-t border-(--border-theme)">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase">MAX PRICE</span>
                <span className="font-mono text-xs font-bold text-(--text-primary)">
                  {priceMax > 0 ? `$${priceMax.toLocaleString()}` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="6000"
                step="100"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                aria-label="Maximum price"
                className="w-full accent-(--accent-blue) bg-(--bg-surface-secondary) rounded-lg h-1.5"
              />
              <div className="flex justify-between text-[10px] font-mono text-(--text-secondary) mt-1">
                <span>Any</span>
                <span>$6,000</span>
              </div>
            </div>

            {/* In-Stock Only */}
            <div className="pt-4 border-t border-(--border-theme)">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-(--bg-surface-secondary) border-(--border-theme) text-(--accent-blue) focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-(--text-primary)">IN-STOCK ONLY</span>
              </label>
            </div>
          </aside>

          {/* Product Results */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-4 text-xs text-(--text-secondary)">
              <span>
                {loading
                  ? 'Loading catalog…'
                  : pagination
                    ? `Showing ${products.length} of ${pagination.total} products`
                    : ''}
              </span>
              {brandFromUrl && (
                <span className="text-xs text-(--accent-blue) bg-(--bg-surface-secondary) px-2 py-0.5 rounded border border-(--border-theme) font-medium">
                  Brand: {brands?.find((b) => b.slug === brandFromUrl)?.name ?? brandFromUrl}
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : products.length > 0 ? (
              <>
                <ProductGrid products={products} columns={3} />

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <Button
                      variant="outline"
                      disabled={!pagination.hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      PREVIOUS
                    </Button>
                    <span className="font-mono text-xs text-(--text-secondary)">
                      PAGE {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      NEXT
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="search_off"
                title="No hardware matches found"
                message="Try adjusting your price filter or selecting a different category."
                action={<Button onClick={clearAllFilters}>RESET ALL FILTERS</Button>}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-(--bg-surface) border-l border-(--border-theme) h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-(--border-theme) mb-6">
                <span className="font-bold text-(--text-primary) text-sm">Filter Products</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="Close filters"
                  className="text-(--text-secondary) hover:text-(--text-primary)"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="mb-6">
                <span className="text-xs font-semibold text-(--text-secondary) block mb-2">Category</span>
                <select
                  value={categoryFromUrl}
                  onChange={(e) => setParam('category', e.target.value)}
                  className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg p-2 text-xs text-(--text-primary)"
                >
                  <option value="">All</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <span className="text-xs font-semibold text-(--text-secondary) block mb-2">Brand</span>
                <select
                  value={brandFromUrl}
                  onChange={(e) => setParam('brand', e.target.value)}
                  className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg p-2 text-xs text-(--text-primary)"
                >
                  <option value="">All Brands</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.id} value={b.slug}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <span className="text-xs font-semibold text-(--text-secondary) block mb-1">
                  Max Price: {priceMax > 0 ? `$${priceMax}` : 'Any'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="6000"
                  step="100"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-(--accent-blue)"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-(--bg-surface-secondary) border-(--border-theme) text-(--accent-blue)"
                />
                <span className="text-xs text-(--text-primary)">In-stock only</span>
              </label>
            </div>

            <div className="space-y-2 pt-4 border-t border-(--border-theme)">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-(--accent-blue) text-white text-xs font-semibold rounded-lg"
              >
                Apply Filters{pagination ? ` (${pagination.total})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllFilters()
                  setMobileFilterOpen(false)
                }}
                className="w-full py-2 bg-transparent border border-(--border-theme) text-(--text-secondary) text-xs rounded-lg"
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
