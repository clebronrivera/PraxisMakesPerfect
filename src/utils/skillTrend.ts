// src/utils/skillTrend.ts
// Computes per-skill velocity: whether a skill is improving, declining, or stable.
// Uses SkillPerformance.attemptHistory (last 50-100 attempts).

import { SkillPerformance } from '../brain/learning-state';

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'unknown';

/**
 * Returns the trend direction for a single skill.
 * Requires at least 6 attempts in attemptHistory.
 * Compares first-half vs second-half accuracy.
 * Improving = +15pp gain, Declining = -15pp drop.
 */
export function getSkillTrend(perf: SkillPerformance): TrendDirection {
  const history = perf.attemptHistory;
  if (!history || history.length < 6) return 'unknown';

  const mid = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, mid);
  const lastHalf = history.slice(mid);

  const firstAcc = firstHalf.filter(a => a.correct).length / firstHalf.length;
  const lastAcc = lastHalf.filter(a => a.correct).length / lastHalf.length;
  const delta = lastAcc - firstAcc;

  if (delta >= 0.15) return 'improving';
  if (delta <= -0.15) return 'declining';
  return 'stable';
}

export type SkillTrendMap = Record<string, TrendDirection>;

/**
 * Builds a trend direction for every skill in the profile.
 */
export function buildSkillTrendMap(
  skillScores: Record<string, SkillPerformance>
): SkillTrendMap {
  const result: SkillTrendMap = {};
  for (const [id, perf] of Object.entries(skillScores)) {
    result[id] = getSkillTrend(perf);
  }
  return result;
}
