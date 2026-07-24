# Redemption Rounds — Generic Specification

**Status:** Spec extraction (pattern documentation for re-implementation). Full rewrite — a prior version of this doc (2026-06-10) was left uncommitted and is not recoverable; this version is derived directly from the live source, not from that draft.
**Audience:** Engineers building a quarantine / remediation loop for a multi-skill, multi-exam adaptive practice engine.
**Scope:** The state machine for a missed practice item (normal pool → quarantined → cleared), the redemption queue's entry/exit/serving rules, the credit economy gating queue access, and the storage shape needed to support all of it — abstracted from a working single-exam reference implementation into pure, exam-agnostic rules.

This is a **specification of behavior**, not a transplant of code. Every rule below is a validated default from a shipped implementation; re-tune the numeric constants freely, but the *shape* — two independent entry paths, cumulative no-reset clearance, full-bank-pass credits — is the contract.

Capabilities served: **C3 — Deep misconception analysis**, **C4 — Adaptive practice across supported modes**. C4's contract map lists a "quarantine set" as required PASS runtime data; C3 names this remediation loop as a consumer of per-distractor misconception data. This doc specifies the mechanics a "quarantine and redeem" mode needs; it does not resolve any numbered gap in `00_PRODUCT_CONTRACT.md`.

---

## 1. The state machine

Every practice item, per user, occupies exactly one of three states, derived from two booleans on a per-(user, item) record rather than a separate enum column — **no state-name field; the combination of two flags *is* the state.**

| State | Flags | Meaning |
|---|---|---|
| **Normal pool** | no record, or record with quarantine=false, cleared=false | Eligible for ordinary adaptive selection |
| **Quarantined** | quarantine=true, cleared=false | Excluded from ordinary selection; reachable only via the redemption queue |
| **Cleared** | quarantine=false, cleared=true | Redeemed; back in ordinary eligibility. Miss history is retained, not deleted |

### 1.1 Entry into quarantine — two independent paths

**Path A — miss threshold.** Every wrong answer in ordinary (non-quarantine) practice increments a lifetime wrong-answer counter for that (user, item). On the counter's **third** increment, quarantine flips true. The first two misses only advance the counter.

**Path B — hint use.** Consuming a hint on an item quarantines it **immediately on advancing to the next item** — independent of the miss counter, even on a first-ever encounter (counter still at zero). A hint is a stronger, instant signal; it does not wait for a third miss.

A hint-triggered entry never resets the miss counter — an item with two prior misses that is then hint-quarantined keeps its counter at two; only `entry_reason` is overwritten. Rule to preserve: **quarantine writes must never clobber the miss counter**, regardless of path.

A third source feeds the same counter without triggering quarantine alone: wrong answers during the *initial diagnostic* increment the lifetime counter but never evaluate the threshold — quarantine only follows from a later *practice* miss that itself crosses it. Decide deliberately whether diagnostic misses should count toward quarantine at all, rather than inheriting this asymmetry.

### 1.2 Quarantine is the single exclusion signal

The quarantine flag is the **only** signal that removes an item from ordinary adaptive selection — no separate "hidden" or "suppressed" flag layered on top. Every consumer that builds a normal-practice pool must filter on this one field. Route all "don't serve this normally right now" logic through it; a second, parallel suppression flag will let the pools drift out of sync.

### 1.3 Clearance — cumulative, no reset, always three

While quarantined, an item is reachable only through redemption sessions (§ 2). Each **correct** answer inside a redemption session increments a correct-answer counter by one. Each **incorrect** answer inside a redemption session leaves that counter untouched — no decrement, no reset. Clearance requires the counter to reach **three**, cumulative across however many sessions it takes — not three in a row, not three within one session. A user who answers right/wrong/right/wrong/right across four sessions spread over weeks clears on that fifth answer, same as three in a row.

On the answer that reaches three, the item transitions atomically: quarantine → false, cleared → true, clearance timestamp stamped. There is no confidence-based shortcut; a "high confidence" correct answer clears at the same rate as any other.

### 1.4 Re-entry after clearance

Clearance is not permanent. A cleared item missed again in ordinary practice re-enters the Path A counting exactly like a never-quarantined item, but its historical miss count is retained rather than restarted — an item cleared once at a miss count of three can be re-quarantined off a single additional miss. A hint on a cleared item force-quarantines immediately, same as § 1.1.

**A corner case worth flagging, not silently inheriting:** the reference's hint-entry write resets the correct-answer counter and cleared flag on re-quarantine (a clean reopen), but the miss-threshold write does **not** touch the cleared flag when it flips quarantine back true. That can leave both flags set simultaneously — not one of the three canonical states — and silently drop the item from any queue query that also filters on cleared=false. Derive one flag from the other, or use a clearance timestamp instead of a boolean.

---

## 2. The redemption queue

**What enters.** The queue is not a persisted ordered list — it is computed on demand as every item currently quarantined (quarantine=true, cleared=false) for the user. No per-item priority, recency, or skill weighting is applied at read time.

**What exits.** An item leaves the moment it clears (§ 1.3); it is simply excluded from the next "quarantined" read. Items do not expire by time — no TTL, no forced skip-after-N-sessions, no manual dismissal. The only exit is clearance.

**Serving order.** A "round" is: consume one credit (below), fetch the **entire** current queue in one read, and serve it as one continuous session in a **freshly shuffled order** — not insertion order, priority order, or a partial slice. Empty queue or zero credits ⇒ no round starts, no credit spent. **One credit buys one full pass through the current bank**, whatever size it is — a 3-item bank and a 40-item bank cost the same one credit. The snapshot is taken at round start, so an item quarantined mid-round is not retroactively added; it appears next round.

Within a round: a fixed per-item countdown (90s default); **no feedback, explanation, or hint** between items — the session advances immediately on submit or timeout; timeout scores as incorrect, same as an explicit wrong answer (a skip is not neutral); correctness is evaluated only for **single**-correct-answer items — a multi-correct item can never score correct in a round under this rule, regardless of selection. An adopting platform wanting multi-select items to be redeemable must define that scoring explicitly.

Results are written only **after the round ends**, all at once, alongside one round-summary record and a personal-best check (highest single-round score %, independent of clearance). Exiting early does not refund the credit; only items actually attempted are scored, the rest stay quarantined and unaffected.

**Credit economy.** Credits gate *starting* a round, not answering any item. A credit balance is earned from ordinary non-quarantine practice: a fixed number of non-hint answers (20 default) earns one credit, via a running counter that carries its remainder past each threshold crossing. Hint-driven answers do not advance this counter — the same action that force-quarantines an item is excluded from the metric that funds the queue used to clear it, a deliberate anti-gaming shape worth preserving: **1 credit = 1 full pass through the entire redemption bank**, funded by ordinary practice volume, spent atomically at round start, never refunded, never partially consumed.

---

## 3. Storage shape

Three storage surfaces. Names below are generic; see the source footnote for the concrete identifiers.

**A — per-(user, item) quarantine record.** One row per user per item that has ever entered quarantine (created lazily on first miss/hint, not pre-populated). Required fields:

| Field (generic) | Type | Purpose |
|---|---|---|
| user id / item id | id | Owner and target |
| skill id | id, nullable | Optional tag; surfaced as "which skills currently have quarantined items" |
| wrong-answer counter | int | Lifetime miss count feeding Path A; never reset by a hint-triggered entry |
| entry reason | enum (`miss_threshold` \| `hint`) | Which path most recently triggered quarantine — diagnostic only, not part of the state machine |
| quarantine flag | bool | Single source of truth for exclusion (§ 1.2) |
| correct-answer counter | int | Cumulative, no-reset progress toward clearance (§ 1.3); reset on hint-triggered re-entry |
| cleared flag | bool | True once the correct-answer counter reaches three |
| cleared timestamp | datetime, nullable | Set atomically with the cleared flag |
| first-missed timestamp | datetime | Audit / record age |

A **uniqueness constraint on (user, item)** is required — this is an upsert target, not an append-only log.

**B — round-history record.** One row per completed round: user id, timestamp, items attempted, items correct, score percentage. Write-once, append-only; supports the personal-best readout and optional longitudinal reporting. No per-item detail — that lives only in surface A's running counters.

**C — credit-ledger fields on the user profile.** Three scalars, not a table: current credit balance (decremented at round start, incremented in bulk when the practice-answer counter crosses threshold), a running non-hint-answer counter (holds the remainder after each award), and a personal-best score percentage.

**D — one atomic increment operation.** Path A's miss counting must be a single atomic upsert, not read-then-write — two near-simultaneous miss events must not both read a stale pre-increment value. It takes (user, item, skill) and returns the post-increment counter and quarantine flag in one round trip, so callers can update an in-memory exclusion set without a second read. Path B's hint entry lacks this guarantee in the reference (a select-then-branch-then-write sequence); under higher concurrency, consider making it equally atomic, given the reopen behavior in § 1.4.

> **Source (implementation reference only — not part of the spec):** surface A is `practice_missed_questions` (unique on `user_id, question_id`; columns `wrong_count`, `entry_reason`, `in_redemption`, `correct_count`, `redeemed`, `redeemed_at`, `missed_at`); surface B is `redemption_sessions` (`questions_attempted`, `questions_correct`, `score_pct`); surface C is `redemption_credits`, `practice_questions_since_credit`, `redemption_high_score` on `user_progress`; surface D is the `increment_wrong_count(p_user_id, p_question_id, p_skill_id)` Postgres RPC (`supabase/migrations/0013_redemption_v2.sql`, on top of `supabase/migrations/0009_redemption_rounds.sql`). Orchestration: `src/hooks/useRedemptionRounds.ts`; round UI (90s timer, no-feedback advance, single-select scoring): `src/components/RedemptionRoundSession.tsx`.

---

## 4. Constants reference (validated defaults)

| Constant | Value |
|---|---|
| Miss-threshold entry (Path A) | 3rd lifetime wrong answer |
| Hint entry (Path B) | Immediate, on advance to next item |
| Clearance threshold | 3 correct answers, cumulative, no reset on a wrong answer |
| Clearance shortcut | None — always exactly 3, no confidence-based fast path |
| Credit cost per round | 1 credit = 1 full pass through the entire current queue |
| Credit earn rate | 20 non-hint practice answers = 1 credit (hint answers excluded) |
| Per-item timer in a round | 90 seconds; expiry scores as incorrect (a skip, not neutral) |
| Round feedback | None between items; results applied only at round end |
| Round order | Full shuffle of the queue snapshot taken at round start |
| Scorable item shape | Single-correct-answer items only |

---

## 5. Open items for the adopting platform

1. **Diagnostic-miss vs. practice-miss asymmetry (§ 1.1).** Diagnostic wrong answers share the lifetime counter with practice misses, but only a practice-phase miss can cross the threshold and flip quarantine. Decide deliberately whether diagnostic misses should count toward quarantine, count fully, or be excluded.
2. **Simultaneous quarantine+cleared state (§ 1.4).** The miss-threshold re-entry path can leave both flags true, silently dropping the item from any queue query filtering on cleared=false. Close this before re-implementing — derive one flag from the other, or use a clearance timestamp instead of a boolean.
3. **Clearance-model reconciliation.** A prior version of this document reportedly characterized the reference as **cumulative, no-reset correct answers (3 total while quarantined, not required consecutive) and two independent entry paths (miss-threshold and hint)**. This rewrite independently re-confirms both directly from `useRedemptionRounds.ts` (§ 1.1, § 1.3). Whoever finalizes PASS's own redemption design should explicitly reconcile PASS's already-built module against this reference — a consecutive/reset-on-wrong clearance rule, or a single entry path, would be a deliberate divergence worth a DECISIONS entry, not unnoticed drift. This document does not verify PASS's current implementation.
4. **Multi-select scoring in a round (§ 2).** The reference cannot score a multi-correct-answer item as correct inside a round at all. If the adopting item bank includes multi-select items that should be redeemable, an explicit scoring rule must be added.
5. **No priority ordering in the queue (§ 2).** The reference applies no skill, recency, or difficulty weighting — a flat set, shuffled each round. A platform wanting to bias redemption toward specific skills must add that ordering; none exists to inherit.

---

*Extracted from a shipped single-exam redemption/quarantine implementation (hook, session component, migrations 0009 + 0013); no dedicated test suite for this feature was located, so — unlike the adaptive-engine spec — these rules are corroborated by source reading alone. Values are validated defaults, not immutable constants; re-tune against your own cohort.*
