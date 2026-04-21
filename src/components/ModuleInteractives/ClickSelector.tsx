import { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface SelectOption {
  id: string;
  label: string;
  explanation?: string;
  isCorrect?: boolean;
}

interface ClickSelectorProps {
  options: SelectOption[];
  prompt?: string;
  singleSelect?: boolean;
  onComplete?: (selectedIds: string[]) => void;
  variant?: 'atelier' | 'editorial';
}

/**
 * ClickSelector: Click to select/deselect options
 * Used for: Tool appropriateness, NASP endorsed practices, assessment decisions
 */
export default function ClickSelector({
  options,
  prompt,
  singleSelect = true,
  onComplete,
  variant = 'editorial',
}: ClickSelectorProps) {
  const isA = variant === 'atelier';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggleSelect = (id: string) => {
    if (submitted) return; // lock after submit
    const newSelected = new Set(selected);
    if (singleSelect) {
      newSelected.clear();
      newSelected.add(id);
    } else {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }
    setSelected(newSelected);
  };

  const hasCorrectAnswer = options.some(o => o.isCorrect);
  const isCorrect =
    !hasCorrectAnswer ||
    (selected.size > 0 &&
      Array.from(selected).every(id => options.find(o => o.id === id)?.isCorrect) &&
      Array.from(selected).length === options.filter(o => o.isCorrect).length);

  const handleSubmit = () => {
    setSubmitted(true);
    if (onComplete) onComplete(Array.from(selected));
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelected(new Set());
  };

  const promptCls = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-600 italic';
  const optionCorrect = isA
    ? 'bg-[color:var(--d2-mint)]/10 border-[color:var(--d2-mint)]/50'
    : 'bg-emerald-50 border-emerald-300';
  const optionWrong = isA
    ? 'bg-[color:var(--accent-rose)]/10 border-[color:var(--accent-rose)]/50'
    : 'bg-rose-50 border-rose-300';
  const optionDimmed = isA
    ? 'bg-white/5 border-white/10 opacity-60'
    : 'bg-slate-50 border-slate-200 opacity-60';
  const optionSelected = isA
    ? 'bg-[color:var(--d1-peach)]/15 border-[color:var(--d1-peach)]/50'
    : 'bg-cyan-50 border-cyan-400';
  const optionIdle = isA
    ? 'bg-white/5 border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/10'
    : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm';
  const checkCircleOn = isA ? 'w-5 h-5 text-[color:var(--d1-peach)]' : 'w-5 h-5 text-cyan-600';
  const checkCircleOff = isA ? 'w-5 h-5 text-slate-500' : 'w-5 h-5 text-slate-400';
  const optionLabelCls = isA ? 'font-semibold text-white' : 'font-semibold text-slate-800';
  const optionExplainCls = isA ? 'text-xs text-slate-400 mt-1.5 leading-normal' : 'text-xs text-slate-600 mt-1.5 leading-normal';
  const correctBannerCls = isA
    ? 'rounded-xl bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/40 px-4 py-3'
    : 'rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3';
  const correctBannerText = isA ? 'text-sm font-semibold text-[color:var(--d2-mint)]' : 'text-sm text-emerald-700 font-semibold';
  const wrongBannerCls = isA
    ? 'rounded-xl bg-[color:var(--accent-rose)]/10 border border-[color:var(--accent-rose)]/40 px-4 py-3 flex items-center justify-between gap-3'
    : 'rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-center justify-between gap-3';
  const wrongBannerText = isA ? 'text-sm font-semibold text-[color:var(--accent-rose)]' : 'text-sm text-rose-700 font-semibold';
  const retryBtnCls = isA
    ? 'text-xs font-semibold underline whitespace-nowrap text-[color:var(--accent-rose)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] rounded'
    : 'text-xs font-semibold text-rose-600 underline hover:text-rose-800 whitespace-nowrap';
  const submitActive = isA
    ? 'btn-soft-glow text-sm font-semibold'
    : 'bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent';
  const submitDisabled = isA
    ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed';

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={promptCls}>
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => toggleSelect(option.id)}
            disabled={submitted}
            className={`p-4 rounded-xl border-2 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)] ${
              submitted
                ? selected.has(option.id)
                  ? isCorrect ? optionCorrect : optionWrong
                  : optionDimmed
                : selected.has(option.id) ? optionSelected : optionIdle
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {selected.has(option.id) ? (
                  <CheckCircle className={checkCircleOn} />
                ) : (
                  <Circle className={checkCircleOff} />
                )}
              </div>
              <div className="flex-grow">
                <p className={optionLabelCls}>{option.label}</p>
                {option.explanation && (
                  <p className={optionExplainCls}>
                    {option.explanation}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Feedback — shown after submit */}
      {submitted && (
        isCorrect ? (
          <div className={correctBannerCls}>
            <p className={correctBannerText}>✓ Correct choice!</p>
          </div>
        ) : (
          <div className={wrongBannerCls}>
            <p className={wrongBannerText}>✗ Not quite — review the options and try again.</p>
            <button
              onClick={handleRetry}
              className={retryBtnCls}
            >
              Try again
            </button>
          </div>
        )
      )}

      {onComplete && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
            selected.size > 0 ? submitActive : submitDisabled
          }`}
        >
          Submit answer
        </button>
      )}
    </div>
  );
}
