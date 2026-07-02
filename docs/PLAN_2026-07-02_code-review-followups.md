# Code-Review Follow-Ups Plan — 2026-07-02

> **Single source of truth for remediating the 2026-07-01 full-codebase review.**
> Findings were produced by a 3-track review (API/backend security, frontend architecture,
> repo hygiene) and hand-verified before inclusion — rejected findings are listed at the
> bottom so they don't get re-litigated. Work it **in phase order**, update status boxes
> **inline in the same commit as the work**.

## 0 · HOW TO USE THIS DOC (anti-drift — read every session)

1. **Re-read this whole file at the start of every session and after each completed task.**
2. **Work phases in order.** Don't start a task whose dependency (⛔) is unmet.
3. **Update the Status box (☐ → 🔄 → ✅) here in the same commit as the work.**
4. **Run the gate green before every commit:** `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.
5. **Merging to `main` = production deploy** (Netlify `production_branch=main`, auto-deploy ON). Treat every main-merge as a ship — confirm with Carlos first.
6. **Mockup-first for any UI change** per `CLAUDE.md`. (Phases 1–4 have no UI changes; Phase 5/6 must not change rendered UI at all — refactor + loading only.)
7. **If reality diverges from this plan, fix this doc first, then proceed.**

Companion docs: `docs/ISSUE_LEDGER.md`, `docs/PENDING_IDEAS.md`, `docs/PLAN_2026-06-16_cleanup-and-backlog.md`.

---

## Snapshot — verified findings (2026-07-01 review)

| # | Finding | Severity | Verified |
|---|---|---|---|
| F1 | 24+ `public/mockup-*.html` files committed **before** the `.gitignore:51` rule existed → they ship to production and are live at `praxismakesperfect.netlify.app/mockup-*.html`. Old mockups include retracted psychometric claims + pre-PASS branding. | **High** | ✅ `git ls-files public` shows 30 files, 1.3MB |
| F2 | `api/tutor-chat.ts` has **no server-side rate limit** before calling Claude (`MAX_TOKENS=1500`). Any authenticated JWT can script unlimited requests. Largest uncapped cost surface. | **High** | ✅ grep confirms zero throttle/429 logic |
| F3 | `api/study-plan-background.ts:134` 7-day limit counts **successful plans only** (by design, so failures don't lock users out) → failed generations are completely unthrottled and each burns tokens. | **Med-High** | ✅ filter reads `plan_document.error !== true` |
| F4 | API hygiene: ~40 lines of client/auth boilerplate duplicated across 8+ endpoints; admin endpoints return `detail: error.message` (leaks schema names); `Access-Control-Allow-Origin: *` everywhere; no `AbortController` timeout on Anthropic fetches (hung call pins a function up to 15 min). | Medium | ✅ spot-checked |
| F5 | `App.tsx` = 2,038 lines, 48 hooks, ~14 responsibilities, 17 app modes. `useProgressTracking` = 993-line god hook (profile + logging + score recalc). Works, but every feature touches it. | Medium | ✅ |
| F6 | `src/data/questions.json` = 6.3MB fetched at startup in App.tsx. Async (doesn't block paint) but delays assessment start; `studyPlanPreprocessor.ts:367` already shows the correct lazy pattern. | Medium | ✅ |
| F7 | **Zero React component tests / zero E2E.** The 32 test files are all data/logic (brain coverage is strong). Refactor F5 is risky without integration seams. | Medium | ✅ |
| F8 | Doc rot: `CODEBASE_OVERVIEW.md` (2026-03, documents removed code), `REWRITE_DEVELOPMENT_GUIDE.md`, `ASSESSMENT_DATA_FLOW_ANALYSIS.md`, root `HANDOFF_2026-04-27.md` all predate Phase 2. `CHANGELOG.md` stops at 2026-06-02 (missing PRs #37–#44). | Low | ✅ |
| F9 | Already-ledgered, unchanged: Dependabot #12 (esbuild → needs vite 6→8 major), Phase B regen (29 skills / 692 questions). Tracked in `ISSUE_LEDGER.md` — **not duplicated here.** | — | — |

### Rejected findings — do not re-open without new evidence

- ~~"Stripe webhook signature verification disabled" (critical)~~ — **wrong.** Entire handler is intentionally dormant (`api/stripe-webhook.ts:79` returns before any processing); nothing is spoofable. Real residual: the compare at `:62` is `===`, not timing-safe as its comment claims → folded into the Stripe re-enable checklist (Phase 7).
- ~~Bearer-token parse bypass~~ — **wrong.** `tutor-chat.ts:97` checks token presence; `auth.getUser(undefined)` fails closed.
- ~~admin-student-detail UUID "enumeration by an admin"~~ — an admin reading user data is the feature. Cheap UUID-format validation folded into Phase 2 [2d] anyway.

---

## PHASE 1 — Stop shipping mockups  ·  *quick win, ship first*  ·  **PR A**

| # | Task | Status |
|---|---|---|
| [1] | `git rm --cached public/mockup-*.html` (and any tracked root `/mockup-*.html`). Files **stay on disk** — the mockup-first workflow is unaffected; they just stop deploying. Note in PR body: prod `mockup-*.html` URLs will 404 after deploy (intended, per `.gitignore:49-52`). | ✅ 24 html + 6 `mockup-previews/*.png` untracked (previews are mockup screenshots, same exposure class, referenced by zero app code); gitignore rule broadened to `public/mockup-*`; app refs to mockups are comments only |
| [2] | Verify on the PR deploy preview: `/mockup-*.html` → 404, app + one real static asset still serve. Then merge ⚠️ **PRODUCTION DEPLOY** (Carlos confirm). | 🔄 **verified on deploy-preview-46** (note: SPA fallback `/*→index.html 200` means mockup URLs now serve the app shell, not a literal 404 — content gone either way; `mockup-previews/hero.png` also falls back; CI `check` green 1m12s). PR #46 open — **awaiting Carlos merge confirm** |
| [3] | Post-merge: confirm production 404s the old mockup URLs. If any mockup is still wanted shareable, move it deliberately (e.g. Netlify Drop / separate site), not via `public/`. | ☐ ⛔[2] |

## PHASE 2 — API hardening  ·  **PR B** (one reviewable PR, commits per task)

| # | Task | Status |
|---|---|---|
| [4] | **Shared helper `api/_shared.ts`** — extract `getAnonClient` / `getServiceClient` / `getUserClient` / bearer parsing / `json()` / CORS headers / `requireAdmin(event)` from the 8+ endpoints. Pure refactor, zero behavior change. Do this FIRST so [5]–[7] land on the shared seam. | ☐ |
| [5] | **Rate-limit `tutor-chat`** — before the Claude call, count the user's `tutor_messages` rows in the trailing window; over limit → `429` + `Retry-After` + friendly client message. **Proposed defaults (Carlos may override): 40 messages/hour and 200/day per user.** No new table needed. Add a small unit test for the window math. | ☐ ⛔[4] + limit sign-off |
| [6] | **Study-plan failure cooldown** — keep the 7-day success rule untouched; additionally block if the most recent **failed** row is < 15 min old (`429` + `Retry-After`). Closes F3 without re-introducing the week-long lockout on failure. Update the CLAUDE.md "Study Plan — Rate Limit" section in the same commit. | ☐ ⛔[4] |
| [7] | **Hygiene sweep** on the shared seam: (a) admin endpoints log full error server-side, return generic message to client; (b) drop `Access-Control-Allow-Origin: *` — app calls `/api/*` same-origin so restrict to prod origin + `http://localhost:8888` (keep OPTIONS handling); (c) `AbortController` timeouts on Anthropic fetches — 60s tutor-chat, 10 min study-plan; (d) UUID-format check on `admin-student-detail` `userId` (mirror `admin-delete-user.ts:52`). | ☐ ⛔[4] |
| [8] | Verify via `netlify dev` (port 8888): tutor chat works then 429s past limit; study plan happy path; one admin endpoint per changed header path. Merge ⚠️ **PRODUCTION DEPLOY** (Carlos confirm). | ☐ ⛔[5][6][7] |

## PHASE 3 — Doc rot cleanup  ·  *cheap, no code*  ·  **PR C**

| # | Task | Status |
|---|---|---|
| [9] | Archive stale root docs per repo convention (`archive/docs-cleanup-2026-07/`): `CODEBASE_OVERVIEW.md`, `REWRITE_DEVELOPMENT_GUIDE.md`, `ASSESSMENT_DATA_FLOW_ANALYSIS.md`, `HANDOFF_2026-04-27.md` — or stamp a dated deprecation banner if Carlos prefers keeping them at root (check `docs/DOCS_SYSTEM.md` first; **fix that doc too if it lists any archived file as canonical**). | ☐ |
| [10] | Update `CHANGELOG.md` through PR #44 (Phase 2 retake/A4, C4 bank 1,200+, staged study guide, 0027/0028, tutor model fix). Durable copy — no exact counts that go stale. | ☐ |

## PHASE 4 — Test seams for the refactor  ·  **PR D**  ·  *gate for Phase 5*

| # | Task | Status |
|---|---|---|
| [11] | Add React Testing Library integration tests (first `*.test.tsx` files) for the 3 highest-risk flows: **adaptive-diagnostic assessment flow** (start → answer → complete → unlock), **PracticeSession** (answer/streak/retirement + redemption wiring), **OnboardingFlow** (validation + submit). Mock Supabase at the hook boundary. Target: behavior pinning, not coverage %. | ☐ |
| [12] | Wire into `npm test` / CI (`npm run check`) — confirm CI still < ~3 min. | ☐ ⛔[11] |

## PHASE 5 — App.tsx + god-hook decomposition  ·  **PR E (split into E1/E2/E3 if large)**

⛔ **Blocked until Phase 4 is green.** Pure refactor — **zero UI/behavior change**; snapshots of the 3 tested flows must pass unmodified.

| # | Task | Status |
|---|---|---|
| [13] | **E1 — `useAssessmentOrchestration`**: compose `useAssessmentFlow` (879 ln) + the 4 retake `useState`s + adaptive wiring behind one hook with a clean `{ startScreener, startAdaptive, startRetake, resume }` API. ~400 lines out of App.tsx. | ☐ |
| [14] | **E2 — `useRedemptionFlow`** (redemption + retake pass-through state, ~120 ln) and **`useSocialHub`** (leaderboard open/mode + users-online sim, ~80 ln — keep `getHourRange` + drift effect intact per CLAUDE.md). | ☐ ⛔[13] |
| [15] | **E3 — split `useProgressTracking`** (993 ln) → `useUserProfile` / `useProgressLogging` / `useScoreRecalculation`, with `useProgressTracking` kept as a thin composing facade so the 8+ call sites don't all change at once. **Do not touch the `cea4af9` question_id dedupe logic — locked per memory.** | ☐ ⛔[13] |
| [16] | Gate + manual smoke via `netlify dev` of assessment / practice / redemption / leaderboard. Merge ⚠️ **PRODUCTION DEPLOY** (Carlos confirm). Target: App.tsx ≤ ~1,400 lines. | ☐ ⛔[13][14][15] |

## PHASE 6 — Question-bank load strategy  ·  **PR F**

| # | Task | Status |
|---|---|---|
| [17] | **Decide approach (Carlos):** (a) defer the 6.3MB fetch until an assessment/practice mode is entered (smallest change, recommended), or (b) split `questions.json` into per-domain chunks loaded on demand (bigger win, more moving parts). Extend the existing lazy pattern from `studyPlanPreprocessor.ts:367` either way. | ☐ decision |
| [18] | Implement + verify: network tab shows no bank download on login/dashboard; assessment start latency acceptable on throttled connection; all 1,200+ questions still resolve (existing `questionsJsonSchema` test + count assertion). | ☐ ⛔[17] |

## PHASE 7 — Parked (do NOT start without explicit Carlos go)

| # | Item | Where tracked |
|---|---|---|
| [P1] | Vite 6→8 major (clears Dependabot #12 / esbuild) — own sprint, build-config risk. | `ISSUE_LEDGER.md` |
| [P2] | Phase B content regen (29 skills / 692 questions, Coworker batching). | `ISSUE_LEDGER.md` |
| [P3] | **Stripe re-enable checklist** (only when paywall goes live): remove `:79` early-return; timing-safe HMAC compare at `:62`; validate ALL env vars at handler entry (no `!` assertions, `:113`); Zod-validate webhook payload; check `userId` before the Stripe subscription fetch. | this doc |
| [P4] | E2E harness (Playwright) for login → assessment → results. Note: a playwright seed stash existed at 2026-06-16 cleanup — check before starting fresh. | this doc |

---

## Decisions needed from Carlos before the affected task starts

1. **[5] Tutor rate limits** — proposed 40 msgs/hour + 200/day per user. OK or different numbers?
2. **[9] Stale root docs** — archive to `archive/`, or deprecation banner at root?
3. **[17] Question bank** — defer-fetch (a) or domain-chunk split (b)? Recommendation: (a).

Everything else proceeds on the proposed defaults.
