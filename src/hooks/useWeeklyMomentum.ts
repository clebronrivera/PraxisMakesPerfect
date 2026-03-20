// src/hooks/useWeeklyMomentum.ts
// Computes week-over-week question volume momentum from localStorage daily keys.

import { useEffect, useState } from 'react';

function getWeekDates(weeksAgo: number): string[] {
  const now = new Date();
  // Start from Monday of the target week
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

function sumWeekQuestions(userId: string, weeksAgo: number): number {
  return getWeekDates(weeksAgo).reduce((sum, ymd) => {
    try {
      return sum + (parseInt(localStorage.getItem(`pmp-daily-q-${userId}-${ymd}`) ?? '0', 10) || 0);
    } catch { return sum; }
  }, 0);
}

export interface WeeklyMomentum {
  thisWeek: number;
  lastWeek: number;
  delta: number;
  trend: 'up' | 'down' | 'same' | 'new';
}

export function useWeeklyMomentum(userId: string | undefined): WeeklyMomentum {
  const [momentum, setMomentum] = useState<WeeklyMomentum>({
    thisWeek: 0,
    lastWeek: 0,
    delta: 0,
    trend: 'new',
  });

  useEffect(() => {
    if (!userId) return;
    const thisWeek = sumWeekQuestions(userId, 0);
    const lastWeek = sumWeekQuestions(userId, 1);
    const delta = thisWeek - lastWeek;
    const trend = lastWeek === 0 ? 'new' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
    setMomentum({ thisWeek, lastWeek, delta, trend });
  }, [userId]);

  return momentum;
}
