// src/hooks/useProgressTracking.ts
// Supabase-backed progress hook.
// All internals use Supabase exclusively — Firebase/Firestore is not used.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SkillId } from '../brain/skill-map';
import {
  LearningState,
  SkillPerformance,
  SkillAttempt,
  calculateLearningState,
  calculateWeightedAccuracy,
  countConfidenceFlags,
  countRecentHighConfidenceWrong
} from '../brain/learning-state';
import { UserResponse } from '../brain/weakness-detector';
import { calculateAndSaveGlobalScores } from '../utils/globalScoreCalculator';
import { calculateSrsUpdate } from '../utils/srsEngine';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import type {
  AssessmentReportType,
  ResponseAssessmentType,
  SessionMode
} from '../types/assessment';

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
  lastPracticeAt?: any;
  migrationVersion?: number;
  lastSession?: {
    sessionId: string;
    mode: SessionMode;
    questionIndex: number;
    updatedAt: any;
  } | null;
  lastPreAssessmentSessionId?: string;
  lastFullAssessmentSessionId?: string;
  lastScreenerSessionId?: string;
  lastPreAssessmentCompletedAt?: any;
  lastFullAssessmentCompletedAt?: any;
  lastScreenerCompletedAt?: any;
  screenerComplete?: boolean;
  screenerResults?: {
    domain_scores: Record<number, number>;
    completed_at: any;
  };
  diagnosticComplete?: boolean;
  adaptiveDiagnosticComplete?: boolean;
  diagnosticQuestionIds?: string[];
  lastDiagnosticSessionId?: string;
  lastDiagnosticCompletedAt?: string;
  lastUpdated?: any;

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
}

export interface ResponseLog {
  questionId: string;
  skillId?: string;
  domainIds?: number[];
  assessmentType: ResponseAssessmentType;
  sessionId: string;
  isCorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  timeSpent: number;
  time_on_item_seconds?: number;
  timestamp: number;
  selectedAnswers: string[];
  correctAnswers: string[];
  distractorPatternId?: string;
  createdAt?: any;
  selectedAnswer?: string;
  domainId?: number;
  // Adaptive diagnostic audit fields
  is_followup?: boolean;
  cognitive_complexity?: string;
  skill_question_index?: number;
}

interface AssessmentResponseBundle {
  sessionId: string | null;
  questionIds: string[];
  responses: UserResponse[];
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

export function useProgressTracking() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const schemaCheckRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile>(defaultProfile);

  const setProfileState = useCallback((nextProfile: UserProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  const rebuildAssessmentResponses = useCallback((
    logs: ResponseLog[],
    questions: AnalyzedQuestion[]
  ): AssessmentResponseBundle => {
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
    const questionIds: string[] = [];
    const responses: UserResponse[] = [];

    sortedLogs.forEach((data) => {
      const question = questions.find(q => q.id === data.questionId);

      if (!question) {
        console.warn(`[rebuildAssessmentResponses] Question not found: ${data.questionId}`);
        return;
      }

      questionIds.push(data.questionId);

      const selectedAnswers = Array.isArray(data.selectedAnswers) && data.selectedAnswers.length > 0
        ? data.selectedAnswers
        : (data.selectedAnswer ? [data.selectedAnswer] : []);
      const correctAnswers = Array.isArray(data.correctAnswers) && data.correctAnswers.length > 0
        ? data.correctAnswers
        : (question.correct_answer || []);

      responses.push({
        questionId: data.questionId,
        selectedAnswers,
        correctAnswers,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent,
        confidence: data.confidence,
        timestamp: data.timestamp,
        selectedDistractor: data.distractorPatternId
          ? { letter: selectedAnswers[0] || '', text: '', patternId: data.distractorPatternId as any }
          : undefined,
      });
    });

    return {
      sessionId: sortedLogs[0]?.sessionId ?? null,
      questionIds,
      responses
    };
  }, []);

  // Fetch from Supabase
  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfileState(defaultProfile);
      setIsLoaded(true);
      return;
    }

    try {
      // Fetch user_progress row and response counts in parallel.
      // The counts are computed from the canonical `responses` table so they are
      // always accurate — even for users whose denormalised counters were never
      // written (e.g. accounts created before the write-path was implemented).
      const [
        { data, error },
        { count: totalCount },
        { count: practiceCount }
      ] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
        supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('assessment_type', 'practice')
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
        });
      } else {
        setProfileState(defaultProfile);
      }
    } catch (e) {
      console.error(e);
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

        updated_at: new Date().toISOString()
      };

      await supabase
        .from('user_progress')
        .upsert(updates, { onConflict: 'user_id' });
        
    } catch (error) {
      console.error('Error saving Supabase profile:', error);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profileRef.current, ...updates };
    setProfileState(newProfile);
    await saveProfile(newProfile);
  }, [saveProfile, setProfileState]);

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

  /**
   * Log a response to the responses table (Supabase)
   */
  const logResponse = useCallback(async (
    response: Omit<ResponseLog, 'createdAt'>
  ): Promise<void> => {
    if (!user) return;
    try {
      await supabase.from('responses').insert([{
        user_id: user.id,
        session_id: response.sessionId,
        question_id: response.questionId,
        skill_id: response.skillId,
        domain_id: response.domainId,
        domain_ids: response.domainIds || [],
        assessment_type: response.assessmentType,
        is_correct: response.isCorrect,
        confidence: response.confidence,
        time_spent: response.timeSpent,
        time_on_item_seconds: response.time_on_item_seconds,
        selected_answers: response.selectedAnswers || (response.selectedAnswer ? [response.selectedAnswer] : []),
        correct_answers: response.correctAnswers || [],
        distractor_pattern_id: response.distractorPatternId,
        is_followup: response.is_followup ?? false,
        cognitive_complexity: response.cognitive_complexity ?? null,
        skill_question_index: response.skill_question_index ?? null
      }]);
    } catch (error) {
      console.error('[logResponse] Error logging Supabase response:', error);
    }
  }, [user]);

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
    }
  }, [user, setProfileState]);

  const updateSkillProgress = useCallback(async (
    skillId: SkillId,
    isCorrect: boolean,
    confidence: 'low' | 'medium' | 'high' = 'medium',
    questionId?: string,
    timeSpent?: number
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
    
    const newAttempts = baseSkill.attempts + 1;
    const newCorrect = baseSkill.correct + (isCorrect ? 1 : 0);
    const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
    const newConsecutiveCorrect = isCorrect ? baseSkill.consecutiveCorrect + 1 : 0;
    const newHistory = [...baseSkill.history, isCorrect].slice(-5);
    
    // Append a real attempt with this answer's actual confidence/timestamp (cap at 20)
    const newAttempt: SkillAttempt = {
      questionId: questionId || `unknown-${Date.now()}`,
      correct: isCorrect,
      confidence,
      timestamp: Date.now(),
      timeSpent: timeSpent || 0,
    };
    const prevAttemptHistory = baseSkill.attemptHistory ?? [];
    const newAttemptHistory = [...prevAttemptHistory, newAttempt].slice(-20);

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
  }, [saveProfile, setProfileState]);

  const resetProgress = useCallback(async () => {
    if (!user) {
      setProfileState(defaultProfile);
      return;
    }
    try {
      await saveProfile(defaultProfile);
      setProfileState(defaultProfile);
      // Progress cleared
    } catch (error) {
      console.error('Error resetting Supabase progress:', error);
      setProfileState(defaultProfile);
    }
  }, [user, saveProfile, setProfileState]);

  const getAssessmentResponses = useCallback(async (
    sessionId: string,
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[]
  ): Promise<UserResponse[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .in('assessment_type', assessmentTypes);

      if (error) throw error;
      
      const responseLogs = (data || []).map(row => ({
        questionId: row.question_id,
        skillId: row.skill_id,
        domainIds: row.domain_ids,
        assessmentType: row.assessment_type as ResponseAssessmentType,
        sessionId: row.session_id,
        isCorrect: row.is_correct,
        confidence: row.confidence,
        timeSpent: row.time_spent,
        timestamp: new Date(row.created_at).getTime(),
        selectedAnswers: row.selected_answers,
        correctAnswers: row.correct_answers,
        distractorPatternId: row.distractor_pattern_id
      }));

      const { responses } = rebuildAssessmentResponses(responseLogs, questions);
      return responses;
    } catch (error) {
      console.error('[getAssessmentResponses] Error retrieving responses:', error);
      return [];
    }
  }, [rebuildAssessmentResponses, user]);

  const getLatestAssessmentResponses = useCallback(async (
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[]
  ): Promise<AssessmentResponseBundle> => {
    if (!user) return { sessionId: null, questionIds: [], responses: [] };

    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', user.id)
        .in('assessment_type', assessmentTypes)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
         return { sessionId: null, questionIds: [], responses: [] };
      }
      
      // Group by sessionId
      const logsBySession = new Map<string, ResponseLog[]>();
      data.forEach(row => {
        const log = {
          questionId: row.question_id,
          skillId: row.skill_id,
          domainIds: row.domain_ids,
          assessmentType: row.assessment_type as ResponseAssessmentType,
          sessionId: row.session_id,
          isCorrect: row.is_correct,
          confidence: row.confidence,
          timeSpent: row.time_spent,
          timestamp: new Date(row.created_at).getTime(),
          selectedAnswers: row.selected_answers,
          correctAnswers: row.correct_answers,
          distractorPatternId: row.distractor_pattern_id
        };
        const arr = logsBySession.get(log.sessionId) ?? [];
        arr.push(log);
        logsBySession.set(log.sessionId, arr);
      });

      let latestSessionId: string | null = null;
      let latestTimestamp = -Infinity;

      logsBySession.forEach((sessionLogs, sessionId) => {
        const sessionLatestTimestamp = Math.max(...sessionLogs.map(log => log.timestamp));
        if (sessionLatestTimestamp > latestTimestamp) {
          latestTimestamp = sessionLatestTimestamp;
          latestSessionId = sessionId;
        }
      });

      if (!latestSessionId) {
        return { sessionId: null, questionIds: [], responses: [] };
      }

      return rebuildAssessmentResponses(logsBySession.get(latestSessionId) ?? [], questions);
    } catch (error) {
      console.error('[getLatestAssessmentResponses] Error retrieving latest responses:', error);
      return { sessionId: null, questionIds: [], responses: [] };
    }
  }, [rebuildAssessmentResponses, user]);

  const saveScreenerResponse = useCallback(async (
    response: {
      question_id: string;
      skill_id: string;
      domain_id: number;
      selected_answer: string;
      correct_answer: string;
      is_correct: boolean;
      confidence: string;
      timestamp: number;
    },
    totalQuestions: number = 50
  ) => {
    if (!user) return;

    try {
      // 1. Save to responses (using screener assessment type)
      await supabase.from('responses').insert([{
         user_id: user.id,
         session_id: 'screener_session', 
         question_id: response.question_id,
         skill_id: response.skill_id,
         domain_id: response.domain_id,
         assessment_type: 'screener',
         is_correct: response.is_correct,
         confidence: response.confidence,
         selected_answers: [response.selected_answer],
         correct_answers: [response.correct_answer],
         time_spent: 0
      }]);

      // 2. Aggregate screener logic
      const { data: snapshot } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_type', 'screener');
        
      const completedCount = snapshot?.length || 0;

      if (completedCount >= totalQuestions && snapshot) {
        const domainStats: Record<number, { correct: number; total: number }> = {};
        
        snapshot.forEach(r => {
          const dId = r.domain_id;
          if (dId !== null) {
            if (!domainStats[dId]) domainStats[dId] = { correct: 0, total: 0 };
            domainStats[dId].total++;
            if (r.is_correct) domainStats[dId].correct++;
          }
        });

        const domainScores: Record<number, number> = {};
        Object.entries(domainStats).forEach(([dId, stats]) => {
          domainScores[Number(dId)] = Math.round((stats.correct / stats.total) * 100);
        });

        await updateProfile({
          screenerComplete: true,
          screenerResults: {
            domain_scores: domainScores,
            completed_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('[saveScreenerResponse] Error logging screener response:', error);
    }
  }, [user, updateProfile]);

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
    savePracticeResponse: useCallback(async (
      sessionId: string,
      questionId: string,
      response: {
        skill_id: string;
        domain_id: number;
        selected_answer: string;
        correct_answer: string;
        is_correct: boolean;
        confidence: string;
        time_on_item_seconds: number;
        shuffled_order: string[];
        /** Current consecutive-correct streak after this answer (0 on wrong). */
        consecutive_correct?: number;
      }
    ) => {
      if (!user) return;
      try {
        // Write to the canonical `responses` table (assessment_type = 'practice') so that
        // global-score calculation and history queries can actually read this data.
        // The separate `practice_responses` table is intentionally NOT written here because
        // it was write-only (never queried), causing orphaned data (issue #7).
        await supabase.from('responses').insert([{
          user_id: user.id,
          session_id: sessionId,
          question_id: questionId,
          skill_id: response.skill_id,
          domain_id: response.domain_id,
          assessment_type: 'practice',
          is_correct: response.is_correct,
          confidence: response.confidence,
          time_on_item_seconds: response.time_on_item_seconds,
          selected_answers: [response.selected_answer],
          correct_answers: [response.correct_answer]
        }]);

        // Persist the live streak so the home-screen "Current Streak" tile
        // always reflects the user's latest run of correct answers.
        if (typeof response.consecutive_correct === 'number') {
          await supabase
            .from('user_progress')
            .update({ streak: response.consecutive_correct, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('[savePracticeResponse] Error saving response:', error);
      }
    }, [user]),
    recalculateGlobalScores: useCallback(async () => {
      if (!user) return null;
      try {
        const result = await calculateAndSaveGlobalScores(user.id);
        // Global scores recalculated
        return result;
      } catch (error) {
        console.error('[GlobalScores] Error recalculating:', error);
        return null;
      }
    }, [user]),
    isLoaded,
    isLoggedIn: !!user
  };
}
