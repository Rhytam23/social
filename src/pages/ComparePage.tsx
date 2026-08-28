import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Breadcrumbs, StarRating, EmptyState, Button } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import { useShop } from '../context/ShopContext'
import { useCart } from '../context/CartContext'
import { productService, type ProductDetail, type ProductSummary } from '../services/productService'

// Comparison needs full spec sheets, so each selected id is expanded to its
// detail record (max 4 by design).
async function loadCompared(ids: string[]): Promise<ProductDetail[]> {
  if (ids.length === 0) return []
  const list = await productService.list({ ids, limit: 4 })
  return Promise.all(list.data.map((p) => productService.getBySlug(p.slug)))
}

export function ComparePage() {
  const { compare, toggleCompare, clearCompare, showToast } = useShop()
  const { addItem } = useCart()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [pickable, setPickable] = useState<ProductSummary[]>([])

  const debouncedQuery = useDebounce(query, 250)

  const comparedFn = useCallback(() => loadCompared(compare), [compare])
  const { data, loading, error, reload } = useApi(comparedFn, [compare.join(',')])
  const products = useMemo(() => data ?? [], [data])

  // Picker results come from the catalog API
  useEffect(() => {
    if (!pickerOpen) return
    let active = true
    productService
      .list(debouncedQuery ? { search: debouncedQuery, limit: 20 } : { limit: 20 })
      .then((res) => {
        if (active) setPickable(res.data.filter((p) => !compare.includes(p.id)))
      })
      .catch(() => {
        if (active) setPickable([])
      })
    return () => {
      active = false
    }
  }, [pickerOpen, debouncedQuery, compare])

  const specLabels = useMemo(() => {
    const labels: string[] = []
    products.forEach((p) =>
      p.specs.forEach((s) => {
        if (!labels.includes(s.label)) labels.push(s.label)
      })
    )
    return labels
  }, [products])

  const getSpec = (p: ProductDetail, label: string) => p.specs.find((s) => s.label === label)?.value || '—'
  const rowDiffers = (label: string) => new Set(products.map((p) => getSpec(p, label))).size > 1

  const handleAdd = async (p: ProductDetail) => {
    try {
      await addItem(p.id, 1)
      showToast('Added to cart', 'cart')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    }
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare Products' }]} className="mb-4" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-(--border-theme)">
          <div>
            <h1 className="text-(--text-primary) font-bold text-2xl md:text-3xl tracking-tight">Product Comparison</h1>
            <p className="text-(--text-secondary) text-xs md:text-sm mt-1">
              Compare up to 4 hardware products side-by-side. Technical differences are automatically highlighted.
            </p>
          </div>
          {products.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              {products.length < 4 && (
                <Button variant="outline" size="md" onClick={() => setPickerOpen(true)}>
                  <Icon name="add" size={16} /> Add Product
                </Button>
              )}
              <Button variant="tertiary" size="md" onClick={clearCompare}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && compare.length > 0 ? (
          <div className="h-64 bg-(--bg-surface) border border-(--border-theme) rounded-xl animate-pulse" />
        ) : products.length === 0 ? (
          <div className="py-12 flex justify-center">
            <EmptyState
              icon="balance"
              title="No products selected for comparison"
              message="Click the compare icon on any product card to compare technical specifications side-by-side."
              action={
                <Link to="/products">
                  <Button variant="primary" size="lg" className="mt-2">BROWSE PRODUCTS CATALOG</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto border border-(--border-theme) rounded-xl shadow-sm bg-(--bg-surface)">
            <table className="w-full border-collapse min-w-[700px]">
              <tbody className="divide-y divide-(--border-theme)">
                {/* Product Header Row */}
                <tr>
                  <th className="w-44 bg-(--bg-surface-secondary) p-4 text-left align-top sticky left-0 z-20 border-r border-(--border-theme) shadow-xs">
                    <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-bold tracking-wider block">
                      PRODUCTS ({products.length}/4)
                    </span>
                  </th>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="p-4 align-top bg-(--bg-surface-secondary) border-r border-(--border-theme) min-w-[220px] max-w-[260px]"
                    >
                      <div className="relative">
                        <button
                          onClick={() => toggleCompare(p.id)}
                          aria-label="Remove product"
                          className="absolute -top-1 -right-1 text-(--text-secondary) hover:text-rose-500 bg-(--bg-surface) rounded-full p-1 border border-(--border-theme) hover:border-rose-500 transition-colors z-10 cursor-pointer"
                        >
                          <Icon name="close" size={14} />
                        </button>
                        <Link to={`/products/${p.slug}`} className="block group">
                          <div className="w-full aspect-[4/3] rounded-lg bg-(--bg-surface) overflow-hidden mb-3 border border-(--border-theme) group-hover:border-(--accent-blue) transition-colors">
                            {p.primaryImage && !imgErrors[p.id] ? (
                              <img
                                src={p.primaryImage}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={() => setImgErrors((prev) => ({ ...prev, [p.id]: true }))}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-(--text-secondary)">
                                <Icon name="memory" size={36} />
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-(--accent-blue) font-bold uppercase tracking-wider block mb-0.5">
                            {p.brandName}
                          </span>
                          <h3 className="text-(--text-primary) text-xs font-bold leading-snug line-clamp-2 group-hover:text-(--accent-blue) transition-colors min-h-[32px]">
                            {p.name}
                          </h3>
                        </Link>
                      </div>
                    </td>
                  ))}

                  {products.length < 4 && (
                    <td className="p-4 align-middle bg-(--bg-surface) border-r border-(--border-theme) min-w-[200px]">
                      <button
                        onClick={() => setPickerOpen(true)}
                        className="w-full h-36 border-2 border-dashed border-(--border-theme) hover:border-(--accent-blue) rounded-xl flex flex-col items-center justify-center gap-2 text-(--text-secondary) hover:text-(--accent-blue) transition-all bg-(--bg-surface-secondary)/50 hover:bg-(--bg-surface-secondary) cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-(--accent-blue)/10 flex items-center justify-center">
                          <Icon name="add" size={20} className="text-(--accent-blue)" />
                        </div>
                        <span className="font-sans text-xs font-semibold">Add Product</span>
                      </button>
                    </td>
                  )}
                </tr>

                <CompareRow label="Retail Price">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-(--border-theme)">
                      <span className="text-(--text-primary) font-bold font-mono text-lg block">
                        ${p.price.toFixed(2)}
                      </span>
                      {p.previousPrice && (
                        <span className="text-(--text-secondary) text-xs line-through font-mono">
                          ${p.previousPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-(--border-theme)" />}
                </CompareRow>

                <CompareRow label="Customer Rating">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-(--border-theme)">
                      {p.reviewCount > 0 ? (
                        <StarRating rating={p.rating} count={p.reviewCount} />
                      ) : (
                        <span className="font-mono text-[10px] text-(--text-muted)">NO REVIEWS</span>
                      )}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-(--border-theme)" />}
                </CompareRow>

                <CompareRow label="Availability">
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-r border-(--border-theme)">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${
                          p.stockStatus === 'in-stock'
                            ? 'bg-(--color-stock-green)/15 text-(--color-stock-green) border-(--color-stock-green)/30'
                            : p.stockStatus === 'low-stock'
                              ? 'bg-(--color-stock-yellow-val)/15 text-(--color-stock-yellow-val) border-(--color-stock-yellow-val)/30'
                              : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                        }`}
                      >
                        {p.stockStatus.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-(--border-theme)" />}
                </CompareRow>

                <CompareRow label="Category">
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="p-4 align-top text-xs text-(--text-primary) font-medium border-r border-(--border-theme)"
                    >
                      {p.categoryName ?? '—'}
                    </td>
                  ))}
                  {products.length < 4 && <td className="border-r border-(--border-theme)" />}
                </CompareRow>

                {specLabels.map((label) => {
                  const differs = rowDiffers(label)
                  return (
                    <CompareRow key={label} label={label} highlight={differs}>
                      {products.map((p) => (
                        <td
                          key={p.id}
                          className={`p-4 align-top text-xs border-r border-(--border-theme) ${
                            differs ? 'text-(--text-primary) font-semibold' : 'text-(--text-secondary)'
                          }`}
                        >
                          {getSpec(p, label)}
                        </td>
                      ))}
                      {products.length < 4 && <td className="border-r border-(--border-theme)" />}
                    </CompareRow>
                  )
                })}

                <tr>
                  <th className="bg-(--bg-surface-secondary) p-4 text-left sticky left-0 z-20 border-r border-(--border-theme)">
                    <span className="font-mono text-[10px] text-(--text-secondary) uppercase font-bold tracking-wider">
                      Purchase Action
                    </span>
                  </th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top bg-(--bg-surface-secondary) border-r border-(--border-theme)">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        disabled={p.stockStatus === 'out-of-stock'}
                        onClick={() => void handleAdd(p)}
                      >
                        <Icon name="add_shopping_cart" size={14} /> Add to Cart
                      </Button>
                    </td>
                  ))}
                  {products.length < 4 && <td className="bg-(--bg-surface) border-r border-(--border-theme)" />}
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
            className="bg-(--bg-surface) border border-(--border-theme) rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) flex items-center justify-between">
              <h3 className="text-(--text-primary) font-bold text-base">Select Product to Compare</h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="p-3 border-b border-(--border-theme) bg-(--bg-surface)">
              <div className="relative flex items-center bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme) px-3 py-2">
                <Icon name="search" size={16} className="text-(--text-secondary) mr-2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalog by name or brand…"
                  aria-label="Search products to compare"
                  className="w-full bg-transparent text-xs text-(--text-primary) focus:outline-none placeholder:text-(--text-secondary)"
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {pickable.length === 0 ? (
                <p className="text-center text-xs text-(--text-secondary) py-8">No products found.</p>
              ) : (
                pickable.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      toggleCompare(p.id)
                      if (compare.length + 1 >= 4) setPickerOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-(--bg-surface-secondary) border border-(--border-theme) hover:border-(--accent-blue) rounded-lg text-left transition-colors group cursor-pointer"
                  >
                    {p.primaryImage ? (
                      <img src={p.primaryImage} alt="" className="w-11 h-11 object-cover rounded-md bg-(--bg-surface) shrink-0" />
                    ) : (
                      <span className="w-11 h-11 rounded-md bg-(--bg-surface) shrink-0 flex items-center justify-center">
                        <Icon name="memory" size={20} className="text-(--accent-blue)" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-(--accent-blue) uppercase font-bold">{p.brandName}</span>
                      <h4 className="text-(--text-primary) text-xs font-semibold truncate group-hover:text-(--accent-blue)">
                        {p.name}
                      </h4>
                    </div>
                    <span className="font-mono text-xs text-(--accent-blue) font-bold shrink-0">
                      ${p.price.toFixed(2)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function CompareRow({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <tr className={highlight ? 'bg-(--accent-blue)/5' : ''}>
      <th className="bg-(--bg-surface-secondary) p-4 text-left align-top sticky left-0 z-20 border-r border-(--border-theme)">
        <span className="font-mono text-[10px] text-(--text-secondary) uppercase flex items-center gap-1.5 font-bold tracking-wider">
          {highlight && <span className="w-1.5 h-1.5 rounded-full bg-(--accent-blue) shrink-0" />}
          {label}
        </span>
      </th>
      {children}
    </tr>
  )
}
