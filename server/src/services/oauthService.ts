import crypto from 'crypto'
import { config } from '../config'
import { query, queryOne } from '../db/client'
import { AuthError } from '../middleware/errorHandler'
import type { User, UserRole } from '../types'

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
  google_id?: string | null
  github_id?: string | null
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
    googleId: row.google_id,
    githubId: row.github_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// OAuth redirect URIs are derived from API_BASE_URL config only — never from
// request headers, which an attacker controls.
const googleRedirectUri = () => `${config.apiBaseUrl}/api/auth/google/callback`
const githubRedirectUri = () => `${config.apiBaseUrl}/api/auth/github/callback`

export const oauthService = {
  generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  },

  getGoogleAuthUrl(state: string): string {
    if (!config.oauth.google.clientId) {
      throw new AuthError('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID.')
    }
    const redirectUri = googleRedirectUri()

    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  },

  getGitHubAuthUrl(state: string): string {
    if (!config.oauth.github.clientId) {
      throw new AuthError('GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID.')
    }
    const redirectUri = githubRedirectUri()

    const params = new URLSearchParams({
      client_id: config.oauth.github.clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  },

  async handleGoogleCallback(code: string, state: string, savedState?: string): Promise<User> {
    if (!savedState || state !== savedState) {
      throw new AuthError('OAuth state mismatch or expired request. Please try signing in again.')
    }

    const redirectUri = googleRedirectUri()

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      throw new AuthError('Failed to exchange authorization code with Google')
    }

    const tokens = (await tokenRes.json()) as { access_token: string }

    // Fetch Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      throw new AuthError('Failed to fetch Google profile')
    }

    const profile = (await profileRes.json()) as {
      id: string
      email: string
      verified_email?: boolean
      given_name?: string
      family_name?: string
      name?: string
      picture?: string
    }

    const googleId = profile.id
    const email = profile.email.toLowerCase().trim()

    // 1. Look for user by google_id
    let userRow = await queryOne<UserRow>('SELECT * FROM users WHERE google_id = $1', [googleId])

    if (!userRow) {
      // 2. Look for user by email
      userRow = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email])

      if (userRow) {
        // Prevent account takeover on unverified local accounts
        if (!userRow.email_verified && !profile.verified_email) {
          throw new AuthError('Email address must be verified before linking accounts.')
        }
        // Link google_id safely
        const [updated] = await query<UserRow>(
          'UPDATE users SET google_id = $1, email_verified = true, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3 RETURNING *',
          [googleId, profile.picture ?? null, userRow.id]
        )
        userRow = updated
      } else {
        // 3. Create new user for Google login
        const randomPass = crypto.randomBytes(32).toString('hex')
        const firstName = profile.given_name || profile.name?.split(' ')[0] || 'Google'
        const lastName = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User'

        const [created] = await query<UserRow>(
          `INSERT INTO users (email, password_hash, first_name, last_name, google_id, email_verified, avatar_url)
           VALUES ($1, $2, $3, $4, $5, true, $6)
           RETURNING *`,
          [email, randomPass, firstName, lastName, googleId, profile.picture ?? null]
        )
        userRow = created
      }
    }

    if (!userRow) throw new AuthError('Google authentication failed')
    return toUser(userRow)
  },

  async handleGitHubCallback(code: string, state: string, savedState?: string): Promise<User> {
    if (!savedState || state !== savedState) {
      throw new AuthError('OAuth state mismatch or expired request. Please try signing in again.')
    }

    const redirectUri = githubRedirectUri()

    // Exchange authorization code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.oauth.github.clientId,
        client_secret: config.oauth.github.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      throw new AuthError('Failed to exchange authorization code with GitHub')
    }

    const tokens = (await tokenRes.json()) as { access_token: string }
    if (!tokens.access_token) {
      throw new AuthError('GitHub authorization code invalid or expired')
    }

    // Fetch GitHub profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'PREMIUM-PC-App',
      },
    })

    if (!profileRes.ok) {
      throw new AuthError('Failed to fetch GitHub profile')
    }

    const profile = (await profileRes.json()) as {
      id: number
      email?: string
      name?: string
      login: string
      avatar_url?: string
    }

    // Only trust addresses GitHub itself has verified: /user's `email` field
    // carries no verification guarantee, so always resolve via /user/emails.
    // Linking to an existing local account by an unverified address would be
    // an account-takeover vector.
    let email: string | undefined
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'PREMIUM-PC-App',
      },
    })
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>
      const verifiedPrimary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
      if (verifiedPrimary) email = verifiedPrimary.email.toLowerCase().trim()
    }

    if (!email) {
      throw new AuthError('No verified email associated with this GitHub account')
    }

    const githubId = profile.id.toString()

    // 1. Look for user by github_id
    let userRow = await queryOne<UserRow>('SELECT * FROM users WHERE github_id = $1', [githubId])

    if (!userRow) {
      // 2. Look for user by email
      userRow = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email])

      if (userRow) {
        // Link github_id safely
        const [updated] = await query<UserRow>(
          'UPDATE users SET github_id = $1, email_verified = true, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3 RETURNING *',
          [githubId, profile.avatar_url ?? null, userRow.id]
        )
        userRow = updated
      } else {
        // 3. Create new user for GitHub login
        const randomPass = crypto.randomBytes(32).toString('hex')
        const nameParts = (profile.name || profile.login).split(' ')
        const firstName = nameParts[0] || 'GitHub'
        const lastName = nameParts.slice(1).join(' ') || 'User'

        const [created] = await query<UserRow>(
          `INSERT INTO users (email, password_hash, first_name, last_name, github_id, email_verified, avatar_url)
           VALUES ($1, $2, $3, $4, $5, true, $6)
           RETURNING *`,
          [email, randomPass, firstName, lastName, githubId, profile.avatar_url ?? null]
        )
        userRow = created
      }
    }

    if (!userRow) throw new AuthError('GitHub authentication failed')
    return toUser(userRow)
  },
}
