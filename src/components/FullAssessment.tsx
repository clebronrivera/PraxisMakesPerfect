import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
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

interface FullAssessmentProps {
  questions: AnalyzedQuestion[];
  onComplete: (responses: UserResponse[]) => void;
  showTimer?: boolean;
  sessionId?: string;
}

export default function FullAssessment({
  questions,
  onComplete,
  showTimer = true,
  sessionId
}: FullAssessmentProps) {
  const currentUser = getCurrentUser();
  const userSession = currentUser && sessionId ? getCurrentSession(currentUser) : null;
  
  // Try to load saved session (prefer user session, fallback to old system)
  const savedSession = userSession || loadSession();
  const isResuming = savedSession?.type === 'full-assessment' && 
    savedSession.questionIds.length === questions.length &&
    savedSession.questionIds.every((id, idx) => questions[idx]?.id === id);

  const [currentIndex, setCurrentIndex] = useState(isResuming ? savedSession!.currentIndex : 0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(isResuming ? savedSession!.selectedAnswers : []);
  const [showFeedback, setShowFeedback] = useState(isResuming ? savedSession!.showFeedback : false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(isResuming ? savedSession!.confidence : 'medium');
  const [startTime, setStartTime] = useState<number>(isResuming ? savedSession!.startTime : Date.now());
  const [responses, setResponses] = useState<UserResponse[]>(isResuming ? savedSession!.responses : []);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimerState, setShowTimerState] = useState(showTimer);

  const currentQuestion = questions[currentIndex];

  // Save session whenever state changes
  useEffect(() => {
    if (currentUser && sessionId) {
      // Save to user session system
      const userSession: UserSession = {
        userName: currentUser,
        sessionId: sessionId,
        type: 'full-assessment',
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
        type: 'full-assessment',
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
  }, [currentIndex, responses, selectedAnswers, showFeedback, confidence, startTime, questions, currentUser, sessionId]);

  // Clear session when assessment is complete
  useEffect(() => {
    if (currentIndex >= questions.length && responses.length === questions.length) {
      clearSession();
    }
  }, [currentIndex, questions.length, responses.length]);

  // Timer effect
  useEffect(() => {
    if (!showFeedback && currentQuestion && showTimerState) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showFeedback, startTime, currentQuestion, showTimerState]);

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

  const submitAnswer = () => {
    if (selectedAnswers.length === 0) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const isCorrect = 
      selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
      selectedAnswers.length === currentQuestion.correct_answer.length;

    // Track selected distractor if answer is wrong
    let selectedDistractor: { letter: string; text: string; patternId?: string } | undefined;
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
      }
    }

    const response: UserResponse = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      confidence,
      timestamp: Date.now(),
      selectedDistractor
    };

    setResponses(prev => [...prev, response]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Full assessment complete
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

  const progress = ((currentIndex + 1) / questions.length) * 100;

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
          <span>Full Assessment</span>
          <span>{currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timer Toggle and Display */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowTimerState(!showTimerState)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
        >
          <Clock className={`w-4 h-4 ${showTimerState ? 'text-amber-400' : ''}`} />
          <span>{showTimerState ? 'Hide Timer' : 'Show Timer'}</span>
        </button>
        {showTimerState && (
          <div className="text-sm text-slate-400">
            Question Time: <span className="text-slate-300 font-mono">{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>

      {/* Question Card */}
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
      />

      {/* Feedback Panel */}
      {showFeedback && (
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
