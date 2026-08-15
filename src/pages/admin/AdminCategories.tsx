import { useState } from 'react'
import { Icon } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { categoryDetails } from '../../data'
import type { CategoryNode } from '../../types'

export function AdminCategories() {
  const [rows, setRows] = useState<CategoryNode[]>(categoryDetails)

  const move = (index: number, dir: -1 | 1) => {
    setRows((r) => {
      const next = [...r]
      const target = index + dir
      if (target < 0 || target >= next.length) return r
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const toggleVisible = (id: string) => setRows((r) => r.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)))
  const remove = (id: string) => setRows((r) => r.filter((c) => c.id !== id))

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle={`${rows.length} top-level categories · drag order & visibility`}
        action={
          <button className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
            <Icon name="add" size={15} /> NEW CATEGORY
          </button>
        }
      />

      <div className="space-y-2">
        {rows.map((c, i) => (
          <div key={c.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-4 flex items-center gap-4">
            {/* Reorder */}
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[#8b90a0] hover:text-white disabled:opacity-30" aria-label="Move up"><Icon name="keyboard_arrow_up" size={18} /></button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="text-[#8b90a0] hover:text-white disabled:opacity-30" aria-label="Move down"><Icon name="keyboard_arrow_down" size={18} /></button>
            </div>

            <img src={c.image} alt="" className="w-14 h-14 object-cover rounded bg-[#0d0e12] shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">{c.name}</h3>
                <span className="font-mono text-[10px] text-[#8b90a0]">{c.productCount} products</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.subcategories.slice(0, 4).map((s) => (
                  <span key={s} className="font-mono text-[9px] text-[#c1c6d7] bg-[#121317] border border-[#292a2e] px-2 py-0.5 rounded">{s}</span>
                ))}
                {c.subcategories.length > 4 && <span className="font-mono text-[9px] text-[#8b90a0]">+{c.subcategories.length - 4} more</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleVisible(c.id)} className={`font-mono text-[10px] px-2.5 py-1.5 rounded border transition-colors ${c.visible ? 'bg-[#30d15815] text-[#30d158] border-[#30d15840]' : 'bg-[#8b90a015] text-[#8b90a0] border-[#8b90a040]'}`}>
                {c.visible ? 'VISIBLE' : 'HIDDEN'}
              </button>
              <button className="p-1.5 text-[#8b90a0] hover:text-[#007aff] transition-colors" aria-label="Edit"><Icon name="edit" size={16} /></button>
              <button onClick={() => remove(c.id)} className="p-1.5 text-[#8b90a0] hover:text-[#ff453a] transition-colors" aria-label="Delete"><Icon name="delete" size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
