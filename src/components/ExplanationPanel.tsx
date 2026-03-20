import { CheckCircle, XCircle } from 'lucide-react';
import { generateDiagnosticFeedback } from '../brain/diagnostic-feedback';
import {
  AnalyzedQuestion,
  Question,
  getQuestionChoices,
  getQuestionCorrectAnswers,
  getQuestionPrompt,
  getQuestionRationale
} from '../brain/question-analyzer';
import { UserProfile } from '../hooks/useFirebaseProgress';
import DiagnosticFeedback from './DiagnosticFeedback';
import { useEngine } from '../hooks/useEngine';
import {
  formatChoiceReferenceList,
  sanitizeFeedbackText
} from '../utils/feedbackText';

interface ExplanationPanelProps {
  question: AnalyzedQuestion;
  userAnswer: string[]; // Used for determining correctness display
  isCorrect: boolean;
  rationale: string;
  userProfile?: UserProfile; // Optional - only available in practice sessions
  distractorNote?: string; // Optional - specific explanation of the wrong answer chosen
}

export default function ExplanationPanel({
  question,
  userAnswer,
  isCorrect,
  rationale,
  userProfile,
  distractorNote
}: ExplanationPanelProps) {
  const engine = useEngine();
  const correctAnswerSummary = formatChoiceReferenceList(
    question,
    getQuestionCorrectAnswers(question)
  );
  const userAnswerSummary = formatChoiceReferenceList(question, userAnswer);
  const displayRationale = sanitizeFeedbackText(question, rationale);
  const displayCorrectExplanation = question.correctExplanation
    ? sanitizeFeedbackText(question, question.correctExplanation)
    : '';

  // Convert AnalyzedQuestion to Question type for diagnostic feedback
  const questionForFeedback: Question = {
    id: question.id,
    question: getQuestionPrompt(question),
    choices: getQuestionChoices(question),
    correct_answer: getQuestionCorrectAnswers(question),
    rationale: getQuestionRationale(question),
    skillId: question.skillId
  };

  // Generate diagnostic feedback (only if userProfile is available)
  let diagnosticFeedback = null;
  if (userProfile) {
    try {
      diagnosticFeedback = generateDiagnosticFeedback(questionForFeedback, userAnswer, isCorrect, userProfile, engine);
    } catch (error) {
      console.error('[ExplanationPanel] Failed to generate diagnostic feedback:', error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Original Rationale Panel */}
      <div className={`p-6 rounded-2xl border ${
        isCorrect
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold mb-2 ${
              isCorrect ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h4>
            <div className="space-y-2 mb-3">
              {!isCorrect && userAnswerSummary && (
                <p className="text-slate-200 text-sm leading-relaxed">
                  <span className="font-semibold text-slate-100">Your selection:</span>{' '}
                  {userAnswerSummary}
                </p>
              )}
              {correctAnswerSummary && (
                <p className="text-slate-200 text-sm leading-relaxed">
                  <span className="font-semibold text-slate-100">
                    {getQuestionCorrectAnswers(question).length > 1 ? 'Correct responses:' : 'Correct answer:'}
                  </span>{' '}
                  {correctAnswerSummary}
                </p>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{displayRationale}</p>
            
            {/* Extended Bank Fields (Static Questions) */}
            {displayCorrectExplanation && displayCorrectExplanation !== displayRationale && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">CORRECT EXPLANATION:</p>
                <p className="text-slate-300 text-sm leading-relaxed">{displayCorrectExplanation}</p>
              </div>
            )}
            
            {(question as any).contentLimit && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">CONTENT RULE:</p>
                <p className="text-slate-300 text-sm leading-relaxed">{(question as any).contentLimit}</p>
              </div>
            )}

            {(question as any).complexityRationale && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">COMPLEXITY:</p>
                <p className="text-slate-300 text-sm leading-relaxed">{(question as any).complexityRationale}</p>
              </div>
            )}

            {/* Key Concepts */}
            {question.keyConcepts && question.keyConcepts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">KEY CONCEPTS:</p>
                <div className="flex flex-wrap gap-2">
                  {question.keyConcepts.map((concept, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Feedback (only if userProfile is available) */}
      {diagnosticFeedback && (
        <DiagnosticFeedback feedback={diagnosticFeedback} distractorNote={distractorNote} />
      )}
    </div>
  );
}
