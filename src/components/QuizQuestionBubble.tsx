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
    <div className={`editorial-surface mt-2 p-4 rounded-lg border ${isSubmitted ? 'border-stone-200 bg-stone-50 opacity-75' : 'border-amber-200 bg-white'}`}>
      {isMultiSelect && !isSubmitted && (
        <p className="text-xs text-amber-700 font-medium mb-2 flex items-center gap-1">
          <CheckSquare className="w-3 h-3" />
          Select all that apply
        </p>
      )}

      <p className="text-sm text-stone-800 font-medium mb-3">{stem}</p>

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
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/50'
                }
                ${(isSubmitted || disabled) ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`shrink-0 w-5 h-5 rounded-${isMultiSelect ? 'sm' : 'full'} border-2 flex items-center justify-center mt-0.5
                ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-stone-300'}
              `}>
                {isSelected && (
                  isMultiSelect
                    ? <span className="text-white text-[10px] font-bold">✓</span>
                    : <Circle className="w-2 h-2 fill-white text-white" />
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
          className="mt-3 w-full py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      )}

      {isSubmitted && (
        <p className="mt-2 text-xs text-stone-500 italic">Answer submitted — see explanation above.</p>
      )}
    </div>
  );
}
