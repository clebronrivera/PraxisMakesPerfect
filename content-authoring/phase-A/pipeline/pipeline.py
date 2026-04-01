"""
Praxis Makes Perfect — Phase A Distractor Classification Pipeline
Multi-agent architecture with persistent state and parallel skill processing.

AGENTS:
  Generator  — produces the first classification for a distractor
  Validator  — approves it or rejects it with a specific reason
  Rewriter   — receives the rejection reason + bad attempt, fixes only the problem

STATE MACHINE (per distractor):
  pending → generating → generated → validating →
    approved  (done — never touched again)
    pending   (not approved yet; deferred for next run)
    exhausted (hit max rewrite attempts)

PARALLELISM:
  Multiple skills processed simultaneously via ThreadPoolExecutor.
  Items within a skill are sequential (avoids prompt cross-contamination).
  Each run does one pass per skill (no same-run rewrite loops).

After every skill completes, a summary table prints showing
approved / pending / exhausted counts.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import random
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

_SCRIPT_DIR = Path(__file__).parent.resolve()
load_dotenv(_SCRIPT_DIR / ".env")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

QUESTIONS_JSON = _SCRIPT_DIR.parent.parent / "src" / "data" / "questions.json"
OUTPUT_DIR     = _SCRIPT_DIR.parent / "output" / "phase-A"
DB_PATH        = _SCRIPT_DIR / "pipeline_state.db"

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

MODEL              = "gpt-4o"
OPENAI_MODEL       = "gpt-4o"
GEMINI_MODEL       = "gemini-2.0-flash"
GEMINI_BASE_URL    = "https://generativelanguage.googleapis.com/v1beta/openai/"
MAX_REWRITE_PASSES = 8      # max times rewriter can attempt to fix one distractor
BASE_DELAY         = 2      # seconds; doubles on API error
PARALLEL_SKILLS    = 3      # how many skills run at the same time
PASSES_PER_RUN     = 1      # process each item once per run

# ---------------------------------------------------------------------------
# Skills
# ---------------------------------------------------------------------------

TARGET_SKILLS = [
    "LEG-02", "ACA-06", "LEG-01", "PSY-03", "ACA-04",
    "ETH-02", "PSY-02", "ACA-07", "SWP-03", "LEG-04",
    "RES-03", "ACA-02", "ACA-03", "DEV-01", "SWP-02",
    "ETH-03", "RES-02", "PSY-01", "PSY-04", "FAM-02",
    "LEG-03", "ACA-09", "FAM-03", "DIV-05",
]

EXPAND_SKILLS = [
    "CON-01", "ETH-01", "SAF-03", "SWP-04",
    "DBD-06", "MBH-02", "MBH-04",
]

# ---------------------------------------------------------------------------
# Forbidden phrases — validator checks these
# ---------------------------------------------------------------------------

FORBIDDEN_PHRASES = [
    "confusing the task demand in",
    "confusing the scenario demand in",
    "missing the key principle described in the explanation",
    "was the best interpretation",
    "distractor approach in",
    "matched the clinical need in this case",
    "misidentifying what the item is truly asking",
    "showing confusion about the stem's demand",
    "did not apply the controlling standard",
    "recognizing the key conceptual distinction required",
    "was the most accurate interpretation of the scenario",
    "rather than recognizing the key conceptual distinction",
    "and did not apply the core",
    "was legally or ethically accurate, and did not apply",
    "does not apply the core",
    "was the most accurate interpretation",
]

# ---------------------------------------------------------------------------
# Agent prompts
# ---------------------------------------------------------------------------

GENERATOR_SYSTEM = """\
You are an expert content analyst for the Praxis School Psychology (5403) exam.

For a given WRONG answer option, produce exactly four classification fields as JSON.

Respond with valid JSON only — no other text:
{
  "distractor_tier": "L1", "L2", or "L3",
  "distractor_error_type": "Conceptual", "Procedural", or "Lexical",
  "distractor_misconception": "15-40 word sentence",
  "distractor_skill_deficit": "5-20 word noun phrase"
}

DEFINITIONS:
- L1 = near-miss, most dangerous; L2 = partially plausible; L3 = implausible to a prepared student
- Conceptual = wrong mental model; Procedural = wrong process; Lexical = terminology confusion
- distractor_misconception: What did this student BELIEVE was true before reading this question?
- distractor_skill_deficit: What specific named concept, law, model, or procedure is missing?

QUALITY RULES:
- misconception must answer "What did the student believe?" — not "What did they do wrong?"
- misconception must be UNIQUE to this wrong answer — it cannot apply to the other wrong answers
- skill_deficit must name something specific (e.g., "FERPA directory information exception",
  "MTSS Tier 2 intervention criteria") — never a broad topic
- skill_deficit must be different from the skill deficits for other wrong answers on this question

FORBIDDEN in distractor_misconception (your response will be rejected):
- "confusing the task demand in"        - "was the best interpretation"
- "confusing the scenario demand in"    - "distractor approach in"
- "misidentifying what the item is"     - "did not apply the controlling standard"
- "recognizing the key conceptual"      - "was the most accurate interpretation"
- "showing confusion about the stem"    - "matched the clinical need in this case"
- "missing the key principle described" - "and did not apply the core"
"""

REWRITER_SYSTEM = """\
You are a distractor quality editor for the Praxis School Psychology (5403) exam.

A previous attempt to classify a wrong answer was REJECTED. Your job is to fix it.
You will receive:
  1. The original question
  2. The previous attempt (which failed)
  3. The specific rejection reason

Produce corrected JSON only:
{
  "distractor_tier": "L1", "L2", or "L3",
  "distractor_error_type": "Conceptual", "Procedural", or "Lexical",
  "distractor_misconception": "15-40 word sentence",
  "distractor_skill_deficit": "5-20 word noun phrase"
}

WHAT distractor_misconception MUST BE:
- A direct statement of what the student BELIEVED was true — their false mental model
- Start with a belief verb: "Student believed...", "Student thought...", "Student conflated...",
  "Student equated...", "Student treated...", "Student assumed...", "Student attributed..."
- Must be specific to THIS wrong answer — not reusable for the other wrong answers
- Must contain at least one named concept, law, model, or term from school psychology

WHAT distractor_skill_deficit MUST BE:
- A specific named concept, law, or procedure — not a topic area
- Different from the skill deficits already written for other wrong answers on this question

STILL FORBIDDEN:
- "confusing the task demand in"        - "was the best interpretation"
- "confusing the scenario demand in"    - "distractor approach in"
- "misidentifying what the item is"     - "did not apply the controlling standard"
- "recognizing the key conceptual"      - "was the most accurate interpretation"
- "showing confusion about the stem"    - "matched the clinical need in this case"

JSON only. No explanation.
"""

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

# Status values:
#   pending        — new or deferred item waiting for next run
#   approved       — passed validation, final, never touched again
#   needs_rewrite  — legacy deferred state from older runs (treated as pending)
#   exhausted      — hit MAX_REWRITE_PASSES without approval


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS queue (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            uniqueid            TEXT NOT NULL,
            skill_id            TEXT NOT NULL,
            distractor_letter   TEXT NOT NULL,
            question_json       TEXT NOT NULL,
            status              TEXT NOT NULL DEFAULT 'pending',
            result_json         TEXT,
            rejection_reason    TEXT,
            rewrite_attempts    INTEGER NOT NULL DEFAULT 0,
            last_error          TEXT,
            created_at          TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at          TEXT,
            UNIQUE(uniqueid, distractor_letter)
        )
    """)
    conn.commit()


def ensure_queue_schema(conn: sqlite3.Connection) -> None:
    """
    Backfill columns for older local pipeline_state.db files.
    Safe to run every startup.
    """
    columns = {
        row[1]
        for row in conn.execute("PRAGMA table_info(queue)").fetchall()
    }

    if "rejection_reason" not in columns:
        conn.execute("ALTER TABLE queue ADD COLUMN rejection_reason TEXT")
    if "rewrite_attempts" not in columns:
        conn.execute("ALTER TABLE queue ADD COLUMN rewrite_attempts INTEGER NOT NULL DEFAULT 0")
    if "last_error" not in columns:
        conn.execute("ALTER TABLE queue ADD COLUMN last_error TEXT")
    if "updated_at" not in columns:
        conn.execute("ALTER TABLE queue ADD COLUMN updated_at TEXT")

    conn.commit()


def load_queue(conn: sqlite3.Connection, skills: list) -> None:
    skill_set = set(skills)
    with open(QUESTIONS_JSON, encoding="utf-8") as fh:
        questions = json.load(fh)

    inserted = 0
    for q in questions:
        if q.get("current_skill_id") not in skill_set:
            continue
        correct_letters = {
            c.strip().upper()
            for c in (q.get("correct_answers") or "").split(",")
            if c.strip()
        }
        for letter in ("A", "B", "C", "D", "E", "F"):
            if not (q.get(letter) or "").strip():
                continue
            if letter in correct_letters:
                continue
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO queue "
                    "(uniqueid, skill_id, distractor_letter, question_json) VALUES (?,?,?,?)",
                    (q["UNIQUEID"], q["current_skill_id"], letter,
                     json.dumps(q, ensure_ascii=False)),
                )
                if conn.execute("SELECT changes()").fetchone()[0]:
                    inserted += 1
            except sqlite3.Error as exc:
                logger.warning("DB insert error %s/%s: %s", q["UNIQUEID"], letter, exc)
    conn.commit()
    if inserted:
        logger.info("Queue: %d new rows added.", inserted)

# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------


def build_question_block(question_dict: dict, wrong_letter: str) -> str:
    """Shared question context used by both Generator and Rewriter."""
    parts = []
    skill_id = (question_dict.get("current_skill_id") or "").strip()
    skill_name = (question_dict.get("skill_name") or "").strip()
    skill_label = skill_name or skill_id or "current skill"
    parts.append(
        "SKILL CONTEXT:\n"
        f"Skill ID: {skill_id}\n"
        f"Skill: {skill_label}"
    )
    case_text = (question_dict.get("case_text") or "").strip()
    if case_text:
        parts.append(f"VIGNETTE:\n{case_text}")
    parts.append(f"QUESTION:\n{(question_dict.get('question_stem') or '').strip()}")
    correct_letters = {
        c.strip().upper()
        for c in (question_dict.get("correct_answers") or "").split(",")
        if c.strip()
    }
    option_lines = []
    for letter in ("A", "B", "C", "D", "E", "F"):
        text = (question_dict.get(letter) or "").strip()
        if not text:
            continue
        tag = "[CORRECT]" if letter in correct_letters else "[WRONG]"
        option_lines.append(f"  {letter}. {tag} {text}")
    parts.append("OPTIONS:\n" + "\n".join(option_lines))
    parts.append(
        f"NOTE: The distractor_skill_deficit must name a specific concept, law, or model "
        f"within the {skill_label} skill - not a general topic."
    )
    wrong_text = (question_dict.get(wrong_letter) or "").strip()
    parts.append(
        f"\nCLASSIFY THIS WRONG ANSWER:\n"
        f"Option {wrong_letter}: {wrong_text}\n\nRespond with JSON only."
    )
    return "\n\n".join(parts)


def build_rewrite_prompt(question_dict: dict, wrong_letter: str,
                         previous_attempt: dict, rejection_reason: str) -> str:
    question_block = build_question_block(question_dict, wrong_letter)
    prev_json = json.dumps(previous_attempt, indent=2, ensure_ascii=False)
    return (
        f"{question_block}\n\n"
        f"---\nPREVIOUS ATTEMPT (REJECTED):\n{prev_json}\n\n"
        f"REJECTION REASON: {rejection_reason}\n\n"
        "Fix the problem described above. Return corrected JSON only."
    )

# ---------------------------------------------------------------------------
# Validator agent
# ---------------------------------------------------------------------------

_VALID_TIERS       = {"L1", "L2", "L3"}
_VALID_ERROR_TYPES = {"Conceptual", "Procedural", "Lexical"}
_REQUIRED_KEYS     = {
    "distractor_tier", "distractor_error_type",
    "distractor_misconception", "distractor_skill_deficit",
}


def validator_agent(result: dict) -> Optional[str]:
    """
    Returns None if approved, or a plain-English rejection reason if not.
    The rejection reason is passed to the Rewriter so it knows exactly what to fix.
    """
    missing = _REQUIRED_KEYS - result.keys()
    if missing:
        return f"Response is missing required fields: {missing}"

    for key in _REQUIRED_KEYS:
        if not str(result[key]).strip():
            return f"Field '{key}' is empty."

    if result["distractor_tier"] not in _VALID_TIERS:
        return (f"distractor_tier must be L1, L2, or L3 — got '{result['distractor_tier']}'. "
                f"L1=most dangerous near-miss, L2=partially plausible, L3=implausible.")

    if result["distractor_error_type"] not in _VALID_ERROR_TYPES:
        return (f"distractor_error_type must be Conceptual, Procedural, or Lexical — "
                f"got '{result['distractor_error_type']}'.")

    misc = result["distractor_misconception"]
    misc_lower = misc.lower()

    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in misc_lower:
            return (
                f"distractor_misconception contains a forbidden template phrase: '{phrase}'. "
                f"Rewrite it as a direct statement of what the student believed to be true, "
                f"starting with 'Student believed...', 'Student thought...', 'Student conflated...', "
                f"or a similar belief verb."
            )

    word_count = len(misc.split())
    if word_count < 9:
        return (
            f"distractor_misconception is too short ({word_count} words). "
            f"Aim for 12+ words (9 accepted as soft floor). It must name a specific concept and describe "
            f"the false belief in enough detail to be instructionally useful."
        )

    if word_count > 55:
        return (
            f"distractor_misconception is too long ({word_count} words). "
            f"Trim to 40 words or fewer while keeping the core false belief."
        )

    skil = result["distractor_skill_deficit"]
    skil_words = len(skil.split())
    if skil_words < 3:
        return (
            f"distractor_skill_deficit is too short ({skil_words} words): '{skil}'. "
            f"Name the specific concept, law, or model that is missing — not just a topic area."
        )

    return None  # approved

# ---------------------------------------------------------------------------
# OpenAI call (shared by Generator and Rewriter)
# ---------------------------------------------------------------------------


def call_api(client: OpenAI, system_prompt: str, user_prompt: str,
             label: str, api_attempt: int = 0) -> Optional[dict]:
    """
    Single API call with exponential backoff on network/rate errors.
    Returns parsed dict or None on persistent failure.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
            max_tokens=350,
        )
        raw = response.choices[0].message.content or ""
        return json.loads(raw)

    except Exception as exc:
        if api_attempt >= 6:
            logger.error("  %s — API failed after 6 attempts: %s", label, exc)
            return None
        delay = min(BASE_DELAY * (2 ** api_attempt), 64) + random.random()
        logger.warning("  %s — API error (attempt %d): %s — retry in %.1fs",
                       label, api_attempt + 1, exc, delay)
        time.sleep(delay)
        return call_api(client, system_prompt, user_prompt, label, api_attempt + 1)

# ---------------------------------------------------------------------------
# Generator agent
# ---------------------------------------------------------------------------


def generator_agent(client: OpenAI, question_dict: dict,
                    wrong_letter: str, label: str) -> Optional[dict]:
    user_prompt = build_question_block(question_dict, wrong_letter)
    return call_api(client, GENERATOR_SYSTEM, user_prompt, label)

# ---------------------------------------------------------------------------
# Rewriter agent
# ---------------------------------------------------------------------------


def rewriter_agent(client: OpenAI, question_dict: dict, wrong_letter: str,
                   previous_attempt: dict, rejection_reason: str,
                   label: str) -> Optional[dict]:
    user_prompt = build_rewrite_prompt(
        question_dict, wrong_letter, previous_attempt, rejection_reason
    )
    return call_api(client, REWRITER_SYSTEM, user_prompt, label)

# ---------------------------------------------------------------------------
# CSV output
# ---------------------------------------------------------------------------

_CSV_HEADER = [
    "UNIQUEID", "distractor_letter", "distractor_tier",
    "distractor_error_type", "distractor_misconception", "distractor_skill_deficit",
]


def write_csv(skill_id: str, rows: list) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{skill_id}-phase-A.csv"
    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, quoting=csv.QUOTE_ALL)
        writer.writerow(_CSV_HEADER)
        for row in rows:
            writer.writerow([row.get(col, "") for col in _CSV_HEADER])
    return out_path

# ---------------------------------------------------------------------------
# Progress / summary printer
# ---------------------------------------------------------------------------


def print_skill_summary(skill_id: str, conn: sqlite3.Connection) -> None:
    counts = {
        row[0]: row[1]
        for row in conn.execute(
            "SELECT status, COUNT(*) FROM queue WHERE skill_id=? GROUP BY status",
            (skill_id,),
        )
    }
    total    = sum(counts.values())
    approved = counts.get("approved", 0)
    unresolved = counts.get("pending", 0) + counts.get("needs_rewrite", 0)
    exhausted = counts.get("exhausted", 0)

    bar_len = 30
    filled  = int(bar_len * approved / total) if total else 0
    bar     = "█" * filled + "░" * (bar_len - filled)

    logger.info(
        "  [%s] %s  ✅ %d approved  ⏳ %d pending  ❌ %d exhausted",
        bar, skill_id, approved, unresolved, exhausted,
    )


def print_item_result(label: str, status: str, result: Optional[dict],
                      rejection: Optional[str]) -> None:
    if status == "approved" and result:
        misc_preview = result["distractor_misconception"][:70]
        misc_preview += "…" if len(result["distractor_misconception"]) > 70 else ""
        logger.info(
            "  ✅ %s  tier=%s  type=%s\n     %s",
            label, result["distractor_tier"], result["distractor_error_type"], misc_preview,
        )
    elif status == "pending":
        logger.info("  🔄 %s  DEFERRED (pending) — %s", label, (rejection or "")[:100])
    elif status == "exhausted":
        logger.info("  ❌ %s  EXHAUSTED after %d rewrites", label, MAX_REWRITE_PASSES)

# ---------------------------------------------------------------------------
# Process one distractor (full generate → validate → rewrite loop)
# ---------------------------------------------------------------------------


def process_distractor(conn: sqlite3.Connection, client: OpenAI,
                       row_id: int, uniqueid: str, skill_id: str,
                       letter: str, question_json_str: str,
                       rewrite_attempts: int, result_json_str: Optional[str],
                       rejection_reason: Optional[str]) -> None:
    label = f"{uniqueid}/{letter}"
    question_dict = json.loads(question_json_str)

    # If this is a rewrite, use the previous result; otherwise generate fresh
    if rewrite_attempts > 0 and result_json_str and rejection_reason:
        previous = json.loads(result_json_str)
        result = rewriter_agent(client, question_dict, letter, previous, rejection_reason, label)
    else:
        result = generator_agent(client, question_dict, letter, label)

    if result is None:
        # API totally failed — mark pending so it's retried next run
        conn.execute(
            "UPDATE queue SET status='pending', last_error='API failure', updated_at=? WHERE id=?",
            (_now_iso(), row_id),
        )
        conn.commit()
        logger.warning("  ⚠ %s — API failure, will retry next run.", label)
        return

    rejection = validator_agent(result)

    if rejection is None:
        # APPROVED
        conn.execute(
            "UPDATE queue SET status='approved', result_json=?, "
            "rejection_reason=NULL, updated_at=? WHERE id=?",
            (json.dumps(result, ensure_ascii=False), _now_iso(), row_id),
        )
        conn.commit()
        print_item_result(label, "approved", result, None)

    elif rewrite_attempts >= MAX_REWRITE_PASSES:
        # EXHAUSTED — save best attempt we have, mark exhausted
        conn.execute(
            "UPDATE queue SET status='exhausted', result_json=?, "
            "rejection_reason=?, rewrite_attempts=?, updated_at=? WHERE id=?",
            (json.dumps(result, ensure_ascii=False), rejection,
             rewrite_attempts + 1, _now_iso(), row_id),
        )
        conn.commit()
        print_item_result(label, "exhausted", None, rejection)

    else:
        # Deferred for future run — keep it pending with context for rewriter.
        conn.execute(
            "UPDATE queue SET status='pending', result_json=?, "
            "rejection_reason=?, rewrite_attempts=rewrite_attempts+1, updated_at=? WHERE id=?",
            (json.dumps(result, ensure_ascii=False), rejection, _now_iso(), row_id),
        )
        conn.commit()
        print_item_result(label, "pending", result, rejection)

# ---------------------------------------------------------------------------
# Process one skill — all passes until nothing left to do
# ---------------------------------------------------------------------------


def process_skill(skill_id: str, client: OpenAI, passes_per_run: int = PASSES_PER_RUN) -> str:
    """
    Runs a limited number of passes per skill (default one pass).
    Approved rows are saved; unresolved rows remain pending for future runs.
    Returns a summary string.
    """
    conn = get_conn()
    ensure_queue_schema(conn)

    try:
        logger.info("")
        logger.info("══════════════════════════════════════════════")
        logger.info("  SKILL: %s", skill_id)
        logger.info("══════════════════════════════════════════════")

        pass_num = 0
        while pass_num < passes_per_run:
            pass_num += 1

            # Fetch everything not yet final
            rows = conn.execute(
                "SELECT id, uniqueid, distractor_letter, question_json, "
                "rewrite_attempts, result_json, rejection_reason "
                "FROM queue "
                "WHERE skill_id=? AND status IN ('pending','needs_rewrite') "
                "ORDER BY rewrite_attempts ASC",
                (skill_id,),
            ).fetchall()

            if not rows:
                break

            logger.info("")
            logger.info("  ── PASS %d  (%d items to process) ──", pass_num, len(rows))

            for row in rows:
                process_distractor(
                    conn, client,
                    row["id"], row["uniqueid"], skill_id,
                    row["distractor_letter"], row["question_json"],
                    row["rewrite_attempts"],
                    row["result_json"], row["rejection_reason"],
                )
                time.sleep(0.4)  # rate limit buffer

            print_skill_summary(skill_id, conn)

        remaining = conn.execute(
            "SELECT COUNT(*) FROM queue WHERE skill_id=? AND status IN ('pending','needs_rewrite')",
            (skill_id,),
        ).fetchone()[0]
        if remaining:
            logger.info("  ⏸ %s deferred %d unresolved items for later runs.", skill_id, remaining)

        # Write final CSV from approved rows
        approved_rows = conn.execute(
            "SELECT uniqueid, distractor_letter, result_json "
            "FROM queue WHERE skill_id=? AND status='approved'",
            (skill_id,),
        ).fetchall()

        results = []
        for r in approved_rows:
            res = json.loads(r["result_json"])
            results.append({
                "UNIQUEID":                 r["uniqueid"],
                "distractor_letter":        r["distractor_letter"],
                "distractor_tier":          res.get("distractor_tier", ""),
                "distractor_error_type":    res.get("distractor_error_type", ""),
                "distractor_misconception": res.get("distractor_misconception", ""),
                "distractor_skill_deficit": res.get("distractor_skill_deficit", ""),
            })

        # Also include exhausted rows (best attempt saved)
        exhausted_rows = conn.execute(
            "SELECT uniqueid, distractor_letter, result_json "
            "FROM queue WHERE skill_id=? AND status='exhausted'",
            (skill_id,),
        ).fetchall()
        exhausted_count = len(exhausted_rows)
        for r in exhausted_rows:
            if r["result_json"]:
                res = json.loads(r["result_json"])
                results.append({
                    "UNIQUEID":                 r["uniqueid"],
                    "distractor_letter":        r["distractor_letter"],
                    "distractor_tier":          res.get("distractor_tier", ""),
                    "distractor_error_type":    res.get("distractor_error_type", ""),
                    "distractor_misconception": res.get("distractor_misconception", ""),
                    "distractor_skill_deficit": res.get("distractor_skill_deficit", ""),
                })

        out_path = write_csv(skill_id, results)
        summary = (
            f"{skill_id}: {len(approved_rows)} approved, "
            f"{exhausted_count} exhausted after {MAX_REWRITE_PASSES} rewrites. "
            f"CSV → {out_path.name}"
        )
        logger.info("  ✅ %s", summary)
        return summary

    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Global summary after all skills
# ---------------------------------------------------------------------------


def print_global_summary(conn: sqlite3.Connection, skills: list) -> None:
    logger.info("")
    logger.info("══════════════════════════════════════════════════════")
    logger.info("  FINAL SUMMARY")
    logger.info("══════════════════════════════════════════════════════")
    logger.info("  %-10s  %7s  %7s  %9s  %9s",
                "SKILL", "TOTAL", "APPROVED", "EXHAUSTED", "PENDING")
    logger.info("  %s", "-" * 52)

    total_approved = 0
    total_exhausted = 0
    total_pending = 0

    for skill_id in skills:
        counts = {
            row[0]: row[1]
            for row in conn.execute(
                "SELECT status, COUNT(*) FROM queue WHERE skill_id=? GROUP BY status",
                (skill_id,),
            )
        }
        total = sum(counts.values())
        app   = counts.get("approved", 0)
        exh   = counts.get("exhausted", 0)
        pend  = counts.get("pending", 0) + counts.get("needs_rewrite", 0)

        total_approved  += app
        total_exhausted += exh
        total_pending   += pend

        status_icon = "✅" if pend == 0 and exh == 0 else ("⚠" if exh > 0 else "🔄")
        logger.info("  %s %-10s  %7d  %7d  %9d  %9d",
                    status_icon, skill_id, total, app, exh, pend)

    logger.info("  %s", "-" * 52)
    logger.info("  %-10s  %7s  %7d  %9d  %9d",
                "TOTAL", "", total_approved + total_exhausted + total_pending,
                total_approved, total_exhausted, total_pending)

    if total_pending > 0:
        logger.info("")
        logger.info("  %d items still pending — run again to continue.", total_pending)
    if total_exhausted > 0:
        logger.info("  %d items exhausted — review manually or run --reset-exhausted.", total_exhausted)

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    global MODEL
    all_skills = list(dict.fromkeys(TARGET_SKILLS + EXPAND_SKILLS))

    parser = argparse.ArgumentParser(
        description="Phase A multi-agent distractor classification pipeline."
    )
    parser.add_argument(
        "--skills", nargs="+", metavar="SKILL_ID", default=all_skills,
        help="Skill IDs to process. Default: all 31 skills.",
    )
    parser.add_argument(
        "--parallel", type=int, default=PARALLEL_SKILLS, metavar="N",
        help=f"How many skills to process simultaneously (default: {PARALLEL_SKILLS}).",
    )
    parser.add_argument(
        "--passes-per-run", type=int, default=PASSES_PER_RUN, metavar="N",
        help=f"How many passes per skill in one run (default: {PASSES_PER_RUN}).",
    )
    parser.add_argument(
        "--reset-exhausted", action="store_true",
        help="Reset exhausted rows back to pending so they get more rewrite attempts.",
    )
    parser.add_argument(
        "--test", action="store_true",
        help="Test mode: process only the first 3 distractors of the first skill.",
    )
    parser.add_argument(
        "--provider", choices=("openai", "gemini"), default="openai",
        help="Model provider to use (default: openai).",
    )
    args = parser.parse_args()

    requested = list(dict.fromkeys(args.skills))

    if args.provider == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise SystemExit(
                "\nERROR: GEMINI_API_KEY not set.\n"
                "Add GEMINI_API_KEY to your environment or .env file.\n"
            )
        client = OpenAI(api_key=api_key, base_url=GEMINI_BASE_URL)
        MODEL = os.environ.get("GEMINI_MODEL", GEMINI_MODEL)
    else:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise SystemExit(
                "\nERROR: OPENAI_API_KEY not set.\n"
                "Copy .env.example → .env and paste your OpenAI key.\n"
            )
        client = OpenAI(api_key=api_key)
        MODEL = os.environ.get("OPENAI_MODEL", OPENAI_MODEL)

    logger.info("Provider: %s | Model: %s", args.provider, MODEL)

    # Setup DB
    conn = get_conn()
    init_db(conn)
    ensure_queue_schema(conn)
    load_queue(conn, requested)

    if args.reset_exhausted:
        cur = conn.execute(
            "UPDATE queue SET status='pending', rewrite_attempts=0, "
            "rejection_reason=NULL WHERE status='exhausted' AND skill_id IN ({})".format(
                ",".join("?" * len(requested))
            ),
            requested,
        )
        conn.commit()
        logger.info("Reset %d exhausted rows to pending.", cur.rowcount)

    if args.test:
        # Test: 3 items from first skill only
        skill_id = requested[0]
        logger.info("TEST MODE — 3 distractors from %s", skill_id)
        rows = conn.execute(
            "SELECT id, uniqueid, distractor_letter, question_json, "
            "rewrite_attempts, result_json, rejection_reason "
            "FROM queue WHERE skill_id=? AND status IN ('pending','needs_rewrite') "
            "ORDER BY rewrite_attempts ASC LIMIT 3",
            (skill_id,),
        ).fetchall()
        for row in rows:
            process_distractor(
                conn, client,
                row["id"], row["uniqueid"], skill_id,
                row["distractor_letter"], row["question_json"],
                row["rewrite_attempts"], row["result_json"], row["rejection_reason"],
            )
            time.sleep(0.4)
        logger.info("")
        logger.info("Test complete. If output looks good, run without --test.")
        conn.close()
        return

    conn.close()  # each skill thread opens its own connection

    # Run skills in parallel
    summaries = []
    with ThreadPoolExecutor(max_workers=args.parallel) as executor:
        futures = {
            executor.submit(process_skill, skill_id, client, args.passes_per_run): skill_id
            for skill_id in requested
        }
        for future in as_completed(futures):
            skill_id = futures[future]
            try:
                summary = future.result()
                summaries.append(summary)
            except Exception as exc:
                logger.error("Skill %s crashed: %s", skill_id, exc)

    # Final global summary
    conn = get_conn()
    print_global_summary(conn, requested)
    conn.close()

    logger.info("")
    logger.info("Pipeline complete.")


if __name__ == "__main__":
    main()
