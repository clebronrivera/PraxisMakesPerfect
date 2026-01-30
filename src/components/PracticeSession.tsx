import { useState, useEffect } from 'react';
import { Zap, Clock, Pause, Play } from 'lucide-react';
import QuestionCard from './QuestionCard';
import ExplanationPanel from './ExplanationPanel';
import { NASP_DOMAINS } from '../../knowledge-base';
import { matchDistractorPattern } from '../brain/distractor-matcher';
import { UserProfile } from '../hooks/useFirebaseProgress';
import { SkillId } from '../brain/skill-map';

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

interface PracticeSessionProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  updateSkillProgress?: (skillId: SkillId, isCorrect: boolean, confidence?: 'low' | 'medium' | 'high', questionId?: string, timeSpent?: number) => Promise<void>;
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
  analyzedQuestions: AnalyzedQuestion[];
  selectNextQuestion: (profile: UserProfile, questions: AnalyzedQuestion[], history: string[]) => AnalyzedQuestion | null;
  detectWeaknesses: (responses: Array<{
    questionId: string;
    selectedAnswers: string[];
    correctAnswers: string[];
    isCorrect: boolean;
    timeSpent: number;
    confidence: 'low' | 'medium' | 'high';
    timestamp: number;
  }>, questions: AnalyzedQuestion[]) => {
    weakestDomains: number[];
    factualGaps: string[];
    errorPatterns: string[];
    domainScores: Record<number, { correct: number; total: number }>;
  };
  practiceDomain?: number | null;
}


const getDomainColor = (domain: number) => {
  const colors: Record<number, string> = {
    1: '#3B82F6', 2: '#3B82F6',
    3: '#10B981', 4: '#10B981',
    5: '#8B5CF6', 6: '#8B5CF6', 7: '#8B5CF6',
    8: '#F59E0B', 9: '#F59E0B', 10: '#F59E0B'
  };
  return colors[domain] || '#6B7280';
};

export default function PracticeSession({
  userProfile,
  onUpdateProfile,
  updateSkillProgress,
  logResponse,
  updateLastSession,
  analyzedQuestions,
  selectNextQuestion,
  detectWeaknesses,
  practiceDomain
}: PracticeSessionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<AnalyzedQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [localResponses, setLocalResponses] = useState<Array<{
    questionId: string;
    selectedAnswers: string[];
    correctAnswers: string[];
    isCorrect: boolean;
    timeSpent: number;
    confidence: 'low' | 'medium' | 'high';
    timestamp: number;
  }>>([]); // Local array for weakness detection (last 50)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimer, setShowTimer] = useState(false); // Default OFF, tracking still happens
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  // Generate sessionId for this practice session
  const [sessionId] = useState<string>(() => `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [questionIndex, setQuestionIndex] = useState(0);
  
  // Sync local profile with prop updates
  useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);

  // Initialize with first question when practice mode starts
  useEffect(() => {
    if (!currentQuestion) {
      const next = selectNextQuestion(localProfile, analyzedQuestions, questionHistory);
      if (next) {
        setCurrentQuestion(next);
        setStartTime(Date.now());
      }
    }
  }, [currentQuestion, localProfile, analyzedQuestions, questionHistory, selectNextQuestion]);

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
    if (showFeedback || !currentQuestion) return;
    
    const maxAnswers = currentQuestion.correct_answer.length;
    
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
    if (selectedAnswers.length === 0 || !currentQuestion) return;

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
    if (logResponse) {
      await logResponse({
        questionId: currentQuestion.id,
        skillId: currentQuestion.skillId,
        domainId: currentQuestion.domains[0], // Use first domain
        assessmentType: 'practice',
        sessionId,
        isCorrect,
        confidence,
        timeSpent,
        timestamp,
        selectedAnswer: selectedAnswers[0], // First selected answer letter
        distractorPatternId
      });
    }

    // Build response object for weakness detection (local only, not stored)
    const response = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      confidence,
      timestamp,
      selectedDistractor
    };

    // Add to local responses array for weakness detection (keep last 50)
    const updatedLocalResponses = [...localResponses, response].slice(-50);
    setLocalResponses(updatedLocalResponses);
    
    // Get recent responses for weakness detection (from local state, not Firestore)
    // In future, could query responses subcollection for more accurate analysis
    const analysis = detectWeaknesses(updatedLocalResponses, analyzedQuestions);
    
    // Update skill scores if question has a skillId
    if (currentQuestion.skillId && updateSkillProgress) {
      await updateSkillProgress(
        currentQuestion.skillId, 
        isCorrect, 
        confidence, 
        currentQuestion.id, 
        timeSpent
      );
    }

    // Track distractor errors
    let updatedDistractorErrors = { ...localProfile.distractorErrors };
    let updatedSkillDistractorErrors = { ...localProfile.skillDistractorErrors };
    
    if (!isCorrect && distractorPatternId) {
      // Update global distractor error count
      updatedDistractorErrors[distractorPatternId] = 
        (updatedDistractorErrors[distractorPatternId] || 0) + 1;
      
      // Update skill-specific distractor error count
      if (currentQuestion.skillId) {
        const skillId = currentQuestion.skillId;
        if (!updatedSkillDistractorErrors[skillId]) {
          updatedSkillDistractorErrors[skillId] = {};
        }
        updatedSkillDistractorErrors[skillId][distractorPatternId] = 
          (updatedSkillDistractorErrors[skillId][distractorPatternId] || 0) + 1;
      }
    }

    // Update summary doc (cached view)
    const updatedProfile: Partial<UserProfile> = {
      skillScores: localProfile.skillScores, // Will be updated by updateSkillProgress
      distractorErrors: updatedDistractorErrors,
      skillDistractorErrors: updatedSkillDistractorErrors,
      ...analysis,
      totalQuestionsSeen: (localProfile.totalQuestionsSeen || 0) + 1,
      streak: isCorrect ? (localProfile.streak || 0) + 1 : 0,
      practiceResponseCount: (localProfile.practiceResponseCount || 0) + 1,
      lastPracticeAt: timestamp
    };
    
    onUpdateProfile(updatedProfile);
    // Update local profile immediately so next question selection uses latest data
    setLocalProfile(prev => ({ ...prev, ...updatedProfile } as UserProfile));

    // Update recent practice question IDs (rolling window of last 20)
    const recentPracticeIds = [...(localProfile.recentPracticeQuestionIds || []), currentQuestion.id];
    const trimmedRecent = recentPracticeIds.slice(-20); // Keep last 20
    onUpdateProfile({ recentPracticeQuestionIds: trimmedRecent });
    setLocalProfile(prev => ({ ...prev, recentPracticeQuestionIds: trimmedRecent }));

    // Update lastSession pointer
    if (updateLastSession) {
      await updateLastSession(sessionId, 'practice', questionIndex);
    }

    setQuestionHistory(prev => [...prev, currentQuestion.id]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (!currentQuestion) return;

    // Use current localProfile (which should be up-to-date after submitAnswer)
    // Add current question to history first
    const updatedHistory = [...questionHistory, currentQuestion.id];
    setQuestionHistory(updatedHistory);
    
    // Select next question using updated profile and history
    const next = selectNextQuestion(localProfile, analyzedQuestions, updatedHistory);
    if (next) {
      setCurrentQuestion(next);
      setStartTime(Date.now());
      setElapsedTime(0);
      setTotalPausedTime(0); // Reset paused time for new question
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
      setQuestionIndex(prev => prev + 1);
    } else {
      // Debug logging when no questions available
      console.warn('[PracticeSession] No questions available', {
        selectedSkill: localProfile.weakestDomains[0],
        exclusionCounts: {
          assessment: (localProfile.preAssessmentQuestionIds?.length || 0) + (localProfile.fullAssessmentQuestionIds?.length || 0),
          recent: localProfile.recentPracticeQuestionIds?.length || 0,
          session: questionHistory.length
        },
        availablePoolSize: analyzedQuestions.length
      });
    }
  };

  if (!currentQuestion) {
    return <div className="text-center text-slate-400">Loading question...</div>;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Practice Mode Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-slate-400">Streak: <span className="text-amber-400 font-bold">{localProfile.streak}</span></span>
          </div>
          {practiceDomain && (
            <div className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{
              backgroundColor: `${getDomainColor(practiceDomain)}20`,
              color: getDomainColor(practiceDomain),
              border: `1px solid ${getDomainColor(practiceDomain)}40`
            }}>
              Practicing: {NASP_DOMAINS[practiceDomain as keyof typeof NASP_DOMAINS]?.name || `Domain ${practiceDomain}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              <Clock className={`w-4 h-4 ${showTimer ? 'text-amber-400' : ''}`} />
              <span>{showTimer ? 'Hide Timer' : 'Show Timer'}</span>
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
          {showTimer && (
            <span className="text-sm text-slate-400">
              Time: <span className="text-slate-300 font-mono">{formatTime(elapsedTime)}</span>
            </span>
          )}
          <div className="flex gap-2">
            {currentQuestion.domains.slice(0, 2).map(d => (
              <span key={d} className="px-2 py-1 rounded text-xs" style={{
                backgroundColor: `${getDomainColor(d)}20`,
                color: getDomainColor(d)
              }}>
                {NASP_DOMAINS[d as keyof typeof NASP_DOMAINS]?.shortName}
              </span>
            ))}
          </div>
        </div>
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
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Practice Paused</h3>
              <p className="text-slate-400">Take your time. Your progress is saved.</p>
            </div>
            <button
              onClick={handlePause}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Resume Practice
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
          assessmentType="practice"
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
          userProfile={localProfile}
        />
      )}
    </div>
  );
}
