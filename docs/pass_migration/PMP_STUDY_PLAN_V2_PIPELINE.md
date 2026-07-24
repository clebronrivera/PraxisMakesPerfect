# Study Plan Generation Pipeline — Generic Specification

**Status:** Spec extraction (pattern documentation for re-implementation).
**Audience:** Engineers building AI-generated, per-user instructional guidance for a multi-exam platform.
**Scope:** The three-stage study-plan pipeline — deterministic preprocessing, content retrieval, model synthesis — abstracted from a working single-exam reference implementation into pure, exam-agnostic rules. Covers what each stage consumes and produces, why the pipeline is split this way, the deterministic computations in Stage 1, and the shape of the Stage-3 prompt.

This document is a **specification of behavior**, not a transplant of code. Every threshold below is a validated default; an adopting system may re-tune them, but the *shape* of the pipeline — three stages, one model call, everything else deterministic — is the contract. Signatures and payloads are given as pseudo-code with generic type names.

Capabilities served: primarily the **study-plan / instructional-guidance generation capability** — turning a user's response history into a personalized, structured study plan. It also touches readiness reporting, since Stage 1's domain and skill summaries are the same aggregates a readiness dashboard would consume.

---

## 1. The three stages: inputs and outputs

The pipeline runs in a strict sequence. Each stage's output is the next stage's input; nothing loops back.

```
Response[] + StudyConstraints
   ▼  STAGE 1 — deterministic preprocessing
SkillState[], TimeBudget, PriorityCluster[], ScheduleFrame[], DomainSummary[]
   ▼  STAGE 2 — content retrieval
PriorityCluster[] + ContentBundle (vocabulary, misconceptions, case archetypes, laws)
   ▼  STAGE 3 — model synthesis
StudyPlan (validated, versioned JSON document)
```

### 1.1 Stage 1 — Deterministic preprocessing

**Consumes:** `Response[]` — full response history, ordered chronologically (order matters for trend, § 3.3), each carrying skill identifier, correctness, self-reported confidence, the wrong option selected (if any), and an optional stable question identifier — plus `StudyConstraints`: study days/week, minutes per session, weekend minutes, intensity, and either a target test date or a raw weeks-available count.

**Produces:** `SkillState[]` (accuracy, attempts, half-window accuracies, trend, status label, diagnostic flags — § 3.1–3.2); `TimeBudget` (total minutes by week and by cluster urgency — § 3.6); `PriorityCluster[]` (skills grouped into content clusters, ranked by urgency — § 3.5); `ScheduleFrame[]` (one per calendar week, cluster focus + session slots, no narrative — § 3.7); `DomainSummary[]` (per-domain rollups, reused by a readiness view independent of the prompt).

No network call, no model call. Every function here is pure and unit-testable against fixed inputs.

### 1.2 Stage 2 — Content retrieval

**Consumes:** the skill identifiers in each `PriorityCluster` from Stage 1.

**Produces:** a `ContentBundle` per cluster — vocabulary, common-misconception descriptions (plus resolved IDs against a canonical misconception taxonomy, where one exists), case/scenario archetypes, and relevant laws or frameworks — pulled from a static, hand-authored content library keyed by skill identifier, deduplicated with per-field caps (reference: vocabulary 20, misconceptions 15, case archetypes 12, laws/frameworks 8).

A lookup, not a generation step: the library is authored ahead of time by subject-matter review, not produced at request time. No model call.

### 1.3 Stage 3 — Model synthesis

**Consumes:** a single prompt string assembled from every Stage 1 and Stage 2 output (§ 4), sent as the entire user turn.

**Produces:** `StudyPlan` — a schema-constrained JSON document with a fixed set of top-level sections (§ 4), persisted with an explicit schema version so old document shapes can be distinguished on read.

This is the only stage that calls a model, and it runs as an asynchronous/background job rather than inline: the reference dispatches to a background function that can run several minutes, returns an immediate "accepted" response, and has the caller poll a datastore for the completed document. That asynchrony follows from the model call being slow and token-heavy, not from the pipeline design — a faster model or smaller schema could run Stage 3 inline.

---

## 2. Why three stages — and why only one calls a model

The split exists to make the expensive, non-deterministic part of the system as small and as replaceable as possible.

- **Predictability.** Stages 1 and 2 are pure functions over structured data — same inputs in, byte-identical output out. That makes them exhaustively unit-testable, and "why was this student labeled X" is debuggable by reading code, not re-prompting a model. If clustering, urgency, or scheduling logic lived inside the prompt instead, those decisions would become non-reproducible.

- **Low AI cost.** Model calls are priced per token. Anything computed once and handed to the model as a finished fact is a fact it doesn't have to reason its way to — shorter prompt, less reasoning, less chance of inventing a number instead of using the real one. The reference prompt explicitly forbids the model from re-deriving scores, cluster membership, or session structure; it only writes narrative layered on pre-computed numbers.

- **Narrow AI blast radius.** Because the model's only job is synthesis, a failure mode (hallucinated term, invented resource, wrong count) is contained to prose fields, not structural ones. A schema validator can catch a missing or empty *section*, but not a subtly wrong number inside prose. Keeping every number deterministic shrinks the worst-case hallucination to "an unhelpful sentence," never "an invented schedule that doesn't match reality."

- **Reusability of Stage 1 outputs.** `SkillState[]` and `DomainSummary[]` are computed independently of the prompt, so a readiness dashboard or analytics view can consume them without duplicating model-facing logic. Only Stage 3's inputs are prompt-shaped.

---

## 3. Deterministic inputs computed in Stage 1

### 3.1 Skill state

For each skill with at least one response, Stage 1 computes:

```
SkillState {
  skillId
  attempts, correctCount, currentAccuracy   # accuracy = round(correct/attempts * 100), null if 0 attempts
  firstHalfAccuracy, lastHalfAccuracy       # § 3.3
  trend                                     # improving | declining | flat | insufficient_data
  status                                    # hard-threshold label, § 3.2
  confidenceIssue                           # any wrong answer given at high self-reported confidence
  repeatedDistractorPattern                 # same wrong option chosen 2+ times
  dominantMisconceptionKey                  # most-repeated wrong option + a representative missed question
  missedQuestionIds
  fragilityFlag                             # correct-but-low-confidence pattern
  uncertainSkillFlag
}
```

### 3.2 Status labels (hard thresholds, evaluated in order)

Confirmed against source (not just the summary table elsewhere in this repo):

| Rule | Condition | Label |
|---|---|---|
| 1 | `attempts < 3` | `unlearned` — insufficient engagement to classify |
| 2 | accuracy `< 60%` **and** (`confidenceIssue` **or** `repeatedDistractorPattern`) | `misconception` — a diagnostic error pattern, not just low accuracy |
| 3 | accuracy `≥ 80%` | `mastered` |
| 4 | accuracy `≥ 60%` | `near_mastery` |
| 5 | accuracy `≥ 40%` | `developing` |
| 6 | none of the above | `unstable` |

Rules are evaluated top to bottom, first match wins — critically, **Rule 2 is checked before the accuracy bands**, so a skill at 50% accuracy with a confidence red flag is labeled `misconception` rather than falling through to `developing`/`unstable` on accuracy alone.

### 3.3 Trend

```
trend(outcomes: bool[]):                       # outcomes ordered chronologically, oldest first
    if len(outcomes) < 6: return insufficient_data

    firstHalf = outcomes[0 : ceil(n/2)]
    lastHalf  = outcomes[n - floor(n/2) : n]    # overlaps by one item when n is odd
    delta = avg(lastHalf) - avg(firstHalf)      # percentage points

    if delta >= +15: return improving
    if delta <= -15: return declining
    return flat
```

Trend requires at least 6 attempts; below that it is explicitly `insufficient_data` rather than being forced into `flat`, so a low-N skill is never silently reported as stable.

### 3.4 Urgency scoring

A single skill's urgency is an additive score used to rank skills inside a cluster and to weight cluster-level urgency:

```
urgency(skill) =
      statusWeight[skill.status]                 # misconception 100, unstable 80, developing 60,
                                                   # unlearned 50, near_mastery 20, mastered 0
    + trendPenalty[skill.trend]                   # declining 20, flat 10, insufficient_data 5, improving 0
    + (confidenceIssue ? 15 : 0)
    + (fragilityFlag ? 10 : 0)
    + (accuracy != null ? (100 - accuracy) / 10 : 5)
```

A simple weighted sum, not a learned model — every term is legible and independently tunable. `misconception` outranks `unstable`, which outranks `unlearned`: a confirmed error pattern is treated as more urgent than low accuracy alone or lack of data.

### 3.5 Clustering

Skills are grouped by a **content cluster** — a cross-domain instructional grouping distinct from the exam's official domain/objective taxonomy, used purely to decide what to study together. (The reference ships roughly a dozen clusters for one exam, e.g. assessment-and-measurement, legal-and-ethics, crisis-response — the label set is exam-specific content, not part of this spec's contract; treat the cluster taxonomy as per-exam configuration.) Mastered skills are excluded from active clusters; `near_mastery` skills seed a "maintain"-urgency cluster if none is otherwise represented, so a plan doesn't go silent on strong areas.

Cluster-level urgency is derived from its member skills' statuses, not recomputed independently:

```
clusterUrgency(memberStatuses):
    if any(status in {misconception, unstable, unlearned}): return urgent_now
    if any(status == developing) or not all(status in {near_mastery, mastered}): return important_next
    return maintain
```

Clusters are sorted `urgent_now` → `important_next` → `maintain`, with ties broken by the sum of member skills' urgency scores (§ 3.4).

### 3.6 Time budget

```
minutesPerWeek(constraints) =
    (min(studyDays, 5) * minutesPerSession + (studyDays > 5 ? weekendMinutes : 0))
    * intensityMultiplier[intensity]        # light 0.7, moderate 1.0, aggressive 1.3

weeksAvailable = explicit weeksToTest, or derived from (testDate - today), or a default (8 weeks) if neither is given

totalMinutes = minutesPerWeek * weeksAvailable
```

That total is split across clusters by urgency tier — `urgent_now` 50%, `important_next` 35%, `maintain` 15% — renormalized if a tier is empty (e.g., no `maintain` clusters redistributes its 15% to the other two). Within a tier, the share splits evenly across its clusters; each cluster's allocated weeks = allocated minutes ÷ minutes-per-week, rounded.

### 3.7 Weekly schedule frame

One frame per week, from week 1 to `weeksAvailable`. Each week gets a cluster focus pulled off an urgency-ordered queue, staying on a cluster for its allocated weeks before rotating; once the non-maintain queue is exhausted, the frame falls back to a "General Review" or maintain-tier focus. This is queue consumption, not per-week model reasoning — the whole multi-week arc is fixed before any prose is written.

Each week's sessions are one slot per weekday (up to 5) plus an optional weekend slot, each with a duration (from constraints) and a **session type** from a small rule table:

```
sessionType(cluster, hasUnlearnedSkill, hasMisconceptionSkill, sessionIndexInWeek):
    if hasMisconceptionSkill and sessionIndexInWeek == 0: wrong-answer-review
    if hasUnlearnedSkill     and sessionIndexInWeek == 0: vocabulary
    if sessionIndexInWeek % 3 == 2: mixed-retrieval
    if cluster is vocabulary-heavy: alternate vocabulary / concept-review
    if cluster is case-heavy:       alternate concept-review / case-practice
    else:                           alternate concept-review / case-practice
```

Weekend sessions alternate `mixed-retrieval` / `case-practice` by week parity. If a test date is supplied, each week also gets a human-readable date range computed backward from it. The model receives session **labels, durations, and types** as fixed facts — its only job is to fill in a focus sentence and 2–3 tasks per slot; it cannot add, remove, or retype sessions.

---

## 4. The Stage-3 prompt skeleton

The prompt is one assembled string with four parts, in order. Everything except the fixed instructional scaffolding is interpolated data from Stages 1–2 — nothing in the prompt is invented at request time beyond the scaffolding text itself.

**1. Fixed role and constraint preamble.** States the model's role (interpretation and instructional sequencing, not analysis) and hard constraints: do not re-narrate raw scores, do not invent external resources not present in the retrieved content, do not alter session types/durations/cluster structure, use only Stage 2's vocabulary/misconceptions/case archetypes.

**2. Per-output-section writing rules.** A short rule per output section describing what belongs in it and what must *not* be duplicated from another (e.g., "cluster narrative explains why it matters; domain narrative explains why the domain is weak; don't repeat the same explanation in both").

**3. The interpolated data payload**, roughly:

```
{
  assessmentState:     completion flags, total response count, flagged-skill count
  studyConstraints:    the user's scheduling inputs (or a default)
  confidenceSignals:   counts of skills per concerning state (misconception /
                        confidenceIssue / repeatedDistractor / fragility) — precomputed
                        so the model narrates confidence behavior, not re-derives it
  topAtRiskVocabulary: deduplicated priority terms from the highest-urgency clusters
  domainSummaries:     DomainSummary[] from Stage 1
  priorityClusters:    PriorityCluster[] — name, urgency, minutes, member skills
                        (id, name, status, accuracy, trend, dominant misconception),
                        plus each cluster's Stage 2 ContentBundle
  scheduleFrame:       ScheduleFrame[] — week number, date label, cluster focus,
                        minutes, and session slots (label, duration, type)
}
```

**4. The output schema and grounding rules.** A literal JSON schema the model must fill exactly (fields and types spelled out, e.g. `readinessLevel: 'early | developing | approaching | ready'`), plus grounding rules: output cluster names must match the provided names; vocabulary must come from the retrieved list, not be invented; every domain with a low score or nonzero deficit count gets a write-up; a resolved-misconception ID, where one exists, is cited alongside its description; a fixed schema-version string is required in the output.

The reference implementation's nine top-level output sections:

| Section | Holds |
|---|---|
| Readiness snapshot | Level, timeline, blockers, one next move |
| Data interpretation | Headline, 3–5 pattern inferences, 2–3 urgent insights |
| Priority clusters (restated) | Why it matters, blocking note, recommended content types |
| Domain study maps | Interpretation, content to know, vocabulary, case types, traps, mastery indicator |
| Vocabulary | Term, definition, why it matters, where it shows up, confusable terms |
| Case patterns | Scenario clues, likely question angle, common mistake |
| Weekly plan (restated) | Week goal, per-session focus + 2–3 tasks, checkpoint question |
| Tactical instructions | Immediate actions, this-week goals, an avoid-list |
| Checkpoint logic | Midpoint check, shift signal, readiness signal |

The section count and names are a content decision, not the structural contract — the contract is "the model receives a schema it must fill exactly, is told what not to duplicate across sections, and cannot invent facts outside the interpolated payload."

Model parameters worth carrying forward as defaults: a low sampling temperature (reference: 0.2) favoring grounded, low-variance output, and a generous token ceiling (reference: ~12k) sized to the schema's breadth. On the response side, validate every required section is present **and non-empty** (not null/empty string/array/object) before persisting — a structurally incomplete response is a failure, not silently accepted with holes.

---

## 5. Constants reference (validated defaults)

| Constant | Value |
|---|---|
| Min attempts before status label applies | `3` |
| Misconception accuracy ceiling | `< 60%` + confidence-issue or repeated-distractor signal |
| Mastered / near-mastery / developing thresholds | `≥80%` / `≥60%` / `≥40%` |
| Min attempts before trend classifies | `6` |
| Trend improving/declining threshold | `±15pp` between half-window accuracies |
| Urgency status weights (misconception/unstable/developing/unlearned/near_mastery/mastered) | `100/80/60/50/20/0` |
| Urgency trend penalties (declining/flat/insufficient/improving) | `20/10/5/0` |
| Urgency confidence-issue / fragility boosts | `+15` / `+10` |
| Cluster minute shares (urgent/important/maintain) | `50%/35%/15%`, renormalized on empty tiers |
| Default study weeks (no date/weeks given) | `8` |
| Intensity multipliers (light/moderate/aggressive) | `0.7/1.0/1.3` |
| Content-bundle caps (vocab/misconceptions/cases/laws) | `20/15/12/8`, post-dedup |
| Model temperature / token ceiling | `0.2` / `~12,000` |
| Required output sections (present + non-empty) | `9` (§ 4) |
| Generation rate limit (successful plans only) | `1 per 7 days` |
| Failure-cooldown gap | `15 minutes` |

---

## 6. Open items for the adopting platform

1. **Content-cluster taxonomy is exam-specific and hand-authored.** Decide whether clusters are authored per exam, derived from each exam's official objective taxonomy, or a small shared set with per-exam relabeling — and who owns keeping the content library (§ 1.2) in sync.
2. **Urgency weights and time-budget shares are untuned constants**, not derived from outcome data. Validate whether one weight table generalizes across exams with different question volumes and skill counts.
3. **Rate-limit windows are cost-driven defaults from a single-model, single-exam cost model.** Re-derive them against the adopting platform's actual per-generation cost and regeneration cadence.
4. **The nine-section output schema is a content decision, not a structural requirement** — the requirement is only "schema-constrained JSON, validated for presence and non-emptiness before persisting." Design a section set to match the target product surface.
5. **Stage 2's content library has no freshness or versioning story** in the reference (static, hand-authored data). A multi-exam platform likely needs an authoring workflow and a way to track which library version a given plan was built from.
6. **The background dispatch/poll pattern (§ 1.3) follows from model latency and output size, not architecture.** If the model call is fast enough to run inline, drop the async machinery; otherwise see the sibling background-function pattern spec.

---

*Extracted from a shipped single-exam study-plan pipeline (deterministic preprocessor, static content library, background-dispatched model synthesis) and cross-checked against its source. Real file/function names are intentionally omitted above; for implementation reference the pattern comes from `src/utils/studyPlanPreprocessor.ts` (Stage 1), `src/data/skill-metadata-v1.ts` (Stage 2), `src/services/studyPlanService.ts` (prompt assembly, dispatch, response parsing), and `api/study-plan-background.ts` (background dispatch, rate limiting, persistence). Values are validated defaults, not immutable constants — the pipeline shape is the contract.*
