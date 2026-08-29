import { Resend } from 'resend'
import { renderLightVerificationEmail, renderDarkVerificationEmail } from './emailTemplates'

const resendApiKey = process.env['RESEND_API_KEY']
const resend = resendApiKey ? new Resend(resendApiKey) : null

export const emailService = {
  async sendOtpEmail(to: string, code: string, theme?: 'light' | 'dark'): Promise<boolean> {
    if (!resend) {
      if (process.env['NODE_ENV'] === 'production') {
        console.error('[Email Service] Production error: RESEND_API_KEY is not configured.')
        return false
      }
      console.log(`[Email Service - DEV MODE] OTP Code generated for ${to}`)
      return true
    }

    try {
      const selectedTheme = theme || (process.env['EMAIL_THEME'] as 'light' | 'dark') || 'dark'
      const htmlContent = selectedTheme === 'light'
        ? renderLightVerificationEmail(code)
        : renderDarkVerificationEmail(code)

      const fromEmail = process.env['EMAIL_FROM'] || 'PREMIUM PC <onboarding@resend.dev>'
      await resend.emails.send({
        from: fromEmail,
        to,
        subject: `${code} is your PREMIUM PC verification code`,
        html: htmlContent,
      })
      console.log(`[Email Service] Sent real OTP email (${selectedTheme} theme) to ${to} via Resend`)
      return true
    } catch (err) {
      console.error('[Email Service] Failed to send email via Resend:', err)
      return false
    }
  },

  async sendOrderConfirmation(order: {
    orderNumber: string
    customerEmail: string | null
    total: number
    subtotal: number
    shippingCost: number
    taxAmount: number
    currency: string
    items: Array<{ productName: string; quantity: number; unitPrice: number; lineTotal: number }>
  }): Promise<boolean> {
    if (!order.customerEmail) return false
    if (!resend) {
      console.error('[Email Service] Order confirmation not sent: RESEND_API_KEY is not configured.')
      return false
    }

    const fmt = (n: number) => `$${n.toFixed(2)}`
    const itemRows = order.items
      .map(
        (i) => `
          <tr>
            <td style="padding: 8px 0; color: #cccccc; font-size: 14px;">${i.productName} × ${i.quantity}</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${fmt(i.lineTotal)}</td>
          </tr>`
      )
      .join('')

    try {
      const fromEmail = process.env['EMAIL_FROM'] || 'PREMIUM PC <onboarding@resend.dev>'
      await resend.emails.send({
        from: fromEmail,
        to: order.customerEmail,
        subject: `Order ${order.orderNumber} confirmed — PREMIUM PC`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b0c0e; color: #ffffff; padding: 40px; border-radius: 8px; max-width: 560px; margin: 0 auto; border: 1px solid #222630;">
            <h2 style="color: #0066ff; margin-bottom: 8px; letter-spacing: -0.5px;">PREMIUM PC</h2>
            <p style="font-size: 15px; color: #cccccc;">Thank you — your payment was received and your order is confirmed.</p>
            <p style="font-size: 13px; color: #888888; margin: 4px 0 20px;">Order number: <strong style="color:#ffffff;">${order.orderNumber}</strong></p>
            <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #2d3340;">${itemRows}</table>
            <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #2d3340; margin-top: 8px;">
              <tr><td style="padding: 6px 0; color: #888888; font-size: 13px;">Subtotal</td><td style="text-align: right; color: #cccccc; font-size: 13px;">${fmt(order.subtotal)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888888; font-size: 13px;">Shipping</td><td style="text-align: right; color: #cccccc; font-size: 13px;">${fmt(order.shippingCost)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888888; font-size: 13px;">Tax</td><td style="text-align: right; color: #cccccc; font-size: 13px;">${fmt(order.taxAmount)}</td></tr>
              <tr><td style="padding: 10px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Total</td><td style="text-align: right; color: #ffffff; font-size: 16px; font-weight: bold;">${fmt(order.total)} ${order.currency}</td></tr>
            </table>
            <p style="font-size: 12px; color: #888888; margin-top: 24px;">You can track your order any time using your order number.</p>
          </div>
        `,
      })
      return true
    } catch (err) {
      console.error('[Email Service] Failed to send order confirmation via Resend:', err)
      return false
    }
  },
}
