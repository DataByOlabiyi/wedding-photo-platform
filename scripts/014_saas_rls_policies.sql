-- SaaS migration 014: tenant-aware RLS policies using Supabase Auth.
-- Replaces the open public-read/insert policies from earlier migrations.
-- Couples see only media that belongs to events they own (via org_members).
-- Guests are unauthenticated; their upload path is validated server-side before
-- the insert, so the insert policy remains permissive (INSERT only).

-- ─── media ──────────────────────────────────────────────────────────────────

-- Drop old blanket policies
DROP POLICY IF EXISTS "Allow public read access" ON media;
DROP POLICY IF EXISTS "Allow public insert"      ON media;

-- Public can read approved, non-deleted media (needed for the guest gallery view).
-- Tenant-only gallery (guests_can_view_gallery = false) is enforced in the
-- application layer, not RLS, to keep policies simple.
CREATE POLICY "Public read approved media" ON media
  FOR SELECT USING (deleted_at IS NULL AND moderation_status = 'approved');

-- Authenticated couple can read ALL their org's media (including pending/rejected)
-- so they can moderate it. Uses the SECURITY DEFINER helper from migration 012.
CREATE POLICY "Couple reads org media" ON media
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  );

-- Guests upload without auth; event_id is validated server-side before reaching DB.
CREATE POLICY "Public insert media" ON media
  FOR INSERT WITH CHECK (true);

-- Only authenticated couple (owner of the event's org) can soft-delete media.
-- Guest self-delete also uses the service role client + app-layer validation.
CREATE POLICY "Couple soft-deletes org media" ON media
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  )
  WITH CHECK (true);

-- ─── events ─────────────────────────────────────────────────────────────────

-- Drop any existing write-deny policies that would block the couple from
-- reading their own events (the public read policy from migration 007 stays).
-- Couples can read events belonging to their org.
DROP POLICY IF EXISTS "Allow public read events" ON events;

CREATE POLICY "Public read open events" ON events
  FOR SELECT USING (status != 'archived');

CREATE POLICY "Couple reads own events" ON events
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND organization_id = get_my_org_id()
  );

-- ─── featured_media ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public read featured" ON featured_media;

CREATE POLICY "Public read featured" ON featured_media
  FOR SELECT USING (true);

CREATE POLICY "Couple manages featured" ON featured_media
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND media_id IN (
      SELECT m.id FROM media m
      JOIN events e ON m.event_id = e.id
      WHERE e.organization_id = get_my_org_id()
    )
  );

-- ─── guests ─────────────────────────────────────────────────────────────────

-- Couples can read their own event's RSVP list.
DROP POLICY IF EXISTS "Deny public read guests" ON guests;

CREATE POLICY "Couple reads own guests" ON guests
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  );

-- ─── organizations (readable by members) ────────────────────────────────────

DROP POLICY IF EXISTS "No public access to organizations" ON organizations;

CREATE POLICY "Member reads own org" ON organizations
  FOR SELECT USING (id = get_my_org_id());
