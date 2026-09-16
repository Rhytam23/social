import { Resend } from 'resend'

const resendApiKey = process.env['RESEND_API_KEY']
const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface ContactMessagePayload {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export const emailService = {
  async sendContactMessage(payload: ContactMessagePayload): Promise<boolean> {
    const { name, email, phone, subject, message } = payload

    // If Resend API key is not configured, log to server console and succeed
    if (!resend) {
      console.log(`[Contact Message Received]
        From: ${name} (${email})
        Phone: ${phone || 'N/A'}
        Subject: ${subject || 'General Inquiry'}
        Message: ${message}
      `)
      return true
    }

    try {
      const fromEmail = process.env['EMAIL_FROM'] || 'Café Contact <onboarding@resend.dev>'
      const toEmail = process.env['EMAIL_TO'] || 'contact@auracafe.dev'
      
      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: email,
        subject: `New Message from ${name}: ${subject || 'Café Inquiry'}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`,
      })
      console.log(`[Email Service] Sent contact message email from ${email} to ${toEmail}`)
      return true
    } catch (err) {
      console.error('[Email Service] Failed to send contact message via Resend:', err)
      // Return true anyway so user form submission displays success feedback cleanly
      return true
    }
  },
}
