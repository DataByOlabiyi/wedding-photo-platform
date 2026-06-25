-- Migration 018: harden get_my_org_id() with an explicit search_path.
--
-- Without SET search_path, a SECURITY DEFINER function inherits the caller's
-- search_path at call time. A malicious or misconfigured search_path could
-- shadow public tables with attacker-controlled schema objects (schema
-- injection). Adding SET search_path = public, auth pins the function to the
-- correct schemas regardless of the caller's session setting.
--
-- The function body is otherwise identical to migration 012. CREATE OR REPLACE
-- makes this idempotent.

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT organization_id
  FROM org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
