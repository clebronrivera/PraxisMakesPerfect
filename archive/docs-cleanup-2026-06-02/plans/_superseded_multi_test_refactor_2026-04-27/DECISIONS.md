# Architectural Decisions

These are committed. Do not re-argue. If you think a decision should change, write a proposal in `BLOCKERS.md` — do not unilaterally deviate.

## Data model

1. **PMP grows from 2-level taxonomy to 4-level taxonomy.**
   - Today: domain → skill.
   - After refactor: domain (Keystone blueprint_group) → skill (Keystone competency, UI cards) → subskill (Keystone skill, internal clustering) → microskill (Keystone microskill, adaptive engine).
   - User-facing surface still shows 2–3 levels. Microskills are an internal granularity for content tagging and item routing.

2. **Non-MCQ formats are filtered at ingest in v1.**
   - Keystone supports `multiple_choice | essay_rubric | constructed_response | performance_task | mixed`.
   - PMP v1 ingests only `multiple_choice` parts; others are skipped and logged as a coverage gap.
   - Loaded `TestPackage` carries `unsupportedParts: string[]` for UI banners.
   - Full essay/performance support is out of scope for this refactor.

3. **Test packages are file-based and bundled per test, code-split.**
   - Content lives at `src/tests/<TEST_ID>/`.
   - Vite emits one chunk per test via dynamic import.
   - Why not Supabase: 6 MB JSON per exam, RLS overhead, worse authoring loop than git diffs. Defer admin-uploaded tests indefinitely.

4. **Keystone is the upstream authoring corpus.**
   - PMP imports via `scripts/sync-from-keystone.mjs` reading `Keystone/exams/<system>/<exam>/08_handoff/`.
   - Schema contracts pinned in `src/tests/KEYSTONE_SCHEMA_VERSION` and Keystone's `pipeline/schemas/`.

5. **First non-Praxis target is FTCE 036 (School Psychologist PK-12).**
   - Subject-aligned with current Praxis 5403 → minimal taxonomy divergence.
   - Most-complete content of the 9 FTCE exams (raw TSV + enriched JSON + chapter v0.3 + Praxis alignment files).
   - Test ID format follows Keystone convention: `FTCE_036`, matching `test_registry.schema.json:34` examples.

## Migration sequencing

6. **DB scoping (Phase 3) precedes public multi-test enablement (Phase 4B).**
   - Phase 2 ships FTCE 036 as a *validated internal package only* — no public test switching, no real user progress writes for FTCE.
   - Phase 4A adds onboarding/profile switching behind a feature flag.
   - Phase 4B flips the flag, but only after Phase 3 backfills `test_id` on all existing rows.
   - Why: prevents cross-test data pollution.

7. **Existing Praxis 5403 user data is preserved via `legacySkillIdMap`.**
   - Every `TestPackage` carries `legacySkillIdMap: Record<string, string>` mapping old PMP IDs (e.g. `CON-01`) to new Keystone IDs.
   - Renderer reads pre-refactor `study_plans` and `responses` rows through this map.
   - No mass-regeneration; v1 plans age out as users complete cycles.
   - In-flight plans at migration time: read through the map, do not regenerate. Users finish their current plan on the current taxonomy and the next plan is generated against the new one.

## Design system

8. **Atelier wins the 3-way color conflict.**
   - Today: Atelier pastels (current) coexist with Editorial palette in `src/utils/domainColors.ts` and inline emerald/amber/rose in `ScreenerResults.tsx`.
   - After refactor: single `src/design/tokens.ts`. Atelier is the source. Editorial and inline triads deprecated.

9. **Design system scope is "Medium" per user.**
   - Token consolidation (yes).
   - Extract `DomainCard` and `ResultTemplate` (yes — these are duplicated 3+ times).
   - i18n / Storybook / per-screen theme overrides (NO — out of scope).

## Process

10. **Branching strategy: one feature branch per phase, squash-merge to main.**
    - Branch name: `refactor/multi-test/phase-<id>` (e.g., `refactor/multi-test/phase-1a`).
    - Each step within a phase is one commit on the phase branch.
    - Squash-merge the branch when phase exit criteria pass.
    - Parallelizable phases (1B, 1C, 1D, 1E, 3) get sibling branches off the post-1A commit.
    - Rollback: revert the squash commit on main, re-create the phase branch.

11. **Rollback default: `git revert <SHA>` of the per-step commit.**
    - Phase 3 (database) overrides this — see PHASE_3 file's `Rollback procedure` subsection.
    - Phase 4B flag flip overrides this — revert the commit and redeploy.
    - Every HANDOFF_LOG entry records the commit SHA so rollback is mechanical.

## What does NOT change

These are intentionally untouched. Do not refactor them.

- `src/hooks/useAdaptiveLearning.ts` — math, not exam-specific.
- `src/hooks/useRedemptionRounds.ts` — quarantine logic is generic.
- `src/utils/srsEngine.ts` — Leitner intervals are universal.
- Stripe paywall (`api/create-checkout-session.ts`, `api/stripe-webhook.ts`) — per-user, not per-test.
- `QuestionCard`, `ModuleLessonViewer`, `AccordionModule` — already generic.
- Migrations `0000–0022` — preserved untouched.
- Users Online pill — exam-agnostic social-proof mechanic.
