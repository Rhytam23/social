import { useState, useCallback } from 'react'
import { Icon, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'
import type { Category } from '../../services/categoryService'

const inputClass =
  'w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]'
const labelClass = 'text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold'

interface FormState {
  id?: string
  name: string
  slug: string
  description: string
  imageUrl: string
  sortOrder: string
  isVisible: boolean
}

const EMPTY: FormState = { name: '', slug: '', description: '', imageUrl: '', sortOrder: '0', isVisible: true }

export function AdminCategories() {
  const { data, loading, error, reload } = useApi(useCallback(() => adminService.listCategories(), []), [])
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const categories = data ?? []

  const openEdit = (c: Category) =>
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
      sortOrder: String(c.sortOrder ?? 0),
      isVisible: c.isVisible,
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
      ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      isVisible: form.isVisible,
    }

    try {
      if (form.id) await adminService.updateCategory(form.id, payload)
      else await adminService.createCategory(payload)
      setForm(null)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c: Category) => {
    setActionError(null)
    try {
      await adminService.deleteCategory(c.id)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete category')
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle={loading ? 'Loading…' : `${categories.length} categories`}
        action={
          <Button variant="primary" size="md" onClick={() => setForm({ ...EMPTY })}>
            <Icon name="add" size={15} /> Add Category
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
      ) : categories.length === 0 ? (
        <EmptyState icon="category" title="No categories" message="Create your first category." />
      ) : (
        <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                  {['Name', 'Slug', 'Products', 'Visible', 'Order', 'Actions'].map((h) => (
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
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)] text-xs font-semibold">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">{c.slug}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{c.productCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <Icon
                        name={c.isVisible ? 'visibility' : 'visibility_off'}
                        size={16}
                        className={c.isVisible ? 'text-[var(--color-stock-green)]' : 'text-[var(--text-secondary)]'}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{c.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] cursor-pointer"
                          aria-label={`Edit ${c.name}`}
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(c)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
                          aria-label={`Delete ${c.name}`}
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
            <h3 className="text-[var(--text-primary)] font-bold text-base">
              {form.id ? 'Edit Category' : 'New Category'}
            </h3>

            <div>
              <label className={labelClass} htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cat-slug">Slug (optional — generated from name)</label>
              <input
                id="cat-slug"
                className={inputClass}
                value={form.slug}
                pattern="[a-z0-9\-]*"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cat-desc">Description</label>
              <textarea
                id="cat-desc"
                rows={2}
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="cat-image">Image URL</label>
              <input
                id="cat-image"
                type="url"
                className={inputClass}
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className={labelClass} htmlFor="cat-order">Sort Order</label>
                <input
                  id="cat-order"
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
