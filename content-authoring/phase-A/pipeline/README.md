# Phase A Distractor Classification Pipeline

This pipeline classifies every wrong answer option (distractor) in the Praxis Makes Perfect question bank for a defined set of target skills. For each distractor it calls GPT-4o and records four fields: `distractor_tier` (L1/L2/L3), `distractor_error_type` (Conceptual/Procedural/Lexical), `distractor_misconception` (what the student falsely believed), and `distractor_skill_deficit` (the specific knowledge gap). All state is persisted in a local SQLite database so any interruption can be resumed without re-processing completed rows. Results are written to per-skill CSV files.

---

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create your .env file
cp .env.example .env

# 3. Open .env and paste your real OpenAI API key
#    OPENAI_API_KEY=sk-...
#
# Optional: GEMINI_API_KEY=... only if you use --provider gemini (not the default).
```

---

## Usage

**Default provider is OpenAI** (`gpt-4o` via the OpenAI API — what people often call “ChatGPT API”). Run `python pipeline.py` with no `--provider` flag for normal work.

Optional Google Gemini (experimental): `python pipeline.py --provider gemini` requires `GEMINI_API_KEY` and optional `GEMINI_MODEL` in `.env`.

### Run all 31 skills (25 target + 6 expand)

```bash
python pipeline.py
```

### Run specific skills only

```bash
python pipeline.py --skills LEG-02 ACA-06 PSY-01
```

### Resume after an interruption

Just run again — rows already `approved` are not re-processed. Pending items continue from the SQLite queue.

```bash
python pipeline.py
```

### Retry exhausted rows

```bash
python pipeline.py --reset-exhausted
```

This resets `exhausted` rows for the requested skills back to `pending`. Combine with `--skills` to target specific skills:

```bash
python pipeline.py --reset-exhausted --skills LEG-02 ACA-06
```

---

## Output

CSVs are written to:

```
content-authoring/output/phase-A/[SKILL_ID]-phase-A.csv
```

Each file contains one row per distractor with columns:

| Column | Description |
|---|---|
| `UNIQUEID` | Question identifier from questions.json |
| `distractor_letter` | Option letter (A–F) |
| `distractor_tier` | L1 (most dangerous) / L2 / L3 (least plausible) |
| `distractor_error_type` | Conceptual / Procedural / Lexical |
| `distractor_misconception` | The false belief the student held (15–40 words) |
| `distractor_skill_deficit` | The specific knowledge concept that is missing (5–20 words) |

---

## Pipeline state

The SQLite database at `content-authoring/pipeline/pipeline_state.db` tracks every row's status (e.g. `pending`, `approved`, `exhausted`), rewrite attempts, and results. It is excluded from git.

---

## Cost estimate

Approximately **3,948 API calls** across all 31 skills (avg ~3 distractors per question × ~41 questions per skill). At GPT-4o pricing of roughly **$0.04 per call** (input + output tokens combined), total cost is approximately **$160** for the full run. Individual skill runs cost proportionally less.
