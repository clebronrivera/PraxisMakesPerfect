/**
 * useRedemptionFlow
 *
 * Phase 5 (E2) of the App.tsx decomposition. Composes `useRedemptionRounds`
 * (quarantine bank, credits, blacklist) with the round-session plumbing that
 * previously lived in App.tsx:
 *
 *   · `redemptionQuestions` / `redemptionMissedRows` — the AnalyzedQuestion
 *     objects + bank rows loaded for the active round;
 *   · `handleStartRedemption` — spend a credit, match bank rows to the
 *     question bank, navigate to the round screen;
 *   · `completeRound` — record the round result and return home.
 *
 * The full `useRedemptionRounds` surface is spread through, so consumers keep
 * calling `redemption.addToMissedBankForMiss(...)` etc. unchanged.
 * All logic moved verbatim from App.tsx — no behavior change.
 */

import { useState, useCallback } from 'react';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import {
  useRedemptionRounds,
  type MissedQuestion,
  type RoundResult,
} from './useRedemptionRounds';
import type { UserProfile } from './useProgressTracking';

export interface UseRedemptionFlowOptions {
  userId: string | null;
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  analyzedQuestions: AnalyzedQuestion[];
  /** Called when a handler needs to transition the app to a new mode/route. */
  onNavigate: (mode: string) => void;
}

export function useRedemptionFlow({
  userId,
  profile,
  updateProfile,
  analyzedQuestions,
  onNavigate,
}: UseRedemptionFlowOptions) {
  const redemption = useRedemptionRounds({ userId, profile, updateProfile });

  // Questions loaded for the active round (AnalyzedQuestion[])
  const [redemptionQuestions, setRedemptionQuestions] = useState<AnalyzedQuestion[]>([]);
  const [redemptionMissedRows, setRedemptionMissedRows] = useState<MissedQuestion[]>([]);

  const handleStartRedemption = useCallback(async () => {
    const rows = await redemption.startRound();
    if (!rows || rows.length === 0) return;
    const matched = rows
      .map((row) => ({
        q: analyzedQuestions.find(q => q.id === row.question_id),
        row,
      }))
      .filter((item): item is { q: AnalyzedQuestion; row: MissedQuestion } => item.q != null);
    setRedemptionQuestions(matched.map((item) => item.q));
    setRedemptionMissedRows(matched.map((item) => item.row));
    onNavigate('redemption-round');
  }, [redemption, analyzedQuestions, onNavigate]);

  const completeRound = useCallback(async (results: RoundResult[]) => {
    await redemption.recordRoundResult(results);
    onNavigate('home');
  }, [redemption, onNavigate]);

  return {
    ...redemption,
    redemptionQuestions,
    redemptionMissedRows,
    handleStartRedemption,
    completeRound,
  };
}
