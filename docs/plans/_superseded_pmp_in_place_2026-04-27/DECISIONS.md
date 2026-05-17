# Architectural Decisions

These are committed. Do not re-argue. If you think a decision should change, write a proposal in `BLOCKERS.md` — do not unilaterally deviate.

## Path commitment

**0. Refactor PMP in place; do not pursue PASS V1 greenfield.**
- Considered alternative: build PASS V1 from scratch in a separate folder, lift patterns from PMP, retire PMP.
- Rejected because: (a) PMP already has 22 migrations, redemption RPCs, study plan v2, admin dashboard, Stripe; (b) `useTestScopedQuery` + manifest extraction is a well-understood refactor; (c) real users on PMP would need data migration anyway, defeating greenfield's "no legacy" advantage.
- The earlier `Keystone/_inbox/PASS_V1_COWORKER_BRIEFING.md` is superseded by this plan.

## Data model

**1. PMP grows from 2-level to 4-level taxonomy.**
- Today: domain → skill.
- After refactor: domain (Keystone blueprint_group) → skill (Keystone competency, UI cards) → subskill (Keystone skill, internal clustering) → microskill (Keystone microskill, adaptive engine).
- User-facing surface still shows 2–3 levels per screen. Microskills are an internal granularity for content tagging and item routing.
- Per-screen depth is documented in `EXAM_TAXONOMY.md` (authored during Phase 0).

**2. Non-MCQ formats are filtered at ingest in v1.**
- Keystone supports `multiple_choice | essay_rubric | constructed_response | performance_task | mixed`.
- PMP v1 ingests only `multiple_choice` parts; others are skipped and logged as a coverage gap.
- Loaded `TestPackage` carries `unsupportedParts: string[]` for UI banners.
- Full essay/performance support is out of scope for this refactor.

**3. Test packages are file-based, bundled per test, code-split.**
- Content lives at `src/tests/<TEST_ID>/`.
- Vite emits one chunk per test via dynamic import.
- Why not Supabase: 6 MB JSON per exam, RLS overhead, worse authoring loop than git diffs. Defer admin-uploaded tests indefinitely.

**4. Keystone is the upstream authoring corpus.**
- PMP imports via `scripts/sync-from-keystone.mjs` reading **multiple folders per exam**: `00_blueprint/`, `02_question_bank/enriched/`, `03_competency_map/`, `05_chapters/`, optionally `08_handoff/`.
- The earlier "read from `08_handoff/` only" approach was wrong — Keystone's handoff dir is mostly empty and authored content lives across the other folders.
- Schema contracts pinned in `src/tests/KEYSTONE_SCHEMA_VERSION` and Keystone's `pipeline/schemas/`.

**5. First non-Praxis target is FTCE 036 (School Psychologist PK-12).**
- Subject-aligned with current Praxis 5403 → minimal taxonomy divergence.
- Test ID format: `FTCE_036` (uppercase, matches Keystone `test_registry.schema.json` examples).

## Migration sequencing

**6. DB scoping (Phase 3) precedes public multi-test enablement (Phase 4B).**
- Phase 2A ships FTCE 036 as a *validated internal package only* — no public test switching, no real user progress writes for FTCE.
- Phase 4A adds onboarding/profile switching behind a feature flag.
- Phase 4B flips the flag, but only after Phase 3 backfills `test_id` on all existing rows.
- Why: prevents cross-test data pollution.

**7. Existing user data is backfilled as `test_id = 'PRAXIS_5403'` regardless of `primary_exam`.**
- Rationale: every question PMP has ever served is a Praxis question. Even users whose `primary_exam = 'ftce_school_psychologist'` have only Praxis response rows in the database. Their *intent* doesn't change the *shape* of the data they generated.
- Migration 0024 blanket-backfills `test_id = 'PRAXIS_5403'` on all existing rows in the affected tables.
- The `primary_exam` profile field is left untouched. Phase 4A's test selector reconciles intent vs. available content ("You selected FTCE during onboarding, but FTCE isn't ready — continue with Praxis?").
- Each `TestPackage` carries `legacySkillIdMap: Record<string, string>` mapping pre-refactor PMP skill IDs (e.g. `CON-01`) to new Keystone IDs.

## Design system

**8. Atelier wins the 3-way color conflict.**
- Today: Atelier pastels (current) coexist with Editorial palette in `src/utils/domainColors.ts` and inline emerald/amber/rose in `ScreenerResults.tsx:22-25` and `ScreenerResults.tsx:67`.
- After refactor: single `src/design/tokens.ts`. Atelier is the source. Editorial and inline triads deprecated.

**9. Design system scope is "Medium."**
- Token consolidation (yes).
- Extract `DomainCard` and `ResultTemplate` (yes — duplicated 3+ times).
- i18n / Storybook / per-screen theme overrides (no — out of scope).

## Pricing, security, semantics

**10. v1 multi-test pricing: single subscription unlocks all attached tests.**
- `user_subscriptions` (migration 0014) is per-user, not per-test. Keep it that way for v1.
- Per-test pricing deferred indefinitely. If the business decides differently later, that's a separate project with its own migration set.
- Implication: a user paying for premium gets premium across every test they attach. Stripe products do not change in 4B.

**11. `legacySkillIdMap` is translate-on-read, not a DB rewrite.**
- The renderer reads `study_plans.plan_document` and `responses.skill_id` rows through the map at render time.
- No mass migration of historical skill IDs. v1 plans age out as users complete cycles.
- Implication: the map must remain accurate forever for any historical row to render correctly. It's append-only.

**12. Test scoping is wrapper-enforced, not RLS-enforced.**
- RLS policies stay `auth.uid() = user_id`. They do not reference `test_id`.
- `useTestScopedQuery` injects `.eq('test_id', activeTestId)` at the application layer.
- Implication: admin scripts (like `scripts/admin-delete-study-plan.mjs`) must explicitly filter by `test_id`. Future engineers writing direct Supabase queries can accidentally cross-test-pollute. The ESLint rule against raw `supabase.from(<scoped_table>)` is the line of defense at code review.
- The two existing RPCs (`increment_wrong_count`, `record_diagnostic_miss` in `useRedemptionRounds.ts:109,203`) get `p_test_id` parameters in Phase 3 step 3.10.

## State-machine semantics

**13. Phases run serially (1B → 1C → 1D → 1E), not in parallel.**
- Earlier draft suggested 1B–1E could parallelize after 1A. Rejected because `STATE.md` has a single `Active Step` and parallel branches make the state machine ambiguous.
- Net cost: ~1 week. Net benefit: deterministic state, no merge complications, no ambiguity in `begin next phase`.

**14. `human_gate: true` steps halt the session and require `force advance`.**
- Used for steps Claude cannot autonomously verify: "internal testers report clean switch" (Phase 4A.4), "production for 7 days with no cross-test bug reports" (Phase 4B blocker).
- Operator must type `force advance` after manually confirming the gate. The session reports what the human needs to check; the human reports back yes/no.

## What does NOT change

These are intentionally untouched. Do not refactor them.

- `src/hooks/useAdaptiveLearning.ts` — math, not exam-specific.
- `src/hooks/useRedemptionRounds.ts` body — quarantine logic is generic. (Note: the *RPCs* it calls get test-scoped in Phase 3.10.)
- `src/utils/srsEngine.ts` — Leitner intervals are universal.
- Stripe paywall (`api/create-checkout-session.ts`, `api/stripe-webhook.ts`) — per-user, not per-test (per Decision #10).
- `QuestionCard`, `ModuleLessonViewer`, `AccordionModule` — already generic.
- Migrations `0000–0022` — preserved untouched.
- Users Online pill — exam-agnostic social-proof mechanic.
