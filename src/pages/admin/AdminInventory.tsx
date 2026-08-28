import { useState, useMemo } from 'react'
import { Icon, EmptyState } from '../../components/ui'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { inventoryRows } from '../../data'
import { useShop } from '../../context/ShopContext'

export function AdminInventory() {
  const { showToast } = useShop()
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [restockProduct, setRestockProduct] = useState<any | null>(null)
  const [addQty, setAddQty] = useState(10)

  const filtered = useMemo(() => inventoryRows.filter((r) => {
    if (lowOnly && r.product.stockStatus === 'in-stock') return false
    if (query && !(`${r.product.name} ${r.product.sku} ${r.supplier}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [query, lowOnly])

  const totalUnits = inventoryRows.reduce((s, r) => s + (r.product.stockCount ?? 0), 0)
  const totalReserved = inventoryRows.reduce((s, r) => s + r.reserved, 0)
  const lowCount = inventoryRows.filter((r) => r.product.stockStatus !== 'in-stock').length

  const handleRestockSubmit = () => {
    if (restockProduct) {
      showToast(`Added ${addQty} units to ${restockProduct.name}`, 'cart')
      setRestockProduct(null)
    }
  }

  return (
    <div>
      <AdminPageHeader title="Inventory" subtitle="Stock levels, reservations & supplier management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon="inventory_2" color="var(--accent-blue)" />
        <StatCard label="Reserved" value={String(totalReserved)} icon="lock_clock" color="#eab308" />
        <StatCard label="Available" value={(totalUnits - totalReserved).toLocaleString()} icon="check_circle" color="#16a34a" />
        <StatCard label="Low / Out" value={String(lowCount)} delta="restock" icon="warning" color="#ea580c" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, SKU, supplier..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)] cursor-pointer bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg px-3.5 py-2 select-none">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--accent-blue)]"
          />
          Low Stock Only
        </label>
      </div>

      {filtered.length ? (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[860px]">
            <thead>
              <tr className="font-mono text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-subtle)]">
                <th className="text-left p-3.5 font-semibold">Product</th>
                <th className="text-left p-3.5 font-semibold">SKU</th>
                <th className="text-right p-3.5 font-semibold">Stock</th>
                <th className="text-right p-3.5 font-semibold">Reserved</th>
                <th className="text-right p-3.5 font-semibold">Available</th>
                <th className="text-center p-3.5 font-semibold">Status</th>
                <th className="text-left p-3.5 font-semibold">Supplier</th>
                <th className="text-left p-3.5 font-semibold">Restock ETA</th>
                <th className="text-right p-3.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((r) => {
                const available = (r.product.stockCount ?? 0) - r.reserved
                return (
                  <tr key={r.product.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={r.product.image} alt="" className="w-9 h-9 object-cover rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0" />
                        <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px]">{r.product.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)]">{r.product.sku}</td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-primary)] font-bold">{r.product.stockCount ?? 0}</td>
                    <td className="p-3.5 text-right font-mono text-amber-500 font-bold">{r.reserved}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-500 font-bold">{available}</td>
                    <td className="p-3.5 text-center"><Pill status={r.product.stockStatus} /></td>
                    <td className="p-3.5 text-[var(--text-primary)]">{r.supplier}</td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)]">{r.restockEta}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setRestockProduct(r.product)}
                        className="px-3 py-1 bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)] text-[var(--accent-blue)] hover:text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Restock
                      </button>
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

      {/* Restock Adjustment Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-base">
              <Icon name="inventory" size={20} className="text-[var(--accent-blue)]" /> Adjust Stock Quantity
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Updating inventory for <strong className="text-[var(--text-primary)]">{restockProduct.name}</strong>
            </p>
            <div>
              <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Units to Add</label>
              <input
                type="number"
                value={addQty}
                onChange={(e) => setAddQty(Number(e.target.value))}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-2.5 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRestockProduct(null)}
                className="px-4 py-2 border border-[var(--border-subtle)] rounded-lg text-xs font-mono text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockSubmit}
                className="px-4 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
