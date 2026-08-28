import { Link, useNavigate } from 'react-router-dom'
import { Icon, EmptyState, Button, StockBadge } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { useCart } from '../context/CartContext'
import { config } from '../lib/config'

export function CartPage() {
  const navigate = useNavigate()
  const { cart, loading, error, refresh, updateItem, removeItem, clearCart, subtotal, itemCount } = useCart()

  const freeShippingThreshold = config.app.freeShippingThreshold
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100)
  const items = cart?.items ?? []

  if (loading && !cart) {
    return (
      <main className="flex-1 w-full py-16 container-max px-4">
        <div className="h-64 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
      </main>
    )
  }

  if (error && !cart) {
    return (
      <main className="flex-1 w-full py-16 container-max px-4">
        <ErrorState message={error} onRetry={() => void refresh()} />
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="flex-1 w-full py-16 flex items-center justify-center">
        <div className="container-max px-4 max-w-[520px] w-full mx-auto">
          <EmptyState
            icon="shopping_cart"
            title="Your shopping cart is empty"
            message="You don't have any items added to your bag yet."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/products">
                  <Button variant="primary" size="md">BROWSE PRODUCTS</Button>
                </Link>
                <Link to="/builder">
                  <Button variant="outline" size="md">PC BUILDER</Button>
                </Link>
              </div>
            }
          />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <nav className="flex items-center gap-2 text-xs text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-(--text-primary) font-medium">Shopping Cart ({itemCount})</span>
        </nav>

        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-6">Shopping Cart</h1>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Free shipping progress — threshold matches the server's business rules */}
        <div className="p-0 mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-(--text-primary) flex items-center gap-1.5 font-medium">
              <Icon name="local_shipping" size={16} className="text-(--accent-blue)" />
              {subtotal >= freeShippingThreshold ? (
                <span className="text-emerald-500 font-semibold">Your order qualifies for free standard shipping</span>
              ) : (
                <span>Add ${(freeShippingThreshold - subtotal).toFixed(2)} more for free standard shipping</span>
              )}
            </span>
            <span className="text-(--text-secondary)">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full bg-(--bg-surface-secondary) h-1.5 rounded-full overflow-hidden">
            <div className="bg-(--accent-blue) h-full transition-all duration-300" style={{ width: `${freeShippingProgress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="overflow-hidden">
              <div className="p-4 flex items-center justify-between font-mono text-xs text-(--text-secondary) font-semibold border-b border-(--border-theme)">
                <span>PRODUCT DETAILS</span>
                <span className="hidden sm:inline">ITEM PRICE &amp; QTY</span>
              </div>

              <div className="divide-y divide-(--border-theme)">
                {items.map((item) => {
                  const atStockLimit = item.quantity >= item.stockAvailable
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Link to={`/products/${item.productSlug}`} className="shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme)"
                            />
                          ) : (
                            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) flex items-center justify-center">
                              <Icon name="memory" size={28} className="text-(--accent-blue)" />
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-bold">
                            SKU {item.sku}
                          </span>
                          <Link to={`/products/${item.productSlug}`} className="block">
                            <h3 className="text-(--text-primary) font-bold text-sm leading-snug hover:text-(--accent-blue) transition-colors truncate max-w-md">
                              {item.productName}
                            </h3>
                          </Link>
                          {/* Real stock state from the API */}
                          <div className="mt-1">
                            <StockBadge status={item.stockStatus} />
                          </div>
                          {item.quantity > item.stockAvailable && (
                            <p className="text-[10px] font-mono text-rose-500 mt-1">
                              Only {item.stockAvailable} available — reduce the quantity to continue.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0">
                        <div className="flex items-center border border-(--border-theme) rounded-lg bg-(--bg-surface-secondary) px-2 py-1">
                          <button
                            type="button"
                            onClick={() => void updateItem(item.productId, item.quantity - 1)}
                            className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Icon name="remove" size={14} />
                          </button>
                          <span className="font-mono text-xs px-3 font-bold text-(--text-primary)">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => void updateItem(item.productId, item.quantity + 1)}
                            disabled={atStockLimit}
                            className="text-(--text-secondary) hover:text-(--text-primary) p-0.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Icon name="add" size={14} />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-(--text-primary) font-bold font-mono text-sm block">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] font-mono text-(--text-secondary) block">
                              ${item.price.toFixed(2)} ea
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => void removeItem(item.productId)}
                          className="text-(--text-secondary) hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                to="/products"
                className="font-mono text-xs text-(--accent-blue) hover:text-(--text-primary) flex items-center gap-1"
              >
                <Icon name="arrow_back" size={14} /> CONTINUE SHOPPING
              </Link>
              <button
                type="button"
                onClick={() => void clearCart()}
                className="font-mono text-xs text-(--text-secondary) hover:text-rose-500 transition-colors cursor-pointer"
              >
                CLEAR CART
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <h2 className="text-(--text-primary) font-bold text-base font-mono uppercase border-b border-(--border-theme) pb-3">
                ORDER SUMMARY
              </h2>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Items ({itemCount}):</span>
                  <span className="text-(--text-primary)">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Shipping:</span>
                  <span className="text-(--text-secondary)">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Tax:</span>
                  <span className="text-(--text-secondary)">Calculated at checkout</span>
                </div>

                <div className="pt-3 border-t border-(--border-theme) flex justify-between text-base font-bold text-(--text-primary)">
                  <span>SUBTOTAL:</span>
                  <span className="text-(--accent-blue)">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/checkout')}
                className="mt-4"
              >
                Proceed to Checkout
                <Icon name="arrow_forward" size={16} />
              </Button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-(--text-secondary) flex items-center justify-center gap-1">
                  <Icon name="lock" size={12} /> Final totals are calculated on our server at checkout
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
