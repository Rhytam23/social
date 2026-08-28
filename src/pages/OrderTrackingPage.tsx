import { useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon, Button, EmptyState } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { orderService } from '../services/orderService'

const STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  assembling: 'Assembling',
  quality_check: 'Quality check',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function OrderTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeOrderNumber = searchParams.get('order') ?? ''
  const [inputOrderNumber, setInputOrderNumber] = useState(activeOrderNumber)

  // Real lookup by order number — no order number, no timeline.
  const trackFn = useCallback(
    () => (activeOrderNumber ? orderService.trackOrder(activeOrderNumber) : Promise.resolve(null)),
    [activeOrderNumber]
  )
  const { data: order, loading, error } = useApi(trackFn, [activeOrderNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputOrderNumber.trim()
    if (!trimmed) return
    setSearchParams({ order: trimmed })
  }

  const timeline = order?.timeline ?? []
  const isCancelled = order?.status === 'cancelled'

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-(--accent-blue)">ORDER TRACKING</span>
        </nav>

        <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight mb-2">Order Tracking</h1>
        <p className="text-(--text-secondary) text-xs mb-6">
          Enter your order number to see its current status and history.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 p-4 bg-(--bg-surface) border border-(--border-theme) rounded-xl mb-8"
        >
          <input
            type="text"
            value={inputOrderNumber}
            onChange={(e) => setInputOrderNumber(e.target.value)}
            placeholder="Enter your order number (e.g. ORD-XXXXX-XXXX)"
            aria-label="Order number"
            className="flex-1 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-4 py-2 text-xs font-mono text-(--text-primary) focus:outline-none focus:border-(--accent-blue)"
          />
          <Button type="submit" variant="primary" size="md" disabled={!inputOrderNumber.trim()}>
            <Icon name="search" size={16} /> TRACK ORDER
          </Button>
        </form>

        {!activeOrderNumber ? (
          <EmptyState
            icon="local_shipping"
            title="Track an order"
            message="Enter the order number from your confirmation email or your order history."
          />
        ) : loading ? (
          <div className="h-64 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
        ) : error || !order ? (
          <EmptyState
            icon="search_off"
            title="Order not found"
            message={`We could not find an order with the number “${activeOrderNumber}”. Check the number and try again.`}
          />
        ) : (
          <div className="p-6 bg-(--bg-surface) border border-(--border-theme) rounded-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-theme)">
              <div>
                <span className="text-[10px] font-mono text-(--text-secondary) uppercase block">TRACKING</span>
                <span className="text-(--text-primary) font-bold font-mono text-lg">{order.orderNumber}</span>
              </div>
              <span
                className={`font-mono text-xs px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                  isCancelled
                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
                    : order.status === 'delivered'
                      ? 'text-(--color-stock-green) bg-(--color-stock-green)/10 border-(--color-stock-green)/30'
                      : 'text-(--accent-blue) bg-(--accent-blue)/10 border-(--accent-blue)/30'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current inline-block" />
                {(STATUS_LABELS[order.status ?? ''] ?? order.status ?? 'Unknown').toUpperCase()}
              </span>
            </div>

            {order.estimatedDelivery && (
              <div className="flex items-center gap-2 text-xs font-mono text-(--text-secondary)">
                <Icon name="event" size={16} className="text-(--accent-blue)" />
                Estimated delivery: <span className="text-(--text-primary)">{order.estimatedDelivery}</span>
              </div>
            )}

            {order.trackingNumber && (
              <div className="p-4 bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme) flex items-center justify-between text-xs font-mono gap-3 flex-wrap">
                <span className="text-(--text-secondary)">
                  Carrier tracking number:{' '}
                  <strong className="text-(--text-primary)">{order.trackingNumber}</strong>
                </span>
              </div>
            )}

            {/* Real order timeline from the database */}
            {timeline.length > 0 ? (
              <div className="space-y-6 pl-4 border-l-2 border-(--accent-blue) relative">
                {timeline.map((entry, idx) => {
                  const isLatest = idx === timeline.length - 1
                  return (
                    <div key={entry.id} className="relative pl-6">
                      <div
                        className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isLatest
                            ? 'bg-(--bg-surface) border-(--accent-blue)'
                            : 'bg-(--accent-blue) border-(--accent-blue)'
                        }`}
                      >
                        {!isLatest && <Icon name="check" size={10} className="text-white" />}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-(--text-primary) capitalize">
                          {STATUS_LABELS[entry.status] ?? entry.status.replace('_', ' ')}
                        </h3>
                        <span className="font-mono text-[10px] text-(--text-secondary)">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-(--text-secondary) mt-0.5">{entry.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-(--text-secondary)">No tracking history is available for this order yet.</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
