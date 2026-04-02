-- Migration: Add adaptive diagnostic audit columns to responses table
-- These columns track whether a question was a follow-up (adaptive),
-- its cognitive complexity (Recall/Application), and which question
-- number it was for that skill (1st, 2nd, or 3rd).

ALTER TABLE responses ADD COLUMN IF NOT EXISTS is_followup BOOLEAN DEFAULT false;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS cognitive_complexity TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS skill_question_index INTEGER;
