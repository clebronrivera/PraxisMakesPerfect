// src/components/QuizQuestionBubble.tsx
// Renders a quiz question with radio (single-select) or checkbox (multi-select)
// answer choices. Becomes read-only after submission.

import { useState } from 'react';
import { CheckSquare, Circle } from 'lucide-react';

interface Choice {
  label: string;
  text: string;
}

interface QuizQuestionBubbleProps {
  questionId: string;
  skillId: string;
  stem: string;
  choices: Choice[];
  isMultiSelect: boolean;
  onSubmit: (questionId: string, selectedAnswers: string[]) => void;
  disabled?: boolean;
  isSubmitted?: boolean;
}

export function QuizQuestionBubble({
  questionId,
  stem,
  choices,
  isMultiSelect,
  onSubmit,
  disabled,
  isSubmitted,
}: QuizQuestionBubbleProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (label: string) => {
    if (isSubmitted || disabled) return;
    if (isMultiSelect) {
      setSelected(prev =>
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    } else {
      setSelected([label]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0 || isSubmitted || disabled) return;
    onSubmit(questionId, selected);
  };

  return (
    <div
      className={`mt-2 p-4 rounded-xl border backdrop-blur-[14px] ${
        isSubmitted
          ? 'border-white/6 bg-[rgba(10,22,40,0.35)] opacity-75'
          : 'border-white/8 bg-[rgba(10,22,40,0.55)]'
      }`}
    >
      {isMultiSelect && !isSubmitted && (
        <p
          className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-2 flex items-center gap-1"
          style={{ color: 'var(--d1-peach)' }}
        >
          <CheckSquare className="w-3 h-3" />
          Select all that apply
        </p>
      )}

      <p className="text-sm text-white font-medium mb-3">{stem}</p>

      <div className="space-y-2">
        {choices.map(choice => {
          const isSelected = selected.includes(choice.label);
          return (
            <button
              key={choice.label}
              onClick={() => toggle(choice.label)}
              disabled={isSubmitted || disabled}
              className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border text-sm transition-colors
                ${isSelected
                  ? 'border-[color:var(--d1-peach)]/50 bg-[color:var(--d1-peach)]/10 text-white'
                  : 'border-white/8 bg-[rgba(10,22,40,0.45)] text-slate-300 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/5'
                }
                ${(isSubmitted || disabled) ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-${isMultiSelect ? 'sm' : 'full'} border-2 flex items-center justify-center mt-0.5
                  ${isSelected ? 'border-[color:var(--d1-peach)] bg-[color:var(--d1-peach)]/80' : 'border-white/30'}
                `}
              >
                {isSelected && (
                  isMultiSelect
                    ? <span className="text-[#0a1628] text-[10px] font-bold">✓</span>
                    : <Circle className="w-2 h-2 fill-[#0a1628] text-[#0a1628]" />
                )}
              </span>
              <span>
                <span className="font-semibold mr-1">{choice.label}.</span>
                {choice.text}
              </span>
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || disabled}
          className="btn-soft-glow mt-3 w-full py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      )}

      {isSubmitted && (
        <p className="mt-2 text-xs text-slate-500 italic">Answer submitted — see explanation above.</p>
      )}
    </div>
  );
}
