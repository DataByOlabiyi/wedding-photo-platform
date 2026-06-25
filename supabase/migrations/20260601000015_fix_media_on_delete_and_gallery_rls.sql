-- Migration 015: fix media ON DELETE cascade + enforce guests_can_view_gallery in RLS.
--
-- Part A: media.event_id was declared ON DELETE SET NULL, meaning deleting an event
--         left orphaned media rows (event_id = NULL) with no way to clean up storage
--         objects. Changed to ON DELETE CASCADE so media is removed with its event.
--
-- Part B: The "Public read approved media" policy from migration 014 allowed any
--         anonymous visitor to read approved media regardless of the event's
--         guests_can_view_gallery flag (that check was deferred to the app layer).
--         The new policy enforces it at the database level by joining to events.

-- ─── Part A: fix ON DELETE behaviour ────────────────────────────────────────

ALTER TABLE media DROP CONSTRAINT IF EXISTS media_event_id_fkey;

ALTER TABLE media ADD CONSTRAINT media_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- ─── Part B: enforce guests_can_view_gallery in RLS ─────────────────────────

-- Remove the old permissive public-read policy (created in migration 014).
DROP POLICY IF EXISTS "Public read approved media" ON media;

-- New policy: public (unauthenticated) reads are only allowed when the owning
-- event explicitly permits guest gallery access and is not archived.
-- Authenticated couples are still covered by "Couple reads org media" (014).
CREATE POLICY "Public read approved media" ON media
  FOR SELECT USING (
    deleted_at IS NULL
    AND moderation_status = 'approved'
    AND event_id IN (
      SELECT id FROM events
      WHERE guests_can_view_gallery = true
        AND status != 'archived'
    )
  );
