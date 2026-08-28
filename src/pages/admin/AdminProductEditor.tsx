import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Icon, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService, type CreateProductPayload } from '../../services/adminService'
import { productService } from '../../services/productService'

const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]'
const labelClass = 'text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold'

interface SpecRow {
  label: string
  value: string
}

export function AdminProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [price, setPrice] = useState('')
  const [previousPrice, setPreviousPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('0')
  const [wattage, setWattage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [quantityOnHand, setQuantityOnHand] = useState('0')
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const [tags, setTags] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: categories } = useApi(useCallback(() => adminService.listCategories(), []), [])
  const { data: brands } = useApi(useCallback(() => adminService.listBrands(), []), [])

  // Existing products are loaded through the admin list, then detail by slug.
  const { data: existing, loading, error, reload } = useApi(
    useCallback(async () => {
      if (!id) return null
      const list = await productService.list({ ids: [id], limit: 1 })
      const summary = list.data[0]
      if (!summary) return null
      return productService.getBySlug(summary.slug)
    }, [id]),
    [id]
  )

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setSlug(existing.slug)
    setSku(existing.sku)
    setDescription(existing.description ?? '')
    setPrice(String(existing.price))
    setPreviousPrice(existing.previousPrice ? String(existing.previousPrice) : '')
    setDiscountPercent(String(existing.discountPercent ?? 0))
    setWattage(existing.wattage ? String(existing.wattage) : '')
    setImageUrl(existing.primaryImage ?? '')
    setIsFeatured(existing.isFeatured)
    setIsNew(existing.isNew)
    setSpecs(existing.specs ?? [])
    setTags((existing.tags ?? []).join(', '))
  }, [existing])

  // Match the loaded product's category/brand once the option lists arrive.
  useEffect(() => {
    if (!existing || !categories) return
    const match = categories.find((c) => c.slug === existing.categorySlug)
    if (match) setCategoryId(match.id)
  }, [existing, categories])

  useEffect(() => {
    if (!existing || !brands) return
    const match = brands.find((b) => b.slug === existing.brandSlug)
    if (match) setBrandId(match.id)
  }, [existing, brands])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    const payload: CreateProductPayload = {
      name: name.trim(),
      sku: sku.trim(),
      categoryId,
      brandId,
      price: parseFloat(price),
      discountPercent: parseInt(discountPercent, 10) || 0,
      isActive,
      isFeatured,
      isNew,
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(previousPrice ? { previousPrice: parseFloat(previousPrice) } : {}),
      ...(wattage ? { wattage: parseInt(wattage, 10) } : {}),
      ...(imageUrl.trim() ? { images: [{ url: imageUrl.trim(), isPrimary: true }] } : {}),
      ...(specs.filter((s) => s.label && s.value).length
        ? { specs: specs.filter((s) => s.label && s.value) }
        : {}),
      ...(tags.trim() ? { tags: tags.split(',').map((t) => t.trim()).filter(Boolean) } : {}),
      ...(!isEdit ? { inventory: { quantityOnHand: parseInt(quantityOnHand, 10) || 0 } } : {}),
    }

    try {
      if (isEdit && id) await adminService.updateProduct(id, payload)
      else await adminService.createProduct(payload)
      navigate('/admin/products')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loading) {
    return <div className="h-96 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
  }

  if (isEdit && error) {
    return <ErrorState message={error} onRetry={reload} />
  }

  return (
    <div>
      <AdminPageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={isEdit ? 'Changes are saved to the product database' : 'Create a new catalog product'}
        action={
          <Link to="/admin/products">
            <Button variant="outline" size="md">
              <Icon name="arrow_back" size={15} /> Back
            </Button>
          </Link>
        }
      />

      {saveError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
            <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-3">
              Product Details
            </h2>

            <div>
              <label className={labelClass} htmlFor="p-name">Name</label>
              <input id="p-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="p-sku">SKU</label>
                <input id="p-sku" required className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-slug">Slug (optional)</label>
                <input
                  id="p-slug"
                  className={inputClass}
                  pattern="[a-z0-9\-]*"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="p-desc">Description</label>
              <textarea
                id="p-desc"
                rows={4}
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="p-cat">Category</label>
                <select
                  id="p-cat"
                  required
                  className={inputClass}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category…</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="p-brand">Brand</label>
                <select
                  id="p-brand"
                  required
                  className={inputClass}
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Select brand…</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="p-image">Primary Image URL</label>
              <input
                id="p-image"
                type="url"
                className={inputClass}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="p-tags">Tags (comma separated)</label>
              <input id="p-tags" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">Specifications</h2>
              <button
                type="button"
                onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                className="font-mono text-[10px] text-[var(--accent-blue)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Icon name="add" size={13} /> ADD ROW
              </button>
            </div>

            {specs.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No specifications added.</p>
            ) : (
              specs.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={inputClass}
                    placeholder="Label"
                    aria-label={`Specification ${i + 1} label`}
                    value={s.label}
                    onChange={(e) => {
                      const next = [...specs]
                      next[i] = { ...next[i], label: e.target.value }
                      setSpecs(next)
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Value"
                    aria-label={`Specification ${i + 1} value`}
                    value={s.value}
                    onChange={(e) => {
                      const next = [...specs]
                      next[i] = { ...next[i], value: e.target.value }
                      setSpecs(next)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer shrink-0"
                    aria-label={`Remove specification ${i + 1}`}
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              ))
            )}
            {isEdit && (
              <p className="text-[10px] text-[var(--text-secondary)] pt-2">
                Note: specification and image edits apply on create. Editing an existing product updates its core
                fields.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
            <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-3">
              Pricing
            </h2>
            <div>
              <label className={labelClass} htmlFor="p-price">Price (USD)</label>
              <input
                id="p-price"
                type="number"
                step="0.01"
                min="0"
                required
                className={inputClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-prev">Previous Price</label>
              <input
                id="p-prev"
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={previousPrice}
                onChange={(e) => setPreviousPrice(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-disc">Discount %</label>
              <input
                id="p-disc"
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-watt">Wattage</label>
              <input
                id="p-watt"
                type="number"
                min="0"
                className={inputClass}
                value={wattage}
                onChange={(e) => setWattage(e.target.value)}
              />
            </div>
          </div>

          {!isEdit && (
            <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-4">
              <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-3">
                Initial Inventory
              </h2>
              <div>
                <label className={labelClass} htmlFor="p-qty">Quantity On Hand</label>
                <input
                  id="p-qty"
                  type="number"
                  min="0"
                  className={inputClass}
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
            <h2 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase border-b border-[var(--border-subtle)] pb-3">
              Visibility
            </h2>
            {[
              { label: 'Active (visible in store)', checked: isActive, set: setIsActive },
              { label: 'Featured', checked: isFeatured, set: setIsFeatured },
              { label: 'New arrival', checked: isNew, set: setIsNew },
            ].map((f) => (
              <label key={f.label} className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={f.checked}
                  onChange={(e) => f.set(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-blue)]"
                />
                {f.label}
              </label>
            ))}
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={saving}>
            {saving ? 'SAVING…' : isEdit ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
          </Button>
        </div>
      </form>
    </div>
  )
}
