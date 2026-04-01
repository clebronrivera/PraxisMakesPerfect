# Content Authoring Handoff — Praxis Makes Perfect Question Bank

**Document type:** Agent handoff — content authoring work only. No code. No file edits.
**Your output:** Structured data (CSV or JSON) returned as text. A human engineer will apply it.
**Who this is for:** LLM agents assigned to fill in expert-judgment fields in the question bank.

---

## What This Project Is

**Praxis Makes Perfect** is an adaptive exam-prep platform for the **Praxis School Psychology (5403)** licensing exam. The question bank has **1,150 multiple-choice questions** across **45 skills** in school psychology. The platform tracks which wrong answers students repeatedly choose and adapts to their weaknesses — but that system only works if each question's wrong answers have been analyzed by an expert.

The bank has **74 fields per question**. Many of them require human expert judgment to fill in: classifying reasoning errors, identifying student misconceptions, explaining why one question tests recall while another tests application, mapping prerequisite knowledge chains. **These are not tasks a script can do.** They require reading the question, reasoning about student thinking, and drawing on knowledge of school psychology, psychometrics, and pedagogical theory.

This document covers **four phases of authoring work**, all independent enough that multiple agents can work on them simultaneously once the question data is in hand.

---

## How to Get the Question Data

A script in the codebase extracts questions in a clean, agent-readable format. **The engineer coordinating this work runs the script; the agent receives the output as a text file.**

```bash
# Extract all questions for one skill (gaps only — missing distractor classification)
node scripts/extract-questions-for-agent.mjs CON-01 --gaps-only

# Extract all questions for one skill (including already-classified)
node scripts/extract-questions-for-agent.mjs LEG-02

# Extract all questions across all skills (for gap overview)
node scripts/extract-questions-for-agent.mjs ALL --gaps-only
```

The output is a `.txt` file like `CON-01-questions-for-agent.txt` — one question per block, clearly labeled with CORRECT and WRONG options. The agent reads this file and produces structured output.

**Batch size recommendation:** 20–30 questions per chat session. Larger batches drift in quality.

---

## Current Status — As of 2026-04-01

| Phase | What | Status | Applied to questions.json | Remaining |
|-------|------|--------|--------------------------|-----------|
| **A** | Distractor classification (4 fields per wrong answer) | ✅ Complete | 3,587 slots — 98.7% coverage | 15 residual gaps (accepted) |
| **B** | Pedagogical rationale (2 fields per question) | ✅ Applied (quality gap) | `complexity_rationale` 1150/1150; `construct_actually_tested` 1142/1150 | 29 skills have template-collapse content (applied but low quality — regen improves them); 8 ACA-06 legacy questions have no CSV entry |
| **C** | Error pattern synthesis (3 fields per question) | ⬜ Not started | 0 | All 1,150 questions |
| **D** | Standards alignment + prerequisites (3 fields per skill) | ⬜ Not started | 0 | All 45 skills |

**Phase B quality gap (not blocking):** 29 skills were applied from collapsed CSVs — `construct_actually_tested` strings are repeated across questions within each skill. The app functions, but regen will produce unique, specific constructs. Use `content-authoring/phase-B/PHASE-B-REGEN-WORKFLOW.md` + `extract_phase_b_batch.py` to regenerate and re-apply skill by skill (idempotent — `apply-phase-b.mjs` will log overwrites).

**Phase B hard gap (8 questions):** `item_056`, `item_077`, `item_090`, `item_162`, `item_167`, `item_200`, `item_232`, `item_235` — all ACA-06 legacy-format questions. No Phase B CSV entry exists for them. Need manual authoring.

---

## Lessons Learned — Template Collapse (Phase B)

**What happened:** When agents classified long batches (20–45 questions) in a single session, context fatigue caused them to converge on a generic construct string and reuse it across all remaining questions in the skill. In the worst cases, all 32 questions in a skill had identical `construct_actually_tested` values.

**How we detect it:** Count `unique_construct_values / total_rows` per skill CSV file. Threshold: ≥80% = clean; <80% = collapsed.

**How we prevent it:** Maximum 10 questions per agent session. Uniqueness check built into the Coworker prompt as an explicit constraint ("no two questions may share the same string"). Variety audit run before any CSV is applied to `questions.json`.

**Why it matters:** A construct that reads "Interpretation of norm-referenced psychoeducational scores" for all 22 questions in PSY-01 tells us nothing about what each question actually tests. The field becomes useless for adaptive targeting and study plan personalization.

---

## The Four Phases of Authoring Work

| Phase | What | Per | Missing Count | Depends On |
|-------|------|-----|---------------|------------|
| **A** | Distractor classification (4 fields per wrong answer) | per wrong-answer option | ✅ Complete (15 residual gaps accepted) | nothing |
| **B** | Pedagogical rationale (2 fields per question) | per question | 692 questions — 29 collapsed skills need regen | nothing |
| **C** | Error pattern synthesis (3 fields per question) | per question | ~1,150 questions (100%) | Phase A recommended first |
| **D** | Standards alignment + prerequisites (3 fields per skill) | per skill (45 total) | 45 skills (100%) | nothing |

Phases B, C, and D can run in parallel. Phase C is richer when Phase A is done first (it synthesizes across distractors), but it can start on well-understood questions.

---

## Phase A — Distractor Classification

**Status: COMPLETE as of 2026-04-01.** 3,587 distractor slots applied to `src/data/questions.json` at 98.7% coverage. All 44 active skill CSVs are archived in `content-authoring/phase-A/output/`. The GPT-4o pipeline that generated them is archived in `content-authoring/phase-A/pipeline/`.

**Known quality issues (not yet corrected):**
- 47 questions use a generic "Student may have confused X with Y" framing instead of the required first-person belief statement. Acceptable for now.
- 3 questions have genuinely duplicate misconception text across two distractors in the same question.
- 15 blank slots across 8 skills — unusual answer structures (E/F placeholders). Accepted as-is.

For new Phase A work (if a future question bank expansion occurs), use `docs/DISTRACTOR_CLASSIFICATION_HANDOFF.md` as the agent-facing prompt document.

**Work unit:** one wrong-answer option at a time.

Every wrong-answer option needs **four fields** that describe the reasoning error a student makes when choosing it.

---

### Field A-1: `distractor_tier`

How attractive and dangerous is this wrong answer to a partially-prepared student?

| Value | Who picks it | Characteristics |
|-------|-------------|-----------------|
| `L1` | Students with real knowledge but a specific gap. High-plausibility near-miss. | Based on a real concept they know but are misapplying. Requires careful reading and genuine mastery to reject. Most dangerous. |
| `L2` | Students with surface-level knowledge. Common confusion between related things. | Based on a plausible but incorrect connection — similar terms, partial understanding, or adjacent concepts. |
| `L3` | Students who have not studied, or are guessing. Low plausibility. | Confuses a basic concept, applies logic from a different context entirely, or invents a criterion that doesn't exist in the field. |

**Distribution guide:** A well-written 4-option question typically has 1 L1, 1–2 L2, and 1 L3. Follow the content — don't assign mechanically.

---

### Field A-2: `distractor_error_type`

What cognitive failure does choosing this wrong answer represent?

| Value | When to use | Ask yourself |
|-------|-------------|--------------|
| `Conceptual` | The student has the wrong mental model. They misunderstand the concept, principle, or theory. | Does the student's error reveal that they believe something false about the world? |
| `Procedural` | The student understands the concept but applies the wrong process, step, or sequence. | Does the error reveal they know WHAT to do but not WHEN or HOW? |
| `Lexical` | The student was confused by similar-sounding or similar-looking terminology. | Would the student have gotten this right if the wording had been slightly different? |

**Tiebreaker:** Conceptual vs. Procedural — if the student has a wrong mental model of what something IS (not how to use it), it's Conceptual. If they know what it is but botched the application step, it's Procedural.

---

### Field A-3: `distractor_misconception`

**A specific, actionable sentence describing exactly what the student believed when they chose this answer.**

This is the highest-stakes field. The platform shows this sentence to students who repeatedly choose the same wrong answer, helping them see their own reasoning error.

**Requirements:**
- Specific to THIS wrong answer, not the question in general
- Written as what the student believed (not what the answer is)
- 15–40 words
- Plain language a student would recognize as their own thinking
- Begins with "Student believed…" or "Student confused…" or "Student assumed…"

| Quality | Example |
|---------|---------|
| ❌ Too generic | "Student may have a misconception about consultation models." |
| ❌ Just describes the wrong answer | "Student chose the answer about special education referral." |
| ❌ Old boilerplate (reject all of these) | "Student mistakenly selects an option related to 'referral' instead of the correct concept." |
| ✅ Specific and useful | "Student confused consultee-centered consultation (which targets the teacher's internal barriers) with behavioral consultation (which targets the student's behavior through environmental modification)." |
| ✅ Specific and useful | "Student believed FERPA applies universally to all schools, not realizing the federal-funding trigger is what determines applicability." |

**Note:** Any existing field that says "Student mistakenly selects an option related to…" is a boilerplate placeholder. Replace it entirely.

---

### Field A-4: `distractor_skill_deficit`

**The specific knowledge or concept the student is missing — by name — that explains why they chose this wrong answer.**

Format: 5–20 words. A noun phrase, not a full sentence. Name the concept, law, model, or procedure.

| Quality | Example |
|---------|---------|
| ❌ Too vague | "Lacks consultation knowledge" |
| ❌ Just the topic | "FERPA" |
| ✅ Specific | "Caplan's consultee-centered consultation model — distinction between consultee-level and client-level intervention targets" |
| ✅ Specific | "FERPA's federal-funding applicability trigger vs. universal applicability assumption" |
| ✅ Specific | "Behavioral consultation sequence: problem identification → analysis → intervention → evaluation" |

---

### Phase A Output Format

Produce CSV. One row per wrong-answer option.

```
UNIQUEID,distractor_letter,distractor_tier,distractor_error_type,distractor_misconception,distractor_skill_deficit
```

Rules:
- Only rows for WRONG answers (skip correct answers entirely)
- `distractor_letter` is A, B, C, or D
- `distractor_tier` must be exactly: `L1`, `L2`, or `L3`
- `distractor_error_type` must be exactly: `Conceptual`, `Procedural`, or `Lexical`
- Wrap all text values in double quotes; use single quotes inside if needed
- Do NOT add a row for the correct answer

**Example output:**
```csv
UNIQUEID,distractor_letter,distractor_tier,distractor_error_type,distractor_misconception,distractor_skill_deficit
"PQ_CON-01_1","A","L1","Conceptual","Student confused consultee-centered consultation with behavioral consultation — believing the goal is to change the student's behavior through environmental modification rather than addressing the teacher's internal barriers (objectivity, skill, confidence).","Caplan's model: distinction between consultee-centered (targets teacher barriers) and behavioral consultation (targets student behavior)"
"PQ_CON-01_1","C","L2","Procedural","Student believed that when a teacher struggles with a student, the next step is a special education evaluation rather than addressing the teacher's capacity through consultation first.","Consultation-before-referral sequence; consultee-centered consultation as a prerequisite to eligibility evaluation"
"PQ_CON-01_1","D","L3","Conceptual","Student conflated indirect consultation (working through the teacher to help the student) with direct mental health service provision to the student.","Distinction between indirect consultation service delivery and direct student counseling or therapy"
```

---

### Phase A — Worked Examples

#### Example 1: Application — CON-01

```
ID: PQ_CON-01_1
Skill: CON-01 — Consultation Models and Processes
Complexity: Application | Foundational: false

STEM: A school psychologist utilizes consultee-centered consultation to help a
teacher who lacks objectivity regarding a student's behavior. The primary goal is:

A [WRONG]: To change the student's behavior through direct environmental
  modification and behavioral intervention strategies implemented in the classroom.
B [CORRECT]: To address the teacher's internal barriers (e.g., lack of skill or
  objectivity) to improve their service to the student.
C [WRONG]: To refer the student for a comprehensive special education evaluation
  and eligibility assessment through the individualized education program process.
D [WRONG]: To provide direct individual counseling and mental health services to
  the student to address emotional and behavioral concerns.

CORRECT EXPLANATION: Caplan's model specifically targets the consultee's internal
barriers (lack of knowledge, skill, confidence, or objectivity) rather than just
the student's behavior.
```

**Reasoning:**
- **A:** This describes behavioral consultation's goal (change student behavior), not Caplan's consultee-centered model. A student who knows behavioral consultation but blurs the distinction picks this. Near-miss (L1). Mental model confusion about what each model targets → Conceptual.
- **C:** Jumping to special education evaluation skips the consultation layer. This is a sequence error — the student knows referral is real but doesn't know WHEN it's triggered. Moderate plausibility (L2). Wrong step at wrong time → Procedural.
- **D:** Confuses the psychologist's indirect consultation role with direct therapy. Any student who has read about consultation knows it's an indirect service. Low plausibility (L3). Wrong mental model of service delivery mode → Conceptual.

**Output:**
```csv
"PQ_CON-01_1","A","L1","Conceptual","Student confused consultee-centered consultation with behavioral consultation — believing the primary goal is changing the student's behavior through environmental modification rather than addressing the teacher's internal barriers.","Caplan's model: distinction between consultee-centered (targets teacher barriers) and behavioral consultation (targets student behavior)"
"PQ_CON-01_1","C","L2","Procedural","Student believed that when a teacher struggles with a student, the next step is a special education evaluation rather than addressing the teacher's capacity through consultation first.","Consultation-before-referral sequence; consultee-centered consultation as prerequisite to eligibility evaluation"
"PQ_CON-01_1","D","L3","Conceptual","Student conflated indirect consultation (working through the teacher) with direct mental health service provision to the student, not distinguishing the psychologist's indirect consulting role from direct therapy.","Distinction between indirect consultation service delivery and direct student counseling or therapy"
```

---

#### Example 2: Recall — LEG-01

```
ID: PQ_LEG-01_3
Skill: LEG-01 — FERPA and Student Records
Complexity: Recall | Foundational: false

STEM: The Family Educational Rights and Privacy Act (FERPA) applies to:

A [WRONG]: All schools regardless of funding source
B [CORRECT]: Schools that receive federal education funding
C [WRONG]: Only private schools with federal grants
D [WRONG]: Only schools enrolling more than 1,000 students

CORRECT EXPLANATION: FERPA applies to schools receiving federal funding (most
public and many private schools). Options A, C, and D wrongly limit or extend
applicability.
```

**Reasoning:**
- **A:** Overgeneralization — universal vs. conditional applicability. Common trap for students who've studied FERPA but missed the federal-funding trigger. Near-miss (L1). Wrong mental model of the law's scope → Conceptual.
- **C:** Inverts the public/private pattern. A student who vaguely knows FERPA has exceptions might guess private-only. Moderate plausibility (L2). Scope inversion → Conceptual.
- **D:** No enrollment-size criterion exists anywhere in education law. Only a student who has never read FERPA picks this. Low plausibility (L3). Invented criterion → Conceptual.

**Output:**
```csv
"PQ_LEG-01_3","A","L1","Conceptual","Student overgeneralized FERPA's reach, believing it applies to all schools rather than only to those receiving federal education funding — missing the federal-funding trigger as the key applicability condition.","FERPA federal-funding applicability trigger; universal vs. conditional applicability"
"PQ_LEG-01_3","C","L2","Conceptual","Student believed FERPA applies only to private schools with federal grants, possibly inverting the public/private pattern or confusing it with a grant-specific regulation.","FERPA's actual scope: federally funded schools, predominantly public plus many private"
"PQ_LEG-01_3","D","L3","Conceptual","Student invented a non-existent student-population-size criterion for FERPA applicability, indicating no familiarity with the actual federal-funding trigger.","FERPA applicability criteria: federal funding receipt, not school enrollment size"
```

---

#### Example 3: Multi-Select — MBH-03

```
ID: PQ_MBH-03_5
Skill: MBH-03 — Behavior Intervention and Support
Complexity: Application | Foundational: false | Format: Multi-Select

STEM: Which of the following are components of a comprehensive Functional
Behavioral Assessment (FBA)? Select all that apply.

A [CORRECT]: Direct observation of the behavior in natural settings
B [WRONG]:   Administration of a standardized IQ test
C [CORRECT]: Interviews with teachers, parents, and the student
D [CORRECT]: Review of existing records and behavioral data
E [WRONG]:   Placement in a more restrictive educational environment

CORRECT EXPLANATION: A proper FBA uses observation, interviews, and record review
to identify the function of behavior. IQ testing and placement decisions are not
FBA components.
```

**Reasoning:**
- **B:** A student who conflates psychoeducational evaluation with FBA picks this. Common because IQ tests are a real school psychology tool — the student just puts it in the wrong box. Moderate plausibility (L2). Mixing assessment types → Conceptual.
- **E:** Confuses the FBA process (assessment) with a placement decision (outcome informed by FBA). L3 because any prepared student knows placement decisions happen after an FBA, not during it. Sequence inversion → Procedural.

**Output:**
```csv
"PQ_MBH-03_5","B","L2","Conceptual","Student confused a Functional Behavioral Assessment (which assesses behavioral function) with a psychoeducational evaluation (which includes cognitive testing), incorrectly treating IQ assessment as an FBA component.","FBA components vs. psychoeducational evaluation components; FBA targets behavioral function not cognitive ability"
"PQ_MBH-03_5","E","L3","Procedural","Student confused the FBA process (an assessment procedure) with placement decisions (outcomes informed by the FBA), placing a placement change inside the assessment itself rather than recognizing it as a downstream outcome.","FBA as assessment procedure distinct from IEP placement decisions; assessment-before-placement sequence"
```

---

## Phase B — Pedagogical Rationale

**Status: PARTIAL as of 2026-04-01.** 16 clean skills applied (458 rows). 29 collapsed skills need regeneration (692 questions). See `content-authoring/phase-B/PHASE-B-REGEN-WORKFLOW.md`.

**Scale:** 692 questions remaining. **Two fields per question.**
**Work unit:** 10 questions per agent session (larger batches cause template collapse — see Lessons Learned above).
**Runs independently of Phase A.**

These fields explain WHY this question works the way it does — for curriculum design and review purposes.

---

### Field B-1: `complexity_rationale`

**Why is this question rated Recall or Application?**

Every question already has `cognitive_complexity` set to either `Recall` or `Application`. This field explains the reasoning in 1–2 sentences.

| Complexity | Characteristic |
|-----------|---------------|
| `Recall` | Tests whether the student knows a fact, definition, law, rule, or label. "What does FERPA stand for?" "Which law requires FBAs?" The answer is retrievable from memory without analysis. |
| `Application` | Tests whether the student can apply knowledge to a scenario, sequence steps correctly, choose the right tool for a given context, or analyze a situation. Involves decision-making, not just retrieval. |

**Format:** 1–2 sentences. Must reference something specific about the question — not just restate the label.

**Examples:**

| Question | complexity_rationale |
|----------|---------------------|
| "FERPA applies to schools that receive..." | "This is a Recall item because it directly tests factual knowledge of FERPA's scope — the student either knows the federal-funding trigger or they don't. No case analysis or contextual judgment is required." |
| "A school psychologist utilizes consultee-centered consultation to help a teacher who lacks objectivity..." | "This is an Application item because the student must recognize which consultation model fits a described clinical scenario (consultee with objectivity issues) and distinguish it from adjacent models (behavioral, direct-client). Scenario recognition and model selection require more than recall." |

---

### Field B-2: `construct_actually_tested`

**The specific cognitive construct this question measures — by name.**

Not just the skill name. Not "consultation" or "FERPA." The narrow construct within the skill that this specific item targets.

**Format:** 10–30 words. A noun phrase or short description. Reference specific frameworks, laws, models, or concepts by name when possible.

**Examples:**

| Question | construct_actually_tested |
|----------|--------------------------|
| "A school psychologist utilizes consultee-centered consultation to help a teacher who lacks objectivity..." | "Recognition of Caplan's consultee-centered consultation model, specifically the consultee-objectivity problem type, and distinction from behavioral and direct-service models" |
| "FERPA applies to schools that receive..." | "Knowledge of FERPA's federal-funding applicability trigger and its distinction from universal applicability" |
| "Which of the following are FBA components?" | "Discrimination between FBA components (observation, interviews, record review) and non-components (evaluation instruments, placement decisions), with application to a comprehensive assessment context" |

---

### Phase B Output Format

Produce CSV. One row per question.

```
UNIQUEID,complexity_rationale,construct_actually_tested
```

**Example:**
```csv
UNIQUEID,complexity_rationale,construct_actually_tested
"PQ_CON-01_1","This is an Application item because the student must recognize which consultation model matches a scenario involving a consultee with objectivity issues, requiring model selection and distinction from adjacent models rather than simple recall.","Recognition of Caplan's consultee-centered consultation model, specifically the consultee-objectivity problem type, and its distinction from behavioral and direct-service consultation"
"PQ_LEG-01_3","This is a Recall item because it directly tests the student's factual knowledge of FERPA's applicability condition — the federal-funding trigger. No scenario analysis or decision-making is required.","Knowledge of FERPA's federal-funding applicability trigger and its distinction from a universal applicability assumption"
```

---

## Phase C — Error Pattern Synthesis

**Scale:** ~900 questions. **Three fields per question.**
**Work unit:** one question at a time.
**Best done after Phase A is complete for that question**, but can start independently.

These fields synthesize across all distractors in a question to describe the dominant error landscape — useful for curriculum planning and for the AI tutor's coaching responses.

---

### Field C-1: `dominant_error_pattern`

**The most common or most dangerous reasoning failure that a student who misses this question is making.**

This is not about one specific distractor — it's about the pattern across ALL distractors. What does a student who gets this question wrong consistently believe?

**Format:** 1–2 sentences. Specific. Names the conceptual confusion or procedural error at the heart of most misses.

**Examples:**

| Question | dominant_error_pattern |
|----------|----------------------|
| CON-01_1 (consultation models) | "Students most commonly confuse consultation model goals — substituting the student-level behavior target (behavioral consultation) for the consultee-level barrier target (consultee-centered). The dominant error is model-goal conflation, not procedural confusion about when to consult." |
| LEG-01_3 (FERPA scope) | "Students most commonly overgeneralize FERPA's scope, believing it applies to all schools regardless of funding. The dominant error is missing the federal-funding conditionality that defines applicability." |

---

### Field C-2: `error_cluster_tag`

**A short keyword tag for grouping similar error patterns across questions in this skill.**

This enables the platform to say: "You consistently make scope-overgeneralization errors across LEG questions." Tags are 1–4 words, lowercase, hyphenated.

**Suggested tags (you may invent others that fit better):**

| Tag | When to use |
|-----|------------|
| `model-conflation` | Student confuses one named model/framework with another |
| `scope-overgeneralization` | Student applies a rule/law more broadly than it applies |
| `scope-undergeneralization` | Student applies a rule too narrowly |
| `sequence-inversion` | Student reverses the order of steps in a procedure |
| `component-confusion` | Student puts a concept in the wrong category or process |
| `indirect-direct-confusion` | Student confuses indirect and direct service roles |
| `label-retrieval` | Student knows the concept but couldn't retrieve the label |
| `prerequisite-skipping` | Student jumps to a later step before completing earlier ones |
| `purpose-confusion` | Student knows a tool exists but misidentifies what it's for |
| `overgeneralization` | General pattern of applying rules too broadly |

**Format:** 1–4 hyphenated lowercase words. One tag per question.

---

### Field C-3: `instructional_red_flags`

**What a teacher or coach should watch for when a student consistently misses this question.**

This is the actionable takeaway for instruction: if a student gets this wrong, what does that signal and what is the targeted remedy?

**Format:** 2–4 sentences. Specific. References what the student needs to distinguish, review, or practice.

**Example:**

| Question | instructional_red_flags |
|----------|------------------------|
| CON-01_1 | "A student who misses this item likely cannot discriminate Caplan's consultee-centered consultation from behavioral consultation. The key signal is whether they chose option A (model-goal confusion) vs. option D (indirect/direct confusion) — different remediation paths. Teach: draw the consultation model comparison table, emphasizing that consultee-centered targets the TEACHER's barriers while behavioral consultation targets the STUDENT's behavior. Have the student explain back in their own words which model applies when." |

---

### Phase C Output Format

Produce CSV. One row per question.

```
UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags
```

---

## Phase D — Standards Alignment and Prerequisites

**Scale:** 45 skills (not 1,150 questions). One set of fields per skill, then applied to all questions in that skill.
**Work unit:** one skill at a time.
**Fully independent — can run in parallel with all other phases.**

These fields exist at the skill level. The platform uses them to build the study guide and learning path sequence.

---

### Field D-1: `skill_prerequisites`

**What must a student know before this skill can be learned?**

List the prerequisite skills or knowledge areas. Can reference other skill IDs from the 45-skill list, or name foundational concepts that aren't tied to a specific skill.

**Format:** Bulleted list, 3–8 items. Mix of skill IDs and concept names.

**Example for CON-01 (Consultation Models and Processes):**
```
- Basic understanding of the helping professions (psychologist vs. counselor vs. social worker roles)
- Definition of consultation as an indirect service delivery model
- Distinction between direct and indirect services in school psychology
- Basic knowledge that multiple consultation models exist (not just one)
- General understanding of what a school psychologist does day-to-day
```

---

### Field D-2: `prereq_chain_narrative`

**A 2–4 sentence description of the learning sequence for this skill.**

Describes how a student moves from prior knowledge to mastery of this skill, and what this skill unlocks for future learning.

**Format:** 2–4 sentences. Reads like a mini-learning progression description.

**Example for CON-01:**
"A student approaching consultation models must first understand that school psychology practice includes both direct services (working with students) and indirect services (working through teachers and parents). With that foundation, the student can learn that multiple distinct consultation models exist — behavioral, consultee-centered, conjoint, mental health — each with different goals and consultee roles. Mastering CON-01 unlocks CON-02 (collaborative problem-solving) and CON-03 (systems-level consultation) by establishing the framework within which more complex consultation skills are applied."

---

### Field D-3: `nasp_domain_primary`

**Which NASP Practice Domain does this skill primarily belong to?**

The National Association of School Psychologists defines 10 domains of practice. Assign the single best-fit domain.

| Domain Code | NASP Practice Domain |
|-------------|---------------------|
| `NASP-1` | Data-Based Decision Making and Accountability |
| `NASP-2` | Consultation and Collaboration |
| `NASP-3` | Academic Interventions |
| `NASP-4` | Mental and Behavioral Health Services |
| `NASP-5` | School-Wide Practices to Promote Learning |
| `NASP-6` | Preventive and Responsive Services |
| `NASP-7` | Family-School Collaboration Services |
| `NASP-8` | Diversity in Development and Learning |
| `NASP-9` | Research and Evidence-Based Practice |
| `NASP-10` | Legal, Ethical, and Professional Practice |

**Note:** Many skills are cross-domain. Choose the domain that most directly corresponds to the skill's primary focus. Brief rationale (1 sentence) is helpful but not required.

---

### Phase D Output Format

Produce JSON. One object per skill.

```json
[
  {
    "skill_id": "CON-01",
    "nasp_domain_primary": "NASP-2",
    "skill_prerequisites": "- Basic understanding of direct vs. indirect service delivery\n- Familiarity with school psychologist role\n- Understanding that multiple consultation models exist",
    "prereq_chain_narrative": "A student approaching consultation models must first understand that school psychology practice includes both direct and indirect services. With that foundation, the student can learn that multiple distinct consultation models — behavioral, consultee-centered, conjoint — each serve different goals and involve different consultant-consultee dynamics. Mastering CON-01 unlocks CON-02 and CON-03 by establishing the framework for more complex consultation applications."
  }
]
```

---

## The 45 Skills — Reference Table

| Skill ID | Skill Name | Primary Domain |
|----------|-----------|----------------|
| CON-01 | Consultation Models and Processes | Consultation & Collaboration |
| CON-02 | Collaborative Problem-Solving | Consultation & Collaboration |
| CON-03 | Systems-Level Consultation | Consultation & Collaboration |
| DBD-01 | Problem Identification and Referral | Data-Based Decision Making |
| DBD-02 | Standardized Assessment Selection | Data-Based Decision Making |
| DBD-03 | Psychoeducational Assessment | Data-Based Decision Making |
| DBD-04 | Cognitive and Neuropsychological Assessment | Data-Based Decision Making |
| DBD-05 | Social-Emotional and Behavioral Assessment | Data-Based Decision Making |
| DBD-06 | Test Score Interpretation | Data-Based Decision Making |
| DBD-07 | Progress Monitoring and CBM | Data-Based Decision Making |
| DBD-08 | Data-Based Decision Making in MTSS | Data-Based Decision Making |
| DBD-09 | Report Writing | Data-Based Decision Making |
| DBD-10 | Psychometrics and Test Development | Data-Based Decision Making |
| ACA-01 | Reading Intervention | Academic Intervention |
| ACA-02 | Math Intervention | Academic Intervention |
| ACA-03 | Written Language Intervention | Academic Intervention |
| ACA-04 | Evidence-Based Academic Interventions | Academic Intervention |
| ACA-05 | Instructional Design | Academic Intervention |
| ACA-06 | Academic Enablers | Academic Intervention |
| ACA-07 | Learning Disabilities Identification | Academic Intervention |
| ACA-08 | Special Education Law and Eligibility | Academic Intervention |
| ACA-09 | Gifted Education | Academic Intervention |
| MBH-01 | Mental Health Assessment | Behavior & Mental Health |
| MBH-02 | Counseling and Psychotherapy | Behavior & Mental Health |
| MBH-03 | Behavior Intervention and Support | Behavior & Mental Health |
| MBH-04 | Social-Emotional Learning | Behavior & Mental Health |
| MBH-05 | Trauma-Informed Practice | Behavior & Mental Health |
| LEG-01 | FERPA and Student Records | Legal & Ethics |
| LEG-02 | IDEA and Special Education Law | Legal & Ethics |
| LEG-03 | Section 504 and ADA | Legal & Ethics |
| LEG-04 | Confidentiality and Privilege | Legal & Ethics |
| ETH-01 | Ethical Decision-Making | Legal & Ethics |
| ETH-02 | Professional Standards and NASP Ethics | Legal & Ethics |
| ETH-03 | Supervision and Professional Development | Legal & Ethics |
| SAF-01 | Crisis Prevention and Preparedness | Crisis & Safety |
| SAF-02 | Suicide Risk Assessment | Crisis & Safety |
| SAF-03 | Crisis Intervention and Response | Crisis & Safety |
| SAF-04 | Child Abuse and Mandatory Reporting | Crisis & Safety |
| SWP-01 | MTSS and System-Wide Support | School-Wide Systems |
| SWP-02 | Universal Screening | School-Wide Systems |
| SWP-03 | School Climate and Engagement | School-Wide Systems |
| SWP-04 | Implementation Science and Fidelity | School-Wide Systems |
| DIV-01 | Cultural and Linguistic Diversity in Assessment | Diversity & Equity |
| DIV-03 | Culturally Responsive Practice | Diversity & Equity |
| DIV-05 | Disproportionality and Equity | Diversity & Equity |
| RES-02 | Research Design and Methodology | Research & Evaluation |
| RES-03 | Statistics and Data Interpretation | Research & Evaluation |
| DEV-01 | Child and Adolescent Development | Cross-Cutting |
| PSY-01 | Psychopathology and Diagnosis | Cross-Cutting |
| PSY-02 | Neurodevelopmental Disorders | Cross-Cutting |
| PSY-03 | Psychopharmacology | Cross-Cutting |
| PSY-04 | Family Systems | Cross-Cutting |
| FAM-02 | Family Engagement and Communication | Cross-Cutting |

---

## Priority Order — Highest Impact First

Work skill-by-skill. Phase A first within each skill, then B and C.

### Phase A Priority (by question count — most questions = most distractor slots):

| Rank | Skill | Questions | Distractor Slots to Fill |
|------|-------|-----------|--------------------------|
| 1 | MBH-03 | 38 | ~114 |
| 2 | LEG-02 | 37 | ~111 |
| 3 | CON-01 | 34 | ~102 |
| 4 | DBD-03 | 33 | ~99 |
| 5 | ETH-01 | 33 | ~99 |
| 6 | DBD-01 | 32 | ~96 |
| 7 | SAF-03 | 32 | ~96 |
| 8 | SWP-04 | 32 | ~96 |
| 9 | SAF-01 | 29 | ~87 |
| 10 | ACA-06 | 28 | ~84 |
| 11 | DBD-06 | 27 | ~81 |
| 12 | LEG-01 | 26 | ~78 |
| 13 | MBH-02 | 26 | ~78 |
| 14 | ACA-04 | 25 | ~75 |
| 15 | SAF-02 | 25 | ~75 |
| … | Continue through all 45 skills | | |

### Phase D Priority (standards alignment — suggested order by skill cluster):

Start with the Legal & Ethics cluster (LEG + ETH), then Safety (SAF), then Consultation (CON), then Data-Based (DBD), then the remaining clusters.

---

## Parallelization Strategy

If multiple agents are running simultaneously:

| Agent | Assignment |
|-------|-----------|
| Agent 1 (Opus) | Phase A — MBH-03, LEG-02, CON-01 (high complexity, clinical judgment required) |
| Agent 2 (Opus) | Phase A — ETH-01, ETH-02, ETH-03, LEG-03, LEG-04 (ethics and legal require precision) |
| Agent 3 (GPT-4o/Gemini) | Phase A — DBD-01 through DBD-10 (psychometrics, data-based; more technical, less clinical) |
| Agent 4 (any) | Phase D — All 45 skills for standards alignment (lighter cognitive load per item) |
| Agent 5 (any) | Phase B — complexity_rationale and construct_actually_tested (can run alongside Phase A output) |

**Model recommendation:**
- **Claude Opus:** Use for MBH (behavior, mental health), LEG, ETH, SAF — these require nuanced clinical and ethical reasoning.
- **GPT-4o / Gemini:** Acceptable for DBD (psychometrics, test interpretation), ACA (academic intervention), SWP (systems), RES (research methods) — more factual and technical.

---

## Quality Standards

### A Phase A submission passes if:

- `distractor_misconception` is specific to this wrong answer — not reusable for any other distractor in the question
- `distractor_skill_deficit` names a specific concept, model, law, or procedure — not just a topic word
- `distractor_tier` reflects reasoning about student preparation level — not mechanically assigned
- `distractor_error_type` correctly identifies the type of failure (mental model, process, terminology) — not always `Conceptual` by default

### A Phase B submission passes if:

- `complexity_rationale` references something specific about this question's structure, not just the Recall/Application label
- `construct_actually_tested` is narrower than the skill name — it names the specific sub-construct within the skill

### A Phase C submission passes if:

- `dominant_error_pattern` synthesizes across all distractors — not just describing one distractor
- `error_cluster_tag` is consistent with how other questions in the same skill are tagged (check for consistency)
- `instructional_red_flags` distinguishes between different wrong-answer paths (not one-size advice)

### A Phase D submission passes if:

- `skill_prerequisites` lists specific concepts or skill IDs — not just "prior knowledge"
- `prereq_chain_narrative` explains what this skill unlocks downstream, not just what precedes it
- `nasp_domain_primary` is the primary domain — secondary domains can be noted but one must be primary

---

## Checkpoint Protocol

After every 5 questions in Phase A, re-read your last 5 `distractor_misconception` fields and ask:

> *Could any of these apply to a different question in this skill? Or to a different wrong answer in the same question?*

If yes, rewrite that field to be more specific. This is the most common quality drift point.

After every 10 questions in Phase B, check: are your `complexity_rationale` fields using different language and specific references to question content, or are they getting formulaic?

---

## What NOT To Do

- **Do not** write code of any kind
- **Do not** modify any files
- **Do not** change question text, correct answers, or correct explanations
- **Do not** use the boilerplate phrase "Student mistakenly selects an option related to…" — this is the old placeholder being replaced
- **Do not** use vague tier assignments (all L2, or alternating L1/L2/L3 mechanically)
- **Do not** write skill-deficit fields that are just one or two words ("Consultation," "FERPA")
- **Do not** reference concepts outside Praxis School Psychology domain
- **Do not** skip questions — every question in the batch needs all fields
- **Do not** add rows for correct answers in Phase A output

---

## Scope Summary

| Phase | Fields | Status | Remaining Work |
|-------|--------|--------|----------------|
| A — Distractor classification | 4 per wrong answer | ✅ Complete (98.7%) | 15 residual gaps accepted |
| B — Pedagogical rationale | 2 per question | 🔄 Partial (39.8% construct, 49.6% rationale) | 692 questions × 29 skills |
| C — Error pattern synthesis | 3 per question | ⬜ Not started | 1,150 questions |
| D — Standards alignment | 3 per skill | ⬜ Not started | 45 skills |

Phase A is the largest completed body of work: 3,587 distractor slots classified across 44 skills. Phase B requires regen for 29 skills before it can be fully applied. Phases C and D have not been started.

---

## Final Note

The data you produce directly powers the student-facing misconception detection, adaptive question routing, study plan generation, and AI tutor coaching. Low-quality entries (generic misconceptions, vague skill deficits) produce low-quality student feedback. High-quality entries produce recommendations like: "You've missed 4 questions in a row that test model-goal conflation in consultation — here's the specific distinction you need to lock in." That specificity is only possible if this data is specific.
