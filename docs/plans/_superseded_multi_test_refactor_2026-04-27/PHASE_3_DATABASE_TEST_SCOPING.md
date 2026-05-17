# Phase 3 — Database Test Scoping

## Goal

Add `test_id` columns and a test-scoped Supabase wrapper. Backfill existing rows with `'PRAXIS_5403'`. This phase MUST complete before Phase 4 enables public test switching, otherwise FTCE writes pollute Praxis rows.

**Dependency.** Requires Phase 1A complete and a stable `activeTestId` source from `TestContext` (established in Phase 0). Phase 3 may run in parallel with Phases 1B–1E and Phase 2A — it touches different files.

## Preconditions (operator-confirmed before any non-local migration runs)

Phase 3 modifies the production database schema. Before applying any of the migrations 0023–0027 to a non-local environment:

1. **Supabase preview branch.** Apply migrations to a Supabase preview branch first (`supabase branches create phase-3-test-scoping`, per `COMMANDS.md`). Verify the full smoke walk on the preview branch.
2. **Backup.** Take a `pg_dump` (or `supabase db dump --data-only`) of the production database. Store the dump path in `HANDOFF_LOG.md`.
3. **Operator confirmation.** The operator says "begin next step" only after preconditions 1 and 2 are recorded. If the operator issues "begin next step" without those records, stop and prompt for them.

## Affected tables (the canonical list)

These 11 tables receive `test_id` scoping. Tables not on this list MUST NOT be automatically scoped without explicit review (some tables — e.g. `auth.users`, Stripe tables — are intentionally cross-test).

1. `responses`
2. `user_progress`
3. `study_plans`
4. `tutor_sessions`
5. `practice_missed_questions`
6. `learning_path_progress`
7. `module_visit_sessions`
8. `glossary_entries`
9. `redemption_sessions`
10. `baseline_snapshot`
11. `assessment_reset_archive`

## Scope

### Allowed files (create / modify)

- `supabase/migrations/0023_test_id_columns.sql` (new)
- `supabase/migrations/0024_backfill_praxis_5403.sql` (new)
- `supabase/migrations/0025_test_id_indexes.sql` (new)
- `supabase/migrations/0026_test_id_not_null.sql` (new)
- `supabase/migrations/0027_user_active_test.sql` (new)
- `src/lib/testScopedSupabase.ts` (new — generic helper for non-React callsites)
- `src/hooks/useTestScopedQuery.ts` (new — React hook convenience layer over the helper)
- All hooks/services calling `supabase.from(<affected_table>)` for any of the 11 tables above
- `scripts/check-test-scoped-supabase.mjs` (new — guard script)
- `package.json` (add `check:test-scoped-supabase` script + add to `npm run check` if present)
- `docs/HOW_THE_APP_WORKS.md` (per `CLAUDE.md`)

### Forbidden files (no modification)

- New tests (Phase 4 scope)
- Public UI changes (Phase 4 scope)
- Custom ESLint rules (deferred — see step 3.8 below)
- Auto-scoping any table not on the affected-tables list (must be a separate proposal in `BLOCKERS.md`)

## Hard blockers preventing this phase

None. The preconditions above are operator-confirmed gates, not blockers.

## Steps

### 3.1 — Migration 0023: add nullable test_id columns

Allowed: `supabase/migrations/0023_test_id_columns.sql`

Acceptance:
- Nullable `test_id text` added to all 11 affected tables (see canonical list)
- Applied to local Supabase

Verification: `supabase db reset && supabase db push` (per `COMMANDS.md`); query each table for the column with `\d <table>`.

### 3.2 — Migration 0024: backfill PRAXIS_5403

Allowed: `supabase/migrations/0024_backfill_praxis_5403.sql`

Acceptance: `UPDATE ... SET test_id = 'PRAXIS_5403' WHERE test_id IS NULL` on every affected table.

Verification: `SELECT COUNT(*) FROM <table> WHERE test_id IS NULL` returns 0 for each.

### 3.3 — Migration 0025: indexes

Allowed: `supabase/migrations/0025_test_id_indexes.sql`

Acceptance: composite `(user_id, test_id)` indexes on hot tables (`responses`, `user_progress`, `study_plans`).

Verification: `\d <table>` shows the new indexes; `EXPLAIN ANALYZE` on a representative query shows index use.

### 3.4 — Migration 0026: NOT NULL with default

Allowed: `supabase/migrations/0026_test_id_not_null.sql`

Acceptance: `ALTER TABLE ... ALTER COLUMN test_id SET NOT NULL` and `SET DEFAULT 'PRAXIS_5403'` on every affected table.

Verification: a deliberate `INSERT` without `test_id` succeeds with the default; `SELECT test_id FROM <table>` shows no NULLs.

### 3.5 — Migration 0027: user_tests table

Allowed: `supabase/migrations/0027_user_active_test.sql`

Acceptance:
- New table `user_tests (user_id uuid, test_id text, started_at timestamptz, role text, primary key (user_id, test_id))`
- Existing `primary_exam` profile field migrated to a row in this table
- RLS policy: user reads their own rows

Verification: `SELECT * FROM user_tests WHERE user_id = '<test user>'` returns the migrated row.

### 3.6 — Build testScopedSupabase helper + useTestScopedQuery hook

Allowed: `src/lib/testScopedSupabase.ts`, `src/hooks/useTestScopedQuery.ts`

Acceptance:
- `testScopedSupabase.ts` exports a generic helper that wraps `supabase.from(table)` and auto-injects `.eq('test_id', activeTestId)` — usable from non-React code (services, effects, admin utilities)
- `useTestScopedQuery.ts` is a thin React hook layer over the helper
- Type-safe across the 11-table allowlist (use the generated `Database` types from Supabase)
- Helper requires the table name to be in the allowlist (compile-time + runtime check)

Verification: typecheck passes; unit test confirms the helper rejects a non-allowlisted table at runtime.

### 3.7 — Refactor all affected callsites

Allowed: every file calling `supabase.from(<table>)` for any of the 11 affected tables

Acceptance:
- All callsites for affected tables use either `testScopedSupabase` (non-React) or `useTestScopedQuery` (React)
- Callsites for non-affected tables (e.g. `auth.users`) are untouched

Verification: the guard script in 3.8 passes on the post-refactor tree.

### 3.8 — Add lightweight guard script (NOT ESLint)

Allowed: `scripts/check-test-scoped-supabase.mjs`, `package.json`

Acceptance:
- Script greps/AST-scans `src/` for raw `supabase.from('<affected_table>')` calls outside the approved wrappers (`testScopedSupabase.ts` and `useTestScopedQuery.ts`)
- Returns non-zero with a list of offending file:line locations on violation
- A deliberate test violation in a fixture file fails the check
- Added to CI (if CI exists) and to the `check:test-scoped-supabase` npm script

Note: A custom ESLint rule is deferred. If the script proves insufficient over time, propose ESLint conversion as a follow-up in `BLOCKERS.md` — do not build it inside Phase 3.

### 3.9 — Update HOW_THE_APP_WORKS.md

Allowed: `docs/HOW_THE_APP_WORKS.md`

Acceptance: doc explains test-scoped queries, the `user_tests` table, and the affected-tables policy. Cross-references this directory's `DECISIONS.md` items 6 and 7.

Verification: peer-read confirms the doc is sufficient to explain the model to a new engineer.

## Phase Exit Criteria

- All migrations applied; `SELECT COUNT(*) WHERE test_id IS NULL` returns 0 for every affected table
- All affected-table Supabase callsites use the wrapper
- `npm run check:test-scoped-supabase` passes
- Operator-confirmed preconditions documented in `HANDOFF_LOG.md`
- `STATE.md` updated to next phase
- Phase branch `refactor/multi-test/phase-3` squash-merged to main

## Rollback procedure

Default rollback (`git revert <SHA>`) is INSUFFICIENT for Phase 3 because data has been written to the new columns. Procedure:

1. **If migration 0026 (NOT NULL) has not yet been applied:** `git revert` is sufficient; the schema accepts NULLs again, and the application code can still read existing `test_id = 'PRAXIS_5403'` rows.
2. **If migration 0026 has been applied:** the rollback is a *forward migration*, not a revert. Author `0028_drop_test_id.sql` that drops the columns and indexes in reverse order. Apply on a preview branch first. Coordinate with operator before running on production.
3. **If migration 0027 (`user_tests`) has been applied:** add a step to `0028_drop_test_id.sql` that copies `user_tests.test_id` back to `profiles.primary_exam` before dropping `user_tests`.

The HANDOFF_LOG entry for Phase 3 must record the migration numbers applied and the dump path; rollback procedure above is not optional reading.
