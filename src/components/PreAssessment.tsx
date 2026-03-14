import { useState, useEffect, useMemo } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import QuestionCard from './QuestionCard';
import { UserResponse } from '../brain/weakness-detector';
import { saveSession, loadSession, clearSession, AssessmentSession } from '../utils/sessionStorage';
import { getCurrentUser, getCurrentSession, saveUserSession, UserSession } from '../utils/userSessionStorage';
import { AnalyzedQuestion } from '../brain/question-analyzer';
import { useElapsedTimer } from '../hooks/useElapsedTimer';

// Local type definition removed in favor of imported AnalyzedQuestion


interface PreAssessmentProps {
  questions: AnalyzedQuestion[];
  onComplete: (responses: UserResponse[]) => void;
  showTimer?: boolean;
  sessionId?: string;
  logResponse?: (response: {
    questionId: string;
    skillId?: string;
    domainIds?: number[];
    assessmentType: 'diagnostic' | 'full' | 'practice';
    sessionId: string;
    isCorrect: boolean;
    confidence: 'low' | 'medium' | 'high';
    timeSpent: number;
    time_on_item_seconds?: number;
    timestamp: number;
    selectedAnswers: string[];
    correctAnswers: string[];
    distractorPatternId?: string;
  }) => Promise<void>;
  updateLastSession?: (sessionId: string, mode: 'practice' | 'full' | 'diagnostic', questionIndex: number, elapsedSeconds?: number) => Promise<void>;
}

export default function PreAssessment({
  questions,
  onComplete,
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
    savedSession.questionIds.every((id: string, idx: number) => questions[idx]?.id === id);

  const [currentIndex, setCurrentIndex] = useState(isResuming ? savedSession!.currentIndex : 0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(isResuming ? savedSession!.selectedAnswers : []);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(isResuming ? savedSession!.confidence : 'medium');
  const [startTime] = useState<number>(isResuming ? savedSession!.startTime : Date.now());
  const [responses, setResponses] = useState<UserResponse[]>(isResuming ? savedSession!.responses : []);
  const currentQuestion = questions[currentIndex];

  const [isSubmitted, setIsSubmitted] = useState(isResuming && savedSession!.responses.some(r => r.questionId === currentQuestion?.id));

  // Use the new centralized timer hook
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
    onAutoPause: () => {
      // Logic for persistent save on auto-pause if needed
      console.log('[PreAssessment] Auto-paused due to inactivity');
    }
  });

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
        showFeedback: false,
        confidence,
        startTime,
        lastUpdated: Date.now(),
        createdAt: Date.now(),
        elapsedSeconds // Save current elapsed time
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
        showFeedback: false,
        confidence,
        startTime,
        lastUpdated: Date.now(),
        elapsedSeconds // Save current elapsed time
      };
      saveSession(session);
    }
  }, [currentIndex, responses, selectedAnswers, confidence, startTime, questions, currentUser, sessionId, isPaused, elapsedSeconds]);
  
  // Save to Firestore on pause
  useEffect(() => {
    if (isPaused && updateLastSession && sessionId) {
      updateLastSession(sessionId, 'diagnostic', currentIndex, elapsedSeconds);
    }
  }, [isPaused, updateLastSession, sessionId, currentIndex, elapsedSeconds]);

  // Clear session when assessment is complete
  useEffect(() => {
    if (currentIndex >= questions.length && responses.length === questions.length) {
      clearSession();
    }
  }, [currentIndex, questions.length, responses.length]);

  const pacingMessage = useMemo(() => {
    const targetSecPerQuest = 45; // 30 min for 40 questions
    const expectedTime = (currentIndex + 1) * targetSecPerQuest;
    const diff = elapsedSeconds - expectedTime;
    
    if (diff < -60) return "🚀 Efficient pace - ahead of schedule.";
    if (diff > 60) return "⚠️ Behind pace - try to move slightly faster.";
    return "✅ On track - steady pacing maintained.";
  }, [currentIndex, elapsedSeconds]);
  
  // Handle pause/resume
  const handlePauseToggle = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const toggleAnswer = (letter: string) => {
    if (isSubmitted) return;
    
    const correctList = currentQuestion?.correct_answer || currentQuestion?.correctAnswers || [];
    const maxAnswers = correctList.length || 1;
    
    setSelectedAnswers((prev: string[]) => {
      if (prev.includes(letter)) {
        return prev.filter(a => a !== letter);
      }
      if (prev.length < maxAnswers) {
        return [...prev, letter];
      }
      return prev;
    });

    recordInteraction();
  };

  const submitAnswer = async () => {
    if (selectedAnswers.length === 0) return;

    // Calculate time spent on THIS question specifically
    const timeSpent = resetQuestionTimer();
    const now = Date.now();
    const timestamp = now;
    const correctList = currentQuestion.correct_answer || currentQuestion.correctAnswers || [];
    const isCorrect = 
      selectedAnswers.every(a => correctList.includes(a)) &&
      selectedAnswers.length === correctList.length;

    // Log response to Firestore (single response event schema)
    if (logResponse && sessionId) {
      await logResponse({
        questionId: currentQuestion.id,
        skillId: currentQuestion.skillId || '',
        domainIds: currentQuestion.domains || [],
        assessmentType: 'diagnostic',
        sessionId,
        isCorrect,
        confidence,
        timeSpent,
        time_on_item_seconds: timeSpent, // Verification field
        timestamp,
        selectedAnswers,
        correctAnswers: correctList
      });
    }

    // Update lastSession pointer
    if (updateLastSession && sessionId) {
      await updateLastSession(sessionId, 'diagnostic', currentIndex, elapsedSeconds);
    }

    const response: UserResponse = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: correctList,
      isCorrect,
      timeSpent,
      confidence,
      timestamp
    };

    const updatedResponses = [...responses, response];
    setResponses(updatedResponses);
    // Transition immediately to the next question in diagnostic mode
    nextQuestion(updatedResponses);
  };

  const nextQuestion = (updatedResponses?: UserResponse[]) => {
    const nextIndex = currentIndex + 1;
    const currentResponses = updatedResponses || responses;
    
    if (nextIndex >= questions.length) {
      // Pre-assessment complete
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

  if (!currentQuestion) {
    return null;
  }

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
      <div className="flex items-center justify-between bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{timerLabel}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-mono text-slate-200">{formattedTime}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700/50" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pacing</span>
            <span className="text-sm text-slate-300 font-medium">{pacingMessage}</span>
          </div>
        </div>
        
        <button
          onClick={handlePauseToggle}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-600/30"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>
      
      {/* Inactivity Warning */}
      {showInactivityWarning && !isPaused && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-4 animate-pulse">
          <div className="bg-amber-500/20 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">Still there? Your test will pause soon.</p>
          </div>
        </div>
      )}
      
      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-6 max-w-md mx-4 shadow-2xl">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center">
                <Pause className="w-10 h-10 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">{isAutoPaused ? 'Session Paused' : 'Test Paused'}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {isAutoPaused 
                  ? 'Your session was paused due to inactivity. Resume when ready.' 
                  : 'Your progress is securely saved. You can resume at any time or return to the home screen.'}
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button
                onClick={resume}
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-5 h-5" />
                Resume Assessment
              </button>
              <button
                onClick={() => window.location.reload()} // Quickest way to return home in this app's routing
                className="w-full px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-2xl font-bold transition-all border border-slate-600"
              >
                Save & Exit to Home
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
            showFeedback={false}
            assessmentType="pre"
            hideFooterControls={isSubmitted}
          />
        </div>
      )}

      {/* Post-submit continuation removed to allow direct transition */}

      {/* Feedback Panel REMOVED for diagnostic */}
    </div>
  );
}
