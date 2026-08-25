import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon, Button } from '../components/ui'
import { ProductGrid } from '../components/products/ProductCard'
import { searchProducts } from '../data'
import { useShop } from '../context/ShopContext'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { addToCart, toggleWishlist, wishlist } = useShop()

  const searchResults = useMemo(() => {
    return searchProducts(query)
  }, [query])

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">SEARCH RESULTS</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-theme) mb-6">
          <div>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">
              Search Results for: <span className="text-(--accent-blue)">"{query}"</span>
            </h1>
            <p className="text-(--text-secondary) text-xs mt-1">Found {searchResults.length} matching hardware components & systems</p>
          </div>

          <Link to="/products" className="text-xs font-sans font-semibold text-(--accent-blue) hover:underline flex items-center gap-1">
            View All Products <Icon name="chevron_right" size={14} />
          </Link>
        </div>

        {/* Results */}
        {searchResults.length > 0 ? (
          <ProductGrid
            products={searchResults}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistedIds={wishlist}
            columns={4}
          />
        ) : (
          <div className="p-16 bg-(--bg-surface) border border-(--border-theme) rounded-xl text-center max-w-lg mx-auto">
            <Icon name="search_off" size={48} className="text-(--text-secondary) mb-3 mx-auto" />
            <h2 className="text-(--text-primary) font-bold text-lg mb-1">No Results for "{query}"</h2>
            <p className="text-(--text-secondary) text-xs mb-6">
              Check the spelling or try searching by chipset (e.g. "5090", "7800X3D", "DDR5", "OLED").
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/products">
                <Button variant="primary" size="md">
                  Browse All Hardware
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
