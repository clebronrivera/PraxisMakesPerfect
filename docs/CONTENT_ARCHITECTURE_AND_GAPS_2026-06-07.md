# Content Architecture & Cross-Content Gap Analysis — 2026-06-07

> **⏱ STATUS UPDATE 2026-06-09** — much of the gap below is now CLOSED (branch `claude/hopeful-benz-866a30`).
> Done: objective tags **human-verified** (210 review items → `manual`); **all 45 skills own a module**
> (58→**67**); module `etsTopicIds` derived; misconception `questionIds` backfilled (59/98); prereq DAG
> re-keyed to the 45; objective→exam-weight rollup shipped (blueprint-anchored). The gap counts in the
> body below are the ORIGINAL 2026-06-07 analysis — preserved for history, not current. Current state +
> what's left → `docs/PHASE2_REVIEW_BACKLOG.md` and the latest handoff. Still open: Pack 3 (deepen stubs),
> Pack 5 (framework registry), Pack 6 (anchor sign-off), vocab-registry consolidation, Phase 3.

> **Purpose.** The single source of truth for how PASS's content *should* connect end-to-end — domains, skills, **learning objectives**, questions, lessons/modules, vocabulary, cases, misconceptions, frameworks — so the same spine drives the questions, the exam weights, and the adaptive engine. Plus a cross-content gap analysis and a prioritized authoring spec.
>
> Supersedes the modules-only framing: `docs/MODULE_CONTENT_GAP_2026-06-07.md` is now the **modules slice** (§3.3 / Appendix). Derived from a 10-dimension audit (verified against the repo, 2026-06-07).

---

## 0. TL;DR

1. **The "objective/microscale" layer already exists as data** — `src/data/ets-content-topics.json` holds the **79 official ETS topics** (10 ETS-domains → 19 sections → 79 topics + keywords). They roll up cleanly into the 4 app domains (27 / 19 / 13 / 20). They are imported by **zero runtime files** — a complete island.
2. **The gap is connectivity, not volume.** Question coverage is solid at the skill level (min 20 / median 24 / max 38 per skill; 78% carry vignettes), vocab is rich (396 glossary terms across all 45 skills), all 45 skills have metadata. The problem is the pieces aren't *joined* below the skill.
3. **The ideal model adds ONE new key — the ETS topic code — reused everywhere. No 5th ID scheme, no scoring rewrite.** `Domain(4) → Skill(45, the scored unit) → Objective(79 ETS codes, descriptive) → content leaves`.
4. **Two real functional bugs** surfaced (not just architecture): the vocabulary Fluency Drill reaches only 79 terms and **20 of 45 skills are un-drillable**; and **5 skills have zero foundational anchor items**, breaking adaptive cold-start.
5. **Pragmatic V1 ≈ 2–3 weeks, mostly tagging/curation (not prose).** The dominant authoring need is **mapping/data + a handful of questions** — *not* new lessons. New modules and a case bank come later.

---

## 1. The ideal connected model — the "for every X" answer

A **4-tier entity graph joined by one new key (the ETS topic code)**:

```
DOMAIN (4 app  ·  10 ETS, rolling up 27/19/13/20)
  └─ SKILL (45)                         ← the MEASURED / SCORED unit (unchanged; has exam weight = SKILL_BLUEPRINT.slots, knowledgeType)
       └─ OBJECTIVE (79 = ETS topic codes "I.A.1.a" verbatim)   ← the DESCRIPTIVE / DIAGNOSTIC "microscale"
            ├─ QUESTION (1150)          — measures the objective   (tag: ets_topics[])
            ├─ LESSON / MODULE section  — teaches the objective    (tag: etsTopicIds[])
            ├─ VOCABULARY term          — defines a concept in it  (tag: objectiveIds[])
            ├─ CASE / vignette          — applies it               (tag: objectiveIds[])
            ├─ MISCONCEPTION            — what's gotten wrong       (via distractor → error_cluster_tag)
            └─ FRAMEWORK / law          — the authority behind it   (tag: frameworkRefs[])
```

The **objective is the keystone**. It is *not* a new sub-skill taxonomy to author and score — it is the official ETS outline (already in the repo, free authority + exam alignment) promoted to a first-class key. **The skill stays the floor of measurement** (no scoring rewrite); the objective is a facet hung off the skill that every content type tags.

### "For every X" — the target

| X (the unit) | In the ideal, every one has… | Today |
|---|---|---|
| **Skill** (45) | ≥1 exclusive **module** + a set of **objectives** it owns | 30/45 have no exclusive module; 0 have objectives |
| **ETS topic** (79) | a stated **objective** + ≥1 lesson teaching it + ≥N questions measuring it | exist as data, connected to nothing |
| **Objective** | questions, a lesson, vocab, a case, misconceptions all tagged to it | 0 content tagged to objectives |
| **Question** (1150) | a skill (✓) + a module (✓) + **an objective** + distractor→misconception links | skill+module yes; objective no; misconception links 0% |
| **Vocabulary term** (396) | skill (✓) + **objective** + the **questions** that use it | skill yes; objective/question no; only 79 reachable in the drill |
| **Misconception** | a canonical entry keyed to skill+objective, wired to the **distractors** that express it | 5 parallel schemes; 0% distractor linkage |
| **Framework/law** | a definition/holding/applicability, referenced by the questions that test it | bare name strings; 24/45 skills empty |

---

## 2. Connectivity rules — the join map

The edges that make it adapt fluidly. **EXISTS** = live today; **NEW** = the work.

| # | Edge | Status |
|--:|---|---|
| 1 | `Question.current_skill_id → Skill` | **EXISTS** — 100%, 0 orphans (the strongest edge; don't touch) |
| 2 | `Question.primaryModuleId / moduleRefs → Module` | **EXISTS** — 100%, 0 dangling |
| 3 | `Question.ets_topics[] → Objective` | **NEW** — the keystone; 1–2 codes/question, bulk-seeded by restricting to the question's skill's topics, then keyword-disambiguated + spot-checked |
| 4 | `Skill → Objective[]` via `skillObjectiveMap.ts` | **NEW** — curated many-to-many, ~79 links; the live reconciler keyed on the 45 progress IDs |
| 5 | `Objective → exam weight` via ETS section/domain rollup | **NEW** — gives every content type a real blueprint weight (replaces the `slots` proxy) |
| 6 | `Module.etsTopicIds[] → Objective` | **NEW** — each lesson declares its objective(s); first pass derived from the questions it already routes |
| 7 | `Module → Skill` via a single canonical `primarySkillId` | **NEW (cheap)** — kills the arbitrary first-declared home for the 22 multi-domain / 39 shared modules |
| 8 | `Vocab term → skill / objective / questions` in ONE registry | **CONSOLIDATE** — skill edge exists; objective + question edges new; deletes the contradictory metadata-v1 map |
| 9 | `Skill → exam weight` via `SKILL_BLUEPRINT.slots` | **EXISTS** — keep until #5 replaces it |
| 10 | `Misconception → Question` | **NEW** — backfill the 0% `questionIds` via per-question distractor metadata + the 20-tag `error_cluster_tag` |
| 11 | `Case → skill / objective / Question.caseId` | **NEW** — a reusable case bank, seeded from the 199 archetypes |
| 12 | **ID rule** — the objective key is the ETS code `I.A.1.a` verbatim everywhere; route legacy `NEW-*`/`*-S##` through `skillIdMap.ts` | **NEW (discipline)** — do NOT mint a 5th scheme |
| 13 | **QA invariant (CI)** — every ETS topic has ≥N questions + ≥1 module; every skill owns ≥1 objective; every objective owned by ≥1 skill | **NEW** — fails the build if an edit silently starves an objective |

---

## 3. Current state by content type

### 3.1 Taxonomy & objectives
4 app domains → 45 skills (`progressTaxonomy.ts`, IDs `CON-01`/`DBD-01`, `knowledgeType`). **No objective layer below skill.** 79 ETS topics exist in `ets-content-topics.json` but are referenced only by 3–4 dead offline scripts. A stale skill↔topic crosswalk exists (`archive/.../CONTENT_TOPICS_CROSSWALK.md`) but targets the *old 52-skill scheme* and is broken (reads `question.id`/`skillId`; data now uses `UNIQUEID`/`current_skill_id`).

### 3.2 Questions (1150)
Per-skill **min 20 / median 24 / max 38** — even coverage, 0 orphans. **78%** carry vignettes (`case_text`); **250** are `is_foundational`. **Only 2 cognitive-complexity bands** (Recall/Application). 0/1150 tagged to an objective. ~900 are unvetted machine-generated "lean" items (no human verification, sparse `core_concept`).

### 3.3 Modules (58) — *detailed breakdown in `MODULE_CONTENT_GAP_2026-06-07.md`*
**30/45 skills have no exclusive module**; **39/58** serve >1 skill; **22/58** span >1 app domain (filed under an arbitrary first-declared skill). Lessons declare **no objectives**. Stage-1 scaffolding (`role`, `sequenceGroup`, `prerequisiteModuleIds`, `concepts`) is typed but **0% populated**. `visual` section type essentially unused.

### 3.4 Vocabulary (396 terms)
`skill-vocabulary-map.json` covers all 45 skills (22–67 terms each) with glossary definitions. **But two contradictory term→skill maps exist** on incompatible ID schemes; `vocabSkillIndex.ts` wrongly treats the thin `skill-metadata-v1` arrays as authoritative → the **Fluency Drill reaches only 79 terms and 20/45 skills are un-drillable**. No term→objective or term→question links.

### 3.5 Cases / vignettes
`case_text` schema exists but the **reusable-case bank is empty** — cases live single-use inside question stems. `caseArchetypes` are one-line labels (2–3/skill), not scenarios; DBD-08 has 0; 54/99 metadata entries unwired.

### 3.6 Misconceptions
Rich per-question distractor metadata (tier / misconception / error type / skill deficit per option) **but 0% linked** to the curated `misconception-taxonomy.ts`. **5 parallel, incompatible schemes.** `error_cluster_tag` (a 20-tag controlled vocab) is the one clean cross-question grouping. 2 skills return 0 curated misconceptions at runtime.

### 3.7 Frameworks / laws
`lawsFrameworks` are bare name strings; **24/45 skills empty**. No question→framework link. The legal/ethics skills (ETH/LEG) do carry frameworks; gaps are mainly SAF-03 (Tarasoff/duty-to-warn) and ACA-09 (504/ADA/IDEA-OHI).

### 3.8 Prerequisites
`skillPrereqGraph.ts` is keyed to a stale taxonomy: **16/45 skills missing**, **16 phantom keys**, 4 broken edges, only ~10/45 get a usable signal. (This is the root of the phantom-prereq bug in the modules audit.)

### 3.9 ID integrity
**4 incompatible ID schemes:** skills `DBD-01` · metadata/misconceptions `DBDM-S01`/`NEW-*` · ETS `I.A.1.a` · modules `MOD-D2-01`. `skillIdMap.ts` reconciles only progress↔metadata (45, 1:1). 99 metadata entries, 45 wired (54 dangling — legacy/finer; do **not** delete per prior corrected audit).

---

## 4. Cross-content gaps — ranked by leverage

| # | Gap | Type | Fix | Effort |
|--:|---|---|---|---|
| 1 | Fluency drill reaches 79 terms; **20/45 skills un-drillable** | broken-connectivity | Re-point `vocabSkillIndex.ts` → `skill-vocabulary-map.json` | **near-zero** (no authoring) |
| 2 | No `skill → ETS-objective` map for the live 45 skills | broken-connectivity | Author `skillObjectiveMap.ts` (~79 links; seed from crosswalk, hand-correct) | data |
| 3 | Questions not tagged to objectives (0/1150) | missing-data | Add `ets_topics[]`; seed per-skill + keyword disambiguate | data |
| 4 | **5 skills have 0 foundational anchor items** (cold-start break) | missing-content | Author 2 anchor items each (10 total): ACA-09, DBD-10, DIV-01, DIV-05, FAM-03 | **small authoring** |
| 5 | 30/45 skills have no exclusive module | thin-coverage | Author ≥1 owned module/skill, by question volume (§Appendix) | authoring (V2) |
| 6 | Two contradictory term→skill maps | fragmentation | One vocab registry; retire metadata-v1 as term source | data |
| 7 | Modules have no objective field + dead scaffolding | broken-connectivity | `etsTopicIds[]` (derive from #3); populate or delete scaffolding | data |
| 8 | 900/1150 questions unvetted | quality | Verification pass; 5 zero-rich skills first | large |
| 9 | 2 complexity bands; 11 skills can't meet `recallTarget` | thin-coverage | Empirical p-value write-back (not hand-banding); ~23 recall items | mixed |
| 10 | No reusable case bank; misconception `questionIds` 0%; stale scripts | broken-connectivity | Repoint/delete dead scripts (cheap); defer case bank | mixed |

---

## 5. Two functional bugs (fix regardless of the architecture)

- **B1 — Fluency Drill is half-dark.** `vocabSkillIndex.ts` reads the thin `skill-metadata-v1` vocab arrays (79 terms) instead of `skill-vocabulary-map.json` (396 terms, all 45 skills). **20 of 45 skills cannot be drilled at all.** Pure connectivity — the terms and definitions already exist. Highest ROI fix in the audit.
- **B2 — Adaptive cold-start break.** `useAdaptiveLearning` anchor-seeding needs `is_foundational` items; **5 skills (ACA-09, DBD-10, DIV-01, DIV-05, FAM-03) have zero**, so the engine cannot cold-start them. 10 authored items fixes it.

---

## 6. Over-engineering verdict — what's worth it (the user's "without overcomplicating")

**PRAGMATIC V1 (~2–3 weeks, mostly tagging/data; unlocks ~80% of the value):**
1. `skillObjectiveMap.ts` — the single curated skill↔ETS map (~79 links).
2. `ets_topics[]` on all 1150 questions (deterministic seed scoped by skill, then spot-check).
3. `primarySkillId` on all 58 modules (cheap; kills the arbitrary-home bug *today*).
4. **Re-point the Fluency Drill** (B1) — zero authoring, un-breaks 20/45 skills. **Do first.**
5. **10 foundational anchor items** for the 5 zero-anchor skills (B2).
6. One CI coverage test on the new map.

**WORTH IT — V2 (after V1 proves out):** `etsTopicIds` on modules (derive from #3, curate) · fold glossary defs + objective/question links into one vocab registry · objective→ETS-weight rollup to replace the `slots` proxy in `moduleCatalog` · backfill misconception `questionIds` · author exclusive modules for the 30 unowned skills (LEG-02 37Q, DBD-03/ETH-01 33Q first) · fix the prereq DAG (re-key to the 45, delete phantoms, hand-author edges).

**DO NOT BUILD (the traps):**
- (a) A **5th sub-skill ID scheme** below ETS — the 79 ETS codes *are* the objectives.
- (b) **Scoring at the objective level** — keep the skill as the scored floor; objective is descriptive. Per-objective IRT explodes the model for marginal signal (most skills own 1–2 objectives).
- (c) **Resurrecting dead scaffolding** into full multi-lesson prereq chains — gating already works at skill grain.
- (d) **Empirical IRT calibration as a prerequisite** — nice backfill, not blocking (and marketing already moved off IRT claims).
- (e) A first-class **case bank** — real authoring, least leverage; defer.
- (f) Hand-authoring a **3rd–4th difficulty band** across 1150 items — write empirical p-value back from response data instead.

---

## 7. Authoring spec — what to hand a content coworker (beyond modules)

> Net: the missing thing is overwhelmingly the **JOIN** (one ETS-code field reused across questions/modules/vocab + one curated skill→objective map), not new lessons.

**QUESTIONS (real item authoring)**
- **10 anchor items** — 2 each for ACA-09, DBD-10, DIV-01, DIV-05, FAM-03 (fixes B2). *High, small.*
- **~23 Recall items** across 11 skills that can't meet their blueprint `recallTarget` (or relax the target for application-heavy skills). *Medium.*
- **Verification pass** over the 900 unvetted lean items (backfill `core_concept`/misconception/prereq), 5 zero-rich skills first. *Quality, large.*
- Backfill distractor metadata on options **E/F** for the 250 six-option items. *Low.*

**MAPPING / DATA (the bulk — tagging + curation, not prose)**
- `skillObjectiveMap.ts` (~79 links) · `ets_topics[]` on 1150 questions · `etsTopicIds[]` + `primarySkillId` on 58 modules · vocab registry consolidation (objective + question links; reconcile 86 orphan concepts; tag 104 untagged questions) · backfill misconception `questionIds` · map 371 ETS keywords onto glossary terms (surfacing ~289 candidate new terms) · persist empirical p-value/discrimination from admin Item Analysis · repoint/delete the dead crosswalk/coverage scripts + add a live per-objective coverage CI test.

**VOCABULARY (optional term authoring)**
- ~289 ETS keywords have no glossary entry → candidate new defined terms if exam-relevant; tag/author 1–2 items for the 18 terms exercised by no question. *Low.*

**FRAMEWORKS/LAWS**
- Canonical framework registry (~30–40 rows: id, citation, summary, key holding, applicability, guarded misconception), referenced by id. Add SAF-03 (Tarasoff/duty-to-warn) and ACA-09 (504/ADA/IDEA-OHI). *Medium.*

**CASES / VIGNETTES (largest pure-authoring lift, lowest leverage — defer)**
- Reusable case bank seeded from the 199 archetypes (DBD-08 has 0), tagged to skill + objective, referenced by `caseId`. *V2/V3.*

**OBJECTIVES (text, near-free)**
- Objective statements come straight from ETS topic `text[]` — no original authoring; surface as a "You'll be able to…" header per lesson and as the diagnostic label per missed objective.

---

## 8. Sequenced plan

- **Phase 0 (functional fixes, days):** B1 fluency re-point, B2 ten anchor items, repoint/delete dead scripts.
- **Phase 1 (the spine, ~2–3 wks):** `skillObjectiveMap.ts`, `ets_topics[]` on questions, `primarySkillId` on modules, CI coverage invariant. → objective-grain diagnosis online.
- **Phase 2 (consolidate + enrich):** one vocab registry, `etsTopicIds` on modules, misconception `questionIds`, objective→weight rollup, prereq DAG repair, framework registry.
- **Phase 3 (authoring at scale):** exclusive modules for the 30 unowned skills (by question volume), question verification pass, case bank.

---

## 9. Appendices
- **Modules detail:** `docs/MODULE_CONTENT_GAP_2026-06-07.md` (per-skill module coverage, multi-domain modules, authoring backlog ranked by #Q).
- **ETS outline:** `src/data/ets-content-topics.json` (the 79 objective statements + keywords).
- **ID crosswalk:** `src/data/skillIdMap.ts` (progress ↔ metadata).
