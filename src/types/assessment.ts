// src/types/assessment.ts
// Union types for assessment modes, session flows, and report formats.
// `diagnostic` and `quick-diagnostic` values are kept solely for backward-
// compatibility with pre-existing response rows; new code should not emit them.

// `diagnostic` remains in these unions only for archived response/session compatibility.
export type ResponseAssessmentType = 'screener' | 'diagnostic' | 'full' | 'adaptive' | 'practice' | 'retake';

export type AssessmentReportType = 'screener' | 'diagnostic' | 'full' | 'adaptive';

export type SessionMode =
  | 'screener'
  | 'diagnostic'
  | 'full'
  | 'adaptive'
  | 'practice'
  /** Legacy DB rows only; new code should persist `'adaptive'`. */
  | 'adaptive_diagnostic';

// `quick-diagnostic` is kept only so older stored sessions can still be interpreted safely.
export type SessionAssessmentFlow = 'screener' | 'quick-diagnostic' | 'full' | 'adaptive-diagnostic';
