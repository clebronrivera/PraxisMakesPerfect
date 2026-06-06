# Phase 0 — Instrumentation

## Goal

Add a `TestContext` seam without changing user-visible behavior. Every test-coupled value flows through hooks; the only registered package is an inline Praxis 5403 literal. After Phase 0 the codebase is *capable* of supporting multiple tests without yet doing so.

## Scope

### Allowed files (create / modify)

- `src/tests/types.ts` (new)
- `src/tests/index.ts` (new)
- `src/contexts/TestContext.tsx` (new)
- `src/utils/skillProficiency.ts` (modify)
- Any file currently importing `TOTAL_SKILLS`, `READINESS_TARGET`, or `READINESS_GOAL_PCT`
- `src/utils/progressTaxonomy.ts` (widen domain id type)
- `src/App.tsx` (wrap with TestContext provider — no other edits)

### Forbidden files (no modification)

- Moving any file from `src/data/` (Phase 1A scope)
- Adding FTCE 036 (Phase 2A)
- Touching API endpoints (Phase 1C)
- Database migrations (Phase 3)
- Onboarding UX (Phase 4A)
- Component visual changes (Phase 1E)

## Hard blockers preventing this phase

None.

## Steps

### 0.1 — Create TestPackage types

Goal: Define `TestPackage`, `TestDomain`, `TestSkill`, `TestSubskill`, `TestMicroskill`, `ContentArea`, `TestCopy` interfaces.

Allowed files:
- `src/tests/types.ts`

Acceptance criteria:
- File compiles
- Interfaces mirror Keystone's `competency_map.schema.json` $defs
- No runtime usage yet (types only)

Verification:
- `npm run typecheck` passes (per `COMMANDS.md`)

### 0.2 — Create inline PRAXIS_5403 package literal + TestContext

Goal: Build a `TestPackage` literal with hardcoded current values; expose via `useCurrentTest()`. This literal will be replaced by a dynamic-import thunk in Phase 1A.7 — note this in your commit message.

Allowed files:
- `src/tests/index.ts`
- `src/contexts/TestContext.tsx`
- `src/App.tsx` (wrap with provider only — no other edits)

Acceptance criteria:
- `useCurrentTest()` returns Praxis 5403 package
- App still renders identically (manual check vs Phase -1.2 baselines)
- No content files moved

Verification:
- `npm run typecheck` passes
- `npm run build` passes
- Manual smoke: dashboard loads, no visual change vs baseline

### 0.3 — Add hooks for readiness constants

Goal: `useTotalSkills()`, `useReadinessTarget()`, `useReadinessGoalPct()`, `useDomainWeights()` reading from current test.

Allowed files:
- `src/contexts/TestContext.tsx`
- `src/utils/skillProficiency.ts`

Acceptance criteria:
- Hooks return current Praxis values (45, 32, 0.7)
- Old constants still exported (back-compat shim) so this step doesn't break callers — Phase 0.4 migrates them

Verification:
- `npm run typecheck` passes

### 0.4 — Migrate TOTAL_SKILLS / READINESS_TARGET callsites to hooks

Goal: Replace direct constant imports with hook calls.

Allowed files:
- Any file importing `TOTAL_SKILLS`, `READINESS_TARGET`, or `READINESS_GOAL_PCT` from `skillProficiency.ts`

Acceptance criteria:
- No remaining direct imports of these constants outside `skillProficiency.ts` and the test package
- Visually equivalent screenshots vs Phase -1.2 baselines (no layout regressions, no missing content, no obvious color/spacing changes; font-rendering / scrollbar pixel diffs OK)

Verification:
- `npm run typecheck`, `npm test`, `npm run build` all pass (per `COMMANDS.md`)
- The "Find leftover readiness constants" search in `COMMANDS.md` returns only definitions and the test package

### 0.5 — Widen `progressTaxonomy.ts` domain ID type

Goal: `PraxisDomainId = 1|2|3|4` → `type DomainId = number`.

Allowed files:
- `src/utils/progressTaxonomy.ts`
- Direct callers of `PraxisDomainId`

Acceptance criteria:
- Type is generic
- Runtime validation against `currentTest.domains` added at the boundary

Verification:
- `npm run typecheck` passes
- The "Find leftover Praxis-only domain id" search in `COMMANDS.md` returns zero hits in `src/`

## Phase Exit Criteria

- All steps complete
- Screenshots of dashboard, results, screener, login are visually equivalent to Phase -1.2 baselines
- `npm run typecheck`, `npm test`, `npm run build`, dev:netlify smoke all pass
- `STATE.md` updated to Phase 1A step 1A.1
- Phase branch `refactor/multi-test/phase-0` squash-merged to main per `DECISIONS.md` item 10

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>` for each step's commit. The phase introduces only additive code (new files + a context provider); reverting is mechanical.
