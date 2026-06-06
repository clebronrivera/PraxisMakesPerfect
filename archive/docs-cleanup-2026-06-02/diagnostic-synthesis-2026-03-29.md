# PraxisMakesPerfect — Diagnostic Audit Synthesis
**Date:** 2026-03-29
**Sources:** 7 audit files (adaptive-diagnostic-audit.md, audit-confidence-timing.md, misconception-audit.md, vocab-tag-audit-2026-03-29.md, Distractor_Diagnostic_Coverage_Audit_2026-03-29.md, diagnostic_reporting_plan.docx, proficiency-audit.docx)
**Constraint:** No implementation. Plan only.

---

## 1. Consolidated Findings

### Critical Correction from Distractor Audit

The handoff doc stated "~250 of 1,150 items (~21.7%) have populated distractor-level metadata." The Distractor Coverage Audit reveals this is structurally true but **content-invalid**. Every one of 748 populated `distractor_misconception` fields is auto-generated boilerplate derived mechanically from the first 20 characters of the answer option text:

> `"Student mistakenly selects an option related to '{first 20 chars}...' instead of the correct concept."`

Every one of 748 `distractor_skill_deficit` fields is a 1–3 word fragment extracted from the option text — not a skill ID. Every item has `dominant_error_pattern = "concept_substitution"` with zero variance across 250 items.

**The correct figure is: 0 of 1,150 items have diagnostically valid distractor misconception metadata.** The prior 21.7% estimate was measuring structural presence, not content validity. This makes misconception normalization a data-authoring problem, not just an ID-schema problem, and confirms it cannot be the next engineering branch.

---

### Consolidated Findings Table

| Area | Confirmed Status | Key Evidence Files | Main Evidence | Main Risk | Next Action |
|---|---|---|---|---|---|
| **missedConcepts stripping** | ✅ Confirmed, exact location known | `diagnostic_reporting_plan.docx` | `assessmentReport.ts` lines 208, 213, 258: explicit destructuring strips `missedConcepts` from all three `.map()` calls; reaches zero consumers | Signal silently lost on every diagnostic run | Phase 1: stop stripping it (3-line change) |
| **Concept gap analytics silo** | ✅ Confirmed | `diagnostic_reporting_plan.docx`, `vocab-tag-audit-2026-03-29.md` | `buildConceptAnalytics()` called only by `ResultsDashboard.tsx`; `ScreenerResults`, `ScoreReport`, `StudyModesSection`, `PraxisPerformanceView` never call it | Analytics rich surface cut off from 4 other surfaces | Add to `diagnosticSelectors.ts` builder; optionally surface in `ScoreReport` |
| **Confidence flags — stored, underused** | ✅ Confirmed | `diagnostic_reporting_plan.docx`, `audit-confidence-timing.md` | `confidenceFlags` on `SkillPerformance` computed in `learning-state.ts` lines 48–52; only consumed in one `useMemo` block in `ResultsDashboard` (lines 195–218); not shown in `ScreenerResults`, `ScoreReport`, `PraxisPerformanceView`, `StudyModesSection` | High-value misconception signal invisible to most surfaces | Include in `DiagnosticSummary.confidence`; surface later in Phase B |
| **Timing — dual implementations, no shared source** | ✅ Confirmed | `diagnostic_reporting_plan.docx`, `audit-confidence-timing.md` | Two separate timing computations: `ResultsDashboard.tsx` lines 67–104 (sanity filter) vs. `ScoreReport.tsx` lines 136–160 (no sanity filter); `conceptAnalytics.ts` computes per-concept timing that is never rendered; `SkillAttempt.timeSpent` is "dead cargo" | Timing inconsistency across surfaces; no rapid-guess or fluency logic yet | Extract to shared `computeTimeStats()` in `diagnosticSelectors.ts`; actual timing rules are Phase B |
| **Selector bypass / hardcoded thresholds** | ✅ Confirmed, 16 files, 3 with active bugs | `proficiency-audit.docx` | 16 files bypass `getSkillProficiency()` / `PROFICIENCY_META`; 3 critical: `tutorContextBuilder.ts` (wrong selector), `scoreReportGenerator.ts` (wrong color logic), `StudentDetailDrawer.tsx` (rogue `< 50` boundary not in canonical system) | Silent visual drift; two bugs visible to users today | Phase 2–3 of proficiency migration; highest priority 3 files first |
| **Foundational gaps — absent from 4/5 surfaces** | ✅ Confirmed | `diagnostic_reporting_plan.docx` | `FoundationalGapSummary[]` fully computed in `assessmentReport.ts` lines 172–198; rendered only in `ScreenerResults.tsx`; absent from `ScoreReport`, `ResultsDashboard`, `StudyModesSection`, `PraxisPerformanceView` | Core prerequisite signal not shown after diagnostic | Include in `DiagnosticSummary`; render in `ScoreReport` (Phase 4); `ResultsDashboard` blocked by data availability question |
| **Vocabulary/concept tag gaps** | ✅ Confirmed, quantified | `vocab-tag-audit-2026-03-29.md` | 141/1,150 questions untagged (12.3%); 37 of 250 diagnostic items untagged (14.8%); ETH-02 is 68% untagged; every untagged diagnostic item silently suppresses `missedConcepts` in `assessmentReport.ts` line 165 | Every untagged diagnostic item is a silent gap in concept analytics and `missedConcepts` | Tag 37 diagnostic items before or alongside Phase 1; ETH-02 first |
| **Distractor misconception metadata** | ✅ Confirmed broken — worse than reported | `Distractor_Diagnostic_Coverage_Audit_2026-03-29.md` | 748/748 `distractor_misconception` fields are auto-generated boilerplate; 748/748 `distractor_skill_deficit` fields are word fragments; `dominant_error_pattern` = "concept_substitution" 100% of items; `error_cluster_tag` has only 2 values | Entire misconception-from-distractor path is inert; cannot be used for diagnostic branching | Phase C (content authoring), not engineering; requires human authoring not code change |
| **Misconception taxonomy — 3 disconnected layers** | ✅ Confirmed | `misconception-audit.md` | Skill-level `commonMisconceptions` (no IDs), question-level distractor fields (no IDs, boilerplate), `distractor-patterns.ts` (28 stable IDs) — no cross-reference exists between any layer | Misconception data cannot be aggregated or used for hypothesis generation | Phase C work only; prerequisite: distractor content rewrite, then ID schema |
| **Adaptive diagnostic branching — binary, no signal use** | ✅ Confirmed | `adaptive-diagnostic-audit.md` | Follow-up trigger (line 322 `AdaptiveDiagnostic.tsx`) checks only `isCorrect`; confidence, timing, `keyConcepts`, `isFoundational`, `dok` all ignored in branching; follow-ups appended to END of queue not inserted next | Entire diagnostic is correct/wrong binary; confidence, concept, and timing signals collected but fed nowhere | Phase D; must wait for output contract + confidence/timing rules |
| **`adaptivePractice` feature flag is `false`** | ✅ Confirmed | `adaptive-diagnostic-audit.md` | `useAdaptiveLearning.ts` lines 111–168 (all skill-priority, confidence-flag, foundational-preference logic) is unreachable in production | Sophisticated practice logic exists but is entirely gated off | Not blocking; leave as-is for this branch |
| **`isFoundational` unused in diagnostic** | ✅ Confirmed | `adaptive-diagnostic-audit.md` | `question-analyzer.ts` line 254 populates it; `useAdaptiveLearning.ts` uses it in practice mode; `assessment-builder.ts` never consults it | Initial question per skill is random, not anchored to foundational item | Small improvement (Phase A or later); safe to defer |
| **Confidence integration — end-to-end, but branching gap** | ✅ Confirmed | `audit-confidence-timing.md` | Confidence captured, stored, scored (`learning-state.ts`), used in `weightedAccuracy` and `confidenceFlags`; NOT used in diagnostic follow-up branching; medium default swamps distribution | Branching is the gap; scoring pipeline is solid | Phase B (after output contract) |
| **Timing — captured, passive only** | ✅ Confirmed | `audit-confidence-timing.md` | `time_on_item_seconds` written on every response; `SkillAttempt.timeSpent` carries it but no function reads it for scoring or branching | Dead cargo; rapid-guess and fluency logic don't exist | Phase B (shadow mode first per audit recommendation) |
| **`top_misconception_themes` field** | ✅ Confirmed orphaned | `misconception-audit.md` | 22% coverage, all values follow template "Confusion regarding core [DOMAIN] principles"; no code consumer found | Likely safe to deprecate; no action needed now | Document and ignore |
| **`practice_responses` orphaned columns** | ✅ Confirmed | `audit-confidence-timing.md` | `practice_responses.confidence` and `practice_responses.time_on_item_seconds` written but never read | Dead DB weight | Cleanup after branch; not blocking |

---

### Contradictions Between Audits

One significant contradiction resolved:

The project handoff stated distractor misconception coverage was "~21.7%" (250/1,150 items populated). The Distractor Coverage Audit's content-quality analysis shows this is 0% — every populated field is a template. The handoff was measuring field presence, not content validity. This changes the Phase C roadmap: before IDs can be assigned, the content itself needs to be authored. That's a content problem, not an engineering sprint.

No other substantive contradictions exist. The audits agree on all major findings.

---

### Strongly Evidenced vs. Speculative

**Strongly evidenced (exact file + line citations):**
- `missedConcepts` stripping: `assessmentReport.ts` lines 208, 213, 258
- Timing dual implementation: `ResultsDashboard.tsx` lines 67–104 vs. `ScoreReport.tsx` lines 136–160
- Distractor boilerplate: word count distribution 13–18 words, identical template across 748 slots
- Threshold bypass: 16 files documented with exact line numbers in `proficiency-audit.docx`
- `confidenceFlags` silo: `SkillPerformance` fields computed but not rendered in 4 of 5 surfaces

**Speculative / needs validation:**
- Rapid-guess threshold of 4 seconds (timing audit flags this explicitly)
- Whether `distractor_tier` and `distractor_error_type` are content-valid (AI-assigned, not human-reviewed)
- Whether `top_misconception_themes` is safe to deprecate (no consumer found but purpose unclear)
- Whether `adaptivePractice` flag is intentionally off or accidentally gated

---

## 2. Recommended Next Branch

**Branch name:** `feature/diagnostic-summary-and-selector-foundation`

**This remains the correct next branch.** All seven audits converge on it. The `diagnostic_reporting_plan.docx` already contains a full phase-by-phase implementation plan for it. The `proficiency-audit.docx` adds the selector-bypass migration scope. Nothing in the other audits contradicts this direction.

### Why this branch before confidence/timing changes

Confidence and timing rules proposed in `audit-confidence-timing.md` (Rules 1–5) all require somewhere to land. Rule 1 (high-confidence wrong recency weighting) modifies `calculateSkillPriority()` in practice mode — that's already gated by the `adaptivePractice` flag, so its impact is zero until that flag is turned on. Rules 2–5 need `DiagnosticSummary.confidence` and `DiagnosticSummary.timing` to exist as structured output fields before they can be surfaced or tested. If you add timing rules before unifying the output contract, you get a third timing implementation instead of a fix.

### Why this branch before misconception normalization

The distractor audit confirms that `distractor_misconception` content is 100% auto-generated boilerplate. There is nothing to normalize. Phase C (misconception taxonomy) requires human content authoring first, then ID schema second. No engineering work can unblock it in its current state. Doing the ID schema work now would build infrastructure for data that doesn't exist yet.

### Why this branch before full adaptive diagnostic redesign

The adaptive diagnostic cannot be meaningfully redesigned until the output contract surfaces what signals are already computed. Right now, the system computes `missedConcepts`, `confidenceFlags`, `conceptGaps`, `foundationalGaps`, and timing on every run — and then buries or strips most of them. Redesigning the branching logic without first knowing what the output carries would add branching complexity that produces richer internal state that still gets stripped. Fix the output contract first; the branching redesign then has something real to optimize toward.

---

## 3. Exact Implementation Scope

### Files to Modify

| File | Change | Affects | Risk |
|---|---|---|---|
| `src/utils/assessmentReport.ts` | Stop stripping `missedConcepts` at lines 208, 213, 258; add optional `missedConcepts?: string[]` to `ReportSkillSummary` | Logic only | Low — field is additive |
| `src/utils/skillProficiency.ts` | Export `TOTAL_SKILLS`, `READINESS_GOAL_PCT`, `READINESS_TARGET` as named constants; add `getProficiencyColor()` helper; export `getDomainReadinessTone()` | Selector layer | Very low — additive exports only |
| `src/components/ResultsDashboard.tsx` | Remove local `computeTimeStats` and `confidenceStats` useMemo; import from `diagnosticSelectors.ts`; remove local constant declarations | Logic → selector layer | Low — pure refactoring |
| `src/components/StudyModesSection.tsx` | Import `TOTAL_SKILLS`, `READINESS_TARGET` from shared module; fix threshold values (70→80, 50→60) | UI — threshold values change | Medium — users near 70–79% overall accuracy will see color/label change |
| `src/components/PraxisPerformanceView.tsx` | Delete local `getPerformanceLabel()`; replace with `getSkillProficiency()` + `PROFICIENCY_META` lookup; replace literals at lines 111, 407 | UI — label text and colors change | Medium — label names change ('Strong'→'Demonstrating', etc.) |
| `src/components/ScoreReport.tsx` | Remove inline domain score computation (lines 99–138); consume from `diagnosticSummary` prop; remove second timing implementation; accept optional `diagnosticSummary?: DiagnosticSummary` | Rendering + props | Medium — on critical post-diagnostic path; props must be backward-compatible |
| `src/components/ScreenerResults.tsx` | Replace `overallMeaning()` with `report.readiness.description`; replace `domainStatusLabel()` with `getSkillProficiency()` + `PROFICIENCY_META` | UI — label text | Low — screener path, label equivalence maintained |
| `src/utils/tutorContextBuilder.ts` | Replace local `getProficiency()` with `getSkillProficiency()`; replace magic `32` with `READINESS_TARGET` | Logic | Medium — tutor path; active bug fix |
| `src/utils/scoreReportGenerator.ts` | Replace `getStatusColor()` ternary with `getSkillProficiency()` + color mapping | Logic — color output | Medium — active bug fix |
| `src/components/StudentDetailDrawer.tsx` | Replace all three threshold ternaries; eliminate rogue `< 50` boundary | UI — admin surface | Medium — admin-facing, active bug |

### Files to Create

| File | Purpose |
|---|---|
| `src/utils/diagnosticSelectors.ts` | New module: `computeTimeStats()`, `computeConfidenceStats()`, `TOTAL_SKILLS`, `READINESS_TARGET`, and (in Phase 4) `buildDiagnosticSummary()` |
| `src/types/diagnosticSummary.ts` | New type file: `DiagnosticSummary`, `MissedConceptSummary` interfaces |

### Files to Leave Untouched in This Branch

| File | Reason |
|---|---|
| `src/components/AdaptiveDiagnostic.tsx` | Diagnostic branching redesign is Phase D |
| `src/utils/assessment-builder.ts` | Build-time logic unchanged; `isFoundational` preference is a Phase A micro-improvement, can be deferred |
| `src/hooks/useAdaptiveLearning.ts` | Practice-mode selector; `adaptivePractice` flag is false; confidence-priority rules are Phase B |
| `src/brain/distractor-patterns.ts` | Misconception taxonomy is Phase C |
| `src/brain/learning-state.ts` | Brain-layer internals; no change needed except optional documentation comment |
| `src/data/questions.json` | Content authoring (distractor rewrite) is Phase C |
| `src/data/question-vocabulary-tags.json` | Tag gap fills are content work, not code; parallel track, not blocking |
| `src/utils/conceptAnalytics.ts` | Only threshold literal cleanup (`0.60/0.80` → constants); deferred to Phase 2 of proficiency migration |
| `src/hooks/useLearningPathSupabase.ts` | Medium-risk hook migration; Phase 4 of proficiency plan |
| All SRS-related code | Shadow mode; explicitly out of scope |

### Impact Classification per Change

| Change | Rendering | Scoring | Persistence | API contracts | Selector layer |
|---|---|---|---|---|---|
| Unstrip `missedConcepts` | No | No | No | No | No (adds field) |
| Create `diagnosticSelectors.ts` | No | No | No | No | Yes (new module) |
| Create `diagnosticSummary.ts` | No | No | No | No | Yes (new type) |
| Fix label drift in `PraxisPerformanceView` | Yes | No | No | No | Yes (consumes selector) |
| Fix threshold drift in `StudyModesSection` | Yes (color bands) | No | No | No | Yes (consumes constants) |
| `buildDiagnosticSummary()` in Phase 4 | Yes (ScoreReport) | No | No | No | Yes (builder) |
| Fix `tutorContextBuilder.ts` / `scoreReportGenerator.ts` / `StudentDetailDrawer.tsx` | Yes (admin + tutor) | No | No | No | Yes (consumes selector) |

### Shadow-Mode vs. User-Visible

**Shadow-mode only (compute but do not render):**
- Rapid-guess flag (Rule 3 from timing audit) — explicitly flagged in audit as shadow-mode first
- Fluency signal (Rule 4) — requires per-question baseline data not yet available
- Uncertain-skill flag (Rule 5) — confidence variance; UX sensitivity
- `timeSpent` in `SkillAttempt` — already dormant; add a code comment; do not activate

**User-visible in this branch:**
- `missedConcepts` flowing through to `ReportSkillSummary` (though not yet rendered in new surfaces — Phase 5 of reporting plan is deferred)
- Label corrections in `PraxisPerformanceView` ('Demonstrating', 'Approaching', 'Emerging')
- Threshold corrections in `StudyModesSection` (70→80 readiness bar)
- `DiagnosticSummary` available as a type and builder — not yet adding new rendered sections (that's Phase 5)

**Stays dark this branch:**
- Rendering `missedConcepts` in new UI locations — blocked until `ResultsDashboard` data availability question is resolved
- `foundationalGaps` in `ResultsDashboard` — same blocker
- Any confidence-rule changes (fragility flag, recency weighting) — Phase B

### Backward-Compatibility Risks

1. `ReportSkillSummary.missedConcepts` is optional (`string[] | undefined`). All consumers that destructure it away will continue to work unchanged. No type-breaking change.
2. `ScoreReport` prop type expansion (`diagnosticSummary?: DiagnosticSummary`) must remain optional with a fallback computation path — callers that don't pass it must not break.
3. `StudyModesSection` threshold change from 70→80 will move some users from "green" to "amber" on the readiness bar. This is intentional alignment with the canonical system, not a regression — but it is a visible user change and should be noted in the PR description.
4. `PraxisPerformanceView` label changes are visible but low-blast-radius (secondary view, not the primary post-diagnostic path).

---

## 4. Proposed DiagnosticSummary Contract

This is taken verbatim from `diagnostic_reporting_plan.docx` Section 2, with one clarification added.

```typescript
// src/types/diagnosticSummary.ts

export interface MissedConceptSummary {
  concept: string;       // vocabulary term from question.keyConcepts
  skillId: string;
  skillName: string;
  count: number;         // times this concept appeared in incorrect answers
}

export interface DiagnosticSummary {
  // ── Core scoring ──────────────────────────────────────────────────────────
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  overallScore: number;              // 0–1

  // ── Readiness interpretation ──────────────────────────────────────────────
  readiness: {
    label: string;                   // from PROFICIENCY_META
    tone: ReadinessTone;             // 'ready' | 'building' | 'priority'
    description: string;
    nextAction: string;
  };

  // ── Domain breakdown ──────────────────────────────────────────────────────
  domainSummaries: DomainReportSummary[];
  highestNeedDomains: DomainReportSummary[];
  strongestDomains: DomainReportSummary[];

  // ── Skill-level signals ───────────────────────────────────────────────────
  strengths: ReportSkillSummary[];
  weaknesses: ReportSkillSummary[];         // extracted from domain weaknesses
  missedConcepts: MissedConceptSummary[];   // currently stripped — Phase 1 unstrips this

  // ── Foundational gaps (prerequisite-linked) ───────────────────────────────
  foundationalGaps: FoundationalGapSummary[];

  // ── Concept-level signals ─────────────────────────────────────────────────
  // null on screener path (no analyzedQuestions available)
  conceptGaps: ConceptPerformance[] | null;
  crossSkillConceptGaps: CrossSkillGap[] | null;
  conceptSummary: ConceptAnalyticsReport['summary'] | null;

  // ── Confidence signals ────────────────────────────────────────────────────
  confidence: {
    totalHighWrong: number;          // sum of confidenceFlags across all skills
    rawAccuracy: number | null;
    weightedAccuracy: number | null;
    delta: number | null;            // weighted - raw; negative = misconceptions dragging score
  };

  // ── Timing signals ────────────────────────────────────────────────────────
  timing: {
    avgSecondsOverall: number | null;
    avgSecondsByDomain: Record<number, { avg: number; count: number }>;
    topSlowQuestions: Array<{
      questionId: string;
      avgSeconds: number;
      count: number;
    }>;
    avgSecondsPerResponse: number | null; // from raw UserResponse[] when available
  };

  // ── Diagnostic metadata ───────────────────────────────────────────────────
  // NOTE: Do NOT include here:
  // - SkillProgressSummary / DomainProgressSummary (live practice-tracking, separate concern)
  // - LearningState ('emerging'|'developing'|'proficient'|'mastery') (brain-layer internal)
  // - SRS fields (srsBox, nextReviewDate, lastReviewDate) (shadow mode, excluded)
}
```

### Builder function

```typescript
// src/utils/diagnosticSelectors.ts

export function buildDiagnosticSummary(params: {
  responses: UserResponse[];
  questions: AnalyzedQuestion[];
  domains: Domain[];
  skills: Skill[];
  skillScores?: Record<string, SkillPerformance>;  // for confidence + timing signals
}): DiagnosticSummary
```

**Where it lives:** `src/utils/diagnosticSelectors.ts`
**What it delegates to:** `buildAssessmentReportModel()` (report signals), optionally `buildConceptAnalytics()` when questions with `keyConcepts` present, `computeTimeStats()` and `computeConfidenceStats()` from the same file.
**Pure function:** no side effects, no DB calls.

### Which components consume it first

Priority order based on blast radius and value delivered:

1. `ScoreReport.tsx` — highest value; eliminates the duplicate timing implementation and the inline domain score computation
2. `ScreenerResults.tsx` — lower value but removes `overallMeaning()` and `domainStatusLabel()` which are the clearest selector bypasses
3. `ResultsDashboard.tsx` — already the richest analytics surface; Phase 5 of reporting plan (blocked on data availability)

---

## 5. Risks and Guardrails

### Things that would create visual drift if changed without UI alignment

- **`StudyModesSection.tsx` threshold change (70→80):** Users with 70–79% overall accuracy will shift from green to amber. This is intentional correctness, not a regression — but it must be communicated in the PR description and the change should be noted in HOW_THE_APP_WORKS.md.
- **`PraxisPerformanceView.tsx` label change:** 'Strong' → 'Demonstrating', 'Developing' → 'Approaching', 'Needs Improvement' → 'Emerging'. Consistent with the canonical system. Any documentation, help text, or onboarding copy that references the old labels must be updated simultaneously.
- **Any new UI sections added for `missedConcepts` or `foundationalGaps`:** Must be conditional renders — do not add sections that render when data is empty. Every new rendered section needs a zero-state design.

### Things that sound precise but would overclaim what the system actually knows

- **Rendering `confidenceFlags` as "You have a misconception in X":** `confidenceFlags` is a count of high-confidence wrong answers. It is not a confirmed misconception. The output should say "possible misconception" or "review recommended" — not "misconception confirmed." This is especially important given the audit finding that many confidence ratings are the default 'medium' that users never touched.
- **Surfacing per-concept timing averages** (`avgTimeSeconds` from `conceptAnalytics.ts`): The timer top-codes at 120 seconds. Per-concept time averages based on 1–3 responses per concept are statistically unreliable. Do not surface these in this branch.
- **Surfacing `distractor_error_type` (Conceptual/Procedural/Lexical):** These were AI-assigned, not human-reviewed. 90% are "Conceptual." They cannot be used to make per-item claims about error type without validation.
- **`missedConcepts` on questions with vague tags:** The vocab audit found 186 questions tagged with `behavior` (16.2% of all questions) — a tag so generic it tells the student nothing. Surfacing "you missed concept: behavior" is not actionable. When `missedConcepts` is rendered (Phase 5), filter out tags below a specificity threshold or above a frequency ceiling.

### Things that must wait until after misconception taxonomy normalization (Phase C)

- Any UI that claims to show "the specific misconception you have"
- Adaptive branching that selects follow-up questions based on misconception family
- Clustering or grouping wrong answers by misconception type
- Any use of `distractor_misconception_X` fields from `questions.json` — all boilerplate until re-authored

### Things that must wait until after confidence/timing rules are added (Phase B)

- Rapid-guess flag — do not surface timing-based signals until the 4-second threshold is validated in shadow mode
- High-confidence wrong recency weighting (Rule 1) — can be deployed to `calculateSkillPriority()` without this branch, but only affects practice mode (gated flag), so it's not blocking
- Fragility flag (Rule 2) — feeds study plan text; safe to add in Phase B after output contract exists
- Uncertain-skill flag (Rule 5) — validate in shadow mode before any student-visible label

### Things that should stay shadow mode in this branch

- `SkillAttempt.timeSpent` — add a code comment marking it as "stored but not yet used in any calculation — intentionally dormant, not a bug"
- SRS fields (`srsBox`, `nextReviewDate`, `lastReviewDate`) — already documented as shadow mode; do not touch
- Any new `DiagnosticSummary` fields beyond what `buildAssessmentReportModel()` and `buildConceptAnalytics()` already compute — do not invent new scoring logic in this branch

---

## 6. Step-by-Step Branch Execution Order

These steps follow the phased plan from `diagnostic_reporting_plan.docx` plus the critical-path items from `proficiency-audit.docx`.

### Step 1 — Establish the selector foundation (no UI change, no risk)

1. Add named exports to `src/utils/skillProficiency.ts`:
   - `TOTAL_SKILLS = 45`
   - `READINESS_GOAL_PCT` and `READINESS_TARGET` (currently hardcoded as `32` in `StudyModesSection`)
   - `getProficiencyColor(score01, attempts)` returning `{ text, bar, badge }` from `PROFICIENCY_META`
2. Export `getDomainReadinessTone()` from `src/utils/assessmentReport.ts` (promote private `getTone()`)
3. Create `src/types/diagnosticSummary.ts` with `DiagnosticSummary` and `MissedConceptSummary` interfaces (no builder yet, just types)
4. Create `src/utils/diagnosticSelectors.ts` skeleton with only `computeTimeStats()` and `computeConfidenceStats()` extracted verbatim from `ResultsDashboard.tsx`, plus the shared constants
5. **Write tests:** unit tests for `computeTimeStats()` and `computeConfidenceStats()` with known inputs

No UI change. Purely additive. Safe to review and merge independently if desired.

### Step 2 — Unstrip missedConcepts (1 file, 3-line change)

1. In `src/utils/assessmentReport.ts`, add `missedConcepts?: string[]` to `ReportSkillSummary`
2. In the three `.map()` calls (lines 208, 213, 258): change from destructuring `missedConcepts` away to including `missedConcepts: Array.from(missedConcepts)` in the output
3. **Write tests:**
   - `buildAssessmentReportModel()` with ≥1 incorrect answer on a question with `keyConcepts` → verify `weaknesses[0].missedConcepts` is non-empty
   - All-correct scenario → verify `missedConcepts` is `[]` (not `undefined`)
   - Deduplication: same concept on two incorrect answers → appears once

No rendering change. No API change. Zero risk.

### Step 3 — Migrate ResultsDashboard and StudyModesSection to shared constants

1. In `src/components/ResultsDashboard.tsx`: delete local `computeTimeStats` function; delete `confidenceStats` useMemo block; import from `diagnosticSelectors.ts`; delete local constant declarations; import constants from `skillProficiency.ts`
2. In `src/components/StudyModesSection.tsx`: import `TOTAL_SKILLS`, `READINESS_TARGET` from shared module; fix threshold values 70→80, 50→60
3. **Write tests:**
   - Regression: `ResultsDashboard` renders identically before and after
   - `StudyModesSection` accuracy 75% now renders amber (confirm intent alignment)
   - `StudyModesSection` accuracy 85% still renders green (unchanged)

The threshold value change in `StudyModesSection` is the only visible user impact in this step.

### Step 4 — Fix the three critical-divergence files (active bugs)

1. `src/utils/tutorContextBuilder.ts`: replace local `getProficiency()` with `getSkillProficiency()`; replace magic `32` with `READINESS_TARGET`
2. `src/utils/scoreReportGenerator.ts`: replace `getStatusColor()` ternary with `getSkillProficiency()` + color mapping from `PROFICIENCY_META`
3. `src/components/StudentDetailDrawer.tsx`: replace all three threshold ternaries; eliminate rogue `< 50` boundary
4. **Visual spot-checks:** verify admin student detail view shows consistent labels with student-facing views

These fix active silent bugs. Priority over the visual surface migrations.

### Step 5 — Migrate visible surface components (PraxisPerformanceView, ScreenerResults)

1. `src/components/PraxisPerformanceView.tsx`: delete `getPerformanceLabel()`; replace call sites with `getSkillProficiency()` + `PROFICIENCY_META`; replace literal `0.6` at line 111 and `0.8` at line 408 with threshold constants
2. `src/components/ScreenerResults.tsx`: replace `overallMeaning()` with `report.readiness.description`; replace `domainStatusLabel()` with `getSkillProficiency()` + `PROFICIENCY_META`
3. **Tests:**
   - `PraxisPerformanceView`: score 0.85 → 'Demonstrating', 0.65 → 'Approaching', 0.45 → 'Emerging'
   - `ScreenerResults`: domain labels unchanged after removing `domainStatusLabel()`
   - `ScreenerResults`: interpretation text equivalent after removing `overallMeaning()`

### Step 6 — Implement buildDiagnosticSummary() and wire into ScoreReport

1. In `src/utils/diagnosticSelectors.ts`: implement `buildDiagnosticSummary()` per the signature in Section 4; delegate to `buildAssessmentReportModel()`, optionally `buildConceptAnalytics()`, `computeTimeStats()`, `computeConfidenceStats()`
2. In `src/components/ScoreReport.tsx`: accept optional `diagnosticSummary?: DiagnosticSummary` prop; remove inline domain score computation (lines 99–138); remove second timing implementation; read from `diagnosticSummary` when available, fall back to inline computation otherwise (backward-compatible)
3. **Tests:**
   - `buildDiagnosticSummary()` with representative response set → all fields populated correctly
   - `foundationalGaps` populated when skill has prerequisites and wrong answers
   - `confidence.totalHighWrong` matches expected count
   - `timing.avgSecondsOverall` within 1% of manual computation
   - `ScoreReport` renders identically before and after with same inputs

### Step 7 — Document and close the branch

1. Add code comment in `src/brain/learning-state.ts` noting that `SkillAttempt.timeSpent` is stored but intentionally dormant
2. Update `docs/HOW_THE_APP_WORKS.md` to document:
   - `DiagnosticSummary` type and `buildDiagnosticSummary()` as the canonical selector
   - The new canonical proficiency tier system and which components now consume it
   - The threshold correction in `StudyModesSection` (note this is a visible change)
3. Merge. No `ResultsDashboard` rendering of `missedConcepts` or `foundationalGaps` in this branch — that is Phase 5 (blocked on data availability decision).

---

## 7. What Should Come Immediately After This Branch

### Immediate next: Phase B — Confidence and Timing Integration

With the output contract in place, the confidence/timing signals have somewhere to go.

**Branch name suggestion:** `feature/confidence-timing-rules`

**Scope:**
- Implement Rule 1 (high-confidence wrong recency weighting) in `calculateSkillPriority()` — replaces blunt `confidenceFlags > 0` with a rolling-10-attempt window
- Implement Rule 2 (fragility flag: low-confidence correct) in `studyPlanPreprocessor.ts` — feeds study plan Claude prompt
- Add rapid-guess flag (Rule 3) in **shadow mode only** — compute it, log it to `SkillAttempt` or a separate analytics field, do not show to student; validate for one cohort cycle before activating
- Add code comment in `diagnosticSelectors.ts` for the fluency signal (Rule 4) as a `TODO: shadow-mode pending baseline data`
- Expose `confidence.totalHighWrong` and `confidence.delta` from `DiagnosticSummary` in at least one rendered surface

**Prerequisite for this branch:** all steps in the current branch must be complete, especially the unified `computeConfidenceStats()` and `DiagnosticSummary.confidence` type.

### After Phase B: Phase C — Misconception taxonomy

This requires content authoring, not just code:

1. Rewrite `distractor_misconception` fields in `questions.json` for Tier D skills (MBH-03, LEG-02, CON-01, ETH-01 first — highest diagnostic slot count)
2. Fix structural issue in `item_008` (Options C+D missing)
3. Once content is authored: implement `MC-[DOMAIN]-[SKILL]-[SEQ]` ID schema and link skill-level misconceptions to questions
4. Connect `distractor-patterns.ts` 28 stable IDs to misconception records via `relatedPatternIds`

**Do not start Phase C engineering until at least 20% of Tier D distractor content is authored.** Building the ID schema for boilerplate content produces infrastructure for data that doesn't exist.

### After Phase C: Phase D — Adaptive diagnostic branching redesign

With a real output contract, live confidence/timing signals, and real misconception content available, the branching redesign has real inputs to work with:

- Prefer `isFoundational` for initial question per skill (`assessment-builder.ts` lines 486–496) — safe micro-improvement that can be done in Phase A or Phase D
- Insert follow-up immediately after current question position (not at queue end)
- Add confidence-aware follow-up trigger: high-confidence wrong → force next follow-up even at count 2
- Add `keyConcepts`-aware follow-up clustering: match follow-up conceptually to missed initial question
- Consider knowledge-type-aware confirmation probes (definition → recall probe; procedure → sequencing probe)

**Do not attempt full IRT/theta estimation as a next step.** The current infrastructure supports deterministic rule-based branching improvements that are higher-value, lower-risk, and faster to ship.

---

*End of synthesis. No files were modified. This document synthesizes 7 audit files into a single implementation plan.*
