import { useState } from 'react'
import { Icon, Button } from '../../components/ui'
import { AdminPageHeader } from './AdminLayout'
import { useShop } from '../../context/ShopContext'

export function AdminSettings() {
  const { settings, updateSettings } = useShop()

  const [storeName, setStoreName] = useState(settings.storeName)
  const [contactEmail, setContactEmail] = useState(settings.contactEmail)
  const [phone, setPhone] = useState(settings.phone)
  const [currency, setCurrency] = useState(settings.currency)
  const [shippingRate, setShippingRate] = useState(settings.shippingRate)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.freeShippingThreshold)
  const [taxRate, setTaxRate] = useState(settings.taxRate)

  const [saved, setSaved] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      storeName,
      contactEmail,
      phone,
      currency,
      shippingRate: Number(shippingRate),
      freeShippingThreshold: Number(freeShippingThreshold),
      taxRate: Number(taxRate),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const fieldClass = 'w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]'
  const labelClass = 'text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-bold tracking-wider'

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminPageHeader
        title="Store Settings"
        subtitle="Manage store identity, shipping thresholds, tax rates, and currency parameters"
      />

      <form onSubmit={handleSubmit} className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-theme)]">
          <h2 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
            <Icon name="settings" size={20} className="text-[var(--accent-blue)]" /> General Store Parameters
          </h2>
          {saved && (
            <span className="font-mono text-xs text-[var(--color-stock-green)] font-bold flex items-center gap-1">
              <Icon name="check_circle" size={16} /> SETTINGS SAVED
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Store Name</label>
            <input className={fieldClass} value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Support Email</label>
            <input className={fieldClass} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Base Currency</label>
            <select className={fieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
              <option value="CAD ($)">CAD ($)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-theme)]">
          <h2 className="text-[var(--text-primary)] font-bold text-sm mb-3 flex items-center gap-2">
            <Icon name="local_shipping" size={18} className="text-[var(--accent-blue)]" /> Shipping & Tax Rates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Standard Shipping ($)</label>
              <input type="number" step="1" className={fieldClass} value={shippingRate} onChange={(e) => setShippingRate(Number(e.target.value))} required />
            </div>
            <div>
              <label className={labelClass}>Free Shipping Threshold ($)</label>
              <input type="number" step="10" className={fieldClass} value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} required />
            </div>
            <div>
              <label className={labelClass}>Estimated Tax Rate (%)</label>
              <input type="number" step="0.1" className={fieldClass} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} required />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-theme)]">
          <Button
            type="submit"
            variant="primary"
            size="md"
          >
            <Icon name="save" size={16} /> Save Store Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}
