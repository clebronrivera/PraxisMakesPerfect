# Changelog — PraxisMakesPerfect

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. This is the active historical log for repo changes; it is not a design authority.

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] Type: Description — File(s)`

---

## 2026-04-01

### SRS Visibility — Per-Skill Chips + Clickable Badge (Step 6c extension)

- **[Feature — Per-skill SRS review chips]** Each skill row in the By Skill panel now shows a contextual chip when a review date is near: amber "Overdue" for past-due skills, amber "Due today" for skills due today, violet "Due Apr N" for skills due within 3 days. Skills with distant or no review date show no chip, keeping the list uncluttered. Unattempted skills are excluded from all SRS display (gate: `attempts > 0`). — `src/components/StudyModesSection.tsx`

- **[Feature — Clickable overdue badge with filter jump]** The violet "X skills due for spaced review" nudge (previously a passive `<div>`) is now a `<button>`. Clicking it switches to the By Skill tab and activates the new "Due (N)" filter, showing only overdue skills. Copy updated from "the adaptive system will prioritize these" to "tap to view them now" to match the actionable behavior. — `src/components/StudyModesSection.tsx`

- **[Feature — Overdue filter in By Skill panel]** Added `'overdue'` to `SkillFilter` type. The filter bar shows a "Due (N)" button in violet only when `srsOverdueCount > 0`. Filter logic: `attempts > 0 && nextReviewDate <= today`. — `src/components/StudyModesSection.tsx`

- **[Refactor — Lift skill filter state]** `filter` / `setFilter` moved from `SkillPanel` local state to `StudyModesSection` so the nudge badge in the parent can set both mode and filter atomically. `SkillPanel` now accepts `filter`, `onFilterChange`, `srsOverdueCount` as props. — `src/components/StudyModesSection.tsx`

- **[Fix — Local date for SRS comparisons]** Replaced `new Date().toISOString().slice(0, 10)` (UTC-based, can drift near midnight) with `getLocalDateStr()` using local date parts. Shared across `srsOverdueCount`, filter logic, and chip computation. `formatShortDate()` uses a noon offset to prevent timezone boundary flips in displayed dates. — `src/components/StudyModesSection.tsx`

96/96 tests pass, types clean.

---

## 2026-03-31

### Adaptive Redevelopment — Phase 2 Complete (Steps 5–9)

- **[Feature — Enable adaptive practice]** Flipped `adaptivePractice: false → true` in `launchConfig.ts`. Activates the full adaptive question selection pipeline that was built but feature-flagged off: 70% domain targeting, skill priority scoring (Rules 1+2: high-confidence-wrong boost + fragility boost), foundational question preference for low-attempt skills, and pool-exhaustion fallback. Students now receive targeted questions instead of random ones. — `src/utils/launchConfig.ts`

- **[Feature — SRS overdue-review priority boost (Rule 3)]** Added Rule 3 to `calculateSkillPriority()` in `useAdaptiveLearning.ts`: when a skill's `nextReviewDate` is at or before today, its priority score receives a +1.5 boost. The SRS engine (`srsEngine.ts`) already persisted `srsBox`/`nextReviewDate`/`lastReviewDate` on every answer; this is the first consumer of that data. Rule 3 stacks correctly with Rules 1 and 2. Inclusive boundary: `nextReviewDate === today` triggers the boost. — `src/hooks/useAdaptiveLearning.ts`

- **[Feature — Enrich study plan model prompt]** Three previously-computed signals now reach the study plan model: (7a) `resolvedMisconceptionIds` — canonical taxonomy IDs parallel to free-text misconception descriptions per cluster; (7b) `confidenceSignals` — `{ misconceptionSkillCount, confidenceIssueSkillCount, repeatedDistractorSkillCount, fragilityFlagSkillCount }` derived from `skillStates` at call time; (7c) `topAtRiskVocabulary` — deduped cross-cluster vocabulary from `urgent_now` + `important_next` clusters, max 20 terms, as a priority retrieval target list. Prompt rules updated for all three signals. — `src/services/studyPlanService.ts`

- **[Feature — Difficulty tier routing in adaptive selection (Step 8)]** New utility `src/utils/questionDifficulty.ts` maps `cognitiveComplexity` metadata to two tiers: Tier 1 (Recall) and Tier 2 (Application). After the foundational gating check, `selectNextQuestion` applies tier routing: skills with accuracy < 40% receive Recall questions first; skills at ≥ 40% receive Application questions first. Falls back to the full candidate pool when the preferred tier is unavailable for a skill. Data audit confirmed labels are intentional and valid: 376 Recall (33%), 774 Application (67%), 8× higher scenario-language correlation in Application vs Recall. — `src/utils/questionDifficulty.ts`, `src/hooks/useAdaptiveLearning.ts`

- **[Docs — Port audit documents from Adaptive Redevelopment session (Step 9)]** Copied 8 files from the external cowork session into `docs/` and new `docs/audits/` folder: master synthesis (`diagnostic-synthesis-2026-03-29.md`), taxonomy design (`misconception-taxonomy-design.md`), content priority plan (`diagnostic-content-priority.md`), and individual audits (adaptive diagnostic, confidence/timing, misconceptions, vocab tags, distractor coverage). — `docs/`, `docs/audits/`

### Tests (Phase 2)

- **[Tests — Adaptive selection integration (12 tests)]** Added `tests/adaptiveSelection.test.ts` covering: priority ordering with Rule 1 HCW boost, weak-skill preference in selection, foundational preference gated by attempt count, redemption blacklist hard guarantee (normal + fallback), pool exhaustion fallback, and assessment question exclusion. — `tests/adaptiveSelection.test.ts`
- **[Tests — SRS priority boost (7 tests)]** Added `tests/adaptivePriority.test.ts` covering: overdue vs. non-overdue priority comparison, future date no boost, today inclusive boundary, missing date no boost, Rule 1 + Rule 3 stacking, Rule 2 + Rule 3 stacking, and end-to-end question selection with overdue signal. — `tests/adaptivePriority.test.ts`
- **[Tests — Question difficulty tiers (15 tests)]** Added `tests/questionDifficulty.test.ts` covering: `getQuestionTier` (4), `getPreferredTier` boundary conditions (3), `filterByPreferredTier` with fallback (4), and adaptive selection integration for Recall preference, Application preference, no-Recall fallback, and foundational gating priority (4). — `tests/questionDifficulty.test.ts`

Total test count: 96 (was 62 after Phase 1).

---

### Adaptive Redevelopment — Phase 1 Complete (Steps 0–4)

- **[Refactor — Centralize skill proficiency thresholds]** Replaced hardcoded threshold literals across 6 files with imports from `skillProficiency.ts` (`TOTAL_SKILLS`, `READINESS_TARGET`, `READINESS_GOAL_PCT`). Zero behavior change. — `src/utils/skillProficiency.ts`, `src/components/ScreenerResults.tsx`, `src/components/StudentDetailDrawer.tsx`, `src/components/StudyModesSection.tsx`, `src/utils/scoreReportGenerator.ts`, `src/utils/tutorContextBuilder.ts`, `src/components/ResultsDashboard.tsx`
- **[Feature — Learning state signals]** Added four new signal functions to `learning-state.ts`: `countRecentHighConfidenceWrong()` (Rule 1: rolling 10-window high-confidence errors), `computeFragilityFlag()` (Rule 2: low-confidence correct ≥50% of last 6), `computeUncertainSkillFlag()` (Rule 5: shadow mode confidence variance), `computeRapidGuessCount()` (shadow mode timing signal, 4s threshold). Wired `recentHighConfidenceWrongCount` into `useProgressTracking` for persistence. Rewrote `calculateSkillPriority()` with additive boost model: +2/+1 for recent high-confidence wrong, +1 for fragility. Added `fragilityFlag` to study plan urgency scoring (+10 points) and prompt instructions. Extracted `buildDiagnosticSummary()` and confidence/time selectors to `diagnosticSelectors.ts`. Added overconfidence interpretation to ResultsDashboard. — `src/brain/learning-state.ts`, `src/hooks/useProgressTracking.ts`, `src/hooks/useAdaptiveLearning.ts`, `src/types/studyPlanTypes.ts`, `src/utils/studyPlanPreprocessor.ts`, `src/services/studyPlanService.ts`, `src/utils/assessmentReport.ts`, `src/utils/diagnosticSelectors.ts`, `src/components/ResultsDashboard.tsx`
- **[Feature — Misconception taxonomy]** Built misconception taxonomy with 98 entries across 48 metadata skill IDs covering all 45 progress skills. Defined type system (`MisconceptionEntry`, `MisconceptionFamily` ×8, `PatternId` ×28) and registry utility functions (`getMisconceptionById`, `getMisconceptionsBySkill`, `getMisconceptionsByFamily`, `getMisconceptionsByPatternId`). All `questionIds[]` remain empty pending distractor content authoring (0% valid coverage confirmed by audit). — `src/types/misconception.ts`, `src/data/misconception-taxonomy.ts`, `src/utils/misconceptionRegistry.ts`
- **[Feature — Wire registry into pipelines]** Added `findMisconceptionByText()` (O(1) text bridge) and `getMisconceptionsByProgressSkill()` (cross-ID-system lookup) to the registry. Enriched `retrieveSkillContent()` in study plan preprocessor to resolve free-text misconceptions to canonical `MisconceptionId`s alongside strings. Added `resolvedMisconceptionIds` field to `PrecomputedCluster`. Injected top misconceptions into AI tutor context for emerging skills. — `src/utils/misconceptionRegistry.ts`, `src/utils/studyPlanPreprocessor.ts`, `src/types/studyPlanTypes.ts`, `src/utils/tutorContextBuilder.ts`
- **[Content — Tag 37 untagged diagnostic items]** Added vocabulary concept tags to all 37 previously-untagged diagnostic items (250/250 now tagged, was 213/250). Unlocks `missedConcepts` pipeline for 20 affected skills. — `src/data/question-vocabulary-tags.json`

### Tests

- **[Tests — Learning state signal coverage]** Added `tests/learningStateSignals.test.ts` with 24 tests covering `computeFragilityFlag`, `computeUncertainSkillFlag`, `computeRapidGuessCount`, and `countRecentHighConfidenceWrong`. — `tests/learningStateSignals.test.ts`

### Documentation

- **[Docs — Codebase audit and refactor plan]** Added root-level `CODEBASE_AUDIT.md` (authoritative) and updated `REFACTOR_PLAN_LEARNING_SCIENCE.md` (28KB authoritative copy). Added `docs/diagnostic-output-contract-plan.md`. Removed stale `docs/REFACTOR_PLAN_LEARNING_SCIENCE.md` (19KB duplicate). — `CODEBASE_AUDIT.md`, `REFACTOR_PLAN_LEARNING_SCIENCE.md`, `docs/diagnostic-output-contract-plan.md`

---

## 2026-03-24

### Bug Fixes

- **[Build — Restore clean type check + track missing FAQ view]** Removed an unused `screenerComplete` binding that was failing `npm run scan:types`, added the missing `HelpFAQ` component already imported by `App.tsx`, and checked in the referenced alignment report while ignoring local-only audit/personal artifacts so the repo can return to a clean working tree. — `src/components/StudyModesSection.tsx`, `src/components/HelpFAQ.tsx`, `docs/PraxisMakesPerfect_Alignment_Report_2026-03-23.docx`, `.gitignore`, `docs/ISSUE_LEDGER.md`

## 2026-03-21

### Documentation

- **[Docs — Praxis 5403 complete reference]** Added `docs/Praxis_5403_Complete_Reference.md` as the maintained anchor for four reporting domains, forty-five progress skill IDs, NASP skill-map vs progress taxonomy, and question-bank / 900q bundle roles; registered it in `docs/DOCS_SYSTEM.md` and `README.md`. — `docs/Praxis_5403_Complete_Reference.md`, `docs/DOCS_SYSTEM.md`, `README.md`

### UI / Shell

- **[Bug — Home dashboard style mismatch]** Tightened the live home dashboard so it stays inside one visual system instead of mixing the shared light editorial shell with oversized dark promo-style rails. Compressed the hero scale, restyled the home CTA/daily-goal rail into the lighter dashboard language, and reduced the size of stat and skill rows for a more normal laptop fit. — `App.tsx`, `docs/ISSUE_LEDGER.md`

## 2026-03-20

### Profile / Onboarding

- **[Feature — Edit profile from sidebar]** The desktop sidebar identity card (and a profile icon on mobile) opens a slide-over **Profile & onboarding** panel with the full onboarding flow pre-filled so learners can review answers and update nickname, program, exam, and goals. — `App.tsx`, `src/components/ProfileEditorPanel.tsx`, `src/components/OnboardingFlow.tsx`, `src/utils/onboardingProfileMapping.ts`, `src/utils/onboardingFormToSavePayload.ts`, `docs/HOW_THE_APP_WORKS.md`

### Admin — Assessment reset + archive

- **[Feature — Admin reset screener / full diagnostic]** Added `assessment_reset_archive` table (migration `0004`), Netlify handler `api/admin-reset-assessment.ts` (archives rows, deletes scoped `responses`, rebuilds `skill_scores` / `domain_scores` / `global_scores` from remaining data), and Users tab actions in `AdminDashboard.tsx`. Requires `SUPABASE_SERVICE_ROLE_KEY` on Netlify and `npm run dev:netlify` for local API. — `supabase/migrations/0004_assessment_reset_archive.sql`, `api/admin-reset-assessment.ts`, `src/utils/rebuildProgressFromResponses.ts`, `src/utils/globalScoreCalculator.ts`, `src/components/AdminDashboard.tsx`, `docs/ANALYTICS_DATA_INVENTORY.md`, `CLAUDE.md`

### UI / Shell

- **[Layout — Shared editorial shell]** Replaced the signed-in dark shell with a shared light editorial layout across the main destinations: desktop sidebar, sticky top bar, warm background, white surfaces, amber accents, and shared shell/button/surface utility classes. The live shell now covers Home, Practice, Progress, and Study Guide without introducing new routes or feature systems. — `App.tsx`, `src/index.css`, `docs/HOW_THE_APP_WORKS.md`, `docs/WORKFLOW_GROUNDING.md`, `CODEBASE_OVERVIEW.md`
- **[Marketing — Stronger public hero]** Reworked the signed-out `LoginScreen` hero to sell the product more clearly: sharper Praxis 5403 promise, direct account CTAs, outcome-focused proof points, and a simple three-step path from screener to targeted practice to study guide. Kept the existing auth flow and preview panels intact. — `src/components/LoginScreen.tsx`, `docs/HOW_THE_APP_WORKS.md`
- **[Home — Dashboard redesign]** Rebuilt the live Home dashboard around the approved mock direction while keeping existing app logic intact. Added the tighter greeting hero, spicy CTA styling, updated metric cards (`Number of questions answered`, `Readiness phase`, `Skills to reach goal`, `Weekly usage`), a `Daily goal` rail, and an action-oriented `High-Impact Skills` list that uses `Practice` buttons without exposing raw accuracy percentages. Those buttons route into existing skill-focused flows. — `App.tsx`, `docs/HOW_THE_APP_WORKS.md`, `docs/WORKFLOW_GROUNDING.md`, `CODEBASE_OVERVIEW.md`
- **[Profile UI]** Updated the sidebar identity card so the secondary line under the user's name comes from existing onboarding fields rather than placeholder text. Field precedence is `currentRole` → `accountRole` → `trainingStage`. — `App.tsx`, `docs/WORKFLOW_GROUNDING.md`
- **[Restyle — Practice, Progress, Study Guide]** Applied the Home mock's light-shell palette and surface treatment to the existing Practice hub, Progress dashboard, and Study Guide destination while intentionally preserving their current handlers, unlock rules, and data behavior. — `src/components/StudyModesSection.tsx`, `src/components/ResultsDashboard.tsx`, `src/components/StudyPlanCard.tsx`, `src/index.css`, `CODEBASE_OVERVIEW.md`
- **[Restyle — Screener report]** Updated the screener results page to the same editorial visual system so finishing the screener no longer drops users back into the older dark report stack. Kept the report model, readiness thresholds, domain summaries, and recommendation behavior unchanged. — `src/components/ScreenerResults.tsx`, `docs/ISSUE_LEDGER.md`
- **[Restyle — Full diagnostic report]** Updated the full assessment results page to the same editorial visual system so the 125-question report now matches the live shell and the updated screener report. Kept the score calculations, weakest-domain logic, download action, and retake/home behavior unchanged. — `src/components/ScoreReport.tsx`, `docs/ISSUE_LEDGER.md`

### Reporting / Vocabulary

- **[UI + Docs — Shared proficiency scale]** Aligned learner-facing skill and domain labels to one shared scale: `Emerging`, `Approaching`, and `Demonstrating`, with the same explanatory language used across badges, dashboard summaries, screener reporting, and marketing copy. Also reconciled the source-of-truth thresholds to `>=80% / 60–79% / <60%` and updated the durable docs accordingly. — `src/utils/skillProficiency.ts`, `src/utils/assessmentReport.ts`, `src/utils/progressSummaries.ts`, `src/components/StudyModesSection.tsx`, `src/components/ResultsDashboard.tsx`, `src/components/ScreenerResults.tsx`, `src/components/LoginScreen.tsx`, `src/utils/scoreReportGenerator.ts`, `docs/HOW_THE_APP_WORKS.md`, `docs/WORKFLOW_GROUNDING.md`, `docs/ISSUE_LEDGER.md`, `CLAUDE.md`

### Bug Fixes — Competing CTAs During In-Progress Assessments

- **[Bug — Screener CTA conflict]** When a screener session was in progress and the user returned to the dashboard, the "Take the screener" button remained visible alongside the "Resume" card, allowing users to accidentally start a fresh screener instead of resuming. Fixed by computing `screenerSessionInProgress` before the home screen JSX renders and suppressing the "Take the screener" button whenever a screener or diagnostic session is active. — `App.tsx`
- **[Bug — Full diagnostic CTA conflict]** Same issue existed for the full diagnostic: "Take the full diagnostic" button was visible alongside the "Resume" card when a full assessment was in progress. Fixed with a parallel `fullAssessmentSessionInProgress` flag that suppresses the start button while a full assessment session is active. — `App.tsx`

### Study Guide — UX & Print

- **[UX — Dedicated study guide view]** Moved the full AI Study Guide out of the home page (where it was buried mid-scroll) into a dedicated `studyguide` app mode. The home page now shows a compact nav card (readiness level + date, or a generate prompt) that navigates to the full guide. — `App.tsx`
- **[UX — Auto-navigate on completion]** After generation finishes (success or error), the app automatically switches to the `studyguide` mode so the user sees the result without having to scroll back and notice it. Previously required switching tabs and returning to detect that the guide had appeared. — `App.tsx`
- **[Print — Dark theme override]** Replaced the minimal `@media print` CSS in `StudyPlanViewer` with a blanket `.study-plan-viewer, .study-plan-viewer * { background-color: white !important; color: black !important; ... }` override. The old rules targeted specific class names but did not override Tailwind's per-element dark utility classes, so the page printed with dark backgrounds. — `src/components/StudyPlanViewer.tsx`

### Content / Marketing

- **[Bug — Incorrect domain count on login page]** The "Adaptive Practice" feature card and the stats row on the login/sign-up page both showed "10 domains" instead of the correct "4 domains". Fixed in both locations. — `src/components/LoginScreen.tsx`

### Documentation

- **[New doc — ANALYTICS_DATA_INVENTORY.md]** Added `docs/ANALYTICS_DATA_INVENTORY.md`: Supabase tables and join keys (`auth.users`, content, events), browser-only metrics, static taxonomy sources, and notes on `responses` vs aggregates. Linked from `docs/DOCS_SYSTEM.md` and `README.md`. — `docs/ANALYTICS_DATA_INVENTORY.md`, `docs/DOCS_SYSTEM.md`, `README.md`
- **[New doc — HOW_THE_APP_WORKS.md]** Created `docs/HOW_THE_APP_WORKS.md` as the canonical plain-language description of the product — how features work, correct numbers, unlock conditions, and the AI study guide pipeline. Intended as the source of truth for marketing copy, onboarding guides, and how-to documentation. Added a mandatory update rule to `CLAUDE.md` requiring this file to be updated in the same commit as any feature change. Registered in `docs/DOCS_SYSTEM.md`. — `docs/HOW_THE_APP_WORKS.md`, `CLAUDE.md`, `docs/DOCS_SYSTEM.md`

### Onboarding

- **[Profile UX]** Replaced graduate-student free-text program entry with NASP-backed dropdowns: users now choose a program state first and then a NASP-listed school psychology program, while certification-only users choose certification state from a normalized state dropdown. Kept the existing persisted profile fields (`university`, `program_state`, `certification_state`) unchanged and checked in the NASP-derived source data for future refreshes. — `src/components/OnboardingFlow.tsx`, `src/data/naspSchoolPsychPrograms.ts`, `docs/HOW_THE_APP_WORKS.md`, `docs/WORKFLOW_GROUNDING.md`, `docs/ISSUE_LEDGER.md`

### Diagnostics / Build

- **[Health Check]** Cleared the `verify:health` dead-zone coverage warning for `NEW-10-EthicalProblemSolving`, expanded top-priority Domain 1 template slot variety, and removed noisy invalid/unused template definitions that were polluting diagnostics output. — `src/brain/templates/domain-1-templates.ts`, `src/brain/templates/domain-10-templates.ts`
- **[Build]** Reduced initial bundle pressure by lazy-splitting login/onboarding/home-only UI, loading the canonical question bank as a JSON asset instead of a giant JS module, splitting Supabase into its own vendor chunk, and moving the admin feedback-audit question-bank read to runtime so the admin chunk no longer bundles the full bank. — `App.tsx`, `vite.config.ts`, `src/components/AdminDashboard.tsx`, `src/utils/feedbackAudit.ts`, `docs/ISSUE_LEDGER.md`

## 2026-03-19

### Repo Hygiene

- **[Cleanup]** Added a `local/` workspace convention for private reference material and scratch files, updated ignore rules so root-level reference docs and generated `output/` CSV/JSON artifacts stay local by default, and documented `output/AUDIT_SUMMARY.md` as the current tracked handoff exception. — `.gitignore`, `README.md`, `local/README.md`, `docs/WORKFLOW_GROUNDING.md`, `docs/ISSUE_LEDGER.md`

### Tooling / Security

- **[Dependencies]** Upgraded `vite` from the vulnerable v4 line to the latest patched v6 line compatible with the existing React plugin, clearing the current `npm audit` findings for Vite and transitive `esbuild` without requiring a broader React or Tailwind migration. — `package.json`

### Data / Question Bank

- **[Bug — Corrupt MCQ rows]** Four practice items had merged choices and export metadata in `D` (empty `C`, ` C)` concatenated onto `B`, `**Correct Answer:**` / explanation text inside a choice). Fixed in `src/data/questions.json` and mirrored in `praxis_5403_practice_questions_900q.json` for: `PQ_SWP-02_11`, `PQ_DBD-09_20`, `PQ_SAF-01_18`, `PQ_ETH-03_17`. Documented in `docs/ISSUE_LEDGER.md` and prevention checks in `docs/WORKFLOW_GROUNDING.md` §3.9.1. — `src/data/questions.json`, `praxis_5403_practice_questions_900q.json`, `docs/ISSUE_LEDGER.md`, `docs/WORKFLOW_GROUNDING.md`

### UI / Reporting

- **[Labeling]** Renamed learner-facing confidence choices from `High / Medium / Low` to `Sure / Unsure / Guess`, rendered them in `Guess | Unsure | Sure` order, and kept the underlying stored `high` / `medium` / `low` values plus existing weighting semantics unchanged. Centralized the mapping in `src/utils/confidenceLabels.ts` and updated the shared question card plus practice-session copy. — `src/utils/confidenceLabels.ts`, `src/components/QuestionCard.tsx`, `src/components/PracticeSession.tsx`, `docs/ISSUE_LEDGER.md`, `docs/WORKFLOW_GROUNDING.md`

## 2026-03-18

### Bug Fixes — Study Guide Generation (full diagnostic + root-cause session)

Four separate bugs were discovered and fixed in the same session after investigating the live failure on Carlos Rivera's account:

- **[Critical — Function Format]** `api/study-plan.ts` used Express-style `export default function handler(req, res)` with `res.status().json()`. Netlify Lambda functions require `export const handler = async (event) => ({ statusCode, body })`. The Express format caused every invocation to fail at runtime (`req.method` was undefined, `res.status()` threw). Rewrote `api/study-plan.ts` to proper Lambda format. — `api/study-plan.ts`

- **[Critical — SPA Route Swallow]** `netlify.toml` was missing the `/api/*` → `/.netlify/functions/:splat` redirect. The SPA wildcard `/*` → `index.html` was catching `/api/study-plan` first and returning the React HTML page instead of invoking the function. Added the redirect. — `netlify.toml`

- **[Critical — Function Timeout]** Netlify sync functions have a hard 30-second gateway timeout. A real study-plan generation (large prompt + `max_tokens 8000`) takes 45–90 seconds. Converted to a Netlify Background Function (`api/study-plan-background.ts`): Netlify returns 202 immediately, the function runs Claude and saves a complete `StudyPlanDocument` to `study_plans`, the client polls `study_plans` (4s interval, 4-min ceiling). Removed the now-unused sync `requestStudyPlanApi()` helper. — `api/study-plan-background.ts`, `src/services/studyPlanService.ts`

- **[Bug — Token Truncation]** `max_tokens` was 3000, which is insufficient for the 7-section study plan JSON (regularly 4000–6000 output tokens). Raised to 8000. — `api/study-plan-background.ts`

- **[Bug — Missing DB Table]** `study_plans` table was defined in migration `0000_initial_schema.sql` but never applied to the production database. Added migration `0001_study_plans_and_session_columns.sql` and applied it via Supabase SQL Editor. — `supabase/migrations/0001_study_plans_and_session_columns.sql`

- **[Bug — Missing Columns]** `user_progress.last_full_assessment_session_id` and `last_screener_session_id` were referenced in code but not in the database schema. Added both columns in migration 0001.

### Feature Additions

- **[Practice]** Question retirement system: first-pass gating, `times_seen`/`times_correct` tracking, per-user localStorage store (`pmp-qretire-{userId}`), pool reset on exhaustion — `src/components/PracticeSession.tsx`
- **[Practice]** Cumulative all-time accuracy % in session header; updates dynamically on each answer by snapshotting baseline at mount and adding running `sessionStats` on top
- **[Practice]** Consecutive correct streak with 8-tier tiered motivational phrase pools; avoids repetition via `lastStreakPhraseRef`; "HW" label renamed to "Overconfident" with tooltip
- **[Practice]** 15-minute inactivity auto-logout (saves all data before signing out)
- **[Practice]** Domain and skill context both shown on every question card
- **[Navigation]** Skill practice back button returns to Results → Skills tab; domain/general practice returns to home
- **[Home]** Continue Session card split into Practice card (shows skill name, Resume + Select New Skill) vs Assessment card (Resume + Start New Attempt)
- **[Home]** StudyModesSection: Domain Review (unlocks after Screener) and Skill Review (unlocks after Full Assessment) with live % scores and lock states

### Infrastructure

- **[Netlify CLI]** Installed globally (`npm install -g netlify-cli`) and linked to `praxismakesperfect` project for deploy management and function log access
- **[Supabase]** Confirmed `sb_secret_` / `sb_publishable_` key format (new Supabase 2025 key format) works with the JS client but NOT with direct REST API calls or the Supabase admin CLI in non-Docker environments

### Cleanup

- **[Docs]** Archived stale Firebase operational guides from the repo root to `archive/docs-legacy-2026-03-18/` and rewrote the active root docs to reflect the current Supabase-backed runtime
- **[Scripts]** Moved Firebase-only Firestore/admin utility scripts out of `scripts/` into `archive/scripts-legacy-2026-03-18/` so active tooling matches the live backend
- **[Config]** Archived the leftover root `.firebaserc` and `.firebase/` cache and removed the stale Firebase chunk rule from `vite.config.ts`

## 2026-03-15

### Backend Migration

- **[Architecture]** Migrated backend service completely from Firebase to Supabase.
- **[Auth]** Replaced Firebase Authentication with Supabase Email/Password Authentication (Google Auth removed).
- **[Database]** Replaced Firestore with Supabase PostgreSQL (via Supabase JS Client).
- **[Database]** Implemented Row Level Security (RLS) in Supabase to secure user data at the database level.
- **[API]** Refactored `/api/study-plan` to verify JWTs using Supabase `auth.getUser()` rather than Firebase Admin.
- **[Cleanup]** Removed all `firebase` and `firebase-admin` dependencies, types, and setup files (`src/config/firebase.ts`).
- **[Schema]** Established rigorous SQL schemas (`supabase/migrations/0000_initial_schema.sql`) for `user_progress`, `responses`, `practice_responses`, `question_reports`, and `beta_feedback`.

### Docs

- **[Docs]** Added a durable question-bank audit handoff rule to `docs/WORKFLOW_GROUNDING.md` so future LLM-assisted rewrites are delivered as `UNIQUEID`-keyed deltas, preserve question identity/metadata, keep before/after audit logs, and avoid replacing length cueing with repetitive boilerplate cueing
- **[Question Bank]** Merged the rebuilt answer-choice delta into `src/data/questions.json`, refreshed the audit handoff package in `output/AUDIT_SUMMARY.md`, and recorded the post-merge verification result: structural validation passed for `403` records / `735` fields, with only low-risk explanation-drift watch items among the `223` trimmed-correct entries

## 2026-03-14

### Docs

- Consolidated root-level documentation into a canonical set: `README.md`, `DOCUMENT_CONSOLIDATION_REPORT.md`, `DOCUMENT_REGISTRY.md`, `REWRITE_DEVELOPMENT_GUIDE.md`, `CODEBASE_OVERVIEW.md`, `ASSESSMENT_DATA_FLOW_ANALYSIS.md`, and the active Firebase operational guides
- Archived 35 superseded root-level markdown files to `archive/docs-legacy-2026-03-14/`
- Added explicit authority/status headers to the canonical non-root docs retained in the repo root
- Rewrote `README.md` to reflect the current Firebase-backed, taxonomy-driven app rather than the earlier local-only description
- Added a repo-local grounding system: `AGENTS.md` for IDE/agent instructions, `docs/WORKFLOW_GROUNDING.md` for durable workflow/reporting rules, and `docs/ISSUE_LEDGER.md` for active bug and mismatch tracking
- Updated the grounding docs with recent reporting decisions: centralized readiness thresholds, current-attempt screener reporting, and tracked follow-ups for home-page readiness scope and practice-repeat policy
- Added `docs/DOCS_SYSTEM.md` as the maintained map for what the active docs are, how to use them, and when they must be updated
- Added a centralized assessment/question-bank terminology map in `src/utils/productTerminology.ts` and mirrored the durable glossary into `docs/WORKFLOW_GROUNDING.md` so `screener`, `quick diagnostic`, `full assessment`, `question bank`, and `practice question pool` have one maintained definition
- Retired the quick diagnostic from the active product flow, made the screener the only live short assessment, logged screener responses distinctly in shared response data, and archived the legacy quick-diagnostic builders under `archive/cleanup-2026-03-14/`
- Cleaned up live naming so active session/report/admin/study-plan code uses `screener` and `full assessment` terminology while legacy compatibility stays behind the scenes
- Expanded the AI study guide so it now uses skill metadata to generate grounded vocabulary gaps, foundational review, study-resource recommendations, and a mastery checklist, and added a live progress view for the planned final full-assessment unlock rule
- Formalized the study-guide API contract with shared request/response validation, user-to-token verification, and documented client/server responsibilities for dynamic user-page rendering

## 2026-03-11

### Bug Fixes

- **[Critical]** Removed `require()` inside `handleResumeAssessment` useCallback; replaced with static import of `getCurrentSession` and `loadUserSession` — `App.tsx:26`, `App.tsx:198`
- **[Critical]** Added `profile.preAssessmentQuestionIds` to `startFullAssessment` useCallback dependency array — stale closure was causing pre-assessment questions to not be excluded from full assessment pool — `App.tsx:191`
- **[Logic]** "Resume Last Session" card for `diagnostic`/`full` modes now calls `loadUserSession(sessionId)` and passes the saved session to `startPreAssessment`/`startFullAssessment` instead of starting a fresh session — `App.tsx:589-598`
- **[Logic]** `handleViewReport` now calls `setAssessmentStartTime(0)` before setting score-report mode — prevents past report from showing garbage `totalTime` calculated as `Date.now() - oldStartTime` — `App.tsx:361`
- **[Logic]** `logResponse` now uses `setDoc(doc(ref, responseId), ...)` with a deterministic ID (`sessionId_questionId_timestamp`) instead of `addDoc` — prevents duplicate response documents in Firestore when the same question is submitted more than once — `src/hooks/useFirebaseProgress.ts:219-224`

### UI Fixes

- **[Label]** "120 questions" corrected to "125 questions" in Full Assessment button labels (2 occurrences) — `App.tsx:657`, `App.tsx:693`
- **[Duplicate]** Removed redundant "View Full Assessment Report" button from top home section — it already appears in the action buttons when `fullAssessmentComplete` is true — `App.tsx`

### Cleanup

- **[Dead code]** Deleted `src/components/UserLogin.tsx` — replaced by `LoginScreen`; no imports anywhere
- **[Dead code]** Deleted `src/hooks/useUserProgress.ts` — replaced by `useFirebaseProgress`; no imports anywhere
- **[Dead code]** Deleted `src/utils/assessment-selector.ts` — replaced by `assessment-builder`; marked DEPRECATED, no imports anywhere
- **[Dead code]** Removed unused `isSaving` state, `setIsSaving` call sites in `saveProfile` and `resetProgress`, and `isSaving` from the hook's return object — `src/hooks/useFirebaseProgress.ts`
- **[Dead code]** Removed unused `addDoc` import after switching to `setDoc` — `src/hooks/useFirebaseProgress.ts`
- **[Organization]** Moved 14 root-level one-off script files into `scripts/` folder; rewrote `./src/` → `../src/` import paths in all moved files — build unaffected (scripts were outside `tsconfig.json` include boundary)

  Files moved:
  `apply-approved-tags.ts`, `deduplicate-questions.ts`, `export-flagged-questions.ts`,
  `generate-gap-questions.ts`, `generate-hierarchy-tree.ts`, `generate-visual-tree.ts`,
  `health-check.ts`, `output-content-topic-questions.ts`, `question-format-converter.ts`,
  `question-quality-analyzer.ts`, `question-quality-fixer.ts`, `regenerate-distractors.ts`,
  `sync-question-ids.ts`, `test-question-generation.ts`

### Docs

- Added `IMPLEMENTATION_PLAN.md` — tracks Phase 1 (bugs) and Phase 2 (cleanup) work items with status
- Added `CHANGELOG.md` (this file)

---

## Prior Work (pre-2026-03-15, from git history)

- `d4c3ace` — Add deployment guide
- `03a428a` — Add Firebase authentication: email/password, Google OAuth, password reset
- `9f5615f` — General update
- `4df5b90` — Phase 2.2: Full Test 120Q with domain-balanced selection using largest remainder method
- `fd1a8f6` — Phase 2.1: Upgrade Quick Diagnostic to 40Q with duplicate-proof selection
