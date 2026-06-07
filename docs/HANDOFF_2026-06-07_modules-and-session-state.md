# Handoff — Modules Redesign (built) + full session state
**Date:** 2026-06-07 · **Branch:** `explore/dashboard-redesign` (main repo) · **For:** the next session, cold.

> This is the master handoff. It covers the modules redesign (now **built and wired**), the four other workstreams touched this session, every pending item, every decision, and how to continue. Read Part 0 → Part 1 first.

---

## Part 0 — Orientation & critical context

- **Where the work lives:** everything is committed on branch **`explore/dashboard-redesign`** in the **main repo** (`/Users/lebron/Documents/PraxisMakesPerfect`), NOT on `main`. A fresh git worktree branched off `main` will NOT have it.
- **Deploys are manual** (`stop_builds=true`); merging to main does not deploy. Nothing here is "live" to users yet.
- **Color scheme is COOL indigo/violet.** Never use warm legacy hexes (`#fbfaf7`, `#e6dfd4`, …). Source of truth: **`docs/DESIGN_TOKENS.md`**. Guard: **`npm run scan:colors`** (runs in pre-commit). This was a repeated drift; don't reintroduce it.
- **Verification commands** (the repo has no `typecheck`/`validate:exams`): `npm run scan:types`, `npm run scan:colors`, `npm run lint`, `npm test`, `npm run build`.
- **Mockup-first rule** (CLAUDE.md): UI starts as a static mockup in `public/`, gets visual sign-off, then React. The modules mockups are approved.

---

## Part 1 — Modules Redesign: what's BUILT (this is the headline)

Replaced the deficit-sorted snake **`LearningPathNodeMap`** with a student-friendly **module browser**, wired into the live Learning Path tab.

**Files (all committed):**
| File | Role |
|---|---|
| `src/utils/moduleCatalog.ts` | Pure selector. `buildModuleCatalog`, `selectPriorityModules` (unpadded top-3), `recommendedProgress`, `DEFAULT_MODULE_PRIORITY_CONFIG`. |
| `tests/moduleCatalog.test.ts` | 15 tests encoding the 4 invariants + behavior. |
| `src/hooks/useModuleCatalog.ts` | Adapter — live `profile` + `lpProgress` → selector inputs. |
| `src/components/ModulesBrowser.tsx` | The UI (Regular/Adaptive, by-domain/by-weakness, priority, empty states). |
| `src/components/StudyModesSection.tsx` | Integration — `LearningPathPanel` now renders `<ModulesBrowser>` (drop-in, same props as the old node map). |
| `docs/HOW_THE_APP_WORKS.md` | Updated "Learning Path" section (mandatory rule). |

**Behavior implemented:**
- **Regular ↔ Adaptive** toggle. Adaptive hides mastered-skill modules, shows recommended-bucket progress (`reviewed / eligible · %`) and "N mastered hidden".
- **By domain ↔ By weakness** grouping. Domain = 4 colored sections w/ reviewed/total; weakness = ranked list w/ proficiency %.
- **"Close these first"** = `selectPriorityModules` (top 3, unpadded).
- **`priorityScore = examWeight × gapToThreshold × learnability`** (see Part 4).
- Module cards: domain icon, title, ⏱ time + ✦ activities, status pill (Not started / In progress / Reviewed), prereq "do a prerequisite first" affordance.
- a11y: cards are `<button>`, focus-visible rings, status = text+icon, `aria-pressed` toggles.

**Verified:** `scan:types` ✓ · `scan:colors` ✓ (4 guarded files) · `lint` ✓ · **191 tests** ✓ · `build` ✓.

**Live render — DONE via the dev preview harness** (commit `457f058`). The auth gate is bypassed in dev by a new harness: `npm run dev` → `http://localhost:5173/?preview=modules` mounts the real `ModulesBrowser` with stub data (no login). Verified rendering Regular/by-domain + by-weakness — the actual React component, not a mockup. (The OLD `dev:mock` / `VITE_PREVIEW_HOME_DASHBOARD` flag was vestigial/never wired — replaced by this.) Still pending: render against a **real logged-in account** end-to-end (the harness uses stub data), and the per-module-status / examWeight caveats below.

**Preview-harness finding (tuning):** with stub data, **unstarted skills (0 attempts → gap 0.80) outrank partially-learned weak skills (e.g. Emerging 42% → gap 0.38)** in priority, because `gapToThreshold` is largest for the untouched. Decide whether unstarted should be de-prioritized until diagnosed, or kept (coverage-first). This is a `priorityScore`/eligibility tuning call the harness surfaced.

---

## Part 2 — Modules Redesign: what's PENDING (prioritized)

1. **Live verification** (above) — log in and visually confirm; fix any runtime issues.
2. **Per-module completion (the real data gap).** Status is currently a per-*skill* proxy (`useModuleCatalog.ts`): Reviewed = skill Demonstrating/mastered; In progress = lesson viewed. A skill has 1–4 modules, so all its modules share status. True per-module "Reviewed" should derive from `section_interactions` (all sections seen + interactive sections completed) — the pure selector already accepts a per-module `ModuleProgressSignal`; only the adapter needs the real read. Later: a learner "I've got this" self-assessment flag, seeded from the derived value.
3. **`examWeight` fidelity (provisional, NOT validated).** `examWeight = SKILL_BLUEPRINT[skill].slots`. Fidelity test run this session: slots vs `PRAXIS_WEIGHTS` (through true NASP domain) = mean 4pp / max 8pp gap; **slots under-weights Mental/Behavioral Health (7% vs 14%)** and over-weights Family-School (13% vs 5%). TODOs: complete the 40/45-skill crosswalk; verify `PRAXIS_WEIGHTS` is the real current NASP blueprint (domain 1 = 0.32 is implausibly high). Until then, slots is "best available proxy with a known caveat."
4. **`learnability` tuning constants.** `clamp(trendFactor × prereqFactor, 0.2, 1.2)` with defaults `declining=0.8`, `unmet-prereq=0.6`. Tune against real student profiles. Constants are externalized in `DEFAULT_MODULE_PRIORITY_CONFIG`.
5. **Server-side view persistence.** Currently localStorage stub. Plan: per-user Supabase prefs row; first-visit default = **By weakness** (currently defaults to domain). (Plan §10.4.)
6. **Retire `LearningPathNodeMap.tsx`** once parity confirmed (now unreferenced; `npm run scan:knip` will flag it).
7. **Mobile pass on the real component** (mockup is responsive; verify the React matches at 375px).
8. **Remaining a11y from the verify agent:** the card CTAs are visual-only text inside the card-button (resolved — whole card is the control); a real **search input** is not built (mockup shows a placeholder); confirm contrast in the running app.

**Plan of record:** `docs/PLAN_2026-06-07_modules-redesign-react.md` (fully specifies the selector, invariants, and resolved decisions). **Approved mockups:** `public/mockup-modules-redesign-v2.html` (richer) and `…-redesign.html` (v1).

---

## Part 3 — The 4 invariants (review-held rules, now executable in `tests/moduleCatalog.test.ts`)
1. **Gap enters `priorityScore` in exactly one term** (`gapToThreshold`); `examWeight` and `learnability` are independent of score.
2. **`learnability` composite is clamped to [0.2, 1.2]** — reorders within clusters, never overpowers `examWeight × gap`.
3. **`examWeight === SKILL_BLUEPRINT.slots`** (provisional) — asserted so any change is deliberate.
4. **Tuning constants externalized** (no inline magic numbers).
> Meta-lesson from this session: agent grounding + self-correction are reliable; *independent uniform* scrutiny is not. Hence invariants live in the test suite, held at review — not in trusting anyone to notice.

---

## Part 4 — Key formula
`priorityScore = examWeight × gapToThreshold × learnability`, computed only for eligible (non-mastered) modules.
- `examWeight` = `SKILL_BLUEPRINT[skill].slots` (provisional; Part 2.3).
- `gapToThreshold` = `max(0, 0.80 − score)` — the ONLY gap term.
- `learnability` = `clamp(trendFactor × prereqFactor, 0.2, 1.2)` — tractability only (trend + prereqs), never proximity (= gap) and never `urgencyScore` wholesale (gap-dominated).
- **Eligibility gate (`<80%`) ≠ ranking.** "Recommended" and "Close these first" both read the single ranked-eligible set.
- **Honesty:** proficiency is a heuristic (scripted engine, not IRT). UI copy says "recommended / highest-impact", never a psychometric "mastery probability."

---

## Part 5 — Other workstreams touched this session (so nothing is lost)

### A. Scoring double-count fix — DONE & LOCKED (`cea4af9`)
The LP mini-quiz and practice both feed the incremental `skill_scores` path (`updateSkillProgress`), which drives proficiency + readiness. A question answered in both double-counted. Fixed via `applySkillAttemptDedup` (`src/brain/learning-state.ts`): dedupe by `question_id`, latest-wins, freeze pre-dedup totals as a legacy baseline, tag attempt `source`. Mini-quiz now threads `questionId` + `source='module'`. Tests: `tests/skillAttemptDedup.test.ts`. **Do not reopen** unless new evidence. (Note: the global `responses`/`global_scores` pipeline was NOT the source — the mini-quiz never writes `responses`.)

### B. Track B (question fluidity) — V1 DECISION = **B3** (`9863c03`)
Allow the same question in both the module mini-quiz and practice; reframe repeats as reinforcement; rely on the dedupe (A) so repeats don't inflate proficiency. **Do NOT build B1** (teaching/assessment bank split) **or B2** (Supabase cross-surface exclusion / moving practice retirement off localStorage) until exit-ticket/assessment-validity work needs exposure controls.

### C. Track A (engagement metrics + alert engine) — PLANNED, not built
Plan: `docs/HANDOFF_2026-06-06_engagement-alerts-and-question-fluidity.md`. Mockups approved (`public/mockup-track-a-engagement.html`). Module engagement as a SEPARATE dashboard metric (time-on-task, module→score correlation) + an alert/trigger engine (review-needed-but-not-studying; completion→practice). All read paths over data already written by `useModuleVisitTracking`; nothing wired into diagnostic proficiency. Build is queued behind the modules work.

### D. Cool color scheme + drift guard — DONE (`a6e5f88`)
`docs/DESIGN_TOKENS.md` (canonical palette + forbidden warm hexes), `scripts/check-colors.mjs` + `npm run scan:colors` wired into `check` and the husky **pre-commit** hook. **Root cause of the recurring warm "echo":** `editorial-surface`/`-soft` in `src/index.css` + ~13 components still hardcode warm `#fbfaf7`/`#e6dfd4`. De-warming those app-wide is an **approval-gated migration** (high blast radius) — proposed, not done. Guard is scoped to new/active files so legacy doesn't fail the build.

### E. Activity handoff re-audit + 2 scoring-bug fixes (`3f7e14f`, `079d0c3`)
Re-audited `HANDOFF_2026-06-06_activity-enhancement` (accurate). Fixed the 2 real scenario-sorter scoring bugs (`MOD-D4-02`, `MOD-D4-05`) and disambiguated `MOD-D1-06`'s two Tier-3 scenarios. Activity→proficiency wiring (Parts B–E of that handoff) is NOT built and is superseded by the Track B decision (activities stay formative).

---

## Part 6 — Open product decisions (yours)
1. **examWeight fidelity:** accept slots-with-caveat, or invest in a validated skill→NASP-domain weight map (Part 2.3)?
2. **learnability constants:** confirm/adjust `declining=0.8`, `unmet-prereq=0.6`, clamp `[0.2,1.2]`.
3. **Per-module completion:** derive from `section_interactions` now, or ship the per-skill proxy for v1 and add the self-assessment flag later?
4. **View-persistence default:** keep domain-default, or switch first-visit to weakness per plan?
5. **De-warm migration (D):** schedule the app-wide warm→cool surface migration, or leave legacy as-is behind the guard?
6. **Track A:** build engagement metrics + alert engine next, after live-verifying modules?

---

## Part 7 — Session commit log (`explore/dashboard-redesign`)
```
0ba9063 feat(modules): wire data adapter + by-domain ModulesBrowser into the app
5e0fc4e feat(modules): useModuleCatalog selector + invariant tests (step 1)
a052c8c docs(plan): examWeight=slots is PROVISIONAL (fidelity-tested) + restore clamp/prereq
2f38c9e docs(plan): fix priorityScore double-count; resolve examWeight empirically
f5a3a91 docs(plan): blueprint-weighted priorityScore + resolved owner decisions
92e9f61 docs: React implementation plan for the modules redesign (v2)
268daa3 mockup(modules v2): adaptive view, priority alerts, group-by, a11y pass
701155f mockup(modules): student-friendly module browser + states
a6e5f88 design: cool surfaces + color-drift guard
751a8fa / d993464 mockup(track-a): engagement card + alert engine (+states)
9863c03 docs: Track B V1 decision = B3
cea4af9 scoring: prevent module practice double count
f39b359 docs: engagement/alerts/fluidity plan
079d0c3 / 3f7e14f content + activity scoring-bug fixes
```

## Part 8 — Uncommitted in the main repo (NOT mine — leave alone)
`src/data/master-glossary.json`, `SKILL_COVERAGE_AUDIT_2026-06-02*.md`, `docs/glossary-citation-notes.md`, `docs/pass_migration/`, loose `*.jpeg` — pre-existing WIP from other efforts, deliberately untouched.

---

## Part 9 — How to continue (fastest path)
1. `npm run dev:netlify` → log in → Practice → Learning Path → confirm `ModulesBrowser` renders; screenshot.
2. Decide Part 6.3 (per-module completion). If "derive now," extend `useModuleCatalog` to read `section_interactions` (the selector already accepts the signal).
3. Tune Part 6.2 constants.
4. Then either retire `LearningPathNodeMap` + server-side persistence, or pivot to Track A.
Every change: keep the 4 invariants green, run the 5 verification commands, obey the color guard, update `HOW_THE_APP_WORKS.md`.
