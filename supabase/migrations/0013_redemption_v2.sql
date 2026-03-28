-- Migration: 0013_redemption_v2
--
-- Upgrades the Redemption Rounds system:
--   1. Adds wrong_count — tracks total wrong answers per question across all sessions
--   2. Adds entry_reason — 'hint' or 'miss_threshold'
--   3. Adds in_redemption — single source of truth for quarantine status
--   4. Adds increment_wrong_count RPC — atomic wrong-count tracking with threshold check

-- ─── New columns ──────────────────────────────────────────────────────────────

ALTER TABLE practice_missed_questions
  ADD COLUMN IF NOT EXISTS wrong_count   INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_reason  TEXT,
  ADD COLUMN IF NOT EXISTS in_redemption BOOLEAN NOT NULL DEFAULT false;

-- ─── Backfill existing rows ──────────────────────────────────────────────────
-- Every historical row entered via at least one miss and was treated as
-- quarantined under the old system. Set them accordingly.
-- NOTE: backfilled wrong_count = 1 is approximate — do not treat as real
-- historical evidence for analytics.

UPDATE practice_missed_questions
  SET wrong_count    = 1,
      entry_reason   = 'miss_threshold',
      in_redemption  = true
  WHERE in_redemption = false
    AND redeemed = false;

-- Already-redeemed rows: set entry_reason for consistency but leave
-- in_redemption = false (they are cleared).
UPDATE practice_missed_questions
  SET wrong_count   = 1,
      entry_reason  = 'miss_threshold'
  WHERE redeemed = true
    AND entry_reason IS NULL;

-- ─── Atomic wrong-count increment function ───────────────────────────────────
-- Called from the client on every non-hint wrong answer.
-- Returns the post-upsert wrong_count and in_redemption so the client can
-- update its local blacklist Set without a second round-trip.
--
-- Behavior:
--   • First wrong: inserts row with wrong_count=1, in_redemption=false
--   • Second wrong: wrong_count=2, in_redemption=false
--   • Third wrong: wrong_count=3, in_redemption=true (quarantined)
--   • If already in_redemption (e.g. from hint), preserves true

CREATE OR REPLACE FUNCTION increment_wrong_count(
  p_user_id     UUID,
  p_question_id TEXT,
  p_skill_id    TEXT
) RETURNS TABLE(new_wrong_count INT, now_in_redemption BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count         INT;
  v_in_redemption BOOLEAN;
BEGIN
  INSERT INTO practice_missed_questions
    (user_id, question_id, skill_id, wrong_count, entry_reason, in_redemption)
  VALUES
    (p_user_id, p_question_id, p_skill_id, 1, 'miss_threshold', false)
  ON CONFLICT (user_id, question_id) DO UPDATE
    SET wrong_count   = practice_missed_questions.wrong_count + 1,
        in_redemption = CASE
          WHEN practice_missed_questions.in_redemption THEN true
          WHEN practice_missed_questions.wrong_count + 1 >= 3 THEN true
          ELSE false
        END
  RETURNING practice_missed_questions.wrong_count, practice_missed_questions.in_redemption
  INTO v_count, v_in_redemption;

  RETURN QUERY SELECT v_count, v_in_redemption;
END;
$$;
