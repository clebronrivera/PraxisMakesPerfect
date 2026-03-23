-- Archive of learner assessment data before admin-triggered reset (screener or full/diagnostic).
-- Rows are inserted by the Netlify `admin-reset-assessment` function using the service role.
-- RLS: no policies for authenticated users — only service role bypasses RLS.

CREATE TABLE IF NOT EXISTS assessment_reset_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('screener', 'full_diagnostic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_progress_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  responses_archived JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_assessment_reset_archive_target
  ON assessment_reset_archive (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_reset_archive_created
  ON assessment_reset_archive (created_at DESC);

ALTER TABLE assessment_reset_archive ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE assessment_reset_archive IS
  'Snapshots user_progress + deleted response rows when an admin resets screener or full/diagnostic data.';
