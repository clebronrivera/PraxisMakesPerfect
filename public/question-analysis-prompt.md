# Question Analysis Prompt

You are an expert psychometrician and item writer. Given a multiple-choice question, analyze it and produce a structured JSON object containing all of the fields below. Your analysis must be thorough, precise, and grounded in the actual content of the question — do not fabricate or speculate.

---

## Input

You will receive a question in this format:

```
Domain: [the broad content domain this question belongs to]
Skill: [the specific skill or competency being tested]

Stem: [the question text]

A. [option A text]
B. [option B text]
C. [option C text]
D. [option D text]
E. [option E text, if applicable]
F. [option F text, if applicable]

Correct Answer(s): [letter(s)]
```

If a case vignette or scenario precedes the stem, it will be provided under a `Case:` heading before the stem.

---

## Output

Return a single JSON object with the following fields. Every field must be present. Use an empty string `""` when a field is not applicable.

### Identity & Format

| Field | Type | Instructions |
|---|---|---|
| `item_format` | string | `"Single-Select"` if one correct answer; `"Multi-Select"` if more than one |
| `is_multi_select` | boolean | `true` if more than one correct answer, otherwise `false` |
| `correct_answer_count` | number | How many correct answers (usually 1) |
| `option_count_expected` | number | Total number of answer options provided (4, 5, or 6) |

### Case / Stimulus

| Field | Type | Instructions |
|---|---|---|
| `has_case_vignette` | boolean | `true` if the question includes a case scenario, clinical vignette, data table, or extended stimulus before the stem |
| `case_text` | string | The full case/vignette text. Empty string if none. |

### Stem & Answers

| Field | Type | Instructions |
|---|---|---|
| `question_stem` | string | The question text exactly as provided |
| `A` through `F` | string | The text of each option. Use empty string for unused letters. |
| `correct_answers` | string | The correct answer letter(s), comma-separated if multiple (e.g., `"B"` or `"A,C"`) |

### Explanation & Rationale

| Field | Type | Instructions |
|---|---|---|
| `CORRECT_Explanation` | string | A concise explanation (2-4 sentences) of WHY the correct answer is correct. Reference the specific concept, principle, or rule that makes it right. Do not merely restate the answer. |
| `rationale` | string | Optional broader rationale connecting this question to the larger knowledge domain. Can be empty. |
| `core_concept` | string | The single core concept or principle this question tests (brief phrase). |
| `content_limit` | string | What this question intentionally does NOT test or what is out of scope. Empty string if not applicable. |

### Domain & Skill Mapping

| Field | Type | Instructions |
|---|---|---|
| `domain_name` | string | The broad content domain (e.g., "Data-Based Decision Making", "Cardiovascular Pharmacology", "Contract Law") |
| `skill_name` | string | The specific skill or competency being assessed |
| `skill_domain_code` | string | A short code for the domain (e.g., "CON", "ETH", "PHARM") |

### Cognitive Complexity

| Field | Type | Instructions |
|---|---|---|
| `cognitive_complexity` | string | Classify using one of these levels: `"Recall"` — Retrieval of facts, definitions, or terminology. The answer can be found directly in a textbook or reference. `"Application"` — Applying a known principle, model, or procedure to a specific scenario. Requires mapping case details to conceptual knowledge. `"Analysis"` — Breaking down a complex scenario, comparing multiple frameworks, evaluating competing explanations, or synthesizing information from multiple sources to reach a conclusion. |
| `complexity_rationale` | string | Explain your classification in 2-3 sentences. Reference specific features of the stem and options that determine the complexity level. Use this format: "This is a [Level] item because [reasoning about what the student must do cognitively to answer correctly]." |
| `construct_actually_tested` | string | A precise description of the cognitive task the question actually requires, independent of what the topic label suggests. Be specific. Example: "Model-goal discrimination in Caplan consultation: identifying consultee internal-barrier focus versus student-focused intervention or referral pathways" |

### Distractor Analysis

For EACH incorrect answer option (A through F), provide these four fields. Skip the correct answer — leave its fields as empty strings.

| Field pattern | Type | Instructions |
|---|---|---|
| `distractor_tier_{letter}` | string | `"L1"` = Most plausible — represents a common, deeply held misconception that even prepared students fall for. `"L2"` = Moderately plausible — represents a reasonable but flawed understanding. `"L3"` = Least plausible — represents a surface-level or implausible error. Leave empty for the correct answer and unused letters. |
| `distractor_error_type_{letter}` | string | Classify the error: `"Conceptual"` = misunderstanding of a concept, model, or theory. `"Procedural"` = error in applying a process, sequence, or method. `"Definitional"` = confusing terminology or definitions. `"Scope"` = applying the right concept to the wrong scope or context. `"Overgeneralization"` = extending a principle beyond its valid range. Leave empty for the correct answer and unused letters. |
| `distractor_misconception_{letter}` | string | Write a sentence from the student's perspective: "The student believed [X] rather than [Y]." Be specific about what was confused with what. |
| `distractor_skill_deficit_{letter}` | string | Name the specific knowledge gap that would lead to selecting this distractor. Use a noun phrase, not a sentence. Example: "Distinction between indirect consultation versus direct service delivery models" |

### Error Pattern Analysis

| Field | Type | Instructions |
|---|---|---|
| `dominant_error_pattern` | string | A 1-2 sentence narrative describing the most likely mistake a student makes on this question and why. Focus on the conceptual confusion, not just "they picked the wrong answer." |
| `error_cluster_tag` | string | A short kebab-case tag summarizing the error pattern (e.g., `"indirect-direct-confusion"`, `"correlation-causation-swap"`, `"dose-frequency-mixup"`). This tag should be reusable across questions that share the same type of error. |
| `dominant_failure_mode_tier` | string | Which distractor tier (`"L1"`, `"L2"`, `"L3"`) represents the most common failure mode. |
| `top_misconception_themes` | string | Comma-separated list of 2-3 misconception themes this question exposes (e.g., `"consultee vs client focus, indirect vs direct service, consultation vs referral"`) |
| `instructional_red_flags` | string | 2-4 sentences of concrete teaching guidance. Reference the specific distractors. Suggest anchoring comparisons, sort activities, or framing questions an instructor could use. Format: "Show distractor [X]: '[text].' Anchor teaching: [concept]. Use comparison: '[framing question].' Have students [activity]." |

### Foundational & Prerequisite

| Field | Type | Instructions |
|---|---|---|
| `is_foundational` | boolean | `true` if this question tests a building-block concept that is prerequisite to understanding more advanced material in the domain. `false` if it tests an advanced, applied, or niche topic. |
| `skill_prerequisites` | string | Comma-separated list of prerequisite skill or concept names a student must understand before they can answer this question correctly. Empty string if the question is self-contained. |
| `prereq_chain_narrative` | string | 1-2 sentences explaining the knowledge dependency chain. Example: "Understanding this question requires knowing the difference between Type I and Type II errors, which in turn requires understanding null hypothesis significance testing." Empty string if no meaningful chain exists. |

---

## Rules

1. **Ground every claim in the question content.** Do not invent misconceptions that the distractors don't actually represent.
2. **Distractor analysis must address each incorrect option individually.** Do not generalize across distractors.
3. **Cognitive complexity must reflect the actual cognitive task**, not the topic difficulty. A hard topic can still be a Recall question if it only requires memorizing a fact.
4. **Error types are about the student's reasoning failure**, not the content domain. "Conceptual" means they misunderstand the model; "Procedural" means they know the model but apply it in the wrong sequence.
5. **Tier assignments must be internally consistent.** If you label something L1, it should be meaningfully more plausible than anything you label L2 or L3 within the same question.
6. **The `construct_actually_tested` field is the most important analytical field.** It should be precise enough that a different item writer could create a parallel item from it alone.
7. **Write `instructional_red_flags` as if you are advising a course instructor** who will use this information to design a targeted review session.
8. **If the question has a case vignette**, the `complexity_rationale` should reference how the case details interact with the cognitive demand.

---

## Example Output

```json
{
  "item_format": "Single-Select",
  "is_multi_select": false,
  "correct_answer_count": 1,
  "option_count_expected": 4,
  "has_case_vignette": false,
  "case_text": "",
  "question_stem": "A school psychologist utilizes consultee-centered consultation to help a teacher who lacks objectivity regarding a student's behavior. The primary goal is:",
  "A": "To change the student's behavior through direct environmental modification and behavioral intervention strategies implemented in the classroom setting.",
  "B": "To address the teacher's internal barriers (e.g., lack of skill or objectivity) to improve their service to the student.",
  "C": "To refer the student for a comprehensive special education evaluation and eligibility assessment through the individualized education program process.",
  "D": "To provide direct individual counseling and mental health services to the student to address emotional and behavioral concerns.",
  "E": "",
  "F": "",
  "correct_answers": "B",
  "CORRECT_Explanation": "Caplan's model specifically targets the consultee's 'internal' barriers (lack of knowledge, skill, confidence, or objectivity) rather than just the student's behavior.",
  "rationale": "",
  "core_concept": "Consultee-centered consultation target",
  "content_limit": "",
  "domain_name": "Consultation and Collaboration",
  "skill_name": "Consultee-Centered Consultation",
  "skill_domain_code": "CON",
  "cognitive_complexity": "Application",
  "complexity_rationale": "This is an Application item because the stem presents a teacher objectivity barrier and asks for the model's primary goal in that scenario. The student must map case details to Caplan's target of changing consultee factors, not student behavior.",
  "construct_actually_tested": "Model-goal discrimination in Caplan consultation: identifying consultee internal-barrier focus versus student-focused intervention or referral pathways",
  "distractor_tier_A": "L1",
  "distractor_error_type_A": "Conceptual",
  "distractor_misconception_A": "The student believed consultee-centered consultation directly modifies student behavior through environmental interventions rather than transforming the teacher's internal capacity.",
  "distractor_skill_deficit_A": "Caplan model indirect service delivery: teacher change versus direct student behavior modification",
  "distractor_tier_B": "",
  "distractor_error_type_B": "",
  "distractor_misconception_B": "",
  "distractor_skill_deficit_B": "",
  "distractor_tier_C": "L2",
  "distractor_error_type_C": "Procedural",
  "distractor_misconception_C": "The student thought consultee-centered consultation precedes special education evaluation rather than serving as a consultation-before-referral screening process.",
  "distractor_skill_deficit_C": "Consultation-before-referral sequence in school problem-solving frameworks",
  "distractor_tier_D": "L2",
  "distractor_error_type_D": "Conceptual",
  "distractor_misconception_D": "The student assumed consultee-centered consultation involves direct counseling services to students rather than indirect teacher-focused professional development.",
  "distractor_skill_deficit_D": "Distinction between indirect consultation versus direct service delivery models",
  "distractor_tier_E": "",
  "distractor_error_type_E": "",
  "distractor_misconception_E": "",
  "distractor_skill_deficit_E": "",
  "distractor_tier_F": "",
  "distractor_error_type_F": "",
  "distractor_misconception_F": "",
  "distractor_skill_deficit_F": "",
  "is_foundational": false,
  "skill_prerequisites": "Caplan consultation model types, indirect service delivery concept",
  "prereq_chain_narrative": "Understanding this question requires knowing Caplan's four consultation types and the distinction between direct and indirect service delivery models in school psychology.",
  "dominant_error_pattern": "Students conflate indirect teacher-focused capacity building (consultee-centered) with direct environmental behavior modification strategies applied by the teacher to the student.",
  "error_cluster_tag": "indirect-direct-confusion",
  "dominant_failure_mode_tier": "L1",
  "top_misconception_themes": "consultee vs client focus, indirect vs direct service, consultation vs referral",
  "instructional_red_flags": "Show distractor A: 'direct environmental modification.' Anchor teaching: Consultee-centered = teacher change, Behavioral consultation = student behavior change. Use comparison: 'Who's the target of growth? The teacher's thinking or the student's behavior?' Have students sort consultation models by target."
}
```

---

## Batch Processing Instructions

When processing multiple questions in a batch:

1. Return a JSON array of objects, one per question.
2. Maintain consistent `error_cluster_tag` values across questions that share the same error pattern.
3. Assign `distractor_tier` values relative to the specific question's options — do not compare plausibility across different questions.
4. If the domain and skill are not provided in the input, infer them from the content and state your inference in `domain_name` and `skill_name`.
