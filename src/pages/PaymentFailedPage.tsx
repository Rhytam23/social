import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui'

export function PaymentFailedPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || searchParams.get('error') || 'ERR_PAYMENT_DECLINED'

  return (
    <main className="flex-1 w-full flex items-center justify-center py-16 md:py-24 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 text-center max-w-lg">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <Icon name="error_outline" size={32} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-mono text-xs font-semibold mb-3">
          TRANSACTION UNSUCCESSFUL
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3">
          Payment Processing Failed
        </h1>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
          We were unable to complete your payment request. Your order has not been placed, and your card or payment method was not charged.
        </p>

        {/* Payment Error Reference Box */}
        <div className="p-4 mb-8 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl font-mono text-xs text-left space-y-1">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Payment Reference Code:</span>
            <span className="font-bold text-[var(--text-primary)]">{refCode}</span>
          </div>
          <p className="text-[var(--text-muted)] text-[11px] pt-1">
            Possible reasons: Insufficient funds, bank security decline, or session timeout.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/checkout"
            className="w-full py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="refresh" size={16} /> TRY AGAIN
          </Link>
          <Link
            to="/cart"
            className="w-full py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="shopping_cart" size={16} /> RETURN TO CART
          </Link>
          <Link
            to="/products"
            className="w-full py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="storefront" size={16} /> CONTINUE SHOPPING
          </Link>
          <Link
            to="/support"
            className="w-full py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="help_outline" size={16} /> CONTACT SUPPORT
          </Link>
        </div>
      </div>
    </main>
  )
}
