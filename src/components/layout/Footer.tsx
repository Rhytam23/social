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
    <div className="border-b border-[#292a2e] py-3 md:border-none md:py-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between font-mono text-xs font-bold tracking-wider text-white uppercase border-l-2 border-[#007aff] pl-2.5 md:cursor-default text-left"
      >
        <span>{title}</span>
        <span className="md:hidden text-[#8b90a0]">
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
    { label: 'Track Your Order', href: '/account/orders' },
    { label: 'Shipping & Delivery', href: '/support#shipping' },
    { label: 'Returns & Replacements', href: '/support#returns' },
    { label: 'Warranty & RMA', href: '/support#warranty' },
    { label: 'FAQs & Help Center', href: '/support#faqs' },
    { label: 'Payment Methods', href: '/support#payments' },
    { label: 'Delivery Information', href: '/support#delivery' },
    { label: 'Order Support', href: '/support#orders' },
  ]

  const hardwareBuildsLinks = [
    { label: 'Custom PC Builder', href: '/builder' },
    { label: 'Prebuilt Gaming PCs', href: '/gaming-pcs' },
    { label: 'Graphics Cards (GPUs)', href: '/graphics-cards' },
    { label: 'Desktop Processors (CPUs)', href: '/cpus' },
    { label: 'Motherboards', href: '/products?category=Motherboards' },
    { label: 'RAM & Memory', href: '/products?category=RAM' },
    { label: 'PCIe 5.0 SSDs & Storage', href: '/products?category=Storage' },
    { label: 'AIO & Liquid Cooling', href: '/products?category=Cooling' },
    { label: 'PC Chassis & Cases', href: '/products?category=Cases' },
    { label: 'Power Supplies (PSUs)', href: '/products?category=PSUs' },
    { label: 'High-Refresh Monitors', href: '/monitors' },
    { label: 'Esports Peripherals', href: '/products?category=Peripherals' },
  ]

  const dealsShoppingLinks = [
    { label: "Today's Deals", href: '/deals' },
    { label: 'Flash Deals', href: '/deals#flash' },
    { label: 'Clearance & Refurbished', href: '/deals#clearance' },
    { label: 'New Hardware Arrivals', href: '/products?filter=new' },
    { label: 'Best Sellers', href: '/products?filter=bestsellers' },
    { label: 'Gaming PC Deals', href: '/deals#gaming-pcs' },
    { label: 'Component Bundles', href: '/deals#bundles' },
    { label: 'E-Gift Cards', href: '/gift-cards' },
    { label: 'All Catalog Products', href: '/products' },
  ]

  const brandLinks = [
    { label: 'NVIDIA GeForce', href: '/brands' },
    { label: 'AMD Ryzen & Radeon', href: '/brands' },
    { label: 'Intel Core', href: '/brands' },
    { label: 'ASUS & ROG', href: '/brands' },
    { label: 'MSI Gaming', href: '/brands' },
    { label: 'Gigabyte AORUS', href: '/brands' },
    { label: 'Corsair', href: '/brands' },
    { label: 'Kingston FURY', href: '/brands' },
    { label: 'Samsung Memory', href: '/brands' },
    { label: 'Western Digital', href: '/brands' },
    { label: 'NZXT', href: '/brands' },
    { label: 'Razer Gaming', href: '/brands' },
  ]

  const legalLinks = [
    { label: 'About PREMIUM PC', href: '/about' },
    { label: 'B2B Enterprise Sales', href: '/b2b' },
    { label: 'Careers', href: '/careers' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Terms of Sale', href: '/terms#sale' },
    { label: 'Imprint', href: '/imprint' },
    { label: 'Warranty & RMA Guidelines', href: '/support#warranty' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Authorized Partnerships', href: '/brands' },
  ]

  return (
    <footer className="bg-[#121317] mt-auto text-[#e3e2e7] select-none">
      {/* ─── VIP Hardware Newsletter Top Banner ─── */}
      <div className="bg-[#16171d]">
        <div className="container-max px-4 md:px-6 py-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#121317] rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="max-w-[550px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#007aff] animate-pulse" />
                <span className="font-mono text-xs text-[#007aff] font-bold tracking-widest uppercase">
                  VIP HARDWARE ALERTS
                </span>
              </div>
              <h3 className="text-white font-black text-xl md:text-2xl tracking-tight">
                Get Exclusive Deals & Tech News
              </h3>
              <p className="text-[#8b90a0] text-xs sm:text-sm mt-1 leading-relaxed">
                Subscribe for early access to GPU drops, flash deals, and hardware reviews. No spam.
              </p>
            </div>

            <div className="w-full lg:max-w-[450px]">
              {subscribed ? (
                <div className="p-3.5 bg-[#30d158]/10 border border-[#30d158]/30 text-[#30d158] rounded-xl font-mono text-xs font-bold flex items-center gap-2">
                  <Icon name="check_circle" size={18} />
                  <span>THANK YOU FOR SUBSCRIBING! CHECK YOUR INBOX FOR CONFIRMATION.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Icon name="mail" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#16171d] border border-[#292a2e] rounded-xl text-white placeholder-[#8b90a0] text-xs font-mono focus:border-[#007aff] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <span>SUBSCRIBE</span>
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </form>
              )}
              <p className="font-mono text-[10px] text-[#8b90a0] mt-2">
                By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Footer 6-Column Grid ─── */}
      <div className="container-max px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Column 1: Brand & Core Information */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 font-black text-xl text-white tracking-tighter">
              <span className="w-3 h-6 bg-[#007aff] rounded-sm inline-block shrink-0" />
              <span>PREMIUM PC</span>
            </Link>

            <p className="text-[#8b90a0] text-xs leading-relaxed max-w-[350px]">
              Precision engineered hardware for enthusiasts, esports competitors, creators, and computational professionals.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['100% AUTHENTIC', 'ATX 3.0 READY', 'GEN 5 VERIFIED', 'EXPRESS DISPATCH'].map((badge) => (
                <span
                  key={badge}
                  className="font-mono text-[9px] tracking-wider border border-[#292a2e] bg-[#16171d] text-[#007aff] px-2 py-0.5 rounded-md font-bold"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Security Compliance */}
            <div className="flex flex-col gap-1.5 text-[#8b90a0] text-[11px] font-mono pt-2">
              <span className="flex items-center gap-1.5">
                <Icon name="lock" size={14} className="text-[#30d158]" /> 256-BIT SSL ENCRYPTED
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="verified_user" size={14} className="text-[#007aff]" /> PCI-DSS COMPLIANT
              </span>
            </div>
          </div>

          {/* Column 2: Customer Service */}
          <FooterAccordion
            title="CUSTOMER SERVICE"
            isOpen={!!openSections['customer']}
            onToggle={() => toggleSection('customer')}
          >
            <ul className="flex flex-col gap-2">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          {/* Column 3: Hardware & Builds */}
          <FooterAccordion
            title="HARDWARE & BUILDS"
            isOpen={!!openSections['hardware']}
            onToggle={() => toggleSection('hardware')}
          >
            <ul className="flex flex-col gap-2">
              {hardwareBuildsLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          {/* Column 4: Deals & Shopping */}
          <FooterAccordion
            title="DEALS & SHOPPING"
            isOpen={!!openSections['deals']}
            onToggle={() => toggleSection('deals')}
          >
            <ul className="flex flex-col gap-2">
              {dealsShoppingLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          {/* Column 5: Brands Directory */}
          <FooterAccordion
            title="BRANDS DIRECTORY"
            isOpen={!!openSections['brands']}
            onToggle={() => toggleSection('brands')}
          >
            <ul className="flex flex-col gap-2">
              {brandLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to="/brands"
                  className="font-mono text-xs font-bold text-[#007aff] hover:text-[#adc6ff] flex items-center gap-1 transition-colors"
                >
                  <span>VIEW ALL BRANDS</span>
                  <Icon name="arrow_forward" size={14} />
                </Link>
              </li>
            </ul>
          </FooterAccordion>

          {/* Column 6: Company & Legal */}
          <FooterAccordion
            title="COMPANY & LEGAL"
            isOpen={!!openSections['legal']}
            onToggle={() => toggleSection('legal')}
          >
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>
        </div>

        {/* ─── Row 2: Payment Methods, Shipping & Social Bar ─── */}
        <div className="border-t border-[#292a2e] mt-12 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] text-[#8b90a0] font-bold uppercase tracking-wider mr-1">
              ACCEPTED PAYMENTS:
            </span>
            {['VISA', 'MASTERCARD', 'PAYPAL', 'APPLE PAY', 'GOOGLE PAY'].map((pay) => (
              <span
                key={pay}
                className="font-mono text-[10px] bg-[#16171d] border border-[#292a2e] text-[#c1c6d7] px-2.5 py-1 rounded-md font-bold"
              >
                {pay}
              </span>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-[#8b90a0] font-bold uppercase tracking-wider">
              CONNECT:
            </span>
            <div className="flex items-center gap-2">
              {['Discord', 'YouTube', 'X / Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href={`#${social.toLowerCase()}`}
                  aria-label={social}
                  className="w-8 h-8 rounded-lg bg-[#16171d] border border-[#292a2e] text-[#8b90a0] hover:text-[#007aff] hover:border-[#007aff] flex items-center justify-center transition-colors font-mono text-xs font-bold"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Row 3: Bottom Copyright & Quick Legal ─── */}
        <div className="border-t border-[#292a2e] mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#8b90a0]">
          <p>© {new Date().getFullYear()} PREMIUM PC STORE. ALL RIGHTS RESERVED.</p>

          <div className="flex flex-wrap gap-5">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Sale
            </Link>
            <Link to="/support#warranty" className="hover:text-white transition-colors">
              RMA Guidelines
            </Link>
            <Link to="/brands" className="hover:text-white transition-colors">
              All Brands
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
