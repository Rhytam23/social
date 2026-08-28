import { useState, useEffect, useCallback, useRef } from 'react'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Runs an async API call and tracks loading/error state.
 * Re-runs whenever `deps` change; stale responses are discarded.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // Keep the latest fn without making it a dependency of the effect.
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fnRef
      .current()
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Request failed')
        setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, error, reload }
}
