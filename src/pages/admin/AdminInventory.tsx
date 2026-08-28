import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import { productService, type ProductSummary } from '../../services/productService'

interface Row {
  product: ProductSummary
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  lowStockThreshold: number
  supplier: string | null
  restockEta: string | null
}

// Inventory rows join the live low-stock records with their product records.
async function loadInventory(): Promise<Row[]> {
  const records = await adminService.lowStock()
  if (records.length === 0) return []
  const products = await productService.list({ ids: records.map((r) => r.productId), limit: 100 })
  const byId = new Map(products.data.map((p) => [p.id, p]))
  return records
    .filter((r) => byId.has(r.productId))
    .map((r) => ({
      product: byId.get(r.productId)!,
      quantityOnHand: r.quantityOnHand,
      quantityReserved: r.quantityReserved,
      quantityAvailable: r.quantityAvailable,
      lowStockThreshold: r.lowStockThreshold,
      supplier: r.supplier,
      restockEta: r.restockEta,
    }))
}

export function AdminInventory() {
  const { data, loading, error, reload } = useApi(useCallback(loadInventory, []), [])
  const [restockTarget, setRestockTarget] = useState<Row | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = data ?? []
  const outOfStock = rows.filter((r) => r.quantityAvailable <= 0).length

  // Persists the new on-hand quantity to the database.
  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockTarget) return
    const added = parseInt(restockQty, 10)
    if (!Number.isFinite(added) || added <= 0) return

    setSaving(true)
    setActionError(null)
    try {
      await adminService.adjustInventory(restockTarget.product.id, {
        quantityOnHand: restockTarget.quantityOnHand + added,
      })
      setRestockTarget(null)
      setRestockQty('')
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update inventory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        subtitle="Products at or below their low-stock threshold"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Low / Out of Stock"
          value={loading ? '—' : String(rows.length)}
          icon="warning"
          color={rows.length > 0 ? '#ff9500' : '#30d158'}
        />
        <StatCard
          label="Out of Stock"
          value={loading ? '—' : String(outOfStock)}
          icon="production_quantity_limits"
          color={outOfStock > 0 ? '#ff453a' : '#30d158'}
        />
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
      ) : rows.length === 0 ? (
        <EmptyState
          icon="check_circle"
          title="All products are well stocked"
          message="No products are at or below their low-stock threshold."
          action={
            <Link to="/admin/products">
              <Button variant="outline" size="md">VIEW ALL PRODUCTS</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[820px]">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                  {['Product', 'On Hand', 'Reserved', 'Available', 'Threshold', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {rows.map((r) => (
                  <tr key={r.product.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="text-[var(--text-primary)] text-xs font-semibold truncate block max-w-[260px]">
                          {r.product.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">{r.product.sku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{r.quantityOnHand}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{r.quantityReserved}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)] font-bold">
                      {r.quantityAvailable}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{r.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <Pill status={r.product.stockStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRestockTarget(r)
                          setRestockQty('')
                        }}
                        className="font-mono text-[10px] text-[var(--accent-blue)] hover:underline cursor-pointer"
                      >
                        RESTOCK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock modal — writes to the database */}
      {restockTarget && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={submitRestock}
            className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-sm w-full space-y-4"
          >
            <div>
              <h3 className="text-[var(--text-primary)] font-bold text-base mb-1">Restock product</h3>
              <p className="text-[var(--text-secondary)] text-xs truncate">{restockTarget.product.name}</p>
            </div>

            <div className="text-xs font-mono text-[var(--text-secondary)] flex justify-between">
              <span>Current on hand</span>
              <span className="text-[var(--text-primary)]">{restockTarget.quantityOnHand}</span>
            </div>

            <div>
              <label htmlFor="restock-qty" className="text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">
                Units to add
              </label>
              <input
                id="restock-qty"
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="md" onClick={() => setRestockTarget(null)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? 'SAVING…' : 'ADD STOCK'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
