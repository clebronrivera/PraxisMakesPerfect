-- 0027_harden_function_search_path.sql
--
-- Security hardening: pin an explicit, immutable search_path on every
-- SECURITY DEFINER function so it can't be hijacked via search_path injection.
-- Clears the Supabase advisor lint `function_search_path_mutable` for these five.
-- ALTER-only: no function body or signature is changed, so behavior is unchanged.
--
-- pg_catalog is always searched implicitly even when search_path = '', so
-- built-in types/operators, ARRAY[], now(), RAISE, and the NEW trigger record
-- resolve regardless. Functions whose bodies reference an unqualified public
-- table get `pg_catalog, public`; those touching no non-catalog objects get ''.
-- auth.uid()/auth.jwt() are already schema-qualified in every body.

ALTER FUNCTION public.is_admin_email(text)
  SET search_path = '';

ALTER FUNCTION public.update_user_glossary_terms_updated_at()
  SET search_path = '';

ALTER FUNCTION public.increment_glossary_miss(uuid, text, text)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.increment_wrong_count(uuid, text, text)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.record_diagnostic_miss(uuid, text, text)
  SET search_path = pg_catalog, public;
