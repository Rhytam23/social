import paymentMethodsImg from '../../assets/payment-methods.png'

export interface PaymentLogosProps {
  className?: string
}

export function PaymentLogos({ className = '' }: PaymentLogosProps) {
  return (
    <div className={`flex items-center ${className}`} aria-label="Accepted Payment Methods">
      <img
        src={paymentMethodsImg}
        alt="Visa, Mastercard, PayPal, Apple Pay"
        className="h-6 sm:h-7 w-auto object-contain transition-opacity hover:opacity-100 opacity-95 dark:brightness-120 dark:contrast-105"
      />
    </div>
  )
}

