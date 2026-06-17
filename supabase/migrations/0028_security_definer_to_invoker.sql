-- 0028_security_definer_to_invoker.sql
-- Flip four needlessly-SECURITY DEFINER functions to SECURITY INVOKER.
-- Clears anon_/authenticated_security_definer_function_executable lints and
-- closes the increment_wrong_count / record_diagnostic_miss IDOR (RLS now
-- enforces auth.uid() = user_id on writes). search_path GUC from 0027 is
-- independent of the security mode and remains in effect. No body/signature
-- change. Verified safe against live grants + owner RLS policies.

ALTER FUNCTION public.is_admin_email(text)                          SECURITY INVOKER;
ALTER FUNCTION public.increment_glossary_miss(uuid, text, text)     SECURITY INVOKER;
ALTER FUNCTION public.increment_wrong_count(uuid, text, text)       SECURITY INVOKER;
ALTER FUNCTION public.record_diagnostic_miss(uuid, text, text)      SECURITY INVOKER;
