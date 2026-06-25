-- SaaS migration 012: link Supabase Auth users to organizations.
-- user_id references auth.users (managed by Supabase Auth, not a local table).

CREATE TABLE IF NOT EXISTS org_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'editor')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id  ON org_members(organization_id);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- A user can read their own membership rows.
CREATE POLICY "Members read own rows" ON org_members
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role may insert/update/delete memberships.
CREATE POLICY "No public writes to org_members" ON org_members
  FOR ALL WITH CHECK (false);

-- SECURITY DEFINER helper: returns the organization_id for the calling user.
-- Called inside RLS policies on other tables to avoid nested subqueries on
-- every row scan (evaluated once per query, not per row).
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT organization_id
  FROM org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
