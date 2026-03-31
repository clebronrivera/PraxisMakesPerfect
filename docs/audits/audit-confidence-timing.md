# Confidence & Timing Data Audit
_Praxis Makes Perfect — Audit only, no implementation_
_Date: 2026-03-29_

---

## Executive Summary

The codebase captures both confidence and timing data on every response, but uses them very unevenly.

**Confidence** is a first-class signal: it is captured in the UI, written to the database, propagated through the skill-scoring pipeline, and actively shapes weighted accuracy, misconception detection, and question-selection priority.

**Timing** is a second-class passenger: it is captured, stored in the database, and shown in admin tables, but it is completely ignored by every scoring, mastery, and selection algorithm. No rapid-guess detection, no fluency signal, and no timing-based urgency exist anywhere in the code today.

The gap between what timing data could tell us and what we currently do with it is the primary opportunity surface for this audit.

---

## Part 1 — Confidence: File-by-File Trace

### 1.1 Capture

| File | Lines | What happens |
|---|---|---|
| `src/components/QuestionCard.tsx` | 6–8, 18, 33–34 | Renders the three-option confidence selector ("Guess" / "Unsure" / "Sure") and surfaces `onConfidenceChange` callback |
| `src/components/PracticeSession.tsx` | 201 | `useState<'low' \| 'medium' \| 'high'>('medium')` — default is "medium" on every new question |
| `src/components/FullAssessment.tsx` | 68 | Same pattern; confidence state initialized to `'medium'` |
| `src/components/ScreenerAssessment.tsx` | 75 | Same pattern |
| `src/components/AdaptiveDiagnostic.tsx` | 32 | Included in response-logging signature |

Default of `'medium'` means any question a user answers without touching the confidence selector is silently attributed medium confidence. This is a data-quality issue to keep in mind when interpreting aggregate confidence distributions.

### 1.2 Storage

| File | Table / Column | Type | Notes |
|---|---|---|---|
| `supabase/migrations/0000_initial_schema.sql` L68 | `responses.confidence` | `TEXT` | Primary store; all assessment paths write here |
| `supabase/migrations/0000_initial_schema.sql` L95 | `practice_responses.confidence` | `TEXT` | **Orphaned** — written by `savePracticeResponse()` but never queried |

The `practice_responses` table entry is dead weight: every practice answer is also inserted into `responses` (which is queried), so the copy in `practice_responses` is redundant.

### 1.3 Scoring / Active Use

| File | Lines | What it does |
|---|---|---|
| `src/brain/learning-state.ts` | 7–23 | `calculateConfidenceWeight()` — multipliers: high+correct→1.2×, high+wrong→0.5×, low+correct→0.8×, low+wrong→1.0×, medium→1.0× |
| `src/brain/learning-state.ts` | 28–43 | `calculateWeightedAccuracy()` — loops attempt history, applies confidence multiplier to every answer; returns weighted hit rate |
| `src/brain/learning-state.ts` | 48–52 | `countConfidenceFlags()` — counts attempts where `confidence === 'high' && !correct`; this is the misconception counter |
| `src/hooks/useProgressTracking.ts` | 536–621 | `updateSkillProgress()` — calls both functions above, stores results as `weightedAccuracy` and `confidenceFlags` on the skill score object |
| `src/utils/skillProficiency.ts` | 20–30 | `getSkillProficiency()` — when `weightedAccuracy` is present, uses it in place of raw accuracy for tier assignment (Emerging / Approaching / Demonstrating) |
| `src/hooks/useAdaptiveLearning.ts` | 15–23 | `calculateSkillPriority()` — boosts a skill's selection priority to 3–4 if `confidenceFlags > 0` (misconception heuristic for question targeting) |
| `src/utils/studyPlanPreprocessor.ts` | 135–137, 198 | Detects `confidenceIssue` (any high+wrong), adds +15 urgency points; feeds cluster assignment |

### 1.4 Surface / Display

| File | Lines | Shown to whom |
|---|---|---|
| `src/components/PracticeSession.tsx` | 851–859 | "Overconfident: N" counter displayed in session summary to student |
| `src/components/ResultsDashboard.tsx` | 194–218 | `confidenceStats` memo: raw vs. weighted accuracy delta, misconception count; shown in student-facing results |
| Admin student detail drawer | — | Admin can see per-skill `confidenceFlags`; student detail has skill breakdown |

### 1.5 Where Confidence Is Ignored

**Nowhere materially.** Confidence is integrated end-to-end. The one gap worth noting: the study plan narrative prompt (`api/study-plan-background.ts`) receives the preprocessed `urgencyScore` and `confidenceIssue` boolean, so Claude knows a skill has a confidence problem — but it receives no per-attempt confidence time-series. It cannot distinguish a student who was overconfident once from one who is chronically overconfident.

---

## Part 2 — Timing: File-by-File Trace

### 2.1 Capture

| File | Lines | What happens |
|---|---|---|
| `src/hooks/useElapsedTimer.ts` | 26, 70–97, 102–106 | Runs a 1-second `setInterval`; auto-pauses at 120 s inactivity with a warning at 90 s; `resetQuestionTimer()` returns elapsed seconds and resets to zero |
| `src/components/PracticeSession.tsx` | 217 | Initializes `useElapsedTimer()`; calls `resetQuestionTimer()` on answer submit |
| `src/components/FullAssessment.tsx` | 77–91, 219 | Same pattern |
| `src/components/ScreenerAssessment.tsx` | — | Same pattern |
| `src/components/AdaptiveDiagnostic.tsx` | — | Same pattern |

The 120-second inactivity cap means the timer top-codes very slow responses. A student who pauses to think for 3 minutes will have their time recorded as ≤120 s, not the actual elapsed time. This is the right UX choice but makes it impossible to distinguish "slow careful thinking" from "walked away."

### 2.2 Storage

| File | Table / Column | Type | Notes |
|---|---|---|---|
| `supabase/migrations/0000_initial_schema.sql` L69 | `responses.time_spent` | `INTEGER` | Legacy field; exact origin unclear; not always written |
| `supabase/migrations/0000_initial_schema.sql` L70 | `responses.time_on_item_seconds` | `INTEGER` | Modern canonical field; written by all current paths |
| `supabase/migrations/0000_initial_schema.sql` L96 | `practice_responses.time_on_item_seconds` | `INTEGER` | **Orphaned** — written but never queried |

`rebuildProgressFromResponses.ts` (L 69–74) handles both legacy fields with a fallback: `time_on_item_seconds ?? time_spent ?? 0`. This correctly bridges old and new rows.

### 2.3 Where Timing Is Surfaced

| File | Lines | Shown to whom |
|---|---|---|
| `src/components/ResultsDashboard.tsx` | 67–104 (`computeTimeStats()`) | Student: average overall time, time by domain, top-5 slowest questions (display only) |
| `src/components/StudentDetailDrawer.tsx` | 71–85 | Admin: five-number summary (min / Q1 / median / Q3 / max) per student |
| `src/components/StudentDetailDrawer.tsx` | 162–180, 200–209 | Admin: average time per skill, average time per session |
| `api/leaderboard.ts` | — | Leaderboard "Engagement Time" mode sums `time_on_item_seconds` across all `responses` rows |

### 2.4 Where Timing Is Ignored (Every Algorithm)

| Algorithm | File | Lines | Timing consulted? |
|---|---|---|---|
| Weighted accuracy | `src/brain/learning-state.ts` | 28–43 | ❌ No |
| Misconception flag | `src/brain/learning-state.ts` | 48–52 | ❌ No |
| Mastery state machine | `src/brain/learning-state.ts` | 129–173 | ❌ No |
| Proficiency tier assignment | `src/utils/skillProficiency.ts` | 20–30 | ❌ No |
| Question selection priority | `src/hooks/useAdaptiveLearning.ts` | 15–23 | ❌ No |
| Skill urgency score | `src/utils/studyPlanPreprocessor.ts` | 179–202 | ❌ No |
| Cluster assignment | `src/utils/studyPlanPreprocessor.ts` | 206–220 | ❌ No |
| Rapid-guess detection | _anywhere_ | — | ❌ Not implemented |
| Fluency signal | _anywhere_ | — | ❌ Not implemented |
| `rebuildProgressFromResponses` | `src/utils/rebuildProgressFromResponses.ts` | 69–105 | Extracted, stored in `SkillAttempt.timeSpent`, then silently discarded |

`timeSpent` travels all the way into the `SkillAttempt` struct but is never referenced again by any function that reads the struct (`calculateWeightedAccuracy`, `countConfidenceFlags`, `calculateLearningState`). The field is carried as dead cargo.

---

## Part 3 — Proposed Deterministic Rules

All rules are stateless per-response or rolling-window over stored attempts. No ML, no external models.

---

### Rule 1: High-Confidence Wrong — Follow-Up Priority Boost

**Intent:** A student who answered "Sure" and got it wrong likely has an active misconception, not a gap. That is qualitatively different from someone who guessed wrong. The system already counts `confidenceFlags` but does not modulate _how much_ to boost priority based on recency or frequency.

**Proposed rule:**

```
let hcw_recent = count of attempts in last 10 where confidence == 'high' AND correct == false
if hcw_recent >= 2:
    priority_boost = 2.0        # Strong misconception signal — surface aggressively
elif hcw_recent == 1:
    priority_boost = 1.0        # Possible misconception — mild boost
else:
    priority_boost = 0
```

Applicable in: `calculateSkillPriority()` in `src/hooks/useAdaptiveLearning.ts`.

This replaces the current blunt `confidenceFlags > 0 → fixed +3 or +4 priority` with a recency-sensitive version. A single high-confidence wrong answer from 30 attempts ago should not permanently mark a skill as misconception priority.

**Window choice rationale:** Last 10 attempts aligns with the 20-attempt rolling history already used for `weightedAccuracy`. The inner window of 10 captures recent state without being too volatile.

---

### Rule 2: Low-Confidence Correct — Fragility Flag

**Intent:** A student who got it right but selected "Guess" has not demonstrated understanding. The current 0.8× weight in `calculateWeightedAccuracy` discounts these answers, but nothing surfaces fragility as a named condition to the student or the study plan.

**Proposed rule:**

```
let lcr_recent = count of attempts in last 6 where confidence == 'low' AND correct == true
let lcr_rate   = lcr_recent / max(1, total_recent_attempts_last_6)

if lcr_rate >= 0.5 AND attempts_total >= 6:
    fragility_flag = true
```

Applicable in: `studyPlanPreprocessor.ts` (add to `StudentSkillState`); used in urgency scoring (+10 points) and in the prompt context sent to Claude.

**Threshold rationale:** 3 out of 6 recent correct answers being self-rated "Guess" is a meaningful signal. Fewer than 6 total attempts means the window is too small to be reliable.

---

### Rule 3: Rapid-Guess Flag (Timing-Based)

**Intent:** A response in under a threshold time is unlikely to reflect deliberate retrieval. This is not a moral judgment — some students are genuinely fast — but a data-quality flag: an answer in 2 seconds should carry different evidential weight than one in 20 seconds.

**Proposed rule:**

```
RAPID_THRESHOLD_SECONDS = 4

if time_on_item_seconds < RAPID_THRESHOLD_SECONDS AND correct == false:
    rapid_wrong = true          # Low-quality wrong — reduce weight in accuracy calc
if time_on_item_seconds < RAPID_THRESHOLD_SECONDS AND correct == true:
    rapid_correct = true        # Lucky right — treat like low-confidence correct
```

Weight modification (shadow mode first, then integrate into `calculateConfidenceWeight`):

```
rapid_wrong  → apply weight of 0.6  (less informative than a considered wrong)
rapid_correct → apply weight of 0.7  (similar to low+correct today)
```

**Threshold rationale:** 4 seconds is long enough to read a 4-option multiple-choice stem and register a click. Under 4 seconds is mechanically implausible for thoughtful retrieval on questions of this length and complexity. The existing inactivity cap at 120 s means the data is already bounded on the upper end.

**Important caveat:** Do not apply the rapid flag to questions with very short stems (e.g. pure vocabulary recall). A future refinement could use a per-question-type threshold, but a flat 4-second global threshold is safe to start.

---

### Rule 4: Fluency Signal

**Intent:** Fluency is correctness _with speed_. A student who consistently answers correctly in under a domain-relative median time demonstrates automaticity — they are not just right, they are fast-right. This is meaningfully different from slow-correct.

**Proposed rule (computed per skill, requires ≥ 8 attempts):**

```
# Step 1: compute the global median per-item time from all students' responses
# (this is a precomputed constant from admin item analysis, not per-user)
GLOBAL_MEDIAN_SECONDS = [computed offline, stored per question or per domain]

# Step 2: per student per skill
correct_and_fast = count of attempts where correct == true
                   AND time_on_item_seconds < GLOBAL_MEDIAN_SECONDS * 0.75

fluency_rate = correct_and_fast / total_attempts

if fluency_rate >= 0.6 AND total_attempts >= 8:
    fluency_signal = true
```

If global per-question median is not yet available (insufficient response volume), fall back to a flat 15-second threshold as the "fast" cutoff for any question in this bank.

Applicable in: surfaced in the study plan preprocessor as a positive signal that reduces a skill's urgency even if raw accuracy is only in the Approaching range. Specifically: if `status == 'near_mastery'` AND `fluency_signal == true`, do not assign to the `important_next` cluster; leave in `maintain`.

---

### Rule 5: Uncertain Skill Flag

**Intent:** High variance in confidence ratings within a skill — alternating "Sure" and "Guess" across attempts — may indicate the student has inconsistent or unstable knowledge rather than a clear gap or a clear strength. This is different from both misconception (confidently wrong) and fragility (guessing right).

**Proposed rule (requires ≥ 6 attempts on the skill):**

```
high_conf_attempts = count of attempts where confidence == 'high'
low_conf_attempts  = count of attempts where confidence == 'low'
total_attempts     = all attempts for this skill

high_rate = high_conf_attempts / total_attempts
low_rate  = low_conf_attempts  / total_attempts

if high_rate >= 0.25 AND low_rate >= 0.25 AND total_attempts >= 6:
    uncertain_skill_flag = true
```

Meaning: at least a quarter of attempts were high-confidence and at least a quarter were low-confidence, indicating the student's self-assessment of this skill is itself unstable.

Urgency impact: +10 urgency points in `studyPlanPreprocessor.ts`. The student may need scaffolded exposure rather than pure drilling, since they do not have a reliable internal signal of what they know.

---

## Part 4 — Shadow-Mode vs. User-Visible First

Shadow mode means: compute the signal, log it internally (to the student's skill state or a separate analytics table), but do not surface it in any UI or let it affect any score the student sees. This lets you validate the signal against outcomes before acting on it.

### Start in Shadow Mode

**Rule 3 — Rapid-Guess Flag**

This is the highest-risk rule to deploy visibly. Students who have high click speed may be penalized unfairly. The 4-second threshold may be wrong for some question formats. Before it touches any score or label, run it in shadow mode for at least one full cohort cycle (~ 4–6 weeks of usage) and compare rapid-flagged answers' predictive accuracy against subsequent attempts on the same skill. If rapid-wrong answers are worse predictors of future mastery than considered-wrong answers, the threshold is working.

**Rule 4 — Fluency Signal**

This requires a reliable global median baseline. If per-question timing data is sparse (< 20 responses per question), the median is noisy. Compute the signal in shadow mode first, validate that fluency-flagged skills are genuinely stable (i.e., student does not regress), then allow it to influence cluster assignment.

**Rule 5 — Uncertain Skill Flag**

Confidence variance is potentially sensitive UX. A student told their knowledge of a skill is "uncertain" may find it demoralizing or confusing. Validate in shadow mode that uncertain-flagged skills correlate with higher real-world variance in correctness (i.e., accuracy in the ≤ 0.65 range with standard deviation > 0.25) before surfacing the label.

### Deploy User-Visible First

**Rule 1 — High-Confidence Wrong, Recency-Weighted Priority**

This refines an existing behavior (the current `confidenceFlags` priority boost) rather than introducing a new signal. The change is internal to question selection, invisible to the user, and strictly more accurate than the current flat flag. Safe to deploy directly. No UI change required.

**Rule 2 — Low-Confidence Correct, Fragility Flag**

This feeds into the study plan text, not the accuracy score. Claude's narrative already receives `confidenceIssue` booleans; adding `fragility_flag` extends that context without changing any number the student sees directly. The risk is low. The only new visible artifact is study plan language acknowledging that the student is getting answers right without certainty — which is pedagogically honest and useful.

---

## Part 5 — Risks of Overinterpreting Timing and Confidence

### Timing Risks

**1. The default confidence problem for timing**
Every response is timestamped. But the timer auto-pauses at 120 s, is reset between questions, and never accounts for a student re-reading the question after an initial scan. A 6-second response could mean instant retrieval or it could mean the student glanced at the question, changed their mind in 2 seconds, and clicked. The signal is noisy at the individual-response level.

**2. Systematic device speed differences**
A student on a slow mobile connection may have consistent 1–2 second delays just from page rendering, making their per-item time systematically higher than a student on a fast desktop. Any absolute threshold (e.g., "under 4 seconds = rapid") will disadvantage fast-device students and give false passes to slow-device students. Mitigate by comparing against the student's own median rather than a global median for the fluency signal wherever possible.

**3. Timer discontinuity on navigation events**
If a student navigates away and back (tab switch, phone notification), the inactivity detector fires, but there is a 90-second warning window before the cap. A student who was distracted for 88 seconds will have their time recorded as 88+ seconds, which looks like slow deliberation but was nothing. There is no reliable way to distinguish cognitive load from attention interruption.

**4. Rapid-correct as false positive for mastery**
A very fast correct answer in a domain the student knows deeply is valid evidence of automaticity. A very fast correct answer on a question the student happened to have seen in a previous session is not. Without question-level exposure history factored into the timing signal, fast-correct is ambiguous.

### Confidence Risks

**1. The "medium" default swamps the distribution**
Every question begins with confidence set to "medium." Students who do not actively change it contribute medium-confidence data even on guesses or highly confident answers. The proportion of "medium" responses in the database is almost certainly inflated. Before acting on any aggregate confidence distribution, verify what share of responses were submitted without the selector being touched. If it is high (> 40%), the signal is substantially corrupted.

**2. Confidence calibration varies by student personality**
Some students rate themselves consistently low regardless of actual knowledge (pessimistic bias). Others rate consistently high (Dunning-Kruger). Two students with the same raw accuracy will receive different weighted accuracy scores based purely on their reporting style, not their underlying competence. The weighted accuracy system is correct to modulate on confidence, but it is not comparing students on the same scale. Leaderboard-style comparisons using weighted accuracy would be misleading.

**3. High-confidence wrong is not always a misconception**
A student can be confidently wrong because of a careless reading error, a distractor that superficially resembles the correct answer, or a bad day. A single high+wrong event is weak evidence. The current system counts `confidenceFlags` across the rolling 20-attempt history, which is right. The proposed recency-weighted Rule 1 is an improvement, but even with recency weighting, a 2-in-10 rate of high+wrong is not a clinically meaningful misconception unless those answers cluster on the same distractor or the same concept.

**4. Confidence labels are not standardized across the UX**
"Guess," "Unsure," and "Sure" are colloquial. Research on self-reported confidence shows that the boundary between "Unsure" and "Sure" is highly personal. One student's "Sure" is another's "Unsure." The 1.2× weight on high+correct and 0.5× weight on high+wrong assumes the confidence label carries consistent meaning across users, which it does not.

**5. Overreaction creates feedback loops**
If the system surfaces a fragility flag or uncertainty label to a student and the student adjusts their confidence ratings in response — becoming more conservative with "Sure" to avoid being flagged — the underlying signal degrades. Students optimize for the feedback they receive. Any student-visible confidence-derived label should be designed so that gaming it requires actually getting better (e.g., by basing the label on both the rating _and_ the accuracy outcome).

---

## Appendix: Data Quality Issues to Address Before Any Implementation

1. **Orphaned columns**: `practice_responses.confidence` and `practice_responses.time_on_item_seconds` are written but never read. Either remove them or start querying them consistently.
2. **Legacy `time_spent` column**: `responses.time_spent` appears alongside `time_on_item_seconds`. Clarify which is canonical, add a migration comment, and consider dropping the legacy field after verifying all rows have `time_on_item_seconds`.
3. **Default confidence data quality check**: Run a query to determine what share of `responses` rows have `confidence = 'medium'`. If it exceeds ~40%, it is a sign that most users do not interact with the confidence selector and the field's signal quality is lower than assumed.
4. **Rapid-response baseline**: Before setting any threshold, pull the per-question median `time_on_item_seconds` for questions with ≥ 20 responses. Verify the distribution is reasonable (most questions should peak at 15–35 s). If the median is below 8 s across the board, the 4-second rapid threshold may need adjustment.
5. **`timeSpent` in `SkillAttempt`**: Add a code comment in `src/brain/learning-state.ts` and `src/utils/rebuildProgressFromResponses.ts` explicitly noting that this field is stored but not yet used in any calculation, so future readers understand it is intentionally dormant, not a bug.
