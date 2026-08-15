import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState } from '../../components/ui'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useShop } from '../../context/ShopContext'

const CATEGORIES = ['All', 'Graphics Cards', 'CPUs', 'Motherboards', 'RAM', 'Storage', 'Cooling', 'Cases', 'Power Supplies', 'Monitors', 'Peripherals', 'Streaming']
const STATUSES = ['All', 'in-stock', 'low-stock', 'out-of-stock']

export function AdminProducts() {
  const { products, deleteProduct, duplicateProduct } = useShop()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => products.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (status !== 'All' && p.stockStatus !== status) return false
    if (query && !(`${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  }), [products, query, category, status])

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        action={
          <Link to="/admin/products/new" className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
            <Icon name="add" size={15} /> ADD PRODUCT
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-[#1a1b1f] border border-[#414755] rounded px-3 py-2 flex-1 min-w-[200px]">
          <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, brand, SKU..." className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-[#007aff]">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#1a1b1f] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-[#007aff]">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.replace('-', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length ? (
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                <th className="text-left p-3 font-semibold">Product</th>
                <th className="text-left p-3 font-semibold">SKU</th>
                <th className="text-left p-3 font-semibold">Category</th>
                <th className="text-right p-3 font-semibold">Price</th>
                <th className="text-right p-3 font-semibold">Stock</th>
                <th className="text-center p-3 font-[#8b90a0]">Status</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#1e1f23]">
                  <td className="p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt="" className="w-10 h-10 object-cover rounded bg-[#0d0e12] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate max-w-[240px]">{p.name}</div>
                        <div className="font-mono text-[10px] text-[#8b90a0]">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[#8b90a0]">{p.sku}</td>
                  <td className="p-3 text-[#c1c6d7]">{p.category}</td>
                  <td className="p-3 text-right font-mono text-white font-bold">${p.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-[#c1c6d7]">{p.stockCount ?? 0}</td>
                  <td className="p-3 text-center"><Pill status={p.stockStatus} /></td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/products/${p.id}`} className="p-1.5 text-[#8b90a0] hover:text-[#007aff] transition-colors" title="Edit"><Icon name="edit" size={16} /></Link>
                      <button onClick={() => duplicateProduct(p.id)} className="p-1.5 text-[#8b90a0] hover:text-[#30d158] transition-colors" title="Duplicate"><Icon name="content_copy" size={16} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-[#8b90a0] hover:text-[#ff453a] transition-colors" title="Delete"><Icon name="delete" size={16} /></button>
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

      <p className="font-mono text-[10px] text-[#8b90a0] mt-3">Showing {filtered.length} of {products.length} products</p>
    </div>
  )
}
