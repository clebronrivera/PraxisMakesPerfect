# Coworker Agent Handoff — Two Content Tasks

**Project:** PraxisMakesPerfect (Praxis 5403 School Psychology exam prep app)
**Repo:** `/Users/lebron/Documents/PraxisMakesPerfect`
**Date:** 2026-04-01

These two tasks require agent-driven content generation. Neither requires code changes — only
generating text values and writing them into the correct files/fields.

---

## Task 1: Phase B Content Regeneration (29 Collapsed Skills)

### What the problem is

Phase B enriched every practice question with two fields:
- `construct_actually_tested` — a precise noun phrase (12–25 words) naming exactly what cognitive
  task the question measures
- `complexity_rationale` — a 1–3 sentence classification of the item as Recall or Application,
  explaining *why*

The original LLM batches suffered **template collapse** on 29 of 45 skills: the agent reused the
same 3–5 strings across all 25+ questions in a skill file instead of writing a unique value per
question. Quality threshold is ≥80% variety (unique strings / total strings). Those 29 skills
were blocked and never written to `src/data/questions.json`.

**16 skills are already clean and applied.** Those are the gold standard.

---

### What you need to produce

For each of the 29 collapsed skill CSVs listed below, regenerate **unique** values for every row.

**Output format:** A CSV with these exact columns (match the existing file headers):
```
question_id,construct_actually_tested,complexity_rationale
```

**Constraints — non-negotiable:**
1. Every `construct_actually_tested` value must be **unique within the skill** (no reuse)
2. `construct_actually_tested` must be a **noun phrase, 12–25 words**, no full sentences starting
   with "This item tests..."
3. `complexity_rationale` must name the level (**Recall** or **Application**) and give a specific
   cognitive reason
4. Do NOT look at the old collapsed CSV values — discard them entirely and write fresh
5. Batch size: **5 questions maximum per agent call** to prevent context fatigue

---

### Gold standard examples (copy this style exactly)

**Example A — Discrimination task (Application)**
```
question_id: MBH-03-Q004
construct_actually_tested: Differential identification of catastrophizing/all-or-nothing
  cognitions versus mind reading, overgeneralization, and labeling in anxious self-talk
complexity_rationale: This is an Application item because the student must classify a nuanced
  self-statement that blends catastrophic prediction and social-evaluative fear. Success depends
  on differentiating closely related distortion labels from the wording of the thought.
```

**Example B — Sequencing task (Application)**
```
question_id: CON-01-Q001
construct_actually_tested: Behavioral consultation sequencing: prioritizing operational
  target-behavior definition during problem identification before analysis and intervention
complexity_rationale: This is an Application item because the student must impose the correct
  phase order on a multi-step consultation model rather than simply recall its components.
  The distractors offer plausible later-phase actions.
```

**Example C — Pure recall (Recall)**
```
question_id: DBDM-S01-Q003
construct_actually_tested: Definition retrieval: identifying the reliability type that measures
  score consistency across two administrations separated by time
complexity_rationale: This is a Recall item because the correct answer requires retrieving a
  stored definition of test-retest reliability. No application or inference is required.
```

---

### The 29 skills to regenerate

Each CSV is at `content-authoring/phase-B/output/<SKILL_ID>-phase-B.csv`.
Question stems are in `src/data/questions.json` — look up by `question_id`.

```
ACA-02, ACA-03, ACA-04, ACA-06, ACA-07, ACA-08, ACA-09
CON-01
DBD-01, DBD-03, DBD-05, DBD-06, DBD-07, DBD-08, DBD-09, DBD-10
DEV-01
DIV-01, DIV-03, DIV-05
ETH-01, ETH-02, ETH-03
FAM-02, FAM-03
LEG-01, LEG-02, LEG-03, LEG-04
MBH-02, MBH-04, MBH-05
PSY-01, PSY-02, PSY-03, PSY-04
RES-02, RES-03
SAF-01, SAF-03, SAF-04
SWP-02, SWP-03, SWP-04
```

(MBH-03 is already clean — do not re-process it.)

---

### How to apply when done

Run:
```bash
node scripts/apply-phase-b.mjs --dry-run   # verify first
node scripts/apply-phase-b.mjs             # apply to src/data/questions.json
```

The script validates variety (≥80%) before writing. If a skill fails, regenerate that skill again.

---

### Validation check

After applying, run:
```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
npm run build
```
Build must pass with zero errors.

---

---

## Task 2: Misconception Taxonomy — Populate questionIds

### What the problem is

`src/data/misconception-taxonomy.ts` contains 98 misconception entries, each with a `questionIds: []`
array that has never been populated. These IDs connect misconceptions to the specific questions that
test for them.

The information needed to fill them in already exists in `src/data/questions.json` — each question's
distractor options have `misconception` text fields (from Phase A content authoring). The task is to
cross-reference distractor misconception text against taxonomy entry text and populate `questionIds`.

---

### What you need to produce

A **replacement `src/data/misconception-taxonomy.ts`** file with `questionIds` arrays populated
wherever a question's distractor misconception text semantically matches a taxonomy entry.

---

### How the data is structured

**Taxonomy entry (in `src/data/misconception-taxonomy.ts`):**
```typescript
{
  id: 'MC-DBDM-S01-001' as MisconceptionId,
  skillId: 'DBDM-S01',
  text: 'All reliability types are interchangeable across measurement contexts',
  family: 'assessment-tool-confusion',
  relatedPatternIds: [...],
  questionIds: [],   // ← FILL THIS IN
}
```

**Question distractor (in `src/data/questions.json`):**
```json
{
  "id": "DBDM-S01-Q003",
  "skill_id": "DBDM-S01",
  "choices": {
    "A": { "text": "...", "misconception": "Student confused test-retest with internal consistency" },
    "B": { "text": "...", "misconception": "Student believed all reliability types are equivalent" },
    ...
  }
}
```

---

### Matching rules

1. **Match by skillId first** — only compare a taxonomy entry against questions with the same
   `skill_id` (e.g., `MC-DBDM-S01-001` only matches questions where `skill_id === 'DBDM-S01'`)
2. **Semantic match, not exact string match** — the misconception text in questions is often
   paraphrased; match on meaning, not literal string equality
3. **One question can appear in multiple taxonomy entries** if multiple distractors match
   different entries
4. **One taxonomy entry can have multiple questionIds**
5. **Do not invent matches** — if no question distractor clearly reflects a taxonomy misconception,
   leave `questionIds: []`
6. **Minimum confidence:** Only add a question if you're >80% confident the distractor is testing
   that specific misconception

---

### Output

Write the updated `src/data/misconception-taxonomy.ts` file. Keep all existing code structure and
comments exactly as-is — only change the `questionIds: []` arrays to `questionIds: ['Q-ID-1', 'Q-ID-2']`.

---

### Validation check

After writing the file, run:
```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
npm run build
```
Build must pass with zero errors.

---

## Notes for Both Tasks

- **Do not modify any other files** — only the files explicitly listed above
- **If a build error occurs**, read the error carefully. TypeScript errors from these files are
  almost always caused by an incorrect string type or missing import
- **Source of truth for question content:** `src/data/questions.json` (1,150 questions)
- **Source of truth for skill IDs:** The skill prefix patterns are `DBDM-S`, `CC-S`, `IIS-S`,
  `LEG-S` (v1 taxonomy) and `ACA-`, `CON-`, `DBD-`, `DEV-`, `DIV-`, `ETH-`, `FAM-`, `LEG-`,
  `MBH-`, `PSY-`, `RES-`, `SAF-`, `SWP-`, `SPS-` (v2/content-authoring taxonomy)
