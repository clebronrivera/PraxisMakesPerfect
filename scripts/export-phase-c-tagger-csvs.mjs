#!/usr/bin/env node
/**
 * export-phase-c-tagger-csvs.mjs
 * --------------------------------
 * Generates a self-contained download package for external Phase C tagging.
 *
 * Output: ~/Downloads/phase-c-export/
 *   00_INSTRUCTIONS.md       — full field defs, rules, examples, tag list
 *   00_TAG_GLOSSARY.md       — verbatim copy of content-authoring/TAG_GLOSSARY.md
 *   MBH-03_phase-c-tagger.csv
 *   MBH-04_phase-c-tagger.csv
 *   ... (15 CSVs total)
 *   SWP-04_phase-c-tagger.csv
 *
 * Each CSV row = one question. Columns:
 *   batch_number, UNIQUEID, skill_id, skill_name, question_stem,
 *   option_A .. option_D (+ E/F if present), correct_answer,
 *   construct_actually_tested,
 *   distractor_tier_A .. distractor_skill_deficit_D  (Phase A — wrong answers only),
 *   dominant_error_pattern, error_cluster_tag, instructional_red_flags  (EMPTY — to fill)
 *
 * Usage: node scripts/export-phase-c-tagger-csvs.mjs
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const QUESTIONS_PATH = path.join(REPO_ROOT, "src", "data", "questions.json");
const TAG_GLOSSARY_PATH = path.join(REPO_ROOT, "content-authoring", "TAG_GLOSSARY.md");
const OUT_DIR = path.join(os.homedir(), "Downloads", "phase-c-export");

const BATCH_SIZE = 10;

const TARGET_SKILLS = [
  "MBH-03",
  "MBH-04",
  "MBH-05",
  "PSY-01",
  "PSY-02",
  "PSY-03",
  "PSY-04",
  "RES-02",
  "RES-03",
  "SAF-01",
  "SAF-03",
  "SAF-04",
  "SWP-02",
  "SWP-03",
  "SWP-04",
];

const SKILL_NAMES = {
  "MBH-03": "Cognitive-Behavioral and Applied Behavior Analysis",
  "MBH-04": "Autism and Neurodevelopmental Interventions",
  "MBH-05": "Crisis Intervention",
  "PSY-01": "Psychometric Theory and Norm-Referenced Score Interpretation",
  "PSY-02": "Neurodevelopmental Disorders — Diagnosis and Presentation",
  "PSY-03": "Social-Emotional Learning and Internalizing Disorders",
  "PSY-04": "School-Based Mental Health Intervention",
  "RES-02": "Research Literacy and Evidence-Based Practice",
  "RES-03": "Data-Based Decision Making",
  "SAF-01": "PBIS and Positive Behavioral Supports",
  "SAF-03": "Threat Assessment and School Safety",
  "SAF-04": "Suicide Prevention and Crisis Response",
  "SWP-02": "MTSS Tier 2 — Targeted Intervention",
  "SWP-03": "MTSS Tier 3 — Intensive Support",
  "SWP-04": "MTSS Architecture and Fidelity Monitoring",
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/** Escape a value for CSV: wrap in double quotes, escape inner double quotes. */
function csvCell(val) {
  if (val === null || val === undefined) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

function csvRow(cells) {
  return cells.map(csvCell).join(",");
}

// ---------------------------------------------------------------------------
// Load questions
// ---------------------------------------------------------------------------

function loadQuestions() {
  const raw = fs.readFileSync(QUESTIONS_PATH, "utf-8");
  return JSON.parse(raw);
}

function getSkillQuestions(questions, skillId) {
  return questions
    .filter((q) => q.current_skill_id === skillId || q.skillId === skillId)
    .sort((a, b) => (a.UNIQUEID || "").localeCompare(b.UNIQUEID || ""));
}

// ---------------------------------------------------------------------------
// Build CSV for one skill
// ---------------------------------------------------------------------------

function buildSkillCsv(questions, skillId) {
  const skillName = SKILL_NAMES[skillId] || skillId;
  const rows = [];

  // Header
  const header = [
    "batch_number",
    "UNIQUEID",
    "skill_id",
    "skill_name",
    "question_stem",
    "option_A",
    "option_B",
    "option_C",
    "option_D",
    "option_E",
    "option_F",
    "correct_answer",
    "construct_actually_tested",
    // Phase A — A
    "distractor_tier_A",
    "distractor_error_type_A",
    "distractor_misconception_A",
    "distractor_skill_deficit_A",
    // Phase A — B
    "distractor_tier_B",
    "distractor_error_type_B",
    "distractor_misconception_B",
    "distractor_skill_deficit_B",
    // Phase A — C
    "distractor_tier_C",
    "distractor_error_type_C",
    "distractor_misconception_C",
    "distractor_skill_deficit_C",
    // Phase A — D
    "distractor_tier_D",
    "distractor_error_type_D",
    "distractor_misconception_D",
    "distractor_skill_deficit_D",
    // Phase A — E (only meaningful when E is a real distractor)
    "distractor_tier_E",
    "distractor_error_type_E",
    "distractor_misconception_E",
    "distractor_skill_deficit_E",
    // Phase A — F
    "distractor_tier_F",
    "distractor_error_type_F",
    "distractor_misconception_F",
    "distractor_skill_deficit_F",
    // Phase C — TO FILL
    "dominant_error_pattern",
    "error_cluster_tag",
    "instructional_red_flags",
  ];
  rows.push(header.map(csvCell).join(","));

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const batchNum = Math.ceil((i + 1) / BATCH_SIZE);

    const uid = q.UNIQUEID || "";
    const stem = q.question_stem || q.question || "";
    const correctRaw = q.correct_answers || "";
    const correctLetters = new Set(
      Array.isArray(correctRaw)
        ? correctRaw.map((c) => c.trim().toUpperCase())
        : String(correctRaw)
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean)
    );

    const construct = q.construct_actually_tested || "";

    // Options — include E/F even if empty (will be blank cell)
    const optA = q.A || "";
    const optB = q.B || "";
    const optC = q.C || "";
    const optD = q.D || "";
    const optE = q.E && q.E.toUpperCase() !== "UNUSED" ? q.E : "";
    const optF = q.F && q.F.toUpperCase() !== "UNUSED" ? q.F : "";

    const correctAnswer = [...correctLetters].sort().join(", ");

    // Phase A per-distractor fields — blank for correct answers
    function phaseA(letter) {
      if (correctLetters.has(letter)) {
        return ["", "", "", ""];
      }
      return [
        q[`distractor_tier_${letter}`] || "",
        q[`distractor_error_type_${letter}`] || "",
        q[`distractor_misconception_${letter}`] || "",
        q[`distractor_skill_deficit_${letter}`] || "",
      ];
    }

    const row = [
      batchNum,
      uid,
      skillId,
      skillName,
      stem,
      optA,
      optB,
      optC,
      optD,
      optE,
      optF,
      correctAnswer,
      construct,
      ...phaseA("A"),
      ...phaseA("B"),
      ...phaseA("C"),
      ...phaseA("D"),
      ...phaseA("E"),
      ...phaseA("F"),
      "", // dominant_error_pattern — EMPTY
      "", // error_cluster_tag — EMPTY
      "", // instructional_red_flags — EMPTY
    ];

    rows.push(csvRow(row));
  }

  return rows.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Instructions document (self-contained — no repo access needed)
// ---------------------------------------------------------------------------

function buildInstructions() {
  return `# Phase C Tagging — Instructions for External Agent

## What You Are Doing

You are filling in three fields for school psychology exam questions. These fields power an
AI study guide that tells students *exactly* what reasoning error they're making when they
miss a question.

Each CSV in this package contains one skill's questions. Every row already has the full
question context (stem, choices, correct answer, and Phase A distractor classifications).
Your job is to fill in the last three columns of each row.

---

## The Three Fields You Will Fill In

| Column | Format | What it captures |
|--------|--------|-----------------|
| \`dominant_error_pattern\` | 1–2 sentences | The single most diagnostic reasoning failure across ALL wrong answers for this question |
| \`error_cluster_tag\` | 1–4 hyphenated words | A tag from the approved list in \`00_TAG_GLOSSARY.md\` |
| \`instructional_red_flags\` | 2–4 sentences | What a teacher or coach should do when a student misses this question |

---

## Column Reference — What Each Input Column Means

| Column | Meaning |
|--------|---------|
| \`batch_number\` | Process questions with the **same batch number together** in one session (≤10 per session) |
| \`UNIQUEID\` | Question identifier — include unchanged in output |
| \`skill_id\` | The skill this question belongs to |
| \`skill_name\` | Full skill name |
| \`question_stem\` | The question text |
| \`option_A\` … \`option_F\` | Answer choices (E/F may be blank if the question only has 4 options) |
| \`correct_answer\` | The letter(s) of the correct answer |
| \`construct_actually_tested\` | Phase B — what specific construct this question measures |
| \`distractor_tier_A\` … | Phase A tier for option A **if it is a wrong answer** (blank if it is the correct answer) |
| \`distractor_error_type_A\` … | Conceptual / Procedural / Lexical — what kind of error option A represents |
| \`distractor_misconception_A\` … | The false belief a student holds when choosing option A |
| \`distractor_skill_deficit_A\` … | The specific named concept, law, or model that was missing |
| *(same pattern for B, C, D, E, F)* | |

### Phase A Tier Definitions
- **L1 — Dangerous near-miss:** The most plausible wrong answer. Reflects a common, consequential misconception. A student with partial knowledge could reasonably choose this.
- **L2 — Partially plausible:** Reflects partial knowledge or a secondary misconception. Less dangerous but still informative.
- **L3 — Implausible:** Recognizable as wrong by most students with even basic familiarity with the topic.

### Phase A Error Type Definitions
- **Conceptual:** The student holds the wrong belief about what something means or how it works.
- **Procedural:** The student knows the concepts but applies the wrong sequence, step, or procedure.
- **Lexical:** The student confuses terminology — they understand the concept but mislabel it.

---

## Field 1: \`dominant_error_pattern\`

**The single most diagnostic reasoning failure across ALL wrong-answer options.**

This is NOT about one specific distractor — it is the pattern that emerges when you look at
all wrong answers together. What does a student who gets this question wrong *consistently believe*?

**Requirements:**
- 1–2 sentences
- Names the specific conceptual confusion, procedural error, or knowledge gap
- Does NOT just restate the correct answer — it describes the *wrong* reasoning
- Specific to this question — not a generic statement about the skill

**Good examples:**

> "Students most commonly confuse consultation model goals — substituting the student-level
> behavior target of behavioral consultation for the consultee-level barrier target of
> consultee-centered consultation. The dominant error is model-goal conflation, not procedural
> confusion about when to initiate consultation."

> "Students most commonly overgeneralize FERPA's scope, believing it applies to all schools
> regardless of funding source. The dominant error is missing the federal-funding conditionality
> that determines applicability."

> "Students confuse the two federal identification models (Ability-Achievement discrepancy vs.
> Response-to-Intervention), treating them as interchangeable when they reflect fundamentally
> different assumptions about what a learning disability is."

**Bad examples (reject these):**
- "Students may have difficulty with this question." — too generic
- "This question tests students' knowledge of consultation models." — describes the question, not the error
- "The correct answer is consultee-centered consultation." — restates the right answer

---

## Field 2: \`error_cluster_tag\`

A short keyword tag from \`00_TAG_GLOSSARY.md\` that groups this question with others sharing
the same error pattern across the skill.

**Approved tags (see \`00_TAG_GLOSSARY.md\` for full definitions):**

| Tag | When to use |
|-----|------------|
| \`model-conflation\` | Student confuses one named model/framework with another |
| \`scope-overgeneralization\` | Student applies a rule/law more broadly than it applies |
| \`scope-undergeneralization\` | Student applies a rule too narrowly |
| \`sequence-inversion\` | Student reverses the order of steps in a procedure |
| \`component-confusion\` | Student puts a concept in the wrong category or process |
| \`indirect-direct-confusion\` | Student confuses indirect and direct service delivery |
| \`purpose-confusion\` | Student knows a tool exists but misidentifies what it's for |
| \`prerequisite-skipping\` | Student jumps to a later step before completing earlier ones |
| \`label-retrieval\` | Student understands the concept but can't retrieve the correct term |
| \`overgeneralization\` | Broad pattern of applying rules too broadly (use when no specific tag fits) |
| \`population-confusion\` | Student applies criteria for one population to a different population |
| \`role-confusion\` | Student assigns a responsibility to the wrong professional role |
| \`causation-correlation\` | Student conflates correlation with causation |
| \`validity-reliability-confusion\` | Student confuses validity and reliability |
| \`norm-criterion-confusion\` | Student confuses norm-referenced and criterion-referenced interpretation |
| \`tier-level-confusion\` | Student applies a MTSS tier's intervention type to the wrong tier |
| \`eligibility-criteria-confusion\` | Student misidentifies criteria for a legal eligibility determination |
| \`consent-confidentiality-confusion\` | Student confuses consent rights, confidentiality, or disclosure requirements |
| \`developmental-stage-mismatch\` | Student applies knowledge from one developmental stage to another |
| \`treatment-assessment-confusion\` | Student conflates assessment with intervention/treatment |

**If no existing tag fits:** Propose a new tag by adding it to \`00_TAG_GLOSSARY.md\` first
(one-line definition + two example question IDs), then use it in your CSV output.

---

## Field 3: \`instructional_red_flags\`

**What a teacher or coach should watch for — and do — when a student misses this question.**

**Requirements:**
- 2–4 sentences
- Specific: names what the student needs to distinguish, review, or practice
- Actionable: includes a concrete teaching move or diagnostic signal
- May note which distractor choice points to different remediation paths

**Good example:**

> "A student who misses this item likely cannot discriminate Caplan's consultee-centered
> consultation from behavioral consultation. The key signal is whether they chose option A
> (model-goal confusion) vs. option D (indirect/direct confusion) — these require different
> remediation paths. Teach: draw the consultation model comparison table side by side,
> emphasizing that consultee-centered targets the TEACHER's barriers while behavioral
> consultation targets the STUDENT's behavior through environmental modification."

---

## How to Process — Batch Workflow

Each CSV has a \`batch_number\` column. **Process questions with the same batch number in one
session.** Never process more than 10 questions in a single session — context fatigue causes
all entries to look identical (template collapse).

**Per batch:**
1. Open a **fresh** session (never reuse a previous session)
2. Paste the prompt template below
3. Provide the 10 questions from that batch
4. Before saving output: count unique \`dominant_error_pattern\` values
   - ≥ 80% unique → accept and save
   - < 80% unique → reject, open a new session, regenerate

---

## Anti-Collapse Quality Rules

1. **Maximum 10 questions per session** — no exceptions
2. **No two rows in the same batch may share the same \`dominant_error_pattern\` opening phrase**
3. **No two rows in the same batch may share the same \`error_cluster_tag\`** (tags may repeat across batches, just not within one batch)
4. After writing each row, re-read the previous row and verify the new one is meaningfully different
5. \`dominant_error_pattern\` must name a **specific wrong belief** — not describe what the question does

---

## Output Format

CSV. One row per question. The same columns as the input CSV — just fill in the last three.

Rules:
- All text fields wrapped in double quotes
- Use single quotes inside text if needed (never escape with backslash)
- \`error_cluster_tag\` must be from the approved list (or add a new entry to \`00_TAG_GLOSSARY.md\` first)
- One row per UNIQUEID — no duplicates

**Example output row:**
\`\`\`csv
"PQ_CON-01_1","Students most commonly confuse consultation model goals — substituting the student-level behavior target of behavioral consultation for the consultee-level barrier target of consultee-centered consultation. The dominant error is model-goal conflation, not procedural confusion about when to initiate consultation.","model-conflation","A student who misses this item likely holds an undifferentiated understanding of consultation models. Check which distractor they chose: option A points to model-goal conflation; option D points to indirect/direct service confusion — different remediation paths. Teach: display the consultation model comparison table side by side, emphasizing that Caplan's consultee-centered model targets the teacher's internal barriers, not the student's behavior."
\`\`\`

---

## Agent Prompt Template (Copyable)

Replace \`[PASTE QUESTIONS HERE]\`, \`[SKILL_ID]\`, and \`[SKILL_NAME]\` before submitting.

---

\`\`\`
You are a school psychology curriculum expert. Your job is to write Phase C error pattern
data for a set of exam questions. This data helps an AI-powered exam prep platform tell
students exactly what reasoning error they are making when they miss a question.

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
   If none fit, propose a new tag (format: new-tag-name) and define it in a NOTE at the end.

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
- CORRECT: the correct answer letter
- TESTS: the specific construct this question measures (Phase B)
- CHOICES: all answer options
- DISTRACTOR CLASSIFICATIONS (Phase A): for each wrong answer —
    tier (L1 dangerous / L2 plausible / L3 implausible),
    error type (Conceptual / Procedural / Lexical),
    misconception text (the false belief),
    knowledge gap (the specific named concept or law that was missing)

Use the Phase A classifications to understand WHAT each wrong answer represents,
then synthesize ACROSS them to write the dominant_error_pattern.

---

OUTPUT FORMAT:
CSV — ONLY the three new columns, with UNIQUEID as the key. Header row required.

UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags

One row per question. No extra commentary outside the CSV.

---

QUESTIONS:

[PASTE QUESTIONS HERE]
\`\`\`

---

## QA Checklist Before Submitting Output

- [ ] Every row has a unique \`dominant_error_pattern\` opening phrase (≥ 80% unique)
- [ ] No \`dominant_error_pattern\` simply restates the correct answer
- [ ] All \`error_cluster_tag\` values are from the approved list (or added to \`00_TAG_GLOSSARY.md\` first)
- [ ] No two rows in the same batch share the same \`error_cluster_tag\`
- [ ] \`instructional_red_flags\` is specific to this question, not generic
- [ ] Row count matches input question count
- [ ] No duplicate UNIQUEIDs
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Load all questions
  console.log(`Loading questions from ${QUESTIONS_PATH}...`);
  const allQuestions = loadQuestions();
  console.log(`  Loaded ${allQuestions.length} questions total\n`);

  // Write reference files
  const tagGlossarySrc = fs.readFileSync(TAG_GLOSSARY_PATH, "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "00_TAG_GLOSSARY.md"), tagGlossarySrc, "utf-8");
  console.log("  Wrote: 00_TAG_GLOSSARY.md");

  fs.writeFileSync(path.join(OUT_DIR, "00_INSTRUCTIONS.md"), buildInstructions(), "utf-8");
  console.log("  Wrote: 00_INSTRUCTIONS.md\n");

  // Write per-skill CSVs
  let totalQuestions = 0;
  for (const skillId of TARGET_SKILLS) {
    const skillQuestions = getSkillQuestions(allQuestions, skillId);
    if (skillQuestions.length === 0) {
      console.warn(`  WARNING: No questions found for ${skillId} — skipping`);
      continue;
    }
    const csv = buildSkillCsv(skillQuestions, skillId);
    const filename = `${skillId}_phase-c-tagger.csv`;
    fs.writeFileSync(path.join(OUT_DIR, filename), csv, "utf-8");
    const batches = Math.ceil(skillQuestions.length / BATCH_SIZE);
    console.log(`  ${filename}  (${skillQuestions.length} questions, ${batches} batches)`);
    totalQuestions += skillQuestions.length;
  }

  console.log(`\n✓ Export complete`);
  console.log(`  Location : ${OUT_DIR}`);
  console.log(`  Skills   : ${TARGET_SKILLS.length}`);
  console.log(`  Questions: ${totalQuestions}`);
  console.log(`  Files    : ${TARGET_SKILLS.length + 2} (15 CSVs + 2 reference files)`);
  console.log(`\nOnce downloaded, delete the export folder with:`);
  console.log(`  rm -rf "${OUT_DIR}"`);
}

main();
