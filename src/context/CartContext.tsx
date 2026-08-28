import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { cartService, type Cart } from '../services/cartService'
import { useAuth } from './AuthContext'

// The cart lives on the server for everyone: guests are identified by the
// httpOnly `cart_session` cookie, and logging in merges that cart into the
// user's own. Prices and stock always come from the API — never from the client.
interface CartContextValue {
  cart: Cart | null
  loading: boolean
  error: string | null
  itemCount: number
  subtotal: number
  addItem: (productId: string, quantity?: number) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { status } = useAuth()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCart(await cartService.getCart())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reload once auth state is resolved, and again after login/logout so the
  // merged (or cleared) server cart is reflected.
  useEffect(() => {
    if (status === 'loading') return
    void refresh()
  }, [status, refresh])

  const run = useCallback(async (op: () => Promise<Cart | void>) => {
    setError(null)
    try {
      const next = await op()
      if (next) setCart(next)
      else await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cart update failed')
      throw err
    }
  }, [refresh])

  const addItem = useCallback(
    (productId: string, quantity = 1) => run(() => cartService.addItem(productId, quantity)),
    [run]
  )
  const updateItem = useCallback(
    (productId: string, quantity: number) => run(() => cartService.updateItem(productId, quantity)),
    [run]
  )
  const removeItem = useCallback(
    (productId: string) => run(() => cartService.removeItem(productId)),
    [run]
  )
  const clearCart = useCallback(() => run(() => cartService.clearCart()), [run])

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        itemCount: cart?.itemCount ?? 0,
        subtotal: cart?.subtotal ?? 0,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
