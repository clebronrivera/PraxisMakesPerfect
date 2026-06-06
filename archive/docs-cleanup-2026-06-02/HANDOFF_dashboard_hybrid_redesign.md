# Handoff — Hybrid Dashboard Redesign + Data Wiring Map

> Self-contained continuation doc. Picks up from the indigo/violet re-theme
> (`HANDOFF_indigo_violet_retheme.md`) and goes one layer deeper: not just re-coloring the
> dashboard, but **reorganizing it to surface data the app already computes but never shows.**
> Direction is locked. **No React changes yet** — this is mockups + a wiring map.

---

## TL;DR

- Reevaluated the dashboard around **what a student actually asks**: *What do I do now? / Am I
  improving? / What's wrong with my understanding?* — i.e. **Act / Improve / Understand**.
- Built **3 concept mockups** + a chosen **Hybrid** that fuses them. User picked **Hybrid (A+B+C)**.
- Used a **generative design tool (Google Stitch, Gemini 3.1 Pro)** for a fresh-eyes pass; it
  validated the layout and contributed 2 ideas folded into the Hybrid (thin This-Week strip; the
  "AI note" evidence chip in the misconception spotlight).
- The core finding: the dashboard is **visually fine but informationally shy**. The app computes a
  full intelligence layer (trend, baseline deltas, named misconceptions, confidence calibration,
  exam date) and shows almost none of it. The redesign surfaces it.

## Mockups (all in `public/`, served by the mockup server on :3033)

| File | What it is |
|---|---|
| `mockup-dashboard-hybrid.html` | **CANONICAL — build this.** The chosen Hybrid dashboard. |
| `mockup-dashboard-concepts.html` | The 3 source concepts via top switcher (A Command Center / B Momentum / C Diagnostic Insight). Reference. |
| `local/stitch/hybrid-v1.png` / `.html` | Stitch's generative pass. Inspiration only — not the build target. |

Stitch project: `projects/4029779327524238186` · design system asset `assets/14646625900834702442`
("Praxis Bright Multi-Gradient", light, Inter, violet→indigo + 4 domain gradients).

Start the server with `preview_start("mockup")`; open `/mockup-dashboard-hybrid.html`.

---

## The Hybrid — section order (top → bottom)

1. **Hero band** (violet→indigo): exam **countdown** · **readiness trajectory** chart (baseline →
   today → dashed projection vs dashed target) · **readiness ring**. (= A's countdown + B's trajectory)
2. **This Week strip** (thin, white): Questions · Study time · Accuracy · Today's-goal bar · streak chip.
3. **Action queue** (4 cards): Misconceptions · Spaced review · Redemption · Fragile skills. (= A)
4. **Your next 20 minutes** (chained plan) + **Misconception spotlight** (named wrong belief + AI note). (= A + C)
5. **Understanding map** (45-skill heatmap, glyphs for signals) + **Where you stand** (counts). (= C)
6. **Movers this week** (gainers/decliners) + **Domains vs baseline** (deltas). (= B)
7. **The Toolshed** (unchanged — kept per re-theme handoff).

---

## Data Wiring Map

Status legend:
- 🟢 **Already in dashboard props** — element exists today or the value is already passed to `DashboardHome`.
- 🟡 **Surface from existing engine** — the value IS computed (preprocessor / learning-state / concept
  analytics) but is not piped to the dashboard. Work = expose it, no new analytics.
- 🔴 **New plumbing** — genuinely new capture/aggregation needed.

Key source files (verified during exploration):
- `src/components/DashboardHome.tsx` — the component; props interface ~lines 22–61.
- `App.tsx` — dashboard prop assembly ~lines 1508–1533; readiness logic ~1178–1187; SRS overdue
  ~529–540; weakest skill ~542–565; weekly stats ~567–578.
- `src/utils/skillProficiency.ts` — `getSkillProficiency`, `TOTAL_SKILLS`, `READINESS_TARGET` (32).
- `src/utils/progressSummaries.ts` — `buildProgressSummary` (per-skill `colorState`, domain rollups).
- `src/utils/studyPlanPreprocessor.ts` — `computeStudentSkillStates`: status label, `trend`,
  `firstHalfAccuracy`/`lastHalfAccuracy`, fragility/confidence flags. **Today only used by the study plan.**
- `src/brain/learning-state.ts` — `weightedAccuracy`, `computeFragilityFlag`, `computeUncertainSkillFlag`,
  `computeRapidGuessCount`, `srsBox`/`nextReviewDate`.
- `src/utils/conceptAnalytics.ts` — cross-skill vocabulary gaps, weak/strong concepts.
- `src/hooks/useRedemptionRounds.ts` — `bankCount`, `credits`, `missedSkillIds`.
- DB: `user_progress.planned_test_date` (migration 0002/0003 onboarding), `baseline_snapshot` (0016),
  `post_assessment_snapshot` (0021), `responses` (event log w/ `created_at`, `confidence`, `time_on_item_seconds`).

### Hero

| Element | Source | Status | Notes |
|---|---|---|---|
| Exam countdown "38 days · Jul 8" | `user_progress.planned_test_date` | 🟡 | Field exists (onboarding) but never read by the dashboard. `days = test_date − today`. Null test date → show a "Set your exam date" CTA instead. |
| Readiness ring 41% · "13 / 32 skills" | `demonstratingCount` / `readinessTarget` | 🟢 | Already on the current dashboard. |
| Target line 71% | `readinessTarget` = `ceil(45 × 0.7)` = 32 (→ 71%) | 🟢 | Constant; render as the dashed target. |
| Trajectory: today point (41%) | `demonstratingCount / readinessTarget` | 🟢 | Current readiness as a %. |
| Trajectory: baseline point (22%) | `user_progress.baseline_snapshot` | 🟡 | Stored at first diagnostic; compute its readiness %. Surface only. |
| Trajectory: **intermediate points** | — | 🔴 | Not stored. Needs a lightweight **periodic readiness snapshot** (e.g. weekly row, or piggyback on `post_assessment_snapshot`). Until then, render baseline→today as a 2-point line — still valuable. |
| Trajectory: **projection** to exam day | linear extrapolation of baseline→today across days-to-exam | 🔴 | Small util. Needs baseline date + test date. |
| "~4 skills behind pace" | needed-rate vs actual-rate | 🔴 | Small util: `needed = (target − current) / days_left` vs observed weekly gain. Derived, no new storage. |

### This Week strip

| Element | Source | Status |
|---|---|---|
| Questions / Study time / Accuracy / Today's goal / Streak | `weeklyQuestionCount`, `weeklyUsageSeconds`, `weeklyAccuracy`, `dailyQuestionCount`/`DAILY_GOAL`, `profile.streak` | 🟢 All already passed to `DashboardHome`. |

### Action queue

| Card | Source | Status | Notes |
|---|---|---|---|
| Misconceptions to fix (N) | `computeStudentSkillStates` status === `misconception` | 🟡 | Computed in preprocessor (study-plan path). Run it (or a light client calc) for the dashboard and count + list. |
| Spaced review due (N) | `srsOverdueSkills` (App.tsx ~529) | 🟢 | Already computed; partially shown today. |
| In Redemption (N) + credits | `redemption.bankCount`, `redemption.credits` | 🟢 | Already passed. |
| Fragile skills (N) | `computeFragilityFlag` (low-confidence-correct) | 🟡 | Computed in `learning-state` but shadow-mode. Surface a count + list. |

### Next 20 minutes + Misconception spotlight

| Element | Source | Status | Notes |
|---|---|---|---|
| Priority skill (name, domain, "3× wrong") | `weakestSkill` + preprocessor urgency + `profile.skillDistractorErrors` | 🟡 | Pieces exist. New = light **chaining logic** ordering misconception > SRS > redemption. |
| "Then" rows | same as queue sources | 🟢/🟡 | Reuse queue data. |
| Time estimates (~6 min) | questions × avg `time_on_item_seconds` | 🔴 | Optional heuristic; safe to omit v1. |
| **Named misconception** ("reliability vs validity") | dominant distractor (`skillDistractorErrors`) → distractor metadata `misconception`/`knowledge_gap` (3,587 classified distractors) | 🟡 | **The crown-jewel surfacing.** Data fully exists (drives the study guide today). New = client-side lookup of the top misconception skill's dominant distractor text. |
| AI-note evidence ("3 recent sets") | `responses` grouped by session where that distractor chosen | 🔴 | Optional. v1 can say "chosen 3×" (already tracked) instead. |

### Understanding map + Where you stand

| Element | Source | Status |
|---|---|---|
| 45 skill cells colored by proficiency | `progressSummary.skills[].colorState` / `getSkillProficiency` | 🟢 Per-skill proficiency already computed. |
| Glyph `!` misconception | preprocessor status | 🟡 |
| Glyph `▲` improving | `computeTrend` (needs ≥6 attempts) | 🟡 |
| Glyph `~` fragile | `computeFragilityFlag` | 🟡 |
| Counts 13 / 18 / 14 | `progressSummary` proficiency buckets | 🟢 |
| misconception / fragile / improving totals | as above | 🟡 |

### Movers + Domains vs baseline

| Element | Source | Status | Notes |
|---|---|---|---|
| Gainers / decliners (per-skill Δ "this week") | time-windowed accuracy (last 7d vs prior) | 🔴 | `firstHalf/lastHalf` accuracy exists but isn't time-windowed. Weekly delta needs the readiness-snapshot history (above) **or** a windowed `responses` aggregation by `created_at`. |
| Domain current % | `progressSummary` / `domainScores` | 🟢 |
| Domain Δ vs baseline | `baseline_snapshot` domain scores vs now | 🟡 | Baseline stored (0016); surface the delta. |

---

## What "new plumbing" actually amounts to

Only **four** genuinely new pieces — everything else is surfacing what already exists:

1. **Readiness-history snapshots** (powers the trajectory line's middle + weekly movers). Lightest
   version: one readiness % row per week. Could extend `post_assessment_snapshot` (0021) or add a
   tiny `readiness_snapshots` table / JSONB array on `user_progress`.
2. **Pace/behind util** (`needed rate` vs `actual rate`) — pure function, needs test date + baseline date.
3. **Projection util** — linear extrapolation to exam day — pure function.
4. *(optional)* time estimates + AI-note evidence aggregation — defer to v2.

Everything tagged 🟡 is a **prop-plumbing job**: run the existing preprocessor / learning-state /
concept-analytics outputs through `App.tsx` into `DashboardHome` props. No new analytics math.

## Suggested build staging (each its own all-green commit)

- **H0 — fast wins (all 🟢/🟡, no DB):** countdown (read `planned_test_date`), 2-point trajectory
  (baseline→today, no projection yet), action queue (misconceptions/fragile counts surfaced),
  named misconception spotlight, heatmap + glyphs, domain-vs-baseline deltas. This already
  transforms the dashboard with **zero schema changes**.
- **H1 — trajectory depth:** add readiness snapshots → full multi-point line + projection + pace +
  weekly movers.
- **H2 — polish:** time estimates, AI-note evidence, chaining heuristics.

## Doc-update rule check (`CLAUDE.md`)

A color/layout re-theme does **not** trigger the `HOW_THE_APP_WORKS.md` update rule. But this
redesign **adds user-facing surfaces** (exam countdown, named-misconception card, trajectory, fragile/
mover language). When those ship, update `HOW_THE_APP_WORKS.md` → "The Home Dashboard" section
(currently lists greeting hero / 4 summary cards / daily goal / high-impact skills / shortcuts rail).
Do **not** rename status or proficiency labels.

## Still open

1. **Version control:** mockups + this handoff are UNCOMMITTED (mockups → `public/` or `local/` per
   repo hygiene; handoff → `docs/`). Confirm + commit.
2. **Trajectory data policy:** decide the readiness-snapshot mechanism (H1) before building that band fully.
3. Direction approval on `mockup-dashboard-hybrid.html` before any React work (mockup-first rule).
