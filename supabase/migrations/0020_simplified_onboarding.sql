-- Migration: Simplified onboarding fields
-- Adds the 6 fields collected by the new single-page onboarding flow:
-- first_name, last_name, zip_code, school_attending, purpose, how_did_you_hear.
-- Old columns (account_role, full_name, study_goals, university, program_state, etc.)
-- are preserved for existing users — do not drop them.
--
-- Originally authored on branch audit-fixes-april-2026 as 0017_simplified_onboarding.sql
-- (commit 0667ec8, 2026-04-08). Main's 0017 slot was later taken by
-- 0017_remote_history_placeholder.sql (synced from remote), so this content is
-- resurrected at the next free slot (0020) on 2026-04-16.
--
-- Idempotent: every ADD COLUMN uses IF NOT EXISTS; the backfill UPDATE is gated
-- on first_name IS NULL so it is safe to re-run.

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS school_attending TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT;

-- Backfill: derive first_name + last_name from full_name for existing users.
-- Uses regex split so single-name cases (e.g. "Madonna") set last_name to NULL
-- and multi-name cases (e.g. "Mary Jane Watson") put everything after the first
-- space into last_name. Idempotent — only fires where first_name is still NULL.
UPDATE user_progress
SET
  first_name = (regexp_split_to_array(trim(full_name), '\s+'))[1],
  last_name = CASE
    WHEN array_length(regexp_split_to_array(trim(full_name), '\s+'), 1) > 1
    THEN array_to_string(
      (regexp_split_to_array(trim(full_name), '\s+'))[2:],
      ' '
    )
    ELSE NULL
  END
WHERE first_name IS NULL
  AND full_name IS NOT NULL
  AND length(trim(full_name)) > 0;
