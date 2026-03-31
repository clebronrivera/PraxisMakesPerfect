# Vocabulary & Concept Tag Audit
**Date:** 2026-03-29
**Scope:** `src/data/question-vocabulary-tags.json` (v1, generated 2026-03-27) cross-referenced against `src/data/questions.json`
**Constraint:** Audit only — no tags written or modified.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total questions | 1,150 |
| Tagged (≥ 1 concept) | 1,009 (87.7%) |
| **Untagged (0 concepts)** | **141 (12.3%)** |
| Total unique concept strings | 377 |
| Avg concepts per tagged question | 2.7 |
| ID alignment (tags ↔ questions.json) | ✅ Perfect — 0 orphan IDs, 0 missing IDs |

The ID universe is clean. The problems are entirely inside the tag content: a 12.3% untagged gap, significant redundancy between generic and specific tags, acronym/spelled-out splits, and 83 singleton tags that add noise without discriminatory power.

---

## Deliverable 1 — Untagged Items

### Counts by Question Type

| Type | Total | Untagged | % Untagged |
|------|-------|----------|------------|
| Diagnostic (`item_*`) | 250 | **37** | **14.8%** |
| Practice (`PQ_*`) | 900 | 104 | 11.6% |
| **All** | **1,150** | **141** | **12.3%** |

### Untagged by Domain Code

| Domain | Total Qs | Untagged | % |
|--------|----------|----------|---|
| ETH (Ethics) | 81 | 28 | **35%** |
| DEV (Development) | 23 | 6 | **26%** |
| ACA (Academic) | 172 | 29 | 17% |
| SAF (Safety) | 88 | 14 | 16% |
| RES (Research) | 47 | 7 | 15% |
| FAM (Family) | 42 | 6 | 14% |
| MBH (Mental/Behavioral Health) | 112 | 12 | 11% |
| DBD (Data-Based Decision Making) | 207 | 19 | 9% |
| DIV (Diversity) | 61 | 4 | 7% |
| LEG (Legal) | 110 | 7 | 6% |
| SWP (School-Wide Practices) | 79 | 5 | 6% |
| PSY (Psychological Services) | 94 | 3 | 3% |
| CON (Consultation) | 34 | 1 | 3% |

**ETH is the most severely under-tagged domain (35%).** DEV is second-worst by percentage but has a small item pool.

### Untagged by Skill ID (top offenders, ≥ 5 untagged)

| Skill | Untagged | Total | % |
|-------|----------|-------|---|
| ETH-02 | 17 | 25 | **68%** |
| ACA-04 | 9 | 26 | 35% |
| MBH-05 | 9 | 26 | 35% |
| ACA-06 | 8 | 28 | 29% |
| DBD-09 | 7 | 22 | 32% |
| ACA-03 | 7 | 23 | 30% |
| SAF-04 | 7 | 27 | 26% |
| RES-02 | 7 | 23 | 30% |
| DEV-01 | 6 | 23 | 26% |
| ETH-01 | 6 | 33 | 18% |
| ETH-03 | 5 | 23 | 22% |

ETH-02 (68% untagged) is the single worst skill.

### Complete List of 37 Untagged Diagnostic Items

All of these are foundational items that feed directly into skill calibration and the adaptive diagnostic path. Every untagged diagnostic item is a gap in `missedConcepts` tracking within `assessmentReport.ts`.

```
item_013  SAF-03    item_024  SAF-01    item_026  PSY-04
item_029  MBH-05    item_031  ETH-01    item_038  ETH-02
item_040  FAM-02    item_057  DBD-05    item_062  ETH-03
item_070  DBD-01    item_079  ETH-01    item_084  ETH-01
item_098  ACA-08    item_117  ACA-04    item_118  DBD-01
item_120  ACA-08    item_135  DBD-01    item_160  SAF-04
item_162  ACA-06    item_163  SAF-04    item_165  SAF-04
item_176  MBH-04    item_195  ACA-04    item_200  ACA-06
item_201  CON-01    item_211  ETH-02    item_212  ETH-01
item_213  ETH-02    item_215  ETH-01    item_221  LEG-02
item_223  MBH-03    item_224  LEG-04    item_226  LEG-04
item_228  MBH-03    item_231  MBH-05    item_235  ACA-06
item_240  DBD-09
```

---

## Deliverable 2 — Duplicate and Synonym Clusters

### Pattern A: Acronym + Spelled-Out Both Present (Inconsistent)

These concept strings exist as separate tags. Some questions carry both forms; many carry only one — meaning questions about the same thing get different tags depending on which form was used.

| Acronym | Spelled-Out Form | Acronym-Only Qs | Spelled-Only Qs | Both |
|---------|-----------------|-----------------|-----------------|------|
| `IDEA` (n=59) | `Individuals with Disabilities Education Act` (n=10) | 49 | 0 | 10 |
| `IEP` (n=55) | `individualized education program` (n=10) | 46 | 1 | 9 |
| `RTI` (n=28) | `response to intervention` (n=2) | 27 | 1 | 1 |
| `CBM` (n=15) | `curriculum-based measurement` (n=4) | 12 | 1 | 3 |
| `ELL` (n=11) | `English language learner` (n=3) | 8 | 0 | 3 |
| `SLD` (n=6) | `specific learning disability` (n=13) | 4 | 11 | 2 |
| `MTSS` (n=44) | `multi-tiered system of support` (n=0) | 44 | 0 | 0 |
| `ADHD` (n=43) | `attention deficit hyperactivity disorder` (n=0) | 43 | 0 | 0 |
| `FERPA` (n=25) | `Family Educational Rights and Privacy Act` (n=0) | 25 | 0 | 0 |
| `BRIEF` (n=25) | `Behavior Rating Inventory of Executive Function` (n=0) | 25 | 0 | 0 |

`SLD` is the most damaging split: 11 questions have only the spelled-out form, 4 have only `SLD`, and they don't cross-reference each other in concept analytics.

### Pattern B: Generic Parent + Specific Child (Always Co-Occur)

Wherever the specific form appears, the generic form also appears. This creates zero additional discrimination — the specific tag is fully subsumed and adds weight to concept frequency without adding signal.

| Generic (Parent) | Specific (Child) | Child n |
|-----------------|-----------------|---------|
| `fluency` | `reading fluency` | 21 |
| `learning disability` | `specific learning disability` | 13 |
| `consultee` | `consultee-centered` | 13 |
| `retention` | `grade retention` | 11 |
| `behavior` | `functional behavioral assessment` | 10 |
| `IDEA` | `Individuals with Disabilities Education Act` | 10 |
| `reliability` | `test-retest reliability` | 10 |
| `behavior` | `adaptive behavior` | 9 |
| `social-emotional` | `social-emotional learning` | 8 |
| `anxiety` | `anxiety disorder` | 7 |
| `validity` | `predictive validity` | 7 |
| `rating scale` | `behavior rating scale` | 7 |
| `autism spectrum` ↔ `autism spectrum disorder` | (mutual full redundancy) | 7 |
| `IEP` | `IEP meeting` | 6 |
| `reinforcement` | `positive reinforcement` | 6 |
| `review` | `records review` | 6 |
| `Piaget` | `preoperational` | 6 |
| `reinforcement` | `negative reinforcement` | 5 |
| `fidelity` | `implementation fidelity` | 5 |
| `fidelity` | `fidelity of implementation` | 1 |

Note: `fidelity of implementation` and `implementation fidelity` are themselves near-synonyms (both subsumed by `fidelity`).

### Pattern C: Mutual Redundancy

`autism spectrum` and `autism spectrum disorder` appear on exactly the same 7 questions and are 100% interchangeable. One should be dropped.

---

## Deliverable 3 — Tags Too Vague to Be Diagnostically Useful

"Diagnostically useful" means: a concept tag helps identify which specific knowledge or skill the student missed. A tag is too vague when it describes an entire domain rather than a testable construct.

### Tier 1 — Almost Certainly Too Vague (single generic word, very high frequency)

These appear on 5–16% of all questions. At that prevalence, they cannot discriminate between concepts within a skill.

| Tag | n | % of questions | Problem |
|-----|---|---------------|---------|
| `behavior` | 186 | 16.2% | Subsumes everything in the behavior domain; meaningless for gap analysis |
| `test` | 97 | 8.4% | Appears on items about reliability, validity, scores, and formats — too broad |
| `review` | 33 | 2.9% | Ambiguous: records review, annual review, systematic review are all distinct |

### Tier 2 — Context-Dependent (may be vague depending on intent)

These are well-known constructs but used as catch-all tags when a more specific form already exists.

| Tag | n | Issue |
|-----|---|-------|
| `validity` | 42 | Always co-occurs with specific types (`predictive validity`, etc.); the generic form adds nothing if specifics are present |
| `reliability` | 32 | Same pattern — paired with `test-retest reliability`, `reliability coefficient` etc. |
| `reinforcement` | 34 | Always accompanied by `positive reinforcement` or `negative reinforcement`; generic form is redundant |
| `fluency` | 38 | 100% of `reading fluency` items also carry `fluency`; the parent adds no signal |
| `retention` | 27 | Paired with `grade retention` 100% of the time on relevant items |
| `fidelity` | 27 | Paired with `implementation fidelity` on specific items |
| `interview` | 24 | Covers clinical interview, behavioral interview, motivational interviewing — not discriminating |
| `social-emotional` | 17 | Always paired with `social-emotional learning` on SEL items |
| `mental health` | 38 | Very broad; already has `mental health consultation` as a distinct tag |
| `anxiety` | 57 | Used as a catch-all; `anxiety disorder` is already a separate tag |

### Tier 3 — Singleton Tags (83 tags appearing on exactly 1 question)

These have no statistical utility for gap detection (need ≥ 3 attempts at minimum to surface). Selected examples of singletons that look substantive but appear only once:

`ethical decision-making`, `evidence-based intervention`, `formative assessment`, `summative assessment`, `diagnostic assessment`, `dynamic assessment`, `randomized controlled trial`, `systematic review`, `treatment integrity`, `restorative justice`, `token economy`, `play therapy`, `family systems`, `suicide prevention`, `suicidality`, `Bloom's taxonomy`, `Tarasoff`, `RIOT framework`, `z-score`, `p-value`, `base rate`

Several of these (`Tarasoff`, `suicidality`, `RIOT framework`) are high-stakes constructs that probably appear on more than one question but were simply not tagged consistently.

---

## Deliverable 4 — High-Priority Items Needing Tags First

Priority order: diagnostic items → foundational practice items → high-traffic skills.

**All 37 untagged diagnostic items are Tier 1 priority.** They are foundational, appear in the adaptive diagnostic (which drives proficiency scoring), and their missing tags suppress `missedConcepts` in `assessmentReport.ts` and `conceptAnalytics.ts`.

### Tier 1 — Diagnostic Items by Urgency (skill with most untagged items first)

| Priority | Skill | Untagged Diagnostic Items |
|----------|-------|--------------------------|
| 🔴 1 | ETH-01 (Ethics - NASP principles) | item_031, item_079, item_084, item_212, item_215 |
| 🔴 2 | ETH-02 (Ethics - professional conduct) | item_038, item_211, item_213 |
| 🔴 3 | DBD-01 (Data interpretation basics) | item_070, item_118, item_135 |
| 🔴 4 | SAF-04 (Safety - crisis response) | item_160, item_163, item_165 |
| 🔴 5 | ACA-06 (Academic - reading instruction) | item_162, item_200, item_235 |
| 🔴 6 | ACA-04 (Academic - assessment) | item_117, item_195 |
| 🔴 7 | ACA-08 (Academic - intervention) | item_098, item_120 |
| 🔴 8 | MBH-03 (MBH - CBT/behavior therapy) | item_223, item_228 |
| 🔴 9 | MBH-05 (MBH - crisis) | item_029, item_231 |
| 🔴 10 | LEG-04 (Legal - confidentiality/FERPA) | item_224, item_226 |
| 🟡 11 | SAF-01 (Safety - threat assessment) | item_024 |
| 🟡 12 | SAF-03 (Safety - school violence) | item_013 |
| 🟡 13 | PSY-04 (Psych services) | item_026 |
| 🟡 14 | FAM-02 (Family engagement) | item_040 |
| 🟡 15 | DBD-05 (Progress monitoring) | item_057 |
| 🟡 16 | ETH-03 (Ethics - boundaries) | item_062 |
| 🟡 17 | MBH-04 (MBH - social-emotional) | item_176 |
| 🟡 18 | CON-01 (Consultation) | item_201 |
| 🟡 19 | LEG-02 (Legal - IDEA/eligibility) | item_221 |
| 🟡 20 | DBD-09 (Data - validity/bias) | item_240 |

### Tier 2 — Untagged Practice Items in High-Traffic Domains

After the diagnostic batch, the next priority is practice items in skills where ETH and DBD are already under-tagged:

- ETH-02: 17 untagged practice items (highest single-skill count)
- ACA-04: 9 untagged practice items
- MBH-05: 9 untagged practice items
- ACA-06: 8 untagged practice items

---

## Deliverable 5 — Recommended Normalization Rules

### Rule 1 — Canonical Acronym-First Policy

**For all terms with a widely-used acronym, use the acronym as the canonical tag.** Retire the spelled-out form unless it is needed for search/display.

| Retire | Canonical |
|--------|-----------|
| `Individuals with Disabilities Education Act` | `IDEA` |
| `individualized education program` | `IEP` |
| `response to intervention` | `RTI` |
| `curriculum-based measurement` | `CBM` |
| `English language learner` | `ELL` |
| `specific learning disability` (where it duplicates `SLD`) | `SLD` — but first, reconcile the 11 spelled-out-only occurrences |

**Exception:** `specific learning disability` currently has more occurrences than `SLD` (13 vs 6). Before merging, audit whether those 11 spelled-out-only questions genuinely test SLD or a broader concept.

### Rule 2 — Drop Generic Parents When Specific Child Always Present

Never tag a question with both `fluency` and `reading fluency` when the meaning is specific. Keep the most specific applicable tag; drop the overly broad parent.

Pairs where the generic parent should be retired from co-occurrence (keep specific only):

- `fluency` → keep `reading fluency` (and other specifics; drop bare `fluency` only when a specific is present)
- `validity` → keep `predictive validity`, `construct validity`, etc. (drop bare `validity` when specifics are present)
- `reliability` → keep `test-retest reliability`, `reliability coefficient`, etc.
- `reinforcement` → keep `positive reinforcement` / `negative reinforcement`
- `retention` → keep `grade retention`
- `fidelity` → keep `implementation fidelity` (and retire `fidelity of implementation` as a synonym)
- `social-emotional` → keep `social-emotional learning`
- `autism spectrum` → keep `autism spectrum disorder`; retire `autism spectrum` and `ASD` as separate tags

**Exception:** Keep generic parents when they are the primary topic (e.g., a question asking "which reinforcement schedule is most resistant to extinction" is about `reinforcement` generally and should not be narrowed to `positive reinforcement`).

### Rule 3 — Require Minimum Specificity for High-Frequency Tags

Tag `behavior` (n=186, 16.2% prevalence) should only be applied as a standalone tag when the question is genuinely about behavior theory in the abstract. Questions about specific behavioral constructs should carry the specific tag instead of (or in addition to, only if needed for cross-reference) `behavior`. Suggested sub-tags to use instead:

- `functional behavioral assessment` — FBA procedure questions
- `behavioral consultation` — consultation-framed behavior questions
- `applied behavior analysis` — ABA principles
- `behavioral contract` — contracting interventions

Similarly, `test` as a standalone tag should be retired. Every question is "about testing" in some sense. Replace with the specific construct: `test-retest reliability`, `achievement test`, `standardized testing`, etc.

### Rule 4 — Minimum Frequency Threshold for Singleton Tags

Singleton tags (n=1) should not be added to the tag set unless the concept is highly distinctive and the question is the only question in the bank that will ever test it. Before adding any new singleton, check whether the concept can be expressed with an existing tag that has n ≥ 3.

Existing singletons to evaluate for consolidation:

| Singleton | Likely consolidation |
|-----------|---------------------|
| `fidelity of implementation` | → `implementation fidelity` |
| `formative assessment` | → `assessment` (if a general tag exists) or keep if distinct |
| `summative assessment` | → differentiate from `formative assessment`; may need both with n ≥ 2 |
| `treatment integrity` | → `implementation fidelity` |
| `ethical decision-making` | → `ethics` or `NASP Ethics` |
| `evidence-based intervention` | → `evidence-based practice` |
| `suicidality` | → `suicide prevention` (merge both into one tag) |
| `diagnostic criteria` | → link to condition-specific tags (`ADHD`, `anxiety disorder`, etc.) |

### Rule 5 — Require a Concept Tag for All Diagnostic Items Before Release

Any `item_*` question with 0 concepts should be blocked from entering live diagnostic delivery until it has ≥ 2 concept tags. This prevents silent gaps in `missedConcepts` tracking that degrade the quality of the assessment report and concept analytics.

Suggested enforcement: add a validation check to the build/import pipeline that fails if any `item_*` ID is present in `question-vocabulary-tags.json` with an empty `concepts` array.

### Rule 6 — Maximum Tag Count Per Question

Questions with ≥ 8 tags (currently 6 questions, max 13) should be reviewed. Over-tagging dilutes the signal for concept analytics — a question tagged with 13 concepts tells the system almost nothing about which concept caused the miss. Target ceiling: **5 concepts per question** for focused discrimination.

---

## Where Tags Surface in the App

Tags flow through three paths. All three are silently degraded for the 141 untagged questions.

| Path | File | Behavior When Tags Are Empty |
|------|------|------------------------------|
| **ExplanationPanel** | `src/components/ExplanationPanel.tsx:132` | "Key concepts" section is hidden entirely |
| **PraxisPerformanceView** | `src/components/PraxisPerformanceView.tsx:364` | Concept pills in domain card are absent |
| **ScoreReport** | `src/components/ScoreReport.tsx:342` | Domain summary shows no concept labels |
| **assessmentReport.ts** | `missedConcepts` set, line 165 | Concept gap detection is skipped for the question |
| **conceptAnalytics.ts** | `buildConceptAnalytics`, lines 82, 114 | Question excluded from gap/strength computation |

The conceptAnalytics output feeds `ResultsDashboard.tsx` only (not the study plan pipeline), so the study plan is not directly harmed — but the ExplanationPanel and missedConcepts tracking are affected for every session that hits an untagged question.

---

*End of audit. No tags were written or modified. See Deliverable 4 for the recommended tagging order.*
