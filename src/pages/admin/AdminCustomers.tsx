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
      <AdminPageHeader title="Customers" subtitle={`${adminCustomers.length} registered customer accounts`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={String(adminCustomers.length)} icon="group" color="var(--accent-blue)" />
        <StatCard label="VIP Members" value={String(vipCount)} icon="workspace_premium" color="#a855f7" />
        <StatCard label="Total Customer Spent" value={`$${Math.round(totalSpent).toLocaleString()}`} icon="payments" color="#16a34a" />
        <StatCard label="Avg. Orders / Customer" value={(totalSpent / (adminCustomers.length || 1) / 150).toFixed(1)} icon="receipt_long" color="#eab308" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers by name, email, location..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="font-mono text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-subtle)]">
                <th className="text-left p-3.5 font-semibold">Customer</th>
                <th className="text-left p-3.5 font-semibold">Location</th>
                <th className="text-center p-3.5 font-semibold">Orders</th>
                <th className="text-right p-3.5 font-semibold">Spent</th>
                <th className="text-left p-3.5 font-semibold">Registered</th>
                <th className="text-center p-3.5 font-semibold">Status</th>
                <th className="text-right p-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm" style={{ background: c.avatarColor || '#0066FF' }}>
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[var(--text-primary)] font-semibold truncate">{c.name}</div>
                        <div className="font-mono text-[10px] text-[var(--text-secondary)] truncate">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)]">{c.location}</td>
                  <td className="p-3.5 text-center font-mono text-[var(--text-secondary)]">{c.orders}</td>
                  <td className="p-3.5 text-right font-mono text-[var(--text-primary)] font-bold">${c.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">{c.registered}</td>
                  <td className="p-3.5 text-center"><Pill status={c.status} /></td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer" aria-label="View">
                        <Icon name="visibility" size={16} />
                      </button>
                      <button className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" aria-label="Email">
                        <Icon name="mail" size={16} />
                      </button>
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
