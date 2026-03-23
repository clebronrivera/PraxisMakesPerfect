import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronRight, AlertTriangle, Zap, BarChart3, LogOut, Shield, MessageSquare, Flame, BookOpen, BookMarked, CheckCircle, Sparkles, Activity, Clock3, Layers, Map as MapIcon, Target, User, PanelLeftClose, PanelLeft, RotateCcw } from 'lucide-react';
import { formatStudyTime } from './src/hooks/useDailyStudyTime';
import { useDailyQuestionCount, DAILY_GOAL } from './src/hooks/useDailyQuestionCount';
// Import questions and analysis
import { getRandomAffirmation } from './src/data/affirmations';
import { analyzeQuestion } from './src/brain/question-analyzer';

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
const StudyNotebookPage = lazy(() => import('./src/components/StudyNotebookPage'));
const GlossaryPage = lazy(() => import('./src/components/GlossaryPage'));
const TeachMode = lazy(() => import('./src/components/TeachMode'));
const AdminDashboard = lazy(() => import('./src/components/AdminDashboard'));
const StudyPlanCard = lazy(() => import('./src/components/StudyPlanCard'));

// Import hooks
import { useFirebaseProgress } from './src/hooks/useFirebaseProgress';
import { useAdaptiveLearning } from './src/hooks/useAdaptiveLearning';
import { clearSession } from './src/utils/sessionStorage';
import { getCurrentSession, loadUserSession } from './src/utils/userSessionStorage';
import { isStoredScreenerSessionType } from './src/utils/sessionTypes';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useContent } from './src/context/ContentContext';
import type { UserProfileData } from './src/components/OnboardingFlow';
import { useStudyPlanManager } from './src/hooks/useStudyPlanManager';
import { useAssessmentFlow } from './src/hooks/useAssessmentFlow';
import { usePracticeFlow } from './src/hooks/usePracticeFlow';
const AdaptiveDiagnostic = lazy(() => import('./src/components/AdaptiveDiagnostic'));
import {
  isScreenerQuestionCount
} from './src/utils/assessmentConstants';
import { getSkillById } from './src/brain/skill-map';
import { PROGRESS_DOMAINS, getProgressSkillDefinition } from './src/utils/progressTaxonomy';

import { isAdminEmail } from './src/config/admin';
import { useRedemptionRounds } from './src/hooks/useRedemptionRounds';
const RedemptionRoundSession = lazy(() => import('./src/components/RedemptionRoundSession'));
import { clearLegacyClientDataOnce } from './src/utils/legacyClientData';
import { ACTIVE_LAUNCH_FEATURES } from './src/utils/launchConfig';
import { buildProgressSummary } from './src/utils/progressSummaries';
import { PROFICIENCY_META } from './src/utils/skillProficiency';
import { onboardingFormToSavePayload } from './src/utils/onboardingFormToSavePayload';
import { userProfileToFormData } from './src/utils/onboardingProfileMapping';
const LoginScreen = lazy(() => import('./src/components/LoginScreen'));
const OnboardingFlow = lazy(() => import('./src/components/OnboardingFlow'));
const ProfileEditorPanel = lazy(() => import('./src/components/ProfileEditorPanel'));

const CANONICAL_QUESTION_BANK_URL = new URL('./src/data/questions.json', import.meta.url).href;

// ============================================
// TYPE DEFINITIONS
// ============================================

// ============================================
// MAIN APP COMPONENT
// ============================================

function PraxisStudyAppContent() {
  type AppMode = 'home' | 'screener' | 'fullassessment' | 'adaptive-diagnostic' | 'results' | 'score-report' | 'practice' | 'practice-hub' | 'review' | 'teach' | 'admin' | 'study-guide' | 'study-notebook' | 'glossary' | 'learning-path-module' | 'redemption-round';
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
  const currentUserName = user?.user_metadata?.full_name || user?.user_metadata?.displayName || user?.email || null;
  const savedSession = currentUserName ? getCurrentSession(currentUserName) : null;
  const hasSession = Boolean(savedSession);

  // App-level navigation state (not owned by any sub-hook)
  const [mode, setMode] = useState<AppMode>('home');
  const [lastNonAdminMode, setLastNonAdminMode] = useState<NonAdminAppMode>('home');
  const [teachModeDomains] = useState<number[] | undefined>(undefined);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Analyze all questions — declared here so it's available to the sub-hooks below.
  // Always use the canonical local bank as the source of truth for question content.
  // Supabase question data is not trusted for content — only counts/IDs are logged for
  // drift detection (see the useEffect below). This ensures local corrections are never
  // silently bypassed by stale Supabase copies with matching IDs.
  const analyzedQuestions = useMemo(
    () => canonicalQuestions.map(analyzeQuestion),
    [canonicalQuestions],
  );

  // ── Study plan state & handlers ────────────────────────────────────────────
  const {
    studyPlanHistory,
    studyPlanLoading,
    studyPlanGenerating,
    studyPlanError,
    canGenerateStudyPlan,
    handleGenerateStudyPlan,
  } = useStudyPlanManager({
    user,
    profile,
    fetchedSkills,
    fetchedDomains,
  });

  // ── Practice session state & handlers ──────────────────────────────────────
  const {
    practiceDomainFilter,
    practiceSkillFilter,
    isSpicyMode,
    lastPracticeContext,
    practiceQuestions,
    startPractice,
    startSkillPractice,
    startSpicyPractice,
    resetPracticeFilters,
  } = usePracticeFlow({
    analyzedQuestions,
    userId: user?.id,
    onNavigate: (m: string) => setMode(m as AppMode),
  });

  // ── Assessment flow state & handlers ──────────────────────────────────────
  const {
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
  } = useAssessmentFlow({
    analyzedQuestions,
    profile,
    updateProfile,
    currentUserName,
    isLoaded,
    savedSession,
    getAssessmentResponses,
    getLatestAssessmentResponses,
    onNavigate: (m: string) => setMode(m as AppMode),
  });
  // ── Redemption Rounds ──────────────────────────────────────────────────────
  const redemption = useRedemptionRounds({
    userId: user?.id ?? null,
    profile,
    updateProfile,
  });
  // Questions loaded for the active round (AnalyzedQuestion[])
  const [redemptionQuestions, setRedemptionQuestions] = useState<any[]>([]);
  const [redemptionMissedRows, setRedemptionMissedRows] = useState<any[]>([]);

  /** SkillId currently open in the Learning Path module page */
  const [learningPathSkillId, setLearningPathSkillId] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileEditorInitial, setProfileEditorInitial] = useState<UserProfileData | null>(null);

  const openProfileEditor = useCallback(() => {
    setProfileEditorInitial(userProfileToFormData(profile));
    setProfileEditorOpen(true);
  }, [profile]);

  const closeProfileEditor = useCallback(() => {
    setProfileEditorOpen(false);
    setProfileEditorInitial(null);
  }, []);

  // preAssessmentComplete was a dead field (always false, no DB column); collapsed to diagnosticComplete only.
  const hasArchivedShortAssessment = profile.diagnosticComplete;
  const hasCompletedScreener = profile.screenerComplete;

  const hasReadinessData = hasArchivedShortAssessment || hasCompletedScreener || profile.fullAssessmentComplete;
  const hasShortAssessmentReport = Boolean(
    (hasCompletedScreener && (profile.lastScreenerSessionId || profile.screenerItemIds?.length)) ||
    (hasArchivedShortAssessment && profile.lastPreAssessmentSessionId)
  );
  
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

  // Rotate affirmation pills in the top bar based on cumulative activity.
  // Seed changes as the user answers more questions or builds a streak, so
  // returning users see different phrases over time without any state management.
  const headerAffirmations = useMemo(() => {
    const PAIRS: [string, string][] = [
      ['Keep going', 'One step at a time'],
      ['Stay consistent', 'Small reps compound'],
      ['Show up again', 'That is the whole job'],
      ['You are building something', 'Keep the reps going'],
      ['Progress is quiet', 'Keep practicing'],
      ['Earn it every day', 'No shortcuts here'],
      ['Trust the process', 'You are closer than you think'],
    ];
    const seed = (profile.totalQuestionsSeen ?? 0) + (profile.streak ?? 0);
    return PAIRS[seed % PAIRS.length];
  }, [profile.totalQuestionsSeen, profile.streak]);

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

  const openLearningPathModule = useCallback((skillId: string) => {
    setLearningPathSkillId(skillId);
    setMode('learning-path-module');
  }, []);

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
      await saveOnboardingData(onboardingFormToSavePayload(data));
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

      <aside className={`hidden lg:flex lg:flex-shrink-0 lg:flex-col lg:bg-[#0f172a] lg:shadow-2xl transition-all duration-300 ${sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'}`}>
        <div className={`${sidebarCollapsed ? 'p-3 pt-6' : 'p-8'}`}>
          {/* ── Logo ── */}
          <div className={`group mb-10 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 opacity-20 blur-lg transition-opacity group-hover:opacity-60" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-xl font-bold italic tracking-tight text-white">
                  Praxis<span className="text-amber-500">.</span>Ai
                </p>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">School Psychology 5403</p>
              </div>
            )}
          </div>

          {/* ── Nav items ── */}
          <nav className="space-y-1.5">
            {(() => {
              const isActivePractice = mode === 'practice' || mode === 'practice-hub' || mode === 'learning-path-module';
              const notebookHasNew = studyPlanHistory.length > 0; // Show dot when study plan exists
              const tabs = [
                { label: 'Dashboard', icon: <Brain className="w-4 h-4" />, onClick: () => setMode('home'), active: mode === 'home', show: true },
                { label: 'Practice', icon: <Zap className="w-4 h-4" />, onClick: () => setMode('practice-hub'), active: isActivePractice, show: true },
                { label: 'Progress', icon: <BarChart3 className="w-4 h-4" />, onClick: () => setMode('results'), active: mode === 'results', show: Boolean(hasReadinessData) },
                { label: 'Study Plan', icon: <BookOpen className="w-4 h-4" />, onClick: () => setMode('study-guide'), active: mode === 'study-guide', show: ACTIVE_LAUNCH_FEATURES.studyGuide },
                { label: 'Study Notebook', icon: <BookMarked className="w-4 h-4" />, onClick: () => setMode('study-notebook'), active: mode === 'study-notebook', show: true, badge: notebookHasNew },
                { label: 'Glossary', icon: <BookOpen className="w-4 h-4" />, onClick: () => setMode('glossary'), active: mode === 'glossary', show: true },
              ];
              return tabs.filter(tab => tab.show).map(tab => (
                <button
                  key={tab.label}
                  onClick={tab.onClick}
                  className={`editorial-sidebar-item ${tab.active ? 'editorial-sidebar-item-active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''} relative`}
                  title={sidebarCollapsed ? tab.label : undefined}
                >
                  <span className="relative shrink-0">
                    {tab.icon}
                    {tab.badge && !tab.active && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  {!sidebarCollapsed && tab.label}
                </button>
              ));
            })()}
          </nav>
        </div>

        {/* ── Collapse toggle ── */}
        <div className={`px-3 pb-3 ${sidebarCollapsed ? '' : 'px-8'}`}>
          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-xs"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="font-semibold">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* ── Profile card ── */}
        <div className={`mt-auto border-t border-white/5 bg-black/20 ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            type="button"
            onClick={openProfileEditor}
            className={`w-full rounded-[1.75rem] border border-white/5 bg-white/5 text-left transition hover:border-white/15 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${sidebarCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20">
                <User className="h-4 w-4 text-amber-300" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{displayName}</p>
                  {profileRoleLabel && (
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-amber-500">{profileRoleLabel}</p>
                  )}
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Profile &amp; onboarding</p>
                </div>
              )}
            </div>
          </button>
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
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">School Psychology 5403</p>
                </div>
              </div>

              <div className="hidden md:flex flex-wrap items-center gap-2">
                <span className="editorial-pill">{headerAffirmations[0]}</span>
                <span className="editorial-pill">{headerAffirmations[1]}</span>
                {(profile.streak ?? 0) > 0 && (
                  <span className="editorial-pill">
                    <Flame className="h-3.5 w-3.5" />
                    {profile.streak} day streak
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="editorial-topbar-button lg:hidden"
                  title="Profile and onboarding"
                >
                  <User className="w-4 h-4" />
                </button>
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
                  { label: 'Study Plan', onClick: () => setMode('study-guide'), active: mode === 'study-guide', show: ACTIVE_LAUNCH_FEATURES.studyGuide },
                  { label: 'Notebook', onClick: () => setMode('study-notebook'), active: mode === 'study-notebook', show: true },
                  { label: 'Glossary', onClick: () => setMode('glossary'), active: mode === 'glossary', show: true },
                ];
                return tabs.filter(tab => tab.show).map(tab => (
                  <button
                    key={tab.label}
                    onClick={tab.onClick}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
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
              profile.lastSession?.mode === 'adaptive' ||
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
                      {profile.lastSession?.mode === 'adaptive' ? 'Diagnostic in progress'
                        : profile.lastSession?.mode === 'full' ? 'Full diagnostic in progress'
                        : 'Screener in progress'}
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
                          if (ls.mode === 'adaptive') {
                            const saved = loadUserSession(ls.sessionId);
                            if (!saved) { updateProfile({ lastSession: null }); alert('That session is no longer available.'); return; }
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

            // Legacy session-in-progress checks (kept for backward compat)
            void (profile.lastSession); // referenced above in hasAssessmentInProgress

            const spicyButton = (
              <button
                onClick={startSpicyPractice}
                className="editorial-button-dark flex min-h-[4.25rem] w-full items-center justify-between rounded-[1.75rem] px-5 py-4 text-left"
              >
                <span>
                  <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-400">
                    <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
                    Spicy Mode
                  </span>
                  <span className="mt-2 block text-sm font-medium leading-normal text-slate-300">
                    Jump into a full 45-question cycle.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-amber-300" />
              </button>
            );

            return (
              <div className="space-y-8 pb-12">
                {sessionResumeCard}

                {isNewUser && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,20rem)]">
                      <div className="editorial-surface p-6 lg:p-7">
                        <p className="editorial-overline">Dashboard</p>
                        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 lg:text-[2.4rem]">Welcome to Praxis Study</h2>
                        <p className="mt-3 max-w-2xl text-[15px] font-medium leading-normal text-slate-500">
                          Take the adaptive diagnostic to establish your baseline across all 45 skills. It adjusts to your performance — strong areas go fast, weaker areas get more attention. You can pause any time and start practicing immediately.
                        </p>
                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                          <div className="editorial-surface-soft p-4">
                            <p className="editorial-overline">Diagnostic</p>
                            <p className="mt-2 text-base font-bold text-slate-900">Take the adaptive diagnostic</p>
                            <p className="mt-2 text-sm text-slate-500">Starting with 45 questions (one per skill), it adapts based on your answers. Pause any time and come back without penalty.</p>
                            <button onClick={() => startAdaptiveDiagnostic()} className="editorial-button-primary mt-4">
                              <Zap className="h-4 w-4" />
                              Start diagnostic
                            </button>
                          </div>
                          <div className="editorial-surface-soft p-4">
                            <p className="editorial-overline">Practice</p>
                            <p className="mt-2 text-base font-bold text-slate-900">Start practicing right away</p>
                            <p className="mt-2 text-sm text-slate-500">No need to wait — jump into practice immediately. The diagnostic gives deeper insights, but you can practice any time.</p>
                            <ul className="mt-3 space-y-1.5">
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Spicy mode — cycle through all 45 skills
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Domain practice — focus on one section
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Learning path — ordered by your gaps
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="editorial-surface-soft p-5 lg:p-6">
                        <p className="editorial-overline">Quick start</p>
                        <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Want extra exposure first?</p>
                        <p className="mt-3 text-sm leading-normal text-slate-500">
                          Spicy mode cycles one question per skill so you can see the full question bank before diving into the diagnostic.
                        </p>
                        <div className="mt-5">{spicyButton}</div>
                      </div>
                    </div>
                  </>
                )}

                {isScreenerDone && (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,20rem)]">
                    <div className="editorial-surface p-6 lg:p-7">
                      <p className="editorial-overline">Dashboard</p>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 lg:text-[2.4rem]">
                        {firstName ? `Nice work, ${firstName}.` : 'Baseline complete.'}
                      </h2>
                      <p className="mt-3 max-w-2xl text-[15px] font-medium leading-normal text-slate-500">
                        Your initial baseline is recorded. Take the adaptive diagnostic for deeper skill-level insights, or jump straight into practice.
                      </p>
                      <div className="mt-6 grid gap-3 md:grid-cols-2">
                        <div className="editorial-surface-soft border-emerald-200 bg-emerald-50/60 p-4">
                          <p className="editorial-overline text-emerald-700">Complete</p>
                          <p className="mt-2 text-base font-bold text-slate-900">Baseline recorded</p>
                          <p className="mt-2 text-sm text-slate-600">You can already jump into practice and keep building momentum.</p>
                        </div>
                        <div className="editorial-surface-soft p-4">
                          <p className="editorial-overline">Recommended</p>
                          <p className="mt-2 text-base font-bold text-slate-900">Take the adaptive diagnostic</p>
                          <p className="mt-2 text-sm text-slate-500">Deeper skill-level data to unlock your personalized learning path. Adapts to your performance.</p>
                          <button onClick={() => startAdaptiveDiagnostic()} className="editorial-button-primary mt-4">
                            <BarChart3 className="h-4 w-4" />
                            Start adaptive diagnostic
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="editorial-surface-soft p-5 lg:p-6">
                      <p className="editorial-overline">Practice</p>
                      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Keep practicing in the meantime.</p>
                      <p className="mt-3 text-sm leading-normal text-slate-500">
                        Spicy mode cycles through all 45 skills for broader exposure.
                      </p>
                      <div className="mt-5">{spicyButton}</div>
                    </div>
                  </div>
                )}

                {isFullyUnlocked && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,20rem)]">
                      <div className="editorial-surface p-6 lg:p-7">
                        <p className="editorial-overline">Dashboard</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 lg:text-[2.4rem]">
                          {firstName ? `Greetings, ${firstName}.` : 'Welcome back.'}
                        </h2>
                        <p className="mt-3 max-w-2xl text-[15px] font-medium leading-normal text-slate-500">
                          Keep building your skill bank with focused practice. Use the learning path and domain practice to zero in on your biggest gaps.
                        </p>
                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                          <div className="editorial-surface-soft p-4">
                            <p className="editorial-overline">Readiness</p>
                            <p className="mt-2 text-base font-bold text-slate-900">{readinessPhase}</p>
                            <p className="mt-2 text-sm text-slate-500">
                              {skillsToReadiness === 0
                                ? `You have reached the current goal of ${readinessTarget} skills ${PROFICIENCY_META.proficient.label}.`
                                : `${skillsToReadiness} more skills to reach your current goal.`}
                            </p>
                          </div>
                          <div className="editorial-surface-soft p-4">
                            <p className="editorial-overline">Next focus</p>
                            <p className="mt-2 text-base font-bold text-slate-900">
                              {weakestDomain ? weakestDomain.name : 'Follow your learning path'}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {weakestDomain
                                ? `This is the lowest-performing domain right now, so it is a strong place to keep building.`
                                : 'Choose a skill or domain and keep practicing a little at a time.'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <div className="w-full sm:w-auto sm:min-w-[18rem]">{spicyButton}</div>
                          {hasShortAssessmentReport && (
                            <button onClick={() => handleViewReport('screener')} className="editorial-button-secondary">
                              View progress
                            </button>
                          )}
                        </div>

                        {/* ── Redemption Rounds button ── */}
                        {redemption.bankCount > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={async () => {
                                const rows = await redemption.startRound();
                                if (!rows || rows.length === 0) return;
                                const matched = rows
                                  .map((row: any) => ({
                                    q: analyzedQuestions.find(q => q.id === row.question_id),
                                    row,
                                  }))
                                  .filter((item: any) => item.q != null);
                                setRedemptionQuestions(matched.map((item: any) => item.q));
                                setRedemptionMissedRows(matched.map((item: any) => item.row));
                                setMode('redemption-round');
                              }}
                              disabled={redemption.credits <= 0}
                              className={`editorial-button-dark flex min-h-[4.25rem] w-full items-center justify-between rounded-[1.75rem] px-5 py-4 text-left ${redemption.credits <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span>
                                <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-400">
                                  <RotateCcw className="h-4 w-4" />
                                  Redemption Rounds
                                </span>
                                <span className="mt-2 block text-sm font-medium leading-normal text-slate-300">
                                  {redemption.credits > 0
                                    ? `${redemption.credits} credit${redemption.credits !== 1 ? 's' : ''} · ${redemption.bankCount} question${redemption.bankCount !== 1 ? 's' : ''} waiting`
                                    : `${redemption.bankCount} question${redemption.bankCount !== 1 ? 's' : ''} waiting · earn a credit with 20 more practice answers`}
                                </span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-amber-300" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="editorial-surface-soft p-5 lg:p-6">
                        <div className="flex items-center justify-between">
                          <p className="editorial-overline">Daily goal</p>
                          <span className="text-sm font-black italic text-amber-700">{dailyQuestionCount} / {DAILY_GOAL}</span>
                        </div>
                        <div className="mt-4 editorial-progress-track border border-amber-100 p-0.5 shadow-inner">
                          <div
                            className="editorial-progress-fill"
                            style={{ width: `${Math.min((dailyQuestionCount / DAILY_GOAL) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="mt-4 text-sm leading-normal text-slate-500">
                          {dailyQuestionCount >= DAILY_GOAL
                            ? <span className="italic">"{getRandomAffirmation()}"</span>
                            : "Keep moving toward today's question goal while leaving room to read the lesson content and explanations that support it."}
                        </p>
                        <div className="mt-4 rounded-[1.5rem] border border-amber-100 bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Weekly usage</p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m'} this week
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">Stay steady and keep showing up.</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6">
                          <button
                            onClick={() => {
                              if (top5Target[0]) openLearningPathModule(top5Target[0][0]);
                              else setMode('practice-hub');
                            }}
                            className="group flex items-center justify-between rounded-[1.5rem] border border-amber-100 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 active:scale-95"
                          >
                            <span className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                <MapIcon className="h-5 w-5" />
                              </span>
                              <span>
                                <span className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Learning path</span>
                                <span className="mt-1 block text-sm font-bold text-slate-900">Pick up your next skill</span>
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-amber-700" />
                          </button>
                          <button
                            onClick={() => {
                              if (weakestDomain) startPractice(weakestDomain.id);
                              else setMode('practice-hub');
                            }}
                            className="flex items-center justify-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 transition-all hover:border-amber-200 hover:text-amber-700"
                          >
                            <Layers className="h-4 w-4" />
                            Go directly to domain practice
                          </button>
                          <button
                            onClick={() => {
                              if (top5Target[0]) startSkillPractice(top5Target[0][0]);
                              else setMode('practice-hub');
                            }}
                            className="flex items-center justify-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 transition-all hover:border-amber-200 hover:text-amber-700"
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
                            <div className={`rounded-2xl border border-white p-2.5 shadow-sm ${stat.accent}`}>
                              <stat.icon className="h-4.5 w-4.5" />
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </div>
                          <div>
                            <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{stat.label}</p>
                            <p className="text-xl font-black italic tracking-tighter text-slate-900 sm:text-[1.6rem]">{stat.value}</p>
                            <p className="mt-1.5 text-[13px] font-medium leading-normal text-slate-500">{stat.supporting}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,20rem)]">
                      <div className="space-y-6">
                        <div className="px-1 sm:px-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">High-Impact Skills</h3>
                            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
                          </div>
                          <p className="mt-2 max-w-3xl text-sm font-medium leading-normal text-slate-500">
                            High-impact skills are the lowest-performing skills in your skill bank. These skills change dynamically as you improve. If you want to see a full readout of every skill, go to Progress and expand the domains.
                          </p>
                        </div>

                        <div className="editorial-surface overflow-hidden">
                          {top5Target.length > 0 ? top5Target.map(([skillId]) => {
                            const skill = getSkillById(skillId as any);
                            const progressDef = getProgressSkillDefinition(skillId);
                            const displayName = skill?.name ?? progressDef?.fullLabel ?? skillId;
                            return (
                              <div
                                key={skillId}
                                className="group flex items-center justify-between gap-4 border-b border-slate-100 p-4 transition-all last:border-0 hover:bg-[#fbfaf7]"
                              >
                                <div className="flex min-w-0 items-center gap-4">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition-colors group-hover:border-amber-300">
                                    <span className="text-xs font-black italic tracking-tighter text-slate-400 transition-colors group-hover:text-amber-600">
                                      {skillId.split('-')[0]}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="truncate text-[15px] font-bold text-slate-900 transition-colors group-hover:text-amber-700">{displayName}</h4>
                                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 italic">
                                      {skillId}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => openLearningPathModule(skillId)}
                                  className="editorial-button-secondary shrink-0"
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
                          <div className="editorial-surface-soft p-5">
                            <div className="flex items-start gap-3">
                              <Sparkles className="mt-0.5 h-5 w-5 text-amber-600" />
                              <div>
                                <p className="text-lg font-bold text-slate-900">Generate your Study Guide</p>
                                <p className="mt-2 text-sm leading-normal text-slate-500">
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
                              className="editorial-surface-soft w-full p-5 text-left transition-all hover:border-amber-300"
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
                                <p className="mt-3 text-sm leading-normal text-slate-500">{snapshot.summary}</p>
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
              <p className="mt-3 max-w-2xl text-sm leading-normal text-slate-500">
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
              onStartScreener={() => startScreener(undefined)}
              onStartDiagnostic={() => startFullAssessment(undefined)}
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
                latestStudyPlan={
                  studyPlanHistory.length > 0
                    ? { id: studyPlanHistory[0].id, createdAt: studyPlanHistory[0].createdAt, plan: studyPlanHistory[0].plan }
                    : null
                }
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

        {/* STUDY NOTEBOOK PAGE */}
        {mode === 'study-notebook' && (
          <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading notebook…</div>}>
            <StudyNotebookPage
              userId={user?.id ?? null}
              latestStudyPlan={
                studyPlanHistory.length > 0
                  ? { id: studyPlanHistory[0].id, createdAt: studyPlanHistory[0].createdAt, plan: studyPlanHistory[0].plan }
                  : null
              }
            />
          </Suspense>
        )}

        {/* GLOSSARY PAGE */}
        {mode === 'glossary' && (
          <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading glossary…</div>}>
            <GlossaryPage userId={user?.id ?? null} />
          </Suspense>
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

        {/* ADAPTIVE DIAGNOSTIC MODE */}
        {mode === 'adaptive-diagnostic' && adaptiveDiagnosticData && (
          <AdaptiveDiagnostic
            initialQueue={adaptiveDiagnosticData.initialQueue}
            followUpPool={adaptiveDiagnosticData.followUpPool}
            onComplete={handleAdaptiveDiagnosticComplete}
            onPauseExit={() => setMode('home')}
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
            onWrongAnswer={redemption.addToMissedBank}
            onAnswerSubmitted={redemption.handleAnswerSubmitted}
            onExitPractice={() => {
              const { wasSkillPractice, wasSpicy } = resetPracticeFilters();
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
        
        {/* REDEMPTION ROUND */}
        {mode === 'redemption-round' && redemptionQuestions.length > 0 && (
          <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading round…</div>}>
            <RedemptionRoundSession
              questions={redemptionQuestions}
              missedRows={redemptionMissedRows}
              highScore={redemption.highScore}
              onComplete={async (results) => {
                await redemption.recordRoundResult(results);
                setMode('home');
              }}
              onExit={() => setMode('home')}
            />
          </Suspense>
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
      {profileEditorOpen && profileEditorInitial && (
        <Suspense fallback={null}>
          <ProfileEditorPanel
            initialData={profileEditorInitial}
            onClose={closeProfileEditor}
            displayName={profile.preferredDisplayName || profile.fullName || currentUserName}
            onSaveComplete={async (data) => {
              await saveOnboardingData(onboardingFormToSavePayload(data));
            }}
          />
        </Suspense>
      )}
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
