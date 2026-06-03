# Phase 4B — Public Multi-Test Enablement

## Goal

Flip `MULTI_TEST_INTERNAL_PREVIEW` to ON for all users. Update marketing/onboarding copy, `HOW_THE_APP_WORKS.md`, and `CLAUDE.md`.

## Precondition (operator-confirmed, NOT a Claude Code task)

**Phase 4B may only begin after the operator confirms** that Phase 4A has been live in production for 7 days with no cross-test bug reports. Claude Code does not "monitor" or "wait" for soak periods inside a step — the operator gates Phase 4B start by saying "begin next phase" only when the soak has elapsed.

If the operator says "begin next phase" while `STATE.md` shows Phase 4A as completed less than 7 days ago, stop and report:

> Phase 4A completed on YYYY-MM-DD; the 7-day soak ends on YYYY-MM-DD. Confirm the soak is complete and there are no cross-test bug reports before re-issuing the command.

The Phase 4A merge date is recorded in `HANDOFF_LOG.md` (Phase 4A exit criterion).

## Scope

### Allowed files (create / modify)

- `src/config/featureFlags.ts` (default ON)
- `src/components/LoginScreen.tsx` (marketing copy update)
- `docs/HOW_THE_APP_WORKS.md`
- `CLAUDE.md`
- `docs/plans/multi-test-refactor/STATE.md` (mark refactor complete)

### Forbidden files (no modification)

- Adding new tests (separate content drop, not part of this refactor)
- Touching adaptive engine, SRS, redemption rounds (per `DECISIONS.md` "What does NOT change")
- Any monitoring / waiting / sleep logic inside step bodies

## Hard blockers preventing this phase

None at the code level. The 7-day soak is an operator precondition above, not a code blocker.

## Steps

### 4B.1 — Flip the flag (immediate code change)

Allowed: `src/config/featureFlags.ts`

Acceptance:
- `MULTI_TEST_INTERNAL_PREVIEW` default value flipped to `true`
- Rollback procedure documented in `HANDOFF_LOG.md` (revert commit + redeploy)

Verification: `grep -n "MULTI_TEST_INTERNAL_PREVIEW" src/config/featureFlags.ts` shows `true` as default; build succeeds.

### 4B.2 — Update marketing/onboarding copy

Allowed: `src/components/LoginScreen.tsx`

Acceptance:
- Landing page hero / boot lines reflect multi-test offering
- All visible text reads coherently for both Praxis 5403 and FTCE 036 users (no "your Praxis prep" copy that breaks for FTCE users)

Verification: dev:netlify, view login screen with flag ON; copy reads correctly. Capture a final-state screenshot for the marketing comparison.

### 4B.3 — Documentation pass

Allowed: `docs/HOW_THE_APP_WORKS.md`, `CLAUDE.md`

Acceptance:
- `HOW_THE_APP_WORKS.md` rewritten as exam-agnostic with per-test appendices generated from each `copy.ts`
- `CLAUDE.md` documents adding a new test (sync from Keystone, validate, register, ship). Cross-references the Keystone Sync section added in Phase 1D.

Verification: peer-read confirms the docs are sufficient to onboard a new engineer without verbal context.

### 4B.4 — Mark refactor complete

Allowed: `docs/plans/multi-test-refactor/STATE.md`

Acceptance:
- All phases marked complete in `STATE.md`
- Final entry in `HANDOFF_LOG.md` notes the production deployment date and includes the rollback command

Verification: `STATE.md` shows no active step; phase progress checkboxes all checked.

## Phase Exit Criteria

- Flag default is `true` in `src/config/featureFlags.ts`
- Documentation updated
- `STATE.md` marks refactor complete
- Phase branch `refactor/multi-test/phase-4b` squash-merged to main
- (Post-merge production monitoring is the operator's responsibility, not Claude Code's)

## Rollback procedure

Single-step rollback: `git revert <SHA-of-4B.1>` and redeploy. The flag returns to OFF; users default back to Praxis-only flow. Existing FTCE users retain their `user_tests` rows but those rows become inert — UI no longer surfaces them.

If a more aggressive rollback is needed (e.g., remove FTCE 036 entirely), follow the Phase 2A rollback procedure: revert the Phase 2A merge commit. This does NOT undo Phase 3's database schema (which is intentional — `test_id` columns are forward-compatible).
