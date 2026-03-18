import { supabase } from '../config/supabase';
import { Domain, Skill } from '../types/content';
import {
  GlobalScoreInputs,
  calculateGlobalScoresFromData,
  fetchGlobalScoreInputs
} from '../utils/globalScoreCalculator';
import { getSkillById } from '../brain/skill-map';
import {
  type StudyPlanApiRequest
} from '../types/studyPlanApi';

const FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD = 60;
const FOUNDATIONAL_REVIEW_TARGET = 70;
// Background function endpoint — Netlify returns 202 immediately, runs async
const STUDY_PLAN_BACKGROUND_PATHS = [
  '/api/study-plan-background',
  '/.netlify/functions/study-plan-background'
] as const;
const STUDY_PLAN_API_UNAVAILABLE_MESSAGE =
  'Study plan API route is unavailable. On Netlify, verify the /api rewrite. In local development, run the app with Netlify dev so the study-plan function is available.';
const BACKGROUND_POLL_INTERVAL_MS = 4000;
const BACKGROUND_POLL_TIMEOUT_MS  = 240_000; // 4 minutes

const FALLBACK_DOMAIN_NAMES: Record<number, string> = {
  1: 'Professional Practices',
  2: 'Student-Level Services',
  3: 'Systems-Level Services',
  4: 'Foundations'
};

interface UserProfileDoc {
  screenerComplete?: boolean;
  screenerResults?: {
    domain_scores?: Record<number, number>;
    completed_at?: unknown;
  };
}

interface StudyInputResponse {
  skill_id: string;
  skill_name: string;
  domain_id: number;
  domain_name: string;
  is_correct: boolean;
  confidence: string;
  distractor_selected: string | null;
  assessment_type: 'screener' | 'diagnostic' | 'full';
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export interface StudyPlanSummary {
  readiness: string;
  overview: string;
  nextBestMove: string;
}

export interface StudyPlanDomainAnalysis {
  domainId: number;
  domainName: string;
  score: number | null;
  analysis: string;
  nextSteps: string[];
}

export interface StudyPlanPrioritySkill {
  skillId: string;
  skillName: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface StudyPlanVocabularyGap {
  term: string;
  meaning: string;
  whyItMatters: string;
}

export interface StudyPlanFoundationalReview {
  skillId: string;
  skillName: string;
  whyNow: string;
  reviewActions: string[];
}

export interface StudyPlanResource {
  title: string;
  resourceType: string;
  focusArea: string;
  whyItHelps: string;
  action: string;
}

export interface StudyPlanChecklistItem {
  skillId: string;
  skillName: string;
  currentScore: number | null;
  targetScore: number;
  category: 'deficit' | 'foundational';
  note: string;
}

export interface FinalAssessmentGateStatus {
  unlocked: boolean;
  thresholdPercent: number;
  remainingSkillCount: number;
  remainingSkills: string[];
  guidance: string;
}

export interface StudyPlanPhase {
  phase: string;
  goal: string;
  actions: string[];
}

export interface WeeklyScheduleDay {
  day: string;
  durationMinutes: number;
  focus: string;
  tasks: string[];
}

export interface StudyPlanContent {
  summary: StudyPlanSummary;
  domainAnalysis: StudyPlanDomainAnalysis[];
  prioritySkills: StudyPlanPrioritySkill[];
  vocabularyGaps: StudyPlanVocabularyGap[];
  foundationalReview: StudyPlanFoundationalReview[];
  studyResources: StudyPlanResource[];
  masteryChecklist: StudyPlanChecklistItem[];
  finalAssessmentGate: FinalAssessmentGateStatus | null;
  studyPlan: StudyPlanPhase[];
  weeklySchedule: WeeklyScheduleDay[];
}

export interface StudyPlanDocument {
  plan: StudyPlanContent;
  generatedAt: string;
  model: string;
  sourceSummary: {
    screenerResponseCount: number;
    assessmentResponseCount: number;
    flaggedSkillCount: number;
    domainScoreCount: number;
    deficitSkillCount: number;
  };
}

interface GenerateStudyPlanArgs {
  userId: string;
  idToken: string;
  skills: Skill[];
  domains: Domain[];
}

// Using Supabase instead
// function getStudyPlanDocRef(userId: string) {
//   return doc(db, 'studyPlans', userId, 'plans', 'latest');
// }

function buildDomainLookup(domains: Domain[]): Map<number, string> {
  const lookup = new Map<number, string>();

  for (const domain of domains) {
    const numericId = Number(domain.id);
    if (!Number.isNaN(numericId) && domain.name) {
      lookup.set(numericId, domain.name);
    }
  }

  for (const [id, name] of Object.entries(FALLBACK_DOMAIN_NAMES)) {
    const numericId = Number(id);
    const currentName = lookup.get(numericId);
    if (!currentName || currentName === `Domain ${numericId}`) {
      lookup.set(numericId, name);
    }
  }

  return lookup;
}

function buildSkillLookup(skills: Skill[]): Map<string, string> {
  return new Map(
    skills
      .filter(skill => Boolean(skill.id))
      .map(skill => [skill.id, skill.name || `Skill ${skill.id}`])
  );
}

function getDistractorSelected(response: {
  isCorrect?: boolean;
  is_correct?: boolean;
  selectedAnswers?: string[];
  correctAnswers?: string[];
  selected_answer?: string;
  correct_answer?: string;
}): string | null {
  if (response.isCorrect === true || response.is_correct === true) {
    return null;
  }

  if (typeof response.selected_answer === 'string') {
    return response.selected_answer.split(',').map(value => value.trim()).find(Boolean) ?? null;
  }

  const selectedAnswers = Array.isArray(response.selectedAnswers) ? response.selectedAnswers : [];
  const correctAnswers = Array.isArray(response.correctAnswers) ? response.correctAnswers : [];
  return selectedAnswers.find(answer => !correctAnswers.includes(answer)) ?? selectedAnswers[0] ?? null;
}

interface SkillEvidenceCard {
  skillId: string;
  skillName: string;
  currentScore: number | null;
  domainId: number | null;
  domainName: string;
  decisionRule: string | null;
  requiredEvidence: string | null;
  commonWrongRules: string[];
  prerequisites: Array<{
    skillId: string;
    skillName: string;
    currentScore: number | null;
  }>;
}

function buildSkillDomainLookup(studyInputs: {
  screenerResponses: StudyInputResponse[];
  assessmentResponses: StudyInputResponse[];
}): Map<string, { domainId: number; domainName: string }> {
  const lookup = new Map<string, { domainId: number; domainName: string }>();

  for (const response of [...studyInputs.screenerResponses, ...studyInputs.assessmentResponses]) {
    if (!lookup.has(response.skill_id)) {
      lookup.set(response.skill_id, {
        domainId: response.domain_id,
        domainName: response.domain_name
      });
    }
  }

  return lookup;
}

function buildSkillEvidenceCards(
  globalScores: ReturnType<typeof calculateGlobalScoresFromData>,
  skillLookup: Map<string, string>,
  studyInputs: {
    screenerResponses: StudyInputResponse[];
    assessmentResponses: StudyInputResponse[];
  }
): SkillEvidenceCard[] {
  const skillDomainLookup = buildSkillDomainLookup(studyInputs);

  return Object.entries(globalScores.skillScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 12)
    .map(([skillId, currentScore]) => {
      const metadata = getSkillById(skillId);
      const domainInfo = skillDomainLookup.get(skillId);

      return {
        skillId,
        skillName: skillLookup.get(skillId) || metadata?.name || `Skill ${skillId}`,
        currentScore,
        domainId: domainInfo?.domainId ?? null,
        domainName: domainInfo?.domainName || `Domain ${domainInfo?.domainId ?? 'unknown'}`,
        decisionRule: metadata?.decisionRule ?? null,
        requiredEvidence: metadata?.requiredEvidence ?? null,
        commonWrongRules: metadata?.commonWrongRules?.slice(0, 3) ?? [],
        prerequisites: (metadata?.prerequisites ?? []).map((prereqId) => ({
          skillId: prereqId,
          skillName: skillLookup.get(prereqId) || getSkillById(prereqId)?.name || prereqId,
          currentScore: globalScores.skillScores[prereqId] ?? null
        }))
      };
    });
}

function buildFinalAssessmentGateStatus(
  globalScores: ReturnType<typeof calculateGlobalScoresFromData>,
  skillLookup: Map<string, string>
): FinalAssessmentGateStatus {
  const remainingDeficitSkills = Object.entries(globalScores.skillScores)
    .filter(([, score]) => score < FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .map(([skillId, score]) => `${skillLookup.get(skillId) || getSkillById(skillId)?.name || skillId} (${score}%)`);

  const unlocked = remainingDeficitSkills.length === 0 && Object.keys(globalScores.skillScores).length > 0;

  return {
    unlocked,
    thresholdPercent: FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD,
    remainingSkillCount: remainingDeficitSkills.length,
    remainingSkills: remainingDeficitSkills.slice(0, 12),
    guidance: unlocked
      ? 'All currently tracked deficit skills are at or above 60%. This learner would be ready for the planned final full assessment once that flow is implemented.'
      : `${remainingDeficitSkills.length} tracked deficit skills are still below 60%. Use the checklist below to close those gaps before unlocking the planned final full assessment.`
  };
}

function buildMasteryChecklist(
  globalScores: ReturnType<typeof calculateGlobalScoresFromData>,
  skillLookup: Map<string, string>
): StudyPlanChecklistItem[] {
  const checklist: StudyPlanChecklistItem[] = [];
  const seenSkills = new Set<string>();

  const deficitSkills = Object.entries(globalScores.skillScores)
    .filter(([, score]) => score < FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD)
    .sort((a, b) => a[1] - b[1]);

  for (const [skillId, currentScore] of deficitSkills) {
    if (seenSkills.has(skillId)) {
      continue;
    }

    checklist.push({
      skillId,
      skillName: skillLookup.get(skillId) || getSkillById(skillId)?.name || skillId,
      currentScore,
      targetScore: FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD,
      category: 'deficit',
      note: 'Raise this tracked deficit skill to at least 60% before the final full assessment unlocks.'
    });
    seenSkills.add(skillId);
  }

  for (const [skillId] of deficitSkills) {
    const metadata = getSkillById(skillId);
    for (const prereqId of metadata?.prerequisites ?? []) {
      const prereqScore = globalScores.skillScores[prereqId] ?? null;
      if (seenSkills.has(prereqId)) {
        continue;
      }
      if (prereqScore !== null && prereqScore >= FOUNDATIONAL_REVIEW_TARGET) {
        continue;
      }

      checklist.push({
        skillId: prereqId,
        skillName: skillLookup.get(prereqId) || getSkillById(prereqId)?.name || prereqId,
        currentScore: prereqScore,
        targetScore: FOUNDATIONAL_REVIEW_TARGET,
        category: 'foundational',
        note: 'Strengthen this prerequisite so the deficit skills built on top of it become easier to raise.'
      });
      seenSkills.add(prereqId);
    }
  }

  return checklist.slice(0, 16);
}

export function normalizeStudyInputs(
  scoreInputs: GlobalScoreInputs,
  domainLookup: Map<number, string>,
  skillLookup: Map<string, string>
): {
  screenerResponses: StudyInputResponse[];
  assessmentResponses: StudyInputResponse[];
} {
  const screenerResponses: StudyInputResponse[] = scoreInputs.screenerResponses
    .map(response => {
      const domainId = Number(response.domain_id);
      const skillId = String(response.skill_id || 'unknown');

      if (!Number.isFinite(domainId)) {
        return null;
      }

      return {
        skill_id: skillId,
        skill_name: skillLookup.get(skillId) || `Skill ${skillId}`,
        domain_id: domainId,
        domain_name: domainLookup.get(domainId) || `Domain ${domainId}`,
        is_correct: Boolean(response.is_correct),
        confidence: response.confidence || 'unknown',
        distractor_selected: getDistractorSelected(response),
        assessment_type: 'screener' as const
      };
    })
    .filter(isDefined);

  const assessmentResponses: StudyInputResponse[] = scoreInputs.responseLogs
    .filter(response => response.assessmentType === 'diagnostic' || response.assessmentType === 'full')
    .flatMap(response => {
      const domainIds = Array.isArray(response.domainIds)
        ? response.domainIds.map(Number).filter(domainId => Number.isFinite(domainId))
        : (response.domainId !== undefined && response.domainId !== null ? [Number(response.domainId)].filter(domainId => Number.isFinite(domainId)) : []);
      const skillId = String(response.skillId || 'unknown');
      const distractorSelected = getDistractorSelected(response);
      const assessmentType: StudyInputResponse['assessment_type'] =
        response.assessmentType === 'full' ? 'full' : 'diagnostic';

      return domainIds.map(domainId => ({
        skill_id: skillId,
        skill_name: skillLookup.get(skillId) || `Skill ${skillId}`,
        domain_id: domainId,
        domain_name: domainLookup.get(domainId) || `Domain ${domainId}`,
        is_correct: Boolean(response.isCorrect),
        confidence: response.confidence || 'unknown',
        distractor_selected: distractorSelected,
        assessment_type: assessmentType
      }));
    });

  return {
    screenerResponses,
    assessmentResponses
  };
}

function buildPrompt({
  screenerSummary,
  globalScores,
  studyInputs,
  skillLookup
}: {
  screenerSummary: UserProfileDoc['screenerResults'];
  globalScores: ReturnType<typeof calculateGlobalScoresFromData>;
  studyInputs: {
    screenerResponses: StudyInputResponse[];
    assessmentResponses: StudyInputResponse[];
  };
  skillLookup: Map<string, string>;
}): string {
  const domainScores = Object.entries(globalScores.domainScores).map(([domainId, score]) => ({
    domainId: Number(domainId),
    score,
    domainName:
      studyInputs.screenerResponses.find(response => response.domain_id === Number(domainId))?.domain_name ||
      studyInputs.assessmentResponses.find(response => response.domain_id === Number(domainId))?.domain_name ||
      FALLBACK_DOMAIN_NAMES[Number(domainId)] ||
      `Domain ${domainId}`
  }));

  const flaggedSkills = globalScores.flaggedSkills.map(skillId => ({
    skillId,
    skillName:
      studyInputs.screenerResponses.find(response => response.skill_id === skillId)?.skill_name ||
      studyInputs.assessmentResponses.find(response => response.skill_id === skillId)?.skill_name ||
      `Skill ${skillId}`
  }));

  const weakestSkills = Object.entries(globalScores.skillScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 12)
    .map(([skillId, score]) => ({
      skillId,
      skillName:
        studyInputs.screenerResponses.find(response => response.skill_id === skillId)?.skill_name ||
        studyInputs.assessmentResponses.find(response => response.skill_id === skillId)?.skill_name ||
        `Skill ${skillId}`,
      score
    }));

  const skillEvidenceCards = buildSkillEvidenceCards(globalScores, skillLookup, studyInputs);
  const finalAssessmentGate = buildFinalAssessmentGateStatus(globalScores, skillLookup);

  const payload = {
    screenerSummary: screenerSummary || null,
    globalReadiness: globalScores.globalReadiness,
    globalDomainScores: domainScores,
    flaggedHighConfidenceWrongSkills: flaggedSkills,
    weakestSkillScores: weakestSkills,
    skillEvidenceCards,
    finalAssessmentGate,
    screenerResponses: studyInputs.screenerResponses,
    assessmentResponses: studyInputs.assessmentResponses
  };

  return [
    'You are generating a personalized Praxis School Psychology study guide from assessment data.',
    'Return JSON only. Do not wrap the response in markdown fences. Do not include commentary before or after the JSON.',
    'Use the exact top-level shape:',
    JSON.stringify(
      {
        summary: {
          readiness: 'string',
          overview: 'string',
          nextBestMove: 'string'
        },
        domainAnalysis: [
          {
            domainId: 1,
            domainName: 'string',
            score: 0,
            analysis: 'string',
            nextSteps: ['string']
          }
        ],
        prioritySkills: [
          {
            skillId: 'string',
            skillName: 'string',
            reason: 'string',
            urgency: 'high'
          }
        ],
        vocabularyGaps: [
          {
            term: 'string',
            meaning: 'string',
            whyItMatters: 'string'
          }
        ],
        foundationalReview: [
          {
            skillId: 'string',
            skillName: 'string',
            whyNow: 'string',
            reviewActions: ['string']
          }
        ],
        studyResources: [
          {
            title: 'string',
            resourceType: 'string',
            focusArea: 'string',
            whyItHelps: 'string',
            action: 'string'
          }
        ],
        studyPlan: [
          {
            phase: 'string',
            goal: 'string',
            actions: ['string']
          }
        ],
        weeklySchedule: [
          {
            day: 'string',
            durationMinutes: 30,
            focus: 'string',
            tasks: ['string']
          }
        ]
      },
      null,
      2
    ),
    'Requirements:',
    '- Tie all recommendations directly to the provided data.',
    '- Prioritize domain and skill weaknesses, especially high-confidence wrong skills.',
    '- Use the skill evidence cards to ground vocabulary terms, foundational review, and remediation advice.',
    '- `studyResources` must only reference grounded, in-product study moves such as decision-rule review, prerequisite review, vocabulary review, domain review, skill practice, and wrong-answer review. Do not invent external links, books, or websites.',
    '- `foundationalReview` should focus on prerequisite skills that support weaker or flagged skills.',
    '- Keep the tone practical and specific for one learner.',
    '- Provide 3 to 6 items for each array section unless the data strongly supports fewer.',
    '- Keep each string concise but actionable.',
    '- Use null for any missing numeric score instead of inventing a value.',
    '',
    'Assessment data:',
    JSON.stringify(payload, null, 2)
  ].join('\n');
}

function stripCodeFences(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractJsonObject(content: string): string {
  const stripped = stripCodeFences(content);
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Study plan response did not contain valid JSON.');
  }

  return stripped.slice(firstBrace, lastBrace + 1);
}

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid study plan field: ${path}`);
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid study plan field: ${path}`);
  }

  return value.trim();
}

function asNullableNumber(value: unknown, path: string): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid study plan field: ${path}`);
  }

  return value;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid study plan field: ${path}`);
  }

  return value;
}

function asStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid study plan field: ${path}`);
  }

  return value.map((item, index) => asString(item, `${path}[${index}]`));
}


/**
 * Trigger the background Netlify function, then poll study_plans until
 * a new row appears (created after requestedAt). Returns the complete
 * StudyPlanDocument assembled from the DB row.
 *
 * The background function calls Claude, saves the full plan to study_plans,
 * and exits. The 202 the client receives is Netlify's acknowledgment —
 * NOT the plan itself.
 */
async function requestStudyPlanBackground(
  requestBody: StudyPlanApiRequest,
  idToken: string,
  userId: string,
  masteryChecklist: StudyPlanChecklistItem[],
  finalAssessmentGate: FinalAssessmentGateStatus
): Promise<StudyPlanDocument> {
  const requestedAt = requestBody.requestedAt ?? new Date().toISOString();

  // POST to background function; expect 202 (Netlify background) or fall back
  let triggered = false;
  for (const endpoint of STUDY_PLAN_BACKGROUND_PATHS) {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ ...requestBody, preComputedAddons: { masteryChecklist, finalAssessmentGate } })
      });
    } catch {
      continue;
    }

    if (res.status === 202 || res.ok) { triggered = true; break; }
    // 404/405/HTML → try next path
    const rawBody = await res.text().catch(() => '');
    const isUnavailable = res.status === 404 || res.status === 405 || rawBody.trim().toLowerCase().startsWith('<!doctype');
    if (isUnavailable) continue;
    // Explicit error from the function
    const payload = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    throw new Error(payload?.error ?? 'Background study plan request failed.');
  }

  if (!triggered) {
    throw new Error(STUDY_PLAN_API_UNAVAILABLE_MESSAGE);
  }

  // Poll study_plans for the new row
  const deadline = Date.now() + BACKGROUND_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, BACKGROUND_POLL_INTERVAL_MS));

    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .gt('created_at', requestedAt)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) continue;

    const rawDocument = data.plan_document as Record<string, unknown>;
    try {
      return normalizeStudyPlanDocument(rawDocument);
    } catch (parseErr) {
      console.error('[StudyPlan] Failed to parse polled plan:', parseErr);
      throw new Error('Study plan data could not be parsed after generation. Please try again.');
    }
  }

  throw new Error('Study plan generation timed out after 4 minutes. Please try again.');
}

function parseStudyPlanContent(rawContent: string): StudyPlanContent {
  const parsed = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;
  const summary = asObject(parsed.summary, 'summary');

  const domainAnalysis = Array.isArray(parsed.domainAnalysis) ? parsed.domainAnalysis : null;
  const prioritySkills = Array.isArray(parsed.prioritySkills) ? parsed.prioritySkills : null;
  const vocabularyGaps = Array.isArray(parsed.vocabularyGaps) ? parsed.vocabularyGaps : null;
  const foundationalReview = Array.isArray(parsed.foundationalReview) ? parsed.foundationalReview : [];
  const studyResources = Array.isArray(parsed.studyResources) ? parsed.studyResources : [];
  const masteryChecklist = Array.isArray(parsed.masteryChecklist) ? parsed.masteryChecklist : [];
  const studyPlan = Array.isArray(parsed.studyPlan) ? parsed.studyPlan : null;
  const weeklySchedule = Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule : null;

  if (!domainAnalysis || !prioritySkills || !vocabularyGaps || !studyPlan || !weeklySchedule) {
    throw new Error('Study plan response is missing one or more required sections.');
  }

  return {
    summary: {
      readiness: asString(summary.readiness, 'summary.readiness'),
      overview: asString(summary.overview, 'summary.overview'),
      nextBestMove: asString(summary.nextBestMove, 'summary.nextBestMove')
    },
    domainAnalysis: domainAnalysis.map((item, index) => {
      const section = asObject(item, `domainAnalysis[${index}]`);
      return {
        domainId: asNumber(section.domainId, `domainAnalysis[${index}].domainId`),
        domainName: asString(section.domainName, `domainAnalysis[${index}].domainName`),
        score: asNullableNumber(section.score, `domainAnalysis[${index}].score`),
        analysis: asString(section.analysis, `domainAnalysis[${index}].analysis`),
        nextSteps: asStringArray(section.nextSteps, `domainAnalysis[${index}].nextSteps`)
      };
    }),
    prioritySkills: prioritySkills.map((item, index) => {
      const section = asObject(item, `prioritySkills[${index}]`);
      const urgency = asString(section.urgency, `prioritySkills[${index}].urgency`);

      if (urgency !== 'high' && urgency !== 'medium' && urgency !== 'low') {
        throw new Error(`Invalid study plan field: prioritySkills[${index}].urgency`);
      }

      return {
        skillId: asString(section.skillId, `prioritySkills[${index}].skillId`),
        skillName: asString(section.skillName, `prioritySkills[${index}].skillName`),
        reason: asString(section.reason, `prioritySkills[${index}].reason`),
        urgency
      };
    }),
    vocabularyGaps: vocabularyGaps.map((item, index) => {
      const section = asObject(item, `vocabularyGaps[${index}]`);
      return {
        term: asString(section.term, `vocabularyGaps[${index}].term`),
        meaning: asString(section.meaning, `vocabularyGaps[${index}].meaning`),
        whyItMatters: asString(section.whyItMatters, `vocabularyGaps[${index}].whyItMatters`)
      };
    }),
    foundationalReview: foundationalReview.map((item, index) => {
      const section = asObject(item, `foundationalReview[${index}]`);
      return {
        skillId: asString(section.skillId, `foundationalReview[${index}].skillId`),
        skillName: asString(section.skillName, `foundationalReview[${index}].skillName`),
        whyNow: asString(section.whyNow, `foundationalReview[${index}].whyNow`),
        reviewActions: asStringArray(section.reviewActions, `foundationalReview[${index}].reviewActions`)
      };
    }),
    studyResources: studyResources.map((item, index) => {
      const section = asObject(item, `studyResources[${index}]`);
      return {
        title: asString(section.title, `studyResources[${index}].title`),
        resourceType: asString(section.resourceType, `studyResources[${index}].resourceType`),
        focusArea: asString(section.focusArea, `studyResources[${index}].focusArea`),
        whyItHelps: asString(section.whyItHelps, `studyResources[${index}].whyItHelps`),
        action: asString(section.action, `studyResources[${index}].action`)
      };
    }),
    masteryChecklist: masteryChecklist.map((item, index) => {
      const section = asObject(item, `masteryChecklist[${index}]`);
      const category = asString(section.category, `masteryChecklist[${index}].category`);

      if (category !== 'deficit' && category !== 'foundational') {
        throw new Error(`Invalid study plan field: masteryChecklist[${index}].category`);
      }

      return {
        skillId: asString(section.skillId, `masteryChecklist[${index}].skillId`),
        skillName: asString(section.skillName, `masteryChecklist[${index}].skillName`),
        currentScore: section.currentScore === null || section.currentScore === undefined
          ? null
          : asNullableNumber(section.currentScore, `masteryChecklist[${index}].currentScore`),
        targetScore: asNumber(section.targetScore, `masteryChecklist[${index}].targetScore`),
        category,
        note: asString(section.note, `masteryChecklist[${index}].note`)
      };
    }),
    finalAssessmentGate: parsed.finalAssessmentGate
      ? (() => {
          const gate = asObject(parsed.finalAssessmentGate, 'finalAssessmentGate');
          return {
            unlocked: Boolean(gate.unlocked),
            thresholdPercent: asNumber(gate.thresholdPercent, 'finalAssessmentGate.thresholdPercent'),
            remainingSkillCount: asNumber(gate.remainingSkillCount, 'finalAssessmentGate.remainingSkillCount'),
            remainingSkills: asStringArray(gate.remainingSkills, 'finalAssessmentGate.remainingSkills'),
            guidance: asString(gate.guidance, 'finalAssessmentGate.guidance')
          };
        })()
      : null,
    studyPlan: studyPlan.map((item, index) => {
      const section = asObject(item, `studyPlan[${index}]`);
      return {
        phase: asString(section.phase, `studyPlan[${index}].phase`),
        goal: asString(section.goal, `studyPlan[${index}].goal`),
        actions: asStringArray(section.actions, `studyPlan[${index}].actions`)
      };
    }),
    weeklySchedule: weeklySchedule.map((item, index) => {
      const section = asObject(item, `weeklySchedule[${index}]`);
      return {
        day: asString(section.day, `weeklySchedule[${index}].day`),
        durationMinutes: asNumber(section.durationMinutes, `weeklySchedule[${index}].durationMinutes`),
        focus: asString(section.focus, `weeklySchedule[${index}].focus`),
        tasks: asStringArray(section.tasks, `weeklySchedule[${index}].tasks`)
      };
    })
  };
}

function normalizeStudyPlanDocument(data: Record<string, unknown>): StudyPlanDocument {
  const parsedPlan = parseStudyPlanContent(JSON.stringify(data.plan));
  return {
    plan: {
      ...parsedPlan,
      masteryChecklist: parsedPlan.masteryChecklist ?? [],
      finalAssessmentGate: parsedPlan.finalAssessmentGate ?? null
    },
    generatedAt: asString(data.generatedAt, 'generatedAt'),
    model: asString(data.model, 'model'),
    sourceSummary: (() => {
      const sourceSummary = asObject(data.sourceSummary, 'sourceSummary');
      return {
        screenerResponseCount: asNumber(
          sourceSummary.screenerResponseCount,
          'sourceSummary.screenerResponseCount'
        ),
        assessmentResponseCount: asNumber(
          sourceSummary.assessmentResponseCount ?? sourceSummary.diagnosticResponseCount,
          'sourceSummary.assessmentResponseCount'
        ),
        flaggedSkillCount: asNumber(
          sourceSummary.flaggedSkillCount,
          'sourceSummary.flaggedSkillCount'
        ),
        domainScoreCount: asNumber(
          sourceSummary.domainScoreCount,
          'sourceSummary.domainScoreCount'
        ),
        deficitSkillCount: asNumber(
          sourceSummary.deficitSkillCount ?? 0,
          'sourceSummary.deficitSkillCount'
        )
      };
    })()
  };
}

export async function getLatestStudyPlan(userId: string): Promise<StudyPlanDocument | null> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('[getLatestStudyPlan] Supabase error:', error);
    }
    return null;
  }

  // Assuming `data.plan_document` stores the JSON matching StudyPlanDocument structure
  const rawDocument = data.plan_document as Record<string, unknown>;
  return normalizeStudyPlanDocument(rawDocument);
}

export async function generateStudyPlan({
  userId,
  idToken,
  skills,
  domains
}: GenerateStudyPlanArgs): Promise<StudyPlanDocument> {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!idToken) {
    throw new Error('idToken is required');
  }

  const { data: profileRow } = await supabase
    .from('user_progress')
    .select('screener_complete, screener_results')
    .eq('user_id', userId)
    .single();
    
  const scoreInputs = await fetchGlobalScoreInputs(userId);

  const profile = profileRow ? {
    screenerComplete: profileRow.screener_complete,
    screenerResults: profileRow.screener_results as any,
  } : {} as UserProfileDoc;

  if (!profile.screenerComplete) {
    throw new Error('Complete the screener before generating a study guide.');
  }

  const domainLookup = buildDomainLookup(domains);
  const skillLookup = buildSkillLookup(skills);
  const studyInputs = normalizeStudyInputs(scoreInputs, domainLookup, skillLookup);

  if (studyInputs.assessmentResponses.length === 0) {
    throw new Error('Complete the full assessment before generating a study guide.');
  }

  const globalScores = calculateGlobalScoresFromData(scoreInputs);
  const finalAssessmentGate = buildFinalAssessmentGateStatus(globalScores, skillLookup);
  const masteryChecklist = buildMasteryChecklist(globalScores, skillLookup);
  const sourceSummary = {
    screenerResponseCount: studyInputs.screenerResponses.length,
    assessmentResponseCount: studyInputs.assessmentResponses.length,
    flaggedSkillCount: globalScores.flaggedSkills.length,
    domainScoreCount: Object.keys(globalScores.domainScores).length,
    deficitSkillCount: finalAssessmentGate.remainingSkillCount
  };
  const prompt = buildPrompt({
    screenerSummary: profile.screenerResults,
    globalScores,
    studyInputs,
    skillLookup
  });

  const requestedAt = new Date().toISOString();
  const requestBody: StudyPlanApiRequest = {
    userId,
    prompt,
    sourceSummary,
    requestedAt
  };

  // Use the background function (no sync timeout risk).
  // It calls Claude, saves the complete plan to study_plans, and we poll.
  return await requestStudyPlanBackground(
    requestBody,
    idToken,
    userId,
    masteryChecklist,
    finalAssessmentGate
  );
}
