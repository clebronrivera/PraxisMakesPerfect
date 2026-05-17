-- Admin one-time operation: delete all study_plans for Carlos Rivera
-- Run in Supabase Dashboard → SQL Editor (uses service role, bypasses RLS)
-- User: puppyheavenllc@gmail.com

DELETE FROM study_plans
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'puppyheavenllc@gmail.com'
);
