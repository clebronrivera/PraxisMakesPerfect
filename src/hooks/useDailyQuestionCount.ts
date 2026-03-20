// src/hooks/useDailyQuestionCount.ts
// Reads today's question count from localStorage.
// PracticeSession increments this key each time an answer is submitted.

import { useEffect, useState } from 'react';

/** Daily question goal. */
export const DAILY_GOAL = 20;

/** localStorage key for today's question count. */
export function dailyQuestionKey(userId: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `pmp-daily-q-${userId}-${ymd}`;
}

/** Increment today's question count by 1 (called by PracticeSession on answer submit). */
export function incrementDailyQuestionCount(userId: string): void {
  if (!userId) return;
  try {
    const key = dailyQuestionKey(userId);
    const existing = parseInt(localStorage.getItem(key) ?? '0', 10) || 0;
    localStorage.setItem(key, String(existing + 1));
  } catch { /* ignore */ }
}

/**
 * Returns today's total questions answered (polls every 5s to stay fresh
 * while PracticeSession runs in the background).
 */
export function useDailyQuestionCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const read = () => {
      try {
        const val = parseInt(localStorage.getItem(dailyQuestionKey(userId)) ?? '0', 10) || 0;
        setCount(val);
      } catch { /* ignore */ }
    };
    read();
    const interval = setInterval(read, 5_000);
    return () => clearInterval(interval);
  }, [userId]);

  return count;
}
