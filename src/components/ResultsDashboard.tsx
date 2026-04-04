// src/components/ResultsDashboard.tsx
// Progress page — pure analytics. No practice entry points.

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react';
import type { Skill } from '../types/content';
import type { UserProfile } from '../hooks/useProgressTracking';
import type { AnalyzedQuestion } from '../brain/question-analyzer';
import { buildProgressSummary } from '../utils/progressSummaries';
import { TOTAL_SKILLS } from '../utils/skillProficiency';
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

  const demonstratingCount = progress.skills.filter(s => s.colorState === 'green').length;

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
              .filter(s => s.attempted > 0)
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .map(skill => {
                const pct = skill.score !== null ? Math.round(skill.score * 100) : 0;
                const bg = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400';
                return (
                  <div
                    key={skill.skillId}
                    className={`h-8 rounded ${bg} flex items-center justify-center text-[8px] font-bold text-white cursor-default`}
                    title={`${skill.fullLabel}: ${pct}%`}
                  >
                    {pct}
                  </div>
                );
              })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px]">
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
      {hasBaseline && growthMetrics && (
        <div className="editorial-surface overflow-hidden">
          <button
            onClick={() => setShowBaseline(prev => !prev)}
            className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-[#fbfaf7]"
          >
            <p className="text-sm font-bold text-slate-800">Growth Since Diagnostic</p>
            {showBaseline
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showBaseline && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-200 px-5 pb-4 pt-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">{growthMetrics.approachingToDemo}</p>
                <p className="text-[11px] text-slate-500 mt-1">Reached Demonstrating</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-center">
                <p className="text-2xl font-extrabold text-amber-600">{growthMetrics.emergedToApproaching}</p>
                <p className="text-[11px] text-slate-500 mt-1">Improved a tier</p>
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
              {conceptReport.summary.totalGaps > 0 && (
                <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                  {conceptReport.summary.totalGaps} gap{conceptReport.summary.totalGaps !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {conceptsExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {conceptsExpanded && (
            <div className="space-y-4 border-t border-slate-200 px-5 pb-4 pt-3">
              {conceptReport.crossSkillGaps.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-600">Cross-skill gaps</p>
                  <div className="space-y-1.5">
                    {conceptReport.crossSkillGaps.slice(0, 8).map(gap => (
                      <div key={gap.concept} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{gap.concept}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Weak in {gap.affectedSkills.length} skills
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
              {conceptReport.gapConcepts.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Weakest concepts</p>
                  <div className="space-y-1.5">
                    {conceptReport.gapConcepts.slice(0, 8).map(c => (
                      <div key={c.concept} className="flex items-center justify-between gap-3">
                        <p className="flex-1 truncate text-sm text-slate-700">{c.concept}</p>
                        <span className="text-sm font-bold tabular-nums text-amber-700">
                          {Math.round(c.accuracy * 100)}%
                        </span>
                      </div>
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
          </div>
          {advancedExpanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {advancedExpanded && (
          <div className="space-y-4 border-t border-slate-200 px-5 pb-4 pt-3">
            {timeStats.avgOverall === null ? (
              <p className="text-sm italic text-slate-500">No timing data recorded yet.</p>
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Avg time per question</p>
                  <span className="tabular-nums text-2xl font-bold text-amber-700">{formatTime(timeStats.avgOverall)}</span>
                </div>
                {Object.keys(timeStats.byDomain).length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">By domain</p>
                    <div className="space-y-1.5">
                      {progress.domains
                        .filter(d => timeStats.byDomain[d.domainId])
                        .sort((a, b) => (timeStats.byDomain[b.domainId]?.avg ?? 0) - (timeStats.byDomain[a.domainId]?.avg ?? 0))
                        .map(d => (
                          <div key={d.domainId} className="flex items-center justify-between gap-3">
                            <p className="flex-1 truncate text-sm text-slate-600">{d.domainName}</p>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-slate-700">
                              {formatTime(timeStats.byDomain[d.domainId].avg)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {rawPct !== null && weightedPct !== null && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confidence-adjusted accuracy</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">Raw</p>
                  <span className="text-sm font-bold tabular-nums text-slate-700">{rawPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="text-sm text-slate-600">Weighted</p>
                  <span className={`text-sm font-bold tabular-nums ${
                    confidenceDeltaPct !== null && confidenceDeltaPct > 0 ? 'text-emerald-600' :
                    confidenceDeltaPct !== null && confidenceDeltaPct < 0 ? 'text-rose-500' : 'text-slate-700'
                  }`}>
                    {weightedPct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
