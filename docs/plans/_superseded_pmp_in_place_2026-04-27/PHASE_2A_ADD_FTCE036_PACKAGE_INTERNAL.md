# Phase 2A — Add FTCE 036 Package (Internal Only)

## Goal

Add `src/tests/FTCE_036/` as a validated package using the Keystone sync script. **No public UI test switching.** No real user progress for FTCE writes to production tables yet (Phase 3 has not happened, so no `test_id` column exists).

## Scope

### Allowed files
- `src/tests/FTCE_036/**` (created via sync script + manual `copy.ts`, `prompts/*.md`)
- `src/tests/index.ts` (register `FTCE_036` thunk)

### Forbidden
- Public UI test selection (Phase 4A)
- Database migrations (Phase 3)
- Mockups (Phase 2B)

## Hard blockers

- **B1** (FTCE 036 competency map not authored)
- **B2** (canonical multi-exam test_registry — see Phase 1D resolution)
- **B4** (FTCE 036 blueprint not authored)

If B1, B2, or B4 is active, STOP and report. Do not fabricate Keystone artifacts.

## Steps

### 2A.1 Run sync script for FTCE_036
Allowed: `src/tests/FTCE_036/` (created by script)
Acceptance:
- `npm run sync:keystone FTCE_036` exits 0
- `npm run validate:tests` passes for both packages (`PRAXIS_5403` and `FTCE_036`)
Verification: validation output; `_status.json` for FTCE 036 shows `00_blueprint`, `03_competency_map` complete (B1, B4 unblocked).

### 2A.2 Author FTCE 036 copy.ts and prompts
Allowed: `src/tests/FTCE_036/copy.ts`, `src/tests/FTCE_036/prompts/*.md`
Acceptance:
- Copy fields match Keystone's voice/glossary references
- Prompts use the same `{{...}}` template variables as PRAXIS_5403
- Validation passes with FTCE-specific values for `{{testName}}`, `{{skillCount}}`, etc.
Verification: validation passes; spot-check tutor system prompt rendering with `?test=FTCE_036` debug flag (see 2A.3).

### 2A.3 Register FTCE_036 in TEST_CATALOG (no UI exposure)
Allowed: `src/tests/index.ts`
Acceptance:
- Catalog entry present
- Loading FTCE_036 by passing `?test=FTCE_036` to dev URL works (debug-only escape hatch — see security note below)
- No onboarding card visible to users
- Default URL still renders Praxis
**Security note:** the `?test=FTCE_036` escape hatch is gated by:
- `import.meta.env.DEV === true` AND
- `localStorage.PMP_DEBUG_TESTS === '1'` (set manually by internal users)
Production builds tree-shake the parameter parsing entirely. Verify with `npm run build && grep -r "PMP_DEBUG_TESTS" dist/` returns zero.
Verification: dev:netlify with `?test=FTCE_036` and the localStorage flag renders FTCE skill labels; production build does not include the parsing code.

## Phase Exit Criteria

- Both packages validate cleanly
- Bundle analyzer shows two distinct test chunks (`PRAXIS_5403*.js`, `FTCE_036*.js`)
- No public-facing UI exposes FTCE 036
- `STATE.md` updated to Phase 2B step 2B.1

## Rollback

Removing FTCE_036 entirely: delete `src/tests/FTCE_036/`, remove the catalog entry. No DB or runtime state to clean up since there's no test switching yet.
