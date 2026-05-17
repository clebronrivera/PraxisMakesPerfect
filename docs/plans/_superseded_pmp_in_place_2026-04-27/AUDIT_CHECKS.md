# Audit Checks

Safeguards that run at session boundaries to keep the operating system trustworthy and detect drift. Distinct from `VERIFICATION_MATRIX.md`: that one asks "did the work pass tests?"; this one asks "is the OS itself still trustworthy?"

## Operator commands

- `audit os` — runs OS Integrity (§ 1) + Decisions Lock (§ 2). Cheap. Run at start of every session.
- `audit` — runs the current phase's pre-flight (§ 3) + the active step's post-audit (§ 4). Run before starting work and again after.

---

## § 1. OS Integrity (`audit os`)

Verify the operating system itself hasn't been tampered with or partially deleted.

```bash
# Pseudo-script — run at start of every session.
required_files=(
  README.md SESSION_RULES.md DECISIONS.md BLOCKERS.md
  STATE.md VERIFICATION_MATRIX.md AUDIT_CHECKS.md HANDOFF_LOG.md
  PHASE_-1_BOOTSTRAP.md PHASE_0_INSTRUMENTATION.md
  PHASE_1A_EXTRACT_PRAXIS_PACKAGE.md PHASE_1B_VALIDATE_TEST_PACKAGES.md
  PHASE_1C_EXTRACT_PROMPTS.md PHASE_1D_KEYSTONE_SYNC_SCRIPT.md
  PHASE_1E_DESIGN_TOKENS.md PHASE_2A_ADD_FTCE036_PACKAGE_INTERNAL.md
  PHASE_2B_TEST_SELECTOR_MOCKUPS.md PHASE_3_DATABASE_TEST_SCOPING.md
  PHASE_4A_INTERNAL_TEST_SWITCHING.md PHASE_4B_PUBLIC_MULTI_TEST_ENABLEMENT.md
)
for f in "${required_files[@]}"; do
  test -f "docs/plans/multi-test-refactor/$f" || fail "Missing OS file: $f"
done
```

**Pass:** all 20 files exist.
**Fail:** halt. Do not start work. Report which file is missing. Operator must restore from git history before proceeding.

## § 2. Decisions Lock

`DECISIONS.md` is append-only. If its content has changed without an explicit Proposals → triage flow, the OS has drifted.

```bash
# Compute current and committed hashes.
current_hash=$(sha256sum docs/plans/multi-test-refactor/DECISIONS.md | cut -d' ' -f1)
committed_hash=$(git show HEAD:docs/plans/multi-test-refactor/DECISIONS.md | sha256sum | cut -d' ' -f1)
test "$current_hash" = "$committed_hash" || warn "DECISIONS.md modified since last commit"
```

**Pass:** uncommitted changes to `DECISIONS.md` were made deliberately and are about to be committed in this session.
**Fail / warn:** if a session is mid-work and `DECISIONS.md` was edited unexpectedly, halt and ask the operator whether the edit was intentional.

## § 3. Per-phase pre-flight checks

Run before starting any step in that phase.

### Phase 0 (Instrumentation)
- `grep -c "^export const TOTAL_SKILLS" src/utils/skillProficiency.ts` returns 1
- `src/tests/` does not yet exist or is empty
- All five legacy data files still in place: `src/data/{questions.json,learningModules.ts,master-glossary.json,skill-metadata-v1.ts,skillIdMap.ts}`

### Phase 1A (Extract Praxis package)
- Phase 0 exit criteria met (typecheck, unit tests, build, dev smoke, screenshots-match all green)
- `src/tests/types.ts` exists
- `src/tests/index.ts` exists with the inline PRAXIS_5403 literal
- `src/contexts/TestContext.tsx` exists and is wrapped in `App.tsx`

### Phase 1B (Validate)
- `src/tests/PRAXIS_5403/` exists with all five content files moved
- `src/data/{questions.json,learningModules.ts,...}` no longer exist
- Vite build emits a separate Praxis chunk (visible in `dist/assets/`)

### Phase 1C (Extract prompts)
- Phase 1B exit criteria met
- `npm run validate:tests` exits 0 for `PRAXIS_5403`

### Phase 1D (Sync script)
- Phase 1C exit criteria met
- B3 resolved (Keystone schemas pinned or explicitly "best-effort current")
- B2 resolved or `DECISIONS.md` records the per-exam-no-registry path

### Phase 1E (Tokens)
- Phase 1D exit criteria met
- Round-trip on PRAXIS_5403 produces a byte-identical (modulo allowed normalization) package

### Phase 2A (FTCE 036 internal)
- B1, B2, B4 all resolved
- Phase 1E exit criteria met
- `Keystone/exams/ftce/sp_036_school_psychologist_pk12/_status.json` shows `00_blueprint`, `03_competency_map`, `08_handoff` status `complete` (or non-empty for those phases)

### Phase 2B (Mockups)
- Phase 2A exit criteria met
- Both PRAXIS_5403 and FTCE_036 packages validate cleanly

### Phase 3 (DB scoping)
- Phase 1E exit criteria met (Phases 2A and 2B do not block Phase 3 because Phase 3 only touches DB and shared utilities)
- `npm run typecheck`, `npm run build` green
- Pre-flight count: log `SELECT COUNT(*) FROM user_progress`, `SELECT COUNT(*) FROM responses`, etc. for every affected table to `HANDOFF_LOG.md` for backfill verification later

### Phase 4A (Internal switching)
- Phase 3 exit criteria met
- All migrations 0023–0027 applied to local Supabase
- `useTestScopedQuery` hook in place, ESLint rule active
- Zero NULL `test_id` rows across all 14+ scoped tables

### Phase 4B (Public)
- Phase 4A in production for ≥ 7 days (`human_gate: true` — operator confirms via `force advance`)
- Zero cross-test bug reports in that window (operator confirms)

---

## § 4. Per-step post-audit checks

Run after a step's acceptance criteria are met but before STATE.md advances.

| Step | Post-audit check (must pass) |
|---|---|
| 0.1 | `npm run typecheck` passes; `src/tests/types.ts` exports the seven named interfaces |
| 0.2 | `useCurrentTest()` returns Praxis package; `npm run build` produces no errors; manual screenshot of dashboard matches pre-Phase-0 baseline |
| 0.3 | Hooks return the values 45 / 32 / 0.7; old constants still exported (back-compat shim works) |
| 0.4 | `grep -rE "import.*\b(TOTAL_SKILLS\|READINESS_TARGET\|READINESS_GOAL_PCT)\b" src/` returns zero hits outside `src/utils/skillProficiency.ts` and `src/tests/` |
| 0.5 | `git grep -nE "PraxisDomainId" src/` shows the type still exists for back-compat but new code uses `DomainId` |
| 1A.1 | `ls src/tests/PRAXIS_5403/` succeeds with at least an `index.ts` |
| 1A.2 | `find src/data -name questions.json` empty; `git grep -nE "from.*data/questions" src/` empty |
| 1A.3 | `find src/data -name learningModules.ts` empty; module viewer renders identically |
| 1A.4 | `find src/data -name master-glossary.json` empty |
| 1A.5 | `find src/data -name skill-metadata-v1.ts` empty |
| 1A.6 | `find src/data -name skillIdMap.ts` empty |
| 1A.7 | `dist/assets/` shows a separate `PRAXIS_5403*.js` chunk |
| 1A.8 | `git grep -nE "SKILL_BLUEPRINT\|PRAXIS_DISTRIBUTION" src/utils/assessment-builder.ts` empty |
| 1B.1–1B.3 | `npm run validate:tests` exits 0 for clean and non-zero for a deliberate fixture violation |
| 1C.1 | `git grep -nE "Praxis 5403" api/study-plan-background.ts` empty |
| 1C.2 | `git grep -nE "Praxis 5403\|45 skill\|4 domain" api/tutor-chat.ts` empty |
| 1C.3 | Both API endpoints load packages by `testId` parameter |
| 1D.1 | `cat src/tests/KEYSTONE_SCHEMA_VERSION` returns a non-empty version string |
| 1D.2 | `npm run sync:keystone PRAXIS_5403` round-trips to a directory diff'd-clean against `src/tests/PRAXIS_5403/` |
| 1D.3 | `CLAUDE.md` contains a "Keystone Sync" section |
| 1E.1 | `src/design/tokens.ts` exists with the four named exports |
| 1E.2 | `git grep -nE "emerald\|amber\|rose" src/components/ScreenerResults.tsx` empty (or only inside legacy comments) |
| 1E.3 | `find src/utils -name domainColors.ts` empty |
| 1E.4 | `git grep -nE "DOMAIN_COLORS\|DOMAIN_NODE_COLORS" src/components/LoginScreen.tsx` empty |
| 1E.5 | `DomainCard` is imported in 3+ surfaces |
| 1E.6 | `ResultTemplate` is imported by `ScreenerResults.tsx` and `ResultsDashboard.tsx` |
| 2A.1 | `npm run validate:tests` passes for both packages |
| 2A.2 | `src/tests/FTCE_036/copy.ts` and `prompts/*.md` exist |
| 2A.3 | `dist/assets/` shows separate `PRAXIS_5403*.js` and `FTCE_036*.js` chunks |
| 2B.1–2B.5 | All four mockup files load at `http://localhost:8888/mockup-*.html`; user has explicitly approved each (operator records approval in HANDOFF_LOG.md) |
| 3.0 | Audit query result logged to HANDOFF_LOG.md: `SELECT COUNT(*) FROM user_progress GROUP BY primary_exam` |
| 3.1 | All 14+ tables have nullable `test_id` column (verified by `\d <table>`) |
| 3.2 | `SELECT COUNT(*) FROM <each table> WHERE test_id IS NULL` returns 0 |
| 3.3 | Composite indexes on `(user_id, test_id)` present on hot tables |
| 3.4 | `\d <each table>` shows `test_id` NOT NULL DEFAULT 'PRAXIS_5403' |
| 3.5 | `user_tests` table exists; existing `primary_exam` rows migrated to user_tests |
| 3.6 | `useTestScopedQuery.ts` exists; type-tests pass |
| 3.7 | `git grep -nE "supabase\.from\('(user_progress\|responses\|...)'" src/` returns zero outside the wrapper |
| 3.8 | ESLint fails on a deliberate test violation in a fixture file |
| 3.9 | `docs/HOW_THE_APP_WORKS.md` mentions test-scoped queries and `user_tests` |
| 3.10 | `increment_wrong_count` and `record_diagnostic_miss` RPCs accept `p_test_id`; `useRedemptionRounds.ts` passes the active test id |
| 3.11 (admin) | Admin dashboard queries scoped to active test or explicitly marked global |
| 4A.1–4A.3 | Feature flag default OFF; new step renders only with flag ON |
| 4A.4 | `human_gate: true` — operator confirms internal testers report clean switch |
| 4B.1 | `human_gate: true` — operator confirms 7-day soak with no cross-test bugs |
| 4B.2 | `LoginScreen.tsx` marketing copy reads from current test's `copy.ts`, no hardcoded "Praxis 5403" |
| 4B.3 | `HOW_THE_APP_WORKS.md` rewritten exam-agnostic with per-test appendices; `CLAUDE.md` has "Adding a new test" section |

---

## § 5. Drift detection

Each `HANDOFF_LOG.md` entry must include a git SHA. If the SHA in the latest entry is not an ancestor of `HEAD`, the OS has lost continuity.

```bash
last_sha=$(awk '/^Git SHA:/ { print $3; exit }' HANDOFF_LOG.md)
git merge-base --is-ancestor "$last_sha" HEAD || warn "HANDOFF_LOG continuity broken — last logged SHA $last_sha is not in HEAD's ancestry"
```

If continuity is broken, the operator decides whether to repair the log or accept the gap (e.g., a force-push happened intentionally — record reason in next entry).
