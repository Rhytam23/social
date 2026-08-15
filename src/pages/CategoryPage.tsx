import { useParams, Link } from 'react-router-dom'
import { Icon, Breadcrumbs } from '../components/ui'
import { ProductGrid } from '../components/products/ProductCard'
import { getCategoryDetail, allProducts, categoryDetails } from '../data'
import { useShop } from '../context/ShopContext'

export function CategoryPage() {
  const { slug } = useParams()
  const { addToCart, toggleWishlist, wishlist } = useShop()
  const detail = slug ? getCategoryDetail(slug) : undefined

  if (!detail) {
    return (
      <main className="flex-1 container-max px-4 py-16 text-center">
        <Icon name="category" size={48} className="text-[#8b90a0] mb-4 mx-auto" />
        <h1 className="text-white font-bold text-2xl mb-2">Category Not Found</h1>
        <p className="text-[#8b90a0] mb-6">Browse our full department directory instead.</p>
        <Link to="/categories" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block">
          ALL CATEGORIES
        </Link>
      </main>
    )
  }

  const categoryProducts = allProducts.filter((p) => p.category === detail.name)
  const featured = categoryProducts.filter((p) => p.isFeatured).slice(0, 4)
  const otherCategories = categoryDetails.filter((c) => c.slug !== detail.slug).slice(0, 6)

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Categories', href: '/categories' }, { label: detail.name }]}
          className="mb-5"
        />

        {/* Category Hero */}
        <section className="relative rounded overflow-hidden border border-[#414755] mb-8 min-h-[240px] flex items-end">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${detail.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121317] via-[#121317cc] to-[#12131760]" />
          <div className="relative z-10 p-6 md:p-10 max-w-2xl">
            <span className="font-mono text-[10px] text-[#007aff] bg-[#007aff15] px-2.5 py-1 rounded border border-[#007aff30] font-bold inline-block mb-3">
              {detail.productCount} PRODUCTS AVAILABLE
            </span>
            <h1 className="text-white font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">{detail.name}</h1>
            <p className="text-[#c1c6d7] text-sm leading-relaxed mb-5">{detail.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={detail.href}
                className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                SHOP ALL {detail.name.toUpperCase()} <Icon name="arrow_forward" size={15} />
              </Link>
              <Link
                to="/builder"
                className="px-5 py-2.5 bg-transparent border border-[#414755] hover:border-white text-white font-mono text-xs font-semibold rounded transition-colors"
              >
                USE PC BUILDER
              </Link>
            </div>
          </div>
        </section>

        {/* Subcategories + Popular Brands */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-[#1a1b1f] border border-[#414755] rounded p-5">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#007aff] pl-2">
              Shop by Subcategory
            </h2>
            <div className="flex flex-wrap gap-2">
              {detail.subcategories.map((sub) => (
                <Link
                  key={sub}
                  to={detail.href}
                  className="text-xs text-[#c1c6d7] hover:text-white bg-[#121317] border border-[#292a2e] hover:border-[#007aff] px-3 py-1.5 rounded transition-colors"
                >
                  {sub}
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-[#007aff] pl-2">
              Popular Brands
            </h2>
            <div className="flex flex-col gap-2">
              {detail.popularBrands.map((brand) => (
                <Link
                  key={brand}
                  to={`/products?brand=${encodeURIComponent(brand)}`}
                  className="flex items-center justify-between text-sm text-[#c1c6d7] hover:text-white group"
                >
                  <span>{brand}</span>
                  <Icon name="chevron_right" size={16} className="text-[#414755] group-hover:text-[#007aff]" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Featured products */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-white font-semibold text-lg tracking-tight">Featured in {detail.name}</h2>
              <Link to={detail.href} className="font-mono text-[11px] tracking-widest text-[#adc6ff] hover:text-white flex items-center gap-1">
                VIEW ALL <Icon name="chevron_right" size={14} />
              </Link>
            </div>
            <ProductGrid
              products={featured}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlistedIds={wishlist}
              columns={4}
            />
          </section>
        )}

        {/* Promo Banner */}
        <section className="relative rounded overflow-hidden border border-[#007aff40] bg-gradient-to-r from-[#007aff15] to-[#16171d] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <span className="font-mono text-[10px] text-[#007aff] font-bold tracking-wider">LIMITED TIME</span>
            <h3 className="text-white font-bold text-xl mt-1">Save up to 25% on select {detail.name}</h3>
            <p className="text-[#8b90a0] text-sm mt-1">Use code <span className="text-[#adc6ff] font-mono font-bold">HARDWARE10</span> for an extra 10% at checkout.</p>
          </div>
          <Link
            to="/deals"
            className="shrink-0 px-6 py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
          >
            VIEW ALL DEALS <Icon name="arrow_forward" size={15} />
          </Link>
        </section>

        {/* Explore other categories */}
        <section>
          <h2 className="text-white font-semibold text-lg tracking-tight mb-4">Explore Other Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="group relative flex flex-col overflow-hidden rounded border border-[#414755] bg-[#1a1b1f] hover:border-[#007aff] transition-all aspect-square"
              >
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url('${c.image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121317] via-[#12131770] to-transparent" />
                <div className="relative z-10 mt-auto p-3">
                  <h3 className="text-white font-bold text-xs group-hover:text-[#adc6ff]">{c.name}</h3>
                  <span className="font-mono text-[9px] text-[#8b90a0]">{c.productCount} items</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
