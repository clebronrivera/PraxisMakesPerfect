-- Migration: Post-assessment snapshot columns
-- Stores the user_progress state at the moment a post-assessment completes,
-- enabling the readiness banner + before/after comparison on DashboardHome.
-- The post-assessment is triggered when demonstratingCount >= READINESS_TARGET (32)
-- AND post_assessment_snapshot IS NULL — see docs/WORKFLOW_GROUNDING.md section 3.10.
-- Snapshot is written exactly once per user (same one-shot pattern as baseline_snapshot
-- in migration 0016). Read-only for admin views — never overwrite once set.
--
-- Originally authored on branch audit-fixes-april-2026 as 0018_post_assessment_snapshot.sql
-- (commit 0667ec8, 2026-04-08). Main's 0018 slot was later taken by
-- 0018_remote_history_placeholder.sql (synced from remote), so this content is
-- resurrected at the next free slot (0021) on 2026-04-16.
--
-- Idempotent: both ADD COLUMN statements use IF NOT EXISTS.

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS post_assessment_snapshot JSONB;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS post_assessment_completed_at TIMESTAMPTZ;
