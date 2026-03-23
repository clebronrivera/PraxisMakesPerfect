-- Migration 0007: Admin Read Policies
--
-- Fixes: Admin dashboard cannot see user data because user_progress, responses,
-- and learning-path tables have RLS enabled but no admin-read policies.
--
-- Also ensures the is_admin_email() helper function exists (it was defined in
-- migration 0000 but may not have been applied if the initial migration had
-- ordering issues).
--
-- Apply: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- Step 0: Ensure is_admin_email() function exists
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_admin_email(email TEXT) RETURNS BOOLEAN AS $$
BEGIN
  RETURN email = ANY(ARRAY[
    'clebronrivera@icloud.com'
    -- Add additional admin emails here
  ]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- user_progress — the main table the admin dashboard reads
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all user progress"
  ON user_progress FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- responses — individual question responses (needed for data review)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all responses"
  ON responses FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- learning_path_progress — module engagement data
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all learning path progress"
  ON learning_path_progress FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- module_visit_sessions — visit tracking data
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all module visit sessions"
  ON module_visit_sessions FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- section_interactions — section-level engagement data
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all section interactions"
  ON section_interactions FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- study_plans — AI-generated study plans
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all study plans"
  ON study_plans FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- module_notes — user notes (new from migration 0006)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "Admins can read all module notes"
  ON module_notes FOR SELECT
  USING (is_admin_email(auth.jwt() ->> 'email'));
