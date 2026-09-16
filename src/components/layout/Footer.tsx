import { Link } from 'react-router-dom'
import { Icon } from '../ui'
import { FadeUp } from '../motion/MotionPrimitives'

export function Footer() {
  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Our Menu', href: '/menu' },
    { label: 'Contact', href: '/contact' },
  ]

  const socialLinks = [
    { name: 'Instagram', href: '#' },
    { name: 'Facebook', href: '#' },
    { name: 'X (Twitter)', href: '#' },
  ]

  return (
    <footer className="bg-(--bg-surface-secondary) border-t border-(--border-theme) mt-auto py-12 md:py-16 text-(--text-primary)">
      <FadeUp duration={600} className="container-max px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-(--accent-green) text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Icon name="coffee" size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-(--text-primary) group-hover:text-(--accent-green) transition-colors duration-200">
                [CAFÉ NAME]
              </span>
            </Link>

            <p className="text-xs md:text-sm text-(--text-secondary) leading-relaxed max-w-sm">
              [CLIENT DESCRIPTION - Welcoming café serving artisan coffee, fresh breakfast, lunch specialties, and delectable desserts.]
            </p>

            <div className="pt-2 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="px-3 py-1.5 rounded-md bg-(--bg-surface) border border-(--border-theme) text-xs font-semibold text-(--text-secondary) hover:text-(--accent-green) hover:border-(--accent-green) hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Column */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
              Navigation
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs md:text-sm text-(--text-secondary) hover:text-(--accent-green) hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Hours Column */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
              Visit & Contact
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-(--text-secondary)">
              <li className="flex items-start gap-2">
                <Icon name="location_on" size={16} className="text-(--accent-green) shrink-0 mt-0.5" />
                <span>[ADDRESS]</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="call" size={16} className="text-(--accent-green) shrink-0" />
                <span>[PHONE]</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="mail" size={16} className="text-(--accent-green) shrink-0" />
                <span>[EMAIL]</span>
              </li>
              <li className="flex items-start gap-2 pt-1 border-t border-(--border-subtle)">
                <Icon name="schedule" size={16} className="text-(--accent-green) shrink-0 mt-0.5" />
                <span>[OPENING HOURS]</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-(--border-subtle) flex flex-col sm:flex-row items-center justify-between text-xs text-(--text-muted) gap-4">
          <p>© {new Date().getFullYear()} [CAFÉ NAME]. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-(--text-primary) transition-colors">
              About
            </Link>
            <span>•</span>
            <Link to="/menu" className="hover:text-(--text-primary) transition-colors">
              Menu
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-(--text-primary) transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </FadeUp>
    </footer>
  )
}
