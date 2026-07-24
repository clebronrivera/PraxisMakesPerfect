# PMP User Data Inventory — Concrete Schema Extraction

**Status:** Spec extraction — concrete schema snapshot for direct reuse, not a behavior-pattern abstraction.
**Audience:** Whoever writes the PMP → PASS data-migration script.
**Scope:** Every table, column, constraint, RLS policy, index, RPC, and trigger defined by `supabase/migrations/0000`–`0028` in PraxisMakesPerfect, read on 2026-07-11. Unlike sibling spec-extraction docs (e.g. `PMP_ADAPTIVE_ENGINE_MATH.md`), this one keeps PMP's real table/column names — it's meant to sit next to an actual migration script, not be re-abstracted into exam-agnostic terms first.

This is a **static read of the 29 migration files**, not a live database introspection — no live Supabase project was queried. Row counts, current sequence state, and any drift applied outside the migrations folder (dashboard edits, hotfixes) are not captured; see Hazard 7. Hazard 3 documents a case where the migration-file history and the live database have already disagreed once — diff this document against a live schema snapshot before trusting either blindly.

All tables live in `public`. All but `assessment_reset_archive` enforce per-row ownership via RLS keyed to `auth.uid() = user_id`. `questions` and `skills` are reference/content tables, not user data, included for completeness.

## Cross-cutting: the admin-access helper

`is_admin_email(email TEXT) RETURNS BOOLEAN` — defined `0000`, re-`CREATE OR REPLACE`'d identically in `0007` (no schema change). Hardcodes one allow-listed address in a Postgres array literal (email omitted here as PII). `SECURITY DEFINER` → search_path pinned to `''` (`0027`) → `SECURITY INVOKER` (`0028`, safe — touches no tables). Referenced as `USING (is_admin_email(auth.jwt() ->> 'email'))` in every admin-read policy below.

---

## 1. `user_progress` (0000; extended by 0001, 0002, 0009, 0011, 0012, 0016, 0019, 0020, 0021, 0025, 0026)

One row per user — the aggregate profile/progress record that replaced the Firestore `users/{uid}` document. PK doubles as the FK to `auth.users`.

| Column | Type | Null? | Default | Added |
|---|---|---|---|---|
| user_id | UUID | NOT NULL (PK) | — | 0000 |
| email | TEXT | NULL | — | 0000 |
| display_name | TEXT | NULL | — | 0000 |
| login_count | INTEGER | NULL | 0 | 0000 |
| last_login_at | TIMESTAMPTZ | NULL | — | 0000 |
| last_active_at | TIMESTAMPTZ | NULL | — | 0000 |
| screener_complete | BOOLEAN | NULL | false | 0000 |
| diagnostic_complete | BOOLEAN | NULL | false | 0000 |
| full_assessment_complete | BOOLEAN | NULL | false | 0000 |
| domain_scores | JSONB | NULL | `{}` | 0000 |
| skill_scores | JSONB | NULL | `{}` | 0000 |
| weakest_domains | JSONB | NULL | `[]` | 0000 |
| factual_gaps | JSONB | NULL | `[]` | 0000 |
| error_patterns | JSONB | NULL | `[]` | 0000 |
| flagged_questions | JSONB | NULL | `{}` | 0000 |
| distractor_errors | JSONB | NULL | `{}` | 0000 |
| skill_distractor_errors | JSONB | NULL | `{}` | 0000 |
| screener_results | JSONB | NULL | `{}` | 0000 |
| pre_assessment_question_ids | JSONB | NULL | `[]` | 0000 |
| full_assessment_question_ids | JSONB | NULL | `[]` | 0000 |
| recent_practice_question_ids | JSONB | NULL | `[]` | 0000 |
| screener_item_ids | JSONB | NULL | `[]` | 0000 |
| total_questions_seen | INTEGER | NULL | 0 | 0000 |
| practice_response_count | INTEGER | NULL | 0 | 0000 |
| streak | INTEGER | NULL | 0 | 0000 |
| last_session | JSONB | NULL | — | 0000 |
| migration_version | INTEGER | NULL | 1 | 0000 |
| global_scores | JSONB | NULL | — | 0000, re-added 0011 (Hazard 3) |
| created_at | TIMESTAMPTZ | NULL | NOW() | 0000 |
| updated_at | TIMESTAMPTZ | NULL | NOW() | 0000 (app-managed, no trigger) |
| last_full_assessment_session_id | TEXT | NULL | — | 0001 |
| last_screener_session_id | TEXT | NULL | — | 0001 |
| account_role | TEXT | NULL | — | 0002 |
| full_name | TEXT | NULL | — | 0002 |
| preferred_display_name | TEXT | NULL | — | 0002 |
| university | TEXT | NULL | — | 0002 |
| program_type | TEXT | NULL | — | 0002 |
| program_state | TEXT | NULL | — | 0002 |
| delivery_mode | TEXT | NULL | — | 0002 |
| training_stage | TEXT | NULL | — | 0002 |
| certification_state | TEXT | NULL | — | 0002 |
| `"current_role"` | TEXT | NULL | — | 0002 (quoted, reserved word) |
| certification_route | TEXT | NULL | — | 0002 |
| primary_exam | TEXT | NULL | — | 0002 |
| planned_test_date | DATE | NULL | — | 0002 |
| retake_status | TEXT | NULL | — | 0002 |
| number_of_prior_attempts | INTEGER | NULL | — | 0002 |
| target_score | INTEGER | NULL | — | 0002 |
| study_goals | JSONB | NULL | `[]` | 0002 |
| weekly_study_hours | TEXT | NULL | — | 0002 |
| biggest_challenge | JSONB | NULL | `[]` | 0002 |
| used_other_resources | BOOLEAN | NULL | — | 0002 |
| other_resources_list | JSONB | NULL | `[]` | 0002 |
| what_was_missing | TEXT | NULL | — | 0002 |
| onboarding_complete | BOOLEAN | NULL | false | 0002 |
| redemption_credits | INTEGER | NOT NULL | 0 | 0009 |
| practice_questions_since_credit | INTEGER | NOT NULL | 0 | 0009 |
| redemption_high_score | NUMERIC(5,2) | NOT NULL | 0 | 0009 |
| adaptive_diagnostic_complete | BOOLEAN | NOT NULL | FALSE | 0012 |
| diagnostic_question_ids | TEXT[] | NOT NULL | `{}` | 0012 |
| last_diagnostic_session_id | TEXT | NULL | — | 0012 |
| baseline_snapshot | JSONB | NULL | — | 0016 |
| consent_accepted_at | TIMESTAMPTZ | NULL | — | 0019 |
| first_name | TEXT | NULL | — | 0020 |
| last_name | TEXT | NULL | — | 0020 |
| zip_code | TEXT | NULL | — | 0020 |
| school_attending | TEXT | NULL | — | 0020 |
| purpose | TEXT | NULL | — | 0020 |
| how_did_you_hear | TEXT | NULL | — | 0020 |
| post_assessment_snapshot | JSONB | NULL | — | 0021 |
| post_assessment_completed_at | TIMESTAMPTZ | NULL | — | 0021 |
| deletion_requested_at | TIMESTAMPTZ | NULL | — | 0025 |
| retake_complete | BOOLEAN | NULL | FALSE | 0026 |
| retake_completed_at | TIMESTAMPTZ | NULL | — | 0026 |

FK: `user_id` → `auth.users(id)` ON DELETE CASCADE. Index: `idx_user_progress_deletion_requested`, partial on `(deletion_requested_at)` WHERE not null (0025). RLS: owner FOR ALL (0000); admin SELECT via `is_admin_email` (0007). No RPC/trigger targets this table.

---

## 2. `responses` (0000; extended 0015, 0023)

Core scoring event log — one row per screener/full-assessment/diagnostic question response.

| Column | Type | Null? | Default | Added |
|---|---|---|---|---|
| id | UUID | NOT NULL (PK) | `uuid_generate_v4()` | 0000 |
| user_id | UUID | NULL | — | 0000 |
| session_id | TEXT | NOT NULL | — | 0000 |
| question_id | TEXT | NOT NULL | — | 0000 |
| skill_id | TEXT | NULL | — | 0000 |
| domain_id | INTEGER | NULL | — | 0000 |
| domain_ids | JSONB | NULL | `[]` | 0000 |
| assessment_type | TEXT | NOT NULL | — | 0000 |
| is_correct | BOOLEAN | NOT NULL | — | 0000 |
| confidence | TEXT | NULL | — | 0000 |
| time_spent | INTEGER | NULL | — | 0000 |
| time_on_item_seconds | INTEGER | NULL | — | 0000 |
| selected_answers | JSONB | NULL | `[]` | 0000 |
| correct_answers | JSONB | NULL | `[]` | 0000 |
| distractor_pattern_id | TEXT | NULL | — | 0000 |
| created_at | TIMESTAMPTZ | NULL | NOW() | 0000 |
| is_followup | BOOLEAN | NULL | false | 0015 |
| cognitive_complexity | TEXT | NULL | — | 0015 |
| skill_question_index | INTEGER | NULL | — | 0015 |
| selected_answer | TEXT | NULL | — | 0023, plain-string letter, comma-joined for multi-select |

FK: `user_id` → `auth.users(id)` CASCADE. Index: `idx_responses_user_session(user_id, session_id)`. RLS: owner FOR ALL (0000); admin SELECT (0007).

---

## 3. `practice_responses` (0000)

Legacy free-practice log, separate from `responses` (mirrors old Firestore `practiceResponses`).

`id` UUID PK `uuid_generate_v4()`; `user_id` UUID null, FK CASCADE; `session_id` TEXT NOT NULL; `question_id` TEXT NOT NULL; `skill_id` TEXT null; `domain_id` INTEGER null; `selected_answer` TEXT null; `correct_answer` TEXT null; `is_correct` BOOLEAN NOT NULL; `confidence` TEXT null; `time_on_item_seconds` INTEGER null; `shuffled_order` JSONB null; `created_at` TIMESTAMPTZ default NOW().

FK user_id→auth.users(id) CASCADE. Index: `idx_practice_user_session(user_id, session_id)`. RLS: owner FOR ALL. No admin-read policy exists for this table (0007 covers seven others, skips this one).

---

## 4. `question_reports` (0000)

Per-question issue reports (admin "Question Reports" tab).

`id` UUID PK; `user_id` UUID null, FK SET NULL; `question_id` TEXT NOT NULL; `user_email` TEXT null; `user_display_name` TEXT null; `assessment_type` TEXT null; `targets` JSONB null default `[]`; `issue_types` JSONB null default `[]`; `severity` TEXT null; `notes` TEXT null; `status` TEXT null default `'open'`; `question_snapshot` JSONB null; `app_version` TEXT null; `created_at`/`updated_at` TIMESTAMPTZ null default NOW() (app-managed).

FK user_id→auth.users(id) SET NULL — denormalizes email/name so a report stays attributable after account deletion. RLS: insert own, select own, admin SELECT, admin UPDATE — all four defined directly in 0000.

---

## 5. `beta_feedback` (0000)

General in-app feedback (admin "Beta Feedback" tab).

`id` UUID PK; `user_id` UUID null, FK SET NULL; `user_email` TEXT; `user_display_name` TEXT; `category` TEXT NOT NULL; `context_type` TEXT; `feature_area` TEXT; `message` TEXT NOT NULL; `page` TEXT; `session_id` TEXT; `app_version` TEXT; `browser_info` TEXT; `status` TEXT default `'new'`; `created_at`/`updated_at` TIMESTAMPTZ default NOW().

FK user_id→auth.users(id) SET NULL. RLS: insert own, select own, admin SELECT, admin UPDATE — all in 0000.

---

## 6. `study_plans` (0000 **and** 0001 — see Hazard 4)

Latest AI-generated study plan per user; v1/v2 both live in `plan_document`, discriminated by `plan_document->>'schemaVersion'`.

`id` UUID PK `uuid_generate_v4()`; `user_id` UUID FK CASCADE — nullable per 0000, `NOT NULL` per 0001 (0000 runs first and wins, see Hazard 4); `plan_document` JSONB NOT NULL; `created_at`/`updated_at` TIMESTAMPTZ default NOW().

Index: `idx_study_plans_user(user_id, created_at DESC)`. RLS: insert/select own, defined identically twice (0000 + 0001, Hazard 4); admin SELECT added 0007. Downstream FK: `focus_item_checks.study_plan_id` → this table's `id`.

---

## 7. `questions` (0000) — content/reference table

Canonical question bank; app falls back to bundled JSON if empty or missing rows.

`id` TEXT PK; `item_format` TEXT; `is_multi_select` BOOLEAN default false; `correct_answer_count` INTEGER default 1; `option_count_expected` INTEGER default 4; `has_case_vignette` BOOLEAN default false; `case_text` TEXT; `question_stem` TEXT NOT NULL; `options` JSONB default `[]`; `correct_answers` JSONB default `[]`; `correct_explanation` TEXT; `core_concept` TEXT; `content_limit` TEXT; `domain` INTEGER; `domain_name` TEXT; `skill_id` TEXT; `skill_name` TEXT; `cognitive_complexity` TEXT; `complexity_rationale` TEXT; `rationale` TEXT; `distractors` JSONB default `[]`; `is_foundational` BOOLEAN default false; `created_at`/`updated_at` default NOW().

Indexes: `idx_questions_skill(skill_id)`, `idx_questions_domain(domain)`. RLS: authenticated SELECT; admin ALL. No FKs — `skill_id`/`domain` are unenforced references.

---

## 8. `skills` (0000) — content/reference table

Skill metadata (name, domain, prerequisites).

`id` TEXT PK; `name` TEXT NOT NULL; `domain_id` TEXT; `concept_label` TEXT; `prerequisites` JSONB default `[]`; `prerequisite_reasoning` TEXT; `created_at`/`updated_at` default NOW().

RLS: authenticated SELECT; admin ALL. No FKs.

---

## 9. `learning_path_progress` (0003 **and** 0005 — CONFIRMED double-definition, see Hazard 1)

Per-user, per-skill Learning Path progress. Both migrations `CREATE TABLE IF NOT EXISTS` with different shapes; 0003 runs first and wins.

0003 schema (what's actually live): `id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `skill_id` TEXT NOT NULL; `lesson_viewed` BOOLEAN NOT NULL default false; `time_spent_seconds` INTEGER NOT NULL default 0; `lesson_completed_at` TIMESTAMPTZ; `questions_submitted` BOOLEAN NOT NULL default false; `questions_correct`/`questions_total` INTEGER NOT NULL default 0; `accuracy` FLOAT (CHECK 0–1); `status` TEXT NOT NULL default `'not_started'` (CHECK IN not_started/emerging/approaching/demonstrating/mastered); `created_at`/`updated_at` NOT NULL default NOW(). UNIQUE(user_id, skill_id).

0005's inert columns (absent from the live table): `module_id` TEXT NOT NULL, `progress_pct` FLOAT, `visit_count` INTEGER, `total_interactive_score` FLOAT, `interactive_exercises_completed`/`total` INTEGER, `last_visited_at` TIMESTAMPTZ; UNIQUE(user_id, module_id); no CHECK on status.

Indexes: `idx_lpp_user_id` (0003), `idx_lpp_user` (0005) — both created, redundant. RLS: 6 total owner policies (3 per migration, differently named, functionally identical); admin SELECT added 0007.

---

## 10. `assessment_reset_archive` (0004)

Snapshot of `user_progress` + deleted `responses` rows, written by the admin `admin-reset-assessment` function before it wipes a user's screener/diagnostic data.

`id` UUID PK; `target_user_id` UUID FK SET NULL; `actor_email` TEXT NOT NULL; `scope` TEXT NOT NULL (CHECK IN screener/full_diagnostic); `created_at` TIMESTAMPTZ NOT NULL default NOW(); `user_progress_snapshot` JSONB NOT NULL default `{}`; `responses_archived` JSONB NOT NULL default `[]`; `response_count` INTEGER NOT NULL default 0.

Indexes: `idx_assessment_reset_archive_target(target_user_id, created_at DESC)`, `idx_assessment_reset_archive_created(created_at DESC)`. RLS: enabled, **zero policies** — deliberate; only the service-role key can read or write this table.

---

## 11. `module_visit_sessions` (0005)

One row per open/close visit of a Learning Path module.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `module_id`/`skill_id` TEXT NOT NULL; `visit_number` INTEGER NOT NULL default 1; `started_at` TIMESTAMPTZ NOT NULL default NOW(); `ended_at` TIMESTAMPTZ; `duration_seconds` INTEGER default 0; `scroll_depth_pct` FLOAT default 0 (CHECK 0–1); `sections_visible` TEXT[] default `{}`; `source` TEXT default `'learning_path'` (CHECK IN learning_path/skill_help_drawer); `created_at` TIMESTAMPTZ NOT NULL default NOW().

Indexes: `idx_mvs_user_module(user_id, module_id)`, `idx_mvs_user_skill(user_id, skill_id)`. RLS: owner SELECT/INSERT/UPDATE; admin SELECT (0007).

---

## 12. `section_interactions` (0005)

Per-section engagement within a module visit.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `visit_session_id` UUID null, FK CASCADE → `module_visit_sessions.id`; `module_id` TEXT NOT NULL; `section_index` INTEGER NOT NULL; `section_type` TEXT NOT NULL (CHECK IN paragraph/anchor/list/comparison/interactive/visual); `interactive_type` TEXT null (CHECK null or scenario-sorter/drag-to-order/term-matcher/click-selector/card-flip); `became_visible` BOOLEAN default false; `visible_seconds` FLOAT default 0; `exercise_completed` BOOLEAN null; `exercise_score` FLOAT null (CHECK 0–1); `exercise_attempts` INTEGER default 0; `exercise_data` JSONB null; `created_at`/`updated_at` NOT NULL default NOW(). UNIQUE(visit_session_id, section_index).

Indexes: `idx_si_visit(visit_session_id)`, `idx_si_user_module(user_id, module_id)`, `idx_si_interactive` (partial, section_type='interactive'). RLS: owner SELECT/INSERT/UPDATE; admin SELECT (0007).

---

## 13. `module_notes` (0006)

Free-text notes per module.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `module_id`/`skill_id` TEXT NOT NULL; `note_text` TEXT NOT NULL default `''`; `created_at`/`updated_at` NOT NULL default NOW(). UNIQUE(user_id, module_id).

Index: `idx_mn_user(user_id)`. RLS: owner SELECT/INSERT/UPDATE; admin SELECT (0007).

---

## 14. `focus_item_checks` (0006)

Checkoff state for study-plan-generated focus items.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `study_plan_id` UUID NOT NULL FK CASCADE → `study_plans.id`; `item_type` TEXT NOT NULL (CHECK IN vocabulary/misconception/trap); `item_key` TEXT NOT NULL; `checked` BOOLEAN NOT NULL default false; `checked_at` TIMESTAMPTZ; `created_at` TIMESTAMPTZ NOT NULL default NOW(). UNIQUE(user_id, study_plan_id, item_type, item_key).

Index: `idx_fic_user_plan(user_id, study_plan_id)`. RLS: owner SELECT/INSERT/UPDATE. No admin-read policy.

---

## 15. `focus_item_seen_at` (0006)

Last time a user opened the Focus Items panel per skill (drives "New" badges).

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `skill_id` TEXT NOT NULL; `last_seen_at` TIMESTAMPTZ NOT NULL default NOW(); `created_at` TIMESTAMPTZ NOT NULL default NOW(). UNIQUE(user_id, skill_id).

Index: `idx_fisa_user(user_id)`. RLS: owner SELECT/INSERT/UPDATE. No admin-read policy.

---

## 16. `user_glossary_terms` (0008; extended 0024)

Per-(user, term) glossary — user's own definition, reveal state, drill-miss frequency.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `term` TEXT NOT NULL; `user_definition` TEXT null; `revealed` BOOLEAN NOT NULL default false; `revealed_at` TIMESTAMPTZ null; `added_from_skill_id` TEXT null; `created_at`/`updated_at` NOT NULL default now(); `miss_count` INTEGER NOT NULL default 0 (0024). UNIQUE(user_id, term).

Index: `idx_user_glossary_terms_user_id(user_id)`. RLS: owner SELECT/INSERT/UPDATE/**DELETE** — the only table with an owner DELETE policy.

Trigger `user_glossary_terms_updated_at` BEFORE UPDATE → `update_user_glossary_terms_updated_at()` (0008), sets `NEW.updated_at = now()` — the only DB-enforced `updated_at` trigger in the schema (Hazard 8).

RPC `increment_glossary_miss(p_user_id, p_term, p_skill_id) RETURNS INT` (0024) — upserts, increments `miss_count`, force-clears `revealed`, raises if `p_user_id ≠ auth.uid()`. `SECURITY DEFINER` → search_path pinned `pg_catalog,public` (0027) → `SECURITY INVOKER` (0028).

---

## 17. `practice_missed_questions` (0009; extended 0013)

Redemption Rounds quarantine bank — one row per (user, question) ever missed in practice.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `question_id` TEXT NOT NULL; `skill_id` TEXT null; `missed_at` TIMESTAMPTZ NOT NULL default now(); `correct_count` INTEGER NOT NULL default 0; `redeemed` BOOLEAN NOT NULL default false; `redeemed_at` TIMESTAMPTZ null; `wrong_count` INTEGER NOT NULL default 0 (0013); `entry_reason` TEXT null (`'hint'|'miss_threshold'`, 0013); `in_redemption` BOOLEAN NOT NULL default false (0013). UNIQUE(user_id, question_id).

Indexes: `idx_practice_missed_questions_user_id(user_id)`, `idx_practice_missed_questions_unredeemed` (partial, redeemed=false). RLS: owner SELECT/INSERT/UPDATE.

RPCs: `increment_wrong_count(p_user_id, p_question_id, p_skill_id) RETURNS TABLE(new_wrong_count INT, now_in_redemption BOOLEAN)` (0013) — quarantines at wrong_count≥3, preserves true once set. `record_diagnostic_miss(...)` (0022), same signature — increments the counter but never itself sets `in_redemption` true. Both: `SECURITY DEFINER` → search_path pinned `pg_catalog,public` (0027) → `SECURITY INVOKER` (0028), closing an IDOR since ownership is now enforced by RLS on the write.

---

## 18. `redemption_sessions` (0009)

One row per completed Redemption Round; feeds personal-best score.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `played_at` TIMESTAMPTZ NOT NULL default now(); `questions_attempted`/`questions_correct` INTEGER NOT NULL default 0; `score_pct` NUMERIC(5,2) NOT NULL default 0.

Index: `idx_redemption_sessions_user_id(user_id)`. RLS: owner SELECT/INSERT only — no UPDATE/DELETE, rounds are write-once.

---

## 19. `chat_sessions` (0010)

One row per AI Tutor conversation. CLAUDE.md's migration index names this feature's tables `tutor_sessions`/`tutor_messages`/`tutor_artifacts`; the actual tables are `chat_sessions`/`chat_messages`, no separate artifacts table (Hazard 5).

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `title` TEXT null; `session_type` TEXT NOT NULL (CHECK IN page-tutor/floating); `message_count` INTEGER NOT NULL default 0; `created_at`/`updated_at` NOT NULL default now(); `metadata` JSONB null.

Indexes: `idx_chat_sessions_user_id(user_id)`, `idx_chat_sessions_user_updated(user_id, updated_at DESC)`. RLS: owner SELECT/INSERT/UPDATE.

---

## 20. `chat_messages` (0010)

Every message in every session, plus inline quiz/artifact metadata.

`id` UUID PK; `session_id` UUID NOT NULL FK CASCADE → `chat_sessions`; `user_id` UUID NOT NULL FK CASCADE; `role` TEXT NOT NULL (CHECK IN user/assistant); `content` TEXT NOT NULL; `created_at` TIMESTAMPTZ NOT NULL default now(); `assistant_intent` TEXT null (`quiz`/`vocabulary`/`weak-areas`/`app-guide`/`general`); `quiz_question_id`/`quiz_skill_id` TEXT null; `quiz_answered` BOOLEAN null; `artifact_type` TEXT null (`vocabulary-list`/`weak-areas-summary`/null); `artifact_payload`/`page_context`/`metadata` JSONB null.

Indexes: `idx_chat_messages_session_created(session_id, created_at)`, `idx_chat_messages_user_created(user_id, created_at)`, `idx_chat_messages_quiz_question` (partial, quiz_question_id not null). RLS: owner SELECT/INSERT/UPDATE.

---

## 21. `user_subscriptions` (0014, `public.user_subscriptions`)

Stripe subscription state per user (paywall).

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE, UNIQUE; `stripe_customer_id` TEXT null; `stripe_subscription_id` TEXT null, UNIQUE; `plan` TEXT NOT NULL default `'free'` (CHECK IN free/premium_monthly/premium_yearly); `status` TEXT NOT NULL default `'active'` (CHECK IN active/canceled/past_due/trialing/incomplete); `current_period_end` TIMESTAMPTZ null; `created_at`/`updated_at` NOT NULL default now().

Indexes: `idx_user_subscriptions_stripe_customer`, `idx_user_subscriptions_stripe_sub`. RLS: owner SELECT; **`"Service role can manage subscriptions" FOR ALL USING(true) WITH CHECK(true)`** — no `TO service_role` clause, so it's PUBLIC-scoped, not actually role-restricted (Hazard 6).

---

## 22. `vocab_attempts` (0024)

Raw attempt log for the Vocabulary Fluency Drill, distinct from `user_glossary_terms`'s aggregate state.

`id` UUID PK; `user_id` UUID NOT NULL FK CASCADE; `term` TEXT NOT NULL; `skill_id` TEXT null; `direction` TEXT NOT NULL (`'term'|'definition'`); `is_correct` BOOLEAN NOT NULL; `timed_out` BOOLEAN NOT NULL default false; `created_at` TIMESTAMPTZ NOT NULL default now().

Indexes: `idx_vocab_attempts_user(user_id)`, `idx_vocab_attempts_user_skill(user_id, skill_id)`. RLS: owner SELECT/INSERT — the only migration using defensive `DROP POLICY IF EXISTS` before `CREATE POLICY`.

---

## RPCs & triggers — index

All five functions and the one trigger are documented in full where they're introduced: `is_admin_email` under "Cross-cutting" above; `update_user_glossary_terms_updated_at()` + the `user_glossary_terms_updated_at` trigger + `increment_glossary_miss` under table 16 (`user_glossary_terms`); `increment_wrong_count` + `record_diagnostic_miss` under table 17 (`practice_missed_questions`). Security-mode timeline for all four non-trigger functions is identical: `SECURITY DEFINER` at creation → `search_path` pinned in `0027` → flipped to `SECURITY INVOKER` in `0028`. One nit: `0027`'s comment claims it pins search_path on "every SECURITY DEFINER function" and lists `update_user_glossary_terms_updated_at` among them, but `0008` never actually declares that function `SECURITY DEFINER` (plain `plpgsql`, default INVOKER) — harmless, but the comment overstates its own scope.

---

## Known hazards for a migration script

1. **`learning_path_progress` double-definition — CONFIRMED.** `0003` and `0005` both `CREATE TABLE IF NOT EXISTS learning_path_progress` with different shapes (0003: keyed `(user_id, skill_id)`, lesson/quiz tracking, `status` CHECK; 0005: keyed `(user_id, module_id)`, visit/interactive-exercise tracking, no `status` CHECK). `IF NOT EXISTS` + filename-order execution means **0003 wins**: every 0005-only column (`module_id`, `progress_pct`, `visit_count`, `total_interactive_score`, `interactive_exercises_*`, `last_visited_at`) is silently absent from the live table, though 0005's index and its 3 differently-named RLS policies still get created (harmless duplication). This document can't confirm which schema is actually live — an out-of-band `ALTER TABLE` could have added 0005's columns invisibly. Verify against a live schema before writing migration code here.
2. **`0017`/`0018` placeholders — CONFIRMED no-ops.** Both are just `SELECT 1;` behind a comment explaining they exist to keep local filenames in sync with a remote database that already had those version numbers recorded. Nothing is missing: the content meant for those slots was authored on branch `audit-fixes-april-2026` (commit `0667ec8`, 2026-04-08) as `0017_simplified_onboarding.sql` / `0018_post_assessment_snapshot.sql`, then re-slotted as `0020`/`0021` once the placeholder numbers were taken (both migrations narrate this in their own headers). Trust migration *content*, not *filename number*, for sequencing.
3. **`global_scores` drift on `user_progress` — CONFIRMED, evidence of untracked schema drift.** `0000` declares `global_scores JSONB` in the initial schema; `0011` re-adds the identical column, commented "Restore ... column ... missing from the live database." Production's real table once lacked a column `0000` says it created — file history and live history have already diverged at least once. `0011`'s `IF NOT EXISTS` makes this case safe, but treat the migrations folder as a possibly-incomplete record of what's live.
4. **`study_plans` double `CREATE TABLE`** (found in this pass, not one of the three originally flagged). `0000` and `0001` both create the table and both issue identically-named `CREATE POLICY` statements with no guard. Postgres has no `CREATE POLICY IF NOT EXISTS` — replaying 0000 then 0001 raises a duplicate-policy error on 0001. (0000 also leaves `user_id` nullable; 0001 declares `NOT NULL` — 0000 wins, so it's nullable in practice.)
5. **CLAUDE.md's migration index doesn't match `0010`'s SQL.** CLAUDE.md describes it as adding `tutor_sessions, tutor_messages, tutor_artifacts`; the file actually creates `chat_sessions`/`chat_messages` only, with artifacts as `artifact_type`/`artifact_payload` columns. Confirms the working assumption for this doc: `.sql` files, not CLAUDE.md prose, are ground truth.
6. **`user_subscriptions`'s "service role" policy isn't role-scoped.** `FOR ALL USING (true) WITH CHECK (true)` has no `TO service_role` clause, so per Postgres RLS semantics it applies to `PUBLIC`, not only the service-role key. Don't reproduce this pattern in PASS.
7. **Row counts are unavailable.** This is a static read of 29 files; no live project was queried. **TODO:** pull a live schema + row-count snapshot from production and diff against Hazards 1 and 3 before migrating.
8. **Only one DB-enforced `updated_at` trigger exists** (`user_glossary_terms_updated_at`, 0008) — every other table's `updated_at` is app-managed, not database-enforced.

---

*Extracted from `supabase/migrations/0000`–`0028` in the PraxisMakesPerfect repo, read in full on 2026-07-11. No live database was queried; see Hazard 7.*
