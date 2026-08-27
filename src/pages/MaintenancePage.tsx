import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function MaintenancePage() {
  const [checking, setChecking] = useState(false)

  const handleCheckStatus = () => {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      window.location.href = '/'
    }, 1500)
  }

  return (
    <main className="flex-1 w-full flex items-center justify-center py-20 md:py-32 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 text-center max-w-lg">
        <div className="w-16 h-16 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--accent-blue)]">
          <Icon name="build" size={32} />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
          SYSTEM MAINTENANCE IN PROGRESS
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3">
          We’ll Be Right Back
        </h1>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
          We are currently upgrading our cloud infrastructure and performing scheduled platform enhancements to deliver faster hardware stock updates and system benchmarking.
        </p>

        {/* Status Indicator */}
        <div className="p-4 mb-8 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl font-mono text-xs text-left space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span>Estimated Downtime:</span>
            <span className="font-bold text-[var(--text-primary)]">Under 15 minutes</span>
          </div>
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span>Database Status:</span>
            <span className="font-bold text-amber-500">Maintenance & Indexing</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="px-6 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Icon name="refresh" size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'CHECKING STATUS...' : 'RETRY CONNECTION'}
          </button>
          <Link
            to="/support"
            className="px-6 py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="help_outline" size={16} /> CONTACT SUPPORT
          </Link>
        </div>
      </div>
    </main>
  )
}
