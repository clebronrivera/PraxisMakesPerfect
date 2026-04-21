# Launch Readiness

> Status: Active. Canonical source for where Praxis Makes Perfect stands against launch criteria and what is left to do before inviting real users, before advertising, and after launch.
>
> Last updated: 2026-04-17 (post-PR #6 merge + verification pass)

This document consolidates the 2026-04-15 launch-readiness audit and tracks remaining work. Update it whenever a launch-gate item is resolved or a new one is discovered.

---

## Current posture

**Ready for private invite-only beta after PR #6 merges and the four preview-deploy manual checks pass.** Not yet ready to advertise. Not yet ready for a public launch.

### Scorecard (2026-04-15)

| Category | Pre-hotfix | Post-hotfix | Notes |
|---|---:|---:|---|
| Stability | 72 | 82 | Sentry ingest now works; errors will be captured. |
| Security | 65 | 78 | One HIGH CVE resolved; server-side Claude spend backstop added. |
| Operational readiness | 55 | 62 | Still no alert rules configured in sentry.io; no backup docs. |
| Trust / legal clarity | 78 | 78 | Unchanged. |
| Accessibility | 55 | 55 | Unchanged. |
| Performance | 50 | 78 | Main bundle dropped 91% raw / 87% gzipped. |
| **Launch readiness overall** | **62** | **74** | |

---

## What is done (2026-04-15, `hotfix/launch-gate-p0`, PR #6)

| Item | Evidence |
|---|---|
| CSP allows Sentry ingest | `netlify.toml` connect-src now includes `*.sentry.io` and `*.ingest.sentry.io` |
| Server-side 7-day rate limit on study-plan-background | `api/study-plan-background.ts` — filters to successful plans only, returns 429 + Retry-After |
| Main bundle reduced by 91% raw / 87% gzipped | `index-*.js` 6,122,205 B → 530,066 B; questions.json now a lazy chunk |
| Vite HIGH CVE resolved (GHSA-p9ff-h696-f583) | `package.json` vite ^6.4.1 → ^6.4.2; runtime-path high/critical = 0 |

---

## Must fix before inviting real users (blocks merging PR #6 or inviting)

### Code (in PR #6, pending manual verification on preview)

1. **Confirm Sentry round-trip works in production CSP.** Click `SentryTestButton` on the preview deploy, confirm an event lands in sentry.io within ~30 seconds. If blocked, check browser console for `Refused to connect` CSP errors.

2. **Confirm server-side 7-day rate limit prevents Claude spend.** `study-plan-background.ts` is a Netlify background function (the `-background` filename suffix), so Netlify returns HTTP 202 to the client immediately regardless of the handler's return value — the 429 + `Retry-After` produced by the rate-limit guard is **not observable via curl**. Verify instead via **Netlify → Functions → study-plan-background → Logs** after a duplicate invocation: a log line showing `{ statusCode: 429, ... }` confirms the guard fired and the Claude call was skipped. The server-side spend protection (not client-visible UX) is the actual launch-gate goal; client-visible 429 would require splitting this endpoint into a synchronous gate function that invokes an async worker — deferred refactor, not launch-blocking.

3. **Confirm failed rows do not block.** Seed a row into `study_plans` with `plan_document: { error: true, errorMessage: 'test', failedAt: <now> }`, then trigger a generation. Verify via the same Netlify function logs that the handler proceeds past the rate-limit check into Claude generation — the filter `doc.error !== true && doc.schemaVersion === '2'` correctly excludes failure rows.

4. **End-to-end smoke.** Sign in → complete or resume diagnostic → reach study-plan tab → generate plan → confirm plan renders. This exercises the async preprocessor path after the dynamic-import split.

### Operational (not code)

5. **Confirm Supabase project tier supports backups.** The repo has no backup documentation. Free tier has no PITR and only short retention. Upgrade to Pro (or Team, for PITR) before inviting users whose progress data cannot be recreated.

---

## Must fix before advertising / public launch

### Sentry alerting — UI configuration
Code is ready (SDK init, release tagging via git SHA in [vite.config.ts](../vite.config.ts)). Still required in sentry.io UI:
- New-issue email/Slack alert rules
- Spike protection
- Sourcemap upload (currently `sourcemap: false` in vite.config.ts — acceptable for beta, fix before heavy traffic)

### Leaderboard rate limit / cache
[api/leaderboard.ts](../api/leaderboard.ts) does full-table scans of `user_progress` + `responses` via service role on every call. Client-cached 5 min, but any authed user can bypass with a direct call. Add an in-memory cache keyed on `user.id` or a short throttle before ad traffic hits it.

### Accessibility pass
- Tie every `<label>` to its `<input>` via `htmlFor` across [LoginScreen.tsx](../src/components/LoginScreen.tsx), [OnboardingFlow.tsx](../src/components/OnboardingFlow.tsx) (15-min pass).
- Change [ToastHost.tsx](../src/components/ToastHost.tsx) to `role="alert"` when `variant === 'error'` (currently `role="status"` for all).
- Full WCAG AA audit with axe + manual screen reader testing remains.
- **LoginScreen `text-slate-700` dividers — audited 2026-04-21, intentional.** The four middot separators between hero stats ([LoginScreen.tsx:378-382](../src/components/LoginScreen.tsx:378)) and the `PASS · Beta · 2026` watermark ([LoginScreen.tsx:706](../src/components/LoginScreen.tsx:706)) render at 1.88:1 contrast against the `#060D1A` atelier bg. Below WCAG content minimums but these are decorative separators / a corner watermark, not content — the stat labels (slate-500) and color-accented numbers carry all information. Keeping as-is.

### Playwright smoke test
Zero E2E coverage today — [tests/](../tests/) is pure-logic unit only. Highest-value single test: signup → consent → adaptive diagnostic → ScoreReport → study-plan generation. One test catches ~80% of regressions users would see.

### Archive deferred redesign branches
`phase-0/install-libs`, `phase-1/cleanup`, `phase-2a/hero` exist locally but not on origin. Push as `archive/phase-*` on origin, then delete local tracking branches. Do not revive during launch prep.

---

## Can wait until after launch

- **Product analytics** — no PostHog/Plausible/etc. installed. Post-launch pick one and instrument.
- **Dependabot automation** — no `.github/dependabot.yml`. Add weekly npm schedule.
- **Status page** — optional at this stage; revisit at ~100 active users.
- **Full accessibility audit** — beyond the label + toast fixes above.
- **Sourcemap upload to Sentry** — for better stack traces post-launch.
- **ReDoS lint findings** — 19 `detect-unsafe-regex` warnings in [src/utils/tutorIntentClassifier.ts](../src/utils/tutorIntentClassifier.ts). Code reviewed — all benign (no nested quantifiers). Accept-and-document rather than fix.
- **Tutor-chat rate limit** — lower per-call cost (1,500 tokens), lower priority than study-plan.
- **questions.json runtime-fetch / bundle-chunk deduplication** — two copies ship today (see [BUILD_BUNDLE_SIZE_WARNINGS.md](BUILD_BUNDLE_SIZE_WARNINGS.md)). Cleanup, not a launch gate.

---

## Fastest safe path to beta (5 actions, ordered)

1. Merge PR #6 after the 4 manual checks above pass.
2. Confirm Supabase backup tier.
3. Configure Sentry alert rules.
4. Tie labels via `htmlFor` (LoginScreen + OnboardingFlow).
5. Add the one Playwright smoke test.

Then: invite first batch of users.

---

## Out of scope for launch readiness (but tracked elsewhere)

- Redesign chain (`phase-0`/`phase-1`/`phase-2a`) — mockup-first review required per [CLAUDE.md](../CLAUDE.md#ui-redesign-workflow--mandatory-mockup-first-rule). Archive rather than revive for this launch.
- Rename migration plan (`docs/RENAME_MIGRATION_PLAN.md`) — separate effort.
- Content authoring phases (A/B/C/D) — ongoing, separate pipeline.

---

## How to use this document

- Treat this as the single source of truth for launch-gate state.
- When any item moves from "must fix" → "done," move it to "What is done" with the PR/commit that closed it.
- When a new launch blocker is discovered, add it under the right tier (invite users / advertise / post-launch).
- Do not use this file to track ongoing product work — that belongs in `CHANGELOG.md` and `docs/ISSUE_LEDGER.md`.
- Reviewers: before approving a "ready for beta" or "ready to advertise" claim, verify the corresponding must-fix list is fully cleared.
