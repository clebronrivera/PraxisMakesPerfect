# Phase 1A — Extract Praxis 5403 Package

## Goal

Move all Praxis-specific data files into `src/tests/PRAXIS_5403/` and make the inline `TestPackage` load from there. No prompts, no validation, no design changes — just the file move and the thunk conversion.

## Scope

### Allowed files (create / modify)

- `src/tests/PRAXIS_5403/**` (create)
- `src/data/questions.json` (move)
- `src/data/learningModules.ts` (move + convert to JSON)
- `src/data/master-glossary.json` (move)
- `src/data/skill-metadata-v1.ts` (move + convert to JSON)
- `src/data/skillIdMap.ts` (move)
- `src/tests/index.ts`, `src/contexts/TestContext.tsx` (update loaders)
- Any file importing the moved files
- `src/utils/assessment-builder.ts` (Phase 1A.8 — extract SKILL_BLUEPRINT, PRAXIS_DISTRIBUTION)

### Forbidden files (no modification)

- API prompts (Phase 1C scope)
- Validation (Phase 1B scope)
- Design tokens (Phase 1E scope)
- New tests (Phase 2A scope)

## Hard blockers preventing this phase

None.

## Steps

### 1A.1 — Create directory structure

Allowed: `src/tests/PRAXIS_5403/` (mkdir + empty `index.ts`)

Acceptance:
- Directory and skeleton `index.ts` exist
- `index.ts` exports nothing yet (or exports a placeholder type)

Verification:
- `test -d src/tests/PRAXIS_5403`
- `npm run typecheck` passes

### 1A.2 — Move questions.json

Allowed: `src/data/questions.json` → `src/tests/PRAXIS_5403/questions.json`; update all importers.

Acceptance:
- File moved (use `git mv` to preserve history)
- All imports updated; the "Find leftover skill content imports" search in `COMMANDS.md` returns zero hits for `questions`
- Build passes

Verification: typecheck, build, dev:netlify smoke (per `VERIFICATION_MATRIX.md` row for Phase 1A).

### 1A.3 — Move + convert learningModules.ts to modules.json

Allowed: `src/data/learningModules.ts` → `src/tests/PRAXIS_5403/modules.json`; update importers.

Acceptance:
- TS converted to JSON (no executable code in the file)
- All imports updated to read JSON
- ModuleLessonViewer renders identically vs Phase -1.2 baselines

Verification: typecheck, build, manual module smoke.

### 1A.4 — Move master-glossary.json

Allowed: `src/data/master-glossary.json` → `src/tests/PRAXIS_5403/glossary.json`; update importers.

Acceptance: file moved, imports updated, glossary tab renders.

Verification: typecheck, build, glossary tab loads in dev:netlify.

### 1A.5 — Move + convert skill-metadata-v1.ts

Allowed: `src/data/skill-metadata-v1.ts` → `src/tests/PRAXIS_5403/skill-metadata.json`; update importers.

Acceptance: file moved, imports updated, study plan generation still works.

Verification: typecheck, build, study plan smoke.

### 1A.6 — Move skillIdMap.ts

Allowed: `src/data/skillIdMap.ts` → `src/tests/PRAXIS_5403/skill-id-map.ts`; update importers.

Acceptance: file moved, imports updated, study plan preprocessor passes typecheck.

Verification: typecheck.

### 1A.7 — Wire TestPackage to load from new locations via dynamic import

Allowed: `src/tests/index.ts`, `src/tests/PRAXIS_5403/index.ts`

Acceptance:
- `TEST_CATALOG.PRAXIS_5403` is a thunk: `() => import('./PRAXIS_5403')`
- The inline literal created in Phase 0.2 is removed and replaced by the dynamic import
- Vite bundle report shows a separate Praxis chunk

Verification:
- `npm run build` (per `COMMANDS.md`)
- Inspect `dist/` for chunk split; document the chunk name in HANDOFF_LOG.md

### 1A.8 — Move SKILL_BLUEPRINT and PRAXIS_DISTRIBUTION into the package

Allowed: `src/utils/assessment-builder.ts`, `src/tests/PRAXIS_5403/blueprint.json`

Acceptance:
- `SKILL_BLUEPRINT` constant deleted from `assessment-builder.ts`
- `PRAXIS_DISTRIBUTION` constant deleted
- Callers pass `currentTest.blueprint` via the existing `customDistribution` parameter

Verification: typecheck, build, screener generation produces same item counts vs baseline.

## Phase Exit Criteria

- `src/data/` no longer contains `questions.json`, `learningModules.ts`, `master-glossary.json`, `skill-metadata-v1.ts`, `skillIdMap.ts`
- `src/tests/PRAXIS_5403/` is the canonical location
- Vite emits a per-test chunk
- All app surfaces are visually equivalent to Phase -1.2 baselines (no layout regressions, missing content, or obvious color/spacing changes)
- `STATE.md` updated to Phase 1B step 1B.1
- Phase branch `refactor/multi-test/phase-1a` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>` for each step's commit. Because this phase uses `git mv`, reverting restores files to their original locations and import paths automatically.
