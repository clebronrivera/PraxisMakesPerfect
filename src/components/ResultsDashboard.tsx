// src/components/ResultsDashboard.tsx
// Progress page — pure analytics. No practice entry points.

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useFirebaseProgress';
import { buildProgressSummary, type SkillColorState } from '../utils/progressSummaries';
import { PROFICIENCY_META } from '../utils/skillProficiency';
import { getProgressSkillDefinition } from '../utils/progressTaxonomy';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Official Praxis 5421 exam content weights per domain (%). */
const EXAM_WEIGHTS: Record<number, number> = {
  1: 36, // Professional Practices
  2: 21, // Student-Level Services
  3: 19, // Systems-Level Services
  4: 24, // Foundations of School Psychology
};

const READINESS_GOAL_PCT = 0.7; // 70% of skills must reach Demonstrating
const TOTAL_SKILLS = 45;
const READINESS_TARGET = Math.ceil(TOTAL_SKILLS * READINESS_GOAL_PCT); // 32

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsDashboardProps {
  userProfile: UserProfile;
  skills: Skill[];
  fullAssessmentUnlocked: boolean;
  hasScreenerReport?: boolean;
  onViewScreenerReport?: () => void;
  // Kept for App.tsx compatibility — not used in UI (pure analytics page)
  onStartPractice?: (domainId?: number) => void;
  onStartSkillPractice?: (skillId: string) => void;
  onRetakeAssessment?: () => void;
  onResetProgress?: () => void;
  defaultView?: 'domain' | 'skill';
}

interface TimeStats {
  avgOverall: number | null;
  byDomain: Record<number, { avg: number; count: number }>;
  topSlowQuestions: Array<{ questionId: string; avgSeconds: number; count: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const DOT_COLORS: Record<SkillColorState, string> = {
  gray:   'bg-slate-700',
  red:    'bg-rose-500',
  yellow: 'bg-amber-400',
  green:  'bg-emerald-400',
};

function computeTimeStats(userProfile: UserProfile): TimeStats {
  const domainGroups: Record<number, number[]> = {};
  const questionGroups: Record<string, number[]> = {};
  const allTimes: number[] = [];

  for (const [skillId, perf] of Object.entries(userProfile.skillScores ?? {})) {
    if (!perf.attemptHistory) continue;
    const def = getProgressSkillDefinition(skillId);
    const domainId = def?.domainId ?? 0;

    for (const attempt of perf.attemptHistory) {
      const t = attempt.timeSpent;
      // Sanity: 1–600 seconds
      if (!t || t < 1 || t > 600) continue;
      allTimes.push(t);
      if (!domainGroups[domainId]) domainGroups[domainId] = [];
      domainGroups[domainId].push(t);
      if (!questionGroups[attempt.questionId]) questionGroups[attempt.questionId] = [];
      questionGroups[attempt.questionId].push(t);
    }
  }

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const avgOverall = allTimes.length > 0 ? avg(allTimes) : null;

  const byDomain: Record<number, { avg: number; count: number }> = {};
  for (const [dId, times] of Object.entries(domainGroups)) {
    byDomain[Number(dId)] = { avg: avg(times), count: times.length };
  }

  const topSlowQuestions = Object.entries(questionGroups)
    .map(([qId, times]) => ({ questionId: qId, avgSeconds: avg(times), count: times.length }))
    .sort((a, b) => b.avgSeconds - a.avgSeconds)
    .slice(0, 5);

  return { avgOverall, byDomain, topSlowQuestions };
}

// ─── Timeline ────────────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  sublabel?: string;
  done: boolean;
  /** If not done and this is the last step, show remaining count instead of circle */
  remaining?: number;
}

function ProgressTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const nextDone = i < steps.length - 1 ? steps[i + 1].done : false;
        const lineColor = step.done && nextDone ? 'bg-emerald-500' : 'bg-slate-200';

        return (
          <div key={step.label} className="flex items-start flex-1 min-w-0">
            {/* Step node + label */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`
                h-7 w-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold
                ${step.done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isLast && step.remaining !== undefined
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500'}
              `}>
                {step.done
                  ? <Check className="w-3.5 h-3.5" />
                  : isLast && step.remaining !== undefined
                    ? step.remaining
                    : null}
              </div>
              <p className={`mt-1.5 max-w-[62px] text-center text-[11px] font-medium leading-tight ${step.done ? 'text-emerald-600' : 'text-slate-500'}`}>
                {step.label}
              </p>
              {step.sublabel && (
                <p className="max-w-[62px] text-center text-[11px] leading-tight text-slate-400">{step.sublabel}</p>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-3.5 mx-0.5 ${lineColor} transition-colors`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsDashboard({
  userProfile,
  skills,
  fullAssessmentUnlocked,
  hasScreenerReport,
  onViewScreenerReport,
}: ResultsDashboardProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set()); // all collapsed by default
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // ── Progress data ───────────────────────────────────────────────────────────
  const progress = useMemo(
    () => buildProgressSummary(userProfile.skillScores, skills),
    [userProfile.skillScores, skills]
  );

  const demonstratingCount = progress.skills.filter(s => s.colorState === 'green').length;
  const approachingCount = progress.skills.filter(s => s.colorState === 'yellow').length;
  const assessedCount = progress.skills.filter(s => s.attempted > 0).length;
  const skillsToReadiness = Math.max(0, READINESS_TARGET - demonstratingCount);
  const isReady = skillsToReadiness === 0;

  const totalAttempts = progress.skills.reduce((s, sk) => s + sk.attempted, 0);
  const totalCorrect = progress.skills.reduce((s, sk) => s + sk.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  // ── Time stats ──────────────────────────────────────────────────────────────
  const timeStats = useMemo(() => computeTimeStats(userProfile), [userProfile]);

  // ── Confidence-weighted accuracy ─────────────────────────────────────────────
  const confidenceStats = useMemo(() => {
    let rawCorrect = 0;
    let rawAttempts = 0;
    let weightedCorrectSum = 0;
    let weightedTotalSum = 0;
    let highWrong = 0; // misconceptions: answered "Sure" but wrong

    for (const perf of Object.values(userProfile.skillScores ?? {})) {
      rawCorrect += perf.correct ?? 0;
      rawAttempts += perf.attempts ?? 0;
      highWrong += perf.confidenceFlags ?? 0;
      if (perf.weightedAccuracy !== undefined && perf.attempts > 0) {
        // Reconstruct weighted sums using stored weightedAccuracy × attempts as proxy
        weightedCorrectSum += perf.weightedAccuracy * perf.attempts;
        weightedTotalSum += perf.attempts;
      }
    }

    const rawPct = rawAttempts > 0 ? Math.round((rawCorrect / rawAttempts) * 100) : null;
    const weightedPct = weightedTotalSum > 0 ? Math.round((weightedCorrectSum / weightedTotalSum) * 100) : null;
    const delta = rawPct !== null && weightedPct !== null ? weightedPct - rawPct : null;

    return { rawPct, weightedPct, delta, highWrong };
  }, [userProfile.skillScores]);

  // ── Timeline steps ──────────────────────────────────────────────────────────
  const timelineSteps: TimelineStep[] = [
    { label: 'Screener done', done: Boolean(userProfile.screenerComplete) },
    { label: 'Full diagnostic', sublabel: 'done', done: Boolean(userProfile.fullAssessmentComplete) },
    { label: 'Domain practice', sublabel: 'unlocked', done: Boolean(userProfile.screenerComplete) },
    { label: 'Skill practice', sublabel: 'unlocked', done: Boolean(userProfile.fullAssessmentComplete) },
    {
      label: isReady ? 'Exam ready' : 'Exam readiness',
      sublabel: isReady ? undefined : `${skillsToReadiness} skills to go`,
      done: isReady,
      remaining: isReady ? undefined : skillsToReadiness,
    },
  ];

  const toggleDomain = (domainId: number) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  // ── Repeated errors ─────────────────────────────────────────────────────────
  const topErrors = useMemo(() => {
    return Object.entries(userProfile.distractorErrors ?? {})
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [userProfile.distractorErrors]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <p className="editorial-overline mb-2">Progress</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your progress.</h2>
        <p className="mt-2 text-[15px] text-slate-500">
          {(userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString()} total exposures logged · accuracy measured across {totalAttempts.toLocaleString()} skill attempts · {assessedCount} of {TOTAL_SKILLS} skills touched.
        </p>
      </div>

      {/* ── Progress timeline ────────────────────────────────────────────────── */}
      <div className="editorial-surface p-4 sm:p-5">
        <p className="editorial-overline mb-4">Your journey</p>
        <ProgressTimeline steps={timelineSteps} />
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Questions answered',
            value: (userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString(),
            color: 'text-cyan-400',
            desc: 'Total exposures',
          },
          {
            label: PROFICIENCY_META.proficient.label,
            value: demonstratingCount,
            color: 'text-emerald-400',
            desc: `of ${TOTAL_SKILLS} skills`,
            title: PROFICIENCY_META.proficient.description,
          },
          {
            label: PROFICIENCY_META.approaching.label,
            value: approachingCount,
            color: 'text-amber-400',
            desc: `of ${TOTAL_SKILLS} skills`,
            title: PROFICIENCY_META.approaching.description,
          },
          {
            label: 'Overall accuracy',
            value: overallAccuracy !== null ? `${overallAccuracy}%` : '—',
            color: overallAccuracy !== null && overallAccuracy >= 80 ? 'text-emerald-400' : overallAccuracy !== null && overallAccuracy >= 60 ? 'text-amber-400' : 'text-rose-400',
            desc: `${totalCorrect.toLocaleString()} correct / ${totalAttempts.toLocaleString()} skill attempts`,
            title: 'Accuracy is measured across skill practice attempts only, not total exposures.',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="editorial-stat-card"
            title={stat.title}
          >
            <p className={`text-2xl font-bold tabular-nums sm:text-[1.75rem] ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-sm font-semibold leading-tight text-slate-700">{stat.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Screener report link (only if screener done but NOT full diagnostic) ─ */}
      {hasScreenerReport && !userProfile.fullAssessmentComplete && onViewScreenerReport && (
        <button
          onClick={onViewScreenerReport}
          className="editorial-button-ghost"
        >
          View screener report →
        </button>
      )}

      {/* ── Domain breakdown ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="editorial-overline">Domain breakdown</p>
          <p className="text-[11px] text-slate-500">
            Goal: {READINESS_TARGET} of {TOTAL_SKILLS} skills {PROFICIENCY_META.proficient.label} ·{' '}
            <span className="text-amber-700/80">marker = target</span>
          </p>
        </div>

        {progress.domains.map(domain => {
          const isExpanded = expandedDomains.has(domain.domainId);
          const demonstrating = domain.strongerSkillCount;
          const barPct = Math.round((demonstrating / Math.max(domain.activeSkillCount, 1)) * 100);
          const barColor = barPct >= 70 ? 'bg-emerald-400' : barPct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
          const examWeight = EXAM_WEIGHTS[domain.domainId] ?? 0;

          return (
            <div
              key={domain.domainId}
              className="editorial-surface overflow-hidden"
            >
              {/* Domain header — clickable to expand */}
              <button
                onClick={() => toggleDomain(domain.domainId)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fbfaf7]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-base font-semibold text-slate-900 truncate">{domain.domainName}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${barPct >= 70 ? 'text-emerald-600' : barPct >= 50 ? 'text-amber-700' : 'text-rose-600'}`}>
                        {demonstrating} / {domain.activeSkillCount} {PROFICIENCY_META.proficient.label}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Progress bar with 70% goal line */}
                  <div className="relative h-2" style={{ overflow: 'visible' }}>
                    <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {/* 70% dashed goal marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-amber-500/70"
                      style={{ left: '70%' }}
                      title="70% readiness goal"
                    />
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-3 border-t border-slate-200 px-4 pb-4 pt-3">
                  {/* Tier counts + exam weight row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {domain.weakSkillCount > 0 && (
                        <span
                          className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300"
                          title={PROFICIENCY_META.emerging.description}
                        >
                          {domain.weakSkillCount} {PROFICIENCY_META.emerging.label}
                        </span>
                      )}
                      {domain.developingSkillCount > 0 && (
                        <span
                          className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                          title={PROFICIENCY_META.approaching.description}
                        >
                          {domain.developingSkillCount} {PROFICIENCY_META.approaching.label}
                        </span>
                      )}
                      {domain.strongerSkillCount > 0 && (
                        <span
                          className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                          title={PROFICIENCY_META.proficient.description}
                        >
                          {domain.strongerSkillCount} {PROFICIENCY_META.proficient.label}
                        </span>
                      )}
                      {domain.assessedSkillCount === 0 && (
                        <span className="text-[11px] italic text-slate-500">No data yet</span>
                      )}
                    </div>
                    <span className="text-[11px] shrink-0 text-slate-500">
                      {examWeight}% exam weight
                    </span>
                  </div>

                  {/* Skill dots — only after full diagnostic */}
                  {fullAssessmentUnlocked ? (
                    <div>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(18px,1fr))] gap-x-1 gap-y-2 sm:gap-x-1.5">
                        {domain.skills.map(skill => (
                          <div key={skill.skillId} className="flex justify-center">
                            <div
                              className={`h-3.5 w-3.5 rounded-full ${DOT_COLORS[skill.colorState]} shrink-0`}
                              title={`${skill.fullLabel}: ${skill.statusLabel}${skill.score !== null ? ` (${Math.round(skill.score * 100)}%)` : ''}`}
                            />
                          </div>
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {([
                          { color: DOT_COLORS.red, label: PROFICIENCY_META.emerging.label },
                          { color: DOT_COLORS.yellow, label: PROFICIENCY_META.approaching.label },
                          { color: DOT_COLORS.green, label: PROFICIENCY_META.proficient.label },
                          { color: DOT_COLORS.gray, label: PROFICIENCY_META.unstarted.label },
                        ] as const).map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1">
                            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                            <span className="text-[11px] text-slate-500">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] italic text-slate-500">
                      Complete the full diagnostic to see skill-level breakdown.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* ── Advanced statistics ──────────────────────────────────────────────── */}
      <div className="editorial-surface overflow-hidden">
        <button
          onClick={() => setAdvancedExpanded(prev => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf7]"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <p className="text-base font-semibold text-slate-900">Advanced statistics</p>
          </div>
          {advancedExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {advancedExpanded && (
          <div className="space-y-4 border-t border-slate-200 bg-[#fbfaf7] px-4 pb-4 pt-3">

            {timeStats.avgOverall === null ? (
              <p className="text-sm italic text-slate-500">No timing data recorded yet.</p>
            ) : (
              <>
                {/* Avg time overall */}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Avg time per question</p>
                  <div className="flex items-baseline gap-2">
                    <span className="tabular-nums text-2xl font-bold text-amber-700">{formatTime(timeStats.avgOverall)}</span>
                    <span className="text-sm text-slate-500">per question overall</span>
                  </div>
                </div>

                {/* Avg time by domain */}
                {Object.keys(timeStats.byDomain).length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Avg time by domain — longer = harder
                    </p>
                    <div className="space-y-1.5">
                      {progress.domains
                        .filter(d => timeStats.byDomain[d.domainId])
                        .sort((a, b) => (timeStats.byDomain[b.domainId]?.avg ?? 0) - (timeStats.byDomain[a.domainId]?.avg ?? 0))
                        .map(d => {
                          const stat = timeStats.byDomain[d.domainId];
                          const isMax = d === progress.domains
                            .filter(x => timeStats.byDomain[x.domainId])
                            .sort((a, b) => (timeStats.byDomain[b.domainId]?.avg ?? 0) - (timeStats.byDomain[a.domainId]?.avg ?? 0))[0];
                          return (
                            <div key={d.domainId} className="flex items-center justify-between gap-3">
                              <p className={`flex-1 truncate text-sm ${isMax ? 'text-amber-700' : 'text-slate-500'}`}>
                                {d.domainName}
                                {isMax && <span className="ml-1.5 text-[11px] text-amber-600/80">most time</span>}
                              </p>
                              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-700">
                                {formatTime(stat.avg)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Top 5 most time-consuming questions */}
                {timeStats.topSlowQuestions.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Top 5 most time-consuming questions
                    </p>
                    <div className="space-y-1">
                      {timeStats.topSlowQuestions.map((q, i) => (
                        <div key={q.questionId} className="flex items-center justify-between gap-3">
                          <p className="flex-1 truncate font-mono text-sm text-slate-500">
                            {i + 1}. {q.questionId}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold tabular-nums text-amber-700">{formatTime(q.avgSeconds)}</span>
                            <span className="text-[11px] text-slate-500">×{q.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Confidence-weighted accuracy */}
            {confidenceStats.rawPct !== null && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confidence-adjusted accuracy</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">Raw accuracy</p>
                    <span className="text-sm font-bold tabular-nums text-slate-700">{confidenceStats.rawPct}%</span>
                  </div>
                  {confidenceStats.weightedPct !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        Confidence-weighted
                        <span className="ml-1.5 text-[11px] text-slate-400">(Sure×1.2, Guess×0.8, Sure+wrong×0.5)</span>
                      </p>
                      <span className={`text-sm font-bold tabular-nums ${
                        confidenceStats.delta !== null && confidenceStats.delta > 0 ? 'text-emerald-600' :
                        confidenceStats.delta !== null && confidenceStats.delta < 0 ? 'text-rose-500' : 'text-slate-700'
                      }`}>
                        {confidenceStats.weightedPct}%
                        {confidenceStats.delta !== null && confidenceStats.delta !== 0 && (
                          <span className="ml-1 text-[11px]">({confidenceStats.delta > 0 ? '+' : ''}{confidenceStats.delta})</span>
                        )}
                      </span>
                    </div>
                  )}
                  {confidenceStats.highWrong > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-rose-600">Misconception flags <span className="text-[11px] text-rose-400">(answered Sure, got wrong)</span></p>
                      <span className="text-sm font-bold tabular-nums text-rose-600">{confidenceStats.highWrong}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Repeated incorrect patterns */}
            {(topErrors.length > 0 || (userProfile.errorPatterns ?? []).length > 0) ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Repeated incorrect answers
                </p>
                {topErrors.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {topErrors.map(([distractor, count]) => (
                      <div key={distractor} className="flex items-center justify-between gap-3">
                        <p className="flex-1 truncate text-[11px] text-slate-500">{distractor}</p>
                        <span className="shrink-0 text-[11px] font-bold tabular-nums text-rose-600">×{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(userProfile.errorPatterns ?? []).length > 0 && (
                  <div className="space-y-1">
                    {(userProfile.errorPatterns ?? []).slice(0, 5).map((pattern, i) => (
                      <p key={i} className="text-[11px] leading-relaxed text-slate-500">• {pattern}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Repeated incorrect answers
                </p>
                <p className="text-[11px] italic leading-relaxed text-slate-500">
                  No repeated incorrect patterns detected yet. This section populates once the same concepts are missed more than once.
                </p>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
