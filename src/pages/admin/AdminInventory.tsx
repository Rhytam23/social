import { useState, useMemo } from 'react'
import { Icon, EmptyState } from '../../components/ui'
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
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon="inventory_2" color="#007aff" />
        <StatCard label="Reserved" value={String(totalReserved)} icon="lock_clock" color="#ffd60a" />
        <StatCard label="Available" value={(totalUnits - totalReserved).toLocaleString()} icon="check_circle" color="#30d158" />
        <StatCard label="Low / Out" value={String(lowCount)} delta="restock" icon="warning" color="#ff5c00" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product, SKU, supplier..." className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]" />
        </div>
        <label className="flex items-center gap-2 text-xs font-mono text-[#c1c6d7] cursor-pointer bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="w-4 h-4 accent-[#007aff]" /> LOW STOCK ONLY
        </label>
      </div>

      {filtered.length ? (
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[860px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
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
            <tbody className="divide-y divide-[#292a2e]">
              {filtered.map((r) => {
                const available = (r.product.stockCount ?? 0) - r.reserved
                return (
                  <tr key={r.product.id} className="hover:bg-[#1e1f23]">
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={r.product.image} alt="" className="w-9 h-9 object-cover rounded bg-[#0d0e12] shrink-0" />
                        <span className="text-white font-semibold truncate max-w-[200px]">{r.product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[#8b90a0]">{r.product.sku}</td>
                    <td className="p-3 text-right font-mono text-white">{r.product.stockCount ?? 0}</td>
                    <td className="p-3 text-right font-mono text-[#ffd60a]">{r.reserved}</td>
                    <td className="p-3 text-right font-mono text-[#30d158] font-bold">{available}</td>
                    <td className="p-3 text-center"><Pill status={r.product.stockStatus} /></td>
                    <td className="p-3 text-[#c1c6d7]">{r.supplier}</td>
                    <td className="p-3 font-mono text-[#8b90a0]">{r.restockEta}</td>
                    <td className="p-3 text-right">
                      <button className="px-2.5 py-1 bg-[#121317] border border-[#414755] hover:border-[#007aff] text-white font-mono text-[10px] rounded transition-colors">RESTOCK</button>
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
