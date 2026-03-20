# Workflow Grounding

Status: Active working guide.

This file is the durable place for repo-specific workflow rules, reporting rules, and implementation clarifications that should not get lost in chat history.

Use it for:

- rules that affect how the product should behave
- reporting and scoring clarifications
- source-of-truth notes
- places in code where critical logic lives
- "do this, not that" implementation guidance

Do not use it for:

- one-off brainstorming
- long historical narratives
- temporary personal reminders
- duplicate changelog entries

## 1. Source Of Truth Model

- `responses` and `user_progress` tables in Supabase PostgreSQL are the sources of truth for answered items and auth tracking.
- `profile` is a cached summary layer, not the deepest source of truth.
- Assessment and reporting views should derive from actual Supabase response data whenever practical.
- If a summary field and response events disagree, response events win and the cache should be repaired.

## 2. Where To Put Rules

- Product and workflow rules:
  `docs/WORKFLOW_GROUNDING.md`
- Discovered bugs, reporting mismatches, and unresolved findings:
  `docs/ISSUE_LEDGER.md`
- Historical implementation record:
  `CHANGELOG.md`
- Architecture-level constraints:
  `REWRITE_DEVELOPMENT_GUIDE.md`
- Maintained map of active docs and how to use them:
  `docs/DOCS_SYSTEM.md`

## 2.1 Onboarding Profile Source Rules

- Graduate-student onboarding should use the official NASP School Psychology Program Information directory as the source for the school psychology program selector.
- The onboarding UI should present the graduate-student program flow as:
  - `program_state` selected from a dropdown of NASP-listed jurisdictions
  - `university` selected from a dropdown filtered to the chosen state
- Store the selected program name in `user_progress.university` and the human-readable state name in `user_progress.program_state` so the existing profile schema remains stable.
- Certification-state selection should use a normalized dropdown of U.S. states and supported jurisdictions rather than free-text entry.
- If the NASP directory source is refreshed or the selector wiring changes, update this doc and keep the source URL current in the checked-in data file.

## 3. Assessment And Reporting Rules

### 3.1 Assessment and bank terminology

- Product terminology is centralized in:
  [src/utils/productTerminology.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/productTerminology.ts)
- `screener` is the active short assessment flow.
  It is the `50`-question assessment built by `buildScreener()` and is the kept short-form assessment because it spreads coverage across skills for adaptive practice and study-plan seeding.
  Code anchors:
  [src/utils/assessment-builder.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessment-builder.ts)
  [src/components/ScreenerAssessment.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/ScreenerAssessment.tsx)
  [src/hooks/useFirebaseProgress.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useFirebaseProgress.ts)
- `full assessment` is the `125`-question flow built by `buildFullAssessment()`.
  In response logs this flow uses `assessmentType: 'full'`.
  Code anchors:
  [src/utils/assessment-builder.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessment-builder.ts)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
  [src/components/FullAssessment.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/FullAssessment.tsx)
- Current active product reality: there are two assessment flows in the product layer:
  - screener
  - full assessment
- The shared response-event store now distinguishes active screener data with `assessmentType: 'screener'`.
- Do not use storage field names alone as the public terminology model.
  When discussing the product, say `screener` for the short assessment and `full assessment` for the long assessment.
- `question bank` means the canonical curated question source loaded from `src/data/questions.json` and then analyzed into `analyzedQuestions`.
  This is the main bank used by assessment builders, reporting, and practice.
  Code anchors:
  [src/data/questions.json](/Users/lebron/Documents/PraxisMakesPerfect/src/data/questions.json)
  [src/brain/question-analyzer.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/brain/question-analyzer.ts)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
- `practice question bank` should be treated as a conversational shortcut for the derived `practice question pool`, not as a second persisted bank.
  In current code this is the in-memory subset exposed as `practiceQuestions` and filtered again by the adaptive selector.
  Code anchors:
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)
  [src/hooks/useAdaptiveLearning.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useAdaptiveLearning.ts)
- Post-assessment reporting for the screener should continue using the shared derived report model.
- Retired or mistaken terminology does not belong in this file.
  If old naming matters for debugging or migration history, record it in [docs/ISSUE_LEDGER.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/ISSUE_LEDGER.md) instead.

### 3.2 Readiness and domain reporting

- Readiness labels are study-guidance labels, not formal scaled scores.
- Domain reporting should use actual `correct / attempted` counts for the questions the student actually saw.
- Do not show misleading fixed denominators unless the denominator is truly part of the assessment design and clearly labeled.
- Timing metrics are secondary. They should not outrank domain performance, skill gaps, or next study actions.
- For the current shared assessment report model:
  - domain `ready` threshold = `70%`
  - domain `building` threshold = `55%`
  - overall `on track` threshold = `75%`
  - overall `building` threshold = `60%`
  Code anchor:
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
- The post-screener report should be based on the current assessment attempt first.
  Do not silently mix in cumulative practice data unless the UI is explicitly labeled as cumulative.

### 3.2.1 Shared proficiency vocabulary for skills and domains

- User-facing proficiency vocabulary is shared across skills and domains. Do not use different explanatory copy for domain badges versus skill badges.
- The canonical user-facing levels are:
  - `Emerging`
  - `Approaching`
  - `Demonstrating`
  - `Not started` for zero-attempt skill states only
- Canonical meaning:
  - `Emerging` = foundational gaps are still getting in the way, so targeted remediation is needed before performance is consistent
  - `Approaching` = performance is near the threshold, with opportunities to strengthen foundational knowledge and apply it more consistently
  - `Demonstrating` = performance is meeting the threshold and shows the ability to apply foundational knowledge consistently in practice
- Current shared thresholds:
  - `Demonstrating` = `>= 80%`
  - `Approaching` = `60%–79%`
  - `Emerging` = `< 60%`
- Overall exam readiness remains a separate metric: `70%` of the `45` tracked skills must reach `Demonstrating` for the readiness target.
- If this vocabulary, its meanings, or the thresholds change, update the code and [docs/HOW_THE_APP_WORKS.md](/Users/lebron/Documents/PraxisMakesPerfect/docs/HOW_THE_APP_WORKS.md) in the same change.
  Code anchors:
  [src/utils/skillProficiency.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/skillProficiency.ts)
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
  [src/utils/progressSummaries.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/progressSummaries.ts)

### 3.2.2 Answer-feedback references

- User-facing feedback must not rely on unstable answer letters when answer order can change in the UI.
- If answer order is shuffled or re-labeled for display, rationale copy and distractor notes should reference:
  - the answer text itself
  - a short quoted excerpt of the answer text
  - or a structured `Correct answer` / `Your selection` block
- Internal identifiers such as `A`-`F` may still be used for scoring and storage, but they should not be surfaced in explanation copy unless the displayed labels are guaranteed to match the stored labels.
- Practice feedback and explanation rendering should stay aligned with the user-visible answer text, not just the internal answer key.
  Code anchors:
  [src/components/ExplanationPanel.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/ExplanationPanel.tsx)
  [src/components/PracticeSession.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/PracticeSession.tsx)
  [src/utils/feedbackText.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/feedbackText.ts)

### 3.2.3 Confidence response labels

- User-facing confidence choices must be shown in this order:
  - `Guess`
  - `Unsure`
  - `Sure`
- Internal stored values remain:
  - `low`
  - `medium`
  - `high`
- The display mapping is fixed as:
  - `low` -> `Guess`
  - `medium` -> `Unsure`
  - `high` -> `Sure`
- Renaming these labels must not change their scoring meaning, persistence shape, weighting, or any downstream analysis keyed off `low` / `medium` / `high`.
- Confidence terminology should be centralized in:
  [src/utils/confidenceLabels.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/confidenceLabels.ts)
  Code anchors:
  [src/components/QuestionCard.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/QuestionCard.tsx)
  [src/components/PracticeSession.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/PracticeSession.tsx)
  [src/brain/learning-state.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/brain/learning-state.ts)

### 3.3 Foundational gaps

- Foundational or prerequisite gaps should only be surfaced when supported by existing skill metadata.
- If a missed skill has prerequisite skills, those may be shown as foundational review targets.
- Do not infer hidden prerequisite relationships that are not present in metadata.

### 3.4 Practice-driven updates

- Domain readiness should be able to evolve as the student answers more items.
- Prefer reusing a shared report model or derived summary utility instead of hardcoding separate home-page and report-page logic.
- If the home page displays readiness signals, those signals should come from the same threshold logic used in the report layer.
- If both current-attempt and cumulative readiness are shown in the product, they must be labeled separately.
- The current desired direction is:
  - response events remain the source of truth
  - report views derive from response events
  - home-page readiness signals should eventually update as more items are answered, including practice

### 3.5 Practice question repeat policy

- A durable repeat-policy rule has not been fully implemented yet.
- Current desired behavior discussed in working sessions:
  - avoid unnecessary repeats
  - prefer exposing unseen skill/question opportunities before recycling items
  - if repeats are later allowed for reinforcement, that rule should be explicit and documented
- Until this is formalized in code and documented here, do not assume the current adaptive selector matches the intended long-term repeat policy.

### 3.6 Home-page domain readiness tiles

- Home-page domain tiles are expected to become more readiness-oriented over time.
- If gauges, lights, or red-to-green readiness states are added:
  - they should be backed by the same shared readiness interpretation logic as the report layer
  - they should clearly communicate whether they are based on current attempt, cumulative history, or a recent rolling window
  - collapsible domain details should summarize strengths, weaknesses, and growth opportunities rather than raw analytics dumps

### 3.7 AI study guide grounding

- The AI study guide should be grounded in:
  - screener response data
  - full-assessment response data
  - global domain and skill scores
  - skill metadata such as prerequisites, decision rules, common wrong rules, and required evidence
- Vocabulary recommendations should come from weak or flagged skills and their supporting metadata, not from invented terminology.
- Foundational review items should be tied to actual prerequisite chains already defined in the skill map.
- Study-resource recommendations should stay grounded in available in-product study moves and known skill metadata.
  Do not invent external books, websites, or citations unless the repo later gains a curated resource source of truth.
- The study guide may include a mastery checklist and progress toward the planned final full-assessment gate.
  That checklist should be tied to currently tracked deficit skills and the current unlock threshold rather than free-form AI guesses.
  Code anchors:
  [src/services/studyPlanService.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/services/studyPlanService.ts)
  [src/components/StudyPlanViewer.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/StudyPlanViewer.tsx)
  [src/utils/globalScoreCalculator.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/globalScoreCalculator.ts)
  [src/brain/skill-map.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/brain/skill-map.ts)

### 3.8 Study guide API contract

**Active architecture (as of 2026-03-18): Background Function + Polling**

Generation takes 45–90 seconds (large prompt + 8000 max_tokens). Netlify sync functions have a 30-second gateway ceiling. The implementation uses a Netlify Background Function.

**Background function endpoint:** `POST /api/study-plan-background`
- Netlify returns 202 immediately to the client.
- The function runs to completion (up to 15 min): calls Claude, parses the response, saves a complete `StudyPlanDocument` to the `study_plans` Supabase table.
- The client polls `study_plans` (`created_at > requestedAt`) at 4-second intervals with a 4-minute timeout ceiling.

**Request body** (`StudyPlanApiRequest`):
- `userId` — must match the bearer token user
- `prompt` — built client-side from response data + skill metadata
- `sourceSummary` — counts describing the grounded inputs
- `requestedAt` — ISO timestamp so the client knows what "new" means when polling
- `preComputedAddons` (optional) — `{ masteryChecklist, finalAssessmentGate }` computed client-side and forwarded so the background function can persist a complete document

**What the background function saves to `study_plans`:**
A complete `StudyPlanDocument` with all sections including pre-computed `masteryChecklist` and `finalAssessmentGate`. The `plan_document` column stores the full JSON.

**Rules that must not change without updating this doc:**
- The `/api/*` → `/.netlify/functions/:splat` rewrite in `netlify.toml` must stay above the `/*` SPA wildcard or `/api/study-plan-background` will never reach the function.
- The function must verify the bearer token (`supabase.auth.getUser(idToken)`) before calling the model.
- `preComputedAddons` is optional; if absent the background function saves empty `masteryChecklist: []` and `finalAssessmentGate: null`. The display layer should gracefully handle both.
- The `study_plans` table requires RLS policy `auth.uid() = user_id` for INSERT and SELECT.

**The sync function `api/study-plan.ts` still exists** as a reference but is no longer called by `generateStudyPlan`. Do not remove it until the background path is proven stable in production.

Code anchors:
  [api/study-plan-background.ts](/Users/lebron/Documents/PraxisMakesPerfect/api/study-plan-background.ts)
  [api/study-plan.ts](/Users/lebron/Documents/PraxisMakesPerfect/api/study-plan.ts)
  [src/types/studyPlanApi.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/types/studyPlanApi.ts)
  [src/services/studyPlanService.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/services/studyPlanService.ts)
  [App.tsx](/Users/lebron/Documents/PraxisMakesPerfect/App.tsx)

### 3.8.1 Netlify function format rules

**Always use Lambda format for Netlify functions:**
```ts
export const handler = async (event: any) => {
  return { statusCode: 200, headers: { ... }, body: JSON.stringify(...) };
};
```
**Never use Express format** (`export default function handler(req, res)`). Express format compiles but Netlify calls it as `handler(event, context)` where `req` = event, `res` = context. `req.method` is `undefined`; `res.status()` throws.

**Background functions:** suffix the filename with `-background` (e.g., `api/study-plan-background.ts`). Netlify sends 202 to the caller immediately. The function runs to completion up to 15 minutes.

**Header access:** headers arrive as lowercase in `event.headers`. Use `event.headers['authorization']`, not `event.headers['Authorization']` — check both as a safety measure.

### 3.8.2 Supabase operational notes

- **Key format (2025+):** `sb_publishable_*` = anon key, `sb_secret_*` = service role key. These work with the Supabase JS client. They do NOT work as JWT bearer tokens in direct REST API calls (they're opaque, not JWTs). The service-role key works in Netlify functions via `createClient()` + `supabase.auth.getUser()`.
- **Admin API from local machine:** `supabase.auth.admin.listUsers()` with the service role key returns 401 from a developer machine. This may be IP-restricted. To inspect user data, sign in as the user with the anon key and query their own tables (RLS allows self-queries), or use Supabase Dashboard → SQL Editor.
- **Direct Postgres:** `SUPABASE_DB_URL` is blocked from developer machines. It works from Netlify function runtime.
- **Applying migrations:** Supabase CLI requires Docker for local use. Apply production migrations via Supabase Dashboard → SQL Editor. Migration files live in `supabase/migrations/` for version history.
- **`study_plans` table:** created in migration `0001`. Stores `{ plan_document: JSONB }` per user. RLS restricts insert/select to the owning user. `getLatestStudyPlan(userId)` fetches the most recent row ordered by `created_at DESC`.

### 3.9 Question-bank rewrite and audit handoff

- When question text is audited or rewritten without changing question identity, treat the result as a `delta patch`, not a new bank.
- The preferred handoff artifact is a machine-mergeable file keyed by `UNIQUEID` that includes only the changed fields.
  For answer-choice edits, that usually means only the changed option columns (`A`-`F`) and, if applicable, updated `correct_answers` or `CORRECT_Explanation`.
- Preserve these fields unless there is an explicit approved change:
  - `UNIQUEID`
  - skill/category mappings
  - domain/category metadata
  - question counts
- When an audit edits answer-choice wording to reduce cueing, avoid replacing one cue with another.
  In particular, do not overuse repeated boilerplate phrases that make wrong answers sound uniformly machine-written or obviously incorrect.
- If the currently correct option text is rewritten, verify that:
  - the correct answer letter still points to the intended option
  - the explanation still matches the revised wording
- Keep a separate before/after audit log when available so future reviewers can trace why a change was made.
- If an automated or LLM-assisted audit leaves a set of still-flagged items, keep that list with the audit output rather than silently blending those unresolved items into the main bank.
- When a delta is merged into `src/data/questions.json`, record the outcome in the existing doc system:
  - durable workflow lessons in this file
  - the concrete merge and verification result in `docs/ISSUE_LEDGER.md`
  - the historical note in `CHANGELOG.md`
- Prior knowledge from the 2026-03-15 answer-choice audit and merge:
  - fixing length cueing can accidentally create style cueing if distractors all sound like the same disclaimer engine
  - rotating only the final phrase is not enough if distractors still share one generic evidence/clinical voice
  - stronger distractor rewrites come from error-type-aware completions such as overgeneralization, wrong action, partial-factor reasoning, category confusion, or premature conclusion
  - explanation sanity checks after correct-option trims should evaluate semantic agreement, not exact phrase reuse
  - remaining flagged items should be triaged by domain difficulty; legal/statute-heavy and research-methodology items may benefit most from expert manual review
  Code anchors:
  [src/data/questions.json](/Users/lebron/Documents/PraxisMakesPerfect/src/data/questions.json)
  [scripts/export-question-csv.cjs](/Users/lebron/Documents/PraxisMakesPerfect/scripts/export-question-csv.cjs)
  [output/AUDIT_SUMMARY.md](/Users/lebron/Documents/PraxisMakesPerfect/output/AUDIT_SUMMARY.md)

### 3.9.1 Question bank data integrity (merged options / leaked keys)

Some historical exports or merges produced **structurally invalid MCQ rows** without failing JSON parse. Symptoms in the app:

- An option letter appears “missing,” or the explanation references a letter that does not match what users see.
- Choice **B** contains a fragment like ` … C) …` (two answers glued together).
- **C** is empty while `option_count_expected` is `4`.
- Any choice text contains export artifacts: `**Correct Answer:` or `**Explanation:**` (those belong only in `correct_answers` / `CORRECT_Explanation`, never in `A`–`F`).

**Canonical runtime bank:** `src/data/questions.json`. **Parallel 900q bundle:** `praxis_5403_practice_questions_900q.json` — keep them aligned when correcting content.

**Before merging or publishing question edits**, spot-check:

1. `rg '\*\*Correct Answer:' src/data/questions.json` → should be **no hits** inside choice columns (explanations may still mention “Option C” in prose).
2. For every item with `option_count_expected: "4"`, all of `A`–`D` must be non-empty after trim.
3. CSVs and reports under `output/` are **not** source of truth; regenerate them after JSON fixes or they will retain stale corrupted strings.

**Incident (2026-03-19):** Four IDs had this corruption and were repaired: `PQ_SWP-02_11`, `PQ_DBD-09_20`, `PQ_SAF-01_18`, `PQ_ETH-03_17`. Details: [ISSUE_LEDGER.md](./ISSUE_LEDGER.md) (entry dated 2026-03-19).

### 3.10 Repo hygiene for local-only artifacts

- Canonical runtime inputs belong in tracked source locations such as `src/data/`, `src/brain/`, `scripts/`, and the active docs set.
- Private or reference materials that are not consumed by the app or build, such as PDFs, DOCX deliverables, scratch mapping notes, and one-off local scripts, belong under `local/` and should remain untracked.
- Generated CSV/JSON exports under `output/` are local working artifacts by default and should not be treated as canonical or public repo assets.
- If a generated artifact must remain tracked as an intentional handoff package, document the exception explicitly. Current kept exception: `output/AUDIT_SUMMARY.md`.
- When non-runtime local artifacts are found in tracked repo content, remove them from tracking while preserving the local copy, then record the cleanup in `docs/ISSUE_LEDGER.md` and `CHANGELOG.md`.
  Code anchors:
  [/.gitignore](/Users/lebron/Documents/PraxisMakesPerfect/.gitignore)
  [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md)
  [local/README.md](/Users/lebron/Documents/PraxisMakesPerfect/local/README.md)

## 4. Current Code Anchors

- Assessment building:
  [src/utils/assessment-builder.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessment-builder.ts)
- Assessment constants:
  [src/utils/assessmentConstants.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentConstants.ts)
- Supabase progress and response retrieval:
  [src/hooks/useFirebaseProgress.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useFirebaseProgress.ts) (Note: internally refactored to use Supabase)
- Adaptive practice selection:
  [src/hooks/useAdaptiveLearning.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/hooks/useAdaptiveLearning.ts)
- Shared assessment report derivation:
  [src/utils/assessmentReport.ts](/Users/lebron/Documents/PraxisMakesPerfect/src/utils/assessmentReport.ts)
- Post-assessment screener UI:
  [src/components/ScreenerResults.tsx](/Users/lebron/Documents/PraxisMakesPerfect/src/components/ScreenerResults.tsx)

## 4. Repo Hygiene For Local-Only Artifacts

- Canonical runtime inputs belong in tracked source locations such as `src/data/`, `src/brain/`, `scripts/`, and the active docs set.
- Private or reference materials that are not consumed by the app or build, such as PDFs, DOCX deliverables, scratch mapping notes, and one-off local scripts, belong under `local/` and should remain untracked.
- Generated CSV/JSON exports under `output/` are local working artifacts by default and should not be treated as canonical or public repo assets.
- If a generated artifact must remain tracked as an intentional handoff package, document the exception explicitly. Current kept exception: `output/AUDIT_SUMMARY.md`.
- When non-runtime local artifacts are found in tracked repo content, remove them from tracking while preserving the local copy, then record the cleanup in `docs/ISSUE_LEDGER.md` and `CHANGELOG.md`.
  Code anchors:
  [/.gitignore](/Users/lebron/Documents/PraxisMakesPerfect/.gitignore)
  [README.md](/Users/lebron/Documents/PraxisMakesPerfect/README.md)
  [local/README.md](/Users/lebron/Documents/PraxisMakesPerfect/local/README.md)

## 5. Change Checklist

When changing reporting, readiness, or assessment wiring:

1. Confirm the real source of truth.
2. Verify denominator logic and threshold logic.
3. Update shared utilities before patching multiple components.
4. Add or update an entry in `docs/ISSUE_LEDGER.md` if a bug or mismatch was found.
5. Update this file if the rule or wiring changed in a durable way.
6. Update `CHANGELOG.md` if the change is meaningful to repo history.
7. Update `docs/DOCS_SYSTEM.md` if the role of an active doc changed or a new active doc was added.

## 6. Definition Of Done For Grounded Changes

A change is grounded when:

- the behavior is implemented in code
- the rule is documented in the right place if it is durable
- known gaps are logged instead of forgotten
- the same logic is not reimplemented in multiple UI layers without reason
- the team can tell where to update the rule next time

## 7. Rule Entry Template

Use this template when adding a new durable rule:

```md
### Rule: <short name>

- Decision:
- Why:
- Source data:
- Code anchor:
- Notes / limits:
```
