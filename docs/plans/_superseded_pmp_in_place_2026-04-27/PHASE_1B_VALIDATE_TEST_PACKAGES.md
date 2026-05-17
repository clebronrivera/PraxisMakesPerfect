# Phase 1B — Validate Test Packages

## Goal

Add `validateTestPackage()` running in dev boot and CI. Catches malformed packages before they break the app.

## Scope

### Allowed files
- `src/tests/validate.ts` (new)
- `package.json` (add `validate:tests` script)
- CI config if present (e.g. `.github/workflows/`)
- `src/contexts/TestContext.tsx` (add dev-only validation call)

### Forbidden
- Moving content (Phase 1A — already done)
- Adding new packages (Phase 2A)
- Production validation (must be dev/CI only — production users should not eat validation cost)

## Hard blockers

None.

## Steps

### 1B.1 Implement `validateTestPackage()`
Allowed: `src/tests/validate.ts`
Acceptance:
- Function returns `{errors: Issue[], warnings: Issue[]}`
- Implements all 10 checks:
  1. Every `question.skillId` exists in `skills.json`
  2. Every `question.microskillId` (if present) exists
  3. Every `module.skillRefs[]` entry exists
  4. Every `skillMetadata.skillId` exists
  5. Sum of content-area percentages = 1.0 (±0.005)
  6. Sum of `targetQuestions` per content area = `fullSize`
  7. Every `<GlossaryTooltip term=...>` reference exists in glossary
  8. `copy` has every required key (TS keyof + runtime check)
  9. No duplicate `question.id`, `skill.id`, `microskill.id`
  10. `legacySkillIdMap` covers every legacy ID used by historical data (compute from a fixture of known historical skill IDs)
Verification: unit test runs all 10 checks against PRAXIS_5403 and a fixture with intentional errors; deliberate violations fail correctly.

### 1B.2 Wire dev-boot validation
Allowed: `src/contexts/TestContext.tsx`
Acceptance:
- In `import.meta.env.DEV`, validation runs once on mount
- Errors throw; warnings log to console
- In production, validation is tree-shaken (verify with `npm run build && grep -r "validateTestPackage" dist/` — should not appear in main chunk)
Verification: `npm run dev:netlify` shows clean validation log; `npm run build && npm run preview` does not include validate.ts in main chunk.

### 1B.3 Add CI script
Allowed: `package.json`, CI config
Acceptance:
- `npm run validate:tests` exits 0 for clean packages, non-zero for errors
- CI runs it on every PR
Verification: deliberate violation fails CI; revert and CI passes.

## Phase Exit Criteria

- `npm run validate:tests` passes for `PRAXIS_5403`
- Dev boot logs a clean validation pass
- CI gate active
- `STATE.md` updated to Phase 1C step 1C.1
