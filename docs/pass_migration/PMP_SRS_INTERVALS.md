# Spaced Repetition (Leitner) — Box Intervals & Rules (Generic Spec)

**Purpose.** This document specifies, in vendor-neutral terms, the Leitner-box spaced-repetition (SRS) scheduler: how a reviewable unit moves between boxes, how long each box waits before the unit is due again, and the advance/reset conditions. It is extracted from a working reference implementation and abstracted so it can be reimplemented against a multi-exam platform. No product or exam names are assumed.

The mental model: each reviewable unit sits in a **box** (0…4). Answer it correctly and it moves up a box and waits **longer** before its next review; answer it wrong and it falls **all the way back to box 0** and is due again tomorrow. Higher boxes = better-known = seen less often.

---

## 1. The box intervals

Five boxes, `0…4`. The interval is how many days after a review the unit becomes due again.

| Box | Interval (days until next review) |
|----:|:----------------------------------|
| 0   | 1  |
| 1   | 3  |
| 2   | 7  |
| 3   | 14 |
| 4   | 30 |

`BOX_INTERVALS = [1, 3, 7, 14, 30]`, `MAX_BOX = 4`. A new (never-reviewed) unit is treated as **box 0** → due in 1 day after its first review. Box 4 is the ceiling: a unit at box 4 answered correctly stays at box 4 (waits another 30 days).

---

## 2. Advance & reset conditions

A single rule governs every review:

- **Correct → advance one box** (`newBox = min(box + 1, 4)`). The unit waits the *new, longer* box interval.
- **Wrong → reset to box 0** (`newBox = 0`). Not "drop one box" — a wrong answer sends the unit **all the way back** to box 0 and it is due again in 1 day. This is the classic, unforgiving Leitner reset.

The next due date is always computed from the **new** box: `nextReviewDate = now + BOX_INTERVALS[newBox]`.

### Worked examples
| Current box | Answer | New box | Next due (days) |
|---:|:--|---:|---:|
| 0 | correct | 1 | +3 |
| 1 | correct | 2 | +7 |
| 3 | correct | 4 | +30 |
| 4 | correct | 4 (cap) | +30 |
| 2 | **wrong** | **0** | +1 |
| 4 | **wrong** | **0** | +1 |
| (new/unset) | correct | 1 | +3 |
| (new/unset) | wrong | 0 | +1 |

### Edge cases
- **Unset box.** A `null`/`undefined` box is treated as `0` before the rule is applied.
- **Out-of-range box.** The incoming box is clamped into `[0, 4]` before use, so corrupt or legacy values can't escape the ladder.
- **No partial credit / no confidence weighting.** The only input is the boolean correct/incorrect. Confidence, response time, and hints are **not** inputs to the box move (contrast the mastery model, which does weight confidence).

### A unit's trajectory over time
Following one unit through a streak then a lapse, starting fresh at box 0:

| Review # | Box before | Answer | Box after | Due in | Cumulative day |
|---:|---:|:--|---:|---:|---:|
| 1 | 0 | correct | 1 | +3 | day 0 |
| 2 | 1 | correct | 2 | +7 | day 3 |
| 3 | 2 | correct | 3 | +14 | day 10 |
| 4 | 3 | **wrong** | **0** | +1 | day 24 |
| 5 | 0 | correct | 1 | +3 | day 25 |

After three correct reviews the unit has earned a two-week gap; a single lapse on review 4 collapses it back to daily and the climb restarts. The asymmetry — slow to earn long intervals, instant to lose them — is deliberate: it keeps anything the learner has recently failed in frequent rotation, and only releases a unit to rare review after a sustained correct streak.

---

## 3. The engine contract

The scheduler is a **pure function** — this is the most important portability property:

```
calculateSrsUpdate(currentBox, isCorrect, now) → { newBox, nextReviewDate, lastReviewDate }
```

- **No clock reads.** "Today" is passed in as `now` (an ISO **date-only** string, `"YYYY-MM-DD"`); the engine never calls the system clock. This makes it deterministic and trivially testable (feed a fixed date, assert the result).
- **Date-only granularity.** Intervals are whole days; `nextReviewDate` and `lastReviewDate` are date-only strings. Day arithmetic is done in UTC (`now + N days`) to avoid timezone drift across the date boundary.
- **No side effects.** The function computes the next state; persisting it is the caller's job.

Returned fields: `newBox` (the post-answer box), `nextReviewDate` (when it's due again), `lastReviewDate` (= `now`, when it was just reviewed).

---

## 4. Application & stored state

In the reference, the scheduler is applied **per skill** (the finest-grained progress unit), on **every answer**: the per-skill progress record carries three SRS fields, updated each time the user answers an item for that skill —

| Field | Type | Meaning |
|---|---|---|
| `srsBox` | int `0…4` | current Leitner box |
| `nextReviewDate` | ISO date-only | when the skill is due for review again |
| `lastReviewDate` | ISO date-only | when it was last reviewed |

These live on the per-skill record inside the user profile (alongside the skill's other progress state). There is **one box per skill**, not one per item.

### Shadow-mode status (important)
In the reference, these three fields are currently a **shadow write**: they are computed and persisted on every answer, but **nothing reads them yet** — no selection path schedules reviews off `nextReviewDate`. The Leitner state is being *accumulated* so that a future "due for review" surface can switch on without a backfill. A reimplementation that wants live SRS must add the due-selection step (§ 5); the scheduling math is already specified and correct.

---

## 5. Due selection (the intended consumption)

A unit is **due** when `now >= nextReviewDate`. The intended selection rule for an SRS practice surface:

- Eligible = units whose `nextReviewDate <= today` (overdue or due today). New/unreviewed units (box 0, no `nextReviewDate`) are due immediately.
- Order by **most overdue first** (smallest `nextReviewDate`), so the longest-waiting reviews come up first.
- Serve until a daily quota / time box is hit, or the due set is exhausted.

Because every correct answer pushes a unit into a longer interval and every wrong answer pulls it back to daily, the due set naturally concentrates on the units the learner is worst at, and well-known units resurface rarely (up to once a month at box 4).

---

## 6. Relationship to the mastery model & decay

The SRS scheduler is **separate from** the mastery estimate; they answer different questions:
- The **mastery model** asks "how well does the learner know this?" — a confidence-weighted, probabilistic estimate used for diagnosis and selection scoring.
- The **SRS scheduler** asks "when should this be seen again?" — a coarse, boolean-driven calendar.

They are intentionally decoupled: SRS takes only correct/incorrect (no confidence, no partial credit), while the mastery model weights confidence and more. A platform should not collapse them into one number — a unit can be well-known (high estimate) yet still surface on its monthly box-4 review, and a unit can be due (box 0) without that, by itself, implying a low estimate.

**No score decay.** Note what this scheduler does *not* do: it never lowers a mastery score for time elapsed. "Forgetting" is modeled only as *resurfacing for review* (the box interval), not as silently decaying a number. When the learner returns and misses, the box resets to 0 and the mastery model updates from that observed miss — but absent a review, neither the box nor the estimate drifts on its own. Spaced review **replaces** score-decay rather than supplementing it; this keeps the estimate honest (it only ever moves on real evidence) and pushes the "you haven't seen this in a while" signal entirely into the scheduler.

---

## 7. Notes for a multi-exam reimplementation

- **Two viable box-source designs — pick deliberately.** The reference stores an **explicit incrementing box counter** per skill and moves it by the correct/wrong rule above. An alternative (well-suited to a platform with a probabilistic mastery estimate) is to **derive the box from the mastery mean at selection time** and skip the stored counter entirely — e.g. map mastery-mean bands to boxes and read the interval off the band. The two schemes differ in feel: the counter-based reset-to-0-on-wrong is sharp and memory-like; a mastery-derived box moves gradually with the estimate and never hard-resets. If a platform's SRS mode already derives boxes from mastery, treat that as an intentional divergence from this reference, not a defect — but record which scheme is canonical so the intervals live in one place.
- **The interval ladder is a tunable, not a law.** `[1, 3, 7, 14, 30]` (≈ roughly tripling then doubling, capped at monthly) is one defensible schedule; a geometric `[1, 2, 4, 8, 16]` doubling ladder is another common choice. Keep the ladder a single named constant so it can be tuned (or A/B'd) without touching the move logic.
- **Keep the engine pure and clock-injected.** The `now`-as-parameter, date-only, no-side-effects shape is what makes the scheduler testable and reusable across exams and surfaces. Preserve it; do day math in UTC.
- **Decide the granularity.** The reference schedules **per skill**. A platform may instead schedule **per item** (per flashcard / per question) for finer control, at the cost of more state. Per-skill is cheaper and aligns with mastery tracking; per-item is truer to classic flashcard SRS. Pick one and key the stored box accordingly (per-skill → key on the finest valid diagnostic unit per exam; per-item → key on the item id, scoped by exam).
- **Wire the due-selection step.** If lifting this into a live SRS mode, the missing piece is § 5 — selecting due units by `nextReviewDate`. The reference computes and stores the schedule but does not yet consume it; a live mode must add that read.
