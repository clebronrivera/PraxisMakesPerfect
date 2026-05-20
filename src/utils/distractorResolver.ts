// src/utils/distractorResolver.ts
//
// Resolves distractor metadata for a given question and selected answer letter.
// Input comes from questions.json fields; output is used by the study plan
// preprocessor and is available for future adaptive routing.

export interface DistractorInfo {
  /** 'L1' = primary/most-common misconception, 'L2' = secondary. null if not tagged. */
  tier: string | null;
  /** 'Conceptual' | 'Procedural' | 'Factual'. null if not tagged. */
  errorType: string | null;
  /** First-person belief statement: "Student believed X". null if not tagged. */
  misconception: string | null;
  /** Specific knowledge gap behind this wrong choice. null if not tagged. */
  skillDeficit: string | null;
  /** Short grouping tag across questions, e.g. 'indirect-direct-confusion'. */
  errorClusterTag: string | null;
}

/**
 * Given a raw question record (from questions.json) and the letter the student
 * selected (A–F), return the distractor metadata for that choice.
 *
 * Returns nulls for any field that is absent or empty in the source data.
 * Safe to call with any letter — unknown letters produce all-null output.
 */
export function resolveDistractorInfo(
  question: Record<string, string>,
  letter: string,
): DistractorInfo {
  const L = letter.toUpperCase();
  return {
    tier:           question[`distractor_tier_${L}`]         || null,
    errorType:      question[`distractor_error_type_${L}`]   || null,
    misconception:  question[`distractor_misconception_${L}`] || null,
    skillDeficit:   question[`distractor_skill_deficit_${L}`] || null,
    errorClusterTag: question.error_cluster_tag               || null,
  };
}
