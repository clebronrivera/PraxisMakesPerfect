/**
 * Rebuilds skill_scores and domain_scores from chronological response rows.
 * Used after admin partial reset so aggregates match remaining `responses`.
 */
import type { SkillId } from '../brain/skill-map';
import {
  calculateLearningState,
  calculateWeightedAccuracy,
  countConfidenceFlags,
  type SkillAttempt,
  type SkillPerformance
} from '../brain/learning-state';

export interface ResponseRowForReplay {
  skill_id: string | null;
  domain_id: number | null;
  domain_ids: unknown;
  is_correct: boolean;
  confidence: string | null;
  question_id: string;
  time_on_item_seconds?: number | null;
  time_spent?: number | null;
  created_at?: string;
}

function normConfidence(c: string | null | undefined): 'low' | 'medium' | 'high' {
  if (c === 'low' || c === 'medium' || c === 'high') return c;
  return 'medium';
}

function domainIdsFromRow(row: ResponseRowForReplay): number[] {
  if (Array.isArray(row.domain_ids) && row.domain_ids.length > 0) {
    return row.domain_ids
      .map((id: unknown) => Number(id))
      .filter((id: number) => Number.isFinite(id));
  }
  if (row.domain_id !== null && row.domain_id !== undefined) {
    const n = Number(row.domain_id);
    return Number.isFinite(n) ? [n] : [];
  }
  return [];
}

/**
 * Replays responses in order (caller must sort by `created_at` ascending).
 */
export function replaySkillAndDomainScoresFromResponses(
  rows: ResponseRowForReplay[]
): {
  skillScores: Record<string, SkillPerformance>;
  domainScores: Record<number, { correct: number; total: number }>;
} {
  const skillScores: Record<string, SkillPerformance> = {};
  const domainScores: Record<number, { correct: number; total: number }> = {};

  const skillPerfLookup = (id: SkillId) => skillScores[id];

  for (const row of rows) {
    const domainList = domainIdsFromRow(row);
    for (const dId of domainList) {
      if (!domainScores[dId]) domainScores[dId] = { correct: 0, total: 0 };
      domainScores[dId].total++;
      if (row.is_correct) domainScores[dId].correct++;
    }

    const skillId = row.skill_id as SkillId | null;
    if (!skillId) continue;

    const timeSpent =
      typeof row.time_on_item_seconds === 'number'
        ? row.time_on_item_seconds
        : typeof row.time_spent === 'number'
          ? row.time_spent
          : 0;

    const confidence = normConfidence(row.confidence);

    const baseSkill: SkillPerformance = skillScores[skillId] || {
      score: 0,
      attempts: 0,
      correct: 0,
      consecutiveCorrect: 0,
      history: [],
      learningState: 'emerging',
      masteryDate: undefined,
      weightedAccuracy: 0,
      confidenceFlags: 0
    };

    const newAttempts = baseSkill.attempts + 1;
    const newCorrect = baseSkill.correct + (row.is_correct ? 1 : 0);
    const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
    const newConsecutiveCorrect = row.is_correct ? baseSkill.consecutiveCorrect + 1 : 0;
    const newHistory = [...baseSkill.history, row.is_correct].slice(-5);

    const recentAttempts: SkillAttempt[] = newHistory.map((correct, idx) => ({
      questionId: `${row.question_id}-${idx}`,
      correct,
      confidence,
      timestamp: Date.now(),
      timeSpent
    }));

    const weightedAccuracy = calculateWeightedAccuracy(recentAttempts);
    const confidenceFlags = countConfidenceFlags(recentAttempts);

    const updatedSkill: SkillPerformance = {
      ...baseSkill,
      score: newScore,
      attempts: newAttempts,
      correct: newCorrect,
      consecutiveCorrect: newConsecutiveCorrect,
      history: newHistory,
      weightedAccuracy,
      confidenceFlags
    };

    const oldState = baseSkill.learningState;
    const newState = calculateLearningState(updatedSkill, skillId, skillPerfLookup);

    if (newState === 'mastery' && oldState !== 'mastery' && !baseSkill.masteryDate) {
      updatedSkill.masteryDate = Date.now();
    }

    updatedSkill.learningState = newState;
    skillScores[skillId] = updatedSkill;
  }

  return { skillScores, domainScores };
}
