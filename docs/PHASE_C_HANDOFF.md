# Phase C Handoff — Error Pattern Synthesis

**Document type:** Engineering and content authoring handoff
**Status:** Infrastructure complete — content authoring not yet started
**Last updated:** 2026-04-01

---

## What Phase C Is

Phase C adds three fields **per question** to the 1,150-question bank. Where Phase A classified each individual wrong answer in isolation and Phase B described the pedagogical context of each question, Phase C steps back and asks: *across all the wrong answers for this question, what is the single most diagnostic reasoning error a student makes?*

### The Three Fields

| Field | Format | What It Captures |
|-------|--------|-----------------|
| `dominant_error_pattern` | 1–2 sentences | The most common or dangerous reasoning failure across ALL distractors for this question — not one distractor, but the pattern that emerges when you look at them together |
| `error_cluster_tag` | 1–4 word tag | A keyword from `content-authoring/TAG_GLOSSARY.md` that groups this question with others sharing the same error type (e.g. `model-conflation`, `scope-overgeneralization`) |
| `instructional_red_flags` | 2–4 sentences | What a teacher or coach should watch for and do when a student consistently misses this question — specific, actionable, names which distractor signals which remediation path |

### Why Phase A Must Come First

Phase C synthesizes **across distractors**. The extraction script (`extract_phase_c_batch.py`) includes the full Phase A classification for each wrong answer in the question block shown to the agent. The agent reads tier, error type, misconception text, and knowledge gap for every wrong answer, then synthesizes a single dominant pattern statement. Without Phase A data, this synthesis is uninformed. Phase A is complete for 98.7% of slots — Phase C can start immediately.

---

## Current State

| Phase | Status | Coverage |
|-------|--------|----------|
| A — Distractor classification | ✅ Complete | 3,587 slots — 98.7% of wrong-answer options |
| B — Pedagogical rationale | ✅ Applied | `complexity_rationale` 1150/1150; `construct_actually_tested` 1142/1150 |
| C — Error pattern synthesis | ⬜ Infrastructure ready, no content yet | 0 / 1,150 questions |
| D — Standards alignment | ✅ Applied | 45 / 45 skills in `src/data/skill-phase-d.json` |

### Infrastructure already in place

| File | Purpose |
|------|---------|
| `content-authoring/phase-C/pipeline/extract_phase_c_batch.py` | Generates 10-question batches with Phase A+B data embedded |
| `content-authoring/phase-C/PHASE-C-WORKFLOW.md` | Full agent-facing workflow + copyable Coworker prompt |
| `scripts/apply-phase-c.mjs` | Applies CSVs to `questions.json`; validates tags; 4-category logging |
| `content-authoring/phase-C/output/` | Empty — this is where CSVs go |
| `content-authoring/TAG_GLOSSARY.md` | Registry of approved `error_cluster_tag` values |

---

## What Needs to Be Done

### Content authoring: 1,150 questions × 3 fields, in 138 batches

Every skill needs its questions processed in 10-question batches via Claude.ai Coworker. Each batch = one fresh Coworker session.

### Exact batch counts per skill

| Skill | Questions | Batches | Skill | Questions | Batches |
|-------|-----------|---------|-------|-----------|---------|
| ACA-02 | 23 | 3 | LEG-01 | 27 | 3 |
| ACA-03 | 23 | 3 | LEG-02 | 37 | **4** |
| ACA-04 | 26 | 3 | LEG-03 | 22 | 3 |
| ACA-06 | 28 | 3 | LEG-04 | 24 | 3 |
| ACA-07 | 24 | 3 | MBH-02 | 24 | 3 |
| ACA-08 | 28 | 3 | MBH-03 | 38 | **4** |
| ACA-09 | 20 | 2 | MBH-04 | 24 | 3 |
| CON-01 | 34 | **4** | MBH-05 | 26 | 3 |
| DBD-01 | 32 | **4** | PSY-01 | 22 | 3 |
| DBD-03 | 33 | **4** | PSY-02 | 24 | 3 |
| DBD-05 | 23 | 3 | PSY-03 | 26 | 3 |
| DBD-06 | 27 | 3 | PSY-04 | 22 | 3 |
| DBD-07 | 26 | 3 | RES-02 | 23 | 3 |
| DBD-08 | 24 | 3 | RES-03 | 24 | 3 |
| DBD-09 | 22 | 3 | SAF-01 | 29 | 3 |
| DBD-10 | 20 | 2 | SAF-03 | 32 | **4** |
| DEV-01 | 23 | 3 | SAF-04 | 27 | 3 |
| DIV-01 | 20 | 2 | SWP-02 | 23 | 3 |
| DIV-03 | 21 | 3 | SWP-03 | 24 | 3 |
| DIV-05 | 20 | 2 | SWP-04 | 32 | **4** |
| ETH-01 | 33 | **4** | — | — | — |
| ETH-02 | 25 | 3 | **Total** | **1,150** | **138** |
| ETH-03 | 23 | 3 | | | |
| FAM-02 | 22 | 3 | | | |
| FAM-03 | 20 | 2 | | | |

**Skills with 4 batches** (most work per skill): CON-01, DBD-01, DBD-03, ETH-01, LEG-02, MBH-03, SAF-03, SWP-04

**Skills with 2 batches** (least work per skill): ACA-09, DBD-10, DIV-01, DIV-05, FAM-03

---

## Step-by-Step Execution

### For each batch

**Step 1 — Extract**
```bash
python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py <SKILL_ID> <BATCH_NUMBER>
```
Example:
```bash
python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py CON-01 1
# Output: questions 1–10 for CON-01 with Phase A distractor data + Phase B construct embedded
```
Copy the block after "PASTE THIS BLOCK INTO [PASTE QUESTIONS HERE]".

**Step 2 — Open a fresh Coworker session**

Always a **new** session. Never reuse a previous conversation. Stale context causes template collapse — the exact failure mode that destroyed Phase B quality for 29 skills.

**Step 3 — Submit**

Paste the full prompt from `content-authoring/phase-C/PHASE-C-WORKFLOW.md`, substituting `[PASTE QUESTIONS HERE]` and `[SKILL_ID]` / `[SKILL_NAME]`.

**Step 4 — QA check before saving**

Before saving the output, count unique `dominant_error_pattern` values:
- **≥ 80% unique** → accept, save, proceed
- **< 80% unique** → reject the batch, start a new Coworker session, regenerate

Also check that no `dominant_error_pattern` simply restates the correct answer. Reject those entries.

**Step 5 — Save**
```
content-authoring/phase-C/output/{SKILL-ID}-phase-C-batch{N}.csv
```
Example: `CON-01-phase-C-batch1.csv`

**Step 6 — Apply (per skill or in bulk)**
```bash
node scripts/apply-phase-c.mjs --dry-run   # preview — always run first
node scripts/apply-phase-c.mjs             # apply to questions.json
```

The apply script is **idempotent** — safe to re-run at any point. It logs mismatches but does not overwrite without `--force-mismatches`. Run it after each skill completes or batch all output and apply at the end.

---

## Anti-Collapse Rules

Template collapse (Phase B's primary failure mode) produces worthless output where all questions in a skill receive the same `dominant_error_pattern`. These rules prevent it:

1. **10 questions per session — no exceptions.** Even for 11 questions, use two sessions (10 + 1).
2. **Fresh session per batch.** Never continue a previous Coworker conversation.
3. **No repeated opening phrases within a batch.** The Coworker prompt includes this as an explicit constraint.
4. **QA uniqueness check before saving.** Unique ratio < 80% = reject and regenerate.

---

## The TAG_GLOSSARY — Approved Tags

`error_cluster_tag` must be a value from `content-authoring/TAG_GLOSSARY.md`. The full registry with definitions and example skills lives there. Current approved tags:

| Tag | Error Pattern |
|-----|--------------|
| `model-conflation` | Confuses one named model or framework with another that has a different goal |
| `scope-overgeneralization` | Applies a rule, law, or principle more broadly than it actually applies |
| `scope-undergeneralization` | Applies a rule too narrowly — misses cases it actually covers |
| `sequence-inversion` | Reverses the correct order of steps in a procedure or process |
| `component-confusion` | Places a concept, tool, or step inside the wrong category, process, or system |
| `indirect-direct-confusion` | Confuses indirect service delivery (through teacher/parent) with direct student service |
| `purpose-confusion` | Knows a tool, law, or model exists but misidentifies what it is for |
| `prerequisite-skipping` | Jumps to a later step before completing required earlier steps |
| `label-retrieval` | Understands the concept but cannot retrieve or match the correct named term |
| `overgeneralization` | General pattern of applying a rule or concept too broadly |
| `population-confusion` | Applies criteria or procedures designed for one population to a different population |
| `role-confusion` | Assigns a responsibility or action to the wrong professional role |
| `causation-correlation` | Conflates correlation with causation, or assumes direction of effect |
| `validity-reliability-confusion` | Confuses validity and reliability concepts or misapplies them |
| `norm-criterion-confusion` | Confuses norm-referenced and criterion-referenced interpretation |
| `tier-level-confusion` | Applies a MTSS/RTI tier's intervention type to the wrong tier level |
| `eligibility-criteria-confusion` | Misidentifies which criteria trigger a legal eligibility determination |
| `consent-confidentiality-confusion` | Confuses consent rights, confidentiality protections, or disclosure requirements |
| `developmental-stage-mismatch` | Applies knowledge from one developmental stage to a different stage |
| `treatment-assessment-confusion` | Conflates an assessment process with an intervention or treatment process |

**If an agent proposes a new tag:** add it to `TAG_GLOSSARY.md` first (one-line definition + two example questions), then accept it in the CSV. The apply script warns on unknown tags but does not block the apply.

---

## How Phase C Data Will Be Used in the App

Phase C data is **not yet wired into any app surface**. The data pipeline (extraction → authoring → apply) is complete. Once questions.json is populated, three separate wiring tasks build the product surfaces.

### 1. Study Guide — Cross-Skill Error Pattern Narrative

**What it unlocks:**

Today the study guide receives per-skill misconception signals from Phase A (which specific wrong belief the student held). Phase C adds a higher-order signal: when multiple questions across a skill or domain share the same `error_cluster_tag`, the guide can name the pattern:

> *"Across your LEG questions, your most consistent error is scope-overgeneralization — applying laws more broadly than they apply. This shows up in 6 of the 12 legal/ethical questions you've missed."*

**Wiring needed (not yet done):**

- `src/utils/studyPlanPreprocessor.ts` — aggregate `error_cluster_tag` frequency across missed questions per skill and cluster; attach dominant tag + count to cluster payload
- `src/types/studyPlanTypes.ts` — add `dominantErrorClusterTag?: string` and `errorClusterTagCount?: number` to `PrecomputedCluster.skills` or at the cluster level
- `src/services/studyPlanService.ts` — add prompt rule: when 3+ missed questions in a cluster share a tag, include pattern-level language in cluster `whyItMatters`

---

### 2. AI Tutor — Targeted Post-Miss Remediation

**What it unlocks:**

The tutor already has an adaptive retry loop: two consecutive wrong answers on the same skill triggers a remediation block (Claude writes concept explanation + memory anchor). Currently this is generic — Claude gets the skill name and question but no specific teaching guidance. With Phase C:

- `instructional_red_flags` provides the exact teaching move for this question
- `dominant_error_pattern` names what the student is most likely confusing
- The remediation becomes: *"You've missed this type of question twice. Here's what students usually confuse here, and how to think through it correctly."*

**Wiring needed (not yet done):**

- `src/utils/tutorQuizEngine.ts` — pass `dominant_error_pattern` and `instructional_red_flags` through `EvaluatedAnswer` when the question is wrong (these fields are already on the question object via the spread-through from questions.json via `analyzeQuestion`)
- `api/tutor-chat.ts` — in the remediation trigger block, include `instructional_red_flags` in the system prompt injection so Claude receives it as specific coaching guidance rather than writing generic remediation

---

### 3. Admin Item Analysis — Error Cluster Visibility

**What it unlocks:**

The Item Analysis tab currently shows L1/L2/L3 and Conceptual/Procedural/Lexical chips per distractor (Phase A). Phase C adds a question-level layer:

- `error_cluster_tag` chip per question — QA and curriculum staff can see which error pattern each item targets
- `dominant_error_pattern` text — expandable or on hover, shows the synthesized error narrative
- Filtering/grouping by tag — find all `model-conflation` questions in a skill to assess whether the question bank has sufficient coverage of that error type

**Wiring needed (not yet done):**

- `api/admin-item-analysis.ts` — add `errorClusterTag` and `dominantErrorPattern` to the per-question item stats object (these fields are on the question objects already via questions.json)
- `src/components/ItemAnalysisTab.tsx` — render a tag chip (e.g. `model-conflation`) in the question header row; expandable `dominant_error_pattern` text below the distractor chips

---

## Output Format Reference

CSV. One row per question.

```
UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags
```

All text fields in double quotes. `error_cluster_tag` is one approved tag. One row per UNIQUEID — no duplicates.

**Example:**
```csv
UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags
"PQ_CON-01_1","Students most commonly confuse consultation model goals — substituting the student-level behavior target of behavioral consultation for the consultee-level barrier target of consultee-centered consultation. The dominant error is model-goal conflation, not procedural confusion about when to initiate consultation.","model-conflation","A student who misses this item likely holds an undifferentiated understanding of consultation models. Check which distractor they chose: option A points to model-goal conflation; option D points to indirect/direct service confusion — different remediation paths. Teach: display the consultation model comparison table side by side, emphasizing that Caplan's consultee-centered model targets the teacher's internal barriers, not the student's behavior."
```

---

## Parallel Execution Strategy

All 45 skills are fully independent. Recommended: run 6–8 skills simultaneously in separate Coworker agents — one agent per batch, one batch per session.

**Suggested first wave:**
```
Agent 1: python3 ... extract_phase_c_batch.py CON-01 1    (34 q → 4 batches total)
Agent 2: python3 ... extract_phase_c_batch.py LEG-02 1    (37 q → 4 batches total)
Agent 3: python3 ... extract_phase_c_batch.py MBH-03 1    (38 q → 4 batches total)
Agent 4: python3 ... extract_phase_c_batch.py ETH-01 1    (33 q → 4 batches total)
Agent 5: python3 ... extract_phase_c_batch.py DBD-01 1    (32 q → 4 batches total)
Agent 6: python3 ... extract_phase_c_batch.py SAF-03 1    (32 q → 4 batches total)
```

Start with the 4-batch skills (most questions) so they finish in parallel with the 2- and 3-batch skills.

---

## Tracking Progress

The apply script prints a coverage line on every run:
```
Skills with all 3 Phase C fields: X / 1,150
```

Use this as ground truth for overall progress. For per-skill tracking, maintain a simple status table:

| Skill | Batches | Done | Notes |
|-------|---------|------|-------|
| ACA-02 | 3 | ⬜⬜⬜ | |
| ACA-03 | 3 | ⬜⬜⬜ | |
| ACA-04 | 3 | ⬜⬜⬜ | |
| ACA-06 | 3 | ⬜⬜⬜ | |
| ACA-07 | 3 | ⬜⬜⬜ | |
| ACA-08 | 3 | ⬜⬜⬜ | |
| ACA-09 | 2 | ⬜⬜ | |
| CON-01 | 4 | ⬜⬜⬜⬜ | |
| DBD-01 | 4 | ⬜⬜⬜⬜ | |
| DBD-03 | 4 | ⬜⬜⬜⬜ | |
| DBD-05 | 3 | ⬜⬜⬜ | |
| DBD-06 | 3 | ⬜⬜⬜ | |
| DBD-07 | 3 | ⬜⬜⬜ | |
| DBD-08 | 3 | ⬜⬜⬜ | |
| DBD-09 | 3 | ⬜⬜⬜ | |
| DBD-10 | 2 | ⬜⬜ | |
| DEV-01 | 3 | ⬜⬜⬜ | |
| DIV-01 | 2 | ⬜⬜ | |
| DIV-03 | 3 | ⬜⬜⬜ | |
| DIV-05 | 2 | ⬜⬜ | |
| ETH-01 | 4 | ⬜⬜⬜⬜ | |
| ETH-02 | 3 | ⬜⬜⬜ | |
| ETH-03 | 3 | ⬜⬜⬜ | |
| FAM-02 | 3 | ⬜⬜⬜ | |
| FAM-03 | 2 | ⬜⬜ | |
| LEG-01 | 3 | ⬜⬜⬜ | |
| LEG-02 | 4 | ⬜⬜⬜⬜ | |
| LEG-03 | 3 | ⬜⬜⬜ | |
| LEG-04 | 3 | ⬜⬜⬜ | |
| MBH-02 | 3 | ⬜⬜⬜ | |
| MBH-03 | 4 | ⬜⬜⬜⬜ | |
| MBH-04 | 3 | ⬜⬜⬜ | |
| MBH-05 | 3 | ⬜⬜⬜ | |
| PSY-01 | 3 | ⬜⬜⬜ | |
| PSY-02 | 3 | ⬜⬜⬜ | |
| PSY-03 | 3 | ⬜⬜⬜ | |
| PSY-04 | 3 | ⬜⬜⬜ | |
| RES-02 | 3 | ⬜⬜⬜ | |
| RES-03 | 3 | ⬜⬜⬜ | |
| SAF-01 | 3 | ⬜⬜⬜ | |
| SAF-03 | 4 | ⬜⬜⬜⬜ | |
| SAF-04 | 3 | ⬜⬜⬜ | |
| SWP-02 | 3 | ⬜⬜⬜ | |
| SWP-03 | 3 | ⬜⬜⬜ | |
| SWP-04 | 4 | ⬜⬜⬜⬜ | |
| **Total** | **138** | | |

---

## Quality Standards

| Check | Threshold | On Failure |
|-------|-----------|------------|
| Unique `dominant_error_pattern` per batch | ≥ 80% | Reject batch, new session, regenerate |
| `error_cluster_tag` in TAG_GLOSSARY | 100% | Add to glossary first or remap; apply script warns on unknown tags |
| `dominant_error_pattern` ≠ just restating correct answer | Subjective | Reject entries that describe the right answer rather than the wrong reasoning |
| `instructional_red_flags` specific to this question | Encouraged | Flag batches where every entry is completely generic |
