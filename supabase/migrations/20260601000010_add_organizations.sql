-- SaaS migration 010: tenant root table.
-- Each organization is one paying account (a couple or a photographer/planner).
-- In B2C: one org per couple, one event per org. In B2B: one org, many events.

CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  plan       TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Owners can read their own org; service role writes.
-- Members look themselves up via org_members, so SELECT is deferred to a
-- SECURITY DEFINER helper. Block all public access here.
CREATE POLICY "No public access to organizations" ON organizations
  FOR ALL USING (false);
