-- Migration 0001: Add study_plans table and missing session columns
-- Apply via Supabase Dashboard → SQL Editor, or via supabase db push

-- ─── STUDY PLANS TABLE ───────────────────────────────────────────────────────
-- Stores AI-generated study plan documents per user (latest = most recent row)
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_document JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user
  ON study_plans(user_id, created_at DESC);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid() = user_id);

-- ─── user_progress: add missing session columns ──────────────────────────────
-- last_full_assessment_session_id: tracks the session used for the last full
--   assessment so the app can resume or reference it.
-- last_screener_session_id: same for the screener flow.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS last_full_assessment_session_id TEXT,
  ADD COLUMN IF NOT EXISTS last_screener_session_id TEXT;
