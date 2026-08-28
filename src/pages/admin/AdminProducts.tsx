import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

export function AdminProducts() {
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useApi(
    useCallback(() => adminService.listProducts(page, 24), [page]),
    [page]
  )

  const products = data?.data ?? []
  const pagination = data?.pagination

  const confirmDelete = async () => {
    if (!deletingId) return
    setActionError(null)
    try {
      await adminService.deleteProduct(deletingId)
      setDeletingId(null)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete product')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={pagination ? `${pagination.total} products in catalog` : 'Loading catalog…'}
        action={
          <Link to="/admin/products/new">
            <Button variant="primary" size="md">
              <Icon name="add" size={15} /> Add Product
            </Button>
          </Link>
        }
      />

      {actionError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No products"
          message="Add your first product to the catalog."
          action={
            <Link to="/admin/products/new">
              <Button variant="primary" size="md">ADD PRODUCT</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead>
                  <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                    {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
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
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.primaryImage ? (
                            <img
                              src={p.primaryImage}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-[var(--bg-primary)] shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] shrink-0 flex items-center justify-center">
                              <Icon name="memory" size={18} className="text-[var(--accent-blue)]" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="text-[var(--text-primary)] text-xs font-semibold truncate block max-w-[260px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">{p.brandName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">{p.sku}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.categoryName ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)] font-bold">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Pill status={p.stockStatus} />
                          <span className="font-mono text-[10px] text-[var(--text-secondary)]">{p.stockAvailable}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Icon name="edit" size={16} />
                          </Link>
                          <Link
                            to={`/products/${p.slug}`}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label={`View ${p.name}`}
                          >
                            <Icon name="visibility" size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingId(p.id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}>
                PREVIOUS
              </Button>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                PAGE {pagination.page} / {pagination.totalPages}
              </span>
              <Button variant="outline" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
                NEXT
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-[var(--text-primary)] font-bold text-base mb-2">Deactivate this product?</h3>
            <p className="text-[var(--text-secondary)] text-xs mb-5 leading-relaxed">
              The product will be removed from the storefront. Existing orders keep their saved item details.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="md" onClick={() => setDeletingId(null)}>
                CANCEL
              </Button>
              <Button variant="destructive" size="md" onClick={() => void confirmDelete()}>
                DEACTIVATE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
