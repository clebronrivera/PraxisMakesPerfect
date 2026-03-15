-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS & PROGRESS TABLE
-- Replaces Firestore 'users/{uid}'
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  
  -- Auth Metrics
  login_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  
  -- Progress Flags
  screener_complete BOOLEAN DEFAULT false,
  diagnostic_complete BOOLEAN DEFAULT false,
  full_assessment_complete BOOLEAN DEFAULT false,
  
  -- Cached Arrays/Objects (stored as JSONB for flexibility)
  domain_scores JSONB DEFAULT '{}'::jsonb,
  skill_scores JSONB DEFAULT '{}'::jsonb,
  weakest_domains JSONB DEFAULT '[]'::jsonb,
  factual_gaps JSONB DEFAULT '[]'::jsonb,
  error_patterns JSONB DEFAULT '[]'::jsonb,
  flagged_questions JSONB DEFAULT '{}'::jsonb,
  distractor_errors JSONB DEFAULT '{}'::jsonb,
  skill_distractor_errors JSONB DEFAULT '{}'::jsonb,
  
  screener_results JSONB DEFAULT '{}'::jsonb,
  
  -- History tracking (JSONB arrays of strings)
  pre_assessment_question_ids JSONB DEFAULT '[]'::jsonb,
  full_assessment_question_ids JSONB DEFAULT '[]'::jsonb,
  recent_practice_question_ids JSONB DEFAULT '[]'::jsonb,
  screener_item_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Pointers/Counts
  total_questions_seen INTEGER DEFAULT 0,
  practice_response_count INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_session JSONB,
  migration_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- RESPONSES TABLE
-- Replaces Firestore 'users/{uid}/responses/{id}'
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  skill_id TEXT,
  domain_id INTEGER,
  domain_ids JSONB DEFAULT '[]'::jsonb,
  assessment_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence TEXT,
  time_spent INTEGER,
  time_on_item_seconds INTEGER,
  selected_answers JSONB DEFAULT '[]'::jsonb,
  correct_answers JSONB DEFAULT '[]'::jsonb,
  distractor_pattern_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying a user's session
CREATE INDEX IF NOT EXISTS idx_responses_user_session ON responses(user_id, session_id);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert and read their own responses" ON responses FOR ALL USING (auth.uid() = user_id);

-- PRACTICE RESPONSES TABLE
-- Accommodates the separate 'practiceResponses' subcollection
CREATE TABLE IF NOT EXISTS practice_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  skill_id TEXT,
  domain_id INTEGER,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  confidence TEXT,
  time_on_item_seconds INTEGER,
  shuffled_order JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_user_session ON practice_responses(user_id, session_id);

ALTER TABLE practice_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert and read their own practice responses" ON practice_responses FOR ALL USING (auth.uid() = user_id);

-- QUESTION REPORTS TABLE
-- Replaces Firestore 'questionReports'
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question_id TEXT NOT NULL,
  user_email TEXT,
  user_display_name TEXT,
  assessment_type TEXT,
  targets JSONB DEFAULT '[]'::jsonb,
  issue_types JSONB DEFAULT '[]'::jsonb,
  severity TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  question_snapshot JSONB,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert feedback" ON question_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own feedback" ON question_reports FOR SELECT USING (auth.uid() = user_id);
-- Note: Admin read/update policy would typically check an admin flag or email, simplified here.

-- BETA FEEDBACK TABLE
-- Replaces Firestore 'betaFeedback'
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_display_name TEXT,
  category TEXT NOT NULL,
  context_type TEXT,
  feature_area TEXT,
  message TEXT NOT NULL,
  page TEXT,
  session_id TEXT,
  app_version TEXT,
  browser_info TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert beta feedback" ON beta_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own beta feedback" ON beta_feedback FOR SELECT USING (auth.uid() = user_id);

