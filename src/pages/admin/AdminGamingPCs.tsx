import { useState } from 'react'
import { Icon } from '../../components/ui'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useShop } from '../../context/ShopContext'
import type { GamingPC, PerformanceTier } from '../../types'

export function AdminGamingPCs() {
  const { gamingPCs, addGamingPC, deleteGamingPC } = useShop()

  const [name, setName] = useState('')
  const [cpu, setCpu] = useState('Intel Core i9-14900KS')
  const [gpu, setGpu] = useState('NVIDIA RTX 5090 32GB')
  const [ram, setRam] = useState('64GB DDR5 7200MHz')
  const [storage, setStorage] = useState('2TB Gen5 NVMe SSD')
  const [price, setPrice] = useState(3499)
  const [image, setImage] = useState('https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80')
  const [tier, setTier] = useState<PerformanceTier>('Tier 4 - Enthusiast Extreme')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const newPC: GamingPC = {
      id: `rig-${Date.now()}`,
      name,
      brand: 'PREMIUM PC HYPERION',
      category: 'Gaming PCs',
      price: Number(price),
      rating: 5.0,
      reviewCount: 8,
      stockStatus: 'in-stock',
      image,
      slug: `rig-${Date.now()}`,
      isFeatured: true,
      specifications: [
        { label: 'CPU', value: cpu },
        { label: 'GPU', value: gpu },
        { label: 'RAM', value: ram },
        { label: 'Storage', value: storage },
      ],
      cpu,
      gpu,
      ram,
      storage,
      caseName: 'HYPERION Panoramic Dual-Chamber Glass',
      powerSupply: '1200W ATX 3.0 Platinum 80+',
      coolingType: '360mm LCD Liquid Cooler',
      performanceTier: tier,
      fpsBenchmarks: [
        { game: 'Cyberpunk 2077 (Path Tracing)', fps1440p: 165, fps4K: 110 },
        { game: 'Call of Duty: Warzone 3', fps1440p: 340, fps4K: 220 },
      ],
    }

    addGamingPC(newPC)
    setName('')
  }

  const fieldClass = 'bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff]'
  const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1 uppercase font-bold tracking-wider'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Prebuilt Gaming PCs CMS"
        subtitle="Manage custom engineered prebuilt gaming rigs & benchmark specs"
      />

      {/* Add Rig Form */}
      <form onSubmit={handleAdd} className="bg-[#1a1b1f] border border-[#414755] rounded p-5 space-y-4 shadow-xl">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Icon name="memory" size={18} className="text-[#007aff]" /> Add New Prebuilt Gaming Rig
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>System Name</label>
            <input className={fieldClass + ' w-full'} placeholder="HYPERION TITAN V" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Processor (CPU)</label>
            <input className={fieldClass + ' w-full'} value={cpu} onChange={(e) => setCpu(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Graphics Card (GPU)</label>
            <input className={fieldClass + ' w-full'} value={gpu} onChange={(e) => setGpu(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Memory (RAM)</label>
            <input className={fieldClass + ' w-full'} value={ram} onChange={(e) => setRam(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Storage</label>
            <input className={fieldClass + ' w-full'} value={storage} onChange={(e) => setStorage(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Price ($)</label>
            <input type="number" className={fieldClass + ' w-full'} value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
          </div>
          <div>
            <label className={labelClass}>Performance Tier</label>
            <select className={fieldClass + ' w-full'} value={tier} onChange={(e) => setTier(e.target.value as PerformanceTier)}>
              <option value="Tier 1 - Esports">Tier 1 - Esports</option>
              <option value="Tier 2 - 1440p Pro">Tier 2 - 1440p Pro</option>
              <option value="Tier 3 - 4K Ultra">Tier 3 - 4K Ultra</option>
              <option value="Tier 4 - Enthusiast Extreme">Tier 4 - Enthusiast Extreme</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Image Asset URL</label>
            <input className={fieldClass + ' w-full'} value={image} onChange={(e) => setImage(e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
          <Icon name="add" size={16} /> SAVE PREBUILT RIG
        </button>
      </form>

      {/* Rigs Table */}
      <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
        <table className="w-full text-xs min-w-[760px]">
          <thead>
            <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
              <th className="text-left p-3 font-semibold">System Rig</th>
              <th className="text-left p-3 font-semibold">CPU</th>
              <th className="text-left p-3 font-semibold">GPU</th>
              <th className="text-left p-3 font-semibold">Tier</th>
              <th className="text-right p-3 font-semibold">Price</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#292a2e]">
            {gamingPCs.map((pc) => (
              <tr key={pc.id} className="hover:bg-[#1e1f23]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={pc.image} alt={pc.name} className="w-12 h-12 object-cover rounded bg-[#0d0e12]" />
                    <div>
                      <div className="text-white font-bold">{pc.name}</div>
                      <div className="font-mono text-[10px] text-[#8b90a0]">{pc.ram} · {pc.storage}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-[#c1c6d7]">{pc.cpu}</td>
                <td className="p-3 font-mono text-[#007aff] font-bold">{pc.gpu}</td>
                <td className="p-3"><Pill status="Active" /></td>
                <td className="p-3 text-right font-mono text-white font-bold">${pc.price.toFixed(2)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => deleteGamingPC(pc.id)} className="p-1 text-[#8b90a0] hover:text-[#ff453a]"><Icon name="delete" size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
