# Phase C — Error Pattern Synthesis: Workflow and Coworker Prompt

**Status:** Not started. All 1,150 questions pending.
**Last updated:** 2026-04-01

This document is the complete workflow for producing Phase C content via Claude.ai Coworker agents. It covers field definitions, worked examples, the extraction pipeline, anti-collapse constraints, and the copyable agent prompt.

---

## What Phase C Is

Phase C adds three fields **per question** that synthesize across all of a question's distractors to describe the dominant error landscape. Unlike Phase A (one distractor at a time) and Phase B (pedagogical context), Phase C looks at the whole question and asks: *what is the single most diagnostic mistake a student makes on this item?*

| Field | What it captures | Format |
|-------|-----------------|--------|
| `dominant_error_pattern` | The most common or dangerous reasoning failure across ALL wrong answers — not one distractor, but the pattern | 1–2 sentences |
| `error_cluster_tag` | A keyword tag grouping this question with similar error patterns across the skill | 1–4 hyphenated lowercase words from TAG_GLOSSARY.md |
| `error_cluster_tag` source | See `content-authoring/TAG_GLOSSARY.md` for the full registry of approved tags | — |
| `instructional_red_flags` | What a teacher or coach should watch for and do when a student misses this question | 2–4 sentences |

**Why it matters:** These fields power the AI Study Guide's error pattern narrative ("You consistently make scope-overgeneralization errors across LEG questions") and the AI Tutor's coaching response after a missed quiz question. The extraction script includes Phase A classifications so the agent can synthesize across distractors with full context.

---

## Template Collapse — What Happened in Phase B and How to Prevent It

**The Phase B collapse problem:** When agents classified more than 10 questions in a single session, context fatigue caused them to reuse the same `construct_actually_tested` string for all remaining questions. In the worst cases, all 32 questions in a skill had identical values.

**Detection:** `unique_values / total_rows` per skill. Threshold: ≥80% unique = clean.

**Prevention rules (hardcoded into the prompt below):**
1. Maximum 10 questions per agent session
2. No two questions in the same batch may share the same `dominant_error_pattern` opening phrase
3. No two questions in the same batch may share the same `error_cluster_tag` (tags may repeat across batches — just not within a single 10-question batch)
4. After writing each row, the agent must re-read the previous row to verify the new one is meaningfully different

---

## Field Definitions

### `dominant_error_pattern`

**The single most diagnostic reasoning failure across ALL distractors for this question.**

This is not about one specific distractor (that's Phase A). It is the pattern that emerges when you look at all the wrong-answer options together: what does a student who gets this question wrong *consistently believe*?

**Requirements:**
- 1–2 sentences
- Names the specific conceptual confusion, procedural error, or knowledge gap
- Does NOT just summarize the correct answer — it describes the wrong reasoning
- Specific to this question — not a generic statement about the skill

**Examples:**

| Question type | dominant_error_pattern |
|---------------|----------------------|
| CON-01 consultation models | "Students most commonly confuse consultation model goals — substituting the student-level behavior target (behavioral consultation) for the consultee-level barrier target (consultee-centered). The dominant error is model-goal conflation, not procedural confusion about when to consult." |
| LEG-01 FERPA scope | "Students most commonly overgeneralize FERPA's scope, believing it applies to all schools regardless of funding source. The dominant error is missing the federal-funding conditionality that determines applicability." |
| DBD-07 SLD identification | "Students confuse the two federal identification models (Ability-Achievement discrepancy vs. Response-to-Intervention), treating them as interchangeable when they reflect fundamentally different assumptions about what a learning disability is." |

---

### `error_cluster_tag`

A short keyword tag from `content-authoring/TAG_GLOSSARY.md` that groups this question with others that share the same error pattern.

**Approved tags (check TAG_GLOSSARY.md for current list + definitions):**

| Tag | When to use |
|-----|------------|
| `model-conflation` | Student confuses one named model/framework with another |
| `scope-overgeneralization` | Student applies a rule/law more broadly than it applies |
| `scope-undergeneralization` | Student applies a rule too narrowly |
| `sequence-inversion` | Student reverses the order of steps in a procedure |
| `component-confusion` | Student puts a concept in the wrong category or process |
| `indirect-direct-confusion` | Student confuses indirect and direct service delivery |
| `purpose-confusion` | Student knows a tool exists but misidentifies what it's for |
| `prerequisite-skipping` | Student jumps to a later step before completing earlier ones |
| `label-retrieval` | Student understands the concept but can't retrieve the correct term |
| `overgeneralization` | Broad pattern of applying rules too broadly (use when no specific tag fits) |
| `population-confusion` | Student applies criteria for one population to a different population |
| `role-confusion` | Student assigns a responsibility to the wrong professional role |
| `causation-correlation` | Student conflates correlation with causation |
| `validity-reliability-confusion` | Student confuses validity and reliability |
| `norm-criterion-confusion` | Student confuses norm-referenced and criterion-referenced interpretation |
| `tier-level-confusion` | Student applies a MTSS tier's intervention type to the wrong tier |
| `eligibility-criteria-confusion` | Student misidentifies criteria for a legal eligibility determination |
| `consent-confidentiality-confusion` | Student confuses consent rights, confidentiality, or disclosure requirements |
| `developmental-stage-mismatch` | Student applies knowledge from one developmental stage to another |
| `treatment-assessment-confusion` | Student conflates assessment with intervention/treatment |

**If no existing tag fits:** propose a new tag by adding it to TAG_GLOSSARY.md first. New tags must have a one-line definition and two example questions.

---

### `instructional_red_flags`

**What a teacher or coach should watch for — and do — when a student consistently misses this question.**

**Requirements:**
- 2–4 sentences
- Specific: names what the student needs to distinguish, review, or practice
- Actionable: includes a concrete teaching move or diagnostic signal
- May note which distractor choice points to different remediation paths

**Example:**

> "A student who misses this item likely cannot discriminate Caplan's consultee-centered consultation from behavioral consultation. The key signal is whether they chose option A (model-goal confusion) vs. option D (indirect/direct confusion) — these require different remediation paths. Teach: draw the consultation model comparison table side by side, emphasizing that consultee-centered targets the TEACHER's barriers while behavioral consultation targets the STUDENT's behavior through environmental modification. Have the student explain in their own words which model applies when and why."

---

## Output Format

CSV. One row per question.

```
UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags
```

Rules:
- All text fields wrapped in double quotes
- Use single quotes inside text if needed (never escape with backslash)
- `error_cluster_tag` must be from TAG_GLOSSARY.md (or add a new entry to the glossary first)
- No two rows in the same batch may have identical `dominant_error_pattern` opening phrases
- One row per UNIQUEID — no duplicates

**Example output:**
```csv
UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags
"PQ_CON-01_1","Students most commonly confuse consultation model goals — substituting the student-level behavior target of behavioral consultation for the consultee-level objectivity-barrier target of consultee-centered consultation. The dominant error is model-goal conflation, not procedural confusion about when to initiate consultation.","model-conflation","A student who misses this item likely holds an undifferentiated understanding of consultation models. Check which distractor they chose: option A points to model-goal conflation (behavioral vs. consultee-centered); option D points to indirect/direct service confusion. Teach: display the consultation model comparison table side by side, emphasizing that Caplan's consultee-centered model targets the teacher's internal barriers, not the student's behavior. Have the student explain back which model applies in each scenario type."
```

---

## How to Run a Batch

### Step 1 — Extract questions

```bash
cd /path/to/repo
python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py <SKILL_ID> <BATCH_NUMBER>
```

Example:
```bash
python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py CON-01 1
# Output: questions 1–10 for CON-01, including Phase A distractor classifications
```

Copy the output block that begins after "PASTE THIS BLOCK INTO [PASTE QUESTIONS HERE]".

### Step 2 — Submit to Claude.ai Coworker

1. Open a **new** Claude.ai Coworker session (never reuse an existing session — fresh context prevents collapse)
2. Paste the prompt below
3. Replace `[PASTE QUESTIONS HERE]` with the output from Step 1
4. Replace `[SKILL_ID]` and `[SKILL_NAME]`

### Step 3 — Save output

Save the agent's CSV output to:
```
content-authoring/phase-C/output/{SKILL-ID}-phase-C-batch{N}.csv
```

Example: `CON-01-phase-C-batch1.csv`

Apply script (`apply-phase-c.mjs`) reads all `*-phase-C*.csv` files in the output folder.

### Step 4 — Uniqueness check before saving

Before saving a batch CSV, scan it:
- Count how many distinct `dominant_error_pattern` values exist
- If ≥ 80% are unique: save and proceed
- If < 80% are unique: reject the batch, start a new session, regenerate

---

## Batch Strategy

Each skill has 15–30 questions. Recommended wave structure:

| Skill size | Batches needed | Sessions |
|-----------|---------------|---------|
| ≤ 10 questions | 1 batch | 1 session |
| 11–20 questions | 2 batches | 2 sessions |
| 21–30 questions | 3 batches | 3 sessions |
| 31+ questions | 4+ batches | 4+ sessions |

Total questions across all 45 skills: ~1,150. At 10 questions/session: ~115 sessions.

Recommended parallel wave: run 4–6 skills simultaneously in separate Coworker agents. Each skill is fully independent.

---

## Coworker Prompt Template

Copy everything below the line. Replace `[PASTE QUESTIONS HERE]`, `[SKILL_ID]`, and `[SKILL_NAME]`.

---

```
You are a school psychology curriculum expert. Your job is to write Phase C error pattern data for a set of exam questions. This data helps an AI-powered exam prep platform tell students exactly what reasoning error they're making when they miss a question.

SKILL: [SKILL_ID] — [SKILL_NAME]

---

WHAT YOU WILL PRODUCE:

For each question, write three fields:

1. dominant_error_pattern (1–2 sentences)
   The single most diagnostic reasoning failure across ALL wrong-answer options for this question.
   This is NOT about one specific distractor — it is the pattern that emerges across all of them.
   What does a student who gets this question wrong CONSISTENTLY BELIEVE?
   - Must be specific to this question, not generic
   - Names the conceptual confusion, procedural error, or knowledge gap
   - Does NOT just restate the correct answer

2. error_cluster_tag (1–4 hyphenated lowercase words)
   A keyword that groups this question with others sharing the same error pattern.
   Choose the SINGLE best-fit tag from this approved list:
     model-conflation, scope-overgeneralization, scope-undergeneralization,
     sequence-inversion, component-confusion, indirect-direct-confusion,
     purpose-confusion, prerequisite-skipping, label-retrieval,
     overgeneralization, population-confusion, role-confusion,
     causation-correlation, validity-reliability-confusion,
     norm-criterion-confusion, tier-level-confusion,
     eligibility-criteria-confusion, consent-confidentiality-confusion,
     developmental-stage-mismatch, treatment-assessment-confusion
   If none fit, propose a new tag using the format: new-tag-name (and define it in a NOTE at the end).

3. instructional_red_flags (2–4 sentences)
   What a teacher or coach should watch for and do when a student consistently misses this question.
   - Specific: names what the student needs to distinguish, review, or practice
   - Actionable: includes a concrete teaching move or diagnostic signal
   - May note which distractor choice points to different remediation paths

---

CRITICAL QUALITY RULES:
1. Write each question independently — do not reuse phrasing from previous answers
2. No two rows in this batch may share the same dominant_error_pattern opening phrase
3. After writing each row, re-read the previous row and verify yours is meaningfully different
4. error_cluster_tag must be a single tag from the approved list above
5. Do NOT use filler phrases like "Students may have difficulty with..." or "This question tests..."
6. dominant_error_pattern must name a SPECIFIC wrong belief — not describe what the question does

---

CONTEXT PROVIDED FOR EACH QUESTION:
- STEM: the question text
- TESTS: the specific construct this question measures (Phase B)
- CHOICES: all answer options (CORRECT ones are marked)
- DISTRACTOR CLASSIFICATIONS (Phase A): for each wrong answer — tier (L1/L2/L3), error type, misconception text, knowledge gap

Use the Phase A classifications to understand WHAT each wrong answer represents, then synthesize ACROSS them to write the dominant_error_pattern.

---

OUTPUT FORMAT:
CSV with header row. All text fields in double quotes.

UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags

One row per question. No extra commentary outside the CSV.

---

QUESTIONS:

[PASTE QUESTIONS HERE]
```

---

## Apply Script

After saving batch CSVs to `content-authoring/phase-C/output/`, apply them with:

```bash
node scripts/apply-phase-c.mjs --dry-run   # preview without writing
node scripts/apply-phase-c.mjs             # apply to questions.json
```

The apply script validates `error_cluster_tag` values against the approved list and logs any unknown tags as warnings. Use `--force-mismatches` to overwrite existing content after reviewing the mismatch log.
