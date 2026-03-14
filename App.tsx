import { useState, useMemo, useCallback, useEffect } from 'react';
import { Brain, Target, ChevronRight, AlertTriangle, Zap, BarChart3, RotateCcw, LogOut, Shield, MessageSquare } from 'lucide-react';

// Import questions and analysis
import QUESTIONS_DATA from './src/data/questions.json';
import { analyzeQuestion, AnalyzedQuestion } from './src/brain/question-analyzer';
import { detectWeaknesses, UserResponse } from './src/brain/weakness-detector';

// Import components
import ResultsDashboard from './src/components/ResultsDashboard';
import PreAssessment from './src/components/PreAssessment';
import FullAssessment from './src/components/FullAssessment';
import ScoreReport from './src/components/ScoreReport';
import ScreenerResults from './src/components/ScreenerResults';
import PracticeSession from './src/components/PracticeSession';
import DomainTiles from './src/components/DomainTiles';
import TeachMode from './src/components/TeachMode';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import AdminDashboard from './src/components/AdminDashboard';
import StudyPlanCard from './src/components/StudyPlanCard';
import FeedbackModal from './src/components/FeedbackModal';

// Import hooks
import { useFirebaseProgress } from './src/hooks/useFirebaseProgress';
import { useAdaptiveLearning } from './src/hooks/useAdaptiveLearning';
import { loadSession, hasActiveSession, clearSession, AssessmentSession } from './src/utils/sessionStorage';
import { createUserSession, getCurrentSession, loadUserSession, UserSession } from './src/utils/userSessionStorage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useContent } from './src/context/ContentContext';
import LoginScreen from './src/components/LoginScreen';
import { buildFullAssessment, buildPreAssessment, buildScreener } from './src/utils/assessment-builder';
import { getDomainColor } from './src/utils/domainColors';
import { StudyPlanDocument, generateStudyPlan, getLatestStudyPlan } from './src/services/studyPlanService';
import { isAdminEmail } from './src/config/admin';

// ============================================
// TYPE DEFINITIONS
// ============================================

// Types are imported from modules above
const CANONICAL_QUESTIONS = QUESTIONS_DATA as any[];
const CANONICAL_QUESTION_IDS = new Set(CANONICAL_QUESTIONS.map(question => question.id));



// ============================================
// MAIN APP COMPONENT
// ============================================

function PraxisStudyAppContent() {
  type AppMode = 'home' | 'preassessment' | 'fullassessment' | 'results' | 'score-report' | 'practice' | 'review' | 'teach' | 'admin';
  type NonAdminAppMode = Exclude<AppMode, 'admin'>;

  // Use hooks for profile and adaptive learning
  const { user, loading: authLoading, logout } = useAuth();
  const { questions: fetchedQuestions, isLoading: contentLoading, domains: fetchedDomains, skills: fetchedSkills } = useContent();
  const { profile, updateProfile, updateSkillProgress, resetProgress, migrateFromLocalStorage, logResponse, updateLastSession, getAssessmentResponses, savePracticeResponse, isLoaded } = useFirebaseProgress();
  const { selectNextQuestion } = useAdaptiveLearning();
  const sanitizedFetchedQuestions = useMemo(
    () => fetchedQuestions.filter(question => CANONICAL_QUESTION_IDS.has(question.id)),
    [fetchedQuestions]
  );
  
  // Migration flag - run once on first login
  const [hasMigrated, setHasMigrated] = useState(false);
  
  // Migrate localStorage data on first login
  useEffect(() => {
    if (user && !hasMigrated && isLoaded) {
      migrateFromLocalStorage()
        .then((migrated) => {
          if (migrated) {
            console.log('[Migration] Completed successfully');
          } else {
            console.log('[Migration] No localStorage data to migrate');
          }
          setHasMigrated(true);
        })
        .catch((error) => {
          console.error('[Migration] Error during migration:', error);
          // Still mark as migrated to prevent infinite retries
          setHasMigrated(true);
        });
    }
  }, [user, hasMigrated, isLoaded, migrateFromLocalStorage]);
  
  // User management
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const currentUserName = user?.displayName || user?.email || (user?.isAnonymous ? 'Guest' : null);
  
  // Check for saved session on mount
  const savedSession = useMemo(() => loadSession(), []);
  const hasSession = useMemo(() => hasActiveSession(), []);
  
  // App state
  const [activeAssessmentType, setActiveAssessmentType] = useState<'diagnostic' | 'screener' | null>(null);
  const [mode, setMode] = useState<AppMode>('home');
  const [lastNonAdminMode, setLastNonAdminMode] = useState<NonAdminAppMode>('home');
  const [preAssessmentQuestions, setPreAssessmentQuestions] = useState<AnalyzedQuestion[]>([]);
  const [fullAssessmentQuestions, setFullAssessmentQuestions] = useState<AnalyzedQuestion[]>([]);
  const [assessmentStartTime, setAssessmentStartTime] = useState<number>(savedSession?.startTime || 0);
  const [lastAssessmentResponses, setLastAssessmentResponses] = useState<UserResponse[]>([]);
  const [lastAssessmentType, setLastAssessmentType] = useState<'pre-assessment' | 'full-assessment'>('pre-assessment');
  const [practiceDomainFilter, setPracticeDomainFilter] = useState<number | null>(null);
  const [teachModeDomains, setTeachModeDomains] = useState<number[] | undefined>(undefined);
  const [studyPlan, setStudyPlan] = useState<StudyPlanDocument | null>(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [studyPlanGenerating, setStudyPlanGenerating] = useState(false);
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Analyze all questions
  const analyzedQuestions = useMemo(() => {
    // Only trust Firestore when it matches the canonical local bank.
    const sourceQuestions = sanitizedFetchedQuestions.length === CANONICAL_QUESTIONS.length
      ? sanitizedFetchedQuestions
      : CANONICAL_QUESTIONS;
    return sourceQuestions.map(analyzeQuestion);
  }, [sanitizedFetchedQuestions]);
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (contentLoading || fetchedQuestions.length === 0) {
      return;
    }

    const staleQuestionCount = fetchedQuestions.length - sanitizedFetchedQuestions.length;
    const missingCanonicalCount = CANONICAL_QUESTIONS.length - sanitizedFetchedQuestions.length;

    if (staleQuestionCount > 0 || missingCanonicalCount > 0) {
      console.warn('[QuestionBank] Firestore questions do not match the canonical export. Falling back to the bundled bank.', {
        firestoreCount: fetchedQuestions.length,
        canonicalCount: CANONICAL_QUESTIONS.length,
        matchedCanonicalCount: sanitizedFetchedQuestions.length,
        staleQuestionCount,
        missingCanonicalCount
      });
    }
  }, [contentLoading, fetchedQuestions, sanitizedFetchedQuestions.length]);

  // Restore session ID and assessment type on mount
  useEffect(() => {
    if (savedSession) {
      setSelectedSessionId((savedSession as any).sessionId);
      if (savedSession.type === 'pre-assessment') {
        // Distinguish screener by question count (45 for screener, 40 for diagnostic)
        const isScreener = savedSession.questionIds.length === 45;
        setActiveAssessmentType(isScreener ? 'screener' : 'diagnostic');
      } else if (savedSession.type === 'full-assessment') {
        setActiveAssessmentType('diagnostic');
      }
    }
  }, [savedSession]);

  // Filter questions by domain for practice mode
  const practiceQuestions = useMemo(() => {
    if (practiceDomainFilter === null) {
      return analyzedQuestions;
    }
    return analyzedQuestions.filter(q => (q.domains || []).includes(practiceDomainFilter!));
  }, [analyzedQuestions, practiceDomainFilter]);

  const canGenerateStudyPlan = useMemo(() => {
    if (!user || !profile.screenerComplete) {
      return false;
    }

    return Boolean(profile.lastPreAssessmentSessionId || profile.lastFullAssessmentSessionId || profile.diagnosticComplete || profile.fullAssessmentComplete);
  }, [profile.diagnosticComplete, profile.fullAssessmentComplete, profile.lastFullAssessmentSessionId, profile.lastPreAssessmentSessionId, profile.screenerComplete, user]);

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
        const latestPlan = await getLatestStudyPlan(user.uid);
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
  
  const startPreAssessment = useCallback((resumeSession?: AssessmentSession | UserSession) => {
    if (resumeSession && resumeSession.type === 'pre-assessment') {
      // Resume from saved session - restore question order
      const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
      const restoredQuestions = resumeSession.questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);
      
      if (restoredQuestions.length === resumeSession.questionIds.length) {
        setPreAssessmentQuestions(restoredQuestions);
        setAssessmentStartTime(resumeSession.startTime);
        setSelectedSessionId((resumeSession as any).sessionId);
        const isScreener = resumeSession.questionIds.length === 45;
        setActiveAssessmentType(isScreener ? 'screener' : 'diagnostic');
        setMode('preassessment');
        return;
      }
    }
    
    // Start new assessment: Quick Diagnostic (40Q) via single assessment builder
    const shuffledSelected = buildPreAssessment(analyzedQuestions, 4, new Set());
    if (shuffledSelected.length === 0) {
      console.error('No questions selected for pre-assessment');
      return;
    }
    const questionIds = shuffledSelected.map(q => q.id);
    setActiveAssessmentType('diagnostic');
    
    // Create new user session if we have a current user
    if (currentUserName) {
      try {
        const newSession = createUserSession(currentUserName, 'pre-assessment', questionIds);
        setSelectedSessionId(newSession.sessionId);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
    
    setPreAssessmentQuestions(shuffledSelected);
    setAssessmentStartTime(Date.now());
    setMode('preassessment');
  }, [analyzedQuestions, currentUserName]);
  
  const startScreener = useCallback(() => {
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
    
    // Store selected IDs in Firestore as requested
    updateProfile({
      screenerItemIds: questionIds
    });
    
    // Use pre-assessment state and mode for the screener
    setPreAssessmentQuestions(selected);
    setAssessmentStartTime(Date.now());
    setActiveAssessmentType('screener');
    setMode('preassessment');
    
    // Create session for tracking
    if (currentUserName) {
      try {
        const newSession = createUserSession(currentUserName, 'pre-assessment', questionIds);
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
        setMode('fullassessment');
        return;
      }
    }
    
    // Start new assessment: Full Test (125Q) with Praxis-aligned distribution
    // Use assessment builder to get exactly 125 questions distributed per Praxis percentages
    const excludeIds = profile.preAssessmentQuestionIds ?? [];
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
        const newSession = createUserSession(currentUserName, 'full-assessment', questionIds);
        setSelectedSessionId(newSession.sessionId);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
    
    setFullAssessmentQuestions(selected);
    setAssessmentStartTime(Date.now());
    setMode('fullassessment');
  }, [analyzedQuestions, currentUserName, profile.preAssessmentQuestionIds]);
  
  const handleResumeAssessment = useCallback(() => {
    if (!user) return;
    
    // Try to load user session first (if userSessionStorage is still used for sessions)
    if (currentUserName) {
      const userSession = getCurrentSession(currentUserName);
      if (userSession) {
        if (userSession.type === 'pre-assessment') {
          startPreAssessment(userSession);
        } else if (userSession.type === 'full-assessment') {
          startFullAssessment(userSession);
        }
        return;
      }
    }
    
    // Fallback to old session system
    if (savedSession) {
      if (savedSession.type === 'pre-assessment') {
        startPreAssessment(savedSession);
      } else if (savedSession.type === 'full-assessment') {
        startFullAssessment(savedSession);
      }
    }
  }, [user, currentUserName, savedSession, startPreAssessment, startFullAssessment]);

  // Note: User selection is now handled by Firebase auth, so this callback is no longer needed
  // Sessions can still be loaded if needed, but user management is via Firebase
  
  const handleDiscardSession = useCallback(() => {
    clearSession();
    // Force re-render by updating state
    setMode('home');
  }, []);
  
  const handleResetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all progress? This will clear all scores, history, and assessments. This cannot be undone.')) {
      resetProgress();
      setMode('home');
      // Force re-render to show fresh state
      window.location.reload();
    }
  }, [resetProgress]);

  const handleGenerateStudyPlan = useCallback(async () => {
    if (!user) {
      return;
    }

    setStudyPlanGenerating(true);
    setStudyPlanError(null);

    try {
      const idToken = await user.getIdToken();
      const generatedPlan = await generateStudyPlan({
        userId: user.uid,
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
  
  const handlePreAssessmentComplete = useCallback(async (responses: UserResponse[]) => {
    const questionCount = responses.length;
    const correctCount = responses.filter(r => r.isCorrect).length;
    const durationMs = assessmentStartTime > 0 ? Date.now() - assessmentStartTime : 0;
    const questionIds = preAssessmentQuestions.map(q => q.id);
    
    console.log('[PreAssessment] Complete', {
      questionCount,
      correctCount,
      durationMs,
      questionIds: questionIds.length,
      responsesSaved: responses.length
    });
    
    const analysis = detectWeaknesses(responses, analyzedQuestions);
    
    // Save results to Firebase before navigation
    // Note: Responses are already logged to responses subcollection during assessment
    const updates: any = {
      preAssessmentComplete: true,
      preAssessmentQuestionIds: questionIds,
      lastPreAssessmentSessionId: selectedSessionId,
      lastPreAssessmentCompletedAt: new Date().toISOString(),
      ...analysis
    };

    // If this was a screener, also set screenerComplete and populate screenerResults
    if (activeAssessmentType === 'screener') {
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
    
    console.log('[PreAssessment] Results saved to Firebase, navigating to score report');
    
    setLastAssessmentResponses(responses);
    setLastAssessmentType('pre-assessment');
    setMode('score-report');
  }, [analyzedQuestions, updateProfile, assessmentStartTime, preAssessmentQuestions, selectedSessionId]);
  
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
    
    // Save results to Firebase before navigation
    // Note: Responses are already logged to responses subcollection during assessment
    await updateProfile({
      fullAssessmentComplete: true,
      fullAssessmentQuestionIds: questionIds,
      lastFullAssessmentSessionId: selectedSessionId,
      lastFullAssessmentCompletedAt: new Date().toISOString(),
      ...analysis
    });
    
    console.log('[FullAssessment] Results saved to Firebase, navigating to score report');
    
    setLastAssessmentResponses(responses);
    setLastAssessmentType('full-assessment');
    setMode('score-report');
  }, [analyzedQuestions, updateProfile, assessmentStartTime, fullAssessmentQuestions, selectedSessionId]);
  
  const startPractice = useCallback((domainId?: number) => {
    setPracticeDomainFilter(domainId || null);
    setMode('practice');
  }, []);

  // Handler to view past assessment reports
  const handleViewReport = useCallback(async (
    assessmentType: 'pre-assessment' | 'full-assessment'
  ) => {
    const sessionId = assessmentType === 'pre-assessment' 
      ? profile.lastPreAssessmentSessionId 
      : profile.lastFullAssessmentSessionId;
    
    if (!sessionId) {
      console.error(`[handleViewReport] No session ID found for ${assessmentType}`);
      alert('Unable to load report. Session data not found.');
      return;
    }

    try {
      // Get question IDs from profile
      const questionIds = assessmentType === 'pre-assessment'
        ? profile.preAssessmentQuestionIds || []
        : profile.fullAssessmentQuestionIds || [];

      if (questionIds.length === 0) {
        console.error(`[handleViewReport] No question IDs found for ${assessmentType}`);
        alert('Unable to load report. Question data not found.');
        return;
      }

      // Match questions with analyzedQuestions
      const questionMap = new Map(analyzedQuestions.map(q => [q.id, q]));
      const questions = questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);

      if (questions.length === 0) {
        console.error(`[handleViewReport] No matching questions found`);
        alert('Unable to load report. Questions not found.');
        return;
      }

      // Retrieve responses from Firestore
      const firestoreAssessmentType = assessmentType === 'pre-assessment' ? 'diagnostic' : 'full';
      const responses = await getAssessmentResponses(sessionId, firestoreAssessmentType, analyzedQuestions);

      if (responses.length === 0) {
        console.warn(`[handleViewReport] No responses found in Firestore for session ${sessionId}`);
        alert('Unable to load report. Response data not found in database.');
        return;
      }

      // Set state for ScoreReport component
      // Reset start time — viewing a past report has no meaningful "time remaining"
      setAssessmentStartTime(0);
      setLastAssessmentResponses(responses);
      setLastAssessmentType(assessmentType);

      if (assessmentType === 'pre-assessment') {
        setPreAssessmentQuestions(questions);
      } else {
        setFullAssessmentQuestions(questions);
      }

      setMode('score-report');
    } catch (error) {
      console.error(`[handleViewReport] Error loading report:`, error);
      alert('An error occurred while loading the report. Please try again.');
    }
  }, [profile, analyzedQuestions, getAssessmentResponses]);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  

  // ============================================
  // RENDER
  // ============================================
  
  // Show loading while checking auth, loading profile, or fetching content
  if (authLoading || !isLoaded || contentLoading) {
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
            {profile.preAssessmentComplete && mode !== 'home' && (
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
                // Log out from Firebase
                await logout();
                // Reset local state
                setMode('home');
                setPreAssessmentQuestions([]);
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
        
        {/* HOME SCREEN */}
        {mode === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 pt-8">
              <h2 className="text-3xl font-bold text-slate-100">
                {profile.preAssessmentComplete ? 'Welcome Back!' : 'Ready to Study?'}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                {profile.preAssessmentComplete 
                  ? `You've completed ${profile.totalQuestionsSeen} questions. Let's keep building your knowledge.`
                  : 'Start with a quick diagnostic to identify your strengths and weaknesses.'}
              </p>
            </div>
            
            {/* Quick Stats (if has history) */}
            {profile.preAssessmentComplete && (
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
                  <p className="text-2xl font-bold text-purple-400">{profile.weakestDomains.length}</p>
                  <p className="text-xs text-slate-500">Focus Areas</p>
                  <p className="text-xs text-slate-600 mt-0.5">Domains below 60%</p>
                </div>
              </div>
            )}

            {/* View Report Buttons */}
            {(profile.preAssessmentComplete && profile.lastPreAssessmentSessionId) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <button
                  onClick={() => handleViewReport('pre-assessment')}
                  className="w-full flex items-center justify-between p-4 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="font-semibold text-amber-300">View Pre-Assessment Report</p>
                      <p className="text-xs text-amber-200/80">Review your diagnostic results and feedback</p>
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

            {/* Resume Session Notice */}
            {hasSession && savedSession && (
              <div className="p-6 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Resume Assessment</h3>
                    <p className="text-sm text-blue-200/80">
                      You have a saved {savedSession.type === 'pre-assessment' ? 'pre-assessment' : 'full assessment'} session.
                      {savedSession.responses.length > 0 && (
                        <span> {savedSession.responses.length} questions completed.</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleResumeAssessment}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleDiscardSession}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    Start New
                  </button>
                </div>
              </div>
            )}

            {/* Resume Practice Session */}
            {profile.lastSession && (
              <div className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-emerald-300 mb-1">Resume Last Session</h3>
                    <p className="text-sm text-emerald-200/80">
                      {profile.lastSession.mode === 'practice' && 'Practice mode'}
                      {profile.lastSession.mode === 'full' && 'Full assessment'}
                      {profile.lastSession.mode === 'diagnostic' && 'Diagnostic'}
                      {profile.lastSession.questionIndex > 0 && ` • Question ${profile.lastSession.questionIndex + 1}`}
                    </p>
                    {profile.lastSession.mode === 'practice' && (
                      <p className="text-xs text-emerald-200/60 mt-1">
                        Resume practice where you left off (same session)
                      </p>
                    )}
                    {profile.lastSession.updatedAt && (
                      <p className="text-xs text-emerald-300/60 mt-1">
                        Last updated: {new Date(profile.lastSession.updatedAt.seconds * 1000 || profile.lastSession.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const lastSession = profile.lastSession!;
                      if (lastSession.mode === 'practice') {
                        startPractice();
                      } else if (lastSession.mode === 'diagnostic') {
                        const saved = loadUserSession(lastSession.sessionId);
                        startPreAssessment(saved ?? undefined);
                      } else if (lastSession.mode === 'full') {
                        const saved = loadUserSession(lastSession.sessionId);
                        startFullAssessment(saved ?? undefined);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => {
                      // Clear lastSession pointer
                      updateProfile({ lastSession: undefined });
                    }}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title={profile.lastSession?.mode === 'practice' ? 'Start a new practice session (fresh set of questions)' : undefined}
                  >
                    Start New
                  </button>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {!savedSession && !profile.lastSession && (
              <div className="space-y-4">
              {(!profile.preAssessmentComplete && !profile.screenerComplete) ? (

                <>
                  <button
                    onClick={() => startPreAssessment(undefined)}
                    className="w-full p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-lg">Quick Diagnostic (40Q)</p>
                        <p className="text-amber-100 text-sm">40 questions • ~30 minutes</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => startScreener()}
                    className="w-full p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-lg">Skills Screener (45Q)</p>
                        <p className="text-purple-100 text-sm">45 questions • 1 per unique skill</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                  
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
                  <button
                    onClick={() => startPractice()}
                    className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-lg">Adaptive Practice</p>
                        <p className="text-emerald-100 text-sm">Focus on your weak areas</p>
                        <p className="text-emerald-200/70 text-xs mt-1">Questions adapt to your performance and target your weakest domains and skills.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                  
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
                      if (profile.fullAssessmentComplete) {
                        setTeachModeDomains(undefined);
                        setMode('teach');
                      }
                    }}
                    disabled={!profile.fullAssessmentComplete}
                    className={`w-full p-6 rounded-2xl flex items-center justify-between group transition-all ${
                      profile.fullAssessmentComplete
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer'
                        : 'bg-slate-800/30 border border-slate-700/50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        profile.fullAssessmentComplete ? 'bg-white/20' : 'bg-slate-700/50'
                      }`}>
                        <Target className={`w-6 h-6 ${profile.fullAssessmentComplete ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-lg ${profile.fullAssessmentComplete ? 'text-white' : 'text-slate-500'}`}>
                          Teach Mode
                        </p>
                        <p className={`text-sm ${profile.fullAssessmentComplete ? 'text-purple-100' : 'text-slate-600'}`}>
                          {profile.fullAssessmentComplete 
                            ? 'Learn from mistakes with guided explanations'
                            : 'Complete full assessment to unlock'}
                        </p>
                      </div>
                    </div>
                    {profile.fullAssessmentComplete && (
                      <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setMode('results')}
                    className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-slate-300" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-200">View Progress</p>
                        <p className="text-slate-500 text-sm">See your domain scores</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
            )}
            
            {/* Weak Areas Preview */}
            {profile.preAssessmentComplete && profile.weakestDomains.length > 0 && (

              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-200">Focus Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.weakestDomains.map(d => (
                    <span key={d} className="px-3 py-1.5 rounded-full text-sm" style={{
                      backgroundColor: `${getDomainColor(d)}20`,
                      color: getDomainColor(d)
                    }}>
                      {fetchedDomains.find(fd => fd.id === String(d))?.name || `Domain ${d}`}
                    </span>
                  ))}
                </div>
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
            
            {/* Domain Tiles Section */}
            <div className="pt-8 border-t border-slate-800">
              <DomainTiles 
                onDomainSelect={(domainId) => {
                  // Start practice filtered to this domain
                  startPractice(domainId);
                }}
              />
            </div>
            
            {/* Reset Progress Button */}
            {(profile.preAssessmentComplete || profile.totalQuestionsSeen > 0) && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleResetProgress}
                  className="w-full p-4 bg-slate-800/30 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">Reset All Progress</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* PRE-ASSESSMENT MODE */}
        {mode === 'preassessment' && preAssessmentQuestions.length > 0 && (
          <PreAssessment
            questions={preAssessmentQuestions}
            onComplete={handlePreAssessmentComplete}
            showTimer={true}
            sessionId={selectedSessionId}
            logResponse={logResponse}
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
            logResponse={logResponse}
            updateLastSession={updateLastSession}
          />
        )}
        
        {/* SCORE REPORT / SCREENER RESULTS MODE */}
        {mode === 'score-report' && (
          <ErrorBoundary>
            {lastAssessmentResponses.length > 0 ? (
              lastAssessmentType === 'pre-assessment' ? (
                <ScreenerResults
                  profile={profile}
                  onStartPractice={startPractice}
                  onTakeFullDiagnostic={() => startFullAssessment(undefined)}
                  onGoHome={() => setMode('home')}
                />
              ) : (
                <ScoreReport
                  responses={lastAssessmentResponses}
                  questions={fullAssessmentQuestions}
                  assessmentType={lastAssessmentType}
                  totalTime={assessmentStartTime > 0 ? Math.floor((Date.now() - assessmentStartTime) / 1000) : 0}
                  onStartPractice={startPractice}
                  onRetakeAssessment={() => startFullAssessment(undefined)}
                  onGoHome={() => setMode('home')}
                  onStartTeachMode={(domains) => {
                    setTeachModeDomains(domains);
                    setMode('teach');
                  }}
                  onStartPracticeWithDomains={(domains) => {
                    setPracticeDomainFilter(domains[0] || null);
                    setMode('practice');
                  }}
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
            onExitPractice={() => setMode('home')}
          />
        )}
        
        {/* TEACH MODE */}
        {mode === 'teach' && (
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
            onStartPractice={startPractice}
            onRetakeAssessment={() => startPreAssessment(undefined)}
          />
        )}
        
        {/* ADMIN DASHBOARD */}
        {mode === 'admin' && (
          <AdminDashboard
            onExit={() => returnFromAdmin()}
            returnLabel={lastNonAdminMode === 'home' ? 'Return to site' : `Back to ${lastNonAdminMode}`}
            onGoHome={() => returnFromAdmin('home')}
            onStartPractice={() => startPractice()}
            onGoTeach={() => setMode('teach')}
          />
        )}
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
