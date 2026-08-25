import { Link } from 'react-router-dom'
import { Icon, Price, Button } from '../components/ui'
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
        <div className="w-20 h-20 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-full flex items-center justify-center mx-auto mb-4 text-(--text-secondary)">
          <Icon name="favorite_border" size={36} />
        </div>
        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-2">Your Wishlist is Empty</h1>
        <p className="text-(--text-secondary) text-sm max-w-sm mx-auto mb-6">
          Save your favorite GPUs, processors, and custom rigs by clicking the heart icon on any product card.
        </p>
        <Link to="/products">
          <Button variant="primary" size="lg">
            Discover Hardware
          </Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-theme) mb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-1">
              <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
              <Icon name="chevron_right" size={12} />
              <span className="text-(--accent-blue)">SAVED HARDWARE</span>
            </nav>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">
              My Saved Hardware ({wishlistCount} items)
            </h1>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleAddAllToCart}
            className="self-start sm:self-auto"
          >
            <Icon name="add_shopping_cart" size={16} /> Move All to Cart
          </Button>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlistedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-(--bg-surface) border border-(--border-theme) hover:border-(--text-secondary) rounded-xl overflow-hidden flex flex-col justify-between p-4 transition-all group"
            >
              <div>
                <div className="relative bg-(--bg-surface-secondary) rounded-lg overflow-hidden mb-3 aspect-[4/3]">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 p-1.5 bg-(--bg-surface)/80 border border-(--border-theme) text-rose-500 rounded-md hover:scale-110 transition-transform cursor-pointer"
                    aria-label="Remove from wishlist"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>

                <span className="font-mono text-[10px] text-(--accent-blue) uppercase font-bold block mb-1">{product.brand}</span>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-(--text-primary) font-bold text-sm leading-snug hover:text-(--accent-blue) transition-colors line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>
              </div>

              <div className="pt-3 border-t border-(--border-theme) flex items-center justify-between gap-2 mt-4">
                <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="sm" />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addToCart(product, 1)}
                >
                  <Icon name="shopping_cart" size={14} /> Add
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
