import { useState, useMemo } from 'react'
import { Icon, EmptyState, Button } from '../../components/ui'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { inventoryRows } from '../../data'

export function AdminInventory() {
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)

  const filtered = useMemo(() => inventoryRows.filter((r) => {
    if (lowOnly && r.product.stockStatus === 'in-stock') return false
    if (query && !(`${r.product.name} ${r.product.sku} ${r.supplier}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [query, lowOnly])

  const totalUnits = inventoryRows.reduce((s, r) => s + (r.product.stockCount ?? 0), 0)
  const totalReserved = inventoryRows.reduce((s, r) => s + r.reserved, 0)
  const lowCount = inventoryRows.filter((r) => r.product.stockStatus !== 'in-stock').length

  return (
    <div>
      <AdminPageHeader title="Inventory" subtitle="Stock levels, reservations & supplier management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon="inventory_2" color="var(--accent-blue)" />
        <StatCard label="Reserved" value={String(totalReserved)} icon="lock_clock" color="var(--color-stock-yellow-val)" />
        <StatCard label="Available" value={(totalUnits - totalReserved).toLocaleString()} icon="check_circle" color="var(--color-stock-green)" />
        <StatCard label="Low / Out" value={String(lowCount)} delta="restock" icon="warning" color="var(--accent-orange)" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-(--text-secondary) mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product, SKU, supplier..." className="w-full bg-transparent text-xs text-(--text-primary) focus:outline-none placeholder:text-(--text-secondary)" />
        </div>
        <label className="flex items-center gap-2 text-xs font-sans text-(--text-primary) cursor-pointer bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 select-none">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="w-4 h-4 rounded bg-(--bg-surface) border-(--border-theme) text-(--accent-blue)" /> Low Stock Only
        </label>
      </div>

      {filtered.length ? (
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[860px]">
            <thead>
              <tr className="font-mono text-[10px] text-(--text-secondary) uppercase border-b border-(--border-theme)">
                <th className="text-left p-3 font-semibold">Product</th>
                <th className="text-left p-3 font-semibold">SKU</th>
                <th className="text-right p-3 font-semibold">Stock</th>
                <th className="text-right p-3 font-semibold">Reserved</th>
                <th className="text-right p-3 font-semibold">Available</th>
                <th className="text-center p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Supplier</th>
                <th className="text-left p-3 font-semibold">Restock ETA</th>
                <th className="text-right p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-theme)">
              {filtered.map((r) => {
                const available = (r.product.stockCount ?? 0) - r.reserved
                return (
                  <tr key={r.product.id} className="hover:bg-(--bg-surface-secondary)">
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={r.product.image} alt="" className="w-9 h-9 object-cover rounded-md bg-(--bg-surface-secondary) shrink-0" />
                        <span className="text-(--text-primary) font-semibold truncate max-w-[200px]">{r.product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-(--text-secondary)">{r.product.sku}</td>
                    <td className="p-3 text-right font-mono text-(--text-primary)">{r.product.stockCount ?? 0}</td>
                    <td className="p-3 text-right font-mono text-(--color-stock-yellow-val)">{r.reserved}</td>
                    <td className="p-3 text-right font-mono text-(--color-stock-green) font-bold">{available}</td>
                    <td className="p-3 text-center"><Pill status={r.product.stockStatus} /></td>
                    <td className="p-3 text-(--text-primary)">{r.supplier}</td>
                    <td className="p-3 font-mono text-(--text-secondary)">{r.restockEta}</td>
                    <td className="p-3 text-right">
                      <Button variant="secondary" size="sm">Restock</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="warehouse" title="No inventory rows" message="Try a different search." />
      )}
    </div>
  )
}
