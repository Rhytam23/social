import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Icon, Button } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/** Catches render-time crashes so a component failure never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-(--bg-primary) text-(--text-primary) flex items-center justify-center px-4">
        <div className="bg-(--bg-surface) border border-(--border-theme) rounded-xl p-10 text-center flex flex-col items-center max-w-[480px]">
          <Icon name="error" size={40} className="text-(--accent-orange) mb-3" />
          <h1 className="font-bold text-base mb-1">Something went wrong</h1>
          <p className="text-(--text-secondary) text-xs md:text-sm leading-relaxed mb-5">
            An unexpected error interrupted this page. Reloading usually resolves it.
          </p>
          <Button onClick={() => window.location.reload()}>RELOAD PAGE</Button>
        </div>
      </div>
    )
  }
}
