import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { query, queryOne } from '../db/client'
import { config } from '../config'
import { generateToken } from '../middleware/auth'
import { AppError, AuthError, ConflictError, NotFoundError } from '../middleware/errorHandler'
import { emailService } from './emailService'
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

  async sendOTP(email: string, purpose: string = 'login'): Promise<{ email: string; expiresAt: string; code: string }> {
    const cleanEmail = email.toLowerCase().trim()

    // 1. Rate limiting check: Max 3 OTP requests in 15 minutes
    const rateCheck = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM otp_codes WHERE email = $1 AND created_at > (NOW() - INTERVAL '15 minutes')`,
      [cleanEmail]
    )
    if (parseInt(rateCheck?.count ?? '0', 10) >= 3) {
      throw new AuthError('Too many OTP requests. Please wait 15 minutes before requesting a new code.')
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Delete older OTP codes for same email & purpose
    await query('DELETE FROM otp_codes WHERE email = $1 AND purpose = $2', [cleanEmail, purpose])

    await query(
      'INSERT INTO otp_codes (email, code_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [cleanEmail, codeHash, purpose, expiresAt.toISOString()]
    )

    const sent = await emailService.sendOtpEmail(cleanEmail, code)
    if (!sent) {
      // Never report success when the email did not go out.
      await query('DELETE FROM otp_codes WHERE email = $1 AND purpose = $2', [cleanEmail, purpose])
      throw new AppError('Email delivery is unavailable. Please try again later.', 503, 'EMAIL_UNCONFIGURED')
    }
    return { email: cleanEmail, expiresAt: expiresAt.toISOString(), code }
  },

  // Validates and consumes a one-time code. Throws on any failure; deletes the code on success.
  async consumeOtp(email: string, code: string, purpose: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim()
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')

    const otpRow = await queryOne<{ id: string; attempts: number; max_attempts: number }>(
      'SELECT id, attempts, max_attempts FROM otp_codes WHERE email = $1 AND purpose = $2 AND expires_at > NOW()',
      [cleanEmail, purpose]
    )

    if (!otpRow) {
      throw new AuthError('Invalid or expired OTP code. Please request a new code.')
    }

    // Check attempt limits
    if (otpRow.attempts >= otpRow.max_attempts) {
      await query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id])
      throw new AuthError('Maximum verification attempts exceeded. Please request a new OTP code.')
    }

    // Verify hash match
    const validMatch = await queryOne<{ id: string }>(
      'SELECT id FROM otp_codes WHERE id = $1 AND code_hash = $2',
      [otpRow.id, codeHash]
    )

    if (!validMatch) {
      // Increment attempt counter
      await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otpRow.id])
      throw new AuthError('Invalid OTP code. Please check your code and try again.')
    }

    // Remove used OTP
    await query('DELETE FROM otp_codes WHERE id = $1', [otpRow.id])
  },

  async verifyOTP(email: string, code: string, purpose: string = 'login'): Promise<{ user: User; token: string }> {
    // Password-reset codes must never mint a session — see resetPasswordWithOtp.
    if (purpose === 'reset_password') {
      throw new AuthError('This code can only be used to reset a password.')
    }

    const cleanEmail = email.toLowerCase().trim()
    await this.consumeOtp(cleanEmail, code, purpose)

    // Find existing user or create user if registering via OTP
    let row = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [cleanEmail])

    if (row && row.status !== 'active') {
      throw new AuthError('This account is not active. Please contact support.')
    }

    if (!row) {
      // Auto-create user for new email registration
      const randomPassword = await bcrypt.hash(`Otp_${Date.now()}_${Math.random()}`, config.security.bcryptRounds)
      const namePart = cleanEmail.split('@')[0] ?? 'User'
      const [newRow] = await query<UserRow>(
        `INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [cleanEmail, randomPassword, namePart, 'Customer']
      )
      row = newRow
    } else {
      // Mark email as verified if not yet
      await query('UPDATE users SET email_verified = true WHERE id = $1', [row.id])
    }

    if (!row) throw new Error('Authentication failed')

    const user = toUser(row)
    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    return { user, token }
  },

  // Completes a password reset: consumes a reset_password OTP and sets the new password.
  // Does NOT log the user in — they must sign in with the new password.
  async resetPasswordWithOtp(email: string, code: string, newPassword: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim()
    await this.consumeOtp(cleanEmail, code, 'reset_password')

    const row = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [cleanEmail])
    if (!row) throw new NotFoundError('Account')
    if (row.status !== 'active') {
      throw new AuthError('This account is not active. Please contact support.')
    }

    const newHash = await bcrypt.hash(newPassword, config.security.bcryptRounds)
    await query('UPDATE users SET password_hash = $1, email_verified = true WHERE id = $2', [newHash, row.id])
  },
}
