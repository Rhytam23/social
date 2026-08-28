import { useState, useCallback } from 'react'
import { Icon, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import type { Brand } from '../../services/brandService'

const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]'
const labelClass = 'text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold'

interface FormState {
  id?: string
  name: string
  slug: string
  description: string
  logoUrl: string
  websiteUrl: string
  sortOrder: string
  isVisible: boolean
}

const EMPTY: FormState = {
  name: '',
  slug: '',
  description: '',
  logoUrl: '',
  websiteUrl: '',
  sortOrder: '0',
  isVisible: true,
}

export function AdminBrands() {
  const { data, loading, error, reload } = useApi(useCallback(() => adminService.listBrands(), []), [])
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const brands = data ?? []

  const openEdit = (b: Brand) =>
    setForm({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description ?? '',
      logoUrl: b.logoUrl ?? '',
      websiteUrl: b.websiteUrl ?? '',
      sortOrder: String(b.sortOrder ?? 0),
      isVisible: b.isVisible,
    })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setActionError(null)

    const payload = {
      name: form.name.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.logoUrl.trim() ? { logoUrl: form.logoUrl.trim() } : {}),
      ...(form.websiteUrl.trim() ? { websiteUrl: form.websiteUrl.trim() } : {}),
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      isVisible: form.isVisible,
    }

    try {
      if (form.id) await adminService.updateBrand(form.id, payload)
      else await adminService.createBrand(payload)
      setForm(null)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save brand')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (b: Brand) => {
    setActionError(null)
    try {
      await adminService.deleteBrand(b.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete brand')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        subtitle={loading ? 'Loading…' : `${brands.length} brands`}
        action={
          <Button variant="primary" size="md" onClick={() => setForm({ ...EMPTY })}>
            <Icon name="add" size={15} /> Add Brand
          </Button>
        }
      />

      {actionError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : brands.length === 0 ? (
        <EmptyState icon="add_business" title="No brands" message="Create your first brand." />
      ) : (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                  {['Brand', 'Slug', 'Products', 'Visible', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)] text-xs font-semibold">{b.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">{b.slug}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{b.productCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <Icon
                        name={b.isVisible ? 'visibility' : 'visibility_off'}
                        size={16}
                        className={b.isVisible ? 'text-[var(--color-stock-green)]' : 'text-[var(--text-secondary)]'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] cursor-pointer"
                          aria-label={`Edit ${b.name}`}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(b)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
                          aria-label={`Delete ${b.name}`}
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={save}
            className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-md w-full space-y-4 my-8"
          >
            <h3 className="text-[var(--text-primary)] font-bold text-base">{form.id ? 'Edit Brand' : 'New Brand'}</h3>

            <div>
              <label className={labelClass} htmlFor="brand-name">Name</label>
              <input
                id="brand-name"
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="brand-slug">Slug (optional)</label>
              <input
                id="brand-slug"
                className={inputClass}
                pattern="[a-z0-9\-]*"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="brand-desc">Description</label>
              <textarea
                id="brand-desc"
                rows={2}
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="brand-logo">Logo URL</label>
              <input
                id="brand-logo"
                type="url"
                className={inputClass}
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="brand-site">Website URL</label>
              <input
                id="brand-site"
                type="url"
                className={inputClass}
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className={labelClass} htmlFor="brand-order">Sort Order</label>
                <input
                  id="brand-order"
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-primary)] pb-2">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                  className="w-4 h-4 accent-[var(--accent-blue)]"
                />
                Visible
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="md" onClick={() => setForm(null)}>
                CANCEL
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? 'SAVING…' : 'SAVE'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
