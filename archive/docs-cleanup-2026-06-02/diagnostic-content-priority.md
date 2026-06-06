# Diagnostic Content Priority Plan
## PraxisMakesPerfect — Pre-Implementation Design Document

**Status:** Awaiting approval before authoring work begins
**Branch this document gates:** Distractor content authoring (Phase C) and `feature/adaptive-diagnostic-redesign`
**Companion document:** `docs/misconception-taxonomy-design.md`
**Does not touch:** Source code, TypeScript files, AdaptiveDiagnostic.tsx, scoring logic, adaptive branching

---

## 1. Purpose and Framing

The adaptive diagnostic redesign depends on trustworthy diagnostic content. **The current blocker is content truthfulness, not adaptive logic.**

The adaptive branching infrastructure (branching rules, scoring, confidence weighting) can be designed in parallel with or after content work. But the redesign cannot produce meaningful diagnostic output if the questions it branches on have diagnostically inert metadata. When a student answers incorrectly and the wrong-answer evaluation sends boilerplate text to the AI layer, no amount of branching sophistication fixes the signal problem.

This document is a prioritized triage and authoring plan. It identifies what is broken, in what order it should be repaired, and what "minimum viable coverage" means before the adaptive diagnostic redesign branch can open. It does not propose implementation artifacts, source code changes, or adaptive logic modifications.

---

## 2. The Core Problem: Content Truthfulness

All findings in this section are **(CONFIRMED)** from audit files unless labeled otherwise.

The diagnostic bank contains 250 items covering 40 of 45 skills. There are 750 distractor slots across those items; 748 are structurally present (99.7%). On a structural completeness check, the bank looks nearly complete.

On a content-quality check, it fails entirely.

**`distractor_misconception_A–F` fields:** 0 of 748 populated slots are content-valid **(CONFIRMED)**. Every single value follows an identical auto-generated template derived mechanically from the first 20 characters of the wrong-answer option text:

> *"Student mistakenly selects an option related to '{first 20 chars of option text}...' instead of the correct concept."*

Word count across all 748 values falls between 13 and 18 words (median 15) — an artificially narrow range consistent with batch template generation. The values contain no information about why a student would choose the option, what knowledge gap drives the error, or what the underlying incorrect belief is.

**`distractor_skill_deficit_A–F` fields:** 0 of 748 are content-valid **(CONFIRMED)**. All contain 1–3 word title-cased fragments from option text. None reference any of the 45 skill identifiers in the taxonomy. Examples: `"The Federal Confidentiality Act of 1975"` → stored as `"Federal Confidentiality"`. `"Individuals With Disabilities Education..."` → stored as `"Individuals With Disabilities"`.

**`dominant_error_pattern`:** `"concept_substitution"` for all 250 diagnostic items — zero variance **(CONFIRMED)**. The field was almost certainly set in a single batch operation. It cannot distinguish between items where the dominant failure mode is procedural mis-sequencing, retrieval interference, or overgeneralization.

**`error_cluster_tag`:** 2 values only across all 250 items: `theory_substitution` (86.4%) and `procedure_inversion` (13.6%) **(CONFIRMED)**. Near-constant; provides no per-item signal.

**`top_misconception_themes`:** Populated on ~22% of questions with domain-level templates (`"Confusion regarding core LEG principles"`). No code consumer was found in the codebase — this is a confirmed orphaned field with no downstream effect **(CONFIRMED)**.

**`distractor_tier` (L1/L2/L3) and `distractor_error_type` (Conceptual/Procedural/Lexical):** Structurally present, plausible taxonomy, AI-assigned, not human-reviewed at the distractor level. `distractor_tier` contains an undocumented 4th value (`foundational_gap`) on 4 distractor slots, outside the stated schema. These fields are usable as rough signals but their per-distractor accuracy is unverified **(CONFIRMED; accuracy UNVERIFIED)**.

**Downstream consequence:** When a student answers a diagnostic question incorrectly, `tutorQuizEngine.ts` extracts the `distractor_misconception` field for the selected wrong answer and passes it to Claude in the quiz evaluation call. Claude currently receives boilerplate at that point. This is the operational impact of the content problem.

---

## 3. Vocabulary Tag Gap (Separate but Related Problem)

The prior branch (`feature/diagnostic-summary-and-selector-foundation`) unstripped the `missedConcepts` pipeline — wrong-answer concept tags now flow through to the diagnostic output. This is working infrastructure. But it only fires for questions that have vocabulary tags applied.

**(CONFIRMED):** 37 of 250 diagnostic items (14.8%) are untagged in `question-vocabulary-tags.json`. Each untagged diagnostic item silently suppresses the `missedConcepts` signal for every wrong answer on that item.

**All 37 untagged diagnostic items, by skill:**

| Item ID | Skill |
|---------|-------|
| item_013 | SAF-03 |
| item_024 | SAF-01 |
| item_026 | PSY-04 |
| item_029 | MBH-05 |
| item_031 | ETH-01 |
| item_038 | ETH-02 |
| item_040 | FAM-02 |
| item_057 | DBD-05 |
| item_062 | ETH-03 |
| item_070 | DBD-01 |
| item_079 | ETH-01 |
| item_084 | ETH-01 |
| item_098 | ACA-08 |
| item_117 | ACA-04 |
| item_118 | DBD-01 |
| item_120 | ACA-08 |
| item_135 | DBD-01 |
| item_160 | SAF-04 |
| item_162 | ACA-06 |
| item_163 | SAF-04 |
| item_165 | SAF-04 |
| item_176 | MBH-04 |
| item_195 | ACA-04 |
| item_200 | ACA-06 |
| item_201 | CON-01 |
| item_211 | ETH-02 |
| item_212 | ETH-01 |
| item_213 | ETH-02 |
| item_215 | ETH-01 |
| item_221 | LEG-02 |
| item_223 | MBH-03 |
| item_224 | LEG-04 |
| item_226 | LEG-04 |
| item_228 | MBH-03 |
| item_231 | MBH-05 |
| item_235 | ACA-06 |
| item_240 | DBD-09 |

**Worst single skill:** ETH-02 — 17 of 25 diagnostic items untagged (68%) **(CONFIRMED)**. ETH-01 has 5 untagged diagnostic items across the list above.

Tagging is lower-effort than distractor misconception authoring. It unlocks an already-built pipeline feature. It is Priority 1 precisely because the fix-to-signal ratio is high.

---

## 4. Priority 0 — Conditional Structural Check: item_008

**(CONFIRMED):** `item_008` (skill SWP-04, Domain 2.0) has options C and D missing all four distractor fields: `distractor_tier`, `distractor_error_type`, `distractor_misconception`, `distractor_skill_deficit`. Options C and D have answer text of `"7.0"` and `"5.0"` respectively — numeric values that suggest a malformed item where the intended option text was not captured. This item is flagged `HUMAN_REVIEWED` and `is_foundational`. The two missing slots represent 0.3% of the 750 total distractor slots.

**Required action before other work:** Inspect whether this structural gap causes active downstream errors — failed assertions, null-reference errors in distractor extraction, broken evaluation calls — or is a passive gap where the item is silently skipped during metadata-dependent operations. If active errors are confirmed, this is the first repair. If the gap is passive, it is documented and does not block other work.

**This is a conditional check, not a confirmed blocker.** No repair is proposed here. The inspection happens during branch work; the finding is reported before any content authoring begins.

---

## 5. Per-Skill Priority Table

All 45 skills are listed. The 40 skills with diagnostic items cover 750 distractor slots.

**Status values:**
- `boilerplate` — distractor fields structurally present but 100% auto-generated template content
- `absent` — no diagnostic items exist; blocked on item creation
- `thin` — 1–2 diagnostic items; high reliability risk per wrong distractor description
- `partial-tags` — diagnostic items exist but some are untagged in `question-vocabulary-tags.json`
- `standard` — items exist, fully structured, tagging adequate for currently confirmed items

**Priority tiers:** P0 (structural check), P1 (vocab tag gap), P2 (thin-skill reliability risk), P3 (high-volume backfill ROI), P4 (remaining represented skills), Blocked (no items)

| skillId | Items | Distractor Slots | Vocab Tags | Current Status | Priority | Rationale |
|---------|-------|-----------------|------------|----------------|----------|-----------|
| ACA-09 | 0 | 0 | — | absent | **Blocked** | No diagnostic items; requires item creation first |
| DBD-10 | 0 | 0 | — | absent | **Blocked** | No diagnostic items; requires item creation first |
| DIV-01 | 0 | 0 | — | absent | **Blocked** | No diagnostic items; requires item creation first |
| DIV-05 | 0 | 0 | — | absent | **Blocked** | No diagnostic items; requires item creation first |
| FAM-03 | 0 | 0 | — | absent | **Blocked** | No diagnostic items; requires item creation first |
| DIV-03 | 1 | 3 | yes | thin + boilerplate | **P2** | Single-item skill; one wrong distractor description distorts entire skill signal |
| DBD-09 | 2 | 6 | partial | thin + boilerplate | **P2** | 2 items; item_240 untagged; asymmetric risk |
| FAM-02 | 2 | 6 | partial | thin + boilerplate | **P2** | 2 items; item_040 untagged; asymmetric risk |
| LEG-03 | 2 | 6 | yes | thin + boilerplate | **P2** | 2 items; no margin for distractor error |
| PSY-01 | 2 | 6 | yes | thin + boilerplate | **P2** | 2 items; no margin for distractor error |
| PSY-04 | 2 | 6 | partial | thin + boilerplate | **P2** | 2 items; item_026 untagged; asymmetric risk |
| MBH-03 | 18 | 54 | partial | boilerplate | **P3** | Highest slot count; item_223, item_228 untagged; highest ROI for content backfill |
| LEG-02 | 17 | 51 | partial | boilerplate | **P3** | Second highest slot count; item_221 untagged |
| CON-01 | 14 | 42 | partial | boilerplate | **P3** | item_201 untagged |
| ETH-01 | 13 | 39 | partial | boilerplate | **P3** | items 031, 079, 084, 212, 215 untagged; P1 overlap |
| DBD-03 | 13 | 39 | yes | boilerplate | **P3** | High slot count; fully tagged |
| SAF-03 | 12 | 36 | partial | boilerplate | **P3** | item_013 untagged; P1 overlap |
| SWP-04 | 12 | 36 | yes | boilerplate + P0 | **P3 + P0** | item_008 structural gap check required first |
| DBD-01 | 12 | 36 | partial | boilerplate | **P3** | items 070, 118, 135 untagged; P1 overlap |
| ACA-06 | 8 | 24 | partial | boilerplate | **P4** | items 162, 200, 235 untagged; P1 overlap |
| ACA-08 | 8 | 24 | partial | boilerplate | **P4** | items 098, 120 untagged; P1 overlap |
| SAF-01 | 9 | 27 | partial | boilerplate | **P4** | item_024 untagged; P1 overlap |
| ETH-02 | 5 | 15 | partial | boilerplate | **P4** | 68% of ETH-02 diagnostic items untagged; severe P1 priority within this skill |
| LEG-01 | 7 | 21 | yes | boilerplate | **P4** | Standard representation |
| SAF-04 | 7 | 21 | partial | boilerplate | **P4** | items 160, 163, 165 untagged; P1 overlap |
| DBD-06 | 7 | 21 | yes | boilerplate | **P4** | Standard representation |
| MBH-05 | 6 | 18 | partial | boilerplate | **P4** | items 029, 231 untagged; P1 overlap |
| DBD-07 | 6 | 18 | yes | boilerplate | **P4** | Standard representation |
| PSY-03 | 6 | 18 | yes | boilerplate | **P4** | Standard representation |
| ACA-04 | 6 | 18 | partial | boilerplate | **P4** | items 117, 195 untagged; P1 overlap |
| LEG-04 | 4 | 12 | partial | boilerplate | **P4** | items 224, 226 untagged; P1 overlap |
| MBH-02 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| MBH-04 | 4 | 12 | partial | boilerplate | **P4** | item_176 untagged; P1 overlap |
| DBD-08 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| ACA-07 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| RES-03 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| PSY-02 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| ACA-02 | 3 | 9 | yes | boilerplate | **P4** | Standard representation |
| ACA-03 | 3 | 9 | yes | boilerplate | **P4** | Standard representation |
| DBD-05 | 3 | 9 | partial | boilerplate | **P4** | item_057 untagged; P1 overlap |
| DEV-01 | 3 | 9 | yes | boilerplate | **P4** | Standard representation |
| RES-02 | 3 | 9 | yes | boilerplate | **P4** | Standard representation |
| SWP-02 | 3 | 9 | yes | boilerplate | **P4** | Standard representation |
| SWP-03 | 4 | 12 | yes | boilerplate | **P4** | Standard representation |
| ETH-03 | 3 | 9 | partial | boilerplate | **P4** | item_062 untagged; P1 overlap |

**Totals:** 250 items · 750 slots · 40 skills represented · 5 skills absent (Blocked) · 6 thin skills (P2) · 8 high-volume skills (P3) · 26 remaining skills (P4)

---

## 6. Why This Prioritization Order

### P0 before everything

A structural gap that causes active downstream errors must be resolved before any authoring begins. Authoring metadata for a bank with active null-reference errors produces unreliable results. The P0 check is a gate, not an authoring step.

### P1 before P3 (vocab tags before distractor content)

Vocabulary tagging is lower-effort than distractor misconception authoring. The `missedConcepts` pipeline was unstripped in the prior branch and is ready to fire — but only for tagged items. Every untagged diagnostic item is a silent gap in working infrastructure. Tagging 37 items unlocks signal across 37 diagnostic items without requiring any content authoring. The fix-to-signal ratio makes this the highest-priority work.

Within P1, ETH-02 (68% untagged), ETH-01 (5 untagged items), and SAF-04 (3 untagged items) are the highest priority skills because they have the most silenced diagnostic items.

### P2 before P3 (thin skills before high-volume)

Thin skills (1–2 items) carry asymmetric diagnostic risk. With only 1–2 items per skill, a single wrong or misleading distractor description — or an untagged item — distorts the entire skill proficiency signal with no averaging to correct it. High-volume skills with 12–18 items can absorb some noise. Thin skills cannot. The P2 verification step is a risk-reduction check: review `distractor_tier` and `distractor_error_type` accuracy, confirm tagging, and understand the baseline before moving to high-volume authoring.

### P3 rationale (high-volume distractor authoring)

The 8 P3 skills account for 291 of 750 distractor slots — 38.8% of the entire diagnostic bank. If the adaptive diagnostic branches on misconception signals, it will encounter these skills most frequently. Replacing boilerplate in these slots with authored content has the highest operational impact per unit of effort. The P3 skills are also the ones where the Claude quiz evaluation call sends boilerplate most often, because they have the most items and the most wrong-answer events.

### P4 rationale

The 26 remaining P4 skills have no structural prioritization between them. Each needs identical distractor content authoring. They can be worked through in any order after P2 and P3 are complete.

### Blocked rationale

Five skills (ACA-09, DBD-10, DIV-01, DIV-05, FAM-03) have zero diagnostic items. No metadata can be authored for items that do not exist. Creating diagnostic items for these skills is a separate content task that requires question writing and review before distractor authoring can begin. This work does not block the adaptive diagnostic redesign if those 5 skills are temporarily excluded from the diagnostic's active skill set, but it is a known gap.

---

## 7. Confirmed vs. Inferred vs. Blocked

### Confirmed

All of the following are directly evidenced in audit files:

- 748 of 748 `distractor_misconception` fields are boilerplate templates with identical structure
- 748 of 748 `distractor_skill_deficit` fields are word fragments, not skill IDs
- `dominant_error_pattern` = `"concept_substitution"` for all 250 items — zero variance
- `error_cluster_tag` has 2 values across 250 items, 86.4% on `theory_substitution`
- `top_misconception_themes` is orphaned with no code consumer
- 37 diagnostic items are untagged in `question-vocabulary-tags.json` (all 37 enumerated above)
- ETH-02 has 68% of its diagnostic items untagged — worst single skill
- 5 skills have zero diagnostic items: ACA-09, DBD-10, DIV-01, DIV-05, FAM-03
- 6 skills have only 1–2 diagnostic items: DIV-03, DBD-09, FAM-02, LEG-03, PSY-01, PSY-04
- `item_008` (SWP-04) options C and D are missing all four distractor fields; answer text is numeric ("7.0", "5.0")
- `distractor_tier` and `distractor_error_type` are plausible but AI-assigned and not human-reviewed at the distractor level
- `distractor_tier` contains an undocumented 4th value (`foundational_gap`) on 4 slots

### Inferred

- Whether `item_008`'s missing fields cause active downstream errors is **(INFERRED)** — not verified against runtime behavior; requires inspection during branch work
- The exact accuracy of `distractor_tier` and `distractor_error_type` at the per-distractor level is **(INFERRED as unreliable)** — the AI-assignment origin is confirmed, but the specific errors in the assignments are unknown without human review
- Whether `focusItemExtractor.ts`'s bypass of skill-level misconceptions is design or oversight is **(INFERRED as possibly intentional)** — not confirmed from git history or code comments

### Blocked

- Content authoring for ACA-09, DBD-10, DIV-01, DIV-05, FAM-03: blocked until diagnostic items are created for these skills
- Accuracy verification of `distractor_tier` and `distractor_error_type`: blocked on human review of each AI-assigned value across 748 slots; this is not required for taxonomy authoring but is required before these fields are used in adaptive branching
- Full P4 distractor authoring: sequentially dependent on taxonomy existing; authoring any distractor description that references a taxonomy MC- ID requires the taxonomy to be built first

---

## 8. Minimum Viable Authoring Coverage

This section defines the minimum state the diagnostic content must reach before `feature/adaptive-diagnostic-redesign` can open. "Minimum viable" does not mean all 748 slots filled. It means enough trustworthy signal exists in the highest-traffic areas of the bank that the redesigned branching logic has something real to act on.

**Minimum viable coverage requires all of the following:**

1. **Misconception taxonomy exists** — `feature/misconception-taxonomy-implementation` branch is complete. All ~112 skill-level misconceptions have stable MC- IDs. TypeScript types are defined. The registry is authored and cross-referenced. (Prerequisite: `docs/misconception-taxonomy-design.md` is approved and all four decisions in that document are resolved.)

2. **37 untagged diagnostic items are tagged** — Vocabulary tags applied to all 37 items listed in Section 3. The `missedConcepts` pipeline fires without gaps across the diagnostic bank.

3. **item_008 structural gap is assessed** — P0 inspection is complete. If the gap causes active errors, the structural repair is applied. If passive, the gap is documented and tolerated.

4. **P3 distractor content is authored** — The 8 high-volume skills (MBH-03, LEG-02, CON-01, ETH-01, DBD-03, SAF-03, SWP-04, DBD-01) have real authored `distractor_misconception` descriptions that reference taxonomy MC- IDs. Descriptions explain the specific appeal of the wrong answer, not just its text. `distractor_skill_deficit` fields reference valid skill IDs.

5. **P2 skills are spot-checked** — The 6 thin skills (DIV-03, DBD-09, FAM-02, LEG-03, PSY-01, PSY-04) have been reviewed: `distractor_tier` and `distractor_error_type` accuracy assessed, tagging gaps resolved, distractor misconception descriptions authored or verified.

6. **Diagnostic item–to–taxonomy link map is documented** — A reference document mapping diagnostic item IDs to the MC- IDs they target, covering at minimum P2 and P3 skills. This gives the adaptive branching redesign a concrete reference for what misconceptions each item probes.

**What is not required before redesign starts:**

- All 748 distractor slots filled with authored content. P4 skills can follow in parallel with or after the redesign branch.
- New diagnostic items for the 5 absent skills (ACA-09, DBD-10, DIV-01, DIV-05, FAM-03). These skills are excluded from the first phase of adaptive diagnostic operation.
- Normalization of vocabulary tag inconsistencies (acronym vs. spelled-out splits, generic+specific co-occurrence, 83 singleton tags). This is a secondary cleanup task.
- Deprecation of orphaned fields (`top_misconception_themes`, `dominant_error_pattern`) from the questions schema. These can be left in place without blocking the redesign.
- Accuracy verification of `distractor_tier` and `distractor_error_type` across all 748 slots. These fields are not used by the initial adaptive branching redesign. They can be reviewed in a subsequent branch.

---

## 9. What Must Be True Before `feature/adaptive-diagnostic-redesign` Can Start

The following is the gate checklist. Each item must be verifiable before the adaptive diagnostic redesign branch opens.

- [ ] `docs/misconception-taxonomy-design.md` is approved — all four design decisions in Section 7 of that document are resolved
- [ ] `feature/misconception-taxonomy-implementation` branch is merged — MC- IDs exist, TypeScript types are defined, taxonomy registry is authored
- [ ] All 37 untagged diagnostic items have vocabulary tags applied in `question-vocabulary-tags.json`
- [ ] `item_008` structural gap has been assessed; repair applied if active errors were confirmed
- [ ] P3 skills (MBH-03, LEG-02, CON-01, ETH-01, DBD-03, SAF-03, SWP-04, DBD-01) have real authored `distractor_misconception` descriptions referencing taxonomy MC- IDs
- [ ] P2 skills (DIV-03, DBD-09, FAM-02, LEG-03, PSY-01, PSY-04) have been spot-checked for distractor accuracy; tagging gaps resolved
- [ ] Diagnostic item–to–taxonomy link map document exists for P2 and P3 skills
- [ ] Open design question in `docs/misconception-taxonomy-design.md` Decision 4 (focusItemExtractor routing) is resolved — the redesign branch scope depends on whether this wiring is in or out

**The redesign does not need:**
- P4 distractor content authored
- New items for the 5 absent skills
- Vocabulary tag normalization complete
- `distractor_tier` and `distractor_error_type` human-reviewed across all 748 slots

---

*End of document. No source code changes proposed. No TypeScript types drafted. No adaptive branching redesign proposed. AdaptiveDiagnostic.tsx and scoring logic are not referenced for modification.*
