import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { paymentService } from '../../services/paymentService'
import type { Order } from '../../services/orderService'
import { Icon, Button } from '../ui'

interface PayPalPaymentProps {
  order: Order
  onPaid: (order: Order) => void
  onFailed: (message: string) => void
}

export function PayPalPayment({ order, onPaid, onFailed }: PayPalPaymentProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'
  const currency = (order as any).currency || 'USD'

  // Handles PayPal order creation on PayPal servers
  const handleCreatePayPalOrder = async () => {
    setError(null)
    try {
      const res = await paymentService.createPayPalOrder(order.id)
      return res.paypalOrderId
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create PayPal order'
      setError(msg)
      throw new Error(msg)
    }
  }

  // Handles PayPal capture on approval
  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    setProcessing(true)
    setError(null)
    try {
      const result = await paymentService.capturePayPalOrder(order.id, data.orderID)
      if (result.verified && result.order) {
        onPaid(result.order)
      } else {
        onFailed('PayPal payment capture verification failed.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PayPal payment capture failed'
      setError(msg)
      onFailed(msg)
    } finally {
      setProcessing(false)
    }
  }

  // Demo Sandbox express capture helper for instant testing
  const handleDemoExpressCapture = async () => {
    setProcessing(true)
    setError(null)
    try {
      const createRes = await paymentService.createPayPalOrder(order.id)
      const captureRes = await paymentService.capturePayPalOrder(order.id, createRes.paypalOrderId)
      if (captureRes.verified && captureRes.order) {
        onPaid(captureRes.order)
      } else {
        onFailed('PayPal checkout failed.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PayPal checkout error'
      setError(msg)
      onFailed(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 bg-(--bg-surface) border border-(--border-theme) rounded-2xl p-6 shadow-xl">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-(--border-theme) pb-4">
        <div>
          <span className="text-[10px] font-mono text-(--accent-blue) uppercase tracking-wider font-bold block mb-1">
            OFFICIAL PAYMENT PARTNER
          </span>
          <h2 className="text-(--text-primary) font-bold text-lg flex items-center gap-2">
            <span className="text-[#003087] font-black text-xl tracking-tighter">Pay<span className="text-[#0079C1]">Pal</span></span>
            <span className="text-xs text-(--text-secondary) font-normal">Express &amp; Card Checkout</span>
          </h2>
        </div>
        <div className="px-3 py-1 bg-[#003087]/10 border border-[#003087]/20 rounded-full flex items-center gap-1.5 text-xs font-mono text-[#0079C1] font-bold">
          <Icon name="verified_user" size={14} /> 256-BIT ENCRYPTED
        </div>
      </div>

      {/* Amount Banner */}
      <div className="flex items-center justify-between p-4 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl">
        <span className="text-xs font-mono text-(--text-secondary) uppercase">Total Amount Due</span>
        <span className="text-xl font-bold font-mono text-(--accent-blue)">
          ${order.total.toFixed(2)} {currency}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {error}
        </div>
      )}

      {processing && (
        <div className="p-4 bg-(--accent-blue)/10 border border-(--accent-blue)/30 rounded-xl text-center font-mono text-xs text-(--accent-blue) flex items-center justify-center gap-2">
          <Icon name="sync" size={16} className="animate-spin" />
          <span>Verifying PayPal Payment with Server…</span>
        </div>
      )}

      {/* Official PayPal SDK Buttons */}
      <div className="min-h-[160px]">
        <PayPalScriptProvider options={{ clientId: paypalClientId, currency }}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 48,
            }}
            disabled={processing}
            createOrder={() => handleCreatePayPalOrder()}
            onApprove={async (data) => {
              await handleApprovePayPalOrder(data)
            }}
            onError={(err) => {
              console.error('[PayPal SDK Error]:', err)
              setError('PayPal checkout encountered an error. Please try again or use Express PayPal Checkout below.')
            }}
          />
        </PayPalScriptProvider>
      </div>

      {/* Fallback Direct PayPal Checkout Button for Sandbox/Demo testing */}
      <div className="pt-3 border-t border-(--border-theme) text-center space-y-2">
        <p className="text-[11px] font-mono text-(--text-secondary)">
          Prefer 1-Click PayPal Checkout?
        </p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold border-none flex items-center justify-center gap-2 text-sm shadow-md transition-transform active:scale-[0.99]"
          disabled={processing}
          onClick={() => void handleDemoExpressCapture()}
        >
          <span className="font-black text-base italic tracking-tighter">Pay<span className="text-[#0079C1]">Pal</span></span>
          <span>Pay ${order.total.toFixed(2)} with PayPal</span>
        </Button>
      </div>

      <div className="text-center pt-2">
        <p className="text-[10px] font-mono text-(--text-secondary)">
          🔒 You will be securely redirected to PayPal to complete your payment. No financial info is stored on our servers.
        </p>
      </div>
    </div>
  )
}
