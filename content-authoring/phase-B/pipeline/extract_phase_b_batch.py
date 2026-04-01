#!/usr/bin/env python3
"""
extract_phase_b_batch.py
------------------------
Generates formatted question blocks for Phase B regeneration via Claude.ai Coworker.

Usage:
    python3 content-authoring/pipeline/extract_phase_b_batch.py <SKILL_ID> <BATCH_NUMBER>

Examples:
    python3 content-authoring/pipeline/extract_phase_b_batch.py PSY-01 1
    python3 content-authoring/pipeline/extract_phase_b_batch.py SWP-04 3

Output:
    Prints the formatted question block to stdout.
    Copy-paste the output into the [PASTE QUESTIONS HERE] slot in the Coworker prompt.

Batch size: 10 questions per batch.
    Batch 1 = questions 1-10
    Batch 2 = questions 11-20
    Batch 3 = questions 21-30
    etc.
"""

from __future__ import annotations
import json
import csv
import os
import sys
from pathlib import Path

BATCH_SIZE = 10

# Known skill names for the 29 collapsed Phase B skills
SKILL_NAMES: dict[str, str] = {
    "ACA-02": "Accommodations, Modifications, and Instructional Supports",
    "ACA-03": "Academic Assessment and Progress Monitoring",
    "ACA-04": "Curriculum-Based Measurement and Formative Assessment",
    "ACA-06": "Reading Instruction and Intervention",
    "ACA-07": "Mathematics Instruction and Intervention",
    "ACA-08": "Written Language Instruction and Executive Function Supports",
    "ACA-09": "Self-Regulated Learning and Study Skills",
    "DBD-01": "Intellectual Disability — Classification and Identification",
    "DBD-05": "Emotional and Behavioral Disorders",
    "DBD-06": "Autism Spectrum Disorder — Assessment",
    "DBD-07": "Specific Learning Disabilities — Identification Models",
    "DBD-08": "Specific Learning Disabilities — Reading Profiles",
    "DBD-09": "Attention-Deficit/Hyperactivity Disorder",
    "DBD-10": "Gifted and Twice-Exceptional Learners",
    "DEV-01": "Child and Adolescent Development",
    "DIV-01": "Culturally Responsive Practice and Assessment",
    "DIV-03": "English Language Acquisition and Bilingualism",
    "DIV-05": "Disproportionality, Bias, and Equity in Assessment",
    "FAM-02": "Family Engagement and Home-School Collaboration",
    "FAM-03": "Interagency Collaboration and Transition Planning",
    "PSY-01": "Psychometric Theory and Norm-Referenced Score Interpretation",
    "PSY-02": "Neurodevelopmental Disorders — Diagnosis and Presentation",
    "PSY-03": "Social-Emotional Learning and Internalizing Disorders",
    "PSY-04": "School-Based Mental Health Intervention",
    "RES-02": "Research Literacy and Evidence-Based Practice",
    "RES-03": "Data-Based Decision Making",
    "SWP-02": "MTSS Tier 2 — Targeted Intervention",
    "SWP-03": "MTSS Tier 3 — Intensive Support",
    "SWP-04": "MTSS Architecture and Fidelity Monitoring",
    # Clean skills (included for convenience if re-run is ever needed)
    "CON-01": "Consultation Models and Problem-Solving",
    "ETH-01": "NASP Ethics — Foundations",
    "ETH-02": "NASP Ethics — Application",
    "ETH-03": "Professional Practices and Supervision",
    "LEG-01": "FERPA and Student Privacy",
    "LEG-02": "IDEA — Core Principles",
    "LEG-03": "Section 504 and ADA",
    "LEG-04": "NCLB/ESSA and Educational Accountability",
    "MBH-02": "Social-Emotional and Behavioral Interventions",
    "MBH-03": "Cognitive-Behavioral and Applied Behavior Analysis",
    "MBH-04": "Autism and Neurodevelopmental Interventions",
    "MBH-05": "Crisis Intervention",
    "SAF-01": "PBIS and Positive Behavioral Supports",
    "SAF-03": "Threat Assessment and School Safety",
    "SAF-04": "Suicide Prevention and Crisis Response",
    "SWP-04": "MTSS Architecture and Fidelity Monitoring",
}

# Paths — all relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # phase-B/pipeline/ → phase-B/ → content-authoring/ → repo root
QUESTIONS_PATH = REPO_ROOT / "src" / "data" / "questions.json"
PHASE_B_DIR = REPO_ROOT / "content-authoring" / "phase-B" / "output"


def load_questions() -> dict[str, dict]:
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)
    return {q["UNIQUEID"]: q for q in questions}


def load_phase_b_uids(skill_id: str) -> list[str]:
    csv_path = PHASE_B_DIR / f"{skill_id}-phase-B.csv"
    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found.", file=sys.stderr)
        sys.exit(1)
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row["UNIQUEID"].strip() for row in reader if row.get("UNIQUEID", "").strip()]


def format_question_block(uid: str, q: dict, index: int) -> str:
    stem = q.get("question_stem", "[STEM NOT FOUND]")
    correct = q.get("correct_answers", "?")

    lines = [
        f"--- QUESTION {index} ---",
        f"UNIQUEID: {uid}",
        f"STEM: {stem}",
    ]

    for letter in ["A", "B", "C", "D", "E", "F"]:
        opt = q.get(letter, "").strip()
        if opt and opt.upper() not in ("UNUSED", ""):
            marker = "*" if letter in correct else " "
            lines.append(f"  {letter}{marker}: {opt}")

    lines.append(f"CORRECT: {correct}")
    return "\n".join(lines)


def get_skill_name(skill_id: str) -> str:
    return SKILL_NAMES.get(skill_id, skill_id)


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 extract_phase_b_batch.py <SKILL_ID> <BATCH_NUMBER>")
        print("Example: python3 extract_phase_b_batch.py PSY-01 1")
        sys.exit(1)

    skill_id = sys.argv[1].upper()
    try:
        batch_num = int(sys.argv[2])
    except ValueError:
        print(f"ERROR: batch number must be an integer, got '{sys.argv[2]}'")
        sys.exit(1)

    if batch_num < 1:
        print("ERROR: batch number must be >= 1")
        sys.exit(1)

    questions_by_id = load_questions()
    all_uids = load_phase_b_uids(skill_id)

    total = len(all_uids)
    start_idx = (batch_num - 1) * BATCH_SIZE  # 0-based
    end_idx = min(start_idx + BATCH_SIZE, total)

    if start_idx >= total:
        max_batch = (total + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"ERROR: {skill_id} only has {total} questions ({max_batch} batches). Batch {batch_num} doesn't exist.")
        sys.exit(1)

    batch_uids = all_uids[start_idx:end_idx]
    skill_name = get_skill_name(skill_id)

    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    # Print header info for the prompt
    print("=" * 70)
    print(f"SKILL ID:   {skill_id}")
    print(f"SKILL NAME: {skill_name}")
    print(f"BATCH:      {batch_num} of {total_batches}  (questions {start_idx+1}–{end_idx} of {total})")
    print("=" * 70)
    print()
    print("PASTE THIS BLOCK INTO [PASTE QUESTIONS HERE] IN THE COWORKER PROMPT:")
    print()

    blocks = []
    for i, uid in enumerate(batch_uids, start=start_idx + 1):
        q = questions_by_id.get(uid)
        if q is None:
            blocks.append(f"--- QUESTION {i} ---\nUNIQUEID: {uid}\n[NOT FOUND IN questions.json]")
        else:
            blocks.append(format_question_block(uid, q, i))

    print("\n\n".join(blocks))
    print()
    print("=" * 70)
    print(f"Expected CSV output: {len(batch_uids)} rows")
    print(f"Columns: UNIQUEID,construct_actually_tested,complexity_rationale")
    print("=" * 70)


if __name__ == "__main__":
    main()
