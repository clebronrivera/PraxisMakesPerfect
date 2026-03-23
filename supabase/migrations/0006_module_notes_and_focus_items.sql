-- Migration 0006: Module Notes & Focus Items
--
-- Adds three tables for the Study Center sidebar:
--   • module_notes       — user-typed notes per module
--   • focus_item_checks  — checkoff state for study plan focus items
--   • focus_item_seen_at — tracks when user last viewed focus items (for "New" badges)
--
-- Apply: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table A: module_notes
-- One row per user per module. Stores free-text notes the user writes
-- while studying a module in the Learning Path.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS module_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id   TEXT        NOT NULL,
  skill_id    TEXT        NOT NULL,
  note_text   TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT mn_user_module_unique UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_mn_user ON module_notes(user_id);

ALTER TABLE module_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own module notes"
  ON module_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module notes"
  ON module_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module notes"
  ON module_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table B: focus_item_checks
-- Tracks which study-plan-generated focus items a user has checked off.
-- item_key is the term/misconception/trap text — stable across renders.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS focus_item_checks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_plan_id  UUID        NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  item_type      TEXT        NOT NULL,
  item_key       TEXT        NOT NULL,
  checked        BOOLEAN     NOT NULL DEFAULT false,
  checked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fic_item_type_check CHECK (
    item_type IN ('vocabulary', 'misconception', 'trap')
  ),
  CONSTRAINT fic_user_plan_item_unique UNIQUE (user_id, study_plan_id, item_type, item_key)
);

CREATE INDEX IF NOT EXISTS idx_fic_user_plan ON focus_item_checks(user_id, study_plan_id);

ALTER TABLE focus_item_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own focus item checks"
  ON focus_item_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus item checks"
  ON focus_item_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus item checks"
  ON focus_item_checks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table C: focus_item_seen_at
-- Stores the last time a user opened the Focus Items panel for a given skill.
-- Used to compute "New" badges: items from plans created after last_seen_at.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS focus_item_seen_at (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id     TEXT        NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fisa_user_skill_unique UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_fisa_user ON focus_item_seen_at(user_id);

ALTER TABLE focus_item_seen_at ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own focus item seen timestamps"
  ON focus_item_seen_at FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus item seen timestamps"
  ON focus_item_seen_at FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus item seen timestamps"
  ON focus_item_seen_at FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
