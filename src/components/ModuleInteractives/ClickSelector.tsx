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

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (singleSelect) {
      // Clear all and select only this one
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
  const allCorrectSelected =
    hasCorrectAnswer &&
    selected.size > 0 &&
    Array.from(selected).every(id => options.find(o => o.id === id)?.isCorrect);

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-300 italic">
          {prompt}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => toggleSelect(option.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selected.has(option.id)
                ? 'bg-cyan-600/20 border-cyan-500/50'
                : 'bg-slate-800/60 border-slate-600/40 hover:border-cyan-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {selected.has(option.id) ? (
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-slate-200">{option.label}</p>
                {option.explanation && (
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {option.explanation}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {allCorrectSelected && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm text-emerald-300 font-semibold">✓ Correct choice!</p>
        </div>
      )}

      {onComplete && (
        <button
          onClick={() => onComplete(Array.from(selected))}
          disabled={selected.size === 0}
          className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
            selected.size > 0
              ? 'bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300'
              : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 cursor-not-allowed'
          }`}
        >
          Complete activity
        </button>
      )}
    </div>
  );
}
