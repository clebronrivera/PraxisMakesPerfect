/**
 * TermSprintSession — rapid-fire vocabulary game.
 *
 * 20 questions, 10 seconds each, with automatic countdown and auto-advance.
 * Two modes alternate randomly: term-to-definition and definition-to-term.
 * Sources all questions from the master glossary via vocabQuizGenerator.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, XCircle, Timer, Trophy, RotateCcw, LogOut } from 'lucide-react';
import { generateVocabQuiz, type VocabQuizItem } from '../utils/vocabQuizGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TermSprintSessionProps {
  userId: string;
  onFinish: (score: { correct: number; total: number }) => void;
  onExit: () => void;
}

type Phase = 'playing' | 'finished';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 20;
const SECONDS_PER_QUESTION = 10;
const FEEDBACK_DURATION_MS = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQueue(): VocabQuizItem[] {
  const items = generateVocabQuiz({
    count: TOTAL_QUESTIONS,
    types: ['term', 'definition'],
  });
  // Fall back to fewer questions if glossary has < TOTAL_QUESTIONS eligible terms
  return items;
}

/** Map seconds remaining to a Tailwind color class for the timer bar. */
function timerBarClass(t: number): string {
  if (t > 6) return 'bg-emerald-400';
  if (t > 3) return 'bg-amber-400';
  return 'bg-red-400';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TermSprintSession({ onFinish, onExit }: TermSprintSessionProps) {
  // Build queue once on mount — synchronous, no loading state needed
  const [queue] = useState<VocabQuizItem[]>(buildQueue);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Ref to block multiple advance calls racing on the same question
  const advancePending = useRef(false);

  // ── Advance to next question (or finish) ──────────────────────────────────
  function advanceQuestion(nextIndex: number) {
    if (nextIndex >= queue.length) {
      setPhase('finished');
      return;
    }
    setCurrentIndex(nextIndex);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setTimeLeft(SECONDS_PER_QUESTION);
    advancePending.current = false;
  }

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || isRevealed) return;

    if (timeLeft <= 0) {
      // Time ran out — mark wrong, then advance
      if (!advancePending.current) {
        advancePending.current = true;
        setWrongCount(n => n + 1);
        setIsRevealed(true);
        const t = setTimeout(() => advanceQuestion(currentIndex + 1), FEEDBACK_DURATION_MS);
        return () => clearTimeout(t);
      }
      return;
    }

    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, isRevealed, currentIndex]);

  // ── Handle user answer selection ──────────────────────────────────────────
  function handleSelect(label: string) {
    if (isRevealed || advancePending.current) return;
    advancePending.current = true;

    const item = queue[currentIndex];
    const correct = label === item.correctLabel;

    setSelectedAnswer(label);
    setIsRevealed(true);
    if (correct) {
      setCorrectCount(n => n + 1);
    } else {
      setWrongCount(n => n + 1);
    }

    setTimeout(() => advanceQuestion(currentIndex + 1), FEEDBACK_DURATION_MS);
  }

  // ── Notify parent when finished ───────────────────────────────────────────
  useEffect(() => {
    if (phase === 'finished') {
      onFinish({ correct: correctCount, total: correctCount + wrongCount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const scorePct = useMemo(() => {
    const total = correctCount + wrongCount;
    return total > 0 ? Math.round((correctCount / total) * 100) : 0;
  }, [correctCount, wrongCount]);

  // ── Finished screen ───────────────────────────────────────────────────────
  if (phase === 'finished') {
    const total = correctCount + wrongCount;
    const colorClass =
      scorePct >= 80
        ? 'text-emerald-700'
        : scorePct >= 60
          ? 'text-amber-700'
          : 'text-red-700';
    const bgClass =
      scorePct >= 80
        ? 'bg-emerald-50 border-emerald-200'
        : scorePct >= 60
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200';

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12 px-6">
        {/* Score card */}
        <div className={`w-full rounded-2xl border p-6 text-center ${bgClass}`}>
          <Trophy className={`mx-auto mb-3 h-12 w-12 ${colorClass}`} />
          <div className={`text-5xl font-black ${colorClass}`}>{scorePct}%</div>
          <div className="mt-2 text-sm text-stone-600">
            {correctCount} correct out of {total}
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex w-full divide-x divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex-1 py-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
            <div className="text-xs text-stone-500">Correct</div>
          </div>
          <div className="flex-1 py-4 text-center">
            <div className="text-2xl font-bold text-red-500">{wrongCount}</div>
            <div className="text-xs text-stone-500">Missed</div>
          </div>
          <div className="flex-1 py-4 text-center">
            <div className="text-2xl font-bold text-stone-700">{total}</div>
            <div className="text-xs text-stone-500">Total</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <button
            onClick={onExit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-stone-200 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
          >
            <LogOut size={14} /> Exit
          </button>
          <button
            onClick={() => {
              // Reset all state for a fresh sprint
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setIsRevealed(false);
              setTimeLeft(SECONDS_PER_QUESTION);
              setCorrectCount(0);
              setWrongCount(0);
              advancePending.current = false;
              setPhase('playing');
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <RotateCcw size={14} /> Play Again
          </button>
        </div>
      </div>
    );
  }

  // ── Playing screen ────────────────────────────────────────────────────────
  if (queue.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-stone-500">No terms available — check glossary data.</p>
      </div>
    );
  }

  const item = queue[currentIndex];
  if (!item) return null;

  // VocabQuizGenerator: type='definition' means show term → pick definition
  const isTermToDefinition = item.type === 'definition';
  const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 py-6 px-4">

      {/* ── Header: progress + score ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-stone-400" />
          <span className="text-xs font-semibold text-stone-500">
            Question {currentIndex + 1} of {queue.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-emerald-600">{correctCount} correct</span>
          <span className="text-red-500">{wrongCount} missed</span>
        </div>
      </div>

      {/* ── Timer bar ────────────────────────────────────────────────── */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerBarClass(timeLeft)}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* ── Mode badge + seconds ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
          {isTermToDefinition ? 'Term → Definition' : 'Definition → Term'}
        </span>
        <span className="text-[11px] text-stone-400">{timeLeft}s</span>
      </div>

      {/* ── Question card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="mb-1 text-xs font-medium text-stone-400">
          {isTermToDefinition ? 'What does this term mean?' : 'Which term matches this definition?'}
        </p>
        <p className="text-base font-semibold leading-relaxed text-stone-800">{item.prompt}</p>
      </div>

      {/* ── Choices: 2×2 grid on sm+, stacked on mobile ──────────────── */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {item.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.label;
          const isCorrectChoice = choice.label === item.correctLabel;

          let style =
            'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 cursor-pointer active:scale-[0.99]';

          if (isRevealed) {
            if (isCorrectChoice) {
              style = 'border-emerald-400 bg-emerald-50 cursor-default';
            } else if (isSelected) {
              style = 'border-red-400 bg-red-50 cursor-default';
            } else {
              style = 'border-stone-100 bg-stone-50 opacity-50 cursor-default';
            }
          }

          return (
            <button
              key={choice.label}
              onClick={() => handleSelect(choice.label)}
              disabled={isRevealed}
              className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${style}`}
            >
              {/* Label badge */}
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isRevealed && isCorrectChoice
                    ? 'bg-emerald-500 text-white'
                    : isRevealed && isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-stone-100 text-stone-600'
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
              <span
                className={`text-sm leading-relaxed ${
                  isRevealed && !isCorrectChoice && !isSelected ? 'text-stone-400' : 'text-stone-800'
                }`}
              >
                {choice.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Feedback strip ─────────────────────────────────────────────── */}
      {isRevealed && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
            selectedAnswer === item.correctLabel
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : selectedAnswer === null
                ? 'border border-stone-200 bg-stone-50 text-stone-600'
                : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {selectedAnswer === item.correctLabel
            ? 'Correct!'
            : selectedAnswer === null
              ? `Time's up — the answer was: ${item.correctTerm}`
              : `Not quite — the answer is: ${item.correctTerm}`}
        </div>
      )}

      {/* ── Exit link ───────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <button
          onClick={onExit}
          className="text-xs text-stone-400 underline underline-offset-2 hover:text-stone-600"
        >
          Exit Sprint
        </button>
      </div>
    </div>
  );
}
