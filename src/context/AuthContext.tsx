import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authService, type User } from '../services/authService'

// Authentication state derived from the server session (HTTP-only cookie).
// No token is ever stored in localStorage — the cookie is the only credential.
type AuthStatus = 'loading' | 'authed' | 'guest'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isStaff: boolean
  refresh: () => Promise<User | null>
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STAFF_ROLES = ['admin', 'manager', 'staff']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const me = await authService.getMe()
      setUser(me)
      setStatus('authed')
      return me
    } catch {
      // 401 (or offline) — treat as anonymous.
      setUser(null)
      setStatus('guest')
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setStatus('guest')
    }
  }, [])

  const applyUser = useCallback((next: User | null) => {
    setUser(next)
    setStatus(next ? 'authed' : 'guest')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isStaff: !!user && STAFF_ROLES.includes(user.role),
        refresh,
        setUser: applyUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
