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
  assessmentType?: 'pre' | 'full' | 'adaptive' | 'practice';
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

  const getChoiceStyles = (isSelected: boolean, isCorrect: boolean) => {
    // Correct answer after submit
    if (showFeedback && isCorrect) {
      return {
        container: 'border-emerald-300 bg-emerald-50',
        chip: 'bg-emerald-600 text-white',
        text: 'text-emerald-800 font-medium',
        strikethrough: false,
      };
    }

    // Wrong answer selected after submit
    if (showFeedback && isSelected && !isCorrect) {
      return {
        container: 'border-rose-300 bg-rose-50',
        chip: 'bg-rose-500 text-white',
        text: 'text-rose-700',
        strikethrough: true,
      };
    }

    // Unselected after submit (dim)
    if (showFeedback && !isSelected) {
      return {
        container: 'border-slate-200 bg-white opacity-60',
        chip: 'border border-slate-200 bg-white text-slate-400',
        text: 'text-slate-500',
        strikethrough: false,
      };
    }

    // Selected before submit
    if (isSelected) {
      return {
        container: 'border-amber-300 bg-amber-50',
        chip: 'bg-amber-500 text-white',
        text: 'text-amber-800',
        strikethrough: false,
      };
    }

    // Default unselected
    return {
      container: 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50',
      chip: 'border border-slate-200 bg-white text-slate-500',
      text: 'text-slate-700',
      strikethrough: false,
    };
  };

  return (
    <>
      {/* Question Card */}
      <div className="editorial-surface overflow-hidden">
        {/* Header: domain pill + report button */}
        <div className="flex items-center justify-between border-b border-[#e6dfd4] bg-[#fbfaf7] px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
              {getSourceDisplay()}
            </span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            title="Report this question"
            aria-label="Report this question"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        </div>

        {/* Case Vignette */}
        {question.hasCaseVignette && question.caseText && (
          <div className="px-6 pt-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">
                Case Vignette
              </h4>
              <p className="text-sm italic leading-relaxed text-slate-700">
                {question.caseText}
              </p>
            </div>
          </div>
        )}

        {/* Question ID overline + question text */}
        <div className="px-6 pb-1 pt-5">
          {question.id && (
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {question.id}
            </p>
          )}
          <p className="text-[1.1rem] font-semibold leading-8 text-slate-900 sm:text-[1.2rem]">
            {getQuestionPrompt(question)}
          </p>
        </div>

        {/* Multi-select indicator */}
        {correctAnswersList.length > 1 && (
          <div className="px-6 pb-2">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Select {correctAnswersList.length}
            </span>
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3 px-6 pb-6 pt-3">
          {(() => {
            const optionsList = question.options
              ? question.options.map(opt => [opt.letter, opt.text] as [string, string])
              : Object.entries(question.choices || {});

            return optionsList
              .filter(([_, v]) => v && v.trim() && v.trim().toUpperCase() !== 'UNUSED')
              .map(([letter, text], index) => {
                const isSelected = selectedAnswers.includes(letter);
                const isCorrect = correctAnswersList.includes(letter);
                const displayLabel = String.fromCharCode(65 + index);
                const style = getChoiceStyles(isSelected, isCorrect);

                return (
                  <button
                    key={letter}
                    onClick={() => onSelectAnswer(letter)}
                    disabled={disabled || showFeedback || isSubmitting}
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all ${style.container} ${
                      disabled || showFeedback || isSubmitting ? '' : 'hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Letter chip */}
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${style.chip}`}
                    >
                      {displayLabel}
                    </span>

                    {/* Answer text */}
                    <span
                      className={`flex-1 text-sm leading-relaxed ${style.text} ${
                        style.strikethrough ? 'line-through' : ''
                      }`}
                    >
                      {text}
                    </span>

                    {/* Result icon */}
                    {showFeedback && isCorrect && (
                      <CheckCircle className="ml-auto h-5 w-5 flex-shrink-0 text-emerald-600" />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <XCircle className="ml-auto h-5 w-5 flex-shrink-0 text-rose-500" />
                    )}
                  </button>
                );
              });
          })()}
        </div>
      </div>

      {/* Confidence Selector (before submit) */}
      {isConfidenceVisible && (
        <div className="editorial-surface-soft mt-4 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">How confident are you?</p>
          <div className="flex items-center gap-2">
            {CONFIDENCE_DISPLAY_ORDER.map(level => (
              <button
                key={level}
                onClick={() => onConfidenceChange(level)}
                className={`min-h-[40px] rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                  confidence === level
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700'
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
        <div className={`flex justify-center ${isConfidenceVisible ? 'mt-6' : 'mt-4'}`}>
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
              <ArrowRight className="h-5 w-5" />
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
          // Report submitted — surface a toast notification here if desired
        }}
      />
    </>
  );
}
