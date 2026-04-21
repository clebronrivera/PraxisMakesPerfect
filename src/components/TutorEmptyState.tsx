// src/components/TutorEmptyState.tsx
// First-use experience for each session type — atelier styling.

import { Lock, Sparkles, ClipboardList, BookOpen, Shuffle } from 'lucide-react';
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
    accent: 'var(--d1-peach)',
  },
  {
    icon: BookOpen,
    label: 'Fill-in-the-Blank',
    sublabel: 'Word bank for key vocabulary',
    message: 'Create a fill-in-the-blank word bank activity for the terms I need to learn',
    accent: 'var(--d3-ice)',
  },
  {
    icon: Shuffle,
    label: 'Matching Activity',
    sublabel: 'Drag-and-drop term matching',
    message: 'Make a matching activity so I can practice matching terms to their definitions',
    accent: 'var(--d4-lavender)',
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
        <div className="mini-orb" style={{ width: 40, height: 40 }} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-white">Hi, I'm your tutor</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
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
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(226,232,240,0.06)', border: '1px solid rgba(226,232,240,0.1)' }}
        >
          <Lock className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">Complete the adaptive diagnostic to unlock personalized tutoring</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
            Once you finish the diagnostic, the tutor will know your full skill profile and can quiz you on weak areas, explain concepts, and generate focused study materials.
          </p>
        </div>
        <TutorSuggestedChips suggestions={PAGE_TUTOR_CHIPS_NO_DIAGNOSTIC} onSelect={onSelect} disabled={disabled} />
      </div>
    );
  }

  // page-tutor, diagnostic complete
  const top3 = emergingSkills.slice(0, 3);

  return (
    <div className="flex flex-col px-5 py-6 gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--d1-peach) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--d1-peach) 30%, transparent)',
          }}
        >
          <Sparkles className="w-5 h-5" style={{ color: 'var(--d1-peach)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">I know your skill profile.</p>
          <p className="text-xs text-slate-400">Here's what I see so far:</p>
        </div>
      </div>

      {top3.length > 0 && (
        <div className="glass p-4 space-y-2">
          <p className="eyebrow">Skills needing the most work</p>
          {top3.map(s => {
            const pct = s.accuracy !== null ? Math.round(s.accuracy * 100) : null;
            const pctColor = pct === null
              ? 'var(--d3-ice)'
              : pct < 40 ? 'var(--accent-rose)'
              : pct < 60 ? 'var(--d1-peach)'
              : 'var(--d2-mint)';
            return (
              <div key={s.skillId} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-slate-200 truncate">{s.skillName}</span>
                <span
                  className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                  style={{
                    color: pctColor,
                    background: `color-mix(in srgb, ${pctColor} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${pctColor} 30%, transparent)`,
                  }}
                >
                  {pct !== null ? `${pct}%` : 'Not started'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-sm text-slate-300">What would you like to work on?</p>

      <TutorSuggestedChips
        suggestions={PAGE_TUTOR_CHIPS_COMPLETE}
        onSelect={onSelect}
        disabled={disabled}
      />

      <div className="pt-1">
        <p className="eyebrow mb-2">Study activities</p>
        <div className="flex flex-col gap-2">
          {STUDY_ACTIVITIES.map(({ icon: Icon, label, sublabel, message, accent }) => (
            <button
              key={label}
              onClick={() => !disabled && onSelect(message)}
              disabled={disabled}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
              style={{
                background: 'rgba(10,22,40,0.5)',
                border: '1px solid rgba(226,232,240,0.08)',
              }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
                  color: accent,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white leading-tight truncate">{label}</p>
                <p className="text-[11px] text-slate-400">{sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
