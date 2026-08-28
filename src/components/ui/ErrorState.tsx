import { Icon, Button } from './index'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

/** Inline failure panel for a data request that could not be completed. */
export function ErrorState({ title = 'Could not load data', message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`bg-(--bg-surface) border border-(--border-theme) rounded-xl p-10 text-center flex flex-col items-center ${className}`}
    >
      <Icon name="cloud_off" size={40} className="text-(--accent-orange) mb-3" />
      <h3 className="text-(--text-primary) font-semibold text-base mb-1">{title}</h3>
      <p className="text-(--text-secondary) text-xs md:text-sm max-w-[420px] w-full mx-auto leading-relaxed mb-5">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          TRY AGAIN
        </Button>
      )}
    </div>
  )
}
