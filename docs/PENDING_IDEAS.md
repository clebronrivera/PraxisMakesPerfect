# PENDING IDEAS — Canonical Backlog

> **This is the durable "what's pending" list.** When the user asks "what's pending / what are we
> building / continue," start here. Items move **Parked → Next → Active → (shipped, removed from this
> doc + reflected in `docs/HOW_THE_APP_WORKS.md`)**.
>
> Companion docs:
> - `docs/PRODUCT_ROADMAP_2026-06-02.md` — full capture of the 2026-06-02 direction-setting session
>   (glossary overhaul #1 priority, tutorial/dashboard/practice/progress/notebook workstreams, open
>   decisions). The detailed list behind several items below.
> - `docs/product-ideas-from-cleanup-2026-04-16.md` — archived-branch research (incl. the Term Sprint
>   origin at commit `35db028`). Read-only research material.
> - `.claude/plans/mighty-conjuring-hummingbird.md` — the full execution handoff for the Active/Next items
>   below (data-reuse maps, phase breakdowns, baked-in decisions, verification lookover).
>
> **Mandatory workflow:** every UI screen is **mockup-first** (standalone HTML in `public/`, rendered in
> preview, screenshot, explicit sign-off) before any React. See `CLAUDE.md`.

Last updated: 2026-06-01 · Branch: `explore/dashboard-redesign`

---

## SHIPPED — verify against `docs/HOW_THE_APP_WORKS.md`

### Staged / simplified Study Guide
Shipped `2026-06-16` (`4333b25`, "staged/simplified study-guide view (mockup → React)"). `StagedStudyGuide.tsx`
is wired into `StudyPlanCard.tsx` as the **default** "Your Study Plan" view (Stage 1 per-area cards, Stage 2
Bare-minimum/Intentional toggle); a "Detailed view" link still reaches the old `StudyPlanViewer.tsx`. Reflected
in `docs/HOW_THE_APP_WORKS.md` (§ "Staged view"). This entry was previously (and incorrectly) marked ACTIVE
with React implementation still pending — corrected 2026-07-03.

---

## ACTIVE — building now

(nothing currently active)

---

## NEXT — queued after Active

### Glossary overhaul  ·  *#1 PRIORITY (promoted 2026-06-02)*
Full 396-term, filterable, searchable glossary from the start, backed by a per-term **smart weight**
(rises on correct exposure, falls on misses) powering a weak-areas filter, a per-term proficiency meter,
and a `getWeakTermsForTutor()` seam for AI flashcards. **Removes** the write-your-definition/reveal flow
and the embedded Quiz Mode tab (Fluency Drill becomes the single vocab path — closes the item below).
**Absorbs** the PARKED "Glossary → pure-reference refactor." Data layer first, then mockup-first UI.
- Full design + build order: `docs/PRODUCT_ROADMAP_2026-06-02.md` §B and
  `.claude/plans/okay-currently-uh-currently-reactive-lantern.md`.
- ⚠ **Migration number:** the glossary overhaul's new migration must be **`0029`**, NOT `0026`. As of
  2026-06-16 `0026` = `retake_complete` and `0027`/`0028` = search_path hardening (in PR #38). `0024_vocab_attempts`
  is already applied (it's the base this extends).

### Retire the embedded glossary vocab quiz (partial) — *folded into the Glossary overhaul above*
`VocabularyQuizMode.tsx` (the "Quiz Mode" tab inside `GlossaryPage`) still exists. The Dashboard vocab
tiles now route to the Fluency Drill instead — **remaining:** remove the Quiz Mode tab in `GlossaryPage`
so the drill is the single vocab path. Now part of the overhaul's UI rebuild.

### Fluency Drill — follow-ups
- **Select-all-that-apply** variant — deferred from v1 (the glossary is term/definition pairs with no
  category labels, so the mockup's "which are norm-referenced?" framing isn't data-backed). The
  data-grounded version is "select all terms belonging to this skill area."
- **Vocab feedback v2** — fold `vocab_attempts` into `globalScoreCalculator` so nudges survive a global
  recompute (removes the v1 fade-on-recompute limitation).
- **Per-skill display names** — a clean skillId→name map would let the drill offer a "By skill" scope and
  a richer per-skill results breakdown.

---

## PARKED — captured, not scheduled

### Glossary → pure-reference refactor — *SUPERSEDED by the Glossary overhaul (NEXT, above)*
Original idea: make the glossary an **independent, well-organized, read-only reference** (no user-written
definitions): render `master-glossary.json` A–Z, searchable, with flagged-term alert badges. The
2026-06-02 Glossary overhaul subsumes this and adds per-term smart weighting + filters; the
personal-definition workflow is being **removed entirely** rather than relocated to the notebook (revisit
in §G of the roadmap). Coworker citations task still feeds the official definitions — see below.

### AI Tutor time-limited worksheet locker
A "locker" view in `TutorChatPage` for saved AI-Tutor artifacts, backed by a new table with TTL/expiry
cleanup. Today artifacts are inline-only, downloadable as `.md`. Net-new.

### Case Study drill
An interactive scenario drill beyond the static `caseArchetypes` text labels that live in study-plan
metadata. Net-new; scope later.

### Vocab feedback v2
Fold `vocab_attempts` into `globalScoreCalculator` so vocab nudges survive a global recompute; optional
`weight` param on `updateSkillProgress`. (Removes the v1 fade-on-recompute limitation above.)

### Post-diagnostic skill-tile color map  ·  *captured 2026-06-11*
A map of color tiles — one per test skill (45) — that, **after the diagnostic completes**, colors each
tile by the learner's proficiency (Emerging / Approaching / Demonstrating) so the whole skill landscape
is legible at a glance. **Check first what already exists before building:** `LearningPathNodeMap.tsx`
already renders a snake-grid of skill tiles with proficiency color, and `ResultsDashboard` shows domain
bars — this idea may be a *dedicated, more prominent post-diagnostic "map" view* rather than net-new.
Mockup-first. Relates to [[project_modules_redesign]] (the student-friendly module browser that replaced
the deficit snake-map) — confirm this isn't the same surface before scoping.

---

## COWORKER TASKS (spawned, parallel)

- **Glossary citations** — add source citations to the master-glossary terms that need them
  (`src/data/master-glossary.json`, 396 terms). Spawned 2026-06-01 from Part 0.

---

## SHIPPED (kept briefly for reference, then pruned)

### Vocabulary Fluency Drill — core (2026-06-02)
Timed rapid-fire vocab game, resurrected + extended from commit `35db028`. Atelier dark theme.
- `src/utils/vocabSkillIndex.ts` — term↔skill index (from `skill-metadata-v1.ts` ∩ glossary). +tests
- `src/utils/drillScopes.ts` — Weak areas / Sharpen / All terms / by content area, with live counts. +tests
- `src/components/FluencyDrillSession.tsx` — the game (scoped, timed, per-direction, `onTermResult`)
- `src/components/FluencyDrillPage.tsx` — setup → drill → results orchestrator
- `src/services/vocabDrillService.ts` — Option B1 feedback (vocab_attempts log, glossary flags, skill
  nudges on ≥2 misses). +tests
- `supabase/migrations/0024_vocab_attempts.sql` — ✅ **applied to Supabase** (remote history `20260602192231`,
  verified 2026-06-12 per Phase 2 finalization E2 note).
- `App.tsx` routing (`'fluency-drill'` mode) + Dashboard tiles repointed.
- Docs: `docs/HOW_THE_APP_WORKS.md` "Vocabulary Fluency Drill" section.
- Dropped from v1: select-all variant (see Next). `npm run check` green (168 tests).
