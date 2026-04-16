// src/hooks/useRedemptionRounds.ts
//
// Manages the Redemption Rounds quarantine system:
//
//   Entry rules:
//     - 3rd wrong answer total on a question → quarantined (via RPC)
//     - Hint used on a question → quarantined immediately
//
//   Quarantine:
//     - `in_redemption = true` is the single source of truth
//     - Quarantined questions are excluded from all normal practice
//     - They only appear inside Redemption Rounds
//
//   Clearance:
//     - 3 correct answers inside Redemption → cleared
//     - No confidence shortcut, no instant redemption
//
//   Credits:
//     - 1 credit = 1 full pass through the entire Redemption bank
//     - 20 non-hint practice answers = 1 credit

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { UserProfile } from './useProgressTracking';

export interface MissedQuestion {
  id: string;            // row UUID in practice_missed_questions
  question_id: string;   // matches AnalyzedQuestion.id
  skill_id: string | null;
  correct_count: number;
}

export interface RoundResult {
  questionId: string;
  isCorrect: boolean;
  missedRowId: string;   // UUID of the practice_missed_questions row
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
  // ── Quarantine blacklist — the single source of truth for practice exclusion
  const [redemptionBlacklistIds, setRedemptionBlacklistIds] = useState<Set<string>>(new Set());
  const [missedSkillIds, setMissedSkillIds] = useState<string[]>([]);
  const [bankLoading, setBankLoading] = useState(false);

  // Derived: bank count is just the blacklist size
  const bankCount = redemptionBlacklistIds.size;

  // ── Load quarantined question IDs on mount / userId change ─────────────────
  useEffect(() => {
    if (!userId) { setRedemptionBlacklistIds(new Set()); setMissedSkillIds([]); return; }

    let active = true;
    setBankLoading(true);
    supabase
      .from('practice_missed_questions')
      .select('question_id, skill_id')
      .eq('user_id', userId)
      .eq('in_redemption', true)
      .eq('redeemed', false)
      .then(({ data }) => {
        if (active) {
          const ids = new Set((data ?? []).map(r => r.question_id));
          setRedemptionBlacklistIds(ids);
          setMissedSkillIds((data ?? []).map(r => r.skill_id).filter((s): s is string => s !== null));
        }
        if (active) setBankLoading(false);
      }, () => {
        if (active) setBankLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  // ── Refresh blacklist from DB (fire-and-forget helper) ─────────────────────
  const refreshBlacklist = useCallback(() => {
    if (!userId) return;
    void supabase
      .from('practice_missed_questions')
      .select('question_id')
      .eq('user_id', userId)
      .eq('in_redemption', true)
      .eq('redeemed', false)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map(r => r.question_id));
        setRedemptionBlacklistIds(ids);
      }, () => {});
  }, [userId]);

  // ── Add question to bank for MISS (3rd wrong = quarantine) ─────────────────
  // Uses the atomic increment_wrong_count RPC. The RPC returns the post-upsert
  // wrong_count and in_redemption so we can update the local blacklist Set.
  const addToMissedBankForMiss = useCallback(async (
    questionId: string,
    skillId: string | null
  ): Promise<{ enteredRedemption: boolean; wrongCount: number }> => {
    if (!userId) return { enteredRedemption: false, wrongCount: 0 };
    try {
      const { data, error } = await supabase.rpc('increment_wrong_count', {
        p_user_id: userId,
        p_question_id: questionId,
        p_skill_id: skillId ?? null,
      });

      if (error || !data || data.length === 0) {
        return { enteredRedemption: false, wrongCount: 0 };
      }

      const row = data[0];
      const nowInRedemption = row.now_in_redemption === true;
      const newWrongCount = row.new_wrong_count ?? 0;

      if (nowInRedemption) {
        setRedemptionBlacklistIds(prev => {
          const next = new Set(prev);
          next.add(questionId);
          return next;
        });
      }

      return { enteredRedemption: nowInRedemption, wrongCount: newWrongCount };
    } catch {
      return { enteredRedemption: false, wrongCount: 0 };
    }
  }, [userId]);

  // ── Add question to bank for HINT (immediate quarantine) ───────────────────
  // Uses a two-step select-then-upsert to preserve wrong_count on existing rows.
  // Critical: never reset wrong_count when a hint hits a row with prior misses.
  const addToMissedBankForHint = useCallback(async (
    questionId: string,
    skillId: string | null
  ): Promise<void> => {
    if (!userId) return;
    try {
      // Check if row already exists
      const { data: existing } = await supabase
        .from('practice_missed_questions')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle();

      if (existing) {
        // Row exists: update entry_reason and quarantine flag.
        // Do NOT touch wrong_count — preserve the historical miss count.
        await supabase
          .from('practice_missed_questions')
          .update({
            entry_reason: 'hint',
            in_redemption: true,
            correct_count: 0,
            redeemed: false,
            redeemed_at: null,
          })
          .eq('id', existing.id);
      } else {
        // No row: insert fresh
        await supabase
          .from('practice_missed_questions')
          .insert({
            user_id: userId,
            question_id: questionId,
            skill_id: skillId ?? null,
            wrong_count: 0,
            entry_reason: 'hint',
            in_redemption: true,
            correct_count: 0,
            redeemed: false,
          });
      }

      // Update local blacklist
      setRedemptionBlacklistIds(prev => {
        const next = new Set(prev);
        next.add(questionId);
        return next;
      });
    } catch { /* non-critical */ }
  }, [userId]);

  // ── Handle a submitted practice answer for credit tracking ─────────────────
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

  // ── Start a round ──────────────────────────────────────────────────────────
  // Decrements 1 credit, fetches all quarantined questions, returns them shuffled.
  // Returns null if no credits or empty bank.
  const startRound = useCallback(async (): Promise<MissedQuestion[] | null> => {
    if (!userId) return null;
    const credits = profile.redemptionCredits ?? 0;
    if (credits <= 0) return null;

    try {
      // Fetch only truly quarantined rows
      const { data, error } = await supabase
        .from('practice_missed_questions')
        .select('id, question_id, skill_id, correct_count')
        .eq('user_id', userId)
        .eq('in_redemption', true)
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

  // ── Record round results ───────────────────────────────────────────────────
  // After a round completes:
  //   - All correct answers increment correct_count
  //   - When correct_count >= 3: redeemed = true, in_redemption = false
  //   - No confidence shortcut — always 3 correct to clear
  //   - Inserts a redemption_sessions row
  //   - Updates high score if beaten
  const recordRoundResult = useCallback(async (results: RoundResult[]) => {
    if (!userId || results.length === 0) return;

    const attempted = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const scorePct = attempted > 0 ? Math.round((correct / attempted) * 100 * 100) / 100 : 0;

    // Track which questions get cleared so we can update the blacklist
    const clearedIds: string[] = [];

    // ── 1. Update question records ─────────────────────────────────────────
    const updates: Promise<void>[] = results.map(async (r) => {
      if (!r.isCorrect) return; // incorrect — no change

      const newCount = r.correct_count + 1;
      const cleared = newCount >= 3;

      if (cleared) {
        // Cleared: redeemed = true, in_redemption = false (synced)
        await supabase
          .from('practice_missed_questions')
          .update({
            redeemed: true,
            in_redemption: false,
            redeemed_at: new Date().toISOString(),
            correct_count: newCount,
          })
          .eq('id', r.missedRowId);
        clearedIds.push(r.questionId);
      } else {
        await supabase
          .from('practice_missed_questions')
          .update({ correct_count: newCount })
          .eq('id', r.missedRowId);
      }
    });

    await Promise.allSettled(updates);

    // Remove cleared questions from local blacklist
    if (clearedIds.length > 0) {
      setRedemptionBlacklistIds(prev => {
        const next = new Set(prev);
        clearedIds.forEach(id => next.delete(id));
        return next;
      });
    }

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

    // ── 4. Refresh blacklist from DB for consistency ─────────────────────
    refreshBlacklist();
  }, [userId, profile.redemptionHighScore, updateProfile, refreshBlacklist]);

  return {
    bankCount,
    bankLoading,
    redemptionBlacklistIds,
    missedSkillIds,
    credits: profile.redemptionCredits ?? 0,
    highScore: profile.redemptionHighScore ?? 0,
    questionsToNextCredit: 20 - ((profile.practiceQuestionsSinceCredit ?? 0) % 20),
    addToMissedBankForMiss,
    addToMissedBankForHint,
    handleAnswerSubmitted,
    startRound,
    recordRoundResult,
  };
}
