-- Migration: Add extended user profile fields to user_progress
-- Captures account role, program details, exam info, and study preferences

ALTER TABLE user_progress
  -- ── Account role ──────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS account_role TEXT,
  -- 'graduate_student' | 'certification_only' | 'other'

  -- ── Graduate student fields ───────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS preferred_display_name TEXT,
  ADD COLUMN IF NOT EXISTS university TEXT,
  ADD COLUMN IF NOT EXISTS program_type TEXT,
  -- 'eds' | 'phd' | 'ma' | 'other'
  ADD COLUMN IF NOT EXISTS program_state TEXT,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT,
  -- 'on_campus' | 'hybrid' | 'online'
  ADD COLUMN IF NOT EXISTS training_stage TEXT,
  -- 'early_program' | 'mid_program' | 'approaching_internship' | 'in_internship'

  -- ── Certification-only fields ─────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS certification_state TEXT,
  -- "current_role" must be quoted: CURRENT_ROLE is a reserved word in PostgreSQL
  ADD COLUMN IF NOT EXISTS "current_role" TEXT,
  -- 'teacher' | 'school_counselor' | 'psychologist_trainee' | 'other'
  ADD COLUMN IF NOT EXISTS certification_route TEXT,
  -- 'initial' | 'add_on' | 'reciprocity' | 'other'

  -- ── Exam fields ────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS primary_exam TEXT,
  -- 'praxis_5403' | 'ftce_school_psychologist' | 'other'
  ADD COLUMN IF NOT EXISTS planned_test_date DATE,
  ADD COLUMN IF NOT EXISTS retake_status TEXT,
  -- 'first_attempt' | 'retake'
  ADD COLUMN IF NOT EXISTS number_of_prior_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS target_score INTEGER,

  -- ── Goals + research fields ────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS study_goals JSONB DEFAULT '[]'::jsonb,
  -- array: 'pass_exam' | 'improve_weak_domains' | 'timed_practice' | 'build_confidence'
  ADD COLUMN IF NOT EXISTS weekly_study_hours TEXT,
  -- '1_2' | '3_5' | '6_10' | '10_plus'
  ADD COLUMN IF NOT EXISTS biggest_challenge JSONB DEFAULT '[]'::jsonb,
  -- array: 'test_anxiety' | 'content_gaps' | 'time_management' | 'question_quality' | 'no_study_plan' | 'motivation'
  ADD COLUMN IF NOT EXISTS used_other_resources BOOLEAN,
  ADD COLUMN IF NOT EXISTS other_resources_list JSONB DEFAULT '[]'::jsonb,
  -- array: 'ets_study_guide' | 'youtube' | 'flashcards' | 'another_app' | 'private_tutor' | 'other'
  ADD COLUMN IF NOT EXISTS what_was_missing TEXT,

  -- ── Onboarding completion flag ─────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
