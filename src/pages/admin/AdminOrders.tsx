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
        <div className="flex gap-1 bg-[#1a1b1f] border border-[#292a2e] rounded p-1 overflow-x-auto scrollbar-none">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded font-mono text-[11px] font-bold whitespace-nowrap transition-colors ${
                status === s ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID, customer name, email..."
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]"
          />
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length ? (
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[850px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
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
            <tbody className="divide-y divide-[#292a2e]">
              {filtered.map((o) => {
                const custName = o.customerName || o.shippingAddress?.name || 'Customer'
                const custEmail = o.customerEmail || 'customer@example.com'

                return (
                  <tr key={o.id} className="hover:bg-[#1e1f23]">
                    <td className="p-3 font-mono text-[#007aff] font-bold">#{o.id}</td>
                    <td className="p-3">
                      <div className="text-white font-semibold">{custName}</div>
                      <div className="font-mono text-[10px] text-[#8b90a0]">{custEmail}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-[#c1c6d7]">{o.items?.length || 1}</td>
                    <td className="p-3 text-right font-mono text-white font-bold">${o.total?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Pill status={o.paymentStatus || 'Paid'} />
                    </td>
                    <td className="p-3 text-center">
                      <Pill status={o.status} />
                    </td>
                    <td className="p-3 font-mono text-[#8b90a0]">{o.date}</td>
                    <td className="p-3 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="bg-[#121317] border border-[#414755] text-white font-mono text-[11px] rounded px-2 py-1 focus:outline-none focus:border-[#007aff]"
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
