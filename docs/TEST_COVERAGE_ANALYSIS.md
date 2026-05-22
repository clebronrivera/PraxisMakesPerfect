# Test Coverage Analysis & Improvement Proposal

_Last updated: 2026-05-22_

## 1. What we have today

- **Test runner:** Vitest 4 (`npm test`), plus two standalone `tsx`-driven runtime checks (`npm run test:runtime`).
- **Suite size:** 14 vitest files, **153 unit tests**, all green in ~2.6 s.
- **No coverage tool** is configured. `vitest` runs without `--coverage`, there is no `c8` / `istanbul` reporter, and CI gates only `npm run check` (types + lint + tests). We are flying blind on coverage percentages.
- **Codebase size:** ~25 k LOC across `src/{brain,hooks,services,utils}` and `api/` alone. The 14 test files exercise an estimated **<15 % of production logic** (rough surface-area estimate; see §3).

### What is tested today

| Layer | File(s) under test |
|---|---|
| Adaptive engine math | `src/brain/learning-state`, `distractor-matcher`, `error-library` |
| Adaptive selection in hook | `useAdaptiveLearning` priority + selection paths |
| Diagnostic flow | `useAssessmentFlow` resume behaviour (`diagnosticResume.test.ts`) |
| Question utilities | `questionDifficulty`, `parseClaude`, `analyzeQuestion` (via `code-health`) |
| Data integrity | `questions.json` schema, `skillPrereqGraph`, `skillPhaseDLookup` |
| Pure utilities | `srsEngine`, `skillProficiency` |
| Study plan input shaping | `studyPlanService.normalizeStudyInputs` (one function only) |
| Content scripts | `apply-phase-c.mjs` CSV parser, misconception framing script |

That is the entire surface. Everything below is **untested**.

---

## 2. Highest-risk untested areas (ranked)

### Tier 1 — Money, security, data loss

These can cause irreversible harm. They should be the next things we test.

1. **`api/stripe-webhook.ts` (174 LOC)** — Verifies Stripe signatures and mutates `user_subscriptions`. A regression here is "users charged but not entitled" or vice-versa. We have zero tests for signature verification, idempotency, refund/cancellation flows, or partial DB write recovery.
2. **`api/admin-delete-user.ts` (153 LOC)** — Cascading delete across 8+ tables with no rollback. A bug here permanently destroys student data. Must be tested for: ordering, partial-failure behaviour, and `isAdminEmail()` enforcement.
3. **`api/admin-reset-assessment.ts` (280 LOC)** — Archives + deletes `responses`, then rebuilds aggregates. If rebuild fails mid-flight, scores diverge from the audit log silently.
4. **`src/utils/rebuildProgressFromResponses.ts`** — The function admin-reset relies on to recompute `skill_scores` from raw events. Pure, easily testable, currently uncovered.
5. **`src/hooks/useRedemptionRounds.ts` (369 LOC)** — Quarantine system with explicit invariants in CLAUDE.md ("3 wrong → quarantine; 3 correct in redemption → cleared; hint always quarantines immediately"). Mixed-path edge case (wrong twice → hint) is documented but unverified. Off-by-one in `practiceQuestionsSinceCredit` would silently break the credit economy.

### Tier 2 — Adaptive learning correctness

The pedagogical engine. Bugs here are user-visible (wrong skill flagged, wrong remediation), reputationally costly, and very hard to detect after the fact because there's no oracle.

6. **`api/study-plan-background.ts`** — Server-side rate limit (1 plan / 7 days), schemaVersion filtering of failure rows, prompt assembly, polling response shape. CLAUDE.md explicitly calls out: _"If you change the failure-row shape, update the server-side filter to match."_ We have no test pinning that contract.
7. **`src/utils/studyPlanPreprocessor.ts` (784 LOC)** — Hard-threshold status labels, urgency scoring, time budget, weekly schedule. CLAUDE.md treats these labels as a contract with the AI prompt. A regression silently changes what Claude is told.
8. **`src/brain/question-generator.ts`, `question-validator.ts`, `answer-generator.ts` (~1.8 k LOC)** — Question / distractor / rationale synthesis. We test that questions in `questions.json` are well-formed but not that the generator produces well-formed questions. The script `audit:bank` is a *script*, not a unit test.
9. **`src/brain/diagnostic-feedback.ts` (497 LOC)** — Generates the post-diagnostic narrative. Only smoke-covered in `code-health.test.ts` ("handles canonical bank question shape"). No tests for empty domain, all-correct, all-wrong, mixed-confidence paths.
10. **`src/utils/globalScoreCalculator.ts` (365 LOC)** — Cross-skill aggregate that drives the readiness target (70 % of 45 skills). One smoke test only.

### Tier 3 — High-traffic hooks & services

Lots of state, plenty of `useEffect`s, frequent edits.

11. **`src/hooks/useProgressTracking.ts` (973 LOC)** — Central read/write of `user_progress`, score recomputation, persistence. The single most-touched file in the repo with no direct tests.
12. **`src/services/studyPlanService.ts` (962 LOC)** — Polling loop, prompt synthesis, 7-day client-side gate, document normalization. Only `normalizeStudyInputs` is tested.
13. **`src/hooks/useAssessmentFlow.ts` (879 LOC)** — Diagnostic resume is covered. Question pre-selection, follow-up insertion, and finalization are not.
14. **`src/utils/responseRetryQueue.ts`** — localStorage-backed retry for failed `responses` inserts. Quota exhaustion and zombie retries are unverified.
15. **`api/tutor-chat.ts` (841 LOC) + `src/utils/tutorIntentClassifier.ts`** — Intent routing and quiz-engine state. Misclassification routes users into the wrong flow with no telemetry to detect it.
16. **`api/leaderboard.ts`, `api/admin-item-analysis.ts`** — Cross-user reads via service role. Hard-coded thresholds (0.80) and aggregation math are unchecked.

### Tier 4 — Smaller utilities worth a cheap unit test each

`assessmentReport.ts`, `progressSummaries.ts`, `focusItemExtractor.ts`, `onboardingFormToSavePayload.ts`, `scoreReportGenerator.ts`, `vocabQuizGenerator.ts`, `feedbackAudit.ts`, `confidenceLabels.ts`. Mostly pure functions; high reward / low effort.

---

## 3. Cross-cutting gaps in how we test

Independent of which file is covered:

- **No coverage instrumentation.** `vitest --coverage` is one config flag plus `@vitest/coverage-v8`. Without it we can't say "this PR drops coverage from X to Y."
- **No component tests.** 54 React components, zero render tests. We have no protection against regressions in `PracticeSession`, `AdaptiveDiagnostic`, `ResultsDashboard`, `AdminDashboard`, `RedemptionRoundSession`.
- **No integration / e2e tests.** No Playwright, no Cypress, no MSW-based flow tests. Auth → diagnostic → study plan → practice is the product, and it's never end-to-end verified.
- **API handlers are tested only as pure functions, never as HTTP handlers.** No fixtures for `event`, no assertions on status codes or `Retry-After` headers.
- **No Supabase contract tests.** RLS policies and the `increment_wrong_count` RPC are critical correctness boundaries with no tests.
- **No property-based or fuzz testing** for the question generator / distractor matcher, where adversarial inputs are exactly the failure mode that matters.
- **Two test runners (vitest + raw tsx).** `adaptive-coaching.test.ts` and `code-health.test.ts` are excluded from vitest and run via a separate `test:runtime` script. They should be ported to vitest so they appear in coverage and in one report.

---

## 4. Proposed plan

### Phase 0 — Make coverage measurable (½ day)
- Add `@vitest/coverage-v8`, enable `--coverage` in CI, fail PRs that drop line coverage below a starting baseline (suggest: whatever today is, +0).
- Port `adaptive-coaching.test.ts` and `code-health.test.ts` to vitest's `describe/it` so they're in the same report.
- Add a `coverage` badge / summary comment to PRs.

### Phase 1 — Tier 1 risk reduction (1 week)
- `stripe-webhook` handler tests with fixture events (checkout completed, subscription updated, signature invalid).
- `admin-delete-user` and `admin-reset-assessment` tests against a Supabase test schema or a thin mock, asserting cascade order and idempotency.
- `useRedemptionRounds` tests for: 3-miss quarantine, hint-immediate quarantine, mixed path (CLAUDE.md edge case), 3-correct clearance, credit counter rollover.
- `rebuildProgressFromResponses` golden-master test from a captured `responses` fixture.

### Phase 2 — Adaptive engine pinning (1–2 weeks)
- Snapshot test `studyPlanPreprocessor` outputs for a curated set of synthetic learners (low / mixed / high mastery). Lock the status-label thresholds.
- `question-generator` + `question-validator` round-trip tests: generate N questions per template, assert distractor uniqueness, answer-position balance, schema validity.
- `diagnostic-feedback` matrix tests over (domain × proficiency × confidence) cells.
- Tighten `studyPlanService` polling test with fake timers; cover the 4-minute timeout and the failure-row filter contract.

### Phase 3 — Component & flow coverage (2 weeks)
- Add Vitest + React Testing Library setup. First targets: `PracticeSession`, `RedemptionRoundSession`, `AdaptiveDiagnostic`, `OnboardingFlow`, `ResultsDashboard`.
- Add Playwright with a smoke pack: login → diagnostic → results → practice → redemption. One happy path is more valuable than ten unit tests for `useState` plumbing.
- MSW-based fixtures for Supabase responses so component tests don't hit the network.

### Phase 4 — Long-tail hygiene (ongoing)
- One unit test per pure util in Tier 4 as part of normal feature work ("touched it, test it").
- Property-based tests (`fast-check`) for `distractor-matcher` and `answer-generator`.
- Supabase RLS contract tests as a separate `npm run test:rls` job.

---

## 5. Suggested guardrails

- **Coverage floor:** start at the measured baseline, ratchet up only via PR review (never auto-lower).
- **New file rule:** any new file in `src/utils/`, `src/brain/`, or `api/` must ship with at least one `.test.ts`.
- **Hard-threshold rule:** any constant called out in CLAUDE.md (proficiency cuts, redemption thresholds, rate-limit windows) must be asserted in a test so it can't drift silently.
- **Test the contract, not the implementation:** prefer fixture-in / JSON-out golden tests for `studyPlanPreprocessor`, `globalScoreCalculator`, `rebuildProgressFromResponses`. They survive refactors.

---

## 6. Quick wins to do this week

If we only have a couple of days, do these in order:

1. Enable `vitest --coverage` and publish the baseline number.
2. Write tests for `useRedemptionRounds` quarantine + clearance invariants (CLAUDE.md spells them out, so the spec is free).
3. Write tests for `rebuildProgressFromResponses` (pure function, golden-master friendly).
4. Add a fixture-based test for `stripe-webhook` signature verification.
5. Port `adaptive-coaching.test.ts` and `code-health.test.ts` to vitest.

Each is small, each kills a concrete class of regression, and together they tighten coverage on the three areas where a bug would be most painful: money, data loss, and the redemption loop.
