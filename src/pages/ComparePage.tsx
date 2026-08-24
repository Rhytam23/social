import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Breadcrumbs, StarRating, EmptyState, Button } from '../components/ui'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-theme)]">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-2xl md:text-3xl tracking-tight">Product Comparison</h1>
            <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1">
              Compare up to 4 hardware products side-by-side. Technical differences are automatically highlighted.
            </p>
          </div>
          {products.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              {products.length < 4 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setPickerOpen(true)}
                >
                  <Icon name="add" size={16} /> Add Product
                </Button>
              )}
              <Button
                variant="tertiary"
                size="md"
                onClick={clearCompare}
              >
                Clear All
              </Button>
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
                <Link to="/products">
                  <Button variant="primary" size="lg" className="mt-2">
                    Browse Products Catalog
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--border-theme)] rounded-xl shadow-sm bg-[var(--bg-surface)]">
            <table className="w-full border-collapse min-w-[700px]">
              <tbody className="divide-y divide-[var(--border-theme)]">
                {/* Product Header Row */}
                <tr>
                  <th className="w-44 bg-[var(--bg-surface-secondary)] p-4 text-left align-top sticky left-0 z-20 border-r border-[var(--border-theme)] shadow-xs">
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider block">
                      PRODUCTS ({products.length}/4)
                    </span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[var(--bg-surface-secondary)] border-r border-[var(--border-theme)] min-w-[220px] max-w-[260px]">
                      <div className="relative">
                        <button
                          onClick={() => toggleCompare(p.id)}
                          aria-label="Remove product"
                          className="absolute -top-1 -right-1 text-[var(--text-secondary)] hover:text-rose-500 bg-[var(--bg-surface)] rounded-full p-1 border border-[var(--border-theme)] hover:border-rose-500 transition-colors z-10 cursor-pointer"
                        >
                          <Icon name="close" size={14} />
                        </button>
                        <Link to={`/products/${p.slug}`} className="block group">
                          <div className="w-full aspect-[4/3] rounded-lg bg-[var(--bg-surface)] overflow-hidden mb-3 border border-[var(--border-theme)] group-hover:border-[var(--accent-blue)] transition-colors">
                            {!imgErrors[p.id] ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={() => handleImgError(p.id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                <Icon name="memory" size={36} />
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[var(--accent-blue)] font-bold uppercase tracking-wider block mb-0.5">
                            {p.brand}
                          </span>
                          <h3 className="text-[var(--text-primary)] text-xs font-bold leading-snug line-clamp-2 group-hover:text-[var(--accent-blue)] transition-colors min-h-[32px]">
                            {p.name}
                          </h3>
                        </Link>
                      </div>
                    </td>
                  ))}

                  {/* Empty Slot Card */}
                  {products.length < 4 && (
                    <td className="p-4 align-middle bg-[var(--bg-surface)] border-r border-[var(--border-theme)] min-w-[200px]">
                      <button
                        onClick={() => setPickerOpen(true)}
                        className="w-full h-36 border-2 border-dashed border-[var(--border-theme)] hover:border-[var(--accent-blue)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-all bg-[var(--bg-surface-secondary)]/50 hover:bg-[var(--bg-surface-secondary)] cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
                          <Icon name="add" size={20} className="text-[var(--accent-blue)]" />
                        </div>
                        <span className="font-sans text-xs font-semibold">Add Product</span>
                      </button>
                    </td>
                  )}
                </tr>

                {/* Price Row */}
                <CompareRow label="Retail Price">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[var(--border-theme)]">
                      <span className="text-[var(--text-primary)] font-bold font-mono text-lg block">${p.price.toFixed(2)}</span>
                      {p.previousPrice && (
                        <span className="text-[var(--text-secondary)] text-xs line-through font-mono">
                          ${p.previousPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[var(--border-theme)]" />}
                </CompareRow>

                {/* Rating Row */}
                <CompareRow label="Customer Rating">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[var(--border-theme)]">
                      <StarRating rating={p.rating} count={p.reviewCount} />
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[var(--border-theme)]" />}
                </CompareRow>

                {/* Availability Row */}
                <CompareRow label="Availability">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-[var(--border-theme)]">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${
                          p.stockStatus === 'in-stock'
                            ? 'bg-[var(--color-stock-green)]/15 text-[var(--color-stock-green)] border-[var(--color-stock-green)]/30'
                            : p.stockStatus === 'low-stock'
                            ? 'bg-[var(--color-stock-yellow-val)]/15 text-[var(--color-stock-yellow-val)] border-[var(--color-stock-yellow-val)]/30'
                            : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                        }`}
                      >
                        {p.stockStatus.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[var(--border-theme)]" />}
                </CompareRow>

                {/* Category Row */}
                <CompareRow label="Category">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top text-xs text-[var(--text-primary)] font-medium border-r border-[var(--border-theme)]">
                      {p.category}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-[var(--border-theme)]" />}
                </CompareRow>

                {/* Dynamic Specifications Rows */}
                {specLabels.map((label) => {
                  const differs = rowDiffers(label)
                  return (
                    <CompareRow key={label} label={label} highlight={differs}>
                      {products.map((p) => (
                        <td
                          key={p.id}
                          className={`p-4 align-top text-xs border-r border-[var(--border-theme)] ${
                            differs ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {getSpec(p, label)}
                        </td>
                      ))}
                      {products.length < 4 && <td className="border-r border-[var(--border-theme)]" />}
                    </CompareRow>
                  )
                })}

                {/* Action CTA Row */}
                <tr>
                  <th className="bg-[var(--bg-surface-secondary)] p-4 text-left sticky left-0 z-20 border-r border-[var(--border-theme)]">
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                      Purchase Action
                    </span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-[var(--bg-surface-secondary)] border-r border-[var(--border-theme)]">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => addToCart(p)}
                      >
                        <Icon name="add_shopping_cart" size={14} /> Add to Cart
                      </Button>
                    </td>
                  ))}
                  {products.length < 4 && <td className="bg-[var(--bg-surface)] border-r border-[var(--border-theme)]" />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Picker Modal */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[var(--bg-surface-secondary)] border-b border-[var(--border-theme)] flex items-center justify-between">
              <h3 className="text-[var(--text-primary)] font-bold text-base">Select Product to Compare</h3>
              <button onClick={() => setPickerOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer" aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-[var(--border-theme)] bg-[var(--bg-surface)]">
              <div className="relative flex items-center bg-[var(--bg-surface-secondary)] rounded-lg border border-[var(--border-theme)] px-3 py-2">
                <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalog by name or brand..."
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
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
                  className="w-full flex items-center gap-3 p-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] hover:border-[var(--accent-blue)] rounded-lg text-left transition-colors group cursor-pointer"
                >
                  <img src={p.image} alt="" className="w-11 h-11 object-cover rounded-md bg-[var(--bg-surface)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-[var(--accent-blue)] uppercase font-bold">{p.brand}</span>
                    <h4 className="text-[var(--text-primary)] text-xs font-semibold truncate group-hover:text-[var(--accent-blue)]">{p.name}</h4>
                  </div>
                  <span className="font-mono text-xs text-[var(--accent-blue)] font-bold shrink-0">${p.price.toFixed(2)}</span>
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
    <tr className={highlight ? 'bg-[var(--accent-blue)]/5' : ''}>
      <th className="bg-[var(--bg-surface-secondary)] p-4 text-left align-top sticky left-0 z-20 border-r border-[var(--border-theme)]">
        <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1.5 font-bold tracking-wider">
          {highlight && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] shrink-0" />}
          {label}
        </span>
      </th>
      {children}
    </tr>
  )
}
