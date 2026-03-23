// src/components/LearningPathModulePage.tsx
//
// Full-screen Learning Path module page.
//
// Opened when the user taps a non-mastered skill node in LearningPathNodeMap.
// The page has THREE sequential locked sections:
//
// ─── Section 1 — LESSON CONTENT ─────────────────────────────────────────────
//   • Renders the micro-lesson text via ModuleLessonViewer
//   • Full section-level engagement tracking (IntersectionObserver)
//   • Interactive exercise onComplete callbacks wired and persisted
//   • "Mark Lesson Complete" button — unlocks Section 2
//   • Tracks and saves elapsed time to Supabase (learning_path_progress)
//
// ─── Section 2 — PRACTICE QUESTIONS ─────────────────────────────────────────
//   • Locked until Section 1 is marked complete
//   • Shows up to LP_QUESTION_COUNT questions for this skill (random sample)
//   • One question at a time via QuestionCard
//   • On final submit:
//       – calls useLearningPathSupabase.submitQuestions()  → LP status (blended)
//       – calls onSkillProgressUpdate() for each response → skill_scores
//   • Results summary + "Return to Learning Path" button
//
// ─── Section 3 — COMING SOON ─────────────────────────────────────────────────
//   • Placeholder only — not yet implemented
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft, CheckCircle, Lock,
  ChevronDown, ChevronUp,
  Trophy, RotateCcw,
} from 'lucide-react';
import { getAllModulesForSkill } from '../data/learningModules';
import ModuleLessonViewer from './ModuleLessonViewer';
import QuestionCard from './QuestionCard';
import { useLearningPathSupabase } from '../hooks/useLearningPathSupabase';
import { useLearningPathProgress } from '../hooks/useLearningPathProgress';
import { useModuleVisitTracking } from '../hooks/useModuleVisitTracking';
import { useSectionObserver } from '../hooks/useSectionObserver';
import type { InteractiveResult } from '../hooks/useModuleVisitTracking';
import { getProgressSkillDefinition } from '../utils/progressTaxonomy';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { getQuestionCorrectAnswers } from '../brain/question-analyzer';
import type { UserProfile } from '../hooks/useFirebaseProgress';

// ─── Config ───────────────────────────────────────────────────────────────────

/** Max practice questions shown per module session */
const LP_QUESTION_COUNT = 5;

// ─── Props ────────────────────────────────────────────────────────────────────

interface LearningPathModulePageProps {
  skillId: string;
  userId: string | null;
  profile: UserProfile;
  /** All analyzed questions — filtered by skillId to build the mini-quiz */
  analyzedQuestions: AnalyzedQuestion[];
  /** Called for each answered question to keep skill_scores in sync */
  onSkillProgressUpdate: (skillId: string, isCorrect: boolean) => void;
  /** Navigate back to the Learning Path node map */
  onBack: () => void;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  number,
  title,
  isLocked,
  isComplete,
  isOpen,
  onToggle,
}: {
  number: number;
  title: string;
  isLocked: boolean;
  isComplete: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={isLocked ? undefined : onToggle}
      disabled={isLocked}
      className={`
        flex w-full items-center gap-3 rounded-[1.75rem] border px-4 py-3.5 text-left transition-all
        ${isLocked
          ? 'cursor-not-allowed border-slate-200 bg-[#fbfaf7] opacity-60'
          : isOpen
            ? 'border-amber-300 bg-amber-50'
            : 'border-slate-200 bg-white hover:border-amber-200'}
      `}
    >
      {/* Number badge */}
      <div className={`
        flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold
        ${isComplete
          ? 'bg-emerald-100 text-emerald-700'
          : isLocked
            ? 'bg-slate-100 text-slate-400'
            : 'bg-amber-100 text-amber-700'}
      `}>
        {isComplete ? <CheckCircle className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : number}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
          {title}
        </p>
        {isLocked && (
          <p className="mt-0.5 text-[10px] text-slate-400">Complete Section {number - 1} to unlock</p>
        )}
        {isComplete && !isLocked && (
          <p className="mt-0.5 text-[10px] text-emerald-700">Completed ✓</p>
        )}
      </div>

      {/* Chevron */}
      {!isLocked && (
        <span className="shrink-0 text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      )}
    </button>
  );
}

// ─── Section 2: Mini Quiz ─────────────────────────────────────────────────────

interface MiniQuizResult {
  questionId: string;
  isCorrect: boolean;
}

function MiniQuiz({
  questions,
  onComplete,
}: {
  questions: AnalyzedQuestion[];
  skillId?: string;
  onComplete: (results: MiniQuizResult[]) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<MiniQuizResult[]>([]);

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">No practice questions available for this skill yet.</p>
        <button
          onClick={() => onComplete([])}
          className="editorial-button-secondary mt-4"
        >
          Continue anyway
        </button>
      </div>
    );
  }

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  function handleSubmit() {
    if (selectedAnswers.length === 0) return;
    const correctAnswers = getQuestionCorrectAnswers(current);
    const isCorrect =
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every(a => correctAnswers.includes(a));
    setResults(prev => [...prev, { questionId: current.id, isCorrect }]);
    setShowFeedback(true);
  }

  function handleNext() {
    if (isLast) {
      // Include the result we just added
      const finalResults = [...results];
      onComplete(finalResults);
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
    }
  }

  const correctSoFar = results.filter(r => r.isCorrect).length;

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-slate-500">
          Question {currentIdx + 1} of {questions.length}
        </p>
        {results.length > 0 && (
          <p className="text-[10px] text-slate-500">
            {correctSoFar}/{results.length} correct so far
          </p>
        )}
      </div>
      <div className="editorial-progress-track">
        <div
          className="editorial-progress-fill transition-all duration-500"
          style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={current}
        selectedAnswers={selectedAnswers}
        onSelectAnswer={(letter) => {
          if (showFeedback) return;
          setSelectedAnswers(prev =>
            prev.includes(letter) ? prev.filter(a => a !== letter) : [...prev, letter]
          );
        }}
        onSubmit={handleSubmit}
        onNext={handleNext}
        confidence={confidence}
        onConfidenceChange={setConfidence}
        disabled={showFeedback}
        showFeedback={showFeedback}
        assessmentType="practice"
      />
    </div>
  );
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────

function QuizResults({
  correct,
  total,
  onReturnToPath,
}: {
  correct: number;
  total: number;
  onReturnToPath: () => void;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tier = pct >= 80 ? 'demonstrating' : pct >= 60 ? 'approaching' : 'emerging';
  const tierConfig = {
    demonstrating: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Demonstrating', msg: 'Excellent work — you\'re meeting the threshold for this skill.' },
    approaching: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Approaching', msg: 'Getting closer — keep practicing to reach Demonstrating.' },
    emerging: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', label: 'Emerging', msg: 'Review the lesson content and try again to build fluency.' },
  }[tier];

  return (
    <div className="space-y-4 py-2">
      <div className={`rounded-[1.75rem] border p-5 text-center ${tierConfig.bg}`}>
        <Trophy className={`w-8 h-8 mx-auto mb-2 ${tierConfig.color}`} />
        <p className={`text-2xl font-bold tabular-nums ${tierConfig.color}`}>{pct}%</p>
        <p className="mt-1 text-xs text-slate-500">{correct} of {total} correct</p>
        <span className={`mt-2 inline-block rounded-full border bg-white px-2.5 py-0.5 text-[10px] font-bold ${tierConfig.color}`}>
          {tierConfig.label}
        </span>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{tierConfig.msg}</p>
      </div>

      <button
        onClick={onReturnToPath}
        className="editorial-button-secondary w-full justify-center"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Learning Path
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LearningPathModulePage({
  skillId,
  userId,
  profile: _profile,
  analyzedQuestions,
  onSkillProgressUpdate,
  onBack,
}: LearningPathModulePageProps) {
  const lpSupabase = useLearningPathSupabase(userId);
  const lpLocal = useLearningPathProgress(userId);

  const skillDef = getProgressSkillDefinition(skillId);
  const modules = getAllModulesForSkill(skillId);
  const primaryModule = modules[0] ?? null;

  // ── Active module tab ──────────────────────────────────────────────────
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const activeModule = modules[activeModuleIdx] ?? null;

  // ── Module visit tracking ──────────────────────────────────────────────
  const visitTracking = useModuleVisitTracking(
    userId,
    activeModule?.id ?? null,
    skillId,
    'learning_path'
  );

  // ── Completed interactives map (for UI indicators) ─────────────────────
  const [completedInteractives, setCompletedInteractives] = useState<
    Record<number, { score: number; completed: boolean }>
  >({});

  const handleInteractiveComplete = useCallback((sectionIndex: number, result: InteractiveResult) => {
    visitTracking.reportInteractiveComplete(sectionIndex, result);
    setCompletedInteractives(prev => ({
      ...prev,
      [sectionIndex]: { score: result.score, completed: result.completed },
    }));
  }, [visitTracking]);

  // ── Section observer ───────────────────────────────────────────────────
  const sectionCount = activeModule?.sections.length ?? 0;

  const { sectionRefs, maxScrollDepth } = useSectionObserver({
    sectionCount,
    onVisible: useCallback((idx: number) => {
      const section = activeModule?.sections[idx];
      if (section) {
        visitTracking.reportSectionVisible(
          idx,
          section.type,
          section.type === 'interactive' ? section.interactiveType : undefined
        );
      }
    }, [activeModule, visitTracking]),
    onHidden: useCallback((idx: number) => {
      visitTracking.reportSectionHidden(idx);
    }, [visitTracking]),
    enabled: !!activeModule,
  });

  // Feed scroll depth from observer to visit tracking
  useEffect(() => {
    visitTracking.reportScrollDepth(maxScrollDepth);
  }, [maxScrollDepth, visitTracking]);

  // Clear completed interactives when module tab changes
  useEffect(() => {
    setCompletedInteractives({});
  }, [activeModuleIdx]);

  // ── Skill questions (random sample) ──────────────────────────────────────
  const skillQuestions = useMemo(() => {
    const qs = analyzedQuestions.filter(q => q.skillId === skillId);
    // Fisher-Yates shuffle, then take LP_QUESTION_COUNT
    const arr = [...qs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, LP_QUESTION_COUNT);
  // Shuffle once on mount — intentionally omit deps to avoid re-shuffle on re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  // ── Section open/closed state ─────────────────────────────────────────────
  const [openSection, setOpenSection] = useState<1 | 2 | 3>(1);

  // ── Timer for Section 1 ───────────────────────────────────────────────────
  const s1StartRef = useRef<number>(Date.now());
  const [s1ElapsedSec, setS1ElapsedSec] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setS1ElapsedSec(Math.floor((Date.now() - s1StartRef.current) / 1000));
    }, 5_000);
    return () => clearInterval(tick);
  }, []);

  // ── LP record ─────────────────────────────────────────────────────────────
  const record = lpSupabase.getSkillRecord(skillId);

  // ── Section 1: lesson complete ────────────────────────────────────────────
  const [s1Submitting, setS1Submitting] = useState(false);

  async function handleMarkLessonComplete() {
    setS1Submitting(true);
    const elapsed = Math.floor((Date.now() - s1StartRef.current) / 1000);
    await lpSupabase.markLessonComplete(skillId, elapsed);
    // Also mark in localStorage progress for SkillHelpDrawer / LearningPathPanel consistency
    if (activeModule) {
      lpLocal.setViewed(activeModule.id, true);
    }
    setS1Submitting(false);
    setOpenSection(2);
  }

  // ── Section 2: quiz ───────────────────────────────────────────────────────
  const [quizResults, setQuizResults] = useState<MiniQuizResult[] | null>(null);
  const [s2Submitting, setS2Submitting] = useState(false);

  async function handleQuizComplete(results: MiniQuizResult[]) {
    setS2Submitting(true);
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;

    // Gather interactive exercise aggregate for blended scoring
    const interactiveEntries = Object.values(completedInteractives).filter(e => e.completed);
    const interactiveScore = interactiveEntries.length > 0
      ? {
          score: interactiveEntries.reduce((sum, e) => sum + e.score, 0) / interactiveEntries.length,
          count: interactiveEntries.length,
        }
      : undefined;

    // Update LP Supabase progress with blended accuracy
    await lpSupabase.submitQuestions(skillId, correct, total, interactiveScore);

    // Update skill_scores for each answered question
    for (const r of results) {
      onSkillProgressUpdate(skillId, r.isCorrect);
    }

    setQuizResults({ correct, total } as any);
    setS2Submitting(false);
  }

  // Render the quiz results after completion
  const quizDone = quizResults !== null;
  const quizCorrect = (quizResults as any)?.correct ?? 0;
  const quizTotal = (quizResults as any)?.total ?? 0;

  const s1Complete = record.lessonViewed;
  const s2Complete = record.questionsSubmitted;

  return (
    <div className="space-y-6 pb-16">

      {/* ── Back nav + header ─────────────────────────────────────────────── */}
      <div className="editorial-surface flex items-center gap-3 p-5">
        <button
          onClick={onBack}
          className="editorial-button-secondary shrink-0 px-3 py-2"
          aria-label="Back to Learning Path"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Learning Path</p>
          <h2 className="truncate text-lg font-bold leading-tight text-slate-900">
            {skillDef?.fullLabel ?? skillId}
          </h2>
          {primaryModule && (
            <p className="text-[10px] font-mono text-slate-500">{primaryModule.id}</p>
          )}
        </div>
      </div>

      {/* ── Progress pills ────────────────────────────────────────────────── */}
      <div className="editorial-surface-soft flex flex-wrap items-center gap-2 px-4 py-3">
        {[
          { label: 'Lesson', done: s1Complete },
          { label: 'Practice', done: s2Complete },
          { label: 'Extend', done: false, locked: true },
        ].map((step, i) => (
          <div
            key={step.label}
            className={`
              flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold
              ${step.done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : step.locked
                  ? 'border-slate-200 bg-white text-slate-400'
                  : 'border-amber-200 bg-amber-50 text-amber-700'}
            `}
          >
            {step.done ? (
              <CheckCircle className="w-3 h-3" />
            ) : step.locked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold text-amber-700">{i + 1}</span>
            )}
            {step.label}
          </div>
        ))}
        {record.accuracy !== null && (
          <div className="ml-auto text-[10px] text-slate-500 font-mono">
            LP accuracy: {Math.round(record.accuracy * 100)}%
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — LESSON CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-0">
        <SectionHeader
          number={1}
          title="Lesson"
          isLocked={false}
          isComplete={s1Complete}
          isOpen={openSection === 1}
          onToggle={() => setOpenSection(openSection === 1 ? 3 : 1)}
        />

        {openSection === 1 && (
          <div className="mt-2 space-y-4 px-1">

            {/* Module tab pills (if multiple) */}
            {modules.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {modules.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModuleIdx(i)}
                    className={`
                      flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition-all
                      ${activeModuleIdx === i
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-slate-900'}
                    `}
                  >
                    {lpLocal.isViewed(m.id) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    Lesson {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Lesson text */}
            {activeModule && (
              <ModuleLessonViewer
                module={activeModule}
                isViewed={lpLocal.isViewed(activeModule.id)}
                secondsSpent={lpLocal.getSecondsSpent(activeModule.id)}
                onSetViewed={(v) => lpLocal.setViewed(activeModule.id, v)}
                onInteractiveComplete={handleInteractiveComplete}
                sectionRefs={sectionRefs}
                completedInteractives={completedInteractives}
              />
            )}

            {/* Timer + Mark Complete */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[10px] text-slate-500">
                Time in lesson: {Math.floor(s1ElapsedSec / 60)}m {s1ElapsedSec % 60}s
              </p>
              {s1Complete ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  Lesson complete
                </div>
              ) : (
                <button
                  onClick={handleMarkLessonComplete}
                  disabled={s1Submitting}
                  className="editorial-button-primary px-4 py-2 text-xs disabled:opacity-60"
                >
                  {s1Submitting ? 'Saving…' : 'Mark Lesson Complete →'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — PRACTICE QUESTIONS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-0">
        <SectionHeader
          number={2}
          title="Practice Questions"
          isLocked={!s1Complete}
          isComplete={s2Complete}
          isOpen={openSection === 2}
          onToggle={() => setOpenSection(openSection === 2 ? 1 : 2)}
        />

        {openSection === 2 && s1Complete && (
          <div className="mt-2 space-y-4 px-1">

            {s2Submitting ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Saving your results…</p>
              </div>
            ) : quizDone ? (
              <QuizResults
                correct={quizCorrect}
                total={quizTotal}
                onReturnToPath={onBack}
              />
            ) : (
              <>
                <div className="px-1">
                  <p className="text-xs text-slate-500">
                    Answer {skillQuestions.length} practice question{skillQuestions.length !== 1 ? 's' : ''} for this skill.
                    Your results will update your Learning Path status.
                  </p>
                </div>
                <MiniQuiz
                  questions={skillQuestions}
                  skillId={skillId}
                  onComplete={handleQuizComplete}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — EXTEND (PLACEHOLDER)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-0">
        <SectionHeader
          number={3}
          title="Extend"
          isLocked={!s2Complete}
          isComplete={false}
          isOpen={openSection === 3}
          onToggle={() => setOpenSection(openSection === 3 ? 2 : 3)}
        />

        {openSection === 3 && s2Complete && (
          <div className="mt-2 px-1">
            <div className="space-y-2 rounded-[1.75rem] border border-dashed border-slate-300 bg-[#fbfaf7] p-6 text-center">
              <RotateCcw className="mx-auto h-6 w-6 text-amber-700" />
              <p className="text-xs font-semibold text-slate-700">Coming Soon</p>
              <p className="text-[10px] leading-relaxed text-slate-500">
                Extended learning activities for this skill will appear here in a future update.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
