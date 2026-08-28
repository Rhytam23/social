import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

export function AdminDashboard() {
  const { data, loading, error, reload } = useApi(useCallback(() => adminService.dashboard(), []), [])

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Dashboard" subtitle="Live store metrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // A failed fetch shows a real error — never a silent fallback to sample data.
  if (error || !data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Dashboard" subtitle="Live store metrics" />
        <ErrorState
          title="Could not load dashboard"
          message={error ?? 'The admin API did not return data.'}
          onRetry={reload}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard" subtitle="Live metrics from the store database" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Paid Revenue" value={`$${data.paidRevenue.toFixed(2)}`} icon="payments" color="#30d158" />
        <StatCard label="Paid Orders" value={String(data.paidOrderCount)} icon="receipt_long" />
        <StatCard label="Products" value={String(data.productCount)} icon="inventory_2" color="#ff9500" />
        <StatCard
          label="Low Stock Items"
          value={String(data.lowStockCount)}
          icon="warning"
          color={data.lowStockCount > 0 ? '#ff453a' : '#30d158'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by status */}
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5">
          <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase mb-4">Orders by Status</h2>
          {data.ordersByStatus.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.ordersByStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] capitalize">{s.status.replace('_', ' ')}</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Registered customers</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">{data.userCount}</span>
          </div>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">Recent Orders</h2>
            <Link to="/admin/orders" className="font-mono text-[11px] text-[var(--accent-blue)] hover:underline flex items-center gap-1">
              VIEW ALL <Icon name="chevron_right" size={13} />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <EmptyState icon="receipt_long" title="No orders yet" message="Orders will appear here as customers check out." />
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-[var(--accent-blue)] font-bold">{o.orderNumber}</span>
                    <p className="text-[var(--text-secondary)] text-[11px] font-mono truncate">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Pill status={o.paymentStatus} />
                    <span className="font-mono text-[var(--text-primary)] font-bold text-sm">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
