import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon } from '../components/ui'
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
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">SEARCH RESULTS</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292a2e] mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl tracking-tight">
              Search Results for: <span className="text-[#007aff]">"{query}"</span>
            </h1>
            <p className="text-[#8b90a0] text-xs mt-1">Found {searchResults.length} matching hardware components & systems</p>
          </div>

          <Link to="/products" className="text-xs font-mono text-[#adc6ff] hover:text-white flex items-center gap-1">
            VIEW ALL PRODUCTS <Icon name="chevron_right" size={14} />
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
          <div className="p-16 bg-[#1a1b1f] border border-[#414755] rounded text-center max-w-lg mx-auto">
            <Icon name="search_off" size={48} className="text-[#414755] mb-3 mx-auto" />
            <h2 className="text-white font-bold text-lg mb-1">No Results for "{query}"</h2>
            <p className="text-[#8b90a0] text-xs mb-6">
              Check the spelling or try searching by chipset (e.g. "5090", "7800X3D", "DDR5", "OLED").
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/products" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs font-bold rounded">
                BROWSE ALL HARDWARE
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
