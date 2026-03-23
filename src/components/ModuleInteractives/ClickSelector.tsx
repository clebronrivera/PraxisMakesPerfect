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
}: ClickSelectorProps) {
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

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-600 italic">
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => toggleSelect(option.id)}
            disabled={submitted}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              submitted
                ? selected.has(option.id)
                  ? isCorrect
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-rose-50 border-rose-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
                : selected.has(option.id)
                  ? 'bg-cyan-50 border-cyan-400'
                  : 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {selected.has(option.id) ? (
                  <CheckCircle className="w-5 h-5 text-cyan-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-slate-800">{option.label}</p>
                {option.explanation && (
                  <p className="text-xs text-slate-600 mt-1.5 leading-normal">
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
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-sm text-emerald-700 font-semibold">✓ Correct choice!</p>
          </div>
        ) : (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-700 font-semibold">✗ Not quite — review the options and try again.</p>
            <button
              onClick={handleRetry}
              className="text-xs font-semibold text-rose-600 underline hover:text-rose-800 whitespace-nowrap"
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
            selected.size > 0
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white border border-transparent'
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Submit answer
        </button>
      )}
    </div>
  );
}
