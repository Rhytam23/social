import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Toast {
  id: string
  message: string
  type?: 'info' | 'cart' | 'wishlist'
}

interface ShopContextType {
  toasts: Toast[]
  showToast: (message: string, type?: 'info' | 'cart' | 'wishlist') => void
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function showToast(message: string, type: 'info' | 'cart' | 'wishlist' = 'info') {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }

  return (
    <ShopContext.Provider value={{ toasts, showToast }}>
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}
