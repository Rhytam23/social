import bcrypt from 'bcryptjs'
import { query, queryOne } from '../db/client'
import { config } from '../config'
import { generateToken } from '../middleware/auth'
import { AuthError, ConflictError, NotFoundError } from '../middleware/errorHandler'
import type { User, UserRole } from '../types'

// ─── DB Row ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  phone: string | null
  role: UserRole
  status: string
  email_verified: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    status: row.status as User['status'],
    emailVerified: row.email_verified,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Auth Service ──────────────────────────────────────────────────────────────

export const authService = {
  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<{ user: User; token: string }> {
    // Check for existing user
    const existing = await queryOne<UserRow>(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    )
    if (existing) throw new ConflictError('An account with this email already exists')

    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds)

    const [row] = await query<UserRow>(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.email.toLowerCase(), passwordHash, data.firstName.trim(), data.lastName.trim(), data.phone ?? null]
    )

    if (!row) throw new Error('User creation failed')
    const user = toUser(row)
    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    return { user, token }
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE email = $1 AND status = $2',
      [email.toLowerCase(), 'active']
    )
    if (!row) throw new AuthError('Invalid email or password')

    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) throw new AuthError('Invalid email or password')

    const user = toUser(row)
    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    return { user, token }
  },

  async getById(id: string): Promise<User> {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id])
    if (!row) throw new NotFoundError('User')
    return toUser(row)
  },

  async updateProfile(id: string, data: {
    firstName?: string
    lastName?: string
    phone?: string
  }): Promise<User> {
    const row = await queryOne<UserRow>(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           phone      = COALESCE($3, phone)
       WHERE id = $4
       RETURNING *`,
      [data.firstName ?? null, data.lastName ?? null, data.phone ?? null, id]
    )
    if (!row) throw new NotFoundError('User')
    return toUser(row)
  },

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id])
    if (!row) throw new NotFoundError('User')

    const valid = await bcrypt.compare(currentPassword, row.password_hash)
    if (!valid) throw new AuthError('Current password is incorrect')

    const newHash = await bcrypt.hash(newPassword, config.security.bcryptRounds)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, id])
  },

  async listUsers(params: { page: number; limit: number; role?: string }): Promise<{
    users: User[]
    total: number
  }> {
    const { page, limit, role } = params
    const offset = (page - 1) * limit

    const whereClause = role ? 'WHERE role = $3' : ''
    const args: unknown[] = [limit, offset]
    if (role) args.push(role)

    const [rows, countRows] = await Promise.all([
      query<UserRow>(
        `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        args
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        role ? [role] : []
      ),
    ])

    return {
      users: rows.map(toUser),
      total: parseInt(countRows[0]?.count ?? '0', 10),
    }
  },

  async updateUserStatus(id: string, status: 'active' | 'suspended' | 'deleted'): Promise<User> {
    const row = await queryOne<UserRow>(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )
    if (!row) throw new NotFoundError('User')
    return toUser(row)
  },
}
