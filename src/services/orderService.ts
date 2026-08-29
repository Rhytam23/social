import { apiClient } from './apiClient'

export interface CreateOrderRequest {
  items: Array<{ productId: string; quantity: number }>
  shippingName: string
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  shippingMethod: 'standard' | 'express'
  paymentMethod: 'card' | 'paypal' | 'crypto'
  customerEmail?: string
  customerPhone?: string
}

export interface OrderLineItem {
  id: string
  productId: string | null
  productName: string
  productSku: string
  productImageUrl: string | null
  unitPrice: number
  quantity: number
  discountAmount: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingName: string
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  trackingNumber: string | null
  estimatedDelivery: string | null
  items: OrderLineItem[]
  timeline: Array<{ id: string; status: string; description: string | null; createdAt: string }>
  createdAt: string
}

export const orderService = {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const { order } = await apiClient.post<{ order: Order }>('/api/orders', data)
    return order
  },

  async getOrder(id: string): Promise<Order> {
    const { order } = await apiClient.get<{ order: Order }>(`/api/orders/${id}`)
    return order
  },

  async trackOrder(orderNumber: string): Promise<Partial<Order>> {
    const { order } = await apiClient.get<{ order: Partial<Order> }>(`/api/orders/track/${orderNumber}`)
    return order
  },

  async listMyOrders(page = 1, limit = 10): Promise<{ orders: Order[]; total: number }> {
    return apiClient.get<{ orders: Order[]; total: number }>(`/api/orders?page=${page}&limit=${limit}`)
  },
}
