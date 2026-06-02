/**
 * FluencyDrillSession — rapid-fire vocabulary drill (the Fluency Drill core game).
 *
 * Resurrected and extended from the archived `TermSprintSession` (commit 35db028):
 *   - scoped to a caller-provided set of terms (`restrictToTerms`) instead of the
 *     whole glossary,
 *   - configurable direction (def→term / term→def / mixed) and per-direction timer,
 *   - reports every answer back to the parent via `onTermResult` so misses can feed
 *     skill priority and the glossary (Option B1 data-feedback model).
 *
 * Sources questions from the master glossary via `generateVocabQuiz`; resolves each
 * answered term back to its skills via `vocabSkillIndex`. Restyled to the atelier
 * dark theme to match the rest of the app.
 */

import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Timer, Pause, Play } from 'lucide-react';
import { generateVocabQuiz, type VocabQuizItem, type QuizType } from '../utils/vocabQuizGenerator';
import { skillsForTerm } from '../utils/vocabSkillIndex';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrillDirection = 'def-to-term' | 'term-to-def' | 'mixed';

/** Per-answer result reported to the parent. */
export interface TermResult {
  term: string;
  /** Skills that list this term as vocabulary (may be empty). */
  skillIds: string[];
  correct: boolean;
  timedOut: boolean;
  direction: QuizType;
}

export interface FluencyDrillSessionProps {
  /** Terms in scope for this drill (restricts the question pool). */
  terms: string[];
  direction: DrillDirection;
  /** Seconds allowed per card, per direction. */
  secondsByDirection?: { term: number; definition: number };
  /** Max cards in the drill (capped by available terms). */
  maxCards?: number;
  /** Fired once per answered (or timed-out) card. */
  onTermResult?: (result: TermResult) => void;
  /** Fired when the drill finishes, with the final tally. */
  onFinish: (score: { correct: number; total: number }) => void;
  onExit: () => void;
}

type Phase = 'playing' | 'finished';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SECONDS = { term: 7, definition: 10 } as const; // def→term 7s · term→def 10s
const DEFAULT_MAX_CARDS = 20;
const FEEDBACK_DURATION_MS = 1300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typesForDirection(direction: DrillDirection): QuizType[] {
  // generator `type`: 'term' = show definition → pick term ; 'definition' = show term → pick definition
  if (direction === 'def-to-term') return ['term'];
  if (direction === 'term-to-def') return ['definition'];
  return ['term', 'definition'];
}

/** True when the user has asked the OS to reduce motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Map seconds remaining to a semantic accent for the timer bar (light theme). */
function timerColor(t: number, total: number): string {
  const frac = total > 0 ? t / total : 0;
  if (frac > 0.5) return '#10b981'; // emerald
  if (frac > 0.25) return '#f59e0b'; // amber
  return '#f43f5e'; // rose
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FluencyDrillSession({
  terms,
  direction,
  secondsByDirection = DEFAULT_SECONDS,
  maxCards = DEFAULT_MAX_CARDS,
  onTermResult,
  onFinish,
  onExit,
}: FluencyDrillSessionProps) {
  const buildQueue = (): VocabQuizItem[] =>
    generateVocabQuiz({
      count: maxCards,
      types: typesForDirection(direction),
      restrictToTerms: terms,
    });

  const [queue] = useState<VocabQuizItem[]>(buildQueue);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Honor the OS reduce-motion setting; the numeric "Ns" still conveys time.
  const [reduceMotion] = useState(prefersReducedMotion);

  const item = queue[currentIndex];
  const secondsForItem = item
    ? item.type === 'term'
      ? secondsByDirection.term
      : secondsByDirection.definition
    : 0;
  const [timeLeft, setTimeLeft] = useState(secondsForItem);

  // Blocks multiple advance calls racing on the same card
  const advancePending = useRef(false);

  // ── Report one card's outcome to the parent ───────────────────────────────
  function report(correct: boolean, timedOut: boolean) {
    if (!item || !onTermResult) return;
    onTermResult({
      term: item.correctTerm,
      skillIds: skillsForTerm(item.correctTerm),
      correct,
      timedOut,
      direction: item.type,
    });
  }

  // ── Advance to next card (or finish) ──────────────────────────────────────
  function advance(nextIndex: number) {
    if (nextIndex >= queue.length) {
      setPhase('finished');
      return;
    }
    const next = queue[nextIndex];
    setCurrentIndex(nextIndex);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setTimeLeft(next.type === 'term' ? secondsByDirection.term : secondsByDirection.definition);
    setIsPaused(false);
    advancePending.current = false;
  }

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    // While paused (WCAG 2.2.1), the clock does not decrement and timeout cannot fire.
    if (phase !== 'playing' || isRevealed || isPaused) return;

    if (timeLeft <= 0) {
      if (!advancePending.current) {
        advancePending.current = true;
        setWrongCount((n) => n + 1);
        setStreak(0);
        setIsRevealed(true);
        report(false, true);
        const t = setTimeout(() => advance(currentIndex + 1), FEEDBACK_DURATION_MS);
        return () => clearTimeout(t);
      }
      return;
    }

    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase, isRevealed, currentIndex, isPaused]);

  // ── Handle answer selection ───────────────────────────────────────────────
  function handleSelect(label: string) {
    if (isRevealed || advancePending.current || !item) return;
    advancePending.current = true;

    const correct = label === item.correctLabel;
    setSelectedAnswer(label);
    setIsRevealed(true);
    if (correct) {
      setCorrectCount((n) => n + 1);
      setStreak((n) => n + 1);
    } else {
      setWrongCount((n) => n + 1);
      setStreak(0);
    }
    report(correct, false);

    setTimeout(() => advance(currentIndex + 1), FEEDBACK_DURATION_MS);
  }

  // ── Notify parent when finished ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'finished') {
      onFinish({ correct: correctCount, total: correctCount + wrongCount });
    }
  }, [phase]);

  // Once finished, the parent page swaps in the results screen.
  if (phase === 'finished') return null;

  // ── Empty / playing ───────────────────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-slate-500">Not enough terms in this scope to build a drill (need at least 4).</p>
        <button onClick={onExit} className="editorial-button-primary">Back</button>
      </div>
    );
  }
  if (!item) return null;

  const isTermToDefinition = item.type === 'definition';
  const total = item.type === 'term' ? secondsByDirection.term : secondsByDirection.definition;
  const timerPct = total > 0 ? (timeLeft / total) * 100 : 0;
  const barColor = timerColor(timeLeft, total);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 py-6 px-4">
      {/* Header: progress + score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">
            Card {currentIndex + 1} of {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-slate-500">Streak {streak}</span>
          <span className="text-emerald-600">{correctCount} ✓</span>
          <span className="text-rose-500">{wrongCount} ✗</span>
        </div>
      </div>

      {/* Timer bar — numeric "Ns" below conveys time; motion is decorative only */}
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="timer"
        aria-label={`Time remaining: ${timeLeft} seconds${isPaused ? ', paused' : ''}`}
      >
        <div
          className={`h-full rounded-full ${reduceMotion ? '' : 'transition-all duration-1000 ease-linear'}`}
          style={{ width: `${timerPct}%`, background: barColor }}
        />
      </div>

      {/* Direction badge + seconds + pause/resume (WCAG 2.2.1) */}
      <div className="flex items-center gap-2">
        <span className="editorial-pill">
          {isTermToDefinition ? 'Term → Definition' : 'Definition → Term'}
        </span>
        <span className="text-[11px] text-slate-400">{timeLeft}s</span>
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          disabled={isRevealed}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Question card */}
      <div className="editorial-surface p-5">
        <p className="mb-1 text-xs font-medium text-slate-400">
          {isTermToDefinition ? 'What does this term mean?' : 'Which term matches this definition?'}
        </p>
        <p className="text-base font-semibold leading-relaxed text-slate-900">{item.prompt}</p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {item.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.label;
          const isCorrectChoice = choice.label === item.correctLabel;

          let cls = 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 cursor-pointer';
          if (isRevealed) {
            if (isCorrectChoice) cls = 'border-emerald-400 bg-emerald-50 cursor-default';
            else if (isSelected) cls = 'border-rose-400 bg-rose-50 cursor-default';
            else cls = 'border-slate-100 bg-slate-50 opacity-60 cursor-default';
          }

          return (
            <button
              key={choice.label}
              onClick={() => handleSelect(choice.label)}
              disabled={isRevealed}
              aria-label={`Choice ${choice.label}: ${choice.text}`}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${cls}`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isRevealed && isCorrectChoice
                    ? 'bg-emerald-500 text-white'
                    : isRevealed && isSelected
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isRevealed && isCorrectChoice ? (
                  <CheckCircle2 size={13} />
                ) : isRevealed && isSelected ? (
                  <XCircle size={13} />
                ) : (
                  choice.label
                )}
              </span>
              <span className={`text-sm leading-relaxed ${isRevealed && !isCorrectChoice && !isSelected ? 'text-slate-400' : 'text-slate-800'}`}>
                {choice.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback strip */}
      {isRevealed && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold border ${
            selectedAnswer === item.correctLabel
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : selectedAnswer === null
                ? 'border-slate-200 bg-slate-50 text-slate-600'
                : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {selectedAnswer === item.correctLabel
            ? 'Correct!'
            : selectedAnswer === null
              ? `Time's up — the answer was: ${item.correctTerm}`
              : `Not quite — the answer is: ${item.correctTerm}`}
        </div>
      )}

      {/* Exit */}
      <div className="flex justify-center">
        <button
          onClick={onExit}
          aria-label="Exit drill"
          className="rounded text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Exit drill
        </button>
      </div>
    </div>
  );
}
