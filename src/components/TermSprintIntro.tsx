/**
 * TermSprintIntro — launch screen shown before a Term Sprint game.
 *
 * Displays a brief description of the game rules and a "Start Sprint" button.
 * The parent (App.tsx) swaps this out for <TermSprintSession> when started.
 */

import { useState } from 'react';
import { Zap, Clock, BookOpen, ArrowRight, X } from 'lucide-react';
import TermSprintSession from './TermSprintSession';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TermSprintIntroProps {
  userId: string;
  onExit: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TermSprintIntro({ userId, onExit }: TermSprintIntroProps) {
  const [started, setStarted] = useState(false);

  // Once started, delegate fully to TermSprintSession.
  // On finish or exit from the session, we call onExit to return to Practice Hub.
  if (started) {
    return (
      <TermSprintSession
        userId={userId}
        onFinish={() => onExit()}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 px-6">

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <Zap className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-stone-900">Term Sprint</h1>
        <p className="mt-1 text-sm text-stone-500">Rapid-fire vocabulary challenge</p>
      </div>

      {/* Rules card */}
      <div className="w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">10 seconds per question</p>
              <p className="text-xs text-stone-500">Answer before the timer runs out or the question is marked wrong.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">20 questions, two directions</p>
              <p className="text-xs text-stone-500">
                Each question is either term→definition or definition→term — drawn at random from the 396-term glossary.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <ArrowRight className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Auto-advance after each answer</p>
              <p className="text-xs text-stone-500">You'll see feedback for 1.5 seconds, then the next question loads automatically.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <button
          onClick={() => setStarted(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98]"
        >
          <Zap size={16} /> Start Sprint
        </button>
        <button
          onClick={onExit}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 py-3 text-sm font-semibold text-stone-500 transition hover:bg-stone-50"
        >
          <X size={14} /> Exit
        </button>
      </div>

    </div>
  );
}
