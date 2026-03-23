// src/hooks/useRedemptionRounds.ts
//
// Manages the Redemption Rounds feature:
//   - Tracks the missed-question bank (practice_missed_questions table)
//   - Awards credits (1 per 20 non-hint practice answers) via user_progress
//   - Loads questions for a round and records round results
//
// Design notes:
//   - The credit counter (practice_questions_since_credit) is stored in
//     user_progress so it persists across devices. updateProfile is used for
//     lightweight partial updates.
//   - Bank count is fetched once on mount and kept in sync via local state
//     increments (no subscription needed — the count is cosmetic on the button).

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { UserProfile } from './useFirebaseProgress';

export interface MissedQuestion {
  id: string;            // row UUID in practice_missed_questions
  question_id: string;   // matches AnalyzedQuestion.id
  skill_id: string | null;
  correct_count: number;
}

export interface RoundResult {
  questionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  missedRowId: string; // UUID of the practice_missed_questions row
  correct_count: number; // current correct_count before this answer
}

interface UseRedemptionRoundsOptions {
  userId: string | null;
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export function useRedemptionRounds({
  userId,
  profile,
  updateProfile,
}: UseRedemptionRoundsOptions) {
  const [bankCount, setBankCount] = useState(0);
  const [bankLoading, setBankLoading] = useState(false);

  // ── Load bank count on mount / userId change ─────────────────────────────
  useEffect(() => {
    if (!userId) { setBankCount(0); return; }

    let active = true;
    setBankLoading(true);
    supabase
      .from('practice_missed_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('redeemed', false)
      .then(({ count }) => {
        if (active) setBankCount(count ?? 0);
        if (active) setBankLoading(false);
      }, () => {
        if (active) setBankLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  // ── Add a question to the missed bank ────────────────────────────────────
  // Called from PracticeSession on every wrong answer.
  // Uses upsert with onConflict so re-missing the same question is a no-op
  // (correct_count and redeemed are preserved — we don't reset progress if
  //  the user misses the same question again before redeeming it).
  const addToMissedBank = useCallback(async (questionId: string, skillId: string | null) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('practice_missed_questions')
        .upsert(
          { user_id: userId, question_id: questionId, skill_id: skillId ?? null },
          { onConflict: 'user_id,question_id', ignoreDuplicates: true }
        );
      if (!error) {
        // Only increment count if the row didn't already exist.
        // ignoreDuplicates means count stays stable on re-miss.
        // Refresh count (fire-and-forget)
        void supabase
          .from('practice_missed_questions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('redeemed', false)
          .then(({ count }) => setBankCount(count ?? 0), () => {});
      }
    } catch { /* non-critical */ }
  }, [userId]);

  // ── Handle a submitted practice answer for credit tracking ───────────────
  // Called from PracticeSession after every non-hint answer submission.
  // Increments the counter; awards +1 credit every 20 answers.
  const handleAnswerSubmitted = useCallback(async () => {
    if (!userId) return;
    const current = profile.practiceQuestionsSinceCredit ?? 0;
    const newCount = current + 1;
    const creditsToAdd = Math.floor(newCount / 20);
    const remainder = newCount % 20;

    if (creditsToAdd > 0) {
      await updateProfile({
        redemptionCredits: (profile.redemptionCredits ?? 0) + creditsToAdd,
        practiceQuestionsSinceCredit: remainder,
      });
    } else {
      await updateProfile({ practiceQuestionsSinceCredit: newCount });
    }
  }, [userId, profile.practiceQuestionsSinceCredit, profile.redemptionCredits, updateProfile]);

  // ── Start a round ─────────────────────────────────────────────────────────
  // Decrements 1 credit, fetches all unredeemed questions, returns them shuffled.
  // Returns null if no credits or empty bank.
  const startRound = useCallback(async (): Promise<MissedQuestion[] | null> => {
    if (!userId) return null;
    const credits = profile.redemptionCredits ?? 0;
    if (credits <= 0) return null;

    try {
      // Fetch all unredeemed rows
      const { data, error } = await supabase
        .from('practice_missed_questions')
        .select('id, question_id, skill_id, correct_count')
        .eq('user_id', userId)
        .eq('redeemed', false);

      if (error || !data || data.length === 0) return null;

      // Consume 1 credit
      await updateProfile({
        redemptionCredits: credits - 1,
      });

      // Shuffle
      const shuffled = [...data];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled as MissedQuestion[];
    } catch {
      return null;
    }
  }, [userId, profile.redemptionCredits, updateProfile]);

  // ── Record round results ──────────────────────────────────────────────────
  // After a round completes:
  //   - Batch-updates correct_count / redeemed on practice_missed_questions rows
  //   - Inserts a redemption_sessions row
  //   - Updates redemption_high_score if beaten
  const recordRoundResult = useCallback(async (results: RoundResult[]) => {
    if (!userId || results.length === 0) return;

    const attempted = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const scorePct = attempted > 0 ? Math.round((correct / attempted) * 100 * 100) / 100 : 0;

    // ── 1. Update redeemed questions ─────────────────────────────────────
    // Process each result: if correct, check redemption criteria
    const updates: Promise<void>[] = results.map(async (r) => {
      if (!r.isCorrect) return; // incorrect — no change

      const newCount = r.correct_count + 1;
      const redeemed = r.confidence === 'high'
        ? true              // Sure + correct → immediate redemption
        : newCount >= 3;    // Unsure/Guess + correct → 3 corrects total

      if (redeemed) {
        await supabase
          .from('practice_missed_questions')
          .update({ redeemed: true, redeemed_at: new Date().toISOString(), correct_count: newCount })
          .eq('id', r.missedRowId);
      } else {
        await supabase
          .from('practice_missed_questions')
          .update({ correct_count: newCount })
          .eq('id', r.missedRowId);
      }
    });

    await Promise.allSettled(updates);

    // ── 2. Insert session record ─────────────────────────────────────────
    try {
      await supabase.from('redemption_sessions').insert({
        user_id: userId,
        questions_attempted: attempted,
        questions_correct: correct,
        score_pct: scorePct,
      });
    } catch { /* non-critical */ }

    // ── 3. Update high score if beaten ────────────────────────────────────
    const currentHigh = profile.redemptionHighScore ?? 0;
    if (scorePct > currentHigh) {
      try { await updateProfile({ redemptionHighScore: scorePct }); } catch { /* non-critical */ }
    }

    // ── 4. Refresh bank count ─────────────────────────────────────────────
    void supabase
      .from('practice_missed_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('redeemed', false)
      .then(({ count }) => setBankCount(count ?? 0), () => {});
  }, [userId, profile.redemptionHighScore, updateProfile]);

  return {
    bankCount,
    bankLoading,
    credits: profile.redemptionCredits ?? 0,
    highScore: profile.redemptionHighScore ?? 0,
    questionsToNextCredit: 20 - ((profile.practiceQuestionsSinceCredit ?? 0) % 20),
    addToMissedBank,
    handleAnswerSubmitted,
    startRound,
    recordRoundResult,
  };
}
