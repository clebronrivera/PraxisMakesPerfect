-- Persist adaptive diagnostic state to the DB so it survives localStorage clears
-- and enables true cross-device resumability.
--
-- adaptive_diagnostic_complete  — mirrors the in-memory profile.adaptiveDiagnosticComplete flag
-- diagnostic_question_ids       — ordered list of question IDs served in the active/completed diagnostic
-- last_diagnostic_session_id    — UUID of the most recent adaptive diagnostic session

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS adaptive_diagnostic_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS diagnostic_question_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_diagnostic_session_id TEXT;
