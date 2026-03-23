import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Zap, Pause, Home, Flame, ArrowLeft, RotateCcw, BookOpen, Lightbulb, X } from 'lucide-react';
import ModuleSnippetCard from './ModuleSnippetCard';
import SkillHelpDrawer from './SkillHelpDrawer';
import { getProgressSkillDefinition } from '../utils/progressTaxonomy';
import QuestionCard from './QuestionCard';
import ExplanationPanel from './ExplanationPanel';
import { useEngine } from '../hooks/useEngine';
import { matchDistractorPattern } from '../brain/distractor-matcher';
import { UserProfile } from '../hooks/useFirebaseProgress';
import { useElapsedTimer } from '../hooks/useElapsedTimer';
import {
  AnalyzedQuestion,
  getQuestionChoiceText,
  getQuestionCorrectAnswers
} from '../brain/question-analyzer';
import { normalizeDistractorPatterns } from '../utils/distractorPatterns';
import { formatChoiceReference, sanitizeFeedbackText } from '../utils/feedbackText';
import { getConfidenceDisplayLabel } from '../utils/confidenceLabels';
import type { SessionMode } from '../types/assessment';
import { getProgressDomainDefinition } from '../utils/progressTaxonomy';
import { getSkillById, type SkillId } from '../brain/skill-map';
import { useAuth } from '../contexts/AuthContext';
import { incrementDailyQuestionCount } from '../hooks/useDailyQuestionCount';
import { addDailyStudySeconds } from '../hooks/useDailyStudyTime';
import { SKILL_MAP } from '../brain/skill-map';

// ─── Question retirement ──────────────────────────────────────────────────────
//
// Questions are retired (suppressed from the active pool) once a user has
// answered them correctly at least TWICE and the first full pass over the
// entire question pool is already complete.
//
// Rules:
//   1. First-pass rule: every question in the pool must be shown at least once
//      before retirement can begin. This ensures no question is skipped on the
//      initial cycle.
//   2. Retirement trigger: times_correct >= 2 AND first pass is done.
//   3. Weak questions (never correct, or only once correct) are never retired
//      regardless of how many times they have been seen.
//   4. Pool exhaustion: if every question in the pool is retired, all retired
//      flags are cleared and the pool restarts from scratch.
//
// Storage: localStorage keyed to user ID.
// NOTE: long-term this should migrate to Supabase so retirement state persists
// across devices and browsers. That migration is deferred.

interface QuestionRetireState {
  times_seen: number;     // total times this question was submitted
  times_correct: number;  // total correct submissions (all-time)
  retired: boolean;       // true = suppressed from active pool
  last_seen_at: number;   // unix ms of last submission
}

type QuestionRetireMap = Record<string, QuestionRetireState>;

// ─── Streak message pools ─────────────────────────────────────────────────────

const STREAK_TIERS: Array<{ min: number; pool: string[] }> = [
  { min: 10, pool: ['You are farming points now.', 'At this point, it is personal.', 'At this point, you are just showing off.'] },
  { min: 8,  pool: ['Praxis is in trouble.', 'Praxis catching a beating.'] },
  { min: 7,  pool: ['Absolutely shameless.', 'Different level right now.'] },
  { min: 6,  pool: ['This is getting disrespectful.', 'This streak is getting loud.'] },
  { min: 5,  pool: ['You are locked in.', 'You are kind of cooking right now.'] },
  { min: 4,  pool: ['That was clean.', 'That was not luck.'] },
  { min: 3,  pool: ['Okay, now we are cooking.', 'Okay streak, I see you.', 'On a little run now.'] },
  { min: 2,  pool: ['Nice. Keep it going.', 'Nice. Momentum started.'] },
];

function pickStreakMessage(streak: number, lastPhrase: string | null): string | null {
  const tier = STREAK_TIERS.find(t => streak >= t.min);
  if (!tier) return null;
  const pool = tier.pool.length > 1 ? tier.pool.filter(p => p !== lastPhrase) : tier.pool;
  return pool[Math.floor(Math.random() * pool.length)];
}

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

// ─── Component ────────────────────────────────────────────────────────────────

interface PracticeSessionProps {
  userProfile: UserProfile;
  updateSkillProgress?: (skillId: SkillId, isCorrect: boolean, confidence?: 'low' | 'medium' | 'high', questionId?: string, timeSpent?: number) => Promise<void>;
  logResponse?: (response: any) => Promise<void>;
  updateLastSession?: (sessionId: string, mode: SessionMode, questionIndex: number, elapsedSeconds?: number) => Promise<void>;
  savePracticeResponse?: (sessionId: string, questionId: string, response: any) => Promise<void>;
  analyzedQuestions: AnalyzedQuestion[];
  selectNextQuestion: (profile: UserProfile, questions: AnalyzedQuestion[], history: string[]) => AnalyzedQuestion | null;
  practiceDomain?: number | null;
  practiceSkillId?: string | null;
  onExitPractice?: () => void;
  /** Hide the session stats bar (correct/wrong totals). Used for new-user spicy sessions. */
  hideSummary?: boolean;
  /** Spicy cycle mode: cycles one question per skill through all skills in sequence. */
  spicyCycleMode?: boolean;
}

export default function PracticeSession({
  userProfile,
  updateSkillProgress,
  logResponse,
  updateLastSession,
  savePracticeResponse,
  analyzedQuestions,
  selectNextQuestion,
  practiceDomain,
  practiceSkillId,
  onExitPractice,
  hideSummary = false,
  spicyCycleMode = false,
}: PracticeSessionProps) {
  const engine = useEngine();
  const { logout, user } = useAuth();
  const userId = user?.id ?? 'anon';

  // ── Skill Help Drawer (shown during By Skill practice) ─────────────────────
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const skillLabel = practiceSkillId
    ? (getProgressSkillDefinition(practiceSkillId)?.fullLabel ?? 'Skill Help')
    : '';

  // ── Hint system ─────────────────────────────────────────────────────────────
  // hintOpenForQuestion tracks whether the hint panel is currently visible.
  // hintUsedIds tracks questions where the user opened a hint this session —
  // those answers do NOT count toward skill score (keeps adaptive data clean).
  const [hintOpenForQuestion, setHintOpenForQuestion] = useState<string | null>(null);
  const [hintUsedIds, setHintUsedIds] = useState<Set<string>>(new Set());

  // ── Missed-skill alert ───────────────────────────────────────────────────────
  // Show an in-app alert when a skill has been missed 3+ times with <60% accuracy.
  // Dismissed per-session by the user.
  const [dismissedSkillAlerts, setDismissedSkillAlerts] = useState<Set<string>>(new Set());

  // ── Daily study time tracking ────────────────────────────────────────────────
  // Record session start time so we can compute elapsed seconds on unmount.
  const sessionStartRef = useRef<number>(Date.now());
  useEffect(() => {
    sessionStartRef.current = Date.now();
    return () => {
      if (user?.id) {
        const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
        addDailyStudySeconds(user.id, elapsed);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Spicy cycle: one question per skill, all 45 skills in sequence ──────────
  // State stored in localStorage so it survives navigation away and back.
  const spicyCycleKey = `pmp-spicy-cycle-${userId}`;

  const [spicySkillIds, setSpicySkillIds] = useState<string[]>(() => {
    if (!spicyCycleMode) return [];
    try {
      const stored = localStorage.getItem(spicyCycleKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { ids: string[]; index: number };
        if (Array.isArray(parsed.ids) && parsed.ids.length > 0) return parsed.ids;
      }
    } catch { /* ignore */ }
    // Build a fresh shuffled list from the skill map
    const all: string[] = [];
    for (const domain of Object.values(SKILL_MAP)) {
      for (const cluster of domain.clusters) {
        for (const skill of cluster.skills) all.push(skill.skillId);
      }
    }
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

  const [spicyCycleIndex, setSpicyCycleIndex] = useState<number>(() => {
    if (!spicyCycleMode) return 0;
    try {
      const stored = localStorage.getItem(spicyCycleKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { ids: string[]; index: number };
        return typeof parsed.index === 'number' ? parsed.index : 0;
      }
    } catch { /* ignore */ }
    return 0;
  });

  // Persist spicy cycle state whenever it changes
  useEffect(() => {
    if (!spicyCycleMode || spicySkillIds.length === 0) return;
    try {
      localStorage.setItem(spicyCycleKey, JSON.stringify({ ids: spicySkillIds, index: spicyCycleIndex }));
    } catch { /* ignore */ }
  }, [spicyCycleMode, spicyCycleKey, spicySkillIds, spicyCycleIndex]);

  // Current skill ID to filter for in spicy mode
  const currentSpicySkillId = spicyCycleMode && spicySkillIds.length > 0
    ? spicySkillIds[spicyCycleIndex % spicySkillIds.length]
    : null;

  // Advance to next skill after each answered question in spicy mode.
  // When the cycle completes (all 45 skills answered once), reshuffle for the next round.
  const advanceSpicyCycle = useCallback(() => {
    const next = spicyCycleIndex + 1;
    if (next >= spicySkillIds.length) {
      // Completed a full cycle — reshuffle skill order for the next round
      const reshuffled = [...spicySkillIds];
      for (let i = reshuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
      }
      setSpicySkillIds(reshuffled);
      setSpicyCycleIndex(0);
    } else {
      setSpicyCycleIndex(next);
    }
  }, [spicyCycleIndex, spicySkillIds]);

  // ── Stable practice-progress key (per user + context) ──────────────────────
  // Using a stable key means the question history and retire map reload
  // correctly when the user leaves and returns to the same skill or domain.
  const practiceProgressKey = practiceSkillId
    ? `practice-skill-${practiceSkillId}-${userId}`
    : practiceDomain != null
      ? `practice-domain-${practiceDomain}-${userId}`
      : `practice-general-${userId}`;

  // Retire store: one flat map per user, keyed by questionId.
  const retireStoreKey = `pmp-qretire-${userId}`;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState<AnalyzedQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, highConfidenceWrong: 0 });
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const [currentDistractorNote, setCurrentDistractorNote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poolResetMessage, setPoolResetMessage] = useState(false);

  // ── Streak state ─────────────────────────────────────────────────────────────
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const lastStreakPhraseRef = useRef<string | null>(null);

  // ── All-time cumulative accuracy ─────────────────────────────────────────────
  // Snapshot baseline at session start so we have a stable origin,
  // then layer the running session stats on top for instant updates.
  const baselineTotalsRef = useRef<{ correct: number; total: number } | null>(null);
  if (baselineTotalsRef.current === null) {
    baselineTotalsRef.current = Object.values(userProfile.domainScores ?? {}).reduce(
      (acc, d) => ({ correct: acc.correct + (d?.correct ?? 0), total: acc.total + (d?.total ?? 0) }),
      { correct: 0, total: 0 }
    );
  }

  const allTimePct = useMemo(() => {
    const base = baselineTotalsRef.current ?? { correct: 0, total: 0 };
    const totalCorrect = base.correct + sessionStats.correct;
    const totalAnswered = base.total + sessionStats.correct + sessionStats.wrong;
    return totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  }, [sessionStats]);

  // ── Question retirement map ──────────────────────────────────────────────────
  const [retireMap, setRetireMap] = useState<QuestionRetireMap>(() => {
    try {
      const stored = localStorage.getItem(retireStoreKey);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  // ── Timer (internal only — NOT shown; kept for per-question timeSpent analytics)
  const { isPaused, resume, resetQuestionTimer, recordInteraction } = useElapsedTimer({
    onAutoPause: () => { /* session auto-paused due to inactivity */ },
  });

  // ── Stable session ID ────────────────────────────────────────────────────────
  const [sessionId] = useState<string>(practiceProgressKey);

  // ── Inactivity auto-logout (15 min) ──────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void logout(), INACTIVITY_MS);
    };
    const events = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [logout]);

  // ── First-pass detection ─────────────────────────────────────────────────────
  // Retirement is only enabled once every question in the active pool has been
  // seen at least once. Until then, questions accumulate correct counts but are
  // not retired.
  const firstPassComplete = useMemo(() => {
    return analyzedQuestions.length > 0 &&
      analyzedQuestions.every(q => (retireMap[q.id]?.times_seen ?? 0) >= 1);
  }, [analyzedQuestions, retireMap]);

  // ── Active pool (exclude retired questions, only after first pass) ───────────
  // In spicy cycle mode, the pool is narrowed to one skill at a time.
  const activePool = useMemo(() => {
    let base = analyzedQuestions;
    if (spicyCycleMode && currentSpicySkillId) {
      const skillPool = analyzedQuestions.filter(q => q.skillId === currentSpicySkillId);
      // If no questions exist for this skill, skip it gracefully by using the full pool
      base = skillPool.length > 0 ? skillPool : analyzedQuestions;
    }
    if (!firstPassComplete) return base;
    const active = base.filter(q => !retireMap[q.id]?.retired);
    return active.length > 0 ? active : base;
  }, [analyzedQuestions, retireMap, firstPassComplete, spicyCycleMode, currentSpicySkillId]);

  // ── Pool exhaustion: reset when every question in the pool is retired ────────
  useEffect(() => {
    if (!firstPassComplete || analyzedQuestions.length === 0) return;
    const allRetired = analyzedQuestions.every(q => retireMap[q.id]?.retired === true);
    if (!allRetired) return;

    // Clear retired flags for this pool so it can cycle again
    setRetireMap(prev => {
      const next = { ...prev };
      analyzedQuestions.forEach(q => {
        if (next[q.id]) next[q.id] = { ...next[q.id], retired: false };
      });
      try { localStorage.setItem(retireStoreKey, JSON.stringify(next)); } catch {}
      return next;
    });
    // Clear question history so all questions are re-eligible immediately
    setQuestionHistory([]);
    setPoolResetMessage(true);
    const t = setTimeout(() => setPoolResetMessage(false), 6000);
    return () => clearTimeout(t);
  }, [analyzedQuestions, firstPassComplete, retireMap, retireStoreKey]);

  // ── Load session stats + history from localStorage ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(`practice-stats-${sessionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessionStats(parsed.stats || { correct: 0, wrong: 0, highConfidenceWrong: 0 });
        setQuestionHistory(parsed.history || []);
      } catch (e) {
        console.error('[PracticeSession] Error loading practice stats:', e);
      }
    }
  }, [sessionId]);

  // ── Persist session stats + history ─────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(`practice-stats-${sessionId}`, JSON.stringify({
      stats: sessionStats,
      history: questionHistory,
    }));
  }, [sessionId, sessionStats, questionHistory]);

  // ── Initialize with first question ──────────────────────────────────────────
  useEffect(() => {
    if (!currentQuestion && activePool.length > 0) {
      const next = selectNextQuestion(userProfile, activePool, questionHistory);
      if (next) {
        setCurrentQuestion(next);
        const letters = next.options ? next.options.map(o => o.letter) : Object.keys(next.choices || {});
        setShuffledOrder([...letters].sort(() => Math.random() - 0.5));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePool]);

  const loadNextQuestion = () => {
    const next = selectNextQuestion(userProfile, activePool, questionHistory);
    if (next) {
      setCurrentQuestion(next);
      const letters = next.options ? next.options.map(o => o.letter) : Object.keys(next.choices || {});
      setShuffledOrder([...letters].sort(() => Math.random() - 0.5));
      setCurrentDistractorNote(null);
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
    }
  };

  // ── Update retirement state for one question after submission ────────────────
  const applyRetirement = (questionId: string, wasCorrect: boolean, fpDone: boolean) => {
    setRetireMap(prev => {
      const cur = prev[questionId] ?? { times_seen: 0, times_correct: 0, retired: false, last_seen_at: 0 };
      const newTimesCorrect = wasCorrect ? cur.times_correct + 1 : cur.times_correct;
      const updated: QuestionRetireState = {
        times_seen: cur.times_seen + 1,
        times_correct: newTimesCorrect,
        // Only retire once the first pass is done AND the question has been
        // answered correctly at least twice. Weak questions never get retired.
        retired: fpDone && newTimesCorrect >= 2,
        last_seen_at: Date.now(),
      };
      const next = { ...prev, [questionId]: updated };
      try { localStorage.setItem(retireStoreKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // ── Submit answer ────────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (selectedAnswers.length === 0 || !currentQuestion || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const timeSpent = resetQuestionTimer();
      const correctList = getQuestionCorrectAnswers(currentQuestion);
      const isCorrect =
        selectedAnswers.every(a => correctList.includes(a)) &&
        selectedAnswers.length === correctList.length;

      // Update retirement tracking (uses firstPassComplete captured at render time)
      applyRetirement(currentQuestion.id, isCorrect, firstPassComplete);

      // Compute the new streak value synchronously so it can be passed to
      // savePracticeResponse before the async setState fires.
      const newStreak = isCorrect ? consecutiveCorrect + 1 : 0;

      // Track daily question count for dashboard goal bar.
      if (user?.id) incrementDailyQuestionCount(user.id);

      if (isCorrect) {
        setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
        setConsecutiveCorrect(newStreak);
        const phrase = pickStreakMessage(newStreak, lastStreakPhraseRef.current);
        if (phrase) { lastStreakPhraseRef.current = phrase; setStreakMessage(phrase); }
      } else {
        setSessionStats(prev => ({
          ...prev,
          wrong: prev.wrong + 1,
          highConfidenceWrong: prev.highConfidenceWrong + (confidence === 'high' ? 1 : 0),
        }));
        setConsecutiveCorrect(0);
        setStreakMessage(null);
        lastStreakPhraseRef.current = null;

        const wrongAnswer = selectedAnswers.find(a => !correctList.includes(a));
        if (wrongAnswer) {
          try {
            const distractorText = getQuestionChoiceText(currentQuestion, wrongAnswer);
            let distractorNote: string | null = null;
            if (currentQuestion.distractors?.length) {
              const matched = currentQuestion.distractors.find(d => d.text === distractorText);
              if (matched) {
                distractorNote = `You selected ${formatChoiceReference(currentQuestion, wrongAnswer)}. ${
                  sanitizeFeedbackText(currentQuestion, matched.explanation)
                }`;
              }
            }
            if (!distractorNote) {
              const correctAnswerText = correctList.map(a => getQuestionChoiceText(currentQuestion, a)).join(' ');
              const patternId = matchDistractorPattern(distractorText, correctAnswerText, engine.distractorPatterns);
              const pattern = normalizeDistractorPatterns(engine.distractorPatterns).find(e => e.id === patternId);
              distractorNote = `You selected ${formatChoiceReference(currentQuestion, wrongAnswer)}. This is a common confusion because ${pattern?.description || 'these concepts are often mixed up.'}`;
            }
            setCurrentDistractorNote(distractorNote);
          } catch (err) {
            console.error('[PracticeSession] Distractor note error:', err);
            setCurrentDistractorNote('This distractor could not be analyzed, but your response was recorded.');
          }
        }
      }

      if (savePracticeResponse) {
        await savePracticeResponse(sessionId, currentQuestion.id, {
          skill_id: currentQuestion.skillId || '',
          domain_id: currentQuestion.domains?.[0] ?? 0,
          selected_answer: selectedAnswers.join(','),
          correct_answer: correctList.join(','),
          is_correct: isCorrect,
          confidence,
          time_on_item_seconds: timeSpent,
          shuffled_order: shuffledOrder,
          consecutive_correct: newStreak,
        });
      }

      setQuestionHistory(prev => [...prev, currentQuestion.id]);
      if (spicyCycleMode) advanceSpicyCycle();
      setShowFeedback(true);

      if (logResponse) {
        await logResponse({
          questionId: currentQuestion.id,
          skillId: currentQuestion.skillId || '',
          domainIds: currentQuestion.domains || [],
          assessmentType: 'practice',
          sessionId,
          isCorrect,
          confidence,
          timeSpent,
          timestamp: Date.now(),
          selectedAnswers,
          correctAnswers: correctList,
        });
      }

      if (updateLastSession) {
        await updateLastSession(sessionId, 'practice', questionHistory.length, 0);
      }

      // Only count toward skill score if the user did NOT open a hint for this question.
      // Hint-used answers keep the adaptive data clean — seeing the answer before guessing
      // would inflate accuracy and corrupt the skill priority signal.
      const wasHintUsed = hintUsedIds.has(currentQuestion.id);
      if (currentQuestion.skillId && updateSkillProgress && !wasHintUsed) {
        await updateSkillProgress(currentQuestion.skillId, isCorrect, confidence, currentQuestion.id, timeSpent);
      }

      // Close any open hint panel when advancing
      setHintOpenForQuestion(null);
    } catch (error) {
      console.error('[PracticeSession] Failed to submit answer:', error);
      setCurrentDistractorNote('We hit an error while processing this answer. Your session is still active, so try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!currentQuestion) {
    if (analyzedQuestions.length === 0) {
      return (
        <div className="editorial-surface mx-auto max-w-md p-12 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-amber-50">
            <Zap className="h-8 w-8 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No Questions Found</h3>
            <p className="mt-2 text-slate-500">We couldn&apos;t find any questions matching your filters. Try choosing a different domain or skill.</p>
          </div>
          <button
            onClick={onExitPractice}
            className="editorial-button-secondary w-full"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      );
    }
    return <div className="p-8 text-center text-slate-500">Finding relevant questions...</div>;
  }

  // ── Context derived from the current question ────────────────────────────────
  const contextDomainId = currentQuestion.domains?.[0] ?? practiceDomain ?? null;
  const domainInfo = contextDomainId != null ? getProgressDomainDefinition(contextDomainId) : null;
  const contextSkillId = currentQuestion.skillId ?? practiceSkillId ?? null;
  const skillInfo = contextSkillId ? getSkillById(contextSkillId) : null;

  const pctColor =
    allTimePct === null ? '' :
    allTimePct >= 80 ? 'text-emerald-700' :
    allTimePct >= 60 ? 'text-amber-700' :
    'text-rose-600';

  // Retirement progress for this pool (shown as a subtle pill when first pass is done)
  const retiredCount = firstPassComplete
    ? analyzedQuestions.filter(q => retireMap[q.id]?.retired === true).length
    : 0;
  const totalPool = analyzedQuestions.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Session Header ────────────────────────────────────────────────────── */}
      <div className="editorial-surface flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-700" />
            <span className="text-sm font-semibold text-slate-700">
              {practiceSkillId ? `Skill Practice` : practiceDomain ? 'Domain Review' : 'Practice'}
            </span>
          </div>

          {/* Correct / Wrong / Overconfident — hidden in spicy new-user mode */}
          {!hideSummary && (
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="text-emerald-700">Correct: {sessionStats.correct}</span>
              <span className="text-rose-600">Wrong: {sessionStats.wrong}</span>
              {sessionStats.highConfidenceWrong > 0 && (
                <span
                  className="text-amber-700"
                  title={`Answered wrong despite selecting ${getConfidenceDisplayLabel('high')} - worth extra review`}
                >
                  Overconfident: {sessionStats.highConfidenceWrong}
                </span>
              )}
            </div>
          )}

          {/* Spicy mode indicator */}
          {spicyCycleMode && (
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <Flame className="h-3.5 w-3.5" />
              <span className="font-medium">Skill {(spicyCycleIndex % spicySkillIds.length) + 1} of {spicySkillIds.length}</span>
            </div>
          )}

          {/* All-time cumulative % — hidden in hideSummary mode */}
          {!hideSummary && allTimePct !== null && (
            <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-4 sm:flex">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">All-time</span>
              <span className={`text-sm font-bold ${pctColor}`}>{allTimePct}%</span>
            </div>
          )}

          {/* Retirement progress pill — only after first pass */}
          {firstPassComplete && retiredCount > 0 && (
            <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-4 sm:flex">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Retired</span>
              <span className="text-xs font-semibold text-slate-500">{retiredCount}/{totalPool}</span>
            </div>
          )}
        </div>

        {/* Right side: Hint + Help (skill practice only) + Exit */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hint button — available on any question with a module snippet, before submitting */}
          {!showFeedback && currentQuestion?.primarySnippet && (
            <button
              onClick={() => {
                if (!currentQuestion) return;
                const qid = currentQuestion.id;
                setHintOpenForQuestion(prev => prev === qid ? null : qid);
                // Mark hint used as soon as panel opens — this is intentional and irreversible
                setHintUsedIds(prev => new Set(prev).add(qid));
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                hintOpenForQuestion === currentQuestion?.id
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : 'border-transparent text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700'
              }`}
              title="Open module hint — answer won't count toward score"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Hint</span>
              {hintUsedIds.has(currentQuestion?.id ?? '') && (
                <span className="ml-0.5 text-[10px] text-amber-600">(used)</span>
              )}
            </button>
          )}

          {/* Help button — opens SkillHelpDrawer when in skill practice mode */}
          {practiceSkillId && (
            <button
              onClick={() => setHelpDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              title="Open skill lesson for help"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Help</span>
            </button>
          )}

          {/* Exit button — "← Skills" for skill practice, Home icon otherwise */}
          <button
            onClick={onExitPractice}
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-200 hover:bg-[#fbfaf7] hover:text-slate-900"
            title={practiceSkillId ? 'Back to Skills' : 'Exit Practice'}
          >
            {practiceSkillId ? (
              <>
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Skills</span>
              </>
            ) : (
              <Home className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Skill Help Drawer ─────────────────────────────────────────────────── */}
      {practiceSkillId && (
        <SkillHelpDrawer
          skillId={practiceSkillId}
          skillLabel={skillLabel}
          isOpen={helpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
          userId={user?.id ?? null}
        />
      )}

      {/* ── Pool Reset Notice ────────────────────────────────────────────────── */}
      {poolResetMessage && (
        <div className="animate-in slide-in-from-top-2 flex items-center gap-2.5 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-3 duration-300">
          <RotateCcw className="h-4 w-4 flex-shrink-0 text-sky-600" />
          <span className="text-sm text-sky-800">
            You've worked through all available questions in this skill. Restarting the pool for continued practice.
          </span>
        </div>
      )}

      {/* ── Struggling Skill Alert ───────────────────────────────────────────── */}
      {(() => {
        if (!currentQuestion?.skillId) return null;
        const alertSkillId = currentQuestion.skillId;
        if (dismissedSkillAlerts.has(alertSkillId)) return null;
        const skillScore = userProfile.skillScores?.[alertSkillId];
        if (!skillScore || skillScore.attempts < 3 || (skillScore.score ?? 1) >= 0.6) return null;
        const alertModuleId = currentQuestion.primaryModuleId;
        const alertModuleTitle =
          currentQuestion.moduleRefs?.find(r => r.moduleId === alertModuleId)?.moduleTitle ??
          alertModuleId;
        const alertSkillDef = getProgressSkillDefinition(alertSkillId);
        return (
          <div className="animate-in slide-in-from-top-2 flex items-start gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 duration-300">
            <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-900">This skill needs more attention</p>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-700">
                You've answered{' '}
                <span className="font-semibold">{alertSkillDef?.fullLabel ?? alertSkillId}</span>{' '}
                questions incorrectly multiple times.
                {alertModuleId && (
                  <> Review the <span className="font-semibold">{alertModuleTitle ?? alertModuleId}</span> module to strengthen this area.</>
                )}
              </p>
            </div>
            <button
              onClick={() => setDismissedSkillAlerts(prev => new Set(prev).add(alertSkillId))}
              className="flex-shrink-0 rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
              title="Dismiss alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })()}

      {/* ── Streak Banner ────────────────────────────────────────────────────── */}
      {streakMessage && consecutiveCorrect >= 2 && (
        <div
          key={streakMessage}
          className="animate-in slide-in-from-top-2 flex items-center gap-2.5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 duration-300"
        >
          <Flame className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">{streakMessage}</span>
          <span className="ml-auto text-xs font-medium text-amber-700">{consecutiveCorrect} in a row</span>
        </div>
      )}

      {/* ── Practice Context Box — always shows Domain + Skill ───────────────── */}
      {(domainInfo || skillInfo) && (
        <div className="editorial-surface-soft space-y-4 p-5">
          {domainInfo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Domain</p>
                <span className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {contextDomainId}
                </span>
              </div>
              <h3 className="text-base font-bold leading-snug text-slate-900">{domainInfo.name}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{domainInfo.subtitle}</p>
            </div>
          )}
          {domainInfo && skillInfo && <div className="border-t border-slate-200" />}
          {skillInfo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Skill</p>
                <span className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {contextSkillId}
                </span>
              </div>
              <h3 className="text-base font-bold leading-snug text-slate-900">{skillInfo.name}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{skillInfo.description}</p>
              {skillInfo.decisionRule && (
                <p className="text-xs leading-relaxed text-slate-500">
                  What it looks like in answers:{' '}
                  <span className="text-slate-700">{skillInfo.decisionRule}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Question Card ────────────────────────────────────────────────────── */}
      <QuestionCard
        question={(() => {
          const qCopy = { ...currentQuestion };
          if (qCopy.options && shuffledOrder.length > 0) {
            const map = new Map(qCopy.options.map(o => [o.letter, o]));
            qCopy.options = shuffledOrder.map(l => map.get(l)!).filter(Boolean);
          } else if (qCopy.choices && shuffledOrder.length > 0) {
            const newChoices: Record<string, string> = {};
            shuffledOrder.forEach(l => { if (qCopy.choices![l]) newChoices[l] = qCopy.choices![l]; });
            qCopy.choices = newChoices;
          }
          return qCopy as AnalyzedQuestion;
        })()}
        selectedAnswers={selectedAnswers}
        onSelectAnswer={(letter) => {
          if (showFeedback) return;
          const max = getQuestionCorrectAnswers(currentQuestion).length || 1;
          setSelectedAnswers(prev => {
            if (prev.includes(letter)) return prev.filter(a => a !== letter);
            if (prev.length < max) return [...prev, letter];
            return prev;
          });
          recordInteraction();
        }}
        onSubmit={submitAnswer}
        isSubmitting={isSubmitting}
        onNext={loadNextQuestion}
        confidence={confidence}
        onConfidenceChange={setConfidence}
        disabled={isPaused}
        showFeedback={showFeedback}
        assessmentType="practice"
      />

      {/* ── Hint Panel (before submitting) ──────────────────────────────────── */}
      {!showFeedback && hintOpenForQuestion === currentQuestion.id && currentQuestion.primarySnippet && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <ModuleSnippetCard
            snippet={currentQuestion.primarySnippet}
            moduleTitle={(currentQuestion.moduleRefs?.find(r => r.moduleId === currentQuestion.primaryModuleId)?.moduleTitle) ?? currentQuestion.primaryModuleId ?? null}
            moduleId={currentQuestion.primaryModuleId ?? null}
            moduleRefs={currentQuestion.moduleRefs}
            mode="hint"
            onDismiss={() => setHintOpenForQuestion(null)}
            onOpenModule={(_mid) => {
              // Open the full module in the skill help drawer if available,
              // otherwise just close the hint (module navigation is handled by the app shell)
              setHelpDrawerOpen(true);
            }}
          />
        </div>
      )}

      {/* ── Feedback Area ────────────────────────────────────────────────────── */}
      {showFeedback && (() => {
        const isCorrect =
          selectedAnswers.every(a => (currentQuestion.correct_answer || []).includes(a)) &&
          selectedAnswers.length === (currentQuestion.correct_answer || []).length;
        const wasHintUsed = hintUsedIds.has(currentQuestion.id);
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hint-used notice */}
            {wasHintUsed && (
              <div className="flex items-center gap-2.5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3">
                <Lightbulb className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Hint was used — this answer was not counted toward your score.
                </span>
              </div>
            )}

            <ExplanationPanel
              question={currentQuestion}
              userAnswer={selectedAnswers}
              isCorrect={isCorrect}
              rationale={currentQuestion.rationale || ''}
              userProfile={userProfile}
              distractorNote={currentDistractorNote ?? undefined}
            />

            {/* Module snippet card — shown after wrong answers (or hint-used) when snippet exists */}
            {(!isCorrect || wasHintUsed) && currentQuestion.primarySnippet && (
              <ModuleSnippetCard
                snippet={currentQuestion.primarySnippet}
                moduleTitle={(currentQuestion.moduleRefs?.find(r => r.moduleId === currentQuestion.primaryModuleId)?.moduleTitle) ?? currentQuestion.primaryModuleId ?? null}
                moduleId={currentQuestion.primaryModuleId ?? null}
                moduleRefs={currentQuestion.moduleRefs}
                mode="feedback"
                onOpenModule={(_mid) => setHelpDrawerOpen(true)}
              />
            )}

            <div className="editorial-surface-soft rounded-[1.5rem] border px-4 py-4 text-center">
              <p className="text-sm italic text-slate-500">You will see this feedback again in your report</p>
            </div>
          </div>
        );
      })()}

      {/* ── Pause Overlay ────────────────────────────────────────────────────── */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-md">
          <div className="mx-4 max-w-sm space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl">
            <Pause className="mx-auto h-12 w-12 text-amber-700" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">Session Paused</h3>
              <p className="mt-2 text-sm text-slate-500">Your progress is safely stored. Resume when you&apos;re ready.</p>
            </div>
            <button
              onClick={resume}
              className="editorial-button-primary w-full"
            >
              Resume Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
