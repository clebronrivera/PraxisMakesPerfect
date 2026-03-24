/**
 * useAssessmentFlow
 *
 * Owns all assessment-session state that previously lived in App.tsx:
 *   State
 *   ─────
 *   activeAssessmentType · screenerQuestions · fullAssessmentQuestions
 *   adaptiveDiagnosticData · assessmentStartTime · selectedSessionId
 *   lastAssessmentResponses · lastAssessmentType · lastAssessmentFlow
 *
 *   Handlers
 *   ─────────
 *   startScreener · startFullAssessment · startAdaptiveDiagnostic
 *   handleScreenerComplete · handleFullAssessmentComplete
 *   handleAdaptiveDiagnosticComplete · handleResumeAssessment
 *   handleDiscardSession · handleViewReport
 *
 *   Effects
 *   ───────
 *   Restore selected-session-ID on mount from savedSession.
 *   Clear stale `lastSession` pointer when localStorage entry is gone.
 *
 * Extracted as part of Task 1 (App.tsx prop-drill audit).
 *
 * Note: `savedSession` is intentionally kept in App.tsx (it reads localStorage
 * synchronously on every render and is passed in as a stable option).
 * `setMode` / `onNavigate` is a callback — the hook calls it when a handler
 * needs to change the app's top-level route.
 */

import { useState, useCallback, useEffect } from 'react';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import { detectWeaknesses, UserResponse } from '../brain/weakness-detector';
import {
  buildFullAssessment,
  buildScreener,
  buildAdaptiveDiagnostic,
  AdaptiveDiagnosticResult,
} from '../utils/assessment-builder';
import { clearSession, AssessmentSession } from '../utils/sessionStorage';
import {
  createUserSession,
  deleteUserSession,
  loadUserSession,
  UserSession,
} from '../utils/userSessionStorage';
import { isStoredScreenerSessionType } from '../utils/sessionTypes';
import { isScreenerQuestionCount } from '../utils/assessmentConstants';
import type { UserProfile } from './useFirebaseProgress';
import type { AssessmentReportType } from '../types/assessment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssessmentFlowType = 'screener' | 'full-assessment';
export type AssessmentFlowLabel = 'screener' | 'archived-short-assessment' | 'full';

interface AssessmentResponseBundle {
  sessionId: string | null;
  questionIds: string[];
  responses: UserResponse[];
}

export interface UseAssessmentFlowOptions {
  analyzedQuestions: AnalyzedQuestion[];
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile> & Record<string, unknown>) => Promise<void>;
  currentUserName: string | null;
  isLoaded: boolean;
  savedSession: UserSession | null;
  getAssessmentResponses: (
    sessionId: string,
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[],
  ) => Promise<UserResponse[]>;
  getLatestAssessmentResponses: (
    assessmentTypes: AssessmentReportType[],
    questions: AnalyzedQuestion[],
  ) => Promise<AssessmentResponseBundle>;
  /** Called when a handler needs to transition the app to a new mode/route. */
  onNavigate: (mode: string) => void;
}

export interface UseAssessmentFlowReturn {
  // State
  activeAssessmentType: 'screener' | null;
  screenerQuestions: AnalyzedQuestion[];
  fullAssessmentQuestions: AnalyzedQuestion[];
  adaptiveDiagnosticData: AdaptiveDiagnosticResult | null;
  assessmentStartTime: number;
  selectedSessionId: string | undefined;
  lastAssessmentResponses: UserResponse[];
  lastAssessmentType: AssessmentFlowType;
  lastAssessmentFlow: AssessmentFlowLabel;

  // Handlers
  startScreener: (resumeSession?: AssessmentSession | UserSession) => void;
  startFullAssessment: (resumeSession?: AssessmentSession | UserSession) => void;
  startAdaptiveDiagnostic: (resumeSession?: UserSession) => void;
  handleScreenerComplete: (responses: UserResponse[]) => Promise<void>;
  handleFullAssessmentComplete: (responses: UserResponse[]) => Promise<void>;
  handleAdaptiveDiagnosticComplete: (responses: UserResponse[]) => Promise<void>;
  handleResumeAssessment: () => void;
  handleDiscardSession: () => void;
  handleViewReport: (assessmentType: AssessmentFlowType) => Promise<void>;

  // Setters exposed for the score-report rendering path
  setLastAssessmentResponses: React.Dispatch<React.SetStateAction<UserResponse[]>>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAssessmentFlow({
  analyzedQuestions,
  profile,
  updateProfile,
  currentUserName,
  isLoaded,
  savedSession,
  getAssessmentResponses,
  getLatestAssessmentResponses,
  onNavigate,
}: UseAssessmentFlowOptions): UseAssessmentFlowReturn {
  const [activeAssessmentType, setActiveAssessmentType] = useState<'screener' | null>(null);
  const [screenerQuestions, setScreenerQuestions] = useState<AnalyzedQuestion[]>([]);
  const [fullAssessmentQuestions, setFullAssessmentQuestions] = useState<AnalyzedQuestion[]>([]);
  const [adaptiveDiagnosticData, setAdaptiveDiagnosticData] =
    useState<AdaptiveDiagnosticResult | null>(null);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(
    savedSession?.startTime || 0,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [lastAssessmentResponses, setLastAssessmentResponses] = useState<UserResponse[]>([]);
  const [lastAssessmentType, setLastAssessmentType] =
    useState<AssessmentFlowType>('screener');
  const [lastAssessmentFlow, setLastAssessmentFlow] =
    useState<AssessmentFlowLabel>('screener');

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (savedSession) {
      setSelectedSessionId((savedSession as UserSession).sessionId);
      if (isStoredScreenerSessionType(savedSession.type)) {
        const isScreener =
          savedSession.assessmentFlow === 'screener' ||
          isScreenerQuestionCount(savedSession.questionIds.length);
        setActiveAssessmentType(isScreener ? 'screener' : null);
      } else if (savedSession.type === 'full-assessment') {
        setActiveAssessmentType(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only — mirrors original App.tsx behaviour

  // ── Fix stale Supabase lastSession if localStorage entry is gone ────────────
  useEffect(() => {
    if (!isLoaded || !profile.lastSession) return;
    const { sessionId, mode } = profile.lastSession;
    // Practice sessions don't use userSessionStorage — skip the check.
    if (mode === 'practice') return;
    const saved = loadUserSession(sessionId);
    if (!saved) {
      void updateProfile({ lastSession: null });
    }
  }, [isLoaded, profile.lastSession, updateProfile]);

  // ── startScreener ───────────────────────────────────────────────────────────
  const startScreener = useCallback(
    (resumeSession?: AssessmentSession | UserSession) => {
      if (resumeSession && isStoredScreenerSessionType(resumeSession.type)) {
        const isScreenerSession =
          resumeSession.assessmentFlow === 'screener' ||
          isScreenerQuestionCount(resumeSession.questionIds.length);

        if (!isScreenerSession) {
          alert(
            'This archived short-assessment session can no longer be resumed. Start the screener instead.',
          );
          return;
        }

        const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
        const restoredQuestions = resumeSession.questionIds
          .map(id => questionMap.get(id))
          .filter((q): q is AnalyzedQuestion => q !== undefined);

        if (restoredQuestions.length === resumeSession.questionIds.length) {
          setScreenerQuestions(restoredQuestions);
          setAssessmentStartTime(resumeSession.startTime);
          setSelectedSessionId((resumeSession as UserSession).sessionId);
          setActiveAssessmentType('screener');
          onNavigate('screener');
          return;
        }
      }

      const excludeIds = [
        ...(profile.preAssessmentQuestionIds || []),
        ...(profile.fullAssessmentQuestionIds || []),
        ...(profile.recentPracticeQuestionIds || []),
        ...(profile.screenerItemIds || []),
      ];

      const selected = buildScreener(analyzedQuestions, excludeIds);

      if (selected.length === 0) {
        alert('Not enough questions available to build a new screener.');
        return;
      }

      const questionIds = selected.map(q => q.id);

      void updateProfile({ screenerItemIds: questionIds });

      setScreenerQuestions(selected);
      setAssessmentStartTime(Date.now());
      setActiveAssessmentType('screener');
      onNavigate('screener');

      if (currentUserName) {
        try {
          const newSession = createUserSession(
            currentUserName,
            'screener-assessment',
            questionIds,
            'screener',
          );
          setSelectedSessionId(newSession.sessionId);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
    },
    [analyzedQuestions, currentUserName, onNavigate, profile, updateProfile],
  );

  // ── startFullAssessment ─────────────────────────────────────────────────────
  const startFullAssessment = useCallback(
    (resumeSession?: AssessmentSession | UserSession) => {
      if (resumeSession && resumeSession.type === 'full-assessment') {
        const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
        const restoredQuestions = resumeSession.questionIds
          .map(id => questionMap.get(id))
          .filter((q): q is AnalyzedQuestion => q !== undefined);

        if (restoredQuestions.length === resumeSession.questionIds.length) {
          setFullAssessmentQuestions(restoredQuestions);
          setAssessmentStartTime(resumeSession.startTime);
          setSelectedSessionId((resumeSession as UserSession).sessionId);
          onNavigate('fullassessment');
          return;
        }
      }

      const excludeIds = [
        ...(profile.screenerItemIds ?? []),
        ...(profile.preAssessmentQuestionIds ?? []),
      ];
      const selected = buildFullAssessment(analyzedQuestions, 125, excludeIds);

      if (selected.length === 0) {
        console.error('[FullAssessment] Failed to build assessment - no questions selected');
        return;
      }

      if (selected.length !== 125) {
        console.warn(`[FullAssessment] Expected 125 questions, got ${selected.length}`);
      }

      const questionIds = selected.map(q => q.id);

      if (currentUserName) {
        try {
          const newSession = createUserSession(
            currentUserName,
            'full-assessment',
            questionIds,
            'full',
          );
          setSelectedSessionId(newSession.sessionId);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }

      setFullAssessmentQuestions(selected);
      setAssessmentStartTime(Date.now());
      onNavigate('fullassessment');
    },
    [analyzedQuestions, currentUserName, onNavigate, profile],
  );

  // ── startAdaptiveDiagnostic ─────────────────────────────────────────────────
  const startAdaptiveDiagnostic = useCallback(
    (resumeSession?: UserSession) => {
      if (resumeSession && resumeSession.type === 'adaptive-diagnostic') {
        setSelectedSessionId(resumeSession.sessionId);
        const excludeIds = [
          ...(profile.preAssessmentQuestionIds || []),
          ...(profile.screenerItemIds || []),
        ];
        const result = buildAdaptiveDiagnostic(analyzedQuestions, excludeIds);
        setAdaptiveDiagnosticData(result);
        setAssessmentStartTime(resumeSession.startTime);
        onNavigate('adaptive-diagnostic');
        return;
      }

      const excludeIds = [
        ...(profile.preAssessmentQuestionIds || []),
        ...(profile.screenerItemIds || []),
        ...(profile.fullAssessmentQuestionIds || []),
      ];
      const result = buildAdaptiveDiagnostic(analyzedQuestions, excludeIds);

      if (result.initialQueue.length === 0) {
        alert('Not enough questions available to build a diagnostic.');
        return;
      }

      const allQuestionIds = [
        ...result.initialQueue.map(q => q.id),
        ...Object.values(result.followUpPool).flat().map(q => q.id),
      ];

      void updateProfile({ diagnosticQuestionIds: allQuestionIds });

      setAdaptiveDiagnosticData(result);
      setAssessmentStartTime(Date.now());
      onNavigate('adaptive-diagnostic');

      if (currentUserName) {
        try {
          const newSession = createUserSession(
            currentUserName,
            'adaptive-diagnostic',
            result.initialQueue.map(q => q.id),
            'adaptive-diagnostic',
          );
          setSelectedSessionId(newSession.sessionId);
        } catch (error) {
          console.error('Error creating adaptive diagnostic session:', error);
        }
      }
    },
    [analyzedQuestions, currentUserName, onNavigate, profile, updateProfile],
  );

  // ── handleResumeAssessment ──────────────────────────────────────────────────
  const handleResumeAssessment = useCallback(() => {
    if (!savedSession) return;

    if (savedSession.type === 'adaptive-diagnostic') {
      startAdaptiveDiagnostic(savedSession);
    } else if (isStoredScreenerSessionType(savedSession.type)) {
      startScreener(savedSession);
    } else if (savedSession.type === 'full-assessment') {
      startFullAssessment(savedSession);
    }
  }, [savedSession, startAdaptiveDiagnostic, startFullAssessment, startScreener]);

  // ── handleDiscardSession ────────────────────────────────────────────────────
  const handleDiscardSession = useCallback(() => {
    if (currentUserName && savedSession?.sessionId) {
      deleteUserSession(currentUserName, savedSession.sessionId);
    }
    if (profile.lastSession?.sessionId === savedSession?.sessionId) {
      void updateProfile({ lastSession: null });
    }
    clearSession();
    setSelectedSessionId(undefined);
    onNavigate('home');
  }, [currentUserName, onNavigate, profile.lastSession, savedSession, updateProfile]);

  // ── handleScreenerComplete ──────────────────────────────────────────────────
  const handleScreenerComplete = useCallback(
    async (responses: UserResponse[]) => {
      const questionCount = responses.length;
      const correctCount = responses.filter(r => r.isCorrect).length;
      const durationMs = assessmentStartTime > 0 ? Date.now() - assessmentStartTime : 0;
      const questionIds = screenerQuestions.map(q => q.id);

      console.log('[ScreenerAssessment] Complete', {
        questionCount,
        correctCount,
        durationMs,
        questionIds: questionIds.length,
        responsesSaved: responses.length,
      });

      const analysis = detectWeaknesses(responses, analyzedQuestions);

      const updates: any = { lastSession: null, ...analysis };

      if (activeAssessmentType === 'screener') {
        updates.screenerItemIds = questionIds;
        updates.lastScreenerSessionId = selectedSessionId;
        updates.lastScreenerCompletedAt = new Date().toISOString();
        updates.screenerComplete = true;
        updates.screenerResults = {
          domain_scores: Object.fromEntries(
            Object.entries(analysis.domainScores).map(([id, stats]) => [
              id,
              Math.round((stats.correct / stats.total) * 100),
            ]),
          ),
          completed_at: new Date().toISOString(),
        };
      }

      await updateProfile(updates);

      if (currentUserName && selectedSessionId) {
        deleteUserSession(currentUserName, selectedSessionId);
      }
      clearSession();
      setSelectedSessionId(undefined);

      console.log('[ScreenerAssessment] Results saved to Supabase, navigating to score report');

      setLastAssessmentResponses(responses);
      setLastAssessmentType('screener');
      setLastAssessmentFlow('screener');
      onNavigate('score-report');
    },
    [
      activeAssessmentType,
      analyzedQuestions,
      assessmentStartTime,
      currentUserName,
      onNavigate,
      screenerQuestions,
      selectedSessionId,
      updateProfile,
    ],
  );

  // ── handleFullAssessmentComplete ────────────────────────────────────────────
  const handleFullAssessmentComplete = useCallback(
    async (responses: UserResponse[]) => {
      const questionCount = responses.length;
      const correctCount = responses.filter(r => r.isCorrect).length;
      const durationMs = assessmentStartTime > 0 ? Date.now() - assessmentStartTime : 0;
      const questionIds = fullAssessmentQuestions.map(q => q.id);

      console.log('[FullAssessment] Complete', {
        questionCount,
        correctCount,
        durationMs,
        questionIds: questionIds.length,
        responsesSaved: responses.length,
      });

      const analysis = detectWeaknesses(responses, analyzedQuestions);

      await updateProfile({
        fullAssessmentComplete: true,
        fullAssessmentQuestionIds: questionIds,
        lastFullAssessmentSessionId: selectedSessionId,
        lastFullAssessmentCompletedAt: new Date().toISOString(),
        lastSession: null,
        ...analysis,
      } as any);

      if (currentUserName && selectedSessionId) {
        deleteUserSession(currentUserName, selectedSessionId);
      }
      clearSession();
      setSelectedSessionId(undefined);

      console.log('[FullAssessment] Results saved to Supabase, navigating to score report');

      setLastAssessmentResponses(responses);
      setLastAssessmentType('full-assessment');
      setLastAssessmentFlow('full');
      onNavigate('score-report');
    },
    [
      analyzedQuestions,
      assessmentStartTime,
      currentUserName,
      fullAssessmentQuestions,
      onNavigate,
      selectedSessionId,
      updateProfile,
    ],
  );

  // ── handleAdaptiveDiagnosticComplete ────────────────────────────────────────
  const handleAdaptiveDiagnosticComplete = useCallback(
    async (responses: UserResponse[]) => {
      const questionIds = responses.map(r => r.questionId);
      const analysis = detectWeaknesses(responses, analyzedQuestions);

      // Build the question list for ScoreReport (fullAssessmentQuestions is used there)
      const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
      const diagnosticQuestions = questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);
      setFullAssessmentQuestions(diagnosticQuestions);

      await updateProfile({
        screenerComplete: true,
        fullAssessmentComplete: true,
        adaptiveDiagnosticComplete: true,
        diagnosticQuestionIds: questionIds,
        lastDiagnosticSessionId: selectedSessionId,
        lastDiagnosticCompletedAt: new Date().toISOString(),
        lastSession: null,
        ...(analysis as Partial<UserProfile>),
      });

      if (currentUserName && selectedSessionId) {
        deleteUserSession(currentUserName, selectedSessionId);
      }
      clearSession();
      setSelectedSessionId(undefined);

      setLastAssessmentResponses(responses);
      setLastAssessmentType('full-assessment');
      setLastAssessmentFlow('full');
      onNavigate('score-report');
    },
    [analyzedQuestions, currentUserName, onNavigate, selectedSessionId, updateProfile],
  );

  // ── handleViewReport ────────────────────────────────────────────────────────
  const handleViewReport = useCallback(
    async (assessmentType: AssessmentFlowType) => {
      const screenerTime = profile.lastScreenerCompletedAt
        ? new Date(profile.lastScreenerCompletedAt).getTime()
        : profile.screenerResults?.completed_at
          ? new Date(profile.screenerResults.completed_at).getTime()
          : 0;
      const archivedShortAssessmentTime = profile.lastPreAssessmentCompletedAt
        ? new Date(profile.lastPreAssessmentCompletedAt).getTime()
        : 0;
      const isScreener =
        assessmentType === 'screener' &&
        profile.screenerComplete &&
        screenerTime >= archivedShortAssessmentTime;

      const responseTypes: AssessmentReportType[] =
        assessmentType === 'full-assessment'
          ? ['full']
          : isScreener
            ? ['screener']
            : ['diagnostic'];

      const sessionId =
        assessmentType === 'screener'
          ? isScreener
            ? profile.lastScreenerSessionId || profile.lastPreAssessmentSessionId
            : profile.lastPreAssessmentSessionId
          : profile.lastFullAssessmentSessionId;

      try {
        let questionIds =
          assessmentType === 'screener'
            ? (isScreener ? profile.screenerItemIds : profile.preAssessmentQuestionIds) || []
            : profile.fullAssessmentQuestionIds || [];

        const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));

        let responses = sessionId
          ? await getAssessmentResponses(sessionId, responseTypes, analyzedQuestions)
          : [];
        let resolvedSessionId = sessionId ?? null;

        if (responses.length === 0) {
          const fallback = await getLatestAssessmentResponses(responseTypes, analyzedQuestions);
          responses = fallback.responses;
          resolvedSessionId = fallback.sessionId ?? resolvedSessionId;

          if (questionIds.length === 0) {
            questionIds = fallback.questionIds;
          }
        }

        if (responses.length === 0) {
          console.warn(
            `[handleViewReport] No responses found in Supabase for ${assessmentType}`,
          );
          alert('Unable to load report. Response data not found in database.');
          return;
        }

        if (questionIds.length === 0) {
          questionIds = Array.from(new Set(responses.map(r => r.questionId)));
        }

        const questions = questionIds
          .map(id => questionMap.get(id))
          .filter((q): q is AnalyzedQuestion => q !== undefined);

        if (questions.length === 0) {
          console.error(`[handleViewReport] No matching questions found`);
          alert('Unable to load report. Questions not found.');
          return;
        }

        setAssessmentStartTime(0);
        setLastAssessmentResponses(responses);
        setLastAssessmentType(assessmentType);
        setLastAssessmentFlow(
          assessmentType === 'screener'
            ? isScreenerQuestionCount(questionIds.length)
              ? 'screener'
              : 'archived-short-assessment'
            : 'full',
        );

        if (resolvedSessionId && resolvedSessionId !== sessionId) {
          void updateProfile(
            assessmentType === 'screener'
              ? isScreener
                ? {
                    lastScreenerSessionId: resolvedSessionId,
                    ...(profile.screenerItemIds?.length
                      ? {}
                      : { screenerItemIds: questionIds }),
                  }
                : {
                    lastPreAssessmentSessionId: resolvedSessionId,
                    ...(profile.preAssessmentQuestionIds?.length
                      ? {}
                      : { preAssessmentQuestionIds: questionIds }),
                  }
              : {
                  lastFullAssessmentSessionId: resolvedSessionId,
                  ...(profile.fullAssessmentQuestionIds?.length
                    ? {}
                    : { fullAssessmentQuestionIds: questionIds }),
                },
          );
        }

        if (assessmentType === 'screener') {
          setScreenerQuestions(questions);
        } else {
          setFullAssessmentQuestions(questions);
        }

        onNavigate('score-report');
      } catch (error) {
        console.error(`[handleViewReport] Error loading report:`, error);
        alert('An error occurred while loading the report. Please try again.');
      }
    },
    [
      analyzedQuestions,
      getAssessmentResponses,
      getLatestAssessmentResponses,
      onNavigate,
      profile,
      updateProfile,
    ],
  );

  return {
    activeAssessmentType,
    screenerQuestions,
    fullAssessmentQuestions,
    adaptiveDiagnosticData,
    assessmentStartTime,
    selectedSessionId,
    lastAssessmentResponses,
    lastAssessmentType,
    lastAssessmentFlow,
    startScreener,
    startFullAssessment,
    startAdaptiveDiagnostic,
    handleScreenerComplete,
    handleFullAssessmentComplete,
    handleAdaptiveDiagnosticComplete,
    handleResumeAssessment,
    handleDiscardSession,
    handleViewReport,
    setLastAssessmentResponses,
  };
}
