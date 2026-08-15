import { useState, useMemo } from 'react'
import { Icon, EmptyState } from '../../components/ui'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { adminCustomers } from '../../data'

const STATUSES = ['All', 'VIP', 'Active', 'Inactive']

export function AdminCustomers() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => adminCustomers.filter((c) => {
    if (status !== 'All' && c.status !== status) return false
    if (query && !(`${c.name} ${c.email} ${c.location}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [query, status])

  const totalSpent = adminCustomers.reduce((s, c) => s + c.totalSpent, 0)
  const vipCount = adminCustomers.filter((c) => c.status === 'VIP').length

  return (
    <div>
      <AdminPageHeader title="Customers" subtitle={`${adminCustomers.length} registered customers`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Customers" value={String(adminCustomers.length * 154)} delta="5.1%" deltaUp icon="group" color="#007aff" />
        <StatCard label="VIP Members" value={String(vipCount * 12)} icon="workspace_premium" color="#bf5af2" />
        <StatCard label="Lifetime Value" value={`$${(totalSpent / 1000).toFixed(0)}k`} delta="9.3%" deltaUp icon="payments" color="#30d158" />
        <StatCard label="Avg. Orders" value="6.4" icon="receipt_long" color="#ffd60a" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-[#007aff]">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                <th className="text-left p-3 font-semibold">Customer</th>
                <th className="text-left p-3 font-semibold">Location</th>
                <th className="text-center p-3 font-semibold">Orders</th>
                <th className="text-right p-3 font-semibold">Spent</th>
                <th className="text-left p-3 font-semibold">Registered</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#1e1f23]">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[#0d0e12] font-bold text-xs shrink-0" style={{ background: c.avatarColor }}>
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{c.name}</div>
                        <div className="font-mono text-[10px] text-[#8b90a0] truncate">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[#c1c6d7]">{c.location}</td>
                  <td className="p-3 text-center font-mono text-[#c1c6d7]">{c.orders}</td>
                  <td className="p-3 text-right font-mono text-white font-bold">${c.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-mono text-[#8b90a0]">{c.registered}</td>
                  <td className="p-3 text-center"><Pill status={c.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-[#8b90a0] hover:text-[#007aff] transition-colors" aria-label="View"><Icon name="visibility" size={16} /></button>
                      <button className="p-1.5 text-[#8b90a0] hover:text-white transition-colors" aria-label="Email"><Icon name="mail" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="group_off" title="No customers found" message="Try a different search." />
      )}
    </div>
  )
}
