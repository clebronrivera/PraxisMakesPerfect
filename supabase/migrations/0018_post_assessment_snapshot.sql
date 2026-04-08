-- Migration: Post-assessment snapshot columns
-- Stores the user_progress state at the moment a post-assessment completes,
-- enabling the readiness banner + before/after comparison on DashboardHome.
-- The post-assessment is triggered when demonstratingCount >= READINESS_TARGET (32)
-- AND post_assessment_snapshot IS NULL — see docs/WORKFLOW_GROUNDING.md section 3.10.
-- Snapshot is written exactly once per user (same one-shot pattern as baseline_snapshot
-- in migration 0016). Read-only for admin views — never overwrite once set.

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS post_assessment_snapshot JSONB;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS post_assessment_completed_at TIMESTAMPTZ;
