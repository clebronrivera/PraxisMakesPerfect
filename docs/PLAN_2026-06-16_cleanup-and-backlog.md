# Cleanup & Backlog Master Plan — 2026-06-16

> **This is the single source of truth for clearing the pending-work backlog and cleaning up the repo.**
> It captures *everything* open as of 2026-06-16: in-flight PRs, stashes, stale branches/worktrees, stale
> tracking docs, and the forward feature backlog. Work it **in phase order**, update the status boxes
> **inline in the same commit as the work**, and do not work from memory.

## 0 · HOW TO USE THIS DOC (anti-drift — read every session)

1. **Re-read this whole file at the start of every session and after each completed task.**
2. **Work phases in order.** Don't start a task whose dependency (⛔) is unmet.
3. **Update the Status box (☐ → 🔄 → ✅) here in the same commit as the work.**
4. **Run the gate green before every commit:** `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.
5. **Merging to `main` = production deploy** (Netlify `production_branch=main`, auto-deploy ON). Treat every main-merge as a ship — confirm with Carlos first.
6. **Mockup-first for any UI** (standalone HTML in `public/`, rendered in preview, screenshot, sign-off) before React. See `CLAUDE.md`.
7. **If reality diverges from this plan, fix this doc first, then proceed.**

Mirrors the in-session task list (task IDs in brackets). Companion backlog docs: `docs/PENDING_IDEAS.md`,
`docs/PHASE2_REVIEW_BACKLOG.md`, `docs/ISSUE_LEDGER.md`, `docs/PRODUCT_ROADMAP_2026-06-02.md`.

---

## Snapshot — what's actually pending (2026-06-16)

The bulk of **Phase 2** already shipped to `main` via **PR #37** (2026-06-12): retake/A4 logic,
migrations through `0026`, C4 Floor-5 (bank 1,150→1,200). What remains:

- **PR #38** (`claude/cool-lalande-eaf9d3`, OPEN, mergeable, behind main) — the Phase 2 *tail*:
  C4 final 5 skills (+41, bank →**1,241**), retake unit test, and `0027`/`0028` migration files (repo↔DB reconcile).
- **3 other open PRs** — all stale/superseded: #35 (conflicting), #28 (conflicting, superseded aesthetic), #18 (draft, superseded).
- **4 stashes** — `stash@{0}` is real glossary-citations work at risk; the other 3 are applied/obsolete.
- **~10 stale worktrees** + several fully-merged branches = cleanup clutter.
- **Stale tracking docs** — ISSUE_LEDGER/PHASE2 backlog list items the A4 retake already resolved.
- **Forward backlog** — Staged Study Guide (active), Glossary overhaul (#1 priority), Fluency Drill follow-ups.

---

## PHASE 1 — Rescue at-risk uncommitted work  ·  *safe, local, do first*

| # | Task | Status |
|---|---|---|
| [1] | **Rescue glossary-citations stash** — `stash@{0}` (+543/-271 `master-glossary.json`: citationSchema + per-term legal/framework citations verified vs eCFR/U.S. Reports). Apply to `feat/glossary-citations` off `main`, commit, gate green. Feeds Phase 6 Glossary overhaul. | ✅ `674dd1a` on `feat/glossary-citations` — 396 terms preserved, 270 citations, gate green |
| [2] | **Triage 2 dirty worktrees** — `elated-sanderson` (2 files), `relaxed-rubin` (4 files). Inspect, rescue anything valuable, else mark disposable. | ✅ rescued to `archive/elated-sanderson-wip-2026-06-16` (`064041e`, learning-path handoff doc) + `archive/offline-diagnostic-prototype-2026-06-16` (`54d7982`, 3 source files; 6.2MB question-dump excluded as regenerable) |
| [3] | **Drop applied/obsolete stashes** — `stash@{2}` (study-plan refactor, already on main) → drop. Verify+drop `stash@{1}`, `stash@{3}`. Keep `stash@{0}` until [1] done. | ✅ dropped `stash@{0}` (rescued) + `stash@{2}` (on main). ⚠️ 2 low-value auto-stashes left for user call: playwright e2e-harness seed (`@playwright/test` not on main) + phase-2a/hero (Sentry already on main; stale CLAUDE.md text refs "1,150") |

## PHASE 2 — Land the in-flight Phase 2 tail (PR #38)  ·  *production gate*

| # | Task | Dep | Status |
|---|---|---|---|
| [4] | **Update PR #38 against main + gate** — merge `main` into `cool-lalande` (clean; main only moved landing files), run full gate green. | — | ✅ merged main → `ef8e329`; CI `check` green (1m10s) + deploy-preview pass |
| [5] | **Merge PR #38 → main** ⚠️ **PRODUCTION DEPLOY.** Lands C4 final 5, retake test, 0027/0028. | ⛔[4] | ✅ **MERGED** `f02a20b` (Carlos-approved); remote branch auto-deleted; Netlify deploying. 0027/0028 already applied to live DB (repo↔DB reconcile — no DB action). |
| [6] | **Bump bank size** in `HOW_THE_APP_WORKS.md` (prefer durable "1,200+"). Mandatory per CLAUDE.md. | ⛔[5] | ✅ done inside PR #38 ("1,150" → durable "1,200+") |

## PHASE 3 — Triage the other 3 open PRs

| # | Task | Status |
|---|---|---|
| [7] | **PR #35** (centralize proficiency thresholds) — Rebase+merge or close. | ✅ **CLOSED.** Rebase attempt showed it's 143-commit stale + reintroduces deleted UI (`DashboardHome` "Four Domains"); main already centralized most consumers. Residual = 4 literals → see "Residual follow-up" below. |
| [8] | **PR #28** (CC clarity a11y) — superseded by indigo/violet + PASS landing. | ✅ **CLOSED** with note; conflicting + aesthetic no longer exists. Any live a11y wins → fresh scoped PR. |
| [9] | **PR #18** (Cosmos mockup, DRAFT) — superseded by shipped PASS landing (#31) + landing v5/v6 (#39). | ✅ **CLOSED** with note. |

**→ 0 open PRs remaining.**

## PHASE 4 — Branch & worktree cleanup

| # | Task | Dep | Status |
|---|---|---|---|
| [10] | **Remove clean stale worktrees** — 7 abandoned @ f1b5075 + infallible-tharp + xenodochial. Keep current (ecstatic-gagarin). | ⛔[2] | ✅ **14 worktrees → 4** (kept: main, PMP-hopeful-benz, ecstatic-gagarin, quirky-kirch/PR#35) |
| [11] | **Delete merged/superseded branches** — local merged: 16 throwaway claude/* + 3 feat. Kept `explore/dashboard-redesign` (memory anchor). | ⛔[7][8][9] | 🔄 **local: 28 → 12 branches** done; quirky-kirch worktree removed → **3 worktrees**. **Pending (needs confirm, archive-first per convention):** delete remote branches of closed PRs — `origin/chore/centralize-proficiency-thresholds`, `origin/fix/cc-clarity-missed-components`, `origin/feat/mockup-pass-cosmos-handoff`, `origin/feat/restore-cognitive-clarity`, `origin/claude/quirky-kirch-eaf...`/test-coverage-analysis. |

## PHASE 5 — Reconcile stale tracking docs

| # | Task | Status |
|---|---|---|
| [12] | **Reconcile docs** — ISSUE_LEDGER: close A4-resolved items (final-assessment unlock flow; practice-repeat policy now prefer-unseen). PHASE2_REVIEW_BACKLOG: update post-C3/C-B2. PENDING_IDEAS: migration-number conflict. | 🔄 PENDING_IDEAS migration-number fix ✅ done (`21144ac`). ISSUE_LEDGER + PHASE2_REVIEW_BACKLOG status reconcile still ☐. |

## PHASE 6 — Forward feature work  ·  *mockup-first, in priority order*

| # | Task | Dep | Status |
|---|---|---|---|
| [13] | **Staged / simplified Study Guide** (ACTIVE / first-focus) — per-area cards (score chip + plain meaning + example + Practice/Review/Test). Pure presentation refactor of `StudyPlanViewer`, reuses `StudyPlanDocumentV2`. Mockup-first. | — | ✅ **Built → PR #41** (`feat/staged-study-guide`, CI green). Mockup already existed+verified; ported to `StagedStudyGuide.tsx`, integrated in `StudyPlanCard` (Detailed-view escape hatch) + `App.tsx` launcher threading. **Live verify on deploy-preview-41** (auth-gated). Follow-up: Test button → no dedicated timed mode yet. |
| [14] | **Glossary overhaul** (#1 product priority) — 396-term filterable/searchable, per-term smart-weight, weak-areas filter, `getWeakTermsForTutor()` seam. Removes write-your-def flow + VocabularyQuizMode tab. Absorbs [1]. Migration 0029. Data layer → mockup-first UI. | ⛔[1] | ☐ |
| [15] | **Fluency Drill follow-ups** — select-all-by-skill variant; vocab feedback v2 (fold `vocab_attempts` into `globalScoreCalculator`); per-skill display-name map for "By skill" scope. | — | ☐ |

---

## Residual follow-ups surfaced during cleanup (low priority, tracked so not lost)

- **Dependabot #12 (NEW, 1 high)** on the default branch — surfaced on push 2026-06-16
  (https://github.com/clebronrivera/PraxisMakesPerfect/security/dependabot/12). Triage like #11 was
  (override/transitive bump). Not yet addressed.
- **PR #35 residual** — route the 4 still-hardcoded proficiency literals through the canonical
  `APPROACHING_THRESHOLD`/`DEMONSTRATING_THRESHOLD`: `App.tsx:606`, `App.tsx:1165` (both `score < 0.6`),
  `useAdaptiveLearning.ts:27-28` (`< 0.6 → +3`, `< 0.8 → +2`). ⚠️ `App.tsx` is a protected file — get an
  explicit go. Behavior-preserving. Tiny fresh PR off current main (do NOT revive the stale #35 branch).
- **2 leftover stashes (user call)** — `stash@{0}` playwright e2e-harness seed (`@playwright/test` not on
  main); `stash@{1}` phase-2a/hero (Sentry already on main; stale CLAUDE.md governance text refs "1,150").
  Both re-creatable/stale — drop or keep, Carlos's call.
- **Archive-then-delete the closed-PR remote branches** (per repo convention) — see [11].

## Deferred / parked (captured, not scheduled)

AI Tutor worksheet locker · Case Study drill · post-diagnostic skill-tile color map · Phase 3 content
(exclusive modules for ~30 skills w/o one, verification pass over machine-generated items, reusable case
bank) · PHASE2 SME reads (prereq edges, exam-weight confirm, misconception spot-check, ~30 module wording
notes) · reassessment REPLACE-vs-AVERAGE study (deliberate parked design question, do not implement).

_Status legend: ☐ todo · 🔄 in progress · ✅ done._
