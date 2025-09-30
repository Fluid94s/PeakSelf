-- Database schema for PeakSelf authentication
-- Target: PostgreSQL

-- SAFETY: Abort if the database is not empty (any table already exists in public schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Init script is intended for an empty DB (public schema already has tables). Aborting.';
  END IF;
END
$$;

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

-- Helpful index for dashboard scans
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Traffic events (store referrer/source of incoming traffic)
CREATE TABLE IF NOT EXISTS traffic_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  path TEXT NULL,
  referrer TEXT NULL,
  user_agent TEXT NULL,
  ip TEXT NULL,
  source TEXT NOT NULL CHECK (source IN ('instagram','youtube','google','other'))
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_time ON traffic_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_traffic_events_source ON traffic_events(source);

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

-- Dashboard metrics (overview)
-- This block creates a snapshot table and a view for the latest snapshot,
-- then inserts a one-time snapshot using current data.
BEGIN;

-- 1) Table to store dashboard snapshots
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id BIGSERIAL PRIMARY KEY,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Users
  total_users BIGINT NOT NULL,
  verified_users BIGINT NOT NULL,
  signups_24h BIGINT NOT NULL,
  -- Newsletter (totals only)
  newsletter_total BIGINT NOT NULL,
  newsletter_signups_24h BIGINT NOT NULL,
  -- Traffic (last 7 days)
  traffic_instagram BIGINT NOT NULL,
  traffic_youtube BIGINT NOT NULL,
  traffic_google BIGINT NOT NULL,
  traffic_others BIGINT NOT NULL,
  traffic_others_refs JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- 2) View for the Overview tab that always points to the latest snapshot
DROP VIEW IF EXISTS dashboard_overview_latest;
CREATE VIEW dashboard_overview_latest AS
SELECT dm.*
FROM dashboard_metrics dm
ORDER BY snapshot_at DESC
LIMIT 1;

-- 3) One-time populate a snapshot with current aggregates
WITH
  u AS (
    SELECT
      COUNT(*)::BIGINT AS total_users,
      COUNT(*) FILTER (WHERE verified)::BIGINT AS verified_users,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::BIGINT AS signups_24h
    FROM users
  ),
  n AS (
    SELECT
      COUNT(*)::BIGINT AS newsletter_total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::BIGINT AS newsletter_signups_24h
    FROM newsletter_subscriptions
  ),
  tr AS (
    SELECT
      COALESCE(SUM(CASE WHEN source = 'instagram' THEN 1 ELSE 0 END),0)::BIGINT AS traffic_instagram,
      COALESCE(SUM(CASE WHEN source = 'youtube' THEN 1 ELSE 0 END),0)::BIGINT AS traffic_youtube,
      COALESCE(SUM(CASE WHEN source = 'google' THEN 1 ELSE 0 END),0)::BIGINT AS traffic_google,
      COALESCE(SUM(CASE WHEN source = 'other' THEN 1 ELSE 0 END),0)::BIGINT AS traffic_others
    FROM traffic_events
    WHERE occurred_at >= NOW() - INTERVAL '7 days'
  ),
  otr AS (
    SELECT COALESCE(jsonb_agg(ref ORDER BY cnt DESC), '[]'::jsonb) AS others_refs
    FROM (
      SELECT COALESCE(NULLIF(referrer,''),'(direct)') AS ref, COUNT(*) AS cnt
      FROM traffic_events
      WHERE occurred_at >= NOW() - INTERVAL '7 days' AND source = 'other'
      GROUP BY COALESCE(NULLIF(referrer,''),'(direct)')
      ORDER BY cnt DESC
      LIMIT 5
    ) t
  )
INSERT INTO dashboard_metrics (
  total_users, verified_users, signups_24h,
  newsletter_total, newsletter_signups_24h,
  traffic_instagram, traffic_youtube, traffic_google, traffic_others, traffic_others_refs
)
SELECT
  u.total_users, u.verified_users, u.signups_24h,
  n.newsletter_total, n.newsletter_signups_24h,
  tr.traffic_instagram, tr.traffic_youtube, tr.traffic_google, tr.traffic_others, otr.others_refs
FROM u, n, tr, otr;

COMMIT;



