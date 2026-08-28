import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageSkeleton } from './ui/SkeletonLoader'

/** Gates a route behind a real server session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageSkeleton />
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <>{children}</>
}

/**
 * Gates a route behind a staff/admin role.
 * This is a UX gate only — every admin API enforces the same roles server-side.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { status, isStaff } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageSkeleton />
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (!isStaff) return <Navigate to="/access-denied" replace />
  return <>{children}</>
}
