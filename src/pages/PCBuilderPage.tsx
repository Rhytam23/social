import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Price } from '../components/ui'
import { allProducts } from '../data'
import type { BuilderCategoryKey, ProductCategory } from '../types'
import { useShop } from '../context/ShopContext'

interface SlotConfig {
  key: BuilderCategoryKey
  name: string
  category: ProductCategory
  icon: string
  required: boolean
}

const BUILDER_SLOTS: SlotConfig[] = [
  { key: 'cpu', name: 'Processor (CPU)', category: 'CPUs', icon: 'memory', required: true },
  { key: 'cooler', name: 'CPU Cooler (AIO / Air)', category: 'Cooling', icon: 'mode_fan', required: true },
  { key: 'motherboard', name: 'Motherboard', category: 'Motherboards', icon: 'developer_board', required: true },
  { key: 'memory', name: 'Memory (RAM)', category: 'RAM', icon: 'storage', required: true },
  { key: 'videoCard', name: 'Graphics Card (GPU)', category: 'Graphics Cards', icon: 'videogame_asset', required: true },
  { key: 'storage', name: 'Primary Storage (NVMe SSD)', category: 'Storage', icon: 'hard_drive', required: true },
  { key: 'case', name: 'Chassis / Case', category: 'Cases', icon: 'inventory_2', required: true },
  { key: 'powerSupply', name: 'Power Supply (PSU)', category: 'Power Supplies', icon: 'power', required: true },
]

const OS_OPTIONS = [
  { label: 'Windows 11 Pro (64-bit)', price: 199 },
  { label: 'Windows 11 Home (64-bit)', price: 139 },
  { label: 'Ubuntu Linux 24.04 LTS', price: 0 },
  { label: 'No OS (bare metal)', price: 0 },
]

function ratedWattage(text: string): number | null {
  const m = text.match(/(\d{3,4})\s*W/i)
  return m ? Number(m[1]) : null
}

export function PCBuilderPage() {
  const navigate = useNavigate()
  const { builderSlots, setBuilderSlot, clearBuilder, addBuildToCart, builderTotal, builderWattage, showToast } = useShop()
  const [activeSlot, setActiveSlot] = useState<SlotConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [os, setOs] = useState(OS_OPTIONS[0].label)

  const selectedCount = Object.values(builderSlots).filter(Boolean).length
  const osPrice = OS_OPTIONS.find((o) => o.label === os)?.price ?? 0
  const grandTotal = builderTotal + osPrice

  const compatIssues = useMemo(() => {
    const issues: { level: 'error' | 'warning' | 'ok'; text: string }[] = []
    const cpu = builderSlots.cpu
    const mobo = builderSlots.motherboard
    const psu = builderSlots.powerSupply

    if (cpu && mobo) {
      const isIntelCpu = /intel|core/i.test(cpu.brand + cpu.name)
      const isAmdCpu = /amd|ryzen/i.test(cpu.brand + cpu.name)
      const moboText = mobo.name + ' ' + mobo.specifications.map((s) => s.value).join(' ')
      const isAm5 = /AM5/i.test(moboText)
      const isLga = /LGA\s?1700|LGA\s?1851|Z790|Z890|B760/i.test(moboText)
      if (isIntelCpu && isAm5) issues.push({ level: 'error', text: 'Intel CPU is not compatible with this AM5 (AMD) motherboard socket.' })
      else if (isAmdCpu && isLga) issues.push({ level: 'error', text: 'AMD Ryzen CPU is not compatible with this Intel LGA motherboard socket.' })
      else issues.push({ level: 'ok', text: 'CPU and motherboard sockets are compatible.' })
    }

    if (psu) {
      const rated = ratedWattage(psu.name + ' ' + psu.specifications.map((s) => s.value).join(' '))
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
    const summary = `My PREMIUM PC Build (${grandTotal.toFixed(2)} USD)\nOS: ${os}\n${selected.join('\n')}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(() => showToast('Build summary copied to clipboard', 'info')).catch(() => showToast('Could not copy build', 'info'))
    } else {
      showToast('Clipboard not available', 'info')
    }
  }

  const slotProducts = useMemo(() => {
    if (!activeSlot) return []
    return allProducts.filter((p) => {
      const matchCat = p.category.toLowerCase() === activeSlot.category.toLowerCase()
      const matchQuery = searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      return matchCat && matchQuery
    })
  }, [activeSlot, searchQuery])

  const recommendedPSU = builderWattage + 150

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-4">
          <Link to="/" className="hover:text-[var(--text-primary)]">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-[var(--text-primary)] font-medium">Custom PC Builder</span>
        </nav>

        {/* Builder Header - borderless */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[var(--accent-blue)] uppercase tracking-wider block mb-1">
              Interactive Configurator
            </span>
            <h1 className="text-[var(--text-primary)] font-bold text-2xl tracking-tight">Custom PC Part Picker</h1>
            <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-0.5">
              Select compatible components with live wattage estimation and system compatibility checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[var(--border-theme)] hover:bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] text-xs rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="bookmark" size={15} /> Save
            </button>
            <button
              type="button"
              onClick={handleShareBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[var(--border-theme)] hover:bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] text-xs rounded-lg transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="share" size={15} /> Share
            </button>
            <button
              type="button"
              onClick={clearBuilder}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[var(--border-theme)] hover:border-rose-500 text-[var(--text-secondary)] hover:text-rose-500 text-xs rounded-lg transition-all disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                addBuildToCart()
                navigate('/cart')
              }}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Icon name="shopping_cart" size={16} />
              Add to Cart (${grandTotal.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Main Builder Layout: Slots + Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Component Slots (8 cols) - Row layouts with border-b, no border boxes */}
          <div className="lg:col-span-8 divide-y divide-[var(--border-theme)]">
            {BUILDER_SLOTS.map((slot) => {
              const selectedProduct = builderSlots[slot.key]

              return (
                <div key={slot.key} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Slot Header / Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedProduct ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)]'
                      }`}>
                        <Icon name={slot.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-[var(--text-secondary)] block font-medium">{slot.name}</span>
                        {selectedProduct ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] font-bold text-sm truncate max-w-sm">{selectedProduct.name}</span>
                            <span className="text-xs text-[var(--accent-blue)] font-semibold">${selectedProduct.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">No component selected</span>
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
                            className="px-3 py-1.5 bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] text-[var(--text-primary)] text-xs rounded-lg transition-all cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderSlot(slot.key, null)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
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
                          className="px-4 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Icon name="add" size={16} /> Choose
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Operating System slot */}
            <div className="py-4 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${os !== 'No OS (bare metal)' ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)]'}`}>
                    <Icon name="desktop_windows" size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-[var(--text-secondary)] block font-medium">Operating System</span>
                    <span className="text-[var(--text-primary)] font-bold text-sm">{os}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] text-[var(--text-primary)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)]"
                  >
                    {OS_OPTIONS.map((o) => (
                      <option key={o.label} value={o.label}>{o.label}{o.price ? ` (+$${o.price})` : ' (Free)'}</option>
                    ))}
                  </select>
                  <span className="text-[var(--accent-blue)] font-semibold w-14 text-right">{osPrice ? `$${osPrice.toFixed(2)}` : 'FREE'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Summary Box (4 cols) - Borderless */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="pb-3 border-b border-[var(--border-theme)] flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">SYSTEM TELEMETRY</span>
                <span className="font-mono text-xs text-[var(--accent-blue)]">{selectedCount} / 8 INSTALLED</span>
              </div>

              {/* Estimated Wattage Gauge - borderless */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1"><Icon name="bolt" size={14} className="text-amber-400" /> ESTIMATED WATTAGE</span>
                  <span className="text-[var(--text-primary)] font-bold">{builderWattage} W</span>
                </div>
                <div className="w-full bg-[var(--bg-surface-secondary)] h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      builderWattage > 850 ? 'bg-rose-500' : builderWattage > 500 ? 'bg-amber-500' : 'bg-[var(--color-stock-green)]'
                    }`}
                    style={{ width: `${Math.min(100, (builderWattage / 1200) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1 flex justify-between">
                  <span>Recommended PSU: <strong className="text-[var(--accent-blue)]">{recommendedPSU}W+</strong></span>
                  <span>Max Peak Headroom</span>
                </div>
              </div>

              {/* Performance Estimate - borderless */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1"><Icon name="speed" size={14} className="text-[var(--accent-blue)]" /> PERFORMANCE</span>
                  <span className="text-[var(--text-primary)] font-bold">{perf.tier}</span>
                </div>
                <div className="w-full bg-[var(--bg-surface-secondary)] h-2 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--color-stock-green)] transition-all duration-300" style={{ width: `${perf.score}%` }} />
                </div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1 flex justify-between">
                  <span>Target: <strong className="text-[var(--accent-blue)]">{perf.res}</strong></span>
                  <span>{perf.score}/100</span>
                </div>
              </div>

              {/* Compatibility Check */}
              <div className="space-y-1.5 pt-2">
                <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase block">Compatibility</span>
                {compatIssues.length === 0 ? (
                  <div className="p-3 bg-[var(--bg-surface-secondary)] rounded text-xs font-mono text-[var(--text-secondary)]">Select components to run compatibility checks.</div>
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
              <div className="space-y-2 pt-2 border-t border-[var(--border-theme)] text-xs font-mono">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Component Subtotal:</span>
                  <span className="text-[var(--text-primary)]">${builderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Operating System:</span>
                  <span className={osPrice ? 'text-[var(--text-primary)]' : 'text-[var(--color-stock-green)]'}>{osPrice ? `$${osPrice.toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Assembly + 72H Testing:</span>
                  <span className="text-[var(--color-stock-green)] font-semibold">INCLUDED</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border-theme)]">
                  <span>TOTAL:</span>
                  <span className="text-[var(--accent-blue)]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {hasError && (
                  <p className="text-[10px] font-mono text-rose-500 flex items-center gap-1"><Icon name="error" size={12} /> Resolve compatibility errors before ordering.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    addBuildToCart()
                    navigate('/cart')
                  }}
                  disabled={selectedCount === 0 || hasError}
                  className="w-full py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Icon name="shopping_cart" size={16} /> ADD BUILD TO CART
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleSaveBuild} disabled={selectedCount === 0} className="py-2 border border-[var(--border-theme)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[10px] rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"><Icon name="bookmark" size={13} /> SAVE</button>
                  <button type="button" onClick={handleShareBuild} disabled={selectedCount === 0} className="py-2 border border-[var(--border-theme)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[10px] rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"><Icon name="share" size={13} /> SHARE</button>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </div>

      {/* Component Selection Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-[var(--bg-surface-secondary)] border-b border-[var(--border-theme)] flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[var(--accent-blue)] uppercase font-bold block">PART SELECTION</span>
                <h3 className="text-[var(--text-primary)] font-bold text-lg">Choose {activeSlot.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-[var(--border-theme)] bg-[var(--bg-surface)]">
              <div className="relative flex items-center bg-[var(--bg-surface-secondary)] rounded-lg border border-[var(--border-theme)] px-3 py-1.5">
                <Icon name="search" size={16} className="text-[var(--text-secondary)] mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeSlot.name}...`}
                  className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[var(--bg-primary)]">
              {slotProducts.length > 0 ? (
                slotProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border-theme)] hover:border-[var(--accent-blue)] rounded-lg flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={prod.image} alt={prod.name} className="w-14 h-14 object-cover rounded bg-[var(--bg-surface-secondary)] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase block">{prod.brand}</span>
                        <h4 className="text-[var(--text-primary)] font-semibold text-xs truncate max-w-md">{prod.name}</h4>
                        <div className="flex gap-2 text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                          {prod.specifications.slice(0, 2).map((s) => (
                            <span key={s.label}>{s.label}: {s.value}</span>
                          ))}
                        </div>
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
                        className="px-3.5 py-1.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-[11px] font-bold rounded transition-colors cursor-pointer"
                      >
                        SELECT
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-[var(--text-secondary)] font-mono text-xs">
                  No matching components found for "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
