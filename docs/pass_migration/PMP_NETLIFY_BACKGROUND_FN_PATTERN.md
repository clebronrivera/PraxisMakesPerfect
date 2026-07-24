# Netlify Background Function Pattern — Generic Specification

**Status:** Spec extraction (pattern documentation for re-implementation).
**Audience:** Engineers building any feature that calls a large language model for work exceeding a normal synchronous HTTP request budget (roughly 10 seconds).
**Scope:** The three-actor async job pattern for long-running AI synthesis calls — dispatcher, background worker, client poll loop — abstracted from a working single-exam reference into pure, platform-agnostic rules. Includes the correlation mechanism the reference uses to match a poll to its result, and the timing/correlation gaps a re-implementer should design around rather than reproduce.

This is a **specification of behavior**, not a transplant of code. Every number below is a validated default from a shipped implementation; an adopting system may re-tune them, but the *shape* of the contract — acknowledge fast, work out-of-band, hand off through a durable store, poll with a bounded deadline — is what should transfer.

**Pattern classification.** Cross-cutting infrastructure, not a numbered PASS product capability — the request/response shape any capability requiring a long AI call must sit on. In the reference it underlies a study-guide generation feature; on a multi-exam platform the same shape applies to any synthesis job whose duration exceeds a normal request budget.

---

## 1. Why this pattern exists

A normal serverless/HTTP function has a short execution ceiling — commonly ~10 seconds — inherited from browser connection expectations, load-balancer idle timeouts, and default function-tier limits. A large, multi-section structured document from a model routinely takes minutes, not seconds, and that doesn't fit.

Three constraints must hold at once: the client can't hold a connection open for minutes (tabs background, mobile networks drop idle connections, proxies kill long requests); the compute can't run inside the platform's short-lived function tier; and the client still needs to learn "done" without a persistent connection, ideally without a websocket broker or public callback endpoint for one feature.

The pattern splits one request/response cycle into three roles: a **dispatcher** that does the minimum synchronous work (auth, validation, pre-flight checks) and returns immediately; a **background worker** that does the long-running call and persists its result to a durable, shared store instead of returning it over the original (already-closed) connection; and a **client poll loop** that re-checks that store on a fixed interval until it finds a result or gives up. The store, not a live connection, is the hand-off point.

**A hosting shortcut worth naming.** Some hosts offer a function variant the platform itself invokes asynchronously: it returns an HTTP 202 before the function's code finishes, then keeps that instance running server-side well beyond the normal ceiling. The reference uses exactly this — one file plays both dispatcher and worker, distinguished only by a filename convention the host recognizes. A platform without an equivalent primitive should implement the two roles as genuinely separate services (dispatcher enqueues; a queue consumer or polled task runner executes) — the contract below holds either way, only the topology differs.

---

## 2. The dispatcher contract

**Input:** an authenticated request carrying the requester's identity (verified against their own session — no elevated credential needed), the fully-assembled synthesis input (in the reference, a complete prompt string — retrieval/pre-processing already done client-side), provenance metadata to echo into the eventual result, and optionally a client-recorded dispatch timestamp.

**Pre-flight validation, synchronous, before work is deferred:** verify the token and resolve identity; validate the body against a strict schema, rejecting malformed payloads immediately; confirm identity matches the subject the request claims to act for; apply reject-before-spending-budget rules — a rate limit (success already exists in a rolling window) and a cooldown after a recent failure. These run against the result store and are gates, not part of the async hand-off itself.

**Output:** the platform-level acknowledgment (202, or the host's async-function equivalent) returns essentially immediately, sometimes before the handler has reached the long call. **This acknowledges "a job was accepted," not a receipt for a specific job.** The generically correct contract is: *request in, `202 Accepted` plus an explicit, server-issued correlation identifier out* — a token the client can use, unambiguously, to ask "is *this* job done yet?" later. The reference skips the second half; see § 5.1.

---

## 3. The background worker contract

Once accepted, the worker does the actual synthesis out-of-band:

1. **Re-verify auth and pre-flight state.** Dispatcher and worker share a code path in the reference, so this is automatic — a platform that truly splits the two roles must not skip re-validation after a queue hop.
2. **Call the model** under a timeout materially shorter than the worker's own overall ceiling, leaving headroom for parsing/persistence and preventing a hung upstream call from pinning the worker for its entire budget.
3. **Validate the model's output** — parseable, every required section present *and non-empty*. Parses-but-missing-a-section is a failure, not a partial success.
4. **Assemble the persisted result**, stamping the validated output with metadata the client cannot forge: a completion timestamp, the model identifier actually used, a schema-version marker, and the echoed provenance summary from dispatch.
5. **Persist to the durable, shared result store** — the sole hand-off to the client, since the worker's own return value (once the platform has sent its 202) is never delivered anywhere visible. The write should use the *requesting user's own* scoped credential where the store allows it, so ordinary row-level authorization applies without over-granting the worker.
6. **On failure, still write something.** If the model call, validation, or store write fails, write a distinguishable failure record — error flag, message, timestamp — rather than nothing. This lets a poller and the dispatcher's cooldown check tell "failed" apart from "no attempt yet" and "still running."

**What "done" means.** There's no explicit status field (`pending`/`running`/`succeeded`/`failed`) — status is inferred from whether a row exists and, if so, its payload shape. Critically, **no row exists at all while the job is in flight**, so a poller cannot tell "still running" from "silently dropped, never started" — both look identical. An "in progress" placeholder row at dispatch time would make these visibly different states.

---

## 4. The client poll contract

1. **Wait a fixed interval**, then query the result store for a row matching the client's own identity, most-recent first.
2. **If no row is found**, sleep and retry, up to a wall-clock deadline measured from dispatch — not from when the worker actually started, which the client can't observe.
3. **If a row is found**, re-validate it against the same output schema the worker used before persisting. A **success shape** (schema-version marker, no error flag) means done — surface it, stop. A **failure shape** or **schema mismatch** is a **terminal failure**, not "still working" — stop immediately; a malformed or failed row will not improve by waiting.
4. **If the deadline elapses with no row**, surface a timeout. This is *not* a failure row — the client stopped looking, not the worker working. The worker's ceiling may materially exceed the poll deadline, so the job can still be legitimately in flight — and can still succeed — after the client already shows an error (§ 5.2).

Interval and deadline are a pure UX tuning knob; neither is derived from the worker's execution ceiling in the reference — exactly the problem below.

---

## 5. Known gaps in the reference — design around these, don't reproduce them

### 5.1 No server-issued correlation identifier — timestamp-based correlation races

**Confirmed present in current source.** The dispatcher never mints or returns an explicit job identifier. The client's only per-request "handle" is a timestamp it generates itself, locally, before dispatching; it sends that value in the request body, but the worker never reads, stores, or echoes it into the persisted row — effectively write-only. Correlation on poll reduces to: *"for my identity, give me the single most-recently-created row whose creation time is after the timestamp I locally remembered before dispatching."* That is correlation by identity plus a loose time cursor plus "assume the newest one is mine," not correlation by an explicit, unambiguous identifier.

Three weaknesses follow. **It cannot disambiguate two jobs in flight for the same identity at once** — nothing on the dispatcher blocks a second dispatch while a first is still running, since the only pre-flight rejections are "a success already exists" and "a failure happened too recently," neither of which fires while a first attempt is genuinely in progress with no row written yet. Two browser tabs, two devices, or a retry racing a merely-slow (not failed) earlier attempt are realistic triggers. **"Most recent wins" can silently deliver the wrong job's output** — with two jobs in flight carrying different inputs, whichever worker persists last is what *both* pollers observe; a client can be shown a result that doesn't match what it submitted, with no error signal. **It depends on wall-clock ordering across two systems** (client's local clock at dispatch vs. the store's server-generated timestamp) — weaker than an identifier passed through unchanged. Fix: § 7.

### 5.2 Worker execution budget materially exceeds the client's poll deadline

**Confirmed present in current source; both numbers verified.** Three budgets are configured independently, not derived from one another: the **worker's overall execution ceiling** (a host limit) is **~15 minutes**; the **model call's internal timeout**, so a hung upstream call can't pin the worker for its whole budget, is **10 minutes** — deliberately under the ceiling, leaving headroom for parsing/persistence afterward; the **client's poll deadline** is **4 minutes**, polling every **4 seconds** (~60 attempts).

The client reports a hard timeout at four minutes in scenarios where the worker is fully entitled, by its own contract, to keep working for up to fifteen. A job taking six or eight minutes — well within the worker's budget, nowhere near the model-call sub-timeout — looks identical to a genuinely stuck one.

The confusing downstream consequence: the worker keeps running after the client stops polling, so a job already reported as timed out can still **succeed** and write a result minutes later. If the user, believing it failed, retries, the dispatcher's own rate limit ("a success already exists in the window") now fires — they're told they *already generated this*, right after being told it *failed*. Nothing proactively surfaces the late success; the only way to discover it is reloading whatever view lists past results, or retrying and getting blocked by the rate limit that proves the first attempt worked. Fix: § 7.

---

## 6. Constants reference (validated defaults)

| Constant | Value |
|---|---|
| Background worker execution ceiling (host limit) | ~15 minutes |
| Model-call sub-timeout (worker-internal, inside the ceiling) | 10 minutes |
| Client poll interval | 4 seconds |
| Client poll deadline | 4 minutes (~60 attempts) |
| Successful-result rate-limit window | 1 per 7 days, per identity |
| Post-failure cooldown window | 15 minutes after the most recent failure row (independent constant — coincidentally the same number as the worker ceiling, not related to it) |
| Correlation mechanism in the reference | identity + "most recent row after locally-remembered dispatch timestamp" (no server-issued job ID) |

---

## 7. Open items for the adopting platform

1. **Mint and thread an explicit correlation identifier** through dispatch → worker → persisted row → poll query (a token returned in the 202, or a client-supplied idempotency key); filter the poll query on it directly, not "newest row for this identity." Highest-leverage fix vs. the reference (§ 5.1).
2. **Reconcile the three timing budgets** so client patience is never shorter than the worker's actual contract, or design the UI to keep checking past the poll window instead of showing a bare failure (§ 5.2).
3. **Add a status field or an "in progress" placeholder row** at dispatch time, so a poller can distinguish not-yet-started, running, succeeded, and failed instead of inferring status from row presence alone (§ 3) — the same correlation ID from item 1 makes this cheap.
4. **Decide whether dispatcher and worker are one deployable unit or two.** The reference's single-file convenience (§ 1) is a hosting shortcut, not load-bearing; choose based on what the target infrastructure offers for long-running execution.
5. **Decide deliberately how a client-reported timeout interacts with rate limiting**, rather than inheriting the reference's "already generated" collision as an accident of untuned constants (§ 5.2).

---

*Extracted from a shipped single-exam AI-synthesis pipeline. Source: `api/study-plan-background.ts` (dispatcher + worker, collapsed via a host-managed async function), `src/services/studyPlanService.ts` (`requestStudyPlanBackground`, prompt assembly, result normalization), `src/hooks/useStudyPlanManager.ts` (dispatch → poll → result orchestration), `api/_shared.ts` (rate-limit window math, timeout-wrapped fetch), `netlify.toml` (the `/api/*` rewrite fronting the dispatcher). Values are validated defaults, not immutable constants — the contract shape is what should transfer; re-tune the numbers, and close the correlation and timeout gaps, against your own infrastructure.*
