import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { useApi } from '../hooks/useApi'
import { categoryService } from '../services/categoryService'
import { brandService } from '../services/brandService'

export function CategoriesPage() {
  const { data: categories, loading, error, reload } = useApi(
    useCallback(() => categoryService.list(), []),
    []
  )
  const { data: brands } = useApi(useCallback(() => brandService.list(), []), [])

  const list = categories ?? []

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">ALL CATEGORIES</span>
        </nav>

        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-2">Hardware Category Directory</h1>
        <p className="text-(--text-secondary) text-xs mb-8">
          Browse the catalog by component family, gaming rigs, and peripherals.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState icon="category" title="No categories published" message="Categories will appear here once created." />
        ) : (
          <>
            {/* Category grid with real product counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
              {list.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${encodeURIComponent(cat.slug)}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-(--border-theme) bg-(--bg-surface) hover:border-(--accent-blue) transition-all duration-200 aspect-square"
                >
                  {cat.imageUrl && (
                    <div
                      className="absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                      style={{
                        backgroundImage: `url('${cat.imageUrl}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-(--bg-primary) via-(--bg-primary)/60 to-transparent" />
                  <div className="relative z-10 mt-auto p-3">
                    <h3 className="text-(--text-primary) font-bold text-xs tracking-tight group-hover:text-(--accent-blue)">
                      {cat.name}
                    </h3>
                    {typeof cat.productCount === 'number' && (
                      <span className="font-mono text-[9px] text-(--text-secondary) block">
                        {cat.productCount} item{cat.productCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Brand index */}
            {(brands ?? []).length > 0 && (
              <>
                <h2 className="text-(--text-primary) font-bold text-lg mb-6 border-b border-(--border-theme) pb-3">
                  Shop by Brand
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(brands ?? []).map((b) => (
                    <Link
                      key={b.id}
                      to={`/brand/${b.slug}`}
                      className="text-xs text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {b.name}
                      {typeof b.productCount === 'number' && (
                        <span className="font-mono text-[10px] text-(--text-muted)">{b.productCount}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
