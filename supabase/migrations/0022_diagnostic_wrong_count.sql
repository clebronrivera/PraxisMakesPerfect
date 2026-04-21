-- Migration: 0022_diagnostic_wrong_count
--
-- D3 lighter variant — diagnostic misses count toward the Redemption quarantine
-- threshold without triggering quarantine on their own.
--
-- Adds a sibling RPC to increment_wrong_count (from 0013) that:
--   • Creates or increments practice_missed_questions.wrong_count on a diagnostic miss
--   • Does NOT flip in_redemption, regardless of wrong_count value
--   • Preserves in_redemption=true if a prior practice/hint event already set it
--
-- Rationale:
-- Diagnostic-only misses should contribute one data point toward the 3-miss
-- threshold, so a subsequent practice miss on the same question can cross it.
-- This avoids flooding the quarantine bank with every wrong diagnostic answer
-- (45+ misses per new user otherwise) while preserving the repeat-offender
-- signal the Redemption system is designed for.

CREATE OR REPLACE FUNCTION record_diagnostic_miss(
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
    SET wrong_count = practice_missed_questions.wrong_count + 1
        -- in_redemption intentionally NOT updated. Diagnostic misses increment
        -- the counter but cannot quarantine on their own. A later practice
        -- miss (via increment_wrong_count) will flip in_redemption when the
        -- 3-miss threshold is crossed.
  RETURNING practice_missed_questions.wrong_count, practice_missed_questions.in_redemption
  INTO v_count, v_in_redemption;

  RETURN QUERY SELECT v_count, v_in_redemption;
END;
$$;
