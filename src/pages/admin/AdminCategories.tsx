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

  const fieldClass = 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors'
  const labelClass = 'text-[10px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-bold'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Category Manager"
        subtitle={`${categories.length} category tiles featured on storefront bento showcase`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => {
          const isEditing = editingId === c.id

          return (
            <div key={c.id} className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 flex flex-col justify-between shadow-sm">
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
                    <button onClick={() => saveEdit(c)} className="px-3.5 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer">
                      <Icon name="check" size={14} /> SAVE
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3.5 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg cursor-pointer">
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="font-mono text-xs text-[var(--accent-blue)] font-bold">FROM ${c.startingPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                  <h3 className="text-[var(--text-primary)] font-bold text-base">{c.title}</h3>
                  <p className="font-mono text-xs text-[var(--text-secondary)] mt-1">{c.itemCount} items available</p>
                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--accent-blue)] font-bold">{c.href}</span>
                    <button onClick={() => startEditing(c)} className="px-3.5 py-1.5 bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)] text-[var(--accent-blue)] hover:text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
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
