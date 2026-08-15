import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function OrderTrackingPage() {
  const [searchParams] = useSearchParams()
  const initialId = searchParams.get('id') || 'ORD-892410'

  const [inputOrderId, setInputOrderId] = useState(initialId)
  const [activeOrderId, setActiveOrderId] = useState(initialId)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setInputOrderId(id)
      setActiveOrderId(id)
    }
  }, [searchParams])

  const steps = [
    { title: 'Order Authorized & Paid', desc: 'Payment verified via 256-Bit SSL token', time: 'Aug 15, 08:30 AM', done: true },
    { title: 'Component Allocation & Picking', desc: 'Genuine retail parts pulled from warehouse vault', time: 'Aug 15, 10:15 AM', done: true },
    { title: 'Hardware Stress & Thermal Burn-in', desc: 'Prime95 & 3DMark stability benchmark verified', time: 'Aug 15, 02:40 PM', done: true },
    { title: 'Dispatched with Express Courier', desc: 'Handed to Priority Air Courier with live GPS', time: 'Aug 15, 05:10 PM', done: true },
    { title: 'Out for Final Delivery', desc: 'Estimated delivery tomorrow by 01:00 PM', time: 'Expected Tomorrow', done: false },
  ]

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6 max-w-4xl mx-auto">

        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">LIVE ORDER TRACKER</span>
        </nav>

        <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Live Hardware Dispatch Tracking</h1>
        <p className="text-[#8b90a0] text-xs mb-6">
          Real-time tracking of your hardware order, quality testing stages, and courier transit.
        </p>

        {/* Order Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setActiveOrderId(inputOrderId)
          }}
          className="flex gap-2 p-4 bg-[#1a1b1f] border border-[#414755] rounded mb-8"
        >
          <input
            type="text"
            value={inputOrderId}
            onChange={(e) => setInputOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g. ORD-892410)..."
            className="flex-1 bg-[#121317] border border-[#414755] rounded px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#007aff]"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors flex items-center gap-1.5"
          >
            <Icon name="search" size={16} /> TRACK ORDER
          </button>
        </form>

        {/* Tracking Details Banner */}
        <div className="p-6 bg-[#16171d] border border-[#414755] rounded space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#292a2e]">
            <div>
              <span className="text-[10px] font-mono text-[#8b90a0] uppercase block">ACTIVE TRACKING FOR</span>
              <span className="text-white font-bold font-mono text-lg">{activeOrderId}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#30d158] bg-[#30d15815] px-3 py-1 rounded border border-[#30d15830] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#30d158] inline-block animate-pulse" />
                STATUS: IN TRANSIT
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-6 pl-4 border-l-2 border-[#007aff] relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  step.done ? 'bg-[#007aff] border-[#007aff]' : 'bg-[#121317] border-[#414755]'
                }`}>
                  {step.done && <Icon name="check" size={10} className="text-white" />}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className={`text-sm font-bold ${step.done ? 'text-white' : 'text-[#8b90a0]'}`}>{step.title}</h3>
                  <span className="font-mono text-[10px] text-[#8b90a0]">{step.time}</span>
                </div>
                <p className="text-xs text-[#8b90a0] mt-0.5">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#121317] rounded border border-[#292a2e] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8b90a0]">Courier Carrier: <strong className="text-white">Priority Express Air (Track #TRK-PC-49201948)</strong></span>
            <span className="text-[#30d158] font-bold">Signature Required</span>
          </div>
        </div>

      </div>
    </main>
  )
}
