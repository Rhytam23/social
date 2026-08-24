import { useState, useMemo } from 'react'
import { Icon, EmptyState } from '../../components/ui'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useShop } from '../../context/ShopContext'
import type { OrderStatus } from '../../types'

const STATUSES = ['All', 'Processing', 'Assembling', 'Quality Check', 'Shipped', 'Delivered', 'Cancelled']

export function AdminOrders() {
  const { orders, updateOrderStatus } = useShop()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const custName = o.customerName || o.shippingAddress?.name || 'Guest'
      const custEmail = o.customerEmail || 'customer@example.com'

      if (status !== 'All' && o.status !== status) return false
      if (query && !(`${o.id} ${custName} ${custEmail}`.toLowerCase().includes(query.toLowerCase()))) {
        return false
      }
      return true
    })
  }, [orders, query, status])

  const totalRevenue = orders
    .filter((o) => o.paymentStatus !== 'Refunded')
    .reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div>
      <AdminPageHeader
        title="Orders & Fulfillment"
        subtitle={`${orders.length} orders · $${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })} collected`}
      />

      {/* Status tabs & search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-1 overflow-x-auto scrollbar-none">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                status === s ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative flex items-center bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID, customer name, email..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[850px]">
            <thead>
              <tr className="font-mono text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-theme)]">
                <th className="text-left p-3 font-semibold">Order ID</th>
                <th className="text-left p-3 font-semibold">Customer</th>
                <th className="text-center p-3 font-semibold">Items</th>
                <th className="text-right p-3 font-semibold">Amount</th>
                <th className="text-center p-3 font-semibold">Payment</th>
                <th className="text-center p-3 font-semibold">Order Status</th>
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-right p-3 font-semibold">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-theme)]">
              {filtered.map((o) => {
                const custName = o.customerName || o.shippingAddress?.name || 'Customer'
                const custEmail = o.customerEmail || 'customer@example.com'

                return (
                  <tr key={o.id} className="hover:bg-[var(--bg-surface-secondary)]">
                    <td className="p-3 font-mono text-[var(--accent-blue)] font-bold">#{o.id}</td>
                    <td className="p-3">
                      <div className="text-[var(--text-primary)] font-semibold">{custName}</div>
                      <div className="font-mono text-[10px] text-[var(--text-secondary)]">{custEmail}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-[var(--text-secondary)]">{o.items?.length || 1}</td>
                    <td className="p-3 text-right font-mono text-[var(--text-primary)] font-bold">${o.total?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Pill status={o.paymentStatus || 'Paid'} />
                    </td>
                    <td className="p-3 text-center">
                      <Pill status={o.status} />
                    </td>
                    <td className="p-3 font-mono text-[var(--text-secondary)]">{o.date}</td>
                    <td className="p-3 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] text-[var(--text-primary)] font-mono text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--accent-blue)]"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Assembling">Assembling</option>
                        <option value="Quality Check">Quality Check</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="receipt_long" title="No orders found" message="Try adjusting your search or status filters." />
      )}
    </div>
  )
}
