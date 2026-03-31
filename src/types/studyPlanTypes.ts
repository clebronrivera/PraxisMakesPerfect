/**
 * Study Plan Types v2
 *
 * Architecture: evidence-based instructional reasoning
 *   Layer 1 (code)  — deterministic preprocessing: trends, urgency, clusters, time budget
 *   Layer 2 (code)  — content retrieval: vocab, misconceptions, case archetypes from skill profiles
 *   Layer 3 (model) — synthesis only: interpretation, explanation, sequencing, personalization
 */

// ─── Student skill state ──────────────────────────────────────────────────────

export type TrendDirection = "improving" | "flat" | "declining" | "insufficient_data";

export type StudentSkillStatus =
  | "unlearned"      // < 3 attempts — not enough engagement to classify
  | "misconception"  // >= 3 attempts, < 60% accuracy, AND confidence issue or repeated distractor
  | "unstable"       // >= 3 attempts, < 40% accuracy, no misconception signal
  | "developing"     // >= 3 attempts, 40–59% accuracy, no misconception signal
  | "near_mastery"   // 60–79% accuracy
  | "mastered";      // >= 80% accuracy

/**
 * Hard thresholds for status label assignment.
 * Evaluated in priority order (first matching rule wins).
 *
 * 1. attempts < MIN_ATTEMPTS_FOR_STATUS                           → "unlearned"
 * 2. accuracy < MISCONCEPTION_ACCURACY_CEILING
 *    AND (confidenceIssue OR repeatedDistractorPattern)           → "misconception"
 * 3. accuracy >= MASTERED_THRESHOLD                              → "mastered"
 * 4. accuracy >= NEAR_MASTERY_THRESHOLD                          → "near_mastery"
 * 5. accuracy >= DEVELOPING_THRESHOLD                            → "developing"
 * 6. accuracy < DEVELOPING_THRESHOLD                             → "unstable"
 *
 * Trend requires MIN_ATTEMPTS_FOR_TREND attempts.
 * Trend = "improving" if (avg last-half accuracy) - (avg first-half accuracy) >= TREND_THRESHOLD.
 * Trend = "declining" if (avg first-half accuracy) - (avg last-half accuracy) >= TREND_THRESHOLD.
 * Otherwise "flat".
 */
export const SKILL_STATUS_THRESHOLDS = {
  MIN_ATTEMPTS_FOR_STATUS: 3,
  MIN_ATTEMPTS_FOR_TREND: 6,
  MISCONCEPTION_ACCURACY_CEILING: 60, // < 60% AND signal → misconception
  MASTERED_THRESHOLD: 80,
  NEAR_MASTERY_THRESHOLD: 60,
  DEVELOPING_THRESHOLD: 40,
  TREND_THRESHOLD: 15, // percentage points between half-averages
} as const;

export interface StudentSkillState {
  skillId: string;
  currentAccuracy: number | null; // null = no attempts
  attempts: number;
  firstHalfAccuracy: number | null; // avg accuracy of first ceil(attempts/2) responses
  lastHalfAccuracy: number | null;  // avg accuracy of last floor(attempts/2) responses
  trend: TrendDirection;
  confidenceIssue: boolean;         // high-confidence wrong answer detected
  repeatedDistractorPattern: boolean; // same wrong answer chosen >= 2 times
  missedQuestionIds: string[];
  status: StudentSkillStatus;
  fragilityFlag: boolean;        // Low-confidence correct >= 50% of last 6 attempts. Feeds study plan prompt.
  uncertainSkillFlag: boolean;   // High confidence variance. SHADOW MODE — do not surface to student.
}

// ─── Study constraints ────────────────────────────────────────────────────────

export type StudyIntensity = "light" | "moderate" | "aggressive";

export interface StudyConstraints {
  testDate?: string;           // ISO date string
  weeksToTest?: number;        // computed from testDate if not provided
  studyDaysPerWeek?: number;   // 1–7
  minutesPerSession?: number;  // per weekday session
  weekendMinutes?: number;     // weekend session total
  intensity?: StudyIntensity;
}

// ─── Content cluster names ────────────────────────────────────────────────────
// These must match the contentCluster field in SkillMetadataV1.

export type ContentCluster =
  | "psychometrics-and-assessment"
  | "data-based-decision-making"
  | "academic-intervention"
  | "behavior-and-mental-health"
  | "legal-and-ethics"
  | "crisis-and-safety"
  | "consultation-and-collaboration"
  | "diversity-and-equity"
  | "school-systems"
  | "family-systems"
  | "research-and-evaluation";

export const CONTENT_CLUSTER_LABELS: Record<ContentCluster, string> = {
  "psychometrics-and-assessment": "Psychometrics & Assessment",
  "data-based-decision-making": "Data-Based Decision Making",
  "academic-intervention": "Academic Intervention",
  "behavior-and-mental-health": "Behavior & Mental Health",
  "legal-and-ethics": "Legal & Ethics",
  "crisis-and-safety": "Crisis & Safety",
  "consultation-and-collaboration": "Consultation & Collaboration",
  "diversity-and-equity": "Diversity & Equity",
  "school-systems": "School-Wide Systems",
  "family-systems": "Family Systems",
  "research-and-evaluation": "Research & Evaluation",
};

// ─── Preprocessed cluster ─────────────────────────────────────────────────────

export type ClusterUrgency = "urgent_now" | "important_next" | "maintain";

export interface PrecomputedCluster {
  clusterId: ContentCluster;
  clusterName: string;
  urgency: ClusterUrgency;
  skills: Array<{
    skillId: string;
    skillName: string;
    status: StudentSkillStatus;
    accuracy: number | null;
    trend: TrendDirection;
    fragilityFlag: boolean;           // Low-confidence correct >= 50% of last 6. Feeds study plan prompt.
  }>;
  retrievedVocabulary: string[];     // from SkillMetadataV1 for skills in this cluster
  retrievedMisconceptions: string[]; // from SkillMetadataV1
  retrievedCaseArchetypes: string[]; // from SkillMetadataV1
  retrievedLawsFrameworks: string[]; // from SkillMetadataV1
  allocatedMinutes: number;          // deterministic from study time budget
}

// ─── Time budget ─────────────────────────────────────────────────────────────

export interface StudyTimeBudget {
  totalAvailableMinutes: number;
  weeksAvailable: number;
  minutesPerWeek: number;
  clusterAllocation: Array<{
    clusterId: ContentCluster;
    allocatedMinutes: number;
    allocatedWeeks: number;
  }>;
}

// ─── Weekly schedule frame (deterministic) ───────────────────────────────────

export type SessionType =
  | "vocabulary"
  | "concept-review"
  | "case-practice"
  | "mixed-retrieval"
  | "wrong-answer-review";

export interface WeeklyScheduleFrame {
  weekNumber: number;
  datesLabel: string | null;
  clusterFocus: string;
  allocatedMinutes: number;
  sessions: Array<{
    sessionLabel: string;
    durationMinutes: number;
    sessionType: SessionType;
  }>;
}

// ─── New StudyPlanDocument (v2) ───────────────────────────────────────────────

export interface ReadinessSnapshot {
  readinessLevel: "early" | "developing" | "approaching" | "ready";
  summary: string;
  testTimeline: string | null;
  majorBlockers: string[];
  strongestArea: string;
  nextBestMove: string;
}

export interface DataInterpretation {
  headline: string;
  patterns: string[];       // 3–5 inferences about the data
  urgentInsights: string[]; // 2–3 things needing immediate attention
}

export interface PriorityCluster {
  clusterName: string;
  urgency: ClusterUrgency;
  skills: Array<{
    skillId: string;
    skillName: string;
    status: StudentSkillStatus;
    accuracy: number | null;
    trend: TrendDirection;
  }>;
  whyItMatters: string;
  blockingNote: string | null;
  allocatedMinutes: number;
  recommendedContentTypes: string[];
}

export interface DomainStudyMap {
  domainId: number;
  domainName: string;
  domainScore: number | null;
  interpretation: string;
  contentToKnow: string[];
  keyVocabulary: string[];
  caseTypesToRecognize: string[];
  commonTraps: string[];
  masteryIndicator: string;
}

export interface VocabEntry {
  term: string;
  plainDefinition: string;
  whyItMatters: string;
  whereItShowsUp: string;
  confusionRisk: string | null;
}

export interface CasePattern {
  patternName: string;
  domainContext: string;
  cluesInScenario: string[];
  likelyQuestionAngle: string;
  commonMistake: string;
}

export interface WeeklyPlanWeek {
  weekNumber: number;
  datesLabel: string | null;
  clusterFocus: string;
  allocatedMinutes: number;
  weekGoal: string;
  sessions: Array<{
    sessionLabel: string;
    durationMinutes: number;
    sessionType: SessionType;
    focus: string;
    tasks: string[];
  }>;
  checkpointQuestion: string;
}

export interface TacticalInstructions {
  immediateActions: string[];
  thisWeekGoals: string[];
  avoidList: string[];
}

export interface CheckpointLogic {
  week2Check: string;
  midpointAssessment: string;
  shiftSignal: string;
  readinessSignal: string;
}

export interface StudyPlanDocumentV2 {
  schemaVersion: "2";
  readinessSnapshot: ReadinessSnapshot;
  dataInterpretation: DataInterpretation;
  priorityClusters: PriorityCluster[];
  domainStudyMaps: DomainStudyMap[];
  vocabulary: VocabEntry[];
  casePatterns: CasePattern[];
  weeklyStudyPlan: WeeklyPlanWeek[];
  tacticalInstructions: TacticalInstructions;
  checkpointLogic: CheckpointLogic;
  generatedAt: string;
  model: string;
  studyConstraints: StudyConstraints | null;
  sourceSummary: {
    screenerResponseCount: number;
    assessmentResponseCount: number;
    flaggedSkillCount: number;
    domainScoreCount: number;
    deficitSkillCount: number;
    clusterCount: number;
  };
}
