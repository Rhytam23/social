import { useState, useCallback } from 'react'
import { Icon, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import type { Order } from '../../services/orderService'

const ORDER_STATUSES = [
  'processing',
  'assembling',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

export function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, loading, error, reload } = useApi(
    useCallback(() => adminService.listOrders(page, 20, statusFilter || undefined), [page, statusFilter]),
    [page, statusFilter]
  )

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))

  const changeStatus = async (order: Order, status: string) => {
    setBusyId(order.id)
    setActionError(null)
    try {
      await adminService.updateOrderStatus(order.id, status)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update order status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Orders &amp; Fulfillment"
        subtitle={loading ? 'Loading orders…' : `${total} order${total === 1 ? '' : 's'}`}
      />

      {/* Status filter — now actually reaches the API */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setStatusFilter('')
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === '' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer capitalize ${
                statusFilter === s ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="No orders"
          message={statusFilter ? `No orders with status “${statusFilter}”.` : 'Orders will appear here as customers check out.'}
        />
      ) : (
        <>
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-[var(--bg-primary)]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-[var(--accent-blue)] font-bold">{o.orderNumber}</span>
                    <p className="text-[var(--text-secondary)] text-[11px] font-mono truncate">
                      {new Date(o.createdAt).toLocaleString()} · {o.shippingName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <Pill status={o.paymentStatus} />
                    <Pill status={o.status} />
                    <span className="font-mono text-[var(--text-primary)] font-bold text-sm">${o.total.toFixed(2)}</span>
                    <Icon
                      name={expanded === o.id ? 'expand_less' : 'expand_more'}
                      size={18}
                      className="text-[var(--text-secondary)]"
                    />
                  </div>
                </button>

                {expanded === o.id && (
                  <div className="border-t border-[var(--border-subtle)] p-4 space-y-4 bg-[var(--bg-primary)]/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase block mb-1">
                          Ship To
                        </span>
                        <p className="text-[var(--text-primary)]">{o.shippingName}</p>
                        <p className="text-[var(--text-secondary)]">{o.shippingStreet}</p>
                        <p className="text-[var(--text-secondary)]">
                          {o.shippingCity}, {o.shippingState} {o.shippingZip}
                        </p>
                        <p className="text-[var(--text-secondary)]">{o.shippingCountry}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase block mb-1">
                          Items ({o.items.length})
                        </span>
                        <ul className="space-y-1">
                          {o.items.map((i) => (
                            <li key={i.id} className="text-[var(--text-secondary)] flex justify-between gap-2">
                              <span className="truncate">
                                {i.productName} × {i.quantity}
                              </span>
                              <span className="font-mono text-[var(--text-primary)] shrink-0">
                                ${i.lineTotal.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-[var(--border-subtle)]">
                      <label
                        className="font-mono text-[10px] text-[var(--text-secondary)] uppercase"
                        htmlFor={`status-${o.id}`}
                      >
                        Update status
                      </label>
                      <select
                        id={`status-${o.id}`}
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => void changeStatus(o, e.target.value)}
                        className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--accent-blue)] capitalize"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                        Payment: {o.paymentStatus} (refunds are issued in Stripe)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                PREVIOUS
              </Button>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                PAGE {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                NEXT
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
