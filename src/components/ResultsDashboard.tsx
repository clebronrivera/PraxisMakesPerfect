// src/components/ResultsDashboard.tsx
// Progress page — pure analytics. No practice entry points.

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  Hourglass,
  Lightbulb,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { buildProgressSummary } from '../utils/progressSummaries';
import { TOTAL_SKILLS } from '../utils/skillProficiency';
import { buildConceptAnalytics, type ConceptAnalyticsReport } from '../utils/conceptAnalytics';
import { computeTimeStats, computeConfidenceStats } from '../utils/diagnosticSelectors';
import { SkillProgressBar } from './SkillProgressBar';

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

// computeTimeStats is imported from diagnosticSelectors — do not redeclare.

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsDashboard({
  userProfile,
  skills,
  fullAssessmentUnlocked,
  hasScreenerReport: _hasScreenerReport,
  onViewScreenerReport: _onViewScreenerReport,
  analyzedQuestions,
}: ResultsDashboardProps) {
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


  // ── Helpers for domain cards ─────────────────────────────────────────────────
  const DOMAIN_SHORT_NAMES: Record<number, string> = {
    1: 'D1 Professional',
    2: 'D2 Student-Level',
    3: 'D3 Systems-Level',
    4: 'D4 Foundations',
  };

  // ── Format total study time ────────────────────────────────────────────────
  const totalStudySeconds = timeStats.avgOverall !== null
    ? Math.round(timeStats.avgOverall * totalAttempts)
    : 0;
  const studyHours = Math.floor(totalStudySeconds / 3600);
  const studyMins = Math.round((totalStudySeconds % 3600) / 60);
  const totalStudyFormatted = studyHours > 0 ? `${studyHours}h ${studyMins}m` : `${studyMins}m`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Progress Dashboard</h2>
        <p className="text-sm text-slate-500">
          Your performance across all {progress.domains.length} domains and {TOTAL_SKILLS} skills.
        </p>
      </div>

      {/* ── Domain Cards (4-grid) ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {progress.domains.map(domain => {
          const pct = domain.activeSkillCount > 0
            ? Math.round((domain.strongerSkillCount / domain.activeSkillCount) * 100)
            : 0;
          const barColor = pct >= 80 ? 'rgb(16,185,129)' : pct >= 60 ? 'rgb(245,158,11)' : 'rgb(244,63,94)';
          const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-500';
          const examWeight = EXAM_WEIGHTS[domain.domainId] ?? 0;
          const shortName = DOMAIN_SHORT_NAMES[domain.domainId] ?? domain.domainName;

          return (
            <div key={domain.domainId} className="editorial-surface p-4 text-center">
              <p className="editorial-overline mb-2">{shortName}</p>
              <div className={`text-3xl font-black ${textColor} mb-1`}>{pct}%</div>
              <div className="h-2 rounded-full bg-[#ece8df] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {domain.strongerSkillCount}/{domain.activeSkillCount} skills · {examWeight}% of exam
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Skill Proficiency Map ───────────────────────────────────────────── */}
      {fullAssessmentUnlocked && (
        <div className="editorial-surface p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Skill Proficiency Map</p>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
            {progress.skills
              .slice()
              .sort((a, b) => {
                // Unattempted skills go to the end
                if (a.attempted === 0 && b.attempted > 0) return 1;
                if (b.attempted === 0 && a.attempted > 0) return -1;
                // Both attempted: sort by score descending
                return (b.score ?? 0) - (a.score ?? 0);
              })
              .map(skill => {
                const isAttempted = skill.attempted > 0;
                const pct = skill.score !== null ? Math.round(skill.score * 100) : 0;
                const colorClass = !isAttempted
                  ? 'bg-slate-200'
                  : pct >= 80
                  ? 'bg-emerald-400'
                  : pct >= 60
                  ? 'bg-amber-400'
                  : 'bg-rose-400';
                const tooltipScore = isAttempted ? `${pct}%` : 'Not started';
                const tooltipStatus = isAttempted ? skill.statusLabel : 'Not started';
                return (
                  <div key={skill.skillId} className="group relative">
                    {/* Colored square */}
                    <div
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded cursor-default transition-transform group-hover:scale-110 ${colorClass} ${isAttempted ? 'flex items-center justify-center' : ''}`}
                    >
                      {isAttempted && (
                        <span className="text-[8px] font-bold text-white">{pct}</span>
                      )}
                    </div>
                    {/* Hover tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 w-44 rounded-lg bg-slate-800 px-2.5 py-1.5 text-left opacity-0 shadow-lg group-hover:opacity-100 transition-opacity duration-150">
                      <p className="text-[11px] font-semibold text-white leading-tight">{skill.shortLabel}</p>
                      <p className="mt-0.5 text-[10px] text-slate-300">{skill.domainName}</p>
                      <p className="text-[10px] text-slate-300">{tooltipScore} · {tooltipStatus}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-400" />
              Demonstrating (≥80%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-400" />
              Approaching (60-79%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-400" />
              Emerging (&lt;60%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200" />
              Not started
            </span>
          </div>
        </div>
      )}

      {/* ── Session Stats ───────────────────────────────────────────────────── */}
      <div className="editorial-surface p-5">
        <p className="text-sm font-bold text-slate-800 mb-4">Session Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-slate-900">
              {(userProfile.totalQuestionsSeen ?? totalAttempts).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">Total Questions</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
            </div>
            <div className="text-xs text-slate-400">Overall Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalStudyFormatted}</div>
            <div className="text-xs text-slate-400">Total Study Time</div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {timeStats.avgOverall !== null ? formatTime(timeStats.avgOverall) : '—'}
            </div>
            <div className="text-xs text-slate-400">Avg per Question</div>
          </div>
        </div>
      </div>

      {/* ── Growth since baseline (collapsible) ──────────────────────────────── */}
      {/* Two-tone bars per docs/WORKFLOW_GROUNDING.md section 3.10:               */}
      {/*   indigo-900 baseline + indigo-500 growth, rose-500/70 for regression.   */}
      {hasBaseline && baselineProgress && growthMetrics && (
        <div className="editorial-surface overflow-hidden">
          <button
            onClick={() => setShowBaseline(prev => !prev)}
            className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-[#fbfaf7]"
          >
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-slate-800">Growth Since Diagnostic</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {growthMetrics.approachingToDemo} reached Demonstrating
              </span>
              {growthMetrics.emergedToApproaching > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  +{growthMetrics.emergedToApproaching} tier
                </span>
              )}
            </div>
            {showBaseline
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showBaseline && (
            <div className="space-y-5 border-t border-slate-200 px-5 pb-5 pt-4">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-900" />
                  At diagnostic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  Growth since
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500/70" />
                  Regression
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-0.5 bg-amber-500/70" />
                  70% goal
                </span>
              </div>

              {/* Per-domain two-tone bars */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">By domain</p>
                {progress.domains.map(domain => {
                  const baseDomain = baselineProgress.domains.find(d => d.domainId === domain.domainId);
                  const currentPct = domain.activeSkillCount > 0
                    ? domain.strongerSkillCount / domain.activeSkillCount
                    : 0;
                  const baselinePct = baseDomain && baseDomain.activeSkillCount > 0
                    ? baseDomain.strongerSkillCount / baseDomain.activeSkillCount
                    : null;
                  return (
                    <SkillProgressBar
                      key={domain.domainId}
                      label={DOMAIN_SHORT_NAMES[domain.domainId] ?? domain.domainName}
                      current={currentPct}
                      baseline={baselinePct}
                      target={0.7}
                      size="md"
                    />
                  );
                })}
              </div>

              {/* Per-skill two-tone bars (only skills with attempts) */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  By skill ({progress.skills.filter(s => s.attempted > 0).length} active)
                </p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {progress.skills
                    .filter(s => s.attempted > 0)
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .map(skill => {
                      const baseSkill = baselineProgress.skills.find(s => s.skillId === skill.skillId);
                      const baselineFraction = baseSkill && baseSkill.score !== null ? baseSkill.score : null;
                      const currentFraction = skill.score ?? 0;
                      return (
                        <SkillProgressBar
                          key={skill.skillId}
                          label={
                            <span className="text-[11px]">
                              {skill.skillId} {skill.fullLabel}
                            </span>
                          }
                          current={currentFraction}
                          baseline={baselineFraction}
                          size="sm"
                          sublabel={baselineFraction === null ? 'No baseline (not in diagnostic)' : undefined}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Concept insights (collapsible) ───────────────────────────────────── */}
      {conceptReport && conceptReport.concepts.length > 0 && (
        <div className="editorial-surface overflow-hidden">
          <button
            onClick={() => setConceptsExpanded(prev => !prev)}
            className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-[#fbfaf7]"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-cyan-600" />
              <p className="text-sm font-bold text-slate-800">Concept Insights</p>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                {conceptReport.summary.totalConceptsTested} tested
              </span>
              {conceptReport.summary.totalGaps > 0 && (
                <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                  {conceptReport.summary.totalGaps} gap{conceptReport.summary.totalGaps !== 1 ? 's' : ''}
                </span>
              )}
              {conceptReport.summary.totalStrengths > 0 && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                  {conceptReport.summary.totalStrengths} strong
                </span>
              )}
            </div>
            {conceptsExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {conceptsExpanded && (
            <div className="space-y-5 border-t border-slate-200 px-5 pb-5 pt-4">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Concepts</p>
                  <p className="text-lg font-black tabular-nums text-slate-800">
                    {conceptReport.summary.totalConceptsTested}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-600">Gaps</p>
                  <p className="text-lg font-black tabular-nums text-rose-700">
                    {conceptReport.summary.totalGaps}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">Cross-skill</p>
                  <p className="text-lg font-black tabular-nums text-amber-700">
                    {conceptReport.summary.totalCrossSkillGaps}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Strong</p>
                  <p className="text-lg font-black tabular-nums text-emerald-700">
                    {conceptReport.summary.totalStrengths}
                  </p>
                </div>
              </div>

              {/* Overall concept accuracy bar */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Overall concept accuracy
                  </p>
                  <span className="text-sm font-bold tabular-nums text-slate-700">
                    {Math.round(conceptReport.summary.overallConceptAccuracy * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#ece8df] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      conceptReport.summary.overallConceptAccuracy >= 0.8 ? 'bg-emerald-500'
                      : conceptReport.summary.overallConceptAccuracy >= 0.6 ? 'bg-amber-500'
                      : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.round(conceptReport.summary.overallConceptAccuracy * 100)}%` }}
                  />
                </div>
              </div>

              {/* Empty-state when there are no surfaced gaps or strengths yet */}
              {conceptReport.crossSkillGaps.length === 0 &&
                conceptReport.gapConcepts.length === 0 &&
                conceptReport.strengthConcepts.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-[#fbfaf7] px-4 py-5 text-center">
                  <Lightbulb className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Not enough signal yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Concepts need at least 3 attempts before we surface a strength or gap.
                    Practice more questions to unlock insights here.
                  </p>
                </div>
              )}

              {/* Cross-skill gaps */}
              {conceptReport.crossSkillGaps.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                      Cross-skill gaps
                    </p>
                    <span className="text-[10px] text-slate-400">— concept is weak across multiple skills</span>
                  </div>
                  <div className="space-y-2.5">
                    {conceptReport.crossSkillGaps.slice(0, 6).map(gap => {
                      const pct = Math.round(gap.accuracy * 100);
                      return (
                        <div key={gap.concept}>
                          <div className="flex items-baseline justify-between gap-3 mb-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{gap.concept}</p>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-rose-600">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#ece8df] overflow-hidden">
                            <div
                              className="h-full bg-rose-500/80 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {gap.attempted} attempts · weak in {gap.affectedSkills.length} skill{gap.affectedSkills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weakest concepts (gap concepts not already in cross-skill gaps) */}
              {conceptReport.gapConcepts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5 text-amber-700" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      Weakest concepts
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {conceptReport.gapConcepts.slice(0, 6).map(c => {
                      const pct = Math.round(c.accuracy * 100);
                      const TrendIcon = c.trend === 'improving' ? TrendingUp
                        : c.trend === 'declining' ? TrendingDown
                        : c.trend === 'stable' ? Minus
                        : null;
                      const trendColor = c.trend === 'improving' ? 'text-emerald-600'
                        : c.trend === 'declining' ? 'text-rose-500'
                        : 'text-slate-400';
                      const highWrong = c.confidenceBreakdown.high.total - c.confidenceBreakdown.high.correct;
                      return (
                        <div key={c.concept}>
                          <div className="flex items-baseline justify-between gap-3 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{c.concept}</p>
                              {TrendIcon && (
                                <TrendIcon className={`h-3 w-3 shrink-0 ${trendColor}`} />
                              )}
                              {highWrong > 0 && (
                                <span
                                  title={`${highWrong} high-confidence wrong — possible misconception`}
                                  className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-rose-600"
                                >
                                  ⚠ {highWrong}
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-amber-700">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#ece8df] overflow-hidden">
                            <div
                              className="h-full bg-amber-500/80 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {c.correct}/{c.attempted} correct
                            {c.avgTimeSeconds !== null && ` · ${formatTime(c.avgTimeSeconds)} avg`}
                            {' · '}
                            {c.relatedSkills.length} related skill{c.relatedSkills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Strength concepts */}
              {conceptReport.strengthConcepts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Strongest concepts
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {conceptReport.strengthConcepts.slice(0, 12).map(c => (
                      <span
                        key={c.concept}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                        title={`${c.correct}/${c.attempted} correct`}
                      >
                        {c.concept}
                        <span className="font-bold tabular-nums">{Math.round(c.accuracy * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Advanced statistics (collapsible) ────────────────────────────────── */}
      <div className="editorial-surface overflow-hidden">
        <button
          onClick={() => setAdvancedExpanded(prev => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-[#fbfaf7]"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <p className="text-sm font-bold text-slate-800">Advanced Statistics</p>
            {timeStats.avgOverall !== null && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                {formatTime(timeStats.avgOverall)} / Q
              </span>
            )}
            {confidenceStats.interpretation === 'possible_overconfidence' && (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                Overconfidence
              </span>
            )}
          </div>
          {advancedExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {advancedExpanded && (
          <div className="space-y-5 border-t border-slate-200 px-5 pb-5 pt-4">
            {timeStats.avgOverall === null && rawPct === null ? (
              <p className="text-sm italic text-slate-500">No timing or confidence data recorded yet.</p>
            ) : (
              <>
                {/* Top stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] px-3 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      <Hourglass className="h-3 w-3" /> Avg / Q
                    </div>
                    <p className="text-lg font-black tabular-nums text-amber-700">
                      {timeStats.avgOverall !== null ? formatTime(timeStats.avgOverall) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-[#fbfaf7] px-3 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      <Clock className="h-3 w-3" /> Total time
                    </div>
                    <p className="text-lg font-black tabular-nums text-slate-800">
                      {totalStudyFormatted}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-slate-200 bg-[#fbfaf7] px-3 py-2"
                    title="Answers logged in under 4 seconds — tap-fast guesses"
                  >
                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      <Zap className="h-3 w-3" /> Rapid taps
                    </div>
                    <p className={`text-lg font-black tabular-nums ${
                      (timeStats.shadowMetrics?.rapidGuessCount ?? 0) > 5 ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {timeStats.shadowMetrics?.rapidGuessCount ?? 0}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-slate-200 bg-[#fbfaf7] px-3 py-2"
                    title="High-confidence answers that turned out wrong — possible misconceptions"
                  >
                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      <AlertTriangle className="h-3 w-3" /> Sure-but-wrong
                    </div>
                    <p className={`text-lg font-black tabular-nums ${
                      confidenceStats.totalHighWrong > 3 ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {confidenceStats.totalHighWrong}
                    </p>
                  </div>
                </div>

                {/* Time by domain — short names + relative bar */}
                {Object.keys(timeStats.byDomain).length > 0 && (() => {
                  const maxAvg = Math.max(
                    ...Object.values(timeStats.byDomain).map(d => d.avg),
                  );
                  const domainsWithTime = progress.domains
                    .filter(d => timeStats.byDomain[d.domainId])
                    .sort((a, b) => (timeStats.byDomain[b.domainId]?.avg ?? 0) - (timeStats.byDomain[a.domainId]?.avg ?? 0));
                  return (
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Time by domain
                      </p>
                      <div className="space-y-2">
                        {domainsWithTime.map(d => {
                          const stat = timeStats.byDomain[d.domainId];
                          const widthPct = maxAvg > 0 ? Math.round((stat.avg / maxAvg) * 100) : 0;
                          return (
                            <div key={d.domainId}>
                              <div className="flex items-baseline justify-between gap-3 mb-1">
                                <span className="text-xs font-medium text-slate-700 truncate">
                                  {DOMAIN_SHORT_NAMES[d.domainId] ?? d.domainName}
                                </span>
                                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-700">
                                  {formatTime(stat.avg)}
                                  <span className="ml-1 text-[10px] font-medium text-slate-400">
                                    · {stat.count} Q
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#ece8df] overflow-hidden">
                                <div
                                  className="h-full bg-amber-500/80 transition-all duration-700"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Confidence calibration — visual two-bar comparison */}
                {rawPct !== null && weightedPct !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-slate-500" />
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Confidence calibration
                        </p>
                      </div>
                      {confidenceStats.interpretation !== 'insufficient_data' && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          confidenceStats.interpretation === 'well_calibrated'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-rose-200 bg-rose-50 text-rose-700'
                        }`}>
                          {confidenceStats.interpretation === 'well_calibrated' ? 'Well calibrated' : 'Overconfidence risk'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <span className="text-xs text-slate-600">Raw accuracy</span>
                          <span className="text-xs font-bold tabular-nums text-slate-700">{rawPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#ece8df] overflow-hidden">
                          <div
                            className="h-full bg-slate-500 transition-all duration-700"
                            style={{ width: `${rawPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <span className="text-xs text-slate-600">Confidence-weighted</span>
                          <span className={`text-xs font-bold tabular-nums ${
                            confidenceDeltaPct !== null && confidenceDeltaPct < 0 ? 'text-rose-600'
                            : confidenceDeltaPct !== null && confidenceDeltaPct > 0 ? 'text-emerald-600'
                            : 'text-slate-700'
                          }`}>
                            {weightedPct}%
                            {confidenceDeltaPct !== null && confidenceDeltaPct !== 0 && (
                              <span className="ml-1 text-[10px] font-medium">
                                ({confidenceDeltaPct > 0 ? '+' : ''}{confidenceDeltaPct})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#ece8df] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${
                              confidenceDeltaPct !== null && confidenceDeltaPct < 0 ? 'bg-rose-500/80'
                              : 'bg-indigo-500'
                            }`}
                            style={{ width: `${weightedPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Weighted accuracy double-counts high-confidence answers. A negative delta means
                      sure-but-wrong responses are dragging your effective performance down.
                    </p>
                  </div>
                )}

                {/* Slowest questions */}
                {timeStats.topSlowQuestions.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Slowest questions
                    </p>
                    <div className="space-y-1">
                      {timeStats.topSlowQuestions.slice(0, 5).map(q => (
                        <div key={q.questionId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-mono text-[11px] text-slate-500 truncate">
                            {q.questionId}
                          </span>
                          <span className="shrink-0 tabular-nums text-slate-700">
                            <span className="font-bold text-amber-700">{formatTime(q.avgSeconds)}</span>
                            <span className="ml-1 text-[10px] text-slate-400">· {q.count}×</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
