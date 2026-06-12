-- Track whether a user has completed the third-assessment (retake/reassessment).
-- Set to TRUE in App.tsx handleRetakeComplete after the reassessment session ends.
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS retake_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS retake_completed_at TIMESTAMPTZ;
