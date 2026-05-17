# Phase 4B — Public Multi-Test Enablement

## Goal

Flip `MULTI_TEST_INTERNAL_PREVIEW` to ON for all users. Update marketing/onboarding copy, `HOW_THE_APP_WORKS.md`, and `CLAUDE.md`.

## Scope

### Allowed files
- `src/config/featureFlags.ts` (default ON)
- `src/components/LoginScreen.tsx` (marketing copy update — read from current test's `copy.ts`, no hardcoded "Praxis 5403")
- `docs/HOW_THE_APP_WORKS.md`
- `CLAUDE.md`

### Forbidden
- Adding new tests (separate content drop)
- Touching adaptive engine, SRS, redemption rounds
- Stripe pricing changes (`DECISIONS.md` #10 locks single-subscription-all-tests for v1)

## Hard blockers (`human_gate: true`)

- Phase 4A must be in production for at least 7 days.
- Zero cross-test bug reports in that window.
- Operator confirms both via `force advance`.

## Steps

### 4B.1 Flip the flag (`human_gate: true`)
Allowed: `src/config/featureFlags.ts`
Acceptance:
- Operator has confirmed the 7-day soak with no cross-test bug reports
- Deploy + monitor for 24h
- Rollback playbook documented in `HANDOFF_LOG.md`: how to flip the env var off and the consequences (users who selected FTCE during onboarding lose access to FTCE content but their data is preserved by `test_id` scoping)

### 4B.2 Update marketing/onboarding copy
Allowed: `src/components/LoginScreen.tsx`
Acceptance:
- Landing page reflects multi-test offering (uses test catalog, not hardcoded "Praxis 5403")
- Stripe pricing copy explicitly states "one subscription, all tests" per `DECISIONS.md` #10
- Per-test marketing snippets read from each test's `copy.ts`
- `git grep -nE "Praxis 5403" src/components/LoginScreen.tsx` returns zero (or only inside legacy-archived comments)

### 4B.3 Documentation pass
Allowed: `docs/HOW_THE_APP_WORKS.md`, `CLAUDE.md`
Acceptance:
- `HOW_THE_APP_WORKS.md` rewritten exam-agnostic with per-test appendices generated from each `copy.ts`
- `CLAUDE.md` documents adding a new test (sync from Keystone, validate, register, ship — pointer to relevant phase docs)
- `CLAUDE.md` updated to reflect that `TOTAL_SKILLS = 45` is no longer accurate as a constant; the per-test skill counts come from the manifest

## Phase Exit Criteria

- Flag ON in production
- No cross-test data anomalies after 7 days post-flip (Sentry, manual smoke, user reports)
- Documentation updated
- `STATE.md` marks refactor complete
- A celebratory entry in `HANDOFF_LOG.md` because this took a lot of careful work

## Rollback

If post-flip monitoring shows cross-test data anomalies:
1. Flip env var back to OFF immediately
2. Users default to Praxis again; FTCE-onboarded users see a "FTCE content temporarily unavailable" notice (data is preserved by `test_id` scoping)
3. File a P0 in `BLOCKERS.md`
4. Re-enter Phase 4A with the bug fix; soak again before re-flipping

## Future work (out of scope for this refactor)

- Adding the remaining 9 Keystone exams (FTCE 060, 061, 018, 025, 026, 053, 082, 083, PCMAS) — each is a Phase 2A repeat once Keystone authoring completes for that exam
- Per-test pricing (if business needs change — would unwind `DECISIONS.md` #10)
- Spanish-language UI for PCMAS (would require i18n machinery — explicitly out of scope per `DECISIONS.md` #9)
- Essay/performance-task support (currently filtered at ingest per `DECISIONS.md` #2)
- Cross-exam prerequisite lattice (the deficiency-on-test-X-routes-to-prereq-on-test-Y feature you mentioned — not part of this refactor; would be a Phase 5+ project)
