-- 0025_account_deletion_request.sql
-- Self-service "Delete my account" — request-deletion model.
--
-- The user flags their own row (RLS owner-update) from the Account page; an admin
-- then purges flagged accounts via the existing admin-delete-user path. (CLAUDE.md:
-- the Supabase auth-user delete API is unavailable with the current key format, so a
-- direct self-delete of the auth login isn't wired — this records the request.)
--
-- Additive only. Admin triage query: SELECT ... WHERE deletion_requested_at IS NOT NULL.

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_progress_deletion_requested
  ON user_progress (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;
