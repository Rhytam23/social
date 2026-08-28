import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { wishlistService } from '../services/wishlistService'
import { useAuth } from './AuthContext'

// Wishlist storage is hybrid by necessity: the API requires authentication, so
// guests keep a local list of product ids only (never prices or product data).
// On login those ids are pushed to the server once, then the server is the
// single source of truth.
const GUEST_KEY = 'premium_pc_wishlist'

interface WishlistContextValue {
  wishlistIds: string[]
  wishlistCount: number
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

function readGuestIds(): string[] {
  try {
    const saved = localStorage.getItem(GUEST_KEY)
    return saved ? (JSON.parse(saved) as string[]) : []
  } catch {
    return []
  }
}

function writeGuestIds(ids: string[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(ids))
  } catch {}
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => readGuestIds())
  const { status } = useAuth()
  const mergedRef = useRef(false)

  const refresh = useCallback(async () => {
    if (status !== 'authed') return
    try {
      const { wishlistIds: ids } = await wishlistService.getWishlist()
      setWishlistIds(ids)
    } catch {
      // Leave the current list in place on a transient failure.
    }
  }, [status])

  // On login: push any guest-saved ids to the server, then adopt the server list.
  useEffect(() => {
    if (status === 'guest') {
      mergedRef.current = false
      setWishlistIds(readGuestIds())
      return
    }
    if (status !== 'authed' || mergedRef.current) return
    mergedRef.current = true

    void (async () => {
      const guestIds = readGuestIds()
      for (const id of guestIds) {
        try {
          await wishlistService.addItem(id)
        } catch {
          // Skip ids the server rejects (deleted product, duplicate).
        }
      }
      if (guestIds.length) writeGuestIds([])
      await refresh()
    })()
  }, [status, refresh])

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const has = wishlistIds.includes(productId)

      if (status === 'authed') {
        const { wishlistIds: ids } = has
          ? await wishlistService.removeItem(productId)
          : await wishlistService.addItem(productId)
        setWishlistIds(ids)
        return
      }

      const next = has ? wishlistIds.filter((id) => id !== productId) : [...wishlistIds, productId]
      setWishlistIds(next)
      writeGuestIds(next)
    },
    [wishlistIds, status]
  )

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isInWishlist: (id: string) => wishlistIds.includes(id),
        toggleWishlist,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
