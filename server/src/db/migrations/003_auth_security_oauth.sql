-- Migration: 003_auth_security_oauth.sql
-- Safe OAuth provider IDs and OTP security migration

-- 1. Add OAuth provider IDs to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE;

-- 2. Add OTP security columns safely (nullable initial state)
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS code_hash VARCHAR(255);
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5;
ALTER TABLE otp_codes ALTER COLUMN code DROP NOT NULL;

-- 3. Invalidate legacy unhashed OTP records safely without data destruction
UPDATE otp_codes SET expires_at = NOW() WHERE code_hash IS NULL;

-- 4. Create indices for fast lookup & cleanup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
