// src/utils/tutorQuizEngine.ts
// Deterministic quiz selection and evaluation.
// Claude only writes explanation prose — correctness is computed here.

import type { TutorUserContext } from '../types/tutorChat';

// Question shape from questions.json
export interface QuestionItem {
  id: string;
  question: string;
  skillId: string;
  choices: { A: string; B: string; C: string; D: string; E?: string; F?: string };
  correct_answer: string;                  // e.g. "B" or "A,C" for multi-select
  CORRECT_Explanation: string;
  distractor_misconception_A?: string;
  distractor_misconception_B?: string;
  distractor_misconception_C?: string;
  distractor_misconception_D?: string;
  // Phase C fields
  dominant_error_pattern?: string;
  instructional_red_flags?: string;
}

export interface QuizSelectionResult {
  question: QuestionItem;
  skillId: string;
  isMultiSelect: boolean;
}

export interface QuizEvaluationResult {
  isCorrect: boolean;
  correctAnswers: string[];
  selectedAnswers: string[];
  explanation: string;
  misconceptions: string[];    // misconceptions for chosen wrong answers
  skillId: string;
  // Phase C fields (passed through for remediation prompts)
  dominantErrorPattern?: string;
  instructionalRedFlags?: string;
}

/**
 * Select a quiz question using weighted random selection:
 *   - 60% from emerging skills
 *   - 25% from approaching skills
 *   - 15% from demonstrating/maintenance skills
 *
 * Excludes questionIds already used in the current session.
 *
 * If prioritySkillId is provided (adaptive retry), try that skill first.
 * Falls back to weighted selection if the priority skill pool is exhausted.
 */
export function selectQuizQuestion(
  ctx: TutorUserContext,
  questions: QuestionItem[],
  excludeQuestionIds: Set<string>,
  prioritySkillId?: string,
): QuizSelectionResult | null {
  // Priority skill override (adaptive retry): try this skill first
  if (prioritySkillId) {
    const priorityPool = questions.filter(
      q => q.skillId === prioritySkillId && !excludeQuestionIds.has(q.id)
    );
    if (priorityPool.length > 0) {
      const question = priorityPool[Math.floor(Math.random() * priorityPool.length)];
      const correctParts = question.correct_answer.split(',').map(s => s.trim());
      return { question, skillId: question.skillId, isMultiSelect: correctParts.length > 1 };
    }
    // Fall through to weighted selection if priority skill exhausted
  }

  // Build skill pools by tier
  const emergingIds = new Set(ctx.emergingSkills.map(s => s.skillId));
  const approachingIds = new Set(ctx.approachingSkills.map(s => s.skillId));

  const emergingPool = questions.filter(q => emergingIds.has(q.skillId) && !excludeQuestionIds.has(q.id));
  const approachingPool = questions.filter(q => approachingIds.has(q.skillId) && !excludeQuestionIds.has(q.id));
  const maintenancePool = questions.filter(q =>
    !emergingIds.has(q.skillId) &&
    !approachingIds.has(q.skillId) &&
    !excludeQuestionIds.has(q.id)
  );

  // Weighted random selection
  const roll = Math.random();
  let pool: QuestionItem[];
  if (roll < 0.60 && emergingPool.length > 0) {
    pool = emergingPool;
  } else if (roll < 0.85 && approachingPool.length > 0) {
    pool = approachingPool;
  } else if (maintenancePool.length > 0) {
    pool = maintenancePool;
  } else {
    // Fallback: any available question
    pool = [...emergingPool, ...approachingPool, ...maintenancePool];
  }

  if (pool.length === 0) return null;

  const question = pool[Math.floor(Math.random() * pool.length)];
  const correctParts = question.correct_answer.split(',').map(s => s.trim());

  return {
    question,
    skillId: question.skillId,
    isMultiSelect: correctParts.length > 1,
  };
}

/**
 * Evaluate a quiz answer. Returns structured result; Claude uses this
 * to write the explanation prose.
 */
export function evaluateQuizAnswer(
  question: QuestionItem,
  selectedAnswers: string[],
): QuizEvaluationResult {
  const correctAnswers = question.correct_answer.split(',').map(s => s.trim().toUpperCase());
  const selected = selectedAnswers.map(s => s.trim().toUpperCase());

  // All-or-nothing for multi-select
  const isCorrect =
    selected.length === correctAnswers.length &&
    selected.every(a => correctAnswers.includes(a));

  // Collect misconceptions for wrong answers chosen
  const misconceptions: string[] = [];
  for (const ans of selected) {
    if (!correctAnswers.includes(ans)) {
      const key = `distractor_misconception_${ans}` as keyof QuestionItem;
      const misconception = question[key] as string | undefined;
      if (misconception) misconceptions.push(misconception);
    }
  }

  return {
    isCorrect,
    correctAnswers,
    selectedAnswers: selected,
    explanation: question.CORRECT_Explanation,
    misconceptions,
    skillId: question.skillId,
    dominantErrorPattern: question.dominant_error_pattern,
    instructionalRedFlags: question.instructional_red_flags,
  };
}
