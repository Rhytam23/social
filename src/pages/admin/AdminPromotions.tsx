import { Icon } from '../../components/ui'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { coupons } from '../../data'

const CAMPAIGNS = [
  { id: 'cmp1', name: 'RTX 50 Launch Event', type: 'Flash Sale', reach: '48.2k', status: 'Active', accent: '#007aff' },
  { id: 'cmp2', name: 'Back to School Build', type: 'Bundle Deal', reach: '31.5k', status: 'Active', accent: '#30d158' },
  { id: 'cmp3', name: 'Black Friday 2026', type: 'Sitewide', reach: '—', status: 'Scheduled', accent: '#bf5af2' },
]

const BANNERS = [
  { id: 'b1', title: 'Homepage Hero — RTX 5090', placement: 'Homepage Top', active: true },
  { id: 'b2', title: 'Deals Page — Flash Banner', placement: 'Deals Header', active: true },
  { id: 'b3', title: 'Category — GPU Promo', placement: 'GPU Category', active: false },
]

export function AdminPromotions() {
  const activeCoupons = coupons.filter((c) => c.status === 'Active').length

  return (
    <div>
      <AdminPageHeader
        title="Promotions"
        subtitle="Coupons, campaigns, banners & flash sales"
        action={
          <button className="px-4 py-2 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors">
            <Icon name="add" size={15} /> CREATE PROMOTION
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Coupons" value={String(activeCoupons)} icon="sell" color="#007aff" />
        <StatCard label="Total Redemptions" value="7.2k" delta="14%" deltaUp icon="redeem" color="#30d158" />
        <StatCard label="Active Campaigns" value="2" icon="campaign" color="#ff5c00" />
        <StatCard label="Discount Given" value="$89k" icon="percent" color="#ffd60a" />
      </div>

      {/* Coupons */}
      <section className="mb-6">
        <h2 className="text-white font-bold text-sm mb-3">Coupon Codes</h2>
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
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292a2e]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#1e1f23]">
                  <td className="p-3"><span className="font-mono text-[#007aff] font-bold bg-[#007aff10] border border-[#007aff30] px-2 py-0.5 rounded">{c.code}</span></td>
                  <td className="p-3 text-[#c1c6d7]">{c.description}</td>
                  <td className="p-3 text-center font-mono text-white font-bold">{c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#121317] rounded overflow-hidden">
                        <div className="h-full bg-[#007aff]" style={{ width: `${Math.min(100, (c.uses / c.maxUses) * 100)}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-[#8b90a0]">{c.uses.toLocaleString()}/{c.maxUses.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[#8b90a0]">{c.expires}</td>
                  <td className="p-3 text-center"><Pill status={c.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-[#8b90a0] hover:text-[#007aff] transition-colors" aria-label="Edit"><Icon name="edit" size={16} /></button>
                      <button className="p-1.5 text-[#8b90a0] hover:text-[#ff453a] transition-colors" aria-label="Delete"><Icon name="delete" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns */}
        <section>
          <h2 className="text-white font-bold text-sm mb-3">Campaigns</h2>
          <div className="space-y-2">
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: `${c.accent}20`, color: c.accent }}><Icon name="campaign" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm truncate">{c.name}</h3>
                  <span className="font-mono text-[10px] text-[#8b90a0]">{c.type} · Reach {c.reach}</span>
                </div>
                <Pill status={c.status} />
              </div>
            ))}
          </div>
        </section>

        {/* Banners */}
        <section>
          <h2 className="text-white font-bold text-sm mb-3">Banners</h2>
          <div className="space-y-2">
            {BANNERS.map((b) => (
              <div key={b.id} className="bg-[#1a1b1f] border border-[#414755] rounded p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded bg-[#007aff20] text-[#007aff] flex items-center justify-center shrink-0"><Icon name="ad_units" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm truncate">{b.title}</h3>
                  <span className="font-mono text-[10px] text-[#8b90a0]">{b.placement}</span>
                </div>
                <Pill status={b.active ? 'Active' : 'Inactive'} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
