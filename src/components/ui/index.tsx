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
    primary: 'bg-[#007aff] text-white',
    orange: 'bg-[#ff5c00] text-white',
    green: 'border border-[#30d158] text-[#30d158]',
    yellow: 'border border-[#ffd60a] text-[#ffd60a]',
    red: 'border border-[#ff453a] text-[#ff453a]',
    outline: 'border border-[#414755] text-[#c1c6d7]',
  }

  return (
    <span
      className={`
        inline-block px-2 py-0.5
        font-mono text-[10px] font-medium tracking-[0.05em] uppercase
        rounded-[2px]
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
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.05em] uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[4px]'

  const variantClasses: Record<string, string> = {
    primary: 'bg-[#007aff] text-white hover:bg-[#0066d6] active:bg-[#004fc2]',
    secondary: 'bg-transparent border border-[#414755] text-white hover:border-[#8b90a0] active:opacity-80',
    ghost: 'bg-transparent text-[#8b90a0] hover:text-white active:opacity-80',
    icon: 'bg-transparent text-[#c1c6d7] hover:text-white active:opacity-80 p-0',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
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
  const iconSize = size === 'sm' ? 12 : 16
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return 'full'
    if (i < rating) return 'half'
    return 'empty'
  })

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((type, i) => (
          <span
            key={i}
            className={`material-symbols-outlined ${type === 'empty' ? 'text-[#414755]' : 'text-[#ffd60a]'}`}
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
        <span className="text-[#8b90a0] font-mono text-[10px]">({count.toLocaleString()})</span>
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
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  }

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`text-white tracking-tight ${mainSizeClasses[size]}`}>
        ${price.toFixed(2)}
      </span>
      {previousPrice && (
        <span className="text-sm text-[#8b90a0] line-through">
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
  return <hr className={`border-[#414755] ${className}`} />
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1.5 text-xs font-mono text-[#8b90a0] ${className}`}>
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {crumb.href && !isLast ? (
              <Link to={crumb.href} className="hover:text-white transition-colors uppercase">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[#adc6ff] uppercase' : 'uppercase'}>{crumb.label}</span>
            )}
            {!isLast && <Icon name="chevron_right" size={12} className="text-[#414755]" />}
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
    <div className={`bg-[#1a1b1f] border border-[#414755] rounded p-12 text-center flex flex-col items-center ${className}`}>
      <Icon name={icon} size={48} className="text-[#414755] mb-3" />
      <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
      {message && <p className="text-[#8b90a0] text-xs max-w-sm mx-auto mb-4">{message}</p>}
      {action}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1e1f23] rounded animate-pulse ${className}`} />
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
    <div className="flex items-end justify-between mb-4 gap-4">
      <div>
        <h2 className="text-white font-semibold text-lg tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#8b90a0] text-sm mt-0.5">{subtitle}</p>}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="font-mono text-[11px] tracking-widest text-[#adc6ff] hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          {ctaLabel}
          <Icon name="chevron_right" size={14} />
        </Link>
      )}
    </div>
  )
}
