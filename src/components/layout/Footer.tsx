import { Link } from 'react-router-dom'
import { Icon } from '../ui'

export function Footer() {
  const footerLinks = [
    {
      title: 'CUSTOMER SERVICE',
      links: [
        { label: 'Contact Support', href: '/support' },
        { label: 'Track Your Order', href: '/track-order' },
        { label: 'Shipping & Delivery', href: '/support#shipping' },
        { label: 'Returns & Replacements', href: '/support#returns' },
        { label: 'Warranty & RMA Claims', href: '/warranty' },
      ],
    },
    {
      title: 'HARDWARE & BUILDS',
      links: [
        { label: 'Custom PC Builder', href: '/builder' },
        { label: 'Prebuilt Gaming Rigs', href: '/gaming-pcs' },
        { label: 'Graphics Cards Catalog', href: '/graphics-cards' },
        { label: 'Desktop Processors', href: '/cpus' },
        { label: 'Today\'s Special Deals', href: '/deals' },
      ],
    },
    {
      title: 'COMPANY & LEGAL',
      links: [
        { label: 'About PREMIUM PC', href: '/about' },
        { label: 'B2B Enterprise Sales', href: '/b2b' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Authorized Partnerships', href: '/brands' },
      ],
    },
  ]

  return (
    <footer className="bg-[#0d0e12] border-t border-[#292a2e] mt-auto text-[#e3e2e7]">
      <div className="container-max px-4 md:px-6 py-12 md:py-14">
        {/* Main Footer 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-black text-xl text-white tracking-tighter">
              <span className="w-2.5 h-5 bg-[#007aff] rounded-sm inline-block shrink-0" />
              <span>PREMIUM PC</span>
            </Link>

            <p className="text-[#8b90a0] text-xs leading-relaxed max-w-[340px]">
              Precision engineered hardware for enthusiasts, esports competitors, and computational professionals. Authorized retailer with 100% manufacturer warranty.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['100% AUTHENTIC', 'ATX 3.0 READY', 'GEN 5 VERIFIED', 'EXPRESS DISPATCH'].map((badge) => (
                <span
                  key={badge}
                  className="font-mono text-[9px] tracking-wider border border-[#292a2e] bg-[#16171d] text-[#adc6ff] px-2 py-0.5 rounded font-bold"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Payment & Security */}
            <div className="flex flex-wrap items-center gap-4 text-[#8b90a0] text-[11px] font-mono pt-2">
              <span className="flex items-center gap-1.5"><Icon name="lock" size={14} className="text-[#30d158]" /> 256-BIT ENCRYPTED</span>
              <span className="flex items-center gap-1.5"><Icon name="verified_user" size={14} className="text-[#007aff]" /> PCI-DSS COMPLIANT</span>
            </div>
          </div>

          {/* Link Columns 2, 3, 4 */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <span className="font-mono text-xs font-bold tracking-wider text-white mb-4 block uppercase border-l-2 border-[#007aff] pl-2.5">
                {col.title}
              </span>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-[#8b90a0] text-xs hover:text-white transition-colors block py-0.5 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-[#1e1f23] mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[11px] tracking-wider text-[#8b90a0]">
            © {new Date().getFullYear()} PREMIUM PC HARDWARE RETAIL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex flex-wrap gap-5 font-mono text-[11px]">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Sale', href: '/terms' },
              { label: 'RMA Guidelines', href: '/warranty' },
              { label: 'All Brands', href: '/brands' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[#8b90a0] hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
