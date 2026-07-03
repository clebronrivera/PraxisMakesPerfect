/**
 * useSocialHub
 *
 * Phase 5 (E2) of the App.tsx decomposition. Owns the two social-proof header
 * widgets:
 *
 *   · Users Online pill — client-side simulation seeded from a 24-hour lookup
 *     table, drifting ±1–2 every 90–150s. Per CLAUDE.md: `getHourRange` and
 *     the drift effect ARE the mechanism — do not remove or "simplify" them.
 *     No backend calls, no real data.
 *   · Leaderboard — real user data via `useLeaderboard` (/api/leaderboard);
 *     the full hook surface is spread through.
 *
 * All logic moved verbatim from App.tsx — no behavior change.
 */

import { useState, useEffect } from 'react';
import { useLeaderboard } from './useLeaderboard';

function getHourRange(h: number): [number, number] {
  const map: [number, number][] = [
    [0, 2],  // 12am
    [0, 1],  // 1am
    [0, 0],  // 2am
    [0, 0],  // 3am
    [0, 1],  // 4am
    [0, 1],  // 5am
    [1, 2],  // 6am
    [1, 3],  // 7am
    [2, 5],  // 8am
    [3, 6],  // 9am
    [3, 7],  // 10am
    [3, 7],  // 11am
    [2, 6],  // 12pm
    [2, 5],  // 1pm
    [2, 5],  // 2pm
    [3, 7],  // 3pm
    [4, 8],  // 4pm
    [4, 8],  // 5pm
    [5, 9],  // 6pm
    [5, 10], // 7pm
    [5, 10], // 8pm
    [4, 8],  // 9pm
    [2, 6],  // 10pm
    [1, 4],  // 11pm
  ];
  return map[h] ?? [0, 0];
}

export function useSocialHub(userId: string | null) {
  const [usersOnline, setUsersOnline] = useState(() => {
    const [min, max] = getHourRange(new Date().getHours());
    return min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
  });

  useEffect(() => {
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 60000) + 90000; // 90–150s
      return setTimeout(() => {
        const [min, max] = getHourRange(new Date().getHours());
        setUsersOnline(prev => {
          const roll = Math.random();
          let drift;
          if (roll < 0.60) drift = Math.random() < 0.5 ? 1 : -1;
          else if (roll < 0.75) drift = 0;
          else drift = Math.random() < 0.5 ? 2 : -2;
          return Math.min(max, Math.max(min, prev + drift));
        });
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  // Leaderboard — real data from /api/leaderboard
  const leaderboard = useLeaderboard(userId);

  return {
    usersOnline,
    ...leaderboard,
  };
}
