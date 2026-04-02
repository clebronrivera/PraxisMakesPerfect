// src/components/ResultsDashboard.tsx
// Progress page — pure analytics. No practice entry points.

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { buildProgressSummary, type SkillColorState } from '../utils/progressSummaries';
import { PROFICIENCY_META, TOTAL_SKILLS, READINESS_TARGET } from '../utils/skillProficiency';
import { buildConceptAnalytics, type ConceptAnalyticsReport } from '../utils/conceptAnalytics';
import { computeTimeStats, computeConfidenceStats } from '../utils/diagnosticSelectors';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Official Praxis 5421 exam content weights per domain (%). */
const EXAM_WEIGHTS: Record<number, number> = {
  1: 36, // Professional Practices
  2: 21, // Student-Level Services
  3: 19, // Systems-Level Services
  4: 24, // Foundations of School Psychology
};
// TOTAL_SKILLS and READINESS_TARGET are imported from skillProficiency — do not redeclare.

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsDashboardProps {
  userProfile: UserProfile;
  skills: Skill[];
  fullAssessmentUnlocked: boolean;
  hasScreenerReport?: boolean;
  onViewScreenerReport?: () => void;
  analyzedQuestions?: AnalyzedQuestion[];
  // Kept for App.tsx compatibility — not used in UI (pure analytics page)
  onStartPractice?: (domainId?: number) => void;
  onStartSkillPractice?: (skillId: string) => void;
  onRetakeAssessment?: () => void;
  onResetProgress?: () => void;
  defaultView?: 'domain' | 'skill';
}

// TimeStats is imported from diagnosticSelectors — do not redeclare.

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

// computeTimeStats is imported from diagnosticSelectors — do not redeclare.

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
  analyzedQuestions,
}: ResultsDashboardProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set()); // all collapsed by default
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [conceptsExpanded, setConceptsExpanded] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);

  // ── Progress data ───────────────────────────────────────────────────────────
  const progress = useMemo(
    () => buildProgressSummary(userProfile.skillScores, skills),
    [userProfile.skillScores, skills]
  );

  // ── Baseline comparison ────────────────────────────────────────────────────
  const hasBaseline = Boolean(userProfile.baselineSnapshot);
  const baselineProgress = useMemo(
    () => userProfile.baselineSnapshot
      ? buildProgressSummary(userProfile.baselineSnapshot as any, skills)
      : null,
    [userProfile.baselineSnapshot, skills]
  );

  // Compute growth metrics: skills that improved since baseline
  const growthMetrics = useMemo(() => {
    if (!baselineProgress) return null;
    let emergedToApproaching = 0;
    let approachingToDemo = 0;
    for (const skill of progress.skills) {
      const baseSkill = baselineProgress.skills.find(s => s.skillId === skill.skillId);
      if (!baseSkill) continue;
      if (baseSkill.colorState === 'red' && (skill.colorState === 'yellow' || skill.colorState === 'green')) emergedToApproaching++;
      if ((baseSkill.colorState === 'red' || baseSkill.colorState === 'yellow') && skill.colorState === 'green') approachingToDemo++;
    }
    return { emergedToApproaching, approachingToDemo };
  }, [progress, baselineProgress]);

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
  // Uses computeConfidenceStats from diagnosticSelectors (returns 0–1 ratios).
  // Convert to integer percentages at display sites below.
  const confidenceStats = useMemo(
    () => computeConfidenceStats(userProfile),
    [userProfile]
  );
  // Display-ready percentages derived from 0–1 ratios
  const rawPct = confidenceStats.rawAccuracy !== null
    ? Math.round(confidenceStats.rawAccuracy * 100) : null;
  const weightedPct = confidenceStats.weightedAccuracy !== null
    ? Math.round(confidenceStats.weightedAccuracy * 100) : null;
  const confidenceDeltaPct = confidenceStats.delta !== null
    ? Math.round(confidenceStats.delta * 100) : null;

  // ── Concept analytics ──────────────────────────────────────────────────────
  const conceptReport: ConceptAnalyticsReport | null = useMemo(() => {
    if (!analyzedQuestions || analyzedQuestions.length === 0) return null;

    // Build UserResponse[] from profile's skillScores.attemptHistory
    const responses: Array<{
      questionId: string;
      selectedAnswers: string[];
      correctAnswers: string[];
      isCorrect: boolean;
      timeSpent: number;
      confidence: 'low' | 'medium' | 'high';
      timestamp: number;
    }> = [];

    for (const [, perf] of Object.entries(userProfile.skillScores ?? {})) {
      if (!perf.attemptHistory) continue;
      for (const attempt of perf.attemptHistory) {
        responses.push({
          questionId: attempt.questionId,
          selectedAnswers: [],
          correctAnswers: [],
          isCorrect: attempt.correct,
          timeSpent: attempt.timeSpent ?? 0,
          confidence: attempt.confidence ?? 'medium',
          timestamp: attempt.timestamp ?? 0,
        });
      }
    }

    if (responses.length === 0) return null;
    return buildConceptAnalytics(responses, analyzedQuestions);
  }, [analyzedQuestions, userProfile.skillScores]);

  // ── Timeline steps ──────────────────────────────────────────────────────────
  const timelineSteps: TimelineStep[] = [
    { label: 'Baseline complete', done: Boolean(userProfile.screenerComplete) },
    { label: 'Adaptive diagnostic', sublabel: 'done', done: Boolean(userProfile.fullAssessmentComplete) },
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
            desc: 'All exposures incl. screener',
            title: 'Counts every question shown — screener, diagnostic, and skill practice. Skill accuracy is computed from skill practice attempts only, so the denominators differ.',
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

      {/* ── Growth since baseline ─────────────────────────────────────────── */}
      {hasBaseline && growthMetrics && (
        <div className="editorial-surface p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="editorial-overline">Growth since diagnostic</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-slate-500">Show baseline</span>
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={e => setShowBaseline(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{growthMetrics.approachingToDemo}</p>
              <p className="text-[11px] text-slate-500 mt-1">Skills reached Demonstrating</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{growthMetrics.emergedToApproaching}</p>
              <p className="text-[11px] text-slate-500 mt-1">Skills improved a tier</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-800">{demonstratingCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Currently Demonstrating</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-800">{baselineProgress ? baselineProgress.skills.filter(s => s.colorState === 'green').length : 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Baseline Demonstrating</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Domain breakdown ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="editorial-overline">Domain breakdown</p>
          <p className="text-[11px] text-slate-500">
            Goal: {READINESS_TARGET} of {TOTAL_SKILLS} skills {PROFICIENCY_META.proficient.label} ·{' '}
            <span className="text-amber-700/80">marker = target</span>
            {showBaseline && hasBaseline && <> · <span className="text-indigo-500/80">ghost = baseline</span></>}
          </p>
        </div>

        {progress.domains.map(domain => {
          const isExpanded = expandedDomains.has(domain.domainId);
          const demonstrating = domain.strongerSkillCount;
          const barPct = Math.round((demonstrating / Math.max(domain.activeSkillCount, 1)) * 100);
          const barColor = barPct >= 70 ? 'bg-emerald-400' : barPct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
          const examWeight = EXAM_WEIGHTS[domain.domainId] ?? 0;

          // Baseline ghost bar
          const baselineDomain = showBaseline && baselineProgress
            ? baselineProgress.domains.find(d => d.domainId === domain.domainId)
            : null;
          const baselineBarPct = baselineDomain
            ? Math.round((baselineDomain.strongerSkillCount / Math.max(baselineDomain.activeSkillCount, 1)) * 100)
            : 0;

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

                  {/* Progress bar with 70% goal line + optional baseline ghost */}
                  <div className="relative h-2" style={{ overflow: 'visible' }}>
                    <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-100">
                      {/* Baseline ghost bar (shown behind current) */}
                      {showBaseline && baselineDomain && baselineBarPct > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-indigo-200/60"
                          style={{ width: `${baselineBarPct}%` }}
                        />
                      )}
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor} relative z-[1]`}
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

      {/* ── Concept insights ─────────────────────────────────────────────────── */}
      {conceptReport && conceptReport.concepts.length > 0 && (
        <div className="editorial-surface overflow-hidden">
          <button
            onClick={() => setConceptsExpanded(prev => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-[#fbfaf7]"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-cyan-600" />
              <p className="text-base font-semibold text-slate-900">Concept insights</p>
              {conceptReport.summary.totalGaps > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-500">
                  {conceptReport.summary.totalGaps} gap{conceptReport.summary.totalGaps !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {conceptsExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {conceptsExpanded && (
            <div className="space-y-4 border-t border-slate-200 bg-[#fbfaf7] px-4 pb-4 pt-3">
              <p className="text-[11px] text-slate-400 leading-snug">
                Vocabulary concepts that appear across multiple questions. Gaps indicate terms you may need to study further — they recur in questions you&apos;re getting wrong.
              </p>

              {/* Cross-skill gaps (highest signal) */}
              {conceptReport.crossSkillGaps.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                    Cross-skill vocabulary gaps
                  </p>
                  <p className="mb-2 text-[11px] text-slate-400 leading-snug">
                    These concepts are weak across multiple skills — likely a foundational vocabulary gap.
                  </p>
                  <div className="space-y-1.5">
                    {conceptReport.crossSkillGaps.slice(0, 8).map(gap => (
                      <div key={gap.concept} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{gap.concept}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Weak in {gap.affectedSkills.length} skills: {gap.affectedSkills.join(', ')}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-rose-600">
                          {Math.round(gap.accuracy * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top gap concepts */}
              {conceptReport.gapConcepts.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Weakest concepts
                  </p>
                  <div className="space-y-1.5">
                    {conceptReport.gapConcepts.slice(0, 10).map(c => (
                      <div key={c.concept} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{c.concept}</p>
                          <p className="text-[11px] text-slate-400">
                            {c.correct}/{c.attempted} correct · {c.relatedSkills.length} skill{c.relatedSkills.length !== 1 ? 's' : ''}
                            {c.trend !== 'insufficient' && ` · ${c.trend}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-rose-400"
                              style={{ width: `${Math.round(c.accuracy * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-rose-600 w-10 text-right">
                            {Math.round(c.accuracy * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strength concepts */}
              {conceptReport.strengthConcepts.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Strongest concepts
                  </p>
                  <div className="space-y-1.5">
                    {conceptReport.strengthConcepts.slice(0, 5).map(c => (
                      <div key={c.concept} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{c.concept}</p>
                          <p className="text-[11px] text-slate-400">
                            {c.correct}/{c.attempted} correct · {c.relatedSkills.length} skill{c.relatedSkills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${Math.round(c.accuracy * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold tabular-nums text-emerald-600 w-10 text-right">
                            {Math.round(c.accuracy * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary line */}
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                {conceptReport.summary.totalConceptsTested} concepts tested · {conceptReport.summary.totalGaps} gap{conceptReport.summary.totalGaps !== 1 ? 's' : ''} · {conceptReport.summary.totalStrengths} strength{conceptReport.summary.totalStrengths !== 1 ? 's' : ''} · {conceptReport.summary.totalCrossSkillGaps} cross-skill gap{conceptReport.summary.totalCrossSkillGaps !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

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
            {rawPct !== null && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confidence-adjusted accuracy</p>
                <p className="mb-2 text-[11px] text-slate-400 leading-snug">High-confidence wrong answers are penalized more heavily. A large gap between raw and adjusted accuracy suggests misconceptions worth targeting.</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">Raw accuracy</p>
                    <span className="text-sm font-bold tabular-nums text-slate-700">{rawPct}%</span>
                  </div>
                  {weightedPct !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        Confidence-weighted
                        <span className="ml-1.5 text-[11px] text-slate-400">(Sure×1.2, Guess×0.8, Sure+wrong×0.5)</span>
                      </p>
                      <span className={`text-sm font-bold tabular-nums ${
                        confidenceDeltaPct !== null && confidenceDeltaPct > 0 ? 'text-emerald-600' :
                        confidenceDeltaPct !== null && confidenceDeltaPct < 0 ? 'text-rose-500' : 'text-slate-700'
                      }`}>
                        {weightedPct}%
                        {confidenceDeltaPct !== null && confidenceDeltaPct !== 0 && (
                          <span className="ml-1 text-[11px]">({confidenceDeltaPct > 0 ? '+' : ''}{confidenceDeltaPct})</span>
                        )}
                      </span>
                    </div>
                  )}
                  {confidenceStats.totalHighWrong > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-rose-600">Misconception flags <span className="text-[11px] text-rose-400">(answered Sure, got wrong)</span></p>
                      <span className="text-sm font-bold tabular-nums text-rose-600">{confidenceStats.totalHighWrong}</span>
                    </div>
                  )}
                </div>
                {confidenceStats.interpretation === 'possible_overconfidence' && (
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                    High-confidence wrong answers are pulling your effective score below your raw accuracy — likely a misconception area worth targeting.
                  </p>
                )}
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
