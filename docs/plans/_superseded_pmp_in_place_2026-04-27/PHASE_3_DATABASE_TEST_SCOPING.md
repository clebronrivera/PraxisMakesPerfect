# Phase 3 — Database Test Scoping

## Goal

Add `test_id` columns and `useTestScopedQuery()` wrapper. Backfill existing rows with `'PRAXIS_5403'` (per `DECISIONS.md` #7). Add test-scoping to the two RPCs called from `useRedemptionRounds.ts`. This phase MUST complete before Phase 4 enables public test switching, otherwise FTCE writes pollute Praxis rows.

## Scope

### Tables receiving `test_id` (enumerated explicitly)

| Table | Migration | Why scoped |
|---|---|---|
| `user_progress` | 0023 | Per-user, per-test progress |
| `responses` | 0023 | Item answers are test-specific |
| `practice_responses` | 0023 | Practice answers are test-specific |
| `study_plans` | 0023 | Plans are per-test |
| `learning_path_progress` | 0023 | Module progress per-test |
| `module_visit_sessions` | 0023 | Module engagement per-test |
| `section_interactions` | 0023 | Section interactions per-test |
| `module_notes` | 0023 | Notes attach to a test's module |
| `focus_item_checks` | 0023 | Per-test focus items |
| `focus_item_seen_at` | 0023 | Per-test focus items |
| `user_glossary_terms` | 0023 | Glossary entries per-test |
| `practice_missed_questions` | 0023 | Quarantined questions per-test |
| `redemption_sessions` | 0023 | Redemption history per-test |
| `assessment_reset_archive` | 0023 | Archived resets per-test |
| `tutor_sessions` | 0023 | Tutor sessions per-test |
| `tutor_messages` | 0023 | Tutor messages per-test |
| `tutor_artifacts` | 0023 | Tutor artifacts per-test |

### Tables intentionally NOT scoped

| Table | Reason |
|---|---|
| `questions` | Catalog table — questions belong to a test via their item-bank file path |
| `skills` | Catalog table |
| `beta_feedback` | Cross-cutting, not test-specific |
| `question_reports` | Cross-cutting (a report references a question whose test is implicit in the question id) |
| `user_subscriptions` | Per-user pricing (`DECISIONS.md` #10) |

### Allowed files
- `supabase/migrations/0023_test_id_columns.sql` (new)
- `supabase/migrations/0024_backfill_praxis_5403.sql` (new)
- `supabase/migrations/0025_test_id_indexes.sql` (new)
- `supabase/migrations/0026_test_id_not_null.sql` (new)
- `supabase/migrations/0027_user_active_test.sql` (new)
- `supabase/migrations/0028_rpc_test_id_params.sql` (new — adds `p_test_id` to `increment_wrong_count`, `record_diagnostic_miss`)
- `src/utils/useTestScopedQuery.ts` (new)
- All hooks/services calling `supabase.from(...)` for the affected tables
- `src/hooks/useRedemptionRounds.ts` (update RPC calls to pass active test_id)
- `.eslintrc` (add rule rejecting raw `supabase.from('responses' | <other scoped table>)`)
- Admin dashboard (`src/components/AdminDashboard.tsx` and admin API endpoints in `api/admin-*.ts`) — add `test_id` filtering or explicit "global view" toggle
- `docs/HOW_THE_APP_WORKS.md` (per `CLAUDE.md` mandate)

### Forbidden
- New tests / public UI changes (Phase 4)
- Touching adaptive engine, SRS, redemption-rounds *body* (RPC scoping is fine; quarantine logic stays generic)

## Hard blockers

None.

## Steps

### 3.0 Audit existing FTCE-onboarded users
Allowed: read-only query to production (or staging if prod read-only is unavailable)
Acceptance:
- Run `SELECT primary_exam, COUNT(*) FROM user_progress GROUP BY primary_exam;`
- Result logged to `HANDOFF_LOG.md`
- This is informational only — Migration 0024 backfills everyone as `PRAXIS_5403` regardless (per `DECISIONS.md` #7), but knowing the count helps Phase 4A scope the test-selector reconciliation UX
Verification: query result in HANDOFF_LOG.md.

### 3.1 Migration 0023: add nullable `test_id` columns
Allowed: `supabase/migrations/0023_test_id_columns.sql`
Acceptance:
- Nullable `test_id text` added to each of the 17 tables enumerated above
- Applied to local Supabase via `supabase db reset && supabase db push`
Verification: `\d <each table>` shows `test_id` column.

### 3.2 Migration 0024: backfill `PRAXIS_5403`
Allowed: `supabase/migrations/0024_backfill_praxis_5403.sql`
Acceptance:
- `UPDATE <table> SET test_id = 'PRAXIS_5403' WHERE test_id IS NULL;` run for every scoped table
- For PMP's current scale, blanket backfill is safe (small data volume). If PMP grows to a scale where `UPDATE` locks become a concern, switch to batched updates with `WHERE id BETWEEN x AND y` chunks; not necessary today.
Verification: `SELECT COUNT(*) FROM <each table> WHERE test_id IS NULL;` returns 0.

### 3.3 Migration 0025: indexes
Allowed: `supabase/migrations/0025_test_id_indexes.sql`
Acceptance: composite `(user_id, test_id)` indexes on hot tables (`user_progress`, `responses`, `practice_responses`, `study_plans`, `practice_missed_questions`, `redemption_sessions`).

### 3.4 Migration 0026: NOT NULL with DEFAULT
Allowed: `supabase/migrations/0026_test_id_not_null.sql`
Acceptance:
- `ALTER TABLE ... ALTER COLUMN test_id SET NOT NULL, ALTER COLUMN test_id SET DEFAULT 'PRAXIS_5403';`
- Defensive guard at top of migration: `DO $$ BEGIN IF EXISTS (SELECT 1 FROM <each table> WHERE test_id IS NULL) THEN RAISE EXCEPTION 'Backfill incomplete'; END IF; END $$;` (prevents silent corruption if 0024 missed rows)
Verification: `\d <each table>` shows NOT NULL DEFAULT.

### 3.5 Migration 0027: `user_tests` table
Allowed: `supabase/migrations/0027_user_active_test.sql`
Acceptance:
- New table `user_tests (user_id uuid, test_id text, started_at timestamptz, role text, PRIMARY KEY (user_id, test_id))`
- For each existing user with `primary_exam IS NOT NULL`, insert a `user_tests` row. Translate casing in the migration: `'praxis_5403'` → `'PRAXIS_5403'`, `'ftce_school_psychologist'` → `'FTCE_036'`, `'other'` → skip the insert.
- RLS policy: user reads/writes their own rows (`auth.uid() = user_id`)
- The `primary_exam` column on `user_progress` is left in place for now — Phase 4A reads it as a hint; a future cleanup migration can drop it once Phase 4A is stable.
Verification: `SELECT COUNT(*) FROM user_tests;` matches the count of users with non-null `primary_exam`.

### 3.6 Build `useTestScopedQuery` hook
Allowed: `src/utils/useTestScopedQuery.ts`
Acceptance:
- Wraps `supabase.from(table)` and auto-injects `.eq('test_id', activeTestId)` on read; auto-injects `test_id` on insert
- Type-safe across the affected table set (overloads per table or a typed table-name union)
- Throws clearly if called outside a `TestContext` provider
Verification: type tests pass; integration test confirms scoping works for read and insert.

### 3.7 Refactor all callsites
Allowed: every file calling `supabase.from('<scoped_table>')` outside the wrapper
Acceptance:
- All scoped-table callsites use the wrapper
- Catalog-table callsites (`questions`, `skills`, etc.) continue to use raw `supabase.from()` — they're explicitly out of scope for the wrapper
- `git grep -nE "supabase\.from\('(user_progress|responses|practice_responses|study_plans|learning_path_progress|module_visit_sessions|section_interactions|module_notes|focus_item_checks|focus_item_seen_at|user_glossary_terms|practice_missed_questions|redemption_sessions|assessment_reset_archive|tutor_sessions|tutor_messages|tutor_artifacts)'" src/` returns zero hits outside `useTestScopedQuery.ts`

### 3.8 Add ESLint rule
Allowed: `.eslintrc`
Acceptance:
- Rule fails on a deliberate test violation (raw `supabase.from('responses')` in a fixture file)
- Rule allows raw `supabase.from()` for catalog tables

### 3.9 Update `HOW_THE_APP_WORKS.md`
Acceptance: doc explains test-scoped queries, the `user_tests` table, and that scoping is wrapper-enforced not RLS-enforced (`DECISIONS.md` #12).

### 3.10 RPC test scoping (the critique-flagged gap)
Allowed: `supabase/migrations/0028_rpc_test_id_params.sql`, `src/hooks/useRedemptionRounds.ts`
Acceptance:
- Migration 0028 alters `increment_wrong_count` and `record_diagnostic_miss` to accept `p_test_id text`
- Both RPCs include `AND test_id = p_test_id` in their internal queries
- `useRedemptionRounds.ts:109` passes the active test id to `increment_wrong_count`
- `useRedemptionRounds.ts:203` passes the active test id to `record_diagnostic_miss`
- A test confirms wrong-count tracking on Test A does not affect Test B
Verification: integration test exercises the cross-test isolation.

### 3.11 Admin dashboard test scoping
Allowed: `src/components/AdminDashboard.tsx` and admin API endpoints in `api/admin-*.ts`
Acceptance:
- Admin queries either filter by `test_id` (with a UI selector) or explicitly mark themselves as "global view"
- Item Analysis tab is per-test (a question's psychometrics only mean something within one test)
- AI Tutor tab shows test_id per session
- Users tab shows the user's active test
- Beta Feedback / Question Reports stay global (unscoped)
Verification: load each tab; switch the admin's active test; verify counts and lists update accordingly.

## Phase Exit Criteria

- All 6 migrations applied
- Backfill verified (no null `test_id` across any scoped table)
- All Supabase callsites for scoped tables use the wrapper
- ESLint rule active
- RPC test-scoping live; cross-test isolation test passes
- Admin dashboard scoped or explicitly global per tab
- `HOW_THE_APP_WORKS.md` updated
- `STATE.md` updated to Phase 4A step 4A.1

## Rollback

Each migration is reversible:
- 0028: drop the `p_test_id` parameter (revert to pre-3.10 RPC bodies)
- 0027: drop `user_tests` table
- 0026: `ALTER COLUMN test_id DROP NOT NULL`
- 0025: `DROP INDEX`
- 0024: not reversible (data is set), but next 0023 drop would clean it
- 0023: `ALTER TABLE ... DROP COLUMN test_id` for each table

If Phase 3 needs to revert, do it in reverse migration order. Note that 0024's data loss is irreversible without a backup — take a Supabase backup before applying 0023.
