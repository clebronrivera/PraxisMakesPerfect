import { useState, useEffect, useMemo, useRef } from 'react';
import { Zap, Pause, Home, Flame } from 'lucide-react';
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

// ─── Streak message pools ────────────────────────────────────────────────────

const STREAK_TIERS: Array<{ min: number; pool: string[] }> = [
  {
    min: 10,
    pool: [
      'You are farming points now.',
      'At this point, it is personal.',
      'At this point, you are just showing off.',
    ],
  },
  {
    min: 8,
    pool: ['Praxis is in trouble.', 'Praxis catching a beating.'],
  },
  {
    min: 7,
    pool: ['Absolutely shameless.', 'Different level right now.'],
  },
  {
    min: 6,
    pool: ['This is getting disrespectful.', 'This streak is getting loud.'],
  },
  {
    min: 5,
    pool: ['You are locked in.', 'You are kind of cooking right now.'],
  },
  {
    min: 4,
    pool: ['That was clean.', 'That was not luck.'],
  },
  {
    min: 3,
    pool: ['Okay, now we are cooking.', 'Okay streak, I see you.', 'On a little run now.'],
  },
  {
    min: 2,
    pool: ['Nice. Keep it going.', 'Nice. Momentum started.'],
  },
];

/** Pick a random phrase from the correct tier, avoiding immediate repetition. */
function pickStreakMessage(streak: number, lastPhrase: string | null): string | null {
  const tier = STREAK_TIERS.find((t) => streak >= t.min);
  if (!tier) return null;
  const pool =
    tier.pool.length > 1 ? tier.pool.filter((p) => p !== lastPhrase) : tier.pool;
  return pool[Math.floor(Math.random() * pool.length)];
}

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

// ─── Component ───────────────────────────────────────────────────────────────

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
  const { logout } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<AnalyzedQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, highConfidenceWrong: 0 });
  const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);
  const [currentDistractorNote, setCurrentDistractorNote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Streak state ────────────────────────────────────────────────────────────
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const lastStreakPhraseRef = useRef<string | null>(null);

  // ── All-time cumulative accuracy ────────────────────────────────────────────
  const allTimePct = useMemo(() => {
    const totals = Object.values(userProfile.domainScores ?? {}).reduce(
      (acc, d) => ({ correct: acc.correct + (d?.correct ?? 0), total: acc.total + (d?.total ?? 0) }),
      { correct: 0, total: 0 }
    );
    return totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : null;
  }, [userProfile.domainScores]);

  const {
    formattedTime,
    timerLabel,
    isPaused,
    resume,
    resetQuestionTimer,
    recordInteraction
  } = useElapsedTimer({
    onAutoPause: () => console.log('[PracticeSession] Auto-paused')
  });

  // Unique session ID for this practice run - persistent across refreshes
  const [sessionId] = useState<string>(() => {
    if (userProfile.lastSession?.mode === 'practice') {
      return userProfile.lastSession.sessionId;
    }
    return `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  // ── Inactivity auto-logout ──────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void logout();
      }, INACTIVITY_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    activityEvents.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start the clock immediately

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [logout]);

  // Load session stats from localStorage on mount if resuming same session
  useEffect(() => {
    const saved = localStorage.getItem(`practice-stats-${sessionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessionStats(parsed.stats || { correct: 0, wrong: 0, highConfidenceWrong: 0 });
        setQuestionHistory(parsed.history || []);
      } catch (e) {
        console.error('Error loading practice stats:', e);
      }
    }
  }, [sessionId]);

  // Save session stats to localStorage
  useEffect(() => {
    localStorage.setItem(`practice-stats-${sessionId}`, JSON.stringify({
      stats: sessionStats,
      history: questionHistory
    }));
  }, [sessionId, sessionStats, questionHistory]);

  // Initialize with first question
  useEffect(() => {
    if (!currentQuestion && analyzedQuestions.length > 0) {
      const next = selectNextQuestion(userProfile, analyzedQuestions, questionHistory);
      if (next) {
        setCurrentQuestion(next);
        const letters = next.options ? next.options.map(o => o.letter) : Object.keys(next.choices || {});
        const shuffled = [...letters].sort(() => Math.random() - 0.5);
        setShuffledOrder(shuffled);
      }
    }
  }, [analyzedQuestions]);

  const loadNextQuestion = () => {
    const next = selectNextQuestion(userProfile, analyzedQuestions, questionHistory);
    if (next) {
      setCurrentQuestion(next);
      const letters = next.options ? next.options.map(o => o.letter) : Object.keys(next.choices || {});
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      setShuffledOrder(shuffled);
      setCurrentDistractorNote(null);
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswers.length === 0 || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const timeSpent = resetQuestionTimer();
      const correctList = getQuestionCorrectAnswers(currentQuestion);
      const isCorrect =
        selectedAnswers.every(a => correctList.includes(a)) &&
        selectedAnswers.length === correctList.length;

      if (isCorrect) {
        setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));

        // ── Streak logic ──────────────────────────────────────────────────────
        setConsecutiveCorrect(prev => {
          const newStreak = prev + 1;
          const phrase = pickStreakMessage(newStreak, lastStreakPhraseRef.current);
          if (phrase) {
            lastStreakPhraseRef.current = phrase;
            setStreakMessage(phrase);
          }
          return newStreak;
        });
      } else {
        setSessionStats(prev => ({
          ...prev,
          wrong: prev.wrong + 1,
          highConfidenceWrong: prev.highConfidenceWrong + (confidence === 'high' ? 1 : 0)
        }));

        // Reset streak on wrong answer
        setConsecutiveCorrect(0);
        setStreakMessage(null);
        lastStreakPhraseRef.current = null;

        const wrongAnswer = selectedAnswers.find(a => !correctList.includes(a));
        if (wrongAnswer) {
          try {
            const distractorText = getQuestionChoiceText(currentQuestion, wrongAnswer);
            let distractorNote = null;

            // 1. Check for structured distractor explanation (generated items)
            if (currentQuestion.distractors && currentQuestion.distractors.length > 0) {
              const matchedDistractor = currentQuestion.distractors.find(d => d.text === distractorText);
              if (matchedDistractor) {
                distractorNote = matchedDistractor.explanation;
              }
            }

            // 2. Fallback to generic pattern matching
            if (!distractorNote) {
              const correctAnswerText = correctList.map(a => getQuestionChoiceText(currentQuestion, a)).join(' ');
              const patternId = matchDistractorPattern(distractorText, correctAnswerText, engine.distractorPatterns);
              const pattern = normalizeDistractorPatterns(engine.distractorPatterns).find((entry) => entry.id === patternId);
              distractorNote = `You selected ${wrongAnswer}. This is a common confusion because ${pattern?.description || 'these concepts are often mixed up.'}`;
            }

            setCurrentDistractorNote(distractorNote);
          } catch (error) {
            console.error('[PracticeSession] Failed to build distractor note:', error);
            setCurrentDistractorNote('This distractor could not be analyzed, but your response was recorded.');
          }
        }
      }

      if (savePracticeResponse) {
        await savePracticeResponse(
          sessionId,
          currentQuestion.id,
          {
            skill_id: currentQuestion.skillId || '',
            domain_id: (currentQuestion.domains && currentQuestion.domains.length > 0) ? currentQuestion.domains[0] : 0,
            selected_answer: selectedAnswers.join(','),
            correct_answer: correctList.join(','),
            is_correct: isCorrect,
            confidence,
            time_on_item_seconds: timeSpent,
            shuffled_order: shuffledOrder
          }
        );
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
          correctAnswers: correctList
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

  const handleNext = () => {
    loadNextQuestion();
  };

  if (!currentQuestion) {
    if (analyzedQuestions.length === 0) {
      return (
        <div className="max-w-md mx-auto p-12 bg-slate-800/50 border border-slate-700/50 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">No Questions Found</h3>
            <p className="text-slate-400 mt-2">We couldn't find any questions matching your current filters or progress. Try choosing a different domain or resetting your progress.</p>
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

  // Always derive context from the CURRENT QUESTION so domain + skill are shown
  // regardless of which filter (domain, skill, or none) launched this session.
  const contextDomainId = currentQuestion.domains?.[0] ?? practiceDomain ?? null;
  const domainInfo = contextDomainId != null ? getProgressDomainDefinition(contextDomainId) : null;
  const contextSkillId = currentQuestion.skillId ?? practiceSkillId ?? null;
  const skillInfo = contextSkillId ? getSkillById(contextSkillId) : null;

  // Accuracy % color
  const pctColor =
    allTimePct === null ? ''
    : allTimePct >= 80 ? 'text-emerald-400'
    : allTimePct >= 60 ? 'text-amber-400'
    : 'text-rose-400';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Session Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-300">
              {practiceSkillId ? `Skill Review: ${practiceSkillId}` : practiceDomain ? 'Domain Review' : 'Practice Session'}
            </span>
          </div>

          {/* Session correct / wrong counts */}
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-emerald-400">Correct: {sessionStats.correct}</span>
            <span className="text-rose-400">Wrong: {sessionStats.wrong}</span>
            {sessionStats.highConfidenceWrong > 0 && (
              <span className="text-orange-400">HW: {sessionStats.highConfidenceWrong}</span>
            )}
          </div>

          {/* All-time cumulative accuracy — visible once at least 1 question answered */}
          {allTimePct !== null && (
            <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">All-time</span>
              <span className={`text-sm font-bold ${pctColor}`}>{allTimePct}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{timerLabel}</span>
            <span className="text-sm font-mono text-slate-300">{formattedTime}</span>
          </div>
          <button
            onClick={onExitPractice}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            title="Exit Practice"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Streak Banner ───────────────────────────────────────────────────── */}
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

      {/* ── Practice Context Box — always shows Domain + Skill ─────────────── */}
      {(domainInfo || skillInfo) && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4">
          {/* Domain row */}
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

          {/* Divider only when both sections present */}
          {domainInfo && skillInfo && (
            <div className="border-t border-slate-700/40" />
          )}

          {/* Skill row */}
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

      {/* ── Main Question view ──────────────────────────────────────────────── */}
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
        onNext={handleNext}
        confidence={confidence}
        onConfidenceChange={setConfidence}
        disabled={isPaused}
        showFeedback={showFeedback}
        assessmentType="practice"
      />

      {/* ── Feedback Area ───────────────────────────────────────────────────── */}
      {showFeedback && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExplanationPanel
            question={currentQuestion}
            userAnswer={selectedAnswers}
            isCorrect={selectedAnswers.every(a => (currentQuestion.correct_answer || []).includes(a)) && selectedAnswers.length === (currentQuestion.correct_answer || []).length}
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

      {/* ── Pause Overlay ───────────────────────────────────────────────────── */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6 max-w-sm mx-4">
            <Pause className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-slate-100">Session Paused</h3>
              <p className="text-slate-400 mt-2 text-sm">Your progress is safely stored. Resume when you're ready.</p>
            </div>
            <button onClick={resume} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all">
              Resume Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
