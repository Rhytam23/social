import { useState } from 'react'
import { Icon } from '../../components/ui'
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

  const fieldClass = 'bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff]'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Central Media Library"
        subtitle="Manage product photography, brand logos, hero graphics & banners"
      />

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-[#1a1b1f] border border-[#414755] rounded p-5 space-y-4">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Icon name="cloud_upload" size={18} className="text-[#007aff]" /> Add New Image Asset URL
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
        <button
          type="submit"
          className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors flex items-center gap-1.5"
        >
          <Icon name="add" size={16} /> ADD ASSET TO LIBRARY
        </button>
      </form>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {mediaLibrary.map((item) => (
          <div key={item.id} className="bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden group flex flex-col justify-between">
            <div className="relative aspect-square bg-[#121317]">
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item.url)}
                  className="w-8 h-8 rounded bg-[#007aff] text-white flex items-center justify-center hover:scale-110 transition-transform"
                  title="Copy URL"
                >
                  <Icon name="content_copy" size={16} />
                </button>
                <button
                  onClick={() => deleteMediaFile(item.id)}
                  className="w-8 h-8 rounded bg-[#ff453a] text-white flex items-center justify-center hover:scale-110 transition-transform"
                  title="Delete"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-white font-mono text-[11px] font-bold truncate">{item.name}</div>
              <div className="flex items-center justify-between font-mono text-[9px] text-[#8b90a0] mt-1">
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
