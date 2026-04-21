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
  variant?: 'atelier' | 'editorial';
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
  hideFooterControls = false,
  variant = 'editorial'
}: QuestionCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const isConfidenceVisible = !hideFooterControls && !showFeedback && selectedAnswers.length > 0;
  const correctAnswersList = question.correct_answer || question.correctAnswers || [];
  const isAtelier = variant === 'atelier';

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
    if (isAtelier) {
      if (showFeedback && isCorrect) {
        return {
          container: 'border-[color:var(--d2-mint)]/50 bg-[color:var(--d2-mint)]/10',
          chip: 'bg-[color:var(--d2-mint)]/30 text-white border border-[color:var(--d2-mint)]/60',
          text: 'text-white',
          icon: 'text-[color:var(--d2-mint)]',
        };
      }
      if (showFeedback && isSelected && !isCorrect) {
        return {
          container: 'border-[color:var(--accent-rose)]/50 bg-[color:var(--accent-rose)]/10',
          chip: 'bg-[color:var(--accent-rose)]/30 text-white border border-[color:var(--accent-rose)]/60',
          text: 'text-white',
          icon: 'text-[color:var(--accent-rose)]',
        };
      }
      if (isSelected) {
        return {
          container: 'border-[color:var(--d1-peach)]/50 bg-[color:var(--d1-peach)]/10',
          chip: 'bg-[color:var(--d1-peach)]/25 text-white border border-[color:var(--d1-peach)]/60',
          text: 'text-white',
          icon: 'text-[color:var(--d1-peach)]',
        };
      }
      return {
        container: 'border-white/10 bg-white/5 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/8',
        chip: 'border border-white/10 bg-[rgba(10,22,40,0.5)] text-slate-400',
        text: 'text-slate-200',
        icon: 'text-slate-400',
      };
    }

    // Editorial (default)
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
      icon: 'text-slate-600',
    };
  };

  // Variant-scoped class strings
  const cardShell = isAtelier
    ? 'overflow-hidden rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.55)] backdrop-blur-[14px]'
    : 'editorial-surface overflow-hidden';
  const headerShell = isAtelier
    ? 'flex items-center justify-between border-b border-white/8 bg-[rgba(10,22,40,0.4)] px-6 py-3'
    : 'flex items-center justify-between border-b border-slate-200 bg-[#fbfaf7] px-6 py-3';
  const sourcePill = isAtelier
    ? 'inline-flex items-center rounded-full border border-[color:var(--d1-peach)]/40 bg-[color:var(--d1-peach)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--d1-peach)]'
    : 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-700';
  const flagButton = isAtelier
    ? 'rounded-xl border border-transparent bg-white/5 p-2.5 text-slate-400 transition-all hover:border-[color:var(--d1-peach)]/30 hover:bg-white/10 hover:text-[color:var(--d1-peach)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]'
    : 'rounded-xl border border-transparent bg-white p-2.5 text-slate-400 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700';
  const caseShell = isAtelier
    ? 'rounded-2xl border border-[color:var(--d1-peach)]/30 bg-[color:var(--d1-peach)]/10 p-5'
    : 'rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-5';
  const caseHeading = isAtelier
    ? 'mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--d1-peach)]'
    : 'mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700';
  const caseBody = isAtelier
    ? 'text-sm leading-relaxed italic text-slate-200'
    : 'text-sm leading-relaxed italic text-slate-700';
  const stemText = isAtelier
    ? 'text-[1.1rem] font-semibold leading-8 text-white sm:text-[1.25rem]'
    : 'text-[1.1rem] font-semibold leading-8 text-slate-900 sm:text-[1.25rem]';
  const multiSelectPill = isAtelier
    ? 'inline-flex items-center rounded-full border border-[color:var(--d1-peach)]/40 bg-[color:var(--d1-peach)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--d1-peach)]'
    : 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700';
  const confidenceShell = isAtelier
    ? 'mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.45)] backdrop-blur-[14px] px-4 py-3'
    : 'editorial-surface-soft mt-4 flex flex-wrap items-center justify-between gap-4 px-4 py-3';
  const confidenceLabel = isAtelier
    ? 'text-sm font-semibold text-slate-200'
    : 'text-sm font-semibold text-slate-700';
  const confidenceActive = isAtelier
    ? 'border-[color:var(--d1-peach)]/60 bg-[color:var(--d1-peach)]/20 text-white'
    : 'border-slate-900 bg-slate-50 text-white';
  const confidenceIdle = isAtelier
    ? 'border-white/10 bg-white/5 text-slate-300 hover:border-[color:var(--d1-peach)]/40 hover:text-white'
    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-slate-900';
  const submitBtn = isAtelier
    ? 'btn-soft-glow min-w-[12rem] disabled:cursor-not-allowed disabled:opacity-50'
    : 'editorial-button-primary min-w-[12rem] disabled:cursor-not-allowed disabled:opacity-50';
  const nextBtn = isAtelier
    ? 'btn-soft-glow min-w-[12rem] inline-flex items-center justify-center gap-2'
    : 'editorial-button-dark min-w-[12rem]';

  return (
    <>
      {/* Question Card */}
      <div className={cardShell}>
        {/* Header with source and flag */}
        <div className={headerShell}>
          <div className="flex items-center gap-2">
            <span className={sourcePill}>
              {getSourceDisplay()}
            </span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className={flagButton}
            title="Report this question"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>

        {question.hasCaseVignette && question.caseText && (
          <div className="px-6 pt-6">
            <div className={caseShell}>
              <h4 className={caseHeading}>Case Vignette</h4>
              <p className={caseBody}>{question.caseText}</p>
            </div>
          </div>
        )}

        <div className="px-6 pb-1 pt-4">
          <p className={stemText}>
            {getQuestionPrompt(question)}
          </p>
        </div>

        {/* Answer Format Indicator */}
        {correctAnswersList.length > 1 && (
          <div className="px-6 pb-2">
            <span className={multiSelectPill}>
              Select {correctAnswersList.length}
            </span>
          </div>
        )}

        {/* Answer Choices */}
        <div className="space-y-3 p-4 pt-3">
          {(() => {
            // Handle new array of objects or old record of strings
            const optionsList = question.options
              ? question.options.map(opt => [opt.letter, opt.text] as [string, string])
              : Object.entries(question.choices || {});

            return optionsList
              .filter(([_, v]) => v && v.trim() && v.trim().toUpperCase() !== 'UNUSED')
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
                    className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)] ${tone.container} ${
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
        <div className={confidenceShell}>
          <span className={confidenceLabel}>Confidence</span>
          <div className="flex flex-wrap items-center gap-2">
          {CONFIDENCE_DISPLAY_ORDER.map(level => (
            <button
              key={level}
              onClick={() => onConfidenceChange(level)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] ${
                confidence === level ? confidenceActive : confidenceIdle
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
              className={submitBtn}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={onNext}
              className={nextBtn}
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
          // Report submitted — surface a toast notification here if desired
        }}
      />
    </>
  );
}
