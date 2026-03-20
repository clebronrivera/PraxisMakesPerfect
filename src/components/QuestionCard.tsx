import { CheckCircle, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import ReportQuestionModal from './ReportQuestionModal';
import { AnalyzedQuestion, getQuestionPrompt } from '../brain/question-analyzer';
import {
  CONFIDENCE_DISPLAY_ORDER,
  getConfidenceDisplayLabel
} from '../utils/confidenceLabels';

// Local AnalyzedQuestion interface removed

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
  isSubmitting?: boolean;
  assessmentType?: 'pre' | 'full' | 'practice';
  hideFooterControls?: boolean;
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
  isSubmitting = false,
  assessmentType = 'practice',
  hideFooterControls = false
}: QuestionCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const isConfidenceVisible = !hideFooterControls && !showFeedback && selectedAnswers.length > 0;
  const correctAnswersList = question.correct_answer || question.correctAnswers || [];

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

  const getChoiceTone = (isSelected: boolean, isCorrect: boolean) => {
    if (showFeedback && isCorrect) {
      return {
        container: 'border-emerald-300 bg-emerald-50',
        chip: 'bg-emerald-600 text-white',
        text: 'text-emerald-900',
        icon: 'text-emerald-600',
      };
    }

    if (showFeedback && isSelected && !isCorrect) {
      return {
        container: 'border-rose-300 bg-rose-50',
        chip: 'bg-rose-500 text-white',
        text: 'text-rose-900',
        icon: 'text-rose-500',
      };
    }

    if (isSelected) {
      return {
        container: 'border-amber-300 bg-amber-50 shadow-sm',
        chip: 'bg-amber-500 text-white',
        text: 'text-slate-900',
        icon: 'text-amber-600',
      };
    }

    return {
      container: 'border-slate-200 bg-[#fbfaf7] hover:border-amber-300 hover:bg-amber-50/70',
      chip: 'border border-slate-200 bg-white text-slate-500',
      text: 'text-slate-700',
      icon: 'text-slate-300',
    };
  };

  return (
    <>
      {/* Question Card */}
      <div className="editorial-surface overflow-hidden">
        {/* Header with source and flag */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#fbfaf7] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
              {getSourceDisplay()}
            </span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="rounded-xl border border-transparent bg-white p-2.5 text-slate-400 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            title="Report this question"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
        
        {question.hasCaseVignette && question.caseText && (
          <div className="px-6 pt-6">
            <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-5">
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">Case Vignette</h4>
              <p className="text-sm leading-relaxed italic text-slate-700">{question.caseText}</p>
            </div>
          </div>
        )}
        
        <div className="px-6 pb-2 pt-6">
          <p className="text-[1.1rem] font-semibold leading-8 text-slate-900 sm:text-[1.25rem]">
            {getQuestionPrompt(question)}
          </p>
        </div>
        
        {/* Answer Format Indicator */}
        {correctAnswersList.length > 1 && (
          <div className="px-6 pb-2">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Select {correctAnswersList.length}
            </span>
          </div>
        )}
        
        {/* Answer Choices */}
        <div className="space-y-3 p-6 pt-4">
          {(() => {
            // Handle new array of objects or old record of strings
            const optionsList = question.options 
              ? question.options.map(opt => [opt.letter, opt.text] as [string, string])
              : Object.entries(question.choices || {});
              
            return optionsList
              .filter(([_, v]) => v && v.trim())
              .map(([letter, text], index) => {
                const isSelected = selectedAnswers.includes(letter);
                const isCorrect = correctAnswersList.includes(letter);
                const displayLabel = String.fromCharCode(65 + index);
                const tone = getChoiceTone(isSelected, isCorrect);
                
                return (
                  <button
                    key={letter}
                    onClick={() => onSelectAnswer(letter)}
                    disabled={disabled || showFeedback || isSubmitting}
                    className={`flex w-full items-start gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all ${tone.container} ${
                      disabled || showFeedback || isSubmitting ? '' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${tone.chip}`}>
                      {displayLabel}
                    </span>
                    <span className={`flex-1 pt-0.5 text-sm leading-relaxed ${tone.text}`}>{text}</span>
                    {showFeedback && isCorrect && (
                      <CheckCircle className={`ml-auto mt-0.5 h-5 w-5 flex-shrink-0 ${tone.icon}`} />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <XCircle className={`ml-auto mt-0.5 h-5 w-5 flex-shrink-0 ${tone.icon}`} />
                    )}
                  </button>
                );
            });
          })()}
        </div>
      </div>
      
      {/* Confidence Selection (before submit) */}
      {isConfidenceVisible && (
        <div className="editorial-surface-soft mt-8 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <span className="text-sm font-semibold text-slate-700">Confidence</span>
          <div className="flex flex-wrap items-center gap-2">
          {CONFIDENCE_DISPLAY_ORDER.map(level => (
            <button
              key={level}
              onClick={() => onConfidenceChange(level)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                confidence === level 
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-slate-900'
              }`}
            >
              {getConfidenceDisplayLabel(level)}
            </button>
          ))}
          </div>
        </div>
      )}
      
      {/* Submit / Next Button */}
      {!hideFooterControls && (
        <div className={`flex justify-center ${isConfidenceVisible ? 'mt-12' : 'mt-8'}`}>
          {!showFeedback ? (
            <button
              onClick={onSubmit}
              disabled={selectedAnswers.length === 0 || isSubmitting}
              className="editorial-button-primary min-w-[12rem] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="editorial-button-dark min-w-[12rem]"
            >
              Next Question
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

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
