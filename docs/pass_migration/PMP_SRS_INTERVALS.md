# SRS Intervals — Leitner-Box Scheduler — Generic Specification

**Status:** Spec extraction (pattern documentation for re-implementation).
**Audience:** Engineers building a multi-skill spaced-repetition / retention scheduler for a multi-exam adaptive practice engine.
**Scope:** The per-skill Leitner-box scheduler — box definitions, day-intervals, advance/reset rules, the pure clock-injected update function, and, most worth reading carefully, exactly how much the computed schedule is consumed by the wider engine today. This is a deeper treatment of the scheduler summarized in `PMP_ADAPTIVE_ENGINE_MATH.md` § 5 ("Decay model") and referenced in that doc's § 6 selection-priority model (Rule 3). Read the two together; this doc corrects one place where that summary undersold the current wiring.

This document is a **specification of behavior**, not a transplant of code. Every value below is a validated default corroborated by the reference implementation's own unit-test suite; an adopting system may re-tune the numbers, but the *shape* of the rules is the contract. All math is given as pseudo-code.

Capabilities served: **C4 — Adaptive practice across supported modes**, which names "SRS box state" explicitly as required runtime data in `00_PRODUCT_CONTRACT.md` § 3. Secondarily **C2 — Multi-signal efficiency measurement**, since the overdue-review flag is one of the additive terms in the selection-priority function `PMP_ADAPTIVE_ENGINE_MATH.md` § 6 summarizes.

---

## 1. The Leitner-box model, in brief

A Leitner box scheduler assigns every tracked skill a small integer "box" (its current review-confidence tier) and a "next review date" computed from that box. A correct answer promotes the skill to a higher box and pushes its next review further out; a wrong answer demotes it, shortening the interval before it is due again — a proxy for retention, where skills the learner keeps getting right are reviewed less often and skills that keep slipping are reviewed more often. This reference implementation uses **5 boxes (0–4)** with day-intervals **`[1, 3, 7, 14, 30]`**, indexed by box number.

---

## 2. State fields

The scheduler extends the per-skill mastery record already defined in `PMP_ADAPTIVE_ENGINE_MATH.md` § 1 — not a separate store. Three fields are added:

| Field | Type | Meaning |
|---|---|---|
| `srsBox` | int, 0–4 | Current Leitner box. Absent on a skill with no attempts yet. |
| `nextReviewDate` | date, ISO date-only (`YYYY-MM-DD`) | When this skill is next due for spaced review. |
| `lastReviewDate` | date, ISO date-only | The date of the most recent scored answer for this skill (always equal to "today" at the moment of that answer). |

A skill never answered has none of these three fields set. The update function (§ 4) treats an absent, `null`, or out-of-range box as box 0 the first time it runs — there is no separate "initialize" step.

---

## 3. Box → interval table

What happens to a skill's box and next-review date, starting from each possible box, depending on whether the answer was correct:

| Box (before answer) | If answered **correctly** | If answered **incorrectly** |
|---|---|---|
| 0 | Advance → box 1; next review in **3 days** | Stay at box 0; next review in **1 day** |
| 1 | Advance → box 2; next review in **7 days** | Hard reset → box 0; next review in **1 day** |
| 2 | Advance → box 3; next review in **14 days** | Hard reset → box 0; next review in **1 day** |
| 3 | Advance → box 4 (max); next review in **30 days** | Hard reset → box 0; next review in **1 day** |
| 4 (max) | Stay at box 4 (capped); next review in **30 days** | Hard reset → box 0; next review in **1 day** |

Read this as: the interval applied is always the interval **of the box the skill lands in**, not the box it started in. A correct answer from box 0 lands the skill in box 1, so it is scheduled 3 days out (box 1's interval), not 1 day out (box 0's interval).

---

## 4. Advance / reset pseudocode

```
BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30]     # index = box, 0..4
MAX_BOX = 4

computeNextReview(currentBox, isCorrect, today):
    box    = clamp(currentBox ?? 0, 0, MAX_BOX)
    newBox = isCorrect ? min(box + 1, MAX_BOX) : 0
    nextReviewDate = today + BOX_INTERVALS_DAYS[newBox] days
    return { newBox, nextReviewDate, lastReviewDate: today }
```

Design notes, each a deliberate choice worth preserving:

- **Pure, clock-injected function.** `today` is passed in as an ISO date-only string; the function never reads the system clock — purely for testability. The reference's test suite exercises every transition and interval by injecting fixed dates, with no `Date.now()` mocking.
- **Missing state defaults to box 0.** `undefined`/`null` currentBox is treated as 0, so a skill's first answer produces a valid schedule with no bootstrap step.
- **Out-of-range input is clamped, not rejected.** A negative box or a box above 4 is clamped into `[0, 4]` before the transition applies, so corrupted or legacy data self-heals on the next answer.
- **Any wrong answer is a hard reset to box 0** — no partial demotion (e.g., box 4 → box 3). A single miss after four consecutive correct answers costs the entire accumulated interval.
- **Date-only granularity.** Multiple same-day answers all resolve `lastReviewDate` to that day; the scheduler never stores timestamps.

---

## 5. When the update runs, and where the state lives

**Trigger.** The update runs on every scored answer that touches a skill's mastery record, regardless of origin — regular practice, a learning-module's embedded quiz, the legacy screener, or the adaptive diagnostic. There is no source-based exemption: the schedule advances even during a user's first diagnostic pass.

**Persistence.** The three SRS fields live inline inside the same per-skill mastery record described in `PMP_ADAPTIVE_ENGINE_MATH.md` § 1 — no separate SRS table, review-queue collection, or discrete database columns. The whole mastery record is one entry in a JSON map persisted on the user's row. An adopting platform may normalize this into real columns, but should preserve "one scheduler record per `(user, exam, skill)`."

**Granularity.** The scheduler operates at **skill grain, not item grain**. "Skill X is due" does not reserve the specific question the learner previously missed — it means the skill re-enters normal adaptive rotation with elevated priority (§ 6), and whichever item the selector would otherwise pick is served. Literal same-item resurfacing is handled, if at all, by a separate per-item mistake-quarantine mechanism documented elsewhere.

---

## 6. How it's wired into selection today — corrected from the brief

Worth double-checking against any prior notes: **this scheduler is not shadow-mode.** It may have been at some earlier point, and that description still lingers in two places in the source — but the computed schedule is actively read in three independent places today.

**Where the stale label survives.** The call site that writes `srsBox`/`nextReviewDate`/`lastReviewDate` is still annotated as a "shadow write — compute and persist, nothing reads these yet," and the type carrying the three fields still describes them as "shadow mode — written but not yet read by UI." Both comments are documentation debt; neither is true of the current codebase.

**What actually consumes `nextReviewDate` today:**

1. **Selection priority.** The shared additive priority function summarized in `PMP_ADAPTIVE_ENGINE_MATH.md` § 6 includes a rule: a skill whose `nextReviewDate` is on or before today gets a flat **+1.5** priority boost — the same function that ranks the weakest-skill focus set (top ~30% by priority) and biases in-session item draw (~70/30 focus/exploratory). An overdue skill genuinely gets served more often, not just flagged.
2. **Dedicated UI surfacing.** The by-skill practice view exposes a filter tab with a live overdue count, a nudge banner ("Spaced Review — N skills due today") that routes into the overdue-filtered view, and a per-skill badge showing the review date.
3. **AI Tutor context.** An "overdue for review" boolean is computed per skill and surfaced in the tutor's system context for the two weaker proficiency tiers, so its coaching can reference due-for-review state, not just accuracy.

**Net assessment.** It is a **soft, additive nudge**, not a hard gate. Overdue status contributes +1.5 where the base accuracy-band term alone can contribute up to +3 — a never-reviewed, still-weak skill generally outranks an overdue-but-stronger one, and there is no "serve the SRS queue first" rule anywhere in the selector. This is real, live-read spaced-repetition signal woven into the general adaptive-selection and UI layers — just not a scheduler that overrides everything else.

---

## 7. Constants reference (validated defaults)

| Constant | Value |
|---|---|
| Number of boxes | 5 (boxes 0–4) |
| Box intervals (days), indexed by box | `[1, 3, 7, 14, 30]` |
| Max box | 4 (capped) |
| Advance rule | correct → `box + 1`, capped at max |
| Reset rule | any wrong answer → hard reset to box 0 |
| Undefined / missing / out-of-range box | clamped or defaulted to box 0 |
| Date granularity | date-only (`YYYY-MM-DD`) |
| Trigger scope | every scored answer, all attempt sources (practice, module quiz, screener, diagnostic) |
| Storage grain | per `(user, exam, skill)` — not per item |
| Selection-priority contribution when overdue | **+1.5**, additive, one term among ~5 |
| Wiring status | **live** in selection priority, by-skill UI, and AI Tutor context — not shadow-mode |
| Corroboration | every transition and interval covered by the reference's own unit-test suite |

---

## 8. Open items for the adopting platform

1. **Retire the "shadow mode" language wherever it's ported.** If onboarding material, comments, or prior planning docs describe this scheduler as shadow-mode or "computed but unread," don't carry that forward — correct it against § 6.
2. **Decide whether overdue-review should become a hard gate rather than a soft additive signal.** Today a weak-but-not-overdue skill's base accuracy-band term can outrank an overdue-but-stronger skill. A retention contract requiring guaranteed spaced-repetition ordering needs to specify that as new behavior.
3. **Decide item-level vs. skill-level resurfacing.** This scheduler reschedules at skill grain only; it does not guarantee the exact missed item returns. Specify how item-level resurfacing, if required, composes with skill-level scheduling and any separate mistake-quarantine mechanism.
4. **Multi-exam keying.** Key the scheduler record by `(user, exam, skill)` from the start — the reference is single-exam and never exercised cross-exam collisions here, unlike the mastery record's explicit multi-exam mapping in `PMP_ADAPTIVE_ENGINE_MATH.md` § 8.
5. **Decide how far to extend SRS surfacing beyond one practice view.** Today the "due" filter, nudge banner, and badges live in a single view; other adaptive modes only feel the scheduler indirectly through the shared priority score.

---

**Source:** `src/utils/srsEngine.ts` (update function, box-interval constant); `src/hooks/useScoreRecalculation.ts` (per-answer call site; source of the stale "shadow write" comment); `src/brain/learning-state.ts` (mastery-record type carrying the SRS fields, incl. the stale "shadow mode" comment); `src/hooks/useAdaptiveLearning.ts` (priority function's overdue-review rule, and the weakest-skill/next-question selection it feeds); `src/components/StudyModesSection.tsx` (due-count filter, nudge banner, per-skill badges); `src/utils/tutorContextBuilder.ts` + `src/types/tutorChat.ts` (AI Tutor overdue-for-review flag); `tests/srsEngine.test.ts` (unit-test suite corroborating § 7); `supabase/migrations/0000_initial_schema.sql` (`skill_scores` JSONB column holding the whole record — no dedicated SRS columns exist).

*Extracted from a shipped single-exam adaptive engine and its test suite; all thresholds are corroborated by that suite. Values are validated defaults, not immutable constants — the rule shapes are the contract; re-tune the numbers against your own cohort.*
