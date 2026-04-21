// src/components/ResultsDashboard.tsx
// Progress page — atelier design-first rewrite. Pure analytics, no practice entry points.
// All data computations (progress, growth, timing, confidence, concept analytics) are preserved.

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { buildProgressSummary, type SkillColorState } from '../utils/progressSummaries';
import type { SkillPerformance } from '../brain/learning-state';
import { PROFICIENCY_META, TOTAL_SKILLS, READINESS_TARGET } from '../utils/skillProficiency';
import { buildConceptAnalytics, type ConceptAnalyticsReport } from '../utils/conceptAnalytics';
import { computeTimeStats, computeConfidenceStats } from '../utils/diagnosticSelectors';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Official Praxis exam content weights per domain (%). */
const EXAM_WEIGHTS: Record<number, number> = {
  1: 36, // Professional Practices
  2: 21, // Student-Level Services
  3: 19, // Systems-Level Services
  4: 24, // Foundations of School Psychology
};

/** Atelier domain palette (keyed by domainId). */
const DOMAIN_COLOR: Record<number, string> = {
  1: 'var(--d1-peach)',
  2: 'var(--d2-mint)',
  3: 'var(--d3-ice)',
  4: 'var(--d4-lavender)',
};

/** Atelier mapping for the per-skill proficiency dot. */
const DOT_COLORS: Record<SkillColorState, string> = {
  gray: 'rgba(226,232,240,0.15)',
  red: 'var(--accent-rose)',
  yellow: 'var(--d1-peach)',
  green: 'var(--d2-mint)',
};

const DOT_BORDER: Record<SkillColorState, string> = {
  gray: 'rgba(226,232,240,0.25)',
  red: 'rgba(251,207,232,0.6)',
  yellow: 'rgba(252,213,180,0.6)',
  green: 'transparent',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsDashboardProps {
  userProfile: UserProfile;
  skills: Skill[];
  fullAssessmentUnlocked: boolean;
  hasScreenerReport?: boolean;
  onViewScreenerReport?: () => void;
  analyzedQuestions?: AnalyzedQuestion[];
  // Kept for App.tsx compatibility — not used in UI
  onStartPractice?: (domainId?: number) => void;
  onStartSkillPractice?: (skillId: string) => void;
  onRetakeAssessment?: () => void;
  onResetProgress?: () => void;
  defaultView?: 'domain' | 'skill';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Journey timeline ────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  sublabel?: string;
  done: boolean;
  remaining?: number;
}

function JourneyTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = !step.done && (i === 0 || steps[i - 1].done);
        return (
          <div key={step.label} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0 px-2">
              <div
                className={`relative h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold`}
                style={
                  step.done
                    ? { background: 'var(--d2-mint)', color: '#064e3b', boxShadow: '0 0 10px var(--d2-mint)' }
                    : isCurrent
                      ? { background: 'linear-gradient(135deg, #fde4c1, #fbcfe8)', color: '#1e1b3a', boxShadow: '0 0 14px rgba(252,213,180,0.6)' }
                      : { background: 'rgba(226,232,240,0.08)', color: '#64748b', border: '1px solid rgba(226,232,240,0.15)' }
                }
              >
                {step.done
                  ? <Check className="w-3.5 h-3.5" />
                  : step.remaining !== undefined
                    ? step.remaining
                    : null}
              </div>
              <p
                className={`mt-2 max-w-[92px] text-center text-[11px] font-medium leading-tight ${
                  step.done ? 'text-white' : isCurrent ? 'text-white' : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p className="max-w-[92px] text-center text-[10px] leading-tight text-slate-500 uppercase tracking-wider mt-0.5">
                  {step.sublabel}
                </p>
              )}
            </div>
            {!isLast && (
              <div
                className="flex-1 h-0.5 mt-3.5 mx-0.5 rounded-full"
                style={{ background: step.done ? 'var(--d2-mint)' : 'rgba(226,232,240,0.12)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  title,
  big,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  title?: string;
  big?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(226,232,240,0.08)' }}
      title={title}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
      />
      <p className="eyebrow mb-2">{label}</p>
      <p
        className={`tabular-nums leading-none font-semibold ${big ? 'text-[32px]' : 'text-[28px]'}`}
        style={{ color: '#f1f5f9' }}
      >
        {value}
      </p>
      <p className="text-[11px] text-slate-500 mt-2 leading-snug">{sub}</p>
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
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [conceptsExpanded, setConceptsExpanded] = useState(false);
  const [showBaseline] = useState(true);
  const [domainFilter, setDomainFilter] = useState<number | null>(null);

  // ── Progress data ───────────────────────────────────────────────────────────
  const progress = useMemo(
    () => buildProgressSummary(userProfile.skillScores, skills),
    [userProfile.skillScores, skills]
  );

  // ── Baseline comparison ────────────────────────────────────────────────────
  const hasBaseline = Boolean(userProfile.baselineSnapshot);
  const baselineProgress = useMemo(
    () =>
      userProfile.baselineSnapshot
        ? buildProgressSummary(userProfile.baselineSnapshot as Record<string, SkillPerformance>, skills)
        : null,
    [userProfile.baselineSnapshot, skills]
  );

  const growthMetrics = useMemo(() => {
    if (!baselineProgress) return null;
    let emergedToApproaching = 0;
    let approachingToDemo = 0;
    for (const skill of progress.skills) {
      const baseSkill = baselineProgress.skills.find((s) => s.skillId === skill.skillId);
      if (!baseSkill) continue;
      if (baseSkill.colorState === 'red' && (skill.colorState === 'yellow' || skill.colorState === 'green'))
        emergedToApproaching++;
      if ((baseSkill.colorState === 'red' || baseSkill.colorState === 'yellow') && skill.colorState === 'green')
        approachingToDemo++;
    }
    return { emergedToApproaching, approachingToDemo };
  }, [progress, baselineProgress]);

  const demonstratingCount = progress.skills.filter((s) => s.colorState === 'green').length;
  const approachingCount = progress.skills.filter((s) => s.colorState === 'yellow').length;
  const assessedCount = progress.skills.filter((s) => s.attempted > 0).length;
  const skillsToReadiness = Math.max(0, READINESS_TARGET - demonstratingCount);
  const isReady = skillsToReadiness === 0;

  const totalAttempts = progress.skills.reduce((s, sk) => s + sk.attempted, 0);
  const totalCorrect = progress.skills.reduce((s, sk) => s + sk.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  // ── Time stats ──────────────────────────────────────────────────────────────
  const timeStats = useMemo(() => computeTimeStats(userProfile), [userProfile]);

  // ── Confidence-weighted accuracy ────────────────────────────────────────────
  const confidenceStats = useMemo(() => computeConfidenceStats(userProfile), [userProfile]);
  const rawPct = confidenceStats.rawAccuracy !== null ? Math.round(confidenceStats.rawAccuracy * 100) : null;
  const weightedPct = confidenceStats.weightedAccuracy !== null ? Math.round(confidenceStats.weightedAccuracy * 100) : null;
  const confidenceDeltaPct = confidenceStats.delta !== null ? Math.round(confidenceStats.delta * 100) : null;

  // ── Concept analytics ──────────────────────────────────────────────────────
  const conceptReport: ConceptAnalyticsReport | null = useMemo(() => {
    if (!analyzedQuestions || analyzedQuestions.length === 0) return null;
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
    { label: 'Baseline', done: Boolean(userProfile.screenerComplete) },
    { label: 'Diagnostic', sublabel: 'done', done: Boolean(userProfile.fullAssessmentComplete) },
    { label: 'Domain practice', done: Boolean(userProfile.screenerComplete) },
    { label: 'Skill practice', done: Boolean(userProfile.fullAssessmentComplete) },
    {
      label: isReady ? 'Exam ready' : 'Exam readiness',
      sublabel: isReady ? undefined : `${skillsToReadiness} to go`,
      done: isReady,
      remaining: isReady ? undefined : skillsToReadiness,
    },
  ];

  const toggleDomain = (domainId: number) => {
    setExpandedDomains((prev) => {
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
    <div className="space-y-6 pb-14 text-slate-200">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="pt-4">
        <p className="eyebrow mb-2">Your progress</p>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight">
          A picture of <span className="gradient-text-warm">where you stand.</span>
        </h1>
        <p className="mt-3 text-[14px] text-slate-400 max-w-2xl leading-relaxed">
          {(userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString()} total exposures · accuracy measured across{' '}
          {totalAttempts.toLocaleString()} skill attempts · {assessedCount} of {TOTAL_SKILLS} skills touched.
        </p>
      </header>

      {/* ── Journey timeline ─────────────────────────────────────────── */}
      <section className="glass p-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <p className="eyebrow">Your journey</p>
            <p className="text-[13px] text-slate-400 mt-1">From first diagnostic question to exam-ready</p>
          </div>
          <span className="text-[11px] text-slate-500">
            Step {timelineSteps.filter((s) => s.done).length + 1} of {timelineSteps.length}
          </span>
        </div>
        <JourneyTimeline steps={timelineSteps} />
      </section>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Questions answered"
            value={(userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString()}
            sub="All exposures incl. screener"
            accent="var(--d1-peach)"
            big
            title="Counts every question shown. Skill accuracy uses skill-practice attempts only."
          />
          <StatCard
            label={PROFICIENCY_META.proficient.label}
            value={demonstratingCount}
            sub={`of ${TOTAL_SKILLS} skills`}
            accent="var(--d2-mint)"
            big
            title={PROFICIENCY_META.proficient.description}
          />
          <StatCard
            label={PROFICIENCY_META.approaching.label}
            value={approachingCount}
            sub={`of ${TOTAL_SKILLS} skills`}
            accent="var(--d1-peach)"
            big
            title={PROFICIENCY_META.approaching.description}
          />
          <StatCard
            label="Overall accuracy"
            value={overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            sub={`${totalCorrect.toLocaleString()} / ${totalAttempts.toLocaleString()} attempts`}
            accent="var(--accent-rose)"
            big
            title="Across skill practice attempts only, not total exposures."
          />
        </div>
      </section>

      {/* ── Screener report link ─────────────────────────────────────── */}
      {hasScreenerReport && !userProfile.fullAssessmentComplete && onViewScreenerReport && (
        <button onClick={onViewScreenerReport} className="btn-ghost-atelier">
          View screener report →
        </button>
      )}

      {/* ── Growth since baseline ────────────────────────────────────── */}
      {hasBaseline && growthMetrics && (
        <section className="glass p-6">
          <p className="eyebrow mb-4">Growth since diagnostic</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(184,242,216,0.08)', border: '1px solid rgba(184,242,216,0.25)' }}
            >
              <p className="text-[26px] font-semibold tabular-nums" style={{ color: 'var(--d2-mint)' }}>
                {growthMetrics.approachingToDemo}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Skills reached Demonstrating</p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(252,213,180,0.08)', border: '1px solid rgba(252,213,180,0.25)' }}
            >
              <p className="text-[26px] font-semibold tabular-nums" style={{ color: 'var(--d1-peach)' }}>
                {growthMetrics.emergedToApproaching}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Skills improved a tier</p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(226,232,240,0.08)' }}
            >
              <p className="text-[26px] font-semibold text-white tabular-nums">{demonstratingCount}</p>
              <p className="text-[11px] text-slate-400 mt-1">Currently Demonstrating</p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(226,232,240,0.08)' }}
            >
              <p className="text-[26px] font-semibold text-slate-400 tabular-nums">
                {baselineProgress ? baselineProgress.skills.filter((s) => s.colorState === 'green').length : 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Baseline Demonstrating</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Four domains ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <p className="eyebrow">The four domains</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current fill · {hasBaseline ? 'baseline marker · ' : ''}80% goal marker
            </p>
          </div>
          {domainFilter !== null && (
            <button
              onClick={() => setDomainFilter(null)}
              className="text-[11px] font-medium hover:underline"
              style={{ color: 'var(--d1-peach)' }}
            >
              Show all →
            </button>
          )}
        </div>

        {progress.domains
          .filter((d) => domainFilter === null || d.domainId === domainFilter)
          .map((domain) => {
            const isExpanded = expandedDomains.has(domain.domainId);
            const demonstrating = domain.strongerSkillCount;
            const barPct = Math.round((demonstrating / Math.max(domain.activeSkillCount, 1)) * 100);
            const examWeight = EXAM_WEIGHTS[domain.domainId] ?? 0;
            const color = DOMAIN_COLOR[domain.domainId] ?? 'var(--d1-peach)';

            const baselineDomain =
              showBaseline && baselineProgress ? baselineProgress.domains.find((d) => d.domainId === domain.domainId) : null;
            const baselineBarPct = baselineDomain
              ? Math.round((baselineDomain.strongerSkillCount / Math.max(baselineDomain.activeSkillCount, 1)) * 100)
              : 0;

            return (
              <div
                key={domain.domainId}
                className="relative overflow-hidden rounded-2xl"
                style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(226,232,240,0.08)' }}
              >
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
                <button
                  onClick={() => {
                    toggleDomain(domain.domainId);
                    setDomainFilter(domainFilter === domain.domainId ? null : domain.domainId);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <p className="text-[15px] font-semibold text-white truncate">{domain.domainName}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color }}>
                          {demonstrating} / {domain.activeSkillCount} {PROFICIENCY_META.proficient.label}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </div>

                    {/* Bar with baseline ghost + goal marker */}
                    <div className="relative h-2" style={{ overflow: 'visible' }}>
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{ background: 'rgba(226,232,240,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full relative z-[1] transition-all duration-700"
                          style={{
                            width: `${barPct}%`,
                            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 70%, transparent), ${color})`,
                            boxShadow: `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`,
                          }}
                        />
                      </div>
                      {/* Baseline vertical ghost marker */}
                      {hasBaseline && baselineDomain && baselineBarPct > 0 && (
                        <span
                          className="absolute top-0 bottom-0 w-px z-[2]"
                          style={{
                            left: `${baselineBarPct}%`,
                            background: 'rgba(226,232,240,0.35)',
                            boxShadow: '0 0 4px rgba(226,232,240,0.4)',
                          }}
                          title={`Baseline: ${baselineBarPct}%`}
                        />
                      )}
                      {/* 80% goal vertical marker */}
                      <span
                        className="absolute top-[-3px] bottom-[-3px] w-px z-[2]"
                        style={{ left: '80%', background: 'var(--d2-mint)', boxShadow: '0 0 6px var(--d2-mint)' }}
                        title="80% target"
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/6 px-5 pb-5 pt-4 space-y-4">
                    {/* Tier counts + exam weight */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {domain.weakSkillCount > 0 && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: 'rgba(251,207,232,0.12)',
                              color: 'var(--accent-rose)',
                              border: '1px solid rgba(251,207,232,0.3)',
                            }}
                            title={PROFICIENCY_META.emerging.description}
                          >
                            {domain.weakSkillCount} {PROFICIENCY_META.emerging.label}
                          </span>
                        )}
                        {domain.developingSkillCount > 0 && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: 'rgba(252,213,180,0.12)',
                              color: 'var(--d1-peach)',
                              border: '1px solid rgba(252,213,180,0.3)',
                            }}
                            title={PROFICIENCY_META.approaching.description}
                          >
                            {domain.developingSkillCount} {PROFICIENCY_META.approaching.label}
                          </span>
                        )}
                        {domain.strongerSkillCount > 0 && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: 'rgba(184,242,216,0.12)',
                              color: 'var(--d2-mint)',
                              border: '1px solid rgba(184,242,216,0.3)',
                            }}
                            title={PROFICIENCY_META.proficient.description}
                          >
                            {domain.strongerSkillCount} {PROFICIENCY_META.proficient.label}
                          </span>
                        )}
                        {domain.assessedSkillCount === 0 && (
                          <span className="text-[11px] italic text-slate-500">No data yet</span>
                        )}
                      </div>
                      <span className="text-[11px] shrink-0 text-slate-500">{examWeight}% exam weight</span>
                    </div>

                    {fullAssessmentUnlocked ? (
                      <div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(22px,1fr))] gap-1">
                          {domain.skills.map((skill) => (
                            <div key={skill.skillId} className="flex justify-center">
                              <div
                                className="h-4 w-4 rounded-full shrink-0"
                                style={{
                                  background: DOT_COLORS[skill.colorState],
                                  border: `1px solid ${DOT_BORDER[skill.colorState]}`,
                                  boxShadow: skill.colorState === 'green' ? '0 0 6px var(--d2-mint)' : 'none',
                                }}
                                title={`${skill.fullLabel}: ${skill.statusLabel}${skill.score !== null ? ` (${Math.round(skill.score * 100)}%)` : ''}`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          <LegendDot color="var(--accent-rose)" label={PROFICIENCY_META.emerging.label} />
                          <LegendDot color="var(--d1-peach)" label={PROFICIENCY_META.approaching.label} />
                          <LegendDot color="var(--d2-mint)" label={PROFICIENCY_META.proficient.label} />
                          <LegendDot color="rgba(226,232,240,0.2)" label={PROFICIENCY_META.unstarted.label} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] italic text-slate-500">
                        Complete the full diagnostic to see skill-level breakdown.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </section>

      {/* ── Concept insights ────────────────────────────────────────── */}
      {conceptReport && conceptReport.concepts.length > 0 && (
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(10,22,40,0.55)', border: '1px solid rgba(226,232,240,0.08)' }}
        >
          <button
            onClick={() => setConceptsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-4 h-4" style={{ color: 'var(--d3-ice)' }} />
              <p className="text-[15px] font-semibold text-white">Concept insights</p>
              {conceptReport.summary.totalGaps > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: 'rgba(251,207,232,0.12)',
                    color: 'var(--accent-rose)',
                    border: '1px solid rgba(251,207,232,0.3)',
                  }}
                >
                  {conceptReport.summary.totalGaps} gap{conceptReport.summary.totalGaps !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {conceptsExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {conceptsExpanded && (
            <div className="space-y-5 border-t border-white/6 px-5 py-5">
              <p className="text-[11.5px] text-slate-400 leading-snug">
                Vocabulary concepts across multiple questions. Gaps = recurring weaknesses; likely vocabulary to study.
              </p>

              {conceptReport.crossSkillGaps.length > 0 && (
                <ConceptSection
                  title="Cross-skill vocabulary gaps"
                  titleColor="var(--accent-rose)"
                  subtitle="Weak across multiple skills — foundational vocabulary gap."
                  barColor="var(--accent-rose)"
                  valueColor="var(--accent-rose)"
                  items={conceptReport.crossSkillGaps.slice(0, 8).map((gap) => ({
                    key: gap.concept,
                    primary: gap.concept,
                    secondary: `Weak in ${gap.affectedSkills.length} skills: ${gap.affectedSkills.join(', ')}`,
                    accuracy: gap.accuracy,
                  }))}
                />
              )}

              {conceptReport.gapConcepts.length > 0 && (
                <ConceptSection
                  title="Weakest concepts"
                  titleColor="var(--d1-peach)"
                  barColor="var(--accent-rose)"
                  valueColor="var(--accent-rose)"
                  items={conceptReport.gapConcepts.slice(0, 10).map((c) => ({
                    key: c.concept,
                    primary: c.concept,
                    secondary: `${c.correct}/${c.attempted} correct · ${c.relatedSkills.length} skill${c.relatedSkills.length !== 1 ? 's' : ''}${c.trend !== 'insufficient' ? ` · ${c.trend}` : ''}`,
                    accuracy: c.accuracy,
                  }))}
                />
              )}

              {conceptReport.strengthConcepts.length > 0 && (
                <ConceptSection
                  title="Strongest concepts"
                  titleColor="var(--d2-mint)"
                  barColor="var(--d2-mint)"
                  valueColor="var(--d2-mint)"
                  items={conceptReport.strengthConcepts.slice(0, 5).map((c) => ({
                    key: c.concept,
                    primary: c.concept,
                    secondary: `${c.correct}/${c.attempted} correct · ${c.relatedSkills.length} skill${c.relatedSkills.length !== 1 ? 's' : ''}`,
                    accuracy: c.accuracy,
                  }))}
                />
              )}

              <p className="text-[11px] text-slate-500 pt-2 border-t border-white/5">
                {conceptReport.summary.totalConceptsTested} tested · {conceptReport.summary.totalGaps} gap
                {conceptReport.summary.totalGaps !== 1 ? 's' : ''} · {conceptReport.summary.totalStrengths} strength
                {conceptReport.summary.totalStrengths !== 1 ? 's' : ''} · {conceptReport.summary.totalCrossSkillGaps}{' '}
                cross-skill gap{conceptReport.summary.totalCrossSkillGaps !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Advanced statistics ─────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,22,40,0.55)', border: '1px solid rgba(226,232,240,0.08)' }}
      >
        <button
          onClick={() => setAdvancedExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4" style={{ color: 'var(--d1-peach)' }} />
            <p className="text-[15px] font-semibold text-white">Advanced statistics</p>
          </div>
          {advancedExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {advancedExpanded && (
          <div className="space-y-5 border-t border-white/6 px-5 py-5">
            {timeStats.avgOverall === null ? (
              <p className="text-[12.5px] italic text-slate-500">No timing data recorded yet.</p>
            ) : (
              <>
                <div>
                  <p className="eyebrow mb-1.5">Avg time per question</p>
                  <div className="flex items-baseline gap-2">
                    <span className="tabular-nums text-[26px] font-semibold" style={{ color: 'var(--d1-peach)' }}>
                      {formatTime(timeStats.avgOverall)}
                    </span>
                    <span className="text-[12px] text-slate-400">per question overall</span>
                  </div>
                </div>

                {Object.keys(timeStats.byDomain).length > 0 && (
                  <div>
                    <p className="eyebrow mb-2.5">Avg time by domain — longer = harder</p>
                    <div className="space-y-2">
                      {progress.domains
                        .filter((d) => timeStats.byDomain[d.domainId])
                        .sort((a, b) => (timeStats.byDomain[b.domainId]?.avg ?? 0) - (timeStats.byDomain[a.domainId]?.avg ?? 0))
                        .map((d, idx) => {
                          const stat = timeStats.byDomain[d.domainId];
                          const isMax = idx === 0;
                          const color = DOMAIN_COLOR[d.domainId] ?? 'var(--d1-peach)';
                          return (
                            <div key={d.domainId} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                                />
                                <p className="truncate text-[12.5px] text-slate-300">{d.domainName}</p>
                                {isMax && (
                                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--d1-peach)' }}>
                                    most time
                                  </span>
                                )}
                              </div>
                              <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-white">
                                {formatTime(stat.avg)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {timeStats.topSlowQuestions.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2.5">Top 5 most time-consuming questions</p>
                    <div className="space-y-1.5">
                      {timeStats.topSlowQuestions.map((q, i) => (
                        <div key={q.questionId} className="flex items-center justify-between gap-3">
                          <p className="flex-1 truncate font-mono text-[12px] text-slate-500">
                            {i + 1}. {q.questionId}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--d1-peach)' }}>
                              {formatTime(q.avgSeconds)}
                            </span>
                            <span className="text-[10px] text-slate-500">×{q.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {rawPct !== null && (
              <div>
                <p className="eyebrow mb-1.5">Confidence-adjusted accuracy</p>
                <p className="mb-2.5 text-[11.5px] text-slate-400 leading-snug">
                  High-confidence wrong answers get penalized. A gap between raw and adjusted suggests misconceptions.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12.5px] text-slate-400">Raw accuracy</p>
                    <span className="text-[12.5px] font-semibold tabular-nums text-white">{rawPct}%</span>
                  </div>
                  {weightedPct !== null && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] text-slate-400">
                        Confidence-weighted
                        <span className="ml-1.5 text-[10px] text-slate-500">(Sure×1.2, Guess×0.8, Sure+wrong×0.5)</span>
                      </p>
                      <span
                        className="text-[12.5px] font-semibold tabular-nums"
                        style={{
                          color:
                            confidenceDeltaPct !== null && confidenceDeltaPct > 0
                              ? 'var(--d2-mint)'
                              : confidenceDeltaPct !== null && confidenceDeltaPct < 0
                                ? 'var(--accent-rose)'
                                : 'white',
                        }}
                      >
                        {weightedPct}%
                        {confidenceDeltaPct !== null && confidenceDeltaPct !== 0 && (
                          <span className="ml-1 text-[10px]">
                            ({confidenceDeltaPct > 0 ? '+' : ''}
                            {confidenceDeltaPct})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {confidenceStats.totalHighWrong > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px]" style={{ color: 'var(--accent-rose)' }}>
                        Misconception flags{' '}
                        <span className="text-[10px] opacity-70">(answered Sure, got wrong)</span>
                      </p>
                      <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--accent-rose)' }}>
                        {confidenceStats.totalHighWrong}
                      </span>
                    </div>
                  )}
                </div>
                {confidenceStats.interpretation === 'possible_overconfidence' && (
                  <p className="mt-2 text-[11.5px] leading-snug text-slate-400 italic">
                    High-confidence wrong answers are pulling your effective score below raw — likely a misconception worth targeting.
                  </p>
                )}
              </div>
            )}

            {topErrors.length > 0 || (userProfile.errorPatterns ?? []).length > 0 ? (
              <div>
                <p className="eyebrow mb-2.5">Repeated incorrect answers</p>
                {topErrors.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {topErrors.map(([distractor, count]) => (
                      <div key={distractor} className="flex items-center justify-between gap-3">
                        <p className="flex-1 truncate text-[12px] text-slate-400">{distractor}</p>
                        <span
                          className="shrink-0 text-[12px] font-semibold tabular-nums"
                          style={{ color: 'var(--accent-rose)' }}
                        >
                          ×{count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {(userProfile.errorPatterns ?? []).length > 0 && (
                  <div className="space-y-1">
                    {(userProfile.errorPatterns ?? []).slice(0, 5).map((pattern, i) => (
                      <p key={i} className="text-[11.5px] leading-relaxed text-slate-400">
                        • {pattern}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="eyebrow mb-1.5">Repeated incorrect answers</p>
                <p className="text-[11.5px] italic leading-relaxed text-slate-500">
                  No repeated incorrect patterns yet — this fills in once the same concepts are missed more than once.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Concept section sub-component ──────────────────────────────────────────

function ConceptSection({
  title,
  titleColor,
  subtitle,
  barColor,
  valueColor,
  items,
}: {
  title: string;
  titleColor: string;
  subtitle?: string;
  barColor: string;
  valueColor: string;
  items: Array<{ key: string; primary: string; secondary: string; accuracy: number }>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: titleColor }}>
        {title}
      </p>
      {subtitle && <p className="mb-2 text-[11px] text-slate-500 leading-snug">{subtitle}</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-200 truncate">{item.primary}</p>
              <p className="text-[11px] text-slate-500 truncate">{item.secondary}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(226,232,240,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(item.accuracy * 100)}%`, background: barColor }}
                />
              </div>
              <span className="text-[12.5px] font-semibold tabular-nums w-10 text-right" style={{ color: valueColor }}>
                {Math.round(item.accuracy * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Legend dot ─────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
