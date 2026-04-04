/**
 * Concept-Level Analytics Engine
 *
 * Aggregates user performance by vocabulary concept across questions.
 * Enables analytics like: "problem solving appeared in 47 questions and the
 * user got 30 of those wrong — high probability of a vocabulary gap."
 *
 * Pure computation module — no side effects, no DB calls.
 */

import { AnalyzedQuestion } from '../brain/question-analyzer';
import { UserResponse } from '../brain/weakness-detector';
import { DEMONSTRATING_THRESHOLD, APPROACHING_THRESHOLD } from './skillProficiency';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConceptPerformance {
  concept: string;
  /** Total questions in the bank that have this concept */
  totalInBank: number;
  /** How many the user attempted */
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  /** Confidence breakdown */
  confidenceBreakdown: {
    high: { correct: number; total: number };
    medium: { correct: number; total: number };
    low: { correct: number; total: number };
  };
  /** Skills where this concept appears */
  relatedSkills: string[];
  /** Average time in seconds (null if no attempts) */
  avgTimeSeconds: number | null;
  /** Trend based on chronological attempts (requires 4+ attempts) */
  trend: 'improving' | 'declining' | 'stable' | 'insufficient';
}

export interface CrossSkillGap {
  concept: string;
  accuracy: number;
  attempted: number;
  /** Skills where this concept is weak */
  affectedSkills: string[];
}

export interface ConceptAnalyticsReport {
  /** All concepts with performance data, sorted by accuracy ascending */
  concepts: ConceptPerformance[];
  /** Concepts with accuracy < 60% and 3+ attempts */
  gapConcepts: ConceptPerformance[];
  /** Concepts with accuracy >= 80% and 3+ attempts */
  strengthConcepts: ConceptPerformance[];
  /** Concepts weak across 2+ skills — indicates vocabulary gap, not just skill gap */
  crossSkillGaps: CrossSkillGap[];
  /** Summary stats */
  summary: {
    totalConceptsTested: number;
    totalGaps: number;
    totalStrengths: number;
    totalCrossSkillGaps: number;
    overallConceptAccuracy: number;
  };
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function buildConceptAnalytics(
  responses: UserResponse[],
  questions: AnalyzedQuestion[],
): ConceptAnalyticsReport {
  // Build question lookup
  const questionMap = new Map<string, AnalyzedQuestion>();
  for (const q of questions) {
    questionMap.set(q.id, q);
  }

  // Build concept → question count (total in bank)
  const conceptBankCount = new Map<string, number>();
  const conceptSkills = new Map<string, Set<string>>();
  for (const q of questions) {
    const concepts = q.keyConcepts || [];
    for (const c of concepts) {
      conceptBankCount.set(c, (conceptBankCount.get(c) || 0) + 1);
      if (!conceptSkills.has(c)) conceptSkills.set(c, new Set());
      if (q.skillId) conceptSkills.get(c)!.add(q.skillId);
    }
  }

  // Track per-concept per-skill performance for cross-skill gap detection
  interface SkillAttempt { correct: number; total: number; }
  const conceptSkillPerf = new Map<string, Map<string, SkillAttempt>>();

  // Aggregate responses by concept
  interface ConceptAccum {
    attempted: number;
    correct: number;
    incorrect: number;
    highCorrect: number; highTotal: number;
    mediumCorrect: number; mediumTotal: number;
    lowCorrect: number; lowTotal: number;
    totalTime: number;
    timeCount: number;
    /** Chronological list of (isCorrect) for trend */
    history: boolean[];
  }

  const accumByConceptRaw = new Map<string, ConceptAccum>();

  for (const response of responses) {
    const question = questionMap.get(response.questionId);
    if (!question) continue;

    const concepts = question.keyConcepts || [];
    if (concepts.length === 0) continue;

    for (const concept of concepts) {
      if (!accumByConceptRaw.has(concept)) {
        accumByConceptRaw.set(concept, {
          attempted: 0, correct: 0, incorrect: 0,
          highCorrect: 0, highTotal: 0,
          mediumCorrect: 0, mediumTotal: 0,
          lowCorrect: 0, lowTotal: 0,
          totalTime: 0, timeCount: 0,
          history: [],
        });
      }
      const acc = accumByConceptRaw.get(concept)!;
      acc.attempted++;
      if (response.isCorrect) acc.correct++;
      else acc.incorrect++;
      acc.history.push(response.isCorrect);

      // Confidence
      const conf = response.confidence || 'medium';
      if (conf === 'high') { acc.highTotal++; if (response.isCorrect) acc.highCorrect++; }
      else if (conf === 'low') { acc.lowTotal++; if (response.isCorrect) acc.lowCorrect++; }
      else { acc.mediumTotal++; if (response.isCorrect) acc.mediumCorrect++; }

      // Time
      if (response.timeSpent > 0) {
        acc.totalTime += response.timeSpent;
        acc.timeCount++;
      }

      // Per-skill tracking for cross-skill gaps
      if (question.skillId) {
        if (!conceptSkillPerf.has(concept)) conceptSkillPerf.set(concept, new Map());
        const skillMap = conceptSkillPerf.get(concept)!;
        if (!skillMap.has(question.skillId)) skillMap.set(question.skillId, { correct: 0, total: 0 });
        const sp = skillMap.get(question.skillId)!;
        sp.total++;
        if (response.isCorrect) sp.correct++;
      }
    }
  }

  // Compute trend: compare first half vs last half accuracy (requires 4+ attempts)
  function computeTrend(history: boolean[]): ConceptPerformance['trend'] {
    if (history.length < 4) return 'insufficient';
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const lastHalf = history.slice(mid);
    const firstAcc = firstHalf.filter(Boolean).length / firstHalf.length;
    const lastAcc = lastHalf.filter(Boolean).length / lastHalf.length;
    const diff = lastAcc - firstAcc;
    if (diff >= 0.15) return 'improving';
    if (diff <= -0.15) return 'declining';
    return 'stable';
  }

  // Build ConceptPerformance array
  const allConcepts: ConceptPerformance[] = [];
  let totalAttempted = 0;
  let totalCorrect = 0;

  for (const [concept, acc] of accumByConceptRaw) {
    const accuracy = acc.attempted > 0 ? acc.correct / acc.attempted : 0;
    totalAttempted += acc.attempted;
    totalCorrect += acc.correct;

    allConcepts.push({
      concept,
      totalInBank: conceptBankCount.get(concept) || 0,
      attempted: acc.attempted,
      correct: acc.correct,
      incorrect: acc.incorrect,
      accuracy,
      confidenceBreakdown: {
        high: { correct: acc.highCorrect, total: acc.highTotal },
        medium: { correct: acc.mediumCorrect, total: acc.mediumTotal },
        low: { correct: acc.lowCorrect, total: acc.lowTotal },
      },
      relatedSkills: [...(conceptSkills.get(concept) || [])],
      avgTimeSeconds: acc.timeCount > 0 ? acc.totalTime / acc.timeCount : null,
      trend: computeTrend(acc.history),
    });
  }

  // Sort by accuracy ascending (worst first)
  allConcepts.sort((a, b) => a.accuracy - b.accuracy);

  // Gap concepts: accuracy below Approaching threshold, 3+ attempts
  const gapConcepts = allConcepts.filter(c => c.accuracy < APPROACHING_THRESHOLD && c.attempted >= 3);

  // Strength concepts: accuracy at or above Demonstrating threshold, 3+ attempts
  const strengthConcepts = allConcepts
    .filter(c => c.accuracy >= DEMONSTRATING_THRESHOLD && c.attempted >= 3)
    .sort((a, b) => b.accuracy - a.accuracy);

  // Cross-skill gaps: concepts weak (< 60%) across 2+ skills
  const crossSkillGaps: CrossSkillGap[] = [];
  for (const [concept, skillPerf] of conceptSkillPerf) {
    const weakSkills: string[] = [];
    let totalCorrectAcross = 0;
    let totalAttemptedAcross = 0;

    for (const [skillId, perf] of skillPerf) {
      totalCorrectAcross += perf.correct;
      totalAttemptedAcross += perf.total;
      if (perf.total >= 2 && perf.correct / perf.total < APPROACHING_THRESHOLD) {
        weakSkills.push(skillId);
      }
    }

    if (weakSkills.length >= 2) {
      crossSkillGaps.push({
        concept,
        accuracy: totalAttemptedAcross > 0 ? totalCorrectAcross / totalAttemptedAcross : 0,
        attempted: totalAttemptedAcross,
        affectedSkills: weakSkills,
      });
    }
  }

  crossSkillGaps.sort((a, b) => a.accuracy - b.accuracy);

  const overallConceptAccuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;

  return {
    concepts: allConcepts,
    gapConcepts,
    strengthConcepts,
    crossSkillGaps,
    summary: {
      totalConceptsTested: allConcepts.length,
      totalGaps: gapConcepts.length,
      totalStrengths: strengthConcepts.length,
      totalCrossSkillGaps: crossSkillGaps.length,
      overallConceptAccuracy,
    },
  };
}
