# Issue Ledger

Status: Active working ledger.

Use this file to track discovered issues, reporting mismatches, and unresolved implementation risks so they do not get lost between sessions.

## How To Use

- Add newest entries near the top.
- Keep entries short and specific.
- Update `Status` instead of deleting history.
- Link the relevant code or doc anchor when possible.
- If an issue becomes a durable rule, move the rule to `docs/WORKFLOW_GROUNDING.md` and leave the issue entry here as history.

## Status Labels

- `open`
- `in_progress`
- `resolved`
- `watch`

## Template

```md
## YYYY-MM-DD - <short issue title>

- Status:
- Area:
- Summary:
- Source of truth:
- Code anchors:
- Resolution / next step:
```

---

## 2026-03-18 - Study guide generation: four compounding bugs (all resolved)

All four were diagnosed in one session using live Supabase data for Carlos Rivera (`puppyheavenllc@gmail.com`) and production endpoint smoke-tests.

### A — Wrong Netlify function export format (fatal bug)
- Status: resolved
- Area: `api/study-plan.ts`
- Summary: Used Express-style `export default function handler(req, res)`. Netlify Lambda calls `handler(event, context)` so `req.method` was always `undefined` and `res.status()` threw a TypeError. Every call returned 500.
- How to detect next time: Netlify function returns 500 on a simple unauthenticated POST → check the export format first.
- Resolution: Rewrote to Lambda format — `export const handler = async (event) => ({ statusCode, headers, body })`. Headers arrive as `event.headers['authorization']` (lowercase). Body is a string requiring `JSON.parse`.
- Code anchors: `api/study-plan.ts`, `api/study-plan-background.ts`

### B — SPA wildcard swallowing `/api/*` routes
- Status: resolved
- Area: `netlify.toml`
- Summary: `/*` → `index.html` matched before any `/api/*` rule. POST `/api/study-plan` returned 200 HTML, which the client failed to parse silently.
- How to detect next time: If an `/api/` fetch response body starts with `<!DOCTYPE`, the SPA redirect is winning. Verify `/api/*` rule appears above `/*` in `netlify.toml`.
- Resolution: Added `[[redirects]] from = "/api/*" to = "/.netlify/functions/:splat" status = 200` above the wildcard.
- Code anchors: `netlify.toml`

### C — Sync function 30-second gateway timeout
- Status: resolved
- Area: `api/study-plan.ts` → `api/study-plan-background.ts`
- Summary: Even with correct format, Claude generation (10k-token prompt + 8000 max_tokens) takes 45–90s. Netlify sync function gateway ceiling is 30s → HTTP 504.
- How to detect next time: HTTP 504 after ~30s. Any function calling an external AI API should be a background function unless generation is provably under 10s.
- Resolution: Converted to Netlify Background Function (`-background` filename suffix). Netlify returns 202 immediately; function runs up to 15 min. Client polls `study_plans` WHERE `created_at > requestedAt` at 4-second intervals (4-minute timeout ceiling). Background function saves the complete `StudyPlanDocument` to `study_plans` including pre-computed `masteryChecklist` and `finalAssessmentGate` sent in the request body.
- Code anchors: `api/study-plan-background.ts`, `src/services/studyPlanService.ts`, `src/types/studyPlanApi.ts`

### D — `study_plans` table and session columns never applied to production DB
- Status: resolved
- Area: `supabase/migrations/`
- Summary: `study_plans` was in `0000_initial_schema.sql` but never applied. `last_full_assessment_session_id` and `last_screener_session_id` written in App.tsx did not exist in the DB schema.
- How to detect next time: Supabase error `PGRST205 Could not find the table` or `column X does not exist` = migration not applied. Check `supabase/migrations/` against live schema.
- Resolution: Created `supabase/migrations/0001_study_plans_and_session_columns.sql` and applied via Supabase Dashboard → SQL Editor.

### Key findings for future sessions
- Carlos Rivera (`puppyheavenllc@gmail.com`): screener 100q/34%, full assessment 125q/44%. Both `screener_complete` and `full_assessment_complete` = true. Fully eligible to generate a study guide.
- New Supabase `sb_secret_` / `sb_publishable_` key format works with the JS client but NOT with direct REST API calls or the admin CLI outside Docker. To query user data programmatically: sign in as the user with the anon key (RLS allows self-queries), or use Supabase Dashboard SQL Editor.
- Netlify CLI installed globally, project linked (`netlify link --name praxismakesperfect`). Use `netlify deploy --prod` for immediate production deploys without waiting for GitHub auto-build.
- Direct Postgres (`SUPABASE_DB_URL`) is blocked from developer machines — accessible only from Netlify function runtime and Supabase-trusted IPs.

## 2026-03-18 - Active docs and repo root still carried stale Firebase operational remnants after the Supabase migration

- Status: resolved
- Area: documentation / repository cleanup
- Summary: After the Firebase-to-Supabase migration was complete, the repo still exposed Firebase operational docs in the root, kept Firebase-only Firestore scripts in the active `scripts/` directory, retained root Firebase config/cache files, and described the live app as Firebase-backed in several canonical docs. This made the active documentation system contradict the current code.
- Source of truth: current Supabase-backed code paths and the deployment/schema audit
- Code anchors:
  [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md)
  [CODEBASE_OVERVIEW.md](/Users/lebron/Documents/PraxisMakesPerfect/CODEBASE_OVERVIEW.md)
  [ASSESSMENT_DATA_FLOW_ANALYSIS.md](/Users/lebron/Documents/PraxisMakesPerfect/ASSESSMENT_DATA_FLOW_ANALYSIS.md)
  [docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/SUPABASE_AND_DEPLOYMENT_AUDIT.md)
- Resolution / next step: Archived the Firebase-only docs and scripts under dated `archive/` folders, moved the root Firebase config/cache out of the active workspace, removed the leftover Firebase Vite chunk rule, and updated the active docs to point to Supabase as the current backend. Remaining Firebase mentions in active docs are historical references only.

## 2026-03-15 - Rebuilt answer-choice delta merged cleanly; explanation sanity check found only low-risk drift

- Status: resolved
- Area: question bank / audit merge verification
- Summary: The rebuilt answer-choice delta was merged into the canonical question bank as a content-only patch. Structural verification passed for all `403` delta records and `735` changed answer-choice fields. A post-merge sanity check on the `223` rewritten correct options found low-risk wording-drift candidates, but no critical explanation mismatches or answer-key problems.
- Source of truth: canonical bank after merge plus the audit delta and audit report
- Code anchors:
  [src/data/questions.json](/Users/lebron/Documents/PraxisMakesPerfect/src/data/questions.json)
  [output/delta_answer_choices.json](/Users/lebron/Documents/PraxisMakesPerfect/output/delta_answer_choices.json)
  [output/AUDIT_SUMMARY.md](/Users/lebron/Documents/PraxisMakesPerfect/output/AUDIT_SUMMARY.md)
  [output/length_cuing_audit_report.csv](/Users/lebron/Documents/PraxisMakesPerfect/output/length_cuing_audit_report.csv)
- Resolution / next step: Keep the merge. Treat the `40` heuristic watch-list items as optional polish review rather than blockers. Future audits should preserve this workflow: validate structure first, merge the delta, then run a targeted semantic sanity check on rewritten correct options.

## 2026-03-15 - Question-audit workflow lacked durable handoff rules and could introduce new cueing patterns

- Status: resolved
- Area: question bank / audit workflow
- Summary: Large-scale answer-choice audits can be safely merged when they arrive as `UNIQUEID`-keyed delta patches, but the repo did not yet have a durable rule for that handoff. This made it easy to fix one issue such as length cueing while accidentally introducing another issue such as repetitive boilerplate distractors that may themselves become answer cues.
- Source of truth: canonical question bank plus the audited delta outputs and audit logs
- Code anchors:
  [src/data/questions.json](/Users/lebron/Documents/PraxisMakesPerfect/src/data/questions.json)
  [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- Resolution / next step: Added a durable workflow-grounding rule for question-bank rewrite/audit handoff. Future audits should be delivered as `UNIQUEID`-keyed deltas, preserve identity/metadata unless explicitly changed, keep before/after audit logs, and avoid formulaic distractor wording that creates new style cueing.

## 2026-03-15 - Firebase removed; Backend migrated to Supabase

- Status: resolved
- Area: infrastructure / database / auth
- Summary: The entire backend structure was migrated from Firebase to Supabase. This involved removing all `firebase` and `firebase-admin` dependencies, transitioning authentication to strictly Email/Password via Supabase, translating Firestore collections to Supabase PostgreSQL schemas with RLS, and refactoring API routes to verify Supabase JWTs.
- Source of truth: `user_progress` and `responses` tables in Supabase
- Code anchors:
  [src/config/supabase.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/config/supabase.ts)
  [supabase/migrations/0000_initial_schema.sql](/Users/lebron/Documents/PraxisMakesPerfect/supabase/migrations/0000_initial_schema.sql)
  [api/study-plan.ts](/Users/lebron/Documents/PraxisMakesPerfect/api/study-plan.ts)
- Resolution / next step: Migration is complete. The application is now fully running on Supabase with defined SQL tables and RLS policies.

## 2026-03-14 - Final full assessment unlock flow is defined but not yet implemented

- Status: open
- Area: assessment progression / study guide
- Summary: Product direction now includes a third, final full assessment that should unlock only after the learner raises all currently tracked deficit skills to at least 60%, but that assessment flow is not yet built in the live app.
- Source of truth: current product direction plus the new study-guide readiness gate
- Code anchors:
  [src/services/studyPlanService.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/services/studyPlanService.ts)
  [src/components/StudyPlanViewer.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/StudyPlanViewer.tsx)
  [src/utils/globalScoreCalculator.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/globalScoreCalculator.ts)
- Resolution / next step: The live study guide now surfaces a deterministic mastery checklist and gate progress using the 60% threshold. The actual third full-assessment builder, unlock wiring, and UI entry point still need implementation.

## 2026-03-14 - AI study guide needed stronger grounding for resources, vocabulary, and foundational review

- Status: resolved
- Area: study guide generation
- Summary: The existing AI study guide used assessment summaries and scores, but it did not yet fully leverage weak-skill metadata, prerequisite chains, or a structured mastery checklist to drive vocabulary, foundational review, and resource recommendations.
- Source of truth: response-event data, global scores, and the canonical skill map
- Code anchors:
  [src/services/studyPlanService.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/services/studyPlanService.ts)
  [src/components/StudyPlanViewer.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/StudyPlanViewer.tsx)
  [src/brain/skill-map.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/brain/skill-map.ts)
- Resolution / next step: The study guide prompt and viewer now include grounded vocabulary gaps, foundational review, study resources, a deterministic mastery checklist, and a final-assessment gate summary based on tracked deficit skills.

## 2026-03-14 - Quick diagnostic remained active after product decision moved to screener plus full assessment

- Status: resolved
- Area: assessment flow / product terminology
- Summary: The app still exposed the old quick diagnostic path even though the kept short assessment is the screener with broader skill coverage for adaptive guidance and study-plan seeding.
- Source of truth: current product decision plus active assessment builder wiring
- Code anchors:
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
  [src/utils/assessment-builder.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessment-builder.ts)
  [archive/cleanup-2026-03-14/assessment-builder-legacy.ts](/Users/lebron/Documents/PraxisMakesPerfect/archive/cleanup-2026-03-14/assessment-builder-legacy.ts)
- Resolution / next step: Removed the quick diagnostic from active app flows, made screener the active short assessment, and archived the retired builders for reference.

## 2026-03-14 - Assessment and question-bank terminology was not centralized

- Status: resolved
- Area: documentation / product vocabulary
- Summary: Terms like `diagnostic`, `screener`, `question bank`, and `practice question bank` were being used inconsistently across conversation, docs, and code, making it easy to confuse the 40-question quick diagnostic with the 50-question screener and the canonical bank with the derived practice pool.
- Source of truth: current code plus the centralized terminology map
- Code anchors:
  [src/utils/productTerminology.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/productTerminology.ts)
  [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- Resolution / next step: Added a centralized terminology map in code and mirrored the durable glossary into workflow grounding. Follow-up cleanup now keeps archived compatibility labels behind the scenes instead of surfacing them in active docs and UI.

## 2026-03-14 - Practice repeat policy is still implicit rather than formalized

- Status: open
- Area: adaptive practice selection
- Summary: Recent discussions established that practice should avoid unnecessary repeats and likely expose unseen items before recycling questions, but the durable rule has not been fully pinned down or documented in one place.
- Source of truth: intended product workflow plus adaptive selector behavior
- Code anchors:
  [src/hooks/useAdaptiveLearning.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useAdaptiveLearning.ts)
  [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- Resolution / next step: Define the official repeat policy in durable terms, then update the selector and grounding doc together.

## 2026-03-14 - Screener report is current-attempt based, while home readiness is not yet clearly scoped

- Status: watch
- Area: reporting consistency
- Summary: The screener report correctly uses current-attempt counts and percentages, but the future home-page readiness view still needs an explicit decision on whether it represents current, cumulative, or recent-window performance.
- Source of truth: response-event derived reporting model
- Code anchors:
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
  [src/components/ScreenerResults.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/ScreenerResults.tsx)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
- Resolution / next step: When home-page readiness tiles are implemented, explicitly label and document the data window they use.

## 2026-03-14 - Assessment report thresholds are now code-defined and should stay centralized

- Status: resolved
- Area: readiness interpretation
- Summary: Recent reporting work established shared thresholds for domain and overall readiness; these should not be duplicated across multiple UI layers.
- Source of truth: shared assessment report model
- Code anchors:
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
  [docs/WORKFLOW_GROUNDING.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/WORKFLOW_GROUNDING.md)
- Resolution / next step: Keep threshold changes centralized in the report utility and update the grounding doc if the rule changes.

## 2026-03-14 - Post-screener results lacked actionable guidance

- Status: resolved
- Area: screener reporting
- Summary: The post-assessment experience emphasized a readiness gauge more than domain performance, highest-need areas, and study guidance.
- Source of truth: assessment response data plus existing skill and prerequisite metadata
- Code anchors:
  [src/components/ScreenerResults.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/ScreenerResults.tsx)
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
- Resolution / next step: Replaced the thin snapshot view with a shared derived report model and a more useful study-guidance layout.

## 2026-03-14 - Quick diagnostic question count did not match the product label

- Status: resolved
- Area: assessment builder / diagnostic reporting
- Summary: The UI described a 40-question quick diagnostic, but the builder was selecting only 4 questions per domain, yielding 16 total.
- Source of truth: assessment builder configuration
- Code anchors:
  [src/utils/assessment-builder.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessment-builder.ts)
  [src/utils/assessmentConstants.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentConstants.ts)
- Resolution / next step: The builder now distributes a true 40-question diagnostic across active domains.

## 2026-03-14 - Report loading could fail when stored session metadata drifted

- Status: resolved
- Area: assessment report retrieval
- Summary: The app could show "response data not found" when the stored session pointer was stale even though matching response events existed.
- Source of truth: Firestore `users/{uid}/responses`
- Code anchors:
  [src/hooks/useFirebaseProgress.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useFirebaseProgress.ts)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
- Resolution / next step: Report loading now falls back to the latest matching assessment responses and repairs stale pointers when possible.

## 2026-03-14 - Home-page readiness signals are not yet fully unified with the new report model

- Status: watch
- Area: home page / reporting consistency
- Summary: The report layer now uses a shared derived readiness model, but the home page still uses lighter summary fields and does not yet fully share the same domain readiness presentation.
- Source of truth: derived report model from responses
- Code anchors:
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
- Resolution / next step: If domain readiness badges or gauges are added to the home page, reuse the same shared thresholds and domain summary model rather than creating a second interpretation layer.
