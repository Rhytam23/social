import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Icon } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { useShop } from '../../context/ShopContext'
import type { Product, ProductCategory, StockStatus } from '../../types'

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
  const { products, addProduct, updateProduct } = useShop()

  const existing = id && id !== 'new' ? products.find((p) => p.id === id) : undefined
  const isNew = !existing

  const [name, setName] = useState(existing?.name ?? '')
  const [brand, setBrand] = useState(existing?.brand ?? 'NVIDIA')
  const [category, setCategory] = useState<ProductCategory>((existing?.category as ProductCategory) ?? 'Graphics Cards')
  const [price, setPrice] = useState(existing?.price ?? 999)
  const [previousPrice, setPreviousPrice] = useState(existing?.previousPrice ?? 0)
  const [discount, setDiscount] = useState(existing?.discount ?? 0)
  const [stockStatus, setStockStatus] = useState<StockStatus>(existing?.stockStatus ?? 'in-stock')
  const [stockCount, setStockCount] = useState(existing?.stockCount ?? 15)
  const [image, setImage] = useState(existing?.image ?? 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=90')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [isFeatured, setIsFeatured] = useState(existing?.isFeatured ?? true)
  const [isNewTag, setIsNewTag] = useState(existing?.isNew ?? true)
  const [rating] = useState(existing?.rating ?? 5.0)

  const [specs, setSpecs] = useState(existing?.specifications ?? [{ label: 'VRAM', value: '24GB GDDR6X' }, { label: 'BUS', value: '384-bit' }])
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const productPayload: Product = {
      id: existing ? existing.id : `prod-${Date.now()}`,
      name: name || 'New Flagship Hardware',
      brand: brand || 'NVIDIA',
      category: category || 'Graphics Cards',
      price: Number(price) || 999,
      previousPrice: previousPrice ? Number(previousPrice) : undefined,
      discount: discount ? Number(discount) : undefined,
      rating: Number(rating) || 5.0,
      reviewCount: existing?.reviewCount ?? 12,
      stockStatus: stockStatus || 'in-stock',
      stockCount: Number(stockCount) || 10,
      image: image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&q=90',
      description: description || 'Flagship performance engineered for enthusiasts.',
      slug: existing ? existing.slug : `${(name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      sku: existing?.sku ?? `PP-${Math.floor(1000 + Math.random() * 9000)}`,
      isFeatured,
      isNew: isNewTag,
      specifications: specs.filter((s) => s.label.trim() !== ''),
    }

    if (existing) {
      updateProduct(productPayload)
    } else {
      addProduct(productPayload)
    }

    setSaved(true)
    setTimeout(() => navigate('/admin/products'), 800)
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
              <div>
                <label className={lbl}>Product Name</label>
                <input
                  className={field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NVIDIA GeForce RTX 5090 Founders Edition"
                  required
                />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea
                  className={`${field} h-24 resize-none`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Brand</label>
                  <input
                    className={field}
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="NVIDIA"
                    required
                  />
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select
                    className={field}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Image Asset URL" icon="image">
            <div className="space-y-3">
              <div>
                <label className={lbl}>Product Main Image URL</label>
                <input
                  className={field}
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>
              {image && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#292a2e] bg-[#121317]">
                  <img src={image} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </Section>

          <Section title="Specifications" icon="list">
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={field}
                    value={s.label}
                    onChange={(e) => {
                      const val = e.target.value
                      setSpecs((sp) => sp.map((item, idx) => (idx === i ? { ...item, label: val } : item)))
                    }}
                    placeholder="Label (e.g. VRAM)"
                  />
                  <input
                    className={field}
                    value={s.value}
                    onChange={(e) => {
                      const val = e.target.value
                      setSpecs((sp) => sp.map((item, idx) => (idx === i ? { ...item, value: val } : item)))
                    }}
                    placeholder="Value (e.g. 32GB GDDR7)"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((sp) => sp.filter((_, x) => x !== i))}
                    className="px-2 text-[#8b90a0] hover:text-[#ff453a]"
                    aria-label="Remove spec"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSpecs((sp) => [...sp, { label: '', value: '' }])}
                className="font-mono text-[11px] text-[#adc6ff] hover:text-white flex items-center gap-1 mt-1 font-bold"
              >
                <Icon name="add" size={14} /> ADD SPECIFICATION
              </button>
            </div>
          </Section>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          <Section title="Pricing" icon="payments">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className={field}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className={lbl}>Compare-at Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className={field}
                  value={previousPrice}
                  onChange={(e) => setPreviousPrice(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={lbl}>Discount (%)</label>
                <input
                  type="number"
                  className={field}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </Section>

          <Section title="Inventory" icon="warehouse">
            <div className="space-y-4">
              <div>
                <label className={lbl}>Stock Quantity</label>
                <input
                  type="number"
                  className={field}
                  value={stockCount}
                  onChange={(e) => setStockCount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={lbl}>Stock Status</label>
                <select
                  className={field}
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                >
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Visibility & Badges" icon="visibility">
            <div className="space-y-2 text-xs text-[#c1c6d7]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#007aff]"
                />
                Featured product
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewTag}
                  onChange={(e) => setIsNewTag(e.target.checked)}
                  className="w-4 h-4 accent-[#007aff]"
                />
                Mark as new arrival
              </label>
            </div>
          </Section>
        </div>
      </div>
    </form>
  )
}
