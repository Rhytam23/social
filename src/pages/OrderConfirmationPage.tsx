import { useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { PageSkeleton } from '../components/ui/SkeletonLoader'
import { useApi } from '../hooks/useApi'
import { orderService } from '../services/orderService'

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  // The order is always fetched by id — never falls back to another order.
  const orderFn = useCallback(
    () => (orderId ? orderService.getOrder(orderId) : Promise.resolve(null)),
    [orderId]
  )
  const { data: order, loading, error, reload } = useApi(orderFn, [orderId])

  if (loading) return <PageSkeleton />

  if (error || !order) {
    return (
      <main className="flex-1 w-full py-16 container-max px-4">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            icon="receipt_long"
            title="Order not found"
            message="We couldn't find this order. If you just placed it, check your email for the confirmation."
            action={
              <Link to="/products">
                <Button variant="primary" size="md">BROWSE HARDWARE</Button>
              </Link>
            }
          />
        )}
      </main>
    )
  }

  const isPaid = order.paymentStatus === 'paid'

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-8 max-w-3xl mx-auto">
        {/* Header reflects the real payment status */}
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              isPaid
                ? 'bg-(--color-stock-green)/15 text-(--color-stock-green) border-(--color-stock-green)/40'
                : 'bg-(--accent-orange)/15 text-(--accent-orange) border-(--accent-orange)/40'
            }`}
          >
            <Icon name={isPaid ? 'check_circle' : 'schedule'} size={38} filled />
          </div>
          <span
            className={`font-mono text-xs uppercase font-bold tracking-wider block mb-1 ${
              isPaid ? 'text-(--color-stock-green)' : 'text-(--accent-orange)'
            }`}
          >
            {isPaid ? 'Order Confirmed' : `Payment ${order.paymentStatus}`}
          </span>
          <h1 className="text-(--text-primary) font-bold text-2xl md:text-3xl tracking-tight mb-2">
            {isPaid ? 'Thank you for your order' : 'Your order has been created'}
          </h1>
          <p className="text-(--text-secondary) text-sm">
            Order{' '}
            <span className="text-(--accent-blue) font-mono font-bold">{order.orderNumber}</span>
            {isPaid
              ? ' is now being prepared. A confirmation email has been sent if email delivery is configured.'
              : ' has not been paid yet.'}
          </p>
        </div>

        {/* Order meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border-theme) border border-(--border-theme) rounded-xl overflow-hidden mb-6">
          {[
            { label: 'Order Number', value: order.orderNumber },
            { label: 'Order Total', value: `$${order.total.toFixed(2)}` },
            { label: 'Status', value: order.status.replace('_', ' ') },
            { label: 'Est. Delivery', value: order.estimatedDelivery ?? '—' },
          ].map((m) => (
            <div key={m.label} className="bg-(--bg-surface) p-4">
              <span className="font-mono text-[10px] text-(--text-secondary) uppercase block mb-1">{m.label}</span>
              <span className="text-(--text-primary) text-sm font-bold break-words capitalize">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl overflow-hidden mb-6">
          <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) font-mono text-xs text-(--text-secondary) font-semibold uppercase">
            Order Items ({order.items.length})
          </div>
          <div className="divide-y divide-(--border-theme)">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                {item.productImageUrl ? (
                  <img
                    src={item.productImageUrl}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg bg-(--bg-surface-secondary) shrink-0"
                  />
                ) : (
                  <span className="w-14 h-14 rounded-lg bg-(--bg-surface-secondary) shrink-0 flex items-center justify-center">
                    <Icon name="memory" size={22} className="text-(--accent-blue)" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-(--text-primary) text-xs font-bold truncate">{item.productName}</h3>
                  <span className="font-mono text-[10px] text-(--text-secondary)">
                    SKU {item.productSku} · Qty {item.quantity}
                  </span>
                </div>
                <span className="font-mono text-(--text-primary) font-bold text-sm shrink-0">
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-(--bg-surface-secondary) border-t border-(--border-theme) space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-(--text-secondary)">
              <span>Subtotal</span>
              <span className="text-(--text-primary)">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-(--text-secondary)">
              <span>Shipping</span>
              <span className={order.shippingCost === 0 ? 'text-(--color-stock-green)' : 'text-(--text-primary)'}>
                {order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-(--text-secondary)">
              <span>Tax</span>
              <span className="text-(--text-primary)">${order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-(--text-primary) pt-2 border-t border-(--border-theme)">
              <span>Total</span>
              <span className="text-(--accent-blue)">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-5 mb-8">
          <h2 className="font-mono text-xs font-bold text-(--text-primary) uppercase mb-3 flex items-center gap-1.5">
            <Icon name="local_shipping" size={16} className="text-(--accent-blue)" /> Shipping To
          </h2>
          <div className="text-xs font-mono text-(--text-secondary) leading-relaxed">
            <strong className="text-(--text-primary) block text-sm">{order.shippingName}</strong>
            <p>{order.shippingStreet}</p>
            <p>
              {order.shippingCity}, {order.shippingState} {order.shippingZip}
            </p>
            <p>{order.shippingCountry}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}>
            <Button variant="primary" size="lg">
              <Icon name="local_shipping" size={16} /> TRACK YOUR ORDER
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="lg">CONTINUE SHOPPING</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
