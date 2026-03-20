import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronRight, AlertTriangle, Zap, BarChart3, LogOut, Shield, MessageSquare, Flame, BookOpen, CheckCircle, Lock, Sparkles, Crosshair } from 'lucide-react';
import { useDailyStudyTime, formatStudyTime } from './src/hooks/useDailyStudyTime';
import { useDailyQuestionCount, DAILY_GOAL } from './src/hooks/useDailyQuestionCount';

// Import questions and analysis
import { analyzeQuestion, AnalyzedQuestion } from './src/brain/question-analyzer';
import { detectWeaknesses, UserResponse } from './src/brain/weakness-detector';

// Import components
const DailyGoalBar = lazy(() => import('./src/components/DailyGoalBar'));
const StudyModesSection = lazy(() => import('./src/components/StudyModesSection'));
import { ErrorBoundary } from './src/components/ErrorBoundary';
const FeedbackModal = lazy(() => import('./src/components/FeedbackModal'));
const ResultsDashboard = lazy(() => import('./src/components/ResultsDashboard'));
const ScreenerAssessment = lazy(() => import('./src/components/ScreenerAssessment'));
const FullAssessment = lazy(() => import('./src/components/FullAssessment'));
const ScoreReport = lazy(() => import('./src/components/ScoreReport'));
const ScreenerResults = lazy(() => import('./src/components/ScreenerResults'));
const PracticeSession = lazy(() => import('./src/components/PracticeSession'));
const LearningPathModulePage = lazy(() => import('./src/components/LearningPathModulePage'));
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
import type { UserProfileData } from './src/components/OnboardingFlow';
import { buildFullAssessment, buildScreener } from './src/utils/assessment-builder';
import {
  isScreenerQuestionCount
} from './src/utils/assessmentConstants';
import { getSkillById } from './src/brain/skill-map';
import { PROGRESS_DOMAINS } from './src/utils/progressTaxonomy';

import { StudyConstraints, StudyPlanHistoryEntry, generateStudyPlan, getStudyPlanHistory } from './src/services/studyPlanService';
import { supabase } from './src/config/supabase';
import { isAdminEmail } from './src/config/admin';
import { clearLegacyClientDataOnce } from './src/utils/legacyClientData';
import type { AssessmentReportType } from './src/types/assessment';
import { ACTIVE_LAUNCH_FEATURES } from './src/utils/launchConfig';
import { buildProgressSummary } from './src/utils/progressSummaries';
const LoginScreen = lazy(() => import('./src/components/LoginScreen'));
const OnboardingFlow = lazy(() => import('./src/components/OnboardingFlow'));

const CANONICAL_QUESTION_BANK_URL = new URL('./src/data/questions.json', import.meta.url).href;

// ============================================
// TYPE DEFINITIONS
// ============================================

// ============================================
// MAIN APP COMPONENT
// ============================================

function PraxisStudyAppContent() {
  type AppMode = 'home' | 'screener' | 'fullassessment' | 'results' | 'score-report' | 'practice' | 'practice-hub' | 'review' | 'teach' | 'admin' | 'study-guide' | 'learning-path-module';
  type NonAdminAppMode = Exclude<AppMode, 'admin'>;

  // Use hooks for profile and adaptive learning
  const { user, loading: authLoading, logout } = useAuth();
  const { questions: fetchedQuestions, isLoading: contentLoading, domains: fetchedDomains, skills: fetchedSkills } = useContent();
  const { profile, updateProfile, saveOnboardingData, updateSkillProgress, resetProgress, logResponse, updateLastSession, getAssessmentResponses, getLatestAssessmentResponses, savePracticeResponse, saveScreenerResponse, isLoaded } = useFirebaseProgress();
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
    const controller = new AbortController();

    fetch(CANONICAL_QUESTION_BANK_URL, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Failed to load question bank (${response.status})`);
        }
        return response.json() as Promise<any[]>;
      })
      .then(loadedQuestions => {
        if (!active) return;
        setCanonicalQuestions(loadedQuestions);
      })
      .catch(error => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('[QuestionBank] Failed to load canonical question bank:', error);
      })
      .finally(() => {
        if (active) {
          setCanonicalLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
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
  const [studyPlanHistory, setStudyPlanHistory] = useState<StudyPlanHistoryEntry[]>([]);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [studyPlanGenerating, setStudyPlanGenerating] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSpicyMode, setIsSpicyMode] = useState(false);
  /** SkillId currently open in the Learning Path module page */
  const [learningPathSkillId, setLearningPathSkillId] = useState<string | null>(null);

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

  // Count questions retired from practice (stored in localStorage per user).
  // Recomputed each time the user navigates to the home screen.

  const isAdmin = isAdminEmail(user?.email);

  // ── Interactive dashboard hooks ──────────────────────────────────────────────
  const dailyStudySeconds = useDailyStudyTime(user?.id);
  const dailyQuestionCount = useDailyQuestionCount(user?.id);

  // Build 7-day activity data from localStorage daily keys for RecentActivityFeed
  const recentActivityDays = useMemo(() => {
    if (!user?.id) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      try {
        const q = parseInt(localStorage.getItem(`pmp-daily-q-${user.id}-${ymd}`) ?? '0', 10) || 0;
        const s = parseInt(localStorage.getItem(`pmp-daily-time-${user.id}-${ymd}`) ?? '0', 10) || 0;
        return { date: ymd, questions: q, seconds: s };
      } catch { return { date: ymd, questions: 0, seconds: 0 }; }
    });
  // Recompute when mode changes so returning from practice updates the feed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mode]);

  const weeklyAvgSeconds = useMemo(() => {
    const weeklyTotalSeconds = recentActivityDays.reduce((s, d) => s + d.seconds, 0);
    const activeDaysThisWeek = recentActivityDays.filter(d => d.seconds > 0).length;
    return activeDaysThisWeek > 0 ? Math.round(weeklyTotalSeconds / activeDaysThisWeek) : 0;
  }, [recentActivityDays]);

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
      setStudyPlanHistory([]);
      setStudyPlanError(null);
      setStudyPlanLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStudyPlan = async () => {
      setStudyPlanLoading(true);
      setStudyPlanError(null);

      try {
        const history = await getStudyPlanHistory(user.id);
        if (!isCancelled) {
          setStudyPlanHistory(history);
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

  const handleGenerateStudyPlan = useCallback(async (constraints?: StudyConstraints) => {
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
        domains: fetchedDomains,
        studyConstraints: constraints,
      });

      // Reload full history so the new plan appears at the top of the list
      const updatedHistory = await getStudyPlanHistory(user.id);
      setStudyPlanHistory(updatedHistory.length > 0 ? updatedHistory : [{ id: 'new', createdAt: generatedPlan.generatedAt, plan: generatedPlan }]);
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

  const startSpicyPractice = useCallback(() => {
    setPracticeDomainFilter(null);
    setPracticeSkillFilter(null);
    savePracticeContext({ type: 'general' });
    setIsSpicyMode(true);
    setMode('practice');
  }, [savePracticeContext]);

  const openLearningPathModule = useCallback((skillId: string) => {
    setLearningPathSkillId(skillId);
    setMode('learning-path-module');
  }, []);

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
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan animate-pulse">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show login screen if not authenticated
  if (!user) {
    return (
      <Suspense fallback={null}>
        <LoginScreen />
      </Suspense>
    );
  }

  // Show onboarding flow for new users who haven't completed profile setup
  if (!profile.onboardingComplete) {
    const handleOnboardingComplete = async (data: UserProfileData) => {
      await saveOnboardingData({
        account_role: data.account_role || undefined,
        full_name: data.full_name || undefined,
        preferred_display_name: data.preferred_display_name || undefined,
        university: data.university || undefined,
        program_type: data.program_type || undefined,
        program_state: data.program_state || undefined,
        delivery_mode: data.delivery_mode || undefined,
        training_stage: data.training_stage || undefined,
        certification_state: data.certification_state || undefined,
        current_role: data.current_role || undefined,
        certification_route: data.certification_route || undefined,
        primary_exam: data.primary_exam || undefined,
        planned_test_date: data.planned_test_date || undefined,
        retake_status: data.retake_status || undefined,
        number_of_prior_attempts: data.number_of_prior_attempts ? parseInt(data.number_of_prior_attempts, 10) : null,
        target_score: data.target_score ? parseInt(data.target_score, 10) : null,
        study_goals: data.study_goals,
        weekly_study_hours: data.weekly_study_hours || undefined,
        biggest_challenge: data.biggest_challenge,
        used_other_resources: data.used_other_resources ?? null,
        other_resources_list: data.other_resources_list,
        what_was_missing: data.what_was_missing || undefined,
      });
    };

    const handleOnboardingSkip = async () => {
      await saveOnboardingData({});
    };

    return (
      <Suspense fallback={null}>
        <OnboardingFlow
          displayName={currentUserName}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </Suspense>
    );
  }

  const firstName = currentUserName?.split(' ')[0] || null;

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="border-b border-slate-800/40 bg-navy-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 leading-tight">Praxis Study</h1>
              <p className="text-[10px] text-slate-600 leading-tight">School Psychology 5403</p>
            </div>
          </div>

          <nav className="flex items-center gap-0.5">
            {/* Primary tabs */}
            {(() => {
              const isActivePractice = mode === 'practice' || mode === 'practice-hub' || mode === 'learning-path-module';
              type NavTab = { label: string; icon: React.ReactNode; onClick: () => void; active: boolean; show: boolean };
              const tabs: NavTab[] = [
                {
                  label: 'Dashboard',
                  icon: <Brain className="w-3.5 h-3.5" />,
                  onClick: () => setMode('home'),
                  active: mode === 'home',
                  show: true,
                },
                {
                  label: 'Practice',
                  icon: <Zap className="w-3.5 h-3.5" />,
                  onClick: () => setMode('practice-hub'),
                  active: isActivePractice,
                  show: true,
                },
                {
                  label: 'Progress',
                  icon: <BarChart3 className="w-3.5 h-3.5" />,
                  onClick: () => setMode('results'),
                  active: mode === 'results',
                  show: Boolean(hasReadinessData),
                },
                {
                  label: 'Study Plan',
                  icon: <BookOpen className="w-3.5 h-3.5" />,
                  onClick: () => setMode('study-guide'),
                  active: mode === 'study-guide',
                  show: true,
                },
              ];
              return tabs.filter(t => t.show).map(tab => (
                <button
                  key={tab.label}
                  onClick={tab.onClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    tab.active
                      ? 'text-cyan-400 bg-slate-800/70 font-medium'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ));
            })()}

            <div className="w-px h-4 bg-slate-800 mx-1.5" />

            {/* Utility actions */}
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-400 rounded-lg transition-colors"
              title="Send feedback"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            {isAdmin && mode !== 'admin' && (
              <button
                onClick={openAdminDashboard}
                className="p-1.5 text-slate-600 hover:text-amber-400 rounded-lg transition-colors"
                title="Admin"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={async () => {
                clearSession();
                await logout();
                setMode('home');
                setScreenerQuestions([]);
                setFullAssessmentQuestions([]);
                setLastAssessmentResponses([]);
              }}
              className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Suspense fallback={
          <div className="min-h-[240px] flex items-center justify-center">
            <div className="text-slate-400">Loading section...</div>
          </div>
        }>
        
        {/* HOME SCREEN */}
        {mode === 'home' && (() => {
          // ── Derived state ────────────────────────────────────────────────────
          const isNewUser = !hasCompletedScreener && !profile.fullAssessmentComplete;
          const isScreenerDone = hasCompletedScreener && !profile.fullAssessmentComplete;
          const isFullyUnlocked = Boolean(profile.fullAssessmentComplete);

          // Stats for State 3
          const totalSkills = progressSummary.skills.length;
          const masteredSkills = progressSummary.skills.filter(s => s.score !== null && s.score >= 0.7).length;
          const readinessTarget = Math.ceil(totalSkills * 0.7);
          const skillsToReadiness = Math.max(0, readinessTarget - masteredSkills);

          // Top 5 developing skills (worst-performing with ≥1 attempt)
          const top5Target = Object.entries(profile.skillScores)
            .filter(([, p]) => p.attempts >= 1 && p.score < 0.7)
            .sort((a, b) => a[1].score - b[1].score)
            .slice(0, 5);

          // Days until weekly stats reset (next Monday)
          const _todayDay = new Date().getDay();
          const daysUntilReset = _todayDay === 1 ? 7 : (8 - _todayDay) % 7;

          // Session resume helper (used in all states)
          const sessionResumeCard = (() => {
            const hasAssessmentInProgress =
              profile.lastSession?.mode === 'screener' ||
              profile.lastSession?.mode === 'full' ||
              profile.lastSession?.mode === 'diagnostic' ||
              (!profile.lastSession && hasSession && savedSession);
            const hasPracticeInProgress = profile.lastSession?.mode === 'practice';
            if (!hasAssessmentInProgress && !hasPracticeInProgress) return null;

            if (hasPracticeInProgress) {
              const ctx = lastPracticeContext;
              const skillName = ctx?.skillId ? (getSkillById(ctx.skillId)?.name ?? ctx.skillId) : null;
              const domainInfo = ctx?.domainId ? PROGRESS_DOMAINS.find(d => d.id === ctx.domainId) : null;
              const contextLabel = skillName ?? (domainInfo ? `Domain ${domainInfo.id}: ${domainInfo.name}` : 'practice session');
              return (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-300">Practice in progress</p>
                    <p className="text-xs text-blue-200/60 mt-0.5 truncate">{contextLabel}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (ctx?.type === 'skill' && ctx.skillId) startSkillPractice(ctx.skillId);
                        else if (ctx?.type === 'domain' && ctx.domainId) startPractice(ctx.domainId);
                        else startPractice();
                      }}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >Resume</button>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-300">
                    {profile.lastSession?.mode === 'full' ? 'Full diagnostic' : 'Screener'} in progress
                  </p>
                  <p className="text-xs text-blue-200/60 mt-0.5">
                    {profile.lastSession?.questionIndex != null && profile.lastSession.questionIndex > 0
                      ? `Question ${profile.lastSession.questionIndex + 1} · ` : ''}
                    Resume where you left off
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (profile.lastSession) {
                        const ls = profile.lastSession;
                        if (ls.mode === 'screener') {
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
                      } else if (savedSession) { handleResumeAssessment(); }
                    }}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >Resume</button>
                  <button
                    onClick={() => {
                      if (profile.lastSession) updateProfile({ lastSession: null });
                      if (savedSession) handleDiscardSession();
                    }}
                    className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-400 rounded-lg text-sm transition-colors"
                  >Discard</button>
                </div>
              </div>
            );
          })();

          // True when an in-progress screener (or diagnostic-type) session exists.
          // Used to suppress the "Take the screener" CTA while the resume card is shown.
          const screenerSessionInProgress =
            profile.lastSession?.mode === 'screener' ||
            profile.lastSession?.mode === 'diagnostic' ||
            (!profile.lastSession && hasSession && savedSession && isStoredScreenerSessionType((savedSession as any).type));

          // True when an in-progress full assessment session exists.
          // Used to suppress the "Take the full diagnostic" CTA while the resume card is shown.
          const fullAssessmentSessionInProgress =
            profile.lastSession?.mode === 'full' ||
            (!profile.lastSession && hasSession && savedSession && (savedSession as any).type === 'full-assessment');

          // ── Feeling Spicy card (shared across states 1 & 2) ─────────────────
          const spicyCard = (
            <div className="p-5 bg-navy-800/60 border border-navy-600/40 rounded-2xl">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl leading-none mt-0.5">🌶</span>
                <div>
                  <p className="font-semibold text-slate-200 text-sm">Feeling spicy?</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Jump straight into questions. Each spicy session cycles through one question per skill — all 45 skills in sequence — giving you broad exposure without repeating a skill until every one has been covered. Your responses still count toward your skill data and feed precision into your AI Study Plan.
                  </p>
                </div>
              </div>
              <button
                onClick={startSpicyPractice}
                className="w-full px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 text-rose-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Let's go →
              </button>
            </div>
          );

          return (
            <div className="space-y-8 pb-16">

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* STATE 1: NEW USER                                              */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {isNewUser && (
                <>
                  {/* Hero */}
                  <div className="pt-4">
                    <p className="overline mb-1.5">Dashboard</p>
                    <h2 className="text-3xl font-bold text-slate-50 leading-tight">Welcome to Praxis Study</h2>
                    <p className="text-slate-400 mt-2 max-w-lg leading-relaxed">
                      Two steps to unlock your personalized experience. Start with the screener to get your baseline, then complete the full diagnostic to unlock everything.
                    </p>
                  </div>

                  {/* Session in progress (if they started something) */}
                  {sessionResumeCard}

                  {/* Two-step unlock card */}
                  <div className="border border-navy-600/50 rounded-2xl overflow-hidden">
                    {/* Step 1 — Primary CTA */}
                    <div className="p-6 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border-b border-navy-600/40">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-violet-300">1</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-100">Complete the screener</p>
                          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                            50 questions across all four Praxis sections. Gets you a quick baseline and unlocks domain-based practice so you can start drilling by subject area.
                          </p>
                          {!screenerSessionInProgress && (
                            <button
                              onClick={() => startScreener(undefined)}
                              className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
                            >
                              <Zap className="w-4 h-4" />
                              Take the screener
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 — Locked */}
                    <div className="p-6 bg-navy-800/40 opacity-60">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-700/60 border border-slate-600/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-400">Complete the full diagnostic</p>
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                            Unlocks: Practice by Skill, personalized AI Study Plan, and a custom learning path built around your still-developing areas.
                          </p>
                          <p className="text-xs text-slate-600 mt-2">Complete Step 1 first</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI study guide teaser */}
                  <div className="p-5 bg-navy-800/40 border border-cyan-500/10 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-cyan-300">Unlock personalized study guidance</p>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Complete the screener and full diagnostic to unlock a personalized study plan, targeted practice, and a custom learning path based on your developing areas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feeling spicy */}
                  {spicyCard}
                </>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* STATE 2: SCREENER DONE, AWAITING FULL DIAGNOSTIC               */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {isScreenerDone && (
                <>
                  {/* Hero */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="overline mb-1.5">Dashboard</p>
                      <h2 className="text-3xl font-bold text-slate-50 leading-tight">
                        {firstName ? `Nice work, ${firstName}.` : 'Screener complete.'}
                      </h2>
                      <p className="text-slate-400 mt-2 max-w-md leading-relaxed">
                        One more step to unlock the full personalized experience.
                      </p>
                    </div>
                    {(profile.streak ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full self-start shrink-0">
                        <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">{profile.streak} streak</span>
                      </div>
                    )}
                  </div>

                  {/* Session in progress */}
                  {sessionResumeCard}

                  {/* Two-step card — Step 1 done */}
                  <div className="border border-navy-600/50 rounded-2xl overflow-hidden">
                    {/* Step 1 — Complete */}
                    <div className="px-6 py-4 bg-emerald-500/5 border-b border-navy-600/40 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">Step 1 — Screener complete</p>
                        <p className="text-xs text-slate-500 mt-0.5">Domain-based practice is now active. Head to Practice to drill by subject.</p>
                      </div>
                    </div>

                    {/* Step 2 — Primary CTA */}
                    <div className="p-6 bg-gradient-to-br from-blue-600/20 to-indigo-600/10">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-blue-300">2</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-100">Take the full diagnostic</p>
                          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                            Unlocks everything: Practice by Skill, your personalized AI Study Plan, and a custom learning path built around the skills you are still developing — not the ones you already have down.
                          </p>
                          <ul className="mt-3 space-y-1">
                            {['Practice by Skill', 'Personalized AI Study Plan', 'Custom learning path for developing areas'].map(item => (
                              <li key={item} className="flex items-center gap-2 text-xs text-blue-200/70">
                                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          {!fullAssessmentSessionInProgress && (
                            <button
                              onClick={() => startFullAssessment(undefined)}
                              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
                            >
                              <BarChart3 className="w-4 h-4" />
                              Take the full diagnostic
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI study guide unlock message */}
                  <div className="p-5 bg-cyan-500/5 border border-cyan-500/15 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-cyan-300">Unlock your personalized study guide</p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          Take the full diagnostic to unlock targeted practice, your highest-priority focus areas, and a customized study path based on the skills you are still developing.
                          You can also customize your plan around how many weeks you have until the exam and how much daily study time you want to commit.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feeling spicy */}
                  {spicyCard}
                </>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* STATE 3: FULL DIAGNOSTIC COMPLETE — REAL DASHBOARD             */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {isFullyUnlocked && (
                <>
                  {/* Hero */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="overline mb-1.5">Dashboard</p>
                      <h2 className="text-3xl font-bold text-slate-50 leading-tight">
                        {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
                      </h2>
                    </div>
                    {(profile.streak ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full self-start shrink-0">
                        <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">{profile.streak} streak</span>
                      </div>
                    )}
                  </div>

                  {/* Session resume */}
                  {sessionResumeCard}

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Questions completed', value: profile.totalQuestionsSeen ?? 0, color: 'text-cyan-400', desc: 'Total responses' },
                      { label: 'Skills till readiness', value: skillsToReadiness, color: 'text-rose-400', desc: `${masteredSkills}/${readinessTarget} skills mastered` },
                      { label: 'Avg time this week', value: weeklyAvgSeconds > 0 ? formatStudyTime(weeklyAvgSeconds) : '—', color: 'text-violet-400', desc: `Resets in ${daysUntilReset} day${daysUntilReset === 1 ? '' : 's'}` },
                      { label: 'Daily goal', value: `${dailyQuestionCount}/${DAILY_GOAL}`, color: dailyQuestionCount >= DAILY_GOAL ? 'text-emerald-400' : 'text-amber-400', desc: 'Questions today' },
                    ].map(stat => (
                      <div key={stat.label} className="p-4 bg-navy-800/70 border border-navy-600/40 rounded-2xl">
                        <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs font-semibold text-slate-300 mt-1 leading-tight">{stat.label}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{stat.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Daily goal bar */}
                  <DailyGoalBar count={dailyQuestionCount} studySeconds={dailyStudySeconds} />

                  {/* Personalized Focus */}
                  {top5Target.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-slate-500" />
                        <p className="overline">Personalized focus</p>
                      </div>
                      <div className="space-y-2">
                        {top5Target.map(([skillId, perf]) => {
                          const skill = getSkillById(skillId as any);
                          const pct = Math.round(perf.score * 100);
                          return (
                            <div key={skillId} className="flex items-center justify-between gap-3 p-3.5 bg-navy-800/60 border border-navy-600/40 rounded-xl">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-200 truncate">{skill?.name ?? skillId}</p>
                                <p className={`text-xs mt-0.5 font-medium tabular-nums ${pct < 60 ? 'text-rose-400' : pct < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {pct}% accuracy
                                </p>
                              </div>
                              <button
                                onClick={() => startSkillPractice(skillId as any)}
                                className="shrink-0 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Practice
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Study plan CTA or compact card */}
                  {canGenerateStudyPlan && studyPlanHistory.length === 0 && !studyPlanLoading && (
                    <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl">
                      <div className="flex items-start gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-100">Generate your personalized study plan</p>
                          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                            We will identify your highest-priority developing skills, organize a custom study path, and unlock targeted mini lessons based on your results. Your plan is built around the skills you are still developing — as you master them, your path updates and new priorities take their place.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleGenerateStudyPlan();
                          setMode('study-guide');
                        }}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold rounded-xl text-sm transition-colors inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate study plan →
                      </button>
                    </div>
                  )}

                  {/* Compact study plan card — plan already exists */}
                  {studyPlanHistory.length > 0 && (() => {
                    const latest = studyPlanHistory[0];
                    const planDate = latest.createdAt
                      ? new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : null;
                    const snapshot = latest.plan?.readinessSnapshot;
                    const level = snapshot?.readinessLevel;
                    const levelColors: Record<string, string> = {
                      developing: 'bg-amber-500/15 text-amber-300',
                      near_mastery: 'bg-cyan-500/15 text-cyan-300',
                      mastered: 'bg-emerald-500/15 text-emerald-300',
                    };
                    const levelBadge = levelColors[level ?? ''] ?? 'bg-slate-700/50 text-slate-400';
                    return (
                      <button
                        onClick={() => setMode('study-guide')}
                        className="w-full text-left p-5 bg-navy-800/60 border border-navy-600/40 hover:border-cyan-500/30 rounded-2xl transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <p className="text-sm font-semibold text-slate-200">AI Study Guide</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {level && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelBadge}`}>
                                {level.replace('_', ' ')}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        {planDate && (
                          <p className="text-[10px] text-slate-600 mb-2">Generated {planDate}</p>
                        )}
                        {top5Target.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {top5Target.map(([skillId]) => {
                              const skill = getSkillById(skillId as any);
                              return (
                                <span key={skillId} className="text-[10px] px-2 py-0.5 bg-navy-700/60 border border-navy-600/40 text-slate-400 rounded-full">
                                  {skill?.name ?? skillId}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-xs text-cyan-500 mt-2.5 font-medium">View full study guide →</p>
                      </button>
                    );
                  })()}

                  {/* Progress link */}
                  {hasShortAssessmentReport && (
                    <button
                      onClick={() => handleViewReport('screener')}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      View your progress →
                    </button>
                  )}
                </>
              )}

            </div>
          );
        })()}
        
        {/* PRACTICE HUB */}
        {mode === 'practice-hub' && (
          <div className="space-y-6 pb-16">
            <div className="pt-4">
              <p className="overline mb-1.5">Practice</p>
              <h2 className="text-3xl font-bold text-slate-50 leading-tight">Choose your focus</h2>
              <p className="text-slate-400 mt-2">Practice by domain, by skill, or follow your personalized learning path.</p>
            </div>
            <StudyModesSection
              profile={profile}
              userId={user?.id ?? null}
              weeklyAvgSeconds={weeklyAvgSeconds}
              totalQuestionsSeen={profile.totalQuestionsSeen}
              onDomainSelect={(domainId) => startPractice(domainId)}
              onStartSkillPractice={(skillId) => startSkillPractice(skillId)}
              onNodeClick={openLearningPathModule}
              onSkillReviewOpen={() => setMode('results')}
              onLearningPathOpen={() => setMode('study-guide')}
              onGenerateStudyPlan={() => {
                handleGenerateStudyPlan();
                setMode('study-guide');
              }}
              onStartSpicyPractice={startSpicyPractice}
              studyPlanExists={studyPlanHistory.length > 0}
            />
          </div>
        )}

        {/* LEARNING PATH MODULE PAGE */}
        {mode === 'learning-path-module' && learningPathSkillId && (
          <div className="space-y-6 pb-16">
            <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-400 text-sm">Loading module…</div>}>
              <LearningPathModulePage
                skillId={learningPathSkillId}
                userId={user?.id ?? null}
                profile={profile}
                analyzedQuestions={analyzedQuestions}
                onSkillProgressUpdate={(skillId, isCorrect) => {
                  updateSkillProgress(skillId as any, isCorrect, 'medium');
                }}
                onBack={() => {
                  setLearningPathSkillId(null);
                  setMode('practice-hub');
                }}
              />
            </Suspense>
          </div>
        )}

        {/* STUDY GUIDE PAGE */}
        {mode === 'study-guide' && (
          <div className="space-y-6 pb-16">
            <div className="pt-4">
              <p className="overline mb-1.5">Study Plan</p>
              <h2 className="text-3xl font-bold text-slate-50 leading-tight">AI Study Guide</h2>
            </div>
            <Suspense fallback={<div className="text-slate-500 text-sm">Loading study guide...</div>}>
              <StudyPlanCard
                history={studyPlanHistory}
                isGenerating={studyPlanGenerating}
                isLoading={studyPlanLoading}
                error={studyPlanError}
                canGenerate={canGenerateStudyPlan}
                onGenerate={handleGenerateStudyPlan}
              />
            </Suspense>
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
            hideSummary={isSpicyMode && !profile.fullAssessmentComplete}
            spicyCycleMode={isSpicyMode}
            onExitPractice={() => {
              const wasSkillPractice = Boolean(practiceSkillFilter);
              const wasSpicy = isSpicyMode;
              setPracticeDomainFilter(null);
              setPracticeSkillFilter(null);
              setIsSpicyMode(false);
              if (wasSkillPractice) {
                setMode('results');
              } else if (wasSpicy) {
                setMode('home');
              } else {
                setMode('practice-hub');
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
            hasScreenerReport={hasShortAssessmentReport}
            onViewScreenerReport={() => handleViewReport('screener')}
            onRetakeAssessment={() => {
              // After the user completes both assessments, do not allow any retake path.
              if (profile.screenerComplete && profile.fullAssessmentComplete) return;
              startScreener(undefined);
            }}
            onResetProgress={handleResetProgress}
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
      <Suspense fallback={null}>
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      </Suspense>
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
