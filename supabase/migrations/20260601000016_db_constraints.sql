-- Migration 016: DB-level constraints and tightened RLS policies.
--
-- Closes several security and data-integrity gaps that were previously
-- deferred to the application layer:
--   1. Unique index on events.slug (the column is UNIQUE in DDL but the
--      constraint was declared inside CREATE TABLE in 007 — adding an explicit
--      named index makes it visible via pg_indexes and easier to reference).
--   2. NOT NULL on events.organization_id (added as nullable in 011 to allow
--      backfill; all rows should now have a value).
--   3. CHECK on media.media_type — only 'image' and 'video' are valid.
--      NOTE: the value 'photo' was deliberately renamed to 'image' in the
--      007_soft_delete_and_rls migration. lib/types.ts confirms the app
--      only produces "image" | "video" via getMediaType(). 'photo' is NOT
--      included here to avoid false-permissive values in production.
--   4. CHECK on media.uploaded_by length.
--   5. Tightened media INSERT RLS — guests can only upload to open events
--      that have not passed their closes_at deadline, and only valid types.
--   6. Tightened media UPDATE RLS — WITH CHECK now prevents an UPDATE from
--      un-deleting a row or moving it to a different org's event.
--   7. Scoped featured_media public SELECT — previously allowed reading
--      featured media from archived or private events.
--   8. get_event_photo_counts() RPC — avoids N+1 per-event COUNT queries
--      in the dashboard by aggregating all events for an org in one call.

BEGIN;

-- ─── 1. Unique index on events.slug ─────────────────────────────────────────
-- The column is declared UNIQUE in the 007 CREATE TABLE, but that implicit
-- constraint has no stable name. This named index makes it programmatically
-- referenceable and is a no-op if a unique constraint already covers the column.
-- serves: slug-based event lookup (/e/[slug] routes)
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON events(slug);

-- ─── 2. NOT NULL on events.organization_id ──────────────────────────────────
-- Added nullable in 011 to allow a phased backfill. Any remaining NULLs are
-- patched to the first org row (last-resort backfill; real data should already
-- be clean). The DO block is idempotent — the ALTER is skipped if the column
-- is already NOT NULL.
DO $$
BEGIN
  -- Backfill any remaining NULLs before tightening.
  -- In production this should be a no-op; in a fresh-schema replay it seeds
  -- the legacy seed event to the first org so DDL does not fail.
  UPDATE events
  SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  WHERE organization_id IS NULL;

  -- Only alter if the column is still nullable.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'events'
      AND column_name  = 'organization_id'
      AND is_nullable  = 'YES'
  ) THEN
    ALTER TABLE events ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- ─── 3. CHECK constraint on media.media_type ────────────────────────────────
-- Permits only the two values the application produces. 'photo' was renamed
-- to 'image' in migration 007 and no longer appears in any row or app code.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.media'::regclass
      AND conname  = 'media_type_check'
      AND contype  = 'c'
  ) THEN
    ALTER TABLE media
      ADD CONSTRAINT media_type_check
      CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

-- ─── 4. CHECK constraint on media.uploaded_by length ────────────────────────
-- Caps the guest display-name field. 255 chars matches the UI input max-length
-- and prevents pathological-length strings reaching storage.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.media'::regclass
      AND conname  = 'media_uploaded_by_length'
      AND contype  = 'c'
  ) THEN
    ALTER TABLE media
      ADD CONSTRAINT media_uploaded_by_length
      CHECK (char_length(uploaded_by) <= 255);
  END IF;
END $$;

-- ─── 5. Tighten media INSERT RLS ────────────────────────────────────────────
-- The policy "Public insert media" from migration 014 used WITH CHECK (true),
-- which allowed guest uploads to any event including closed or archived ones.
-- Server-side validation catches this, but defence in depth requires the DB to
-- also reject invalid inserts.
--
-- RISK: guests are unauthenticated; event_id must be supplied by the caller.
-- The server action validates it before the insert reaches this policy, but
-- this policy is the last line of defence if that check is bypassed.
--
-- Storage quota gap: this policy does not enforce per-org storage limits.
-- That enforcement remains application-layer only (known gap, tracked in CLAUDE.md).
DROP POLICY IF EXISTS "Public insert media" ON media;

CREATE POLICY "Public insert media" ON media
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE status = 'open'
        AND (closes_at IS NULL OR closes_at > now())
    )
    AND (media_type IS NULL OR media_type IN ('image', 'video'))
    AND (uploaded_by IS NULL OR char_length(uploaded_by) <= 255)
  );

-- ─── 6. Tighten media UPDATE RLS ────────────────────────────────────────────
-- The policy "Couple soft-deletes org media" from migration 014 had
-- WITH CHECK (true), which would permit any UPDATE value — including un-deleting
-- a row or changing event_id across org boundaries.
-- New WITH CHECK ensures: (a) the update must be a soft-delete (deleted_at NOT NULL),
-- and (b) the row's event still belongs to the caller's org.
DROP POLICY IF EXISTS "Couple soft-deletes org media" ON media;

CREATE POLICY "Couple soft-deletes org media" ON media
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    deleted_at IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  );

-- ─── 7. Scope featured_media public SELECT ───────────────────────────────────
-- The policy "Public read featured" from migration 014 used USING (true),
-- exposing featured media from archived events and events where
-- guests_can_view_gallery = false. This joins to events to enforce both flags,
-- and also excludes soft-deleted media items.
DROP POLICY IF EXISTS "Public read featured" ON featured_media;

CREATE POLICY "Public read featured" ON featured_media
  FOR SELECT USING (
    media_id IN (
      SELECT m.id FROM media m
      JOIN events e ON m.event_id = e.id
      WHERE e.guests_can_view_gallery = true
        AND e.status != 'archived'
        AND m.deleted_at IS NULL
    )
  );

-- ─── 8. get_event_photo_counts() RPC ────────────────────────────────────────
-- Returns per-event photo counts for a given org in a single query.
-- Without this, the dashboard issues one COUNT(*) per event row (N+1).
-- SECURITY DEFINER so the function can read media rows that RLS would otherwise
-- filter; it is scoped to the caller-supplied org_id which the server action
-- validates against the session before calling this function.
-- The caller is responsible for ensuring org_id matches the authenticated org.
CREATE OR REPLACE FUNCTION get_event_photo_counts(org_id uuid)
RETURNS TABLE(event_id uuid, photo_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT m.event_id, count(*) AS photo_count
  FROM media m
  WHERE m.event_id IN (
    SELECT id FROM events WHERE organization_id = org_id
  )
    AND m.deleted_at IS NULL
  GROUP BY m.event_id;
$$;

COMMIT;
