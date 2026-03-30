/**
 * Diagnostic output contract types.
 *
 * This file defines the shape of the unified DiagnosticSummary — the single
 * surface all reporting components should consume.
 *
 * buildDiagnosticSummary() lives in src/utils/diagnosticSelectors.ts.
 * It is called in App.tsx after assessment completion and passed to ScoreReport.
 */

import type { ReadinessTone, DomainReportSummary, ReportSkillSummary, FoundationalGapSummary } from '../utils/assessmentReport';
import type { ConceptPerformance, CrossSkillGap, ConceptAnalyticsReport } from '../utils/conceptAnalytics';

// ─── Re-exported for consumers who only need this file ───────────────────────

export type { ReadinessTone };

// ─── Types ───────────────────────────────────────────────────────────────────

/** A concept that was missed (wrong answer on a question tagged with this concept). */
export interface MissedConceptSummary {
  concept: string;    // vocab term from question.keyConcepts
  skillId: string;
  skillName: string;
  count: number;      // times this concept appeared on an incorrectly-answered question
}

/**
 * The unified diagnostic output contract.
 *
 * Aggregates all signal produced during an assessment session:
 * scoring, readiness, domain/skill summaries, concept gaps,
 * confidence calibration, and timing.
 *
 * Produced by buildDiagnosticSummary() in src/utils/diagnosticSelectors.ts
 * from AssessmentReportModel + UserProfile + optional ConceptAnalyticsReport.
 */
export interface DiagnosticSummary {
  // ── Core scores ───────────────────────────────────────────────────────────
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  overallScore: number;

  // ── Readiness verdict ─────────────────────────────────────────────────────
  readiness: {
    label: string;
    tone: ReadinessTone;
    description: string;
    nextAction: string;
  };

  // ── Domain / skill breakdowns ─────────────────────────────────────────────
  domainSummaries: DomainReportSummary[];
  highestNeedDomains: DomainReportSummary[];
  strongestDomains: DomainReportSummary[];
  strengths: ReportSkillSummary[];
  weaknesses: ReportSkillSummary[];

  // ── Concept-level signal ──────────────────────────────────────────────────
  /** Concepts from question.keyConcepts that appeared on wrong answers. */
  missedConcepts: MissedConceptSummary[];
  foundationalGaps: FoundationalGapSummary[];
  /** Concept-level performance from conceptAnalytics (null when not computed). */
  conceptGaps: ConceptPerformance[] | null;
  /** Concepts weak across 2+ skills (vocabulary gap indicator). Null when not computed. */
  crossSkillConceptGaps: CrossSkillGap[] | null;
  /** Summary totals from ConceptAnalyticsReport. Null when not computed. */
  conceptSummary: ConceptAnalyticsReport['summary'] | null;

  // ── Confidence calibration ────────────────────────────────────────────────
  confidence: {
    totalHighWrong: number;
    rawAccuracy: number | null;
    weightedAccuracy: number | null;
    /** weightedAccuracy - rawAccuracy: positive = overconfident, negative = underconfident */
    delta: number | null;
    /** Interpretation of confidence calibration: possible_overconfidence if delta < -0.10, well_calibrated if >= -0.10, insufficient_data if null */
    interpretation: 'possible_overconfidence' | 'well_calibrated' | 'insufficient_data';
  };

  // ── Timing ────────────────────────────────────────────────────────────────
  timing: {
    avgSecondsOverall: number | null;
    avgSecondsByDomain: Record<number, { avg: number; count: number }>;
    topSlowQuestions: Array<{ questionId: string; avgSeconds: number; count: number }>;
    /** Unfiltered mean across all responses (null if none). */
    avgSecondsPerResponse: number | null;
    /** Shadow mode metrics for confidence-timing rules (rapid guesses, fluency signals, etc.) */
    shadowMetrics?: {
      rapidGuessCount: number;
    };
  };
}

// buildDiagnosticSummary() — see src/utils/diagnosticSelectors.ts.
