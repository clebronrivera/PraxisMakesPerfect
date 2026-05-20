-- Migration: Add selected_answer TEXT column to responses table.
-- selected_answers JSONB already exists and is written on every response.
-- This TEXT column stores the first (or only) selected letter as a plain
-- string so distractor metadata can be resolved without JSONB array syntax.
-- For multi-select questions the value is comma-joined: e.g. "B,C".
-- Nullable for backward compatibility with existing rows.

ALTER TABLE responses ADD COLUMN IF NOT EXISTS selected_answer TEXT;
