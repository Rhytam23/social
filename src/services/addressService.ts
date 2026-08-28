import { apiClient } from './apiClient'

export interface UserAddress {
  id: string
  userId: string
  fullName: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export const addressService = {
  async listAddresses(): Promise<UserAddress[]> {
    const { addresses } = await apiClient.get<{ addresses: UserAddress[] }>('/api/addresses')
    return addresses
  },

  async createAddress(data: {
    fullName: string
    street: string
    city: string
    state: string
    zipCode: string
    country?: string
    phone?: string
    isDefault?: boolean
  }): Promise<UserAddress> {
    const { address } = await apiClient.post<{ address: UserAddress }>('/api/addresses', data)
    return address
  },

  async updateAddress(
    id: string,
    data: Partial<{
      fullName: string
      street: string
      city: string
      state: string
      zipCode: string
      country: string
      phone: string
      isDefault: boolean
    }>
  ): Promise<UserAddress> {
    const { address } = await apiClient.put<{ address: UserAddress }>(`/api/addresses/${id}`, data)
    return address
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/api/addresses/${id}`)
  },

  async setDefaultAddress(id: string): Promise<UserAddress> {
    const { address } = await apiClient.put<{ address: UserAddress }>(`/api/addresses/${id}/default`, {})
    return address
  },
}
