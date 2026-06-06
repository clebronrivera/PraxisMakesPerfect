# Phase 1B — Validate Test Packages

## Goal

Add `validateTestPackage()` running in dev boot and CI. Catches malformed packages before they break the app.

## Scope

### Allowed files (create / modify)

- `src/tests/validate.ts` (new)
- `package.json` (add `validate:tests` script)
- CI config if present (e.g. `.github/workflows/`)
- `src/contexts/TestContext.tsx` (add dev-only validation call)

### Forbidden files (no modification)

- Moving content (Phase 1A — already done)
- Adding new packages (Phase 2A scope)
- Production validation (must be dev/CI only)

## Hard blockers preventing this phase

None.

## Steps

### 1B.1 — Implement validateTestPackage()

Allowed: `src/tests/validate.ts`

Acceptance:
- Function returns `{errors: Issue[], warnings: Issue[]}`
- Implements these 10 checks:
  1. Every `question.skillId` exists in `skills.json`
  2. Every `question.microskillId` (if present) exists in `microskills`
  3. Every `module.skillRefs[]` entry exists in `skills.json`
  4. Every `skillMetadata.skillId` exists in `skills.json`
  5. Sum of content-area percentages = 1.0 (±0.005)
  6. Sum of `targetQuestions` = `fullSize`
  7. Every `<GlossaryTooltip term=...>` reference in question explanations exists in `glossary.json`
  8. `copy` has every required key (TS keyof + runtime check)
  9. No duplicate `question.id`, `skill.id`, or `microskill.id`
  10. `legacySkillIdMap` (when present) covers every legacy ID in the prior `skillIdMap.ts`

Verification: unit test runs all 10 checks against PRAXIS_5403 and a fixture with intentional errors.

### 1B.2 — Wire dev-boot validation

Allowed: `src/contexts/TestContext.tsx`

Acceptance:
- In `import.meta.env.DEV`, validation runs once on mount
- Errors throw; warnings log to console
- In production, validation is tree-shaken or skipped (no bundle weight)

Verification:
- `npm run dev:netlify` shows clean validation log
- `npm run build && npm run preview` does not include validate.ts in main chunk (inspect bundle)

### 1B.3 — Add CI script

Allowed: `package.json`, CI config

Acceptance:
- `npm run validate:tests` exits 0 for clean packages, non-zero for errors
- CI runs it on every PR

Verification:
- Run `npm run validate:tests` against current PRAXIS_5403 — exits 0
- Introduce a deliberate error in a fixture, run again — exits non-zero with a useful error message
- Restore the fixture

## Phase Exit Criteria

- `npm run validate:tests` passes for PRAXIS_5403
- Dev boot logs a clean validation pass
- CI runs the validator on PRs
- `STATE.md` updated to Phase 1C step 1C.1 (or to whichever 1B/1C/1D/1E phase the operator picks up next, per the parallelization note in `README.md`)
- Phase branch `refactor/multi-test/phase-1b` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>` for each step's commit. Reverting removes the validator and the dev-boot call; no runtime impact on existing users.
