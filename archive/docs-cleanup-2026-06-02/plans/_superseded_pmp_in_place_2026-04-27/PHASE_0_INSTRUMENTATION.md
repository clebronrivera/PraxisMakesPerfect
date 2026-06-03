# Phase 0 — Instrumentation

## Goal

Add a `TestContext` seam without changing user-visible behavior. Every test-coupled value flows through hooks; the only registered package is an inline Praxis 5403 literal. Pixel-identical to pre-Phase-0.

## Scope

### Allowed files (across the whole phase)
- `src/tests/types.ts` (new)
- `src/tests/index.ts` (new)
- `src/contexts/TestContext.tsx` (new)
- `src/utils/skillProficiency.ts` (modify — add hooks, keep constants as back-compat shim)
- `src/utils/progressTaxonomy.ts` (widen domain id type)
- `src/App.tsx` (wrap with provider — no other edits)
- Any file currently importing `TOTAL_SKILLS`, `READINESS_TARGET`, `READINESS_GOAL_PCT` (migrate to hooks)

### Forbidden
- Moving any file from `src/data/` (Phase 1A)
- Adding FTCE 036 (Phase 2A)
- Touching API endpoints (Phase 1C)
- Database migrations (Phase 3)
- Onboarding UX (Phase 4A)
- Component visual changes (Phase 1E)

## Hard blockers

None.

## Steps

### 0.1 Create TestPackage types
Goal: Define `TestPackage`, `TestDomain`, `TestSkill`, `TestSubskill`, `TestMicroskill`, `ContentArea`, `TestCopy` interfaces.
Allowed files: `src/tests/types.ts`
Acceptance criteria:
- File compiles
- Interfaces mirror Keystone's `competency_map.schema.json` `$defs`
- No runtime usage yet
- `TestPackage` carries `legacySkillIdMap: Record<string, string>` (decision #11) and `unsupportedParts: string[]` (decision #2)
Verification: `npm run typecheck` passes; post-audit 0.1 from `AUDIT_CHECKS.md`.

### 0.2 Create inline PRAXIS_5403 literal + TestContext
Goal: Build a `TestPackage` literal with hardcoded current values; expose via `useCurrentTest()`.
Allowed files: `src/tests/index.ts`, `src/contexts/TestContext.tsx`, `src/App.tsx` (wrap only)
Acceptance criteria:
- `useCurrentTest()` returns Praxis 5403 package
- App renders identically to pre-Phase-0 (manual screenshot match)
- No content files moved
Verification: `npm run typecheck` and `npm run build` pass; manual smoke; screenshot match dashboard.

### 0.3 Add hooks for readiness constants
Goal: `useTotalSkills()`, `useReadinessTarget()`, `useReadinessGoalPct()`, `useDomainWeights()` reading from current test.
Allowed files: `src/contexts/TestContext.tsx`, `src/utils/skillProficiency.ts`
Acceptance criteria:
- Hooks return current Praxis values (45, 32, 0.7)
- Old constants still exported (back-compat shim)
Verification: `npm run typecheck` passes.

### 0.4 Migrate `TOTAL_SKILLS` / `READINESS_TARGET` / `READINESS_GOAL_PCT` callsites to hooks
Goal: Replace direct constant imports with hook calls everywhere.
Allowed files: any file importing these constants from `skillProficiency.ts`.
Acceptance criteria:
- No remaining direct imports of these constants outside `skillProficiency.ts` and the test package
- App still renders identically
- Pixel-identical screenshots vs pre-Phase-0
Verification: `npm run typecheck`, `npm test`, `npm run build` all pass; post-audit 0.4 (`grep` returns zero hits outside the allowed locations).

### 0.5 Widen `progressTaxonomy.ts` domain ID type
Goal: `PraxisDomainId = 1|2|3|4` → `type DomainId = number`. Keep `PraxisDomainId` exported as a back-compat alias.
Allowed files: `src/utils/progressTaxonomy.ts` and direct callers of `PraxisDomainId`.
Acceptance criteria:
- Type is generic
- Runtime validation against `currentTest.domains` added at the boundary (so an invalid domain id still throws cleanly)
Verification: `npm run typecheck` passes.

## Phase Exit Criteria

- All steps complete
- Screenshots of dashboard, results, screener, login pixel-identical to pre-Phase-0 baseline
- `npm run typecheck`, `npm test`, `npm run build`, dev:netlify smoke all pass
- `STATE.md` updated to Phase 1A step 1A.1
- Capture post-Phase-0 screenshot baseline at `docs/screenshots/baselines/phase-0/`

## Rollback

If any step fails acceptance and the issue can't be fixed within scope:
1. `git revert` the offending step's commit(s).
2. Update `STATE.md` to mark the failed step as `rolled_back` with rationale.
3. Append a rollback entry to `HANDOFF_LOG.md`.
4. Either retry with a corrected approach or escalate to operator for re-scoping.
