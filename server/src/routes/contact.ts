import { Router } from 'express'
import { z } from 'zod'
import { emailService } from '../services/emailService'

const router = Router()

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
})

router.post('/', async (req, res) => {
  const result = contactSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your form inputs.',
        errors: result.error.flatten().fieldErrors,
      },
    })
  }

  const { name, email, phone, subject, message } = result.data

  // If Resend API key is configured, send actual email; otherwise return clean response
  const sent = await emailService.sendOtpEmail(
    process.env['EMAIL_TO'] || 'contact@auracafe.dev',
    `Message from ${name} (${email}): ${subject || 'General Inquiry'}\nPhone: ${phone || 'N/A'}\n\n${message}`
  )

  if (sent) {
    return res.json({
      success: true,
      data: { message: 'Thank you for your message. We will get back to you shortly!' },
    })
  } else {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to send your message right now. Please contact us directly by phone or email.',
      },
    })
  }
})

export default router
