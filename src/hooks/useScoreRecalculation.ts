// src/hooks/useScoreRecalculation.ts
// Skill-scoring slice of the former useProgressTracking god hook (Phase 5 E3).
// Owns per-answer skill-score updates (learning-state + SRS) and the global-
// score recalculation entry point.
//
// Writes skill scores through the profile hook's state + persistence seams
// (`profileRef` / `setProfileState` / `saveProfile`), passed in by the
// useProgressTracking facade so all three slices share one profile source.
//
// IMPORTANT: the question_id dedup in updateSkillProgress is the locked
// `cea4af9` fix — the same item answered in the LP mini-quiz and in regular
// practice must count once toward proficiency/readiness. Do NOT alter it.
//
// All logic moved verbatim from useProgressTracking — no behavior change.

import { useCallback } from 'react';
import type React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SkillId } from '../brain/skill-map';
import {
  LearningState,
  AttemptSource,
  SkillPerformance,
  applySkillAttemptDedup,
  calculateLearningState,
  calculateWeightedAccuracy,
  countConfidenceFlags,
  countRecentHighConfidenceWrong
} from '../brain/learning-state';
import { calculateAndSaveGlobalScores } from '../utils/globalScoreCalculator';
import { calculateSrsUpdate } from '../utils/srsEngine';
import type { UserProfile } from './useUserProfile';

interface UseScoreRecalculationOptions {
  /** Live ref to the current profile — read at call time to avoid stale closures. */
  profileRef: React.MutableRefObject<UserProfile>;
  /** Update in-memory profile state (also syncs profileRef). */
  setProfileState: (nextProfile: UserProfile) => void;
  /** Persist the full profile to Supabase. */
  saveProfile: (newProfile: UserProfile) => Promise<void>;
}

export function useScoreRecalculation({
  profileRef,
  setProfileState,
  saveProfile,
}: UseScoreRecalculationOptions) {
  const { user } = useAuth();

  const updateSkillProgress = useCallback(async (
    skillId: SkillId,
    isCorrect: boolean,
    confidence: 'low' | 'medium' | 'high' = 'medium',
    questionId?: string,
    timeSpent?: number,
    source: AttemptSource = 'practice'
  ) => {
    const latestProfile = profileRef.current;
    const currentSkill = latestProfile.skillScores[skillId];

    const baseSkill: SkillPerformance = currentSkill || {
      score: 0,
      attempts: 0,
      correct: 0,
      consecutiveCorrect: 0,
      history: [],
      learningState: 'emerging' as LearningState,
      masteryDate: undefined,
      weightedAccuracy: 0,
      confidenceFlags: 0
    };

    // Dedup by question_id (latest attempt wins) so the same item answered in the LP
    // mini-quiz and in regular practice counts once toward proficiency/readiness.
    // Pre-dedup totals are preserved as a legacy baseline. See applySkillAttemptDedup.
    const {
      questionOutcomes,
      legacyAttempts,
      legacyCorrect,
      attempts: newAttempts,
      correct: newCorrect,
      score: newScore,
      attemptHistory: newAttemptHistory,
    } = applySkillAttemptDedup(baseSkill, { isCorrect, questionId, confidence, timeSpent, source });

    // Streak + last-5 history reflect raw answering behavior (gamification), not dedup.
    const newConsecutiveCorrect = isCorrect ? baseSkill.consecutiveCorrect + 1 : 0;
    const newHistory = [...baseSkill.history, isCorrect].slice(-5);

    const weightedAccuracy = calculateWeightedAccuracy(newAttemptHistory);
    const confidenceFlags = countConfidenceFlags(newAttemptHistory);
    const recentHighConfidenceWrongCount = countRecentHighConfidenceWrong(newAttemptHistory, 10);

    const updatedSkill: SkillPerformance = {
      ...baseSkill,
      score: newScore,
      attempts: newAttempts,
      correct: newCorrect,
      consecutiveCorrect: newConsecutiveCorrect,
      history: newHistory,
      attemptHistory: newAttemptHistory,
      questionOutcomes,
      legacyAttempts,
      legacyCorrect,
      weightedAccuracy,
      confidenceFlags,
      recentHighConfidenceWrongCount
    };

    const skillPerfLookup = (id: SkillId) => {
      if (id === skillId) return updatedSkill;
      return latestProfile.skillScores[id];
    };

    const oldState = baseSkill.learningState;
    const newState = calculateLearningState(updatedSkill, skillId, skillPerfLookup);

    if (newState === 'mastery' && oldState !== 'mastery' && !baseSkill.masteryDate) {
      updatedSkill.masteryDate = Date.now();
    }

    updatedSkill.learningState = newState;

    // SRS shadow write — compute and persist, nothing reads these yet
    const today = new Date().toISOString().slice(0, 10);
    const srs = calculateSrsUpdate(updatedSkill.srsBox, isCorrect, today);
    updatedSkill.srsBox = srs.newBox;
    updatedSkill.nextReviewDate = srs.nextReviewDate;
    updatedSkill.lastReviewDate = srs.lastReviewDate;

    const newProfile = {
      ...latestProfile,
      skillScores: {
        ...latestProfile.skillScores,
        [skillId]: updatedSkill
      }
    };

    setProfileState(newProfile);
    await saveProfile(newProfile);
  }, [profileRef, saveProfile, setProfileState]);

  const recalculateGlobalScores = useCallback(async () => {
    if (!user) return null;
    try {
      const result = await calculateAndSaveGlobalScores(user.id);
      console.log('[GlobalScores] Recalculated and saved:', result);
      return result;
    } catch (error) {
      console.error('[GlobalScores] Error recalculating:', error);
      return null;
    }
  }, [user]);

  return {
    updateSkillProgress,
    recalculateGlobalScores,
  };
}
