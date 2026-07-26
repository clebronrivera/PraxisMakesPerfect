# MASTER PLAN

> **This is the only plan document in this repo.**
> If you are about to create `docs/PLAN_<date>_*.md` or `docs/HANDOFF_<date>_*.md` — **don't.** Add a phase to §2 instead.
>
> Status: Active. Created 2026-07-26, superseding four competing plan docs and `LAUNCH_READINESS.md`.

**Why this file exists.** Between April and July 2026 the repo accumulated four separate documents that each declared themselves "the single source of truth," none of which indexed the others, none of which was registered in `docs/DOCS_SYSTEM.md`, and two of which were provably stale (claiming PR #57 unmerged after it merged, and design-audit Phase C unbuilt after it shipped). The cause was structural: the `PLAN_<date>_<topic>.md` convention made a new plan the path of least resistance every time a workstream started. The undated, singular name of this file is the fix. See §6 for what was retired into it.

---

## §0 · Grounding — read before working

Facts that get relitigated every session. Verify anything here that looks wrong, then fix it here.

- **`main` auto-deploys to production.** Netlify `stop_builds=false`, `production_branch=main`. A merge to `main` **is** a production ship. PR previews build.
- **The app is auth-gated.** Only the landing/auth surface renders without credentials. Verification runs in three tiers: (1) local + unauthed, (2) automated authenticated E2E via `e2e/authenticated.spec.ts` — *inert until credentials exist, see §2 PR 5*, (3) deploy preview with a human logged in. Tier 3 is expensive; that is why the PR order in §2 front-loads what tiers 1 and 2 can cover.
- **Mockup-first is mandatory for visual work.** Standalone HTML mockup in `public/` → confirm it renders → explicit approval → *only then* React. See `CLAUDE.md`. Mockups in `public/mockup-*` are gitignored and worktree-local; they do not survive a fresh checkout.
- **`docs/HOW_THE_APP_WORKS.md` must be updated in the same commit** as any change to counts, labels, thresholds, unlock conditions, or user-facing copy.
- **Use the UI primitives.** `Button` / `IconButton` / `Surface` from `src/components/ui/`. `npm run scan:buttons` is a ratchet against `scripts/button-budget.json`. Exception: `src/components/landing/**` is a separate dark violet/navy theme and is deliberately excluded.
- **Cool indigo/violet palette only.** `npm run scan:colors` guards it. No warm cream/off-yellow surfaces.
- **Archive before deleting.** Branches → `archive/*`; docs → `archive/docs-*`.
- **`docs/pass_migration/` is out of scope.** It is spec extraction for PASS, a separate future product (decision D1). Its references to `00_PRODUCT_CONTRACT.md` point outside this repo; that document is not vendored and does not govern work here. Completion for *this* product is defined in §1.

---

## §1 · Definition of done

Three tiers, absorbed from the retired `LAUNCH_READINESS.md` and re-verified against source on 2026-07-26. Legend: ✅ done · ☐ open · ❓ unverifiable from code (needs Carlos).

**Current posture:** in private beta. Not ready to advertise. The 2026-04-15 scorecard (74/100 overall) predates roughly three months of shipped work and is not re-scored here — treat the tier tables, not the score, as the state.

### Tier 1 — before inviting real users

| # | Item | Status |
|---|---|---|
| 1 | Sentry round-trip works under production CSP | ❓ `SentryTestButton` is wired in the admin dashboard; whether the click-through was ever confirmed is not knowable from the repo |
| 2 | Server-side 7-day rate limit prevents Claude spend | ✅ shipped; `api/study-plan-background.ts`, unit-tested in `tests/apiRateLimits.test.ts`. Not observable via curl (background function returns 202) — verify in Netlify function logs |
| 3 | Failed study-plan rows do not lock users out | ✅ shipped; filter excludes `plan_document.error === true`, plus a 15-min failure cooldown |
| 4 | End-to-end smoke: sign in → diagnostic → study plan | ❓ manual; supersede with `e2e/authenticated.spec.ts` once PR 5 lands credentials |
| 5 | Supabase project tier supports backups | ❓ **needs Carlos.** Free tier has no PITR. Progress data cannot be recreated |

PR #6 (`hotfix: launch gate p0`), which items 1–4 were gated on, **merged 2026-04-17**.

### Tier 2 — before advertising / public launch

| Item | Status |
|---|---|
| Acquisition / SEO | ☐ **deliberately deferred.** Site is `noindex` + `Disallow: /` during beta, by decision. Order when resumed: buy a custom domain → decide crawlability (the SPA ships an empty shell to crawlers) → keyword content + `sitemap.xml` + Search Console → keep brand-honesty constraints (no IRT/calibration claims; durable "1,000+" over exact counts). To go live in search you must remove the `robots` meta from `index.html` **and** open `public/robots.txt` — both, or it stays dark |
| Sentry alerting (sentry.io UI) | ☐ **needs Carlos.** New-issue alert rules + spike protection. SDK side is done |
| Leaderboard rate limit / cache | ☐ **verified still open.** `api/leaderboard.ts` full-table-scans `user_progress` + `responses` on every call with no cache or throttle; client-side 5-min caching is bypassable by any authed user |
| Accessibility — form labels | ✅ `OnboardingFlow.tsx` ties labels via `htmlFor`; `LoginScreen.tsx` has no `<label>` elements |
| Accessibility — error toasts | ✅ `ToastHost.tsx:54` is `role={isError ? 'alert' : 'status'}` |
| Accessibility — full WCAG AA audit | ☐ axe + manual screen-reader pass. (The LoginScreen `text-slate-700` dividers were audited 2026-04-21 and intentionally kept: decorative separators, not content) |
| Playwright smoke test | 🔄 `e2e/landing.spec.ts` runs green. `e2e/authenticated.spec.ts` is **written but has never executed** — no credentials. §2 PR 5 |
| Archive deferred redesign branches | ✅ `phase-0` / `phase-1` / `phase-2a` no longer exist locally or on origin |

### Tier 3 — after launch

| Item | Status |
|---|---|
| Product analytics (PostHog/Plausible/…) | ☐ none installed |
| Dependabot | ☐ verified absent — no `.github/dependabot.yml` |
| Status page | ☐ revisit at ~100 active users |
| Sourcemap upload to Sentry | ☐ `vite.config.ts:23` is `sourcemap: false` |
| ReDoS lint findings | ☐ 19 `detect-unsafe-regex` warnings in `tutorIntentClassifier.ts` — reviewed, all benign. Accept-and-document, do not "fix" |
| Tutor-chat rate limit | ✅ shipped 2026-07-02 — `TUTOR_RATE_LIMITS`, 40/hour + 200/day |
| `questions.json` chunk duplication | ✅ fixed in PR #53 (fetch-not-import). The **payload size** is a separate, still-open problem — §2 PR 6 |

---

## §2 · The PR queue

Sequenced by dependency and risk. Each row is independently mergeable. Update the Status cell **in the same commit as the work**.

| # | PR | Addresses | Status | Verification |
|---|---|---|---|---|
| 0 | `docs: MASTER_PLAN + retire the four plans` | doc fragmentation | 🔄 this PR | links resolve; no live refs to archived paths |
| 1 | `fix(auth): signup confirmation + consent double-prompt` | silent signup dead-end | ☐ | local unauthed + one real signup |
| 2 | `perf/chore: lazy docx + dead files + stray logs` | 437 KB on critical path; 742 dead lines | ☐ | `dist/` sizes before/after; download the `.docx` |
| 3 | `feat(admin): surface account-deletion requests` | GDPR/CCPA exposure | ☐ | preview as admin |
| 4 | `test: explanation truncation gate` | locks the content bug | ☐ | `audit:explanations` → 229 known, 0 new |
| 5 | `ci: green gates + authenticated E2E credentials` | unblocks verifying 6–10 | ☐ | the CI run itself |
| 6 | `perf: split the question bank` | 6.4 MB → ~2 MB on critical path | ☐ ⛔ needs 5 | round-trip test + throttled browser |
| 7 | `chore: remove dead atelier branches` | 156 dead conditionals | ☐ ⛔ needs 5 | preview: 1 lesson, 1 artifact card, 5 interactives |
| 8 | `ux: remove the Extend placeholder` | D3 | ☐ | preview: module page, Sections 1–2 intact |
| 9 | `content: regenerate 229 explanations` | D2 | ☐ ⛔ needs 4 | `audit:explanations` empty; hand-read 20 |
| 10 | `chore: delete Stripe` | D4 | ☐ | study guide + tutor still reachable |
| 11 | `ci: lint:security triage + knip ratchet` | deferred gates | ☐ | `lint:security` green at baseline |
| 12 | `chore: land feat/item-analysis-snapshots` | unmerged branch + migration collision | ☐ | admin Item Analysis tab on preview |

PRs 1–3 touch disjoint files and can land in any order. From PR 6 on, ship one at a time.

### Findings behind the queue (verified against source 2026-07-26)

- **PR 1** — `AuthModal.tsx:42-54` awaits `signUpWithEmail()` and then does nothing: no success state, no message, no close. Email confirmation is on (`AuthContext.tsx:117` handles `'Email not confirmed'`), so `signUp()` returns no session and the user watches the spinner stop with no way to tell whether it worked. The same missing session is why the `consent_accepted_at` upsert at `AuthContext.tsx:150-168` is rejected by RLS and swallowed to `console.warn`, producing a second consent prompt later at `App.tsx:651`. One bug, two ends. The fix pattern — `resetEmailSent` — already exists 14 lines below in the same file.
- **PR 2** — `scoreReportGenerator.ts:1-2` statically imports `docx` + `file-saver`, and `ScoreReport.tsx:11` imports it eagerly, putting 437 KB on the post-diagnostic path. Dead files: `LearningPathNodeMap.tsx` (580 lines, superseded by `ModulesBrowser`) and `landing/DashboardPreview.tsx` (162 lines), both knip-confirmed.
- **PR 3** — `AccountPage.tsx:295` writes `deletion_requested_at` (migration 0025) and signs the user out. Zero readers in `src/` or `api/`. The data already arrives (`admin-list-users.ts` selects `*`) and dies at the `UserRow` type and the row→doc map in `AdminDashboard.tsx`.
- **PR 6** — measured: `questions.json` is 78 keys, 3.84 MB of values in a 6.43 MB file; the missing 2.6 MB is repeated key names. Deleting zero-reference fields buys ~9%. A runtime/analytics **split** buys ~69%. ⚠️ ~15 scripts author this file — commit both artifacts and add a `scan:bank-sync` check, or content edits silently stop reaching users.
- **PR 7** — 156 `isA = variant === 'atelier'` conditionals across 7 files; zero call sites pass `'atelier'`. ⛔ The CSS tokens at `src/index.css:226-245` are **live app-wide** — delete the TS branches only.
- **PR 9** — 229 of 250 legacy `item_*` questions ship explanations cut off mid-sentence (0 of 991 `PQ_*` affected). The originals do not exist: `CORRECT_Explanation` has been 79+ chars since the commit it landed in, and `rationale` is truncated identically, so there is no fallback field.

---

## §3 · Migration registry

**Claim a number here before writing the file.** The 0029 collision below is the second such collision; this table is the fix.

| # | Purpose | State |
|---|---|---|
| 0000–0016 | schema bootstrap through baseline snapshot | applied |
| 0017, 0018 | `remote_history_placeholder` — sync with remote history, no local change | applied |
| 0019 | `consent_tracking` | applied · wired, fragile (see §2 PR 1) |
| **0020** | `simplified_onboarding` — 6 columns | applied · **zero code references.** The single-page onboarding flow was never shipped; `OnboardingFlow.tsx` still uses the old schema. **Reserved, not dropped** (D5) |
| **0021** | `post_assessment_snapshot` | applied · **zero code references.** The promised readiness moment at 32/45 Demonstrating was never built. **Reserved, not dropped** (D5) |
| 0022 | `diagnostic_wrong_count` | applied · wired |
| 0023 | `selected_answer` | applied · wired |
| 0024 | `vocab_attempts` | applied · wired (`vocabDrillService.ts:79`) |
| 0025 | `account_deletion_request` | applied · **write-only until §2 PR 3** |
| 0026 | `retake_complete` | applied · wired |
| 0027 | `harden_function_search_path` | applied |
| 0028 | `security_definer_to_invoker` | applied |
| **0029** | **RESERVED — Glossary overhaul.** Unbuilt. Reservation predates the item-analysis branch and wins | reserved |
| **0030** | item-analysis snapshots — currently numbered 0029 on `feat/item-analysis-snapshots`; **renumber before landing** | unmerged |
| **0031** | drop `user_subscriptions` (Stripe deletion, D4) | planned |

---

## §4 · Open product work

Not yet sequenced into §2. An item graduates *out* of `docs/PENDING_IDEAS.md` *into* §2 when it gets a slot.

- **Glossary overhaul** — #1 product priority, not started. 396-term filterable/searchable glossary with per-term smart weight, weak-areas filter, and a `getWeakTermsForTutor()` seam. Removes the write-your-definition flow and the embedded Quiz Mode tab. Migration 0029. Details in `PENDING_IDEAS.md`.
- **Fluency Drill follow-ups** — select-all-that-apply variant; fold `vocab_attempts` into `globalScoreCalculator` so nudges survive a global recompute; per-skill display-name map for "By skill" scope.
- **Extend section rebuild** — §2 PR 8 removes the placeholder. Building the real thing is mockup-first product work.
- **Phase B content regen** — 29 collapsed skills / 692 questions need `construct_actually_tested` + `complexity_rationale`. Tracked in `docs/ISSUE_LEDGER.md` (the one `open` entry).
- **SME sign-offs (4)** — prereq edges, Pack 4 `etsTopicIds`, misconception links, exam weights. See `docs/PHASE2_REVIEW_BACKLOG.md`.
- **`useProgressTracking` has no error state** — a failed fetch renders a silent zero dashboard on Modules/Home. Real surgery on a shared hook; scope as its own small PR with a deploy-preview look.
- **Breadcrumbs on module/skill sub-pages** — `BreadcrumbPillNav` exists and is underused. Adding persistent nav chrome is a visual change → mockup-first.
- **Loading skeletons** — bare "Finding relevant questions…" text in `PracticeSession`; full-page spinner in `GlossaryPage`. Low severity, no dependencies.
- **App.tsx JSX extraction (E4)** — 1,832 lines against a ≤1,400 target; the remaining bulk is the home-screen render tree, not logic.
- **Refresh-or-archive the three stale-banner docs** — `REWRITE_DEVELOPMENT_GUIDE.md` (verified 2026-03-15), `CODEBASE_OVERVIEW.md` (2026-03-14), `ASSESSMENT_DATA_FLOW_ANALYSIS.md` (2026-03-18). All three carry banners saying to defer to code, and all three point here. Either re-verify them against current code or move them to `archive/`; a permanent "trust this except when you shouldn't" state is the worst of both.
- **Repo hygiene** — archive-then-delete the closed-PR remote branches; 4 hardcoded proficiency literals at `App.tsx:606`, `App.tsx:1165`, `useAdaptiveLearning.ts:27-28`; reconcile `PHASE2_REVIEW_BACKLOG.md`; 2 leftover stashes need a keep/drop call from Carlos.

**Parked by decision — do not implement without revisiting:** AI Tutor time-limited worksheet locker · Case Study drill · post-diagnostic skill-tile color map · reassessment REPLACE-vs-AVERAGE scoring (deliberate open design question) · Phase 3 content (exclusive modules for the ~30 skills without one, verification pass over machine-generated items, reusable case bank).

---

## §5 · Decision register

| # | Decision | Decided | By |
|---|---|---|---|
| D1 | **PASS is a separate future product.** `docs/pass_migration/` stays as spec extraction; `00_PRODUCT_CONTRACT.md` is not vendored; completion for this product is §1 | 2026-07-26 | Carlos |
| D2 | **Regenerate** the 229 truncated legacy explanations rather than retiring the 250 items. Retirement would drop the per-skill floor 22→20, break `questionsJsonSchema.test.ts:153` (asserts >1000), and falsify the published "1,000+ questions" claim | 2026-07-26 | Carlos |
| D3 | **Remove** the Extend "Coming Soon" placeholder; queue the real feature | 2026-07-26 | Carlos |
| D4 | **Delete** the Stripe subsystem | 2026-07-26 | Carlos |
| D5 | Orphaned migrations 0020/0021: **reserve, do not drop.** Dropping columns is irreversible against production data and buys nothing | 2026-07-26 | plan |
| — | *Historical decisions (2026-06-10 register): durable "1,000+" copy over exact counts · retake scoring = replace, latest-wins, prefer-unseen · keep the Emerging/Approaching/Demonstrating labels · park the Study Notebook* | 2026-06-10 | Carlos |

---

## §6 · Retired plans

Archived to `archive/docs-plans-2026-07/` on 2026-07-26. Open items were extracted into §1/§2/§4 in the same commit; nothing was left stranded.

| Retired doc | Covered | Extracted to |
|---|---|---|
| `LAUNCH_READINESS.md` | 3-tier launch gates, 2026-04-15 audit | §1, refreshed and re-verified |
| `PLAN_2026-07-08_design-audit-remediation.md` | 42-finding design/UX audit. Phases A, B, C **all shipped** — its claim that PR #57 was unmerged is false (`1d70eb8`) and Phase C is live in `App.tsx`, `DashboardHome.tsx`, `ScoreReport.tsx` | §4: error-path plumbing, breadcrumbs, skeletons |
| `PLAN_2026-07-02_code-review-followups.md` | Full-codebase review remediation. Phases 1–6 shipped (#46/#47/#50/#51) | §4: Phase B regen, App.tsx E4. Stripe re-enable checklist **died with D4**. E2E harness **superseded** — `e2e/` exists; the live remainder is credentials (§2 PR 5) |
| `PLAN_2026-06-16_cleanup-and-backlog.md` | Repo cleanup + backlog sweep, 11/15 done | §4: Glossary, Fluency Drill, repo hygiene, stashes |
| `HANDOFF_2026-06-11_phase2-finalization.md` | Content architecture Phase 2 — shipped via PRs #37/#38 | §4: branch reconciliation. Its §7 paste-ready launch prompts are dead and were dropped. SME items already live in `PHASE2_REVIEW_BACKLOG.md` and were not duplicated |

**Two referenced files never existed.** `PENDING_IDEAS.md` and `PRODUCT_ROADMAP_2026-06-02.md` both pointed at `.claude/plans/mighty-conjuring-hummingbird.md` and `.claude/plans/okay-currently-uh-currently-reactive-lantern.md` — the latter described as "the approved plan" for the #1-priority Glossary overhaul. Neither is in the repo and `.claude/` is gitignored, so they were never recoverable. The Glossary overhaul's requirements as captured in `PENDING_IDEAS.md` are all that survives; treat that as the spec.

### Division of labour after this consolidation

| Doc | Role |
|---|---|
| `docs/MASTER_PLAN.md` | **This file.** Sequenced committed work, launch gates, decisions, migration numbers |
| `docs/PENDING_IDEAS.md` | Unsequenced ideas. Graduate into §2 when sequenced |
| `docs/ISSUE_LEDGER.md` | Bugs, mismatches, watch items |
| `docs/HOW_THE_APP_WORKS.md` | What exists today, in plain language. Same-commit update rule |
| `docs/PHASE2_REVIEW_BACKLOG.md` | SME review sign-offs |
| `CHANGELOG.md` | Implementation history |
