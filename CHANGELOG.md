# Changelog — PraxisMakesPerfect

> Status: Canonical source. Reviewed during documentation consolidation on 2026-03-14. This is the active historical log for repo changes; it is not a design authority.

All notable changes to this project are documented here.
Format: `[YYYY-MM-DD] Type: Description — File(s)`

---

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

## Prior Work (pre-2026-03-11, from git history)

- `d4c3ace` — Add deployment guide
- `03a428a` — Add Firebase authentication: email/password, Google OAuth, password reset
- `9f5615f` — General update
- `4df5b90` — Phase 2.2: Full Test 120Q with domain-balanced selection using largest remainder method
- `fd1a8f6` — Phase 2.1: Upgrade Quick Diagnostic to 40Q with duplicate-proof selection
