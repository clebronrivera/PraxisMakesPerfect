/**
 * Study Plan Preprocessor — Layer 1 (deterministic)
 *
 * Computes everything the model should NOT have to reason about:
 *   - StudentSkillState with hard-threshold status labels
 *   - Urgency ranking and priority cluster assignment
 *   - Skill content retrieval from v1 metadata
 *   - Study time budget from constraints
 *   - Weekly schedule frame (structure only — model writes narrative)
 *
 * Nothing in this file calls an AI model.
 */

import {
  type StudentSkillState,
  type StudyConstraints,
  type StudyTimeBudget,
  type PrecomputedCluster,
  type WeeklyScheduleFrame,
  type TrendDirection,
  type StudentSkillStatus,
  type ClusterUrgency,
  type ContentCluster,
  type SessionType,
  SKILL_STATUS_THRESHOLDS,
  CONTENT_CLUSTER_LABELS,
} from '../types/studyPlanTypes';
import { getSkillMetadataV1 } from '../data/skill-metadata-v1';
import { toMetadataId } from '../data/skillIdMap';
import {
  computeFragilityFlag,
  computeUncertainSkillFlag,
  type SkillAttempt,
} from '../brain/learning-state';

// ─── Response shape expected from the caller ──────────────────────────────────

export interface RawSkillResponse {
  skillId: string;
  skillName: string;
  domainId: number;
  domainName: string;
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unknown' | string;
  distractorSelected: string | null;
  questionId?: string;
}

// ─── Status label assignment (hard thresholds, evaluated in priority order) ──

function assignStatus(
  attempts: number,
  accuracy: number | null,
  confidenceIssue: boolean,
  repeatedDistractor: boolean
): StudentSkillStatus {
  const {
    MIN_ATTEMPTS_FOR_STATUS,
    MISCONCEPTION_ACCURACY_CEILING,
    MASTERED_THRESHOLD,
    NEAR_MASTERY_THRESHOLD,
    DEVELOPING_THRESHOLD,
  } = SKILL_STATUS_THRESHOLDS;

  // Rule 1: insufficient engagement to classify
  if (attempts < MIN_ATTEMPTS_FOR_STATUS) return "unlearned";

  const acc = accuracy ?? 0;

  // Rule 2: misconception signal (accuracy < ceiling AND a diagnostic pattern)
  if (acc < MISCONCEPTION_ACCURACY_CEILING && (confidenceIssue || repeatedDistractor)) {
    return "misconception";
  }

  // Rule 3–6: accuracy bands
  if (acc >= MASTERED_THRESHOLD)     return "mastered";
  if (acc >= NEAR_MASTERY_THRESHOLD) return "near_mastery";
  if (acc >= DEVELOPING_THRESHOLD)   return "developing";
  return "unstable";
}

// ─── Trend computation ────────────────────────────────────────────────────────

function computeTrend(outcomes: boolean[]): TrendDirection {
  if (outcomes.length < SKILL_STATUS_THRESHOLDS.MIN_ATTEMPTS_FOR_TREND) {
    return "insufficient_data";
  }

  const half = Math.floor(outcomes.length / 2);
  const firstHalf  = outcomes.slice(0, Math.ceil(outcomes.length / 2));
  const secondHalf = outcomes.slice(outcomes.length - half);

  const avg = (arr: boolean[]) =>
    arr.length === 0 ? 0 : (arr.filter(Boolean).length / arr.length) * 100;

  const firstAvg  = avg(firstHalf);
  const secondAvg = avg(secondHalf);
  const delta     = secondAvg - firstAvg;

  if (delta >=  SKILL_STATUS_THRESHOLDS.TREND_THRESHOLD) return "improving";
  if (delta <= -SKILL_STATUS_THRESHOLDS.TREND_THRESHOLD) return "declining";
  return "flat";
}

// ─── Main: compute StudentSkillState[] ───────────────────────────────────────

/**
 * Groups raw response history by skill and computes a StudentSkillState for each.
 * Responses must be ordered chronologically (oldest first) for trend to be accurate.
 */
export function computeStudentSkillStates(
  responses: RawSkillResponse[]
): StudentSkillState[] {
  // Group responses by skillId (preserve order = chronological)
  const bySkill = new Map<string, RawSkillResponse[]>();
  for (const r of responses) {
    const list = bySkill.get(r.skillId) ?? [];
    list.push(r);
    bySkill.set(r.skillId, list);
  }

  return Array.from(bySkill.entries()).map(([skillId, skillResponses]) => {
    const attempts = skillResponses.length;
    const correctCount = skillResponses.filter(r => r.isCorrect).length;
    const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : null;

    // Half-averages for trend
    const outcomes = skillResponses.map(r => r.isCorrect);
    const halfLen   = Math.ceil(attempts / 2);
    const firstHalf = outcomes.slice(0, halfLen);
    const lastHalf  = outcomes.slice(attempts - Math.floor(attempts / 2));

    const halfAvg = (arr: boolean[]) =>
      arr.length === 0 ? null : Math.round((arr.filter(Boolean).length / arr.length) * 100);

    const firstHalfAccuracy = halfAvg(firstHalf);
    const lastHalfAccuracy  = halfAvg(lastHalf);

    // Confidence issue: at least one high-confidence wrong answer
    const confidenceIssue = skillResponses.some(
      r => !r.isCorrect && r.confidence === 'high'
    );

    // Repeated distractor: the same wrong answer selected 2+ times
    const distractors = skillResponses
      .filter(r => !r.isCorrect && r.distractorSelected)
      .map(r => r.distractorSelected as string);
    const distractorCounts = new Map<string, number>();
    for (const d of distractors) {
      distractorCounts.set(d, (distractorCounts.get(d) ?? 0) + 1);
    }
    const repeatedDistractorPattern = [...distractorCounts.values()].some(c => c >= 2);

    const missedQuestionIds = skillResponses
      .filter(r => !r.isCorrect && r.questionId)
      .map(r => r.questionId as string);

    // Convert raw responses to SkillAttempt objects for flag computation
    const skillAttempts: SkillAttempt[] = skillResponses.map(r => ({
      questionId: r.questionId ?? `unknown-${skillId}-${Math.random()}`,
      correct: r.isCorrect,
      confidence: (r.confidence as 'low' | 'medium' | 'high' | 'unknown') === 'unknown' ? 'medium' : (r.confidence as 'low' | 'medium' | 'high'),
      timestamp: 0, // Not available from raw responses
      timeSpent: 0,  // Not available from raw responses
    }));

    // Compute new flags using the flag functions
    const fragilityFlag = computeFragilityFlag(skillAttempts);
    const uncertainSkillFlag = computeUncertainSkillFlag(skillAttempts);

    return {
      skillId,
      currentAccuracy: accuracy,
      attempts,
      firstHalfAccuracy,
      lastHalfAccuracy,
      trend: computeTrend(outcomes),
      confidenceIssue,
      repeatedDistractorPattern,
      missedQuestionIds,
      status: assignStatus(attempts, accuracy, confidenceIssue, repeatedDistractorPattern),
      fragilityFlag,
      uncertainSkillFlag,
    };
  });
}

// ─── Urgency scoring ──────────────────────────────────────────────────────────

/**
 * Returns a numeric urgency score (higher = more urgent).
 *
 * Factors:
 *   - Status: misconception and unstable are highest urgency
 *   - Trend: declining > flat > improving (for same status)
 *   - Confidence issue: boosts score
 *   - Accuracy: lower accuracy = higher urgency
 */
function urgencyScore(state: StudentSkillState): number {
  const statusWeight: Record<StudentSkillStatus, number> = {
    misconception: 100,
    unstable:      80,
    developing:    60,
    unlearned:     50,
    near_mastery:  20,
    mastered:      0,
  };

  const trendPenalty: Record<TrendDirection, number> = {
    declining:         20,
    flat:              10,
    insufficient_data: 5,
    improving:         0,
  };

  const base      = statusWeight[state.status];
  const trend     = trendPenalty[state.trend];
  const confBoost = state.confidenceIssue ? 15 : 0;
  const fragility = state.fragilityFlag ? 10 : 0;
  const accFactor = state.currentAccuracy !== null ? (100 - state.currentAccuracy) / 10 : 5;

  return base + trend + confBoost + fragility + accFactor;
}

// ─── Cluster assignment and urgency ──────────────────────────────────────────

function clusterUrgencyFromSkillStatuses(
  statuses: StudentSkillStatus[]
): ClusterUrgency {
  const hasUrgent = statuses.some(s =>
    s === "misconception" || s === "unstable" || s === "unlearned"
  );
  const hasDeveloping = statuses.some(s => s === "developing");
  const allNearOrMastered = statuses.every(s =>
    s === "near_mastery" || s === "mastered"
  );

  if (hasUrgent) return "urgent_now";
  if (hasDeveloping || !allNearOrMastered) return "important_next";
  return "maintain";
}

// ─── Content retrieval ────────────────────────────────────────────────────────

function dedup(arr: string[]): string[] {
  return [...new Set(arr)];
}

function retrieveSkillContent(skillIds: string[]): {
  vocabulary: string[];
  misconceptions: string[];
  caseArchetypes: string[];
  lawsFrameworks: string[];
} {
  const vocab: string[]    = [];
  const misc: string[]     = [];
  const cases: string[]    = [];
  const laws: string[]     = [];

  for (const id of skillIds) {
    const meta = getSkillMetadataV1(id) ?? getSkillMetadataV1(toMetadataId(id) ?? '');
    if (!meta) continue;
    vocab.push(...meta.vocabulary);
    misc.push(...meta.commonMisconceptions);
    cases.push(...meta.caseArchetypes);
    laws.push(...meta.lawsFrameworks);
  }

  return {
    vocabulary:      dedup(vocab).slice(0, 20),
    misconceptions:  dedup(misc).slice(0, 15),
    caseArchetypes:  dedup(cases).slice(0, 12),
    lawsFrameworks:  dedup(laws).slice(0, 8),
  };
}

// ─── Main: group skill states into precomputed clusters ───────────────────────

/**
 * Groups skill states by contentCluster, ranks by aggregate urgency,
 * retrieves skill content, and assigns allocated study minutes.
 */
export function buildPrecomputedClusters(
  skillStates: StudentSkillState[],
  timeBudget: StudyTimeBudget
): PrecomputedCluster[] {
  // Only include non-mastered skills in clusters
  const active = skillStates.filter(s => s.status !== "mastered");

  // Group by cluster
  const byCluster = new Map<ContentCluster, StudentSkillState[]>();
  for (const state of active) {
    const meta = getSkillMetadataV1(state.skillId) ?? getSkillMetadataV1(toMetadataId(state.skillId) ?? '');
    if (!meta) continue;
    const cluster = meta.contentCluster;
    const list = byCluster.get(cluster) ?? [];
    list.push(state);
    byCluster.set(cluster, list);
  }

  // Also include mastered clusters at "maintain" level if they have near_mastery skills
  for (const state of skillStates.filter(s => s.status === "near_mastery")) {
    const meta = getSkillMetadataV1(state.skillId) ?? getSkillMetadataV1(toMetadataId(state.skillId) ?? '');
    if (!meta) continue;
    if (!byCluster.has(meta.contentCluster)) {
      byCluster.set(meta.contentCluster, [state]);
    }
  }

  // Build cluster objects and sort by urgency
  const clusters: PrecomputedCluster[] = [];

  for (const [clusterId, states] of byCluster.entries()) {
    // Sort skills by urgency score desc
    const sorted = [...states].sort((a, b) => urgencyScore(b) - urgencyScore(a));
    const urgency = clusterUrgencyFromSkillStatuses(sorted.map(s => s.status));

    const content = retrieveSkillContent(sorted.map(s => s.skillId));
    const allocation = timeBudget.clusterAllocation.find(a => a.clusterId === clusterId);

    clusters.push({
      clusterId,
      clusterName: CONTENT_CLUSTER_LABELS[clusterId] ?? clusterId,
      urgency,
      skills: sorted.map(s => ({
        skillId: s.skillId,
        skillName: s.skillId, // caller can enrich with real name from skill lookup
        status: s.status,
        accuracy: s.currentAccuracy,
        trend: s.trend,
        fragilityFlag: s.fragilityFlag,
      })),
      retrievedVocabulary:     content.vocabulary,
      retrievedMisconceptions: content.misconceptions,
      retrievedCaseArchetypes: content.caseArchetypes,
      retrievedLawsFrameworks: content.lawsFrameworks,
      allocatedMinutes: allocation?.allocatedMinutes ?? 0,
    });
  }

  // Sort: urgent_now → important_next → maintain, then by aggregate urgency score
  const urgencyOrder: Record<ClusterUrgency, number> = {
    urgent_now:     0,
    important_next: 1,
    maintain:       2,
  };

  return clusters.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    // Secondary: total urgency score of skills in cluster
    const scoreA = a.skills.reduce((sum, s) => {
      const state = skillStates.find(st => st.skillId === s.skillId);
      return sum + (state ? urgencyScore(state) : 0);
    }, 0);
    const scoreB = b.skills.reduce((sum, s) => {
      const state = skillStates.find(st => st.skillId === s.skillId);
      return sum + (state ? urgencyScore(state) : 0);
    }, 0);
    return scoreB - scoreA;
  });
}

// ─── Study time budget ────────────────────────────────────────────────────────

const DEFAULT_CONSTRAINTS: Required<Omit<StudyConstraints, 'testDate' | 'weeksToTest'>> = {
  studyDaysPerWeek: 5,
  minutesPerSession: 45,
  weekendMinutes: 60,
  intensity: 'moderate',
};

const INTENSITY_MULTIPLIER: Record<string, number> = {
  light:      0.7,
  moderate:   1.0,
  aggressive: 1.3,
};

function minutesPerWeek(constraints: StudyConstraints): number {
  const days    = constraints.studyDaysPerWeek    ?? DEFAULT_CONSTRAINTS.studyDaysPerWeek;
  const session = constraints.minutesPerSession   ?? DEFAULT_CONSTRAINTS.minutesPerSession;
  const weekend = constraints.weekendMinutes      ?? DEFAULT_CONSTRAINTS.weekendMinutes;
  const mult    = INTENSITY_MULTIPLIER[constraints.intensity ?? 'moderate'] ?? 1;

  // Count weekday sessions (days up to 5) + weekend
  const weekdayDays    = Math.min(days, 5);
  const hasWeekend     = days > 5;
  const weekdayMinutes = weekdayDays * session;
  const weekendTotal   = hasWeekend ? weekend : 0;

  return Math.round((weekdayMinutes + weekendTotal) * mult);
}

/**
 * Computes a time budget from study constraints.
 * Clusters are weighted: urgent_now gets 50%, important_next 35%, maintain 15%.
 * If no clusters provided, returns a flat estimate with no per-cluster allocation.
 */
export function computeStudyTimeBudget(
  constraints: StudyConstraints,
  clusters: Array<{ clusterId: ContentCluster; urgency: ClusterUrgency }>
): StudyTimeBudget {
  // Compute weeks available
  let weeksAvailable = constraints.weeksToTest ?? 8; // default 8 weeks
  if (constraints.testDate && !constraints.weeksToTest) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diff = new Date(constraints.testDate).getTime() - Date.now();
    weeksAvailable = Math.max(1, Math.round(diff / msPerWeek));
  }

  const mpw = minutesPerWeek(constraints);
  const totalMinutes = mpw * weeksAvailable;

  // Distribute by urgency weight
  const urgentClusters    = clusters.filter(c => c.urgency === "urgent_now");
  const importantClusters = clusters.filter(c => c.urgency === "important_next");
  const maintainClusters  = clusters.filter(c => c.urgency === "maintain");

  const urgentShare    = urgentClusters.length    > 0 ? 0.50 : 0;
  const importantShare = importantClusters.length > 0 ? 0.35 : 0;
  const maintainShare  = maintainClusters.length  > 0 ? 0.15 : 0;

  // Redistribute if some buckets are empty
  const usedShare = urgentShare + importantShare + maintainShare;
  const scale     = usedShare > 0 ? 1 / usedShare : 1;

  function splitEvenly(clusterList: typeof clusters, share: number): Array<{
    clusterId: ContentCluster;
    allocatedMinutes: number;
    allocatedWeeks: number;
  }> {
    if (clusterList.length === 0) return [];
    const total = Math.round(totalMinutes * share * scale);
    const each  = Math.round(total / clusterList.length);
    return clusterList.map(c => ({
      clusterId:         c.clusterId,
      allocatedMinutes:  each,
      allocatedWeeks:    Math.round(each / mpw),
    }));
  }

  const clusterAllocation = [
    ...splitEvenly(urgentClusters,    urgentShare),
    ...splitEvenly(importantClusters, importantShare),
    ...splitEvenly(maintainClusters,  maintainShare),
  ];

  return {
    totalAvailableMinutes: totalMinutes,
    weeksAvailable,
    minutesPerWeek: mpw,
    clusterAllocation,
  };
}

// ─── Weekly schedule frame ────────────────────────────────────────────────────

/**
 * Maps skill statuses and cluster types to the most useful session type.
 *
 * Rules (in order):
 *   - Cluster has misconception skills → wrong-answer-review first
 *   - Cluster is legal/ethics or psychometrics → vocabulary
 *   - Default: concept-review first, then case-practice
 */
function sessionTypeForCluster(
  clusterId: ContentCluster,
  hasUnlearned: boolean,
  hasMisconception: boolean,
  sessionIndex: number
): SessionType {
  if (hasMisconception && sessionIndex === 0) return "wrong-answer-review";
  if (hasUnlearned     && sessionIndex === 0) return "vocabulary";

  const vocabHeavyClusters: ContentCluster[] = [
    "legal-and-ethics",
    "psychometrics-and-assessment",
    "research-and-evaluation",
  ];
  const caseHeavyClusters: ContentCluster[] = [
    "behavior-and-mental-health",
    "crisis-and-safety",
    "consultation-and-collaboration",
    "family-systems",
    "diversity-and-equity",
  ];

  if (sessionIndex % 3 === 2) return "mixed-retrieval";
  if (vocabHeavyClusters.includes(clusterId)) {
    return sessionIndex % 2 === 0 ? "vocabulary" : "concept-review";
  }
  if (caseHeavyClusters.includes(clusterId)) {
    return sessionIndex % 2 === 0 ? "concept-review" : "case-practice";
  }
  return sessionIndex % 2 === 0 ? "concept-review" : "case-practice";
}

/**
 * Builds the deterministic schedule frame.
 * Each week gets a cluster focus and a set of session slots.
 * The model fills in focus strings and task descriptions.
 */
export function buildWeeklyScheduleFrame(
  constraints: StudyConstraints,
  clusters: PrecomputedCluster[],
  timeBudget: StudyTimeBudget
): WeeklyScheduleFrame[] {
  const { weeksAvailable, minutesPerWeek: mpw } = timeBudget;
  const days      = constraints.studyDaysPerWeek ?? DEFAULT_CONSTRAINTS.studyDaysPerWeek;
  const sessionMin = constraints.minutesPerSession ?? DEFAULT_CONSTRAINTS.minutesPerSession;
  const weekendMin = constraints.weekendMinutes ?? DEFAULT_CONSTRAINTS.weekendMinutes;
  const hasWeekend = days > 5;

  const testDate = constraints.testDate ?? null;

  const frames: WeeklyScheduleFrame[] = [];

  let clusterQueue = [...clusters.filter(c => c.urgency !== "maintain")];
  // Append maintain clusters at the end for review weeks
  const maintainClusters = clusters.filter(c => c.urgency === "maintain");

  for (let week = 1; week <= weeksAvailable; week++) {
    // Determine cluster focus for this week
    const cluster = clusterQueue[0] ?? maintainClusters[0] ?? null;
    const clusterFocusLabel = cluster?.clusterName ?? "General Review";
    const clusterFocusId    = cluster?.clusterId ?? null;

    // Rotate cluster every 1–2 weeks based on allocated time
    if (cluster) {
      const allocation = timeBudget.clusterAllocation.find(a => a.clusterId === cluster.clusterId);
      const weeksForThis = Math.max(1, allocation?.allocatedWeeks ?? 1);
      const weekInCluster = (week - 1) % weeksForThis;
      if (weekInCluster === weeksForThis - 1 && clusterQueue.length > 1) {
        clusterQueue.shift(); // move to next cluster
      }
    }

    // Build session slots
    const sessions: WeeklyScheduleFrame['sessions'] = [];
    const weekdayDays = Math.min(days, 5);
    const hasWeekendSession = hasWeekend;

    const hasMisconception = cluster?.skills.some(s => s.status === "misconception") ?? false;
    const hasUnlearned     = cluster?.skills.some(s => s.status === "unlearned")     ?? false;

    for (let d = 0; d < weekdayDays; d++) {
      const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      sessions.push({
        sessionLabel:    dayLabels[d],
        durationMinutes: sessionMin,
        sessionType:     sessionTypeForCluster(
          clusterFocusId as ContentCluster,
          hasUnlearned,
          hasMisconception,
          d
        ),
      });
    }

    if (hasWeekendSession) {
      sessions.push({
        sessionLabel:    "Weekend",
        durationMinutes: weekendMin,
        sessionType:     week % 2 === 0 ? "mixed-retrieval" : "case-practice",
      });
    }

    // Date label
    let datesLabel: string | null = null;
    if (testDate) {
      const testMs    = new Date(testDate).getTime();
      const weekStart = new Date(testMs - (weeksAvailable - week + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd   = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const fmt       = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      datesLabel = `Week ${week} (${fmt(weekStart)} – ${fmt(weekEnd)})`;
    }

    frames.push({
      weekNumber:      week,
      datesLabel,
      clusterFocus:    clusterFocusLabel,
      allocatedMinutes: mpw,
      sessions,
    });
  }

  return frames;
}

// ─── Enrich cluster skill names ───────────────────────────────────────────────

/**
 * Fills in skill names from the skill lookup map after cluster building.
 * BuildPrecomputedClusters sets skillName = skillId as a placeholder.
 */
export function enrichClusterSkillNames(
  clusters: PrecomputedCluster[],
  skillNameLookup: Map<string, string>
): PrecomputedCluster[] {
  return clusters.map(cluster => ({
    ...cluster,
    skills: cluster.skills.map(s => ({
      ...s,
      skillName: skillNameLookup.get(s.skillId) ?? s.skillId,
    })),
  }));
}

// ─── Domain score summary ─────────────────────────────────────────────────────

export interface DomainScoreSummary {
  domainId: number;
  domainName: string;
  score: number | null;
  skillCount: number;
  deficitSkillCount: number; // skills below 60%
}

/**
 * Summarizes domain-level performance from skill states and a domain score map.
 */
export function buildDomainSummaries(
  skillStates: StudentSkillState[],
  domainScores: Record<number, number>,
  domainNames: Record<number, string>,
  skillDomainMap: Map<string, number>
): DomainScoreSummary[] {
  const domainSkills = new Map<number, StudentSkillState[]>();

  for (const state of skillStates) {
    const domainId = skillDomainMap.get(state.skillId);
    if (domainId === undefined) continue;
    const list = domainSkills.get(domainId) ?? [];
    list.push(state);
    domainSkills.set(domainId, list);
  }

  return Object.entries(domainScores).map(([id, score]) => {
    const domainId = Number(id);
    const states   = domainSkills.get(domainId) ?? [];
    return {
      domainId,
      domainName:       domainNames[domainId] ?? `Domain ${domainId}`,
      score:            score ?? null,
      skillCount:       states.length,
      deficitSkillCount: states.filter(s =>
        s.currentAccuracy !== null && s.currentAccuracy < 60
      ).length,
    };
  }).sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
}
