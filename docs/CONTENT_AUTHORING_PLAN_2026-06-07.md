# Content Authoring Plan — Phase 2 (coworker task pack) — 2026-06-07

> **Read first:** `docs/CONTENT_ARCHITECTURE_AND_GAPS_2026-06-07.md` (the model) and the
> "Content Architecture & Connectivity" section of `docs/HOW_THE_APP_WORKS.md` (what's live).
>
> **What just shipped (Phase 0 + 1, branch `claude/hopeful-benz-866a30`):** the *wiring* is
> done. All 45 skills are drillable; 5 cold-start skills have anchors; `skillObjectiveMap.ts`
> links every skill to its ETS objectives; `questionObjectiveMap.json` tags all 1,150
> questions (provisional); every module has a `primarySkillId`. **What's left is content** —
> verifying the machine-seeded connections and filling the lessons behind them. That's this doc.

This plan is six self-contained **work packages**. Each says: the goal, why it matters, the
exact scope (real lists/counts, not estimates), the files to touch, the format, acceptance
criteria, effort, and who can do it. Packages are independent — assign in any order, though the
suggested sequence is at the bottom.

**Golden rule (unchanged):** the **skill** stays the scored unit; **objectives are descriptive**.
Do not add objective-level scoring. Cool indigo/violet palette only (no new colors needed for
any of this). After any change run `npm run scan:types && npm run scan:colors && npm run lint && npm test && npm run build`.

---

## Snapshot of the current content (measured, not guessed)

| Fact | Value |
|---|---|
| Modules | 58, all with a `primarySkillId` |
| Module depth | median **161 words**; **51 / 58 are < 220 words** (skeletal stubs) |
| Skills that own **no** module | **9 of 45** (they borrow sibling-skill lessons) |
| ETS objectives with **no owning module** | **16 of 79** (they belong to those 9 skills) |
| Question→objective tags needing human review | **139 fallback + 71 multi-tag = 210 items** |
| Skills with **0** frameworks/laws | **24 of 45** |
| `visual` module sections in use | **0 / 58** (section type exists, never authored) |

---

## Pack 1 — Verify the seeded objective tags (data review; highest leverage)

**Goal.** Turn the provisional `questionObjectiveMap.json` tags into human-verified truth, and
disambiguate the items the machine couldn't.

**Why.** Every tag is currently `verified: false`. The objective layer can't drive routing or
diagnosis until a human confirms it. This is bounded, concrete, and needs domain judgment but no
prose writing — the best first task.

**Scope (exact lists).** Two queues:

**(a) Fallback queue — 139 items.** The seeder assigned the skill's *primary* objective because
no keyword disambiguated. For each, read the question and pick the right objective from the
skill's candidate set:

| Skill (lesson) | # | Choose among |
|---|---|---|
| ACA-08 Executive Functioning | 24 | `II.A.1.c` setting/achieving goals · `II.A.2.c` biological/developmental influences |
| SWP-03 Evidence-Based Practices | 18 | `III.A.1.c` importance of EBP · `III.A.1.a` data for systems decisions |
| RES-03 Research Design & Stats | 15 | `IV.B.1.c` research designs/statistics · `IV.B.1.a` evaluating research quality |
| MBH-02 Counseling | 12 | `II.B.2.a` counseling methods · `II.B.1.b` small-group · `II.B.2.f` outcome data |
| DEV-01 Child Development | 10 | `II.B.2.b` developmental levels · `II.B.3.c` bio/cultural influences |
| DIV-03 Bias | 9 | `IV.A.1.c` implicit/explicit bias · `IV.A.1.d` fairness/social justice |
| DIV-01 Cultural Factors | 7 | `IV.A.1.a` culture in intervention design · `IV.A.1.b` community liaisons |
| DBD-01 RIOT | 6 | `I.A.1.a` info-gathering/RIOT · `I.A.1.c` screening · `I.A.2.i` tech/data |
| MBH-03 Intervention Models | 6 | `II.B.2.c` CBT/SFBT · `II.B.2.d` ABA |
| FAM-02 Family | 5 | `III.C.1.b` advocacy · `III.C.1.a` family systems · `III.C.1.d` parenting |
| RES-02 Applied Research | 5 | `IV.B.1.b` apply research · `IV.B.1.f` EBP · `IV.B.1.d` change · `IV.B.1.e` program eval |
| ACA-09, DBD-05, MBH-04 | 4 each | (see skill's row in `skillObjectiveMap.ts`) |
| PSY-01, PSY-04 | 3 each | … |
| ACA-04, CON-01, ETH-02, SAF-01 | 1 each | … |

(The exact UNIQUEIDs per skill are printed by the seeder — run it and read `scripts/ets-seed-report.json`, or ask an engineer for the list.)

**(b) Multi-tag queue — 71 items** with two objectives: confirm both are right or trim to one.
Concentrated in: CON-01 (12), LEG-01 (11), ETH-03 (7), RES-02 (7), ACA-09 (6), PSY-01 (5), SAF-01 (5), then a long tail.

**Files.** Edit `src/data/questionObjectiveMap.json` entries in place:
```jsonc
"PQ_ACA-08_10": { "ets_topics": ["II.A.2.c"], "method": "manual", "verified": true }
```
Set `method: "manual"` and `verified: true` once reviewed; fix `ets_topics` if wrong. **Only use
codes already in that skill's `skillObjectiveMap[skill]` set** (the test enforces this).

**Acceptance.** `npm test` green (parity + allowed-codes hold; the map test now allows
`method:"manual"` entries to be `verified:true`); `verifiedCount` rises in `meta`; ideally fallback
count → 0. **If you re-seed, use `npx tsx scripts/migrations/seed-question-ets-topics.mjs --preserve-manual`**
— that guard (built 2026-06-07) keeps your `method:"manual"` tags. A plain re-run still overwrites them.

**Effort.** ~210 items, ~1–2 min each = ~5–7 focused hours. **Who:** anyone with school-psych
content knowledge; no coding beyond editing JSON.

---

## Pack 2 — Author a dedicated module for each of the 9 unowned skills (new module content)

**Goal.** Give every skill its own lesson. Today 9 skills borrow sibling lessons and own none;
their 16 ETS objectives have no module that teaches them.

**Why.** This is the core "build module content / divide content up" lift. Each skill has
20–25 questions but no home lesson, so a learner routed there lands on a neighbor's content.

**Scope — the 9 skills (ranked by question volume), with objectives to teach and source material:**

| New module owner | Q | Objectives to teach | Borrowed source to split from |
|---|---|---|---|
| **ETH-02** Professional Liability & Supervision | 25 | `IV.C.2.d` liability/malpractice/negligence · `IV.C.3.c` supervision/mentoring | MOD-D10-03, MOD-D10-07 |
| **MBH-02** Individual & Group Counseling | 24 | `II.B.2.a` counseling methods · `II.B.1.b` small-group · `II.B.2.f` outcome data | MOD-D4-01/07/08 |
| **SWP-03** Evidence-Based Schoolwide Practices | 24 | `III.A.1.c` EBP · `III.A.1.a` data for systems | MOD-D5-01/03, MOD-D9-05 |
| **DBD-09** Ecological Assessment | 22 | `I.A.2.h` ecological assessment | MOD-D8-01, MOD-D7-01 |
| **PSY-01** Test Scores, Norms & Interpretation | 22 | `I.A.3.b` scores/norms · `I.A.3.c` procedure strengths/limits | MOD-D1-07/08, MOD-D9-02 |
| **LEG-03** Section 504 & ADA | 22 | `IV.C.2.a` 504/ADA/federal law | MOD-D10-01, MOD-D10-06 |
| **DBD-10** Background Info & Records Review* | 20 | `I.A.1.b` background info/records | MOD-D1-01, MOD-D10-04/05 |
| **ACA-09** Health Conditions & Educational Impact* | 20 | `II.B.1.c` risk/health · `II.B.3.b` MH impact · `II.B.1.d` trauma | MOD-D4-06, MOD-D8-04 |
| **DIV-01** Cultural Factors in Intervention Design* | 20 | `IV.A.1.a` culture in design · `IV.A.1.b` community liaisons | MOD-D8-01/03, MOD-D7-01 |

\* also a cold-start skill (Pack 6) — doubly worth doing.

**Files.** Add a `LearningModule` object to `LEARNING_MODULES` in `src/data/learningModules.ts`;
prepend its id to `SKILL_MODULE_MAP[<skill>]` (so it becomes the primary) and set its
`primarySkillId` to that skill. Use the next free id in that doc-domain block (e.g. `MOD-D9-06`).

**Format.** Use the section schema (template below). A real lesson = an `anchor` hook + 2
`paragraph`s + a `comparison` or `list` + one `interactive` + (optional) `visual`. Aim 350–550
words. Pull the on-topic slices out of the borrowed modules and expand with worked examples and
the skill's own questions as scenarios.

**Acceptance.** `modulePrimarySkill.test.ts` green (new module owned, valid skill, in the map);
`primarySkillId` set; the skill now shows its own lesson. **Effort:** ~2–3 hrs/module = ~25 hrs.
**Who:** school-psych SME + light TS (copy an existing object literal).

---

## Pack 3 — Deepen the 51 thin modules (build out existing content)

**Goal.** Bring the skeletal stubs (median 161 words) up to real lessons.

**Why.** The modules are wired and routed but most are a paragraph or two. Thinnest first:
MOD-D4-03 (96w), MOD-D4-06 (100w), MOD-D6-01 (100w), MOD-D9-04 (101w), MOD-D5-03 (102w),
MOD-D7-01 (105w), MOD-D4-07 (107w)… (full list: run `npx tsx` over `LEARNING_MODULES` word counts).

**Per module, add:** an objective header ("**You'll be able to:** …" from the ETS topic text),
one worked example, a `comparison` of the easy-to-confuse pair, and one `interactive` if missing
(only 30/58 have one; **0/58 use `visual`** — diagrams are an untapped format). Target ~400 words.

**Files.** `src/data/learningModules.ts` (edit the module's `sections`). **Acceptance:** word
count up, still typechecks, palette clean. **Effort:** ~45 min/module. **Who:** SME.
*Note:* overlaps Pack 2 — author the 9 new modules (Pack 2) before deepening their borrowed sources.

---

## Pack 4 — Wire modules to objectives (`etsTopicIds`) — connect the spine

**Goal.** Populate the reserved `etsTopicIds?` field on each module (Phase-2 connection from the
design doc) so a missed objective can route to the exact lesson.

**Why.** Modules currently know their owner skill but not which *objectives* they teach. Deriving
this closes the question→objective→lesson loop.

**How (semi-automated).** An engineer writes a small derivation: for each module, aggregate the
`ets_topics` of the questions that route to it (`primaryModuleId` / `moduleRefs` in
`questions.json` → look up `questionObjectiveMap.json`), keep the top 1–3, **after Pack 1 is done**
(so the tags are trustworthy). A human confirms each module's list against its content.

**Files.** Populate `etsTopicIds` on each `LearningModule`; add a coverage test (every module's
`etsTopicIds ⊆ skillObjectiveMap[primarySkillId]`). **Effort:** ~1 day eng + ~3 hrs review.
**Who:** engineer + SME confirm. **Depends on Pack 1.**

---

## Pack 5 — Framework/law registry (bring in authoritative content)

**Goal.** Give skills their governing frameworks/laws. **24 / 45 skills have none today.**

**Why.** The legal/ethics items reference authorities (FERPA, IDEA, Tarasoff, Larry P., Rowley,
Endrew F., 504/ADA/IDEA-OHI) that aren't captured as reusable, cited entries. Named gaps from the
design doc: **SAF-03** (Tarasoff/duty-to-warn), **ACA-09** (504/ADA/IDEA-OHI).

**How.** Author a `src/data/frameworkRegistry.ts`: ~30–40 rows of `{ id, name, citation, summary,
keyHolding, applicability, guardedMisconception }`, each tagged to skill(s) + objective(s) and
referenced by id (don't inline prose into questions). **Effort:** ~2 days SME. **Who:** SME with
legal/ethics depth. *(Net-new file; coordinate the shape with an engineer first.)*

---

## Pack 6 — SME-verify the cold-start anchors (quality gate)

**Goal.** Confirm the 10 reclassified `is_foundational` items are correct, fair entry-points.

**Why.** Phase 0b flipped 10 existing items to foundational to fix cold-start; they're
`is_human_verified: false` and carry `foundational_note: "reclassified_cold_start_patch_2026-06-07"`.
The adaptive engine serves foundational items first, so an SME should sign off.

**Items.** `PQ_ACA-09_7/_1`, `PQ_DBD-10_1/_3`, `PQ_DIV-01_7/_1`, `PQ_DIV-05_6/_7`, `PQ_FAM-03_6/_1`.
**Check:** clear stem, unambiguous correct answer, recall/entry-level difficulty, no trick. If one
is weak, swap to a better item in the same skill (keep ≥ 2 foundational per skill — the schema test
enforces this). **Files.** `src/data/questions.json` (`is_human_verified: true` when confirmed).
**Effort:** ~1 hr. **Who:** SME.

---

## Authoring template (module section schema)

```ts
{
  id: 'MOD-D9-06',                 // next free id in the doc-domain block; never reuse
  primarySkillId: 'PSY-01',        // the skill this lesson owns
  title: 'Reading Score Reports: Standard Scores, Percentiles, and Error Bands',
  // etsTopicIds: ['I.A.3.b', 'I.A.3.c'],   // Pack 4 — optional now
  sections: [
    { type: 'anchor', label: 'The mistake people make', text: 'A 25th-percentile score is not "25% correct." …' },
    { type: 'paragraph', text: 'Standard scores place a student on a normal curve …' },
    { type: 'comparison', leftHeader: 'Standard score', rightHeader: 'Percentile rank',
      rows: [{ left: 'Mean 100, SD 15 …', right: 'Rank vs peers; non-linear near the mean …' }] },
    { type: 'list', label: 'Read every score with', items: ['the confidence interval (SEM)', 'the norm group', 'the date'] },
    { type: 'interactive', interactiveType: 'click-selector', prompt: 'Which score needs an error band?',
      options: [{ id: 'a', label: 'SS 98', isCorrect: true, explanation: '…' }] },
  ],
}
```
Section types: `paragraph` · `anchor` (highlighted hook) · `list` · `comparison` (two-column) ·
`interactive` (`scenario-sorter` / `drag-to-order` / `term-matcher` / `click-selector` / `card-flip`) ·
`visual` (`image` / `diagram` — currently unused; good for processes like RIOT or MTSS tiers).

---

## Suggested sequence

1. **Pack 1** (verify objective tags) — unblocks routing *and* Pack 4; highest leverage, no writing.
2. **Pack 2** (9 owned modules) — biggest learner-visible win; do the 3 cold-start skills first
   (ACA-09, DBD-10, DIV-01).
3. **Pack 6** (anchor sign-off) — quick, protects cold-start quality.
4. **Pack 4** (module `etsTopicIds`) — after Pack 1; closes the loop.
5. **Pack 3** (deepen stubs) — ongoing; thinnest first.
6. **Pack 5** (framework registry) — parallelizable; needs a shape decision with an engineer.

## Who does what
- **Content SME (school psych):** Packs 2, 3, 5, 6, and the judgment in Pack 1.
- **Engineer:** the derivation/guard for Pack 4 (the seeder `--preserve-manual` flag is already
  built ✅), the `frameworkRegistry.ts` shape, and reviewing PRs (run the 5-command gate).
- **Either:** Pack 1 JSON edits.

## Guardrails (don't undo the wiring)
- Objective codes must stay within a skill's `skillObjectiveMap` set (tests enforce it).
- After manual tag edits, re-seed only with `--preserve-manual` (the guard exists; a plain re-run clobbers them).
- Keep the scored unit = skill; no objective-level scoring (the boundary-guard test will fail).
- Module ids are stable — never rename; only add.
