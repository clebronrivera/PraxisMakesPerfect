import { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, ChevronRight, AlertTriangle, Zap, BarChart3, LogOut, Shield, MessageSquare, Flame, BookOpen, BookMarked, User, PanelLeftClose, PanelLeft, Trophy, HelpCircle, Bot } from 'lucide-react';
import { useDailyQuestionCount, DAILY_GOAL } from './src/hooks/useDailyQuestionCount';
import { analyzeQuestion } from './src/brain/question-analyzer';

// Import components
const StudyModesSection = lazy(() => import('./src/components/StudyModesSection'));
const DashboardHome = lazy(() => import('./src/components/DashboardHome'));
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
const HelpFAQ = lazy(() => import('./src/components/HelpFAQ'));
const AdminDashboard = lazy(() => import('./src/components/AdminDashboard'));
const StudyPlanCard = lazy(() => import('./src/components/StudyPlanCard'));
const TutorChatPage = lazy(() => import('./src/components/TutorChatPage').then(m => ({ default: m.TutorChatPage })));
const FloatingTutorWidget = lazy(() => import('./src/components/FloatingTutorWidget').then(m => ({ default: m.FloatingTutorWidget })));

// Import hooks
import { useProgressTracking } from './src/hooks/useProgressTracking';
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
import { useLeaderboard } from './src/hooks/useLeaderboard';
import type { LbMode } from './src/hooks/useLeaderboard';
const RedemptionRoundSession = lazy(() => import('./src/components/RedemptionRoundSession'));
import { clearLegacyClientDataOnce } from './src/utils/legacyClientData';
import { ACTIVE_LAUNCH_FEATURES } from './src/utils/launchConfig';
import { useTutorialState } from './src/hooks/useTutorialState';
const TutorialWalkthrough = lazy(() => import('./src/components/TutorialWalkthrough'));
import { buildProgressSummary } from './src/utils/progressSummaries';
import { PROFICIENCY_META } from './src/utils/skillProficiency';
import { buildAssessmentReportModel } from './src/utils/assessmentReport';
import { buildDiagnosticSummary } from './src/utils/diagnosticSelectors';
import { onboardingFormToSavePayload } from './src/utils/onboardingFormToSavePayload';
import { userProfileToFormData } from './src/utils/onboardingProfileMapping';
const LoginScreen = lazy(() => import('./src/components/LoginScreen'));
const OnboardingFlow = lazy(() => import('./src/components/OnboardingFlow'));
const ProfileEditorPanel = lazy(() => import('./src/components/ProfileEditorPanel'));
const PrivacyPolicy = lazy(() => import('./src/components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./src/components/TermsOfService'));

const CANONICAL_QUESTION_BANK_URL = new URL('./src/data/questions.json', import.meta.url).href;

// ============================================
// TYPE DEFINITIONS
// ============================================

// ============================================
// MAIN APP COMPONENT
// ============================================

function PraxisStudyAppContent() {
  type AppMode = 'home' | 'screener' | 'fullassessment' | 'adaptive-diagnostic' | 'results' | 'score-report' | 'practice' | 'practice-hub' | 'review' | 'admin' | 'study-guide' | 'study-notebook' | 'glossary' | 'learning-path-module' | 'redemption-round' | 'help' | 'tutor';
  type NonAdminAppMode = Exclude<AppMode, 'admin'>;

  // Use hooks for profile and adaptive learning
  const { user, loading: authLoading, logout } = useAuth();
  const { questions: fetchedQuestions, isLoading: contentLoading, domains: fetchedDomains, skills: fetchedSkills } = useContent();
  const { profile, updateProfile, saveOnboardingData, updateSkillProgress, resetProgress, logResponse, updateLastSession, getAssessmentResponses, getLatestAssessmentResponses, savePracticeResponse, saveScreenerResponse, isLoaded } = useProgressTracking();
  const { selectNextQuestion } = useAdaptiveLearning();
  const [canonicalQuestions, setCanonicalQuestions] = useState<any[]>([]);
  const [canonicalLoading, setCanonicalLoading] = useState(true);

  // Hash routing for privacy/terms — must be declared before any early returns
  const [hashRoute, setHashRoute] = useState(window.location.hash.replace('#', ''));
  useEffect(() => {
    const onHashChange = () => setHashRoute(window.location.hash.replace('#', ''));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Users online + Leaderboard ─────────────────────────────────────────────
  function getHourRange(h: number): [number, number] {
    const map: [number, number][] = [
      [0, 2],  // 12am
      [0, 1],  // 1am
      [0, 0],  // 2am
      [0, 0],  // 3am
      [0, 1],  // 4am
      [0, 1],  // 5am
      [1, 2],  // 6am
      [1, 3],  // 7am
      [2, 5],  // 8am
      [3, 6],  // 9am
      [3, 7],  // 10am
      [3, 7],  // 11am
      [2, 6],  // 12pm
      [2, 5],  // 1pm
      [2, 5],  // 2pm
      [3, 7],  // 3pm
      [4, 8],  // 4pm
      [4, 8],  // 5pm
      [5, 9],  // 6pm
      [5, 10], // 7pm
      [5, 10], // 8pm
      [4, 8],  // 9pm
      [2, 6],  // 10pm
      [1, 4],  // 11pm
    ];
    return map[h] ?? [0, 0];
  }

  const [usersOnline, setUsersOnline] = useState(() => {
    const [min, max] = getHourRange(new Date().getHours());
    return min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
  });

  useEffect(() => {
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 60000) + 90000; // 90–150s
      return setTimeout(() => {
        const [min, max] = getHourRange(new Date().getHours());
        setUsersOnline(prev => {
          const roll = Math.random();
          let drift = 0;
          if (roll < 0.60) drift = Math.random() < 0.5 ? 1 : -1;
          else if (roll < 0.75) drift = 0;
          else drift = Math.random() < 0.5 ? 2 : -2;
          return Math.min(max, Math.max(min, prev + drift));
        });
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  // Leaderboard — real data from /api/leaderboard
  const { sortedEntries: lbEntries, callerUserId: lbCallerId, lbOpen, setLbOpen, lbMode, setLbMode, isLoading: lbLoading, error: lbError, getRank, formatLbTime } = useLeaderboard(user?.id ?? null);

  // Tutorial walkthrough — auto-triggers after first onboarding completion
  const { showTutorial, dismissTutorial, replayTutorial } = useTutorialState(user?.id, !!profile.onboardingComplete);

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
    lastPracticeContext,
    practiceQuestions,
    startPractice,
    startSkillPractice,
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

  // Build unified DiagnosticSummary for ScoreReport after a full/adaptive assessment.
  // Omits conceptAnalytics (App.tsx does not compute it at this level — ResultsDashboard
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

  // Tutor page context — passed to FloatingTutorWidget so it knows what the user is viewing
  const tutorPageContext = useMemo(() => ({
    page: mode,
  }), [mode]);

  const showFloatingWidget = ACTIVE_LAUNCH_FEATURES.tutorChat &&
    Boolean(user) &&
    !['adaptive-diagnostic', 'screener', 'fullassessment'].includes(mode);

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

  // ── Dashboard Home computed values ────────────────────────────────────────
  const srsOverdueSkills = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return Object.entries(profile.skillScores ?? {})
      .filter(([, perf]) => perf.nextReviewDate && perf.nextReviewDate <= today && perf.attempts > 0)
      .map(([skillId]) => ({
        skillId,
        name: getSkillById(skillId as any)?.name
          ?? getProgressSkillDefinition(skillId)?.fullLabel
          ?? skillId,
      }));
  }, [profile.skillScores]);

  const weakestSkillInfo = useMemo(() => {
    const top5 = Object.entries(profile.skillScores ?? {})
      .filter(([, p]) => p.attempts >= 1 && p.score < 0.7)
      .sort((a, b) => a[1].score - b[1].score);
    if (top5.length === 0) return null;
    const [skillId] = top5[0];
    const skill = getSkillById(skillId as any);
    const progressDef = getProgressSkillDefinition(skillId);
    const domainId = progressDef?.domainId;
    const domain = domainId ? PROGRESS_DOMAINS.find(d => d.id === domainId) : null;
    const emergingInDomain = domainId
      ? Object.entries(profile.skillScores ?? {})
          .filter(([sid, p]) => {
            const pd = getProgressSkillDefinition(sid);
            return pd?.domainId === domainId && p.attempts >= 1 && p.score < 0.6;
          }).length
      : 0;
    return {
      skillId,
      name: skill?.name ?? progressDef?.fullLabel ?? skillId,
      domain: domain?.name ?? 'Unknown',
      emergingCount: emergingInDomain,
    };
  }, [profile.skillScores]);

  const weeklyQuestionCount = useMemo(
    () => recentActivityDays.reduce((total, day) => total + day.questions, 0),
    [recentActivityDays]
  );

  const weeklyAccuracy = useMemo(() => {
    // Overall accuracy from skill scores (not weekly-specific, but best available)
    const entries = Object.values(profile.skillScores ?? {});
    const totalA = entries.reduce((s, p) => s + p.attempts, 0);
    const totalC = entries.reduce((s, p) => s + p.correct, 0);
    return totalA > 0 ? Math.round((totalC / totalA) * 100) : null;
  }, [profile.skillScores]);

  const handleStartRedemption = useCallback(async () => {
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
  }, [redemption, analyzedQuestions]);

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
  
  // ── Privacy & Terms pages (accessible without auth, hash-routed) ──────────
  if (hashRoute === 'privacy') {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicy onBack={() => { window.location.hash = ''; }} />
      </Suspense>
    );
  }
  if (hashRoute === 'terms') {
    return (
      <Suspense fallback={null}>
        <TermsOfService onBack={() => { window.location.hash = ''; }} />
      </Suspense>
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

  // ── Consent gate for existing users ──────────────────────────────────────
  // Non-dismissable: no X button, no back nav. Only exit is "I agree."
  // Skipped for brand-new users (consent captured at signup) or if already accepted.
  const needsConsent = profile.onboardingComplete && !profile.consentAcceptedAt;
  if (needsConsent) {
    const handleAcceptConsent = async () => {
      const now = new Date().toISOString();
      await updateProfile({ consentAcceptedAt: now });
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-slate-900">Updated Terms & Privacy Policy</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-600">
            We've published our Privacy Policy and Terms of Service. Please review and accept
            them to continue using PraxisMakesPerfect.
          </p>
          <div className="mb-6 flex flex-col gap-2">
            <button
              onClick={() => { window.location.hash = 'privacy'; }}
              className="text-left text-sm font-medium text-amber-700 underline hover:text-amber-800"
            >
              Read Privacy Policy
            </button>
            <button
              onClick={() => { window.location.hash = 'terms'; }}
              className="text-left text-sm font-medium text-amber-700 underline hover:text-amber-800"
            >
              Read Terms of Service
            </button>
          </div>
          <button
            onClick={handleAcceptConsent}
            className="editorial-button-primary w-full py-3"
          >
            I agree to the Terms & Privacy Policy
          </button>
        </div>
      </div>
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
    <div className="editorial-shell flex h-screen overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      {/* Tutorial walkthrough overlay */}
      {showTutorial && (
        <Suspense fallback={null}>
          <TutorialWalkthrough onDismiss={dismissTutorial} />
        </Suspense>
      )}
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
                { label: 'AI Tutor', icon: <Bot className="w-4 h-4" />, onClick: () => setMode('tutor'), active: mode === 'tutor', show: ACTIVE_LAUNCH_FEATURES.tutorChat && Boolean(profile.adaptiveDiagnosticComplete) },
                { label: 'Study Notebook', icon: <BookMarked className="w-4 h-4" />, onClick: () => setMode('study-notebook'), active: mode === 'study-notebook', show: true, badge: notebookHasNew },
                { label: 'Glossary', icon: <BookOpen className="w-4 h-4" />, onClick: () => setMode('glossary'), active: mode === 'glossary', show: true },
                { label: 'Help', icon: <HelpCircle className="w-4 h-4" />, onClick: () => setMode('help'), active: mode === 'help', show: true },
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

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
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

                {/* Leaderboard widget */}
                <div className="relative">
                  <button
                    onClick={() => setLbOpen(prev => !prev)}
                    className="editorial-topbar-button"
                    title="Leaderboard"
                  >
                    <Trophy className="w-4 h-4" />
                  </button>

                  {lbOpen && (
                    <>
                      {/* backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setLbOpen(false)} />
                      {/* popover */}
                      <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        {/* header */}
                        <div className="px-4 pt-4 pb-2">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-slate-800">Leaderboard</span>
                          </div>
                          {/* toggle tabs */}
                          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                            {(['questions', 'time', 'mastery'] as LbMode[]).map(tab => (
                              <button
                                key={tab}
                                onClick={() => setLbMode(tab)}
                                className={`flex-1 rounded-lg py-1 text-[10px] font-bold uppercase tracking-wide transition-all ${
                                  lbMode === tab
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {tab === 'questions' ? 'Questions' : tab === 'time' ? 'Time' : 'Mastery'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* rows */}
                        <div className="px-3 pb-2 max-h-72 overflow-y-auto">
                          {lbLoading && lbEntries.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-400">Loading…</div>
                          )}
                          {lbError && lbEntries.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-400">Leaderboard unavailable</div>
                          )}
                          {!lbLoading && !lbError && lbEntries.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-400">No activity yet</div>
                          )}
                          {lbEntries.map((entry, idx) => {
                            const rank = getRank(entry.userId) ?? idx + 1;
                            const isMe = entry.userId === lbCallerId;
                            const score =
                              lbMode === 'questions' ? `${entry.questions}q`
                              : lbMode === 'time' ? formatLbTime(entry.time)
                              : `${entry.mastery} left`;
                            return (
                              <div
                                key={entry.userId}
                                className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors ${
                                  isMe ? 'bg-indigo-50 border-l-2 border-indigo-400' : 'hover:bg-slate-50'
                                }`}
                              >
                                <span className="w-5 text-center text-[11px] font-black text-slate-400">
                                  {rank}
                                </span>
                                <span className={`flex-1 text-sm font-semibold ${isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
                                  {entry.initials}{isMe && <span className="ml-1 text-[10px] font-bold text-indigo-500">You</span>}
                                </span>
                                <span className="text-sm font-bold text-slate-900">{score}</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* footer */}
                        <div className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400 text-center">
                          All-time stats
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Users online pill */}
                <span className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold select-none ${usersOnline === 0 ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    {usersOnline > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${usersOnline > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </span>
                  {usersOnline} online
                </span>

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
                  { label: 'AI Tutor', onClick: () => setMode('tutor'), active: mode === 'tutor', show: ACTIVE_LAUNCH_FEATURES.tutorChat && Boolean(profile.adaptiveDiagnosticComplete) },
                  { label: 'Notebook', onClick: () => setMode('study-notebook'), active: mode === 'study-notebook', show: true },
                  { label: 'Glossary', onClick: () => setMode('glossary'), active: mode === 'glossary', show: true },
                  { label: 'Help', onClick: () => setMode('help'), active: mode === 'help', show: true },
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

        {mode === 'tutor' && ACTIVE_LAUNCH_FEATURES.tutorChat && user ? (
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Loading AI Tutor…</div>}>
              <TutorChatPage
                userId={user.id}
                diagnosticComplete={Boolean(profile.adaptiveDiagnosticComplete)}
              />
            </Suspense>
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto">
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

            const weakestDomain = progressSummary.weakestDomainId
              ? PROGRESS_DOMAINS.find(domain => domain.id === progressSummary.weakestDomainId) ?? null
              : null;

            const hasAssessmentInProgress =
              (profile.lastSession?.mode === 'screener' && !profile.screenerComplete) ||
              (profile.lastSession?.mode === 'full' && !profile.fullAssessmentComplete) ||
              (profile.lastSession?.mode === 'diagnostic' && !profile.diagnosticComplete) ||
              profile.lastSession?.mode === 'adaptive' ||
              (!profile.lastSession && hasSession && savedSession &&
                !profile.screenerComplete && !profile.fullAssessmentComplete);
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
                          {!hasAssessmentInProgress && (
                            <div className="editorial-surface-soft p-4">
                              <p className="editorial-overline">Diagnostic</p>
                              <p className="mt-2 text-base font-bold text-slate-900">Take the adaptive diagnostic</p>
                              <p className="mt-2 text-sm text-slate-500">Starting with 45 questions (one per skill), it adapts based on your answers. Pause any time and come back without penalty.</p>
                              <button onClick={() => startAdaptiveDiagnostic()} className="editorial-button-primary mt-4">
                                <Zap className="h-4 w-4" />
                                Start diagnostic
                              </button>
                            </div>
                          )}
                          <div className="editorial-surface-soft p-4">
                            <p className="editorial-overline">Practice</p>
                            <p className="mt-2 text-base font-bold text-slate-900">Start practicing right away</p>
                            <p className="mt-2 text-sm text-slate-500">No need to wait — jump into practice immediately. The diagnostic gives deeper insights, but you can practice any time.</p>
                            <ul className="mt-3 space-y-1.5">
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Random questions — based on your level of need
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Domain review — focus on one section
                              </li>
                              <li className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                                Skill practice — ordered by your gaps
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="editorial-surface-soft p-5 lg:p-6">
                        <p className="editorial-overline">Quick start</p>
                        <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Jump right in.</p>
                        <p className="mt-3 text-sm leading-normal text-slate-500">
                          Start practicing immediately — no assessment required.
                        </p>
                        <div className="mt-5 space-y-3">
                          <button
                            onClick={() => startPractice()}
                            className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
                          >
                            <span className="text-sm font-semibold text-slate-900">Random Questions</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => setMode('practice-hub')}
                            className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
                          >
                            <span className="text-sm font-semibold text-slate-900">Browse by Domain or Skill</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </button>
                        </div>
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
                          {!hasAssessmentInProgress && (
                            <button onClick={() => startAdaptiveDiagnostic()} className="editorial-button-primary mt-4">
                              <BarChart3 className="h-4 w-4" />
                              Start adaptive diagnostic
                            </button>
                          )}
                          {hasAssessmentInProgress && (
                            <p className="mt-4 text-sm font-medium text-amber-700">Diagnostic in progress — use the Resume card above.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="editorial-surface-soft p-5 lg:p-6">
                      <p className="editorial-overline">Practice</p>
                      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Keep building momentum.</p>
                      <div className="mt-5 space-y-3">
                        <button
                          onClick={() => startPractice()}
                          className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
                        >
                          <span className="text-sm font-semibold text-slate-900">Random Questions</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => setMode('practice-hub')}
                          className="flex w-full items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
                        >
                          <span className="text-sm font-semibold text-slate-900">Browse by Domain or Skill</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isFullyUnlocked && (
                  <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading dashboard...</div>}>
                    <DashboardHome
                      firstName={firstName}
                      demonstratingCount={demonstratingCount}
                      readinessTarget={readinessTarget}
                      readinessPhase={readinessPhase}
                      skillsToReadiness={skillsToReadiness}
                      srsOverdueSkills={srsOverdueSkills}
                      weakestSkill={weakestSkillInfo}
                      weakestDomain={weakestDomain}
                      dailyQuestionCount={dailyQuestionCount}
                      dailyGoal={DAILY_GOAL}
                      weeklyUsageSeconds={weeklyUsageSeconds}
                      weeklyQuestionCount={weeklyQuestionCount}
                      weeklyAccuracy={weeklyAccuracy}
                      redemptionBankCount={redemption.bankCount}
                      redemptionCredits={redemption.credits}
                      questionsToNextCredit={redemption.questionsToNextCredit}
                      redemptionHighScore={redemption.highScore}
                      progressSummary={progressSummary}
                      onStartPractice={startPractice}
                      onStartSkillPractice={startSkillPractice}
                      onOpenLearningPathModule={openLearningPathModule}
                      onStartRedemption={handleStartRedemption}
                      onNavigate={setMode as any}
                    />
                  </Suspense>
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
                onWrongAnswer={(qId, sId) => redemption.addToMissedBankForMiss(qId, sId)}
                onAnswerSubmitted={redemption.handleAnswerSubmitted}
                redemptionBlacklistIds={redemption.redemptionBlacklistIds}
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

        {/* HELP / FAQ PAGE */}
        {mode === 'help' && (
          <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading…</div>}>
            <HelpFAQ onGoHome={() => setMode('home')} onReplayTutorial={replayTutorial} />
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
                  diagnosticSummary={diagnosticSummary}
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
            onWrongAnswer={(qId, sId) => redemption.addToMissedBankForMiss(qId, sId)}
            onHintRedemption={(qId, sId) => redemption.addToMissedBankForHint(qId, sId)}
            onAnswerSubmitted={redemption.handleAnswerSubmitted}
            redemptionBlacklistIds={redemption.redemptionBlacklistIds}
            onExitPractice={() => {
              const { wasSkillPractice } = resetPracticeFilters();
              if (wasSkillPractice) {
                setMode('results');
              } else {
                setMode('practice-hub');
              }
            }}
          />
        )}
        
        {/* RESULTS SCREEN */}
        {mode === 'results' && (
          <ResultsDashboard
            userProfile={profile}
            skills={fetchedSkills}
            analyzedQuestions={analyzedQuestions}
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
            onGoTeach={() => {}}
          />
        )}
        </Suspense>
      </div>
      </div>
        )}
      </main>
      {showFloatingWidget && user && (
        <Suspense fallback={null}>
          <FloatingTutorWidget
            userId={user.id}
            diagnosticComplete={Boolean(profile.adaptiveDiagnosticComplete)}
            pageContext={tutorPageContext}
          />
        </Suspense>
      )}
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
