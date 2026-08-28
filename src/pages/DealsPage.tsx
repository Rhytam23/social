import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Breadcrumbs, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { brandService } from '../services/brandService'

export function DealsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('price_asc')

  const params = useMemo(
    () => ({
      hasDiscount: true,
      limit: 48,
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(selectedBrand ? { brand: selectedBrand } : {}),
      ...(maxPrice > 0 ? { maxPrice } : {}),
      ...(inStockOnly ? { inStock: true } : {}),
      sort: sortBy as 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc' | 'newest' | 'featured',
    }),
    [selectedCategory, selectedBrand, maxPrice, inStockOnly, sortBy]
  )

  const { data, loading, error, reload } = useApi(
    useCallback(() => productService.list(params), [params]),
    [params]
  )
  const { data: categories } = useApi(useCallback(() => categoryService.list(), []), [])
  const { data: brands } = useApi(useCallback(() => brandService.list(), []), [])

  const deals = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  const resetFilters = () => {
    setSelectedCategory('')
    setSelectedBrand('')
    setMaxPrice(0)
    setInStockOnly(false)
    setSortBy('price_asc')
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Deals' }]} className="mb-5" />

        {/* Banner */}
        <section className="relative rounded-xl overflow-hidden border border-(--accent-orange)/30 bg-(--bg-surface) p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="font-mono text-[10px] text-(--accent-orange) bg-(--accent-orange)/10 px-2.5 py-1 rounded border border-(--accent-orange)/30 font-bold inline-block mb-3">
                REDUCED PRICES
              </span>
              <h1 className="text-(--text-primary) font-black text-2xl md:text-4xl tracking-tight mb-2">Deals</h1>
              <p className="text-(--text-secondary) text-xs md:text-sm max-w-2xl leading-relaxed">
                Every product currently listed below its regular price.
              </p>
            </div>
            <div className="bg-(--bg-surface-secondary) border border-(--border-theme) p-4 rounded-lg shrink-0">
              <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-bold block">
                Discounted items
              </span>
              <span className="text-(--accent-orange) font-bold text-2xl font-mono">
                {loading ? '—' : total}
              </span>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6 bg-(--bg-surface) border border-(--border-theme) p-5 rounded-xl self-start">
            <div className="flex items-center justify-between border-b border-(--border-theme) pb-3">
              <span className="font-mono text-xs font-bold text-(--text-primary) uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="filter_list" size={16} className="text-(--accent-blue)" /> Filter Deals
              </span>
              <button
                onClick={resetFilters}
                className="text-[10px] font-mono text-rose-500 hover:underline cursor-pointer"
              >
                RESET
              </button>
            </div>

            <div>
              <label htmlFor="deals-category" className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase block mb-2">
                Category
              </label>
              <select
                id="deals-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
              >
                <option value="">All Categories</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deals-brand" className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase block mb-2">
                Brand
              </label>
              <select
                id="deals-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
              >
                <option value="">All Brands</option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-semibold text-(--text-secondary) uppercase">Max Price</span>
                <span className="font-mono text-xs font-bold text-(--text-primary)">
                  {maxPrice > 0 ? `$${maxPrice.toLocaleString()}` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="6000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximum price"
                className="w-full accent-(--accent-blue)"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-(--bg-surface-secondary) border-(--border-theme) text-(--accent-blue)"
              />
              <span className="text-xs font-mono text-(--text-primary)">IN-STOCK ONLY</span>
            </label>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 gap-4">
              <span className="text-xs text-(--text-secondary)">
                {loading ? 'Loading deals…' : `${deals.length} of ${total} deals`}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort deals"
                  className="bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) font-mono text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-(--accent-blue)"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : deals.length > 0 ? (
              <ProductGrid products={deals} columns={3} />
            ) : (
              <EmptyState
                icon="sell"
                title="No deals match these filters"
                message="There are no discounted products for this combination right now."
                action={
                  <Button variant="primary" size="md" onClick={resetFilters}>
                    RESET FILTERS
                  </Button>
                }
              />
            )}

            <div className="mt-8 text-center">
              <Link to="/products" className="text-xs font-semibold text-(--accent-blue) hover:underline">
                Browse the full catalog →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
