# Distractor Classification Handoff
**Task type:** Content authoring — classification and description writing
**Do NOT write or change any code.**
**Do NOT modify any files.**
**Your only job is to produce classification data as structured CSV output.**

---

## What This Project Is

**Praxis Makes Perfect** is an adaptive exam-prep platform for the **Praxis School Psychology (5403)** licensing exam. The question bank contains 1,150 multiple-choice questions covering school psychology practice across 45 skills in 4 Praxis 5403 domains.

The platform has a misconception-detection system. It tracks which wrong answers students choose repeatedly. For that system to be useful, every wrong-answer option in every question needs four pieces of metadata:

1. **distractor_tier** — how dangerous/attractive this wrong answer is
2. **distractor_error_type** — what category of reasoning failure it represents
3. **distractor_misconception** — a specific sentence describing what the student believed when they chose this wrong answer
4. **distractor_skill_deficit** — the specific knowledge gap or skill deficiency that explains the error

**Currently, all 3,948 wrong-answer slots have empty or templated placeholder values.** Your job is to fill them in correctly by reading each question and its wrong-answer choices, reasoning about what a real student would be thinking when they picked each wrong option, and producing the four classification fields.

---

## The Four Fields You Must Fill In

### Field 1: `distractor_tier`

How attractive and dangerous is this wrong answer to a student who hasn't fully mastered the skill?

| Value | Meaning | Who picks it |
|-------|---------|--------------|
| `L1` | **Near-miss / highly plausible.** Based on a real concept the student knows but is misapplying. Requires careful reading and genuine mastery to reject. | Students with moderate to strong preparation who have a specific gap |
| `L2` | **Partially plausible.** Based on a common confusion between similar terms, concepts, or procedures. A student who has studied but not consolidated would pick this. | Students with surface-level knowledge |
| `L3` | **Implausible to a prepared student.** Confuses a basic concept, applies logic from an entirely different context, or is a simple factual error. A well-prepared student rejects it quickly. | Students who have not studied or who are guessing |

**Rule:** Most well-written multiple-choice questions have 1 L1 distractor, 1-2 L2, and 1 L3. But follow the content — some questions have 2 L1s.

---

### Field 2: `distractor_error_type`

What type of reasoning error does picking this wrong answer represent?

| Value | Meaning | Example |
|-------|---------|---------|
| `Conceptual` | The student doesn't understand the underlying concept, principle, model, or theory. They have the wrong mental model. | Confusing "norm-referenced" with "criterion-referenced" |
| `Procedural` | The student understands the concept but applies the wrong process, sequence, or action step. | Knowing what an FBA is but choosing the wrong step in the sequence |
| `Lexical` | The student was confused by similar terminology — words that sound alike, look alike, or share meaning in a different context. | Confusing "concurrent validity" with "convergent validity" |

**Rule:** When in doubt between Conceptual and Procedural, ask: *Does this error reveal a wrong mental model (Conceptual) or a right model applied incorrectly (Procedural)?*

---

### Field 3: `distractor_misconception`

A **specific, actionable sentence** describing exactly what the student believed when they chose this answer. This is the most important field.

**Must be:**
- Specific to THIS wrong answer (not generic)
- Written as what the student believed, not just what's wrong
- 15–35 words
- In plain language a student would understand

**Bad (too generic):**
> "Student may have a misconception about consultation models."

**Good (specific):**
> "Student confused consultee-centered consultation (which targets the teacher's internal barriers) with behavioral consultation (which targets the student's behavior directly)."

**Bad (just describes the wrong answer):**
> "Student chose the answer about special education referral."

**Good (explains the reasoning error):**
> "Student believed that when a teacher struggles with a student, the appropriate response is to refer the student for evaluation rather than address the teacher's capacity to help the student."

---

### Field 4: `distractor_skill_deficit`

The **specific knowledge, concept, or skill** the student is missing that explains why they chose this wrong answer. Be concrete. Reference the relevant law, model, concept, or procedure by name when possible.

**Format:** 5–20 words. A noun phrase, not a sentence.

**Bad:** "Lacks consultation knowledge"
**Good:** "Incomplete understanding of Caplan's consultee-centered consultation model, specifically the role of consultee objectivity"

**Bad:** "Does not understand FERPA"
**Good:** "Confuses FERPA applicability (federal-funding trigger) with universal applicability to all schools"

---

## The 45 Skills (Skill ID → Full Name)

Use this table to understand what each skill is testing when you read a question.

| Skill ID | Skill Name | Domain |
|----------|-----------|--------|
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

## Input Format (What Questions Look Like)

Each question you receive will have this structure:

```
ID: [UNIQUEID]
Skill: [current_skill_id] — [skill_name]
Cognitive Complexity: Recall | Application
Stem: [question text]
Case vignette (if present): [scenario text that precedes the question]
A: [option text]
B: [option text]
C: [option text]
D: [option text]
[E: and F: if present]
CORRECT: [letter(s)]
Correct explanation: [why the correct answer is right]
```

For **multi-select questions** (`correct_answer_count` > 1), the correct answers will be multiple letters (e.g., "A, C"). You only classify the WRONG options — any letter NOT in the correct answers list.

---

## Output Format (What You Must Produce)

Produce a CSV with exactly these columns. One row per wrong-answer distractor.

```
UNIQUEID,distractor_letter,distractor_tier,distractor_error_type,distractor_misconception,distractor_skill_deficit
```

**Rules:**
- Only include rows for WRONG answers (not the correct answer)
- `distractor_letter` is the letter of the wrong option: A, B, C, D, E, or F
- `distractor_tier` must be exactly: `L1`, `L2`, or `L3`
- `distractor_error_type` must be exactly: `Conceptual`, `Procedural`, or `Lexical`
- `distractor_misconception` is a plain-English sentence (no quotes inside the value — use the outer quotes in CSV)
- `distractor_skill_deficit` is a short noun phrase
- Wrap all text fields in double quotes to handle commas within values
- Do NOT include a row for the correct answer

**Example output rows:**
```csv
UNIQUEID,distractor_letter,distractor_tier,distractor_error_type,distractor_misconception,distractor_skill_deficit
"PQ_CON-01_1","A","L1","Conceptual","Student confused consultee-centered consultation with behavioral consultation — believing the goal is to change the student's behavior through environmental modification rather than addressing the teacher's internal barriers.","Caplan's model distinguishing consultee-centered from behavioral consultation goals"
"PQ_CON-01_1","C","L2","Procedural","Student believed that when a teacher struggles with a student, the next step is immediate special education referral rather than consultee-level support.","Premature escalation to evaluation before consultee-level consultation is exhausted"
"PQ_CON-01_1","D","L3","Conceptual","Student conflated consultation (indirect service) with direct counseling — not distinguishing the school psychologist's indirect role in consultation from direct mental health service provision.","Distinction between indirect consultation services and direct student counseling"
```

---

## Three Fully Worked Examples

### Example 1 — Application question (CON-01)

**Input:**
```
ID: PQ_CON-01_1
Skill: CON-01 — Consultation Models and Processes
Cognitive Complexity: Application
Stem: A school psychologist utilizes consultee-centered consultation to help a teacher who lacks objectivity regarding a student's behavior. The primary goal is:
A [WRONG]: To change the student's behavior through direct environmental modification and behavioral intervention strategies implemented in the classroom setting.
B [CORRECT]: To address the teacher's internal barriers (e.g., lack of skill or objectivity) to improve their service to the student.
C [WRONG]: To refer the student for a comprehensive special education evaluation and eligibility assessment through the individualized education program process.
D [WRONG]: To provide direct individual counseling and mental health services to the student to address emotional and behavioral concerns.
Correct explanation: Caplan's model specifically targets the consultee's internal barriers (lack of knowledge, skill, confidence, or objectivity) rather than just the student's behavior.
```

**Reasoning before classifying:**

- **A (Wrong):** This describes *behavioral consultation*, not consultee-centered. A student who knows behavioral consultation but is fuzzy on the distinction will pick this. Strong near-miss (L1). They misapply the right concept to the wrong model → Conceptual.
- **C (Wrong):** Jumping straight to special education referral skips the consultation layer. This is a procedural-sequence error — the student knows referral is a real thing but doesn't understand when it's triggered. L2 because the sequence error is common but not as close as A. Procedural.
- **D (Wrong):** This confuses the school psychologist's *indirect* consultation role with *direct* counseling. Conceptually confuses two distinct service delivery modes. L3 because any student who has read about consultation knows it's not direct therapy. Conceptual.

**Output:**
```csv
"PQ_CON-01_1","A","L1","Conceptual","Student confused consultee-centered consultation with behavioral consultation — believing the goal is changing the student's behavior through environmental modification rather than addressing the teacher's internal barriers (objectivity, skill, confidence).","Caplan's model: distinction between consultee-centered (targets teacher barriers) and behavioral consultation (targets student behavior)"
"PQ_CON-01_1","C","L2","Procedural","Student believed that when a teacher struggles with a student, the next step is a special education evaluation rather than addressing the teacher's capacity through consultation first.","Consultation-before-referral sequence; consultee-centered consultation as a prerequisite to eligibility evaluation"
"PQ_CON-01_1","D","L3","Conceptual","Student conflated indirect consultation (working through the teacher to help the student) with direct mental health service provision to the student.","Distinction between indirect consultation service delivery and direct student counseling or therapy"
```

---

### Example 2 — Recall question (LEG-01)

**Input:**
```
ID: PQ_LEG-01_1
Skill: LEG-01 — FERPA and Student Records
Cognitive Complexity: Recall
Stem: The Family Educational Rights and Privacy Act (FERPA) applies to:
A [WRONG]: All schools regardless of funding source
B [CORRECT]: Schools that receive federal education funding
C [WRONG]: Only private schools
D [WRONG]: Only schools with large student populations
Correct explanation: FERPA applies to schools receiving federal funding (most public and many private schools). Option A is too broad. Options C and D wrongly limit applicability.
```

**Reasoning:**

- **A (Wrong):** This is the "broader than it actually is" trap — universal applicability vs. the federal-funding trigger. Many students overgeneralize. Common and plausible (L1). The student doesn't know the federal-funding trigger → Conceptual.
- **C (Wrong):** Inverts the actual scope — FERPA applies to most public schools, not just private ones. A student who vaguely knows FERPA has exceptions might guess wrong here. L2. Conceptual.
- **D (Wrong):** The "large student populations" criterion doesn't exist anywhere in education law. This is an L3 fabrication that only a student who doesn't know FERPA at all would choose. Conceptual.

**Output:**
```csv
"PQ_LEG-01_1","A","L1","Conceptual","Student overgeneralized FERPA's reach, believing it applies universally to all schools rather than only to those receiving federal education funding.","FERPA's federal-funding applicability trigger; distinction between universal law and conditional applicability"
"PQ_LEG-01_1","C","L2","Conceptual","Student believed FERPA is limited to private schools, possibly confusing it with a different regulatory context or inverting the public/private scope.","FERPA's actual scope: applies to federally funded schools (predominantly public schools, plus many private)"
"PQ_LEG-01_1","D","L3","Conceptual","Student invented a non-existent enrollment-size criterion for FERPA applicability, indicating no familiarity with the actual federal-funding trigger.","FERPA's applicability criteria: federal funding receipt, not school size or population"
```

---

### Example 3 — Multi-select question (MBH-03)

**Input:**
```
ID: PQ_MBH-03_5
Skill: MBH-03 — Behavior Intervention and Support
Cognitive Complexity: Application
Stem: Which of the following are components of a comprehensive Functional Behavioral Assessment (FBA)? Select all that apply.
A [CORRECT]: Direct observation of the behavior in natural settings
B [WRONG]: Administration of a standardized IQ test
C [CORRECT]: Interviews with teachers, parents, and the student
D [CORRECT]: Review of existing records and behavioral data
E [WRONG]: Placement in a more restrictive educational environment
Correct explanation: A proper FBA uses observation, interviews, and record review. IQ testing and placement decisions are not components of an FBA.
```

**Reasoning:**

- **B (Wrong — IQ test):** A student who conflates psychoeducational evaluation with FBA would pick this. The FBA is about function of behavior, not cognitive ability. L2, because the confusion between evaluation types is common. Conceptual.
- **E (Wrong — placement change):** This confuses the FBA (an assessment process) with a placement decision (an outcome). L3 because an FBA precedes and informs placement decisions — it doesn't include them. Procedural (sequence confusion).

**Output:**
```csv
"PQ_MBH-03_5","B","L2","Conceptual","Student confused a Functional Behavioral Assessment (which assesses behavioral function) with a psychoeducational evaluation (which includes cognitive testing), incorrectly including IQ assessment as an FBA component.","FBA components vs. psychoeducational evaluation components; FBA focuses on behavioral function not cognitive ability"
"PQ_MBH-03_5","E","L3","Procedural","Student confused the FBA process (assessment of behavioral function) with placement decisions (outcomes informed by the FBA), placing a placement change inside the assessment process rather than after it.","FBA as assessment procedure distinct from IEP placement decisions; sequence of assessment-before-placement"
```

---

## Priority Order — Process Skills in This Sequence

Work skill-by-skill. This order prioritizes highest-question-count skills first:

1. MBH-03 (38 questions, ~114 distractor slots)
2. LEG-02 (37 questions, ~111 distractor slots)
3. CON-01 (34 questions, ~102 distractor slots)
4. DBD-03 (33 questions, ~99 distractor slots)
5. ETH-01 (33 questions, ~99 distractor slots)
6. DBD-01 (32 questions, ~96 distractor slots)
7. SAF-03 (32 questions, ~96 distractor slots)
8. SWP-04 (32 questions, ~96 distractor slots)
9. SAF-01 (29 questions, ~87 distractor slots)
10. ACA-06 (28 questions, ~84 distractor slots)
11. DBD-06 (27 questions, ~81 distractor slots)
12. MBH-02 (26 questions), LEG-01 (26 questions)
13. Continue through remaining skills

**Do not start a new skill until you have finished all questions for the current skill.**

---

## Batching Strategy

**How to request batches:** You will be given a batch of 20–30 questions at a time from a single skill. Process each batch completely before requesting the next.

**Format for requesting more questions:**
> "Batch [N] complete. Ready for the next 20 questions for [SKILL-ID], starting after [UNIQUEID]."

**Checkpoint rule:** After every 5 questions, re-read your last 5 misconception descriptions and ask: *Are these specific to the individual answer choice, or could they apply to any wrong answer in this question?* If the latter, rewrite them.

---

## Quality Standards

**A classification passes if:**
- The `distractor_misconception` would help a student understand WHY that specific wrong answer is wrong (not just that it's wrong)
- The `distractor_skill_deficit` names the actual knowledge the student is missing (not just the topic)
- The `distractor_tier` is consistent with how attractive the answer would be to a partially-prepared student
- The `distractor_error_type` correctly identifies what kind of thinking failure drives the error

**A classification fails if:**
- The misconception text could apply to any wrong answer in the question ("Student doesn't understand this concept")
- The skill deficit is a single word or topic name only ("Consultation," "FERPA")
- The tier seems assigned mechanically (e.g., all L2) rather than from reasoning about student preparation level
- The error type is always "Conceptual" regardless of whether a procedural or lexical error fits better

---

## What NOT to Do

- **Do not** change any question text, correct answers, or correct explanations
- **Do not** write code of any kind
- **Do not** modify any files
- **Do not** reference concepts outside the Praxis School Psychology domain
- **Do not** produce generic misconception descriptions that aren't tied to the specific wrong answer
- **Do not** skip questions even if they seem easy or obvious — every wrong answer needs all 4 fields

---

## Final Note on Scale

- **Total questions:** 1,150
- **Total wrong-answer slots:** 3,948
- **Recommended model:** Claude Opus for highest-stakes skills (MBH, LEG, SAF, ETH); Gemini or GPT-4o acceptable for more factual/definitional skills (DBD scoring, psychometrics)
- **Estimated batches at 25 questions/batch:** ~46 batches to cover the full bank

The data you produce will be used to power a misconception-detection system that identifies which specific wrong answer patterns individual students repeat, enabling targeted study recommendations. The quality of the misconception text directly determines how useful those recommendations are.
