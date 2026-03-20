-- Migration 0003: Learning Path Progress table
-- Tracks per-user, per-skill learning path activity:
--   lesson progress (viewed, time spent) and practice question results.
--
-- This table is separate from user_progress.skill_scores.
-- skill_scores reflects overall practice accuracy (all modes).
-- learning_path_progress reflects only Learning Path module completion.
--
-- Apply: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_path_progress (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id              TEXT        NOT NULL,

  -- Section 1: Lesson
  lesson_viewed         BOOLEAN     NOT NULL DEFAULT false,
  time_spent_seconds    INTEGER     NOT NULL DEFAULT 0,
  lesson_completed_at   TIMESTAMPTZ,

  -- Section 2: Practice Questions
  questions_submitted   BOOLEAN     NOT NULL DEFAULT false,
  questions_correct     INTEGER     NOT NULL DEFAULT 0,
  questions_total       INTEGER     NOT NULL DEFAULT 0,
  accuracy              FLOAT,

  -- Derived status from Learning Path activity
  -- not_started | emerging | approaching | demonstrating | mastered
  status                TEXT        NOT NULL DEFAULT 'not_started',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT learning_path_progress_user_skill_unique UNIQUE (user_id, skill_id),
  CONSTRAINT learning_path_progress_status_check
    CHECK (status IN ('not_started', 'emerging', 'approaching', 'demonstrating', 'mastered')),
  CONSTRAINT learning_path_progress_accuracy_check
    CHECK (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 1))
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_lpp_user_id
  ON learning_path_progress (user_id);

-- Row-level security: each user can only see/modify their own rows
ALTER TABLE learning_path_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own lp progress"
  ON learning_path_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lp progress"
  ON learning_path_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lp progress"
  ON learning_path_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Status derivation helper (comment-doc) ──────────────────────────────────
-- Status is computed by the application layer (not a DB trigger) based on:
--   not_started  → lesson_viewed = false
--   emerging     → lesson_viewed = true AND (questions_submitted = false OR accuracy < 0.60)
--   approaching  → questions_submitted = true AND 0.60 ≤ accuracy < 0.80
--   demonstrating→ questions_submitted = true AND accuracy ≥ 0.80
--   mastered     → demonstrating on TWO separate sessions (managed by app logic)
-- ─────────────────────────────────────────────────────────────────────────────
