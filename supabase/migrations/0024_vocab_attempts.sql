-- 0024_vocab_attempts.sql
-- Vocabulary Fluency Drill — raw attempt events + glossary miss alerting.
--
-- Adds:
--   1. vocab_attempts            — one row per drilled (term × skill) attempt (Option B1 audit log)
--   2. user_glossary_terms.miss_count — drives the glossary letter-group alert badge
--   3. increment_glossary_miss() — atomic upsert-and-bump used when a drill term is missed
--
-- Additive only. Does NOT touch the responses.assessment_type enum (drill events
-- live here, not in `responses`, so the closed enum is untouched by design).

-- ─── 1. Raw attempt events ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  term        TEXT        NOT NULL,
  skill_id    TEXT,                                  -- nullable: a term may map to 0 skills
  direction   TEXT        NOT NULL,                  -- 'term' (def→term) | 'definition' (term→def)
  is_correct  BOOLEAN     NOT NULL,
  timed_out   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vocab_attempts_user        ON vocab_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_attempts_user_skill  ON vocab_attempts (user_id, skill_id);

ALTER TABLE vocab_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_attempts owner select" ON vocab_attempts;
CREATE POLICY "vocab_attempts owner select" ON vocab_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_attempts owner insert" ON vocab_attempts;
CREATE POLICY "vocab_attempts owner insert" ON vocab_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── 2. Glossary miss-alert column ────────────────────────────────────────────
ALTER TABLE user_glossary_terms
  ADD COLUMN IF NOT EXISTS miss_count INT NOT NULL DEFAULT 0;

-- ─── 3. Atomic upsert-and-bump for a missed drill term ────────────────────────
-- Adds the term to the user's glossary if absent, otherwise increments its
-- miss_count. Re-flags the term as unrevealed so it re-surfaces for review.
-- Returns the new miss_count. Mirrors the increment_wrong_count pattern (0013).
CREATE OR REPLACE FUNCTION increment_glossary_miss(
  p_user_id  UUID,
  p_term     TEXT,
  p_skill_id TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  -- Owner guard: callers may only touch their own rows.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'increment_glossary_miss: user mismatch';
  END IF;

  INSERT INTO user_glossary_terms (user_id, term, added_from_skill_id, miss_count, revealed)
  VALUES (p_user_id, p_term, p_skill_id, 1, false)
  ON CONFLICT (user_id, term)
  DO UPDATE SET
    miss_count = user_glossary_terms.miss_count + 1,
    revealed   = false,
    updated_at = now()
  RETURNING miss_count INTO v_count;

  RETURN v_count;
END;
$$;
