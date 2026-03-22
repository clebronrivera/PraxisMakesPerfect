// src/utils/practiceRecency.ts
//
// Derives "last practiced" recency from SkillPerformance.attemptHistory.
// No schema changes required — attemptHistory already stores timestamps.

import type { SkillPerformance } from '../hooks/useFirebaseProgress';

/**
 * Returns the number of whole days since the skill was last practiced,
 * or null if the skill has no attempt history with timestamps.
 */
export function getLastPracticedDaysAgo(perf: SkillPerformance | undefined): number | null {
  if (!perf?.attemptHistory || perf.attemptHistory.length === 0) return null;
  const lastTs = Math.max(...perf.attemptHistory.map(a => a.timestamp ?? 0));
  if (!lastTs) return null;
  const msAgo = Date.now() - lastTs;
  return Math.floor(msAgo / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if the skill should be flagged as "Review Due":
 *   - Last practiced more than REVIEW_DUE_DAYS ago, AND
 *   - Not yet at Demonstrating proficiency (score < 0.8)
 */
const REVIEW_DUE_DAYS = 7;

export function isReviewDue(perf: SkillPerformance | undefined): boolean {
  const days = getLastPracticedDaysAgo(perf);
  if (days === null) return false;
  const score = perf?.score ?? 0;
  return days >= REVIEW_DUE_DAYS && score < 0.8;
}

/**
 * Formats days-ago as a short human-readable string.
 * e.g.  0 → "today"  1 → "1d ago"  14 → "14d ago"
 */
export function formatDaysAgo(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}
