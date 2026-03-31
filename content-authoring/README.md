# Content Authoring — Agent Work Folder

This folder is the exclusive workspace for the content authoring agent project.
It contains nothing else. Do not put engineering or code files here.

---

## What This Folder Is For

The Praxis Makes Perfect question bank has 1,150 questions. Each question has
fields that require human expert judgment to fill in — classifying reasoning
errors, naming misconceptions, mapping prerequisite knowledge, aligning to
standards. These cannot be filled by a script. They require reading each
question and reasoning about how students think.

This folder is where that work lives: agent output comes in here, progress is
tracked here, and future engineers can check here to know what is done and
what still needs doing.

---

## What's in This Folder

```
content-authoring/
├── README.md              ← this file — folder overview
├── STATUS.md              ← progress tracker — check here to see what's done
├── AGENT_PROMPT.md        ← copy-paste instructions for starting an agent session
│
└── output/
    ├── phase-A/           ← Distractor classification CSVs (one per skill)
    ├── phase-B/           ← Pedagogical rationale CSVs (one per skill)
    ├── phase-C/           ← Error pattern synthesis CSVs (one per skill)
    └── phase-D/           ← Standards alignment JSON (one file, all 45 skills)
```

---

## The Four Phases of Work

| Phase | What Gets Filled | Fields | Unit |
|-------|-----------------|--------|------|
| **A** | Why each wrong answer is wrong — classification of student reasoning errors | `distractor_tier`, `distractor_error_type`, `distractor_misconception`, `distractor_skill_deficit` | Per wrong-answer option |
| **B** | Why this question works as it does — pedagogical reasoning | `complexity_rationale`, `construct_actually_tested` | Per question |
| **C** | The dominant error pattern across all distractors — synthesis | `dominant_error_pattern`, `error_cluster_tag`, `instructional_red_flags` | Per question |
| **D** | What this skill requires as prerequisites + NASP standards alignment | `skill_prerequisites`, `prereq_chain_narrative`, `nasp_domain_primary` | Per skill (45 total) |

---

## How an Agent Session Works

1. Engineer runs the extraction script to get question data for a skill:
   ```bash
   node scripts/extract-questions-for-agent.mjs CON-01 --gaps-only
   ```
2. A `.txt` file appears in the project root. Open it.
3. Copy `content-authoring/AGENT_PROMPT.md`, fill in the [PHASE] and [SKILL-ID] placeholders.
4. Start a new chat with the agent. Paste the prompt. Paste the question data below it.
5. The agent produces CSV or JSON output.
6. Save the agent's output to the correct subfolder here:
   - Phase A → `content-authoring/output/phase-A/CON-01-phase-A.csv`
   - Phase B → `content-authoring/output/phase-B/CON-01-phase-B.csv`
   - Phase C → `content-authoring/output/phase-C/CON-01-phase-C.csv`
   - Phase D → `content-authoring/output/phase-D/all-skills-phase-D.json`
7. Update `STATUS.md` to mark the skill/phase as complete.
8. A separate engineering step applies the output back to `src/data/questions.json`.

---

## Full Specifications

All field definitions, valid values, quality criteria, and worked examples are in:

```
docs/CONTENT_AUTHORING_HANDOFF.md
```

Give agents that document as their reference. Do not send agents into the codebase.

---

## Scale

| Phase | Total Work |
|-------|-----------|
| Phase A | 3,448 wrong-answer slots × 4 fields = ~13,800 entries |
| Phase B | ~900 questions × 2 fields = ~1,800 entries |
| Phase C | ~900 questions × 3 fields = ~2,700 entries |
| Phase D | 45 skills × 3 fields = 135 entries |
| **Total** | **~18,435 field entries** |
