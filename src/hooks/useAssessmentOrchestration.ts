/**
 * useAssessmentOrchestration
 *
 * Phase 5 (E1) of the App.tsx decomposition — one hook that owns EVERY
 * assessment concern App.tsx used to coordinate by hand:
 *
 *   · the full `useAssessmentFlow` surface (screener / full / adaptive
 *     diagnostic sessions, completion handlers, report loading) — composed,
 *     not reimplemented;
 *   · the retake (third-assessment) lifecycle: unlock gate, pre/post
 *     snapshots, start/complete/exit/dismiss;
 *   · resume/discard of an in-progress session, including the orphaned-
 *     adaptive Supabase-reconstruction path that previously lived inline in
 *     the home screen's Resume button onClick;
 *   · the `diagnosticSummary` report model for ScoreReport.
 *
 * App.tsx consumes this as a single object and only routes + renders.
 * Behavior is pinned by tests/adaptiveDiagnosticFlow.test.tsx (component
 * seam) — every callback signature passed through to AdaptiveDiagnostic and
 * the score-report path must stay stable.
 *
 * All logic below is moved VERBATIM from App.tsx / kept delegating to
 * useAssessmentFlow — no behavior change.
 */

import { useState, useCallback, useMemo } from 'react';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import type { UserResponse } from '../brain/weakness-detector';
import {
  buildAdaptiveDiagnostic,
  type AdaptiveDiagnosticResult,
} from '../utils/assessment-builder';
import { useAssessmentFlow } from './useAssessmentFlow';
import type { UserProfile } from './useProgressTracking';
import { loadUserSession, type UserSession } from '../utils/userSessionStorage';
import { isStoredScreenerSessionType } from '../utils/sessionTypes';
import { isScreenerQuestionCount } from '../utils/assessmentConstants';
import { buildAssessmentReportModel } from '../utils/assessmentReport';
import { buildDiagnosticSummary } from '../utils/diagnosticSelectors';
import type { ProgressSummary } from '../utils/progressSummaries';
import type { GlobalScoreResult } from '../utils/globalScoreCalculator';
import type { Domain, Skill } from '../types/content';
import type { AssessmentReportType } from '../types/assessment';

interface AssessmentResponseBundle {
  sessionId: string | null;
  questionIds: string[];
  responses: UserResponse[];
}

type RetakeSnapshot = { readiness: number; demonstratingCount: number };

export interface UseAssessmentOrchestrationOptions {
  analyzedQuestions: AnalyzedQuestion[];
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile> & Record<string, unknown>) => Promise<void>;
  recalculateGlobalScores: () => Promise<GlobalScoreResult | null>;
  currentUserName: string | null;
  isLoaded: boolean;
  /** Read synchronously from localStorage each render — stays owned by App.tsx. */
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
  /** Lazily loads + analyzes the question bank (idempotent). Passed through to
   *  useAssessmentFlow and awaited by the retake builder so the 6.3MB bank loads
   *  on assessment entry, not at startup. */
  ensureQuestionBank: () => Promise<AnalyzedQuestion[]>;
  /** Current blended skill summary — used for the retake pre-snapshot. */
  progressSummary: ProgressSummary;
  fetchedDomains: Domain[];
  fetchedSkills: Skill[];
  /** Called when a handler needs to transition the app to a new mode/route. */
  onNavigate: (mode: string) => void;
}

export function useAssessmentOrchestration({
  analyzedQuestions,
  profile,
  updateProfile,
  recalculateGlobalScores,
  currentUserName,
  isLoaded,
  savedSession,
  getAssessmentResponses,
  getLatestAssessmentResponses,
  ensureQuestionBank,
  progressSummary,
  fetchedDomains,
  fetchedSkills,
  onNavigate,
}: UseAssessmentOrchestrationOptions) {
  // ── Base assessment flow (screener / full / adaptive) ──────────────────────
  const flow = useAssessmentFlow({
    analyzedQuestions,
    profile,
    updateProfile,
    currentUserName,
    isLoaded,
    savedSession,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    ensureQuestionBank,
    onNavigate,
  });

  const {
    startScreener,
    startFullAssessment,
    startAdaptiveDiagnostic,
    handleResumeAssessment,
    handleDiscardSession,
    lastAssessmentResponses,
    lastAssessmentType,
    fullAssessmentQuestions,
  } = flow;

  // ── Retake (third-assessment) state ─────────────────────────────────────────
  const [retakeAssessmentData, setRetakeAssessmentData] =
    useState<AdaptiveDiagnosticResult | null>(null);
  const [retakeJustCompleted, setRetakeJustCompleted] = useState(false);
  const [retakePreSnapshot, setRetakePreSnapshot] = useState<RetakeSnapshot | null>(null);
  const [retakePostSnapshot, setRetakePostSnapshot] = useState<RetakeSnapshot | null>(null);

  // ── Retake unlock gate (A4/D8) ──────────────────────────────────────────────
  // Deficit skills: those that scored < 60 in diagnosticSkillScores (screener+diagnostic only).
  // Gate opens when every deficit skill has reached >= 60 in current blended skillScores.
  const { hasRetakeUnlocked, deficitSkillIds, clearedDeficitCount } = useMemo(() => {
    const diagScores = profile.globalScores?.diagnosticSkillScores;
    if (!profile.adaptiveDiagnosticComplete || profile.retakeComplete || !diagScores) {
      return { hasRetakeUnlocked: false, deficitSkillIds: [] as string[], clearedDeficitCount: 0 };
    }
    const deficit = Object.entries(diagScores)
      .filter(([, score]) => score < 60)
      .map(([id]) => id);
    if (deficit.length === 0) {
      return { hasRetakeUnlocked: false, deficitSkillIds: [] as string[], clearedDeficitCount: 0 };
    }
    // Use globalScores.skillScores (0-100 scale) for consistency with diagnosticSkillScores
    const currentScores = profile.globalScores?.skillScores ?? {};
    const cleared = deficit.filter(id => (currentScores[id] ?? 0) >= 60).length;
    return { hasRetakeUnlocked: cleared === deficit.length, deficitSkillIds: deficit, clearedDeficitCount: cleared };
  }, [profile.adaptiveDiagnosticComplete, profile.retakeComplete, profile.globalScores, profile.skillScores]);

  const startRetakeAssessment = useCallback(async () => {
    if (!profile.adaptiveDiagnosticComplete || profile.retakeComplete) return;
    // Lazily load the bank on entry (idempotent); build from the resolved array.
    const questions = await ensureQuestionBank();
    // Capture pre-retake snapshot for the results card
    const preDemonstrating = progressSummary.skills.filter(s => s.colorState === 'green').length;
    setRetakePreSnapshot({ readiness: profile.globalScores?.globalReadiness ?? 0, demonstratingCount: preDemonstrating });
    setRetakeJustCompleted(false);
    setRetakePostSnapshot(null);
    // All prior question IDs become the "prefer unseen" list (soft preference, fall back on thin pools)
    const seenIds = [
      ...(profile.preAssessmentQuestionIds ?? []),
      ...(profile.screenerItemIds ?? []),
      ...(profile.fullAssessmentQuestionIds ?? []),
      ...(profile.diagnosticQuestionIds ?? []),
    ];
    const data = buildAdaptiveDiagnostic(questions, [], seenIds);
    setRetakeAssessmentData(data);
    onNavigate('retake-assessment');
  }, [profile, ensureQuestionBank, progressSummary.skills, onNavigate]);

  const handleRetakeComplete = useCallback(async () => {
    await updateProfile({ retakeComplete: true, retakeCompletedAt: new Date().toISOString(), lastSession: null });
    const newGlobal = await recalculateGlobalScores();
    const postDemonstrating = Object.values(newGlobal?.skillScores ?? {}).filter(s => s >= 80).length;
    setRetakePostSnapshot({ readiness: newGlobal?.globalReadiness ?? 0, demonstratingCount: postDemonstrating });
    setRetakeJustCompleted(true);
    setRetakeAssessmentData(null);
    onNavigate('home');
  }, [updateProfile, recalculateGlobalScores, onNavigate]);

  /** Pause-exit from the retake screen — drops the built queue and returns home. */
  const exitRetake = useCallback(() => {
    setRetakeAssessmentData(null);
    onNavigate('home');
  }, [onNavigate]);

  /** Dismiss the post-retake results card on the dashboard. */
  const dismissRetakeResults = useCallback(() => {
    setRetakeJustCompleted(false);
  }, []);

  // ── In-progress session derivations (formerly inline in the home render) ────
  // "Orphaned adaptive progress": user has saved answers in Supabase
  // but no `last_session` pointer and no localStorage session. Happens
  // when a user starts the diagnostic, clears cache / switches device,
  // and returns later. The startAdaptiveDiagnostic() Supabase-fallback
  // path will reconstruct their session — we just need to surface a
  // Resume CTA instead of the default "Begin Adaptive Diagnostic" one.
  const hasOrphanedAdaptive =
    !profile.lastSession &&
    !savedSession &&
    !profile.adaptiveDiagnosticComplete &&
    (profile.adaptiveResponseCount ?? 0) > 0;

  const hasAssessmentInProgress =
    (profile.lastSession?.mode === 'screener' && !profile.screenerComplete) ||
    (profile.lastSession?.mode === 'full' && !profile.fullAssessmentComplete) ||
    (profile.lastSession?.mode === 'diagnostic' && !profile.diagnosticComplete) ||
    profile.lastSession?.mode === 'adaptive' ||
    (!profile.lastSession && Boolean(savedSession) &&
      !profile.screenerComplete && !profile.fullAssessmentComplete) ||
    hasOrphanedAdaptive;

  const hasPracticeInProgress = profile.lastSession?.mode === 'practice';

  // ── Resume / discard (formerly the home Resume card's inline onClick) ───────
  const resumeFromLastSession = useCallback(() => {
    if (profile.lastSession) {
      const ls = profile.lastSession;
      if (ls.mode === 'adaptive') {
        const saved = loadUserSession(ls.sessionId);
        if (!saved) {
          // localStorage was cleared or this is a different browser/device.
          // Fall back to Supabase-backed reconstruction (startAdaptiveDiagnostic
          // with no args queries Supabase for prior responses and rebuilds the
          // session synthetically — do NOT clear lastSession here or the
          // resume card would disappear before reconstruction completes).
          void startAdaptiveDiagnostic();
          return;
        }
        startAdaptiveDiagnostic(saved);
      } else if (ls.mode === 'screener') {
        const saved = loadUserSession(ls.sessionId);
        if (!saved) { updateProfile({ lastSession: null }); alert('That session is no longer available.'); return; }
        startScreener(saved);
      } else if (ls.mode === 'diagnostic') {
        const saved = loadUserSession(ls.sessionId);
        if (saved && isStoredScreenerSessionType(saved.type) && (saved.assessmentFlow === 'screener' || isScreenerQuestionCount(saved.questionIds.length))) {
          void updateProfile({ lastSession: { ...ls, mode: 'screener' } });
          startScreener(saved); return;
        }
        updateProfile({ lastSession: null });
        alert('That session can no longer be resumed. Start a new screener.');
      } else if (ls.mode === 'full') {
        const saved = loadUserSession(ls.sessionId);
        if (!saved) { updateProfile({ lastSession: null }); alert('That session is no longer available.'); return; }
        startFullAssessment(saved);
      }
    } else if (savedSession) {
      handleResumeAssessment();
    } else if (hasOrphanedAdaptive) {
      // No lastSession, no localStorage — but Supabase has
      // saved adaptive responses for this user. Calling
      // startAdaptiveDiagnostic() with no args triggers the
      // Supabase reconstruction path which rebuilds a
      // synthetic session + writes lastSession.
      void startAdaptiveDiagnostic();
    }
  }, [
    profile.lastSession,
    savedSession,
    hasOrphanedAdaptive,
    startAdaptiveDiagnostic,
    startScreener,
    startFullAssessment,
    handleResumeAssessment,
    updateProfile,
  ]);

  /** True when there is anything for `discardInProgressSession` to clear. */
  const canDiscardSession = Boolean(profile.lastSession || savedSession);

  const discardInProgressSession = useCallback(() => {
    if (profile.lastSession) updateProfile({ lastSession: null });
    if (savedSession) handleDiscardSession();
  }, [profile.lastSession, savedSession, updateProfile, handleDiscardSession]);

  // ── Diagnostic summary for ScoreReport ──────────────────────────────────────
  // Build unified DiagnosticSummary for ScoreReport after a full/adaptive assessment.
  // Omits conceptAnalytics (not computed at this level — ResultsDashboard
  // runs it independently). conceptGaps/crossSkillConceptGaps/conceptSummary will be null.
  const diagnosticSummary = useMemo(() => {
    if (
      lastAssessmentType === 'screener' ||
      lastAssessmentResponses.length === 0 ||
      fullAssessmentQuestions.length === 0
    ) {
      return undefined;
    }
    const report = buildAssessmentReportModel(
      lastAssessmentResponses,
      fullAssessmentQuestions,
      fetchedDomains,
      fetchedSkills,
    );
    return buildDiagnosticSummary(report, profile);
  }, [lastAssessmentResponses, fullAssessmentQuestions, fetchedDomains, fetchedSkills, profile, lastAssessmentType]);

  return {
    // Full useAssessmentFlow surface (state + start/complete/report handlers)
    ...flow,

    // Retake lifecycle
    retakeAssessmentData,
    retakeJustCompleted,
    retakePreSnapshot,
    retakePostSnapshot,
    hasRetakeUnlocked,
    deficitSkillIds,
    clearedDeficitCount,
    startRetakeAssessment,
    handleRetakeComplete,
    exitRetake,
    dismissRetakeResults,

    // In-progress session state + resume/discard
    hasOrphanedAdaptive,
    hasAssessmentInProgress,
    hasPracticeInProgress,
    resumeFromLastSession,
    canDiscardSession,
    discardInProgressSession,

    // Score-report model
    diagnosticSummary,
  };
}
