// src/hooks/useDailyStudyTime.ts
// Reads today's accumulated study time from localStorage.
// PracticeSession writes to this key; this hook polls it for the dashboard.

import { useEffect, useState } from 'react';

function buildDailyKey(userId: string, prefix: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `pmp-${prefix}-${userId}-${ymd}`;
}

/** localStorage key for today's study time (seconds). */
export function dailyTimeKey(userId: string): string {
  return buildDailyKey(userId, 'daily-time');
}

/** Add seconds to the running daily total (called by PracticeSession on unmount). */
export function addDailyStudySeconds(userId: string, seconds: number): void {
  if (!userId || seconds <= 0) return;
  try {
    const key = dailyTimeKey(userId);
    const existing = parseInt(localStorage.getItem(key) ?? '0', 10) || 0;
    localStorage.setItem(key, String(existing + Math.round(seconds)));
  } catch { /* ignore */ }
}

/** Format seconds into a human-readable string: "45s", "12m", "1h 5m". */
export function formatStudyTime(secs: number): string {
  if (secs <= 0) return '0m';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/**
 * Returns today's total study time in seconds (read-only, polls every 15s).
 */
export function useDailyStudyTime(userId: string | undefined): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const read = () => {
      try {
        const val = parseInt(localStorage.getItem(dailyTimeKey(userId)) ?? '0', 10) || 0;
        setSeconds(val);
      } catch { /* ignore */ }
    };
    read();
    const interval = setInterval(read, 15_000);
    return () => clearInterval(interval);
  }, [userId]);

  return seconds;
}
