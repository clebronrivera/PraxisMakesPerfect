// src/hooks/useUserProfile.ts
// Profile state + persistence slice of the former useProgressTracking god hook
// (Phase 5 E3). Owns the Supabase `user_progress` row: load on auth, debounced
// save, direct updates, onboarding writes, schema migration, the lastSession
// pointer, and full reset.
//
// `useProgressTracking` composes this with useProgressLogging and
// useScoreRecalculation — call sites keep using the facade. The composition
// seams (`profileRef` / `setProfileState` / `saveProfile`) are returned so the
// score-recalculation slice can write skill scores through the same state +
// persistence path.
//
// All logic moved verbatim from useProgressTracking — no behavior change.

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notifyError } from '../utils/toast';
import { SkillId } from '../brain/skill-map';
import { SkillPerformance } from '../brain/learning-state';
import type { GlobalScoreResult } from '../utils/globalScoreCalculator';
import type { SessionMode } from '../types/assessment';

export interface UserProfile {
  // preAssessmentComplete was removed — it had no DB column and was always false.
  // Use diagnosticComplete for archived short-assessment state instead.
  fullAssessmentComplete?: boolean;
  domainScores: Record<number, { correct: number; total: number }>;
  skillScores: Record<SkillId, SkillPerformance>;
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  totalQuestionsSeen: number;
  streak: number;
  flaggedQuestions: Record<string, string>;
  distractorErrors: Record<string, number>;
  skillDistractorErrors: Record<SkillId, Record<string, number>>;
  preAssessmentQuestionIds?: string[];
  fullAssessmentQuestionIds?: string[];
  recentPracticeQuestionIds?: string[];
  screenerItemIds?: string[];
  practiceResponseCount?: number;
  lastPracticeAt?: string;
  migrationVersion?: number;
  lastSession?: {
    sessionId: string;
    mode: SessionMode;
    questionIndex: number;
    updatedAt: string;
  } | null;
  lastPreAssessmentSessionId?: string;
  lastFullAssessmentSessionId?: string;
  lastScreenerSessionId?: string;
  lastPreAssessmentCompletedAt?: string;
  lastFullAssessmentCompletedAt?: string;
  lastScreenerCompletedAt?: string;
  screenerComplete?: boolean;
  screenerResults?: {
    domain_scores: Record<number, number>;
    completed_at: string;
  };
  diagnosticComplete?: boolean;
  adaptiveDiagnosticComplete?: boolean;
  diagnosticQuestionIds?: string[];
  lastDiagnosticSessionId?: string;
  lastDiagnosticCompletedAt?: string;
  /**
   * Live count of saved adaptive-diagnostic responses for this user
   * (Supabase `responses` table, filtered by `assessment_type = 'adaptive'`).
   * Computed at profile-load time so we can detect "orphaned progress" — a user
   * who has answers in Supabase but no `last_session` / localStorage pointer
   * (e.g. cleared cache, different device). Used by the home-screen Resume
   * card to surface a Resume CTA even when the legacy pointers are gone.
   */
  adaptiveResponseCount?: number;
  lastUpdated?: string;

  // Extended profile / onboarding fields
  onboardingComplete?: boolean;
  accountRole?: string;
  fullName?: string;
  preferredDisplayName?: string;
  university?: string;
  programType?: string;
  programState?: string;
  deliveryMode?: string;
  trainingStage?: string;
  certificationState?: string;
  currentRole?: string;
  certificationRoute?: string;
  primaryExam?: string;
  plannedTestDate?: string;
  retakeStatus?: string;
  numberOfPriorAttempts?: number;
  targetScore?: number;
  studyGoals?: string[];
  weeklyStudyHours?: string;
  biggestChallenge?: string[];
  usedOtherResources?: boolean;
  otherResourcesList?: string[];
  whatWasMissing?: string;

  // Redemption Rounds
  redemptionCredits?: number;
  practiceQuestionsSinceCredit?: number;
  redemptionHighScore?: number;

  // Baseline snapshot (captured on first diagnostic completion)
  baselineSnapshot?: Record<string, { score: number; attempts: number; correct: number }>;

  // Consent tracking
  consentAcceptedAt?: string;

  // Third-assessment (reassessment / retake) state
  retakeComplete?: boolean;
  retakeCompletedAt?: string;
  globalScores?: GlobalScoreResult;
}

const defaultProfile: UserProfile = {
  domainScores: {},
  skillScores: {},
  weakestDomains: [],
  factualGaps: [],
  errorPatterns: [],
  totalQuestionsSeen: 0,
  streak: 0,
  flaggedQuestions: {},
  distractorErrors: {},
  skillDistractorErrors: {},
  preAssessmentQuestionIds: [],
  fullAssessmentQuestionIds: [],
  recentPracticeQuestionIds: [],
  screenerItemIds: [],
  practiceResponseCount: 0,
  migrationVersion: 1,
  screenerComplete: false,
  diagnosticComplete: false,
  adaptiveDiagnosticComplete: false,
  diagnosticQuestionIds: [],
  onboardingComplete: false,
  studyGoals: [],
  redemptionCredits: 0,
  practiceQuestionsSinceCredit: 0,
  redemptionHighScore: 0,
};

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const schemaCheckRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile>(defaultProfile);

  const setProfileState = useCallback((nextProfile: UserProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  // Fetch from Supabase
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfileState(defaultProfile);
      setIsLoaded(true);
      return;
    }

    // Hold the loading gate while we fetch the authenticated user's row —
    // otherwise App.tsx briefly renders OnboardingFlow with default
    // (onboardingComplete = false) state in the gap between auth resolving
    // and the Supabase fetch completing.
    setIsLoaded(false);

    try {
      // Fetch user_progress row and response counts in parallel.
      // The counts are computed from the canonical `responses` table so they are
      // always accurate — even for users whose denormalised counters were never
      // written (e.g. accounts created before the write-path was implemented).
      const [
        { data, error },
        { count: totalCount },
        { count: practiceCount },
        { count: adaptiveCount }
      ] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
        supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('assessment_type', 'practice'),
        // Used to detect orphaned in-progress adaptive diagnostics — a user who
        // has saved answers in Supabase but no `last_session` pointer (cleared
        // localStorage / different device). See App.tsx hasAssessmentInProgress.
        supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('assessment_type', 'adaptive')
      ]);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching Supabase profile:', error);
      }

      if (data) {
        setProfileState({
          ...defaultProfile,

          screenerComplete: data.screener_complete ?? false,
          diagnosticComplete: data.diagnostic_complete ?? false,
          fullAssessmentComplete: data.full_assessment_complete ?? false,
          adaptiveDiagnosticComplete: data.adaptive_diagnostic_complete ?? false,
          diagnosticQuestionIds: data.diagnostic_question_ids ?? [],
          lastDiagnosticSessionId: data.last_diagnostic_session_id ?? undefined,

          domainScores: data.domain_scores ?? {},
          skillScores: data.skill_scores ?? {},
          weakestDomains: data.weakest_domains ?? [],
          factualGaps: data.factual_gaps ?? [],
          errorPatterns: data.error_patterns ?? [],
          flaggedQuestions: data.flagged_questions ?? {},
          distractorErrors: data.distractor_errors ?? {},
          skillDistractorErrors: data.skill_distractor_errors ?? {},

          screenerResults: data.screener_results ?? {},

          preAssessmentQuestionIds: data.pre_assessment_question_ids ?? [],
          fullAssessmentQuestionIds: data.full_assessment_question_ids ?? [],
          recentPracticeQuestionIds: data.recent_practice_question_ids ?? [],
          screenerItemIds: data.screener_item_ids ?? [],

          // Use live counts from the responses table; fall back to the stored
          // counter only if the count query itself fails.
          totalQuestionsSeen: totalCount ?? data.total_questions_seen ?? 0,
          practiceResponseCount: practiceCount ?? data.practice_response_count ?? 0,
          adaptiveResponseCount: adaptiveCount ?? 0,
          streak: data.streak ?? 0,
          lastSession: data.last_session,
          migrationVersion: data.migration_version ?? 1,

          lastUpdated: data.updated_at,

          // Extended profile / onboarding fields
          onboardingComplete: data.onboarding_complete ?? false,
          accountRole: data.account_role ?? undefined,
          fullName: data.full_name ?? undefined,
          preferredDisplayName: data.preferred_display_name ?? undefined,
          university: data.university ?? undefined,
          programType: data.program_type ?? undefined,
          programState: data.program_state ?? undefined,
          deliveryMode: data.delivery_mode ?? undefined,
          trainingStage: data.training_stage ?? undefined,
          certificationState: data.certification_state ?? undefined,
          currentRole: data.current_role ?? undefined,
          certificationRoute: data.certification_route ?? undefined,
          primaryExam: data.primary_exam ?? undefined,
          plannedTestDate: data.planned_test_date ?? undefined,
          retakeStatus: data.retake_status ?? undefined,
          numberOfPriorAttempts: data.number_of_prior_attempts ?? undefined,
          targetScore: data.target_score ?? undefined,
          studyGoals: data.study_goals ?? [],
          weeklyStudyHours: data.weekly_study_hours ?? undefined,
          biggestChallenge: data.biggest_challenge ?? [],
          usedOtherResources: data.used_other_resources ?? undefined,
          otherResourcesList: data.other_resources_list ?? [],
          whatWasMissing: data.what_was_missing ?? undefined,

          // Redemption Rounds
          redemptionCredits: data.redemption_credits ?? 0,
          practiceQuestionsSinceCredit: data.practice_questions_since_credit ?? 0,
          redemptionHighScore: data.redemption_high_score ?? 0,

          // Baseline snapshot
          baselineSnapshot: data.baseline_snapshot ?? undefined,

          // Consent tracking
          consentAcceptedAt: data.consent_accepted_at ?? undefined,

          // Third-assessment (reassessment / retake) state
          retakeComplete: data.retake_complete ?? false,
          retakeCompletedAt: data.retake_completed_at ?? undefined,
          globalScores: data.global_scores ?? undefined,
        });
      } else {
        setProfileState(defaultProfile);
      }
    } catch (e) {
      console.error(e);
      Sentry.captureException(e, { extra: { context: 'loadProfile' } });
      notifyError("Couldn't load your saved progress. Check your connection and try refreshing.");
      setProfileState(defaultProfile);
    } finally {
      setIsLoaded(true);
    }
  }, [user, setProfileState]);

  // Initial data load
  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // Save profile to Supabase
  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    if (!user) return;

    try {
      const updates = {
        user_id: user.id,
        screener_complete: newProfile.screenerComplete,
        diagnostic_complete: newProfile.diagnosticComplete,
        full_assessment_complete: newProfile.fullAssessmentComplete,
        adaptive_diagnostic_complete: newProfile.adaptiveDiagnosticComplete ?? false,
        diagnostic_question_ids: newProfile.diagnosticQuestionIds ?? [],
        last_diagnostic_session_id: newProfile.lastDiagnosticSessionId ?? null,

        domain_scores: newProfile.domainScores,
        skill_scores: newProfile.skillScores,
        weakest_domains: newProfile.weakestDomains,
        factual_gaps: newProfile.factualGaps,
        error_patterns: newProfile.errorPatterns,
        flagged_questions: newProfile.flaggedQuestions,
        distractor_errors: newProfile.distractorErrors,
        skill_distractor_errors: newProfile.skillDistractorErrors,

        screener_results: newProfile.screenerResults,

        pre_assessment_question_ids: newProfile.preAssessmentQuestionIds,
        full_assessment_question_ids: newProfile.fullAssessmentQuestionIds,
        recent_practice_question_ids: newProfile.recentPracticeQuestionIds,
        screener_item_ids: newProfile.screenerItemIds,

        total_questions_seen: newProfile.totalQuestionsSeen,
        practice_response_count: newProfile.practiceResponseCount,
        streak: newProfile.streak,
        last_session: newProfile.lastSession,
        migration_version: newProfile.migrationVersion,

        // Redemption Rounds
        redemption_credits: newProfile.redemptionCredits ?? 0,
        practice_questions_since_credit: newProfile.practiceQuestionsSinceCredit ?? 0,
        redemption_high_score: newProfile.redemptionHighScore ?? 0,

        // Baseline snapshot
        baseline_snapshot: newProfile.baselineSnapshot ?? null,

        // Consent tracking
        consent_accepted_at: newProfile.consentAcceptedAt ?? null,

        // Third-assessment state
        retake_complete: newProfile.retakeComplete ?? false,
        retake_completed_at: newProfile.retakeCompletedAt ?? null,

        updated_at: new Date().toISOString()
      };

      await supabase
        .from('user_progress')
        .upsert(updates, { onConflict: 'user_id' });

    } catch (error) {
      console.error('Error saving Supabase profile:', error);
      Sentry.captureException(error, { extra: { context: 'saveProfile' } });
      notifyError("Couldn't save your progress. Check your connection — recent activity may not be saved.");
    }
  }, [user]);

  // Debounced profile save — batches rapid updates (e.g. answering multiple
  // questions quickly) into a single DB write with a 2-second window.
  const debouncedSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProfileRef = useRef<UserProfile | null>(null);

  const debouncedSave = useCallback((profile: UserProfile) => {
    pendingProfileRef.current = profile;
    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    debouncedSaveRef.current = setTimeout(() => {
      if (pendingProfileRef.current) {
        void saveProfile(pendingProfileRef.current);
        pendingProfileRef.current = null;
      }
    }, 2000);
  }, [saveProfile]);

  // Flush any pending save on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
      if (pendingProfileRef.current) {
        void saveProfile(pendingProfileRef.current);
      }
    };
  }, [saveProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profileRef.current, ...updates };
    setProfileState(newProfile);
    debouncedSave(newProfile);
  }, [debouncedSave, setProfileState]);

  // Save onboarding / extended profile data directly (upserts only the new columns)
  const saveOnboardingData = useCallback(async (data: {
    account_role?: string;
    full_name?: string;
    preferred_display_name?: string;
    university?: string;
    program_type?: string;
    program_state?: string;
    delivery_mode?: string;
    training_stage?: string;
    certification_state?: string;
    current_role?: string;
    certification_route?: string;
    primary_exam?: string;
    planned_test_date?: string;
    retake_status?: string;
    number_of_prior_attempts?: number | null;
    target_score?: number | null;
    study_goals?: string[];
    weekly_study_hours?: string;
    biggest_challenge?: string[];
    used_other_resources?: boolean | null;
    other_resources_list?: string[];
    what_was_missing?: string;
  }) => {
    if (!user) return;
    try {
      const updates = {
        user_id: user.id,
        ...data,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_progress')
        .upsert(updates, { onConflict: 'user_id' });

      if (error) {
        console.error('[saveOnboardingData] Supabase error:', error);
        throw error;
      }

      // Mirror into local profile state
      setProfileState({
        ...profileRef.current,
        onboardingComplete: true,
        accountRole: data.account_role,
        fullName: data.full_name,
        preferredDisplayName: data.preferred_display_name,
        university: data.university,
        programType: data.program_type,
        programState: data.program_state,
        deliveryMode: data.delivery_mode,
        trainingStage: data.training_stage,
        certificationState: data.certification_state,
        currentRole: data.current_role,
        certificationRoute: data.certification_route,
        primaryExam: data.primary_exam,
        plannedTestDate: data.planned_test_date,
        retakeStatus: data.retake_status,
        numberOfPriorAttempts: data.number_of_prior_attempts ?? undefined,
        targetScore: data.target_score ?? undefined,
        studyGoals: data.study_goals ?? [],
        weeklyStudyHours: data.weekly_study_hours,
        biggestChallenge: data.biggest_challenge ?? [],
        usedOtherResources: data.used_other_resources ?? undefined,
        otherResourcesList: data.other_resources_list ?? [],
        whatWasMissing: data.what_was_missing,
      });
    } catch (err) {
      console.error('[saveOnboardingData] Error:', err);
      throw err;
    }
  }, [user, setProfileState]);

  const migrateDomainSchema = useCallback(async () => {
    if (!user || !isLoaded) return;
    const hasLegacyData = profile.weakestDomains.some(id => id > 4);
    if (hasLegacyData) {
      await updateProfile({
        weakestDomains: [],
        domainScores: {}
      });
    }
  }, [user, isLoaded, profile.weakestDomains, updateProfile]);

  useEffect(() => {
    if (user && isLoaded && schemaCheckRef.current !== user.id) {
      void migrateDomainSchema();
      schemaCheckRef.current = user.id;
    }
  }, [user, isLoaded, migrateDomainSchema]);

  const updateLastSession = useCallback(async (
    sessionId: string,
    mode: SessionMode,
    questionIndex: number,
    elapsedSeconds?: number
  ): Promise<void> => {
    if (!user) return;
    try {
      const lastSessionData = {
        sessionId,
        mode,
        questionIndex,
        elapsedSeconds: elapsedSeconds || 0,
        updatedAt: new Date().toISOString()
      };

      await supabase.from('user_progress').upsert({
        user_id: user.id,
        last_session: lastSessionData,
        updated_at: new Date().toISOString()
      });

      setProfileState({
        ...profileRef.current,
        lastSession: lastSessionData
      });
    } catch (error) {
      console.error('[updateLastSession] Error updating last session:', error);
      Sentry.captureException(error, { extra: { context: 'updateLastSession' } });
      notifyError('Session progress not saved. Check your connection.');
    }
  }, [user, setProfileState]);

  const resetProgress = useCallback(async () => {
    if (!user) {
      setProfileState(defaultProfile);
      return;
    }
    try {
      await saveProfile(defaultProfile);
      setProfileState(defaultProfile);
      console.log('[ResetProgress] All progress cleared in Supabase');
    } catch (error) {
      console.error('Error resetting Supabase progress:', error);
      setProfileState(defaultProfile);
    }
  }, [user, saveProfile, setProfileState]);

  return {
    profile,
    isLoaded,
    updateProfile,
    saveOnboardingData,
    migrateDomainSchema,
    updateLastSession,
    resetProgress,
    // Composition seams — used by useScoreRecalculation (via the
    // useProgressTracking facade) to write skill scores through the same
    // state + persistence path.
    profileRef,
    setProfileState,
    saveProfile,
  };
}
