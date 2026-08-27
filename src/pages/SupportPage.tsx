import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [contactSubmitted, setContactSubmitted] = useState(false)

  const faqs = [
    {
      cat: 'order',
      q: 'How do I track my order status?',
      a: 'You can track real-time build and shipping status on your Account Orders page or by entering your order number on our Order Tracking portal.',
    },
    {
      cat: 'warranty',
      q: 'What is included in the 3-Year System Warranty?',
      a: 'All custom PC builds and prebuilt systems include 3 years of labor, 100% parts replacement coverage with zero deductible, and lifetime phone/chat tech support.',
    },
    {
      cat: 'returns',
      q: 'How do I initiate an RMA or hardware return?',
      a: 'Submit your order ID and serial number through this portal or your Account Dashboard. We will issue a prepaid return shipping label and advance-ship your replacement unit upon carrier scan.',
    },
    {
      cat: 'tech',
      q: 'Are custom PC orders stress-tested before shipping?',
      a: 'Yes, every custom PC undergoes a 72-hour burn-in suite including Prime95, FurMark, MemTest86, and 3DMark TimeSpy Extreme to ensure zero thermal throttling.',
    },
  ]

  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <div className="container-max px-4 md:px-6 py-8 md:py-12">

        {/* Header Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--accent-blue)] font-bold">SUPPORT & RMA PORTAL</span>
        </nav>

        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
            <Icon name="support_agent" size={14} /> DEDICATED HELP CENTER
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Technical Support & Warranty Center
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed max-w-2xl">
            Assistance for hardware compatibility, order dispatch tracking, component replacement, and manufacturer RMA claims.
          </p>
        </header>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
              <Icon name="headset_mic" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-base">Live Technician Support</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Available 7 days a week, 8:00 AM - 10:00 PM EST.</p>
            <span className="text-[var(--accent-blue)] font-mono text-xs font-semibold block pt-2">Typical response &lt; 2 mins</span>
          </div>

          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
              <Icon name="mail" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-base">Email & RMA Desk</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Direct support ticket triage and warranty RMA requests.</p>
            <span className="text-[var(--text-primary)] font-mono text-xs font-semibold block pt-2">support@premiumpc.com</span>
          </div>

          <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center">
              <Icon name="memory" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-base">Compatibility Configurator</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Questions about motherboard BIOS, RAM clearances, or PSU cables?</p>
            <Link to="/builder" className="text-[var(--accent-blue)] font-mono text-xs block pt-2 font-bold hover:underline">
              Launch PC Builder →
            </Link>
          </div>
        </div>

        {/* FAQ Section & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-sm text-[var(--text-primary)] flex items-center justify-between gap-3 hover:text-[var(--accent-blue)] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <Icon name={openFaq === idx ? 'expand_less' : 'expand_more'} size={20} className="text-[var(--text-secondary)] shrink-0" />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Form */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl space-y-4">
              <h2 className="text-[var(--text-primary)] font-bold text-xs font-mono uppercase border-b border-[var(--border-subtle)] pb-3">
                SUBMIT A SUPPORT TICKET
              </h2>

              {contactSubmitted ? (
                <div className="p-6 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 font-mono text-xs">
                  <Icon name="check_circle" size={32} className="mx-auto mb-2" />
                  Ticket created successfully! Our hardware technicians will reply to your email shortly.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setContactSubmitted(true)
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1.5 uppercase font-semibold">Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1.5 uppercase font-semibold">Inquiry Category</label>
                    <select className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors">
                      <option>Order Tracking & Shipping</option>
                      <option>Hardware RMA & Warranty</option>
                      <option>Payment & Refund Help</option>
                      <option>Account & Login Issues</option>
                      <option>Technical Compatibility</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1.5 uppercase font-semibold">Issue Details</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Include order ID or component serial number..."
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    SEND TICKET TO SUPPORT
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
