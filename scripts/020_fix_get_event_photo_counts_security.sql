-- Migration 020: Add caller ownership guard to get_event_photo_counts().
-- The function was a SECURITY DEFINER that trusted the caller to pass a valid
-- org_id. This adds a DB-level check so the function only returns counts for
-- an org the authenticated user is a member of.
BEGIN;

CREATE OR REPLACE FUNCTION get_event_photo_counts(org_id uuid)
RETURNS TABLE(event_id uuid, photo_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT m.event_id, count(*) AS photo_count
  FROM media m
  WHERE m.event_id IN (
    SELECT id FROM events
    WHERE organization_id = org_id
      AND org_id IN (
        SELECT organization_id FROM org_members WHERE user_id = auth.uid()
      )
  )
    AND m.deleted_at IS NULL
  GROUP BY m.event_id;
$$;

COMMIT;
