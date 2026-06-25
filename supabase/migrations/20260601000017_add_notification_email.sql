-- Migration 017: add optional notification_email to organizations.
--
-- When set, transactional emails (upload notifications, plan alerts) are sent
-- to this address instead of the auth user's email. NULL means the application
-- falls back to the Supabase auth user email for the org owner.
-- This column is intentionally nullable — forcing a value would break existing
-- orgs that have no separate notification address.

BEGIN;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notification_email text;

COMMENT ON COLUMN organizations.notification_email IS
  'Optional override address for transactional emails. '
  'NULL = fall back to the org owner''s auth.users.email.';

COMMIT;
