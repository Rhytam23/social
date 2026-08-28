import { apiClient } from './apiClient'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'customer' | 'admin' | 'staff' | 'manager'
  status: string
  googleId?: string | null
  githubId?: string | null
  avatarUrl?: string | null
  createdAt: string
}

export const authService = {
  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/api/auth/register', data)
  },

  async login(email: string, password: string): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/api/auth/login', { email, password })
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
  },

  async getMe(): Promise<User> {
    const { user } = await apiClient.get<{ user: User }>('/api/auth/me')
    return user
  },

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string }): Promise<User> {
    const { user } = await apiClient.put<{ user: User }>('/api/auth/profile', data)
    return user
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/api/auth/password', { currentPassword, newPassword })
  },

  async sendOtp(
    email: string,
    purpose: 'login' | 'register' | 'reset_password' = 'login'
  ): Promise<{ message: string; email: string; expiresAt: string }> {
    return apiClient.post('/api/auth/send-otp', { email, purpose })
  },

  // Login/registration codes only — password-reset codes are consumed by resetPassword.
  async verifyOtp(email: string, code: string, purpose: 'login' | 'register' = 'login'): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/api/auth/verify-otp', { email, code, purpose })
  },

  /** Completes a password reset with a reset_password OTP. Does not sign the user in. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/auth/reset-password', { email, code, newPassword })
  },
}
