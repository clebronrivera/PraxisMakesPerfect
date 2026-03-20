import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronRight, AlertTriangle, Zap, BarChart3, LogOut, Shield, MessageSquare, Flame, BookOpen, CheckCircle, Sparkles, Activity, Clock3, Layers, Map as MapIcon, Target } from 'lucide-react';
import { formatStudyTime } from './src/hooks/useDailyStudyTime';
import { useDailyQuestionCount, DAILY_GOAL } from './src/hooks/useDailyQuestionCount';

// Import questions and analysis
import { analyzeQuestion, AnalyzedQuestion } from './src/brain/question-analyzer';
import { detectWeaknesses, UserResponse } from './src/brain/weakness-detector';

// Import components
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
import { PROFICIENCY_META } from './src/utils/skillProficiency';
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

  const weeklyUsageSeconds = useMemo(
    () => recentActivityDays.reduce((total, day) => total + day.seconds, 0),
    [recentActivityDays]
  );

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

  const displayName = profile.preferredDisplayName || profile.fullName || currentUserName || 'there';
  const firstName = displayName?.split(' ')[0] || null;
  const profileRoleLabel = (() => {
    const currentRoleLabels: Record<string, string> = {
      teacher: 'Teacher',
      school_counselor: 'School Counselor',
      psychologist_trainee: 'Psychologist Trainee',
      other: 'Education Professional',
    };
    const accountRoleLabels: Record<string, string> = {
      graduate_student: 'Graduate Student',
      certification_only: 'Certification Route',
      other: 'Other Pathway',
    };
    const trainingStageLabels: Record<string, string> = {
      early_program: 'Early Program',
      mid_program: 'Mid Program',
      approaching_internship: 'Approaching Internship',
      in_internship: 'In Internship',
    };

    return (
      (profile.currentRole && currentRoleLabels[profile.currentRole]) ||
      (profile.accountRole && accountRoleLabels[profile.accountRole]) ||
      (profile.trainingStage && trainingStageLabels[profile.trainingStage]) ||
      null
    );
  })();

  return (
    <div className="editorial-shell flex min-h-screen" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_35%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:bg-[#0f172a] lg:shadow-2xl">
        <div className="p-8">
          <div className="group mb-10 flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 opacity-20 blur-lg transition-opacity group-hover:opacity-60" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold italic tracking-tight text-white">
                Praxis<span className="text-amber-500">.</span>Ai
              </p>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">School Psychology 5403</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {(() => {
              const isActivePractice = mode === 'practice' || mode === 'practice-hub' || mode === 'learning-path-module';
              const tabs = [
                { label: 'Dashboard', icon: <Brain className="w-4 h-4" />, onClick: () => setMode('home'), active: mode === 'home', show: true },
                { label: 'Practice', icon: <Zap className="w-4 h-4" />, onClick: () => setMode('practice-hub'), active: isActivePractice, show: true },
                { label: 'Progress', icon: <BarChart3 className="w-4 h-4" />, onClick: () => setMode('results'), active: mode === 'results', show: Boolean(hasReadinessData) },
                { label: 'Study Plan', icon: <BookOpen className="w-4 h-4" />, onClick: () => setMode('study-guide'), active: mode === 'study-guide', show: true },
              ];
              return tabs.filter(tab => tab.show).map(tab => (
                <button
                  key={tab.label}
                  onClick={tab.onClick}
                  className={`editorial-sidebar-item ${tab.active ? 'editorial-sidebar-item-active' : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ));
            })()}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/5 bg-black/20 p-6">
          <div className="rounded-[1.75rem] border border-white/5 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20">
                <Brain className="h-4 w-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                {profileRoleLabel && (
                  <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-amber-500">{profileRoleLabel}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f7f6f2]/85 backdrop-blur-md">
          <div className="mx-auto max-w-[92rem] px-5 py-3.5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight text-slate-900">Praxis Study</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">School Psychology 5403</p>
                </div>
              </div>

              <div className="hidden md:flex flex-wrap items-center gap-2">
                <span className="editorial-pill">Keep going</span>
                <span className="editorial-pill">One step at a time</span>
                {(profile.streak ?? 0) > 0 && (
                  <span className="editorial-pill">
                    <Flame className="h-3.5 w-3.5" />
                    {profile.streak} day streak
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="editorial-topbar-button"
                  title="Send feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                {isAdmin && mode !== 'admin' && (
                  <button
                    onClick={openAdminDashboard}
                    className="editorial-topbar-button"
                    title="Admin"
                  >
                    <Shield className="w-4 h-4" />
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
                  className="editorial-topbar-button"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {(() => {
                const isActivePractice = mode === 'practice' || mode === 'practice-hub' || mode === 'learning-path-module';
                const tabs = [
                  { label: 'Dashboard', onClick: () => setMode('home'), active: mode === 'home', show: true },
                  { label: 'Practice', onClick: () => setMode('practice-hub'), active: isActivePractice, show: true },
                  { label: 'Progress', onClick: () => setMode('results'), active: mode === 'results', show: Boolean(hasReadinessData) },
                  { label: 'Study Plan', onClick: () => setMode('study-guide'), active: mode === 'study-guide', show: true },
                ];
                return tabs.filter(tab => tab.show).map(tab => (
                  <button
                    key={tab.label}
                    onClick={tab.onClick}
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                      tab.active
                        ? 'bg-amber-500 text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ));
              })()}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[92rem] px-5 py-5 sm:px-8 sm:py-7">
          <Suspense fallback={
            <div className="min-h-[240px] flex items-center justify-center">
              <div className="text-slate-500">Loading section...</div>
            </div>
          }>

          {/* HOME SCREEN */}
          {mode === 'home' && (() => {
            const isNewUser = !hasCompletedScreener && !profile.fullAssessmentComplete;
            const isScreenerDone = hasCompletedScreener && !profile.fullAssessmentComplete;
            const isFullyUnlocked = Boolean(profile.fullAssessmentComplete);

            const totalSkills = progressSummary.skills.length || 45;
            const demonstratingCount = progressSummary.skills.filter(skill => skill.colorState === 'green').length;
            const readinessTarget = Math.ceil(totalSkills * 0.7);
            const skillsToReadiness = Math.max(0, readinessTarget - demonstratingCount);
            const readinessRatio = readinessTarget > 0 ? demonstratingCount / readinessTarget : 0;
            const readinessPhase = readinessRatio >= 1
              ? PROFICIENCY_META.proficient.label
              : readinessRatio >= 0.5
                ? PROFICIENCY_META.approaching.label
                : PROFICIENCY_META.emerging.label;

            const top5Target = Object.entries(profile.skillScores)
              .filter(([, performance]) => performance.attempts >= 1 && performance.score < 0.7)
              .sort((a, b) => a[1].score - b[1].score)
              .slice(0, 5);

            const weakestDomain = progressSummary.weakestDomainId
              ? PROGRESS_DOMAINS.find(domain => domain.id === progressSummary.weakestDomainId) ?? null
              : null;

            const hasAssessmentInProgress =
              profile.lastSession?.mode === 'screener' ||
              profile.lastSession?.mode === 'full' ||
              profile.lastSession?.mode === 'diagnostic' ||
              (!profile.lastSession && hasSession && savedSession);
            const hasPracticeInProgress = profile.lastSession?.mode === 'practice';

            const sessionResumeCard = (() => {
              if (!hasAssessmentInProgress && !hasPracticeInProgress) return null;

              if (hasPracticeInProgress) {
                const ctx = lastPracticeContext;
                const skillName = ctx?.skillId ? (getSkillById(ctx.skillId)?.name ?? ctx.skillId) : null;
                const domainInfo = ctx?.domainId ? PROGRESS_DOMAINS.find(d => d.id === ctx.domainId) : null;
                const contextLabel = skillName ?? (domainInfo ? `Domain ${domainInfo.id}: ${domainInfo.name}` : 'Practice session');
                return (
                  <div className="editorial-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="editorial-overline">Resume</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">Practice in progress</p>
                      <p className="mt-1 text-sm text-slate-500">{contextLabel}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (ctx?.type === 'skill' && ctx.skillId) startSkillPractice(ctx.skillId);
                        else if (ctx?.type === 'domain' && ctx.domainId) startPractice(ctx.domainId);
                        else startPractice();
                      }}
                      className="editorial-button-primary shrink-0"
                    >
                      Resume session
                    </button>
                  </div>
                );
              }

              return (
                <div className="editorial-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="editorial-overline">Resume</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {profile.lastSession?.mode === 'full' ? 'Full diagnostic in progress' : 'Screener in progress'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {profile.lastSession?.questionIndex != null && profile.lastSession.questionIndex > 0
                        ? `Question ${profile.lastSession.questionIndex + 1}. `
                        : ''}
                      Pick up where you left off.
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                        } else if (savedSession) {
                          handleResumeAssessment();
                        }
                      }}
                      className="editorial-button-primary"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => {
                        if (profile.lastSession) updateProfile({ lastSession: null });
                        if (savedSession) handleDiscardSession();
                      }}
                      className="editorial-button-secondary"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              );
            })();

            const screenerSessionInProgress =
              profile.lastSession?.mode === 'screener' ||
              profile.lastSession?.mode === 'diagnostic' ||
              (!profile.lastSession && hasSession && savedSession && isStoredScreenerSessionType((savedSession as any).type));

            const fullAssessmentSessionInProgress =
              profile.lastSession?.mode === 'full' ||
              (!profile.lastSession && hasSession && savedSession && (savedSession as any).type === 'full-assessment');

            const spicyButton = (
              <button
                onClick={startSpicyPractice}
                className="group relative flex flex-col items-center gap-2 rounded-[2.25rem] bg-[#1a1a1a] px-7 py-5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
              >
                <span className="flex items-center gap-2 text-lg italic text-amber-500">I&apos;m Feeling Spicy!</span>
                <span className="text-[11px] font-bold lowercase tracking-normal text-white/80">
                  Jump into a full 45-question cycle
                </span>
                <div className="absolute -right-3 -top-3 rounded-full border-4 border-white bg-amber-500 p-3 shadow-lg animate-bounce">
                  <Flame className="h-4 w-4 fill-white text-white" />
                </div>
              </button>
            );

            return (
              <div className="space-y-8 pb-12">
                {sessionResumeCard}

                {isNewUser && (
                  <>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_21rem]">
                      <div className="editorial-surface p-7 lg:p-8">
                        <p className="editorial-overline">Dashboard</p>
                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">Welcome to Praxis Study</h2>
                        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                          Start with the screener to establish your baseline, then complete the full diagnostic to unlock the full personalized study experience.
                        </p>
                        <div className="mt-7 grid gap-4 md:grid-cols-2">
                          <div className="editorial-surface-soft p-5">
                            <p className="editorial-overline">Step 1</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">Complete the screener</p>
                            <p className="mt-2 text-sm text-slate-500">50 questions across all four Praxis sections to establish your starting point.</p>
                            {!screenerSessionInProgress && (
                              <button onClick={() => startScreener(undefined)} className="editorial-button-primary mt-5">
                                <Zap className="h-4 w-4" />
                                Take the screener
                              </button>
                            )}
                          </div>
                          <div className="editorial-surface-soft p-5 opacity-80">
                            <p className="editorial-overline">Step 2</p>
                            <p className="mt-2 text-lg font-bold text-slate-700">Complete the full diagnostic</p>
                            <p className="mt-2 text-sm text-slate-500">Unlock Practice by Skill, the Study Guide, and your personalized learning path.</p>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Available after the screener</p>
                          </div>
                        </div>
                      </div>
                      <div className="editorial-panel-dark p-6 lg:p-7">
                        <p className="editorial-overline text-slate-500">Quick start</p>
                        <p className="mt-3 text-2xl font-bold tracking-tight text-white">Want extra exposure first?</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-400">
                          Spicy mode cycles one question per skill so you can see the full question bank before generating a bigger plan.
                        </p>
                        <div className="mt-6">{spicyButton}</div>
                      </div>
                    </div>
                  </>
                )}

                {isScreenerDone && (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_21rem]">
                    <div className="editorial-surface p-7 lg:p-8">
                      <p className="editorial-overline">Dashboard</p>
                      <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                        {firstName ? `Nice work, ${firstName}.` : 'Screener complete.'}
                      </h2>
                      <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                        Domain practice is now active. One more step unlocks the full personalized experience.
                      </p>
                      <div className="mt-7 grid gap-4 md:grid-cols-2">
                        <div className="editorial-surface-soft p-5 border-emerald-200 bg-emerald-50/60">
                          <p className="editorial-overline text-emerald-700">Complete</p>
                          <p className="mt-2 text-lg font-bold text-slate-900">Screener finished</p>
                          <p className="mt-2 text-sm text-slate-600">You can already jump into domain-based practice and keep building momentum.</p>
                        </div>
                        <div className="editorial-surface-soft p-5">
                          <p className="editorial-overline">Next step</p>
                          <p className="mt-2 text-lg font-bold text-slate-900">Take the full diagnostic</p>
                          <p className="mt-2 text-sm text-slate-500">Unlock Practice by Skill, your Study Guide, and a custom learning path built around your developing areas.</p>
                          {!fullAssessmentSessionInProgress && (
                            <button onClick={() => startFullAssessment(undefined)} className="editorial-button-primary mt-5">
                              <BarChart3 className="h-4 w-4" />
                              Take the full diagnostic
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="editorial-panel-dark p-6 lg:p-7">
                      <p className="editorial-overline text-slate-500">Optional</p>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-white">Keep calibrating if you want.</p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Another spicy cycle can give you broader exposure while you build toward the full diagnostic.
                      </p>
                      <div className="mt-6">{spicyButton}</div>
                    </div>
                  </div>
                )}

                {isFullyUnlocked && (
                  <>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_21rem]">
                      <div className="editorial-surface p-7 lg:p-8">
                        <p className="editorial-overline">Dashboard</p>
                        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-[2.75rem]">
                          {firstName ? `Greetings, ${firstName}.` : 'Welcome back.'}
                        </h2>
                        <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                          Keep building your skill bank with focused practice. Your Study Guide is there whenever you want a bigger view of what to work on next.
                        </p>
                        <div className="mt-7 grid gap-4 md:grid-cols-2">
                          <div className="editorial-surface-soft p-5">
                            <p className="editorial-overline">Readiness</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">{readinessPhase}</p>
                            <p className="mt-2 text-sm text-slate-500">
                              {skillsToReadiness === 0
                                ? `You have reached the current goal of ${readinessTarget} skills ${PROFICIENCY_META.proficient.label}.`
                                : `${skillsToReadiness} more skills to reach your current goal.`}
                            </p>
                          </div>
                          <div className="editorial-surface-soft p-5">
                            <p className="editorial-overline">Next focus</p>
                            <p className="mt-2 text-lg font-bold text-slate-900">
                              {weakestDomain ? weakestDomain.name : 'Follow your learning path'}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {weakestDomain
                                ? `This is the lowest-performing domain right now, so it is a strong place to keep building.`
                                : 'Choose a skill or domain and keep practicing a little at a time.'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-7 flex flex-wrap gap-3">
                          {spicyButton}
                          {hasShortAssessmentReport && (
                            <button onClick={() => handleViewReport('screener')} className="editorial-button-secondary">
                              View progress
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="editorial-panel-dark p-6 lg:p-7">
                        <div className="flex items-center justify-between">
                          <p className="editorial-overline text-slate-500">Daily goal</p>
                          <span className="text-sm font-black italic text-amber-500">{dailyQuestionCount} / {DAILY_GOAL}</span>
                        </div>
                        <div className="mt-5 editorial-progress-track bg-white/10 border border-white/5 p-0.5 shadow-inner">
                          <div
                            className="editorial-progress-fill"
                            style={{ width: `${Math.min((dailyQuestionCount / DAILY_GOAL) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-5 text-sm leading-relaxed text-slate-400">
                          Keep moving toward today&apos;s question goal while leaving room to read the lesson content and explanations that support it.
                        </p>
                        <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Weekly usage</p>
                          <p className="mt-2 text-sm font-bold text-white">
                            {weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m'} this week
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-400">Stay steady and keep showing up.</p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 border-t border-white/5 pt-8">
                          <button
                            onClick={() => {
                              if (top5Target[0]) openLearningPathModule(top5Target[0][0]);
                              else setMode('practice-hub');
                            }}
                            className="group flex flex-col items-center gap-2 rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-black/20 transition-all hover:bg-amber-50 active:scale-95"
                          >
                            <MapIcon className="mb-1 h-6 w-6 text-amber-600" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Go directly to learning path</span>
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700/60">Pick up your next skill</span>
                          </button>
                          <button
                            onClick={() => {
                              if (weakestDomain) startPractice(weakestDomain.id);
                              else setMode('practice-hub');
                            }}
                            className="flex items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                          >
                            <Layers className="h-4 w-4" />
                            Go directly to domain practice
                          </button>
                          <button
                            onClick={() => {
                              if (top5Target[0]) startSkillPractice(top5Target[0][0]);
                              else setMode('practice-hub');
                            }}
                            className="flex items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                          >
                            <Target className="h-4 w-4" />
                            Go directly to skill practice
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: 'Number of questions answered',
                          value: (profile.totalQuestionsSeen ?? 0).toLocaleString(),
                          supporting: 'Across assessment and practice sessions so far',
                          icon: Activity,
                          accent: 'bg-slate-100 text-slate-800',
                        },
                        {
                          label: 'Readiness phase',
                          value: readinessPhase,
                          supporting: `Working toward ${PROFICIENCY_META.proficient.label}`,
                          icon: Target,
                          accent: 'bg-amber-50 text-amber-700',
                        },
                        {
                          label: 'Skills to reach goal',
                          value: String(skillsToReadiness),
                          supporting: `Goal: ${readinessTarget} skills ${PROFICIENCY_META.proficient.label}`,
                          icon: CheckCircle,
                          accent: 'bg-emerald-50 text-emerald-700',
                        },
                        {
                          label: 'Weekly usage',
                          value: weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m',
                          supporting: 'Keep showing up a little at a time',
                          icon: Clock3,
                          accent: 'bg-blue-50 text-blue-700',
                        },
                      ].map(stat => (
                        <div key={stat.label} className="editorial-stat-card">
                          <div className="flex items-center justify-between">
                            <div className={`rounded-2xl border border-white p-3 shadow-sm ${stat.accent}`}>
                              <stat.icon className="h-5 w-5" />
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                            <p className="text-2xl font-black italic tracking-tighter text-slate-900 sm:text-[1.75rem]">{stat.value}</p>
                            <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-500">{stat.supporting}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_21rem]">
                      <div className="space-y-6">
                        <div className="px-2 sm:px-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">High-Impact Skills</h3>
                            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                          </div>
                          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                            High-impact skills are the lowest-performing skills in your skill bank. These skills change dynamically as you improve. If you want to see a full readout of every skill, go to Progress and expand the domains.
                          </p>
                        </div>

                        <div className="editorial-surface overflow-hidden">
                          {top5Target.length > 0 ? top5Target.map(([skillId]) => {
                            const skill = getSkillById(skillId as any);
                            return (
                              <div
                                key={skillId}
                                className="group flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 transition-all last:border-0 hover:bg-[#fbfaf7]"
                              >
                                <div className="flex items-center gap-6">
                                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition-colors group-hover:border-amber-300">
                                    <span className="text-xs font-black italic tracking-tighter text-slate-400 transition-colors group-hover:text-amber-600">
                                      {skillId.split('-')[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-slate-900 transition-colors group-hover:text-amber-700">{skill?.name ?? skillId}</h4>
                                    <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 italic">
                                      {skillId}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => openLearningPathModule(skillId)}
                                  className="editorial-button-secondary"
                                >
                                  Practice
                                </button>
                              </div>
                            );
                          }) : (
                            <div className="p-8 text-sm text-slate-500">No high-impact skills are available yet. Keep practicing and this list will populate.</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-5">
                        {canGenerateStudyPlan && studyPlanHistory.length === 0 && !studyPlanLoading && (
                          <div className="editorial-surface p-5">
                            <div className="flex items-start gap-3">
                              <Sparkles className="mt-0.5 h-5 w-5 text-amber-600" />
                              <div>
                                <p className="text-lg font-bold text-slate-900">Generate your Study Guide</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                  Build a bigger plan around your developing skills whenever you are ready. The guide stays optional, but it can help connect your next steps.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleGenerateStudyPlan();
                                setMode('study-guide');
                              }}
                              className="editorial-button-primary mt-6"
                            >
                              <Sparkles className="h-4 w-4" />
                              Generate Study Guide
                            </button>
                          </div>
                        )}

                        {studyPlanHistory.length > 0 && (() => {
                          const latest = studyPlanHistory[0];
                          const planDate = latest.createdAt
                            ? new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : null;
                          const snapshot = latest.plan?.readinessSnapshot;
                          return (
                            <button
                              onClick={() => setMode('study-guide')}
                              className="editorial-surface w-full p-5 text-left transition-all hover:border-amber-300"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="editorial-overline">Study Guide</p>
                                  <p className="mt-2 text-lg font-bold text-slate-900">Your latest plan is ready</p>
                                  {planDate && (
                                    <p className="mt-2 text-xs font-medium text-slate-500">Generated {planDate}</p>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </div>
                              {snapshot?.summary && (
                                <p className="mt-4 text-sm leading-relaxed text-slate-500">{snapshot.summary}</p>
                              )}
                              <p className="mt-4 text-sm font-semibold text-amber-700">View full Study Guide</p>
                            </button>
                          );
                        })()}

                        {hasShortAssessmentReport && (
                          <button
                            onClick={() => handleViewReport('screener')}
                            className="editorial-button-ghost"
                          >
                            View your progress
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        {/* PRACTICE HUB */}
        {mode === 'practice-hub' && (
          <div className="space-y-6 pb-16">
            <div className="pt-4">
              <p className="editorial-overline mb-2">Practice</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">Choose your focus.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                Practice by domain, by skill, or follow your personalized learning path.
              </p>
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
            <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading module…</div>}>
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
              <p className="editorial-overline mb-2">Study Plan</p>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">AI Study Guide.</h2>
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
      </div>
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
