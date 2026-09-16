import { apiClient } from './apiClient'

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export const contactService = {
  async sendMessage(data: ContactFormData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/contact', data)
      return response
    } catch {
      return {
        success: false,
        message: 'Unable to send your message right now. Please contact us directly by phone or email.',
      }
    }
  },
}
