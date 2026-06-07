# Adaptive Engine Math — Generic Specification

**Status:** Spec extraction (pattern documentation for re-implementation).
**Audience:** Engineers building a multi-skill adaptive practice engine from scratch.
**Scope:** The per-skill mastery state, the proficiency thresholds, the mastery-update math, the runtime-signal model, the (absence of a) decay model, the adaptive diagnostic algorithm, and the selection-priority model — all abstracted from a working single-exam reference implementation into pure, exam-agnostic rules.

This document is a **specification of behavior**, not a transplant of code. Every value below is a validated default drawn from a shipped implementation; an adopting system may re-tune them, but the *shape* of the rules is the contract. All math is given as pseudo-code.

Capabilities served (for the adopting platform's contract): **C1 — adaptive initial diagnostic**, **C2 — multi-signal efficiency measurement**. This doc closes the "mastery-update inputs" and "diagnostic algorithm depth" specification gaps for those capabilities.

---

## 1. The per-skill mastery state

The engine tracks one mastery record per `(user, skill)` pair. For a multi-exam platform this generalizes to `(user, exam, skill)` with no change to the math — the record is simply keyed more finely, and "skill" means the **finest tagged diagnostic unit** for that exam (a leaf microskill, or the finest layer the item bank actually tags).

A mastery record holds:

| Field | Type | Meaning |
|---|---|---|
| `score` | float 0–1 | Lifetime accuracy ratio (`correct / attempts`). |
| `attempts` | int | Total counted attempts (after dedup — see § 3). |
| `correct` | int | Total counted correct. |
| `consecutiveCorrect` | int | Current unbroken correct streak. |
| `history` | bool[] | The last N results (N = 5 in the reference), most-recent last. |
| `attemptHistory` | record[] | Bounded raw per-attempt log (last 20), each carrying `correct`, `confidence`, `timeSpent`, `questionId`, `source`. |
| `weightedAccuracy` | float 0–1 | Confidence-weighted accuracy (see § 3.2). The *effective* mastery value when present. |
| `learningState` | enum | Coarse progression label: `emerging → developing → proficient → mastery`. |
| `srsBox` | int 0–4 | Spaced-repetition box (see § 5). |
| `nextReviewDate` | date | When this skill is next due. |

An adopting engine that wants an explicit uncertainty term (e.g. a Bayesian variance) should add a `variance`/`confidenceInterval` field; the reference implementation encodes uncertainty implicitly through `attempts` and `consecutiveCorrect` rather than a closed-form interval. See § 8 for how to map this state onto a Bayesian formulation.

---

## 2. Proficiency thresholds

Two threshold systems coexist and serve different purposes.

### 2.1 Three-tier proficiency (display + readiness)

A point-in-time classification from the effective accuracy:

```
DEMONSTRATING_THRESHOLD = 0.80
APPROACHING_THRESHOLD   = 0.60

proficiency(score, attempts, weightedAccuracy):
    if attempts == 0:            return UNSTARTED
    effective = weightedAccuracy if present else score
    if effective >= 0.80:        return DEMONSTRATING   # "proficient"
    if effective >= 0.60:        return APPROACHING
    return EMERGING
```

The boundaries are inclusive at the lower edge (exactly `0.80` is Demonstrating; exactly `0.60` is Approaching). **`weightedAccuracy` takes precedence over raw `score`** when available — this is the single most important design choice in the model, because it is how a runtime signal (self-reported confidence) reaches the user-visible mastery tier (see § 3.2).

**Readiness goal.** Exam-readiness is defined as reaching Demonstrating on a fixed fraction of all skills:

```
READINESS_GOAL = 0.70          # 70% of skills at Demonstrating
READINESS_TARGET = ceil(TOTAL_SKILLS * 0.70)
```

### 2.2 Four-tier learning state (progression gate)

A stricter, streak-and-recency-aware label used internally to gate progression. It requires a minimum of **3 attempts** before it will classify above emerging:

```
learningState(score, consecutiveCorrect, history):
    if attempts < 3: return EMERGING

    # MASTERY
    if score >= 0.85 and consecutiveCorrect >= 5
       and last5(history) has >= 4 correct
       and prerequisites_met:           return MASTERY

    # PROFICIENT
    if score >= 0.75 and consecutiveCorrect >= 3
       and last3(history) has >= 2 correct:   return PROFICIENT

    # DEVELOPING
    if score >= 0.60 or consecutiveCorrect >= 2
       or any(history) correct:               return DEVELOPING

    return EMERGING
```

The two systems are intentionally different: the three-tier system answers "how accurate is the user *right now*" (used for dashboards and readiness counts); the four-tier system answers "has the user *durably demonstrated* this skill" (used to stop drilling a mastered skill and to gate prerequisite unlocks). An adopting platform should keep both ideas — a soft accuracy band and a hard, streak-gated mastery state — even if it merges them into one richer estimate.

---

## 3. Mastery-update math

### 3.1 The base update — deduplicated running accuracy

The reference engine does **not** use an Elo or single-step Bayesian update. It maintains a running ratio with **question-level deduplication**: a given question contributes at most one outcome to a skill, and the most recent answer wins. This prevents the same item, seen in two contexts (e.g. a module quiz and free practice), from double-counting.

```
on_answer(skill, questionId, isCorrect):
    outcomes = skill.questionOutcomes            # map: questionId -> latest bool
    outcomes[questionId] = isCorrect             # latest answer overwrites

    dedupedAttempts = count(outcomes)
    dedupedCorrect  = count(v for v in outcomes if v == true)

    skill.attempts = legacyAttempts + dedupedAttempts   # frozen pre-dedup baseline
    skill.correct  = legacyCorrect  + dedupedCorrect
    skill.score    = skill.correct / skill.attempts  (0 if attempts == 0)

    update consecutiveCorrect, history (window 5), attemptHistory (bounded 20)
```

Notes for re-implementation:
- **Latest-wins** means a skill score can *drop* when a previously-correct item is later answered wrong — this is deliberate; it reflects current state, not cumulative trophies.
- A `legacy*` baseline lets a system migrate from a pre-dedup history without rewriting it; greenfield systems can omit it (set to 0).
- Attempts with no stable question identity (e.g. synthetic/manual items) get a synthetic key so they always count separately.
- **The base update does not weight by item difficulty / cognitive complexity.** Difficulty enters elsewhere: through which items the selector chooses (§ 6) and through the diagnostic's complexity sequencing (§ 5). An adopting platform whose contract calls for complexity-weighted mastery should add that weight here, in the ratio's numerator/denominator, and document the multiplier.

### 3.2 The confidence-weighted accuracy (the multi-signal layer)

Alongside the raw ratio, the engine computes a **confidence-weighted accuracy** over the attempt history. Each attempt is weighted by the interaction of *self-reported confidence* and *correctness*:

```
confidenceWeight(confidence, isCorrect):
    high & correct  -> 1.2     # true mastery — counts extra
    high & wrong    -> 0.5     # misconception — penalized (the answer was confidently wrong)
    low  & correct  -> 0.8     # shaky / likely guess — counts less
    low  & wrong    -> 1.0     # expected gap — neutral
    medium (either) -> 1.0     # neutral

weightedAccuracy(attemptHistory):
    totalWeight   = sum(confidenceWeight(a.confidence, a.correct) for a in history)
    correctWeight = sum(confidenceWeight(a.confidence, a.correct) for a in history if a.correct)
    return correctWeight / totalWeight   (0 if empty)
```

Because `weightedAccuracy` takes precedence in § 2.1, this is **how confidence becomes a mastery input**: a confidently-wrong answer (weight 0.5) drags the effective tier down harder than a low-confidence wrong answer (weight 1.0), and a confidently-correct answer (weight 1.2) lifts it. This is the concrete answer to "is confidence a mastery signal, and how is it weighted" — yes, multiplicatively, through a weighted accuracy that overrides the raw ratio for tier classification.

---

## 4. Runtime signals — what feeds mastery, what does not

This section is the crux of "multi-signal efficiency measurement." The reference implementation treats the available runtime signals very differently, and an adopting platform should copy this *discipline*, not just the weights:

| Signal | Feeds the mastery estimate? | How |
|---|---|---|
| **Correctness** | Yes | Base ratio (§ 3.1). |
| **Self-reported confidence** | **Yes** | Via confidence-weighted accuracy, which overrides raw score for tiering (§ 3.2). |
| **Response time** | **No (shadow mode)** | A "rapid guess" is `0 < timeSpent < 4s`. It is computed and logged but **not** wired into score or label — held for cohort validation before activation. |
| **Hint usage** | **No** | Not consumed by mastery or priority in the reference. (An adopting platform may add a rule such as "hint ⇒ the item cannot raise mastery this attempt"; document it explicitly if so.) |

The strong recommendation extracted here: **introduce each new runtime signal in shadow mode first** — compute it, log it, validate that it correlates with outcomes over a real cohort, and only then wire it into the score. Signals that have not earned their place (here: response time, an "uncertain skill" flag) are computed but explicitly inert. This prevents the engine from adapting to noise — a signal the engine cannot yet trust must not move mastery.

---

## 5. Decay model

**There is no time-based decay of the mastery score.** `score` and `weightedAccuracy` are constant between answers; elapsed time never degrades them directly. This is a deliberate choice: decayed numbers are hard to explain to a user ("why did my mastery drop while I slept?").

Time-awareness is instead delivered through **spaced repetition**, which changes *what the engine surfaces*, not the stored mastery value. A Leitner-box scheduler assigns each skill a box and a next-review date:

```
BOX_INTERVALS (days) = [1, 3, 7, 14, 30]    # boxes 0..4
MAX_BOX = 4

srsUpdate(currentBox, isCorrect, today):
    box     = clamp(currentBox or 0, 0, 4)
    newBox  = min(box + 1, 4) if isCorrect else 0   # any wrong answer resets to box 0
    nextReviewDate = today + BOX_INTERVALS[newBox] days
    return {newBox, nextReviewDate, lastReviewDate: today}
```

| Box | Interval after a correct answer |
|---|---|
| 0 | 1 day |
| 1 | 3 days |
| 2 | 7 days |
| 3 | 14 days |
| 4 | 30 days (capped) |

A single wrong answer hard-resets to box 0 (review tomorrow). Overdue reviews then raise selection priority (§ 6, Rule 3). An adopting platform that genuinely needs score decay should layer it on top of — not in place of — this scheduler, and keep it separately toggleable.

---

## 6. Selection-priority model

Between sessions, the engine ranks skills by an **additive priority** to decide what to serve next. Priority is a small sum of a base term (accuracy band) and signal-driven boosts:

```
priority(skill):
    if attempts == 0: return 2          # unstarted skills get a mid baseline

    base:
        score < 0.60 -> +3              # emerging — most urgent
        score < 0.80 -> +2              # approaching
        else         -> +1              # demonstrating — least urgent

    Rule 1 — recent confidently-wrong (last-10 window):
        count >= 2 -> +2.0
        count == 1 -> +1.0

    Rule 2 — fragility (correct-but-low-confidence):
        if last-6 window has >= 50% low-confidence-correct (needs >= 6 attempts) -> +1.0

    Rule 3 — SRS overdue:
        if nextReviewDate <= today -> +1.5

    return sum
```

Two derived selection behaviors:
- **Weakest-skill targeting:** take the top fraction (≈30%) of skills by priority as the focus set.
- **Within a session,** bias item draw toward the focus set (≈70% from weakest domains, ≈30% exploratory) so the user still sees occasional non-focus items (interleaving, anti-tunnel-vision).

Note that Rules 1 and 2 are *the same confidence signal* used in § 3.2, but here they steer **what to practice** rather than **the mastery value** — a clean separation worth preserving: signals inform both *the estimate* and *the schedule*, but through distinct, independently-tunable paths.

---

## 7. Adaptive diagnostic algorithm

The initial calibration ("diagnostic") establishes a first mastery estimate across every skill. Its structure:

- **Initial queue:** exactly **one item per skill**, interleaved by domain so the user does not face a long run of one topic.
- **Follow-up pool:** 1–2 reserve items per skill, prepared up front.
- **Adaptive rule:** a follow-up is queued **only when a skill's item is answered wrong**, capped at **3 items per skill** (1 initial + up to 2 follow-ups). A second follow-up is reached only if the first follow-up is also wrong.
- **Complexity sequencing:** follow-ups alternate cognitive complexity relative to the prior item (e.g. `Recall ↔ Application`) when the pool allows — so a missed recall item is probed with an application item and vice-versa, distinguishing a shallow slip from a deep gap.
- **Length:** ranges from one-per-skill (all correct → ≈ `TOTAL_SKILLS` items) to roughly `2–3× TOTAL_SKILLS` when many skills miss (the reference caps near ~90).
- **Stopping:** the diagnostic ends when the queue (including queued follow-ups) is exhausted, with full resume-from-storage support.

**Honest gap for the adopter:** there is **no confidence-interval or attempt-count "probe deeper vs move on" threshold** in the reference diagnostic — the follow-up rule is purely "wrong ⇒ one more, up to 3." A platform whose contract demands true confidence-driven stopping (continue probing a skill until its uncertainty falls below a threshold, rather than a fixed cap of 3) must specify that threshold itself; the cap-of-3 heuristic is the validated baseline to start from. If an explicit uncertainty term is added to the state (§ 8), the natural upgrade is: "queue a follow-up while `variance > τ` and `items_for_skill < hardCap`."

---

## 8. Mapping to a Bayesian / multi-exam formulation

For a platform whose target design is an explicit Bayesian per-skill estimate `(mean, variance)` rather than a running ratio, the reference math maps cleanly:

- **Mean** ← the confidence-weighted accuracy (`weightedAccuracy`); the raw ratio is its unweighted special case.
- **Per-attempt likelihood weight** ← the `confidenceWeight` table (§ 3.2) is exactly a per-observation reliability weight; reuse it as the weight on each Bernoulli observation.
- **Priors from item difficulty / cognitive complexity** ← fold the item's complexity into the prior or the observation weight (the one place the reference deliberately leaves open).
- **Variance / uncertainty** ← derive from effective attempt count (`Σ weights`); few high-reliability observations ⇒ high variance ⇒ the diagnostic keeps probing (§ 7) and the selector keeps surfacing the skill (§ 6).
- **Proficiency bands** (`0.80`, `0.60`) ← reuse as posterior-mean cutoffs; the streak-gated four-tier `mastery` rule (§ 2.2) becomes "posterior mean ≥ 0.85 **and** variance below a confidence floor."
- **Multi-exam keying** ← everything is per-skill; key the record by `(user, exam, skill)` and the entire model is unchanged. Microskill identifiers should be exam-namespaced so the same code path serves any exam.

---

## 9. Constants reference (validated defaults)

| Constant | Value |
|---|---|
| Demonstrating threshold | `0.80` |
| Approaching threshold | `0.60` |
| Readiness goal | `0.70` of skills at Demonstrating |
| Mastery (4-tier): score / streak / recent | `≥0.85` / `≥5` / `≥4 of last 5` |
| Proficient (4-tier): score / streak / recent | `≥0.75` / `≥3` / `≥2 of last 3` |
| Developing (4-tier): score / streak | `≥0.60` / `≥2` |
| Min attempts before state classifies | `3` |
| Confidence weights (HC-correct / HC-wrong / LC-correct / LC-wrong / med) | `1.2 / 0.5 / 0.8 / 1.0 / 1.0` |
| Recent-confidently-wrong window | last `10` attempts |
| Fragility window / threshold / min attempts | last `6` / `≥50%` / `≥6` |
| Rapid-guess threshold (shadow only) | `< 4s` (and `> 0`) |
| History window / attempt-history bound | `5` / `20` |
| SRS box intervals (days) | `[1, 3, 7, 14, 30]`, max box `4`, wrong → box `0` |
| Priority base (emerging / approaching / demonstrating) | `+3 / +2 / +1` |
| Priority boosts (HCW≥2 / HCW=1 / fragility / SRS overdue) | `+2.0 / +1.0 / +1.0 / +1.5` |
| Focus-set / in-session draw split | top `~30%` / `~70%`–`30%` |
| Diagnostic: items per skill (initial / max) | `1` / `3`; follow-up on wrong only |

---

## 10. Open items for the adopting platform

1. **Difficulty/complexity weighting of the mastery update** is intentionally unspecified in the reference (the base ratio is unweighted). A platform whose contract requires complexity-weighted mastery must define that weighting (§ 3.1).
2. **Confidence-interval-driven diagnostic stopping** is not in the reference (fixed cap of 3). Specify a true uncertainty threshold if the diagnostic must probe to a target confidence (§ 7).
3. **Runtime signals beyond confidence** (response time, hint use) are shadow-mode or unused. Validate before wiring them into the estimate (§ 4) — do not adapt the engine on a signal it cannot yet trust.
4. **An explicit `variance` term** is recommended for a Bayesian target (§ 8); the reference encodes uncertainty implicitly via attempts and streaks.

---

*Extracted from a shipped single-exam adaptive engine and its test suite; all thresholds are corroborated by that suite. Values are validated defaults, not immutable constants — the rule shapes are the contract; re-tune the numbers against your own cohort.*
