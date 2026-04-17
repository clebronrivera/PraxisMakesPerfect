# Psychometric Readiness Audit — PraxisMakesPerfect

## Scope of Review

This audit reviewed: source code in `src/`, `api/`, and `scripts/`; all Supabase migration files in `supabase/migrations/`; the canonical question bank (`src/data/questions.json`); documentation in `docs/` and `audit-output/`; and project configuration files. No claims are made about unreviewed infrastructure, archived branches, external analytics systems, or data not accessible from the codebase.

## Epistemic Key

Every finding is tagged with its evidence basis:

- **[Observed]** — Directly verified in source code or schema
- **[Derived]** — Computed from observed data (e.g., counts from JSON parsing)
- **[Estimated]** — Approximated from samples or partial evidence; exact value unknown
- **[Assumed]** — Reasonable inference not directly confirmed
- **[Gap]** — Important information not yet established; blocks or qualifies other findings
- **[Assessment]** — Evaluative judgment based on observed/derived findings
- **[Recommendation]** — Proposed action, not a finding
- **[Threshold]** — Numeric threshold chosen by convention (a common practical benchmark, not a guarantee of stability)

## Framing: Learning Tool vs. Psychometric Assessment

This audit must serve two audiences with different standards:

**As a study/learning tool:** Rule-based adaptivity, confidence-weighted proficiency, shadow-mode effort signals, and imperfect distractor metadata are all acceptable and instructionally useful. The current system appears directionally functional as a study tool, though several instructional and data-quality components remain uneven.

**As a psychometric assessment (B2B, score defensibility):** The bar is much higher. Stability, calibration, versioning, provenance, validity evidence, and fairness analysis all matter significantly. The current system does not meet this standard.

Each section below notes which standard it evaluates against. Features that are instructionally useful but not measurement-grade are labeled as such.

---

## Executive Summary

1. **Item bank is structurally complete by count, but psychometric quality is still uneven and only partially evidenced.** [Derived] 1,150 items across 45 skills, minimum 20 items per skill by `current_skill_id`. Count coverage does not prove measurement adequacy — content validity, exposure balance, item performance stability, and local dependence are unverified.
2. **Items include a 2-tier cognitive complexity label, not a calibrated empirical difficulty scale.** [Observed] SME-assigned "Recall" / "Application" tags at 100% coverage. This is cognitive demand classification, not psychometric difficulty.
3. **A provisional discrimination proxy is computed from live response data in the admin dashboard** [Observed] — point-biserial approximation, recalculated per page load. Not persisted, versioned, or governed by minimum-N rules.
4. **Confidence-weighted scoring is implemented and active** [Observed] — 3-point scale (low/medium/high) with hardcoded multipliers driving proficiency tiers. **Psychometric justification and fairness impact are unvalidated.** Whether this disadvantages risk-averse users, rewards test-taking style over knowledge, or introduces response-style bias has not been studied.
5. **Response time is captured but unused in scoring.** [Observed] `time_spent` (ms) recorded per response. Rapid-guess detection exists in shadow mode (4s threshold) but never activates.
6. **Distractor classification fields exist, but completion and quality are uneven.** [Estimated] L1/L2/L3 tiers, error types, misconception text, and skill deficit fields are partially populated across ~3,948 wrong-answer slots. Exact usable coverage requires a scripted count — "populated" and "usable" are not the same.
7. **No reviewed scoring or diagnostic path showed evidence of IRT/Rasch calibration or runtime ability estimation.** [Observed] Scoring is classical test theory (% correct with confidence weighting).
8. **Adaptive engine is rule-based, not psychometric.** [Observed] Wrong answer → append follow-up (FIFO, max 3 per skill). No item information maximization, no SEM-based stopping, no mid-test ability estimate.
9. **Several response signals are missing.** [Observed] No answer-change tracking, no time-to-first-interaction, no device/viewport context, no session version field, no absolute item position in session.
10. **Shadow-mode scaffolding exists but is unvalidated.** [Observed] Rapid-guess count, fragility flag, uncertain-skill flag, SRS fields (Leitner box + review dates) — all computed and stored but never read by UI or scoring. These are instructional support candidates, not measurement-grade features.
11. **Actual response volume is unknown.** [Gap] Completed diagnostic count, per-item exposure distribution, median responses per item, low-N item count, and abandonment rate have not been established. Many recommendations below depend on volume.

---

## 1. Item Bank Status (Phase 1)

### Item Inventory

| Metric | Value | Evidence Basis |
|--------|-------|----------------|
| **Canonical file** | `src/data/questions.json` (6.2 MB) | [Observed] |
| **Total items** | 1,150 | [Derived] from JSON array length |
| **Skills covered** | 45 / 45 (100%) | [Derived] from `current_skill_id` grouping |
| **Min items per skill** | 20 (by `current_skill_id`) | [Derived] |
| **Max items per skill** | ~38 | [Derived] |
| **Skills with < 8 items** | None by raw count | [Derived] — **psychometric thinness not formally evaluated** |

**No obviously thin skills by raw item count; psychometric thinness has not been formally evaluated.** [Derived + caveat] A skill with 20 items can still be psychometrically thin if items are redundant, too narrow in construct coverage, have weak distractors, show low discrimination, lack spread of challenge, or have low live response volume. None of these have been checked.

**Domain breakdown** [Derived] (by `skill_domain_code`):

| Domain Code | Count |
|-------------|------:|
| DBD (Data-Based Decision Making) | 207 |
| ACA (Academic Interventions) | 172 |
| MBH (Behavior & Mental Health) | 112 |
| LEG (Legal, Ethical & Professional) | 110 |
| PSY (Cross-Cutting Psychopathology) | 94 |
| SAF (Crisis & Safety) | 88 |
| ETH (Ethics) | 81 |
| SWP (School-Wide Systems) | 79 |
| DIV (Diversity & Equity) | 61 |
| RES (Research & Evaluation) | 47 |
| FAM (Family-School Collaboration) | 42 |
| CON (Consultation & Collaboration) | 34 |
| DEV (Cross-Cutting Development) | 23 |

**Blueprint weighting** [Observed] is hardcoded in `src/utils/assessment-builder.ts:9–62` (`SKILL_BLUEPRINT`) and `lines 68–93` (`PRAXIS_DISTRIBUTION`). Mirrors official Praxis 5403 structure: Domain 1 = 32%, Domain 2 = 23%, Domain 3 = 20%, Domain 4 = 25%. Used for test assembly only, not stored per-item.

### Item-Level Metadata

| Field | Status | Details | Evidence |
|-------|--------|---------|----------|
| **Cognitive complexity label** | [Observed] Exists, 2-tier | `cognitive_complexity`: "Recall" or "Application", 100% populated, SME-assigned with per-item `complexity_rationale`. This is cognitive demand classification, not calibrated difficulty. | `questions.json` per item |
| **Calibrated empirical difficulty** | [Observed] Does not exist | No IRT b-parameter, no numeric scale, no empirical calibration. p-values computed on-demand in admin but not stored per-item. | — |
| **Discrimination estimate** | [Observed] Provisional proxy only | Point-biserial approximation from live response data. Recomputed per admin page load. Not persisted, versioned, or governed by minimum-N rules. | `api/admin-item-analysis.ts:235–238` |
| **Distractor tiers (L1/L2/L3)** | [Estimated] Partially populated | `distractor_tier_[A-F]` fields. Exact usable coverage unknown without scripted count. | `questions.json` per item |
| **Distractor error types** | [Estimated] Partially populated | `distractor_error_type_[A-F]`: Conceptual / Procedural / Lexical. Same coverage uncertainty. | `questions.json` per item |
| **Distractor misconception text** | [Estimated] Partially populated | `distractor_misconception_[A-F]`: 15–35 word descriptions. | `questions.json` per item |
| **Distractor skill deficit** | [Estimated] Partially populated | `distractor_skill_deficit_[A-F]`: knowledge gap noun phrases. | `questions.json` per item |
| **Content blueprint weight** | [Observed] Not per-item | `domain_weight` field present but always blank. Blueprint ratios only in `assessment-builder.ts`. | — |
| **Bloom's / cognitive taxonomy** | [Observed] 2-tier only | Recall (Bloom's 1–2) and Application (Bloom's 3–4). No Synthesis or Evaluation. | `src/utils/questionDifficulty.ts:8–12` |
| **Estimated time-to-complete** | [Observed] Does not exist | No per-item time budget. Empirical avg times computed from response data in admin. | — |
| **Error cluster tag** | [Observed] Populated | `error_cluster_tag`, `dominant_error_pattern`, `dominant_failure_mode_tier`, `top_misconception_themes`. | `questions.json` per item |

### Item Authoring Provenance

| Signal | Status | Coverage | Evidence |
|--------|--------|----------|----------|
| `original_skill_id` | Present | 900 / 1,150 (78%). 250 tagged `provenance_status: "missing_original_skill_id"` | [Derived] |
| `current_skill_id` | Present | 1,150 / 1,150 (100%) | [Derived] |
| `audit_status` | Present | Mostly blank; some items marked `"HUMAN_REVIEWED"` | [Observed] |
| `is_human_verified` | Present | Mostly blank | [Observed] |
| Author name / ID | **Missing** | No `authored_by` field | [Observed] |
| Authored date | **Missing** | No `created_date` or timestamp | [Observed] |
| Reviewer name / date | **Missing** | No `reviewed_by` or `review_date` | [Observed] |

**Defensibility for B2B pitch:** Weak. [Assessment] We can trace skill mappings but cannot prove who authored or reviewed individual items, or when. No content validity review documentation was found in the reviewed code or docs. No item revision history was found in the reviewed artifacts.

### Unverified Item Bank Quality Dimensions

The following have NOT been evaluated and would be required for measurement-grade claims:

- Content validity review quality
- Item revision history
- Exposure balance across sessions
- Item performance stability over time
- Local dependence between items
- Cueing/redundancy between items in the same skill
- Form assembly quality across skills/domains

---

## 2. Response Data Status (Phase 2)

### Per-Response Signals

| # | Signal | Status | Column(s) | Source |
|---|--------|--------|-----------|--------|
| 1 | Item ID | ✅ [Observed] Captured | `question_id` (TEXT NOT NULL) | `0000_initial_schema.sql:63` |
| 2 | User ID | ✅ [Observed] Captured | `user_id` (UUID FK, NOT NULL) | `0000_initial_schema.sql:59` |
| 3 | Session ID | ✅ [Observed] Captured | `session_id` (TEXT NOT NULL) | `0000_initial_schema.sql:61` |
| 4 | Selected answer | ✅ [Observed] Captured | `selected_answers` (JSONB array) | `0000_initial_schema.sql:70` |
| 5 | Correctness | ✅ [Observed] Captured | `is_correct` (BOOLEAN NOT NULL) | `0000_initial_schema.sql:66` |
| 6 | Response time (total, ms) | ✅ [Observed] Captured | `time_spent` (INTEGER, ms) + `time_on_item_seconds` (INTEGER, sec) | `0000_initial_schema.sql:67–68` |
| 7 | Time to first interaction | ❌ [Observed] Not captured | No field separates display-to-first-click from display-to-submit | — |
| 8 | Answer changes before submit | ❌ [Observed] Not captured | UI locks answer on submit; no intermediate state tracking | — |
| 9 | Confidence rating | ✅ [Observed] Captured | `confidence` (TEXT: low/medium/high) | `0000_initial_schema.sql:65` |
| 10 | Item position in session | 🟡 [Observed] Partial | `skill_question_index` tracks within-skill position (1st/2nd/3rd), NOT absolute session order | `0015_adaptive_audit_columns.sql` |
| 11 | Timestamp (absolute) | ✅ [Observed] Captured | `created_at` (TIMESTAMPTZ, auto NOW()) | `0000_initial_schema.sql:75` |
| 12 | Time since session start | 🟡 [Derived] Derivable | Computable from `created_at` minus first response in session. Not pre-computed. | — |
| 13 | Reviewed / revisited item | ❌ [Observed] Not captured | Assessment flow prevents review (answer locked on submit) | — |
| 14 | Device / viewport context | ❌ [Observed] Not captured | No user_agent, viewport, or device_type field | — |

**Additional columns on responses table:**

| Column | Type | Migration | Purpose |
|--------|------|-----------|---------|
| `is_followup` | BOOLEAN | 0015 | Whether adaptive follow-up question |
| `cognitive_complexity` | TEXT | 0015 | Recall / Application (copied from item at response time) |
| `skill_question_index` | INTEGER | 0015 | Position within skill (1, 2, or 3) |
| `distractor_pattern_id` | TEXT | 0000 | Matched distractor pattern ID for wrong answers |

### Per-Session Signals

| # | Signal | Status | Location |
|---|--------|--------|----------|
| 1 | Session start/end timestamps | 🟡 [Observed] Partial | `user_progress.last_session` JSONB stores `sessionId`, `mode`, `questionIndex`, `elapsedSeconds`, `updatedAt`. No explicit `started_at`/`ended_at`. Start reconstructable from first response's `created_at`. |
| 2 | Total items administered | ✅ [Derived] Derivable | `COUNT(*) FROM responses WHERE session_id = X` |
| 3 | Final ability estimate | ❌ [Observed] Not stored | No theta or ability score. Post-hoc: `user_progress.skill_scores` JSONB stores per-skill accuracy. |
| 4 | Adaptive routing decisions | ✅ [Observed] Captured | `is_followup` and `skill_question_index` on each response (migration 0015) |
| 5 | Session completion status | 🟡 [Observed] Partial | Inferred from `user_progress.adaptive_diagnostic_complete` (BOOLEAN). No explicit enum (completed/abandoned/timed-out). |
| 6 | Session version field | ❌ [Observed] Not captured | No `scoring_version` or `algorithm_version` column found in any reviewed schema. |

---

## 3. Adaptive Engine Status (Phase 3)

### Item Selection Algorithm

**Files:** `src/utils/assessment-builder.ts:460–550` (queue builder) + `src/components/AdaptiveDiagnostic.tsx:346–361` (runtime)

**Queue construction** [Observed]:
1. For each of 45 skills, select 1 initial question (shuffled, single-select preferred) → 45 items
2. For each skill, build a pool of 1–2 follow-ups with alternating cognitive complexity (Recall ↔ Application)
3. Interleave initial questions by domain (round-robin across 4 domains)

**Runtime item selection** [Observed]:
- Items presented in queue order (FIFO)
- Wrong answer on skill X → first available follow-up from `followUpPool[X]` appended to queue end
- **No difficulty targeting:** Follow-ups pre-selected by complexity alternation, not difficulty estimate
- **No information maximization:** No IRT item information function
- **No ability estimate updated mid-test:** Scoring is entirely post-hoc

**Assessment:** [Instructional] This is adequate for a learning tool — it ensures every skill is sampled and probes weaknesses with follow-ups. [Measurement] It is not psychometrically optimized — items are not selected to maximize measurement precision, and the FIFO order means item selection quality depends entirely on pre-assembly.

### Stopping Rules

**Exact logic** [Observed] (`AdaptiveDiagnostic.tsx:372–388`):
```
if (nextIndex >= queue.length) → STOP
```

That is the only stopping condition. The test runs until queue exhaustion. There is:
- **No SEM-based stopping** (no standard error of measurement tracked)
- **No confidence threshold** for ability estimate convergence
- **No time limit** (no fatigue cap or exam-time rule)
- **No early termination** for high-certainty classifications

**Test length range** [Derived]:
- Minimum: 45 items (all correct → no follow-ups)
- Maximum: ~90 items (all wrong → 2 follow-ups per skill)
- Typical: unknown without response volume data [Gap]

### Skill Coverage Guarantees

[Observed]:
- Minimum 1 item per skill guaranteed (45 skills × 1 initial)
- Maximum 3 items per skill (1 initial + 2 follow-ups)
- No minimum correctness or confidence requirement per skill before proceeding

### Unverified Form Assembly Quality

The following have NOT been evaluated [Gap]:
- Are initial items balanced in challenge across skills?
- Are domain transitions too abrupt (cognitive switching burden from round-robin)?
- Are follow-ups reusing stem structure too closely (cueing)?
- Are some skills consistently getting easier or harder entry items due to shuffle?
- Is there overexposure of certain items across users?
- Does round-robin interleaving create construct-irrelevant switching load?

---

## 4. Post-Diagnostic Report Status (Phase 4)

### What's Displayed to the Student

**File:** `src/components/ScreenerResults.tsx` [Observed]

- Overall score as percentage
- Readiness label (ready / building / priority) with tone badge
- Best next step recommendation
- Domain performance breakdown (% correct per domain, proficiency badge: Demonstrating/Approaching/Emerging)
- Per-domain drilldown: top 3 strengths, top 4 weaknesses, foundational gaps (max 3)
- High-need domains (bottom 3 by score)
- Current strengths (top 4 skills with ≥80% accuracy)

### What's Computed but NOT Displayed

| Metric | Where Computed | Evidence |
|--------|---------------|----------|
| Per-skill accuracy (all 45) | `assessmentReport.ts:159–186` | [Observed] Computed; only strengths/weaknesses surfaced |
| Confidence-weighted accuracy | `diagnosticSelectors.ts:117–150` | [Observed] Delta (weighted − raw) and interpretation (overconfidence/calibrated) hidden |
| High-confidence + wrong count | `diagnosticSelectors.ts:88–89` | [Observed] Counted; never shown |
| Per-domain avg response time | `diagnosticSelectors.ts:33–82` | [Observed] Computed; never surfaced |
| Top 5 slowest questions | `diagnosticSelectors.ts:68–71` | [Observed] Computed; never surfaced |
| Rapid-guess count | `diagnosticSelectors.ts:44–45` | [Observed] Shadow mode only |
| Distractor frequencies | `assessmentReport.ts:206–210` | [Observed] Aggregated; not shown to student |

### Response Time Flagging

[Observed]:
- **Admin-only:** Items with avgTime > globalMean + 2σ flagged as "Timing Outlier" in `api/admin-item-analysis.ts:253–255`
- **Student-facing:** No timing info displayed
- **Shadow mode:** `computeRapidGuessCount()` in `src/brain/learning-state.ts:96–100` counts responses under 4s. Computed but never activated.

### Confidence Signals

[Observed]:
- **Used in scoring:** `calculateWeightedAccuracy()` in `src/brain/learning-state.ts:28–43` applies confidence-based multipliers (high+correct=1.2x, high+wrong=0.5x, low+correct=0.8x)
- **Proficiency tiers:** `getSkillProficiency()` in `src/utils/skillProficiency.ts` uses `weightedAccuracy` (when available) for tier assignment
- **NOT surfaced:** Calibration interpretation, per-skill weighted accuracy, delta between raw and weighted

**Unvalidated concerns with confidence weighting** [Gap — not evaluated]:
- Is the multiplier scheme empirically validated?
- Are the 3 confidence categories behaviorally reliable (do students use them consistently)?
- Does confidence response style bias scores systematically?
- Does this inflate penalty for anxious but knowledgeable users?
- Does it reward test-taking style more than knowledge in some cases?

---

## 5. Capability Matrix (Phase 5)

| # | Capability | Status | What's Needed | Effort | Blocks Measurement? | Instructionally Useful Now? |
|---|-----------|--------|---------------|--------|---------------------|----------------------------|
| 1 | **Rapid-guessing detection** | 🟡 Signal captured, shadow computation exists | Validate 4s threshold against actual data; activate in flag-only mode (not scoring) | S | Yes — undetected rapid guessing inflates/deflates estimates | Yes — even as a flag |
| 2 | **Confidence-weighted scoring** | ✅ Implemented, active | Validate multiplier scheme and fairness impact | N/A (code done; validation needed) | Indeterminate without validation | Yes |
| 3 | **Per-domain performance summaries** | ✅ [Observed] Computable today | Domain accuracy aggregates exist in `user_progress.domain_scores`. These are descriptive performance summaries, not model-based ability estimates. | S — presentation gap | No — data available | Yes |
| 4 | **Difficulty-weighted scoring** | 🟡 Signal captured, not used | Need calibrated numeric difficulty scale. Currently items equally weighted. | M — depends on calibration | Yes — equal weighting undermines precision | No — needs calibration first |
| 5 | **Empirical difficulty calibration** | ❌ Need computation + data volume check | Batch pipeline to compute p-values per item, write to storage. Requires sufficient N per item (unknown — see §6). | M | Yes — blocks difficulty weighting and IRT | No |
| 6 | **Calibration scoring (confidence vs accuracy)** | 🟡 Computation exists, not surfaced | `computeConfidenceStats()` returns delta + interpretation. Surface to admins first. | S | No — nice-to-have for reporting | Yes — instructional insight |
| 7 | **Speed-accuracy tradeoff metric** | 🟡 Signals captured, no metric | `time_spent` + `is_correct` both recorded. Compute correlation or composite. | S — new computation | No — nice-to-have | Potentially |
| 8 | **Fatigue curve analysis** | 🟡 [Derived] Partial signal | `created_at` timestamps allow session-position reconstruction. Add explicit `item_position_in_session`. | S | No — nice-to-have | Potentially |
| 9 | **Distractor functioning analysis** | ✅ [Observed] Partially computable | `selected_answers` stored per response. Admin endpoint has distractor frequencies. Per-distractor ability-group analysis not implemented. | S — extend admin endpoint | No — but important for item QA | Yes — item improvement |
| 10 | **Aberrant response detection** | 🟡 Signals captured, no detection | Need composite anomaly rules (rapid + high-confidence + wrong). | M — define and validate rules | Yes — needed for score validity | Possibly |
| 11 | **Per-student effort score** | ✅ [Observed] Computable today | `time_spent` across session stored. Can aggregate. | S | No — nice-to-have | Yes — feedback signal |

---

## 6. Migration Assessment (Phase 6)

### Response Volume — UNKNOWN [Gap]

**Critical dependency for many recommendations.** The following are needed but have not been established:
- Total completed diagnostic sessions
- Per-item exposure distribution (how many responses per item?)
- Median responses per item
- Count of items with < 50 responses (low-N items)
- Abandoned/incomplete session rate
- Per-skill response volume

**Why this matters:** Recommendations 5 (empirical calibration), 7 (difficulty-weighted scoring), and 9 (IRT) all depend heavily on response volume. The calibration roadmap is plausible but not evidence-backed without these numbers.

[Recommendation] **Pull actual response-volume diagnostics before proceeding with any scoring changes.** A single SQL query can answer most of these.

### Historical Data Signals

[Observed]:

| Signal | Pre-migration 0015 responses | Post-migration 0015 responses |
|--------|------------------------------|-------------------------------|
| question_id, user_id, session_id | ✅ | ✅ |
| selected_answers, correct_answers | ✅ | ✅ |
| is_correct | ✅ | ✅ |
| confidence | ✅ (most) | ✅ |
| time_spent / time_on_item_seconds | ✅ (most) | ✅ |
| created_at | ✅ | ✅ |
| is_followup | ❌ NULL | ✅ |
| cognitive_complexity | ❌ NULL | ✅ |
| skill_question_index | ❌ NULL | ✅ |

### Session Version

[Observed] No reviewed schema path included a scoring version column. No column on `responses`, `user_progress`, or other reviewed tables distinguishes scoring algorithm versions. Historical scores cannot be formally separated from new-algorithm scores.

### Backfill Feasibility

[Assessment]:
- **`cognitive_complexity`:** Safe to backfill from `questions.json` by `question_id` (deterministic lookup)
- **`is_followup`:** Fragile — requires reconstructing adaptive queue order from session response timestamps. Not recommended.
- **`skill_question_index`:** Same fragility as above.

---

## 7. Fairness & Subgroup Risk [Gap — Not Evaluated]

The following fairness concerns have not been studied but are relevant to both measurement validity and instructional equity:

| Concern | Signal Involved | Risk |
|---------|----------------|------|
| Confidence weighting disadvantages risk-averse users | `confidence` multiplier scheme | Anxious but knowledgeable students may be systematically penalized (low+correct = 0.8x) |
| Timing features disadvantage mobile/ESL/careful readers | `time_spent` thresholds | 4s rapid-guess threshold may not account for item length, vignette presence, or reading speed differences |
| Rapid-guess thresholds vary by item type | `time_spent` + item characteristics | A 4s threshold may be appropriate for short recall items but too aggressive for long case vignettes |
| Complexity labels may correlate with verbosity | `cognitive_complexity` | "Application" items may be harder partly because they are longer, not because they demand deeper reasoning |
| Device context untracked | No `device_type` field | Timing data from mobile users may be systematically different; currently no way to control for this |

[Recommendation] Before activating any timing-based or confidence-based scoring changes in a measurement context, conduct a basic subgroup analysis on existing data.

---

## 8. Instructional vs. Measurement Features

Explicit separation to prevent marketing learning features as score validity evidence:

| Feature | Instructional Value | Measurement Grade? |
|---------|--------------------|--------------------|
| Confidence-weighted proficiency tiers | ✅ Useful for identifying shaky knowledge | ❌ Multiplier scheme unvalidated; fairness untested |
| Rapid-guess flagging (shadow mode) | ✅ Useful for effort feedback | ❌ Threshold not validated; not active |
| Fragility flag (low-confidence + correct) | ✅ Useful for study plan targeting | ❌ Shadow mode, never validated |
| SRS fields (Leitner box, review dates) | ✅ Could support spaced practice scheduling | ❌ Written but never read; no scheduling engine |
| Distractor classifications | ✅ Useful for targeted remediation messaging | ❌ Partially populated; quality unverified |
| Error cluster tags | ✅ Useful for grouping common failure modes | ❌ Not validated against response data |
| 2-tier complexity alternation in follow-ups | ✅ Provides varied challenge | ❌ Not a calibrated difficulty ladder |

---

## 9. Recommended Next Steps

Ordered by: auditability first, then data gathering, then scoring changes. [Recommendation] throughout.

1. **Add `scoring_algorithm_version` and `item_position_in_session` columns** — Two-column migration. Enables historical audit trail and fatigue analysis. Foundation for any v1→v2 transition. _Effort: S._

2. **Activate rapid-guess detection in flag-only mode** — The code exists (`computeRapidGuessCount`, 4s threshold). Activate as a flag on responses, NOT in scoring. Validate threshold against actual data before any scoring integration. _Effort: S._

3. **Surface confidence calibration stats to admins first** — `computeConfidenceStats()` already returns delta and interpretation. Wire to admin dashboard, not student-facing reports. Let it be observed before acting on it. _Effort: S._

4. **Pull actual response-volume diagnostics** — Before any scoring changes, run:
   - Responses per item (distribution, min, median, max)
   - Completed diagnostic sessions (count)
   - Item exposure spread (how many items have ≥50, ≥100, ≥200 responses)
   - Abandonment rate (sessions started vs. completed)
   - Per-skill response volume
   _Effort: S (single SQL query set). **Blocks steps 7–9.**_

5. **Audit form assembly quality and follow-up pool quality** — Review whether initial items are balanced in challenge, whether round-robin creates switching burden, whether follow-ups reuse stem structure, whether some skills get systematically easier/harder entry items. _Effort: M (manual review + data analysis)._

6. **Run scripted count of usable distractor classifications** — Determine exact field-level completion. Distinguish "field populated" from "field contains quality data." Prioritize completion for high-traffic items. _Effort: S._

7. **Build empirical item statistics pipeline with minimum-N safeguards** — Batch job computing p-values and discrimination per item. Store results. Apply a conservative working threshold for minimum N (e.g., ≥30 responses as a common practical benchmark [Threshold]) before publishing any statistic. The right threshold depends on model choice and population heterogeneity. _Effort: M. Dependency: step 4 confirms sufficient volume._

8. **Only then consider difficulty-weighted scoring** — Assign numeric difficulty from empirical p-values. Update scoring formula. _Effort: M. Dependency: step 7._

9. **IRT calibration — only if data volume and use case justify it** — 2PL or 3PL calibration conventionally targets ≥200 responses per item as a common practical benchmark [Threshold], though the actual requirement depends on model constraints, item pool behavior, and population heterogeneity. This is a long-term consideration. Enables: adaptive stopping by SEM, mid-test ability estimation, information-maximizing item selection. _Effort: L. Dependency: significant data accumulation._

10. **Add authoring provenance fields** — `authored_by`, `authored_date`, `reviewed_by`, `review_date`. Required for B2B defensibility. _Effort: M (data entry, not code)._

11. **Add `device_type` capture** — Detect mobile/tablet/desktop from viewport width at response time. Enables fairness analysis of timing data. _Effort: S._

---

## Key Files Referenced

| File | Purpose |
|------|---------|
| `src/data/questions.json` | Canonical 1,150-item bank |
| `src/utils/assessment-builder.ts` | Queue construction for screener + adaptive diagnostic |
| `src/components/AdaptiveDiagnostic.tsx` | Adaptive test runtime (follow-up logic, stopping rule) |
| `src/brain/learning-state.ts` | Confidence weighting, rapid-guess, fragility/uncertainty flags, SRS fields |
| `src/utils/skillProficiency.ts` | Proficiency tier thresholds (80/60) |
| `src/utils/diagnosticSelectors.ts` | Time stats, confidence stats, rapid-guess shadow mode |
| `src/utils/assessmentReport.ts` | Post-hoc report model builder |
| `src/components/ScreenerResults.tsx` | Student-facing post-diagnostic report |
| `src/utils/studyPlanPreprocessor.ts` | Skill status assignment, trend, urgency clusters |
| `api/admin-item-analysis.ts` | p-value, discrimination, distractor frequencies, quality flags |
| `supabase/migrations/0000_initial_schema.sql` | Core `responses` table definition |
| `supabase/migrations/0015_adaptive_audit_columns.sql` | `is_followup`, `cognitive_complexity`, `skill_question_index` |
| `docs/DISTRACTOR_CLASSIFICATION_HANDOFF.md` | Distractor classification project brief |
