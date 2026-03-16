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

## 2026-03-16 - Netlify deployment shows blank white page when Supabase env vars missing

- Status: resolved
- Area: deployment / Netlify
- Summary: The app threw during module load when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` were missing, causing a blank white page with no visible error. Vite inlines env vars at build time, so vars must be set in Netlify before deploy.
- Source of truth: [src/config/supabase.ts](/workspace/src/config/supabase.ts), [src/main.tsx](/workspace/src/main.tsx)
- Code anchors:
  [src/config/supabase.ts](/workspace/src/config/supabase.ts)
  [src/main.tsx](/workspace/src/main.tsx)
- Resolution / next step: Added pre-render env check in main.tsx that shows a visible configuration error instead of crashing. Netlify requirements: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Site settings → Environment variables, then trigger a new deploy (build must run with vars present).

---

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
