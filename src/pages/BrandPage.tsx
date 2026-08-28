import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Icon, Breadcrumbs, EmptyState, Button } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { PageSkeleton, ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { productService } from '../services/productService'
import { brandService } from '../services/brandService'

export function BrandPage() {
  const { slug } = useParams()

  const brandFn = useCallback(() => brandService.getBySlug(slug!), [slug])
  const { data: brand, loading, error, reload } = useApi(brandFn, [slug])

  const productsFn = useCallback(
    () => (slug ? productService.list({ brand: slug, limit: 48 }) : Promise.resolve(null)),
    [slug]
  )
  const { data: productsResult, loading: productsLoading } = useApi(productsFn, [slug])

  if (loading) return <PageSkeleton />

  if (error || !brand) {
    return (
      <main className="flex-1 container-max px-4 py-16">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            icon="storefront"
            title="Brand not found"
            message="Browse all brands we carry instead."
            action={
              <Link to="/brands">
                <Button variant="primary" size="md">ALL BRANDS</Button>
              </Link>
            }
          />
        )}
      </main>
    )
  }

  const brandProducts = productsResult?.data ?? []
  const total = productsResult?.pagination?.total ?? brandProducts.length
  const deals = brandProducts.filter((p) => p.discountPercent > 0)
  const categories = Array.from(
    new Map(brandProducts.filter((p) => p.categorySlug).map((p) => [p.categorySlug!, p.categoryName ?? p.categorySlug!])).entries()
  )

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Brands', href: '/brands' }, { label: brand.name }]}
          className="mb-5"
        />

        {/* Brand header */}
        <section className="relative rounded-xl overflow-hidden border border-(--border-theme) bg-(--bg-surface) p-6 md:p-10 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) flex items-center justify-center shrink-0 overflow-hidden">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-(--text-primary) font-black text-2xl tracking-tighter">
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-(--text-primary) font-black text-2xl sm:text-3xl tracking-tight">{brand.name}</h1>
              {brand.description && (
                <p className="text-(--text-secondary) text-sm mt-1 max-w-2xl">{brand.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="font-mono text-xs text-(--text-secondary) bg-(--bg-surface-secondary) border border-(--border-theme) px-3 py-1.5 rounded-lg">
              {total} Product{total === 1 ? '' : 's'}
            </span>
            {categories.length > 0 && (
              <span className="font-mono text-xs text-(--text-secondary) bg-(--bg-surface-secondary) border border-(--border-theme) px-3 py-1.5 rounded-lg">
                {categories.length} Categor{categories.length === 1 ? 'y' : 'ies'}
              </span>
            )}
            {deals.length > 0 && (
              <span className="font-mono text-xs text-(--accent-orange) bg-(--accent-orange)/10 border border-(--accent-orange)/30 px-3 py-1.5 rounded-lg">
                {deals.length} On Sale
              </span>
            )}
          </div>
        </section>

        {/* Categories carried by this brand */}
        {categories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-(--text-primary) font-semibold text-lg mb-4">Shop {brand.name} by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(([catSlug, catName]) => (
                <Link
                  key={catSlug}
                  to={`/products?brand=${encodeURIComponent(brand.slug)}&category=${encodeURIComponent(catSlug)}`}
                  className="text-sm text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) px-4 py-2 rounded-lg transition-colors"
                >
                  {catName}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All products */}
        <section>
          <h2 className="text-(--text-primary) font-semibold text-lg mb-4">All {brand.name} Products</h2>
          {productsLoading ? (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : brandProducts.length ? (
            <ProductGrid products={brandProducts} columns={4} />
          ) : (
            <EmptyState
              icon="inventory_2"
              title="No products available"
              message="Check back soon for new stock from this brand."
            />
          )}
        </section>
      </div>
    </main>
  )
}

export function BrandsPage() {
  const { data: brands, loading, error, reload } = useApi(useCallback(() => brandService.list(), []), [])

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Brands' }]} className="mb-5" />
        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-2">Brands We Carry</h1>
        <p className="text-(--text-secondary) text-xs mb-8">
          Browse the catalog by manufacturer.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (brands ?? []).length === 0 ? (
          <EmptyState icon="storefront" title="No brands published" message="No brands are available yet." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(brands ?? []).map((b) => (
              <Link
                key={b.id}
                to={`/brand/${b.slug}`}
                className="group bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-xl p-5 flex flex-col transition-colors"
              >
                <div className="w-14 h-14 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) flex items-center justify-center mb-3 overflow-hidden">
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-(--text-primary) font-black text-lg tracking-tighter">
                      {b.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-(--text-primary) font-bold text-sm group-hover:text-(--accent-blue)">{b.name}</h2>
                {b.description && (
                  <p className="text-(--text-secondary) text-[11px] mt-1 line-clamp-2 flex-1">{b.description}</p>
                )}
                {typeof b.productCount === 'number' && (
                  <span className="font-mono text-[10px] text-(--accent-blue) mt-3 flex items-center gap-1">
                    {b.productCount} PRODUCT{b.productCount === 1 ? '' : 'S'} <Icon name="chevron_right" size={13} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
