import { query, queryOne } from '../db/client'
import { NotFoundError } from '../middleware/errorHandler'

export interface UserAddressRow {
  id: string
  user_id: string
  full_name: string
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  phone: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

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

function toAddress(r: UserAddressRow): UserAddress {
  return {
    id: r.id,
    userId: r.user_id,
    fullName: r.full_name,
    street: r.street,
    city: r.city,
    state: r.state,
    zipCode: r.zip_code,
    country: r.country,
    phone: r.phone,
    isDefault: r.is_default,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const addressService = {
  async listUserAddresses(userId: string): Promise<UserAddress[]> {
    const rows = await query<UserAddressRow>(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    )
    return rows.map(toAddress)
  },

  async createAddress(
    userId: string,
    data: {
      fullName: string
      street: string
      city: string
      state: string
      zipCode: string
      country?: string
      phone?: string
      isDefault?: boolean
    }
  ): Promise<UserAddress> {
    const existing = await queryOne<{ count: string }>('SELECT COUNT(*) FROM user_addresses WHERE user_id = $1', [userId])
    const count = parseInt(existing?.count ?? '0', 10)
    const setAsDefault = data.isDefault || count === 0

    if (setAsDefault) {
      await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId])
    }

    const [row] = await query<UserAddressRow>(
      `INSERT INTO user_addresses (user_id, full_name, street, city, state, zip_code, country, phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        data.fullName,
        data.street,
        data.city,
        data.state,
        data.zipCode,
        data.country || 'USA',
        data.phone || null,
        setAsDefault,
      ]
    )

    if (!row) throw new Error('Could not create address')
    return toAddress(row)
  },

  async updateAddress(
    id: string,
    userId: string,
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
    const existing = await queryOne<UserAddressRow>('SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2', [id, userId])
    if (!existing) throw new NotFoundError('Address')

    if (data.isDefault) {
      await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId])
    }

    const updatedFullName = data.fullName ?? existing.full_name
    const updatedStreet = data.street ?? existing.street
    const updatedCity = data.city ?? existing.city
    const updatedState = data.state ?? existing.state
    const updatedZip = data.zipCode ?? existing.zip_code
    const updatedCountry = data.country ?? existing.country
    const updatedPhone = data.phone !== undefined ? data.phone : existing.phone
    const updatedDefault = data.isDefault !== undefined ? data.isDefault : existing.is_default

    const [row] = await query<UserAddressRow>(
      `UPDATE user_addresses
       SET full_name = $1, street = $2, city = $3, state = $4, zip_code = $5, country = $6, phone = $7, is_default = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [updatedFullName, updatedStreet, updatedCity, updatedState, updatedZip, updatedCountry, updatedPhone, updatedDefault, id, userId]
    )

    if (!row) throw new NotFoundError('Address')
    return toAddress(row)
  },

  async deleteAddress(id: string, userId: string): Promise<void> {
    const existing = await queryOne<UserAddressRow>('SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2', [id, userId])
    if (!existing) throw new NotFoundError('Address')

    await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [id, userId])

    // If deleted address was default, promote next oldest address if any exists
    if (existing.is_default) {
      const next = await queryOne<UserAddressRow>(
        'SELECT id FROM user_addresses WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
        [userId]
      )
      if (next) {
        await query('UPDATE user_addresses SET is_default = true WHERE id = $1', [next.id])
      }
    }
  },

  async setDefault(id: string, userId: string): Promise<UserAddress> {
    await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId])
    const [row] = await query<UserAddressRow>(
      'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )
    if (!row) throw new NotFoundError('Address')
    return toAddress(row)
  },
}
