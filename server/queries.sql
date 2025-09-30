-- PeakSelf DB patch: RUN ONCE ONLY against an existing database
-- This script adds columns and indexes required by the app. It is NOT idempotent.
-- Make a backup before running if this is a shared/important database.

-- 1) Users: add new columns used by the app
ALTER TABLE users
  ADD COLUMN name TEXT,
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN google_id TEXT,
  ADD COLUMN provider TEXT DEFAULT 'local',
  ADD COLUMN role TEXT,
  ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Backfill provider for any existing rows, then enforce NOT NULL
UPDATE users SET provider = 'local' WHERE provider IS NULL;
ALTER TABLE users ALTER COLUMN provider SET NOT NULL;

-- 3) Roles: backfill, default, NOT NULL, and valid values
UPDATE users SET role = 'user' WHERE role IS NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user','admin'));

-- 4) Enforce email uniqueness case-insensitively (functional unique index)
CREATE UNIQUE INDEX users_email_unique_idx ON users ((LOWER(email)));

-- 5) Enforce uniqueness for google_id when present (partial unique index)
CREATE UNIQUE INDEX users_google_id_unique_idx ON users (google_id) WHERE google_id IS NOT NULL;

-- 6) Email verification tokens (stores string user_id to avoid type coupling) — RUN ONCE
CREATE TABLE email_verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

-- 7) Newsletter subscriptions — RUN ONCE
CREATE TABLE newsletter_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
