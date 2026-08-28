import { useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { productService } from '../services/productService'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const searchFn = useCallback(
    () =>
      query
        ? productService.search({ search: query, limit: 48 })
        : Promise.resolve({ data: [], pagination: null as never }),
    [query]
  )
  const { data, loading, error, reload } = useApi(searchFn, [query])

  const results = data?.data ?? []
  const total = data?.pagination?.total ?? results.length

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">SEARCH RESULTS</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-theme) mb-6">
          <div>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">
              Search Results for: <span className="text-(--accent-blue)">“{query}”</span>
            </h1>
            <p className="text-(--text-secondary) text-xs mt-1">
              {loading ? 'Searching catalog…' : `Found ${total} matching item${total === 1 ? '' : 's'}`}
            </p>
          </div>

          <Link
            to="/products"
            className="text-xs font-sans font-semibold text-(--accent-blue) hover:underline flex items-center gap-1"
          >
            View All Products <Icon name="chevron_right" size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : results.length > 0 ? (
          <ProductGrid products={results} columns={4} />
        ) : (
          <EmptyState
            icon="search_off"
            title={query ? `No results for “${query}”` : 'Enter a search term'}
            message="Check the spelling or try a broader term such as a chipset or brand name."
            action={
              <Link to="/products">
                <Button variant="primary" size="md">BROWSE ALL HARDWARE</Button>
              </Link>
            }
            className="max-w-lg mx-auto"
          />
        )}
      </div>
    </main>
  )
}
