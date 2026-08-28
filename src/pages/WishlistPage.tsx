import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Price, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductCardSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useShop } from '../context/ShopContext'
import { productService } from '../services/productService'

export function WishlistPage() {
  const { wishlistIds, wishlistCount, toggleWishlist } = useWishlist()
  const { addItem } = useCart()
  const { showToast } = useShop()
  const [busy, setBusy] = useState(false)

  // Wishlist stores product ids; the products themselves always come from the API.
  const productsFn = useCallback(
    () =>
      wishlistIds.length
        ? productService.list({ ids: wishlistIds, limit: 100 })
        : Promise.resolve(null),
    [wishlistIds]
  )
  const { data, loading, error, reload } = useApi(productsFn, [wishlistIds.join(',')])

  const products = data?.data ?? []

  const handleAddAll = async () => {
    setBusy(true)
    let added = 0
    for (const p of products) {
      if (p.stockStatus === 'out-of-stock') continue
      try {
        await addItem(p.id, 1)
        added++
      } catch {
        // Skip items the server rejects; continue with the rest.
      }
    }
    setBusy(false)
    showToast(added > 0 ? `Added ${added} item${added === 1 ? '' : 's'} to cart` : 'No items could be added', 'cart')
  }

  if (wishlistCount === 0) {
    return (
      <main className="flex-1 w-full py-16 container-max px-4">
        <EmptyState
          icon="favorite_border"
          title="Your wishlist is empty"
          message="Save your favorite GPUs, processors, and custom rigs by clicking the heart icon on any product."
          action={
            <Link to="/products">
              <Button variant="primary" size="lg">DISCOVER HARDWARE</Button>
            </Link>
          }
        />
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-theme) mb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-1">
              <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
              <Icon name="chevron_right" size={12} />
              <span className="text-(--accent-blue)">SAVED HARDWARE</span>
            </nav>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">
              My Saved Hardware ({wishlistCount} item{wishlistCount === 1 ? '' : 's'})
            </h1>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={busy || products.length === 0}
            onClick={() => void handleAddAll()}
            className="self-start sm:self-auto"
          >
            <Icon name="add_shopping_cart" size={16} /> {busy ? 'ADDING…' : 'MOVE ALL TO CART'}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: Math.min(4, wishlistCount) }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title="Saved items are unavailable"
            message="The products on your wishlist are no longer published."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-(--bg-surface) border border-(--border-theme) hover:border-(--text-secondary) rounded-xl overflow-hidden flex flex-col justify-between p-4 transition-all group"
              >
                <div>
                  <div className="relative bg-(--bg-surface-secondary) rounded-lg overflow-hidden mb-3 aspect-[4/3]">
                    {product.primaryImage ? (
                      <img src={product.primaryImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="memory" size={32} className="text-(--accent-blue)/40" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => void toggleWishlist(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-(--bg-surface)/80 border border-(--border-theme) text-rose-500 rounded-md hover:scale-110 transition-transform cursor-pointer"
                      aria-label="Remove from wishlist"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>

                  <span className="font-mono text-[10px] text-(--accent-blue) uppercase font-bold block mb-1">
                    {product.brandName}
                  </span>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-(--text-primary) font-bold text-sm leading-snug hover:text-(--accent-blue) transition-colors line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                  </Link>
                </div>

                <div className="pt-3 border-t border-(--border-theme) flex items-center justify-between gap-2 mt-4">
                  <Price
                    price={product.price}
                    previousPrice={product.previousPrice ?? undefined}
                    discount={product.discountPercent || undefined}
                    size="sm"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={product.stockStatus === 'out-of-stock'}
                    onClick={async () => {
                      try {
                        await addItem(product.id, 1)
                        showToast('Added to cart', 'cart')
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
                      }
                    }}
                  >
                    <Icon name="shopping_cart" size={14} /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
