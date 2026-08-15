import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Breadcrumbs, StarRating, EmptyState } from '../components/ui'
import { allProducts, getProductById } from '../data'
import { useShop } from '../context/ShopContext'
import type { Product } from '../types'

export function ComparePage() {
  const { compare, toggleCompare, clearCompare, addToCart } = useShop()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')

  const products = useMemo(
    () => compare.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p)),
    [compare]
  )

  // Union of spec labels across compared products
  const specLabels = useMemo(() => {
    const labels: string[] = []
    products.forEach((p) => p.specifications.forEach((s) => { if (!labels.includes(s.label)) labels.push(s.label) }))
    return labels
  }, [products])

  const getSpec = (p: Product, label: string) => p.specifications.find((s) => s.label === label)?.value || '—'
  const rowDiffers = (label: string) => {
    const vals = products.map((p) => getSpec(p, label))
    return new Set(vals).size > 1
  }

  const pickable = allProducts.filter(
    (p) => !compare.includes(p.id) && (query ? p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()) : true)
  )

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare Products' }]} className="mb-4" />

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-white font-bold text-2xl tracking-tight">Product Comparison</h1>
            <p className="text-[#8b90a0] text-xs mt-1">Compare up to 4 products side by side. Differences are highlighted.</p>
          </div>
          {products.length > 0 && (
            <button onClick={clearCompare} className="font-mono text-xs text-[#8b90a0] hover:text-[#ff453a] transition-colors">CLEAR ALL</button>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon="balance"
            title="Nothing to compare yet"
            message="Add products to comparison from any product card or listing using the compare (balance) icon."
            action={<Link to="/products" className="px-4 py-2 bg-[#007aff] text-white font-mono text-xs rounded font-bold">BROWSE PRODUCTS</Link>}
          />
        ) : (
          <div className="overflow-x-auto border border-[#414755] rounded">
            <table className="w-full border-collapse min-w-[640px]">
              <tbody className="divide-y divide-[#292a2e]">
                {/* Product header row */}
                <tr>
                  <th className="w-40 bg-[#1e1f23] p-4 text-left align-top sticky left-0 z-10">
                    <span className="font-mono text-[10px] text-[#8b90a0] uppercase">Product</span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[#1a1b1f] min-w-[200px]">
                      <div className="relative">
                        <button onClick={() => toggleCompare(p.id)} aria-label="Remove" className="absolute -top-1 -right-1 text-[#8b90a0] hover:text-[#ff453a] z-10">
                          <Icon name="close" size={16} />
                        </button>
                        <Link to={`/products/${p.slug}`}>
                          <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded bg-[#0d0e12] mb-2" />
                          <span className="font-mono text-[10px] text-[#007aff] uppercase">{p.brand}</span>
                          <h3 className="text-white text-xs font-bold leading-snug line-clamp-2 hover:text-[#adc6ff]">{p.name}</h3>
                        </Link>
                      </div>
                    </td>
                  ))}
                  {products.length < 4 && (
                    <td className="p-4 align-middle bg-[#16171d] min-w-[160px]">
                      <button onClick={() => setPickerOpen(true)} className="w-full h-28 border border-dashed border-[#414755] rounded flex flex-col items-center justify-center gap-1.5 text-[#8b90a0] hover:text-white hover:border-[#007aff] transition-colors">
                        <Icon name="add" size={24} /><span className="font-mono text-[10px] uppercase">Add Product</span>
                      </button>
                    </td>
                  )}
                </tr>

                {/* Price */}
                <CompareRow label="Price">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top">
                      <span className="text-white font-bold text-lg">${p.price.toFixed(2)}</span>
                      {p.previousPrice && <span className="text-[#8b90a0] text-xs line-through ml-1.5">${p.previousPrice.toFixed(2)}</span>}
                    </td>
                  ))}
                  {products.length < 4 && <td />}
                </CompareRow>

                {/* Rating */}
                <CompareRow label="Rating">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top"><StarRating rating={p.rating} count={p.reviewCount} /></td>
                  ))}
                  {products.length < 4 && <td />}
                </CompareRow>

                {/* Availability */}
                <CompareRow label="Availability">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top">
                      <span className={`font-mono text-[11px] font-bold ${p.stockStatus === 'in-stock' ? 'text-[#30d158]' : p.stockStatus === 'low-stock' ? 'text-[#ffd60a]' : 'text-[#ff453a]'}`}>
                        {p.stockStatus.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  ))}
                  {products.length < 4 && <td />}
                </CompareRow>

                {/* Category */}
                <CompareRow label="Category">
                  {products.map((p) => <td key={p.id} className="p-4 align-top text-xs text-[#c1c6d7]">{p.category}</td>)}
                  {products.length < 4 && <td />}
                </CompareRow>

                {/* Specs */}
                {specLabels.map((label) => (
                  <CompareRow key={label} label={label} highlight={rowDiffers(label)}>
                    {products.map((p) => (
                      <td key={p.id} className={`p-4 align-top text-xs ${rowDiffers(label) ? 'text-white font-medium' : 'text-[#c1c6d7]'}`}>
                        {getSpec(p, label)}
                      </td>
                    ))}
                    {products.length < 4 && <td />}
                  </CompareRow>
                ))}

                {/* Actions */}
                <tr>
                  <th className="bg-[#1e1f23] p-4 text-left sticky left-0"><span className="font-mono text-[10px] text-[#8b90a0] uppercase">Action</span></th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[#1a1b1f]">
                      <button onClick={() => addToCart(p)} className="w-full py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-[10px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors">
                        <Icon name="add_shopping_cart" size={14} /> ADD TO CART
                      </button>
                    </td>
                  ))}
                  {products.length < 4 && <td className="bg-[#16171d]" />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
          <div className="bg-[#16171d] border border-[#414755] rounded max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-[#1a1b1f] border-b border-[#292a2e] flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Add a product to compare</h3>
              <button onClick={() => setPickerOpen(false)} className="text-[#8b90a0] hover:text-white" aria-label="Close"><Icon name="close" size={20} /></button>
            </div>
            <div className="p-3 border-b border-[#292a2e] bg-[#121317]">
              <div className="relative flex items-center bg-[#1e1f23] rounded border border-[#414755] px-3 py-1.5">
                <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]" />
              </div>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {pickable.map((p) => (
                <button key={p.id} onClick={() => { toggleCompare(p.id); if (compare.length + 1 >= 4) setPickerOpen(false) }} className="w-full flex items-center gap-3 p-2.5 bg-[#1a1b1f] border border-[#292a2e] hover:border-[#007aff] rounded text-left transition-colors">
                  <img src={p.image} alt="" className="w-11 h-11 object-cover rounded bg-[#0d0e12] shrink-0" />
                  <div className="min-w-0 flex-1"><span className="font-mono text-[10px] text-[#8b90a0] uppercase">{p.brand}</span><h4 className="text-white text-xs font-semibold truncate">{p.name}</h4></div>
                  <span className="font-mono text-xs text-[#007aff] font-bold shrink-0">${p.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function CompareRow({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <tr className={highlight ? 'bg-[#007aff08]' : ''}>
      <th className="bg-[#1e1f23] p-4 text-left align-top sticky left-0 z-10">
        <span className="font-mono text-[10px] text-[#8b90a0] uppercase flex items-center gap-1.5">
          {highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#007aff]" />}
          {label}
        </span>
      </th>
      {children}
    </tr>
  )
}
