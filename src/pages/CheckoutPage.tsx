import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Breadcrumbs } from '../components/ui'
import { useShop } from '../context/ShopContext'
import type { Order } from '../types'

const STEPS = ['Customer', 'Shipping', 'Payment', 'Review'] as const
type Step = (typeof STEPS)[number]

const inputClass = 'w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff]'
const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, cartSubtotal, clearCart, placeOrder } = useShop()

  const [stepIndex, setStepIndex] = useState(0)
  const step: Step = STEPS[stepIndex]
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card')

  const [form, setForm] = useState({
    firstName: 'Alex', lastName: 'Rider', email: 'alex.rider@example.com', phone: '+1 (555) 234-5678',
    street: '742 Evergreen Terrace', city: 'Springfield', state: 'OR', zip: '97477', country: 'United States',
    cardNumber: '•••• •••• •••• 4242', cardExp: '12/28', cardCvc: '•••',
  })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const shippingCost = shippingMethod === 'express' ? 19.99 : 0
  const tax = cartSubtotal * 0.08
  const total = cartSubtotal + shippingCost + tax

  if (cart.length === 0) {
    return (
      <main className="flex-1 w-full py-16 text-center container-max px-4">
        <Icon name="shopping_cart_off" size={48} className="text-[#8b90a0] mb-4 mx-auto" />
        <h1 className="text-white font-bold text-2xl mb-3">No Items to Checkout</h1>
        <p className="text-[#8b90a0] mb-6">Your shopping bag is currently empty.</p>
        <Link to="/products" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block">BROWSE HARDWARE</Link>
      </main>
    )
  }

  const next = () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  const back = () => setStepIndex((i) => Math.max(0, i - 1))

  const placeFinalOrder = () => {
    const id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    const tracking = `TRK-PC-${Math.floor(10000000 + Math.random() * 90000000)}`
    const now = new Date()
    const order: Order = {
      id,
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'Processing',
      trackingNumber: tracking,
      estimatedDelivery: shippingMethod === 'express' ? 'Next business day' : '2–3 business days',
      items: cart,
      subtotal: cartSubtotal,
      shipping: shippingCost,
      tax,
      total,
      shippingAddress: {
        name: `${form.firstName} ${form.lastName}`, street: form.street, city: form.city,
        state: form.state, zip: form.zip, country: form.country,
      },
      customerName: `${form.firstName} ${form.lastName}`,
      customerEmail: form.email,
      paymentMethod: paymentMethod === 'card' ? `Card ${form.cardNumber.slice(-4)}` : paymentMethod === 'paypal' ? 'PayPal' : 'Crypto (BTC/ETH)',
      paymentStatus: 'Paid',
      timeline: [
        { status: 'Processing', date: 'Just now', completed: true, description: 'Order received and payment authorized' },
        { status: 'Assembling', date: 'Pending', completed: false, description: 'Components allocated from warehouse' },
        { status: 'Quality Check', date: 'Pending', completed: false, description: '72-hour burn-in verification' },
        { status: 'Shipped', date: 'Pending', completed: false, description: 'Handed to courier' },
        { status: 'Delivered', date: 'Pending', completed: false, description: 'Delivered to address' },
      ],
    }
    placeOrder(order)
    clearCart()
    navigate('/checkout/confirmation', { state: { orderId: id } })
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} className="mb-4" />
        <h1 className="text-white font-bold text-2xl tracking-tight mb-6">Secure Checkout</h1>

        {/* Stepper */}
        <div className="flex items-center mb-8 overflow-x-auto scrollbar-none">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <button
                onClick={() => i < stepIndex && setStepIndex(i)}
                className={`flex items-center gap-2 ${i <= stepIndex ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border transition-colors ${
                  i < stepIndex ? 'bg-[#30d158] border-[#30d158] text-[#0d0e12]'
                    : i === stepIndex ? 'bg-[#007aff] border-[#007aff] text-white'
                    : 'bg-transparent border-[#414755] text-[#8b90a0]'
                }`}>
                  {i < stepIndex ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <span className={`font-mono text-[11px] uppercase tracking-wider ${i <= stepIndex ? 'text-white' : 'text-[#8b90a0]'} hidden sm:inline`}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-px mx-2 ${i < stepIndex ? 'bg-[#30d158]' : 'bg-[#414755]'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Step panel */}
          <div className="lg:col-span-7">
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
              {step === 'Customer' && (
                <div className="space-y-4">
                  <h2 className="text-white font-bold text-base font-mono uppercase border-b border-[#292a2e] pb-3">Contact Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelClass}>FIRST NAME</label><input className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
                    <div><label className={labelClass}>LAST NAME</label><input className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelClass}>EMAIL ADDRESS</label><input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                    <div><label className={labelClass}>PHONE NUMBER</label><input type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
                  </div>
                </div>
              )}

              {step === 'Shipping' && (
                <div className="space-y-4">
                  <h2 className="text-white font-bold text-base font-mono uppercase border-b border-[#292a2e] pb-3">Shipping Address</h2>
                  <div><label className={labelClass}>STREET ADDRESS</label><input className={inputClass} value={form.street} onChange={(e) => set('street', e.target.value)} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelClass}>CITY</label><input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
                    <div><label className={labelClass}>STATE</label><input className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
                    <div><label className={labelClass}>ZIP</label><input className={inputClass} value={form.zip} onChange={(e) => set('zip', e.target.value)} /></div>
                  </div>
                  <div className="pt-2 space-y-3">
                    <span className="font-mono text-xs text-[#8b90a0] uppercase">Shipping Method</span>
                    {([['standard', 'Standard Ground (2–3 days)', 'FREE'], ['express', 'Priority Overnight Air', '$19.99']] as const).map(([val, label, price]) => (
                      <label key={val} className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${shippingMethod === val ? 'bg-[#007aff10] border-[#007aff]' : 'bg-[#121317] border-[#292a2e]'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="ship" checked={shippingMethod === val} onChange={() => setShippingMethod(val)} className="accent-[#007aff]" />
                          <span className="text-white font-bold text-xs">{label}</span>
                        </div>
                        <span className={`font-mono text-xs font-bold ${price === 'FREE' ? 'text-[#30d158]' : 'text-white'}`}>{price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 'Payment' && (
                <div className="space-y-4">
                  <h2 className="text-white font-bold text-base font-mono uppercase border-b border-[#292a2e] pb-3">Payment Method</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {([['card', 'CREDIT CARD', 'credit_card'], ['paypal', 'PAYPAL', 'account_balance_wallet'], ['crypto', 'CRYPTO', 'currency_bitcoin']] as const).map(([val, label, icon]) => (
                      <button key={val} type="button" onClick={() => setPaymentMethod(val)} className={`p-3 rounded border font-mono text-[10px] flex flex-col items-center gap-1.5 transition-colors ${paymentMethod === val ? 'bg-[#007aff20] border-[#007aff] text-white' : 'bg-[#121317] border-[#292a2e] text-[#8b90a0]'}`}>
                        <Icon name={icon} size={20} /><span>{label}</span>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="p-4 bg-[#121317] rounded border border-[#292a2e] space-y-3">
                      <div><label className={labelClass}>CARD NUMBER</label><input className={inputClass} value={form.cardNumber} onChange={(e) => set('cardNumber', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>EXPIRATION</label><input className={inputClass} value={form.cardExp} onChange={(e) => set('cardExp', e.target.value)} /></div>
                        <div><label className={labelClass}>CVC</label><input className={inputClass} value={form.cardCvc} onChange={(e) => set('cardCvc', e.target.value)} /></div>
                      </div>
                    </div>
                  )}
                  {paymentMethod !== 'card' && (
                    <div className="p-4 bg-[#121317] rounded border border-[#292a2e] text-xs text-[#8b90a0] font-mono">
                      You will be redirected to {paymentMethod === 'paypal' ? 'PayPal' : 'the crypto gateway'} to complete payment securely. (Demo — no real payment.)
                    </div>
                  )}
                </div>
              )}

              {step === 'Review' && (
                <div className="space-y-4">
                  <h2 className="text-white font-bold text-base font-mono uppercase border-b border-[#292a2e] pb-3">Review & Confirm</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#121317] rounded border border-[#292a2e] p-3">
                      <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-1">Contact</span>
                      <p className="text-white">{form.firstName} {form.lastName}</p>
                      <p className="text-[#8b90a0]">{form.email}</p>
                      <p className="text-[#8b90a0]">{form.phone}</p>
                    </div>
                    <div className="bg-[#121317] rounded border border-[#292a2e] p-3">
                      <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-1">Ship To</span>
                      <p className="text-white">{form.street}</p>
                      <p className="text-[#8b90a0]">{form.city}, {form.state} {form.zip}</p>
                      <p className="text-[#8b90a0]">{shippingMethod === 'express' ? 'Priority Overnight' : 'Standard Ground'}</p>
                    </div>
                    <div className="bg-[#121317] rounded border border-[#292a2e] p-3 sm:col-span-2">
                      <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-1">Payment</span>
                      <p className="text-white capitalize">{paymentMethod === 'card' ? `Credit Card ${form.cardNumber.slice(-4)}` : paymentMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[10px] font-mono text-[#8b90a0] pt-2">
                    <Icon name="lock" size={14} className="text-[#30d158] shrink-0 mt-0.5" />
                    By placing this order you authorize PREMIUM PC to charge your selected payment method. This is a frontend demo — no real payment is processed.
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#292a2e]">
                <button
                  onClick={stepIndex === 0 ? () => navigate('/cart') : back}
                  className="px-4 py-2.5 border border-[#414755] hover:border-white text-white font-mono text-xs rounded transition-colors flex items-center gap-1.5"
                >
                  <Icon name="arrow_back" size={15} /> {stepIndex === 0 ? 'BACK TO CART' : 'BACK'}
                </button>
                {step !== 'Review' ? (
                  <button onClick={next} className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
                    CONTINUE <Icon name="arrow_forward" size={15} />
                  </button>
                ) : (
                  <button onClick={placeFinalOrder} className="px-5 py-2.5 bg-[#30d158] hover:bg-[#28b84c] text-[#0d0e12] font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
                    <Icon name="lock" size={15} /> PLACE ORDER (${total.toFixed(2)})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-5">
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-6 sticky top-24 space-y-4">
              <h2 className="text-white font-bold text-base font-mono uppercase border-b border-[#292a2e] pb-3">Order Summary ({cart.length})</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded bg-[#121317] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-white font-medium truncate block">{product.name}</span>
                        <span className="font-mono text-[#8b90a0] text-[10px]">Qty: {quantity}</span>
                      </div>
                    </div>
                    <span className="font-mono text-white font-bold shrink-0">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-[#292a2e] text-xs font-mono">
                <div className="flex justify-between text-[#8b90a0]"><span>Subtotal</span><span className="text-white">${cartSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[#8b90a0]"><span>Shipping</span><span className={shippingCost === 0 ? 'text-[#30d158]' : 'text-white'}>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-[#8b90a0]"><span>Tax (8%)</span><span className="text-white">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#292a2e]"><span>Total</span><span className="text-[#007aff]">${total.toFixed(2)}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
