-- Migration 0005: Module Interaction Tracking
--
-- Adds granular tracking for user interactions with learning module content:
--   • module_visit_sessions  — one row per visit (open/close) of a module
--   • section_interactions   — per-section engagement within a visit
--   • ALTER learning_path_progress — aggregate interactive columns
--
-- Apply: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table A: module_visit_sessions
-- Tracks each time a user opens a module. Enables re-visit analysis,
-- per-visit duration, scroll depth, and source attribution.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS module_visit_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id         TEXT        NOT NULL,
  skill_id          TEXT        NOT NULL,
  visit_number      INTEGER     NOT NULL DEFAULT 1,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER     DEFAULT 0,
  scroll_depth_pct  FLOAT       DEFAULT 0,
  sections_visible  TEXT[]      DEFAULT '{}',
  source            TEXT        DEFAULT 'learning_path',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT mvs_scroll_depth_check CHECK (scroll_depth_pct >= 0 AND scroll_depth_pct <= 1),
  CONSTRAINT mvs_source_check CHECK (source IN ('learning_path', 'skill_help_drawer'))
);

CREATE INDEX IF NOT EXISTS idx_mvs_user_module ON module_visit_sessions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_mvs_user_skill  ON module_visit_sessions(user_id, skill_id);

ALTER TABLE module_visit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own visit sessions"
  ON module_visit_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visit sessions"
  ON module_visit_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visit sessions"
  ON module_visit_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table B: section_interactions
-- One row per section per visit. Tracks visibility, time in viewport,
-- and interactive exercise results.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS section_interactions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_session_id    UUID        REFERENCES module_visit_sessions(id) ON DELETE CASCADE,
  module_id           TEXT        NOT NULL,
  section_index       INTEGER     NOT NULL,
  section_type        TEXT        NOT NULL,
  interactive_type    TEXT,

  -- Engagement signals
  became_visible      BOOLEAN     DEFAULT false,
  visible_seconds     FLOAT       DEFAULT 0,

  -- Interactive exercise results (null for non-interactive sections)
  exercise_completed  BOOLEAN,
  exercise_score      FLOAT,
  exercise_attempts   INTEGER     DEFAULT 0,
  exercise_data       JSONB,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT si_section_type_check CHECK (
    section_type IN ('paragraph', 'anchor', 'list', 'comparison', 'interactive', 'visual')
  ),
  CONSTRAINT si_interactive_type_check CHECK (
    interactive_type IS NULL OR interactive_type IN (
      'scenario-sorter', 'drag-to-order', 'term-matcher', 'click-selector', 'card-flip'
    )
  ),
  CONSTRAINT si_score_range CHECK (exercise_score IS NULL OR (exercise_score >= 0 AND exercise_score <= 1)),
  CONSTRAINT si_visit_section_unique UNIQUE (visit_session_id, section_index)
);

CREATE INDEX IF NOT EXISTS idx_si_visit       ON section_interactions(visit_session_id);
CREATE INDEX IF NOT EXISTS idx_si_user_module ON section_interactions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_si_interactive ON section_interactions(user_id, section_type)
  WHERE section_type = 'interactive';

ALTER TABLE section_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own section interactions"
  ON section_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own section interactions"
  ON section_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own section interactions"
  ON section_interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table C: learning_path_progress (create if not exists, then add columns)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS learning_path_progress (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id                       TEXT        NOT NULL,
  skill_id                        TEXT        NOT NULL,
  status                          TEXT        NOT NULL DEFAULT 'not_started',
  progress_pct                    FLOAT       DEFAULT 0,
  visit_count                     INTEGER     DEFAULT 0,
  total_interactive_score         FLOAT,
  interactive_exercises_completed INTEGER     DEFAULT 0,
  interactive_exercises_total     INTEGER     DEFAULT 0,
  last_visited_at                 TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lpp_user_module_unique UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_lpp_user ON learning_path_progress(user_id);

ALTER TABLE learning_path_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own learning path progress"
  ON learning_path_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning path progress"
  ON learning_path_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning path progress"
  ON learning_path_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
