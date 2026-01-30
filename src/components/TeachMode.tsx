import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import QuestionCard from './QuestionCard';
import ExplanationPanel from './ExplanationPanel';
import { NASP_DOMAINS } from '../../knowledge-base';
import { UserResponse } from '../brain/weakness-detector';
import { UserProfile } from '../hooks/useFirebaseProgress';
import { AnalyzedQuestion } from '../brain/question-analyzer';

interface TeachModeProps {
  userProfile: UserProfile;
  analyzedQuestions: AnalyzedQuestion[];
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  selectedDomains?: number[]; // Optional: specific domains to focus on
}

interface TeachingContext {
  concept: string;
  explanation: string;
  keyPoints: string[];
  commonMistakes: string[];
}

/**
 * Get teaching context for a question based on its domains and key concepts
 */
function getTeachingContext(question: AnalyzedQuestion): TeachingContext {
  const domain = question.domains[0]; // Primary domain
  const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
  
  // Build explanation based on question's key concepts
  const explanations: Record<string, string> = {
    'problem-solving': `The problem-solving process follows these steps:
1. Problem Identification: Define the problem clearly using baseline data (how often, when, what it looks like)
2. Problem Analysis: Analyze why the problem is occurring (root causes)
3. Intervention Planning: Develop evidence-based interventions
4. Intervention Implementation: Put the plan into action
5. Progress Monitoring: Track data to see if intervention is working
6. Evaluation: Determine if problem is solved or needs adjustment`,
    
    'consultation': `Consultation involves:
- Collaborative problem-solving with teachers, parents, or administrators
- Indirect service (helping students by working with adults)
- Focus on building consultee capacity
- Systematic approach: problem identification → analysis → intervention → evaluation`,
    
    'assessment': `Assessment types include:
- Formative: Ongoing, guides instruction, low stakes
- Summative: End of period, evaluates learning, high stakes
- Diagnostic: Identifies specific skill deficits
- Progress monitoring: Tracks response to intervention`,
    
    'intervention': `Interventions are organized by tiers:
- Tier 1: Universal supports for all students
- Tier 2: Small group, targeted interventions for at-risk students
- Tier 3: Intensive, individualized interventions
Always match intervention intensity to student need level.`,
    
    'behavior': `Behavior support requires:
- Functional Behavior Assessment (FBA) to identify WHY behavior occurs
- Behavior Intervention Plan (BIP) that addresses the function
- Teaching replacement behaviors
- Addressing root causes, not just symptoms`
  };
  
  // Determine which explanation to use based on key concepts
  let explanationKey = 'problem-solving';
  if (question.keyConcepts.some(c => c.toLowerCase().includes('consultation'))) {
    explanationKey = 'consultation';
  } else if (question.keyConcepts.some(c => c.toLowerCase().includes('assessment') || c.toLowerCase().includes('test'))) {
    explanationKey = 'assessment';
  } else if (question.keyConcepts.some(c => c.toLowerCase().includes('intervention') || c.toLowerCase().includes('tier'))) {
    explanationKey = 'intervention';
  } else if (question.keyConcepts.some(c => c.toLowerCase().includes('behavior') || c.toLowerCase().includes('fba'))) {
    explanationKey = 'behavior';
  }
  
  const explanation = explanations[explanationKey] || explanations['problem-solving'];
  
  return {
    concept: question.keyConcepts[0] || 'Key Concept',
    explanation,
    keyPoints: question.keyConcepts.slice(0, 3),
    commonMistakes: domainInfo?.commonMistakes || []
  };
}

export default function TeachMode({
  userProfile,
  analyzedQuestions,
  onUpdateProfile,
  selectedDomains
}: TeachModeProps) {
  // Filter questions to deficient areas
  const deficientDomains = selectedDomains || userProfile.weakestDomains;
  
  const teachQuestions = analyzedQuestions.filter(q => 
    q.domains.some(d => deficientDomains.includes(d))
  );
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<AnalyzedQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTeachingContext, setShowTeachingContext] = useState(false);
  const [teachingContext, setTeachingContext] = useState<TeachingContext | null>(null);
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState<boolean | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  const [flaggedForReview, setFlaggedForReview] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<UserResponse[]>([]);
  
  // Initialize with first question
  useEffect(() => {
    if (teachQuestions.length > 0 && currentIndex === 0 && !currentQuestion) {
      setCurrentQuestion(teachQuestions[0]);
    }
  }, [teachQuestions, currentQuestion, currentIndex]);
  
  // Update current question when index changes
  useEffect(() => {
    if (teachQuestions.length > 0 && currentIndex < teachQuestions.length) {
      setCurrentQuestion(teachQuestions[currentIndex]);
    }
  }, [currentIndex, teachQuestions]);
  
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
    if (selectedAnswers.length === 0 || !currentQuestion) return;
    
    const isCorrect = 
      selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
      selectedAnswers.length === currentQuestion.correct_answer.length;
    
    if (!isRetry) {
      // First attempt
      setFirstAttemptCorrect(isCorrect);
      
      if (!isCorrect) {
        // Show teaching context
        const context = getTeachingContext(currentQuestion);
        setTeachingContext(context);
        setShowTeachingContext(true);
      }
    } else {
      // Retry attempt
      if (!isCorrect) {
        // Flag for further review
        setFlaggedForReview(prev => new Set(prev).add(currentQuestion.id));
      }
      
      // Record response
      const response: UserResponse = {
        questionId: currentQuestion.id,
        selectedAnswers,
        correctAnswers: currentQuestion.correct_answer,
        isCorrect,
        timeSpent: 0,
        confidence: 'medium',
        timestamp: Date.now()
      };
      
      setResponses(prev => [...prev, response]);
    }
    
    setShowFeedback(true);
  };
  
  const handleRetry = () => {
    setIsRetry(true);
    setShowTeachingContext(false);
    setShowFeedback(false);
    setSelectedAnswers([]);
  };
  
  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= teachQuestions.length) {
      // Teaching session complete
      // Update profile with flagged questions
      const flagged = Array.from(flaggedForReview);
      const updatedFlags = { ...userProfile.flaggedQuestions };
      flagged.forEach(qId => {
        updatedFlags[qId] = 'Flagged in Teach Mode - needs further study';
      });
      
      onUpdateProfile({
        flaggedQuestions: updatedFlags,
        practiceHistory: [...userProfile.practiceHistory, ...responses]
      });
      
      // Show completion message - user can navigate back via header
      return;
    }
    
    setCurrentIndex(nextIndex);
    setCurrentQuestion(teachQuestions[nextIndex]);
    setSelectedAnswers([]);
    setShowFeedback(false);
    setShowTeachingContext(false);
    setFirstAttemptCorrect(null);
    setIsRetry(false);
  };
  
  if (teachQuestions.length === 0) {
    return (
      <div className="text-center text-slate-400 p-8">
        <p>No questions available for teaching mode.</p>
        <p className="text-sm mt-2">Complete a full assessment to identify areas for improvement.</p>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="text-center text-slate-400 p-8">
        <p>Teaching session complete!</p>
        <p className="text-sm mt-2">
          {flaggedForReview.size > 0 
            ? `${flaggedForReview.size} question${flaggedForReview.size !== 1 ? 's' : ''} flagged for further review.`
            : 'Great job! You understood all the concepts.'}
        </p>
      </div>
    );
  }
  
  const isCorrect = 
    selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
    selectedAnswers.length === currentQuestion.correct_answer.length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Teach Mode</h2>
            <p className="text-sm text-slate-400">
              Question {currentIndex + 1} of {teachQuestions.length} • Focus on your weak areas
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentQuestion.domains.slice(0, 2).map(d => {
            const domainInfo = NASP_DOMAINS[d as keyof typeof NASP_DOMAINS];
            return (
              <span key={d} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300">
                {domainInfo?.shortName || `Domain ${d}`}
              </span>
            );
          })}
        </div>
      </div>
      
      {/* Teaching Context Panel (shown after wrong answer on first attempt) */}
      {showTeachingContext && teachingContext && !isRetry && (
        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-200 mb-2">Let's Review: {teachingContext.concept}</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {teachingContext.explanation}
                </p>
              </div>
              
              {teachingContext.keyPoints.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-purple-200 mb-2">Key Points:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {teachingContext.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-4 pt-4 border-t border-purple-500/30">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              Try Question Again
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        selectedAnswers={selectedAnswers}
        onSelectAnswer={toggleAnswer}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
        confidence="medium"
        onConfidenceChange={() => {}}
        disabled={false}
        showFeedback={showFeedback && (!showTeachingContext || isRetry)}
        assessmentType="practice"
      />
      
      {/* Feedback Panel */}
      {showFeedback && (!showTeachingContext || isRetry) && (
        <div className="space-y-4">
          <ExplanationPanel
            question={currentQuestion}
            userAnswer={selectedAnswers}
            isCorrect={isCorrect}
            rationale={currentQuestion.rationale}
          />
          
          {isRetry && !isCorrect && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300 mb-1">
                    Still having trouble with this concept?
                  </p>
                  <p className="text-sm text-slate-400">
                    This question has been flagged for further review. Consider studying this area more before continuing.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isRetry && isCorrect && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-300 mb-1">
                    Great! You got it on the retry.
                  </p>
                  <p className="text-sm text-slate-400">
                    The teaching context helped you understand the concept better.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
