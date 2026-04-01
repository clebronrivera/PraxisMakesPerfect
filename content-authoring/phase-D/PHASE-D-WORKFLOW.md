# Phase D — Standards Alignment and Prerequisites: Workflow and Coworker Prompt

**Status:** Not started. All 45 skills pending.
**Last updated:** 2026-04-01

This document is the complete workflow for producing Phase D content via Claude.ai Coworker agents. Phase D is a skill-level phase — 45 entries total, not 1,150 questions.

---

## What Phase D Is

Phase D adds three fields **per skill** that describe the learning context for each of the 45 Praxis 5403 competency areas. Unlike Phases A–C (which are per-question or per-distractor), Phase D data lives at the skill level and is applied to a skill-level metadata file.

| Field | What it captures | Format |
|-------|-----------------|--------|
| `nasp_domain_primary` | Which of the 10 NASP practice domains this skill primarily belongs to | One code: `NASP-1` through `NASP-10` |
| `skill_prerequisites` | What a student must know before this skill can be learned | Bulleted list, 3–8 items |
| `prereq_chain_narrative` | The learning sequence for this skill — how it connects to prior knowledge and what it unlocks | 2–4 sentences |

**Where this data goes:** `src/data/skill-phase-d.json` — a flat JSON file keyed by skill ID (`ACA-02`, `CON-01`, etc.), applied via `scripts/apply-phase-d.mjs`.

**Why it matters:** Prerequisites inform study guide sequencing (don't assign Skill B until Skill A foundations exist) and unlock richer adaptive targeting in future study plan versions. The NASP domain tag enables cross-mapping between the 4-domain Praxis blueprint and the 10-domain NASP framework.

---

## Scale and Session Strategy

| Total skills | Batch size | Sessions needed |
|-------------|-----------|----------------|
| 45 | 10 | 5 sessions total |

Each session covers 10 skills. Because Phase D is skill-level (not question-level), each skill block is short — the agent only needs the skill name, a few question stems, and the sub-construct range to write good prerequisites.

**Session breakdown:**
- Batch 1: ACA-02 through CON-01 (skills 1–10)
- Batch 2: DBD-01 through DBD-10 (skills 11–20)
- Batch 3: DEV-01 through FAM-03 (skills 21–30)
- Batch 4: LEG-01 through MBH-05 (skills 31–40)
- Batch 5: PSY-01 through SWP-04 (skills 41–45)

All 5 sessions can run in parallel as separate Coworker agents.

---

## Field Definitions

### `nasp_domain_primary`

The single NASP practice domain that most directly corresponds to this skill's primary focus.

| Code | NASP Practice Domain |
|------|---------------------|
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

**Rules:**
- Choose the **single** best-fit domain per skill
- Many skills are cross-domain — pick the most direct fit for the skill's core focus
- A brief rationale (1 sentence) is helpful but not required in the output

**Examples:**

| Skill | nasp_domain_primary | Rationale |
|-------|--------------------|-----------|
| CON-01 (Consultation Models) | `NASP-2` | Consultation is the defining competency of NASP-2 |
| LEG-01 (FERPA) | `NASP-10` | Legal/ethical knowledge is NASP-10's core |
| DBD-07 (SLD Identification) | `NASP-1` | Data-based eligibility determination = NASP-1 |
| PSY-03 (Internalizing Disorders) | `NASP-4` | Mental health service delivery = NASP-4 |
| SWP-04 (MTSS Architecture) | `NASP-5` | School-wide systems = NASP-5 |

---

### `skill_prerequisites`

What a student must know before this skill can be learned effectively.

**Format:** Bulleted list, 3–8 items. Mix of:
- Other skill IDs from the 45-skill bank (reference by ID when another skill is a prerequisite)
- Named foundational concepts that aren't tied to a specific skill
- General knowledge areas (psychometric foundations, school psychology role, etc.)

**Example for CON-01 (Consultation Models and Problem-Solving):**
```
- Basic understanding of direct vs. indirect service delivery in school psychology
- Familiarity with the school psychologist's professional role within a school system
- Understanding that multiple consultation models exist (not just one universal approach)
- General knowledge of the helping relationship and problem-solving frameworks
- Basic awareness of how teachers and school psychologists collaborate
```

**Example for LEG-02 (IDEA — Core Principles):**
```
- LEG-01 (FERPA and Student Privacy) — overlapping privacy provisions
- Basic understanding of special education as a distinct educational system
- Familiarity with the concept of disability categories in educational law
- Understanding of what an IEP is at a surface level
- General knowledge of federal vs. state educational authority
```

**Rules:**
- Prerequisite skills from the 45-skill bank must reference the skill ID (e.g., `LEG-01`)
- Do not list skills that are at the same level — only genuine prerequisites
- 3 items minimum, 8 maximum — err toward specificity over exhaustiveness

---

### `prereq_chain_narrative`

A 2–4 sentence description of the learning sequence for this skill: what must come first, and what this skill unlocks.

**Format:** 2–4 connected sentences. Should read like a mini-progression description, not a list in disguise.

**Example for CON-01:**
> "A student approaching consultation models must first understand that school psychology practice includes both direct services (working with students) and indirect services (working through teachers and parents). With that foundation, the student can learn that multiple distinct consultation models exist — behavioral, consultee-centered, conjoint, mental health — each with different goals and different roles for the consultant and consultee. Mastering CON-01 establishes the framework for more complex consultation and collaboration competencies, and directly supports understanding systems-level consultation work in later coursework."

**Example for DBD-07 (SLD Identification):**
> "Before studying SLD identification models, students must have a working understanding of the general psychoeducational evaluation process (DBD-03) and basic psychometric concepts such as ability-achievement relationships (PSY-01). The core challenge in DBD-07 is distinguishing between two federally recognized identification approaches — the IQ-achievement discrepancy model and the response-to-intervention (RTI) model — which reflect fundamentally different assumptions about what a learning disability is. Mastering DBD-07 directly supports work in DBD-08 (reading profiles) and is essential for eligibility decision-making in any school psychology role."

**Rules:**
- Name specific models, frameworks, or laws where relevant
- Reference prerequisite skill IDs when the chain includes a specific prior skill
- "Unlocks" language in the final sentence is encouraged — describes forward progression

---

## Output Format

JSON array. One object per skill.

```json
[
  {
    "skill_id": "CON-01",
    "nasp_domain_primary": "NASP-2",
    "skill_prerequisites": "- Basic understanding of direct vs. indirect service delivery in school psychology\n- Familiarity with the school psychologist's professional role\n- Understanding that multiple consultation models exist\n- General knowledge of collaborative problem-solving frameworks",
    "prereq_chain_narrative": "A student approaching consultation models must first understand that school psychology practice includes both direct and indirect services. With that foundation, the student can learn that multiple distinct consultation models — behavioral, consultee-centered, conjoint — each serve different goals and involve different consultant-consultee dynamics. Mastering CON-01 establishes the framework within which more complex consultation and systems-level competencies are built."
  }
]
```

**Rules:**
- All string values on a single line (no embedded newlines in JSON — use `\n` for line breaks in prerequisites)
- `skill_id` must match exactly (case-sensitive: `ACA-02`, not `aca-02`)
- `nasp_domain_primary` must be exactly `NASP-1` through `NASP-10`
- One object per skill — no duplicates

---

## How to Run a Batch

### Step 1 — Extract skill blocks

```bash
cd /path/to/repo
python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py <BATCH_NUMBER>
```

Example:
```bash
python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 1
# Output: 10 skill blocks with sample question stems and sub-constructs
```

Copy the block that begins after "PASTE THIS BLOCK INTO [PASTE SKILLS HERE]".

### Step 2 — Submit to Claude.ai Coworker

1. Open a **new** Claude.ai Coworker session
2. Paste the prompt below
3. Replace `[PASTE SKILLS HERE]` with the output from Step 1

### Step 3 — Save output

Save the agent's JSON output as:
```
content-authoring/phase-D/output/phase-D-batch{N}.json
```

Example: `phase-D-batch1.json`

### Step 4 — Apply

```bash
node scripts/apply-phase-d.mjs --dry-run   # preview
node scripts/apply-phase-d.mjs             # apply to src/data/skill-phase-d.json
```

---

## Coworker Prompt Template

Copy everything below the line. Replace `[PASTE SKILLS HERE]`.

---

```
You are a school psychology curriculum expert with deep knowledge of the NASP (National Association of School Psychologists) practice framework and the Praxis 5403 exam blueprint.

Your job is to write Phase D standards alignment and prerequisite data for a set of exam skills. This data helps an AI-powered exam prep platform sequence study effectively and connect skills to the broader NASP framework.

---

WHAT YOU WILL PRODUCE:

For each skill, write three fields:

1. nasp_domain_primary
   The SINGLE NASP practice domain this skill primarily belongs to.
   Choose exactly one code from: NASP-1, NASP-2, NASP-3, NASP-4, NASP-5, NASP-6, NASP-7, NASP-8, NASP-9, NASP-10

   NASP domains:
     NASP-1:  Data-Based Decision Making and Accountability
     NASP-2:  Consultation and Collaboration
     NASP-3:  Academic Interventions
     NASP-4:  Mental and Behavioral Health Services
     NASP-5:  School-Wide Practices to Promote Learning
     NASP-6:  Preventive and Responsive Services
     NASP-7:  Family-School Collaboration Services
     NASP-8:  Diversity in Development and Learning
     NASP-9:  Research and Evidence-Based Practice
     NASP-10: Legal, Ethical, and Professional Practice

2. skill_prerequisites
   A bulleted list (3–8 items) of what a student must know BEFORE this skill can be learned.
   Rules:
   - Include other skill IDs from the 45-skill bank when a prior skill is a true prerequisite (e.g., "LEG-01 (FERPA)")
   - Include foundational concepts that aren't tied to a single skill
   - Only genuine prerequisites — not co-occurring concepts
   - Format each item starting with "- "

3. prereq_chain_narrative
   2–4 connected sentences describing the learning sequence for this skill:
   - What prior knowledge is needed and why
   - What the core challenge or concept shift is in this skill
   - What this skill unlocks for future learning
   Rules:
   - Reference specific models, frameworks, laws by name
   - Reference prerequisite skill IDs inline when the chain includes a specific prior skill
   - The final sentence should describe forward progression ("Mastering X unlocks/supports Y")

---

CRITICAL QUALITY RULES:
1. nasp_domain_primary must be EXACTLY one code (NASP-1 through NASP-10) — no ranges, no "NASP-1 and NASP-4"
2. Each skill's prereq_chain_narrative must be meaningfully different — do not reuse the same opening sentence structure
3. skill_prerequisites must reflect genuine learning dependencies, not just topically related skills
4. The same prerequisite skill ID should not appear in every skill — be selective

---

OUTPUT FORMAT:
JSON array. One object per skill. All strings on a single line. Use \n for line breaks in skill_prerequisites.

[
  {
    "skill_id": "SKILL-ID",
    "nasp_domain_primary": "NASP-X",
    "skill_prerequisites": "- item one\n- item two\n- item three",
    "prereq_chain_narrative": "Two to four connected sentences here."
  }
]

Output only the JSON array — no commentary, no markdown fences.

---

SKILLS:

[PASTE SKILLS HERE]
```
