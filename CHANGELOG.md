# Changelog — PraxisMakesPerfect

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. This is the active historical log for repo changes; it is not a design authority.

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] Type: Description — File(s)`

---

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
