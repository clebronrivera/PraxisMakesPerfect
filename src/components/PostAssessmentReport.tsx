// src/components/PostAssessmentReport.tsx
// Screen 2 from public/mockup-post-assessment.html — the comparison report
// shown after the user completes the post-assessment retake.
//
// Three-segment bars per domain:
//   1. Baseline at diagnostic   → bg-indigo-900 (dark)
//   2. Growth during practice   → bg-indigo-500/70
//   3. Post-assessment result   → bg-emerald-500/80 (or rose-500 if regressed)
//
// Editorial light theme: warm cream backgrounds, indigo/emerald accents,
// matching the rest of the redesigned app.

import { ArrowLeft } from 'lucide-react';
import { PROGRESS_DOMAINS, PROGRESS_SKILLS } from '../utils/progressTaxonomy';
import { TOTAL_SKILLS } from '../utils/skillProficiency';

// ─── Types ──────────────────────────────────────────────────────────────────

type SnapshotMap = Record<string, { score?: number | null }>;

export interface PostAssessmentReportProps {
  /** skill_scores at the moment the diagnostic completed (frozen). */
  baselineSnapshot: SnapshotMap | null;
  /** skill_scores at the moment the post-assessment completed (frozen). */
  postAssessmentSnapshot: SnapshotMap | null;
  /** Current live skill_scores (used as the practice-period midpoint). */
  currentSkillScores: SnapshotMap;
  /** ISO date when the diagnostic was completed. Used in the header subtitle. */
  diagnosticCompletedAt: string | null;
  /** ISO date when the post-assessment was completed. Used in the header subtitle. */
  postAssessmentCompletedAt: string | null;
  /** Navigate back to the dashboard. */
  onBack: () => void;
  /** Navigate to the full Progress tab. */
  onViewProgress: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const READINESS_TARGET_PCT = 0.7;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const daysBetween = (start: string | null, end: string | null): number | null => {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(ms) || ms < 0) return null;
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

interface DomainComparison {
  domainId: number;
  domainName: string;
  baselinePct: number | null;
  practicePct: number | null;
  postPct: number | null;
}

function computeDomainComparison(
  domainId: number,
  baseline: SnapshotMap | null,
  current: SnapshotMap,
  post: SnapshotMap | null,
  skillIdsForDomain: string[],
): DomainComparison {
  const avg = (snapshot: SnapshotMap | null): number | null => {
    if (!snapshot) return null;
    const scores = skillIdsForDomain
      .map(sid => snapshot[sid]?.score)
      .filter((s): s is number => typeof s === 'number');
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const domain = PROGRESS_DOMAINS.find(d => d.id === domainId);
  return {
    domainId,
    domainName: domain?.name ?? `Domain ${domainId}`,
    baselinePct: avg(baseline),
    practicePct: avg(current),
    postPct: avg(post),
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PostAssessmentReport({
  baselineSnapshot,
  postAssessmentSnapshot,
  currentSkillScores,
  diagnosticCompletedAt,
  postAssessmentCompletedAt,
  onBack,
  onViewProgress,
}: PostAssessmentReportProps) {
  // Build per-domain skill ID lookup from the flat PROGRESS_SKILLS array.
  const skillIdsByDomain: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const skill of PROGRESS_SKILLS) {
    skillIdsByDomain[skill.domainId].push(skill.skillId);
  }

  const comparisons = PROGRESS_DOMAINS.map(d =>
    computeDomainComparison(
      d.id,
      baselineSnapshot,
      currentSkillScores,
      postAssessmentSnapshot,
      skillIdsByDomain[d.id] ?? [],
    ),
  );

  // Top-level stats
  const baselineDemonstrating = baselineSnapshot
    ? Object.values(baselineSnapshot).filter(s => (s.score ?? 0) >= 0.8).length
    : 0;
  const postDemonstrating = postAssessmentSnapshot
    ? Object.values(postAssessmentSnapshot).filter(s => (s.score ?? 0) >= 0.8).length
    : 0;

  const skillsImproved = baselineSnapshot && postAssessmentSnapshot
    ? Object.entries(postAssessmentSnapshot).filter(([sid, s]) => {
        const base = baselineSnapshot[sid]?.score ?? 0;
        return (s.score ?? 0) > base + 0.005;
      }).length
    : 0;

  const skillsRegressed = baselineSnapshot && postAssessmentSnapshot
    ? Object.entries(postAssessmentSnapshot).filter(([sid, s]) => {
        const base = baselineSnapshot[sid]?.score ?? 0;
        return (s.score ?? 0) < base - 0.005;
      }).length
    : 0;

  const days = daysBetween(diagnosticCompletedAt, postAssessmentCompletedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Report header */}
      <div className="editorial-surface px-6 py-5 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Growth Report</h2>
        <p className="text-sm text-slate-500">
          Diagnostic completed {formatDate(diagnosticCompletedAt)}
          {' → '}
          Post-Assessment completed {formatDate(postAssessmentCompletedAt)}
          {days !== null && ` · ${days} day${days !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Top-level stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
          <p className="text-3xl font-extrabold text-emerald-700">+{skillsImproved}</p>
          <p className="text-xs text-slate-600 mt-1">Skills improved</p>
          <p className="text-[10px] text-slate-400">across all tiers</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-center">
          <p className="text-3xl font-extrabold text-indigo-700">{postDemonstrating}</p>
          <p className="text-xs text-slate-600 mt-1">Now Demonstrating</p>
          <p className="text-[10px] text-slate-400">was {baselineDemonstrating} at diagnostic</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-3xl font-extrabold text-slate-700">{skillsRegressed}</p>
          <p className="text-xs text-slate-600 mt-1">Regressed</p>
          <p className="text-[10px] text-slate-400">needs attention</p>
        </div>
      </div>

      {/* Legend */}
      <div className="editorial-surface flex flex-wrap items-center gap-5 px-5 py-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-900" />
          At diagnostic ({formatDate(diagnosticCompletedAt)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-500/70" />
          Growth during practice
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500/80" />
          Post-assessment result
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-0.5 bg-amber-500/70" />
          70% goal
        </span>
      </div>

      {/* Domain comparison bars */}
      <div className="editorial-surface px-5 py-5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-4">
          Domain breakdown
        </p>
        <div className="space-y-5">
          {comparisons.map(c => {
            const baseline = c.baselinePct === null ? null : clamp01(c.baselinePct);
            const practice = c.practicePct === null ? null : clamp01(c.practicePct);
            const post = c.postPct === null ? null : clamp01(c.postPct);

            // If no post-assessment data yet, show baseline + practice only.
            const hasPost = post !== null;
            // Regression vs baseline.
            const isRegression = baseline !== null && post !== null && post < baseline;
            // Did practice match the post (typical case where post confirms practice)?
            const practiceLowerBound = baseline ?? 0;
            const practiceUpperBound = practice ?? practiceLowerBound;
            const postUpperBound = post ?? practiceUpperBound;

            // Segment widths (capped to 1.0 total)
            const baselineWidth = baseline ?? 0;
            const practiceWidth = Math.max(0, practiceUpperBound - practiceLowerBound);
            const postWidth = Math.max(0, postUpperBound - practiceUpperBound);

            const postColor = post === null
              ? ''
              : isRegression
              ? 'bg-rose-500/80'
              : post >= 0.8
              ? 'bg-emerald-500/80'
              : post >= 0.6
              ? 'bg-amber-500/80'
              : 'bg-rose-500/80';

            const postLabelColor = post === null
              ? 'text-slate-400'
              : isRegression
              ? 'text-rose-700'
              : post >= 0.8
              ? 'text-emerald-700'
              : post >= 0.6
              ? 'text-amber-700'
              : 'text-rose-700';

            return (
              <div key={c.domainId}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 text-xs mb-1.5">
                  <span className="font-medium text-slate-800">{c.domainName}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-slate-400">
                      Diagnostic: {baseline === null ? '—' : `${Math.round(baseline * 100)}%`}
                    </span>
                    <span className="text-indigo-700">
                      Practice: {practice === null ? '—' : `${Math.round(practice * 100)}%`}
                    </span>
                    <span className={`font-semibold ${postLabelColor}`}>
                      Post: {post === null ? '—' : `${Math.round(post * 100)}%`}
                    </span>
                  </div>
                </div>

                <div className="relative h-4 rounded-full bg-[#ece8df] overflow-hidden">
                  {isRegression ? (
                    <>
                      {/* Full rose bar at the (lower) post value */}
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-500/80"
                        style={{ width: `${postUpperBound * 100}%` }}
                      />
                      {/* Tick at the original baseline so user sees where they slipped from */}
                      <div
                        className="absolute inset-y-0 w-0.5 bg-indigo-700/70"
                        style={{ left: `calc(${baselineWidth * 100}% - 1px)` }}
                        title={`baseline ${Math.round(baselineWidth * 100)}%`}
                      />
                    </>
                  ) : (
                    <>
                      {/* Baseline */}
                      {baseline !== null && (
                        <div
                          className="absolute inset-y-0 left-0 bg-indigo-900 border-r border-indigo-500/40"
                          style={{ width: `${baselineWidth * 100}%` }}
                        />
                      )}
                      {/* Practice growth */}
                      {practice !== null && practiceWidth > 0 && (
                        <div
                          className="absolute inset-y-0 bg-indigo-500/70"
                          style={{
                            left: `${practiceLowerBound * 100}%`,
                            width: `${practiceWidth * 100}%`,
                          }}
                        />
                      )}
                      {/* Post-assessment confirmed */}
                      {hasPost && postWidth > 0 && (
                        <div
                          className={`absolute inset-y-0 ${postColor}`}
                          style={{
                            left: `${practiceUpperBound * 100}%`,
                            width: `${postWidth * 100}%`,
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* 70% goal marker */}
                <div className="relative h-2 mt-0.5">
                  <div
                    className="absolute top-0 h-2 w-0.5 rounded-full bg-amber-500/70"
                    style={{ left: `calc(${READINESS_TARGET_PCT * 100}% - 1px)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA footer */}
      <div className="editorial-surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-slate-500">
          Full per-skill breakdown for all {TOTAL_SKILLS} skills available in the Progress tab
        </p>
        <button
          onClick={onViewProgress}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          View Progress Tab →
        </button>
      </div>
    </div>
  );
}
