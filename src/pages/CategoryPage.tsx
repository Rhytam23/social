import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Icon, Breadcrumbs, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { PageSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'

export function CategoryPage() {
  const { slug } = useParams()

  const categoryFn = useCallback(() => categoryService.getBySlug(slug!), [slug])
  const { data: category, loading, error, reload } = useApi(categoryFn, [slug])

  const productsFn = useCallback(
    () => (slug ? productService.list({ category: slug, limit: 8 }) : Promise.resolve(null)),
    [slug]
  )
  const { data: products } = useApi(productsFn, [slug])

  const allCategoriesFn = useCallback(() => categoryService.list(), [])
  const { data: allCategories } = useApi(allCategoriesFn, [])

  if (loading) return <PageSkeleton />

  if (error || !category) {
    return (
      <main className="flex-1 container-max px-4 py-16">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            icon="category"
            title="Category not found"
            message="Browse the full department directory instead."
            action={
              <Link to="/categories">
                <Button variant="primary" size="md">ALL CATEGORIES</Button>
              </Link>
            }
          />
        )}
      </main>
    )
  }

  const categoryProducts = products?.data ?? []
  const otherCategories = (allCategories ?? []).filter((c) => c.slug !== category.slug).slice(0, 6)
  const shopHref = `/products?category=${encodeURIComponent(category.slug)}`

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Categories', href: '/categories' }, { label: category.name }]}
          className="mb-5"
        />

        {/* Category Hero */}
        <section className="relative rounded-xl overflow-hidden border border-(--border-theme) mb-8 min-h-[240px] flex items-end">
          {category.imageUrl && (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${category.imageUrl}')` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-(--bg-primary) via-(--bg-primary)/80 to-(--bg-primary)/40" />
          <div className="relative z-10 p-6 md:p-10 max-w-2xl">
            {typeof category.productCount === 'number' && (
              <span className="font-mono text-[10px] text-(--accent-blue) bg-(--accent-blue)/10 px-2.5 py-1 rounded border border-(--accent-blue)/30 font-bold inline-block mb-3">
                {category.productCount} PRODUCT{category.productCount === 1 ? '' : 'S'} AVAILABLE
              </span>
            )}
            <h1 className="text-(--text-primary) font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-(--text-secondary) text-sm leading-relaxed mb-5">{category.description}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                to={shopHref}
                className="px-5 py-2.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                SHOP ALL {category.name.toUpperCase()} <Icon name="arrow_forward" size={15} />
              </Link>
              <Link
                to="/builder"
                className="px-5 py-2.5 bg-transparent border border-(--border-theme) hover:border-(--text-primary) text-(--text-primary) font-mono text-xs font-semibold rounded-lg transition-colors"
              >
                USE PC BUILDER
              </Link>
            </div>
          </div>
        </section>

        {/* Products in this category */}
        {categoryProducts.length > 0 ? (
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-(--text-primary) font-semibold text-lg tracking-tight">In {category.name}</h2>
              <Link
                to={shopHref}
                className="font-mono text-[11px] tracking-widest text-(--accent-blue) hover:underline flex items-center gap-1"
              >
                VIEW ALL <Icon name="chevron_right" size={14} />
              </Link>
            </div>
            <ProductGrid products={categoryProducts} columns={4} />
          </section>
        ) : (
          <EmptyState
            icon="inventory_2"
            title={`No products in ${category.name} yet`}
            message="This category has no published products at the moment."
            className="mb-10"
          />
        )}

        {/* Explore other categories */}
        {otherCategories.length > 0 && (
          <section>
            <h2 className="text-(--text-primary) font-semibold text-lg tracking-tight mb-4">Explore Other Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {otherCategories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-(--border-theme) bg-(--bg-surface) hover:border-(--accent-blue) transition-all aspect-square"
                >
                  {c.imageUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url('${c.imageUrl}')` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-(--bg-primary) via-(--bg-primary)/60 to-transparent" />
                  <div className="relative z-10 mt-auto p-3">
                    <h3 className="text-(--text-primary) font-bold text-xs group-hover:text-(--accent-blue)">{c.name}</h3>
                    {typeof c.productCount === 'number' && (
                      <span className="font-mono text-[9px] text-(--text-secondary)">{c.productCount} items</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
