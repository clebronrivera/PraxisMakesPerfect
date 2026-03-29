// src/utils/srsEngine.ts
// Pure Leitner-box SRS engine. No side effects, no clock reads.
// All date logic is driven by the `now` parameter (ISO date string, date-only).

/** Intervals per box level, in days. Box 0 = 1 day, Box 4 = 30 days. */
const BOX_INTERVALS: readonly number[] = [1, 3, 7, 14, 30];

const MAX_BOX = BOX_INTERVALS.length - 1; // 4

export interface SrsUpdate {
  newBox: number;
  nextReviewDate: string; // ISO date-only: "YYYY-MM-DD"
  lastReviewDate: string; // ISO date-only: "YYYY-MM-DD"
}

/**
 * Compute the next SRS state after an answer.
 *
 * @param currentBox  Current Leitner box (0–4). Undefined/null treated as 0.
 * @param isCorrect   Whether the answer was correct.
 * @param now         Current date as ISO date-only string ("YYYY-MM-DD").
 *                    Caller is responsible for providing this — the engine
 *                    never reads the system clock.
 */
export function calculateSrsUpdate(
  currentBox: number | undefined | null,
  isCorrect: boolean,
  now: string,
): SrsUpdate {
  const box = typeof currentBox === 'number' ? Math.max(0, Math.min(currentBox, MAX_BOX)) : 0;

  const newBox = isCorrect
    ? Math.min(box + 1, MAX_BOX)
    : 0;

  const intervalDays = BOX_INTERVALS[newBox];
  const nextReviewDate = addDays(now, intervalDays);

  return {
    newBox,
    nextReviewDate,
    lastReviewDate: now,
  };
}

/** Add days to an ISO date-only string. Returns ISO date-only string. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
