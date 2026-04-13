import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import QuestionCard from './QuestionCard';
import { UserResponse } from '../brain/weakness-detector';
import { clearSession } from '../utils/sessionStorage';
import { deleteUserSession, loadUserSession, saveUserSession, UserSession } from '../utils/userSessionStorage';

const TutorialWalkthrough = lazy(() => import('./TutorialWalkthrough'));
import {
  AnalyzedQuestion,
  getQuestionChoiceText,
  getQuestionCorrectAnswers
} from '../brain/question-analyzer';
import { matchDistractorPattern } from '../brain/distractor-matcher';
import { useEngine } from '../hooks/useEngine';
import { useElapsedTimer } from '../hooks/useElapsedTimer';
import type { SessionMode } from '../types/assessment';
import type { SkillId } from '../brain/skill-map';

interface AdaptiveDiagnosticProps {
  initialQueue: AnalyzedQuestion[];
  followUpPool: Record<string, AnalyzedQuestion[]>;
  onComplete: (responses: UserResponse[]) => void;
  onPauseExit: () => void;
  sessionId?: string;
  currentUserName?: string | null;
  logResponse?: (response: {
    questionId: string;
    skillId?: string;
    domainIds?: number[];
    assessmentType: 'adaptive';
    sessionId: string;
    isCorrect: boolean;
    confidence: 'low' | 'medium' | 'high';
    timeSpent: number;
    time_on_item_seconds?: number;
    timestamp: number;
    selectedAnswers: string[];
    correctAnswers: string[];
    distractorPatternId?: string;
    is_followup?: boolean;
    cognitive_complexity?: string;
    skill_question_index?: number;
  }) => Promise<void>;
  updateSkillProgress?: (
    skillId: SkillId,
    isCorrect: boolean,
    confidence?: 'low' | 'medium' | 'high',
    questionId?: string,
    timeSpent?: number
  ) => Promise<void>;
  updateLastSession?: (sessionId: string, mode: SessionMode, questionIndex: number, elapsedSeconds?: number) => Promise<void>;
}

export default function AdaptiveDiagnostic({
  initialQueue,
  followUpPool: initialFollowUpPool,
  onComplete,
  onPauseExit,
  sessionId,
  currentUserName,
  logResponse,
  updateSkillProgress,
  updateLastSession
}: AdaptiveDiagnosticProps) {
  const engine = useEngine();

  // Attempt to resume a saved adaptive-diagnostic session.
  // Guard: a valid session must have at least as many question IDs as the fresh
  // initialQueue, OR the currentIndex must be > 0 (user already answered some).
  // This prevents a corrupted/truncated historical session from replacing the
  // correctly-built 45-question queue with only a handful of questions.
  const savedSession = sessionId ? loadUserSession(sessionId) : null;
  const isResuming = savedSession?.type === 'adaptive-diagnostic' &&
    savedSession.questionIds.length > 0 &&
    (savedSession.currentIndex > 0 || savedSession.questionIds.length >= initialQueue.length);

  // Dynamic queue: starts with initialQueue, grows when wrong answers trigger follow-ups
  const [queue, setQueue] = useState<AnalyzedQuestion[]>(() => {
    if (isResuming) {
      // Rebuild queue from saved questionIds
      const allQuestions = new Map<string, AnalyzedQuestion>();
      for (const q of initialQueue) allQuestions.set(q.id, q);
      for (const questions of Object.values(initialFollowUpPool)) {
        for (const q of questions) allQuestions.set(q.id, q);
      }
      return savedSession!.questionIds
        .map(id => allQuestions.get(id))
        .filter((q): q is AnalyzedQuestion => q !== undefined);
    }
    return [...initialQueue];
  });

  // Follow-up pool: mutable copy, keyed by skillId
  const [followUpPool, setFollowUpPool] = useState<Record<string, AnalyzedQuestion[]>>(() => {
    if (isResuming && savedSession!.followUpPoolRemaining) {
      // Rebuild from saved IDs
      const allQuestions = new Map<string, AnalyzedQuestion>();
      for (const questions of Object.values(initialFollowUpPool)) {
        for (const q of questions) allQuestions.set(q.id, q);
      }
      const restored: Record<string, AnalyzedQuestion[]> = {};
      for (const [skillId, ids] of Object.entries(savedSession!.followUpPoolRemaining)) {
        restored[skillId] = ids
          .map(id => allQuestions.get(id))
          .filter((q): q is AnalyzedQuestion => q !== undefined);
      }
      return restored;
    }
    // Deep copy so we can mutate
    const copy: Record<string, AnalyzedQuestion[]> = {};
    for (const [skillId, questions] of Object.entries(initialFollowUpPool)) {
      copy[skillId] = [...questions];
    }
    return copy;
  });

  // Track how many questions per skill (to enforce max 3)
  const [skillQuestionCount, setSkillQuestionCount] = useState<Record<string, number>>(() => {
    if (isResuming) {
      const counts: Record<string, number> = {};
      for (const q of queue) {
        if (!q.skillId) continue;
        // Count all questions in queue for this skill (answered or pending)
        counts[q.skillId] = (counts[q.skillId] || 0) + 1;
      }
      return counts;
    }
    // Initial: 1 per skill
    const counts: Record<string, number> = {};
    for (const q of initialQueue) {
      if (q.skillId) counts[q.skillId] = 1;
    }
    return counts;
  });

  // Track which question IDs are follow-ups (adaptive) vs initial queue
  const [followUpIds] = useState<Set<string>>(() => {
    if (isResuming) {
      const initialIds = new Set(initialQueue.map(q => q.id));
      return new Set(queue.filter(q => !initialIds.has(q.id)).map(q => q.id));
    }
    return new Set<string>();
  });

  const [currentIndex, setCurrentIndex] = useState(isResuming ? savedSession!.currentIndex : 0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(isResuming ? savedSession!.selectedAnswers : []);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(isResuming ? savedSession!.confidence : 'medium');
  const [startTime] = useState<number>(isResuming ? savedSession!.startTime : Date.now());
  const [responses, setResponses] = useState<UserResponse[]>(isResuming ? savedSession!.responses : []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show diagnostic tutorial on first-ever diagnostic (not on resume)
  const diagTutorialKey = sessionId ? `pmp-diagnostic-tutorial-seen-${sessionId.split('-')[0]}` : 'pmp-diagnostic-tutorial-seen';
  const [showDiagTutorial, setShowDiagTutorial] = useState(() => {
    if (isResuming) return false; // Don't show on resume
    try { return !localStorage.getItem(diagTutorialKey); } catch { return false; }
  });

  const currentQuestion = queue[currentIndex];
  const [isSubmitted, setIsSubmitted] = useState(
    isResuming && savedSession!.responses.some(r => r.questionId === currentQuestion?.id)
  );

  const {
    formattedTime,
    timerLabel,
    isPaused,
    showInactivityWarning,
    isAutoPaused,
    pause,
    resume,
    resetQuestionTimer,
    elapsedSeconds,
    recordInteraction
  } = useElapsedTimer({
    initialElapsedSeconds: savedSession?.elapsedSeconds || 0,
    onAutoPause: () => { /* auto-paused */ }
  });

  // Save session whenever state changes
  useEffect(() => {
    if (currentUserName && sessionId) {
      // Serialize follow-up pool as IDs
      const poolRemaining: Record<string, string[]> = {};
      for (const [skillId, questions] of Object.entries(followUpPool)) {
        if (questions.length > 0) {
          poolRemaining[skillId] = questions.map(q => q.id);
        }
      }

      const userSession: UserSession = {
        userName: currentUserName,
        sessionId,
        type: 'adaptive-diagnostic',
        assessmentFlow: 'adaptive-diagnostic',
        questionIds: queue.map(q => q.id),
        currentIndex,
        responses,
        selectedAnswers,
        showFeedback: false,
        confidence,
        startTime,
        lastUpdated: Date.now(),
        createdAt: Date.now(),
        elapsedSeconds,
        followUpPoolRemaining: poolRemaining,
      };
      saveUserSession(userSession);
    }
  }, [currentIndex, responses, selectedAnswers, confidence, startTime, queue, followUpPool, currentUserName, sessionId, elapsedSeconds]);

  // Save to Supabase on pause
  useEffect(() => {
    if (isPaused && updateLastSession && sessionId) {
      updateLastSession(sessionId, 'adaptive', currentIndex, elapsedSeconds);
    }
  }, [isPaused, updateLastSession, sessionId, currentIndex, elapsedSeconds]);

  // Cleanup on completion
  useEffect(() => {
    if (currentIndex >= queue.length && responses.length > 0 && currentIndex > 0) {
      if (currentUserName && sessionId) {
        deleteUserSession(currentUserName, sessionId);
      }
      clearSession();
    }
  }, [currentIndex, currentUserName, queue.length, responses.length, sessionId]);

  const pacingMessage = useMemo(() => {
    const targetSecPerQuest = 50; // ~50 sec target for adaptive diagnostic
    const expectedTime = (currentIndex + 1) * targetSecPerQuest;
    const diff = elapsedSeconds - expectedTime;

    if (diff < -90) return "Efficient pace - ahead of schedule.";
    if (diff > 90) return "Behind pace - try to move slightly faster.";
    return "On track - steady pacing maintained.";
  }, [currentIndex, elapsedSeconds]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  const handlePauseExit = useCallback(() => {
    // Save state before exiting
    if (updateLastSession && sessionId) {
      updateLastSession(sessionId, 'adaptive', currentIndex, elapsedSeconds);
    }
    onPauseExit();
  }, [updateLastSession, sessionId, currentIndex, elapsedSeconds, onPauseExit]);

  const toggleAnswer = (letter: string) => {
    if (isSubmitted) return;

    const correctList = currentQuestion ? getQuestionCorrectAnswers(currentQuestion) : [];
    const maxAnswers = correctList.length || 1;

    setSelectedAnswers((prev: string[]) => {
      if (prev.includes(letter)) return prev.filter(a => a !== letter);
      if (prev.length < maxAnswers) return [...prev, letter];
      return prev;
    });

    recordInteraction();
  };

  const submitAnswer = async () => {
    if (selectedAnswers.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const timeSpentOnQuestion = resetQuestionTimer();
      const timestamp = Date.now();
      const correctAnswersList = getQuestionCorrectAnswers(currentQuestion);
      const isCorrect =
        selectedAnswers.every(a => correctAnswersList.includes(a)) &&
        selectedAnswers.length === correctAnswersList.length;

      let distractorPatternId: string | undefined;
      let selectedDistractor: { letter: string; text: string; patternId?: string } | undefined;
      if (!isCorrect && selectedAnswers.length > 0) {
        const wrongAnswer = selectedAnswers.find(a => !correctAnswersList.includes(a));
        if (wrongAnswer) {
          try {
            const distractorText = getQuestionChoiceText(currentQuestion, wrongAnswer);
            const correctAnswerText = correctAnswersList
              .map(a => getQuestionChoiceText(currentQuestion, a))
              .join(' ');
            const patternId = matchDistractorPattern(distractorText, correctAnswerText, engine.distractorPatterns);
            selectedDistractor = { letter: wrongAnswer, text: distractorText, patternId: patternId || undefined };
            distractorPatternId = patternId || undefined;
          } catch (error) {
            console.error('[AdaptiveDiagnostic] Failed to analyze distractor:', error);
          }
        }
      }

      if (logResponse && sessionId) {
        const skillId = currentQuestion.skillId || '';
        await logResponse({
          questionId: currentQuestion.id,
          skillId,
          domainIds: currentQuestion.domains || [],
          assessmentType: 'adaptive',
          sessionId,
          isCorrect,
          confidence,
          timeSpent: timeSpentOnQuestion,
          time_on_item_seconds: timeSpentOnQuestion,
          timestamp,
          selectedAnswers,
          correctAnswers: correctAnswersList,
          distractorPatternId,
          is_followup: followUpIds.has(currentQuestion.id),
          cognitive_complexity: currentQuestion.cognitiveComplexity || undefined,
          skill_question_index: skillId ? (skillQuestionCount[skillId] || 1) : undefined
        });
      }

      if (updateLastSession && sessionId) {
        await updateLastSession(sessionId, 'adaptive', currentIndex, elapsedSeconds);
      }

      if (currentQuestion.skillId && updateSkillProgress) {
        await updateSkillProgress(currentQuestion.skillId, isCorrect, confidence, currentQuestion.id, timeSpentOnQuestion);
      }

      const response: UserResponse = {
        questionId: currentQuestion.id,
        selectedAnswers,
        correctAnswers: correctAnswersList,
        isCorrect,
        timeSpent: timeSpentOnQuestion,
        confidence,
        timestamp,
        selectedDistractor
      };

      const updatedResponses = [...responses, response];
      setResponses(updatedResponses);

      // ADAPTIVE LOGIC: if wrong, queue a follow-up for this skill
      if (!isCorrect && currentQuestion.skillId) {
        const skillId = currentQuestion.skillId;
        const count = skillQuestionCount[skillId] || 1;

        if (count < 3) {
          const pool = followUpPool[skillId];
          if (pool && pool.length > 0) {
            const followUp = pool[0];
            followUpIds.add(followUp.id); // Track as follow-up for audit
            const updatedPool = { ...followUpPool, [skillId]: pool.slice(1) };
            setFollowUpPool(updatedPool);
            setQueue(prev => [...prev, followUp]);
            setSkillQuestionCount(prev => ({ ...prev, [skillId]: count + 1 }));
          }
        }
      }

      nextQuestion(updatedResponses);
    } catch (error) {
      console.error('[AdaptiveDiagnostic] Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = (updatedResponses?: UserResponse[]) => {
    const nextIndex = currentIndex + 1;
    const currentResponses = updatedResponses || responses;

    if (nextIndex >= queue.length) {
      // Diagnostic complete
      if (currentUserName && sessionId) {
        deleteUserSession(currentUserName, sessionId);
      }
      clearSession();
      onComplete(currentResponses);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswers([]);
      setIsSubmitted(false);
      setConfidence('medium');
    }
    recordInteraction();
  };

  if (!currentQuestion) return null;

  // Estimate remaining: current queue length is the real count
  const totalInQueue = queue.length;
  const progress = ((currentIndex + 1) / totalInQueue) * 100;

  return (
    <div className="space-y-3">
      {/* Diagnostic Tutorial (shown once before first question) */}
      {showDiagTutorial && (
        <Suspense fallback={null}>
          <TutorialWalkthrough
            variant="diagnostic"
            onDismiss={() => {
              setShowDiagTutorial(false);
              try { localStorage.setItem(diagTutorialKey, '1'); } catch { /* storage unavailable */ }
            }}
          />
        </Suspense>
      )}
      {/* Resume Notice */}
      {isResuming && currentIndex > 0 && (
        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-3">
          <p className="text-sm text-sky-800">
            Resumed from question {currentIndex + 1}. Your progress has been saved.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Adaptive Diagnostic</span>
          <span>Question {currentIndex + 1}{totalInQueue > initialQueue.length ? ` of ~${totalInQueue}` : ` of ${totalInQueue}`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timer, Pause, and Pacing */}
      <div className="editorial-surface-soft flex items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{timerLabel}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span className="text-xl font-mono text-slate-900">{formattedTime}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Pacing</span>
            <span className="text-sm font-medium text-slate-700">{pacingMessage}</span>
          </div>
        </div>

        <button
          onClick={handlePauseToggle}
          className="editorial-button-secondary"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>

      {/* Inactivity Warning */}
      {showInactivityWarning && !isPaused && (
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 animate-pulse">
          <div className="rounded-xl bg-amber-100 p-2">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Still there? Your test will pause soon.</p>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm">
          <div className="mx-4 max-w-md space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-2xl">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fbfaf7]">
                <Pause className="w-10 h-10 text-amber-700" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                {isAutoPaused ? 'Session Paused' : 'Diagnostic Paused'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {isAutoPaused
                  ? 'Your session was paused due to inactivity. Resume when ready.'
                  : 'Your progress is saved. Resume any time, or head to the dashboard to practice.'}
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button
                onClick={resume}
                className="editorial-button-primary w-full justify-center px-6 py-4"
              >
                <Play className="w-5 h-5" />
                Resume Diagnostic
              </button>
              <button
                onClick={handlePauseExit}
                className="editorial-button-secondary w-full justify-center px-6 py-4"
              >
                Save & Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      {!isPaused && (
        <div className={isSubmitted ? "opacity-50 pointer-events-none" : ""}>
          <QuestionCard
            question={currentQuestion}
            selectedAnswers={selectedAnswers}
            onSelectAnswer={toggleAnswer}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            disabled={isSubmitted}
            isSubmitting={isSubmitting}
            showFeedback={false}
            assessmentType="adaptive"
            hideFooterControls={isSubmitted}
          />
        </div>
      )}
    </div>
  );
}
