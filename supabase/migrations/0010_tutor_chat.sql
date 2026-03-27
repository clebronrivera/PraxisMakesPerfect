-- Migration: 0010_tutor_chat
-- Adds AI Tutor Chat feature:
--   1. chat_sessions — one row per conversation
--   2. chat_messages — all messages in all sessions

-- ─── chat_sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title         TEXT,                -- auto-set from first user message (first 60 chars)
  session_type  TEXT        NOT NULL CHECK (session_type IN ('page-tutor', 'floating')),
  message_count INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB                -- model, token counts, latency, prompt_version, etc.
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON chat_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
  ON chat_sessions (user_id, updated_at DESC);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── chat_messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID        NOT NULL REFERENCES chat_sessions ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role              TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content           TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Intent classification (persisted for analytics + debugging)
  assistant_intent  TEXT,           -- 'quiz' | 'vocabulary' | 'weak-areas' | 'app-guide' | 'general'

  -- Quiz fields (assistant messages only)
  quiz_question_id  TEXT,           -- UNIQUEID from questions.json
  quiz_skill_id     TEXT,
  quiz_answered     BOOLEAN,

  -- Artifact fields (assistant messages only)
  artifact_type     TEXT,           -- 'vocabulary-list' | 'weak-areas-summary' | null
  artifact_payload  JSONB,          -- structured content for rendering + download

  -- Context snapshot (floating widget: what page/question user was viewing)
  page_context      JSONB,          -- { page, questionId, skillId }

  -- Extensible metadata
  metadata          JSONB           -- prompt_version, model, tokens, latency_ms
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON chat_messages (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_quiz_question
  ON chat_messages (quiz_question_id)
  WHERE quiz_question_id IS NOT NULL;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
