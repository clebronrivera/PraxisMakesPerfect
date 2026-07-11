# Long-Running AI Call — Background Function + Poll Pattern (Generic Spec)

**Purpose.** This document specifies, in vendor-neutral terms, the pattern used to run AI calls that take longer than a normal serverless request allows (roughly anything over ~10 seconds). It is extracted from a working reference implementation and abstracted so it can be reimplemented on any host. The pattern: **a dispatcher accepts the request and returns immediately (HTTP 202); a background worker does the slow work and writes the result to a durable store out-of-band; the client polls that store for the result.**

This is the companion infrastructure to `PMP_STUDY_PLAN_V2_PIPELINE.md` (whose stage 3 runs on exactly this pattern) and is the call shape a future AI-tutor / on-demand-synthesis feature should reuse.

---

## 1. The problem

Standard serverless functions have a short wall-clock budget (commonly ~10 s synchronous, ~26 s hard cap on the host this reference targets). A single large LLM synthesis call routinely exceeds that: the reference allows the model up to `max_tokens ≈ 12000` and observes generations that run tens of seconds to a couple of minutes. A synchronous request would time out at the edge, the client would see a 504, and the (expensive) model call would be wasted.

The naive fixes are all bad: raising the synchronous timeout doesn't exist on most hosts; streaming keeps a connection open but couples the client's lifetime to the whole generation and complicates retries; doing the call client-side leaks the API key. The pattern below decouples "request accepted" from "result ready."

---

## 2. The pattern (three parts)

1. **Dispatcher → 202.** The client POSTs the job to an endpoint. The endpoint returns **HTTP 202 Accepted** essentially immediately, signalling "the work has started, the result is not in this response." Nothing of value rides on the dispatch response body.
2. **Background worker.** A worker process (granted a much longer runtime budget) does the slow work: the AI call, validation, and **persisting the result to a durable store** (a database row). The worker's own return value is for logs only — the client never sees it.
3. **Out-of-band result + poll.** Because the answer is not in the HTTP response, the result is delivered through the store. The client **polls** the store until the result row appears (or a deadline passes). The store row is the completion channel.

Sequence:

```
client ──POST job──▶ dispatcher ──202──▶ client
                         │
                         ▼ (async, long budget)
                     worker: AI call → validate → INSERT result row
                                                        │
client ◀──poll store every N s, until row or timeout──┘
```

---

## 3. The reference implementation

### 3.1 Platform mechanism
On the reference host, a function file whose name ends in `-background` is treated as a **background function**: the platform auto-returns **202** to the caller and lets the function run for up to **15 minutes** (versus the ~10–26 s synchronous limit). Host config (`netlify.toml`): functions live in one directory (`[functions] directory = "api"`), and a rewrite maps a friendly path to the function path:

```
[[redirects]]
  from = "/api/*"
  to   = "/.netlify/functions/:splat"
  status = 200
```

A reimplementation on a different host gets the same shape from a queue + worker, a durable task runner, or any "accept now, run later" primitive — the only requirements are (a) the dispatch returns fast and (b) the worker has a long budget.

### 3.2 Dispatch (client)
The dispatch function POSTs the request body (with a bearer token) and treats **`status === 202 || res.ok`** as "triggered." It walks a small **endpoint fallback list** (`/api/<fn>` then `/.netlify/functions/<fn>`) so it works whether or not the friendly rewrite is active (e.g. local dev vs. production):

```
for (const endpoint of CANDIDATE_PATHS) {
  let res; try { res = await fetch(endpoint, { method:'POST', headers:{…, Authorization:`Bearer ${token}` }, body }); }
            catch { continue; }                       // network error → try next
  if (res.status === 202 || res.ok) { triggered = true; break; }
  const body = await res.text();
  if (res.status === 404 || res.status === 405 || body.startsWith('<!doctype')) continue;  // route absent → try next
  throw new Error(parse(body)?.error ?? 'request failed');   // real error → surface it
}
if (!triggered) throw new Error('API route unavailable …');
```

Note the discrimination: a `404/405` or an HTML doctype body means "this route isn't a function here, try the other path"; any other non-OK is a genuine failure and is thrown.

### 3.3 Worker (server)
The worker (the `-background` function) does, in order:
1. **Auth** — verify the bearer token; resolve the user.
2. **Independent rate-limit check** (see § 5) — return **429 + `Retry-After`** if the user already has a recent successful result. This is enforced server-side specifically so a direct token-authed call can't bypass the client check and run up AI spend.
3. **The slow AI call** — a single request to the upstream AI API (reference: a mid-tier model, `temperature 0.2`, `max_tokens ≈ 12000`).
4. **Validate** — minimal structural validation of the model's output (required sections present and non-empty) before persisting.
5. **Persist the result** — INSERT a row into the results table under the user's own credentials (row-level security: `row.user_id = auth.uid()`). The worker re-attaches any client-supplied precomputed structural data so it doesn't re-fetch.
6. **On insert failure, write a failure row** — `{ error: true, errorMessage, failedAt }` — so the poller can detect and surface the error instead of hanging until timeout.

The worker's HTTP return (200/500/502/…) goes only to the platform's logs; the client already has its 202.

### 3.4 Poll (client)
After a successful dispatch, the client polls the results table on a fixed cadence until a deadline:
- `POLL_INTERVAL = 4000 ms`, `POLL_TIMEOUT = 240_000 ms` (4 minutes).
- Each tick: query the **newest** row for this user with `created_at > requestedAt`, `limit 1`.
- No row yet → keep waiting. A row that fails schema normalization (e.g. a failure row) → throw a "could not be parsed / please retry" error. A valid row → return it.
- Deadline reached with no row → throw "generation timed out."

### 3.5 The hook (client orchestration)
A thin UI hook wraps dispatch+poll with local state (`generating`, `error`, `history`): fetch the current access token (clear, specific message if the session expired rather than a raw 401), call the combined dispatch-then-poll function, then reload history so the new result appears at the top. Generation eligibility is gated separately (the user must have enough assessment data to generate).

---

## 4. Result correlation: jobId vs. timestamp

The canonical version of this pattern returns a **jobId** from the dispatcher and polls a status endpoint or table keyed by that id. **The reference implementation does NOT use a jobId** — it returns nothing identifying from dispatch and correlates the result by **`(user_id, created_at > requestedAt)`**, taking the newest row created after the request timestamp.

This is simpler but has a real weakness to flag for any reimplementation:
- **Race / ambiguity.** If two generations for the same user overlap, or an unrelated row lands in the same table after `requestedAt`, the poller can pick up the wrong row. The reference mitigates this with the rate limit (only one generation per user per window, see § 5) and by validating the row's schema, but it is not airtight.
- **Recommendation for a clean reimplementation:** have the dispatcher mint and return an explicit `jobId`, write it onto the result/failure row, and poll by `jobId`. This removes the timestamp race, makes "which call produced this row" unambiguous, and lets you support concurrent jobs per user if ever needed. Keep the timestamp as a secondary guard.

---

## 5. Reliability & cost details

- **Client timeout < worker budget — a deliberate but lossy mismatch.** The client gives up polling at **4 minutes**; the worker may run up to **15**. A generation that finishes between minute 4 and minute 15 still **succeeds and is persisted** — the client just surfaced a timeout error and will show the result on the next history load. A reimplementation should either raise the client deadline toward the worker budget or, better, make the persisted result the source of truth in the UI (show "still working…" and let history reconcile) so a slow-but-successful job is never reported as a failure.
- **Failure rows as a completion signal.** Writing an explicit failure row on the unhappy path is what lets the poller distinguish "failed, stop waiting" from "not done yet, keep waiting." Without it, every failure degrades into a full poll-timeout.
- **Rate limiting, enforced twice.** The client checks before dispatch; the worker checks independently and returns **429 + `Retry-After`** (reference window: one *successful* generation per 7 days). Critically the server counts **successful** results only (a failure row must not lock the user out), and the server check is the real guard — it exists precisely so a direct token-authed POST can't bypass the client and run up AI spend. For a metered AI feature, the rate limit / quota check belongs in the worker, not just the client.
- **Auth model.** Dispatch and worker both run under the **user's** token (RLS-scoped writes), not a service-role key — verification uses the user endpoint and the insert satisfies `user_id = auth.uid()`. No elevated key is needed for either step.

---

## 6. Notes for a reimplementation (PASS Phase 5+)

- **Reuse this for any AI call that can exceed the synchronous budget** — on-demand tutoring/explanation, study-plan synthesis, batch grading. The decision rule is simply "can this call exceed ~10 s?"; if yes, use accept-202 + background + poll rather than a synchronous request.
- **Prefer an explicit `jobId`** (§ 4) over timestamp correlation from day one — it is a small addition that removes a class of bugs and unlocks concurrent jobs.
- **Treat the result store as the completion channel, not the HTTP response.** The dispatch response carries no payload of value; design the client around "watch the store," and make the persisted row (success or failure) the single source of truth so the client-timeout/worker-budget gap can't misreport a successful job.
- **Put the cost guard in the worker.** Any per-user quota, rate limit, or spend cap must be enforced server-side in the worker, counting only successful results, returning `429 + Retry-After`. Client-side checks are UX only.
- **Lock down egress.** The reference's content-security policy restricts `connect-src` to exactly the persistence, AI, payments, and error-reporting origins it needs; a reimplementation should keep the AI provider origin out of the browser entirely (the key lives only in the worker) and allow only the persistence origin in `connect-src` for the polling client.
- **Portability.** Nothing here is intrinsically tied to one host's `-background` naming convention — the same three-part shape (fast-accept dispatcher, long-budget worker, polled durable result) maps onto a job queue + worker, a managed task runner, or a durable-execution service. Keep the application logic (dispatch contract, result schema, poll loop) independent of the host primitive so the host can change without touching the feature.
