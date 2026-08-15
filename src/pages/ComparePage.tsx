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
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const products = useMemo(
    () => compare.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p)),
    [compare]
  )

  // Union of spec labels across compared products
  const specLabels = useMemo(() => {
    const labels: string[] = []
    products.forEach((p) =>
      p.specifications.forEach((s) => {
        if (!labels.includes(s.label)) labels.push(s.label)
      })
    )
    return labels
  }, [products])

  const getSpec = (p: Product, label: string) => p.specifications.find((s) => s.label === label)?.value || '—'
  const rowDiffers = (label: string) => {
    const vals = products.map((p) => getSpec(p, label))
    return new Set(vals).size > 1
  }

  const pickable = allProducts.filter(
    (p) =>
      !compare.includes(p.id) &&
      (query
        ? p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase())
        : true)
  )

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare Products' }]} className="mb-4" />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#292a2e]">
          <div>
            <h1 className="text-white font-bold text-2xl md:text-3xl tracking-tight">Product Comparison</h1>
            <p className="text-[#8b90a0] text-xs md:text-sm mt-1">
              Compare up to 4 hardware products side-by-side. Technical differences are automatically highlighted.
            </p>
          </div>
          {products.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              {products.length < 4 && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="px-3.5 py-2 bg-[#007aff15] border border-[#007aff50] text-[#007aff] hover:bg-[#007aff25] font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                >
                  <Icon name="add" size={16} /> ADD PRODUCT
                </button>
              )}
              <button
                onClick={clearCompare}
                className="px-3.5 py-2 bg-[#16171d] border border-[#292a2e] text-[#8b90a0] hover:text-[#ff453a] hover:border-[#ff453a50] font-mono text-xs rounded transition-colors"
              >
                CLEAR ALL
              </button>
            </div>
          )}
        </div>

        {/* Empty State vs Comparison Matrix Table */}
        {products.length === 0 ? (
          <div className="py-12 flex justify-center">
            <EmptyState
              icon="balance"
              title="No products selected for comparison"
              message="Click the balance (compare) icon on any product card, listing, or catalog item to compare technical specifications side-by-side."
              action={
                <Link
                  to="/products"
                  className="px-6 py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs rounded font-bold transition-colors shadow-md inline-block mt-2"
                >
                  BROWSE PRODUCTS CATALOG
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#292a2e] rounded-lg shadow-xl bg-[#121317]">
            <table className="w-full border-collapse min-w-[700px]">
              <tbody className="divide-y divide-[#292a2e]">
                {/* Product Header Row */}
                <tr>
                  <th className="w-44 bg-[#16171d] p-4 text-left align-top sticky left-0 z-20 border-r border-[#292a2e] shadow-md">
                    <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-bold tracking-wider block">
                      PRODUCTS ({products.length}/4)
                    </span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[#16171d] border-r border-[#292a2e] min-w-[220px] max-w-[260px]">
                      <div className="relative">
                        <button
                          onClick={() => toggleCompare(p.id)}
                          aria-label="Remove product"
                          className="absolute -top-1 -right-1 text-[#8b90a0] hover:text-[#ff453a] bg-[#121317] rounded-full p-1 border border-[#292a2e] hover:border-[#ff453a] transition-colors z-10"
                        >
                          <Icon name="close" size={14} />
                        </button>
                        <Link to={`/products/${p.slug}`} className="block group">
                          <div className="w-full aspect-[4/3] rounded bg-[#0d0e12] overflow-hidden mb-3 border border-[#292a2e] group-hover:border-[#007aff] transition-colors">
                            {!imgErrors[p.id] ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={() => handleImgError(p.id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#414755]">
                                <Icon name="memory" size={36} />
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#007aff] font-bold uppercase tracking-wider block mb-0.5">
                            {p.brand}
                          </span>
                          <h3 className="text-white text-xs font-bold leading-snug line-clamp-2 group-hover:text-[#adc6ff] transition-colors min-h-[32px]">
                            {p.name}
                          </h3>
                        </Link>
                      </div>
                    </td>
                  ))}

                  {/* Empty Slot Card */}
                  {products.length < 4 && (
                    <td className="p-4 align-middle bg-[#121317] border-r border-[#292a2e] min-w-[200px]">
                      <button
                        onClick={() => setPickerOpen(true)}
                        className="w-full h-36 border-2 border-dashed border-[#292a2e] hover:border-[#007aff] rounded-lg flex flex-col items-center justify-center gap-2 text-[#8b90a0] hover:text-[#007aff] transition-all bg-[#16171d]/50 hover:bg-[#16171d]"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#007aff15] flex items-center justify-center">
                          <Icon name="add" size={20} className="text-[#007aff]" />
                        </div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Add Product</span>
                      </button>
                    </td>
                  )}
                </tr>

                {/* Price Row */}
                <CompareRow label="Retail Price">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[#292a2e]">
                      <span className="text-white font-bold font-mono text-lg block">${p.price.toFixed(2)}</span>
                      {p.previousPrice && (
                        <span className="text-[#8b90a0] text-xs line-through font-mono">
                          ${p.previousPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[#292a2e]" />}
                </CompareRow>

                {/* Rating Row */}
                <CompareRow label="Customer Rating">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[#292a2e]">
                      <StarRating rating={p.rating} count={p.reviewCount} />
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[#292a2e]" />}
                </CompareRow>

                {/* Availability Row */}
                <CompareRow label="Availability">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[#292a2e]">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border inline-block ${
                          p.stockStatus === 'in-stock'
                            ? 'bg-[#30d15815] text-[#30d158] border-[#30d15830]'
                            : p.stockStatus === 'low-stock'
                            ? 'bg-[#ffd60a15] text-[#ffd60a] border-[#ffd60a30]'
                            : 'bg-[#ff453a15] text-[#ff453a] border-[#ff453a30]'
                        }`}
                      >
                        {p.stockStatus.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[#292a2e]" />}
                </CompareRow>

                {/* Category Row */}
                <CompareRow label="Category">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top text-xs text-[#c1c6d7] font-medium border-r border-[#292a2e]">
                      {p.category}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[#292a2e]" />}
                </CompareRow>

                {/* Dynamic Specifications Rows */}
                {specLabels.map((label) => {
                  const differs = rowDiffers(label)
                  return (
                    <CompareRow key={label} label={label} highlight={differs}>
                      {products.map((p) => (
                        <td
                          key={p.id}
                          className={`p-4 align-top text-xs border-r border-[#292a2e] ${
                            differs ? 'text-white font-semibold' : 'text-[#8b90a0]'
                          }`}
                        >
                          {getSpec(p, label)}
                        </td>
                      ))}
                      {products.length < 4 && <td className="border-r border-[#292a2e]" />}
                    </CompareRow>
                  )
                })}

                {/* Action CTA Row */}
                <tr>
                  <th className="bg-[#16171d] p-4 text-left sticky left-0 z-20 border-r border-[#292a2e]">
                    <span className="font-mono text-[10px] text-[#8b90a0] uppercase font-bold tracking-wider">
                      Purchase Action
                    </span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[#16171d] border-r border-[#292a2e]">
                      <button
                        onClick={() => addToCart(p)}
                        className="w-full py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow"
                      >
                        <Icon name="add_shopping_cart" size={14} /> ADD TO CART
                      </button>
                    </td>
                  ))}
                  {products.length < 4 && <td className="bg-[#121317] border-r border-[#292a2e]" />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Picker Modal */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-[#16171d] border border-[#292a2e] rounded-lg max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#121317] border-b border-[#292a2e] flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Select Product to Compare</h3>
              <button onClick={() => setPickerOpen(false)} className="text-[#8b90a0] hover:text-white" aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-[#292a2e] bg-[#16171d]">
              <div className="relative flex items-center bg-[#121317] rounded border border-[#292a2e] px-3 py-2">
                <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalog by name or brand..."
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]"
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {pickable.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    toggleCompare(p.id)
                    if (compare.length + 1 >= 4) setPickerOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-[#121317] border border-[#292a2e] hover:border-[#007aff] rounded-md text-left transition-colors group"
                >
                  <img src={p.image} alt="" className="w-11 h-11 object-cover rounded bg-[#0d0e12] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-[#007aff] uppercase font-bold">{p.brand}</span>
                    <h4 className="text-white text-xs font-semibold truncate group-hover:text-[#adc6ff]">{p.name}</h4>
                  </div>
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
    <tr className={highlight ? 'bg-[#007aff0c]' : ''}>
      <th className="bg-[#16171d] p-4 text-left align-top sticky left-0 z-20 border-r border-[#292a2e]">
        <span className="font-mono text-[10px] text-[#8b90a0] uppercase flex items-center gap-1.5 font-bold tracking-wider">
          {highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] shrink-0" />}
          {label}
        </span>
      </th>
      {children}
    </tr>
  )
}
