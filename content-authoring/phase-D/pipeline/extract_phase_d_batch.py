#!/usr/bin/env python3
"""
extract_phase_d_batch.py
------------------------
Generates formatted skill blocks for Phase D content authoring via Claude.ai Coworker.

Phase D fields per SKILL (not per question):
  - nasp_domain_primary      — which of the 10 NASP practice domains this skill belongs to
  - skill_prerequisites      — bulleted list of what a student must know before this skill
  - prereq_chain_narrative   — 2–4 sentences describing the learning sequence

Output goes into src/data/skill-phase-d.json via scripts/apply-phase-d.mjs.

Each skill block includes:
  - Skill ID and name
  - Question count in the bank
  - 4 sample question stems (to show the agent what the skill covers)
  - Sample construct_actually_tested values (Phase B — shows sub-construct range)

Usage:
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py <BATCH_NUMBER>

Examples:
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 1  # skills 1-10
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 2  # skills 11-20
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 3  # skills 21-30
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 4  # skills 31-40
    python3 content-authoring/phase-D/pipeline/extract_phase_d_batch.py 5  # skills 41-45

Batch size: 10 skills per batch (5 batches total for all 45 skills).
"""

from __future__ import annotations
import json
import sys
import random
from pathlib import Path

BATCH_SIZE = 10
SAMPLE_STEMS = 4     # question stems to show per skill
SAMPLE_CONSTRUCTS = 4  # construct_actually_tested values to show per skill

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

# Stable ordered list of all 45 skill IDs (alphabetical)
ALL_SKILLS: list[str] = sorted(SKILL_NAMES.keys())

NASP_DOMAINS = {
    "NASP-1":  "Data-Based Decision Making and Accountability",
    "NASP-2":  "Consultation and Collaboration",
    "NASP-3":  "Academic Interventions",
    "NASP-4":  "Mental and Behavioral Health Services",
    "NASP-5":  "School-Wide Practices to Promote Learning",
    "NASP-6":  "Preventive and Responsive Services",
    "NASP-7":  "Family-School Collaboration Services",
    "NASP-8":  "Diversity in Development and Learning",
    "NASP-9":  "Research and Evidence-Based Practice",
    "NASP-10": "Legal, Ethical, and Professional Practice",
}

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
QUESTIONS_PATH = REPO_ROOT / "src" / "data" / "questions.json"


def load_questions() -> dict[str, list[dict]]:
    """Returns a dict mapping skill_id → list of questions for that skill."""
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)
    by_skill: dict[str, list[dict]] = {}
    for q in questions:
        sid = q.get("current_skill_id") or q.get("skillId")
        if not sid:
            continue
        by_skill.setdefault(sid, []).append(q)
    return by_skill


def format_skill_block(skill_id: str, questions: list[dict], index: int) -> str:
    skill_name = SKILL_NAMES.get(skill_id, skill_id)
    total = len(questions)

    lines = [
        f"--- SKILL {index} ---",
        f"SKILL ID:   {skill_id}",
        f"SKILL NAME: {skill_name}",
        f"QUESTIONS:  {total} in the bank",
        "",
    ]

    # Sample stems (deterministic: take first N by UNIQUEID sort)
    sorted_qs = sorted(questions, key=lambda q: q.get("UNIQUEID", ""))
    sample_qs = sorted_qs[:SAMPLE_STEMS]

    lines.append("SAMPLE QUESTION STEMS (what this skill actually tests):")
    for q in sample_qs:
        stem = q.get("question_stem", q.get("question", "")).strip()
        if stem:
            # Truncate very long stems
            stem = stem[:200] + ("..." if len(stem) > 200 else "")
            lines.append(f"  • {stem}")

    lines.append("")

    # Sample construct_actually_tested values (Phase B)
    constructs = [
        q.get("construct_actually_tested", "").strip()
        for q in sorted_qs
        if q.get("construct_actually_tested", "").strip()
    ]
    unique_constructs = list(dict.fromkeys(constructs))  # preserve order, deduplicate
    sample_constructs = unique_constructs[:SAMPLE_CONSTRUCTS]

    if sample_constructs:
        lines.append("SAMPLE SUB-CONSTRUCTS (what specific things within this skill are tested):")
        for c in sample_constructs:
            lines.append(f"  • {c}")
        lines.append("")

    lines.append("OUTPUT FIELDS TO WRITE:")
    lines.append("  nasp_domain_primary    : [one code from NASP-1 through NASP-10]")
    lines.append("  skill_prerequisites    : [bulleted list, 3–8 items]")
    lines.append("  prereq_chain_narrative : [2–4 sentences]")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 extract_phase_d_batch.py <BATCH_NUMBER>")
        print("Example: python3 extract_phase_d_batch.py 1")
        print(f"  Total skills: {len(ALL_SKILLS)}  Total batches: {(len(ALL_SKILLS) + BATCH_SIZE - 1) // BATCH_SIZE}")
        sys.exit(1)

    try:
        batch_num = int(sys.argv[1])
    except ValueError:
        print(f"ERROR: batch number must be an integer, got '{sys.argv[1]}'")
        sys.exit(1)

    if batch_num < 1:
        print("ERROR: batch number must be >= 1")
        sys.exit(1)

    total_skills = len(ALL_SKILLS)
    total_batches = (total_skills + BATCH_SIZE - 1) // BATCH_SIZE
    start_idx = (batch_num - 1) * BATCH_SIZE
    end_idx = min(start_idx + BATCH_SIZE, total_skills)

    if start_idx >= total_skills:
        print(f"ERROR: only {total_batches} batches exist. Batch {batch_num} doesn't exist.")
        sys.exit(1)

    batch_skills = ALL_SKILLS[start_idx:end_idx]
    questions_by_skill = load_questions()

    print("=" * 70)
    print(f"PHASE D EXTRACTION")
    print(f"BATCH:  {batch_num} of {total_batches}  (skills {start_idx+1}–{end_idx} of {total_skills})")
    print(f"SKILLS: {', '.join(batch_skills)}")
    print("=" * 70)
    print()
    print("PASTE THIS BLOCK INTO [PASTE SKILLS HERE] IN THE COWORKER PROMPT:")
    print()

    blocks = []
    for i, skill_id in enumerate(batch_skills, start=start_idx + 1):
        qs = questions_by_skill.get(skill_id, [])
        blocks.append(format_skill_block(skill_id, qs, i))

    print("\n\n".join(blocks))
    print()
    print("=" * 70)
    print(f"Expected JSON output: {len(batch_skills)} skill objects")
    print(f"Fields per skill: skill_id, nasp_domain_primary, skill_prerequisites, prereq_chain_narrative")
    print("=" * 70)

    # Print NASP domain reference at the end
    print()
    print("NASP DOMAIN REFERENCE:")
    for code, name in NASP_DOMAINS.items():
        print(f"  {code}: {name}")


if __name__ == "__main__":
    main()
