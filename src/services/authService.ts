import { apiClient, tokenStore } from './apiClient'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'customer' | 'admin' | 'staff' | 'manager'
  status: string
  createdAt: string
}

export const authService = {
  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<{ user: User; token: string }> {
    const result = await apiClient.post<{ user: User; token: string }>('/api/auth/register', data, { auth: false })
    tokenStore.set(result.token)
    return result
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await apiClient.post<{ user: User; token: string }>('/api/auth/login', { email, password }, { auth: false })
    tokenStore.set(result.token)
    return result
  },

  async logout(): Promise<void> {
    tokenStore.clear()
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

  async sendOtp(email: string, purpose: 'login' | 'register' | 'reset_password' = 'login'): Promise<{ message: string; email: string; expiresAt: string; demoCode?: string }> {
    return apiClient.post('/api/auth/send-otp', { email, purpose }, { auth: false })
  },

  async verifyOtp(email: string, code: string, purpose: 'login' | 'register' | 'reset_password' = 'login'): Promise<{ user: User; token: string }> {
    const result = await apiClient.post<{ user: User; token: string }>('/api/auth/verify-otp', { email, code, purpose }, { auth: false })
    tokenStore.set(result.token)
    return result
  },

  isAuthenticated(): boolean {
    return !!tokenStore.get()
  },
}
