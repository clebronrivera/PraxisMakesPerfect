# Phase 4A — Internal Test Switching (Flagged)

## Goal

Add the test-selection step in onboarding and the profile switcher in `ProfileEditorPanel.tsx`, gated behind a feature flag. Internal testers can switch tests; general users still see Praxis-only.

## Scope

### Allowed files
- `src/components/OnboardingFlow.tsx`
- `src/components/ProfileEditorPanel.tsx`
- `src/utils/onboardingProfileMapping.ts`
- `src/config/featureFlags.ts` (new — `MULTI_TEST_INTERNAL_PREVIEW`)
- `docs/HOW_THE_APP_WORKS.md`

### Forbidden
- Flipping the flag for production (Phase 4B)

## Hard blockers

- Phase 3 must be complete (otherwise cross-test data pollution).

## Steps

### 4A.1 Add feature flag
Allowed: `src/config/featureFlags.ts`
Acceptance: flag default OFF; readable via env var (`VITE_MULTI_TEST_INTERNAL_PREVIEW`); typed export.

### 4A.2 Test-selection card grid in OnboardingFlow
Allowed: `src/components/OnboardingFlow.tsx`, `src/utils/onboardingProfileMapping.ts`
Acceptance:
- New step rendered only when flag ON
- Cards from `TEST_CATALOG` (PRAXIS_5403, FTCE_036)
- Selection writes to `primary_exam` (with the new uppercase test_id) and inserts a `user_tests` row (per migration 0027)
- Reconciliation logic: if a returning user has `primary_exam = 'ftce_school_psychologist'` (legacy lowercase) but no `user_tests` row, prompt them on next login: "You selected FTCE during onboarding, but FTCE just became available. Continue with FTCE or switch to Praxis?"

### 4A.3 Profile switcher
Allowed: `src/components/ProfileEditorPanel.tsx`
Acceptance:
- New section in `ProfileEditorPanel.tsx` only when flag ON
- Switching freezes current test progress (active test id changes; old test's data preserved by `test_id` scoping); resumes other test cleanly
- All queries scoped to active test via `useTestScopedQuery`

### 4A.4 Internal smoke (`human_gate: true`)
**This step does not auto-advance.** The session reports what to test; the operator runs the smoke and confirms via `force advance`.

Acceptance (human-verified):
- New user with flag ON can complete onboarding on FTCE 036
- Existing user can switch tests without data loss
- Switching back shows the original test's progress unchanged
- Redemption rounds isolate per-test (verified by Phase 3.10 cross-test test, but smoke confirms in real UI)
- Admin dashboard reflects active test (Phase 3.11)

When the operator confirms with `force advance`, the session updates `STATE.md` and proceeds to phase exit.

## Phase Exit Criteria

- Internal testers report clean switch (operator-confirmed)
- No cross-test bleed in queries (verified by Phase 3 tests + smoke)
- `STATE.md` updated to Phase 4B step 4B.1
- `HOW_THE_APP_WORKS.md` includes the multi-test internal-preview behavior

## Rollback

If 4A.4 smoke reveals data bleed:
- Disable the env var (effectively disabling the flag)
- File a P0 blocker in `BLOCKERS.md`
- Do not proceed to 4B until the bleed is fixed
- The Phase 3 wrapper-enforcement is the most likely failure point — audit which callsites bypass `useTestScopedQuery`
