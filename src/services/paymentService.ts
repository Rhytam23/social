import { apiClient } from './apiClient'
import type { Order } from './orderService'

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
  status: string
}

export const paymentService = {
  /**
   * Creates a Stripe PaymentIntent for an existing order.
   * The amount is always computed server-side from the stored order.
   * Throws with code PAYMENT_UNCONFIGURED (503) when Stripe is not set up.
   */
  async createIntent(orderId: string): Promise<PaymentIntentResult> {
    return apiClient.post<PaymentIntentResult>('/api/payments/create-intent', { orderId })
  },

  /** Asks the server to confirm payment status directly with Stripe. */
  async verify(orderId: string, paymentIntentId: string): Promise<{ order: Order; verified: boolean; status?: string }> {
    return apiClient.post<{ order: Order; verified: boolean; status?: string }>('/api/payments/verify', {
      orderId,
      paymentIntentId,
    })
  },
}
