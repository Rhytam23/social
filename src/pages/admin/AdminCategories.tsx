import { useState } from 'react'
import { Icon } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { useShop } from '../../context/ShopContext'
import type { CategoryCard } from '../../types'

export function AdminCategories() {
  const { categories, updateCategory } = useShop()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCount, setEditCount] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [editImage, setEditImage] = useState('')

  const startEditing = (cat: CategoryCard) => {
    setEditingId(cat.id)
    setEditTitle(cat.title)
    setEditCount(cat.itemCount)
    setEditPrice(cat.startingPrice || 0)
    setEditImage(cat.image)
  }

  const saveEdit = (cat: CategoryCard) => {
    updateCategory({
      ...cat,
      title: editTitle,
      itemCount: Number(editCount),
      startingPrice: Number(editPrice),
      image: editImage,
    })
    setEditingId(null)
  }

  const fieldClass = 'bg-[#121317] border border-[#414755] rounded p-2 text-xs text-white focus:outline-none focus:border-[#007aff]'
  const labelClass = 'text-[10px] font-mono text-[#8b90a0] block mb-1 uppercase font-bold'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Category Manager"
        subtitle={`${categories.length} category tiles featured on storefront bento showcase`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const isEditing = editingId === c.id

          return (
            <div key={c.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-5 flex flex-col justify-between shadow-md">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Category Title</label>
                    <input className={fieldClass + ' w-full'} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Item Count</label>
                      <input type="number" className={fieldClass + ' w-full'} value={editCount} onChange={(e) => setEditCount(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelClass}>Start Price ($)</label>
                      <input type="number" className={fieldClass + ' w-full'} value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input className={fieldClass + ' w-full'} value={editImage} onChange={(e) => setEditImage(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => saveEdit(c)} className="px-3 py-1.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1">
                      <Icon name="check" size={14} /> SAVE
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-[#121317] border border-[#414755] text-white font-mono text-xs rounded">
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative aspect-[16/9] rounded overflow-hidden mb-3 bg-[#121317]">
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="font-mono text-xs text-[#007aff] font-bold">FROM ${c.startingPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-base">{c.title}</h3>
                  <p className="font-mono text-xs text-[#8b90a0] mt-0.5">{c.itemCount} items available</p>
                  <div className="mt-4 pt-3 border-t border-[#292a2e] flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#007aff] font-bold">{c.href}</span>
                    <button onClick={() => startEditing(c)} className="px-3 py-1 bg-[#007aff]/15 hover:bg-[#007aff] text-[#007aff] hover:text-white font-mono text-xs font-bold rounded transition-colors flex items-center gap-1">
                      <Icon name="edit" size={14} /> EDIT TILE
                    </button>
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
