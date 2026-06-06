# Diagnostic Output Contract & Selector Migration Plan

**Date:** 2026-03-29
**Scope:** Audit + plan only — no implementation
**Files in scope:** 10 (5 utilities, 5 components)

---

## 1. Signals Currently Computed but Stripped, Ignored, or Split

### 1.1 `missedConcepts` — Accumulated and Discarded

**File:** `src/utils/assessmentReport.ts`, lines 163–166, 258
**Evidence:**
```typescript
// Line 163–166: accumulated per skill
(question.keyConcepts || []).forEach((concept) =>
  currentSkill.missedConcepts.add(concept)
);

// Line 258: the per-skill Set exists in the intermediate SkillAccum object
// but the final AssessmentReportModel exposes only foundational gaps derived
// from prerequisites — not the raw missed concepts themselves
```
The `missedConcepts` Set is populated for every wrong answer and used internally only to drive the `foundationalGaps` array (prerequisites of failed skills). The raw set of missed concept strings is never returned in the final model. Any surface that wants "which concepts did this user miss?" must either re-derive or go without.

---

### 1.2 `confidenceFlags` — Computed in Brain, Never Surfaced

**File:** `src/brain/learning-state.ts`, lines 48–52
**Evidence:**
```typescript
// Line 48–52
let confidenceFlags = 0;
for (const r of responses) {
  if (r.confidence === 'high' && !r.isCorrect) confidenceFlags++;
}
```
`confidenceFlags` counts the number of times a user answered confidently and was wrong — a strong misconception signal. It is written into the `LearningStateResult` object but nothing in the component layer reads it. `ResultsDashboard.tsx` describes the weighting scheme (`Sure×1.2`, `Sure+wrong×0.5`) in a UI comment (line 724) without ever exposing the actual flag count.

---

### 1.3 Timing Signals — Recomputed in Three Places Independently

**Files:**
- `src/utils/conceptAnalytics.ts` lines 141–144, 195: `avgTimeSeconds` per concept
- `src/components/ResultsDashboard.tsx` lines 67–104: `computeTimeStats()` — local helper computing average time and top-5 slowest questions
- `src/components/ScoreReport.tsx` lines 136–160: `avgTimePerQuestion` and slowest-question list rebuilt from raw `responses` on every render (no `useMemo`)

Three separate derivations of timing from the same underlying `timeSpent` field, with no shared contract. `ScoreReport.tsx` recomputes on every render without memoization.

---

### 1.4 `crossSkillGaps` — Computed but Not Unified with `foundationalGaps`

**File:** `src/utils/conceptAnalytics.ts`, lines 211–234
**Evidence:**
```typescript
// Lines 221–226
if (perf.total >= 2 && perf.correct / perf.total < 0.60) {
  weakSkills.push(skillId);
}
// A concept is a crossSkillGap if it's weak in 2+ different skills
```
`crossSkillGaps` identifies concepts that are weak across multiple skills — a stronger signal than a single-skill gap. It is returned from `buildConceptAnalytics()` but nothing currently renders or acts on it. `assessmentReport.ts` produces `foundationalGaps` (prerequisite-based) as a separate concept; the two are never reconciled into a unified gap model.

---

### 1.5 `trend` — Computed but Gated by Attempt Count, Never Shown When Insufficient

**File:** `src/utils/conceptAnalytics.ts`, lines 158–170
The trend signal requires ≥ 4 attempts per concept; below that it returns `'insufficient'`. No component surfaces `'insufficient'` as a distinct state — it is silently treated the same as having no trend data.

---

### 1.6 Prerequisite Mastery Gate — Computed but Not Exposed as a Signal

**File:** `src/brain/learning-state.ts`, lines 89–120
`checkPrerequisitesMet()` recursively verifies prerequisite mastery before assigning a learning state above `'emerging'`. The gate fires and affects state, but the *reason* (which prerequisite was not met) is never returned. No component can tell a user "Skill X is still emerging because Skill Y isn't mastered yet."

---

### 1.7 SRS Metadata — Written, Never Read

**File:** `src/brain/learning-state.ts`, lines 76–78
`srsBox` (0–4) and `nextReviewDate` are written as shadow state. No component reads them. Not a priority to surface but relevant to the contract.

---

## 2. Proposed `DiagnosticSummary` Type

This type is the proposed single selector output. It is a **new file** (`src/utils/diagnosticSummary.ts`). It does not replace any existing return type — it aggregates already-computed signals.

```typescript
// src/utils/diagnosticSummary.ts (NEW FILE)

import type { ConceptAnalyticsReport } from './conceptAnalytics';
import type { AssessmentReportModel } from './assessmentReport';
import type { SkillProficiencyLevel } from './skillProficiency';
import type { LearningStateResult } from '../brain/learning-state';

/** Per-skill diagnostic data, resolved from all sources */
export interface SkillDiagnostic {
  skillId: string;
  proficiencyLevel: SkillProficiencyLevel;       // from skillProficiency.ts
  score: number | null;
  weightedAccuracy: number | null;               // from learning-state.ts
  attempts: number;
  confidenceFlags: number;                       // HIGH+WRONG count — currently dropped
  missedConcepts: string[];                      // currently discarded in assessmentReport.ts
  crossSkillGapConcepts: string[];               // from conceptAnalytics.ts — currently unused
  trend: 'improving' | 'declining' | 'stable' | 'insufficient';
  learningState: 'emerging' | 'developing' | 'proficient' | 'mastery';
  blockedByPrerequisite: string | null;          // first unmet prerequisite skillId, currently untracked
  avgTimeSeconds: number | null;                 // from conceptAnalytics.ts
}

/** Per-domain diagnostic rollup */
export interface DomainDiagnostic {
  domainId: string;
  score: number | null;
  demonstratingCount: number;
  approachingCount: number;
  emergingCount: number;
  unstartedCount: number;
  demonstratingPct: number;                      // 0–100
  tone: 'ready' | 'building' | 'priority';       // from assessmentReport.ts
  weakestSkills: SkillDiagnostic[];              // top N by ascending score
  strongestSkills: SkillDiagnostic[];            // top N by descending score
}

/** Timing stats — currently recomputed independently in 3 places */
export interface TimingDiagnostic {
  avgTimeSeconds: number | null;
  medianTimeSeconds: number | null;
  slowestQuestions: Array<{
    questionId: string;
    timeSeconds: number;
    skillId: string;
  }>;
}

/** Top-level output of the shared selector */
export interface DiagnosticSummary {
  // Readiness
  overallScore: number | null;
  proficiencyLevel: SkillProficiencyLevel;
  readinessLabel: 'Demonstrating' | 'Approaching' | 'Emerging';
  demonstratingCount: number;
  skillsToReadiness: number;                     // max(0, READINESS_TARGET - demonstratingCount)
  isReady: boolean;

  // Signals currently split/dropped
  totalConfidenceFlags: number;                  // sum across all skills
  foundationalGapSkillIds: string[];             // from assessmentReport.ts foundationalGaps
  crossSkillGapConcepts: string[];               // from conceptAnalytics.ts — currently unused
  allMissedConcepts: string[];                   // currently discarded

  // Per-domain and per-skill breakdowns
  domains: DomainDiagnostic[];
  skills: SkillDiagnostic[];

  // Timing
  timing: TimingDiagnostic;

  // Raw source references (for progressive disclosure)
  assessmentReport: AssessmentReportModel;
  conceptReport: ConceptAnalyticsReport | null;
}
```

**Key design decisions:**
- `DiagnosticSummary` is a pure data type. The function that builds it calls existing utilities and assembles results — no new scoring logic.
- `blockedByPrerequisite` exposes the *reason* for an `'emerging'` state, which `learning-state.ts` already computes but discards.
- `allMissedConcepts` is the deduplicated union of all per-skill `missedConcepts` Sets — already accumulated in `assessmentReport.ts`, just not returned.
- `assessmentReport` and `conceptReport` are embedded so callers with existing access patterns don't break.

---

## 3. Components Computing Thresholds or Diagnostic Meaning Inline

| Component | Inline Logic | Should Come From |
|---|---|---|
| `ScreenerResults.tsx` | `domainStatusLabel()` (lines 36–44) re-implements proficiency tier mapping | `getSkillProficiency()` + `PROFICIENCY_META` |
| `ScreenerResults.tsx` | `overallMeaning()` (lines 46–54) derives messaging from score thresholds inline | `DiagnosticSummary.readinessLabel` |
| `ResultsDashboard.tsx` | `READINESS_GOAL_PCT = 0.7`, `READINESS_TARGET = Math.ceil(45 * 0.7)` (lines 24–26) | Shared constant in `skillProficiency.ts` or `diagnosticSummary.ts` |
| `ResultsDashboard.tsx` | `barColor` threshold: `barPct >= 70 → emerald`, `>= 50 → amber` (line 372) | Named color-tier constants |
| `ResultsDashboard.tsx` | `computeTimeStats()` (lines 67–104) — full timing derivation inline | `DiagnosticSummary.timing` |
| `ResultsDashboard.tsx` | `confidenceStats` (lines 195–218) — confidence delta computed inline | `DiagnosticSummary.totalConfidenceFlags` + `SkillDiagnostic.confidenceFlags` |
| `StudyModesSection.tsx` | `TOTAL_SKILLS = 45`, `READINESS_TARGET = Math.ceil(45 * 0.7)` (lines 46–47) — duplicates Dashboard | Same shared constant |
| `StudyModesSection.tsx` | `barColor`/`labelColor` thresholds 70%/50% (lines 211–212) | Named color-tier constants |
| `StudyModesSection.tsx` | `overallAccuracy` color (lines 575–579): `>= 70 → emerald`, `>= 50 → amber` | Named color-tier constants |
| `StudyModesSection.tsx` | `readinessBarPct` (line 520) — percentage-to-readiness derived inline | `DiagnosticSummary.skillsToReadiness` |
| `PraxisPerformanceView.tsx` | `getPerformanceLabel()` (lines 55–75) — inline color + label from score | `PROFICIENCY_META` from `skillProficiency.ts` |
| `PraxisPerformanceView.tsx` | `deficiencyCount` (line 111): hardcoded `< 0.6` threshold | `APPROACHING_THRESHOLD` (already imported but not used here) |
| `ScoreReport.tsx` | `getScoreColor()` (lines 22–26) — inline threshold-to-color mapping | `PROFICIENCY_META` |
| `ScoreReport.tsx` | Domain score reconstruction from `responses` (lines 106–122) — recomputes on every render | `DiagnosticSummary.domains` |
| `ScoreReport.tsx` | Timing stats (lines 136–160) — rebuilt from raw responses each render | `DiagnosticSummary.timing` |

---

## 4. Per-File Specifications

### 4.1 `src/utils/assessmentReport.ts`

**What it does now:**
Builds `AssessmentReportModel` from `UserResponse[]` + `AnalyzedQuestion[]`. Accumulates `missedConcepts` per skill (line 165) then discards them — they never appear in the return type. Exposes `foundationalGaps` (prerequisite-based) instead.

**What should move to selector layer:**
- `missedConcepts`: the per-skill Set should be converted to `string[]` and included in the return value of `buildAssessmentReportModel()`, or passed through to `DiagnosticSummary.skills[n].missedConcepts`. No logic change — just preserve and return what is already computed.

**Change type:** Logic-only (add field to return type; add it to selector assembly).

**Risk:** Low. Additive only. Existing consumers receive the same fields; new field is appended.

---

### 4.2 `src/utils/conceptAnalytics.ts`

**What it does now:**
Returns `ConceptAnalyticsReport` including `crossSkillGaps`, `gapConcepts`, `strengthConcepts`, `avgTimeSeconds` per concept. All fields are already returned. The problem is downstream: nothing reads `crossSkillGaps`.

**What should move to selector layer:**
Nothing moves out of this file. The selector (`buildDiagnosticSummary`) should read `crossSkillGaps` from the returned report and expose it at `DiagnosticSummary.crossSkillGapConcepts`. Concept-level `avgTimeSeconds` should feed `DiagnosticSummary.timing`.

**Change type:** No change to this file. Selector reads it.

---

### 4.3 `src/brain/learning-state.ts`

**What it does now:**
Returns `LearningStateResult` per skill with `learningState`, `weightedAccuracy`, `confidenceFlags`, `consecutiveCorrect`, and SRS shadow fields. `confidenceFlags` is in the return type but no component reads it. `checkPrerequisitesMet()` fires as a gate but does not expose which prerequisite was unmet.

**What should move to selector layer:**
- `confidenceFlags`: the selector reads this field (already exists) and exposes it in `SkillDiagnostic.confidenceFlags` and sums to `DiagnosticSummary.totalConfidenceFlags`.
- `blockedByPrerequisite`: `checkPrerequisitesMet()` should be modified to return the first unmet prerequisite `skillId` instead of a bare `boolean`. This is a small change to a private function with one call site.

**Change type:** Logic-only (modify `checkPrerequisitesMet` return type; propagate to `LearningStateResult`).

**Risk:** Low-medium. `checkPrerequisitesMet` is called only in `calculateLearningState`. Return type change is internal. Callers of `calculateLearningState` outside this file should be verified.

---

### 4.4 `src/utils/skillProficiency.ts`

**What it does now:**
Exports `DEMONSTRATING_THRESHOLD` (0.8), `APPROACHING_THRESHOLD` (0.6), `getSkillProficiency()`, and `PROFICIENCY_META`. Does not export readiness constants.

**What should move to selector layer:**
- Add two exports:
  ```typescript
  export const TOTAL_SKILLS = 45;
  export const READINESS_TARGET = Math.ceil(TOTAL_SKILLS * 0.7); // 32
  ```
  These are currently duplicated verbatim in `ResultsDashboard.tsx` (lines 24–26) and `StudyModesSection.tsx` (lines 46–47).
- Add color-tier constants for the 70%/50% visual thresholds used across three components:
  ```typescript
  export const COLOR_TIER_GOOD_PCT = 70;
  export const COLOR_TIER_DEVELOPING_PCT = 50;
  ```

**Change type:** Logic-only (additive exports; existing exports unchanged).

**Risk:** None. Pure addition.

---

### 4.5 `src/utils/progressSummaries.ts`

**What it does now:**
Builds per-skill and per-domain progress rows including `colorState`, `weakSkillCount`, `developingSkillCount`, `strongerSkillCount`. Already well-structured.

**What should move to selector layer:**
Nothing from this file needs to move. `buildProgressSummary()` output becomes one of the inputs to `buildDiagnosticSummary()`. The selector reads `weakestDomain` and per-domain counts from here.

**Change type:** No change to this file.

---

### 4.6 `src/components/ScreenerResults.tsx`

**What it does now:**
- `domainStatusLabel()` (lines 36–44): re-implements the three-tier proficiency label using imported thresholds but duplicates logic from `getSkillProficiency()` + `PROFICIENCY_META`.
- `overallMeaning()` (lines 46–54): derives one of three copy strings based on overall score inline.

**What should move to selector layer:**
- `domainStatusLabel()` → replace body with `PROFICIENCY_META[getSkillProficiency(score, attempts)].label`. No prop change needed.
- `overallMeaning()` → derive from `report.readinessSummary.label` (already on `AssessmentReportModel`) or from `DiagnosticSummary.readinessLabel` when selector is wired in.

**Change type:** Logic-only (inline function bodies simplified; no UI or prop changes).

**Risk:** Very low. Output strings are unchanged; only the derivation path simplifies.

---

### 4.7 `src/components/ResultsDashboard.tsx`

**What it does now:**
- Declares `READINESS_GOAL_PCT` and `READINESS_TARGET` locally (lines 24–26).
- `computeTimeStats()` (lines 67–104): full timing derivation as a local helper.
- `confidenceStats` (lines 195–218): inline confidence delta computation.
- Rebuilds `conceptReport` by reconstructing `UserResponse[]` from `skillScores.attemptHistory` (lines 221–252) — lossy reconstruction since `attemptHistory` is bounded to last 20 entries.
- `barColor` inline threshold logic (line 372): hardcoded 70/50 cutoffs.

**What should move to selector layer:**
- `READINESS_GOAL_PCT`, `READINESS_TARGET` → import from `skillProficiency.ts`.
- `computeTimeStats()` → replaced by `DiagnosticSummary.timing`.
- `confidenceStats` → replaced by `DiagnosticSummary.totalConfidenceFlags` and per-skill `confidenceFlags`.
- `conceptReport` reconstruction → replaced by `DiagnosticSummary.conceptReport` (selector holds the canonical `ConceptAnalyticsReport`).
- `barColor` constants → import `COLOR_TIER_GOOD_PCT`, `COLOR_TIER_DEVELOPING_PCT`.

**Change type:** Both (logic removed from component; props or hook input changes when selector is wired).

**Risk:** Medium. The `conceptReport` reconstruction from `attemptHistory` is lossy (bounded at 20 entries). The selector would use the original `responses` array, producing more accurate results. This is a behavior improvement but must be verified against existing renders.

---

### 4.8 `src/components/StudyModesSection.tsx`

**What it does now:**
- Declares `TOTAL_SKILLS = 45` and `READINESS_TARGET` locally (lines 46–47).
- `barColor`/`labelColor` inline thresholds 70/50 (lines 211–212).
- `overallAccuracy` color thresholds 70/50 (lines 575–579).
- `readinessBarPct` derived inline (line 520).
- `demonstratingCount` re-counted from `allRows` (line 517) — same count available in `progress.summary`.

**What should move to selector layer:**
- `TOTAL_SKILLS`, `READINESS_TARGET` → import from `skillProficiency.ts`.
- Color thresholds → import `COLOR_TIER_GOOD_PCT`, `COLOR_TIER_DEVELOPING_PCT`.
- `demonstratingCount` → read from `DiagnosticSummary.demonstratingCount`.
- `readinessBarPct` → derive from `DiagnosticSummary.skillsToReadiness` and `READINESS_TARGET`.

**Change type:** Logic-only (inline constants and derivations replaced by imports and selector reads; no UI change).

**Risk:** Low.

---

### 4.9 `src/components/PraxisPerformanceView.tsx`

**What it does now:**
- `getPerformanceLabel()` (lines 55–75): inline label + color mapping using imported `DEMONSTRATING_THRESHOLD` and `APPROACHING_THRESHOLD` but not using `PROFICIENCY_META`.
- `deficiencyCount` (line 111): hardcoded `< 0.6` threshold.

**What should move to selector layer:**
- `getPerformanceLabel()` → replace with `PROFICIENCY_META[getSkillProficiency(score, attempts)]` lookups.
- `deficiencyCount` → replace hardcoded `0.6` with `APPROACHING_THRESHOLD`.

**Change type:** Logic-only (inline function simplified; threshold constant used correctly).

**Risk:** Very low. Label strings change only if `PROFICIENCY_META` labels differ from current inline strings — they do slightly (`'Strong'` vs `'Demonstrating'`, `'Developing'` vs `'Approaching'`). **This is a visible UI change** — confirm label strings with product before applying.

---

### 4.10 `src/components/ScoreReport.tsx`

**What it does now:**
- `getScoreColor()` (lines 22–26): inline threshold-to-color mapping duplicates `PROFICIENCY_META` color tokens.
- Domain score reconstruction (lines 99–122): rebuilds `domainScores` from raw `responses` on every render.
- Timing stats (lines 136–160): rebuilt from raw `responses` on every render.
- No `useMemo` anywhere in the computed block.

**What should move to selector layer:**
- `getScoreColor()` → replace with `PROFICIENCY_META[getSkillProficiency(score, attempts)]`.
- Domain scores → accept from `DiagnosticSummary.domains` as prop (or compute once in a `useMemo`).
- Timing stats → accept from `DiagnosticSummary.timing` as prop (or compute once in a `useMemo`).

**Change type:** Both (logic de-duplicated; props extended to accept pre-computed data, or memoization added as an interim step).

**Risk:** Medium. `ScoreReport` is a results-flow component that may receive `responses` directly as its primary source. An interim fix (wrapping existing calculations in `useMemo`) has zero behavior risk. Full migration to selector props requires verifying all call sites.

---

## 5. Phased Implementation Plan

### Phase 0 — Foundation (No Behavior Change)
**Goal:** Create the shared constant layer and type contract. No component changes.

**Files to modify:**
- `src/utils/skillProficiency.ts` — add `TOTAL_SKILLS`, `READINESS_TARGET`, `COLOR_TIER_GOOD_PCT`, `COLOR_TIER_DEVELOPING_PCT` exports

**Files to create:**
- `src/utils/diagnosticSummary.ts` — define `DiagnosticSummary`, `SkillDiagnostic`, `DomainDiagnostic`, `TimingDiagnostic` types only (no builder function yet)

**Risks:** None. Additive only.
**Tests required:** Type-level only (compile check).
**Visible user impact:** None.

---

### Phase 1 — Return Dropped Signals from Source Utilities
**Goal:** Ensure `assessmentReport.ts` and `learning-state.ts` stop discarding data they already compute.

**Files to modify:**

1. `src/utils/assessmentReport.ts`
   - Extend `SkillReportSummary` (intermediate type) to expose `missedConcepts: string[]`
   - Extend `AssessmentReportModel` to include `missedConcepts: string[]` (deduplicated union)
   - No scoring change

2. `src/brain/learning-state.ts`
   - Change `checkPrerequisitesMet()` return from `boolean` to `{ met: boolean; blockedBy: string | null }`
   - Propagate `blockedBy` into `LearningStateResult` as `blockedByPrerequisite: string | null`

**Risks:**
- `checkPrerequisitesMet` has one internal call site. Return type change is contained.
- Any external caller of `calculateLearningState` that reads `LearningStateResult` will see a new optional field — additive, non-breaking.

**Tests required:**
- Unit test: `checkPrerequisitesMet` returns correct `blockedBy` skillId when prerequisite not mastered
- Unit test: `buildAssessmentReportModel` includes `missedConcepts` in output
- Regression: existing consumers of `AssessmentReportModel` still compile and render correctly

**Visible user impact:** None.

---

### Phase 2 — Build the Selector Function
**Goal:** Implement `buildDiagnosticSummary()` that assembles all signals into `DiagnosticSummary`.

**Files to modify:**
- `src/utils/diagnosticSummary.ts` — add `buildDiagnosticSummary(inputs)` builder function

**Inputs to `buildDiagnosticSummary`:**
```typescript
{
  profile: UserProfile;
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  skillPerformance: Record<string, SkillPerformance>;
}
```

**Builder calls (in order, no new logic):**
1. `buildAssessmentReportModel(responses, questions)` → `assessmentReport`
2. `buildProgressSummary(profile)` → `progress`
3. `buildConceptAnalytics(responses, questions)` → `conceptReport`
4. Per skill: read `LearningStateResult` from existing `skillPerformance` (already computed upstream)
5. Assemble into `DiagnosticSummary`

**Timing:** Compute once in the builder from `responses`, replacing the three independent derivations.

**Risks:**
- The `conceptReport` reconstruction in `ResultsDashboard.tsx` uses a bounded `attemptHistory` (20 entries). The selector will use full `responses`. Results may differ for users with > 20 attempts per skill — this is an accuracy improvement, not a regression, but should be verified visually.

**Tests required:**
- Unit test: `buildDiagnosticSummary` returns correct `demonstratingCount`, `skillsToReadiness`, `isReady`
- Unit test: `allMissedConcepts` is populated and deduplicated
- Unit test: `totalConfidenceFlags` is non-zero when high+wrong responses exist
- Unit test: `crossSkillGapConcepts` propagated from `conceptReport`
- Unit test: `timing.avgTimeSeconds` matches manual calculation

**Visible user impact:** None (selector not yet wired to UI).

---

### Phase 3 — Wire Constant Deduplication into Components
**Goal:** Replace locally-declared duplicate constants in components with imports. Purely mechanical.

**Files to modify:**
- `src/components/ResultsDashboard.tsx` — remove lines 24–26; import `READINESS_TARGET` from `skillProficiency.ts`
- `src/components/StudyModesSection.tsx` — remove lines 46–47; import `TOTAL_SKILLS`, `READINESS_TARGET`; import color tier constants
- `src/components/PraxisPerformanceView.tsx` — replace hardcoded `0.6` on line 111 with `APPROACHING_THRESHOLD`
- `src/components/ScreenerResults.tsx` — replace `domainStatusLabel()` body; replace `overallMeaning()` body

**Risks:** Very low. All replacements are semantically identical (same numeric values).

**Exception:** `PraxisPerformanceView.getPerformanceLabel()` uses label strings `'Strong'`, `'Developing'`, `'Needs Improvement'` that differ from `PROFICIENCY_META` labels. **Do not change label strings in this phase.** Only fix the `0.6` threshold. Schedule label string alignment separately after product review.

**Tests required:**
- Snapshot/regression: no visible output change in `ScreenerResults`, `StudyModesSection`, `ResultsDashboard`
- Compile check: all imports resolve

**Visible user impact:** None.

---

### Phase 4 — Migrate Component Computations to Selector
**Goal:** Replace inline derived stats in components with reads from `DiagnosticSummary`. Wire selector at call sites.

**Files to modify:**

1. `src/components/ResultsDashboard.tsx`
   - Remove `computeTimeStats()` (lines 67–104); read `timing` from `DiagnosticSummary`
   - Remove `confidenceStats` inline block (lines 195–218); read `totalConfidenceFlags` + per-skill flags
   - Remove `conceptReport` reconstruction (lines 221–252); read from `DiagnosticSummary.conceptReport`
   - Remove `barColor` inline thresholds; derive from `COLOR_TIER_*` constants

2. `src/components/StudyModesSection.tsx`
   - Remove `demonstratingCount` re-count; read from `DiagnosticSummary.demonstratingCount`
   - Remove `readinessBarPct` inline derivation; compute from `DiagnosticSummary.skillsToReadiness`
   - Replace `barColor`/`labelColor` inline thresholds with constant-based derivation

3. `src/components/ScoreReport.tsx`
   - Wrap domain score computation (lines 99–122) in `useMemo` as immediate fix
   - Wrap timing computation (lines 136–160) in `useMemo` as immediate fix
   - Replace `getScoreColor()` body with `PROFICIENCY_META` lookup
   - Long-term: accept `DiagnosticSummary.domains` and `DiagnosticSummary.timing` as props

**Risks:**
- `ResultsDashboard.tsx` concept report change (bounded vs unbounded `responses`): test with a user who has > 20 attempts per skill
- `ScoreReport.tsx` prop extension requires tracing all call sites

**Tests required:**
- Rendering tests: `ResultsDashboard`, `StudyModesSection`, `ScoreReport` produce same visual output before/after for a fixed input fixture
- Unit: `ScoreReport` does not recompute domain scores on prop-unchanged re-render (profiler check)
- Unit: `totalConfidenceFlags` visible in `ResultsDashboard` confidence section when flags > 0

**Visible user impact:** None in baseline case. Potential: `ResultsDashboard` confidence section could show actual misconception flag count if UI is updated (opt-in, not required in this phase).

---

## Summary: Files to Create vs Modify

| Action | File | Phase |
|---|---|---|
| **Create** | `src/utils/diagnosticSummary.ts` | 0 (types) + 2 (builder) |
| **Modify** | `src/utils/skillProficiency.ts` | 0 |
| **Modify** | `src/utils/assessmentReport.ts` | 1 |
| **Modify** | `src/brain/learning-state.ts` | 1 |
| **Modify** | `src/components/ScreenerResults.tsx` | 3 |
| **Modify** | `src/components/PraxisPerformanceView.tsx` | 3 (partial) |
| **Modify** | `src/components/ResultsDashboard.tsx` | 3 + 4 |
| **Modify** | `src/components/StudyModesSection.tsx` | 3 + 4 |
| **Modify** | `src/components/ScoreReport.tsx` | 4 |
| **No change** | `src/utils/conceptAnalytics.ts` | — |
| **No change** | `src/utils/progressSummaries.ts` | — |

---

## Risk Register

| Risk | Severity | Phase | Mitigation |
|---|---|---|---|
| `conceptReport` accuracy difference (bounded vs full `responses`) | Medium | 2, 4 | Test with synthetic user fixture having > 20 attempts per skill; document as accuracy improvement |
| `PraxisPerformanceView` label string mismatch (`'Strong'` vs `'Demonstrating'`) | Low-Medium | 3 | Defer label change to separate product review; only fix threshold constant in Phase 3 |
| `ScoreReport` prop interface change breaks call sites | Medium | 4 | Map all call sites first; treat memoization fix as independently shippable |
| `checkPrerequisitesMet` return type change | Low | 1 | Single internal call site; return type change is additive |
| `missedConcepts` appearing in export causes downstream TypeScript errors | Low | 1 | Extend type, not replace; all existing field reads are unaffected |
