// src/components/RedemptionRoundSession.tsx
//
// Redemption Rounds session UI.
//
// Design rules:
//   - 90-second countdown per question. Expiry = skipped = incorrect.
//   - NO feedback, NO explanation, NO hint after submitting — immediately advance.
//   - 3 correct answers to clear a question. No confidence shortcuts.
//   - End screen shows X/Y correct + personal best.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, RotateCcw, Home, ChevronRight, Trophy } from 'lucide-react';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { getQuestionCorrectAnswers } from '../brain/question-analyzer';
import type { MissedQuestion, RoundResult } from '../hooks/useRedemptionRounds';

const SECONDS_PER_QUESTION = 90;

interface RedemptionRoundSessionProps {
  /** Ordered, shuffled list of missed questions for this round */
  questions: AnalyzedQuestion[];
  /** Parallel array matching questions[] — bank rows needed for correct_count */
  missedRows: MissedQuestion[];
  /** Personal best going into this round */
  highScore: number;
  onComplete: (results: RoundResult[]) => void;
  onExit: () => void;
}

export default function RedemptionRoundSession({
  questions,
  missedRows,
  highScore,
  onComplete,
  onExit,
}: RedemptionRoundSessionProps) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [done, setDone] = useState(false);

  // Prevent double-advance (timer + click racing)
  const advancingRef = useRef(false);

  const currentQ = questions[index];
  const currentRow = missedRows[index];

  // ── Advance to next question (or finish) ─────────────────────────────────
  const advance = useCallback((answer: string | null) => {
    if (advancingRef.current || !currentQ || !currentRow) return;
    advancingRef.current = true;

    const correctList = getQuestionCorrectAnswers(currentQ);
    const isCorrect = answer !== null &&
      correctList.includes(answer) &&
      correctList.length === 1; // single-select only

    const result: RoundResult = {
      questionId: currentQ.id,
      isCorrect,
      missedRowId: currentRow.id,
      correct_count: currentRow.correct_count,
    };

    setResults(prev => {
      const next = [...prev, result];
      if (index + 1 >= questions.length) {
        setDone(true);
      }
      return next;
    });

    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
      setTimeLeft(SECONDS_PER_QUESTION);
      setSelectedAnswer(null);
      advancingRef.current = false;
    }
    // If last question, done=true triggers onComplete via useEffect below
  }, [currentQ, currentRow, index, questions.length]);

  // ── Notify parent when round is done ─────────────────────────────────────
  useEffect(() => {
    if (done && results.length === questions.length) {
      onComplete(results);
    }
  }, [done, results.length]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (done) return;

    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          // Timer expired → skipped = incorrect
          advance(null);
          return SECONDS_PER_QUESTION;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  // advance is stable via useCallback; re-run when question changes (index)
  }, [index, done]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!selectedAnswer) return;
    advance(selectedAnswer);
  };

  // ── End screen ────────────────────────────────────────────────────────────
  if (done) {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const newBest = scorePct > highScore;

    return (
      <div className="mx-auto max-w-lg py-12 px-4 text-center space-y-8">
        <div className="editorial-surface p-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-amber-50">
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
          </div>

          <div>
            <p className="editorial-overline mb-2">Redemption Round Complete</p>
            <p className="text-4xl font-black italic tracking-tighter text-slate-900">
              {correct} / {total}
            </p>
            <p className="mt-2 text-lg font-bold text-slate-700">{scorePct}% correct</p>
          </div>

          {newBest ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-black uppercase tracking-[0.1em] text-amber-700">New personal best!</p>
              <p className="mt-1 text-xs text-amber-600">Previous best: {Math.round(highScore)}%</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Personal best</p>
              <p className="mt-1 text-lg font-black italic text-slate-700">{Math.round(Math.max(highScore, scorePct))}%</p>
            </div>
          )}

          <button onClick={onExit} className="editorial-button-primary w-full">
            <Home className="w-4 h-4" />
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Round in progress ─────────────────────────────────────────────────────
  if (!currentQ) return null;

  const letters = Object.keys(currentQ.choices || {});
  const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const timerWarning = timeLeft <= 15;
  const canSubmit = selectedAnswer !== null;

  return (
    <div className="mx-auto max-w-2xl py-6 px-4 space-y-6">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Timer className={`h-4 w-4 ${timerWarning ? 'text-red-500' : 'text-slate-400'}`} />
          <span className={`text-sm font-black tabular-nums ${timerWarning ? 'text-red-500' : 'text-slate-500'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="flex-1 mx-4">
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerWarning ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 shrink-0">
          {index + 1} / {questions.length}
        </span>
      </div>

      {/* ── Redemption badge ── */}
      <div className="flex items-center gap-2">
        <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-amber-700">Redemption Round</span>
      </div>

      {/* ── Question card ── */}
      <div className="editorial-surface p-6 space-y-6">
        <p className="text-base font-semibold leading-relaxed text-slate-900">
          {currentQ.question}
        </p>

        {/* ── Answer choices ── */}
        <div className="space-y-2">
          {letters.map(letter => {
            const choiceText = (currentQ.choices as Record<string, string>)[letter] ?? '';
            const isSelected = selectedAnswer === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedAnswer(letter)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    isSelected ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {letter}
                  </span>
                  {choiceText}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`editorial-button-primary w-full ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Exit link ── */}
      <div className="text-center">
        <button onClick={onExit} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
          Exit round (credit already used)
        </button>
      </div>
    </div>
  );
}
