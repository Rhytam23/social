-- Migration: 002_otp_codes.sql
-- Create OTP codes table for 6-digit Email OTP authentication

CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  purpose     VARCHAR(50) NOT NULL DEFAULT 'login',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes (email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes (email, code, purpose);
