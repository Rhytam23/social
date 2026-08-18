import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// ─── Icon ─────────────────────────────────────────────────────────────────────

interface IconProps {
  name: string
  className?: string
  size?: number
  filled?: boolean
  style?: React.CSSProperties
}

export function Icon({ name, className = '', size = 20, filled = false, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'orange' | 'green' | 'yellow' | 'red' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20',
    orange: 'bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] border border-[var(--accent-orange)]/30 font-bold',
    green: 'bg-[var(--color-stock-green-val)]/15 text-[var(--color-stock-green-val)] border border-[var(--color-stock-green-val)]/30 font-bold',
    yellow: 'bg-[var(--color-stock-yellow-val)]/15 text-[var(--color-stock-yellow-val)] border border-[var(--color-stock-yellow-val)]/30 font-bold',
    red: 'bg-[var(--color-stock-red-val)]/15 text-[var(--color-stock-red-val)] border border-[var(--color-stock-red-val)]/30 font-bold',
    outline: 'border border-[var(--border-theme)] text-[var(--text-secondary)]',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        font-mono text-[10px] font-semibold tracking-wider uppercase
        rounded-md
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

// ─── StockBadge ───────────────────────────────────────────────────────────────

interface StockBadgeProps {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

export function StockBadge({ status }: StockBadgeProps) {
  const configs = {
    'in-stock': { label: 'IN STOCK', variant: 'green' as const },
    'low-stock': { label: 'LOW STOCK', variant: 'yellow' as const },
    'out-of-stock': { label: 'OUT OF STOCK', variant: 'red' as const },
  }
  const config = configs[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-sans text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg'

  const variantClasses: Record<string, string> = {
    primary: 'bg-[var(--accent-blue)] text-white hover:bg-[var(--accent-blue-hover)] active:scale-[0.98] shadow-xs',
    secondary: 'bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] text-[var(--text-primary)] hover:border-[var(--accent-blue)] active:scale-[0.98]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]',
    icon: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-surface-secondary)]',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${variant !== 'icon' ? sizeClasses[size] : ''} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── StarRating ───────────────────────────────────────────────────────────────

interface StarRatingProps {
  rating: number
  count?: number
  showCount?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ rating, count, showCount = true, size = 'sm' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 14 : 18
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return 'full'
    if (i < rating) return 'half'
    return 'empty'
  })

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((type, i) => (
          <span
            key={i}
            className={`material-symbols-outlined ${type === 'empty' ? 'text-[var(--border-subtle)]' : 'text-amber-400'}`}
            style={{
              fontSize: iconSize,
              fontVariationSettings: `'FILL' ${type === 'full' ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${iconSize}`,
            }}
          >
            {type === 'half' ? 'star_half' : 'star'}
          </span>
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-[var(--text-muted)] font-mono text-[11px]">({count.toLocaleString()})</span>
      )}
    </div>
  )
}

// ─── Price ────────────────────────────────────────────────────────────────────

interface PriceProps {
  price: number
  previousPrice?: number
  discount?: number
  size?: 'sm' | 'md' | 'lg'
}

export function Price({ price, previousPrice, discount, size = 'md' }: PriceProps) {
  const mainSizeClasses = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  }

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`text-[var(--text-primary)] tracking-tight ${mainSizeClasses[size]}`}>
        ${price.toFixed(2)}
      </span>
      {previousPrice && (
        <span className="text-xs text-[var(--text-muted)] line-through">
          ${previousPrice.toFixed(2)}
        </span>
      )}
      {discount && (
        <Badge variant="orange">-{discount}%</Badge>
      )}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-[var(--border-theme)] ${className}`} />
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1.5 text-xs text-[var(--text-secondary)] ${className}`}>
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {crumb.href && !isLast ? (
              <Link to={crumb.href} className="hover:text-[var(--text-primary)] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[var(--text-primary)] font-medium' : ''}>{crumb.label}</span>
            )}
            {!isLast && <Icon name="chevron_right" size={14} className="text-[var(--text-muted)]" />}
          </span>
        )
      })}
    </nav>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon = 'inbox', title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl p-10 text-center flex flex-col items-center ${className}`}>
      <Icon name={icon} size={40} className="text-[var(--text-muted)] mb-3" />
      <h3 className="text-[var(--text-primary)] font-semibold text-base mb-1">{title}</h3>
      {message && <p className="text-[var(--text-secondary)] text-xs md:text-sm max-w-[420px] w-full mx-auto leading-relaxed mb-5">{message}</p>}
      {action}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[var(--bg-surface-secondary)] rounded-lg animate-pulse ${className}`} />
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
}

export function SectionHeader({ title, subtitle, ctaLabel, ctaHref }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <h2 className="text-[var(--text-primary)] font-bold text-xl tracking-tight">{title}</h2>
        {subtitle && <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-0.5">{subtitle}</p>}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="text-xs font-semibold text-[var(--accent-blue)] hover:underline flex items-center gap-1 shrink-0"
        >
          <span>{ctaLabel}</span>
          <Icon name="arrow_forward" size={14} />
        </Link>
      )}
    </div>
  )
}

