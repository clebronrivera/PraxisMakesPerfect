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
| Misconception `questionIds` | `2f2d3f0`, `d300ba7` | `misconceptionQuestionMap.json`; **66/98** misconceptions linked, 206 questions (distractor-belief overlap). Up from 59/98 after the 2026-06-10 orphan re-key (0 unmappable-skill). |
| Exam-weight rollup | `181e352` | `skillExamWeights.json`; blueprint-anchored (official ETS 5403 category weights). **Changes LIVE ranking** (Call 2). |
| Pack 6 — anchor sign-off | `4a79cc0` | All **10** cold-start anchors (`PQ_ACA-09_7/_1`, `PQ_DBD-10_1/_3`, `PQ_DIV-01_7/_1`, `PQ_DIV-05_6/_7`, `PQ_FAM-03_6/_1`) reviewed and `is_human_verified:true`. Bank: 250→**260** verified. |
| Pack 5 — framework registry | TBD | `src/data/frameworkRegistry.ts` — **32 entries**, **29/45** skills covered. Case law (Tarasoff, Rowley, Endrew F., Larry P., Diana, Honig, PARC, Florence County), statutes (IDEA×6, 504, ADA, FERPA, HIPAA/FERPA, McKinney-Vento, ESSA), ethics standards (confidentiality, consent, dual relationships, mandated reporting, records, beneficence), practice frameworks (MTSS, PBIS, FBA, NASP model, Child Find, 504-vs-IDEA, ED eligibility, placement continuum). Not wired to scoring. `tests/frameworkRegistry.test.ts` added (8 tests; 250→**258** total). |

All four derive scripts regenerate their committed outputs **byte-identically** (verified 2026-06-09).
Gate (types · colors · lint · 250 tests · build · runtime) green. Local == remote.

**Derived artifacts are self-guarding:** each has a parity test (`moduleEtsTopics`, `misconceptionQuestions`,
`skillExamWeights`) that fails the build if the module/skill set changes without re-running the
derive script. So Pack 3 (content-only edits) is safe; adding modules/skills requires a re-derive.

---

## 🔬 Pack 3 verification pass — 2026-06-10 (commit `e6cfc7b`)

Multi-agent review of **all 67 modules** (17 reviewers + adversarial fact-check of every flagged
claim; **every finding re-checked against `questions.json`** so a module is never desynced from the
item that tests it). Verdicts: **15 pass · 30 minor · 22 needs-fix.**

**8 factual errors fixed** (`e6cfc7b`, content-only, gate green at 267 tests):

| Module | Sev | Fix |
|---|---|---|
| MOD-D1-04 | **critical** | "Beck Inventory (Narrow - Anxiety)" → **MASC-2**. BDI measures depression; module prose + `item_006` both key Beck=depression. |
| MOD-D1-01 | major | FERPA anchor "Records Protected Always" → **"Rights and Privacy Act"** (matched its own prose). |
| MOD-D1-01 | major | scenario s2 "test protocols & answer sheets → ALLOWED" (bank's NEW-10-TestSecurity keys inspect-yes/copy-no) → unambiguous inspect-and-review example. |
| MOD-D1-07 | major | SS list "(85th–15th percentile)" → **"(16th–84th)"** (anchor/example were already right). |
| MOD-D1-03 | minor | FBA trigger re-tied to the **manifestation determination** (IDEA §1415(k)(1)(F)). |
| MOD-D2-03 | minor | DuFour PLC is **four** questions, not three (its own example already used Q4). Added Q4 to title/anchor/prose/comparison/interactive. |
| MOD-D5-05 | major | **NREPP** discontinued 2018 → SAMHSA Evidence-Based Practices Resource Center (0 bank refs). |
| MOD-D8-04 | major | "approximately SS 69" mislabeled the 2-SD point (=70) → **SS 70** + clinical-judgment qualifier. |
| MOD-D10-07 | minor | "supervision ratio = max 2 interns" → **"NASP recommends no more than 2"** (matches `item_211`). |

**2 flags left unchanged on purpose — validated against the bank (changing the module would desync it):**
- **MOD-D9-05** "Dissemination → Adoption → Initial → Full" stages: matches the app's **cited source
  (Forman & Tripptree, 2014)** and an item whose keyed explanation says *"Dissemination is the first
  stage … linked to goodness of fit."* The reviewer's "should be NIRN/Exploration" was a framework
  assumption, not an error.
- **MOD-D10-07** NCSP "primary accreditation body" phrasing: matches `item_062`'s **keyed-correct
  answer**. Real-world-imprecise (NCSP is administered by the NSPCB, not "accredited"), but fixing it
  requires editing the **item**, not just the module → see surfaced items below.

**Verification caught 2 false alarms** (reviewer misreads; refuted): MOD-D1-07 percentile "doesn't
exist" (it did — fixed above) and MOD-D9-02 correlation-table layout (facts are correct).

### 🟡 Surfaced by the pass
- ~~**Completeness gaps vs the Pack 3 spec**~~ ✅ **CLOSED 2026-06-10 (commit `01545da`).** Parallel-
  authored **49 sections across 34 modules** (28 interactive blocks, 4 comparisons, 1 worked example,
  16 depth paragraphs), applied deterministically with a schema validator (0 warnings) + correctness
  spot-checks of every keyed interactive. All 67 modules now carry an interactive + comparison + worked
  example. 67 modules unchanged structurally (parity tests intact); gate green at 267 tests.
- **Question-bank items to review (out of Pack-3 scope — touches answer keys):**
  - `item_062` (ETH-03): keyed answer calls NASP the "accreditation body for the NCSP credential" —
    real-world-imprecise (NCSP is *administered* via the NSPCB; *programs* are accredited).
  - Implementation-stage framework is **internally mixed**: most items + MOD-D9-05 use Forman
    "Dissemination," but a few items use NIRN "Exploration/Installation." Pick one framework bank-wide.
- **~30 modules carry minor imprecision notes** (not fixed; low-severity wording). Full per-module
  detail in the workflow output (`tasks/wr6c92y0v.output`).

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
| **Misconception links** | 66/98 linked (post re-key); spot-check precision of the distractor-overlap matches + the LEG-S04→ETH-01 re-key home | SME |
| **Exam weights** | LIVE ranking change; confirm blueprint-faithful is acceptable (Call 2) | Product |
| ~~Pack 6 anchors~~ | ✅ Done (2026-06-10) | — |

---

## 🧹 Data-hygiene residue (small, surfaced — not yet fixed)

- ~~**10 misconception entries are unmappable**~~ ✅ **RE-KEYED 2026-06-10 (commit `d300ba7`).** The 5
  orphan metadata skills (`LEG-S03/S04/S07`, `MBH-S03`, `SWP-S04`) were re-keyed to mappable ids —
  LEG-S0x → `NEW-10-EthicalProblemSolving` (ETH-01, per the file's own "ETH-01 bridge" note), MBH-S03 →
  `MBH-S02` (DBD-07/FBA), SWP-S04 → `NEW-5-EBPImportance` (SWP-03). Derive re-run: **0 unmappable-skill**.
  **SME spot-check welcome** on the LEG-S04 (mandated reporting) home in particular — it followed the
  documented ETH-01 bridge, but SAF-04/ETH-02 are also defensible.
- ~~**39/98 misconceptions still have no questions**~~ → **now 32/98** after the re-key (coverage
  59→**66/98**, 191→**206** question links). 7 of the 10 re-keyed entries recovered links; the
  remaining gap is belief text that didn't surface in any distractor. A lower overlap threshold or SME
  tagging would raise this further.
- ~~**Bank-wide key-placement bias**~~ ✅ **FIXED 2026-06-10 (render-time shuffle, commit `decef8e`).**
  759/1150 items (66%) had B keyed-correct (DIV 84%, ETH 79%, SWP 73%; 0 multi-select, all A–D). The
  three **assessment** surfaces (AdaptiveDiagnostic — primary new-user path — + Screener + Full)
  rendered options in stored order, so the "always pick B" exploit was fully live there (practice
  surfaces already shuffled). Fix = approach (b), render-only, **zero questions.json mutation**:
  `src/utils/optionShuffle.ts` deterministically permutes display order per question id (FNV-1a →
  mulberry32 → Fisher–Yates, rotate-on-identity guard); wired into the 3 surfaces via a memoized
  `displayQuestion` passed only to `<QuestionCard>`. Canonical letters drive all scoring / `selected_answer`
  / distractor lookup (unaffected); explanations already render content-first (`sanitizeFeedbackText`).
  Result: displayed correct-answer slot is now **A 25.2 / B 22.5 / C 21.8 / D 23.5%** (E/F ~3%), down
  from 66% B. `tests/optionShuffle.test.ts` (9 tests) locks it in. Gate green at 267 tests.
  - **Optional consistency follow-up (not required):** PracticeSession + LearningPathModulePage +
    Redemption still shuffle via `Math.random()` (non-deterministic, not reproducible for audit). They
    already defeat the exploit, so this is cosmetic — could later be unified onto `optionShuffle.ts`.
  - **Historical coupling analysis (why approach (a) was rejected):** A naive positional option-shuffle
    would silently corrupt three coupled layers: (1) **880** `CORRECT_Explanation` + **76** `rationale`
    fields contain literal letter references ("Option A", "answer C") that must be remapped — and a
    blind remap risks false positives ("Type A", "Plan B", "Tier B"); (2) per-option distractor metadata
    (`distractor_tier_*`, `_error_type_*`, `_misconception_*`, `_skill_deficit_*` × A–F) must move in
    lockstep with the option text; (3) `misconceptionQuestionMap.json` is questionId-keyed (NOT
    letter-keyed) so it survives, but re-verify. **Three viable approaches — pick before building:**
    (a) **mutate data + rewrite explanations** (highest risk; needs per-item verification or LLM rewrite
    of the 880 explanations); (b) **randomize option order at render time**, keep stored letters fixed
    (no data mutation, but the UI must display explanations by content not letter — touches render/
    explanation logic); (c) **regenerate explanations** alongside the shuffle. Safety invariant for (a):
    for each item the *set* of `(option_text, tier, error_type, misconception, skill_deficit)` tuples
    must be identical before/after — only the letter assignment changes — and the correct answer's *text*
    must be unchanged. Decision is the user's; do not start the mutation without an approach greenlight.

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
