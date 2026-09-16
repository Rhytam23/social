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

  await emailService.sendContactMessage(result.data)

  return res.json({
    success: true,
    data: { message: 'Thank you for your message. We will get back to you shortly!' },
  })
})

export default router
