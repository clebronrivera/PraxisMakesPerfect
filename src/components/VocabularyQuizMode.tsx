/**
 * VocabularyQuizMode — interactive vocabulary knowledge checks.
 *
 * Quiz types:
 *   "term"       → show definition, pick the correct term
 *   "definition" → show term, pick the correct definition
 *
 * Prioritizes the user's glossary terms (weak areas) when available,
 * falls back to the full glossary for practice.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  BookOpen,
  Trophy,
  Target,
} from 'lucide-react';
import {
  generateVocabQuiz,
  TOTAL_GLOSSARY_TERMS,
  type VocabQuizItem,
  type QuizType,
} from '../utils/vocabQuizGenerator';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VocabularyQuizModeProps {
  /** Terms the user has in their personal glossary (prioritized) */
  userTerms: string[];
}

type QuizState = 'config' | 'active' | 'review';

interface QuizSession {
  items: VocabQuizItem[];
  currentIndex: number;
  answers: (string | null)[];
  revealed: boolean[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const QUIZ_SIZES = [5, 10, 15, 20] as const;

const TYPE_OPTIONS: { id: QuizType | 'mixed'; label: string; desc: string }[] = [
  { id: 'mixed', label: 'Mixed', desc: 'Both types randomly' },
  { id: 'definition', label: 'Know the Definition', desc: 'See a term → pick its definition' },
  { id: 'term', label: 'Name the Term', desc: 'See a definition → pick the term' },
];

const SOURCE_OPTIONS = [
  { id: 'my-terms', label: 'My Glossary Terms', desc: 'Focus on your personal word list' },
  { id: 'all', label: 'Full Glossary', desc: `All ${TOTAL_GLOSSARY_TERMS} Praxis terms` },
] as const;

type SourceOption = (typeof SOURCE_OPTIONS)[number]['id'];

// ─── Component ──────────────────────────────────────────────────────────────

export default function VocabularyQuizMode({ userTerms }: VocabularyQuizModeProps) {
  const [quizState, setQuizState] = useState<QuizState>('config');
  const [quizSize, setQuizSize] = useState<number>(10);
  const [quizType, setQuizType] = useState<QuizType | 'mixed'>('mixed');
  const [source, setSource] = useState<SourceOption>(userTerms.length >= 4 ? 'my-terms' : 'all');
  const [session, setSession] = useState<QuizSession | null>(null);

  const hasEnoughUserTerms = userTerms.length >= 4;

  // ── Start quiz ──────────────────────────────────────────────────────────
  const startQuiz = useCallback(() => {
    const types: QuizType[] =
      quizType === 'mixed' ? ['term', 'definition'] : [quizType];

    const items = generateVocabQuiz({
      count: quizSize,
      types,
      priorityTerms: source === 'my-terms' ? userTerms : undefined,
      restrictToTerms: source === 'my-terms' && hasEnoughUserTerms ? userTerms : undefined,
    });

    if (items.length === 0) return;

    setSession({
      items,
      currentIndex: 0,
      answers: new Array(items.length).fill(null),
      revealed: new Array(items.length).fill(false),
    });
    setQuizState('active');
  }, [quizSize, quizType, source, userTerms, hasEnoughUserTerms]);

  // ── Select answer ───────────────────────────────────────────────────────
  const selectAnswer = useCallback((label: string) => {
    setSession((prev) => {
      if (!prev || prev.revealed[prev.currentIndex]) return prev;
      const answers = [...prev.answers];
      const revealed = [...prev.revealed];
      answers[prev.currentIndex] = label;
      revealed[prev.currentIndex] = true;
      return { ...prev, answers, revealed };
    });
  }, []);

  // ── Next question ───────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.currentIndex < prev.items.length - 1) {
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      }
      return prev;
    });
    // If last question, go to review
    setSession((prev) => {
      if (prev && prev.currentIndex >= prev.items.length - 1 && prev.revealed[prev.currentIndex]) {
        setQuizState('review');
      }
      return prev;
    });
  }, []);

  // ── Computed stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!session) return { correct: 0, total: 0, pct: 0 };
    const correct = session.items.filter(
      (item, i) => session.answers[i] === item.correctLabel,
    ).length;
    const answered = session.answers.filter((a) => a !== null).length;
    return { correct, total: answered, pct: answered > 0 ? Math.round((correct / answered) * 100) : 0 };
  }, [session]);

  // ─── CONFIG SCREEN ────────────────────────────────────────────────────
  if (quizState === 'config') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
              <Zap size={26} className="text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Vocabulary Quiz</h2>
            <p className="text-sm text-slate-500 mt-1">
              Test your knowledge of key Praxis terms
            </p>
          </div>

          {/* Source */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
              Term Source
            </label>
            <div className="flex flex-col gap-2">
              {SOURCE_OPTIONS.map((opt) => {
                const disabled = opt.id === 'my-terms' && !hasEnoughUserTerms;
                return (
                  <button
                    key={opt.id}
                    onClick={() => !disabled && setSource(opt.id)}
                    disabled={disabled}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                      source === opt.id
                        ? 'border-violet-500 bg-violet-50'
                        : disabled
                          ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-violet-300 bg-white'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-xs text-slate-500">
                      {disabled
                        ? `Need at least 4 glossary terms (you have ${userTerms.length})`
                        : opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Type */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
              Quiz Type
            </label>
            <div className="flex flex-col gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setQuizType(opt.id)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                    quizType === opt.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-300 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                  <div className="text-xs text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Size */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
              Number of Questions
            </label>
            <div className="flex gap-2">
              {QUIZ_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setQuizSize(size)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                    quizSize === size
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Start */}
          <button
            onClick={startQuiz}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:scale-[0.98] transition shadow-sm"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE QUIZ ──────────────────────────────────────────────────────
  if (quizState === 'active' && session) {
    const item = session.items[session.currentIndex];
    const answered = session.revealed[session.currentIndex];
    const userAnswer = session.answers[session.currentIndex];
    const isCorrect = userAnswer === item.correctLabel;
    const isLast = session.currentIndex === session.items.length - 1;

    return (
      <div className="flex-1 flex flex-col py-6 px-6">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{
                width: `${((session.currentIndex + (answered ? 1 : 0)) / session.items.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 shrink-0">
            {session.currentIndex + 1} / {session.items.length}
          </span>
          <span className="text-xs font-medium text-emerald-600 shrink-0">
            {stats.correct} correct
          </span>
        </div>

        {/* Question type badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5">
            {item.type === 'term' ? (
              <>
                <BookOpen size={11} /> Name the Term
              </>
            ) : (
              <>
                <Target size={11} /> Pick the Definition
              </>
            )}
          </span>
        </div>

        {/* Prompt */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
          <p className="text-sm text-slate-400 font-medium mb-1">
            {item.type === 'term' ? 'Which term matches this definition?' : 'What does this term mean?'}
          </p>
          <p className="text-base font-semibold text-slate-800 leading-relaxed">
            {item.prompt}
          </p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2.5 mb-6">
          {item.choices.map((choice) => {
            const isSelected = userAnswer === choice.label;
            const isCorrectChoice = choice.label === item.correctLabel;

            let borderColor = 'border-slate-200 hover:border-violet-300';
            let bgColor = 'bg-white';
            let textColor = 'text-slate-700';

            if (answered) {
              if (isCorrectChoice) {
                borderColor = 'border-emerald-400';
                bgColor = 'bg-emerald-50';
                textColor = 'text-emerald-800';
              } else if (isSelected && !isCorrect) {
                borderColor = 'border-rose-400';
                bgColor = 'bg-rose-50';
                textColor = 'text-rose-800';
              } else {
                borderColor = 'border-slate-100';
                bgColor = 'bg-slate-50';
                textColor = 'text-slate-400';
              }
            } else if (isSelected) {
              borderColor = 'border-violet-500';
              bgColor = 'bg-violet-50';
            }

            return (
              <button
                key={choice.label}
                onClick={() => !answered && selectAnswer(choice.label)}
                disabled={answered}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition text-left ${borderColor} ${bgColor} ${answered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    answered && isCorrectChoice
                      ? 'bg-emerald-500 text-white'
                      : answered && isSelected && !isCorrect
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {answered && isCorrectChoice ? (
                    <CheckCircle2 size={14} />
                  ) : answered && isSelected && !isCorrect ? (
                    <XCircle size={14} />
                  ) : (
                    choice.label
                  )}
                </span>
                <span className={`text-sm leading-relaxed ${textColor}`}>
                  {choice.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {answered && (
          <div className="mt-auto">
            <div
              className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium ${
                isCorrect
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isCorrect ? 'Correct!' : `The answer is: ${item.correctTerm}`}
            </div>

            <button
              onClick={nextQuestion}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              {isLast ? (
                <>
                  <Trophy size={16} /> See Results
                </>
              ) : (
                <>
                  Next <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── REVIEW SCREEN ────────────────────────────────────────────────────
  if (quizState === 'review' && session) {
    const scoreColor =
      stats.pct >= 80 ? 'text-emerald-600' : stats.pct >= 60 ? 'text-amber-600' : 'text-rose-600';
    const scoreBg =
      stats.pct >= 80 ? 'bg-emerald-50' : stats.pct >= 60 ? 'bg-amber-50' : 'bg-rose-50';

    return (
      <div className="flex-1 flex flex-col py-8 px-6 overflow-y-auto">
        {/* Score header */}
        <div className="text-center mb-8">
          <div
            className={`w-20 h-20 rounded-2xl ${scoreBg} flex items-center justify-center mx-auto mb-3`}
          >
            <span className={`text-3xl font-black ${scoreColor}`}>{stats.pct}%</span>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Quiz Complete</h2>
          <p className="text-sm text-slate-500 mt-1">
            {stats.correct} of {session.items.length} correct
          </p>
        </div>

        {/* Per-question review */}
        <div className="space-y-3 mb-8">
          {session.items.map((item, i) => {
            const userAns = session.answers[i];
            const correct = userAns === item.correctLabel;
            return (
              <div
                key={item.id}
                className={`rounded-xl border px-4 py-3 ${
                  correct
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-rose-200 bg-rose-50/50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {correct ? (
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.correctTerm}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {item.type === 'term'
                        ? item.prompt
                        : item.choices.find((c) => c.label === item.correctLabel)?.text}
                    </p>
                    {!correct && userAns && (
                      <p className="text-xs text-rose-600 mt-1">
                        Your answer:{' '}
                        {item.choices.find((c) => c.label === userAns)?.text?.slice(0, 80)}
                        {(item.choices.find((c) => c.label === userAns)?.text?.length ?? 0) > 80 && '…'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setQuizState('config');
              setSession(null);
            }}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> New Quiz
          </button>
          <button
            onClick={startQuiz}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Retry Same Settings
          </button>
        </div>
      </div>
    );
  }

  return null;
}
