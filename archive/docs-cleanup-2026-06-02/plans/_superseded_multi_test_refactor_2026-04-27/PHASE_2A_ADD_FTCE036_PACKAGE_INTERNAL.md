# Phase 2A — Add FTCE 036 Package (Internal Only)

## Goal

Add `src/tests/FTCE_036/` as a validated package using the Keystone sync script. **No public UI test switching.** No real user progress for FTCE writes to production tables yet (still no `test_id` column at this point).

## Scope

### Allowed files (create / modify)

- `src/tests/FTCE_036/**` (create via sync script + manual `copy.ts`, `prompts/*.md`)
- `src/tests/index.ts` (register `FTCE_036` thunk)

### Forbidden files (no modification)

- Public UI test selection (Phase 4A scope)
- Database migrations (Phase 3 scope)
- Mockups (Phase 2B scope)
- Any change that exposes the FTCE 036 test to the default user flow

## Hard blockers preventing this phase

- B1 (FTCE 036 competency map not authored) — see `BLOCKERS.md`
- B2 (FTCE 036 test_registry entry not present) — see `BLOCKERS.md`

If B1 or B2 is active, STOP and report. **Do not fabricate Keystone artifacts.** The sync script (Phase 1D) will refuse to run without them, and that refusal is the correct behavior.

## Steps

### 2A.1 — Run sync script for FTCE_036

Allowed: `src/tests/FTCE_036/` (created by script)

Acceptance:
- `npm run sync:keystone FTCE_036` exits 0 (per `COMMANDS.md`)
- `npm run validate:tests` passes for both PRAXIS_5403 and FTCE_036

Verification: validation output shows zero errors.

### 2A.2 — Author FTCE 036 copy.ts and prompts

Allowed: `src/tests/FTCE_036/copy.ts`, `src/tests/FTCE_036/prompts/*.md`

Acceptance:
- Copy fields match Keystone's voice/glossary references for FTCE 036
- Prompts use the same `{{...}}` template variables as the PRAXIS_5403 prompts
- No literal "Praxis" or "5403" anywhere in FTCE_036 files

Verification: `npm run validate:tests` passes; grep for cross-test contamination.

### 2A.3 — Register FTCE_036 in TEST_CATALOG (no UI exposure)

Allowed: `src/tests/index.ts`

Acceptance:
- Catalog entry present as a dynamic-import thunk
- Loading FTCE_036 by passing `?test=FTCE_036` to dev URL works (debug-only escape hatch)
- No onboarding card visible to users; default flow still routes to PRAXIS_5403

Verification:
- `npm run dev:netlify` with `?test=FTCE_036` renders FTCE skill labels
- Default URL (no query param) renders Praxis
- Bundle analyzer shows two distinct test chunks (run `npm run build -- --report`)

## Phase Exit Criteria

- Both packages validate cleanly
- Bundle analyzer shows two distinct test chunks
- No public-facing UI exposes FTCE 036
- `STATE.md` updated to next phase
- Phase branch `refactor/multi-test/phase-2a` squash-merged to main

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>`. Because Phase 2A only adds a new package and registry entry, reverting cleanly removes FTCE 036 with no impact on Praxis users (the debug `?test=` escape hatch was internal-only).
