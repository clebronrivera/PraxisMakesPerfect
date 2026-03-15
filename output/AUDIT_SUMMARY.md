# Length-Cuing Audit — Batches 2–10

## What was audited
Questions where the correct answer choice was noticeably longer than the distractors, which can inadvertently cue the student to select the correct answer based on length rather than knowledge.

**Threshold used:** Correct answer > 50 characters longer than the next-longest distractor.

## Summary of fixes applied

| Fix type | Count |
|---|---|
| distractor expansion | 431 |
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

**Total edits: 654** across 654 entries.

## Approach used

**Two strategies were applied (not reforformatting — only text edits):**

1. **Shorten the correct answer** — removed trailing explanatory clauses appended to core answers. Trims applied: em-dash explanations, semicolon second clauses, purpose clauses ('to give/provide...'), trailing modifiers ('raising concerns about...', 'especially during...'), parenthetical asides.

2. **Expand short distractors** — short fragment distractors (single words, brief labels, terse phrases) were expanded into complete sentences while maintaining their incorrect meaning. Numerical, statistical, and temporal answer choices (e.g., '50%', '2-3 years') were left as-is.

## Changes by batch

| Batch | Edits made |
|---|---|
| Batch 02 | 118 |
| Batch 03 | 39 |
| Batch 04 | 40 |
| Batch 05 | 52 |
| Batch 06 | 76 |
| Batch 07 | 55 |
| Batch 08 | 73 |
| Batch 09 | 118 |
| Batch 10 | 83 |

## Remaining flagged questions (60)

These questions have correct answers that are still longer than distractors by 50+ chars. The correct answers are well-formed single sentences with no natural trim point, and their distractors are already substantive (60–100+ chars). Manual review recommended.

| Batch | Q ID | Margin | Correct answer (preview) |
|---|---|---|---|
| 3 | PQ_PSY-04_12 | +51 | An expected period when ELL students are listening and processing the ... |
| 3 | PQ_PSY-04_15 | +50 | The student may have a language-based learning disability (such as dys... |
| 4 | PQ_ACA-04_19 | +63 | Instruction should occur in the gap between what the student can do in... |
| 4 | PQ_ACA-06_16 | +65 | Intrinsic motivation fosters deeper engagement, persistence, and conti... |
| 5 | PQ_ACA-09_2 | +85 | The school psychologist coordinates with the school nurse for blood gl... |
| 5 | PQ_ACA-09_3 | +66 | Average to near-average intelligence with significant executive functi... |
| 5 | PQ_ACA-09_8 | +58 | Cognitive-behavioral intervention addressing pain-related anxiety, gra... |
| 5 | PQ_ACA-09_11 | +54 | Communicate with the prescribing physician about medication side effec... |
| 5 | PQ_ACA-09_16 | +55 | Recognize hypoglycemia as a medical emergency, follow the student's di... |
| 5 | PQ_MBH-02_1 | +74 | Cognitive-behavioral therapy (CBT) with exposure hierarchy to graduall... |
| 5 | PQ_MBH-02_8 | +88 | Teach specific social skills (conversation starting, perspective-takin... |
| 5 | PQ_MBH-02_10 | +67 | When symptoms are severe (suicidal ideation, psychosis), require inten... |
| 5 | PQ_MBH-02_13 | +55 | Exploring the student's ambivalence about change, reflecting back his ... |
| 5 | PQ_MBH-03_9 | +63 | Focusing on solutions and building on strengths and exceptions (times ... |
| 6 | PQ_MBH-04_19 | +89 | Anxiety disorders are common (affecting approximately 10-15% of childr... |
| 6 | PQ_FAM-02_13 | +55 | Explore potential barriers (transportation, work schedule, trust, lang... |
| 6 | PQ_FAM-03_14 | +57 | Request a copy of the medical information, consult with educators, and... |
| 7 | PQ_SAF-01_17 | +65 | Examine Tier 1 curriculum, instruction quality, and intensity, impleme... |
| 7 | PQ_SWP-02_10 | +58 | Students retained/tracked to lower tracks have increased disengagement... |
| 7 | PQ_SWP-03_5 | +61 | Implement with fidelity while allowing adaptation to local context, mo... |
| 8 | PQ_SWP-04_8 | +73 | A multidisciplinary team that meets regularly to review data, problem-... |
| 8 | PQ_SWP-04_9 | +55 | Regularly examine whether students from different racial/ethnic groups... |
| 8 | PQ_SWP-04_11 | +80 | Examine and improve Tier 1 curriculum, instruction quality, classroom ... |
| 8 | PQ_DIV-01_7 | +89 | SES is a proxy variable; poverty itself doesn't cause low achievement,... |
| 8 | PQ_DIV-01_11 | +57 | Assessment instruments may have cultural loading, rely on culturally s... |
| 8 | PQ_DIV-01_12 | +94 | Use the student's home language when possible, or provide bilingual ma... |
| 8 | PQ_DIV-01_15 | +68 | Involve community members in developing behavior expectations that ref... |
| 8 | PQ_DIV-01_19 | +69 | Offer flexible meeting times, alternative communication formats (phone... |
| 8 | PQ_DIV-01_20 | +60 | Maintain the core components of evidence-based interventions while ada... |
| 8 | PQ_DIV-03_16 | +105 | School policies, particularly exclusionary discipline, police presence... |
| ... | *30 more* | | |

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
- `length_cuing_audit_report.csv` — Full change log (every before/after edit)
