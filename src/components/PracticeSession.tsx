import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import QuestionCard from './QuestionCard';
import ExplanationPanel from './ExplanationPanel';
import { NASP_DOMAINS } from '../../knowledge-base';
import { matchDistractorPattern } from '../brain/distractor-matcher';
import { UserProfile } from '../hooks/useUserProgress';
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
  updateSkillProgress?: (skillId: SkillId, isCorrect: boolean) => void;
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

  const submitAnswer = () => {
    if (selectedAnswers.length === 0 || !currentQuestion) return;

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

    const response = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      confidence,
      timestamp: Date.now(),
      selectedDistractor
    };

    // Update profile
    const newHistory = [...localProfile.practiceHistory, response];
    const analysis = detectWeaknesses(newHistory, analyzedQuestions);
    
    // Update skill scores if question has a skillId
    let updatedSkillScores = { ...localProfile.skillScores };
    if (currentQuestion.skillId) {
      const skillId = currentQuestion.skillId;
      const currentSkillScore = updatedSkillScores[skillId];
      
      if (currentSkillScore) {
        // Update existing skill score (new format)
        const newAttempts = currentSkillScore.attempts + 1;
        const newCorrect = currentSkillScore.correct + (isCorrect ? 1 : 0);
        const newScore = newAttempts > 0 ? newCorrect / newAttempts : 0;
        const newConsecutiveCorrect = isCorrect ? currentSkillScore.consecutiveCorrect + 1 : 0;
        const newHistory = [...currentSkillScore.history, isCorrect].slice(-5);
        
        updatedSkillScores[skillId] = {
          ...currentSkillScore,
          score: newScore,
          attempts: newAttempts,
          correct: newCorrect,
          consecutiveCorrect: newConsecutiveCorrect,
          history: newHistory
          // learningState and masteryDate will be calculated by updateSkillProgress or on next load
        };
      } else {
        // Initialize new skill score
        updatedSkillScores[skillId] = {
          score: isCorrect ? 1 : 0,
          attempts: 1,
          correct: isCorrect ? 1 : 0,
          consecutiveCorrect: isCorrect ? 1 : 0,
          history: [isCorrect],
          learningState: 'emerging',
          masteryDate: undefined
        };
      }
      
      // Use updateSkillProgress if available (calculates learning state with prerequisites)
      if (updateSkillProgress) {
        updateSkillProgress(skillId, isCorrect);
      }
    }

    // Track distractor errors
    let updatedDistractorErrors = { ...localProfile.distractorErrors };
    let updatedSkillDistractorErrors = { ...localProfile.skillDistractorErrors };
    
    if (!isCorrect && selectedDistractor?.patternId) {
      // Update global distractor error count
      updatedDistractorErrors[selectedDistractor.patternId] = 
        (updatedDistractorErrors[selectedDistractor.patternId] || 0) + 1;
      
      // Update skill-specific distractor error count
      if (currentQuestion.skillId) {
        const skillId = currentQuestion.skillId;
        if (!updatedSkillDistractorErrors[skillId]) {
          updatedSkillDistractorErrors[skillId] = {};
        }
        updatedSkillDistractorErrors[skillId][selectedDistractor.patternId] = 
          (updatedSkillDistractorErrors[skillId][selectedDistractor.patternId] || 0) + 1;
      }
    }

    // Track generated questions if this was a generated question
    let updatedGeneratedSeen = localProfile.generatedQuestionsSeen;
    if (currentQuestion.isGenerated && currentQuestion.id) {
      updatedGeneratedSeen = new Set(localProfile.generatedQuestionsSeen);
      updatedGeneratedSeen.add(currentQuestion.id);
    }

    const updatedProfile: Partial<UserProfile> = {
      practiceHistory: newHistory,
      skillScores: updatedSkillScores, // Always include for localProfile sync
      generatedQuestionsSeen: updatedGeneratedSeen,
      distractorErrors: updatedDistractorErrors,
      skillDistractorErrors: updatedSkillDistractorErrors,
      ...analysis,
      totalQuestionsSeen: localProfile.totalQuestionsSeen + 1,
      streak: isCorrect ? localProfile.streak + 1 : 0
    };
    
    onUpdateProfile(updatedProfile);
    // Update local profile immediately so next question selection uses latest data
    setLocalProfile(prev => ({ ...prev, ...updatedProfile } as UserProfile));

    setQuestionHistory(prev => [...prev, currentQuestion.id]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (!currentQuestion) return;

    // Use current localProfile (which should be up-to-date after submitAnswer)
    // Add current question to history first
    const updatedHistory = [...questionHistory, currentQuestion.id];
    setQuestionHistory(updatedHistory);
    
    // Track generated question if it was one
    let profileForSelection = localProfile;
    if (currentQuestion.isGenerated && currentQuestion.id) {
      const updatedSeen = new Set(localProfile.generatedQuestionsSeen);
      updatedSeen.add(currentQuestion.id);
      profileForSelection = { ...localProfile, generatedQuestionsSeen: updatedSeen };
      onUpdateProfile({ generatedQuestionsSeen: updatedSeen });
      setLocalProfile(profileForSelection);
    }

    // Select next question using updated profile and history
    const next = selectNextQuestion(profileForSelection, analyzedQuestions, updatedHistory);
    if (next) {
      setCurrentQuestion(next);
      setStartTime(Date.now());
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
    }
  };

  if (!currentQuestion) {
    return <div className="text-center text-slate-400">Loading question...</div>;
  }

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
        onFlag={(questionId, note) => {
          const updatedFlags = { ...localProfile.flaggedQuestions };
          if (note.trim()) {
            updatedFlags[questionId] = note;
          } else {
            delete updatedFlags[questionId];
          }
          onUpdateProfile({ flaggedQuestions: updatedFlags });
          setLocalProfile(prev => ({ ...prev, flaggedQuestions: updatedFlags }));
        }}
        flaggedNote={localProfile.flaggedQuestions[currentQuestion.id]}
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
          userProfile={localProfile}
        />
      )}
    </div>
  );
}
