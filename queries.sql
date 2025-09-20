-- Database schema for PeakSelf authentication
-- Target: PostgreSQL

-- Required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM for auth provider
DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM ('local', 'google');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NULL,
  provider auth_provider NOT NULL DEFAULT 'local',
  google_id TEXT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- If provider is google, password must be null
  CONSTRAINT chk_google_password_null CHECK (
    (provider <> 'google') OR (password_hash IS NULL)
  ),
  -- If provider is local, password must be set
  CONSTRAINT chk_local_password_set CHECK (
    (provider <> 'local') OR (password_hash IS NOT NULL)
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to quickly find active tokens
-- Partial index with immutable predicate only
CREATE INDEX IF NOT EXISTS idx_email_verification_active
  ON email_verification_tokens(user_id, expires_at)
  WHERE consumed_at IS NULL;

-- Sessions (optional if using server-side sessions)
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upsert/linking rules (documented expectations)
-- 1) On Google OAuth sign-in:
--    - If a user with same email exists and provider='local', set users.google_id if NULL (link accounts). Keep provider='local' so local login remains allowed.
--    - If no user exists, create with provider='google', password_hash=NULL, verified=FALSE; send verification email; local login must be disabled.
-- 2) On Local register:
--    - If a user exists with provider='google', do NOT allow setting a password; reject with message that Google account exists (no local login).
--    - If no user exists, create with provider='local' and password_hash set; verified=FALSE; send verification email.
-- 3) On Local login:
--    - Only permitted when provider='local' and verified=TRUE.
-- 4) On Google login:
--    - Permit regardless of verified flag, but require email verification before granting full access if business rules require; otherwise mark verified upon email confirmation.



