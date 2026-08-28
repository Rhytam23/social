import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Icon, Breadcrumbs, Button, EmptyState } from '../components/ui'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderService, type Order } from '../services/orderService'
import { paymentService } from '../services/paymentService'
import { addressService } from '../services/addressService'
import { config } from '../lib/config'

const STEPS = ['Customer', 'Shipping', 'Payment'] as const
type Step = (typeof STEPS)[number]

const inputClass =
  'w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)'
const labelClass = 'text-[11px] font-mono text-(--text-secondary) block mb-1 uppercase font-semibold'

// Stripe is loaded once, and only when a publishable key is configured.
const stripePromise: Promise<Stripe | null> | null = config.stripe.publishableKey
  ? loadStripe(config.stripe.publishableKey)
  : null

interface CheckoutForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

/** Stripe Elements payment step — confirms the PaymentIntent, then asks our server to verify it. */
function PaymentStep({
  order,
  paymentIntentId,
  onPaid,
  onFailed,
}: {
  order: Order
  paymentIntentId: string
  onPaid: (order: Order) => void
  onFailed: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Please check your payment details.')
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?orderId=${order.id}`,
      },
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment could not be completed.')
      setProcessing(false)
      onFailed(confirmError.message ?? 'Payment declined')
      return
    }

    // Payment status is never trusted from the browser — the server re-checks
    // it with Stripe (and the webhook confirms it independently).
    try {
      const result = await paymentService.verify(order.id, paymentIntentId)
      if (result.verified) {
        onPaid(result.order)
      } else {
        setError('Payment is still processing. You will receive confirmation once it settles.')
        setProcessing(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify payment')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-(--text-primary) font-bold text-base font-mono uppercase border-b border-(--border-theme) pb-3">
        Payment
      </h2>

      <div className="p-4 bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme)">
        <PaymentElement />
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {error}
        </div>
      )}

      <div className="flex items-start gap-2 text-[10px] font-mono text-(--text-secondary)">
        <Icon name="lock" size={14} className="text-(--color-stock-green) shrink-0 mt-0.5" />
        Card details are sent directly to Stripe and never touch our servers. The charged amount is calculated
        server-side from your order.
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={!stripe || processing}>
        {processing ? 'PROCESSING PAYMENT…' : `PAY $${order.total.toFixed(2)}`}
      </Button>
    </form>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, subtotal, itemCount, refresh: refreshCart } = useCart()
  const { user } = useAuth()

  const [stepIndex, setStepIndex] = useState(0)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [order, setOrder] = useState<Order | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [paymentUnavailable, setPaymentUnavailable] = useState(false)

  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  })

  // Prefill contact fields and saved shipping address from the signed-in account
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName,
      lastName: prev.lastName || user.lastName,
      email: prev.email || user.email,
      phone: prev.phone || (user.phone ?? ''),
    }))

    addressService.listAddresses().then((addresses) => {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr) {
        setForm((prev) => ({
          ...prev,
          street: prev.street || defaultAddr.street,
          city: prev.city || defaultAddr.city,
          state: prev.state || defaultAddr.state,
          zip: prev.zip || defaultAddr.zipCode,
          country: prev.country || defaultAddr.country || 'United States',
          phone: prev.phone || defaultAddr.phone || prev.phone,
        }))
      }
    }).catch(() => {})
  }, [user])

  const step: Step = STEPS[stepIndex]
  const items = cart?.items ?? []

  const set = (key: keyof CheckoutForm, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const stepValid = useMemo(() => {
    if (step === 'Customer') {
      return (
        form.firstName.trim().length > 0 &&
        form.lastName.trim().length > 0 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())
      )
    }
    if (step === 'Shipping') {
      return (
        form.street.trim().length > 0 &&
        form.city.trim().length > 0 &&
        form.state.trim().length > 0 &&
        form.zip.trim().length > 0
      )
    }
    return true
  }, [step, form])

  // Creates the real order, then opens a Stripe PaymentIntent for it.
  const startPayment = async () => {
    setSubmitting(true)
    setCheckoutError(null)
    setPaymentUnavailable(false)

    try {
      const created = await orderService.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        shippingStreet: form.street.trim(),
        shippingCity: form.city.trim(),
        shippingState: form.state.trim(),
        shippingZip: form.zip.trim(),
        shippingCountry: form.country.trim(),
        shippingMethod,
        paymentMethod: 'card',
        customerEmail: form.email.trim(),
        ...(form.phone.trim() ? { customerPhone: form.phone.trim() } : {}),
      })
      setOrder(created)

      const intent = await paymentService.createIntent(created.id)
      setClientSecret(intent.clientSecret)
      setPaymentIntentId(intent.paymentIntentId)
      setStepIndex(2)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      // 503 from the payment gateway means Stripe is not configured on the server.
      // Advance to the payment step regardless so the customer sees an explicit
      // explanation rather than a silently stalled form.
      if (/not configured|unconfigured|PAYMENT_UNCONFIGURED/i.test(message)) {
        setPaymentUnavailable(true)
        setStepIndex(2)
      } else {
        setCheckoutError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaid = async (paidOrder: Order) => {
    await refreshCart()
    navigate(`/checkout/confirmation?orderId=${paidOrder.id}`)
  }

  const handleFailed = (message: string) => {
    navigate(`/payment-failed?reason=${encodeURIComponent(message)}`)
  }

  // Empty cart — nothing to check out
  if (items.length === 0 && !order) {
    return (
      <main className="flex-1 w-full py-16 container-max px-4">
        <EmptyState
          icon="shopping_cart"
          title="Your cart is empty"
          message="Add items to your cart before checking out."
          action={
            <Link to="/products">
              <Button variant="primary" size="md">BROWSE PRODUCTS</Button>
            </Link>
          }
        />
      </main>
    )
  }

  const next = () => {
    if (stepIndex === 1) {
      void startPayment()
      return
    }
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
  }
  const back = () => setStepIndex((i) => Math.max(0, i - 1))

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
          className="mb-4"
        />
        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-6">Secure Checkout</h1>

        {/* Stepper */}
        <div className="flex items-center mb-8 overflow-x-auto scrollbar-none">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <button
                onClick={() => i < stepIndex && !order && setStepIndex(i)}
                className={`flex items-center gap-2 ${i < stepIndex && !order ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border transition-colors ${
                    i < stepIndex
                      ? 'bg-(--color-stock-green) border-(--color-stock-green) text-white'
                      : i === stepIndex
                        ? 'bg-(--accent-blue) border-(--accent-blue) text-white'
                        : 'bg-transparent border-(--border-theme) text-(--text-secondary)'
                  }`}
                >
                  {i < stepIndex ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    i <= stepIndex ? 'text-(--text-primary)' : 'text-(--text-secondary)'
                  } hidden sm:inline`}
                >
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-px mx-2 ${i < stepIndex ? 'bg-(--color-stock-green)' : 'bg-(--border-theme)'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Step panel */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              {step === 'Customer' && (
                <div className="space-y-4">
                  <h2 className="text-(--text-primary) font-bold text-base font-mono uppercase border-b border-(--border-theme) pb-3">
                    Contact Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="co-first">FIRST NAME</label>
                      <input id="co-first" required className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="co-last">LAST NAME</label>
                      <input id="co-last" required className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} htmlFor="co-email">EMAIL ADDRESS</label>
                      <input id="co-email" type="email" required className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="co-phone">PHONE NUMBER (OPTIONAL)</label>
                      <input id="co-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                    </div>
                  </div>
                  {!user && (
                    <p className="text-[11px] text-(--text-secondary)">
                      Checking out as a guest.{' '}
                      <Link to="/login?next=/checkout" className="text-(--accent-blue) hover:underline">
                        Sign in
                      </Link>{' '}
                      to save this order to your account.
                    </p>
                  )}
                </div>
              )}

              {step === 'Shipping' && (
                <div className="space-y-4">
                  <h2 className="text-(--text-primary) font-bold text-base font-mono uppercase border-b border-(--border-theme) pb-3">
                    Shipping Address
                  </h2>
                  <div>
                    <label className={labelClass} htmlFor="co-street">STREET ADDRESS</label>
                    <input id="co-street" required className={inputClass} value={form.street} onChange={(e) => set('street', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="co-city">CITY</label>
                      <input id="co-city" required className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="co-state">STATE</label>
                      <input id="co-state" required className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="co-zip">ZIP</label>
                      <input id="co-zip" required className={inputClass} value={form.zip} onChange={(e) => set('zip', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="co-country">COUNTRY</label>
                    <input id="co-country" required className={inputClass} value={form.country} onChange={(e) => set('country', e.target.value)} />
                  </div>

                  <div className="pt-2 space-y-3">
                    <span className="font-mono text-xs text-(--text-secondary) uppercase">Shipping Method</span>
                    {(
                      [
                        ['standard', 'Standard Ground (2–3 business days)'],
                        ['express', 'Priority Overnight Air'],
                      ] as const
                    ).map(([val, label]) => (
                      <label
                        key={val}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          shippingMethod === val
                            ? 'bg-(--accent-blue)/10 border-(--accent-blue)'
                            : 'bg-(--bg-surface-secondary) border-(--border-theme)'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ship"
                            checked={shippingMethod === val}
                            onChange={() => setShippingMethod(val)}
                            className="accent-(--accent-blue)"
                          />
                          <span className="text-(--text-primary) font-bold text-xs">{label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-(--text-secondary)">Priced at checkout</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 'Payment' && (
                <>
                  {paymentUnavailable ? (
                    <div className="p-6 bg-(--bg-surface) border border-(--accent-orange)/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Icon name="credit_card_off" size={24} className="text-(--accent-orange) shrink-0" />
                        <div>
                          <h2 className="text-(--text-primary) font-bold text-base mb-1">
                            Online payment is not available
                          </h2>
                          <p className="text-(--text-secondary) text-xs leading-relaxed">
                            Card payments are not configured for this store yet, so this order cannot be paid online.
                            Your order has not been charged and no payment was taken. Please contact support to
                            complete your purchase.
                          </p>
                          <Link to="/support" className="inline-block mt-3">
                            <Button variant="outline" size="md">CONTACT SUPPORT</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : order && clientSecret && paymentIntentId && stripePromise ? (
                    <Elements
                      stripe={stripePromise}
                      options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#007aff' } } }}
                    >
                      <PaymentStep
                        order={order}
                        paymentIntentId={paymentIntentId}
                        onPaid={(o) => void handlePaid(o)}
                        onFailed={handleFailed}
                      />
                    </Elements>
                  ) : (
                    <div className="p-6 bg-(--bg-surface) border border-(--border-theme) rounded-xl text-center">
                      <span className="font-mono text-xs text-(--text-secondary)">Preparing secure payment…</span>
                    </div>
                  )}
                </>
              )}

              {checkoutError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
                  {checkoutError}
                </div>
              )}

              {/* Nav buttons — hidden once payment has started */}
              {step !== 'Payment' && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-(--border-theme) font-sans">
                  <button
                    onClick={stepIndex === 0 ? () => navigate('/cart') : back}
                    className="px-4 py-2.5 border border-(--border-theme) hover:border-(--text-primary) text-(--text-primary) text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="arrow_back" size={15} /> {stepIndex === 0 ? 'Back to Cart' : 'Back'}
                  </button>
                  <Button variant="primary" size="lg" disabled={!stepValid || submitting} onClick={next}>
                    {submitting ? 'CREATING ORDER…' : stepIndex === 1 ? 'CONTINUE TO PAYMENT' : 'CONTINUE'}
                    <Icon name="arrow_forward" size={15} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-4 bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5">
              <h2 className="text-(--text-primary) font-bold text-sm font-mono uppercase border-b border-(--border-theme) pb-3">
                {order ? 'Order Summary' : 'Cart Summary'}
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(order ? order.items : items).map((item) => {
                  const name = 'productName' in item ? item.productName : ''
                  const qty = item.quantity
                  const line = 'lineTotal' in item ? item.lineTotal : item.price * item.quantity
                  const image = 'productImageUrl' in item ? item.productImageUrl : item.productImage
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) shrink-0"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) shrink-0 flex items-center justify-center">
                          <Icon name="memory" size={20} className="text-(--accent-blue)" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-(--text-primary) text-xs font-medium truncate block">{name}</span>
                        <span className="text-(--text-secondary) text-[10px] font-mono">Qty {qty}</span>
                      </div>
                      <span className="font-mono text-xs text-(--text-primary) shrink-0">${line.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>

              {/* Totals: server-computed once the order exists */}
              <div className="space-y-2 pt-3 border-t border-(--border-theme) font-mono text-xs">
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Subtotal</span>
                  <span className="text-(--text-primary)">${(order?.subtotal ?? subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Shipping</span>
                  <span className={order ? 'text-(--text-primary)' : 'text-(--text-secondary)'}>
                    {order ? (order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost.toFixed(2)}`) : 'At payment step'}
                  </span>
                </div>
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Tax</span>
                  <span className={order ? 'text-(--text-primary)' : 'text-(--text-secondary)'}>
                    {order ? `$${order.taxAmount.toFixed(2)}` : 'At payment step'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-(--border-theme) text-base font-bold text-(--text-primary)">
                  <span>TOTAL</span>
                  <span className="text-(--accent-blue)">
                    ${(order?.total ?? subtotal).toFixed(2)}
                  </span>
                </div>
                {!order && (
                  <p className="text-[10px] text-(--text-muted) pt-1 leading-relaxed">
                    Shipping and tax are calculated on our server when your order is created.
                  </p>
                )}
                {order && (
                  <p className="text-[10px] text-(--text-muted) pt-1 font-sans">
                    Order {order.orderNumber} · {itemCount} item{itemCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
