# Phase B Regeneration Workflow
# construct_actually_tested + complexity_rationale — 29 Collapsed Skills

Last updated: 2026-04-01

---

## What We're Doing

29 out of 45 Phase B CSV files have **template collapse**: the entire skill was assigned 1–5 reused
strings instead of a unique value per question. This document is the complete plan for regenerating
them using Claude.ai Coworker (multi-agent).

**16 clean skills are already applied** to `src/data/questions.json`. These serve as our gold standard.
The 29 collapsed ones need new values, then a second apply pass.

---

## The Two Fields

### `construct_actually_tested`

**What it is:**
A precise, single-sentence label naming the specific cognitive task this question actually measures —
not what the topic is, but what the student must *do mentally* to answer it correctly.

It captures two things in one phrase:
1. The **specific concept boundary** — which narrow slice of the skill is tested (not the whole skill)
2. The **cognitive operation** — discriminate / retrieve / sequence / apply / classify / identify

**Length target: 12–25 words.** Long enough to be specific. Short enough to be a label, not a paragraph.
Do NOT write a sentence starting with "This item tests...". Write a noun phrase.

**It should answer:** "What exactly would you need to know and do to get this question right?"

---

### `complexity_rationale`

**What it is:**
A 1–3 sentence explanation classifying the item as **Recall** or **Application** (or Analysis)
and stating *why* — what cognitive operation the correct answer required.

**Format:**
> "This is a [Recall / Application / Analysis] item because [specific reason]. [Optional: What
> the distractors test.] [Optional: What distinguishes this from the adjacent level.]"

**Length target: 25–60 words.** Be specific enough to justify the label. Do not repeat the stem verbatim.

---

## Examples — What Good Looks Like

These are real values from the 16 clean skills already in `questions.json`.

### Example 1 — Discrimination (MBH-03)
```
STEM: A student has the anxious thought "I will definitely fail this test and everyone will
think I'm stupid." Which cognitive distortion BEST describes this thought?

construct_actually_tested:
  Differential identification of catastrophizing/all-or-nothing cognitions versus mind reading,
  overgeneralization, and labeling in anxious self-talk

complexity_rationale:
  This is an Application item because the student must classify a nuanced self-statement that
  blends catastrophic prediction and social-evaluative fear. Success depends on differentiating
  closely related distortion labels from the wording of the thought.
```

### Example 2 — Sequencing (CON-01)
```
STEM: During the first meeting with a teacher to address a student's disruptive behavior,
what should be the school psychologist's first action?

construct_actually_tested:
  Behavioral consultation sequencing: prioritizing operational target-behavior definition
  during problem identification before analysis and intervention planning

complexity_rationale:
  This is an Application item because it asks for the first action in an initial meeting,
  requiring sequence judgment rather than term recall. The student must prioritize
  operational problem definition before records review, observation, or intervention advice.
```

### Example 3 — Definition Recall (MBH-03)
```
STEM: In Applied Behavior Analysis (ABA), which of the following best defines reinforcement?

construct_actually_tested:
  Definition-level knowledge that reinforcement is consequence-based and behavior-increasing,
  distinct from punishment and generic post-behavior outcomes

complexity_rationale:
  This is a Recall item because it asks for the formal ABA definition of reinforcement by
  effect on future behavior. No case interpretation is needed because the stem contains no
  scenario details — the student only needs to retrieve the definition.
```

### Example 4 — Legal Rule Application (LEG-03)
```
STEM: A 10-year-old student with severe asthma experiences frequent hospitalizations and uses
an inhaler during the school day. Under which law is this student MOST likely to qualify
for accommodations?

construct_actually_tested:
  Section 504/ADA eligibility, accommodation obligations, and anti-discrimination standards;
  applied to a student with a chronic health condition that substantially limits major life activity

complexity_rationale:
  This is an Application item because the student must map the rule to the scenario facts and
  reject plausible alternatives that misuse the standard. Success requires distinguishing
  Section 504 (functional limitation, not disability label) from IDEA eligibility criteria.
```

### Example 5 — Component Identification (CON-01)
```
STEM: A school psychologist initiates consultation with both a teacher AND a parent
simultaneously to address a student's challenging behavior across home and school.
This BEST illustrates which consultation model?

construct_actually_tested:
  Identification of conjoint behavioral consultation from scenario cues involving coordinated
  parent-teacher-consultant intervention planning across settings

complexity_rationale:
  This is an Application item because the learner must classify a described multi-party
  process, not recall an isolated definition. Correct responding requires recognizing the
  simultaneous parent-teacher involvement cue as the defining feature of CBC versus
  other consultation models.
```

---

## Non-Examples — What Collapse Looks Like

These are the actual collapsed values that need to be replaced.

### Collapsed — 1 string for all 22 questions (PSY-01)
```
❌ BAD:
  construct_actually_tested:
    "Interpretation of norm-referenced psychoeducational scores and distinctions among
    standard scores, percentiles, confidence intervals, and grade equivalents"

  (This is the skill description. It tells us the topic. It says nothing about what any
  individual question actually tests. 22 different questions cannot all have the same answer
  to "what must the student do to get this right.")
```

### Collapsed — 1 string for all 32 questions (SWP-04)
```
❌ BAD:
  construct_actually_tested:
    "Knowledge of MTSS decision architecture: screening, tier movement, problem-solving
    sequence, fidelity monitoring, and system-level adjustment"

  (This is a table of contents for the skill. Every question in SWP-04 would match it.)
```

### Collapsed — vague meta-label (ACA-02)
```
❌ BAD:
  construct_actually_tested:
    "Precise construct boundaries for selecting the correct framework in school psychology scenarios"

  (This could describe any question in the entire exam bank. It has no discriminative value.)
```

### The diagnostic test for a bad construct:
> **If you could copy-paste this same string onto any other question in this skill without it
> being obviously wrong, it is too vague. Every question must produce a string that only
> fits that question.**

---

## Constraints for the Agent

Tell the agent to follow these rules exactly:

1. **One unique construct per question.** No two questions in the batch may share the same string.

2. **12–25 words for construct_actually_tested.** Noun phrase only — no leading verb like "Tests" or "Identifies."

3. **25–60 words for complexity_rationale.** Must begin: "This is a [Recall / Application / Analysis] item because..."

4. **Recall vs. Application:**
   - **Recall** = stem contains no scenario; student retrieves a definition, rule, or fact
   - **Application** = stem has a scenario or case; student maps rule to situation
   - **Analysis** = student must compare, evaluate, or synthesize across frameworks

5. **Name the specific concept, not the topic.**
   - ✅ "discrimination of catastrophizing from mind reading and overgeneralization"
   - ❌ "knowledge of cognitive distortions"

6. **The construct must explain why the wrong answers are wrong.**
   A well-written construct implicitly names what the distractors are testing incorrectly.
   "Distinction between Section 504 and IDEA eligibility" explains why IDEA-related distractors
   were placed there.

7. **Do NOT start construct with:** "This question tests...", "The student must...",
   "Knowledge of...", "Understanding of..."

8. **Do NOT summarize the correct answer** — describe the cognitive operation needed to
   reach it.

---

## Coworker Prompt Template

Copy this entire block into Claude.ai Coworker. Replace the `[SKILL NAME]`, `[SKILL ID]`,
and `[PASTE QUESTIONS HERE]` placeholders.

---

```
STRICT CONSTRAINTS — READ BEFORE ANYTHING ELSE:
- Do NOT connect to Supabase or any database.
- Do NOT read any files from the filesystem.
- Do NOT write any code.
- Your ONLY output is a CSV block.

---

TASK: Phase B Classification — construct_actually_tested + complexity_rationale

You are classifying multiple-choice exam items from a graduate-level school psychology
licensing exam (NASP Praxis equivalent). This skill is:

  Skill ID:   [SKILL ID]
  Skill Name: [SKILL NAME]

For each question below, write TWO values:

1. construct_actually_tested
   - A precise noun phrase (12–25 words) naming the SPECIFIC cognitive task this item measures
   - Capture: (a) which narrow concept boundary is tested, and (b) what the student must
     mentally do — discriminate, retrieve, sequence, apply, classify, or identify
   - Must be UNIQUE per question — no two questions in this batch may share the same string
   - Do NOT begin with "Tests...", "Knowledge of...", "Understanding of...", or
     "The student must..."
   - Do NOT summarize the topic of the skill — name what this specific question requires

2. complexity_rationale
   - 25–60 words
   - Must begin: "This is a [Recall / Application / Analysis] item because..."
   - Recall = stem is a direct definition or fact question with no scenario
   - Application = stem has a case, scenario, or situational context the student must
     interpret
   - Analysis = student must compare competing frameworks, evaluate evidence, or synthesize
     across multiple concepts
   - Name the specific operation required, not just the label

QUALITY CHECK — before finalizing, verify:
- Every construct is unique (they cannot all say the same thing)
- Each construct would ONLY fit that specific question, not other questions in the skill
- Each rationale begins with "This is a [level] item because"

OUTPUT FORMAT — a plain CSV block with exactly these columns, no extra text before or after:
UNIQUEID,construct_actually_tested,complexity_rationale

---

QUESTIONS TO CLASSIFY:

[PASTE QUESTIONS HERE]

---

Return only the CSV block. No preamble, no commentary, no markdown fences.
```

---

## How to Prepare a Question Batch

Run the Python script `content-authoring/phase-B/pipeline/extract_phase_b_batch.py` to generate
formatted question blocks. Example usage:

```bash
cd /Users/lebron/Documents/PraxisMakesPerfect
python3 content-authoring/phase-B/pipeline/extract_phase_b_batch.py PSY-01 1
# Output: formatted question block for PSY-01 questions 1-10
# Paste the output into the [PASTE QUESTIONS HERE] slot above

python3 content-authoring/phase-B/pipeline/extract_phase_b_batch.py PSY-01 2
# Output: questions 11-20

python3 content-authoring/phase-B/pipeline/extract_phase_b_batch.py PSY-01 3
# Output: questions 21-22 (final partial batch)
```

The script prints:
- The formatted question block (copy-paste into Coworker)
- The skill name (copy-paste into the prompt header)

---

## 29 Collapsed Skills — Batch Count

Run agents for each skill, 10 questions per batch. Multiple agents can run in parallel.

| Skill | Questions | Batches | Skill Name |
|---|---|---|---|
| ACA-02 | 23 | 3 | Accommodations, Modifications, and Instructional Supports |
| ACA-03 | 23 | 3 | Academic Assessment and Progress Monitoring |
| ACA-04 | 26 | 3 | Curriculum-Based Measurement and Formative Assessment |
| ACA-06 | 28 | 3 | Reading Instruction and Intervention |
| ACA-07 | 24 | 3 | Math Instruction and Intervention |
| ACA-08 | 28 | 3 | Written Language and Executive Function Supports |
| ACA-09 | 20 | 2 | Study Skills and Self-Regulated Learning |
| DBD-01 | 32 | 4 | Intellectual Disability — Identification and Eligibility |
| DBD-05 | 23 | 3 | Emotional and Behavioral Disorders — Identification |
| DBD-06 | 27 | 3 | Autism Spectrum Disorder — Assessment |
| DBD-07 | 26 | 3 | Learning Disability — Identification Models |
| DBD-08 | 24 | 3 | Specific Learning Disabilities — Reading Profiles |
| DBD-09 | 22 | 3 | ADHD — Assessment and Differential Diagnosis |
| DBD-10 | 20 | 2 | Gifted and Twice-Exceptional Students |
| DEV-01 | 23 | 3 | Child and Adolescent Development |
| DIV-01 | 20 | 2 | Culturally Responsive Practice |
| DIV-03 | 21 | 3 | English Language Learners — Assessment |
| DIV-05 | 20 | 2 | Disproportionality and Bias in Assessment |
| FAM-02 | 22 | 3 | Family Engagement and Partnership |
| FAM-03 | 20 | 2 | Interagency Collaboration |
| PSY-01 | 22 | 3 | Psychometric Theory and Score Interpretation |
| PSY-02 | 24 | 3 | Neurodevelopmental Disorders |
| PSY-03 | 26 | 3 | Social-Emotional Learning and Mental Health |
| PSY-04 | 22 | 3 | School-Based Mental Health Interventions |
| RES-02 | 23 | 3 | Research Design and Evidence Evaluation |
| RES-03 | 24 | 3 | Data-Based Decision Making |
| SWP-02 | 23 | 3 | Multi-Tiered Systems of Support — Tier 2 |
| SWP-03 | 24 | 3 | Multi-Tiered Systems of Support — Tier 3 |
| SWP-04 | 32 | 4 | MTSS Decision Architecture and Fidelity |
| **Total** | **692** | **~80** | |

---

## Parallel Execution Strategy

Claude.ai Coworker supports multiple agents running simultaneously. Suggested grouping:

**Wave 1 (launch all at once — 6 agents, 10 questions each):**
- PSY-01 Batch 1 · PSY-02 Batch 1 · PSY-03 Batch 1
- SWP-04 Batch 1 · DBD-01 Batch 1 · ACA-06 Batch 1

**Wave 2 (while Wave 1 is running — 6 more agents):**
- PSY-01 Batch 2 · PSY-02 Batch 2 · PSY-03 Batch 2
- SWP-04 Batch 2 · DBD-01 Batch 2 · ACA-06 Batch 2

Continue until all batches are done. Each agent produces a 10-row CSV block.
Consolidate all CSVs per skill before applying.

---

## After Running — How to Apply

1. **Collect CSVs:** Paste each agent's output into the corresponding CSV file in
   `content-authoring/phase-B/output/[SKILL]-phase-B.csv`, replacing the collapsed rows.

2. **Run the variety audit** to verify uniqueness before applying:
   ```bash
   python3 << 'PYEOF'
   import csv, glob, os
   for f in sorted(glob.glob("content-authoring/phase-B/output/*.csv")):
       skill = os.path.basename(f).replace("-phase-B.csv","")
       rows = list(csv.DictReader(open(f)))
       constructs = [r.get('construct_actually_tested','').strip() for r in rows if r.get('construct_actually_tested','').strip()]
       unique = len(set(constructs))
       variety = unique / len(rows) if rows else 0
       status = "✅" if variety >= 0.80 else "❌"
       print(f"{status} {skill:<10} {unique}/{len(rows)} unique ({round(variety*100)}%)")
   PYEOF
   ```

3. **Apply to questions.json:** The apply script from Phase A supports Phase B fields.
   Run after all 29 skills are regenerated and verified.

---

## Known Skill Names (for prompt header)

Look up the exact skill name in `src/data/skill-metadata-v1.ts` if unsure. Quick reference
for the 29 collapsed skills:

| Skill ID | Full Skill Name |
|---|---|
| ACA-02 | Accommodations, Modifications, and Instructional Supports |
| ACA-03 | Academic Assessment and Progress Monitoring |
| ACA-04 | Curriculum-Based Measurement |
| ACA-06 | Reading Instruction and Intervention |
| ACA-07 | Mathematics Instruction and Intervention |
| ACA-08 | Written Language Instruction and Executive Function |
| ACA-09 | Self-Regulated Learning and Study Skills |
| DBD-01 | Intellectual Disability — Classification and Identification |
| DBD-05 | Emotional and Behavioral Disorders |
| DBD-06 | Autism Spectrum Disorder |
| DBD-07 | Specific Learning Disabilities — Identification Models |
| DBD-08 | Specific Learning Disabilities — Reading |
| DBD-09 | Attention-Deficit/Hyperactivity Disorder |
| DBD-10 | Gifted and Twice-Exceptional Learners |
| DEV-01 | Child and Adolescent Development |
| DIV-01 | Culturally Responsive Practice and Assessment |
| DIV-03 | English Language Acquisition and Bilingualism |
| DIV-05 | Disproportionality, Bias, and Equity in Assessment |
| FAM-02 | Family Engagement and Home-School Collaboration |
| FAM-03 | Interagency Collaboration and Transition Planning |
| PSY-01 | Psychometric Theory and Norm-Referenced Score Interpretation |
| PSY-02 | Neurodevelopmental Disorders — Diagnosis and Presentation |
| PSY-03 | Social-Emotional Learning and Internalizing Disorders |
| PSY-04 | School-Based Mental Health Intervention |
| RES-02 | Research Literacy and Evidence-Based Practice |
| RES-03 | Data-Based Decision Making |
| SWP-02 | MTSS Tier 2 — Targeted Intervention |
| SWP-03 | MTSS Tier 3 — Intensive Support |
| SWP-04 | MTSS Architecture and Fidelity Monitoring |
