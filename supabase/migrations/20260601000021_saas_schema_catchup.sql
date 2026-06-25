-- Migration 021: Catch-up — applies the full SaaS schema to a DB that only has
-- the original single-tenant tables (admin_settings, featured_media, guests, media).
-- Covers content from scripts 007_add_events_table through 020.
-- Every step is idempotent: CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, etc.

BEGIN;

-- ─── 1. events table (007_add_events_table) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  couple_names TEXT,
  wedding_date DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Seed the default event. Update name/slug/couple_names after deploy if needed.
INSERT INTO events (name, slug, couple_names, wedding_date)
VALUES ('BM Wedding', 'bm-wedding-2025', 'B & M', '2025-01-01')
ON CONFLICT (slug) DO NOTHING;

-- ─── 2. event_id on media + guests (007_add_events_table) ────────────────────

ALTER TABLE media ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_media_event_id ON media(event_id);

UPDATE media
SET event_id = (SELECT id FROM events WHERE slug = 'bm-wedding-2025' LIMIT 1)
WHERE event_id IS NULL;

ALTER TABLE guests ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);

UPDATE guests
SET event_id = (SELECT id FROM events WHERE slug = 'bm-wedding-2025' LIMIT 1)
WHERE event_id IS NULL;

-- ─── 3. organizations (010) ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  plan                  TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_email    TEXT,
  paystack_customer_code TEXT
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ─── 4. SaaS columns on events (011) ─────────────────────────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS guests_can_view_gallery BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'closed', 'archived'));
  END IF;
END $$;

-- ─── 5. org_members (012) ────────────────────────────────────────────────────

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

DROP POLICY IF EXISTS "Members read own rows" ON org_members;
CREATE POLICY "Members read own rows" ON org_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "No public writes to org_members" ON org_members;
CREATE POLICY "No public writes to org_members" ON org_members
  FOR ALL WITH CHECK (false);

-- ─── 6. get_my_org_id() hardened with search_path (012 + 018) ────────────────

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT organization_id FROM org_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─── 7. moderation_status on media (013) ─────────────────────────────────────

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_media_moderation_status ON media(moderation_status)
  WHERE moderation_status != 'approved';

-- ─── 8. media RLS — tenant-aware (014 + 015 + 016) ───────────────────────────

DROP POLICY IF EXISTS "Allow public read access" ON media;
DROP POLICY IF EXISTS "Allow public insert"       ON media;

DROP POLICY IF EXISTS "Public read approved media" ON media;
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

DROP POLICY IF EXISTS "Couple reads org media" ON media;
CREATE POLICY "Couple reads org media" ON media
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  );

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

-- Fix media.event_id FK to CASCADE on event delete (015)
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_event_id_fkey;
ALTER TABLE media ADD CONSTRAINT media_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- ─── 9. events RLS — tenant-aware (014) ─────────────────────────────────────

DROP POLICY IF EXISTS "Allow public read events"  ON events;
DROP POLICY IF EXISTS "Deny events insert"        ON events;
DROP POLICY IF EXISTS "Deny events update"        ON events;
DROP POLICY IF EXISTS "Deny events delete"        ON events;
DROP POLICY IF EXISTS "Public read open events"   ON events;
DROP POLICY IF EXISTS "Couple reads own events"   ON events;

CREATE POLICY "Public read open events" ON events
  FOR SELECT USING (status != 'archived');

CREATE POLICY "Couple reads own events" ON events
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND organization_id = get_my_org_id()
  );

-- ─── 10. featured_media RLS (014 + 016) ──────────────────────────────────────

DROP POLICY IF EXISTS "Allow public read featured" ON featured_media;
DROP POLICY IF EXISTS "Public read featured"        ON featured_media;
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

DROP POLICY IF EXISTS "Couple manages featured" ON featured_media;
CREATE POLICY "Couple manages featured" ON featured_media
  FOR ALL USING (
    auth.uid() IS NOT NULL
    AND media_id IN (
      SELECT m.id FROM media m
      JOIN events e ON m.event_id = e.id
      WHERE e.organization_id = get_my_org_id()
    )
  );

-- ─── 11. guests RLS (014) ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Deny public read guests"  ON guests;
DROP POLICY IF EXISTS "Couple reads own guests"  ON guests;
CREATE POLICY "Couple reads own guests" ON guests
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE organization_id = get_my_org_id()
    )
  );

-- ─── 12. organizations RLS (010 + 014) ───────────────────────────────────────

DROP POLICY IF EXISTS "No public access to organizations" ON organizations;
DROP POLICY IF EXISTS "Member reads own org"              ON organizations;
CREATE POLICY "Member reads own org" ON organizations
  FOR SELECT USING (id = get_my_org_id());

-- ─── 13. DB constraints (016) ────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON events(slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.media'::regclass AND conname = 'media_type_check'
  ) THEN
    ALTER TABLE media ADD CONSTRAINT media_type_check
      CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.media'::regclass AND conname = 'media_uploaded_by_length'
  ) THEN
    ALTER TABLE media ADD CONSTRAINT media_uploaded_by_length
      CHECK (char_length(uploaded_by) <= 255);
  END IF;
END $$;

-- NOTE: events.organization_id NOT NULL constraint is intentionally omitted here.
-- Apply it manually after creating your org and associating all events to it:
--   UPDATE events SET organization_id = '<your-org-id>' WHERE organization_id IS NULL;
--   ALTER TABLE events ALTER COLUMN organization_id SET NOT NULL;

-- ─── 14. get_event_photo_counts() with caller ownership check (016 + 020) ────

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
