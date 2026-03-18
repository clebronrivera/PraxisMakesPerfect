import { useState, useEffect, useMemo } from 'react';
import { Clock, Pause, Play } from 'lucide-react';
import QuestionCard from './QuestionCard';
import { UserResponse } from '../brain/weakness-detector';
import { clearSession } from '../utils/sessionStorage';
import { deleteUserSession, loadUserSession, saveUserSession, UserSession } from '../utils/userSessionStorage';
import { AnalyzedQuestion, getQuestionCorrectAnswers } from '../brain/question-analyzer';
import { useElapsedTimer } from '../hooks/useElapsedTimer';
import type { ResponseAssessmentType, SessionMode } from '../types/assessment';
import type { SkillId } from '../brain/skill-map';
import { isStoredScreenerSessionType } from '../utils/sessionTypes';

// Local type definition removed in favor of imported AnalyzedQuestion


interface ScreenerAssessmentProps {
  questions: AnalyzedQuestion[];
  onComplete: (responses: UserResponse[]) => void;
  showTimer?: boolean;
  sessionId?: string;
  currentUserName?: string | null;
  logResponse?: (response: {
    questionId: string;
    skillId?: string;
    domainIds?: number[];
    assessmentType: ResponseAssessmentType;
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
  saveScreenerResponse?: (response: {
    question_id: string;
    skill_id: string;
    domain_id: number;
    selected_answer: string;
    correct_answer: string;
    is_correct: boolean;
    confidence: string;
    timestamp: number;
  }, totalQuestions?: number) => Promise<void>;
  updateSkillProgress?: (
    skillId: SkillId,
    isCorrect: boolean,
    confidence?: 'low' | 'medium' | 'high',
    questionId?: string,
    timeSpent?: number
  ) => Promise<void>;
  updateLastSession?: (sessionId: string, mode: SessionMode, questionIndex: number, elapsedSeconds?: number) => Promise<void>;
}

export default function ScreenerAssessment({
  questions,
  onComplete,
  sessionId,
  currentUserName,
  logResponse,
  saveScreenerResponse,
  updateSkillProgress,
  updateLastSession
}: ScreenerAssessmentProps) {
  const savedSession = sessionId ? loadUserSession(sessionId) : null;
  const isResuming = savedSession !== null &&
    isStoredScreenerSessionType(savedSession.type) &&
    savedSession.questionIds.length === questions.length &&
    savedSession.questionIds.every((id: string, idx: number) => questions[idx]?.id === id);

  const [currentIndex, setCurrentIndex] = useState(isResuming ? savedSession!.currentIndex : 0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(isResuming ? savedSession!.selectedAnswers : []);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(isResuming ? savedSession!.confidence : 'medium');
  const [startTime] = useState<number>(isResuming ? savedSession!.startTime : Date.now());
  const [responses, setResponses] = useState<UserResponse[]>(isResuming ? savedSession!.responses : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      console.log('[ScreenerAssessment] Auto-paused due to inactivity');
    }
  });

  // Save session whenever state changes (store IDs and timestamps only, no full objects)
  useEffect(() => {
    if (currentUserName && sessionId) {
      const userSession: UserSession = {
        userName: currentUserName,
        sessionId: sessionId,
        type: 'screener-assessment',
        assessmentFlow: 'screener',
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
    }
  }, [currentIndex, responses, selectedAnswers, confidence, startTime, questions, currentUserName, sessionId, elapsedSeconds]);
  
  // Save to Supabase on pause
  useEffect(() => {
    if (isPaused && updateLastSession && sessionId) {
      updateLastSession(sessionId, 'screener', currentIndex, elapsedSeconds);
    }
  }, [isPaused, updateLastSession, sessionId, currentIndex, elapsedSeconds]);

  // Clear session when assessment is complete
  useEffect(() => {
    if (currentIndex >= questions.length && responses.length === questions.length) {
      if (currentUserName && sessionId) {
        deleteUserSession(currentUserName, sessionId);
      }
      clearSession();
    }
  }, [currentIndex, currentUserName, questions.length, responses.length, sessionId]);

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
    
    const correctList = currentQuestion ? getQuestionCorrectAnswers(currentQuestion) : [];
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
    if (selectedAnswers.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const timeSpent = resetQuestionTimer();
      const timestamp = Date.now();
      const correctList = getQuestionCorrectAnswers(currentQuestion);
      const isCorrect =
        selectedAnswers.every(a => correctList.includes(a)) &&
        selectedAnswers.length === correctList.length;

      if (saveScreenerResponse) {
        await saveScreenerResponse({
          question_id: currentQuestion.id,
          skill_id: currentQuestion.skillId || '',
          domain_id: currentQuestion.domains?.[0] || 0,
          selected_answer: selectedAnswers.join(','),
          correct_answer: correctList.join(','),
          is_correct: isCorrect,
          confidence,
          timestamp
        }, questions.length);
      }

      if (logResponse && sessionId) {
        await logResponse({
          questionId: currentQuestion.id,
          skillId: currentQuestion.skillId || '',
          domainIds: currentQuestion.domains || [],
          assessmentType: 'screener',
          sessionId,
          isCorrect,
          confidence,
          timeSpent,
          time_on_item_seconds: timeSpent,
          timestamp,
          selectedAnswers,
          correctAnswers: correctList
        });
      }

      if (updateLastSession && sessionId) {
        await updateLastSession(sessionId, 'screener', currentIndex, elapsedSeconds);
      }

      if (currentQuestion.skillId && updateSkillProgress) {
        await updateSkillProgress(currentQuestion.skillId, isCorrect, confidence, currentQuestion.id, timeSpent);
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
      nextQuestion(updatedResponses);
    } catch (error) {
      console.error('[ScreenerAssessment] Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = (updatedResponses?: UserResponse[]) => {
    const nextIndex = currentIndex + 1;
    const currentResponses = updatedResponses || responses;
    
    if (nextIndex >= questions.length) {
      // Pre-assessment complete
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
            isSubmitting={isSubmitting}
            showFeedback={false}
            assessmentType="pre"
            hideFooterControls={isSubmitted}
          />
        </div>
      )}

      {/* Post-submit continuation removed to allow direct transition */}

      {/* Post-submit feedback panel intentionally omitted here. */}
    </div>
  );
}
