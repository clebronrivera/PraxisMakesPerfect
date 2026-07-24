# User Data Inventory — Source Schema for the Migration Script

**Purpose.** This is the input to the platform-migration script: a complete inventory of the reference application's database — every table, its columns (type + nullability), foreign keys, indexes, row-level-security (RLS) policies, and a per-table row-count slot. Unlike the other `pass_migration` docs (which are vendor-neutral *pattern* specs), this one is **concrete by necessity** — a migration script needs the real table and column names, so they are kept verbatim.

**Provenance & accuracy caveat.** Reconstructed from the 26 sequential SQL migrations (`0000_initial_schema.sql` … `0025_account_deletion_request.sql`), composing each table's final state by folding in later `ALTER … ADD COLUMN`. **The migration sequence is NOT a clean linear history** (placeholders, double-defined tables, drift), so the schema below is the *replay* result — it must be reconciled against a **live dump** before the migration runs (see §6, §7). Row counts are deliberately left **TBD** — they are volatile and only needed at migration time. The reference DB has on the order of a handful of real users (classmates), so volumes are tiny.

---

## 1. Overview

- **22 tables**, all in schema `public`. **20 are per-user** (keyed by a `user_id` UUID → `auth.users`); **2 are shared content** (`questions`, `skills` — global, no `user_id`).
- **The per-user partition key is uniform:** `user_id` (UUID) everywhere except `assessment_reset_archive` (`target_user_id`). `user_progress.user_id` is *both* the PK and the FK to `auth.users`, making it the 1:1 profile-extension row per auth user.
- **No FK constraints from user tables to content tables.** `question_id` / `skill_id` are carried as plain TEXT columns (app-validated references, not DB-enforced) — so content can be migrated/seeded independently of user data.
- **RLS is enabled on every table.** Owner policies key on `auth.uid() = user_id`; admin reads key on an `is_admin_email(...)` allowlist function (the allowlist is a hard-coded email set — omitted here as PII).
- **ID generation is mixed:** `uuid_generate_v4()` (uuid-ossp, 0000-era tables) and `gen_random_uuid()` (pgcrypto, 0004-onward). A fresh DB must have both extensions.

---

## 2. User-data vs. content classification (the key cut for migration)

| Class | Tables |
|---|---|
| **Shared content** (copy/seed once, not per-user) | `questions`, `skills` |
| **Per-user, CASCADE on user delete** | `user_progress`, `responses`, `practice_responses`, `study_plans`, `learning_path_progress`, `module_visit_sessions`, `section_interactions`, `module_notes`, `focus_item_checks`, `focus_item_seen_at`, `user_glossary_terms`, `practice_missed_questions`, `redemption_sessions`, `chat_sessions`, `chat_messages`, `user_subscriptions`, `vocab_attempts` |
| **Per-user, SET NULL on user delete** (row survives de-identified) | `question_reports`, `beta_feedback`, `assessment_reset_archive` (`target_user_id`) |

A per-user migration iterates users and copies their rows from the CASCADE + SET-NULL groups; the content group is migrated once. `user_progress` is the anchor (1 row/user); everything else is 0..N rows/user joined on `user_id`.

---

## 3. Per-table inventory

Compact form. `PK` = primary key; `FK` = foreign key + on-delete; `IX` = indexes; `RLS` = policy summary; `CK` = check constraints. Columns are `name (type, NULL?)`; types shortened (TS = TIMESTAMPTZ).

### 3.1 `user_progress` — the profile/progress anchor (created 0000; +many)
1 row per user; PK **`user_id`** = FK `auth.users(id) ON DELETE CASCADE`. ~70 columns added across 0000/0001/0002/0009/0011/0012/0016/0019/0020/0021/0025. Grouped:
- **Identity/session:** `email`, `display_name`, `login_count` (int), `last_login_at`/`last_active_at` (TS), `streak` (int), `last_session` (JSONB), `migration_version` (int), `created_at`/`updated_at`.
- **Assessment flags + state:** `screener_complete`, `diagnostic_complete`, `full_assessment_complete`, `adaptive_diagnostic_complete` (bool NOT NULL, 0012); session-id pointers `last_full_assessment_session_id`, `last_screener_session_id` (0001), `last_diagnostic_session_id` (0012); question-id arrays (JSONB/`TEXT[]`): `pre_/full_assessment_question_ids`, `recent_practice_question_ids`, `screener_item_ids`, `diagnostic_question_ids` (0012).
- **Scoring (JSONB):** `domain_scores`, `skill_scores`, `weakest_domains`, `factual_gaps`, `error_patterns`, `flagged_questions`, `distractor_errors`, `skill_distractor_errors`, `screener_results`, `global_scores` (see §6 — drift), `baseline_snapshot` (0016), `post_assessment_snapshot` (0021), `total_questions_seen`/`practice_response_count` (int).
- **Onboarding/profile (0002, 0020):** `account_role`, `full_name`/`first_name`/`last_name`, `preferred_display_name`, `university`/`school_attending`, `program_type`/`program_state`/`delivery_mode`/`training_stage`, `certification_state`/`certification_route`, `"current_role"` (quoted — reserved word), `primary_exam`, `planned_test_date` (DATE), `retake_status`, `number_of_prior_attempts`/`target_score` (int), `study_goals`/`biggest_challenge`/`other_resources_list` (JSONB), `weekly_study_hours`, `used_other_resources` (bool), `what_was_missing`, `onboarding_complete` (bool), `zip_code`, `purpose`, `how_did_you_hear`.
- **Redemption counters (0009, NOT NULL):** `redemption_credits` (int), `practice_questions_since_credit` (int), `redemption_high_score` (NUMERIC(5,2)).
- **Compliance:** `consent_accepted_at` (TS, 0019), `deletion_requested_at` (TS, 0025).
- **IX:** `idx_user_progress_deletion_requested (deletion_requested_at) WHERE deletion_requested_at IS NOT NULL` (partial). **RLS:** owner FOR ALL `auth.uid() = user_id`; admin SELECT. **Backfill:** 0020 splits `full_name`→`first_name`/`last_name`.

### 3.2 Answer logs
- **`responses`** (0000; +0015 `is_followup`,`cognitive_complexity`,`skill_question_index`; +0023 `selected_answer`) — assessment answers. Cols: `id` (PK uuid), `user_id` (FK CASCADE), `session_id` (NOT NULL), `question_id` (NOT NULL), `skill_id`, `domain_id` (int), `domain_ids` (JSONB), `assessment_type` (NOT NULL — app-enum, no DB CHECK), `is_correct` (bool NOT NULL), `confidence`, `time_spent`/`time_on_item_seconds` (int), `selected_answers`/`correct_answers` (JSONB), `selected_answer` (TEXT, comma-joined for multi-select), `distractor_pattern_id`, `created_at`. **IX:** `(user_id, session_id)`. **RLS:** owner FOR ALL; admin SELECT.
- **`practice_responses`** (0000) — practice-mode answers. Cols: `id` (PK), `user_id` (FK CASCADE), `session_id` (NOT NULL), `question_id` (NOT NULL), `skill_id`, `domain_id`, `selected_answer`, `correct_answer`, `is_correct` (NOT NULL), `confidence`, `time_on_item_seconds`, `shuffled_order` (JSONB), `created_at`. **IX:** `(user_id, session_id)`. **RLS:** owner FOR ALL.

### 3.3 Learning-path & module engagement
- **`learning_path_progress`** ⚠️ **double-defined (0003 skill-scoped vs 0005 module-scoped) — see §6.** FK CASCADE. Replay yields the 0003 shape (`skill_id`, `lesson_viewed`, `questions_correct/total`, `accuracy` FLOAT, `status` CK ∈ not_started/emerging/approaching/demonstrating/mastered, UNIQUE `(user_id, skill_id)`); production likely has the 0005 shape (`module_id`, `progress_pct`, `visit_count`, interactive-exercise cols, UNIQUE `(user_id, module_id)`). **Introspect the live DB.**
- **`module_visit_sessions`** (0005) — per-visit engagement. `id` (PK), `user_id` (FK CASCADE), `module_id`/`skill_id` (NOT NULL), `visit_number` (int), `started_at`/`ended_at`, `duration_seconds`, `scroll_depth_pct` (FLOAT, CK 0..1), `sections_visible` (`TEXT[]`), `source` (CK ∈ learning_path/skill_help_drawer). **IX:** `(user_id, module_id)`, `(user_id, skill_id)`. **RLS:** owner + admin SELECT.
- **`section_interactions`** (0005) — per-section engagement. `id` (PK), `user_id` (FK CASCADE), `visit_session_id` (FK `module_visit_sessions` CASCADE), `module_id`, `section_index` (int), `section_type` (CK ∈ paragraph/anchor/list/comparison/interactive/visual), `interactive_type` (CK ∈ 5 values or NULL), `became_visible`, `visible_seconds`, `exercise_completed`/`exercise_score` (CK 0..1)/`exercise_attempts`/`exercise_data` (JSONB). **UNIQUE** `(visit_session_id, section_index)`. **IX:** 3 incl. partial `WHERE section_type='interactive'`. **RLS:** owner + admin SELECT.
- **`module_notes`** (0006) — `id` (PK), `user_id` (FK CASCADE), `module_id`/`skill_id` (NOT NULL), `note_text` (NOT NULL default `''`), timestamps. **UNIQUE** `(user_id, module_id)`. **RLS:** owner + admin SELECT.

### 3.4 Focus items (study-plan follow-through)
- **`focus_item_checks`** (0006) — `id` (PK), `user_id` (FK CASCADE), `study_plan_id` (FK `study_plans` CASCADE), `item_type` (CK ∈ vocabulary/misconception/trap), `item_key`, `checked` (bool), `checked_at`. **UNIQUE** `(user_id, study_plan_id, item_type, item_key)`. **RLS:** owner only.
- **`focus_item_seen_at`** (0006) — "New" badge tracking. `id` (PK), `user_id` (FK CASCADE), `skill_id`, `last_seen_at`. **UNIQUE** `(user_id, skill_id)`. **RLS:** owner only.

### 3.5 Study plans
- **`study_plans`** (0000, re-`IF NOT EXISTS` 0001) — `id` (PK), `user_id` (FK CASCADE; **nullable on replay**, see §6), `plan_document` (JSONB NOT NULL — the full generated plan), timestamps. **IX:** `(user_id, created_at DESC)`. **RLS:** owner SELECT/INSERT + admin SELECT.

### 3.6 Redemption (quarantine) — see `PMP_REDEMPTION_V2_RULES.md`
- **`practice_missed_questions`** (0009; +0013 `wrong_count`,`entry_reason`,`in_redemption`) — `id` (PK), `user_id` (FK CASCADE), `question_id` (NOT NULL), `skill_id`, `missed_at`, `correct_count` (int), `redeemed` (bool), `redeemed_at`, `wrong_count` (int NOT NULL), `entry_reason` (hint|miss_threshold), `in_redemption` (bool NOT NULL). **UNIQUE** `(user_id, question_id)` (upsert target). **IX:** `(user_id)`, partial `(user_id, redeemed) WHERE redeemed=false`. **RLS:** owner. **0013 backfills** flags.
- **`redemption_sessions`** (0009) — round history. `id` (PK), `user_id` (FK CASCADE), `played_at`, `questions_attempted`/`questions_correct` (int), `score_pct` (NUMERIC(5,2)). **IX:** `(user_id)`. **RLS:** owner SELECT/INSERT (append-only).

### 3.7 Glossary & vocab — see `PMP_SRS_INTERVALS.md`
- **`user_glossary_terms`** (0008; +0024 `miss_count`) — `id` (PK), `user_id` (FK CASCADE), `term` (NOT NULL), `user_definition`, `revealed` (bool), `revealed_at`, `added_from_skill_id`, `miss_count` (int NOT NULL), timestamps. **UNIQUE** `(user_id, term)`. **Trigger** `update…updated_at` (the only DB `updated_at` trigger). **RLS:** owner incl. **DELETE**.
- **`vocab_attempts`** (0024) — drill audit log. `id` (PK), `user_id` (FK CASCADE), `term`, `skill_id`, `direction` (term|definition), `is_correct` (bool), `timed_out` (bool), `created_at`. **IX:** `(user_id)`, `(user_id, skill_id)`. **RLS:** owner SELECT/INSERT.

### 3.8 AI tutor chat
- **`chat_sessions`** (0010) — `id` (PK), `user_id` (FK CASCADE), `title`, `session_type` (CK ∈ page-tutor/floating), `message_count` (int), timestamps, `metadata` (JSONB). **IX:** `(user_id)`, `(user_id, updated_at DESC)`. **RLS:** owner.
- **`chat_messages`** (0010) — `id` (PK), `session_id` (FK `chat_sessions` CASCADE), `user_id` (FK CASCADE), `role` (CK ∈ user/assistant), `content` (NOT NULL), `created_at`, `assistant_intent`, `quiz_question_id`/`quiz_skill_id`/`quiz_answered`, `artifact_type`/`artifact_payload` (JSONB), `page_context` (JSONB), `metadata` (JSONB). **IX:** `(session_id, created_at)`, `(user_id, created_at)`, partial `(quiz_question_id) WHERE NOT NULL`. **RLS:** owner.

### 3.9 Subscriptions (paywall)
- **`user_subscriptions`** (0014, schema-qualified `public.user_subscriptions`) — `id` (PK), `user_id` (FK CASCADE), `stripe_customer_id`, `stripe_subscription_id` (UNIQUE col), `plan` (CK ∈ free/premium_monthly/premium_yearly, default free), `status` (CK ∈ active/canceled/past_due/trialing/incomplete), `current_period_end`, timestamps. **UNIQUE** `(user_id)`. **IX:** on stripe customer + sub. **RLS:** owner SELECT; a service-role "manage" policy `USING(true) WITH CHECK(true)` (see §6 flag).

### 3.10 Feedback / reports (SET NULL on delete)
- **`question_reports`** (0000) — `id` (PK), `user_id` (FK **SET NULL**), `question_id` (NOT NULL), denormalized `user_email`/`user_display_name`, `assessment_type`, `targets`/`issue_types` (JSONB), `severity`, `notes`, `status` (default open), `question_snapshot` (JSONB), `app_version`, timestamps. **RLS:** owner INSERT/SELECT + admin SELECT/UPDATE.
- **`beta_feedback`** (0000) — `id` (PK), `user_id` (FK **SET NULL**), denormalized email/name, `category` (NOT NULL), `context_type`/`feature_area`, `message` (NOT NULL), `page`/`session_id`/`app_version`/`browser_info`, `status` (default new), timestamps. **RLS:** owner INSERT/SELECT + admin SELECT/UPDATE.

### 3.11 Admin archive (service-role only)
- **`assessment_reset_archive`** (0004) — `id` (PK), `target_user_id` (FK **SET NULL**), `actor_email` (NOT NULL), `scope` (CK ∈ screener/full_diagnostic), `created_at`, `user_progress_snapshot`/`responses_archived` (JSONB), `response_count` (int). **IX:** `(target_user_id, created_at DESC)`, `(created_at DESC)`. **RLS:** enabled with **zero policies** → service-role only (intentional).

### 3.12 Shared content (no `user_id`)
- **`questions`** (0000) — PK `id` (TEXT business id). ~24 cols incl. `item_format`, `is_multi_select`, `correct_answer_count`/`option_count_expected` (int), `has_case_vignette`/`case_text`, `question_stem` (NOT NULL), `options`/`correct_answers`/`distractors` (JSONB), `correct_explanation`, `core_concept`, `domain` (int)/`domain_name`, `skill_id`/`skill_name`, `cognitive_complexity`/`complexity_rationale`, `rationale`, `is_foundational` (bool). **IX:** `(skill_id)`, `(domain)`. **RLS:** authenticated SELECT; admin manage.
- **`skills`** (0000) — PK `id` (TEXT). `name` (NOT NULL), `domain_id` (TEXT), `concept_label`, `prerequisites` (JSONB), `prerequisite_reasoning`, timestamps. **RLS:** authenticated SELECT; admin manage.

---

## 4. Identity & deletion model

- **Identity** = the `auth.users(id)` UUID (the auth provider's user id). Every per-user row stores it in `user_id`/`target_user_id`. RLS keys on `auth.uid()`. `user_progress` is the 1:1 profile row.
- **Cascade map:** deleting an `auth.users` row destroys all CASCADE rows (§2 row 2) and de-identifies the SET-NULL rows (§2 row 3, user link → NULL, row retained).
- **Soft deletion (0025):** there is **no hard self-delete**. `deletion_requested_at` records intent (owner sets it via RLS update); an admin purges later. The migration `0025` notes the auth-user delete API was unavailable with the current key format, so only the request flag is wired. Admin triage: `WHERE deletion_requested_at IS NOT NULL`.
- **Consent (0019):** `consent_accepted_at` (NULL = not accepted) stores ToS/privacy acceptance time.

---

## 5. Functions / RPCs / triggers

| Object | Migration | Purpose |
|---|---|---|
| `is_admin_email(email) → bool` | 0000 (re-defined 0007) | Admin allowlist check backing every admin RLS policy. |
| `update_user_glossary_terms_updated_at()` + trigger | 0008 | The only DB-maintained `updated_at` (glossary). All other `updated_at` are app-set. |
| `increment_wrong_count(user, question, skill) → (new_wrong_count, now_in_redemption)` | 0013 | Atomic practice-miss upsert; quarantines at the 3rd wrong. |
| `record_diagnostic_miss(user, question, skill) → (…)` | 0022 | Diagnostic-miss sibling: bumps `wrong_count` but never quarantines. |
| `increment_glossary_miss(user, term, skill) → int` | 0024 | Atomic vocab-miss bump; re-flags `revealed=false`. The only RPC with a self-guard (`p_user_id = auth.uid()` else RAISE). |

---

## 6. Migration hazards — reconcile against a live dump before trusting replay

The migration history is **not** a clean linear replay. A migration-script author must verify these against the live DB:

1. **`learning_path_progress` defined twice (0003 skill-scoped vs 0005 module-scoped), both `IF NOT EXISTS`.** Clean replay = the 0003 shape; production (app uses `module_id`) almost certainly = the 0005 shape (± 0003 leftovers), with duplicate-named RLS policies. **Highest-risk table — introspect live columns.**
2. **`study_plans` created twice (0000 nullable `user_id` vs 0001 NOT NULL).** Replay keeps nullable; legacy NULL rows possible.
3. **`global_scores` re-added by 0011** ("restore the column declared in the initial schema but missing from the live database") — **direct evidence the live DB drifted from 0000**. Treat 0000 as aspirational.
4. **0017 & 0018 are placeholders (`SELECT 1;`).** They exist only to align local filenames with remote migration-version rows whose original SQL was lost. Their intended work (`simplified_onboarding`, `post_assessment_snapshot`) was re-authored at **0020** and **0021**. So filename order ≠ production order.
5. **`user_subscriptions` "service role can manage" policy is `USING(true) WITH CHECK(true)`** — permissive at the SQL layer; security rests on the app only writing via the service key. Note for any RLS audit.
6. **`assessment_reset_archive` has RLS enabled with no policies** — intentional service-role-only; not a misconfiguration.
7. **App-enum-only columns:** many TEXT columns documented as enums (`assessment_type`, `account_role`, `program_type`, `retake_status`, `direction`, `entry_reason`, …) have **no DB CHECK** — they're app-enforced. Real DB CHECKs exist only on the columns noted in §3.
8. **Data backfills run in 0013 (redemption flags) and 0020 (name split)** — no-ops on an empty DB, but relevant when migrating onto existing data.

---

## 7. Row-count snapshot (fill at migration time)

Left **TBD** — row counts are volatile and only needed when the migration runs. Generate a live snapshot then (the build plan, `02_BUILD_PLAN_DETAILED.md § 3.3`, gives the canonical dump command; a quick count is below):

```sql
-- Per-table live row counts (run against the source DB at migration time)
SELECT relname AS table, n_live_tup AS approx_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```

| Table | Class | Approx rows |
|---|---|---|
| user_progress | per-user (anchor) | TBD |
| responses | per-user | TBD |
| practice_responses | per-user | TBD |
| learning_path_progress | per-user ⚠️ | TBD |
| module_visit_sessions | per-user | TBD |
| section_interactions | per-user | TBD |
| module_notes | per-user | TBD |
| focus_item_checks | per-user | TBD |
| focus_item_seen_at | per-user | TBD |
| study_plans | per-user | TBD |
| practice_missed_questions | per-user | TBD |
| redemption_sessions | per-user | TBD |
| user_glossary_terms | per-user | TBD |
| vocab_attempts | per-user | TBD |
| chat_sessions | per-user | TBD |
| chat_messages | per-user | TBD |
| user_subscriptions | per-user | TBD |
| question_reports | per-user (SET NULL) | TBD |
| beta_feedback | per-user (SET NULL) | TBD |
| assessment_reset_archive | admin archive | TBD |
| questions | content | TBD |
| skills | content | TBD |

---

## 8. Notes for the migration script (Phase 11)

- **Migration is small.** The source has on the order of a handful of real users; the build plan's chosen approach (per `DECISIONS.md` #16) is "no migration script — export emails, notify users to re-register." This inventory exists so that decision can be revisited with full knowledge, and so a targeted export (e.g. a user's study plans / progress) is buildable if wanted.
- **Iterate users; copy by `user_id`.** Pull each user's rows from the per-user tables (§2). Content (`questions`, `skills`) is seeded once, not per-user, and the target platform is multi-exam — so source content maps to **one** exam's bank on the target, not the target's whole catalog.
- **Resolve the §6 hazards first** by dumping the **live** schema (not replaying migrations) — especially `learning_path_progress`.
- **Carry the diagnostic evidence, not just scores.** Several JSONB columns (`skill_scores`, `distractor_errors`, `baseline_snapshot`, the `plan_document`) hold the misconception/diagnostic signal the target platform values; map them rather than flattening to a single score (cf. the platform's diagnostic-tier model).
- **Re-key to the target's identity + taxonomy.** `user_id` becomes the target auth id; loose `skill_id`/`question_id` TEXT references must be remapped to the target exam's microskill/item ids (the finest valid diagnostic unit per exam).
