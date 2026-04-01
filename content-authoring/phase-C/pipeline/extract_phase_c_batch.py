#!/usr/bin/env python3
"""
extract_phase_c_batch.py
------------------------
Generates formatted question blocks for Phase C content authoring via Claude.ai Coworker.

Phase C fields per question:
  - dominant_error_pattern    — the most common reasoning failure across ALL distractors (1–2 sentences)
  - error_cluster_tag         — 1–4 word tag from TAG_GLOSSARY.md (e.g. model-conflation)
  - instructional_red_flags   — actionable teaching signal when a student misses this (2–4 sentences)

Each block includes:
  - Question stem and all choices (with CORRECT markers)
  - Phase B construct_actually_tested (what the question specifically tests)
  - Phase A distractor classifications for each wrong answer:
      tier (L1/L2/L3), error_type, misconception, skill_deficit

Phase C synthesizes ACROSS distractors — the agent needs all Phase A data in view.

Usage:
    python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py <SKILL_ID> <BATCH_NUMBER>

Examples:
    python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py CON-01 1
    python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py LEG-02 3
    python3 content-authoring/phase-C/pipeline/extract_phase_c_batch.py PSY-01 2

Batch size: 10 questions per batch.
    Batch 1 = questions 1–10
    Batch 2 = questions 11–20
    etc.
"""

from __future__ import annotations
import json
import sys
from pathlib import Path

BATCH_SIZE = 10

SKILL_NAMES: dict[str, str] = {
    "ACA-02": "Accommodations, Modifications, and Instructional Supports",
    "ACA-03": "Academic Assessment and Progress Monitoring",
    "ACA-04": "Curriculum-Based Measurement and Formative Assessment",
    "ACA-06": "Reading Instruction and Intervention",
    "ACA-07": "Mathematics Instruction and Intervention",
    "ACA-08": "Written Language Instruction and Executive Function Supports",
    "ACA-09": "Self-Regulated Learning and Study Skills",
    "CON-01": "Consultation Models and Problem-Solving",
    "DBD-01": "Intellectual Disability — Classification and Identification",
    "DBD-03": "Assessment Models and Psychoeducational Evaluation",
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
    "ETH-01": "NASP Ethics — Foundations",
    "ETH-02": "NASP Ethics — Application",
    "ETH-03": "Professional Practices and Supervision",
    "FAM-02": "Family Engagement and Home-School Collaboration",
    "FAM-03": "Interagency Collaboration and Transition Planning",
    "LEG-01": "FERPA and Student Privacy",
    "LEG-02": "IDEA — Core Principles",
    "LEG-03": "Section 504 and ADA",
    "LEG-04": "NCLB/ESSA and Educational Accountability",
    "MBH-02": "Social-Emotional and Behavioral Interventions",
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
}

# Paths — all relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # pipeline/ → phase-C/ → content-authoring/ → repo root
QUESTIONS_PATH = REPO_ROOT / "src" / "data" / "questions.json"


def load_questions() -> dict[str, dict]:
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)
    return {q["UNIQUEID"]: q for q in questions if q.get("UNIQUEID")}


def get_skill_questions(questions_by_id: dict[str, dict], skill_id: str) -> list[dict]:
    """Return all questions for a skill, sorted by UNIQUEID for stable ordering."""
    skill_qs = [
        q for q in questions_by_id.values()
        if q.get("current_skill_id") == skill_id or q.get("skillId") == skill_id
    ]
    return sorted(skill_qs, key=lambda q: q.get("UNIQUEID", ""))


def format_question_block(q: dict, index: int) -> str:
    uid = q.get("UNIQUEID", "[NO UNIQUEID]")
    stem = q.get("question_stem", q.get("question", "[STEM NOT FOUND]"))
    correct_raw = q.get("correct_answers", "")
    # correct_answers may be a comma-separated string or a list
    if isinstance(correct_raw, list):
        correct_letters = set(correct_raw)
    else:
        correct_letters = set(c.strip() for c in correct_raw.split(",") if c.strip())

    construct = q.get("construct_actually_tested", "").strip()

    lines = [
        f"--- QUESTION {index} ---",
        f"UNIQUEID: {uid}",
        f"STEM: {stem}",
    ]

    if construct:
        lines.append(f"TESTS: {construct}")

    lines.append("")
    lines.append("CHOICES:")
    for letter in ["A", "B", "C", "D", "E", "F"]:
        opt = q.get(letter, "").strip()
        if opt and opt.upper() not in ("UNUSED", ""):
            marker = " ← CORRECT" if letter in correct_letters else ""
            lines.append(f"  {letter}: {opt}{marker}")

    # Phase A distractor classifications per wrong answer
    lines.append("")
    lines.append("DISTRACTOR CLASSIFICATIONS (Phase A):")
    has_phase_a = False
    for letter in ["A", "B", "C", "D", "E", "F"]:
        opt = q.get(letter, "").strip()
        if not opt or opt.upper() in ("UNUSED", ""):
            continue
        if letter in correct_letters:
            continue  # skip correct answer

        tier = q.get(f"distractor_tier_{letter}", "").strip()
        error_type = q.get(f"distractor_error_type_{letter}", "").strip()
        misconception = q.get(f"distractor_misconception_{letter}", "").strip()
        skill_deficit = q.get(f"distractor_skill_deficit_{letter}", "").strip()

        if any([tier, error_type, misconception, skill_deficit]):
            has_phase_a = True
            tier_str = tier if tier else "?"
            etype_str = error_type if error_type else "?"
            lines.append(f"  {letter} [{tier_str} | {etype_str}]:")
            if misconception:
                lines.append(f"    Misconception : {misconception}")
            if skill_deficit:
                lines.append(f"    Knowledge gap : {skill_deficit}")
        else:
            has_phase_a = True
            lines.append(f"  {letter}: (no Phase A classification)")

    if not has_phase_a:
        lines.append("  (No Phase A classifications found for this question)")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 extract_phase_c_batch.py <SKILL_ID> <BATCH_NUMBER>")
        print("Example: python3 extract_phase_c_batch.py CON-01 1")
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
    skill_questions = get_skill_questions(questions_by_id, skill_id)

    if not skill_questions:
        print(f"ERROR: No questions found for skill '{skill_id}' in questions.json.")
        print(f"  Known field: current_skill_id. Check the skill ID is correct.")
        sys.exit(1)

    total = len(skill_questions)
    start_idx = (batch_num - 1) * BATCH_SIZE
    end_idx = min(start_idx + BATCH_SIZE, total)

    if start_idx >= total:
        max_batch = (total + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"ERROR: {skill_id} only has {total} questions ({max_batch} batches). Batch {batch_num} doesn't exist.")
        sys.exit(1)

    batch_questions = skill_questions[start_idx:end_idx]
    skill_name = SKILL_NAMES.get(skill_id, skill_id)
    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    print("=" * 70)
    print(f"SKILL ID:   {skill_id}")
    print(f"SKILL NAME: {skill_name}")
    print(f"BATCH:      {batch_num} of {total_batches}  (questions {start_idx+1}–{end_idx} of {total})")
    print("=" * 70)
    print()
    print("PASTE THIS BLOCK INTO [PASTE QUESTIONS HERE] IN THE COWORKER PROMPT:")
    print()

    blocks = []
    for i, q in enumerate(batch_questions, start=start_idx + 1):
        blocks.append(format_question_block(q, i))

    print("\n\n".join(blocks))
    print()
    print("=" * 70)
    print(f"Expected CSV output: {len(batch_questions)} rows")
    print(f"Columns: UNIQUEID,dominant_error_pattern,error_cluster_tag,instructional_red_flags")
    print("=" * 70)


if __name__ == "__main__":
    main()
