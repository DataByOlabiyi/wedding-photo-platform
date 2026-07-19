-- Migration 021: platform_admins table for platform-level staff roles.
--
-- Tracks which auth users hold platform-wide admin/superadmin rights.
-- This is deliberately NOT an org-scoped table: platform admins operate
-- above tenant boundaries, so there is no organization_id column and the
-- get_my_org_id() tenant rule does not apply.
--
-- Access model mirrors 008_add_audit_logs.sql: RLS enabled with explicit
-- deny-all policies, so only the service role (BYPASSRLS) and the table
-- owner (postgres, e.g. the SQL editor) can read or write. All application
-- reads must go through createAdminClient() after the session is verified.
--
-- granted_by: FK to auth.users with ON DELETE SET NULL — deleting the
-- granter's account must not destroy or orphan-error the grantee's row.
-- user_id: ON DELETE CASCADE — deleting a staff account revokes the role.

BEGIN;

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CONSTRAINT platform_admins_role_check
               CHECK (role IN ('admin', 'superadmin')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PK on user_id serves the only query pattern (single-row lookup by user_id).
-- No further index: granted_by is never used in a WHERE clause, and the FK's
-- ON DELETE SET NULL scan cost is negligible at platform-staff row counts.

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Only service role can read or write platform_admins (mirrors audit_logs).
-- Explicit deny policies for all four operations — RLS with no policy already
-- denies, but explicit false policies make the intent auditable in pg_policies.
DROP POLICY IF EXISTS "Deny public read platform_admins"   ON platform_admins;
DROP POLICY IF EXISTS "Deny public insert platform_admins" ON platform_admins;
DROP POLICY IF EXISTS "Deny public update platform_admins" ON platform_admins;
DROP POLICY IF EXISTS "Deny public delete platform_admins" ON platform_admins;

CREATE POLICY "Deny public read platform_admins"   ON platform_admins FOR SELECT USING (false);
CREATE POLICY "Deny public insert platform_admins" ON platform_admins FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public update platform_admins" ON platform_admins FOR UPDATE USING (false);
CREATE POLICY "Deny public delete platform_admins" ON platform_admins FOR DELETE USING (false);

-- Seed: promote any auth user already flagged as superadmin in app metadata.
-- ON CONFLICT DO NOTHING keeps replays from overwriting a manually adjusted
-- role (e.g. a later downgrade to 'admin' survives a re-run).
INSERT INTO platform_admins (user_id, role, granted_by)
SELECT id, 'superadmin', NULL
FROM auth.users
WHERE raw_app_meta_data->>'is_superadmin' = 'true'
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
