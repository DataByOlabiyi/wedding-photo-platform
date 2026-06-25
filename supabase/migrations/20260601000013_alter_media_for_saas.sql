-- SaaS migration 013: add moderation status placeholder to media.
-- Default 'approved' preserves all existing uploads as visible.
-- Moderation UI can be built later; the column costs nothing to add now.

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_media_moderation_status ON media(moderation_status)
  WHERE moderation_status != 'approved';
