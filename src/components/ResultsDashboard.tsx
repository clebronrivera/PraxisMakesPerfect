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
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const nextDone = i < steps.length - 1 ? steps[i + 1].done : false;
        const lineColor = step.done && nextDone ? 'bg-emerald-500' : 'bg-navy-700';

        return (
          <div key={step.label} className="flex items-start flex-1 min-w-0">
            {/* Step node + label */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                ${step.done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isLast && step.remaining !== undefined
                    ? 'bg-navy-800 border-cyan-500/50 text-cyan-400'
                    : 'bg-navy-800 border-navy-600 text-slate-600'}
              `}>
                {step.done
                  ? <Check className="w-3.5 h-3.5" />
                  : isLast && step.remaining !== undefined
                    ? step.remaining
                    : null}
              </div>
              <p className={`text-[9px] font-medium mt-1.5 text-center leading-tight max-w-[52px] ${step.done ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.label}
              </p>
              {step.sublabel && (
                <p className="text-[8px] text-slate-700 text-center max-w-[52px] leading-tight">{step.sublabel}</p>
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
    <div className="space-y-6 pb-16">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <p className="overline mb-1.5">Progress</p>
        <h2 className="text-3xl font-bold text-slate-50 leading-tight">Your progress.</h2>
        <p className="text-slate-500 text-sm mt-1.5">
          Based on {(userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString()} answered exposures across {assessedCount} of {TOTAL_SKILLS} skills.
        </p>
      </div>

      {/* ── Progress timeline ────────────────────────────────────────────────── */}
      <div className="p-4 bg-navy-800/60 border border-navy-600/40 rounded-2xl">
        <p className="text-[10px] font-semibold text-slate-500 mb-4 uppercase tracking-wide">Your journey</p>
        <ProgressTimeline steps={timelineSteps} />
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            desc: `${totalCorrect.toLocaleString()} correct`,
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-4 bg-navy-800/70 border border-navy-600/40 rounded-2xl"
            title={stat.title}
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-semibold text-slate-300 mt-1 leading-tight">{stat.label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Screener report link (only if screener done but NOT full diagnostic) ─ */}
      {hasScreenerReport && !userProfile.fullAssessmentComplete && onViewScreenerReport && (
        <button
          onClick={onViewScreenerReport}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          View screener report →
        </button>
      )}

      {/* ── Domain breakdown ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="overline">Domain breakdown</p>
          <p className="text-[10px] text-slate-600">
            Goal: {READINESS_TARGET} of {TOTAL_SKILLS} skills {PROFICIENCY_META.proficient.label} ·{' '}
            <span className="text-cyan-600/80">dashed line = target</span>
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
              className="bg-navy-800/60 border border-navy-600/40 rounded-2xl overflow-hidden"
            >
              {/* Domain header — clickable to expand */}
              <button
                onClick={() => toggleDomain(domain.domainId)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-navy-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-slate-100 truncate">{domain.domainName}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold tabular-nums ${barPct >= 70 ? 'text-emerald-400' : barPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {demonstrating} / {domain.activeSkillCount} {PROFICIENCY_META.proficient.label}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>

                  {/* Progress bar with 70% goal line */}
                  <div className="relative h-2" style={{ overflow: 'visible' }}>
                    <div className="absolute inset-0 bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {/* 70% dashed goal marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400/70 rounded-full"
                      style={{ left: '70%' }}
                      title="70% readiness goal"
                    />
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-navy-700/40 pt-3">
                  {/* Tier counts + exam weight row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {domain.weakSkillCount > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-medium"
                          title={PROFICIENCY_META.emerging.description}
                        >
                          {domain.weakSkillCount} {PROFICIENCY_META.emerging.label}
                        </span>
                      )}
                      {domain.developingSkillCount > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-medium"
                          title={PROFICIENCY_META.approaching.description}
                        >
                          {domain.developingSkillCount} {PROFICIENCY_META.approaching.label}
                        </span>
                      )}
                      {domain.strongerSkillCount > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium"
                          title={PROFICIENCY_META.proficient.description}
                        >
                          {domain.strongerSkillCount} {PROFICIENCY_META.proficient.label}
                        </span>
                      )}
                      {domain.assessedSkillCount === 0 && (
                        <span className="text-[10px] text-slate-600 italic">No data yet</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0">
                      {examWeight}% exam weight
                    </span>
                  </div>

                  {/* Skill dots — only after full diagnostic */}
                  {fullAssessmentUnlocked ? (
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        {domain.skills.map(skill => (
                          <div
                            key={skill.skillId}
                            className={`w-3 h-3 rounded-full ${DOT_COLORS[skill.colorState]} shrink-0`}
                            title={`${skill.fullLabel}: ${skill.statusLabel}${skill.score !== null ? ` (${Math.round(skill.score * 100)}%)` : ''}`}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="flex items-center gap-3 mt-2">
                        {([
                          { color: DOT_COLORS.red, label: PROFICIENCY_META.emerging.label },
                          { color: DOT_COLORS.yellow, label: PROFICIENCY_META.approaching.label },
                          { color: DOT_COLORS.green, label: PROFICIENCY_META.proficient.label },
                          { color: DOT_COLORS.gray, label: PROFICIENCY_META.unstarted.label },
                        ] as const).map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-[9px] text-slate-600">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">
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
      <div className="border border-navy-600/40 rounded-2xl overflow-hidden">
        <button
          onClick={() => setAdvancedExpanded(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-navy-800/60 hover:bg-navy-700/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">Advanced statistics</p>
          </div>
          {advancedExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {advancedExpanded && (
          <div className="px-4 pb-5 pt-3 bg-navy-800/40 space-y-5 border-t border-navy-700/40">

            {timeStats.avgOverall === null ? (
              <p className="text-xs text-slate-600 italic">No timing data recorded yet.</p>
            ) : (
              <>
                {/* Avg time overall */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Avg time per question</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan-400 tabular-nums">{formatTime(timeStats.avgOverall)}</span>
                    <span className="text-xs text-slate-500">per question overall</span>
                  </div>
                </div>

                {/* Avg time by domain */}
                {Object.keys(timeStats.byDomain).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
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
                              <p className={`text-xs truncate flex-1 ${isMax ? 'text-amber-300' : 'text-slate-400'}`}>
                                {d.domainName}
                                {isMax && <span className="ml-1.5 text-[9px] text-amber-500/80">most time</span>}
                              </p>
                              <span className="text-xs font-bold tabular-nums text-slate-300 shrink-0">
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
                    <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                      Top 5 most time-consuming questions
                    </p>
                    <div className="space-y-1">
                      {timeStats.topSlowQuestions.map((q, i) => (
                        <div key={q.questionId} className="flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-500 font-mono truncate flex-1">
                            {i + 1}. {q.questionId}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold tabular-nums text-amber-400">{formatTime(q.avgSeconds)}</span>
                            <span className="text-[9px] text-slate-600">×{q.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Repeated incorrect patterns */}
            {(topErrors.length > 0 || (userProfile.errorPatterns ?? []).length > 0) ? (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  Repeated incorrect answers
                </p>
                {topErrors.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {topErrors.map(([distractor, count]) => (
                      <div key={distractor} className="flex items-center justify-between gap-3">
                        <p className="text-[10px] text-slate-400 truncate flex-1">{distractor}</p>
                        <span className="text-[10px] font-bold text-rose-400 tabular-nums shrink-0">×{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(userProfile.errorPatterns ?? []).length > 0 && (
                  <div className="space-y-1">
                    {(userProfile.errorPatterns ?? []).slice(0, 5).map((pattern, i) => (
                      <p key={i} className="text-[10px] text-slate-500 leading-relaxed">• {pattern}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  Repeated incorrect answers
                </p>
                <p className="text-[10px] text-slate-600 italic leading-relaxed">
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
