import { useParams, Link } from 'react-router-dom'
import { Icon, Breadcrumbs, EmptyState } from '../components/ui'
import { ProductGrid } from '../components/products/ProductCard'
import { allProducts, allBrandNames, featuredBrands } from '../data'
import { useShop } from '../context/ShopContext'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function BrandPage() {
  const { slug } = useParams()
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const brandName = allBrandNames.find((b) => slugify(b) === slug)

  if (!brandName) {
    return (
      <main className="flex-1 container-max px-4 py-16 text-center">
        <Icon name="storefront" size={48} className="text-[#8b90a0] mb-4 mx-auto" />
        <h1 className="text-white font-bold text-2xl mb-2">Brand Not Found</h1>
        <Link to="/brands" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block mt-4">ALL BRANDS</Link>
      </main>
    )
  }

  const brandProducts = allProducts.filter((p) => p.brand === brandName)
  const featured = brandProducts.filter((p) => p.isFeatured)
  const deals = brandProducts.filter((p) => (p.discount || 0) > 0)
  const categories = Array.from(new Set(brandProducts.map((p) => p.category)))
  const meta = featuredBrands.find((b) => b.name === brandName)

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Brands', href: '/brands' }, { label: brandName }]} className="mb-5" />

        {/* Brand header */}
        <section className="relative rounded overflow-hidden border border-[#414755] bg-gradient-to-r from-[#16171d] to-[#1a1b1f] p-6 md:p-10 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded bg-[#121317] border border-[#414755] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-2xl tracking-tighter">{brandName.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#007aff] bg-[#007aff15] px-2 py-0.5 rounded border border-[#007aff30] font-bold">AUTHORIZED RETAILER</span>
              <h1 className="text-white font-black text-2xl sm:text-3xl tracking-tight mt-2">{brandName}</h1>
              <p className="text-[#8b90a0] text-sm mt-1 max-w-2xl">{meta?.description || `Explore the full range of ${brandName} hardware — genuine retail stock with full manufacturer warranty.`}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="font-mono text-xs text-[#c1c6d7] bg-[#121317] border border-[#292a2e] px-3 py-1.5 rounded">{brandProducts.length} Products</span>
            <span className="font-mono text-xs text-[#c1c6d7] bg-[#121317] border border-[#292a2e] px-3 py-1.5 rounded">{categories.length} Categories</span>
            {deals.length > 0 && <span className="font-mono text-xs text-[#ff5c00] bg-[#ff5c0010] border border-[#ff5c0040] px-3 py-1.5 rounded">{deals.length} On Sale</span>}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-4">Shop {brandName} by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link key={c} to={`/products?brand=${encodeURIComponent(brandName)}&category=${encodeURIComponent(c)}`} className="text-sm text-[#c1c6d7] hover:text-white bg-[#1a1b1f] border border-[#414755] hover:border-[#007aff] px-4 py-2 rounded transition-colors">
                  {c}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-4">Featured {brandName} Products</h2>
            <ProductGrid products={featured} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistedIds={wishlist} columns={4} />
          </section>
        )}

        {/* Deals */}
        {deals.length > 0 && (
          <section className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2"><Icon name="bolt" size={20} className="text-[#ff5c00]" /> {brandName} Deals</h2>
            <ProductGrid products={deals} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistedIds={wishlist} columns={4} />
          </section>
        )}

        {/* All products */}
        <section>
          <h2 className="text-white font-semibold text-lg mb-4">All {brandName} Products</h2>
          {brandProducts.length ? (
            <ProductGrid products={brandProducts} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistedIds={wishlist} columns={4} />
          ) : (
            <EmptyState icon="inventory_2" title="No products available" message="Check back soon for new stock from this brand." />
          )}
        </section>
      </div>
    </main>
  )
}

export function BrandsPage() {
  const brandCounts = allBrandNames.map((name) => ({
    name,
    count: allProducts.filter((p) => p.brand === name).length,
    meta: featuredBrands.find((b) => b.name === name),
  }))

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Brands' }]} className="mb-5" />
        <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Authorized Brand Partners</h1>
        <p className="text-[#8b90a0] text-xs mb-8">Genuine retail hardware from the world's leading manufacturers, each backed by full factory warranty.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brandCounts.map((b) => (
            <Link
              key={b.name}
              to={`/brand/${slugify(b.name)}`}
              className="group bg-[#1a1b1f] border border-[#414755] hover:border-[#007aff] rounded p-5 flex flex-col transition-colors"
            >
              <div className="w-14 h-14 rounded bg-[#121317] border border-[#292a2e] flex items-center justify-center mb-3">
                <span className="text-white font-black text-lg tracking-tighter">{b.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <h2 className="text-white font-bold text-sm group-hover:text-[#adc6ff]">{b.name}</h2>
              <p className="text-[#8b90a0] text-[11px] mt-1 line-clamp-2 flex-1">{b.meta?.description || `${b.count} products available`}</p>
              <span className="font-mono text-[10px] text-[#007aff] mt-3 flex items-center gap-1">{b.count} PRODUCTS <Icon name="chevron_right" size={13} /></span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
