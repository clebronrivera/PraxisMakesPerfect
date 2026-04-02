-- Migration: Add baseline_snapshot column to user_progress
-- Stores a JSONB snapshot of skillScores at the moment the adaptive diagnostic completes.
-- Used for pre/post comparison in the Progress tab.

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS baseline_snapshot JSONB;
