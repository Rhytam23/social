import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { getProductById } from '../../data'

const CATEGORIES = ['Graphics Cards', 'CPUs', 'Motherboards', 'RAM', 'Storage', 'Cooling', 'Cases', 'Power Supplies', 'Monitors', 'Peripherals', 'Streaming', 'Gaming PCs']
const field = 'w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff] placeholder:text-[#8b90a0]'
const lbl = 'text-[11px] font-mono text-[#8b90a0] block mb-1.5 uppercase tracking-wider'

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#1a1b1f] border border-[#414755] rounded p-5">
      <h2 className="font-mono text-xs font-bold text-white uppercase mb-4 border-b border-[#292a2e] pb-3 flex items-center gap-1.5">
        <Icon name={icon} size={16} className="text-[#007aff]" /> {title}
      </h2>
      {children}
    </section>
  )
}

export function AdminProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = id && id !== 'new' ? getProductById(id) : undefined
  const isNew = !existing

  const [specs, setSpecs] = useState(existing?.specifications ?? [{ label: '', value: '' }])
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => navigate('/admin/products'), 900)
  }

  return (
    <form onSubmit={handleSave}>
      <AdminPageHeader
        title={isNew ? 'Add Product' : 'Edit Product'}
        subtitle={isNew ? 'Create a new catalog entry' : existing?.name}
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/products" className="px-4 py-2 bg-[#1a1b1f] border border-[#414755] hover:border-white text-white font-mono text-xs rounded transition-colors">CANCEL</Link>
            <button type="submit" className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
              <Icon name={saved ? 'check' : 'save'} size={15} /> {saved ? 'SAVED' : 'SAVE PRODUCT'}
            </button>
          </div>
        }
      />

      {saved && (
        <div className="mb-4 p-3 bg-[#30d15815] border border-[#30d15840] rounded text-[#30d158] font-mono text-xs flex items-center gap-2">
          <Icon name="check_circle" size={16} filled /> Product {isNew ? 'created' : 'updated'} successfully. Redirecting…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Basic Information" icon="info">
            <div className="space-y-4">
              <div><label className={lbl}>Product Name</label><input className={field} defaultValue={existing?.name} placeholder="e.g. NVIDIA GeForce RTX 5090 Founders Edition" required /></div>
              <div><label className={lbl}>Description</label><textarea className={`${field} h-24 resize-none`} defaultValue={existing?.description} placeholder="Detailed product description..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Brand</label><input className={field} defaultValue={existing?.brand} placeholder="NVIDIA" required /></div>
                <div><label className={lbl}>Category</label>
                  <select className={field} defaultValue={existing?.category ?? 'Graphics Cards'}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Images" icon="image">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(existing?.gallery ?? [existing?.image]).filter(Boolean).map((img, i) => (
                <div key={i} className="relative aspect-square rounded overflow-hidden border border-[#292a2e] group">
                  <img src={img as string} alt="" className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded flex items-center justify-center text-[#8b90a0] hover:text-[#ff453a] opacity-0 group-hover:opacity-100"><Icon name="close" size={14} /></button>
                </div>
              ))}
              <button type="button" className="aspect-square rounded border border-dashed border-[#414755] flex flex-col items-center justify-center gap-1 text-[#8b90a0] hover:text-white hover:border-[#007aff] transition-colors">
                <Icon name="add_photo_alternate" size={22} /><span className="font-mono text-[9px]">UPLOAD</span>
              </button>
            </div>
          </Section>

          <Section title="Specifications" icon="list">
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={field} defaultValue={s.label} placeholder="Label (e.g. VRAM)" />
                  <input className={field} defaultValue={s.value} placeholder="Value (e.g. 32GB GDDR7)" />
                  <button type="button" onClick={() => setSpecs((sp) => sp.filter((_, x) => x !== i))} className="px-2 text-[#8b90a0] hover:text-[#ff453a]" aria-label="Remove spec"><Icon name="close" size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setSpecs((sp) => [...sp, { label: '', value: '' }])} className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1 mt-1"><Icon name="add" size={14} /> ADD SPECIFICATION</button>
            </div>
          </Section>

          <Section title="Variants" icon="tune">
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-[#8b90a0] uppercase px-1"><span>Variant</span><span>SKU</span><span>Price</span></div>
              {['Standard', 'OC Edition'].map((v) => (
                <div key={v} className="grid grid-cols-3 gap-2">
                  <input className={field} defaultValue={v} />
                  <input className={field} defaultValue={`${existing?.sku ?? 'PP-NEW'}-${v.slice(0, 2).toUpperCase()}`} />
                  <input className={field} defaultValue={existing?.price?.toFixed(2)} />
                </div>
              ))}
              <button type="button" className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1 mt-1"><Icon name="add" size={14} /> ADD VARIANT</button>
            </div>
          </Section>

          <Section title="SEO" icon="travel_explore">
            <div className="space-y-4">
              <div><label className={lbl}>URL Slug</label><input className={field} defaultValue={existing?.slug} placeholder="product-url-slug" /></div>
              <div><label className={lbl}>Meta Title</label><input className={field} defaultValue={existing?.name} /></div>
              <div><label className={lbl}>Meta Description</label><textarea className={`${field} h-16 resize-none`} defaultValue={existing?.description?.slice(0, 155)} /></div>
            </div>
          </Section>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <Section title="Pricing" icon="payments">
            <div className="space-y-4">
              <div><label className={lbl}>Price ($)</label><input type="number" step="0.01" className={field} defaultValue={existing?.price} placeholder="0.00" required /></div>
              <div><label className={lbl}>Compare-at Price ($)</label><input type="number" step="0.01" className={field} defaultValue={existing?.previousPrice} placeholder="0.00" /></div>
              <div><label className={lbl}>Discount (%)</label><input type="number" className={field} defaultValue={existing?.discount} placeholder="0" /></div>
            </div>
          </Section>

          <Section title="Inventory" icon="warehouse">
            <div className="space-y-4">
              <div><label className={lbl}>Stock Quantity</label><input type="number" className={field} defaultValue={existing?.stockCount ?? 0} /></div>
              <div><label className={lbl}>SKU</label><input className={field} defaultValue={existing?.sku} placeholder="PP-XXX-0000" /></div>
              <div><label className={lbl}>Stock Status</label>
                <select className={field} defaultValue={existing?.stockStatus ?? 'in-stock'}>
                  <option value="in-stock">In Stock</option><option value="low-stock">Low Stock</option><option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Shipping" icon="local_shipping">
            <div className="space-y-4">
              <div><label className={lbl}>Weight (kg)</label><input type="number" step="0.1" className={field} defaultValue="1.5" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={lbl}>L</label><input className={field} defaultValue="30" /></div>
                <div><label className={lbl}>W</label><input className={field} defaultValue="20" /></div>
                <div><label className={lbl}>H</label><input className={field} defaultValue="10" /></div>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#c1c6d7] cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#007aff]" /> Free shipping eligible</label>
            </div>
          </Section>

          <Section title="Visibility" icon="visibility">
            <div className="space-y-2 text-xs text-[#c1c6d7]">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked={existing?.isFeatured} className="w-4 h-4 accent-[#007aff]" /> Featured product</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked={existing?.isNew} className="w-4 h-4 accent-[#007aff]" /> Mark as new</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#007aff]" /> Published / visible</label>
            </div>
          </Section>
        </div>
      </div>
    </form>
  )
}
