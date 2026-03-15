// `diagnostic` remains in these unions only for archived response/session compatibility.
export type ResponseAssessmentType = 'screener' | 'diagnostic' | 'full' | 'practice';

export type AssessmentReportType = 'screener' | 'diagnostic' | 'full';

export type SessionMode = 'screener' | 'diagnostic' | 'full' | 'practice';

// `quick-diagnostic` is kept only so older stored sessions can still be interpreted safely.
export type SessionAssessmentFlow = 'screener' | 'quick-diagnostic' | 'full';
