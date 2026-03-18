import { useState, useEffect, useMemo, useRef } from 'react';
import { Zap, Pause, Home, Flame, ArrowLeft, RotateCcw } from 'lucide-react';
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
import type { SessionMode } from '../types/assessment';
import { getProgressDomainDefinition } from '../utils/progressTaxonomy';
import { getSkillById, type SkillId } from '../brain/skill-map';
import { useAuth } from '../contexts/AuthContext';

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
}: PracticeSessionProps) {
  const engine = useEngine();
  const { logout, user } = useAuth();
  const userId = user?.id ?? 'anon';

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
    onAutoPause: () => console.log('[PracticeSession] Auto-paused'),
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
  const activePool = useMemo(() => {
    if (!firstPassComplete) return analyzedQuestions;
    const active = analyzedQuestions.filter(q => !retireMap[q.id]?.retired);
    // Fall back to full pool if all retired (pool reset effect handles the reset)
    return active.length > 0 ? active : analyzedQuestions;
  }, [analyzedQuestions, retireMap, firstPassComplete]);

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
              if (matched) distractorNote = matched.explanation;
            }
            if (!distractorNote) {
              const correctAnswerText = correctList.map(a => getQuestionChoiceText(currentQuestion, a)).join(' ');
              const patternId = matchDistractorPattern(distractorText, correctAnswerText, engine.distractorPatterns);
              const pattern = normalizeDistractorPatterns(engine.distractorPatterns).find(e => e.id === patternId);
              distractorNote = `You selected ${wrongAnswer}. This is a common confusion because ${pattern?.description || 'these concepts are often mixed up.'}`;
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

      if (currentQuestion.skillId && updateSkillProgress) {
        await updateSkillProgress(currentQuestion.skillId, isCorrect, confidence, currentQuestion.id, timeSpent);
      }
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
        <div className="max-w-md mx-auto p-12 bg-slate-800/50 border border-slate-700/50 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">No Questions Found</h3>
            <p className="text-slate-400 mt-2">We couldn't find any questions matching your filters. Try choosing a different domain or skill.</p>
          </div>
          <button
            onClick={onExitPractice}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      );
    }
    return <div className="p-8 text-center text-slate-400">Finding relevant questions...</div>;
  }

  // ── Context derived from the current question ────────────────────────────────
  const contextDomainId = currentQuestion.domains?.[0] ?? practiceDomain ?? null;
  const domainInfo = contextDomainId != null ? getProgressDomainDefinition(contextDomainId) : null;
  const contextSkillId = currentQuestion.skillId ?? practiceSkillId ?? null;
  const skillInfo = contextSkillId ? getSkillById(contextSkillId) : null;

  const pctColor =
    allTimePct === null ? '' :
    allTimePct >= 80 ? 'text-emerald-400' :
    allTimePct >= 60 ? 'text-amber-400' :
    'text-rose-400';

  // Retirement progress for this pool (shown as a subtle pill when first pass is done)
  const retiredCount = firstPassComplete
    ? analyzedQuestions.filter(q => retireMap[q.id]?.retired === true).length
    : 0;
  const totalPool = analyzedQuestions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Session Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-300">
              {practiceSkillId ? `Skill Practice` : practiceDomain ? 'Domain Review' : 'Practice'}
            </span>
          </div>

          {/* Correct / Wrong / Overconfident */}
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-emerald-400">Correct: {sessionStats.correct}</span>
            <span className="text-rose-400">Wrong: {sessionStats.wrong}</span>
            {sessionStats.highConfidenceWrong > 0 && (
              <span
                className="text-orange-400"
                title="Answered wrong despite selecting High confidence — worth extra review"
              >
                Overconfident: {sessionStats.highConfidenceWrong}
              </span>
            )}
          </div>

          {/* All-time cumulative % */}
          {allTimePct !== null && (
            <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">All-time</span>
              <span className={`text-sm font-bold ${pctColor}`}>{allTimePct}%</span>
            </div>
          )}

          {/* Retirement progress pill — only after first pass */}
          {firstPassComplete && retiredCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Retired</span>
              <span className="text-xs font-semibold text-slate-400">{retiredCount}/{totalPool}</span>
            </div>
          )}
        </div>

        {/* Exit button — "← Skills" for skill practice, Home icon otherwise */}
        <button
          onClick={onExitPractice}
          className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-sm flex-shrink-0"
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

      {/* ── Pool Reset Notice ────────────────────────────────────────────────── */}
      {poolResetMessage && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 animate-in fade-in slide-in-from-top-2 duration-300">
          <RotateCcw className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-blue-300">
            You've worked through all available questions in this skill. Restarting the pool for continued practice.
          </span>
        </div>
      )}

      {/* ── Streak Banner ────────────────────────────────────────────────────── */}
      {streakMessage && consecutiveCorrect >= 2 && (
        <div
          key={streakMessage}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-300">{streakMessage}</span>
          <span className="ml-auto text-xs text-amber-500/70 font-medium">{consecutiveCorrect} in a row</span>
        </div>
      )}

      {/* ── Practice Context Box — always shows Domain + Skill ───────────────── */}
      {(domainInfo || skillInfo) && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          {domainInfo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-wide font-bold text-slate-500">Domain</p>
                <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900/60 border border-slate-700/50 text-slate-400">
                  {contextDomainId}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 leading-snug">{domainInfo.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{domainInfo.subtitle}</p>
            </div>
          )}
          {domainInfo && skillInfo && <div className="border-t border-slate-700/40" />}
          {skillInfo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-wide font-bold text-slate-500">Skill</p>
                <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900/60 border border-slate-700/50 text-slate-400">
                  {contextSkillId}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 leading-snug">{skillInfo.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{skillInfo.description}</p>
              {skillInfo.decisionRule && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  What it looks like in answers:{' '}
                  <span className="text-slate-300">{skillInfo.decisionRule}</span>
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

      {/* ── Feedback Area ────────────────────────────────────────────────────── */}
      {showFeedback && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExplanationPanel
            question={currentQuestion}
            userAnswer={selectedAnswers}
            isCorrect={
              selectedAnswers.every(a => (currentQuestion.correct_answer || []).includes(a)) &&
              selectedAnswers.length === (currentQuestion.correct_answer || []).length
            }
            rationale={currentQuestion.rationale || ''}
            userProfile={userProfile}
          />
          {currentDistractorNote && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl">
              <h4 className="text-amber-500 font-bold mb-2 uppercase tracking-tight text-sm">Distractor Note</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{currentDistractorNote}</p>
            </div>
          )}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 text-center">
            <p className="text-sm text-slate-400 italic">You will see this feedback again in your report</p>
          </div>
        </div>
      )}

      {/* ── Pause Overlay ────────────────────────────────────────────────────── */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6 max-w-sm mx-4">
            <Pause className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-slate-100">Session Paused</h3>
              <p className="text-slate-400 mt-2 text-sm">Your progress is safely stored. Resume when you're ready.</p>
            </div>
            <button
              onClick={resume}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all"
            >
              Resume Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
