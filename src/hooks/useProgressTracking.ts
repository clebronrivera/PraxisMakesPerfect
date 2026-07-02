// src/hooks/useProgressTracking.ts
// Supabase-backed progress hook — now a THIN COMPOSING FACADE (Phase 5 E3).
//
// The former 993-line god hook was split into three focused slices:
//   · useUserProfile        — profile state + persistence (user_progress row)
//   · useProgressLogging     — responses-table reads/writes
//   · useScoreRecalculation  — skill-score updates + global-score recalc
//
// This facade wires them together and returns the SAME public API the 8+ call
// sites already consume, so nothing downstream changes. The `UserProfile` and
// `ResponseLog` types are re-exported from their new homes for import-site
// compatibility.
//
// All internals use Supabase exclusively — Firebase/Firestore is not used.

import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { useProgressLogging } from './useProgressLogging';
import { useScoreRecalculation } from './useScoreRecalculation';

export type { UserProfile } from './useUserProfile';
export type { ResponseLog } from './useProgressLogging';

export function useProgressTracking() {
  const { user } = useAuth();

  const {
    profile,
    isLoaded,
    updateProfile,
    saveOnboardingData,
    migrateDomainSchema,
    updateLastSession,
    resetProgress,
    profileRef,
    setProfileState,
    saveProfile,
  } = useUserProfile();

  const {
    logResponse,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    saveScreenerResponse,
    savePracticeResponse,
  } = useProgressLogging({ updateProfile });

  const { updateSkillProgress, recalculateGlobalScores } = useScoreRecalculation({
    profileRef,
    setProfileState,
    saveProfile,
  });

  return {
    profile,
    updateProfile,
    saveOnboardingData,
    updateSkillProgress,
    resetProgress,
    migrateDomainSchema,
    logResponse,
    updateLastSession,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    saveScreenerResponse,
    savePracticeResponse,
    recalculateGlobalScores,
    isLoaded,
    isLoggedIn: !!user,
  };
}
