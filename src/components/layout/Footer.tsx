import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui'

interface AccordionSectionProps {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}

function FooterAccordion({ title, children, isOpen, onToggle }: AccordionSectionProps) {
  return (
    <div className="border-b border-(--border-theme) py-3 md:border-none md:py-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between font-mono text-xs font-bold tracking-wider text-(--text-primary) uppercase border-l-2 border-(--accent-blue) pl-2.5 md:cursor-default text-left cursor-pointer"
      >
        <span>{title}</span>
        <span className="md:hidden text-(--text-secondary)">
          <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} />
        </span>
      </button>

      <div className={`mt-3 ${isOpen ? 'block' : 'hidden md:block'}`}>
        {children}
      </div>
    </div>
  )
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  const customerServiceLinks = [
    { label: 'Contact Support', href: '/support' },
    { label: 'Track Order', href: '/account/orders' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Warranty & RMA', href: '/return-policy' },
  ]

  const hardwareBuildsLinks = [
    { label: 'Custom PC Builder', href: '/builder' },
    { label: 'Gaming PCs', href: '/gaming-pcs' },
    { label: 'Graphics Cards', href: '/graphics-cards' },
    { label: 'Processors (CPUs)', href: '/cpus' },
    { label: 'Motherboards', href: '/products?category=Motherboards' },
  ]

  const dealsShoppingLinks = [
    { label: "Today's Deals", href: '/deals' },
    { label: 'New Arrivals', href: '/products?filter=new' },
    { label: 'All Products', href: '/products' },
    { label: 'Compare Products', href: '/compare' },
    { label: 'Wishlist', href: '/wishlist' },
  ]

  const legalLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Refund & Cancellation', href: '/refund-policy' },
    { label: 'Cookie Preferences', href: '/cookie-preferences' },
    { label: 'Shipping Information', href: '/shipping-policy' },
    { label: 'B2B & Business Sales', href: '/b2b' },
  ]

  return (
    <footer className="bg-(--bg-surface) border-t border-(--border-theme) pt-12 pb-8 mt-auto">
      <div className="container-max px-4 md:px-8">
        {/* Newsletter Section */}
        <div className="pb-10 mb-10 border-b border-(--border-theme) flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="text-(--text-primary) font-bold text-lg">Stay Updated</h3>
            <p className="text-(--text-secondary) text-xs md:text-sm mt-0.5">
              Subscribe to get notified about hardware restocks and exclusive component deals.
            </p>
          </div>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full lg:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="px-3.5 py-2 text-xs bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) rounded-lg focus:outline-none focus:border-(--accent-blue) w-full sm:w-72"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5 py-2">
              <Icon name="check_circle" size={16} />
              <span>Thank you for subscribing!</span>
            </div>
          )}
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <FooterAccordion title="Customer Support" isOpen={!!openSections['support']} onToggle={() => toggleSection('support')}>
            <ul className="space-y-2">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Hardware Catalog" isOpen={!!openSections['hardware']} onToggle={() => toggleSection('hardware')}>
            <ul className="space-y-2">
              {hardwareBuildsLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Deals & Shopping" isOpen={!!openSections['deals']} onToggle={() => toggleSection('deals')}>
            <ul className="space-y-2">
              {dealsShoppingLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Company & Legal" isOpen={!!openSections['legal']} onToggle={() => toggleSection('legal')}>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-xs text-(--text-secondary) hover:text-(--text-primary) transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        {/* Payment & Copyright Bar */}
        <div className="border-t border-(--border-theme) mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-(--text-secondary)">
          <p>© {new Date().getFullYear()} Premium PC Store. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Apple Pay'].map((pay) => (
              <span key={pay} className="px-2 py-0.5 bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-muted) text-[10px] rounded font-mono">
                {pay}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
