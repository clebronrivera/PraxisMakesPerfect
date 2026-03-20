// src/utils/todaysFocus.ts
// Determines what the user should focus on today based on skill performance.
// Pure utility — no React, no side effects.

import { SkillPerformance } from '../brain/learning-state';
import { getSkillTrend } from './skillTrend';

export interface TodaysFocusItem {
  skillId: string;
  name: string;
  reason: string;
  accent: 'cyan' | 'coral' | 'amber';
}

/**
 * Returns up to 2 recommended focus skills for today.
 *
 * Priority order:
 *   1. Declining skills (trending down) — most urgent, shown in coral
 *   2. Near-mastery skills (60–80% accuracy) — easy win, shown in cyan
 *   3. Weakest attempted skill — fallback, shown in amber
 */
export function computeTodaysFocus(
  skillScores: Record<string, SkillPerformance>,
  getSkillName: (id: string) => string
): TodaysFocusItem[] {
  const results: TodaysFocusItem[] = [];
  const skills = Object.entries(skillScores);

  if (skills.length === 0) return results;

  // 1. Declining skills — biggest risk
  const declining = skills.filter(
    ([, perf]) => perf.attempts >= 6 && getSkillTrend(perf) === 'declining'
  );
  if (declining.length > 0) {
    const [id] = declining.sort((a, b) => a[1].score - b[1].score)[0];
    results.push({
      skillId: id,
      name: getSkillName(id),
      reason: 'Trending down — needs attention',
      accent: 'coral',
    });
  }

  // 2. Near mastery — easy win
  if (results.length < 2) {
    const nearMastery = skills.filter(
      ([, perf]) => perf.attempts >= 3 && perf.score >= 0.6 && perf.score < 0.8
    );
    if (nearMastery.length > 0) {
      const [id, perf] = nearMastery.sort((a, b) => b[1].score - a[1].score)[0];
      results.push({
        skillId: id,
        name: getSkillName(id),
        reason: `${Math.round(perf.score * 100)}% — close to mastery`,
        accent: 'cyan',
      });
    }
  }

  // 3. Weakest attempted skill — fallback
  if (results.length === 0) {
    const attempted = skills.filter(([, perf]) => perf.attempts >= 3);
    if (attempted.length > 0) {
      const [id] = attempted.sort((a, b) => a[1].score - b[1].score)[0];
      results.push({
        skillId: id,
        name: getSkillName(id),
        reason: 'Needs the most work',
        accent: 'amber',
      });
    }
  }

  return results.slice(0, 2);
}
