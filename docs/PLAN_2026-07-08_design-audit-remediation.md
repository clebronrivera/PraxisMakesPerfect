# Design-Audit Remediation Plan — 2026-07-08

> **Single source of truth for finishing the 2026-07-08 design/UX audit remediation.**
> Full audit report (42 findings, 6 dimensions, severity-tagged): the artifact delivered
> in-chat that session — ask Carlos to re-share the link if it's not in current scrollback,
> or regenerate from scratch (`design:design-critique` skill) if truly lost; nothing here
> depends on re-reading it, this doc already extracted everything actionable.

## 0 · HOW TO USE THIS DOC (anti-drift — read every session)

1. **Re-read this whole file at the start of every session and after each completed task.**
2. **Work phases in order.** Phase C cannot start until its ⛔ gate (mockup approval) is met.
3. **Update the Status column (☐ → 🔄 → ✅) here in the same commit as the work.**
4. **Run the gate green before every commit:** `npm run scan:types && npm run scan:colors && npm run scan:buttons && npm run lint && npx vitest run && vite build`.
5. **Merging to `main` = production deploy** (Netlify `production_branch=main`, auto-deploy ON). Confirm with Carlos before merging PR #57 — he needs to look at the real authenticated app first; nothing in this repo's tooling can do that step.
6. **Mockup-first for any UI change** per `CLAUDE.md`. Phase C's three items are the only remaining UI changes and are the reason this doc exists — do NOT touch `DashboardHome.tsx` / `App.tsx` / `ScoreReport.tsx` for these three specific changes until Carlos has explicitly approved the mockups (see Phase C gate).
7. **If reality diverges from this plan, fix this doc first, then proceed.**

---

## Where everything lives

- **Branch:** `claude/intelligent-lumiere-13b41d`
- **PR:** [#57 — "UI consistency: Button/IconButton/Surface primitives + app-wide button migration"](https://github.com/clebronrivera/PraxisMakesPerfect/pull/57) — **OPEN**, all work below is commits on this one PR (not split into separate PRs — see note under Phase A).
- **6 commits on the branch, all pushed**, oldest→newest:
  1. `bab6ed5` — Button/Surface primitives + app-wide button migration (~79 buttons, 29 files)
  2. `4419bae` — IconButton primitive + `scripts/check-buttons.mjs` regression guard
  3. `5287720` — design-audit quick wins (motion plugin, error toasts, contrast, copy fixes)
  4. `8a9be1c` — **Phase A**: tokens & consistency sweep (32 files)
  5. `d0f159c` — **Phase B**: robustness & accessibility (20 files + new `useDialogFocus` hook)
  6. `ac1553e` — **Phase C**: App.tsx / DashboardHome.tsx / ScoreReport.tsx, see below
- Branch merged current `main` on 2026-07-10 (was 1 commit behind, #43 SEO/meta) — no longer `BEHIND` in GitHub's mergeability check.
- **3 mockup files exist on disk at `public/mockup-*.html`, gitignored — worktree-local only.** If you're in a fresh checkout/worktree they will NOT be there. Carlos was sent the actual files via the chat's file-delivery mechanism and has copies; screenshots of all three are also in that session's transcript. If both are unavailable, regenerate from the descriptions in Phase C below — every one is specified precisely enough to rebuild.
- **This doc itself was untracked for a while (2026-07-03→2026-07-08), sitting only in the main checkout's working directory, never committed anywhere.** Copied onto this branch and committed alongside Phase C so it isn't one stray file away from being lost.

---

## DONE — Phase A: Tokens & consistency (commit `8a9be1c`)

Collapsed 3 duplicate overline/label CSS classes into one canonical `.editorial-overline` (fixed a real contrast bug in the process — `text-slate-400` → `text-slate-500`), added a `.stat-hero` token for the one "overall score" reveal shared by ScoreReport/ScreenerResults, fixed heading semantics (`<p>`→`<h2>/<h3>`) on 4 files, adopted `<Surface>` in the remaining files that hand-rolled the card recipe, unified `rounded-[1.5rem]`/`rounded-3xl` spelling, fixed 2 non-responsive `grid-cols-3` rows, bumped touch targets to 44px. 32 files, 217 insertions / 217 deletions (net-zero — pure swaps). Full detail in the commit message.

**Status: ✅ shipped, verified, pushed. Nothing left to do here.**

## DONE — Phase B: Robustness & accessibility (commit `d0f159c`)

New `src/hooks/useDialogFocus.ts` (Escape-to-close, scroll-lock, focus trap, focus restore) wired into all 6 modals/drawers. Routed ~20 previously-silent `console.error` catches through the existing toast system (`notifyError`) — fixed several genuine "fake success" bugs along the way (glossary term removal, module notes autosave, vocab drill results, post-retake score recalculation was silently defaulting to a misleading 0% readiness). Added a Retry button to the AI Tutor's error state (`useTutorChat` now tracks the last-attempted send). Threaded `id`/`htmlFor` through OnboardingFlow's 7 real form fields (previously unassociated — screen readers announced "edit text, blank"). Full detail in the commit message, including **3 explicitly deferred items** (see "Parked" section below — do not silently re-attempt these without reading why they were deferred).

**Status: ✅ shipped, verified, pushed. Nothing left to do here.**

---

## DONE — Phase C: IA & delight (implemented 2026-07-08, pushed; pending Carlos's visual check)

Carlos reviewed all 3 mockups (rendered live via the mockup server) in the 2026-07-08 follow-up session and said to proceed. All 3 implemented directly into the named target files, full gate green (types/colors/buttons/lint/319 tests/build).

| # | Item | Mockup file | Target file(s) | Status |
|---|---|---|---|---|
| [C1] | **First-run home — single dominant CTA.** New users currently saw two co-equal cards ("Take the diagnostic" vs "Start practicing right away") with no signal which one PASS recommends. Now: one dominant gradient CTA band ("Recommended first step — Take the adaptive diagnostic") with practice-now demoted to a quiet text link (`Start practicing right away →`, routes to `practice-hub`) below it. **Nothing deleted** — the fallback branch (diagnostic already in progress/complete) keeps the old "Practice" card verbatim; the right-hand "Quick start" sidebar (Random Questions / Browse by Domain buttons) is untouched. | `public/mockup-firstrun-diagnostic-cta.html` | `App.tsx` — `isNewUser` block, ~line 1268 (`Welcome to PASS`) | ✅ |
| [C2] | **Dashboard — priority reorder.** "Today's Focus" (+ This Week/Redemption sidebar, kept as one unit — splitting them apart wasn't in the mockup and would've added unreviewed layout risk) moved from position 3 to position 2, directly under the status hero, ahead of the Four Domains grid. Pure `<section>` block relocation — zero JSX changed inside either section. Header comment block (top of file) updated to match the new order. | `public/mockup-dashboard-priority-reorder.html` | `src/components/DashboardHome.tsx` | ✅ |
| [C3] | **Score reveal — count-up delight.** New `AnimatedScorePercentage` component (useState + rAF + easeOutCubic, ~700ms) replaces the static `{scorePercentage}%`. Respects `prefers-reduced-motion` (checked via `matchMedia`, sets the final value instantly). Scoped to the count-up only — the mockup's trophy-entrance/caption-fade flourishes were left out as unapproved scope creep beyond what this doc's target-file description called for. | `public/mockup-score-reveal-delight.html` | `src/components/ScoreReport.tsx` | ✅ |

**Status: ✅ implemented, gate-green, committed (`ac1553e`), and pushed to `origin/claude/intelligent-lumiere-13b41d` (PR #57 updated).** Re-verified 2026-07-10: C1/C2/C3 all confirmed present and wired in their target files, full gate re-run green (types/colors/buttons/lint/319 tests/build). **Not yet done:** Carlos's own visual check of these 3 in the deploy preview — the coding session cannot log in to confirm the authenticated screens render correctly; mechanical verification only, not visual.

---

## Parked — do NOT start without explicit Carlos go

| # | Item | Why it's parked |
|---|---|---|
| [P1] | **Modules/Dashboard "no error path."** `useProgressTracking` (the hook `DashboardHome`/`ModulesBrowser` ultimately depend on) has zero error state today — a failed fetch renders as an empty/zero dashboard with no signal. Real fix means adding error-state plumbing to a core, heavily-used hook. Deferred in Phase B specifically because that's genuine surgery to shared infrastructure with no way to visually verify the result from a coding session (app is auth-gated). If picked up: scope it as its own small PR, not folded into anything else, and get a deploy-preview look before merging. |
| [P2] | **Breadcrumbs on module/skill sub-pages.** `BreadcrumbPillNav` exists and is underused; audit rated this Med. Deferred because adding persistent nav chrome to pages that don't have it today reads as a visual change under `CLAUDE.md`'s mockup-first rule, not a mechanical consistency fix — needs its own mockup pass, not a quick add. |
| [P3] | **Loading skeletons** (bare "Finding relevant questions…" text in PracticeSession; full-page spinner in GlossaryPage instead of a skeleton). Both audit call-outs were rated Low severity — deliberately left out of Phase B to keep that PR's blast radius to correctness/a11y, not polish. Fine to pick up any time as a small standalone piece; no dependency on anything else in this doc. |

## Merge

**Nobody has merged PR #57 yet — including its original scope (the button/primitive migration from before this plan existed).** Every commit on it, across every phase, has been verified by the full local gate (types/colors/buttons/lint/tests/build) but **not visually verified in the live authenticated app** by anyone, because the app requires login and the tooling available in a coding session can't do that. This isn't a formality — it's the one step nobody but Carlos can do. Before merging:

1. Open the PR's Netlify deploy preview.
2. Log in, click through: Account page, Dashboard, a Practice session, Score Report / Screener Results, Study Guide, AI Tutor, Glossary, one admin modal (Feedback or Report Question) — the screens with the heaviest edits across all 3 phases.
3. If Phase C landed, specifically check whatever was approved there.
4. If it looks right, merge. It's a production deploy the moment it lands on `main`.

## Decisions needed from Carlos

1. ~~Phase C scope~~ — **resolved 2026-07-08**, Carlos said proceed with all 3 after reviewing rendered mockups.
2. **The visual look at PR #57** described in "Merge" above — this is the one step that unblocks shipping everything already done, Phase C included. Still outstanding.

Everything else in Phases A/B/C is finished (code-complete + gate green) and needs no further decisions — only the merge-time visual check above.
