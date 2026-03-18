# Length-Cuing Audit — Batches 2–10

## What was audited
Questions where the correct answer choice was noticeably longer than the distractors, which can inadvertently cue the student to select the correct answer based on length rather than knowledge.

**Threshold used:** Correct answer > 50 characters longer than the next-longest distractor.

## Summary of fixes applied

| Fix type | Count |
|---|---|
| distractor expansion | 512 |
| semicolon trim | 160 |
| em-dash trim (with parenthetical) | 18 |
| em-dash trim | 16 |
| parenthetical trim | 7 |
| to-clause trim | 4 |
| trailing-clause trim | 4 |
| while-maintaining trim | 4 |
| but-clause trim | 3 |
| and-that-clause trim | 2 |
| monitor-clause trim | 2 |
| trailing-qualifier trim | 1 |
| and-be-aware trim | 1 |
| especially-clause trim | 1 |

**Total edits: 735** across 403 question records.

## Approach used

**Two strategies were applied (not reformatting — only text edits):**

1. **Shorten the correct answer** — removed trailing explanatory clauses appended to core answers. Trims applied: em-dash explanations, semicolon second clauses, purpose clauses ("to give/provide..."), trailing modifiers ("raising concerns about...", "especially during..."), parenthetical asides. Smart em-dash logic: if the pre-dash portion is fewer than 30 characters, a brief parenthetical is retained rather than dropping all explanation.

2. **Expand short distractors** — short fragment distractors (single words, brief labels, terse phrases) were expanded into complete sentences while maintaining their incorrect meaning. Numerical, statistical, and temporal answer choices (e.g., "50%", "2–3 years", "Daily") were left as-is. Expansions use error-type–aware language (see below) rather than generic disclaimers.

## Distractor expansion strategy

Distractors are classified by error type and appended with a semantically appropriate tail drawn from a pool of 5–7 variants. Classification categories:

| Error type | Example trigger | Tail pool flavor |
|---|---|---|
| Scope error | "only …", "just …" | Highlights the narrowness of the focus |
| Absolutist | "always", "never", "automatically" | Challenges the overgeneralization |
| Quantity escalation | "more", "faster", "extend further" | Flags the wrong direction of change |
| Category confusion | "same", "identical", "permanent" | Notes the mismatch in kind, not degree |
| Eliminate / remove | "eliminate", "discontinue" | Flags premature removal |
| Dismissive | "ignore", "disregard", "reject" | Notes what is being overlooked |
| Overstatement | "completely wrong", "proves", "entirely" | Challenges the strength of the claim |
| Wrong action verb | "accept", "argue", "require", "replace" | Identifies the inappropriate action |
| Partial factor | "time of", "teacher qualifications" | Points to the single-variable fallacy |
| Clinical label (terse) | ≤3-word title-case noun phrase, no verb | Provides needed context |
| Fallback | all others | Mixed pool spanning multiple error types |

Tail selection is deterministic and hash-based per distractor text + field, producing stable output across re-runs. **Maximum tail repetition in the final delta: 17×. Unique 5-word tail endings: 269.**

## Changes by batch

| Batch | Edits made |
|---|---|
| Batch 02 | 118 |
| Batch 03 | 44 |
| Batch 04 | 46 |
| Batch 05 | 62 |
| Batch 06 | 81 |
| Batch 07 | 61 |
| Batch 08 | 91 |
| Batch 09 | 135 |
| Batch 10 | 97 |

## Correct-option text rewrites

**223 of the 403 delta records** include a rewrite of the correct answer's text (the letter key is unchanged in every case). These are questions where shortening the correct option was the primary fix. A targeted explanation sanity check for these 223 records is recommended post-merge to confirm the trimmed text remains consistent with its explanation.

## Remaining flagged questions (38)

These questions have correct answers that are still longer than distractors by 50+ characters after automated fixing. The correct answers are well-formed single sentences with no natural trim point, and their distractors are already substantive (60–100+ characters). Manual review recommended before promoting into the canonical bank.

Batch 10 deserves first review priority, especially `LEG` and `RES`. Those domains naturally contain statute-heavy and research-methodology wording, so a domain-aware reviewer may be able to reduce a meaningful share of the remaining flags with targeted edits rather than treating the entire queue as uniformly hard.

| Batch | Q ID | Margin | Correct answer (preview) |
|---|---|---|---|
| 4 | PQ_ACA-06_16 | +65 | Intrinsic motivation fosters deeper engagement, persistence, and conti... |
| 5 | PQ_ACA-09_2 | +85 | The school psychologist coordinates with the school nurse for blood gl... |
| 5 | PQ_ACA-09_8 | +58 | Cognitive-behavioral intervention addressing pain-related anxiety, gra... |
| 5 | PQ_ACA-09_11 | +54 | Communicate with the prescribing physician about medication side effec... |
| 5 | PQ_ACA-09_16 | +55 | Recognize hypoglycemia as a medical emergency, follow the student's di... |
| 5 | PQ_MBH-02_8 | +88 | Teach specific social skills (conversation starting, perspective-takin... |
| 5 | PQ_MBH-02_10 | +67 | When symptoms are severe (suicidal ideation, psychosis), require inten... |
| 5 | PQ_MBH-02_13 | +55 | Exploring the student's ambivalence about change, reflecting back his ... |
| 5 | PQ_MBH-03_9 | +63 | Focusing on solutions and building on strengths and exceptions (times ... |
| 6 | PQ_FAM-02_13 | +55 | Explore potential barriers (transportation, work schedule, trust, lang... |
| 6 | PQ_FAM-03_14 | +57 | Request a copy of the medical information, consult with educators, and... |
| 7 | PQ_SAF-01_17 | +65 | Examine Tier 1 curriculum, instruction quality, and intensity, impleme... |
| 7 | PQ_SWP-03_5 | +61 | Implement with fidelity while allowing adaptation to local context, mo... |
| 8 | PQ_DIV-01_11 | +57 | Assessment instruments may have cultural loading, rely on culturally s... |
| 8 | PQ_DIV-01_12 | +94 | Use the student's home language when possible, or provide bilingual ma... |
| 8 | PQ_DIV-01_15 | +68 | Involve community members in developing behavior expectations that ref... |
| 8 | PQ_DIV-01_19 | +69 | Offer flexible meeting times, alternative communication formats (phone... |
| 8 | PQ_DIV-01_20 | +60 | Maintain the core components of evidence-based interventions while ada... |
| 8 | PQ_DIV-03_20 | +99 | Use structured decision-making protocols, ensure diverse team composit... |
| 8 | PQ_DIV-05_5 | +62 | Standardized test norms, cultural bias in items, and biased referral p... |
| 8 | PQ_DIV-05_15 | +56 | Consider whether less restrictive options with supplementary supports ... |
| 8 | PQ_DIV-05_17 | +51 | IDEA protections; the school must also coordinate with child welfare a... |
| 8 | PQ_DIV-05_20 | +65 | Assessment is nondiscriminatory, culturally appropriate, and involves ... |
| 9 | PQ_ETH-01_4 | +118 | Clarifying who will pay for the evaluation, ensuring informed consent ... |
| 9 | PQ_LEG-02_1 | +80 | Free Appropriate Public Education (FAPE), Least Restrictive Environmen... |
| 10 | PQ_LEG-03_6 | +79 | Accommodations are not advantages but rather modifications that level ... |
| 10 | PQ_LEG-03_16 | +52 | A 504 plan addresses disabilities that substantially limit major life ... |
| 10 | PQ_LEG-03_17 | +94 | The school must ensure that necessary mental health treatment is accom... |
| 10 | PQ_LEG-04_1 | +71 | All students, including those with disabilities, have a constitutional... |
| 10 | PQ_LEG-04_2 | +51 | That students with intellectual disabilities have a right to a free pu... |
| 10 | PQ_LEG-04_11 | +189 | If a school fails to provide FAPE and the parent unilaterally enrolls ... |
| 10 | PQ_LEG-04_12 | +141 | Schools must provide health services like catheterization, suctioning,... |
| 10 | PQ_LEG-04_16 | +88 | That students with disabilities have the right to be educated in publi... |
| 10 | PQ_LEG-04_20 | +120 | Discipline must include a manifestation determination (Honig v. Doe) b... |
| 10 | PQ_RES-02_2 | +122 | Critically evaluate the claim by seeking peer-reviewed evidence, consi... |
| 10 | PQ_RES-02_3 | +78 | It statistically combines results from multiple studies to estimate ov... |
| 10 | PQ_RES-02_15 | +181 | Critically examine whether the neuroscience claim is supported by peer... |
| 10 | PQ_RES-02_16 | +76 | Many published findings, especially with small samples or flexible ana... |

## Handoff notes

- **Primary merge artifact:** `delta_answer_choices.json` (403 records, keyed by UNIQUEID, fields A–F only)
- **Review companion:** `delta_answer_choices.csv` (same data, spreadsheet-friendly)
- **`correct_answers` letter key:** unchanged throughout — not included in delta
- **`CORRECT_Explanation`:** unchanged throughout — not included in delta
- **Correct-option text rewrites:** 223 records — explanation sanity check recommended post-merge
- **Still-flagged queue:** 38 questions listed above — manual review before canonicalizing, starting with Batch 10 `LEG` / `RES`

## Files produced

- `practice_questions_batch_01.csv` — Pre-audited (no changes made)
- `practice_questions_batch_02.csv` — Audited and edited
- `practice_questions_batch_03.csv` — Audited and edited
- `practice_questions_batch_04.csv` — Audited and edited
- `practice_questions_batch_05.csv` — Audited and edited
- `practice_questions_batch_06.csv` — Audited and edited
- `practice_questions_batch_07.csv` — Audited and edited
- `practice_questions_batch_08.csv` — Audited and edited
- `practice_questions_batch_09.csv` — Audited and edited
- `practice_questions_batch_10.csv` — Audited and edited
- `delta_answer_choices.json` — Primary handoff delta (403 records)
- `delta_answer_choices.csv` — Review-friendly companion
- `length_cuing_audit_report.csv` — Full change log (every before/after edit)
