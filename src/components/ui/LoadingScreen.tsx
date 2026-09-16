import { useEffect, useState } from 'react'
import { Icon } from './index'

export function LoadingScreen() {
  const [shouldShow, setShouldShow] = useState<boolean>(() => {
    // Show only on initial session visit
    if (typeof window !== 'undefined') {
      const hasLoaded = sessionStorage.getItem('cafe_session_loaded')
      return !hasLoaded
    }
    return false
  })

  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    if (!shouldShow) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const displayDuration = prefersReducedMotion ? 200 : 900
    const fadeDuration = prefersReducedMotion ? 100 : 350

    const timer1 = setTimeout(() => {
      setIsFadingOut(true)
    }, displayDuration)

    const timer2 = setTimeout(() => {
      setShouldShow(false)
      sessionStorage.setItem('cafe_session_loaded', 'true')
    }, displayDuration + fadeDuration)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [shouldShow])

  if (!shouldShow) return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-500 bg-(--bg-primary) flex flex-col items-center justify-center pointer-events-none transition-opacity duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {/* Coffee Cup Icon with Animated Steam */}
        <div className="relative flex flex-col items-center">
          {/* Subtle Rising Steam Lines */}
          <div className="flex items-center justify-center gap-1.5 h-6 mb-1">
            <span className="w-0.5 h-3 bg-(--accent-green)/60 rounded-full animate-steam-1" />
            <span className="w-0.5 h-4 bg-(--accent-green)/80 rounded-full animate-steam-2" />
            <span className="w-0.5 h-3 bg-(--accent-green)/60 rounded-full animate-steam-3" />
          </div>

          {/* Café Icon Badge */}
          <div className="w-14 h-14 rounded-full bg-(--accent-green) text-white flex items-center justify-center shadow-lg transform transition-transform duration-700 ease-out scale-100">
            <Icon name="coffee" size={30} />
          </div>
        </div>

        {/* Café Wordmark */}
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-(--text-primary)">
            [CAFÉ NAME]
          </h1>
          <p className="text-xs font-mono text-(--text-secondary) tracking-widest uppercase">
            Coffee & Kitchen
          </p>
        </div>

        {/* Minimal Loading Indicator Bar */}
        <div className="w-32 h-0.5 bg-(--border-theme) rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-(--accent-green) transition-all duration-900 ease-out"
            style={{ width: isFadingOut ? '100%' : '75%' }}
          />
        </div>
      </div>
    </div>
  )
}
