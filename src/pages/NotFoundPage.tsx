import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="flex-1 w-full flex items-center justify-center py-20 md:py-32 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 text-center max-w-lg">
        <div className="font-mono text-7xl md:text-8xl font-black text-[var(--accent-blue)] tracking-tighter mb-2">
          404
        </div>
        <div className="w-14 h-14 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--accent-blue)]">
          <Icon name="device_unknown" size={28} />
        </div>
        <h1 className="text-[var(--text-primary)] font-extrabold text-2xl sm:text-3xl tracking-tight mb-3">
          Page Not Available
        </h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          The requested page URL could not be found or may have been relocated. Verify the web address or explore our high-performance hardware catalog.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icon name="arrow_back" size={16} /> GO BACK
          </button>
          <Link
            to="/"
            className="px-5 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="home" size={16} /> GO HOME
          </Link>
          <Link
            to="/products"
            className="px-5 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)] text-[var(--accent-blue)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="shopping_bag" size={16} /> CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </main>
  )
}
