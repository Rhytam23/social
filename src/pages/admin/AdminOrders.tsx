import { useState, useMemo } from 'react'
import { Icon, EmptyState } from '../../components/ui'
import { AdminPageHeader, Pill } from './AdminLayout'
import { adminOrders } from '../../data'

const STATUSES = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export function AdminOrders() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => adminOrders.filter((o) => {
    if (status !== 'All' && o.status !== status) return false
    if (query && !(`${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [query, status])

  const totalRevenue = adminOrders.filter((o) => o.payment === 'Paid').reduce((s, o) => s + o.amount, 0)

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle={`${adminOrders.length} orders · $${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} collected`} />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-[#1a1b1f] border border-[#292a2e] rounded p-1 overflow-x-auto scrollbar-none">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded font-mono text-[11px] font-bold whitespace-nowrap transition-colors ${status === s ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2 flex-1 min-w-[180px]">
          <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order ID, customer..." className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]" />
        </div>
      </div>

      {filtered.length ? (
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[820px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                <th className="text-left p-3 font-semibold">Order ID</th>
                <th className="text-left p-3 font-semibold">Customer</th>
                <th className="text-center p-3 font-semibold">Items</th>
                <th className="text-right p-3 font-semibold">Amount</th>
                <th className="text-center p-3 font-semibold">Payment</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[#1e1f23]">
                  <td className="p-3 font-mono text-[#007aff] font-bold">{o.id}</td>
                  <td className="p-3">
                    <div className="text-white font-semibold">{o.customer}</div>
                    <div className="font-mono text-[10px] text-[#8b90a0]">{o.email}</div>
                  </td>
                  <td className="p-3 text-center font-mono text-[#c1c6d7]">{o.items}</td>
                  <td className="p-3 text-right font-mono text-white font-bold">${o.amount.toFixed(2)}</td>
                  <td className="p-3 text-center"><Pill status={o.payment} /></td>
                  <td className="p-3 text-center"><Pill status={o.status} /></td>
                  <td className="p-3 font-mono text-[#8b90a0]">{o.date}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-[#8b90a0] hover:text-[#007aff] transition-colors" aria-label="View"><Icon name="visibility" size={16} /></button>
                      <button className="p-1.5 text-[#8b90a0] hover:text-white transition-colors" aria-label="More"><Icon name="more_vert" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="receipt_long" title="No orders found" message="Try a different search or status filter." />
      )}
    </div>
  )
}
