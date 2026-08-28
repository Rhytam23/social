import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Icon, EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

export function AdminProducts() {
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Bulk import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parsedItems, setParsedItems] = useState<Array<any>>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  const { data, loading, error, reload } = useApi(
    useCallback(() => adminService.listProducts(page, 24), [page]),
    [page]
  )

  const products = data?.data ?? []
  const pagination = data?.pagination

  const confirmDelete = async () => {
    if (!deletingId) return
    setActionError(null)
    try {
      await adminService.deleteProduct(deletingId)
      setDeletingId(null)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete product')
    }
  }

  // Generate and download sample Excel / CSV template
  const downloadSampleTemplate = () => {
    const csvContent = [
      'Name,SKU,Category Slug,Brand Slug,Price,Previous Price,Cost Price,Discount Percent,Stock Quantity,Description,Featured,New,Image URL',
      '"NVIDIA GeForce RTX 4080 Super",GPU-RTX4080S-01,gpus,nvidia,999.99,1199.99,850.00,16,15,"Ultra high performance 16GB GDDR6X gaming GPU",true,true,"https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80"',
      '"AMD Ryzen 7 7800X3D Processor",CPU-RYZEN7800X-01,cpus,amd,389.00,449.00,320.00,13,25,"8-core 16-thread gaming processor with 3D V-Cache",true,false,"https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80"',
      '"Corsair Vengeance RGB 32GB DDR5",RAM-CORSAIR-32GB,ram,corsair,129.99,149.99,95.00,13,50,"32GB (2x16GB) DDR5 6000MHz C36 Desktop Memory",false,true,"https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80"'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'premium_pc_products_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse CSV file content uploaded by client
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        setImportErrors(['Uploaded file is empty or missing headers.'])
        return
      }

      const items = []
      for (let i = 1; i < lines.length; i++) {
        // Robust CSV splitting supporting quotes
        const rawLine = lines[i]
        const cols: string[] = []
        let inQuotes = false
        let colBuffer = ''

        for (let c = 0; c < rawLine.length; c++) {
          const char = rawLine[c]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            cols.push(colBuffer.trim())
            colBuffer = ''
          } else {
            colBuffer += char
          }
        }
        cols.push(colBuffer.trim())

        if (cols.length < 3) continue

        const clean = (v?: string) => v ? v.replace(/^"|"$/g, '').trim() : ''

        const name = clean(cols[0])
        const sku = clean(cols[1])
        const categorySlug = clean(cols[2])
        const brandSlug = clean(cols[3])
        const price = parseFloat(clean(cols[4])) || 0
        const previousPrice = parseFloat(clean(cols[5])) || undefined
        const costPrice = parseFloat(clean(cols[6])) || undefined
        const discountPercent = parseInt(clean(cols[7]), 10) || 0
        const stockQuantity = parseInt(clean(cols[8]), 10) || 10
        const description = clean(cols[9])
        const isFeatured = clean(cols[10]).toLowerCase() === 'true'
        const isNew = clean(cols[11]).toLowerCase() === 'true'
        const imageUrl = clean(cols[12])

        if (name && sku && price > 0) {
          items.push({
            name,
            sku,
            categorySlug,
            brandSlug,
            price,
            previousPrice,
            costPrice,
            discountPercent,
            stockQuantity,
            description,
            isFeatured,
            isNew,
            imageUrl,
          })
        }
      }

      if (items.length === 0) {
        setImportErrors(['No valid product rows found in the uploaded file. Check formatting.'])
      }
      setParsedItems(items)
    }
    reader.readAsText(file)
  }

  // Process bulk import API call
  const handleBulkImportSubmit = async () => {
    if (parsedItems.length === 0) return
    setImporting(true)
    setImportErrors([])
    try {
      const res = await adminService.bulkImportProducts(parsedItems)
      if (res.errors && res.errors.length > 0) {
        setImportErrors(res.errors)
      }
      setSuccessMessage(`Successfully imported ${res.importedCount} products into your live catalog!`)
      setShowImportModal(false)
      setParsedItems([])
      reload()
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Bulk import failed'])
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={pagination ? `${pagination.total} products in catalog` : 'Loading catalog…'}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={downloadSampleTemplate}
            >
              <Icon name="download" size={15} /> Reference Excel Sheet
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowImportModal(true)
                setSuccessMessage(null)
                setImportErrors([])
                setParsedItems([])
              }}
            >
              <Icon name="upload_file" size={15} /> Upload Excel / CSV
            </Button>

            <Link to="/admin/products/new">
              <Button variant="primary" size="md">
                <Icon name="add" size={15} /> Add Product
              </Button>
            </Link>
          </div>
        }
      />

      {successMessage && (
        <div className="mb-4 p-3 bg-[var(--color-stock-green)]/10 border border-[var(--color-stock-green)]/30 rounded-lg text-[var(--color-stock-green)] text-xs font-mono flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="cursor-pointer hover:underline font-bold">DISMISS</button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No products"
          message="Add your first product to the catalog."
          action={
            <Link to="/admin/products/new">
              <Button variant="primary" size="md">ADD PRODUCT</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[760px]">
                <thead>
                  <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                    {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
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
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {p.primaryImage ? (
                            <img
                              src={p.primaryImage}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-[var(--bg-primary)] shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] shrink-0 flex items-center justify-center">
                              <Icon name="memory" size={18} className="text-[var(--accent-blue)]" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="text-[var(--text-primary)] text-xs font-semibold truncate block max-w-[260px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">{p.brandName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">{p.sku}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.categoryName ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)] font-bold">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Pill status={p.stockStatus} />
                          <span className="font-mono text-[10px] text-[var(--text-secondary)]">{p.stockAvailable}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Icon name="edit" size={16} />
                          </Link>
                          <Link
                            to={`/products/${p.slug}`}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label={`View ${p.name}`}
                          >
                            <Icon name="visibility" size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingId(p.id)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                            aria-label={`Delete ${p.name}`}
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

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}>
                PREVIOUS
              </Button>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                PAGE {pagination.page} / {pagination.totalPages}
              </span>
              <Button variant="outline" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
                NEXT
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-[var(--text-primary)] font-bold text-base mb-2">Deactivate this product?</h3>
            <p className="text-[var(--text-secondary)] text-xs mb-5 leading-relaxed">
              The product will be removed from the storefront. Existing orders keep their saved item details.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="md" onClick={() => setDeletingId(null)}>
                CANCEL
              </Button>
              <Button variant="destructive" size="md" onClick={() => void confirmDelete()}>
                DEACTIVATE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
                  <Icon name="upload_file" size={20} className="text-[var(--accent-blue)]" /> Bulk Import Products (Excel / CSV)
                </h3>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5 font-mono">
                  Upload your completed product sheet to update your live catalog instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg">
              <span className="text-xs text-[var(--text-secondary)] font-mono">Need the exact Excel format?</span>
              <Button variant="outline" size="sm" onClick={downloadSampleTemplate}>
                <Icon name="download" size={14} /> Download Sample Template
              </Button>
            </div>

            <div>
              <label htmlFor="csv-upload-input" className="block text-xs font-mono text-[var(--text-secondary)] uppercase font-semibold mb-2">
                Select Excel Sheet / CSV File (.csv)
              </label>
              <input
                id="csv-upload-input"
                type="file"
                accept=".csv, .txt, .xlsx"
                onChange={handleFileChange}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs text-[var(--text-primary)] cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-[var(--accent-blue)] file:text-white hover:file:opacity-90"
              />
            </div>

            {parsedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--color-stock-green)] font-bold">
                    ✓ Found {parsedItems.length} valid product(s) ready to import
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-primary)]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[var(--bg-surface-secondary)] border-b border-[var(--border-subtle)] sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[11px]">
                      {parsedItems.slice(0, 10).map((item, i) => (
                        <tr key={i}>
                          <td className="p-2 text-[var(--text-primary)] font-sans">{item.name}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{item.sku}</td>
                          <td className="p-2 text-[var(--accent-blue)]">${item.price.toFixed(2)}</td>
                          <td className="p-2 text-[var(--text-secondary)]">{item.categorySlug || 'components'}</td>
                          <td className="p-2 text-[var(--text-primary)]">{item.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedItems.length > 10 && (
                    <div className="p-2 text-center text-[10px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
                      …and {parsedItems.length - 10} more products
                    </div>
                  )}
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono max-h-32 overflow-y-auto space-y-1">
                {importErrors.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border-subtle)]">
              <Button variant="outline" size="md" onClick={() => setShowImportModal(false)}>
                CANCEL
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={parsedItems.length === 0 || importing}
                onClick={() => void handleBulkImportSubmit()}
              >
                {importing ? 'IMPORTING PRODUCTS…' : `IMPORT ${parsedItems.length} PRODUCT(S)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
