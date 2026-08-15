import { useState } from 'react'
import { Icon } from '../../components/ui'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { coupons } from '../../data'
import { useShop } from '../../context/ShopContext'

export function AdminPromotions() {
  const { heroCampaign, updateHeroCampaign } = useShop()

  const [badge, setBadge] = useState(heroCampaign.badge)
  const [headlinePrimary, setHeadlinePrimary] = useState(heroCampaign.headlinePrimary)
  const [headlineAccent, setHeadlineAccent] = useState(heroCampaign.headlineAccent)
  const [description, setDescription] = useState(heroCampaign.description)
  const [image, setImage] = useState(heroCampaign.image)
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(heroCampaign.primaryCtaLabel)
  const [primaryCtaHref, setPrimaryCtaHref] = useState(heroCampaign.primaryCtaHref)
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(heroCampaign.secondaryCtaLabel)
  const [secondaryCtaHref, setSecondaryCtaHref] = useState(heroCampaign.secondaryCtaHref)

  const [savedHero, setSavedHero] = useState(false)

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateHeroCampaign({
      badge,
      headlinePrimary,
      headlineAccent,
      description,
      image,
      primaryCtaLabel,
      primaryCtaHref,
      secondaryCtaLabel,
      secondaryCtaHref,
    })
    setSavedHero(true)
    setTimeout(() => setSavedHero(false), 2500)
  }

  const activeCoupons = coupons.filter((c) => c.status === 'Active').length
  const fieldClass = 'w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#007aff] placeholder:text-[#8b90a0]'
  const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1 uppercase font-bold tracking-wider'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions & Homepage Hero CMS"
        subtitle="Manage flash deals, homepage hero campaigns, and coupon codes"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Coupons" value={String(activeCoupons)} icon="sell" color="#007aff" />
        <StatCard label="Total Redemptions" value="7.2k" delta="14%" deltaUp icon="redeem" color="#30d158" />
        <StatCard label="Hero Campaigns" value="1 Active" icon="campaign" color="#ff5c00" />
        <StatCard label="Discount Given" value="$89k" icon="percent" color="#ffd60a" />
      </div>

      {/* ── Homepage Hero Campaign Management ── */}
      <section className="bg-[#1a1b1f] border border-[#414755] rounded p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#292a2e]">
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Icon name="campaign" size={20} className="text-[#007aff]" />
              <span>Live Homepage Hero Campaign Manager</span>
            </h2>
            <p className="text-[#8b90a0] text-xs mt-0.5">
              Changes saved here instantly update the flagship campaign hero on the live storefront.
            </p>
          </div>
          {savedHero && (
            <span className="font-mono text-xs text-[#30d158] font-bold flex items-center gap-1">
              <Icon name="check_circle" size={16} /> SAVED LIVE
            </span>
          )}
        </div>

        <form onSubmit={handleHeroSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Hero Badge Text</label>
              <input className={fieldClass} value={badge} onChange={(e) => setBadge(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Headline Primary</label>
              <input className={fieldClass} value={headlinePrimary} onChange={(e) => setHeadlinePrimary(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Headline Accent (Blue)</label>
              <input className={fieldClass} value={headlineAccent} onChange={(e) => setHeadlineAccent(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description Copy</label>
            <textarea
              className={`${fieldClass} h-20 resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Hero Photography / Graphics Image URL</label>
            <input className={fieldClass} value={image} onChange={(e) => setImage(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Primary CTA Label</label>
              <input className={fieldClass} value={primaryCtaLabel} onChange={(e) => setPrimaryCtaLabel(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Primary CTA Href</label>
              <input className={fieldClass} value={primaryCtaHref} onChange={(e) => setPrimaryCtaHref(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Secondary CTA Label</label>
              <input className={fieldClass} value={secondaryCtaLabel} onChange={(e) => setSecondaryCtaLabel(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Secondary CTA Href</label>
              <input className={fieldClass} value={secondaryCtaHref} onChange={(e) => setSecondaryCtaHref(e.target.value)} required />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
          >
            <Icon name="save" size={16} />
            <span>SAVE HERO CAMPAIGN TO STOREFRONT</span>
          </button>
        </form>
      </section>

      {/* Coupons */}
      <section>
        <h2 className="text-white font-bold text-sm mb-3">Active Coupon Codes</h2>
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="font-mono text-[10px] text-[#8b90a0] uppercase border-b border-[#292a2e]">
                <th className="text-left p-3 font-semibold">Code</th>
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-center p-3 font-semibold">Discount</th>
                <th className="text-left p-3 font-semibold">Usage</th>
                <th className="text-left p-3 font-semibold">Expires</th>
                <th className="text-center p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#1e1f23]">
                  <td className="p-3">
                    <span className="font-mono text-[#007aff] font-bold bg-[#007aff10] border border-[#007aff30] px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                  </td>
                  <td className="p-3 text-[#c1c6d7]">{c.description}</td>
                  <td className="p-3 text-center font-mono text-white font-bold">
                    {c.type === 'percent' ? `${c.value}%` : `$${c.value}`}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#121317] rounded overflow-hidden">
                        <div className="h-full bg-[#007aff]" style={{ width: `${Math.min(100, (c.uses / c.maxUses) * 100)}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-[#8b90a0]">
                        {c.uses.toLocaleString()}/{c.maxUses.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[#8b90a0]">{c.expires}</td>
                  <td className="p-3 text-center">
                    <Pill status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
