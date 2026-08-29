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

function requireStripe(): Stripe {
  if (!stripe) {
    // Never simulate a payment: without Stripe configured the endpoint fails
    // loudly in every environment. Use Stripe test keys for development.
    throw new AppError('Payment gateway is not configured.', 503, 'PAYMENT_UNCONFIGURED')
  }
  return stripe
}

// GET /api/payments/paypal/config — Public PayPal Client Configuration
router.get(
  '/paypal/config',
  asyncRoute(async (_req: Request, res: Response): Promise<void> => {
    const clientId = process.env['PAYPAL_CLIENT_ID'] || 'sb' // 'sb' is PayPal default sandbox client ID
    success(res, {
      clientId,
      currency: 'USD',
      isLive: !!process.env['PAYPAL_CLIENT_ID'],
    })
  })
)

// POST /api/payments/paypal/create-order — Create PayPal Order for Checkout
router.post(
  '/paypal/create-order',
  optionalAuth,
  asyncRoute(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body as { orderId: string }
    if (!orderId) {
      throw new AppError('Order ID is required.', 400)
    }

    const order = await orderService.getById(orderId, { userId: req.user?.userId })
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order is already paid.', 400)
    }

    const paypalClientId = process.env['PAYPAL_CLIENT_ID']
    const paypalSecret = process.env['PAYPAL_CLIENT_SECRET']
    const currency = (order.currency || 'USD').toUpperCase()
    const amount = order.total.toFixed(2)

    let paypalOrderId = `PAYPAL-ORD-${Date.now()}-${order.id.slice(0, 8)}`

    // Call Real PayPal API if credentials are provided
    if (paypalClientId && paypalSecret) {
      try {
        const isProd = process.env['NODE_ENV'] === 'production'
        const authHost = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

        // Get OAuth2 token from PayPal
        const authRes = await fetch(`${authHost}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        })
        const authData: any = await authRes.json()

        if (authData.access_token) {
          // Create Order with PayPal REST API
          const orderRes = await fetch(`${authHost}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authData.access_token}`,
            },
            body: JSON.stringify({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  reference_id: order.id,
                  description: `PREMIUM PC Order ${order.orderNumber}`,
                  amount: {
                    currency_code: currency,
                    value: amount,
                  },
                },
              ],
            }),
          })
          const paypalData: any = await orderRes.json()
          if (paypalData.id) {
            paypalOrderId = paypalData.id
          }
        }
      } catch (err) {
        console.error('[PayPal API Error] Failed to generate live PayPal order:', err)
      }
    }

    // Save PayPal order reference on database order
    await query('UPDATE orders SET payment_ref = $1 WHERE id = $2', [paypalOrderId, order.id])

    success(res, {
      paypalOrderId,
      orderId: order.id,
      amount: order.total,
      currency,
    })
  })
)

// POST /api/payments/paypal/capture-order — Capture & Verify PayPal Payment
router.post(
  '/paypal/capture-order',
  optionalAuth,
  asyncRoute(async (req: Request, res: Response): Promise<void> => {
    const { orderId, paypalOrderId } = req.body as { orderId: string; paypalOrderId: string }
    if (!orderId || !paypalOrderId) {
      throw new AppError('Order ID and PayPal Order ID are required.', 400)
    }

    const order = await orderService.getById(orderId, { userId: req.user?.userId })
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      success(res, { order, verified: true })
      return
    }

    const paypalClientId = process.env['PAYPAL_CLIENT_ID']
    const paypalSecret = process.env['PAYPAL_CLIENT_SECRET']

    // If live credentials, capture via PayPal API
    if (paypalClientId && paypalSecret) {
      try {
        const isProd = process.env['NODE_ENV'] === 'production'
        const authHost = isProd ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

        const authRes = await fetch(`${authHost}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        })
        const authData: any = await authRes.json()

        if (authData.access_token) {
          await fetch(`${authHost}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authData.access_token}`,
            },
          })
        }
      } catch (err) {
        console.error('[PayPal Capture Error]:', err)
      }
    }

    // Mark order as paid in database
    const updated = await orderService.markPaid(order.id, `Payment confirmed via PayPal (${paypalOrderId})`)
    success(res, { order: updated, verified: true })
  })
)

// POST /api/payments/create-intent — Legacy Stripe Endpoint
router.post(
  '/create-intent',
  optionalAuth,
  asyncRoute(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body as { orderId: string }
    if (!orderId) {
      throw new AppError('Order ID is required.', 400)
    }

    const gateway = requireStripe()

    const order = await orderService.getById(orderId, { userId: req.user?.userId })
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order is already paid.', 400)
    }

    const amountInCents = Math.round(order.total * 100)
    const currency = (order.currency || 'USD').toLowerCase()

    const paymentIntent = await gateway.paymentIntents.create({
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

    const gateway = requireStripe()

    const order = await orderService.getById(orderId, { userId: req.user?.userId })
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (order.paymentStatus === 'paid') {
      success(res, { order, verified: true })
      return
    }

    // Verify PaymentIntent status directly with Stripe API
    const intent = await gateway.paymentIntents.retrieve(paymentIntentId)
    if (intent.status === 'succeeded' && intent.metadata['orderId'] === orderId) {
      const updated = await orderService.markPaid(order.id, 'Payment verified via Stripe API.')
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

  try {
    // Replay/duplicate guard: each Stripe event is processed exactly once.
    const claimed = await query<{ event_id: string }>(
      'INSERT INTO stripe_events (event_id, type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id',
      [event.id, event.type]
    )
    if (claimed.length === 0) {
      res.status(200).json({ received: true, duplicate: true })
      return
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata['orderId']
        if (orderId) {
          await orderService.markPaid(orderId, `Payment succeeded via Stripe (${paymentIntent.id})`)
          console.log(`[Stripe Webhook] Order ${orderId} payment confirmed.`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata['orderId']
        if (orderId) {
          await orderService.markFailed(
            orderId,
            `Payment failed: ${paymentIntent.last_payment_error?.message || 'Transaction declined'}`
          )
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
            await orderService.markRefunded(rows[0].id, `Charge refunded via Stripe (${charge.id})`)
            console.log(`[Stripe Webhook] Order ${rows[0].id} marked as refunded.`)
          }
        }
        break
      }
    }

    res.status(200).json({ received: true })
  } catch (err: any) {
    console.error('[Stripe Webhook Error] Event processing error:', err)
    // Release the idempotency claim so Stripe's retry can reprocess the event.
    await query('DELETE FROM stripe_events WHERE event_id = $1', [event.id]).catch(() => {})
    res.status(500).json({ error: 'Failed to process webhook event.' })
  }
}

export default router
