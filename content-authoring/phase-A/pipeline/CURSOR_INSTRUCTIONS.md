# Pipeline — Cursor Instructions

## What this does
Connects to your OpenAI account and generates Phase A distractor classifications
for every wrong answer in the Praxis question bank. Each wrong answer gets:
- A danger tier (L1/L2/L3)
- An error type (Conceptual/Procedural/Lexical)
- A misconception sentence (what the student believed)
- A skill deficit phrase (what knowledge gap caused it)

Results are saved to `content-authoring/output/phase-A/[SKILL]-phase-A.csv`.
State is tracked in a local SQLite database — if it stops, just run it again
and it picks up exactly where it left off.

---

## One-time setup (do this once)

**1. Install Python dependencies**
Open a terminal in this folder and run:
```
pip install -r requirements.txt
```

**2. Add your API key**
Your `.env` file should already exist in this folder with your key:
```
OPENAI_API_KEY=sk-...
```
If it's missing, copy `.env.example` to `.env` and paste your key.

**Default model provider:** OpenAI (`gpt-4o`). Run `python pipeline.py` with **no** `--provider` flag. Only use `--provider gemini` if you explicitly want Google Gemini and have set `GEMINI_API_KEY`.

---

## Step 1 — Test first (3 distractors only)

Run this before anything else. It processes 3 items from LEG-02 and shows you
exactly what the output looks like.

```bash
python pipeline.py --test --skills LEG-02
```

**What to look for in the output:**
- Each item shows: `tier=L1/L2/L3 | type=Conceptual/Procedural/Lexical | misc=...`
- The misconception should start with a belief verb: "Student believed...",
  "Student conflated...", "Student equated...", "Student treated..."
- The misconception should NOT contain any of these phrases:
  - "confusing the task demand"
  - "misidentifying what the item is truly asking"
  - "did not apply the controlling standard"
  - "was the best interpretation"

If the test output looks good → go to Step 2.
If it looks wrong → paste the output here and we'll adjust.

---

## Step 2 — Run one full skill

Once the test passes, run one complete skill:
```bash
python pipeline.py --skills LEG-02
```
LEG-02 has 37 questions (~111 API calls). Takes about 5–8 minutes.

When it finishes, check the CSV at:
`content-authoring/output/phase-A/LEG-02-phase-A.csv`

---

## Step 3 — Run a batch of 5

```bash
python pipeline.py --skills LEG-02 ACA-06 PSY-01 FAM-02 ACA-09
```

---

## Step 4 — Run all 31 skills (full autopilot)

```bash
python pipeline.py
```

This runs all 31 skills (25 target + 6 expand) back to back.
Safe to stop and restart at any time — nothing is lost.

---

## Monitoring — what the output means

```
09:14:22  ═══════════════════════════════════════
09:14:22  SKILL: LEG-02   (111 to classify, 0 already done)
09:14:22  ═══════════════════════════════════════
09:14:24  [██░░░░░░░░░░░░░░░░░░░░░░░░░░░░] LEG-02  2/111 (2%)  24.3/min  ETA ~264s
09:14:24  → tier=L2  type=Conceptual  misc=Student believed FERPA applies to all schools…
```

- The progress bar shows how far through the current skill it is
- Each row shows the tier, type, and first 80 chars of the misconception
- If it retries an item, you'll see: `↻ retrying attempt 2 — using escalated prompt`
- If it keeps failing (rare), it modifies the prompt and tries again — it never stops

---

## If something fails

**Retry exhausted items:**
```bash
python pipeline.py --reset-exhausted --skills LEG-02
```

**Check what's in the database:**
```bash
python -c "
import sqlite3
conn = sqlite3.connect('pipeline_state.db')
for row in conn.execute('SELECT skill_id, status, COUNT(*) FROM queue GROUP BY skill_id, status'):
    print(row)
"
```

---

## Cost estimate

- ~3,948 total API calls across all 31 skills
- GPT-4o pricing: ~$0.005 per call average
- Estimated total: ~$20–25 for all 31 skills

Test run (3 items): < $0.02

---

## DO NOT

- Do not modify `pipeline_state.db` manually
- Do not delete `pipeline_state.db` mid-run (you'll lose progress)
- Do not run two instances of the pipeline at the same time
