// src/utils/questionDifficulty.ts
// Question difficulty tier system — maps available question metadata to
// instructional tiers that drive adaptive difficulty progression.
//
// Data audit (2026-03-31): The question bank has cognitiveComplexity
// ('Recall' | 'Application'). dok and stemType are not present in the
// current bank. This module maps what IS available to 2 tiers.
//
// Learning science rationale:
//   Declarative knowledge (Tier 1) should be consolidated before procedural /
//   conditional application (Tier 2). Presenting Tier 2 questions to a student
//   who hasn't mastered Tier 1 leads to surface-level pattern matching.

import type { AnalyzedQuestion } from '../brain/question-analyzer';

/**
 * Difficulty tier derived from question metadata.
 *
 * Tier 1 — Recall:       cognitiveComplexity === 'Recall'
 *   Declarative knowledge: definitions, principle identification,
 *   "what is X" or "which term describes Y"
 *
 * Tier 2 — Application:  cognitiveComplexity === 'Application'
 *   Procedural / conditional: scenario vignettes, "what should the
 *   psychologist do next", clinical judgement questions
 */
export type QuestionTier = 1 | 2;

/**
 * Assign a difficulty tier to a question from its cognitiveComplexity metadata.
 * Returns null for questions with missing or unrecognised complexity tags —
 * these are treated as tier-neutral (eligible at any mastery level).
 */
export function getQuestionTier(question: AnalyzedQuestion): QuestionTier | null {
  const cc = question.cognitiveComplexity;
  if (!cc) return null;
  if (cc === 'Recall') return 1;
  if (cc === 'Application') return 2;
  // Unknown value — treat as untiered
  return null;
}

/**
 * Return the preferred difficulty tier given a skill's current accuracy.
 *
 * accuracy < 0.40 (< 40%) → Tier 1 (Recall)
 *   Student needs to consolidate declarative knowledge before application.
 *
 * accuracy >= 0.40 (≥ 40%) → Tier 2 (Application)
 *   Student has enough foundational knowledge to benefit from scenario practice.
 *
 * The 40% threshold was chosen because below it the student is answering
 * at near-chance level — scenario questions at this stage reinforce guessing
 * rather than understanding.
 */
export function getPreferredTier(skillAccuracy: number): QuestionTier {
  return skillAccuracy < 0.40 ? 1 : 2;
}

/**
 * Filter a candidate pool to the preferred tier for the given skill accuracy,
 * falling back to the full pool if no tier-matched questions exist.
 *
 * @param candidates  Questions already filtered to the target skill(s)
 * @param minAccuracy Lowest accuracy across all target skills in the pool
 * @returns           Filtered array (preferred tier) or full candidates (fallback)
 */
export function filterByPreferredTier(
  candidates: AnalyzedQuestion[],
  minAccuracy: number
): AnalyzedQuestion[] {
  const preferred = getPreferredTier(minAccuracy);
  const tierFiltered = candidates.filter(q => getQuestionTier(q) === preferred);
  // Fall back to the full pool if no tier-matched questions are available
  // (e.g. all remaining questions for this skill are the other tier)
  return tierFiltered.length > 0 ? tierFiltered : candidates;
}
