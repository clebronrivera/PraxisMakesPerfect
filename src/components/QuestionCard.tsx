import { CheckCircle, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import ReportQuestionModal from './ReportQuestionModal';

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
  source?: 'bank' | 'generated';
  templateId?: string;
}

interface QuestionCardProps {
  question: AnalyzedQuestion;
  selectedAnswers: string[];
  onSelectAnswer: (letter: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  confidence: 'low' | 'medium' | 'high';
  onConfidenceChange: (level: 'low' | 'medium' | 'high') => void;
  disabled: boolean;
  showFeedback: boolean;
  assessmentType?: 'pre' | 'full' | 'practice';
}

export default function QuestionCard({
  question,
  selectedAnswers,
  onSelectAnswer,
  onSubmit,
  onNext,
  confidence,
  onConfidenceChange,
  disabled,
  showFeedback,
  assessmentType = 'practice'
}: QuestionCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  // Determine source display
  const getSourceDisplay = () => {
    if (question.source === 'generated' && question.templateId) {
      return `Generated (${question.templateId})`;
    } else if (question.source === 'generated') {
      return 'Generated';
    } else {
      return 'Question Bank';
    }
  };

  return (
    <>
      {/* Question Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Header with source and flag */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-900/50">
              {getSourceDisplay()}
            </span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-lg transition-all text-slate-500 hover:text-amber-400 hover:bg-slate-700/50"
            title="Report this question"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 pt-2">
          <p className="text-lg text-slate-200 leading-relaxed">{question.question}</p>
        </div>
        
        {/* Answer Format Indicator */}
        {question.correct_answer.length > 1 && (
          <div className="px-6 pb-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
              Select {question.correct_answer.length}
            </span>
          </div>
        )}
        
        {/* Answer Choices */}
        <div className="p-4 space-y-2">
          {(Object.entries(question.choices) as [string, string][])
            .filter(([_, v]) => v.trim())
            .map(([letter, text]) => {
              const isSelected = selectedAnswers.includes(letter);
              const isCorrect = question.correct_answer.includes(letter);
              
              let bgColor = 'bg-slate-700/50 hover:bg-slate-700';
              let borderColor = 'border-transparent';
              let textColor = 'text-slate-300';
              
              if (showFeedback) {
                if (isCorrect) {
                  bgColor = 'bg-emerald-500/20';
                  borderColor = 'border-emerald-500/50';
                  textColor = 'text-emerald-200';
                } else if (isSelected && !isCorrect) {
                  bgColor = 'bg-red-500/20';
                  borderColor = 'border-red-500/50';
                  textColor = 'text-red-200';
                }
              } else if (isSelected) {
                bgColor = 'bg-amber-500/20';
                borderColor = 'border-amber-500/50';
                textColor = 'text-amber-200';
              }
              
              return (
                <button
                  key={letter}
                  onClick={() => onSelectAnswer(letter)}
                  disabled={disabled || showFeedback}
                  className={`w-full p-4 rounded-xl border ${bgColor} ${borderColor} text-left transition-all flex items-start gap-4`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    showFeedback && isCorrect ? 'bg-emerald-500 text-white' :
                    showFeedback && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    {letter}
                  </span>
                  <span className={textColor}>{text}</span>
                  {showFeedback && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />
                  )}
                </button>
              );
            })}
        </div>
      </div>
      
      {/* Confidence Selection (before submit) */}
      {!showFeedback && selectedAnswers.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-slate-500">Confidence:</span>
          {(['low', 'medium', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => onConfidenceChange(level)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                confidence === level 
                  ? 'bg-slate-700 text-slate-200' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      )}
      
      {/* Submit / Next Button */}
      <div className="flex justify-center">
        {!showFeedback ? (
          <button
            onClick={onSubmit}
            disabled={selectedAnswers.length === 0}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            Next Question
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Report Question Modal */}
      <ReportQuestionModal
        question={question}
        assessmentType={assessmentType}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          // Show toast notification (could use a toast library)
          console.log('Report submitted successfully');
        }}
      />
    </>
  );
}
