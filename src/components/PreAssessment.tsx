import { useState, useEffect } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import QuestionCard from './QuestionCard';
import ExplanationPanel from './ExplanationPanel';
import { UserResponse } from '../brain/weakness-detector';
import { saveSession, loadSession, clearSession, AssessmentSession } from '../utils/sessionStorage';
import { getCurrentUser, getCurrentSession, saveUserSession, UserSession } from '../utils/userSessionStorage';
import { matchDistractorPattern } from '../brain/distractor-matcher';

interface AnalyzedQuestion {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
  domains: number[];
  dok: number;
  questionType: 'Scenario-Based' | 'Direct Knowledge';
  stemType: string;
  keyConcepts: string[];
  isGenerated?: boolean;
}


interface PreAssessmentProps {
  questions: AnalyzedQuestion[];
  onComplete: (responses: UserResponse[]) => void;
  showTimer?: boolean;
  sessionId?: string;
  logResponse?: (response: {
    questionId: string;
    skillId?: string;
    domainId?: number;
    assessmentType: 'diagnostic' | 'full' | 'practice';
    sessionId: string;
    isCorrect: boolean;
    confidence: 'low' | 'medium' | 'high';
    timeSpent: number;
    timestamp: number;
    selectedAnswer?: string;
    distractorPatternId?: string;
  }) => Promise<void>;
  updateLastSession?: (sessionId: string, mode: 'practice' | 'full' | 'diagnostic', questionIndex: number) => Promise<void>;
}

export default function PreAssessment({
  questions,
  onComplete,
  showTimer = true,
  sessionId,
  logResponse,
  updateLastSession
}: PreAssessmentProps) {
  const currentUser = getCurrentUser();
  const userSession = currentUser && sessionId ? getCurrentSession(currentUser) : null;
  
  // Try to load saved session (prefer user session, fallback to old system)
  const savedSession = userSession || loadSession();
  const isResuming = savedSession?.type === 'pre-assessment' && 
    savedSession.questionIds.length === questions.length &&
    savedSession.questionIds.every((id, idx) => questions[idx]?.id === id);

  const [currentIndex, setCurrentIndex] = useState(isResuming ? savedSession!.currentIndex : 0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(isResuming ? savedSession!.selectedAnswers : []);
  const [showFeedback, setShowFeedback] = useState(isResuming ? savedSession!.showFeedback : false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(isResuming ? savedSession!.confidence : 'medium');
  const [startTime, setStartTime] = useState<number>(isResuming ? savedSession!.startTime : Date.now());
  const [responses, setResponses] = useState<UserResponse[]>(isResuming ? savedSession!.responses : []);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimerState, setShowTimerState] = useState(false); // Default OFF, tracking still happens
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(isResuming ? (savedSession as any).totalPausedTime || 0 : 0);

  const currentQuestion = questions[currentIndex];

  // Save session whenever state changes (store IDs and timestamps only, no full objects)
  useEffect(() => {
    if (currentUser && sessionId) {
      // Save to user session system
      const userSession: UserSession = {
        userName: currentUser,
        sessionId: sessionId,
        type: 'pre-assessment',
        questionIds: questions.map(q => q.id),
        currentIndex,
        responses,
        selectedAnswers,
        showFeedback,
        confidence,
        startTime,
        lastUpdated: Date.now(),
        createdAt: Date.now()
      };
      saveUserSession(userSession);
    } else {
      // Fallback to old session system
      const session: AssessmentSession = {
        type: 'pre-assessment',
        questionIds: questions.map(q => q.id),
        currentIndex,
        responses,
        selectedAnswers,
        showFeedback,
        confidence,
        startTime,
        lastUpdated: Date.now()
      };
      saveSession(session);
    }
  }, [currentIndex, responses, selectedAnswers, showFeedback, confidence, startTime, questions, currentUser, sessionId, isPaused, totalPausedTime]);

  // Clear session when assessment is complete
  useEffect(() => {
    if (currentIndex >= questions.length && responses.length === questions.length) {
      clearSession();
    }
  }, [currentIndex, questions.length, responses.length]);

  // Timer effect - compute elapsed time (not tick-based)
  useEffect(() => {
    if (!showFeedback && currentQuestion && !isPaused) {
      const interval = setInterval(() => {
        // Compute elapsed time: (now - startTime) - totalPausedTime
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000) - totalPausedTime;
        setElapsedTime(Math.max(0, elapsed));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showFeedback, startTime, currentQuestion, isPaused, totalPausedTime]);
  
  // Handle pause/resume
  const handlePause = () => {
    if (!isPaused) {
      setIsPaused(true);
      setPauseStartTime(Date.now());
    } else {
      // Resume: calculate pause duration and add to total
      if (pauseStartTime) {
        const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
        setTotalPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
      setIsPaused(false);
    }
  };

  const toggleAnswer = (letter: string) => {
    if (showFeedback) return;
    
    const maxAnswers = currentQuestion?.correct_answer.length || 1;
    
    setSelectedAnswers(prev => {
      if (prev.includes(letter)) {
        return prev.filter(a => a !== letter);
      }
      if (prev.length < maxAnswers) {
        return [...prev, letter];
      }
      return prev;
    });
  };

  const submitAnswer = async () => {
    if (selectedAnswers.length === 0) return;

    // Calculate time spent: (now - startTime) - totalPausedTime
    const now = Date.now();
    const timeSpent = Math.max(0, Math.floor((now - startTime) / 1000) - totalPausedTime);
    const timestamp = now;
    const isCorrect = 
      selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
      selectedAnswers.length === currentQuestion.correct_answer.length;

    // Track selected distractor if answer is wrong
    let selectedDistractor: { letter: string; text: string; patternId?: string } | undefined;
    let distractorPatternId: string | undefined;
    if (!isCorrect && selectedAnswers.length > 0) {
      // Find the first wrong answer (distractor)
      const wrongAnswer = selectedAnswers.find(a => !currentQuestion.correct_answer.includes(a));
      if (wrongAnswer) {
        const distractorText = currentQuestion.choices[wrongAnswer] || '';
        const correctAnswerText = currentQuestion.correct_answer
          .map(a => currentQuestion.choices[a])
          .join(' ') || '';
        const patternId = matchDistractorPattern(distractorText, correctAnswerText);
        
        selectedDistractor = {
          letter: wrongAnswer,
          text: distractorText,
          patternId: patternId || undefined
        };
        distractorPatternId = patternId || undefined;
      }
    }

    // Log response to Firestore subcollection (source of truth)
    if (logResponse && sessionId) {
      await logResponse({
        questionId: currentQuestion.id,
        skillId: currentQuestion.skillId,
        domainId: currentQuestion.domains[0],
        assessmentType: 'diagnostic',
        sessionId,
        isCorrect,
        confidence,
        timeSpent,
        timestamp,
        selectedAnswer: selectedAnswers[0],
        distractorPatternId
      });
    }

    // Update lastSession pointer
    if (updateLastSession && sessionId) {
      await updateLastSession(sessionId, 'diagnostic', currentIndex);
    }

    const response: UserResponse = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      confidence,
      timestamp,
      selectedDistractor
    };

    setResponses(prev => [...prev, response]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Pre-assessment complete
      clearSession();
      onComplete(responses);
    } else {
      setCurrentIndex(nextIndex);
      setStartTime(Date.now());
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
      setElapsedTime(0);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Resume Notice */}
      {isResuming && currentIndex > 0 && (
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-300">
            📍 Resumed from question {currentIndex + 1}. Your progress has been saved.
          </p>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Pre-Assessment</span>
          <span>{currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Timer Toggle, Pause Button, and Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimerState(!showTimerState)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <Clock className={`w-4 h-4 ${showTimerState ? 'text-amber-400' : ''}`} />
            <span>{showTimerState ? 'Hide Timer' : 'Show Timer'}</span>
          </button>
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
        {showTimerState && (
          <div className="text-sm text-slate-400">
            Time: <span className="text-slate-300 font-mono">{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-6 max-w-md mx-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
                <Pause className="w-8 h-8 text-slate-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Assessment Paused</h3>
              <p className="text-slate-400">Take your time. Your progress is saved.</p>
            </div>
            <button
              onClick={handlePause}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Resume Assessment
            </button>
          </div>
        </div>
      )}

      {/* Question Card */}
      {!isPaused && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswers={selectedAnswers}
          onSelectAnswer={toggleAnswer}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          disabled={false}
          showFeedback={showFeedback}
          assessmentType="pre"
        />
      )}

      {/* Feedback Panel */}
      {showFeedback && !isPaused && (
        <ExplanationPanel
          question={currentQuestion}
          userAnswer={selectedAnswers}
          isCorrect={
            selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
            selectedAnswers.length === currentQuestion.correct_answer.length
          }
          rationale={currentQuestion.rationale}
        />
      )}
    </div>
  );
}
