# Distractor-Level Diagnostic Coverage Audit
**Date:** 2026-03-29
**Scope:** Diagnostic bank (item_001 – item_250), 250 items
**Purpose:** Audit only. No content was generated or modified.

---

## Executive Summary

The diagnostic bank contains **250 items** covering **40 of 45 skills** across three domains. Structural field presence is near-perfect (99.7%), but a deep quality inspection reveals a critical systemic problem: **all distractor_misconception and distractor_skill_deficit fields contain auto-generated template text with zero diagnostic specificity.** Every one of the 748 populated misconception fields is a string-interpolated boilerplate sentence derived mechanically from the first 20 characters of the answer option text. The skill deficit field is similarly non-functional — a 1–3 word phrase fragment extracted from the option text, not a skill reference. These fields are structurally present but diagnostically inert.

The four distractor metadata fields (tier, error_type, misconception, skill_deficit) serve distinct diagnostic purposes. The audit finds:

- **distractor_tier** — 99.7% structurally present, taxonomy consistent (L1/L2/L3), plausible distribution. Not verified for accuracy.
- **distractor_error_type** — 99.7% present, 3-category taxonomy (Conceptual/Procedural/Lexical), heavily skewed toward Conceptual (90%). Not verified for accuracy.
- **distractor_misconception** — 99.7% structurally present but **100% templated and diagnostically unusable**.
- **distractor_skill_deficit** — 99.7% structurally present but **100% non-functional** (word fragments, no skill IDs).

Two item-level fields added during a prior AI pass — `dominant_error_pattern` and `error_cluster_tag` — are also uniform across the entire bank (100% `concept_substitution`; 86% `theory_substitution`) and provide no item-level differentiation.

---

## 1. Coverage Summary by Domain

| Domain | Items | Distractor Slots | tier valid | error_type valid | misconception present | misconception adequate | skill_deficit present |
|--------|-------|-----------------|------------|------------------|-----------------------|------------------------|-----------------------|
| 1.0 — Data-Based Decision Making | 50 | 150 | 150/150 (100%) | 150/150 (100%) | 150/150 (100%) | 150/150 (100%) | 150/150 (100%) |
| 2.0 — Academic Interventions & Instructional Support | 42 | 126 | 124/126 (98%) | 124/126 (98%) | 124/126 (98%) | 124/126 (98%) | 124/126 (98%) |
| 4.0 — Family-School Collaboration | 158 | 474 | 474/474 (100%) | 474/474 (100%) | 474/474 (100%) | 474/474 (100%) | 474/474 (100%) |
| **TOTAL** | **250** | **750** | **748/750 (99.7%)** | **748/750 (99.7%)** | **748/750 (99.7%)** | **748/750 (99.7%)** | **748/750 (99.7%)** |

**Note:** Domain 3.0 has zero diagnostic items. The question-skill-map confirms skills ACA-09, DBD-10, DIV-01, DIV-05, and FAM-03 — which fall across domains 2.0 and 4.0 — have no diagnostic items.

**"Adequate length" threshold:** misconception word count > 10 words. All 748 populated texts fall in the 13–18 word range (min=13, max=18, median=15), making every item pass the length filter despite all being boilerplate.

---

## 2. Coverage Summary by Skill

| Skill | Domain | Items | Distractor Slots | tier | error_type | misconception | skill_deficit | Flag |
|-------|--------|-------|-----------------|------|-----------|---------------|--------------|------|
| ACA-02 | 2.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| ACA-03 | 2.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| ACA-04 | 2.0 | 6 | 18 | 18/18 | 18/18 | 18/18 | 18/18 | |
| ACA-06 | 4.0 | 8 | 24 | 24/24 | 24/24 | 24/24 | 24/24 | |
| ACA-07 | 2.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| ACA-08 | 2.0 | 8 | 24 | 24/24 | 24/24 | 24/24 | 24/24 | |
| ACA-09 | 2.0 | 0 | 0 | — | — | — | — | ⛔ ABSENT |
| CON-01 | 4.0 | 14 | 42 | 42/42 | 42/42 | 42/42 | 42/42 | |
| DBD-01 | 4.0 | 12 | 36 | 36/36 | 36/36 | 36/36 | 36/36 | |
| DBD-03 | 4.0 | 13 | 39 | 39/39 | 39/39 | 39/39 | 39/39 | |
| DBD-05 | 1.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| DBD-06 | 4.0 | 7 | 21 | 21/21 | 21/21 | 21/21 | 21/21 | |
| DBD-07 | 4.0 | 6 | 18 | 18/18 | 18/18 | 18/18 | 18/18 | |
| DBD-08 | 1.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| DBD-09 | 4.0 | 2 | 6 | 6/6 | 6/6 | 6/6 | 6/6 | ⚠ thin |
| DBD-10 | 1.0 | 0 | 0 | — | — | — | — | ⛔ ABSENT |
| DEV-01 | 1.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| DIV-01 | 4.0 | 0 | 0 | — | — | — | — | ⛔ ABSENT |
| DIV-03 | 4.0 | 1 | 3 | 3/3 | 3/3 | 3/3 | 3/3 | ⚠ thin |
| DIV-05 | 4.0 | 0 | 0 | — | — | — | — | ⛔ ABSENT |
| ETH-01 | 4.0 | 13 | 39 | 39/39 | 39/39 | 39/39 | 39/39 | |
| ETH-02 | 4.0 | 5 | 15 | 15/15 | 15/15 | 15/15 | 15/15 | |
| ETH-03 | 1.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| FAM-02 | 4.0 | 2 | 6 | 6/6 | 6/6 | 6/6 | 6/6 | ⚠ thin |
| FAM-03 | 4.0 | 0 | 0 | — | — | — | — | ⛔ ABSENT |
| LEG-01 | 4.0 | 7 | 21 | 21/21 | 21/21 | 21/21 | 21/21 | |
| LEG-02 | 4.0 | 17 | 51 | 51/51 | 51/51 | 51/51 | 51/51 | |
| LEG-03 | 4.0 | 2 | 6 | 6/6 | 6/6 | 6/6 | 6/6 | ⚠ thin |
| LEG-04 | 4.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| MBH-02 | 2.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| MBH-03 | 2.0/4.0 | 18 | 54 | 54/54 | 54/54 | 54/54 | 54/54 | |
| MBH-04 | 2.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| MBH-05 | 4.0 | 6 | 18 | 18/18 | 18/18 | 18/18 | 18/18 | |
| PSY-01 | 1.0 | 2 | 6 | 6/6 | 6/6 | 6/6 | 6/6 | ⚠ thin |
| PSY-02 | 4.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| PSY-03 | 1.0 | 6 | 18 | 18/18 | 18/18 | 18/18 | 18/18 | |
| PSY-04 | 4.0 | 2 | 6 | 6/6 | 6/6 | 6/6 | 6/6 | ⚠ thin |
| RES-02 | 4.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| RES-03 | 1.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| SAF-01 | 4.0 | 9 | 27 | 27/27 | 27/27 | 27/27 | 27/27 | |
| SAF-03 | 1.0 | 12 | 36 | 36/36 | 36/36 | 36/36 | 36/36 | |
| SAF-04 | 4.0 | 7 | 21 | 21/21 | 21/21 | 21/21 | 21/21 | |
| SWP-02 | 4.0 | 3 | 9 | 9/9 | 9/9 | 9/9 | 9/9 | |
| SWP-03 | 4.0 | 4 | 12 | 12/12 | 12/12 | 12/12 | 12/12 | |
| SWP-04 | 2.0 | 12 | 36 | 34/36 (94%) | 34/36 (94%) | 34/36 (94%) | 34/36 (94%) | ⚠ INCOMPLETE |

**Legend:** ⛔ ABSENT = no diagnostic items for this skill. ⚠ thin = ≤2 items (single-item failure risk). ⚠ INCOMPLETE = structurally missing slots.

---

## 3. Items Missing Distractor Diagnostic Metadata

### Structurally incomplete items (fields absent entirely)

Only **1 item** has any structurally missing fields:

**item_008** | Domain 2.0 | Skill SWP-04
- Options C and D: all four fields (`distractor_tier`, `distractor_error_type`, `distractor_misconception`, `distractor_skill_deficit`) are null/absent
- Option A is fully populated
- This item is `HUMAN_REVIEWED` and flagged `is_foundational`

The 2 missing distractor slots represent **0.3%** of the total 750 distractor slots.

### Content-level missing items (fields present but diagnostically empty)

This is the actual scale of the problem. Using a content-quality standard rather than a presence standard:

| Quality standard | Items failing | Distractor slots failing |
|------------------|---------------|--------------------------|
| Structural presence (field non-null) | 1 item / 2 slots | 0.3% |
| Misconception is non-templated | **250 items / 748 slots** | **99.7%** |
| Skill deficit references a real skill ID | **250 items / 748 slots** | **99.7%** |
| dominant_error_pattern has item-level specificity | **250 items** | **100%** |
| error_cluster_tag has item-level specificity | **250 items** | **100%** |

Every item in the diagnostic bank fails content-quality standards for misconception text and skill deficit.

---

## 4. Priority-Ranked Backfill Order

### Tier A — Structural fix (1 item, immediate)

| Item | Skill | Domain | Missing |
|------|-------|--------|---------|
| item_008 | SWP-04 | 2.0 — Academic Interventions | Options C and D: all 4 fields absent |

Fix before any content rewrite work. This is the only item that will fail a structural completeness check.

### Tier B — Absent skills (5 skills, requires item creation + metadata)

These skills have zero diagnostic items. No amount of metadata backfill fixes them — new items must be written first.

| Skill | Name |
|-------|------|
| ACA-09 | Health Conditions and Educational Impact |
| DBD-10 | Background Information and Records Review |
| DIV-01 | Cultural and Individual Factors in Intervention Design |
| DIV-05 | Special Education Services and Diverse Needs |
| FAM-03 | Interagency Collaboration |

### Tier C — Underrepresented skills (6 skills, 1–2 items each)

Each item carries disproportionate diagnostic weight. Metadata errors here are harder to average out.

| Skill | Domain | Items |
|-------|--------|-------|
| DIV-03 | 4.0 | 1 item |
| DBD-09 | 4.0 | 2 items |
| FAM-02 | 4.0 | 2 items |
| LEG-03 | 4.0 | 2 items |
| PSY-01 | 1.0 | 2 items |
| PSY-04 | 4.0 | 2 items |

### Tier D — High-frequency skills (content backfill ROI)

Rewriting misconception and skill_deficit content here covers the most diagnostic slots per skill.

| Skill | Domain | Items | Distractor Slots |
|-------|--------|-------|-----------------|
| MBH-03 | 2.0/4.0 | 18 | 54 |
| LEG-02 | 4.0 | 17 | 51 |
| CON-01 | 4.0 | 14 | 42 |
| ETH-01 | 4.0 | 13 | 39 |
| DBD-03 | 4.0 | 13 | 39 |
| SAF-03 | 1.0 | 12 | 36 |
| SWP-04 | 2.0 | 12 | 36 |
| DBD-01 | 4.0 | 12 | 36 |

### Tier E — Remaining 26 skills (bulk content rewrite)

All 26 remaining represented skills need identical content rewriting. No structural prioritization between them.

---

## 5. Patterns in Malformed or Low-Quality Distractor Metadata

### Pattern 1: distractor_misconception — 100% templated boilerplate

**Scope:** 748/748 populated slots (100%)
**Template:**
```
Student mistakenly selects an option related to '{first 20 characters of option text}...' instead of the correct concept.
```
**Evidence:** All 748 texts share identical opening ("Student mistakenly selects an option related to '") and closing ("instead of the correct concept."). The middle token is mechanically extracted from the answer option text and truncated at 20 characters with an ellipsis.

This text provides zero diagnostic information. It does not describe:
- *why* a student would select this option
- what underlying knowledge gap or misconception produces the error
- whether the error is conceptual, procedural, or retrieval-based
- how this error pattern differs from errors on similar items

**Word count distribution:** All 748 texts fall between 13–18 words (min=13, max=18, median=15) — an artificially narrow band consistent with template generation rather than authored content.

**Sample:**
```
Actual: "Student mistakenly selects an option related to 'the federal confiden...' instead of the correct concept."

What it should be: "Student confuses FERPA with the Federal Confidentiality Act of 1975, which does not exist as a named law; this reflects unfamiliarity with the specific statutes governing student record privacy in school settings."
```

### Pattern 2: distractor_skill_deficit — truncated option text, not a skill reference

**Scope:** 748/748 populated slots (100%)
**Pattern:** The skill deficit field contains a 1–3 word title-cased phrase fragment derived from the first significant words of the answer option text. It does not reference any skill ID from the 45-skill taxonomy and does not describe a cognitive or knowledge deficit.

**Word count distribution:** 1 word (59 slots), 2 words (132 slots), 3 words (557 slots). No entry exceeds 3 words.

**Examples (option text → skill_deficit as stored):**
```
"The Federal Confidentiality Act of 1975"     → "Federal Confidentiality"
"No law was violated because..."              → "Violated Because Consultation"
"Individuals With Disabilities Education..."  → "Individuals With Disabilities"
"Whole-word reading is innate"                → "Whole Word Reading"
"There will be resistance from some parents"  → "There Will Resistance"
```

None of these match any of the 45 known skill IDs. The field is currently non-functional as a diagnostic indicator.

### Pattern 3: dominant_error_pattern — zero variance across entire bank

**Scope:** 250/250 items (100%)
**Value:** Every single item has `dominant_error_pattern = "concept_substitution"`.

This field is intended to describe the primary cognitive error driving wrong-answer selection. With zero variance across 250 items spanning 40 skills and 3 domains, it cannot distinguish between items where the dominant failure mode differs (e.g., procedural mis-sequencing, retrieval interference, overgeneralization, false analogy). It was almost certainly set in a single batch operation rather than evaluated per item.

### Pattern 4: error_cluster_tag — two values, extreme skew

**Scope:** 250/250 items (100%)
**Values:** `theory_substitution` (216 items, 86.4%) and `procedure_inversion` (34 items, 13.6%)

With only 2 distinct values across 40 skills and 250 items, this field cannot serve as a meaningful cluster label for adaptive learning paths or study plan routing. The 86% concentration on a single value makes it a near-constant.

### Pattern 5: distractor_error_type — plausible taxonomy, unverified accuracy

**Scope:** 748/748 populated slots (100% present)
**Values:** Conceptual (675, 90.1%), Procedural (42, 5.6%), Lexical (31, 4.1%)

The 3-category taxonomy is coherent. The 90% concentration in Conceptual is high but potentially defensible for a school psychology licensure exam. However, accuracy has not been verified against item content — the categorizations were AI-assigned and have not been human-reviewed at the distractor level.

### Pattern 6: distractor_tier — plausible taxonomy, 4 non-standard values

**Scope:** 748/748 populated slots (100% present)
**Values:** L3_concept_substitution (290, 38.7%), L1_false_positive (256, 34.1%), L2_near_miss (198, 26.4%), foundational_gap (4, 0.5%)

The L1/L2/L3 taxonomy is internally consistent. However, `foundational_gap` is a 4th tier not in the documented L1/L2/L3 schema — it appears on 4 distractor slots and may indicate a data entry inconsistency or an undocumented tier variant.

### Pattern 7: item_008 Option B answer text contains only numeric values

**Scope:** 1 item
Options C and D of item_008 have answer text of "7.0" and "5.0" respectively. The item has `option_count_expected = 4` but the numeric values may indicate a malformed item where the actual option text was not captured. This likely explains why distractor metadata for these options is absent.

---

## 6. Field-Level Coverage Summary Table

| Field | Slots | Structurally present | Content-valid | Notes |
|-------|-------|---------------------|---------------|-------|
| distractor_tier | 750 | 748 (99.7%) | Unverified | 4th tier value `foundational_gap` outside documented schema |
| distractor_error_type | 750 | 748 (99.7%) | Unverified | 90% Conceptual, AI-assigned, not human-reviewed at distractor level |
| distractor_misconception | 750 | 748 (99.7%) | **0 (0%)** | 100% templated boilerplate derived from option text |
| distractor_skill_deficit | 750 | 748 (99.7%) | **0 (0%)** | 100% word fragments from option text, no skill IDs |
| dominant_error_pattern (item-level) | 250 | 250 (100%) | **0 (0%)** | 100% = "concept_substitution", no item-level variance |
| error_cluster_tag (item-level) | 250 | 250 (100%) | Marginal | 2 values, 86% on one value, no per-item differentiation |

---

## 7. Counts Referenced in This Audit

| Metric | Count |
|--------|-------|
| Total diagnostic items | 250 |
| Total skills in system | 45 |
| Skills with diagnostic items | 40 |
| Skills with zero diagnostic items | 5 |
| Skills with only 1 diagnostic item | 1 (DIV-03) |
| Skills with only 2 diagnostic items | 5 (DBD-09, FAM-02, LEG-03, PSY-01, PSY-04) |
| Total distractor slots (wrong choices) | 750 |
| Distractor slots structurally complete (all 4 fields present) | 748 |
| Distractor slots structurally incomplete | 2 (item_008 options C+D) |
| Items with at least one missing structural field | 1 (item_008) |
| Distractor slots with content-valid misconception text | 0 |
| Distractor slots with content-valid skill_deficit text | 0 |
| Unique misconception texts | 677 of 748 (71 duplicates) |
| Items where dominant_error_pattern has specificity | 0/250 |
| Items where error_cluster_tag has specificity | 0/250 (2 values only) |
| Items flagged is_human_verified | 250/250 |
| Items flagged HUMAN_REVIEWED audit_status | 250/250 |
| Items flagged is_foundational | 250/250 |

---

*Audit conducted by analyzing `src/data/questions.json` (1,150 items total; 250 diagnostic). No data was modified.*
