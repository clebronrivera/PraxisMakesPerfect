// Learning State Model - Tracks skill mastery progression
// States: emerging → developing → proficient → mastery

import { SkillId, getSkillById } from './skill-map';

/**
 * Calculate confidence weight modifier
 * High+Correct: x1.2 (true mastery)
 * High+Wrong: x0.5 (misconception)
 * Low+Correct: x0.8 (shaky/guess)
 * Low+Wrong: x1.0 (expected gap)
 * Medium: x1.0 (neutral)
 */
export function calculateConfidenceWeight(
  confidence: 'low' | 'medium' | 'high',
  isCorrect: boolean
): number {
  if (confidence === 'high' && isCorrect) return 1.2;
  if (confidence === 'high' && !isCorrect) return 0.5;
  if (confidence === 'low' && isCorrect) return 0.8;
  if (confidence === 'low' && !isCorrect) return 1.0;
  return 1.0; // medium or default
}

/**
 * Calculate weighted accuracy from attempt history
 */
export function calculateWeightedAccuracy(attemptHistory: SkillAttempt[]): number {
  if (attemptHistory.length === 0) return 0;
  
  let totalWeight = 0;
  let correctWeight = 0;
  
  attemptHistory.forEach(attempt => {
    const weight = calculateConfidenceWeight(attempt.confidence, attempt.correct);
    totalWeight += weight;
    if (attempt.correct) {
      correctWeight += weight;
    }
  });
  
  return totalWeight > 0 ? correctWeight / totalWeight : 0;
}

/**
 * Count high+wrong attempts (misconceptions)
 */
export function countConfidenceFlags(attemptHistory: SkillAttempt[]): number {
  return attemptHistory.filter(
    a => a.confidence === 'high' && !a.correct
  ).length;
}

export type LearningState = 'emerging' | 'developing' | 'proficient' | 'mastery';

export interface SkillAttempt {
  questionId: string;
  correct: boolean;
  confidence: 'low' | 'medium' | 'high';
  timestamp: number;
  timeSpent: number;
}

export interface SkillPerformance {
  score: number;              // Lifetime accuracy (0-1)
  attempts: number;           // Total attempts
  correct: number;            // Total correct
  consecutiveCorrect: number; // Current streak
  history: boolean[];         // Last 5 results (true=correct)
  learningState: LearningState;
  masteryDate?: number;       // Timestamp when mastery was first reached
  attemptHistory?: SkillAttempt[]; // Raw attempt history (bounded to last 50-100)
  weightedAccuracy?: number;  // Confidence-weighted accuracy
  confidenceFlags?: number;    // Count of high+wrong (misconceptions)
}

/**
 * Check if all prerequisites for a skill are met (mastery state)
 * @param skillId The skill to check prerequisites for
 * @param skillPerformance Lookup function to get performance data for a skill
 * @returns true if all prerequisites are mastered, false otherwise
 */
export function checkPrerequisitesMet(
  skillId: SkillId,
  skillPerformance: (id: SkillId) => SkillPerformance | undefined
): boolean {
  const skill = getSkillById(skillId);
  if (!skill || !skill.prerequisites || skill.prerequisites.length === 0) {
    return true; // No prerequisites, so they're all met
  }

  // Check each prerequisite recursively
  for (const prereqId of skill.prerequisites) {
    const prereqPerf = skillPerformance(prereqId);
    if (!prereqPerf || prereqPerf.learningState !== 'mastery') {
      return false; // At least one prerequisite is not mastered
    }
    
    // Recursively check prerequisites of prerequisites
    if (!checkPrerequisitesMet(prereqId, skillPerformance)) {
      return false;
    }
  }

  return true; // All prerequisites are mastered
}

/**
 * Calculate the learning state for a skill based on performance metrics
 * @param performance The skill's performance data
 * @param skillId The skill ID (for prerequisite checking)
 * @param skillPerformance Lookup function to check prerequisites
 * @returns The calculated learning state
 */
export function calculateLearningState(
  performance: SkillPerformance,
  skillId: SkillId,
  skillPerformance: (id: SkillId) => SkillPerformance | undefined
): LearningState {
  const { score, attempts, consecutiveCorrect, history } = performance;

  // Check prerequisites first - can't progress beyond emerging if prerequisites aren't met
  if (!checkPrerequisitesMet(skillId, skillPerformance)) {
    return 'emerging';
  }

  // Need minimum attempts to assess state
  if (attempts < 3) {
    return 'emerging';
  }

  // Mastery: High accuracy + strong recent performance + prerequisites met
  if (
    score >= 0.85 &&
    consecutiveCorrect >= 5 &&
    history.length >= 5 &&
    history.filter(h => h).length >= 4 // At least 4/5 recent correct
  ) {
    return 'mastery';
  }

  // Proficient: Good accuracy with consistent performance
  if (
    score >= 0.75 &&
    consecutiveCorrect >= 3 &&
    history.length >= 3 &&
    history.filter(h => h).length >= 2 // At least 2/3 recent correct
  ) {
    return 'proficient';
  }

  // Developing: Some progress but inconsistent
  if (
    score >= 0.60 ||
    consecutiveCorrect >= 2 ||
    (history.length > 0 && history.filter(h => h).length > 0)
  ) {
    return 'developing';
  }

  // Emerging: Default state for new or struggling skills
  return 'emerging';
}

/**
 * Get the next learning state in progression
 */
export function getNextState(current: LearningState): LearningState | null {
  const progression: LearningState[] = ['emerging', 'developing', 'proficient', 'mastery'];
  const currentIndex = progression.indexOf(current);
  return currentIndex < progression.length - 1 ? progression[currentIndex + 1] : null;
}

/**
 * Check if a state transition occurred
 */
export function didStateTransition(
  oldState: LearningState | undefined,
  newState: LearningState
): boolean {
  if (!oldState) return true; // First time tracking
  if (oldState === newState) return false;
  
  const progression: LearningState[] = ['emerging', 'developing', 'proficient', 'mastery'];
  const oldIndex = progression.indexOf(oldState);
  const newIndex = progression.indexOf(newState);
  
  return newIndex > oldIndex; // Only count forward progress
}
