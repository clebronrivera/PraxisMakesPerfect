# Phase 1A — Extract Praxis 5403 Package

## Goal

Move all Praxis-specific data files into `src/tests/PRAXIS_5403/` and make the inline `TestPackage` load from there. No prompts (Phase 1C), no validation (Phase 1B), no design changes (Phase 1E) — just the file moves.

## Scope

### Allowed files
- `src/tests/PRAXIS_5403/**` (create)
- `src/data/questions.json` (move)
- `src/data/learningModules.ts` (move + convert to JSON)
- `src/data/master-glossary.json` (move)
- `src/data/skill-metadata-v1.ts` (move + convert to JSON)
- `src/data/skillIdMap.ts` (move)
- `src/tests/index.ts`, `src/contexts/TestContext.tsx` (update loaders)
- `src/utils/assessment-builder.ts` (extract `SKILL_BLUEPRINT` and `PRAXIS_DISTRIBUTION`)
- Any file importing the moved files

### Forbidden
- API prompts (Phase 1C)
- Validation (Phase 1B)
- Design tokens (Phase 1E)
- New tests (Phase 2A)

## Hard blockers

None.

## Steps

### 1A.1 Create directory structure
Allowed: `src/tests/PRAXIS_5403/` (mkdir + empty `index.ts`)
Acceptance: directory and skeleton `index.ts` exist.
Verification: `ls src/tests/PRAXIS_5403/` succeeds.

### 1A.2 Move questions.json
Allowed: `src/data/questions.json` → `src/tests/PRAXIS_5403/questions.json`; update all importers.
Acceptance:
- File moved
- All imports updated (`git grep -nE "data/questions" src/` returns zero)
- Build passes
Verification: typecheck, build, dev smoke (questions render in practice).

### 1A.3 Move + convert learningModules.ts → modules.json
Allowed: `src/data/learningModules.ts` → `src/tests/PRAXIS_5403/modules.json`; update importers.
Acceptance:
- TS converted to JSON; helper functions (`getPrimaryModuleForSkill`, `getAllModulesForSkill`, `getModuleIdsForSkill`) move to a small loader at `src/tests/PRAXIS_5403/modules.ts` or `src/utils/moduleLookup.ts`
- All imports updated
- `ModuleLessonViewer` renders identically
Verification: typecheck, build, manual module smoke.

### 1A.4 Move master-glossary.json
Allowed: `src/data/master-glossary.json` → `src/tests/PRAXIS_5403/glossary.json`; update importers.
Acceptance: file moved, imports updated, glossary tab renders.

### 1A.5 Move + convert skill-metadata-v1.ts → skill-metadata.json
Allowed: `src/data/skill-metadata-v1.ts` → `src/tests/PRAXIS_5403/skill-metadata.json`; update importers.
Acceptance: file moved, imports updated, study plan generation still works (the deterministic preprocessor reads from this).

### 1A.6 Move skillIdMap.ts → skill-id-map.ts
Allowed: `src/data/skillIdMap.ts` → `src/tests/PRAXIS_5403/skill-id-map.ts`; update importers.
Acceptance: file moved, imports updated, study plan preprocessor passes typecheck.

### 1A.7 Wire `TestPackage` to load from new locations via dynamic import
Allowed: `src/tests/index.ts`, `src/tests/PRAXIS_5403/index.ts`
Acceptance:
- `TEST_CATALOG.PRAXIS_5403` is a thunk: `() => import('./PRAXIS_5403')`
- Vite bundle report shows a separate `PRAXIS_5403*.js` chunk
Verification: `npm run build`; inspect `dist/assets/` for chunk split.

### 1A.8 Move SKILL_BLUEPRINT and PRAXIS_DISTRIBUTION into the package
Allowed: `src/utils/assessment-builder.ts`, `src/tests/PRAXIS_5403/blueprint.json`
Acceptance:
- `SKILL_BLUEPRINT` constant deleted from `assessment-builder.ts:9`
- `PRAXIS_DISTRIBUTION` constant deleted from `assessment-builder.ts:68`
- Callers pass `currentTest.blueprint` via the existing `customDistribution` parameter at line 109
- The `for...of Object.entries(SKILL_BLUEPRINT)` loops at lines 347 and 372 read from `currentTest.blueprint` instead
Verification: typecheck, build, screener generation produces same item counts (snapshot the pre-Phase-1A screener config and diff after).

## Phase Exit Criteria

- `src/data/` no longer contains `questions.json`, `learningModules.ts`, `master-glossary.json`, `skill-metadata-v1.ts`, `skillIdMap.ts`
- `src/tests/PRAXIS_5403/` is the canonical location
- Vite emits a per-test chunk
- All app surfaces render identically to pre-Phase-1A
- `STATE.md` updated to Phase 1B step 1B.1
- Capture post-Phase-1A screenshot baseline

## Rollback

Each sub-step is its own commit. If 1A.5 (skill-metadata) breaks the study plan generator, `git revert` just that commit; the chunk split from 1A.7 will adapt.
