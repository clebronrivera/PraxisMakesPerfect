import { CheckCircle, XCircle } from 'lucide-react';
import { generateDiagnosticFeedback } from '../brain/diagnostic-feedback';
import { Question } from '../brain/question-analyzer';
import { UserProfile } from '../hooks/useUserProgress';
import DiagnosticFeedback from './DiagnosticFeedback';

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

interface ExplanationPanelProps {
  question: AnalyzedQuestion;
  userAnswer: string[]; // Used for determining correctness display
  isCorrect: boolean;
  rationale: string;
  userProfile?: UserProfile; // Optional - only available in practice sessions
}

export default function ExplanationPanel({
  question,
  userAnswer,
  isCorrect,
  rationale,
  userProfile
}: ExplanationPanelProps) {
  // Convert AnalyzedQuestion to Question type for diagnostic feedback
  const questionForFeedback: Question = {
    id: question.id,
    question: question.question,
    choices: question.choices,
    correct_answer: question.correct_answer,
    rationale: question.rationale,
    skillId: question.skillId
  };

  // Generate diagnostic feedback (only if userProfile is available)
  const diagnosticFeedback = userProfile 
    ? generateDiagnosticFeedback(questionForFeedback, userAnswer, isCorrect, userProfile)
    : null;

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
            <p className="text-slate-300 text-sm leading-relaxed">{rationale}</p>
            
            {/* Key Concepts */}
            {question.keyConcepts.length > 0 && (
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
        <DiagnosticFeedback feedback={diagnosticFeedback} />
      )}
    </div>
  );
}
