import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Button } from '../components/ui'

export function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [contactSubmitted, setContactSubmitted] = useState(false)

  const faqs = [
    {
      q: 'How does your 30-day price match guarantee work?',
      a: 'If you find an identical in-stock retail hardware component or system from an authorized dealer at a lower price within 30 days of purchase, contact support with the link and we will refund the difference instantly.',
    },
    {
      q: 'What is included in the 3-Year System Warranty?',
      a: 'All custom PC builds and prebuilt systems include 3 years of labor, 100% parts replacement coverage with zero deductible, and lifetime phone/chat tech support with dedicated technicians.',
    },
    {
      q: 'How do I initiate an RMA or hardware replacement?',
      a: 'Submit your order ID and serial number through this portal or your Account Dashboard. We will issue a prepaid return shipping label and advance-ship your replacement unit upon carrier scan.',
    },
    {
      q: 'Are custom PC orders bench-tested before shipping?',
      a: 'Yes, every custom PC undergoes a rigorous 72-hour burn-in suite including Prime95, FurMark, MemTest86, and 3DMark TimeSpy Extreme to ensure zero thermal throttling or artifacting.',
    },
  ]

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Header Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-4">
          <Link to="/" className="hover:text-[var(--text-primary)]">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[var(--accent-blue)]">CUSTOMER SUPPORT & RMA</span>
        </nav>

        <h1 className="text-[var(--text-primary)] font-bold text-2xl tracking-tight mb-2">Technical Support & Warranty Portal</h1>
        <p className="text-[var(--text-secondary)] text-xs mb-8">
          Dedicated assistance for order dispatch, component compatibility, and official manufacturer RMA claims.
        </p>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center mb-3">
              <Icon name="support_agent" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-sm">Live Technician Chat</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Available 7 days a week, 8:00 AM - 10:00 PM EST.</p>
            <span className="text-[var(--color-stock-green)] font-mono text-[11px] block pt-2 font-semibold">Typical response &lt; 2 minutes</span>
          </div>

          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-3">
              <Icon name="mail" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-sm">RMA & Warranty Desk</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Email: support@premiumpc.hardware for direct warranty assistance.</p>
            <span className="text-[var(--accent-blue)] font-mono text-[11px] block pt-2 font-semibold">Same-day ticket triage</span>
          </div>

          <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-stock-green)]/10 text-[var(--color-stock-green)] flex items-center justify-center mb-3">
              <Icon name="build" size={22} />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-sm">PC Compatibility Support</h3>
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed">Questions about motherboard BIOS, RAM clearances, or PSU cables?</p>
            <Link to="/builder" className="text-[var(--accent-blue)] font-medium text-xs block pt-2 hover:underline">
              Launch PC Configurator →
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-sm text-[var(--text-primary)] flex items-center justify-between gap-3 hover:text-[var(--accent-blue)] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <Icon name={openFaq === idx ? 'expand_less' : 'expand_more'} size={20} className="text-[var(--text-secondary)] shrink-0" />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-theme)] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Form */}
          <div className="lg:col-span-5">
            <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl space-y-4">
              <h2 className="text-[var(--text-primary)] font-bold text-sm font-mono uppercase border-b border-[var(--border-theme)] pb-3">
                SUBMIT A SUPPORT TICKET
              </h2>

              {contactSubmitted ? (
                <div className="p-6 text-center bg-[var(--color-stock-green)]/10 border border-[var(--color-stock-green)]/20 rounded-lg text-[var(--color-stock-green)] font-mono text-xs">
                  <Icon name="check_circle" size={32} className="mx-auto mb-2" filled />
                  Ticket created successfully! Our hardware technicians will email you shortly.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setContactSubmitted(true)
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Your Email</label>
                    <input type="email" required placeholder="alex@example.com" className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Inquiry Category</label>
                    <select className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]">
                      <option>Order Dispatch & Tracking</option>
                      <option>Hardware RMA & Warranty</option>
                      <option>Technical Compatibility Question</option>
                      <option>Custom Build Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Message / Issue Details</label>
                    <textarea required rows={4} placeholder="Include order ID or product model if applicable..." className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]" />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    Send Ticket to Support
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
