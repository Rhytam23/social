import { useState } from 'react'
import { Icon, Button } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { useShop } from '../../context/ShopContext'

export function AdminMedia() {
  const { mediaLibrary, addMediaFile, deleteMediaFile, showToast } = useShop()
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl) return

    addMediaFile({
      id: `media-${Date.now()}`,
      name: newName || `asset_${Date.now()}.png`,
      url: newUrl,
      size: '1.4 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
    })

    setNewUrl('')
    setNewName('')
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    showToast('Copied media URL to clipboard!', 'info')
  }

  const fieldClass = 'bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Central Media Library"
        subtitle="Manage product photography, brand logos, hero graphics & banners"
      />

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
          <Icon name="cloud_upload" size={18} className="text-[var(--accent-blue)]" /> Add New Image Asset URL
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className={fieldClass + ' sm:col-span-1'}
            placeholder="Asset File Name (e.g. rtx_5090_hero.png)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className={fieldClass + ' sm:col-span-2'}
            placeholder="Image URL (e.g. https://images.unsplash.com/...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
        >
          <Icon name="add" size={16} /> Add Asset to Library
        </Button>
      </form>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {mediaLibrary.map((item) => (
          <div key={item.id} className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl overflow-hidden group flex flex-col justify-between shadow-xs">
            <div className="relative aspect-square bg-[var(--bg-surface-secondary)]">
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item.url)}
                  className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  title="Copy URL"
                >
                  <Icon name="content_copy" size={16} />
                </button>
                <button
                  onClick={() => deleteMediaFile(item.id)}
                  className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  title="Delete"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-[var(--text-primary)] font-mono text-[11px] font-bold truncate">{item.name}</div>
              <div className="flex items-center justify-between font-mono text-[9px] text-[var(--text-secondary)] mt-1">
                <span>{item.size}</span>
                <span>{item.uploadedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
