-- Add consent tracking column for privacy policy / terms of service acceptance.
-- Stores the ISO timestamp when the user accepted, NULL if not yet accepted.
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
