# Handoff — Content Architecture Phase 2, engineering stretch done — 2026-06-09

**Branch:** `claude/hopeful-benz-866a30` (origin in sync at `181e352`). **Not deployed**
(Netlify `stop_builds=true`; deploy is manual and intentionally batched).
**Worktree:** `/Users/lebron/Documents/PMP-hopeful-benz`.

**Read first:** `docs/PHASE2_REVIEW_BACKLOG.md` — the single current-state tracker (what's done, the
five decisions, the locked framework schema, pending reviews, data-hygiene residue, and the updated
coworker prompt). This handoff is the short version.

---

## What landed this stretch (all pushed, gate green, reproducible)

The four big Phase-2 derivations + the seeder hardening — see the table in PHASE2_REVIEW_BACKLOG.
Net: objective tags verified · all 45 skills own a module (67 total) · module `etsTopicIds` ·
misconception `questionIds` (59/98) · prereq DAG re-keyed · blueprint-anchored exam weights.
Every derived map has a parity test that fails the build if it goes stale.

**Pattern used (reuse it):** a separate generated JSON map + a minimal wire-in loop (low collision
with content edits) + a coverage/parity test + provisional/SME-confirmable framing + a
`HOW_THE_APP_WORKS` update. Derive scripts live in `scripts/migrations/`.

## The five decisions (locked — see backlog for rationale)
1. Prereq edges — keep, review later. 2. Exam weights — keep blueprint-faithful, no MBH override.
3. `frameworkRegistry` shape — **locked** (backlog Call 3). 4. Vocab consolidation — **defer**.
5. Deploy — **batch** after Packs 3/5/6 + a review of the two live items (exam weights, prereq edges).

## What's left
- **Content/SME → Coworker:** Pack 6 (anchor sign-off), Pack 5 (framework registry — shape locked),
  Pack 3 (deepen thin stubs). Paste-ready coworker prompt is in PHASE2_REVIEW_BACKLOG.
- **Engineering (deferred):** vocab-registry consolidation (touches `studyPlanPreprocessor` — risky;
  do alone, guarded by study-plan tests).
- **Phase 3 (later):** exclusive modules for the 30 skills without one, question verification pass,
  case bank.

## Guardrails
- Skill is the scored unit; objectives descriptive (`tests/objectiveBoundaryGuard.test.ts`).
- Objective seeder **refuses** to overwrite verified tags unless `--preserve-manual` (keep) or
  `--force` (wipe). After Coworker hand-edits content, re-run derive scripts only if the
  module/skill SET changed (the parity tests tell you).
- Cool indigo/violet palette. Module ids stable. Gate before every commit:
  `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.
- Coworker and engineering share this branch — `git pull` before working; don't run both at once
  (a stale-lock + staged-revert near-miss already happened once).

## ▶️ TO START A NEW CHAT — paste this
> Work in `/Users/lebron/Documents/PMP-hopeful-benz` on branch `claude/hopeful-benz-866a30` (origin
> in sync at `181e352`). Read `docs/PHASE2_REVIEW_BACKLOG.md` then
> `docs/HANDOFF_2026-06-09_phase2-stretch.md`. Phase-2 engineering is done (objective tags verified,
> all 45 skills own a module, module `etsTopicIds`, misconception `questionIds`, prereq DAG re-keyed,
> blueprint-anchored exam weights — all pushed, 250 tests green, all derive scripts reproducible).
> The five decisions are locked in the backlog. Do NOT start the vocab-registry consolidation
> (deferred) or deploy (batched). Pick up either: (a) help the content SME via Coworker on Packs
> 6/5/3 and verify their pushes, or (b) a specific next item I name. Keep the skill the scored unit;
> run the 5-command gate before committing; re-run a derive script only if the module/skill set
> changed (parity tests enforce it).
