import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';

export interface LeaderboardEntry {
  userId: string;
  initials: string;
  questions: number;
  time: number;   // minutes
  mastery: number; // skills remaining
}

export type LbMode = 'questions' | 'time' | 'mastery';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOP_N = 12;

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

function formatLbTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export { formatLbTime };

export function useLeaderboard(userId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [callerUserId, setCallerUserId] = useState<string | null>(null);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbMode, setLbMode] = useState<LbMode>('questions');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedOnce = useRef(false);

  const fetchLeaderboard = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoading(!fetchedOnce.current); // only show loading on first fetch
    setError(null);

    try {
      const res = await fetch('/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setCallerUserId(data.callerUserId || null);
      fetchedOnce.current = true;
    } catch (e) {
      console.error('[useLeaderboard] fetch error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount + refresh interval
  useEffect(() => {
    if (!userId) return;

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [userId, fetchLeaderboard]);

  // Sort entries by current mode, return top N + ensure current user visible
  const sortedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      if (lbMode === 'mastery') return a.mastery - b.mastery;
      if (lbMode === 'questions') return b.questions - a.questions;
      return b.time - a.time;
    });

    const topN = sorted.slice(0, TOP_N);
    const currentUserInTop = topN.some(e => e.userId === callerUserId);

    // If current user has data but isn't in top N, append them
    if (!currentUserInTop && callerUserId) {
      const userIdx = sorted.findIndex(e => e.userId === callerUserId);
      if (userIdx >= 0) {
        topN.push(sorted[userIdx]);
      }
    }

    return topN;
  }, [entries, lbMode, callerUserId]);

  // Get the rank of any entry in the full sorted list
  const getRank = useCallback((entryUserId: string) => {
    const sorted = [...entries].sort((a, b) => {
      if (lbMode === 'mastery') return a.mastery - b.mastery;
      if (lbMode === 'questions') return b.questions - a.questions;
      return b.time - a.time;
    });
    const idx = sorted.findIndex(e => e.userId === entryUserId);
    return idx >= 0 ? idx + 1 : null;
  }, [entries, lbMode]);

  return {
    sortedEntries,
    callerUserId,
    lbOpen,
    setLbOpen,
    lbMode,
    setLbMode,
    isLoading,
    error,
    refresh: fetchLeaderboard,
    getRank,
    formatLbTime,
  };
}
