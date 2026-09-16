export interface MenuItem {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'drinks' | 'desserts'
  price: string
  description: string
}

export const MENU_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
] as const

export const CAFÉ_MENU_ITEMS: MenuItem[] = [
  // Breakfast
  {
    id: 'b1',
    name: '[BREAKFAST ITEM 1]',
    category: 'breakfast',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Freshly prepared breakfast selection]',
  },
  {
    id: 'b2',
    name: '[BREAKFAST ITEM 2]',
    category: 'breakfast',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - House specialty morning dish]',
  },
  {
    id: 'b3',
    name: '[BREAKFAST ITEM 3]',
    category: 'breakfast',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Light seasonal breakfast option]',
  },

  // Lunch
  {
    id: 'l1',
    name: '[LUNCH ITEM 1]',
    category: 'lunch',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Fresh artisan sandwich selection]',
  },
  {
    id: 'l2',
    name: '[LUNCH ITEM 2]',
    category: 'lunch',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Daily bowl or gourmet salad]',
  },
  {
    id: 'l3',
    name: '[LUNCH ITEM 3]',
    category: 'lunch',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Warm savory lunch specialty]',
  },

  // Drinks
  {
    id: 'd1',
    name: '[DRINK ITEM 1]',
    category: 'drinks',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Espresso roast or specialty coffee]',
  },
  {
    id: 'd2',
    name: '[DRINK ITEM 2]',
    category: 'drinks',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Organic iced tea or cold brew]',
  },
  {
    id: 'd3',
    name: '[DRINK ITEM 3]',
    category: 'drinks',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Fresh juice or artisan beverage]',
  },

  // Desserts
  {
    id: 's1',
    name: '[DESSERT ITEM 1]',
    category: 'desserts',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Freshly baked pastry or cake]',
  },
  {
    id: 's2',
    name: '[DESSERT ITEM 2]',
    category: 'desserts',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Signature dessert selection]',
  },
  {
    id: 's3',
    name: '[DESSERT ITEM 3]',
    category: 'desserts',
    price: '[PRICE]',
    description: '[CLIENT ITEM DESCRIPTION - Sweet seasonal bake]',
  },
]
