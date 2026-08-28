import { Resend } from 'resend'

const resendApiKey = process.env['RESEND_API_KEY']
const resend = resendApiKey ? new Resend(resendApiKey) : null

export const emailService = {
  async sendOtpEmail(to: string, code: string): Promise<boolean> {
    if (!resend) {
      if (process.env['NODE_ENV'] === 'production') {
        console.error('[Email Service] Production error: RESEND_API_KEY is not configured.')
        return false
      }
      console.log(`[Email Service - DEV MODE] OTP Code generated for ${to}`)
      return true
    }

    try {
      const fromEmail = process.env['EMAIL_FROM'] || 'PREMIUM PC <onboarding@resend.dev>'
      await resend.emails.send({
        from: fromEmail,
        to,
        subject: `${code} is your PREMIUM PC verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0b0c0e; color: #ffffff; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid #222630;">
            <h2 style="color: #0066ff; margin-bottom: 20px; letter-spacing: -0.5px;">PREMIUM PC</h2>
            <p style="font-size: 15px; color: #cccccc; margin-bottom: 10px;">Your 6-digit verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background: #121418; padding: 20px; text-align: center; border-radius: 6px; border: 1px solid #2d3340; margin: 20px 0;">
              ${code}
            </div>
            <p style="font-size: 13px; color: #888888; margin-top: 20px;">This code expires in 5 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      })
      console.log(`[Email Service] Sent real OTP email to ${to} via Resend`)
      return true
    } catch (err) {
      console.error('[Email Service] Failed to send email via Resend:', err)
      return false
    }
  },
}
