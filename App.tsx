import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronRight, AlertTriangle, Zap, BarChart3, LogOut, Shield, MessageSquare } from 'lucide-react';

// Import questions and analysis
import { analyzeQuestion, AnalyzedQuestion } from './src/brain/question-analyzer';
import { detectWeaknesses, UserResponse } from './src/brain/weakness-detector';

// Import components
import StudyModesSection from './src/components/StudyModesSection';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import FeedbackModal from './src/components/FeedbackModal';
const ResultsDashboard = lazy(() => import('./src/components/ResultsDashboard'));
const ScreenerAssessment = lazy(() => import('./src/components/ScreenerAssessment'));
const FullAssessment = lazy(() => import('./src/components/FullAssessment'));
const ScoreReport = lazy(() => import('./src/components/ScoreReport'));
const ScreenerResults = lazy(() => import('./src/components/ScreenerResults'));
const PracticeSession = lazy(() => import('./src/components/PracticeSession'));
const TeachMode = lazy(() => import('./src/components/TeachMode'));
const AdminDashboard = lazy(() => import('./src/components/AdminDashboard'));
const StudyPlanCard = lazy(() => import('./src/components/StudyPlanCard'));

// Import hooks
import { useFirebaseProgress } from './src/hooks/useFirebaseProgress';
import { useAdaptiveLearning } from './src/hooks/useAdaptiveLearning';
import { clearSession, AssessmentSession } from './src/utils/sessionStorage';
import { createUserSession, deleteUserSession, getCurrentSession, loadUserSession, UserSession } from './src/utils/userSessionStorage';
import { isStoredScreenerSessionType } from './src/utils/sessionTypes';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useContent } from './src/context/ContentContext';
import LoginScreen from './src/components/LoginScreen';
import { buildFullAssessment, buildScreener } from './src/utils/assessment-builder';
import {
  isScreenerQuestionCount
} from './src/utils/assessmentConstants';
import { getSkillById } from './src/brain/skill-map';
import { PROGRESS_DOMAINS } from './src/utils/progressTaxonomy';

import { StudyPlanDocument, generateStudyPlan, getLatestStudyPlan } from './src/services/studyPlanService';
import { supabase } from './src/config/supabase';
import { isAdminEmail } from './src/config/admin';
import { clearLegacyClientDataOnce } from './src/utils/legacyClientData';
import type { AssessmentReportType } from './src/types/assessment';
import { ACTIVE_LAUNCH_FEATURES } from './src/utils/launchConfig';
import { buildProgressSummary } from './src/utils/progressSummaries';

// ============================================
// TYPE DEFINITIONS
// ============================================

// ============================================
// MAIN APP COMPONENT
// ============================================

function PraxisStudyAppContent() {
  type AppMode = 'home' | 'screener' | 'fullassessment' | 'results' | 'score-report' | 'practice' | 'review' | 'teach' | 'admin';
  type NonAdminAppMode = Exclude<AppMode, 'admin'>;

  // Use hooks for profile and adaptive learning
  const { user, loading: authLoading, logout } = useAuth();
  const { questions: fetchedQuestions, isLoading: contentLoading, domains: fetchedDomains, skills: fetchedSkills } = useContent();
  const { profile, updateProfile, updateSkillProgress, resetProgress, logResponse, updateLastSession, getAssessmentResponses, getLatestAssessmentResponses, savePracticeResponse, saveScreenerResponse, isLoaded } = useFirebaseProgress();
  const { selectNextQuestion } = useAdaptiveLearning();
  const [canonicalQuestions, setCanonicalQuestions] = useState<any[]>([]);
  const [canonicalLoading, setCanonicalLoading] = useState(true);
  const canonicalQuestionIds = useMemo(
    () => new Set(canonicalQuestions.map(question => question.id)),
    [canonicalQuestions]
  );
  const sanitizedFetchedQuestions = useMemo(
    () => fetchedQuestions.filter(question => canonicalQuestionIds.has(question.id)),
    [fetchedQuestions, canonicalQuestionIds]
  );

  useEffect(() => {
    let active = true;

    import('./src/data/questions.json')
      .then(module => {
        if (!active) return;
        const loadedQuestions = module.default as any[];
        setCanonicalQuestions(loadedQuestions);
      })
      .catch(error => {
        console.error('[QuestionBank] Failed to load canonical question bank:', error);
      })
      .finally(() => {
        if (active) {
          setCanonicalLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);
  
  useEffect(() => {
    clearLegacyClientDataOnce();
  }, []);
  
  // User management
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const currentUserName = user?.user_metadata?.full_name || user?.user_metadata?.displayName || user?.email || null;
  
  const savedSession = currentUserName ? getCurrentSession(currentUserName) : null;
  const hasSession = Boolean(savedSession);
  const savedSessionLabel = savedSession && isStoredScreenerSessionType(savedSession.type)
    ? ((savedSession.assessmentFlow === 'screener' || isScreenerQuestionCount(savedSession.questionIds.length))
        ? 'screener'
        : 'archived short assessment')
    : 'full assessment';
  
  // App state
  const [activeAssessmentType, setActiveAssessmentType] = useState<'screener' | null>(null);
  const [mode, setMode] = useState<AppMode>('home');
  const [lastNonAdminMode, setLastNonAdminMode] = useState<NonAdminAppMode>('home');
  const [screenerQuestions, setScreenerQuestions] = useState<AnalyzedQuestion[]>([]);
  const [fullAssessmentQuestions, setFullAssessmentQuestions] = useState<AnalyzedQuestion[]>([]);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(savedSession?.startTime || 0);
  const [lastAssessmentResponses, setLastAssessmentResponses] = useState<UserResponse[]>([]);
  const [lastAssessmentType, setLastAssessmentType] = useState<'screener' | 'full-assessment'>('screener');
  const [lastAssessmentFlow, setLastAssessmentFlow] = useState<'screener' | 'archived-short-assessment' | 'full'>('screener');
  const [practiceDomainFilter, setPracticeDomainFilter] = useState<number | null>(null);
  const [practiceSkillFilter, setPracticeSkillFilter] = useState<string | null>(null);
  const [teachModeDomains] = useState<number[] | undefined>(undefined);
  const [studyPlan, setStudyPlan] = useState<StudyPlanDocument | null>(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [studyPlanGenerating, setStudyPlanGenerating] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [resultsDefaultView, setResultsDefaultView] = useState<'domain' | 'skill'>('domain');

  // Practice context: tracks the last skill or domain practiced so the
  // "Continue Where You Left Off" card can name it and resume correctly.
  interface PracticeContext {
    type: 'skill' | 'domain' | 'general';
    skillId?: string;
    domainId?: number;
  }
  const [lastPracticeContext, setLastPracticeContext] = useState<PracticeContext | null>(null);
  // preAssessmentComplete was a dead field (always false, no DB column); collapsed to diagnosticComplete only.
  const hasArchivedShortAssessment = profile.diagnosticComplete;
  const hasCompletedScreener = profile.screenerComplete;
  const screenerCompletedAtMillis = profile.lastScreenerCompletedAt
    ? new Date(profile.lastScreenerCompletedAt).getTime()
    : (profile.screenerResults?.completed_at ? new Date(profile.screenerResults.completed_at).getTime() : 0);
  const archivedShortAssessmentCompletedAtMillis = profile.lastPreAssessmentCompletedAt
    ? new Date(profile.lastPreAssessmentCompletedAt).getTime()
    : 0;
  const latestShortAssessmentIsScreener = hasCompletedScreener && screenerCompletedAtMillis >= archivedShortAssessmentCompletedAtMillis;
  const hasReadinessData = hasArchivedShortAssessment || hasCompletedScreener || profile.fullAssessmentComplete;
  const hasShortAssessmentReport = Boolean(
    (hasCompletedScreener && (profile.lastScreenerSessionId || profile.screenerItemIds?.length)) ||
    (hasArchivedShortAssessment && profile.lastPreAssessmentSessionId)
  );
  
  // Analyze all questions
  const analyzedQuestions = useMemo(() => {
    // Always use the canonical local bank as the source of truth for question content.
    // Supabase question data is not trusted for content — only counts/IDs are logged for
    // drift detection (see the useEffect below). This ensures local corrections are never
    // silently bypassed by stale Supabase copies with matching IDs.
    return canonicalQuestions.map(analyzeQuestion);
  }, [canonicalQuestions]);
  const progressSummary = useMemo(
    () => buildProgressSummary(profile.skillScores, fetchedSkills),
    [fetchedSkills, profile.skillScores]
  );

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (canonicalLoading || contentLoading || canonicalQuestions.length === 0 || fetchedQuestions.length === 0) {
      return;
    }

    const staleQuestionCount = fetchedQuestions.length - sanitizedFetchedQuestions.length;
    const missingCanonicalCount = canonicalQuestions.length - sanitizedFetchedQuestions.length;

    if (staleQuestionCount > 0 || missingCanonicalCount > 0) {
      console.warn('[QuestionBank] Supabase questions do not match the canonical export. Falling back to the bundled bank.', {
        supabaseCount: fetchedQuestions.length,
        canonicalCount: canonicalQuestions.length,
        matchedCanonicalCount: sanitizedFetchedQuestions.length,
        staleQuestionCount,
        missingCanonicalCount
      });
    }
  }, [canonicalLoading, canonicalQuestions.length, contentLoading, fetchedQuestions, sanitizedFetchedQuestions.length]);

  // Restore session ID and assessment type on mount
  useEffect(() => {
    if (savedSession) {
      setSelectedSessionId((savedSession as any).sessionId);
      if (isStoredScreenerSessionType(savedSession.type)) {
        const isScreener = savedSession.assessmentFlow === 'screener' || isScreenerQuestionCount(savedSession.questionIds.length);
        setActiveAssessmentType(isScreener ? 'screener' : null);
      } else if (savedSession.type === 'full-assessment') {
        setActiveAssessmentType(null);
      }
    }
  }, [savedSession]);

  // Load last practice context from localStorage when user is known
  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`pmp-practice-context-${user.id}`);
      if (stored) setLastPracticeContext(JSON.parse(stored));
    } catch { /* ignore corrupt data */ }
  }, [user?.id]);

  // Fix #6: Clear stale Supabase lastSession if the corresponding localStorage entry is gone.
  // This prevents the "session no longer available" alert and avoids dual-source confusion.
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

  // Filter questions by domain for practice mode
  const practiceQuestions = useMemo(() => {
    if (practiceSkillFilter) {
      return analyzedQuestions.filter(q => q.skillId === practiceSkillFilter);
    }

    if (practiceDomainFilter === null) {
      return analyzedQuestions;
    }
    return analyzedQuestions.filter(q => (q.domains || []).includes(practiceDomainFilter!));
  }, [analyzedQuestions, practiceDomainFilter, practiceSkillFilter]);

  const canGenerateStudyPlan = useMemo(() => {
    if (!user || !profile.screenerComplete) {
      return false;
    }

    return Boolean(profile.lastFullAssessmentSessionId || profile.fullAssessmentComplete);
  }, [profile.fullAssessmentComplete, profile.lastFullAssessmentSessionId, profile.screenerComplete, user]);

  useEffect(() => {
    if (!user) {
      setStudyPlan(null);
      setStudyPlanError(null);
      setStudyPlanLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStudyPlan = async () => {
      setStudyPlanLoading(true);
      setStudyPlanError(null);

      try {
        const latestPlan = await getLatestStudyPlan(user.id);
        if (!isCancelled) {
          setStudyPlan(latestPlan);
          setStudyPlanError(null);
        }
      } catch (error) {
        console.error('[StudyPlan] Failed to load latest study plan:', error);
        if (!isCancelled) {
          setStudyPlanError('Unable to load your saved study guide right now. You can regenerate it.');
        }
      } finally {
        if (!isCancelled) {
          setStudyPlanLoading(false);
        }
      }
    };

    loadStudyPlan();

    return () => {
      isCancelled = true;
    };
  }, [user]);
  
  // ============================================
  // HANDLERS
  // ============================================

  const openAdminDashboard = useCallback(() => {
    if (mode !== 'admin') {
      setLastNonAdminMode(mode);
    }
    setMode('admin');
  }, [mode]);

  const returnFromAdmin = useCallback((targetMode?: NonAdminAppMode) => {
    setMode(targetMode ?? lastNonAdminMode);
  }, [lastNonAdminMode]);
  
  const startScreener = useCallback((resumeSession?: AssessmentSession | UserSession) => {
    if (resumeSession && isStoredScreenerSessionType(resumeSession.type)) {
      const isScreenerSession =
        resumeSession.assessmentFlow === 'screener' ||
        isScreenerQuestionCount(resumeSession.questionIds.length);

      if (!isScreenerSession) {
        alert('This archived short-assessment session can no longer be resumed. Start the screener instead.');
        return;
      }

      // Resume from saved session - restore question order
      const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
      const restoredQuestions = resumeSession.questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);
      
      if (restoredQuestions.length === resumeSession.questionIds.length) {
        setScreenerQuestions(restoredQuestions);
        setAssessmentStartTime(resumeSession.startTime);
        setSelectedSessionId((resumeSession as any).sessionId);
        setActiveAssessmentType('screener');
        setMode('screener');
        return;
      }
    }
    
    // Exclude all previously seen assessment questions
    const excludeIds = [
      ...(profile.preAssessmentQuestionIds || []),
      ...(profile.fullAssessmentQuestionIds || []),
      ...(profile.recentPracticeQuestionIds || []),
      ...(profile.screenerItemIds || [])
    ];
    
    const selected = buildScreener(analyzedQuestions, excludeIds);
    
    if (selected.length === 0) {
      alert("Not enough questions available to build a new screener.");
      return;
    }

    const questionIds = selected.map(q => q.id);
    
    // Store selected IDs in Supabase
    updateProfile({
      screenerItemIds: questionIds
    });
    
    // The live short-assessment flow is the screener.
    setScreenerQuestions(selected);
    setAssessmentStartTime(Date.now());
    setActiveAssessmentType('screener');
    setMode('screener');
    
    // Create session for tracking
    if (currentUserName) {
      try {
        const newSession = createUserSession(currentUserName, 'screener-assessment', questionIds, 'screener');
        setSelectedSessionId(newSession.sessionId);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
  }, [analyzedQuestions, profile, updateProfile, currentUserName]);
  
  const startFullAssessment = useCallback((resumeSession?: AssessmentSession | UserSession) => {
    if (resumeSession && resumeSession.type === 'full-assessment') {
      // Resume from saved session - restore question order
      const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
      const restoredQuestions = resumeSession.questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);
      
      if (restoredQuestions.length === resumeSession.questionIds.length) {
        setFullAssessmentQuestions(restoredQuestions);
        setAssessmentStartTime(resumeSession.startTime);
        setSelectedSessionId((resumeSession as any).sessionId);
        setMode('fullassessment');
        return;
      }
    }
    
    // Start new assessment: Full Test (125Q) with Praxis-aligned distribution
    // Use assessment builder to get exactly 125 questions distributed per Praxis percentages
    const excludeIds = [
      ...(profile.screenerItemIds ?? []),
      ...(profile.preAssessmentQuestionIds ?? [])
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
    
    // Create new user session if we have a current user
    if (currentUserName) {
      try {
        const newSession = createUserSession(currentUserName, 'full-assessment', questionIds, 'full');
        setSelectedSessionId(newSession.sessionId);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
    
    setFullAssessmentQuestions(selected);
    setAssessmentStartTime(Date.now());
    setMode('fullassessment');
  }, [analyzedQuestions, currentUserName, profile.preAssessmentQuestionIds, profile.screenerItemIds]);
  
  const handleResumeAssessment = useCallback(() => {
    if (!savedSession) {
      return;
    }

    if (isStoredScreenerSessionType(savedSession.type)) {
      startScreener(savedSession);
    } else if (savedSession.type === 'full-assessment') {
      startFullAssessment(savedSession);
    }
  }, [savedSession, startFullAssessment, startScreener]);

  // Note: User selection is handled by Supabase auth.
  
  const handleDiscardSession = useCallback(() => {
    if (currentUserName && savedSession?.sessionId) {
      deleteUserSession(currentUserName, savedSession.sessionId);
    }
    if (profile.lastSession?.sessionId === savedSession?.sessionId) {
      updateProfile({ lastSession: null });
    }
    clearSession();
    setSelectedSessionId(undefined);
    setMode('home');
  }, [currentUserName, profile.lastSession, savedSession, updateProfile]);
  
  const handleResetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all progress? This will clear all scores, history, and assessments. This cannot be undone.')) {
      resetProgress();
      // Clear all local session storage
      clearSession();
      if (currentUserName) {
        // Clear all session pointers for this user in localStorage
        const listKey = `praxis-user-sessions-list-${currentUserName}`;
        const stored = localStorage.getItem(listKey);
        if (stored) {
          const sessionIds = JSON.parse(stored);
          sessionIds.forEach((id: string) => localStorage.removeItem(`praxis-session-${id}`));
        }
        localStorage.removeItem(listKey);
      }
      setMode('home');
      // Force re-render to show fresh state
      window.location.reload();
    }
  }, [resetProgress, currentUserName]);

  const handleGenerateStudyPlan = useCallback(async () => {
    if (!user) {
      return;
    }

    setStudyPlanGenerating(true);
    setStudyPlanError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const idToken = sessionData.session?.access_token ?? '';

      if (!idToken) {
        // Session has expired — tell the user clearly rather than surfacing a cryptic 401.
        setStudyPlanError('Your session has expired. Please log out and log back in, then try again.');
        return;
      }

      const generatedPlan = await generateStudyPlan({
        userId: user.id,
        idToken,
        skills: fetchedSkills,
        domains: fetchedDomains
      });

      setStudyPlan(generatedPlan);
    } catch (error) {
      console.error('[StudyPlan] Generation failed:', error);
      setStudyPlanError(error instanceof Error ? error.message : 'Study guide generation failed. Please retry.');
    } finally {
      setStudyPlanGenerating(false);
    }
  }, [fetchedDomains, fetchedSkills, user]);
  
  const handleScreenerComplete = useCallback(async (responses: UserResponse[]) => {
    const questionCount = responses.length;
    const correctCount = responses.filter(r => r.isCorrect).length;
    const durationMs = assessmentStartTime > 0 ? Date.now() - assessmentStartTime : 0;
    const questionIds = screenerQuestions.map(q => q.id);
    
    console.log('[ScreenerAssessment] Complete', {
      questionCount,
      correctCount,
      durationMs,
      questionIds: questionIds.length,
      responsesSaved: responses.length
    });
    
    const analysis = detectWeaknesses(responses, analyzedQuestions);
    
    // Save results to Supabase before navigation
    // Note: Responses are already logged to the responses table during assessment
    const updates: any = {
      lastSession: null,
      ...analysis
    };

    if (activeAssessmentType === 'screener') {
      updates.screenerItemIds = questionIds;
      updates.lastScreenerSessionId = selectedSessionId;
      updates.lastScreenerCompletedAt = new Date().toISOString();
      updates.screenerComplete = true;
      updates.screenerResults = {
        domain_scores: Object.fromEntries(
          Object.entries(analysis.domainScores).map(([id, stats]) => [
            id, 
            Math.round((stats.correct / stats.total) * 100)
          ])
        ),
        completed_at: new Date().toISOString()
      };
    }
    
    await updateProfile(updates);
    
    // Clear local session storage on successful completion
    if (currentUserName && selectedSessionId) {
      deleteUserSession(currentUserName, selectedSessionId);
    }
    clearSession();
    setSelectedSessionId(undefined);

    console.log('[ScreenerAssessment] Results saved to Supabase, navigating to score report');
    
    setLastAssessmentResponses(responses);
    setLastAssessmentType('screener');
    setLastAssessmentFlow('screener');
    setMode('score-report');
  }, [activeAssessmentType, analyzedQuestions, currentUserName, updateProfile, assessmentStartTime, screenerQuestions, selectedSessionId]);
  
  const handleFullAssessmentComplete = useCallback(async (responses: UserResponse[]) => {
    const questionCount = responses.length;
    const correctCount = responses.filter(r => r.isCorrect).length;
    const durationMs = assessmentStartTime > 0 ? Date.now() - assessmentStartTime : 0;
    const questionIds = fullAssessmentQuestions.map(q => q.id);
    
    console.log('[FullAssessment] Complete', {
      questionCount,
      correctCount,
      durationMs,
      questionIds: questionIds.length,
      responsesSaved: responses.length
    });
    
    const analysis = detectWeaknesses(responses, analyzedQuestions);
    
    // Save results to Supabase before navigation
    // Note: Responses are already logged to the responses table during assessment
    await updateProfile({
      fullAssessmentComplete: true,
      fullAssessmentQuestionIds: questionIds,
      lastFullAssessmentSessionId: selectedSessionId,
      lastFullAssessmentCompletedAt: new Date().toISOString(),
      lastSession: null,
      ...analysis
    });
    
    // Clear local session storage on successful completion
    if (currentUserName && selectedSessionId) {
      deleteUserSession(currentUserName, selectedSessionId);
    }
    clearSession();
    setSelectedSessionId(undefined);

    console.log('[FullAssessment] Results saved to Supabase, navigating to score report');
    
    setLastAssessmentResponses(responses);
    setLastAssessmentType('full-assessment');
    setLastAssessmentFlow('full');
    setMode('score-report');
  }, [analyzedQuestions, currentUserName, updateProfile, assessmentStartTime, fullAssessmentQuestions, selectedSessionId]);
  
  // Save which skill/domain is being practiced so the home screen card can name it
  const savePracticeContext = useCallback((ctx: { type: 'skill' | 'domain' | 'general'; skillId?: string; domainId?: number }) => {
    setLastPracticeContext(ctx);
    if (user?.id) {
      try { localStorage.setItem(`pmp-practice-context-${user.id}`, JSON.stringify(ctx)); } catch {}
    }
  }, [user?.id]);

  const startPractice = useCallback((domainId?: number) => {
    setPracticeSkillFilter(null);
    setPracticeDomainFilter(domainId || null);
    savePracticeContext(domainId ? { type: 'domain', domainId } : { type: 'general' });
    setMode('practice');
  }, [savePracticeContext]);

  const startSkillPractice = useCallback((skillId: string) => {
    setPracticeDomainFilter(null);
    setPracticeSkillFilter(skillId);
    savePracticeContext({ type: 'skill', skillId });
    setMode('practice');
  }, [savePracticeContext]);

  // Handler to view past assessment reports
  const handleViewReport = useCallback(async (
    assessmentType: 'screener' | 'full-assessment'
  ) => {
    const screenerTime = profile.lastScreenerCompletedAt
      ? new Date(profile.lastScreenerCompletedAt).getTime()
      : (profile.screenerResults?.completed_at ? new Date(profile.screenerResults.completed_at).getTime() : 0);
    const archivedShortAssessmentTime = profile.lastPreAssessmentCompletedAt
      ? new Date(profile.lastPreAssessmentCompletedAt).getTime()
      : 0;
    const isScreener =
      assessmentType === 'screener' &&
      profile.screenerComplete &&
      screenerTime >= archivedShortAssessmentTime;

    const responseTypes: AssessmentReportType[] = assessmentType === 'full-assessment'
      ? ['full']
      : (isScreener ? ['screener'] : ['diagnostic']);

    const sessionId = assessmentType === 'screener'
      ? (isScreener ? profile.lastScreenerSessionId || profile.lastPreAssessmentSessionId : profile.lastPreAssessmentSessionId)
      : profile.lastFullAssessmentSessionId;

    try {
      let questionIds = assessmentType === 'screener'
        ? (isScreener ? profile.screenerItemIds : profile.preAssessmentQuestionIds) || []
        : profile.fullAssessmentQuestionIds || [];

      // Match questions with analyzedQuestions
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
        console.warn(`[handleViewReport] No responses found in Supabase for ${assessmentType}`);
        alert('Unable to load report. Response data not found in database.');
        return;
      }

      if (questionIds.length === 0) {
        questionIds = Array.from(new Set(responses.map(response => response.questionId)));
      }

      const questions = questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);

      if (questions.length === 0) {
        console.error(`[handleViewReport] No matching questions found`);
        alert('Unable to load report. Questions not found.');
        return;
      }

      // Set state for ScoreReport component
      // Reset start time — viewing a past report has no meaningful "time remaining"
      setAssessmentStartTime(0);
      setLastAssessmentResponses(responses);
      setLastAssessmentType(assessmentType);
      setLastAssessmentFlow(
        assessmentType === 'screener'
          ? (isScreenerQuestionCount(questionIds.length) ? 'screener' : 'archived-short-assessment')
          : 'full'
      );

      if (resolvedSessionId && resolvedSessionId !== sessionId) {
        void updateProfile(
          assessmentType === 'screener'
            ? (isScreener
                ? {
                    lastScreenerSessionId: resolvedSessionId,
                    ...(profile.screenerItemIds?.length ? {} : { screenerItemIds: questionIds })
                  }
                : {
                    lastPreAssessmentSessionId: resolvedSessionId,
                    ...(profile.preAssessmentQuestionIds?.length ? {} : { preAssessmentQuestionIds: questionIds })
                  })
            : {
                lastFullAssessmentSessionId: resolvedSessionId,
                ...(profile.fullAssessmentQuestionIds?.length ? {} : { fullAssessmentQuestionIds: questionIds })
              }
        );
      }

      if (assessmentType === 'screener') {
        setScreenerQuestions(questions);
      } else {
        setFullAssessmentQuestions(questions);
      }

      setMode('score-report');
    } catch (error) {
      console.error(`[handleViewReport] Error loading report:`, error);
      alert('An error occurred while loading the report. Please try again.');
    }
  }, [profile, analyzedQuestions, getAssessmentResponses, getLatestAssessmentResponses, updateProfile]);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  

  // ============================================
  // RENDER
  // ============================================
  
  // Show loading while checking auth, loading profile, or fetching content
  if (authLoading || !isLoaded || contentLoading || canonicalLoading || canonicalQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }
  
  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                Praxis Study
              </h1>
              <p className="text-xs text-slate-500">School Psychology 5403</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">User: <span className="text-slate-300">{currentUserName}</span></span>
            {hasReadinessData && mode !== 'home' && (
              <button
                onClick={() => setMode('home')}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Home
              </button>
            )}
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              title="Send feedback"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </button>
            {isAdmin && mode !== 'admin' && (
              <button
                onClick={openAdminDashboard}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
            <button
              onClick={async () => {
                // Clear any local session data
                clearSession();
                // Log out from Supabase
                await logout();
                // Reset local state
                setMode('home');
                setScreenerQuestions([]);
                setFullAssessmentQuestions([]);
                setLastAssessmentResponses([]);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Suspense fallback={
          <div className="min-h-[240px] flex items-center justify-center">
            <div className="text-slate-400">Loading section...</div>
          </div>
        }>
        
        {/* HOME SCREEN */}
        {mode === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 pt-8">
              <h2 className="text-3xl font-bold text-slate-100">
                {hasReadinessData ? 'Welcome Back!' : 'Ready to Study?'}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                {hasReadinessData 
                  ? `You've completed ${profile.totalQuestionsSeen} questions. Let's keep building your knowledge.`
                  : 'Start with the skills screener, then use domain review and the full assessment to build your plan.'}
              </p>
            </div>
            
            {/* Quick Stats (if has history) */}
            {hasReadinessData && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-400">{profile.totalQuestionsSeen}</p>
                  <p className="text-xs text-slate-500">Questions</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-400">{profile.streak}</p>
                  <p className="text-xs text-slate-500">Current Streak</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {progressSummary.skills.filter(s => s.score !== null && s.score < 0.6).length}
                  </p>
                  <p className="text-xs text-slate-500">Skills &lt; 60%</p>
                  <div className="mt-2 flex justify-center gap-3 text-[10px] text-slate-400">
                    <span>Mastered: {progressSummary.skills.filter(s => s.score !== null && s.score >= 0.8).length}</span>
                    <span>In Progress: {progressSummary.skills.filter(s => s.attempted > 0 && (s.score === null || s.score < 0.8)).length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* View Report Buttons */}
            {hasShortAssessmentReport && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <button
                  onClick={() => handleViewReport('screener')}
                  className="w-full flex items-center justify-between p-4 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="font-semibold text-amber-300">
                        {latestShortAssessmentIsScreener ? 'View Screener Report' : 'View Archived Short-Assessment Report'}
                      </p>
                      <p className="text-xs text-amber-200/80">
                        {latestShortAssessmentIsScreener
                          ? 'Review your screener results and study guidance'
                          : 'Review an earlier short-assessment report from before the screener became the active flow'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Beta Feedback</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-100">Keep the reporting flow simple for testers</h3>
                  <p className="mt-2 text-sm text-cyan-50/80">
                    Use the feedback button in the header for feature and workflow notes. On any question, use the warning icon to report issues in the stem, answer choices, key, rationale, or question length.
                  </p>
                </div>
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="rounded-xl bg-cyan-400 px-4 py-2.5 font-medium text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Send beta feedback
                </button>
              </div>
            </div>

            {/* ── Practice: Continue Where You Left Off ── */}
            {profile.lastSession?.mode === 'practice' && (() => {
              const ctx = lastPracticeContext;
              const skillName = ctx?.skillId ? (getSkillById(ctx.skillId)?.name ?? ctx.skillId) : null;
              const domainInfo = ctx?.domainId ? PROGRESS_DOMAINS.find(d => d.id === ctx.domainId) : null;
              const contextLabel = skillName
                ? skillName
                : domainInfo
                  ? `Domain ${domainInfo.id}: ${domainInfo.name}`
                  : 'a practice session';
              return (
                <div className="p-6 bg-blue-500/20 border border-blue-500/30 rounded-2xl space-y-4">
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Continue Where You Left Off</h3>
                    <p className="text-sm text-blue-200/80">
                      Continue working on:{' '}
                      <span className="font-semibold text-blue-100">{contextLabel}</span>
                    </p>
                    {profile.lastSession?.updatedAt && (
                      <p className="text-xs text-blue-300/60 mt-1">
                        Last active: {new Date(profile.lastSession.updatedAt.seconds * 1000 || profile.lastSession.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (ctx?.type === 'skill' && ctx.skillId) {
                          startSkillPractice(ctx.skillId);
                        } else if (ctx?.type === 'domain' && ctx.domainId) {
                          startPractice(ctx.domainId);
                        } else {
                          startPractice();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => {
                        setResultsDefaultView('skill');
                        setMode('results');
                      }}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      Select a New Skill
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Assessment: Continue Where You Left Off ── */}
            {(profile.lastSession?.mode === 'screener' ||
              profile.lastSession?.mode === 'full' ||
              profile.lastSession?.mode === 'diagnostic' ||
              (!profile.lastSession && hasSession && savedSession)) && (
              <div className="p-6 bg-blue-500/20 border border-blue-500/30 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-300 mb-1">Continue Where You Left Off</h3>
                  <p className="text-sm text-blue-200/80">
                    {profile.lastSession ? (
                      <>
                        {profile.lastSession.mode === 'full' && 'Full assessment'}
                        {profile.lastSession.mode === 'screener' && 'Screener'}
                        {profile.lastSession.mode === 'diagnostic' && 'Archived short assessment'}
                        {profile.lastSession.questionIndex > 0 && ` • Question ${profile.lastSession.questionIndex + 1}`}
                      </>
                    ) : savedSession ? (
                      <>
                        {savedSessionLabel} session
                        {savedSession.responses.length > 0 && ` • ${savedSession.responses.length} questions completed`}
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs text-blue-200/70 mt-1">
                    Resume the last assessment you were working on.
                  </p>
                  {profile.lastSession?.updatedAt && (
                    <p className="text-xs text-blue-300/60 mt-1">
                      Last updated: {new Date(profile.lastSession.updatedAt.seconds * 1000 || profile.lastSession.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (profile.lastSession) {
                          const lastSession = profile.lastSession;
                          if (lastSession.mode === 'screener') {
                            const saved = loadUserSession(lastSession.sessionId);
                            if (!saved) {
                              updateProfile({ lastSession: null });
                              alert('That saved screener session is no longer available. Start a new screener from the home screen.');
                              return;
                            }
                            startScreener(saved);
                          } else if (lastSession.mode === 'diagnostic') {
                            const saved = loadUserSession(lastSession.sessionId);
                            if (saved && isStoredScreenerSessionType(saved.type) && (
                              saved.assessmentFlow === 'screener' ||
                              isScreenerQuestionCount(saved.questionIds.length)
                            )) {
                              void updateProfile({ lastSession: { ...lastSession, mode: 'screener' } });
                              startScreener(saved);
                              return;
                            }
                            updateProfile({ lastSession: null });
                            alert('That archived short-assessment session can no longer be resumed. Start a new screener from the home screen.');
                          } else if (lastSession.mode === 'full') {
                            const saved = loadUserSession(lastSession.sessionId);
                            if (!saved) {
                              updateProfile({ lastSession: null });
                              alert('That saved full assessment session is no longer available. Start a new full assessment from the home screen.');
                              return;
                            }
                            startFullAssessment(saved);
                          }
                        } else if (savedSession) {
                          handleResumeAssessment();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => {
                        if (profile.lastSession) updateProfile({ lastSession: null });
                        if (savedSession) handleDiscardSession();
                      }}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    >
                      Start New Attempt
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    Your scores and progress history are not affected.
                  </p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {!savedSession && !profile.lastSession && (
              <div className="space-y-4">
              {!hasReadinessData ? (

                <>
                  {!profile.screenerComplete && (
                    <button
                      onClick={() => startScreener(undefined)}
                      className="w-full p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-lg">Skills Screener (50Q)</p>
                          <p className="text-purple-100 text-sm">50 questions • broad skill coverage</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => startFullAssessment(undefined)}
                    className="w-full p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-lg">Start Full Assessment</p>
                        <p className="text-blue-100 text-sm">125 questions • ~2-3 hours</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              ) : (
                <>
                  {!profile.screenerComplete && (
                    <button
                      onClick={() => startScreener(undefined)}
                      className="w-full p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-lg">Skills Screener (50Q)</p>
                          <p className="text-purple-100 text-sm">50 questions • broad skill coverage</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {!profile.fullAssessmentComplete ? (
                    <button
                      onClick={() => startFullAssessment(undefined)}
                      className="w-full p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-lg">Full Assessment</p>
                          <p className="text-blue-100 text-sm">125 questions • Complete exam simulation</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewReport('full-assessment')}
                      className="w-full p-6 bg-gradient-to-r from-blue-500/50 to-indigo-500/50 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-blue-500/20 transition-all border border-blue-500/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white text-lg">View Full Assessment Report</p>
                          <p className="text-blue-100 text-sm">Review your completed assessment</p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setResultsDefaultView('domain');
                      setMode('results');
                    }}
                    className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-slate-300" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-200">View Progress</p>
                        <p className="text-slate-500 text-sm">See your domain and skill progress</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
            )}
            


            <StudyPlanCard
              plan={studyPlan}
              isGenerating={studyPlanGenerating}
              isLoading={studyPlanLoading}
              error={studyPlanError}
              canGenerate={canGenerateStudyPlan}
              onGenerate={handleGenerateStudyPlan}
            />
            
            {/* Study Modes Section — Domain Review + Skill Review with unlock gating */}
            <div className="pt-8 border-t border-slate-800">
              <StudyModesSection
                profile={profile}
                onDomainSelect={(domainId) => startPractice(domainId)}
                onSkillReviewOpen={() => {
                  setResultsDefaultView('skill');
                  setMode('results');
                }}
              />
            </div>
            

          </div>
        )}
        
        {/* SCREENER MODE */}
        {mode === 'screener' && screenerQuestions.length > 0 && (
          <ScreenerAssessment
            questions={screenerQuestions}
            onComplete={handleScreenerComplete}
            showTimer={true}
            sessionId={selectedSessionId}
            currentUserName={currentUserName}
            logResponse={logResponse}
            saveScreenerResponse={saveScreenerResponse}
            updateSkillProgress={updateSkillProgress}
            updateLastSession={updateLastSession}
          />
        )}
        
        {/* FULL ASSESSMENT MODE */}
        {mode === 'fullassessment' && fullAssessmentQuestions.length > 0 && (
          <FullAssessment
            questions={fullAssessmentQuestions}
            onComplete={handleFullAssessmentComplete}
            showTimer={true}
            sessionId={selectedSessionId}
            currentUserName={currentUserName}
            logResponse={logResponse}
            updateSkillProgress={updateSkillProgress}
            updateLastSession={updateLastSession}
          />
        )}
        
        {/* SCORE REPORT / SCREENER RESULTS MODE */}
        {mode === 'score-report' && (
          <ErrorBoundary>
            {lastAssessmentResponses.length > 0 ? (
              lastAssessmentType === 'screener' ? (
                <ScreenerResults
                  responses={lastAssessmentResponses}
                  questions={screenerQuestions}
                  flow={lastAssessmentFlow === 'archived-short-assessment' ? 'archived-short-assessment' : 'screener'}
                  onStartPractice={startPractice}
                  onTakeFullAssessment={() => startFullAssessment(undefined)}
                  onGoHome={() => setMode('home')}
                />
              ) : (
                <ScoreReport
                  responses={lastAssessmentResponses}
                  questions={fullAssessmentQuestions}
                  totalTime={assessmentStartTime > 0 ? Math.floor((Date.now() - assessmentStartTime) / 1000) : 0}
                  onStartPractice={startPractice}
                  onRetakeAssessment={() => {
                    // After the user completes both assessments, do not allow any retake path.
                    if (profile.screenerComplete && profile.fullAssessmentComplete) return;
                    startFullAssessment(undefined);
                  }}
                  onGoHome={() => setMode('home')}
                />
              )
            ) : (
              <div className="space-y-8">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-100">Results Missing or Corrupted</h2>
                    <p className="text-slate-400">
                      We couldn't find your assessment results. Please start a new assessment.
                    </p>
                  </div>
                  <button
                    onClick={() => setMode('home')}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            )}
          </ErrorBoundary>
        )}
        
        {/* PRACTICE MODE */}
        {mode === 'practice' && (
          <PracticeSession
            userProfile={profile}
            updateSkillProgress={updateSkillProgress}
            logResponse={logResponse}
            updateLastSession={updateLastSession}
            savePracticeResponse={savePracticeResponse}
            analyzedQuestions={practiceQuestions}
            selectNextQuestion={selectNextQuestion}
            practiceDomain={practiceDomainFilter}
            practiceSkillId={practiceSkillFilter}
            onExitPractice={() => {
              const wasSkillPractice = Boolean(practiceSkillFilter);
              setPracticeDomainFilter(null);
              setPracticeSkillFilter(null);
              if (wasSkillPractice) {
                // Return to the skills tab in Results so the user can pick another skill
                setResultsDefaultView('skill');
                setMode('results');
              } else {
                setMode('home');
              }
            }}
          />
        )}
        
        {/* TEACH MODE */}
        {ACTIVE_LAUNCH_FEATURES.teachMode && mode === 'teach' && (
          <TeachMode
            userProfile={profile}
            analyzedQuestions={analyzedQuestions}
            onUpdateProfile={updateProfile}
            selectedDomains={teachModeDomains}
          />
        )}
        
        {/* RESULTS SCREEN */}
        {mode === 'results' && (
          <ResultsDashboard
            userProfile={profile}
            skills={fetchedSkills}
            onStartPractice={startPractice}
            onStartSkillPractice={startSkillPractice}
            fullAssessmentUnlocked={Boolean(profile.fullAssessmentComplete)}
            onRetakeAssessment={() => {
              // After the user completes both assessments, do not allow any retake path.
              if (profile.screenerComplete && profile.fullAssessmentComplete) return;
              startScreener(undefined);
            }}
            onResetProgress={handleResetProgress}
            defaultView={resultsDefaultView}
          />
        )}
        
        {/* ADMIN DASHBOARD */}
        {mode === 'admin' && (
          <AdminDashboard
            onExit={() => returnFromAdmin()}
            returnLabel={lastNonAdminMode === 'home' ? 'Return to site' : `Back to ${lastNonAdminMode}`}
            onGoHome={() => returnFromAdmin('home')}
            onStartPractice={() => startPractice()}
            onGoTeach={() => {
              if (ACTIVE_LAUNCH_FEATURES.teachMode) {
                setMode('teach');
              }
            }}
          />
        )}
        </Suspense>
      </main>
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}

// Wrap app with AuthProvider
export default function PraxisStudyApp() {
  return (
    <AuthProvider>
      <PraxisStudyAppContent />
    </AuthProvider>
  );
}
