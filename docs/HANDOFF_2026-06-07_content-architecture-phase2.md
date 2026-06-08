# Handoff — Content Architecture: Phase 0/1 done, Phase 2 pending — 2026-06-07

**Branch:** `claude/hopeful-benz-866a30` (pushed to origin; **7 commits** `daa0440..5c1f5b4`).
**Not deployed** — Netlify `stop_builds=true`; deploys are manual (`netlify deploy --build --prod`).
**Worktree used this session:** `/Users/lebron/Documents/PMP-hopeful-benz` (the main repo at
`/Users/lebron/Documents/PraxisMakesPerfect` was left on `explore/dashboard-redesign`, untouched).

**Read alongside this:**
- `docs/CONTENT_ARCHITECTURE_AND_GAPS_2026-06-07.md` — the model & full gap analysis (plan of record).
- `docs/CONTENT_AUTHORING_PLAN_2026-06-07.md` — the coworker task pack (Packs 1–6, with templates).
- This file — status + what's pending + what *you* need to decide.

---

## ✅ DONE — Phase 0 + Phase 1 (the wiring), verified & pushed

All gates green: `scan:types · scan:colors · lint · test (229) · build · test:runtime (5)`.

| # | Commit | What |
|---|---|---|
| Phase 0a | `bd56408` | Fluency Drill re-pointed to `skill-vocabulary-map.json` → **all 45 skills drillable** (was ~20) |
| Phase 0a | `a67c012` | Fixed drill content-area scopes regression (metadata→progress IDs) |
| Phase 0b | `520ef1a` | **Cold-start fix**: 10 existing items reclassified `is_foundational` (5 skills, 0→2 each) |
| Phase 1a | `373971f` | `skillObjectiveMap.ts` — 45 skills → 79 ETS objectives (+ explicit `primaryObjectiveBySkill`) |
| Phase 1b | `aebebec` | Deterministic ETS-objective seeder (`scripts/migrations/`) |
| Phase 1c | `4a57df8` | `questionObjectiveMap.json` — all 1,150 questions tagged (provisional, `verified:false`) |
| Phase 1d | `5c1f5b4` | `primarySkillId` on all 58 modules + scoring-boundary guard + ID crosswalk + docs |

**Nothing functional is left from Phase 0/1.** The only Phase-0/1 loose end is documentation:
the two docs above (`CONTENT_AUTHORING_PLAN` + this handoff) are **written but uncommitted** —
commit + push them so a new chat can see them.

---

## 🔧 IMMEDIATE TO-DOs (small, do these before handing off content work)

1. **Commit + push the two new docs** (`CONTENT_AUTHORING_PLAN_2026-06-07.md`, this file). Until
   pushed, a new chat/session won't see them.
2. **Build the seeder `--preserve-manual` guard.** The seeder (`scripts/migrations/seed-question-ets-topics.mjs`)
   overwrites `questionObjectiveMap.json` wholesale. Once a human edits tags by hand (Pack 1,
   `method:"manual"`), a re-run would wipe that. Add a flag that re-reads the existing file and
   keeps any `method:"manual"` entries. **This must land before anyone starts Pack 1.** (~1 hr eng.)
3. **Decide deploy timing.** Phase 0/1 is user-visible (drill now covers all 45 skills; cold-start
   works) but nothing is live. Deploy when ready, or batch with Phase 2.

---

## 🟡 PHASE 2 — what's left (the content + the remaining connections)

Two tracks: **content authoring** (Packs 1–6, fully specified in `CONTENT_AUTHORING_PLAN`) and
**data/eng wiring** (below). Current measured state:

- Modules: 58, all owned; **51/58 are < 220 words** (median 161) — skeletal stubs.
- **9 skills** are no module's `primarySkillId` owner → need an owned lesson (Pack 2):
  ETH-02, MBH-02, SWP-03, DBD-09, PSY-01, LEG-03, DBD-10, ACA-09, DIV-01.
- **16/79 objectives** have no owning module (the objectives of those 9 skills).
- **210 objective tags** need human review: 139 fallback + 71 multi-tag (Pack 1).
- **24/45 skills** have 0 frameworks/laws (Pack 5).

### 2A. Content authoring (→ `CONTENT_AUTHORING_PLAN_2026-06-07.md`)
| Pack | Goal | Who | Effort |
|---|---|---|---|
| **1** | Verify the 210 seeded objective tags (→ `manual`/`verified`) | SME / data | ~5–7 hrs |
| **2** | Author 1 owned module for each of the 9 unowned skills | SME + light TS | ~25 hrs |
| **3** | Deepen the 51 thin module stubs | SME | ongoing |
| **4** | Populate module `etsTopicIds` (after Pack 1) | eng + SME | ~1 day |
| **5** | Framework/law registry (`frameworkRegistry.ts`) | SME (legal/ethics) | ~2 days |
| **6** | SME sign-off on the 10 cold-start anchors | SME | ~1 hr |

### 2B. Data / engineering wiring (from design doc §6/§8, not in the SME packs)
- **One consolidated vocabulary registry.** Today the drill reads `skill-vocabulary-map.json` but
  the **study plan still reads `skill-metadata-v1` vocab** (`studyPlanPreprocessor.ts:317`). Fold
  definitions + objective/question links into one registry; retire the metadata-v1 vocab as a source.
- **`etsTopicIds` on modules** (= Pack 4) — the eng half: derive from `questionObjectiveMap`.
- **Objective → exam-weight rollup** to replace the `slots` proxy in `moduleCatalog`.
- **Backfill misconception `questionIds`** (currently 0%) via per-question distractor metadata +
  `error_cluster_tag`.
- **Prereq DAG repair** — `skillPrereqGraph.ts` is keyed to a stale taxonomy (per design doc §3.8:
  16/45 skills missing, 16 phantom keys). Re-key to the 45, delete phantoms, hand-author edges.

---

## 🔵 PHASE 3 — later (largest authoring, lowest unit leverage)
- **Exclusive modules for the 30 skills without one.** ⚠️ *Two different numbers, don't conflate:*
  **9** skills own no module (no `primarySkillId`) — Pack 2 fixes these. **30** skills have no
  *exclusive* module (one serving only them); only 15 do, and 39/58 modules are shared. Phase 3 is
  authoring dedicated modules for the broader 30 (ranked by question volume: LEG-02 37Q, DBD-03/ETH-01 33Q…).
- **Question verification pass** over the ~900 unvetted machine-generated "lean" items (5 zero-rich
  skills first).
- **Reusable case bank** seeded from the 199 archetypes (DBD-08 has 0), tagged to skill + objective.

---

## 🧭 OPEN DECISIONS (need *you*)
1. **Who's the content SME?** Packs 2/3/5/6 need school-psych domain expertise. Pack 1 needs it too
   (picking the right objective per question).
2. **Deploy now or batch?** (see To-do 3.)
3. **`frameworkRegistry.ts` shape** — confirm the row schema with an engineer before Pack 5 (design
   doc proposes `{ id, name, citation, summary, keyHolding, applicability, guardedMisconception }`).
4. **Scope of Pack 3** — deepen all 51 stubs, or only the owned/high-traffic ones first?

---

## ⚠️ GUARDRAILS (don't undo the wiring)
- **Skill stays the scored unit; objectives are descriptive.** No objective-level scoring —
  `tests/objectiveBoundaryGuard.test.ts` fails the build if a scoring file imports the objective maps.
- Objective codes must stay within a skill's `skillObjectiveMap` set (tests enforce it).
- **Don't re-run the seeder over hand-edited tags** until the `--preserve-manual` flag exists.
- Module ids are stable — never rename, only add. The `NEW-*` / 54 legacy metadata entries are
  **real content; do not delete** (a prior audit wrongly proposed this).
- Cool indigo/violet palette only. Run the 5-command gate before every PR:
  `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.

---

## 📋 KEY FILES (map for a fresh session)
| File | Role |
|---|---|
| `src/data/skillObjectiveMap.ts` | 45 skills → 79 ETS objectives + `primaryObjectiveBySkill` |
| `src/data/questionObjectiveMap.json` | 1,150 question tags (provisional; Pack 1 verifies) |
| `src/data/ets-content-topics.json` | the 79 ETS objectives (source of truth for codes) |
| `src/data/learningModules.ts` | 58 modules; `primarySkillId`, `SKILL_MODULE_MAP`, `MODULE_PRIMARY_OVERRIDES`, reserved `etsTopicIds?` |
| `src/data/skillIdMap.ts` | canonical ID crosswalk (progress ↔ metadata ↔ objective ↔ module ↔ vocab) |
| `scripts/migrations/seed-question-ets-topics.mjs` | the seeder (needs `--preserve-manual`) |
| `tests/objectiveBoundaryGuard.test.ts` | enforces objectives-never-scored |

---

## ▶️ TO START A NEW CHAT — paste this
> Work in `/Users/lebron/Documents/PMP-hopeful-benz` on branch `claude/hopeful-benz-866a30`.
> Read `docs/HANDOFF_2026-06-07_content-architecture-phase2.md`, then
> `docs/CONTENT_AUTHORING_PLAN_2026-06-07.md`. Phase 0/1 (the objective-spine wiring) is done and
> pushed. Start with the IMMEDIATE TO-DOs: (1) build the seeder `--preserve-manual` guard, then
> (2) [pick a Pack — e.g. "author the 3 cold-start owned modules ACA-09/DBD-10/DIV-01 from Pack 2",
> or "verify the ACA-08 fallback objective tags from Pack 1"]. Keep the skill as the scored unit;
> objectives stay descriptive (boundary-guard test). Run the 5-command gate before committing.
