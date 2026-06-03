# Phase 4A — Internal Test Switching (Flagged)

## Goal

Add the test-selection step in onboarding and the profile switcher in `ProfileEditorPanel.tsx`, gated behind a feature flag. Internal testers can switch tests; general users still see Praxis-only.

## Scope

### Allowed files (create / modify)

- `src/components/OnboardingFlow.tsx`
- `src/components/ProfileEditorPanel.tsx`
- `src/utils/onboardingProfileMapping.ts`
- `src/config/featureFlags.ts` (new — `MULTI_TEST_INTERNAL_PREVIEW`)
- `docs/HOW_THE_APP_WORKS.md`

### Forbidden files (no modification)

- Flipping the flag for production (Phase 4B scope)
- Database schema changes (Phase 3 scope, already complete by this point)

## Hard blockers preventing this phase

- Phase 3 must be complete (otherwise cross-test pollution risk).
- Phase 2A must be complete (FTCE 036 package registered in `TEST_CATALOG`).
- Phase 2B must be complete (selector UI based on approved mockups).

## Steps

### 4A.1 — Add feature flag

Allowed: `src/config/featureFlags.ts`

Acceptance:
- Flag default OFF
- Readable via env var (e.g., `VITE_MULTI_TEST_INTERNAL_PREVIEW=1`)
- Single source of truth for the flag value (don't read process.env directly elsewhere)

Verification: `npm run typecheck`; flag importable from `OnboardingFlow.tsx` and `ProfileEditorPanel.tsx`.

### 4A.2 — Test-selection card grid in OnboardingFlow

Allowed: `src/components/OnboardingFlow.tsx`

Acceptance:
- New step rendered only when flag is ON
- Cards from `TEST_CATALOG` (uses Phase 1A registry + Phase 2A FTCE entry)
- Selection writes to `primary_exam` and inserts a `user_tests` row (per migration 0027)
- Implements the design from the Phase 2B `mockup-test-selector.html`

Verification: dev:netlify with flag ON, complete onboarding on FTCE 036; verify `user_tests` row created.

### 4A.3 — Profile switcher

Allowed: `src/components/ProfileEditorPanel.tsx`

Acceptance:
- New section in `ProfileEditorPanel.tsx` only when flag is ON
- Switching freezes current test progress; resumes other test cleanly
- All queries scoped to active test via `useTestScopedQuery` (built in Phase 3.6)

Verification:
- Switch from Praxis to FTCE → dashboard shows FTCE
- Switch back to Praxis → dashboard shows Praxis with progress preserved
- Confirm in DB: `SELECT * FROM responses WHERE user_id = '<test user>'` shows rows for both `test_id` values, with no cross-pollination

### 4A.4 — Internal smoke walk

Acceptance:
- New user with flag ON can complete onboarding on FTCE 036
- Existing user can switch tests without data loss
- All 7 admin dashboard tabs still load correctly
- Tutor + study plan respect the active test

Verification: full smoke walk per `VERIFICATION_MATRIX.md` row for Phase 4A, with flag ON.

## Phase Exit Criteria

- Internal testers report clean switch (operator-confirmed, recorded in `HANDOFF_LOG.md`)
- No cross-test bleed in queries
- `STATE.md` updated to Phase 4B
- Phase branch `refactor/multi-test/phase-4a` squash-merged to main
- Phase 4A merge date recorded in `HANDOFF_LOG.md` (start of the 7-day soak period for Phase 4B precondition)

## Rollback procedure

Default per `SESSION_RULES.md`: `git revert <SHA>`. Because the flag is OFF by default, even partial rollback leaves all users on the existing Praxis-only flow. The `user_tests` rows written by internal testers remain in the DB but are inert until the flag is flipped.
