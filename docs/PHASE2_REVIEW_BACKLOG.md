# Phase 2 — Current State & Review Backlog — 2026-06-09

Single forward-looking tracker for the content-architecture work on branch
`claude/hopeful-benz-866a30`. Supersedes the status sections of the older Phase-2 docs (which now
carry pointers here). **Nothing is deployed** — Netlify `stop_builds=true`; deploy is manual and
intentionally **batched** (see Call 5).

---

## ✅ Done & pushed (Phase 0/1 + this stretch)

| Area | Commit | State |
|---|---|---|
| Pack 1 — objective tags | `4d35df6` | All **210** review items (139 fallback + 71 multi-tag) SME-verified → `method:"manual"`, `verified:true`. ~940 high-confidence seeds stay `verified:false` by design. |
| Pack 2 — owned modules | `4678e6d` | 9 new modules; **all 45 skills own a lesson**; 58→**67** modules. |
| Seeder guard | `f86ddcb`,`a9283b2`,`829a6a2` | `--preserve-manual` keeps manual tags; a no-flag re-run now **refuses** when manual tags exist (`--force` to override). Pack-1 review queue emitted in the seed report. |
| Pack 4 — module `etsTopicIds` | `1c29b32` | `moduleEtsTopicMap.json` (67 modules; 45 routed, 22 skill-fallback). |
| Prereq DAG repair | `9cf8b89` | `skillPrereqGraph.ts` re-keyed to the 45 (phantoms removed, missing added, acyclic). **Edges provisional** → review (Call 1). |
| Misconception `questionIds` | `2f2d3f0` | `misconceptionQuestionMap.json`; **59/98** misconceptions linked, 191 questions (distractor-belief overlap). |
| Exam-weight rollup | `181e352` | `skillExamWeights.json`; blueprint-anchored (official ETS 5403 category weights). **Changes LIVE ranking** (Call 2). |
| Pack 6 — anchor sign-off | `4a79cc0` | All **10** cold-start anchors (`PQ_ACA-09_7/_1`, `PQ_DBD-10_1/_3`, `PQ_DIV-01_7/_1`, `PQ_DIV-05_6/_7`, `PQ_FAM-03_6/_1`) reviewed and `is_human_verified:true`. Bank: 250→**260** verified. |
| Pack 5 — framework registry | TBD | `src/data/frameworkRegistry.ts` — **32 entries**, **29/45** skills covered. Case law (Tarasoff, Rowley, Endrew F., Larry P., Diana, Honig, PARC, Florence County), statutes (IDEA×6, 504, ADA, FERPA, HIPAA/FERPA, McKinney-Vento, ESSA), ethics standards (confidentiality, consent, dual relationships, mandated reporting, records, beneficence), practice frameworks (MTSS, PBIS, FBA, NASP model, Child Find, 504-vs-IDEA, ED eligibility, placement continuum). Not wired to scoring. `tests/frameworkRegistry.test.ts` added (8 tests; 250→**258** total). |

All four derive scripts regenerate their committed outputs **byte-identically** (verified 2026-06-09).
Gate (types · colors · lint · 250 tests · build · runtime) green. Local == remote.

**Derived artifacts are self-guarding:** each has a parity test (`moduleEtsTopics`, `misconceptionQuestions`,
`skillExamWeights`) that fails the build if the module/skill set changes without re-running the
derive script. So Pack 3 (content-only edits) is safe; adding modules/skills requires a re-derive.

---

## 🟦 The five "calls" — decisions

| # | Call | **Decision** | Why |
|---|---|---|---|
| 1 | Prereq edges | **Keep; review later, not a blocker** | Pass the acyclic-DAG test, drive routing (not scoring), already better than the old stale graph. SME edge pass after the content packs. |
| 2 | Exam weights (MBH?) | **Keep blueprint-faithful; NO override** | Anchored to authoritative ETS 5403 weights; "exam-points-per-skill" is the correct ranking signal. "MBH underweighted" was a loose assumption, not a finding. |
| 3 | `frameworkRegistry` shape | **LOCKED (below)** | Engineering call — unblocks Pack 5 now. |
| 4 | Vocab-registry consolidation | **Defer** | Highest risk (touches `studyPlanPreprocessor`), lowest marginal value (study plan works today). Do it later, alone, guarded by study-plan tests. |
| 5 | Deploy timing | **Batch after Packs 3/5/6 + review of the 2 live items** | One coherent Phase 0/1/2 deploy beats several behavior-change deploys; lets provisional live items get eyes first. |

---

## 🔒 Call 3 — `frameworkRegistry` shape (locked, for Pack 5)

Standalone data file `src/data/frameworkRegistry.ts`, **never imported by any scoring/mastery/selection
file** (the boundary guard forbids importing the objective maps; keep this file out of scoring too).
~30–40 rows:

```ts
export interface FrameworkEntry {
  id: string;            // stable, e.g. 'FW-tarasoff', 'FW-idea-fape'
  name: string;          // 'Tarasoff v. Regents', 'IDEA — FAPE'
  citation: string;      // statute/case citation
  summary: string;       // 1–2 sentence plain-language description
  keyHolding: string;    // the operative rule/holding a test item turns on
  applicability: string; // when it applies in school-psych practice
  guardedMisconception: string; // the wrong belief it corrects
  skillIds: string[];    // canonical progress skills it governs (joins the spine)
  etsTopicIds: string[]; // ETS objectives it supports (⊆ those skills' objective sets)
}
```
Wire-in mirrors the other artifacts (separate file; optional descriptive lookup). Named gaps to seed
first: **SAF-03** (Tarasoff/duty-to-warn), **ACA-09** (504/ADA/IDEA-OHI); 24/45 skills had none.

---

## 🟡 Pending human review (don't let these ship as "final" unreviewed)

| Item | Coverage / risk | Owner |
|---|---|---|
| **Prereq edges** (`skillPrereqGraph.ts`) | provisional first pass; drives "Do X first" routing | SME |
| **Pack 4 `etsTopicIds`** | 22/67 modules used the skill-fallback (no routed questions) — confirm against lesson content | SME |
| **Misconception links** | 59/98 linked; spot-check precision of the distractor-overlap matches | SME |
| **Exam weights** | LIVE ranking change; confirm blueprint-faithful is acceptable (Call 2) | Product |
| ~~Pack 6 anchors~~ | ✅ Done (2026-06-10) | — |

---

## 🧹 Data-hygiene residue (small, surfaced — not yet fixed)

- **10 misconception entries are unmappable** — their metadata `skillId` (e.g. `MBH-S03`, legacy
  `LEG-S0x` bridges) has no canonical progress-skill equivalent via `skillIdMap`, so they can never
  link questions. Residue of the metadata↔progress ID fragmentation (design-doc theme). Decide:
  re-key them to the 45, or accept as dead taxonomy rows.
- **39/98 misconceptions still have no questions** (the 10 above + 29 whose belief text didn't surface
  in any distractor). A lower overlap threshold or SME tagging would raise this.
- **Bank-wide key-placement bias** — 759/1150 items (66%) have B as the correct answer; DBD-10 is
  100% B (20/20). Students who learn this pattern gain ~66% baseline regardless of knowledge. Needs
  a key-rotation pass (shuffle options per item, update `correct_answers`) before any public release.
  **Not a Pack 6 gate-blocker** (the 10 anchors are conceptually correct); fix in a separate pass.

---

## ⬜ Remaining work

- ~~**Content / SME (Coworker):** Pack 3~~ ✅ done (2026-06-10) — all 67 modules deepened to ~400+ words, 6 batches, commits `6247253`→`e727eac`. Pack 6 ✅ done. Pack 5 ✅ done.
- ~~**Engineering (follow-up):** Add `tests/frameworkRegistry.test.ts`~~ ✅ done (258 tests).
- ~~**Content review (SME):** `frameworkRegistry.ts` citations~~ ✅ done (2026-06-10, commit `65424ee`) — citation-accuracy pass over all 32 entries (8 case law + 16 statute/reg/ethics). Two objective errors fixed: FW-parc name ("Citizens"→"Children"), FW-pbis statute (`§1415(k)(5)`→`§1414(d)(3)(B)(i)`). All other citations verified accurate. **Substantive holdings/applicability text still merits an SME read**, but the citations themselves are now correct.
- Updated coworker prompt below.
- **Engineering (deferred):** vocab-registry consolidation (Call 4).
- **Phase 3 (later, design doc):** exclusive modules for the 30 skills without one, question
  verification pass over machine-generated items, reusable case bank.

---

## ▶️ Updated Coworker prompt — remaining content packs (paste into Claude Coworker)

```
You're doing the remaining CONTENT / SME work for Phase 2 of "Praxis Makes Perfect" (a school-
psychology exam-prep app). Packs 1, 2, and 4 are DONE; engineering wiring is done. A separate
engineering session verifies your work afterward.

REPO / BRANCH: work on `claude/hopeful-benz-866a30` (locally /Users/lebron/Documents/PMP-hopeful-benz).
`git pull` first. Commit in logical chunks and `git push origin claude/hopeful-benz-866a30`.

READ FIRST: docs/PHASE2_REVIEW_BACKLOG.md (current state + the locked framework schema),
docs/CONTENT_AUTHORING_PLAN_2026-06-07.md (Pack specs/templates — note its status banner).

GOLDEN RULES: skill is the scored unit, objectives descriptive (objectiveBoundaryGuard test);
cool indigo/violet palette only; module ids stable (add, never rename). After ANY change run the
gate green before committing:
  npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build
DO NOT re-run any seeder/derive script after hand-editing without checking PHASE2_REVIEW_BACKLOG
first — the objective seeder refuses to clobber verified tags unless you pass --preserve-manual.

YOUR PACKS (priority order):
- Pack 6: ✅ DONE — all 10 cold-start anchors verified (is_human_verified:true). Skip.
- Pack 5: ✅ DONE — 32-entry frameworkRegistry.ts authored; 29/45 skills covered. Skip.
- Pack 3 (your only remaining task): deepen the thinnest module stubs in src/data/learningModules.ts (51 of 67 are
  <220 words; thinnest first). Per module add an objective header, a worked example, a `comparison`,
  and an `interactive` if missing; target ~400 words. Editing section CONTENT only is safe; do NOT
  add/rename modules or change primarySkillId without telling the engineering session (it must
  re-run the etsTopicIds + exam-weight derivations).

When you finish a chunk: gate green, commit, push, and tell Carlos so engineering can verify.
```
