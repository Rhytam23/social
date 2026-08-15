import { useState } from 'react'
import { Icon } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { useShop } from '../../context/ShopContext'
import type { Brand } from '../../types'

export function AdminBrands() {
  const { brands, addBrand, updateBrand, deleteBrand } = useShop()

  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [description, setDescription] = useState('')
  const [href, setHref] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLogo, setEditLogo] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editHref, setEditHref] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    addBrand({
      id: `brand-${Date.now()}`,
      name,
      logo: logo || undefined,
      description: description || `${name} Authorized Hardware Partner`,
      href: href || `/brand/${name.toLowerCase().replace(/\s+/g, '-')}`,
    })

    setName('')
    setLogo('')
    setDescription('')
    setHref('')
  }

  const startEdit = (b: Brand) => {
    setEditingId(b.id)
    setEditName(b.name)
    setEditLogo(b.logo || '')
    setEditDesc(b.description || '')
    setEditHref(b.href)
  }

  const saveEdit = (b: Brand) => {
    updateBrand({
      ...b,
      name: editName,
      logo: editLogo || undefined,
      description: editDesc,
      href: editHref,
    })
    setEditingId(null)
  }

  const fieldClass = 'bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff]'
  const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1 uppercase font-bold tracking-wider'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Brand Partners CMS"
        subtitle="Manage authorized hardware manufacturer partnerships & vector logos"
      />

      {/* Add Brand Form */}
      <form onSubmit={handleAdd} className="bg-[#1a1b1f] border border-[#414755] rounded p-5 space-y-4 shadow-xl">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Icon name="add_business" size={18} className="text-[#007aff]" /> Add New Authorized Brand Partner
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Brand Name</label>
            <input className={fieldClass + ' w-full'} placeholder="e.g. ASUS ROG" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Logo URL (SVG / PNG / WebP)</label>
            <input className={fieldClass + ' w-full'} placeholder="https://..." value={logo} onChange={(e) => setLogo(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input className={fieldClass + ' w-full'} placeholder="Official hardware partner" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Link / Href</label>
            <input className={fieldClass + ' w-full'} placeholder="/brand/asus" value={href} onChange={(e) => setHref(e.target.value)} />
          </div>
        </div>

        {logo && (
          <div className="flex items-center gap-3 p-3 bg-[#121317] border border-[#292a2e] rounded">
            <span className="text-xs font-mono text-[#8b90a0]">LOGO PREVIEW:</span>
            <div className="h-8 px-4 bg-[#17191e] border border-[#414755] rounded flex items-center justify-center">
              <img src={logo} alt="Preview" className="h-5 max-w-[120px] object-contain" />
            </div>
          </div>
        )}

        <button type="submit" className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
          <Icon name="add" size={16} /> SAVE BRAND PARTNER
        </button>
      </form>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {brands.map((b) => {
          const isEditing = editingId === b.id

          return (
            <div key={b.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-5 flex flex-col justify-between shadow-md">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Brand Name</label>
                    <input className={fieldClass + ' w-full'} value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelClass}>Logo URL</label>
                    <input className={fieldClass + ' w-full'} value={editLogo} onChange={(e) => setEditLogo(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input className={fieldClass + ' w-full'} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => saveEdit(b)} className="px-3 py-1.5 bg-[#007aff] text-white font-mono text-xs font-bold rounded">SAVE</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-[#121317] text-white font-mono text-xs rounded border border-[#414755]">CANCEL</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="h-16 bg-[#121317] rounded flex items-center justify-center p-3 mb-3 border border-[#292a2e]">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="max-h-8 max-w-full object-contain filter invert opacity-90" />
                    ) : (
                      <span className="font-black text-white text-lg tracking-tighter">{b.name}</span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-base">{b.name}</h3>
                  <p className="text-[#8b90a0] text-xs mt-1 line-clamp-2">{b.description || 'Authorized Partner'}</p>
                  <div className="mt-4 pt-3 border-t border-[#292a2e] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#007aff] font-bold">{b.href}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(b)} className="p-1 text-[#8b90a0] hover:text-[#007aff]"><Icon name="edit" size={16} /></button>
                      <button onClick={() => deleteBrand(b.id)} className="p-1 text-[#8b90a0] hover:text-[#ff453a]"><Icon name="delete" size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
