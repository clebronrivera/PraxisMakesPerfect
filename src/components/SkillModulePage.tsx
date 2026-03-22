// src/components/SkillModulePage.tsx
//
// Module page opened when a student taps a skill in the By Skill panel.
//
// ─── Structure ────────────────────────────────────────────────────────────────
//   A light-background page with two accordion sections:
//
//   Section 1 — LET'S EXPLORE (starts open)
//     • Lesson content rendered via ModuleLessonViewer
//     • If a skill maps to multiple modules, tab pills select between them
//     • Local time-on-content counter (display only — no backend save)
//
//   Section 2 — PRACTICE QUESTIONS (starts closed)
//     • Opens automatically with one question at a time
//     • When this section opens, Section 1 collapses
//     • When Section 1 is re-opened while questions are active, questions show
//       a "Paused" banner; state is preserved (component stays mounted)
//     • Each answered question calls onSkillProgressUpdate (streak tracking)
//     • Questions shuffle and loop; no retirement in this context
//
// ─── Stats strip ─────────────────────────────────────────────────────────────
//   Shows this-skill accuracy + domain accuracy from the user profile.
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import {
  ArrowLeft, ChevronDown, ChevronUp,
  BookOpen, Zap, Pause, Play, RotateCcw,
} from 'lucide-react';
import { getAllModulesForSkill } from '../data/learningModules';
import ModuleLessonViewer from './ModuleLessonViewer';
import QuestionCard from './QuestionCard';
import { useLearningPathProgress } from '../hooks/useLearningPathProgress';
import {
  getProgressSkillDefinition,
  PROGRESS_DOMAIN_LOOKUP,
  getProgressSkillsForDomain,
} from '../utils/progressTaxonomy';
import { getSkillProficiency } from '../utils/skillProficiency';
import { getLastPracticedDaysAgo, isReviewDue, formatDaysAgo } from '../utils/practiceRecency';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { getQuestionCorrectAnswers } from '../brain/question-analyzer';
import type { UserProfile } from '../hooks/useFirebaseProgress';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillModulePageProps {
  skillId: string;
  userId: string | null;
  profile: UserProfile;
  /** All analyzed questions — filtered to this skill for the quiz */
  analyzedQuestions: AnalyzedQuestion[];
  /** Called for each answered question — updates skill_scores + streak */
  onSkillProgressUpdate: (skillId: string, isCorrect: boolean) => void;
  /** Navigate back to the By Skill panel */
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Section accordion header ─────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  badge,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all
        ${isOpen
          ? 'border-amber-300 bg-white shadow-sm'
          : 'border-slate-200 bg-white hover:border-amber-200'}
      `}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
        ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-tight">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
      <span className="shrink-0 text-slate-400">
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </span>
    </button>
  );
}

// ─── Practice Quiz section ────────────────────────────────────────────────────
//
// Stays mounted even when its parent accordion is collapsed — this preserves
// state so questions aren't lost when the student peeks back at the lesson.
//
// ─────────────────────────────────────────────────────────────────────────────

interface PracticeQuizProps {
  skillId: string;
  questions: AnalyzedQuestion[];
  isPaused: boolean;
  onResume: () => void;
  onAnswerQuestion: (isCorrect: boolean) => void;
}

function PracticeQuiz({
  skillId: _skillId,
  questions,
  isPaused,
  onResume,
  onAnswerQuestion,
}: PracticeQuizProps) {
  // Shuffled question pool; reshuffles when exhausted
  const [pool, setPool] = useState<AnalyzedQuestion[]>(() => shuffleArray(questions));
  const [poolIdx, setPoolIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  // Reset local state if skillId questions change (new skill opened)
  useEffect(() => {
    setPool(shuffleArray(questions));
    setPoolIdx(0);
    setSelectedAnswers([]);
    setConfidence('medium');
    setShowFeedback(false);
    setSessionCorrect(0);
    setSessionTotal(0);
  // Deliberately only reset when question pool identity changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">No practice questions available for this skill yet.</p>
      </div>
    );
  }

  const current = pool[poolIdx % pool.length];

  function handleSubmit() {
    if (selectedAnswers.length === 0 || showFeedback) return;
    const correct = getQuestionCorrectAnswers(current);
    const isCorrect =
      selectedAnswers.length === correct.length &&
      selectedAnswers.every(a => correct.includes(a));
    onAnswerQuestion(isCorrect);
    setSessionCorrect(c => c + (isCorrect ? 1 : 0));
    setSessionTotal(t => t + 1);
    setShowFeedback(true);
  }

  function handleNext() {
    const nextIdx = poolIdx + 1;
    // Reshuffle when wrapping around the pool
    if (nextIdx >= pool.length) {
      setPool(shuffleArray(questions));
      setPoolIdx(0);
    } else {
      setPoolIdx(nextIdx);
    }
    setSelectedAnswers([]);
    setConfidence('medium');
    setShowFeedback(false);
  }

  // Paused overlay — shown while the lesson section is open
  if (isPaused) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <Pause className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Questions paused</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Review the lesson content, then come back here to continue.
          </p>
          {sessionTotal > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-amber-700">
              Session so far: {sessionCorrect}/{sessionTotal} correct
            </p>
          )}
        </div>
        <button
          onClick={onResume}
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
        >
          <Play className="w-3.5 h-3.5" />
          Resume practice
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session progress strip */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-slate-500">
          {sessionTotal > 0
            ? `${sessionCorrect}/${sessionTotal} correct this session`
            : 'Answer questions to track your progress'}
        </p>
        {sessionTotal > 0 && (
          <button
            onClick={() => {
              setPool(shuffleArray(questions));
              setPoolIdx(0);
              setSelectedAnswers([]);
              setConfidence('medium');
              setShowFeedback(false);
              setSessionCorrect(0);
              setSessionTotal(0);
            }}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-700 transition-colors"
            title="Restart session"
          >
            <RotateCcw className="w-3 h-3" />
            Restart
          </button>
        )}
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

// ─── Self-explanation prompt ──────────────────────────────────────────────────
//
// Local-state-only textarea shown below the lesson content.
// Encourages retrieval practice before moving to questions.
// Resets are handled by the parent (component is remounted on skill change).
//
// ─────────────────────────────────────────────────────────────────────────────

function SelfExplanationPrompt({ onStartPractice }: { onStartPractice: () => void }) {
  const [text, setText] = useState('');

  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
        Before you practice
      </p>
      <p className="text-xs text-amber-700">
        What's the core idea in your own words?
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder="Type a quick summary…"
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <button
        onClick={onStartPractice}
        className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
      >
        <Zap className="w-3.5 h-3.5" />
        Start Practice →
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SkillModulePage({
  skillId,
  userId,
  profile,
  analyzedQuestions,
  onSkillProgressUpdate,
  onBack,
}: SkillModulePageProps) {
  const lpLocal = useLearningPathProgress(userId);

  const skillDef = getProgressSkillDefinition(skillId);
  const modules = getAllModulesForSkill(skillId);
  const primaryModule = modules[0] ?? null;
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const activeModule = modules[activeModuleIdx] ?? null;

  // ── Section state: 'lesson' | 'practice' ──────────────────────────────────
  // Only one section open at a time.
  type ActiveSection = 'lesson' | 'practice';
  const [activeSection, setActiveSection] = useState<ActiveSection>('lesson');
  // Whether the quiz is in a paused state (lesson opened while quiz was active)
  const [quizPaused, setQuizPaused] = useState(false);

  function openLesson() {
    if (activeSection === 'practice') {
      // Pause quiz rather than unmounting it
      setQuizPaused(true);
    }
    setActiveSection('lesson');
  }

  function openPractice() {
    setQuizPaused(false);
    setActiveSection('practice');
  }

  function toggleSection(section: ActiveSection) {
    if (section === 'lesson') {
      if (activeSection === 'lesson') return; // already open
      openLesson();
    } else {
      if (activeSection === 'practice') return; // already open
      openPractice();
    }
  }

  // ── Timer for lesson time ─────────────────────────────────────────────────
  const lessonStartRef = useRef<number>(Date.now());
  const [lessonElapsedSec, setLessonElapsedSec] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      if (activeSection === 'lesson') {
        setLessonElapsedSec(Math.floor((Date.now() - lessonStartRef.current) / 1000));
      }
    }, 5_000);
    return () => clearInterval(tick);
  }, [activeSection]);

  // Reset timer reference when switching away from lesson
  useEffect(() => {
    if (activeSection !== 'lesson') {
      lessonStartRef.current = Date.now() - lessonElapsedSec * 1000;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // ── Skill questions pool ───────────────────────────────────────────────────
  const skillQuestions = useMemo(() => {
    return analyzedQuestions.filter(q => q.skillId === skillId);
  }, [analyzedQuestions, skillId]);

  // ── Stats: this skill + domain ─────────────────────────────────────────────
  const skillPerf = profile.skillScores?.[skillId];
  const skillAccuracy = skillPerf && skillPerf.attempts > 0
    ? Math.round((skillPerf.score ?? 0) * 100)
    : null;

  const domainDef = skillDef ? PROGRESS_DOMAIN_LOOKUP[skillDef.domainId] : null;
  const domainSkills = skillDef ? getProgressSkillsForDomain(skillDef.domainId) : [];
  const domainAccuracyPct = useMemo(() => {
    if (domainSkills.length === 0) return null;
    let total = 0, correct = 0, count = 0;
    for (const s of domainSkills) {
      const p = profile.skillScores?.[s.skillId];
      if (p && p.attempts > 0) {
        total += p.attempts;
        correct += p.correct;
        count++;
      }
    }
    return count > 0 ? Math.round((correct / total) * 100) : null;
  }, [domainSkills, profile.skillScores]);

  const priorityTier = getSkillProficiency(skillPerf?.score ?? 0, skillPerf?.attempts ?? 0);
  const priorityColor = priorityTier === 'proficient'
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : priorityTier === 'approaching'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    // Light warm background for eye comfort
    <div className="min-h-full space-y-4 bg-[#fdfaf5] pb-20 px-0">

      {/* ── Back nav + header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-amber-300 hover:text-slate-900"
          aria-label="Back to By Skill"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">By Skill</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            Learning Module
          </p>
          <h2 className="truncate text-base font-bold leading-tight text-slate-900">
            {skillDef?.fullLabel ?? skillId}
          </h2>
          {primaryModule && (
            <p className="text-[10px] font-mono text-slate-400">{primaryModule.id}</p>
          )}
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* This skill accuracy */}
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${priorityColor}`}>
            <span>This skill:</span>
            <span className="font-bold tabular-nums">
              {skillAccuracy !== null ? `${skillAccuracy}%` : 'Not started'}
            </span>
          </div>

          {/* Domain accuracy */}
          {domainDef && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
              <span>{domainDef.shortName}:</span>
              <span className="font-bold tabular-nums text-slate-800">
                {domainAccuracyPct !== null ? `${domainAccuracyPct}%` : '—'}
              </span>
            </div>
          )}

          {/* Last practiced recency */}
          {(() => {
            const daysAgo = getLastPracticedDaysAgo(skillPerf);
            if (daysAgo === null) return null;
            const reviewDue = isReviewDue(skillPerf);
            return reviewDue
              ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-3 py-1.5 text-[11px] font-bold text-amber-700">Review Due</span>
              : <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">Last practiced: {formatDaysAgo(daysAgo)}</span>;
          })()}

          {/* False confidence chip */}
          {(skillPerf?.confidenceFlags ?? 0) >= 2 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-3 py-1.5 text-[11px] font-bold text-amber-700"
              title="Multiple high-confidence wrong answers — check your mental model"
            >
              ⚠ False confidence detected
            </span>
          )}

          {/* Time in lesson */}
          {lessonElapsedSec > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">
              <span>{formatSeconds(lessonElapsedSec)} in lesson</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — LET'S EXPLORE (lesson content)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 space-y-0">
        <SectionHeader
          icon={<BookOpen className="w-4 h-4" />}
          title="Let's Explore"
          subtitle="Review the lesson content for this skill"
          isOpen={activeSection === 'lesson'}
          onToggle={() => toggleSection('lesson')}
        />

        {activeSection === 'lesson' && (
          <div className="mt-2 space-y-4">
            {/* Module tab pills (if multiple modules for this skill) */}
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
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    Lesson {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Lesson content */}
            {activeModule && (
              <ModuleLessonViewer
                module={activeModule}
                isViewed={lpLocal.isViewed(activeModule.id)}
                secondsSpent={lpLocal.getSecondsSpent(activeModule.id)}
                onSetViewed={(v) => lpLocal.setViewed(activeModule.id, v)}
              />
            )}

            {/* Self-explanation prompt before practice (Feature B) */}
            <SelfExplanationPrompt onStartPractice={openPractice} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — PRACTICE QUESTIONS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 space-y-0">
        <SectionHeader
          icon={<Zap className="w-4 h-4" />}
          title="Practice Questions"
          subtitle="One question at a time — loop until confident"
          isOpen={activeSection === 'practice'}
          onToggle={() => toggleSection('practice')}
          badge={
            quizPaused && activeSection !== 'practice' ? (
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Pause className="w-3 h-3" />
                Paused
              </span>
            ) : undefined
          }
        />

        {/* The quiz component stays mounted to preserve question state.
            Display:none when the lesson section is open. */}
        <div
          className={activeSection === 'practice' ? 'mt-2' : 'hidden'}
          aria-hidden={activeSection !== 'practice'}
        >
          <PracticeQuiz
            skillId={skillId}
            questions={skillQuestions}
            isPaused={quizPaused && activeSection !== 'practice'}
            onResume={openPractice}
            onAnswerQuestion={(isCorrect) => onSkillProgressUpdate(skillId, isCorrect)}
          />
        </div>

        {/* Paused state shown when lesson is open but quiz was active */}
        {activeSection === 'lesson' && quizPaused && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-center">
            <p className="text-[11px] text-amber-700">
              <Pause className="w-3 h-3 inline mr-1" />
              Practice paused — open the questions section to resume.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
