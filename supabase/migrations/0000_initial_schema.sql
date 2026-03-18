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

  -- Computed cross-assessment scores persisted so they survive page refresh (fix #5)
  global_scores JSONB,

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
-- Admin full-access policies: allow any user whose email is in the admin list.
-- Relies on a helper function defined below.
CREATE POLICY "Admins can read all beta feedback" ON beta_feedback FOR SELECT USING (is_admin_email(auth.jwt() ->> 'email'));
CREATE POLICY "Admins can update beta feedback" ON beta_feedback FOR UPDATE USING (is_admin_email(auth.jwt() ->> 'email'));

-- Admin policies for question_reports
CREATE POLICY "Admins can read all question reports" ON question_reports FOR SELECT USING (is_admin_email(auth.jwt() ->> 'email'));
CREATE POLICY "Admins can update question reports" ON question_reports FOR UPDATE USING (is_admin_email(auth.jwt() ->> 'email'));

-- ADMIN HELPER FUNCTION
-- Lists authorised admin emails. Update this list before deploying.
CREATE OR REPLACE FUNCTION is_admin_email(email TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN email = ANY(ARRAY[
    'clebronrivera@icloud.com'
    -- Add additional admin emails here
  ]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STUDY PLANS TABLE (fix #2)
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_document JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id, created_at DESC);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own study plans" ON study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own study plans" ON study_plans FOR SELECT USING (auth.uid() = user_id);

-- QUESTIONS TABLE (fix #3)
-- Stores the canonical question bank synced from the bundled JSON.
-- The app falls back to the local JSON if this table is empty or missing rows.
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  item_format TEXT,
  is_multi_select BOOLEAN DEFAULT false,
  correct_answer_count INTEGER DEFAULT 1,
  option_count_expected INTEGER DEFAULT 4,
  has_case_vignette BOOLEAN DEFAULT false,
  case_text TEXT,
  question_stem TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answers JSONB DEFAULT '[]'::jsonb,
  correct_explanation TEXT,
  core_concept TEXT,
  content_limit TEXT,
  domain INTEGER,
  domain_name TEXT,
  skill_id TEXT,
  skill_name TEXT,
  cognitive_complexity TEXT,
  complexity_rationale TEXT,
  rationale TEXT,
  distractors JSONB DEFAULT '[]'::jsonb,
  is_foundational BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_skill ON questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read questions" ON questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (is_admin_email(auth.jwt() ->> 'email'));

-- SKILLS TABLE (fix #3)
-- Stores skill metadata synced from the content CSV / knowledge base.
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain_id TEXT,
  concept_label TEXT,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  prerequisite_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read skills" ON skills FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage skills" ON skills FOR ALL USING (is_admin_email(auth.jwt() ->> 'email'));
