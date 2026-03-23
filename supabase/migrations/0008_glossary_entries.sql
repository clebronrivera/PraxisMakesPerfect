-- Migration: 0008_glossary_entries
-- Creates user_glossary_terms table for the Glossary feature.
-- Each row tracks one vocabulary term for one user, including their written
-- definition and whether the official definition has been permanently revealed.

CREATE TABLE IF NOT EXISTS user_glossary_terms (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  term              TEXT        NOT NULL,
  user_definition   TEXT,
  revealed          BOOLEAN     NOT NULL DEFAULT false,
  revealed_at       TIMESTAMPTZ,
  added_from_skill_id TEXT,          -- which skill triggered this term being added
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, term)
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_user_glossary_terms_user_id
  ON user_glossary_terms (user_id);

-- Updated_at auto-maintenance
CREATE OR REPLACE FUNCTION update_user_glossary_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_glossary_terms_updated_at
  BEFORE UPDATE ON user_glossary_terms
  FOR EACH ROW EXECUTE FUNCTION update_user_glossary_terms_updated_at();

-- Row-level security: users can only see/modify their own rows
ALTER TABLE user_glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own glossary terms"
  ON user_glossary_terms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own glossary terms"
  ON user_glossary_terms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own glossary terms"
  ON user_glossary_terms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own glossary terms"
  ON user_glossary_terms FOR DELETE
  USING (auth.uid() = user_id);
