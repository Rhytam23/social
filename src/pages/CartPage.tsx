import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { useShop } from '../context/ShopContext'


export function CartPage() {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, clearCart, cartSubtotal, cartCount } = useShop()

  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null)
  const [promoError, setPromoError] = useState('')

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    setPromoError('')
    if (promoCode.toUpperCase() === 'HARDWARE10' || promoCode.toUpperCase() === 'APEX10') {
      setAppliedPromo({ code: promoCode.toUpperCase(), discountPercent: 10 })
      setPromoCode('')
    } else {
      setPromoError('Invalid promo code. Try "HARDWARE10" for 10% off.')
    }
  }

  const discountAmount = appliedPromo ? (cartSubtotal * appliedPromo.discountPercent) / 100 : 0
  const shipping = cartSubtotal > 99 || cartSubtotal === 0 ? 0 : 15.00
  const estimatedTax = (cartSubtotal - discountAmount) * 0.08
  const finalTotal = cartSubtotal - discountAmount + shipping + estimatedTax

  const freeShippingThreshold = 99
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)

  if (cart.length === 0) {
    return (
      <main className="flex-1 w-full py-16 flex items-center justify-center">
        <div className="container-max px-4 text-center flex flex-col items-center justify-center max-w-[500px] w-full mx-auto">
          <div className="w-16 h-16 bg-(--bg-surface) border border-(--border-theme) rounded-full flex items-center justify-center mb-4 text-(--accent-blue)">
            <Icon name="shopping_cart" size={32} />
          </div>
          <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-2">Your Shopping Cart is Empty</h1>
          <p className="text-(--text-secondary) text-sm max-w-[400px] w-full mx-auto leading-relaxed mb-6">
            You don't have any items added to your bag yet.
          </p>
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <Link
              to="/products"
              className="px-5 py-2.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg transition-all"
            >
              Browse Products
            </Link>
            <Link
              to="/builder"
              className="px-5 py-2.5 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) text-(--text-primary) text-xs font-semibold rounded-lg transition-all"
            >
              PC Builder
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-(--text-primary) font-medium">Shopping Cart ({cartCount})</span>
        </nav>

        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-6">Shopping Cart</h1>

        {/* Free Shipping Progress Meter */}
        <div className="p-0 mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-(--text-primary) flex items-center gap-1.5 font-medium">
              <Icon name="local_shipping" size={16} className="text-(--accent-blue)" />
              {cartSubtotal >= freeShippingThreshold ? (
                <span className="text-emerald-500 font-semibold">You qualify for free express shipping!</span>
              ) : (
                <span>Add ${(freeShippingThreshold - cartSubtotal).toFixed(2)} more for FREE SHIPPING</span>
              )}
            </span>
            <span className="text-(--text-secondary)">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full bg-(--bg-surface-secondary) h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-(--accent-blue) h-full transition-all duration-300"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Main Grid: Cart Items (8 cols) + Order Summary (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Cart Items Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="overflow-hidden">
              <div className="p-4 flex items-center justify-between font-mono text-xs text-(--text-secondary) font-semibold border-b border-(--border-theme)">
                <span>PRODUCT DETAILS</span>
                <span className="hidden sm:inline">ITEM PRICE & QTY</span>
              </div>

              <div className="divide-y divide-(--border-theme)">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Product info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Link to={`/products/${product.slug}`} className="shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded bg-(--bg-surface-secondary) border border-(--border-theme)"
                        />
                      </Link>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#007aff] uppercase font-bold">{product.brand}</span>
                        <Link to={`/products/${product.slug}`} className="block">
                          <h3 className="text-(--text-primary) font-bold text-sm leading-snug hover:text-(--accent-blue) transition-colors truncate max-w-md">
                            {product.name}
                          </h3>
                        </Link>
                        <span className="text-[11px] font-mono text-(--color-stock-green) block mt-0.5">In Stock · Official Warranty</span>
                      </div>
                    </div>

                    {/* Quantity & Pricing */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0">
                      {/* Quantity Modifier */}
                      <div className="flex items-center border border-(--border-theme) rounded bg-(--bg-surface-secondary) px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="text-(--text-secondary) hover:text-(--text-primary) p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Icon name="remove" size={14} />
                        </button>
                        <span className="font-mono text-xs px-3 font-bold text-(--text-primary)">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="text-(--text-secondary) hover:text-(--text-primary) p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Icon name="add" size={14} />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <div className="text-right">
                        <span className="text-(--text-primary) font-bold font-mono text-sm block">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                        {quantity > 1 && (
                          <span className="text-[10px] font-mono text-[#8b90a0] block">
                            ${product.price.toFixed(2)} ea
                          </span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="text-(--text-secondary) hover:text-rose-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Cart Button */}
            <div className="flex justify-between items-center pt-2">
              <Link to="/products" className="font-mono text-xs text-(--accent-blue) hover:text-(--text-primary) flex items-center gap-1">
                <Icon name="arrow_back" size={14} /> CONTINUE SHOPPING
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="font-mono text-xs text-(--text-secondary) hover:text-rose-500 transition-colors"
              >
                CLEAR CART
              </button>
            </div>
          </div>

          {/* Order Summary Box (4 cols) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <h2 className="text-(--text-primary) font-bold text-base font-mono uppercase border-b border-(--border-theme) pb-3">
                ORDER SUMMARY
              </h2>

              {/* Pricing Breakdown */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Items Subtotal:</span>
                  <span className="text-(--text-primary)">${cartSubtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-[#30d158]">
                    <span>Discount ({appliedPromo.code} -{appliedPromo.discountPercent}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-(--text-secondary)">
                  <span>Estimated Shipping:</span>
                  <span className={shipping === 0 ? 'text-(--color-stock-green)' : 'text-(--text-primary)'}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-(--text-secondary)">
                  <span>Estimated Sales Tax (8%):</span>
                  <span className="text-(--text-primary)">${estimatedTax.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-(--border-theme) flex justify-between text-base font-bold text-(--text-primary)">
                  <span>ORDER TOTAL:</span>
                  <span className="text-(--accent-blue)">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Code Box */}
              <form onSubmit={handleApplyPromo} className="pt-2 font-sans">
                <label className="text-[11px] font-mono text-(--text-secondary) block mb-1.5 uppercase font-semibold">Promo Code / Coupon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. HARDWARE10"
                    className="flex-1 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl px-3 py-2 text-xs text-(--text-primary) font-mono uppercase focus:outline-none focus:border-(--accent-blue)"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-(--bg-surface-secondary) hover:bg-(--bg-surface-tertiary) border border-(--border-theme) text-(--text-primary) font-sans text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-rose-500 text-[10px] font-mono mt-1">{promoError}</p>}
                {appliedPromo && <p className="text-[#30d158] text-[10px] font-mono mt-1">✓ Promo applied successfully!</p>}
              </form>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-sans text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-4 cursor-pointer"
              >
                Proceed to Checkout
                <Icon name="arrow_forward" size={16} />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-mono text-(--text-secondary) flex items-center justify-center gap-1">
                  <Icon name="lock" size={12} /> Guaranteed Safe & Secure 256-Bit SSL Checkout
                </span>
              </div>
            </div>
          </aside>

        </div>

      </div>
    </main>
  )
}
