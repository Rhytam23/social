import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { orderService } from '../services/orderService'
import { optionalAuth } from '../middleware/auth'
import { asyncRoute, success, AppError } from '../middleware/errorHandler'
import { query } from '../db/client'

const router = Router()

const stripeSecretKey = process.env['STRIPE_SECRET_KEY']
const stripeWebhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' as any })
  : null

// POST /api/payments/create-intent — Create Stripe PaymentIntent for an order
router.post(
  '/create-intent',
  optionalAuth,
  asyncRoute(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body as { orderId: string }
    if (!orderId) {
      throw new AppError('Order ID is required.', 400)
    }

    const order = await orderService.getById(orderId, req.user?.userId)
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order is already paid.', 400)
    }

    // Always calculate amount server-side in smallest currency unit (cents)
    const amountInCents = Math.round(order.total * 100)
    const currency = (order.currency || 'USD').toLowerCase()

    if (!stripe) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new AppError('Stripe live payment gateway is not configured.', 503)
      }
      // Non-production fallback logging
      console.warn('[Stripe] Warning: STRIPE_SECRET_KEY is not set. Returning test intent token.')
      success(res, {
        clientSecret: `mock_secret_for_order_${order.id}`,
        paymentIntentId: `mock_pi_${order.id}`,
        amount: order.total,
        currency,
        status: 'requires_payment_method',
      })
      return
    }

    // Create real Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store payment reference on order
    await query('UPDATE orders SET payment_ref = $1 WHERE id = $2', [paymentIntent.id, order.id])

    success(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.total,
      currency,
      status: paymentIntent.status,
    })
  })
)

// POST /api/payments/verify — Server-side PaymentIntent verification
router.post(
  '/verify',
  optionalAuth,
  asyncRoute(async (req: Request, res: Response): Promise<void> => {
    const { orderId, paymentIntentId } = req.body as { orderId: string; paymentIntentId: string }
    if (!orderId || !paymentIntentId) {
      throw new AppError('Order ID and PaymentIntent ID are required.', 400)
    }

    const order = await orderService.getById(orderId, req.user?.userId)
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      success(res, { order, verified: true })
      return
    }

    if (!stripe) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new AppError('Stripe payment gateway unconfigured.', 503)
      }
      // Demo dev mode verification
      const updated = await orderService.updatePaymentStatus(order.id, 'paid')
      await orderService.updateStatus(order.id, 'processing', 'Payment verified in development mode.')
      success(res, { order: updated, verified: true })
      return
    }

    // Verify PaymentIntent status directly with Stripe API
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (intent.status === 'succeeded' && intent.metadata['orderId'] === orderId) {
      const updated = await orderService.updatePaymentStatus(order.id, 'paid')
      await orderService.updateStatus(order.id, 'processing', 'Payment verified via Stripe API.')
      success(res, { order: updated, verified: true })
      return
    }

    success(res, { order, verified: false, status: intent.status })
  })
)

// POST /api/payments/webhook — Cryptographic Stripe Webhook Listener
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string | undefined

  if (!stripeWebhookSecret || !stripe) {
    console.error('[Stripe Webhook] Received webhook but STRIPE_WEBHOOK_SECRET is not configured.')
    res.status(400).json({ error: 'Webhook secret unconfigured.' })
    return
  }

  if (!sig) {
    res.status(400).json({ error: 'Missing Stripe-Signature header.' })
    return
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook Error] Signature verification failed:', err.message)
    res.status(400).json({ error: `Webhook Error: ${err.message}` })
    return
  }

  console.log(`[Stripe Webhook] Verified event ${event.id} of type ${event.type}`)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata['orderId']
        if (orderId) {
          const order = await orderService.getById(orderId)
          if (order && order.paymentStatus !== 'paid') {
            await orderService.updatePaymentStatus(orderId, 'paid')
            await orderService.updateStatus(orderId, 'processing', `Payment succeeded via Stripe (${paymentIntent.id})`)
            console.log(`[Stripe Webhook] Order ${orderId} marked as paid.`)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata['orderId']
        if (orderId) {
          await orderService.updatePaymentStatus(orderId, 'failed')
          await orderService.updateStatus(orderId, 'cancelled', `Payment failed: ${paymentIntent.last_payment_error?.message || 'Transaction declined'}`)
          console.log(`[Stripe Webhook] Order ${orderId} marked as failed.`)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (paymentIntentId) {
          const rows = await query<{ id: string }>('SELECT id FROM orders WHERE payment_ref = $1', [paymentIntentId])
          if (rows[0]?.id) {
            await orderService.updatePaymentStatus(rows[0].id, 'refunded')
            await orderService.updateStatus(rows[0].id, 'refunded', `Charge refunded via Stripe (${charge.id})`)
            console.log(`[Stripe Webhook] Order ${rows[0].id} marked as refunded.`)
          }
        }
        break
      }
    }

    res.status(200).json({ received: true })
  } catch (err: any) {
    console.error('[Stripe Webhook Error] Event processing error:', err)
    res.status(500).json({ error: 'Failed to process webhook event.' })
  }
}

export default router
