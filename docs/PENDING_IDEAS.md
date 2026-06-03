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

## ACTIVE — building now

### Staged / simplified Study Guide  ·  *FIRST FOCUS*
A lighter alternative to the current heavy 9-section / 6-tab `StudyPlanViewer.tsx` (user finds it
overwhelming). **Pure presentation/IA refactor — no study-plan regeneration, no new data fields.**

- **Stage 1** — per-area cards: score chip · plain-English meaning · one concrete example · three
  buttons **Practice / Review / Test**.
- **Stage 2** — toggle **Bare-minimum vs Intentional**, gated on ≥3 weeks to test.
- Reuses existing `StudyPlanDocumentV2` fields (`priorityClusters`, `domainStudyMaps`,
  `weeklyStudyPlan`, `tacticalInstructions`, `checkpointLogic`, `studyConstraints.weeksToTest`).
- Only genuinely new plumbing: thread the existing `startSkillPractice` / `startPractice` /
  `handleStartRedemption` launchers into Stage-1 buttons.
- **Status:** mockup not yet built → `public/mockup-study-guide-staged.html` is the next artifact.
- **Plan:** Part 1 of `.claude/plans/mighty-conjuring-hummingbird.md`.

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
- ⚠ Apply migration `0024_vocab_attempts.sql` to Supabase **before** the new `0026` (it extends `0024`).

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
- `supabase/migrations/0024_vocab_attempts.sql` — **⚠ NOT YET APPLIED to Supabase** (run `supabase db push`
  or apply via dashboard before the feedback writes work in prod).
- `App.tsx` routing (`'fluency-drill'` mode) + Dashboard tiles repointed.
- Docs: `docs/HOW_THE_APP_WORKS.md` "Vocabulary Fluency Drill" section.
- Dropped from v1: select-all variant (see Next). `npm run check` green (168 tests).
