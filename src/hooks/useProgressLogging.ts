// src/hooks/useProgressLogging.ts
// Response-logging slice of the former useProgressTracking god hook (Phase 5 E3).
// Owns all Supabase `responses` reads/writes: per-answer logging, assessment
// response rebuilds, screener/practice response persistence.
//
// `useProgressTracking` composes this with useUserProfile and
// useScoreRecalculation. `saveScreenerResponse` writes screener aggregates
// back through the profile hook's `updateProfile`, which is passed in.
//
// All logic moved verbatim from useProgressTracking — no behavior change.

import { useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notifyError } from '../utils/toast';
import { UserResponse } from '../brain/weakness-detector';
import type { PatternId } from '../brain/template-schema';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import type {
  AssessmentReportType,
  ResponseAssessmentType,
} from '../types/assessment';
import type { UserProfile } from './useUserProfile';

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
  createdAt?: string;
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

interface UseProgressLoggingOptions {
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export function useProgressLogging({ updateProfile }: UseProgressLoggingOptions) {
  const { user } = useAuth();

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
          ? { letter: selectedAnswers[0] || '', text: '', patternId: data.distractorPatternId as PatternId | undefined }
          : undefined,
      });
    });

    return {
      sessionId: sortedLogs[0]?.sessionId ?? null,
      questionIds,
      responses
    };
  }, []);

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
        selected_answer: response.selectedAnswers?.length
          ? response.selectedAnswers.join(',')
          : (response.selectedAnswer ?? null),
        correct_answers: response.correctAnswers || [],
        distractor_pattern_id: response.distractorPatternId,
        is_followup: response.is_followup ?? false,
        cognitive_complexity: response.cognitive_complexity ?? null,
        skill_question_index: response.skill_question_index ?? null
      }]);
    } catch (error) {
      console.error('[logResponse] Error logging Supabase response:', error);
      Sentry.captureException(error, { extra: { context: 'logResponse' } });
      notifyError('Answer not saved. Check your connection.');
    }
  }, [user]);

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

  const savePracticeResponse = useCallback(async (
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
      Sentry.captureException(error, { extra: { context: 'savePracticeResponse' } });
      notifyError('Answer not saved. Check your connection.');
    }
  }, [user]);

  return {
    logResponse,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    saveScreenerResponse,
    savePracticeResponse,
  };
}
