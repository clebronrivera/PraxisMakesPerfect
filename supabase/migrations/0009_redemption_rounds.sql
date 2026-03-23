-- Migration: 0009_redemption_rounds
-- Adds the Redemption Rounds feature:
--   1. practice_missed_questions  — bank of questions the user got wrong in practice
--   2. redemption_sessions        — history of completed redemption rounds (for high score)
--   3. Three new columns on user_progress for credit tracking

-- ─── practice_missed_questions ───────────────────────────────────────────────
-- One row per user per question. Upserted on every wrong answer in practice.
-- correct_count tracks cumulative correct answers during redemption rounds
-- (Sure + correct = 1 needed; Unsure/Guess + correct = 3 needed).

CREATE TABLE IF NOT EXISTS practice_missed_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id   TEXT        NOT NULL,
  skill_id      TEXT,
  missed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  correct_count INT         NOT NULL DEFAULT 0,
  redeemed      BOOLEAN     NOT NULL DEFAULT false,
  redeemed_at   TIMESTAMPTZ,
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_missed_questions_user_id
  ON practice_missed_questions (user_id);

CREATE INDEX IF NOT EXISTS idx_practice_missed_questions_unredeemed
  ON practice_missed_questions (user_id, redeemed)
  WHERE redeemed = false;

ALTER TABLE practice_missed_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missed questions"
  ON practice_missed_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missed questions"
  ON practice_missed_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missed questions"
  ON practice_missed_questions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── redemption_sessions ─────────────────────────────────────────────────────
-- One row per completed redemption round. Used to derive personal best score.

CREATE TABLE IF NOT EXISTS redemption_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  played_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  questions_attempted INT         NOT NULL DEFAULT 0,
  questions_correct   INT         NOT NULL DEFAULT 0,
  score_pct           NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_redemption_sessions_user_id
  ON redemption_sessions (user_id);

ALTER TABLE redemption_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemption sessions"
  ON redemption_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemption sessions"
  ON redemption_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── user_progress additions ─────────────────────────────────────────────────
-- redemption_credits              — credits available (1 per 20 practice answers)
-- practice_questions_since_credit — progress toward next credit (resets to 0 at 20)
-- redemption_high_score           — personal best score across all rounds

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS redemption_credits              INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_questions_since_credit INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redemption_high_score           NUMERIC(5,2) NOT NULL DEFAULT 0;
