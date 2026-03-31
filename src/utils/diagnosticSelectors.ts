// src/utils/diagnosticSelectors.ts
//
// Pure selector functions that derive display-ready stats from UserProfile.
// Extracted so ResultsDashboard, ScoreReport, and future reporting surfaces
// all call the same computation without duplication.

import type { UserProfile } from '../hooks/useProgressTracking';
import type { AssessmentReportModel } from './assessmentReport';
import type { ConceptAnalyticsReport } from './conceptAnalytics';
import type { DiagnosticSummary } from '../types/diagnosticSummary';
import { getProgressSkillDefinition } from './progressTaxonomy';
import { computeRapidGuessCount } from '../brain/learning-state';

// ─── Time ─────────────────────────────────────────────────────────────────────

export interface TimeStats {
  /** null when no valid timed attempts exist */
  avgOverall: number | null;
  /** Per-domain averages keyed by domainId */
  byDomain: Record<number, { avg: number; count: number }>;
  /** Up to 5 slowest question averages, sorted descending by avgSeconds */
  topSlowQuestions: Array<{ questionId: string; avgSeconds: number; count: number }>;
  /** Shadow mode metrics for confidence-timing rules */
  shadowMetrics?: {
    rapidGuessCount: number; // Attempts with timeSpent in (0, 4) seconds
  };
}

/**
 * Compute aggregate timing stats from all skill attempt histories.
 * Sanity filter: only counts attempts with timeSpent in the range [1, 600] seconds.
 */
export function computeTimeStats(userProfile: UserProfile): TimeStats {
  const domainGroups: Record<number, number[]> = {};
  const questionGroups: Record<string, number[]> = {};
  const allTimes: number[] = [];
  let rapidGuessCount = 0;

  for (const [skillId, perf] of Object.entries(userProfile.skillScores ?? {})) {
    if (!perf.attemptHistory) continue;
    const def = getProgressSkillDefinition(skillId);
    const domainId = def?.domainId ?? 0;

    // Rapid-guess count: use canonical function from learning-state.ts (SHADOW MODE)
    rapidGuessCount += computeRapidGuessCount(perf.attemptHistory);

    for (const attempt of perf.attemptHistory) {
      const t = attempt.timeSpent;
      // Sanity filter: exclude missing, sub-second, and implausibly long times
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

  return {
    avgOverall,
    byDomain,
    topSlowQuestions,
    shadowMetrics: {
      rapidGuessCount,
      // TODO: Rule 4 — Fluency Signal: shadow mode pending per-question timing baseline.
      // Requires >= 20 responses per question to compute stable median. See audit-confidence-timing.md Rule 4.
    },
  };
}

// ─── Confidence ───────────────────────────────────────────────────────────────

export interface ConfidenceStats {
  /** Sum of confidenceFlags across all skills (high-confidence + wrong = misconception signal) */
  totalHighWrong: number;
  /**
   * Unweighted accuracy as a 0–1 ratio.
   * null if no attempts have been recorded.
   */
  rawAccuracy: number | null;
  /**
   * Confidence-weighted accuracy as a 0–1 ratio.
   * null if no skills have stored weightedAccuracy data.
   */
  weightedAccuracy: number | null;
  /**
   * weightedAccuracy − rawAccuracy.
   * A negative value means high-confidence wrong answers are dragging
   * effective performance below raw accuracy (misconception pressure).
   * null if either component is null.
   */
  delta: number | null;
  /**
   * Interpretation: 'possible_overconfidence' if delta < -0.10,
   * 'well_calibrated' if delta >= -0.10, 'insufficient_data' if null.
   */
  interpretation: 'possible_overconfidence' | 'well_calibrated' | 'insufficient_data';
}

/**
 * Aggregate confidence signals across all skills in a UserProfile.
 * Returns 0–1 ratios suitable for direct use in DiagnosticSummary.confidence.
 */
export function computeConfidenceStats(userProfile: UserProfile): ConfidenceStats {
  let rawCorrect = 0;
  let rawAttempts = 0;
  let weightedCorrectSum = 0;
  let weightedTotalSum = 0;
  let highWrong = 0;

  for (const perf of Object.values(userProfile.skillScores ?? {})) {
    rawCorrect += perf.correct ?? 0;
    rawAttempts += perf.attempts ?? 0;
    highWrong += perf.confidenceFlags ?? 0;
    if (perf.weightedAccuracy !== undefined && perf.attempts > 0) {
      // Reconstruct weighted sums from stored weightedAccuracy × attempts
      weightedCorrectSum += perf.weightedAccuracy * perf.attempts;
      weightedTotalSum += perf.attempts;
    }
  }

  const rawAccuracy = rawAttempts > 0 ? rawCorrect / rawAttempts : null;
  const weightedAccuracy = weightedTotalSum > 0 ? weightedCorrectSum / weightedTotalSum : null;
  const delta =
    rawAccuracy !== null && weightedAccuracy !== null
      ? weightedAccuracy - rawAccuracy
      : null;

  const interpretation: 'possible_overconfidence' | 'well_calibrated' | 'insufficient_data' =
    delta !== null && rawAccuracy !== null && weightedAccuracy !== null
      ? delta < -0.10 ? 'possible_overconfidence'
      : 'well_calibrated'
      : 'insufficient_data';

  return { totalHighWrong: highWrong, rawAccuracy, weightedAccuracy, delta, interpretation };
}

// ─── Diagnostic Summary builder ───────────────────────────────────────────────

/**
 * Assemble a unified DiagnosticSummary from the pre-computed report model,
 * the user's profile (for confidence + timing), and an optional concept
 * analytics report.
 *
 * This is a pure mapping function — no DB calls, no side effects.
 * It is intentionally placed here (Step 6) rather than in assessmentReport.ts
 * so it can draw on both the report model and the selector-derived signals
 * without creating a circular dependency.
 */
export function buildDiagnosticSummary(
  report: AssessmentReportModel,
  userProfile: UserProfile,
  conceptAnalytics?: ConceptAnalyticsReport
): DiagnosticSummary {
  // ── Confidence + timing from existing selectors ─────────────────────────────
  const confidence = computeConfidenceStats(userProfile);
  const timeStats = computeTimeStats(userProfile);

  // ── Unfiltered per-response average (no sanity clamp, unlike computeTimeStats) ──
  const allTimesRaw: number[] = [];
  for (const perf of Object.values(userProfile.skillScores ?? {})) {
    if (!perf.attemptHistory) continue;
    for (const attempt of perf.attemptHistory) {
      if (attempt.timeSpent && attempt.timeSpent > 0) {
        allTimesRaw.push(attempt.timeSpent);
      }
    }
  }
  const avgSecondsPerResponse =
    allTimesRaw.length > 0
      ? allTimesRaw.reduce((s, v) => s + v, 0) / allTimesRaw.length
      : null;

  // ── Aggregate missedConcepts across all top-level weaknesses ────────────────
  // Each entry is already keyed to a specific (concept, skillId) pair, so
  // flattening preserves per-skill granularity. Sort most-missed first.
  const missedConcepts = report.weaknesses
    .flatMap(skill => skill.missedConcepts)
    .sort((a, b) => b.count - a.count);

  return {
    // Core scores — pass through from report model
    totalQuestions: report.totalQuestions,
    correctAnswers: report.correctAnswers,
    incorrectAnswers: report.incorrectAnswers,
    overallScore: report.overallScore,

    // Readiness verdict — pass through verbatim
    readiness: report.readiness,

    // Domain / skill breakdowns — pass through verbatim
    domainSummaries: report.domainSummaries,
    highestNeedDomains: report.highestNeedDomains,
    strongestDomains: report.strongestDomains,
    strengths: report.strengths,
    weaknesses: report.weaknesses,

    // Concept-level signal
    missedConcepts,
    foundationalGaps: report.foundationalGaps,
    conceptGaps: conceptAnalytics?.gapConcepts ?? null,
    crossSkillConceptGaps: conceptAnalytics?.crossSkillGaps ?? null,
    conceptSummary: conceptAnalytics?.summary ?? null,

    // Confidence calibration — from selector
    confidence: {
      totalHighWrong: confidence.totalHighWrong,
      rawAccuracy: confidence.rawAccuracy,
      weightedAccuracy: confidence.weightedAccuracy,
      delta: confidence.delta,
      interpretation: confidence.interpretation,
    },

    // Timing — from selector + unfiltered per-response avg
    timing: {
      avgSecondsOverall: timeStats.avgOverall,
      avgSecondsByDomain: timeStats.byDomain,
      topSlowQuestions: timeStats.topSlowQuestions,
      avgSecondsPerResponse,
      shadowMetrics: timeStats.shadowMetrics,
    },
  };
}
