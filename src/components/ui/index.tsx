import { type ReactNode } from 'react'

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
  variant?: 'primary' | 'orange' | 'green' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-(--accent-blue)/10 text-(--accent-blue) border border-(--accent-blue)/20',
    orange: 'bg-(--accent-orange)/15 text-(--accent-orange) border border-(--accent-orange)/30 font-bold',
    green: 'bg-(--accent-green)/15 text-(--accent-green) border border-(--accent-green)/30 font-bold',
    outline: 'border border-(--border-theme) text-(--text-secondary)',
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

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  onClick?: (e?: any) => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg active:scale-[0.98]'

  const variantClasses: Record<string, string> = {
    primary: 'bg-(--accent-blue) text-white hover:bg-(--accent-blue-hover) shadow-xs',
    secondary: 'bg-(--bg-surface-secondary) border border-(--border-theme) text-(--text-primary) hover:border-(--accent-green) hover:text-(--accent-green)',
    tertiary: 'bg-transparent text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary)',
    ghost: 'bg-transparent text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface-secondary)',
    outline: 'bg-transparent border border-(--border-theme) text-(--text-primary) hover:border-(--accent-green) hover:text-(--accent-green)',
    icon: 'bg-transparent text-(--text-secondary) hover:text-(--text-primary) p-1.5 rounded-lg hover:bg-(--bg-surface-secondary)',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${variant !== 'icon' ? sizeClasses[size] : ''} ${widthClass} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-(--border-theme) ${className}`} />
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
    <div className={`bg-(--bg-surface) border border-(--border-theme) rounded-xl p-10 text-center flex flex-col items-center ${className}`}>
      <Icon name={icon} size={40} className="text-(--text-muted) mb-3" />
      <h3 className="text-(--text-primary) font-semibold text-base mb-1">{title}</h3>
      {message && <p className="text-(--text-secondary) text-xs md:text-sm max-w-[420px] w-full mx-auto leading-relaxed mb-5">{message}</p>}
      {action}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-(--bg-surface-secondary) rounded-lg animate-pulse ${className}`} />
}

export { CookieConsentBanner } from './CookieConsentBanner'
