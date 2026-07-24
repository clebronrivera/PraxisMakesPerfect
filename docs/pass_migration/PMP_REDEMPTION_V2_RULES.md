# Redemption Rounds — State Machine & Rules (Generic Spec)

**Purpose.** This document specifies, in vendor-neutral terms, the "Redemption Rounds" quarantine system: a spaced-remediation loop that pulls a learner's repeatedly-missed (or hint-assisted) items out of normal practice, holds them in a quarantine bank, and only releases them after the learner answers each correctly enough times. It is extracted from a working reference implementation (the "v2" rules — a confidence-shortcut-free revision of an earlier v1) and abstracted so it can be reimplemented against a multi-exam platform. No product or exam names are assumed.

The mental model: **miss it enough (or peek at a hint) → it's quarantined → you can only clear it inside a Redemption Round → clear it by getting it right 3 times.** A separate credit economy gates how often rounds can be played.

---

## 1. State transitions

Each item, per learner, moves through a small state machine. The authoritative state is a single boolean, `inRedemption` (true = quarantined). Two more booleans/counters qualify it: `redeemed` (cleared for good), `wrongCount` (lifetime misses), `correctCount` (correct answers accumulated inside rounds), and `entryReason`.

### Entry (how an item becomes quarantined)
There are exactly **two** ways in, plus one explicit non-entry:

1. **Miss threshold — the 3rd wrong answer.** Every *non-hint* wrong answer in normal practice increments the item's `wrongCount` (atomically, server-side). On the **3rd** wrong (`wrongCount >= 3`), the item flips to `inRedemption = true` with `entryReason = "miss_threshold"`. The 1st and 2nd wrongs record the miss but do **not** quarantine.
2. **Hint — immediate quarantine.** Using a hint on an item quarantines it *immediately* (`inRedemption = true`, `entryReason = "hint"`), regardless of `wrongCount`. A hint is treated as "you didn't really know it." Critically, taking a hint on an item that already has misses **must not reset `wrongCount`** — the historical miss count is preserved.
3. **Diagnostic misses never quarantine (explicit non-entry).** Wrong answers during a *diagnostic* (calibration) flow increment `wrongCount` but **never** flip `inRedemption`. Only a *practice* miss that crosses the threshold quarantines. (A diagnostic wrong can still push `wrongCount` toward 3, so a later practice miss can be the one that trips it.)

### Quarantine (the held state)
- `inRedemption = true AND redeemed = false` **is the single source of truth** for "this item is quarantined."
- A quarantined item is **excluded from all normal practice selection** and appears **only** inside Redemption Rounds.
- It stays quarantined until cleared (below).

### Clearance (how an item is released)
- Inside a Redemption Round, each **correct** answer on a quarantined item increments its `correctCount`.
- When `correctCount >= 3`, the item is **cleared**: `redeemed = true`, `inRedemption = false`, `redeemedAt = now`. It rejoins normal practice and never returns to the bank (unless missed 3 more times later).
- **No confidence shortcut.** Clearance is uniformly **3 correct** regardless of the learner's self-reported confidence. (This is the defining v2 change — see § 5.)
- **A wrong answer inside a round does nothing** — it neither clears nor *resets* `correctCount`. Progress is **cumulative across rounds**: an item answered correctly twice in round A and once in round B is cleared in round B. (A reimplementation may deliberately choose a stricter "3 *consecutive* correct, reset on wrong" rule instead — see § 5.)

### State diagram (one item)
```
                 3rd wrong (practice)         3 correct (in rounds, cumulative)
 [normal] ──miss×1,2──▶ [tracked] ───────────▶ [QUARANTINED] ───────────────────▶ [redeemed]
    │                                              ▲   in_redemption=true            in_redemption=false
    └──────────────── hint (immediate) ───────────┘   redeemed=false                redeemed=true
```

---

## 2. The queue (what enters, what exits, in what order)

The "queue" is the quarantine bank — the set of all items with `inRedemption = true AND redeemed = false` for that learner. It is **not** a FIFO; it's an unordered set that is materialized and shuffled per round.

- **Enters:** an item, the moment it hits the miss threshold or is hinted (§ 1).
- **Exits:** an item, the moment its `correctCount` reaches 3 inside a round.
- **Playing a round:** a round is **gated by credits** (§ 3). Starting a round (a) requires `credits >= 1` and a non-empty bank, (b) **consumes exactly 1 credit**, (c) fetches **the entire** quarantine bank, and (d) **shuffles it** (Fisher–Yates) and serves the items in that random order. So **1 credit = one full pass over the whole bank**, not a fixed number of items. If there are no credits or the bank is empty, the round cannot start.
- **Within a round:** the learner answers each served item once; corrects advance `correctCount` (clearing at 3), wrongs are no-ops. At the end, a round-summary record is written (attempted, correct, score%), and a personal-best "high score" is updated if beaten.
- **Ordering guarantee:** none beyond per-round shuffle. There is no priority by `wrongCount`, skill, or age; every quarantined item appears exactly once per round.

---

## 3. Storage shape required

Three pieces of durable state (described as shapes, not tables):

### (a) The per-item quarantine record — one per (learner, item)
| Field | Type | Meaning |
|---|---|---|
| `userId` + `questionId` | identity | unique together — one record per learner per item |
| `skillId` | nullable id | the item's skill/microskill (for analytics + per-skill banks) |
| `wrongCount` | int, default 0 | lifetime non-hint wrong answers; drives the miss threshold |
| `correctCount` | int, default 0 | correct answers accumulated inside rounds; drives clearance |
| `entryReason` | enum: `miss_threshold` \| `hint` | how it entered quarantine |
| `inRedemption` | bool, default false | **single source of truth** for quarantine |
| `redeemed` | bool, default false | cleared for good |
| `redeemedAt` | timestamp, nullable | when cleared |
| `missedAt` | timestamp | first seen |

The active bank query is `inRedemption = true AND redeemed = false` (index this predicate). Access is per-learner only (row-level security on `userId`).

### (b) The per-round summary record — one per completed round
`userId`, `playedAt`, `questionsAttempted`, `questionsCorrect`, `scorePct`. Used only to derive the personal-best high score and a play history; not part of the state machine.

### (c) Three counters on the learner profile
- `redemptionCredits` (int) — credits available to start rounds.
- `practiceAnswersSinceCredit` (int) — progress toward the next credit; **+1 credit per 20 non-hint practice answers**, remainder carried (`floor(n/20)` credits awarded, `n % 20` retained).
- `redemptionHighScore` (numeric) — best round score%.

### (d) An atomic increment primitive
The miss-threshold check must be **atomic** to be correct under concurrency. The reference does it in one server-side upsert function (`incrementWrongCount(userId, questionId, skillId) → (newWrongCount, nowInRedemption)`):
- **Insert** a fresh row with `wrongCount = 1, inRedemption = false, entryReason = "miss_threshold"`; **on conflict** (row exists) `wrongCount = wrongCount + 1` and
  `inRedemption = (already in redemption) ? true : (wrongCount + 1 >= 3) ? true : false`.
- Returns the post-update count and quarantine flag so the client updates its local bank without a second round-trip. The "already in redemption → stay true" branch preserves a hint-quarantine even as later misses arrive.

---

## 4. Why it's shaped this way

- **`inRedemption` as the one source of truth** keeps "is this excluded from practice?" answerable with a single indexed predicate, and keeps the practice selector and the round selector reading the same flag — no drift between two notions of "quarantined."
- **Atomic threshold in the database, not the client.** Two rapid wrong answers (or two devices) must not both see `wrongCount = 2` and each decline to quarantine. The upsert makes the increment-and-test a single statement.
- **Hint preserves `wrongCount`.** Quarantining on a hint must not erase the miss history, or an item could escape the threshold accounting. The hint path updates the flag and `entryReason` but leaves `wrongCount` untouched.
- **Cumulative clearance + credit-gated full-bank passes** make the loop forgiving and rhythmic: you chip away at the whole bank each time you earn a round, and a single bad answer doesn't undo prior progress on an item.

---

## 5. Notes for a multi-exam reimplementation

- **v1 → v2 change to honor: the confidence shortcut is gone.** The earlier version cleared an item in **1** correct answer if the learner marked "Sure," and **3** if "Unsure/Guess." v2 removed this — clearance is **always 3**, no instant redemption. Do not reintroduce the confidence shortcut unless deliberately reverting; it was removed on purpose.
- **Clearance policy is a real design fork.** The reference uses **cumulative, no-reset** clearance (a wrong answer in a round is a no-op; correct answers accumulate across rounds). A platform may instead choose **consecutive, reset-on-wrong** clearance (3 in a row; any wrong — or any hint — resets to 0), which is stricter and arguably truer to "you've actually got it now." If a platform's redemption mode already implements reset-on-wrong, treat that as an intentional divergence from this reference, not a bug — but reconcile the two so the rule is stated in exactly one place. Likewise the reference's two entry paths (miss-threshold **and** hint) are both required; a mode that has only implemented hint-entry still owes the 3rd-wrong miss-threshold entry (which needs a per-item lifetime wrong-count, the `wrongCount` field above).
- **Key the record on the finest valid diagnostic unit per exam.** `skillId` should be the platform's leaf microskill (per the platform's leaf-resolution model), so per-skill bank views and analytics generalize across exams of different taxonomy depth.
- **Keep the quarantine flag authoritative and exam-scoped.** In a multi-exam platform the bank predicate becomes `inRedemption = true AND redeemed = false AND examId = <current>`; the practice selector for an exam must exclude that exam's quarantined items, and a redemption round serves only the current exam's bank.
- **Credits are a pacing knob.** "20 practice answers = 1 credit, 1 credit = 1 full bank pass" is one tuning; the mechanism (earn credits by practicing, spend a credit to sweep the whole bank) is the portable part. Keep the counters on the profile and the award math server-trustworthy if credits ever gate anything paid.
- **Diagnostic-never-quarantines is a rule, not an accident.** Calibration/diagnostic wrongs must increment the lifetime wrong-count but never quarantine on their own; only practice misses trip the threshold. Preserve this so a diagnostic can't flood the bank.
