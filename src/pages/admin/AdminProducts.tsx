import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState, Button } from '../../components/ui'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useShop } from '../../context/ShopContext'

const CATEGORIES = ['All', 'Graphics Cards', 'CPUs', 'Motherboards', 'RAM', 'Storage', 'Cooling', 'Cases', 'Power Supplies', 'Monitors', 'Peripherals', 'Streaming']
const STATUSES = ['All', 'in-stock', 'low-stock', 'out-of-stock']

export function AdminProducts() {
  const { products, deleteProduct, duplicateProduct } = useShop()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => products.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (status !== 'All' && p.stockStatus !== status) return false
    if (query && !(`${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [products, query, category, status])

  const confirmDelete = () => {
    if (deletingId) {
      deleteProduct(deletingId)
      setDeletingId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        action={
          <Link to="/admin/products/new">
            <Button variant="primary" size="md">
              <Icon name="add" size={15} /> Add Product
            </Button>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, SKU..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.replace('-', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length ? (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="font-mono text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-subtle)]">
                <th className="text-left p-3.5 font-semibold">Product</th>
                <th className="text-left p-3.5 font-semibold">SKU</th>
                <th className="text-left p-3.5 font-semibold">Category</th>
                <th className="text-right p-3.5 font-semibold">Price</th>
                <th className="text-right p-3.5 font-semibold">Stock</th>
                <th className="text-center p-3.5 font-semibold">Status</th>
                <th className="text-right p-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[var(--text-primary)] font-semibold truncate max-w-[240px]">{p.name}</div>
                        <div className="font-mono text-[10px] text-[var(--text-secondary)]">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">{p.sku}</td>
                  <td className="p-3.5 text-[var(--text-primary)]">{p.category}</td>
                  <td className="p-3.5 text-right font-mono text-[var(--text-primary)] font-bold">${p.price.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-[var(--text-secondary)]">{p.stockCount ?? 0}</td>
                  <td className="p-3.5 text-center"><Pill status={p.stockStatus} /></td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/products/${p.id}`} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors" title="Edit">
                        <Icon name="edit" size={16} />
                      </Link>
                      <button onClick={() => duplicateProduct(p.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer" title="Duplicate">
                        <Icon name="content_copy" size={16} />
                      </button>
                      <button onClick={() => setDeletingId(p.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer" title="Delete">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="search_off" title="No products match" message="Try adjusting your search or filters." />
      )}

      <p className="font-mono text-xs text-[var(--text-secondary)] mt-3">Showing {filtered.length} of {products.length} products</p>

      {/* Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-500 font-bold text-base">
              <Icon name="warning" size={24} /> Confirm Product Deletion
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete this hardware component from the catalog? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-[var(--border-subtle)] rounded-lg text-xs font-mono text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
