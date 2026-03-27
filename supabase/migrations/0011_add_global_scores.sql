-- Restore the global_scores column that was declared in the initial schema
-- but is missing from the live database.
-- Used by globalScoreCalculator.ts (lines 314, 329) and the admin-reset endpoint.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS global_scores JSONB;
