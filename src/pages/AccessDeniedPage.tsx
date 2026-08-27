import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function AccessDeniedPage() {
  return (
    <main className="flex-1 w-full flex items-center justify-center py-20 md:py-32 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 text-center max-w-lg">
        <div className="font-mono text-7xl md:text-8xl font-black text-amber-500 tracking-tighter mb-2">
          403
        </div>

        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
          <Icon name="lock" size={28} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono text-xs font-semibold mb-3">
          ACCESS RESTRICTED
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3">
          Access Permission Denied
        </h1>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          You do not have the required security permissions or authorization role to access this area. If you believe this is an error, please log in with an authorized account or contact support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="home" size={16} /> GO HOME
          </Link>
          <Link
            to="/account"
            className="px-5 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="person" size={16} /> ACCOUNT DASHBOARD
          </Link>
          <Link
            to="/support"
            className="px-5 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="help_outline" size={16} /> CONTACT SUPPORT
          </Link>
        </div>
      </div>
    </main>
  )
}
