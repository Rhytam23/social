import { Link } from 'react-router-dom'
import { Icon, Price } from '../components/ui'
import { allProducts, gamingPCsData } from '../data'
import { useShop } from '../context/ShopContext'

export function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, wishlistCount } = useShop()

  const combinedCatalog = [...allProducts, ...gamingPCsData]
  const wishlistedProducts = combinedCatalog.filter((p) => wishlist.has(p.id))

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach((p) => addToCart(p, 1))
  }

  if (wishlistCount === 0 || wishlistedProducts.length === 0) {
    return (
      <main className="flex-1 w-full py-16 text-center container-max px-4">
        <div className="w-20 h-20 bg-[#1a1b1f] border border-[#414755] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8b90a0]">
          <Icon name="favorite_border" size={36} />
        </div>
        <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Your Wishlist is Empty</h1>
        <p className="text-[#8b90a0] text-sm max-w-sm mx-auto mb-6">
          Save your favorite GPUs, processors, and custom rigs by clicking the heart icon on any product card.
        </p>
        <Link to="/products" className="px-6 py-2.5 bg-[#007aff] text-white font-mono text-xs font-bold rounded">
          DISCOVER HARDWARE
        </Link>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292a2e] mb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-1">
              <Link to="/" className="hover:text-white">HOME</Link>
              <Icon name="chevron_right" size={12} />
              <span className="text-[#adc6ff]">SAVED HARDWARE</span>
            </nav>
            <h1 className="text-white font-bold text-2xl tracking-tight">
              My Saved Hardware ({wishlistCount} items)
            </h1>
          </div>

          <button
            type="button"
            onClick={handleAddAllToCart}
            className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-lg self-start sm:self-auto"
          >
            <Icon name="add_shopping_cart" size={16} /> MOVE ALL TO CART
          </button>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlistedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#1a1b1f] border border-[#414755] hover:border-[#8b90a0] rounded overflow-hidden flex flex-col justify-between p-4 transition-all group"
            >
              <div>
                <div className="relative bg-[#121317] rounded overflow-hidden mb-3 aspect-[4/3]">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 p-1 bg-[#12131790] border border-[#414755] text-[#ff453a] rounded hover:scale-110 transition-transform"
                    aria-label="Remove from wishlist"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>

                <span className="font-mono text-[10px] text-[#007aff] uppercase font-bold block mb-1">{product.brand}</span>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-white font-bold text-sm leading-snug hover:text-[#adc6ff] transition-colors line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>
              </div>

              <div className="pt-3 border-t border-[#292a2e] flex items-center justify-between gap-2 mt-4">
                <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="px-3 py-1.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <Icon name="shopping_cart" size={12} /> ADD
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
