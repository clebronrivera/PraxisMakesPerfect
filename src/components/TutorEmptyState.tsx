// src/components/TutorEmptyState.tsx
// First-use experience for each session type.

import { Bot, Lock, Sparkles, ClipboardList, BookOpen, Shuffle } from 'lucide-react';
import { TutorSuggestedChips } from './TutorSuggestedChips';
import type { TutorSkillSnapshot } from '../types/tutorChat';

interface TutorEmptyStateProps {
  sessionType: 'page-tutor' | 'floating';
  diagnosticComplete: boolean;
  emergingSkills?: TutorSkillSnapshot[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const PAGE_TUTOR_CHIPS_COMPLETE = [
  'Quiz me on my weakest skill',
  'Give me a vocabulary list',
  'What are my biggest gaps?',
];

const STUDY_ACTIVITIES = [
  {
    icon: ClipboardList,
    label: 'Practice Questions',
    sublabel: 'Printable set based on weak areas',
    message: 'Generate a practice set of questions based on my weak areas',
  },
  {
    icon: BookOpen,
    label: 'Fill-in-the-Blank',
    sublabel: 'Word bank for key vocabulary',
    message: 'Create a fill-in-the-blank word bank activity for the terms I need to learn',
  },
  {
    icon: Shuffle,
    label: 'Matching Activity',
    sublabel: 'Drag-and-drop term matching',
    message: 'Make a matching activity so I can practice matching terms to their definitions',
  },
];

const PAGE_TUTOR_CHIPS_NO_DIAGNOSTIC = [
  'Tell me about the adaptive diagnostic',
  'How do I get started?',
];

const FLOATING_CHIPS = [
  'How do I use this app?',
  'What should I do first?',
  'Tell me about the diagnostic',
];

export function TutorEmptyState({
  sessionType,
  diagnosticComplete,
  emergingSkills = [],
  onSelect,
  disabled,
}: TutorEmptyStateProps) {
  if (sessionType === 'floating') {
    return (
      <div className="flex flex-col items-center text-center px-4 py-6 gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Bot className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">Hi! I'm PraxisBot</p>
          <p className="text-xs text-stone-500 mt-1">
            I can help you navigate the app and answer Praxis 5403 questions.
            {!diagnosticComplete && ' Complete the diagnostic for deeper personalization.'}
          </p>
        </div>
        <TutorSuggestedChips suggestions={FLOATING_CHIPS} onSelect={onSelect} disabled={disabled} />
      </div>
    );
  }

  // page-tutor, no diagnostic
  if (!diagnosticComplete) {
    return (
      <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-stone-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-stone-700">Complete the adaptive diagnostic to unlock personalized tutoring</p>
          <p className="text-sm text-stone-500 mt-2">
            Once you finish the diagnostic, PraxisBot will know your full skill profile and can quiz you on weak areas, explain concepts, and generate focused study materials.
          </p>
        </div>
        <TutorSuggestedChips suggestions={PAGE_TUTOR_CHIPS_NO_DIAGNOSTIC} onSelect={onSelect} disabled={disabled} />
      </div>
    );
  }

  // page-tutor, diagnostic complete
  const top3 = emergingSkills.slice(0, 3);

  return (
    <div className="flex flex-col px-6 py-8 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800">I know your skill profile.</p>
          <p className="text-xs text-stone-500">Here's what I see so far:</p>
        </div>
      </div>

      {top3.length > 0 && (
        <div className="editorial-surface bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Skills needing the most work</p>
          {top3.map(s => (
            <div key={s.skillId} className="flex items-center justify-between">
              <span className="text-sm text-stone-700">{s.skillName}</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {s.accuracy !== null ? `${Math.round(s.accuracy * 100)}%` : 'Not started'}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-stone-600">What would you like to work on?</p>

      <TutorSuggestedChips
        suggestions={PAGE_TUTOR_CHIPS_COMPLETE}
        onSelect={onSelect}
        disabled={disabled}
      />

      <div className="pt-1">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Study Activities</p>
        <div className="flex flex-col gap-2">
          {STUDY_ACTIVITIES.map(({ icon: Icon, label, sublabel, message }) => (
            <button
              key={label}
              onClick={() => !disabled && onSelect(message)}
              disabled={disabled}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg border border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 leading-tight">{label}</p>
                <p className="text-xs text-stone-500">{sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
