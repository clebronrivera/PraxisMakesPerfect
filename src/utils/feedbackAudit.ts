import type { Question } from '../brain/question-analyzer';
import type { QuestionReport } from '../hooks/useQuestionReports';
import type { BetaFeedback } from '../hooks/useBetaFeedback';
import {
  getQuestionChoices,
  getQuestionCorrectAnswers,
  getQuestionPrompt,
  getQuestionRationale
} from '../brain/question-analyzer';

export interface FeedbackAuditUser {
  id: string;
  lastUpdated?: any;
  flaggedQuestions?: Record<string, string>;
  authMetrics?: {
    email?: string | null;
    displayName?: string | null;
  };
}

export type AuditBucket =
  | 'question content accuracy'
  | 'incorrect key / rationale'
  | 'formatting / rendering'
  | 'duplicate / similarity'
  | 'UX / workflow friction'
  | 'app bug'
  | 'feature request'
  | 'Teach Mode weak-signal flags';

export type VerificationDecision =
  | 'still present'
  | 'likely already resolved'
  | 'cannot verify from current evidence'
  | 'non-actionable / too vague';

export interface AuditRawRecord {
  rawId: string;
  source: 'question_report' | 'beta_feedback' | 'teach_mode_flag';
  questionId?: string | null;
  rawAssessmentTypes: string[];
  displayAssessmentTypes: string[];
  bucket: AuditBucket;
  issueFamily: string;
  severity?: string | null;
  status?: string | null;
  userEmail?: string | null;
  userDisplayName?: string | null;
  featureArea?: string | null;
  page?: string | null;
  targets: string[];
  issueTypes: string[];
  notes: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
  questionSnapshot?: {
    stem?: string;
    choices?: Record<string, string>;
    correct?: string[];
    rationale?: string;
  } | null;
}

export interface ConsolidatedAuditIssue {
  issueId: string;
  sourceTypes: Array<'question_report' | 'beta_feedback' | 'teach_mode_flag'>;
  questionId?: string | null;
  bucket: AuditBucket;
  issueFamily: string;
  rawAssessmentTypes: string[];
  displayAssessmentTypes: string[];
  featureAreas: string[];
  pages: string[];
  reportCount: number;
  uniqueReporterCount: number;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  latestAdminStatus?: string | null;
  highestSeverity?: string | null;
  representativeNotes: string[];
  verificationDecision: VerificationDecision;
  verificationReason: string;
  currentQuestionExists: boolean;
  snapshotChanged: boolean;
  changedFields: string[];
  exactDuplicateStemCount: number;
  corroboratedByTeachModeFlags: boolean;
  corroboratedByQuestionReports: boolean;
  corroboratedByBetaFeedback: boolean;
  rawRecordIds: string[];
}

export interface AuditSummary {
  generatedAt: string;
  auditWindow: {
    firstSeenAt?: string | null;
    lastSeenAt?: string | null;
  };
  sourceCounts: Record<string, number>;
  totalConsolidatedIssues: number;
  verificationCounts: Record<VerificationDecision, number>;
  bucketCounts: Record<AuditBucket, number>;
  topRecurringQuestions: Array<{ questionId: string; count: number }>;
  topThemes: Array<{ bucket: AuditBucket; count: number }>;
  unresolvedHighlights: ConsolidatedAuditIssue[];
  likelyResolvedHighlights: ConsolidatedAuditIssue[];
  instrumentationGaps: string[];
}

export interface FeedbackAuditBundle {
  generatedAt: string;
  auditWindow: {
    firstSeenAt?: string | null;
    lastSeenAt?: string | null;
  };
  rawRecords: AuditRawRecord[];
  consolidatedIssues: ConsolidatedAuditIssue[];
  summary: AuditSummary;
}

interface QuestionSnapshotComparable {
  stem?: string;
  choices?: Record<string, string>;
  options?: { letter: string; text: string }[];
  correct?: string[];
  rationale?: string;
}

interface AuditQuestionContext {
  questionLookup: Map<string, Question>;
  normalizedStemCounts: Map<string, number>;
}

const QUESTIONS_URL = new URL('../data/questions.json', import.meta.url).href;

let auditQuestionContextPromise: Promise<AuditQuestionContext> | null = null;

async function getAuditQuestionContext(): Promise<AuditQuestionContext> {
  if (!auditQuestionContextPromise) {
    auditQuestionContextPromise = fetch(QUESTIONS_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load audit question bank (${response.status})`);
        }
        return response.json() as Promise<Question[]>;
      })
      .then((questions) => {
        const questionLookup = new Map(
          questions.map((question) => [question.UNIQUEID || question.id || 'unknown-question', question])
        );

        const normalizedStemCounts = questions.reduce<Map<string, number>>((acc, question) => {
          const prompt = normalizeText(getQuestionPrompt(question));
          if (!prompt) {
            return acc;
          }
          acc.set(prompt, (acc.get(prompt) || 0) + 1);
          return acc;
        }, new Map());

        return {
          questionLookup,
          normalizedStemCounts
        };
      });
  }

  return auditQuestionContextPromise;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 3,
  major: 2,
  minor: 1
};

function normalizeText(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMessage(value?: string | null): string {
  return normalizeText(value).toLowerCase();
}

function toIsoString(value: any): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function mapAssessmentTypeDisplay(assessmentType?: string | null): string {
  if (assessmentType === 'pre') {
    return 'screener';
  }
  return assessmentType || 'unknown';
}

function coerceSnapshotChoices(snapshot?: QuestionSnapshotComparable | null): Record<string, string> {
  if (!snapshot) {
    return {};
  }
  if (snapshot.choices) {
    return snapshot.choices;
  }
  if (snapshot.options) {
    return Object.fromEntries(snapshot.options.map((option) => [option.letter, option.text]));
  }
  return {};
}

function compareSnapshotToCurrent(
  snapshot?: QuestionSnapshotComparable | null,
  currentQuestion?: Question
): { currentQuestionExists: boolean; snapshotChanged: boolean; changedFields: string[] } {
  if (!currentQuestion) {
    return {
      currentQuestionExists: false,
      snapshotChanged: false,
      changedFields: []
    };
  }

  if (!snapshot) {
    return {
      currentQuestionExists: true,
      snapshotChanged: false,
      changedFields: []
    };
  }

  const changedFields: string[] = [];
  const snapshotStem = normalizeText(snapshot.stem);
  const currentStem = normalizeText(getQuestionPrompt(currentQuestion));
  const snapshotChoices = coerceSnapshotChoices(snapshot);
  const currentChoices = getQuestionChoices(currentQuestion);
  const choiceKeys = new Set([...Object.keys(snapshotChoices), ...Object.keys(currentChoices)]);

  if (snapshotStem && currentStem && snapshotStem !== currentStem) {
    changedFields.push('stem');
  }

  const changedChoiceLetters = [...choiceKeys].filter((letter) => normalizeText(snapshotChoices[letter]) !== normalizeText(currentChoices[letter]));
  if (changedChoiceLetters.length > 0) {
    changedFields.push(`choices:${changedChoiceLetters.join('|')}`);
  }

  const snapshotCorrect = [...(snapshot.correct || [])].sort().join('|');
  const currentCorrect = [...getQuestionCorrectAnswers(currentQuestion)].sort().join('|');
  if (snapshotCorrect && currentCorrect && snapshotCorrect !== currentCorrect) {
    changedFields.push('correct');
  }

  const snapshotRationale = normalizeText(snapshot.rationale);
  const currentRationale = normalizeText(getQuestionRationale(currentQuestion));
  if (snapshotRationale && currentRationale && snapshotRationale !== currentRationale) {
    changedFields.push('rationale');
  }

  return {
    currentQuestionExists: true,
    snapshotChanged: changedFields.length > 0,
    changedFields
  };
}

function inferQuestionReportBucket(report: Pick<QuestionReport, 'targets' | 'issueTypes'>): AuditBucket {
  const values = [...report.targets, ...report.issueTypes].map((value) => value.toLowerCase());

  if (values.some((value) => value.includes('incorrect key') || value.includes('correct answer key') || value.includes('rationale / feedback'))) {
    return 'incorrect key / rationale';
  }
  if (values.some((value) => value.includes('formatting') || value.includes('rendering'))) {
    return 'formatting / rendering';
  }
  if (values.some((value) => value.includes('duplicate') || value.includes('too similar'))) {
    return 'duplicate / similarity';
  }
  return 'question content accuracy';
}

function inferFeedbackBucket(feedback: Pick<BetaFeedback, 'category' | 'contextType' | 'message'>): AuditBucket {
  const message = normalizeMessage(feedback.message);

  if (feedback.category === 'feature-request') {
    return 'feature request';
  }
  if (feedback.category === 'ux') {
    return 'UX / workflow friction';
  }
  if (feedback.category === 'bug') {
    if (message.includes('render') || message.includes('format')) {
      return 'formatting / rendering';
    }
    return 'app bug';
  }
  if (feedback.category === 'content') {
    if (message.includes('incorrect key') || message.includes('wrong answer') || message.includes('rationale')) {
      return 'incorrect key / rationale';
    }
    if (message.includes('duplicate') || message.includes('too similar')) {
      return 'duplicate / similarity';
    }
    if (message.includes('render') || message.includes('format')) {
      return 'formatting / rendering';
    }
    return 'question content accuracy';
  }
  if (feedback.contextType === 'question') {
    return 'question content accuracy';
  }
  if (message.includes('feature')) {
    return 'feature request';
  }
  if (message.includes('bug') || message.includes('broken') || message.includes('error')) {
    return 'app bug';
  }
  if (message.includes('confus') || message.includes('hard') || message.includes('friction')) {
    return 'UX / workflow friction';
  }
  return 'UX / workflow friction';
}

function issueFamilyFromBucket(bucket: AuditBucket): string {
  return bucket;
}

function pickHighestSeverity(severities: Array<string | null | undefined>): string | null {
  const filtered = severities.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) {
    return null;
  }
  return filtered.sort((a, b) => (SEVERITY_RANK[b] || 0) - (SEVERITY_RANK[a] || 0))[0];
}

function pickLatestStatus(records: AuditRawRecord[]): string | null {
  const sorted = [...records].sort((a, b) => (toIsoString(b.updatedAt) || toIsoString(b.createdAt) || '').localeCompare(toIsoString(a.updatedAt) || toIsoString(a.createdAt) || ''));
  return sorted[0]?.status || null;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function exactDuplicateStemCount(
  questionId: string | null | undefined,
  auditQuestionContext: AuditQuestionContext
): number {
  if (!questionId) {
    return 0;
  }
  const question = auditQuestionContext.questionLookup.get(questionId);
  if (!question) {
    return 0;
  }
  return auditQuestionContext.normalizedStemCounts.get(normalizeText(getQuestionPrompt(question))) || 0;
}

function consolidateVerification(
  records: AuditRawRecord[],
  auditQuestionContext: AuditQuestionContext
): {
  verificationDecision: VerificationDecision;
  verificationReason: string;
  currentQuestionExists: boolean;
  snapshotChanged: boolean;
  changedFields: string[];
  exactDuplicateCount: number;
} {
  const questionId = records.find((record) => record.questionId)?.questionId || null;
  const currentQuestion = questionId ? auditQuestionContext.questionLookup.get(questionId) : undefined;
  const firstSnapshot = records.find((record) => record.questionSnapshot)?.questionSnapshot;
  const comparison = compareSnapshotToCurrent(firstSnapshot || undefined, currentQuestion);
  const bucket = records[0]?.bucket;
  const latestStatus = pickLatestStatus(records);
  const notes = uniqueNonEmpty(records.flatMap((record) => record.notes));
  const duplicateCount = exactDuplicateStemCount(questionId, auditQuestionContext);

  if (records.every((record) => record.source === 'teach_mode_flag')) {
    return {
      verificationDecision: 'cannot verify from current evidence',
      verificationReason: 'Teach Mode flags do not enter the moderated queues and do not preserve issue timestamps, so they are treated as weak signals unless corroborated elsewhere.',
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  if (!questionId && records.every((record) => record.source === 'beta_feedback')) {
    if (bucket === 'feature request') {
      return {
        verificationDecision: notes.length === 0 ? 'non-actionable / too vague' : 'cannot verify from current evidence',
        verificationReason: notes.length === 0
          ? 'This feature request lacks enough detail to audit beyond preserving it in the queue.'
          : 'General beta feedback is not reliably linked to question ids or reproducible session context in the current capture flow.',
        currentQuestionExists: false,
        snapshotChanged: false,
        changedFields: [],
        exactDuplicateCount: 0
      };
    }

    return {
      verificationDecision: notes.length === 0 ? 'non-actionable / too vague' : 'cannot verify from current evidence',
      verificationReason: notes.length === 0
        ? 'This feedback is too vague to verify from stored evidence alone.'
        : 'The current beta feedback flow captures message, page, and feature area, but not enough deterministic repro context to confirm the issue from stored evidence alone.',
      currentQuestionExists: false,
      snapshotChanged: false,
      changedFields: [],
      exactDuplicateCount: 0
    };
  }

  if (bucket === 'duplicate / similarity') {
    if (duplicateCount > 1) {
      return {
        verificationDecision: 'still present',
        verificationReason: `The current question bank still contains ${duplicateCount} items with the same normalized stem, so the duplicate/similarity concern remains present.`,
        currentQuestionExists: comparison.currentQuestionExists,
        snapshotChanged: comparison.snapshotChanged,
        changedFields: comparison.changedFields,
        exactDuplicateCount: duplicateCount
      };
    }
    if (comparison.snapshotChanged) {
      return {
        verificationDecision: 'likely already resolved',
        verificationReason: 'The reported snapshot differs from the current question content, so the duplicate/similarity issue likely reflects an older version of the item.',
        currentQuestionExists: comparison.currentQuestionExists,
        snapshotChanged: comparison.snapshotChanged,
        changedFields: comparison.changedFields,
        exactDuplicateCount: duplicateCount
      };
    }
    return {
      verificationDecision: 'cannot verify from current evidence',
      verificationReason: 'No exact duplicate remains in the current bank, but the stored report does not include enough side-by-side comparison evidence to conclusively close the issue.',
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  if (bucket === 'formatting / rendering') {
    if (comparison.snapshotChanged && latestStatus === 'fixed') {
      return {
        verificationDecision: 'likely already resolved',
        verificationReason: 'The item content changed after the report and the latest admin status is fixed, which is the strongest stored signal available for a formatting/rendering issue.',
        currentQuestionExists: comparison.currentQuestionExists,
        snapshotChanged: comparison.snapshotChanged,
        changedFields: comparison.changedFields,
        exactDuplicateCount: duplicateCount
      };
    }
    return {
      verificationDecision: 'cannot verify from current evidence',
      verificationReason: 'Formatting and rendering issues require current UI repro; stored report data alone is not enough to conclusively mark them fixed.',
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  if (!comparison.currentQuestionExists) {
    return {
      verificationDecision: 'cannot verify from current evidence',
      verificationReason: 'The referenced question is not present in the current bundled bank, so the report cannot be verified directly against current content.',
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  if (notes.length === 0 && latestStatus === 'wont-fix') {
    return {
      verificationDecision: 'non-actionable / too vague',
      verificationReason: 'The report has no explanatory notes and was not fixed, so there is not enough evidence to audit it further.',
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  if (comparison.snapshotChanged) {
    return {
      verificationDecision: 'likely already resolved',
      verificationReason: `The current question differs from the stored snapshot in ${comparison.changedFields.join(', ')}, so the reported issue likely targeted an older version of the content.`,
      currentQuestionExists: comparison.currentQuestionExists,
      snapshotChanged: comparison.snapshotChanged,
      changedFields: comparison.changedFields,
      exactDuplicateCount: duplicateCount
    };
  }

  return {
    verificationDecision: 'still present',
    verificationReason: 'The current bundled question content still matches the reported snapshot, so the issue remains present until current UI repro proves otherwise.',
    currentQuestionExists: comparison.currentQuestionExists,
    snapshotChanged: comparison.snapshotChanged,
    changedFields: comparison.changedFields,
    exactDuplicateCount: duplicateCount
  };
}

function buildQuestionReportRecords(reports: Array<QuestionReport & { id: string }>): AuditRawRecord[] {
  return reports.map((report) => {
    const bucket = inferQuestionReportBucket(report);
    const rawAssessmentType = report.assessmentType || 'unknown';
    const snapshotChoices = report.questionSnapshot?.choices || (report.questionSnapshot?.options
      ? Object.fromEntries(report.questionSnapshot.options.map((option) => [option.letter, option.text]))
      : undefined);

    return {
      rawId: report.id,
      source: 'question_report',
      questionId: report.questionId,
      rawAssessmentTypes: [rawAssessmentType],
      displayAssessmentTypes: [mapAssessmentTypeDisplay(rawAssessmentType)],
      bucket,
      issueFamily: issueFamilyFromBucket(bucket),
      severity: report.severity,
      status: report.status,
      userEmail: report.userEmail,
      userDisplayName: report.userDisplayName,
      targets: report.targets || [],
      issueTypes: report.issueTypes || [],
      notes: report.notes ? [report.notes] : [],
      createdAt: toIsoString(report.createdAt),
      updatedAt: null,
      questionSnapshot: report.questionSnapshot ? {
        stem: report.questionSnapshot.stem,
        choices: snapshotChoices,
        correct: report.questionSnapshot.correct,
        rationale: report.questionSnapshot.rationale
      } : null
    };
  });
}

function buildBetaFeedbackRecords(feedback: BetaFeedback[]): AuditRawRecord[] {
  return feedback.map((item) => {
    const bucket = inferFeedbackBucket(item);
    return {
      rawId: item.id || `${item.userId}-${toIsoString(item.createdAt) || 'unknown'}`,
      source: 'beta_feedback',
      questionId: item.questionId || null,
      rawAssessmentTypes: [],
      displayAssessmentTypes: [],
      bucket,
      issueFamily: issueFamilyFromBucket(bucket),
      severity: null,
      status: item.status,
      userEmail: item.userEmail,
      userDisplayName: item.userDisplayName,
      featureArea: item.featureArea || null,
      page: item.page || null,
      targets: [],
      issueTypes: [],
      notes: item.message ? [item.message] : [],
      createdAt: toIsoString(item.createdAt),
      updatedAt: null,
      questionSnapshot: null
    };
  });
}

function buildTeachModeRecords(users: FeedbackAuditUser[]): AuditRawRecord[] {
  return users.flatMap((user) => {
    const flaggedQuestions = user.flaggedQuestions || {};
    return Object.entries(flaggedQuestions).map(([questionId, note]) => ({
      rawId: `teach-${user.id}-${questionId}`,
      source: 'teach_mode_flag' as const,
      questionId,
      rawAssessmentTypes: [],
      displayAssessmentTypes: [],
      bucket: 'Teach Mode weak-signal flags' as const,
      issueFamily: 'Teach Mode weak-signal flags',
      severity: null,
      status: null,
      userEmail: user.authMetrics?.email || null,
      userDisplayName: user.authMetrics?.displayName || null,
      targets: [],
      issueTypes: [],
      notes: note ? [note] : [],
      createdAt: toIsoString(user.lastUpdated),
      updatedAt: toIsoString(user.lastUpdated),
      questionSnapshot: null
    }));
  });
}

function buildClusterKey(record: AuditRawRecord): string {
  if (record.source === 'question_report') {
    return `question:${record.questionId || 'unknown'}:${record.issueFamily}`;
  }
  if (record.source === 'teach_mode_flag') {
    return `teach:${record.questionId || 'unknown'}`;
  }
  const noteKey = normalizeMessage(record.notes[0] || '').slice(0, 120);
  return `feedback:${record.bucket}:${normalizeMessage(record.featureArea || '')}:${normalizeMessage(record.page || '')}:${noteKey}`;
}

function sortIssues(issues: ConsolidatedAuditIssue[]): ConsolidatedAuditIssue[] {
  const decisionRank: Record<VerificationDecision, number> = {
    'still present': 4,
    'cannot verify from current evidence': 3,
    'likely already resolved': 2,
    'non-actionable / too vague': 1
  };

  return [...issues].sort((a, b) => {
    const rankDiff = decisionRank[b.verificationDecision] - decisionRank[a.verificationDecision];
    if (rankDiff !== 0) {
      return rankDiff;
    }
    const severityDiff = (SEVERITY_RANK[b.highestSeverity || ''] || 0) - (SEVERITY_RANK[a.highestSeverity || ''] || 0);
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return (b.reportCount || 0) - (a.reportCount || 0);
  });
}

function buildInstrumentationGaps(rawRecords: AuditRawRecord[]): string[] {
  const gaps = new Set<string>();

  if (rawRecords.some((record) => record.source === 'beta_feedback' && !record.questionId)) {
    gaps.add('Beta feedback is not reliably linked to question ids, so question-specific app notes are harder to reconcile with the moderated content queue.');
  }
  if (rawRecords.some((record) => record.source === 'question_report' && record.rawAssessmentTypes.includes('pre'))) {
    gaps.add('Question reports still store screener submissions as raw assessment type `pre`, so audit logic has to normalize that legacy label back to `screener` for product-facing analysis.');
  }
  if (rawRecords.some((record) => record.source === 'teach_mode_flag')) {
    gaps.add('Teach Mode review flags live in `user_progress.flagged_questions`, outside the moderated admin queues, and they do not preserve issue-specific timestamps.');
  }
  if (rawRecords.some((record) => record.source === 'question_report' && !record.updatedAt)) {
    gaps.add('Question reports do not currently surface a reliable updated timestamp in the audit export, so the latest admin status must be inferred from queue state rather than a full moderation history.');
  }
  if (rawRecords.some((record) => record.source === 'beta_feedback' && !record.featureArea && !record.page)) {
    gaps.add('Some beta feedback arrives without feature-area or page context, which weakens reproducibility for broad app bugs and UX reports.');
  }

  return [...gaps];
}

export async function buildFeedbackAudit(args: {
  reports: Array<QuestionReport & { id: string }>;
  feedback: BetaFeedback[];
  users: FeedbackAuditUser[];
}): Promise<FeedbackAuditBundle> {
  const generatedAt = new Date().toISOString();
  const auditQuestionContext = await getAuditQuestionContext();
  const rawRecords = [
    ...buildQuestionReportRecords(args.reports),
    ...buildBetaFeedbackRecords(args.feedback),
    ...buildTeachModeRecords(args.users)
  ];

  const clusterMap = rawRecords.reduce<Map<string, AuditRawRecord[]>>((acc, record) => {
    const key = buildClusterKey(record);
    const current = acc.get(key) || [];
    current.push(record);
    acc.set(key, current);
    return acc;
  }, new Map());

  const consolidatedIssues = sortIssues([...clusterMap.entries()].map(([key, records]) => {
    const verification = consolidateVerification(records, auditQuestionContext);
    const sourceTypes = [...new Set(records.map((record) => record.source))];
    const questionId = records.find((record) => record.questionId)?.questionId || null;
    const createdTimes = records.map((record) => record.createdAt).filter((value): value is string => Boolean(value)).sort();
    const uniqueReporters = new Set(records.map((record) => record.userEmail || record.userDisplayName || record.rawId));

    return {
      issueId: key,
      sourceTypes,
      questionId,
      bucket: records[0].bucket,
      issueFamily: records[0].issueFamily,
      rawAssessmentTypes: uniqueNonEmpty(records.flatMap((record) => record.rawAssessmentTypes)),
      displayAssessmentTypes: uniqueNonEmpty(records.flatMap((record) => record.displayAssessmentTypes)),
      featureAreas: uniqueNonEmpty(records.map((record) => record.featureArea)),
      pages: uniqueNonEmpty(records.map((record) => record.page)),
      reportCount: records.length,
      uniqueReporterCount: uniqueReporters.size,
      firstSeenAt: createdTimes[0] || null,
      lastSeenAt: createdTimes[createdTimes.length - 1] || null,
      latestAdminStatus: pickLatestStatus(records),
      highestSeverity: pickHighestSeverity(records.map((record) => record.severity)),
      representativeNotes: uniqueNonEmpty(records.flatMap((record) => record.notes)).slice(0, 3),
      verificationDecision: verification.verificationDecision,
      verificationReason: verification.verificationReason,
      currentQuestionExists: verification.currentQuestionExists,
      snapshotChanged: verification.snapshotChanged,
      changedFields: verification.changedFields,
      exactDuplicateStemCount: verification.exactDuplicateCount,
      corroboratedByTeachModeFlags: sourceTypes.includes('teach_mode_flag') && sourceTypes.length > 1,
      corroboratedByQuestionReports: sourceTypes.includes('question_report'),
      corroboratedByBetaFeedback: sourceTypes.includes('beta_feedback'),
      rawRecordIds: records.map((record) => record.rawId)
    };
  }));

  const questionCounts = consolidatedIssues.reduce<Map<string, number>>((acc, issue) => {
    if (!issue.questionId) {
      return acc;
    }
    acc.set(issue.questionId, (acc.get(issue.questionId) || 0) + issue.reportCount);
    return acc;
  }, new Map());

  const topRecurringQuestions = [...questionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([questionId, count]) => ({ questionId, count }));

  const verificationCounts = consolidatedIssues.reduce<Record<VerificationDecision, number>>((acc, issue) => {
    acc[issue.verificationDecision] = (acc[issue.verificationDecision] || 0) + 1;
    return acc;
  }, {
    'still present': 0,
    'likely already resolved': 0,
    'cannot verify from current evidence': 0,
    'non-actionable / too vague': 0
  });

  const bucketCounts = consolidatedIssues.reduce<Record<AuditBucket, number>>((acc, issue) => {
    acc[issue.bucket] = (acc[issue.bucket] || 0) + 1;
    return acc;
  }, {
    'question content accuracy': 0,
    'incorrect key / rationale': 0,
    'formatting / rendering': 0,
    'duplicate / similarity': 0,
    'UX / workflow friction': 0,
    'app bug': 0,
    'feature request': 0,
    'Teach Mode weak-signal flags': 0
  });

  const visibleDates = rawRecords.map((record) => record.createdAt).filter((value): value is string => Boolean(value)).sort();
  const summary: AuditSummary = {
    generatedAt,
    auditWindow: {
      firstSeenAt: visibleDates[0] || null,
      lastSeenAt: visibleDates[visibleDates.length - 1] || null
    },
    sourceCounts: {
      question_reports: rawRecords.filter((record) => record.source === 'question_report').length,
      beta_feedback: rawRecords.filter((record) => record.source === 'beta_feedback').length,
      teach_mode_flags: rawRecords.filter((record) => record.source === 'teach_mode_flag').length
    },
    totalConsolidatedIssues: consolidatedIssues.length,
    verificationCounts,
    bucketCounts,
    topRecurringQuestions,
    topThemes: Object.entries(bucketCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bucket, count]) => ({ bucket: bucket as AuditBucket, count })),
    unresolvedHighlights: consolidatedIssues.filter((issue) => issue.verificationDecision === 'still present').slice(0, 8),
    likelyResolvedHighlights: consolidatedIssues.filter((issue) => issue.verificationDecision === 'likely already resolved').slice(0, 8),
    instrumentationGaps: buildInstrumentationGaps(rawRecords)
  };

  return {
    generatedAt,
    auditWindow: summary.auditWindow,
    rawRecords,
    consolidatedIssues,
    summary
  };
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildAuditCsv(issues: ConsolidatedAuditIssue[]): string {
  const headers = [
    'issue_id',
    'source_types',
    'question_id',
    'bucket',
    'issue_family',
    'raw_assessment_types',
    'display_assessment_types',
    'feature_areas',
    'pages',
    'report_count',
    'unique_reporter_count',
    'first_seen_at',
    'last_seen_at',
    'latest_admin_status',
    'highest_severity',
    'verification_decision',
    'verification_reason',
    'current_question_exists',
    'snapshot_changed',
    'changed_fields',
    'exact_duplicate_stem_count',
    'corroborated_by_teach_mode_flags',
    'corroborated_by_question_reports',
    'corroborated_by_beta_feedback',
    'representative_notes',
    'raw_record_ids'
  ];

  const rows = issues.map((issue) => [
    issue.issueId,
    issue.sourceTypes.join('; '),
    issue.questionId || '',
    issue.bucket,
    issue.issueFamily,
    issue.rawAssessmentTypes.join('; '),
    issue.displayAssessmentTypes.join('; '),
    issue.featureAreas.join('; '),
    issue.pages.join('; '),
    String(issue.reportCount),
    String(issue.uniqueReporterCount),
    issue.firstSeenAt || '',
    issue.lastSeenAt || '',
    issue.latestAdminStatus || '',
    issue.highestSeverity || '',
    issue.verificationDecision,
    issue.verificationReason,
    String(issue.currentQuestionExists),
    String(issue.snapshotChanged),
    issue.changedFields.join('; '),
    String(issue.exactDuplicateStemCount),
    String(issue.corroboratedByTeachModeFlags),
    String(issue.corroboratedByQuestionReports),
    String(issue.corroboratedByBetaFeedback),
    issue.representativeNotes.join(' || '),
    issue.rawRecordIds.join('; ')
  ].map(escapeCsv).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function buildAuditSummaryMarkdown(bundle: FeedbackAuditBundle): string {
  const lines = [
    '# Feedback Audit Summary',
    '',
    `Generated at: ${bundle.summary.generatedAt}`,
    `Audit window: ${bundle.summary.auditWindow.firstSeenAt || 'Unknown'} -> ${bundle.summary.auditWindow.lastSeenAt || 'Unknown'}`,
    '',
    '## Source Counts',
    ...Object.entries(bundle.summary.sourceCounts).map(([label, count]) => `- ${label}: ${count}`),
    '',
    '## Verification Counts',
    ...Object.entries(bundle.summary.verificationCounts).map(([label, count]) => `- ${label}: ${count}`),
    '',
    '## Bucket Counts',
    ...Object.entries(bundle.summary.bucketCounts).map(([label, count]) => `- ${label}: ${count}`),
    '',
    '## Top Recurring Questions',
    ...(bundle.summary.topRecurringQuestions.length > 0
      ? bundle.summary.topRecurringQuestions.map((item) => `- ${item.questionId}: ${item.count}`)
      : ['- None']),
    '',
    '## Unresolved Highlights',
    ...(bundle.summary.unresolvedHighlights.length > 0
      ? bundle.summary.unresolvedHighlights.map((issue) => `- ${issue.questionId || issue.issueId}: ${issue.bucket} (${issue.reportCount})`)
      : ['- None']),
    '',
    '## Likely Resolved Highlights',
    ...(bundle.summary.likelyResolvedHighlights.length > 0
      ? bundle.summary.likelyResolvedHighlights.map((issue) => `- ${issue.questionId || issue.issueId}: ${issue.bucket} (${issue.reportCount})`)
      : ['- None']),
    '',
    '## Instrumentation Gaps',
    ...(bundle.summary.instrumentationGaps.length > 0
      ? bundle.summary.instrumentationGaps.map((gap) => `- ${gap}`)
      : ['- None'])
  ];

  return lines.join('\n');
}
