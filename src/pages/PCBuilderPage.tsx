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

  // Count chosen slots
  const selectedCount = Object.values(builderSlots).filter(Boolean).length
  const osPrice = OS_OPTIONS.find((o) => o.label === os)?.price ?? 0
  const grandTotal = builderTotal + osPrice

  // ── Compatibility analysis ──
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
    if (missing.length) issues.push({ level: 'warning', text: `${missing.length} required component${missing.length > 1 ? 's' : ''} still needed to complete the build.` })

    return issues
  }, [builderSlots, builderWattage])

  const hasError = compatIssues.some((i) => i.level === 'error')

  // ── Performance estimate ──
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

  // Filter available products for modal
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

  // Suggested PSU capacity based on wattage + 150W headroom
  const recommendedPSU = builderWattage + 150

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">INTERACTIVE PC BUILDER</span>
        </nav>

        {/* Builder Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#16171d] border border-[#414755] rounded mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] text-[#007aff] bg-[#007aff15] px-2 py-0.5 rounded border border-[#007aff30] font-bold">
                RIG CONFIGURATOR v2.4
              </span>
              <span className="font-mono text-[10px] text-[#30d158] flex items-center gap-1 font-semibold">
                <Icon name="verified" size={12} /> COMPATIBILITY CHECKER ACTIVE
              </span>
            </div>
            <h1 className="text-white font-bold text-2xl tracking-tight">Custom PC Part Picker & Configurator</h1>
            <p className="text-[#8b90a0] text-xs mt-1">
              Select parts from our inventory. Real-time wattage estimation and automated pinout verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[#414755] hover:border-white text-[#c1c6d7] hover:text-white font-mono text-xs rounded transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Icon name="bookmark" size={15} /> SAVE
            </button>
            <button
              type="button"
              onClick={handleShareBuild}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[#414755] hover:border-white text-[#c1c6d7] hover:text-white font-mono text-xs rounded transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Icon name="share" size={15} /> SHARE
            </button>
            <button
              type="button"
              onClick={clearBuilder}
              disabled={selectedCount === 0}
              className="px-3.5 py-2 border border-[#414755] hover:border-[#ff453a] text-[#8b90a0] hover:text-[#ff453a] font-mono text-xs rounded transition-colors disabled:opacity-40"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => {
                addBuildToCart()
                navigate('/cart')
              }}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] active:bg-[#004fc2] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-lg"
            >
              <Icon name="shopping_cart" size={16} />
              ADD TO CART (${grandTotal.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Main Builder Layout: Slots + Summary Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Component Slots (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {BUILDER_SLOTS.map((slot) => {
              const selectedProduct = builderSlots[slot.key]

              return (
                <div
                  key={slot.key}
                  className={`p-4 rounded border transition-all ${
                    selectedProduct
                      ? 'bg-[#1a1b1f] border-[#007aff50]'
                      : 'bg-[#16171d] border-[#292a2e] hover:border-[#414755]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Slot Header / Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                        selectedProduct ? 'bg-[#007aff20] text-[#007aff]' : 'bg-[#1e1f23] text-[#8b90a0]'
                      }`}>
                        <Icon name={slot.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#8b90a0] uppercase block">{slot.name}</span>
                        {selectedProduct ? (
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm truncate max-w-sm">{selectedProduct.name}</span>
                            <span className="font-mono text-xs text-[#007aff] font-semibold">${selectedProduct.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-[#414755] font-mono text-xs">No component selected</span>
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
                            className="px-3 py-1.5 bg-[#1e1f23] hover:bg-[#292a2e] border border-[#414755] text-white font-mono text-[11px] rounded transition-colors"
                          >
                            CHANGE
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderSlot(slot.key, null)}
                            className="p-1.5 text-[#8b90a0] hover:text-[#ff453a] transition-colors"
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
                          className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <Icon name="add" size={16} /> CHOOSE {slot.name.split(' ')[0]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Operating System slot */}
            <div className={`p-4 rounded border transition-all ${os && os !== 'No OS (bare metal)' ? 'bg-[#1a1b1f] border-[#007aff50]' : 'bg-[#16171d] border-[#292a2e]'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${os !== 'No OS (bare metal)' ? 'bg-[#007aff20] text-[#007aff]' : 'bg-[#1e1f23] text-[#8b90a0]'}`}>
                    <Icon name="desktop_windows" size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] text-[#8b90a0] uppercase block">Operating System</span>
                    <span className="text-white font-bold text-sm">{os}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="bg-[#121317] border border-[#414755] text-[#e3e2e7] font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-[#007aff]"
                  >
                    {OS_OPTIONS.map((o) => (
                      <option key={o.label} value={o.label}>{o.label}{o.price ? ` (+$${o.price})` : ' (Free)'}</option>
                    ))}
                  </select>
                  <span className="font-mono text-xs text-[#007aff] font-semibold w-14 text-right">{osPrice ? `$${osPrice.toFixed(2)}` : 'FREE'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Summary Box (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* System Telemetry Box */}
            <div className="p-5 bg-[#1a1b1f] border border-[#414755] rounded space-y-4 sticky top-24">
              <div className="pb-3 border-b border-[#292a2e] flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">SYSTEM TELEMETRY</span>
                <span className="font-mono text-xs text-[#007aff]">{selectedCount} / 8 INSTALLED</span>
              </div>

              {/* Estimated Wattage Gauge */}
              <div className="bg-[#121317] p-3.5 rounded border border-[#292a2e]">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#8b90a0] flex items-center gap-1"><Icon name="bolt" size={14} className="text-[#ffd60a]" /> ESTIMATED WATTAGE</span>
                  <span className="text-white font-bold">{builderWattage} W</span>
                </div>
                <div className="w-full bg-[#1e1f23] h-2 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      builderWattage > 850 ? 'bg-[#ff453a]' : builderWattage > 500 ? 'bg-[#ffd60a]' : 'bg-[#30d158]'
                    }`}
                    style={{ width: `${Math.min(100, (builderWattage / 1200) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#8b90a0] mt-1.5 flex justify-between">
                  <span>Recommended PSU: <strong className="text-[#adc6ff]">{recommendedPSU}W+</strong></span>
                  <span>Max Peak Headroom</span>
                </div>
              </div>

              {/* Performance Estimate */}
              <div className="bg-[#121317] p-3.5 rounded border border-[#292a2e]">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-[#8b90a0] flex items-center gap-1"><Icon name="speed" size={14} className="text-[#007aff]" /> PERFORMANCE</span>
                  <span className="text-white font-bold">{perf.tier}</span>
                </div>
                <div className="w-full bg-[#1e1f23] h-2 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#007aff] to-[#30d158] transition-all duration-300" style={{ width: `${perf.score}%` }} />
                </div>
                <div className="text-[10px] font-mono text-[#8b90a0] mt-1.5 flex justify-between">
                  <span>Target: <strong className="text-[#adc6ff]">{perf.res}</strong></span>
                  <span>{perf.score}/100</span>
                </div>
              </div>

              {/* Compatibility Check */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-[#8b90a0] uppercase block">Compatibility</span>
                {compatIssues.length === 0 ? (
                  <div className="p-3 bg-[#16171d] border border-[#292a2e] rounded text-xs font-mono text-[#8b90a0]">Select components to run compatibility checks.</div>
                ) : (
                  compatIssues.map((issue, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded text-[11px] font-mono flex items-start gap-2 border ${
                        issue.level === 'error' ? 'bg-[#ff453a15] border-[#ff453a40] text-[#ff453a]'
                          : issue.level === 'warning' ? 'bg-[#ffd60a15] border-[#ffd60a40] text-[#ffd60a]'
                          : 'bg-[#30d15815] border-[#30d15840] text-[#30d158]'
                      }`}
                    >
                      <Icon name={issue.level === 'error' ? 'error' : issue.level === 'warning' ? 'warning' : 'check_circle'} size={14} className="shrink-0 mt-0.5" filled={issue.level === 'ok'} />
                      <span>{issue.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 pt-2 border-t border-[#292a2e] text-xs font-mono">
                <div className="flex justify-between text-[#8b90a0]">
                  <span>Component Subtotal:</span>
                  <span className="text-white">${builderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#8b90a0]">
                  <span>Operating System:</span>
                  <span className={osPrice ? 'text-white' : 'text-[#30d158]'}>{osPrice ? `$${osPrice.toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between text-[#8b90a0]">
                  <span>Assembly + 72H Testing:</span>
                  <span className="text-[#30d158]">INCLUDED</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#292a2e]">
                  <span>TOTAL:</span>
                  <span className="text-[#007aff]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {hasError && (
                  <p className="text-[10px] font-mono text-[#ff453a] flex items-center gap-1"><Icon name="error" size={12} /> Resolve compatibility errors before ordering.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    addBuildToCart()
                    navigate('/cart')
                  }}
                  disabled={selectedCount === 0 || hasError}
                  className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] active:bg-[#004fc2] disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                >
                  <Icon name="shopping_cart" size={16} /> ADD BUILD TO CART
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleSaveBuild} disabled={selectedCount === 0} className="py-2 border border-[#414755] hover:border-white text-[#c1c6d7] hover:text-white font-mono text-[10px] rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-1"><Icon name="bookmark" size={13} /> SAVE</button>
                  <button type="button" onClick={handleShareBuild} disabled={selectedCount === 0} className="py-2 border border-[#414755] hover:border-white text-[#c1c6d7] hover:text-white font-mono text-[10px] rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-1"><Icon name="share" size={13} /> SHARE</button>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </div>

      {/* Component Selection Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#16171d] border border-[#414755] rounded max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 bg-[#1a1b1f] border-b border-[#292a2e] flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#007aff] uppercase font-bold block">PART SELECTION</span>
                <h3 className="text-white font-bold text-lg">Choose {activeSlot.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="text-[#8b90a0] hover:text-white p-1"
                aria-label="Close modal"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-[#292a2e] bg-[#121317]">
              <div className="relative flex items-center bg-[#1e1f23] rounded border border-[#414755] px-3 py-1.5">
                <Icon name="search" size={16} className="text-[#8b90a0] mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeSlot.name}...`}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-[#8b90a0]"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {slotProducts.length > 0 ? (
                slotProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 bg-[#1a1b1f] border border-[#292a2e] hover:border-[#007aff] rounded flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={prod.image} alt={prod.name} className="w-14 h-14 object-cover rounded bg-[#1e1f23] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#8b90a0] uppercase block">{prod.brand}</span>
                        <h4 className="text-white font-semibold text-xs truncate max-w-md">{prod.name}</h4>
                        <div className="flex gap-2 text-[10px] font-mono text-[#8b90a0] mt-0.5">
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
                        className="px-3.5 py-1.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-[11px] font-bold rounded transition-colors"
                      >
                        SELECT
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-[#8b90a0] font-mono text-xs">
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
