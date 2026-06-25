-- SaaS migration 011: extend the existing events table for multi-tenancy.
-- Adds: org ownership, gallery token, PIN, lifecycle, and guest-visibility flag.

-- Tenant ownership
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

-- Per-event gallery access token (replaces global NEXT_PUBLIC_GALLERY_TOKEN env var).
-- Couples share this token with family/friends for view-only gallery access.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS gallery_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT;

-- Optional PIN that guests must enter before uploading.
-- Stored as salt:sha256hex (see lib/pin-utils.ts). NULL means no PIN.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Lifecycle: 'open' accepts uploads; 'closed' rejects new uploads (gallery stays readable).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'archived'));

-- Optional auto-close: if set and in the past, uploads are blocked server-side.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;

-- Whether guests can view the gallery (not just upload). Default TRUE = current behaviour.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guests_can_view_gallery BOOLEAN NOT NULL DEFAULT TRUE;

-- Drop the old blanket-deny write policies so the service role can manage events.
DROP POLICY IF EXISTS "Deny events insert" ON events;
DROP POLICY IF EXISTS "Deny events update" ON events;
DROP POLICY IF EXISTS "Deny events delete" ON events;

-- Service role (used by server actions) can do anything.
-- Authenticated users can read their own org's events; done via SECURITY DEFINER helper.
-- Public: still allowed to read event metadata (name/date shown on upload page).
-- The public read policy from migration 007 remains in place.
