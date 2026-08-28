import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Price } from '../components/ui'
import type { BuilderCategoryKey } from '../types'
import { useShop } from '../context/ShopContext'
import { useCart } from '../context/CartContext'
import { productService, type ProductSummary } from '../services/productService'

interface SlotConfig {
  key: BuilderCategoryKey
  name: string
  categorySlug: string
  icon: string
  required: boolean
}

const BUILDER_SLOTS: SlotConfig[] = [
  { key: 'cpu', name: 'Processor (CPU)', categorySlug: 'cpus', icon: 'memory', required: true },
  { key: 'cooler', name: 'CPU Cooler (AIO / Air)', categorySlug: 'cooling', icon: 'mode_fan', required: true },
  { key: 'motherboard', name: 'Motherboard', categorySlug: 'motherboards', icon: 'developer_board', required: true },
  { key: 'memory', name: 'Memory (RAM)', categorySlug: 'ram', icon: 'storage', required: true },
  { key: 'videoCard', name: 'Graphics Card (GPU)', categorySlug: 'gpus', icon: 'videogame_asset', required: true },
  { key: 'storage', name: 'Primary Storage (NVMe SSD)', categorySlug: 'storage', icon: 'hard_drive', required: true },
  { key: 'case', name: 'Chassis / Case', categorySlug: 'cases', icon: 'inventory_2', required: true },
  { key: 'powerSupply', name: 'Power Supply (PSU)', categorySlug: 'psus', icon: 'power', required: true },
]

function ratedWattage(text: string): number | null {
  const m = text.match(/(\d{3,4})\s*W/i)
  return m ? Number(m[1]) : null
}

export function PCBuilderPage() {
  const navigate = useNavigate()
  const { builderSlots, setBuilderSlot, clearBuilder, builderTotal, builderWattage, showToast } = useShop()
  const { addItem } = useCart()
  const [activeSlot, setActiveSlot] = useState<SlotConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [slotProducts, setSlotProducts] = useState<ProductSummary[]>([])
  const [slotLoading, setSlotLoading] = useState(false)
  const [addingBuild, setAddingBuild] = useState(false)

  const selectedCount = Object.values(builderSlots).filter(Boolean).length
  const grandTotal = builderTotal

  const compatIssues = useMemo(() => {
    const issues: { level: 'error' | 'warning' | 'ok'; text: string }[] = []
    const cpu = builderSlots.cpu
    const mobo = builderSlots.motherboard
    const psu = builderSlots.powerSupply

    if (cpu && mobo) {
      const cpuText = `${cpu.brandName ?? ''} ${cpu.name}`
      const isIntelCpu = /intel|core/i.test(cpuText)
      const isAmdCpu = /amd|ryzen/i.test(cpuText)
      const moboText = mobo.name
      const isAm5 = /AM5/i.test(moboText)
      const isLga = /LGA\s?1700|LGA\s?1851|Z790|Z890|B760/i.test(moboText)
      if (isIntelCpu && isAm5) issues.push({ level: 'error', text: 'Intel CPU is not compatible with this AM5 (AMD) motherboard socket.' })
      else if (isAmdCpu && isLga) issues.push({ level: 'error', text: 'AMD Ryzen CPU is not compatible with this Intel LGA motherboard socket.' })
      else issues.push({ level: 'ok', text: 'No socket conflict detected between CPU and motherboard.' })
    }

    if (psu) {
      const rated = ratedWattage(psu.name) ?? psu.wattage
      const recommended = builderWattage + 150
      if (rated && rated < recommended) issues.push({ level: 'error', text: `Power supply (${rated}W) is below the recommended ${recommended}W for this configuration.` })
      else if (rated) issues.push({ level: 'ok', text: `Power supply capacity (${rated}W) is sufficient with headroom.` })
    } else if (builderWattage > 400) {
      issues.push({ level: 'warning', text: `Add a power supply rated for at least ${builderWattage + 150}W.` })
    }

    const missing = BUILDER_SLOTS.filter((s) => s.required && !builderSlots[s.key])
    if (issues.length === 0 && missing.length) {
      issues.push({ level: 'warning', text: `${missing.length} required component${missing.length > 1 ? 's' : ''} still needed to complete the build.` })
    }

    return issues
  }, [builderSlots, builderWattage])

  const hasError = compatIssues.some((i) => i.level === 'error')

  const perf = useMemo(() => {
    const gpu = builderSlots.videoCard
    const cpu = builderSlots.cpu
    if (!gpu) return { tier: 'Add a GPU', score: 0, res: '—' }
    let score = 40
    if (/5090|4090/i.test(gpu.name)) score = 98
    else if (/4080|7900\s?XTX/i.test(gpu.name)) score = 88
    else if (/4070|7800/i.test(gpu.name)) score = 74
    if (cpu && /x3d|14900|285k/i.test(cpu.name)) score = Math.min(100, score + 4)
    const res = score >= 90 ? '4K Ultra 144+ FPS' : score >= 75 ? '1440p Ultra 165+ FPS' : score >= 55 ? '1080p High 144+ FPS' : 'Entry 1080p'
    const tier = score >= 90 ? 'Enthusiast 4K' : score >= 75 ? 'High-End 1440p' : score >= 55 ? 'Mainstream 1080p' : 'Starter'
    return { tier, score, res }
  }, [builderSlots])

  const handleSaveBuild = () => {
    showToast('Build saved to your browser', 'info')
  }

  const handleShareBuild = () => {
    const selected = BUILDER_SLOTS.filter((s) => builderSlots[s.key])
      .map((s) => `${s.name}: ${builderSlots[s.key]!.name}`)
    const summary = `My PREMIUM PC Build (${grandTotal.toFixed(2)} USD)\n${selected.join('\n')}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(() => showToast('Build summary copied to clipboard', 'info')).catch(() => showToast('Could not copy build', 'info'))
    } else {
      showToast('Clipboard not available', 'info')
    }
  }

  // Adds every selected component to the real server cart.
  const handleAddBuildToCart = async () => {
    const selected = Object.values(builderSlots).filter(Boolean) as ProductSummary[]
    if (selected.length === 0) {
      showToast('No components selected in your build', 'info')
      return
    }
    setAddingBuild(true)
    let added = 0
    for (const product of selected) {
      try {
        await addItem(product.id, 1)
        added++
      } catch {
        // Continue with the remaining parts.
      }
    }
    setAddingBuild(false)
    if (added > 0) {
      showToast(`Added ${added} build part${added === 1 ? '' : 's'} to your cart`, 'cart')
      navigate('/cart')
    } else {
      showToast('Could not add build parts to cart', 'info')
    }
  }

  // Component picker results come from the catalog API, filtered by category.
  useEffect(() => {
    if (!activeSlot) {
      setSlotProducts([])
      return
    }
    let active = true
    setSlotLoading(true)
    productService
      .list({
        category: activeSlot.categorySlug,
        limit: 50,
        ...(searchQuery ? { search: searchQuery } : {}),
      })
      .then((res) => {
        if (active) setSlotProducts(res.data)
      })
      .catch(() => {
        if (active) setSlotProducts([])
      })
      .finally(() => {
        if (active) setSlotLoading(false)
      })
    return () => {
      active = false
    }
  }, [activeSlot, searchQuery])

  const recommendedPSU = builderWattage + 150

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-(--text-secondary) mb-4">
          <Link to="/" className="hover:text-(--text-primary)">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-(--text-primary) font-medium">Custom PC Builder</span>
        </nav>

        {/* Builder Header - borderless */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-(--accent-blue) uppercase tracking-wider block mb-1">
              Interactive Configurator
            </span>
            <h1 className="text-(--text-primary) font-bold text-2xl tracking-tight">Custom PC Part Picker</h1>
            <p className="text-(--text-secondary) text-xs md:text-sm mt-0.5">
              Select compatible components with live wattage estimation and system compatibility checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-(--border-theme) hover:bg-(--bg-surface-secondary) text-(--text-primary) text-xs rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="bookmark" size={15} /> Save
            </button>
            <button
              type="button"
              onClick={handleShareBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-(--border-theme) hover:bg-(--bg-surface-secondary) text-(--text-primary) text-xs rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="share" size={15} /> Share
            </button>
            <button
              type="button"
              onClick={clearBuilder}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-(--border-theme) hover:border-rose-500 text-(--text-secondary) hover:text-rose-500 text-xs rounded-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void handleAddBuildToCart()}
              disabled={selectedCount === 0 || addingBuild}
              className="px-5 py-2.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Icon name="shopping_cart" size={16} />
              {addingBuild ? 'Adding…' : `Add to Cart ($${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>

        {/* Main Builder Layout: Slots + Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Component Slots (8 cols) - Row layouts with border-b, no border boxes */}
          <div className="lg:col-span-8 divide-y divide-(--border-theme)">
            {BUILDER_SLOTS.map((slot) => {
              const selectedProduct = builderSlots[slot.key]

              return (
                <div key={slot.key} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Slot Header / Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedProduct ? 'bg-(--accent-blue)/10 text-(--accent-blue)' : 'bg-(--bg-surface-secondary) text-(--text-muted)'
                      }`}>
                        <Icon name={slot.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-(--text-secondary) block font-medium">{slot.name}</span>
                        {selectedProduct ? (
                          <div className="flex items-center gap-2">
                            <span className="text-(--text-primary) font-bold text-sm truncate max-w-sm">{selectedProduct.name}</span>
                            <span className="text-xs text-(--accent-blue) font-semibold">${selectedProduct.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-(--text-muted) text-xs">No component selected</span>
                        )}
                      </div>
                    </div>

                    {/* Slot Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedProduct ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSlot(slot)
                              setSearchQuery('')
                            }}
                            className="px-3 py-1.5 bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) text-xs rounded-lg transition-all cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderSlot(slot.key, null)}
                            className="p-1.5 text-(--text-secondary) hover:text-rose-500 transition-colors cursor-pointer"
                            aria-label="Remove component"
                          >
                            <Icon name="delete" size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlot(slot)
                            setSearchQuery('')
                          }}
                          className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Icon name="add" size={16} /> Choose
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

          </div>

          {/* Persistent Summary Box (4 cols) - Borderless */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="pb-3 border-b border-(--border-theme) flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-(--text-primary) uppercase tracking-wider">SYSTEM TELEMETRY</span>
                <span className="font-mono text-xs text-(--accent-blue)">{selectedCount} / 8 INSTALLED</span>
              </div>

              {/* Estimated Wattage Gauge - borderless */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-(--text-secondary) flex items-center gap-1"><Icon name="bolt" size={14} className="text-amber-400" /> ESTIMATED WATTAGE</span>
                  <span className="text-(--text-primary) font-bold">{builderWattage} W</span>
                </div>
                <div className="w-full bg-(--bg-surface-secondary) h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      builderWattage > 850 ? 'bg-rose-500' : builderWattage > 500 ? 'bg-amber-500' : 'bg-(--color-stock-green)'
                    }`}
                    style={{ width: `${Math.min(100, (builderWattage / 1200) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-(--text-secondary) mt-1 flex justify-between">
                  <span>Recommended PSU: <strong className="text-(--accent-blue)">{recommendedPSU}W+</strong></span>
                  <span>Max Peak Headroom</span>
                </div>
              </div>

              {/* Performance Estimate - borderless */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-(--text-secondary) flex items-center gap-1"><Icon name="speed" size={14} className="text-(--accent-blue)" /> PERFORMANCE</span>
                  <span className="text-(--text-primary) font-bold">{perf.tier}</span>
                </div>
                <div className="w-full bg-(--bg-surface-secondary) h-2 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-(--accent-blue) to-(--color-stock-green) transition-all duration-300" style={{ width: `${perf.score}%` }} />
                </div>
                <div className="text-[10px] font-mono text-(--text-secondary) mt-1 flex justify-between">
                  <span>Target: <strong className="text-(--accent-blue)">{perf.res}</strong></span>
                  <span>{perf.score}/100</span>
                </div>
              </div>

              {/* Compatibility Check */}
              <div className="space-y-1.5 pt-2">
                <span className="font-mono text-[10px] text-(--text-secondary) uppercase block">Compatibility</span>
                {compatIssues.length === 0 ? (
                  <div className="p-3 bg-(--bg-surface-secondary) rounded text-xs font-mono text-(--text-secondary)">Select components to run compatibility checks.</div>
                ) : (
                  compatIssues.map((issue, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded text-[11px] font-mono flex items-start gap-2 border ${
                        issue.level === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : issue.level === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}
                    >
                      <Icon name={issue.level === 'error' ? 'error' : issue.level === 'warning' ? 'warning' : 'check_circle'} size={14} className="shrink-0 mt-0.5" filled={issue.level === 'ok'} />
                      <span>{issue.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 pt-2 border-t border-(--border-theme) text-xs font-mono">
                <div className="flex justify-between text-(--text-secondary)">
                  <span>Component Subtotal:</span>
                  <span className="text-(--text-primary)">${builderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-(--text-primary) pt-2 border-t border-(--border-theme)">
                  <span>TOTAL:</span>
                  <span className="text-(--accent-blue)">${grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-(--text-muted) leading-relaxed pt-1">
                  Parts are added to your cart individually. Shipping and tax are calculated at checkout.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {hasError && (
                  <p className="text-[10px] font-mono text-rose-500 flex items-center gap-1"><Icon name="error" size={12} /> Resolve compatibility errors before ordering.</p>
                )}
                <button
                  type="button"
                  onClick={() => void handleAddBuildToCart()}
                  disabled={selectedCount === 0 || hasError || addingBuild}
                  className="w-full py-3 bg-(--accent-blue) hover:bg-(--accent-blue-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Icon name="shopping_cart" size={16} /> {addingBuild ? 'Adding…' : 'Add Build to Cart'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleSaveBuild} disabled={selectedCount === 0} className="py-2 bg-(--bg-surface-secondary) border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) font-sans text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"><Icon name="bookmark" size={13} /> Save Build</button>
                  <button type="button" onClick={handleShareBuild} disabled={selectedCount === 0} className="py-2 bg-(--bg-surface-secondary) border border-(--border-theme) hover:border-(--text-secondary) text-(--text-primary) font-sans text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"><Icon name="share" size={13} /> Share Build</button>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </div>

      {/* Component Selection Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-(--bg-surface-secondary) border-b border-(--border-theme) flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-(--accent-blue) uppercase font-bold block">PART SELECTION</span>
                <h3 className="text-(--text-primary) font-bold text-lg">Choose {activeSlot.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="text-(--text-secondary) hover:text-(--text-primary) p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-(--border-theme) bg-(--bg-surface)">
              <div className="relative flex items-center bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme) px-3 py-1.5">
                <Icon name="search" size={16} className="text-(--text-secondary) mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeSlot.name}...`}
                  className="w-full bg-transparent text-xs text-(--text-primary) focus:outline-none placeholder:text-(--text-secondary)"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-(--bg-primary)">
              {slotLoading ? (
                <div className="py-12 text-center text-(--text-secondary) font-mono text-xs">Loading components…</div>
              ) : slotProducts.length > 0 ? (
                slotProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 bg-(--bg-surface) border border-(--border-theme) hover:border-(--accent-blue) rounded-lg flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.primaryImage ? (
                        <img
                          src={prod.primaryImage}
                          alt={prod.name}
                          className="w-14 h-14 object-cover rounded bg-(--bg-surface-secondary) shrink-0"
                        />
                      ) : (
                        <span className="w-14 h-14 rounded bg-(--bg-surface-secondary) shrink-0 flex items-center justify-center">
                          <Icon name="memory" size={22} className="text-(--accent-blue)" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-(--text-secondary) uppercase block">
                          {prod.brandName}
                        </span>
                        <h4 className="text-(--text-primary) font-semibold text-xs truncate max-w-md">{prod.name}</h4>
                        <span className="text-[10px] font-mono text-(--text-secondary) mt-0.5 block">
                          {prod.stockStatus === 'out-of-stock' ? 'Out of stock' : `${prod.stockAvailable} in stock`}
                          {prod.wattage ? ` · ${prod.wattage}W` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <Price price={prod.price} size="sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderSlot(activeSlot.key, prod)
                          setActiveSlot(null)
                        }}
                        className="px-3.5 py-1.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white font-mono text-[11px] font-bold rounded transition-colors cursor-pointer"
                      >
                        SELECT
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-(--text-secondary) font-mono text-xs">
                  {searchQuery ? `No matching components found for "${searchQuery}".` : 'No components available in this category.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
