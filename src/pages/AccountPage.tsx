import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'warranty'>('orders')

  const mockOrders = [
    {
      id: 'ORD-892410',
      date: 'August 11, 2026',
      status: 'In Transit',
      tracking: 'TRK-PC-49201948',
      items: 'ASUS ROG STRIX GeForce RTX 4090 OC 24GB + Corsair DOMINATOR TITANIUM 64GB',
      total: 2089.98,
    },
    {
      id: 'ORD-771239',
      date: 'July 19, 2026',
      status: 'Delivered',
      tracking: 'TRK-PC-91028374',
      items: 'Intel Core i9-14900KS + Seasonic PRIME TX-1300 Titanium',
      total: 1109.98,
    },
  ]

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-4">
          <Link to="/" className="hover:text-white">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">CUSTOMER PORTAL</span>
        </nav>

        <div className="flex items-center gap-4 p-6 bg-[#16171d] border border-[#414755] rounded mb-8">
          <div className="w-14 h-14 rounded-full bg-[#007aff20] border border-[#007aff40] flex items-center justify-center text-[#007aff]">
            <Icon name="person" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-xl">Alexandre Vance</h1>
              <span className="font-mono text-[10px] text-[#30d158] bg-[#30d15815] px-2 py-0.5 rounded border border-[#30d15830] font-bold">
                VIP ENTHUSIAST MEMBER
              </span>
            </div>
            <p className="text-[#8b90a0] text-xs font-mono mt-0.5">alex.vance@blackmesa.org · Member since 2024</p>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Tab Menu */}
          <aside className="lg:col-span-3 space-y-1">
            {[
              { key: 'orders', label: 'ORDER HISTORY', icon: 'package_2' },
              { key: 'profile', label: 'ACCOUNT SECURITY', icon: 'shield' },
              { key: 'addresses', label: 'SAVED ADDRESSES', icon: 'home_pin' },
              { key: 'warranty', label: 'WARRANTY & RMA', icon: 'verified' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`w-full flex items-center gap-2.5 p-3 rounded font-mono text-xs font-bold transition-all text-left ${
                  activeTab === tab.key
                    ? 'bg-[#007aff] text-white shadow-md'
                    : 'bg-[#1a1b1f] border border-[#292a2e] text-[#8b90a0] hover:text-white hover:border-[#414755]'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </aside>

          {/* Main Tab Panel (9 cols) */}
          <div className="lg:col-span-9">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg mb-4">Past & Active Orders</h2>
                {mockOrders.map((ord) => (
                  <div key={ord.id} className="p-5 bg-[#1a1b1f] border border-[#414755] rounded space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#292a2e]">
                      <div>
                        <span className="font-mono text-xs text-[#007aff] font-bold block">{ord.id}</span>
                        <span className="text-[11px] font-mono text-[#8b90a0]">Placed on {ord.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[10px] px-2.5 py-1 rounded font-bold ${
                          ord.status === 'Delivered'
                            ? 'bg-[#30d15820] text-[#30d158] border border-[#30d15840]'
                            : 'bg-[#007aff20] text-[#007aff] border border-[#007aff40]'
                        }`}>
                          {ord.status.toUpperCase()}
                        </span>
                        <Link
                          to={`/track-order?id=${ord.id}`}
                          className="px-3 py-1.5 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-xs rounded transition-colors"
                        >
                          TRACK PACKAGE
                        </Link>
                      </div>
                    </div>
                    <div className="text-xs text-[#c1c6d7] leading-relaxed">
                      <strong>Items:</strong> {ord.items}
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[#292a2e]">
                      <span className="text-[#8b90a0]">Tracking: <strong className="text-white">{ord.tracking}</strong></span>
                      <span className="text-[#007aff] font-bold text-sm">${ord.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="p-6 bg-[#1a1b1f] border border-[#414755] rounded space-y-4 max-w-xl">
                <h2 className="text-white font-bold text-base border-b border-[#292a2e] pb-3">Personal Credentials</h2>
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-[#8b90a0] block mb-1">FULL NAME</label>
                    <input type="text" defaultValue="Alexandre Vance" className="w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="text-[#8b90a0] block mb-1">EMAIL ADDRESS</label>
                    <input type="email" defaultValue="alex.vance@blackmesa.org" className="w-full bg-[#121317] border border-[#414755] rounded p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="text-[#8b90a0] block mb-1">SECURITY PASSKEY / 2FA</label>
                    <span className="text-[#30d158] flex items-center gap-1.5 py-1">
                      <Icon name="verified" size={14} /> Hardware YubiKey / WebAuthn Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="p-6 bg-[#1a1b1f] border border-[#414755] rounded space-y-4 max-w-xl">
                <h2 className="text-white font-bold text-base border-b border-[#292a2e] pb-3">Primary Shipping Address</h2>
                <div className="p-4 bg-[#121317] rounded border border-[#292a2e] text-xs font-mono leading-relaxed space-y-1">
                  <strong className="text-white block text-sm">Alexandre Vance</strong>
                  <p className="text-[#8b90a0]">742 Evergreen Terrace</p>
                  <p className="text-[#8b90a0]">Springfield, OR 97477</p>
                  <p className="text-[#8b90a0]">United States</p>
                  <span className="text-[#007aff] text-[10px] block pt-2">DEFAULT DISPATCH DESTINATION</span>
                </div>
              </div>
            )}

            {activeTab === 'warranty' && (
              <div className="p-6 bg-[#1a1b1f] border border-[#414755] rounded space-y-4">
                <h2 className="text-white font-bold text-base border-b border-[#292a2e] pb-3">Registered Hardware Warranties</h2>
                <div className="p-4 bg-[#121317] rounded border border-[#292a2e] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">ASUS ROG STRIX GeForce RTX 4090 OC</span>
                    <span className="font-mono text-[#30d158] text-[10px] bg-[#30d15815] px-2 py-0.5 rounded border border-[#30d15830]">ACTIVE WARRANTY (3 YRS REMAINING)</span>
                  </div>
                  <p className="text-[#8b90a0] font-mono text-[11px]">Serial: ROG-4090-SN982014819 | Coverage: Full Express Replacement</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
