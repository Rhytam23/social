// ─── Café Website Types ───────────────────────────────────────────────────────────

export interface MenuItem {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'drinks' | 'desserts'
  price: string
  description: string
}

export interface MenuCategory {
  id: string
  label: string
}

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}
