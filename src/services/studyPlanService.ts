import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Domain, Skill } from '../types/content';
import {
  GlobalScoreInputs,
  calculateGlobalScoresFromData,
  fetchGlobalScoreInputs
} from '../utils/globalScoreCalculator';

const STUDY_PLAN_MODEL = 'claude-sonnet-4-20250514';

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
  studyPlan: StudyPlanPhase[];
  weeklySchedule: WeeklyScheduleDay[];
}

export interface StudyPlanDocument {
  plan: StudyPlanContent;
  generatedAt: string;
  model: string;
  sourceSummary: {
    screenerResponseCount: number;
    diagnosticResponseCount: number;
    flaggedSkillCount: number;
    domainScoreCount: number;
  };
}

interface GenerateStudyPlanArgs {
  userId: string;
  idToken: string;
  skills: Skill[];
  domains: Domain[];
}

function getStudyPlanDocRef(userId: string) {
  return doc(db, 'studyPlans', userId, 'plans', 'latest');
}

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

function normalizeStudyInputs(
  scoreInputs: GlobalScoreInputs,
  domainLookup: Map<number, string>,
  skillLookup: Map<string, string>
): {
  screenerResponses: StudyInputResponse[];
  diagnosticResponses: StudyInputResponse[];
} {
  const screenerResponses = scoreInputs.screenerResponses
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
    .filter((response): response is StudyInputResponse => response !== null);

  const diagnosticResponses = scoreInputs.responseLogs
    .filter(response => response.assessmentType === 'diagnostic' || response.assessmentType === 'full')
    .flatMap(response => {
      const domainIds = Array.isArray(response.domainIds)
        ? response.domainIds.map(Number).filter(domainId => Number.isFinite(domainId))
        : (response.domainId !== undefined && response.domainId !== null ? [Number(response.domainId)].filter(domainId => Number.isFinite(domainId)) : []);
      const skillId = String(response.skillId || 'unknown');
      const distractorSelected = getDistractorSelected(response);
      const assessmentType = response.assessmentType === 'full' ? 'full' : 'diagnostic';

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
    diagnosticResponses
  };
}

function buildPrompt({
  screenerSummary,
  globalScores,
  studyInputs
}: {
  screenerSummary: UserProfileDoc['screenerResults'];
  globalScores: ReturnType<typeof calculateGlobalScoresFromData>;
  studyInputs: {
    screenerResponses: StudyInputResponse[];
    diagnosticResponses: StudyInputResponse[];
  };
}): string {
  const domainScores = Object.entries(globalScores.domainScores).map(([domainId, score]) => ({
    domainId: Number(domainId),
    score,
    domainName:
      studyInputs.screenerResponses.find(response => response.domain_id === Number(domainId))?.domain_name ||
      studyInputs.diagnosticResponses.find(response => response.domain_id === Number(domainId))?.domain_name ||
      FALLBACK_DOMAIN_NAMES[Number(domainId)] ||
      `Domain ${domainId}`
  }));

  const flaggedSkills = globalScores.flaggedSkills.map(skillId => ({
    skillId,
    skillName:
      studyInputs.screenerResponses.find(response => response.skill_id === skillId)?.skill_name ||
      studyInputs.diagnosticResponses.find(response => response.skill_id === skillId)?.skill_name ||
      `Skill ${skillId}`
  }));

  const weakestSkills = Object.entries(globalScores.skillScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 12)
    .map(([skillId, score]) => ({
      skillId,
      skillName:
        studyInputs.screenerResponses.find(response => response.skill_id === skillId)?.skill_name ||
        studyInputs.diagnosticResponses.find(response => response.skill_id === skillId)?.skill_name ||
        `Skill ${skillId}`,
      score
    }));

  const payload = {
    screenerSummary: screenerSummary || null,
    globalReadiness: globalScores.globalReadiness,
    globalDomainScores: domainScores,
    flaggedHighConfidenceWrongSkills: flaggedSkills,
    weakestSkillScores: weakestSkills,
    screenerResponses: studyInputs.screenerResponses,
    diagnosticResponses: studyInputs.diagnosticResponses
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

function parseStudyPlanContent(rawContent: string): StudyPlanContent {
  const parsed = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;
  const summary = asObject(parsed.summary, 'summary');

  const domainAnalysis = Array.isArray(parsed.domainAnalysis) ? parsed.domainAnalysis : null;
  const prioritySkills = Array.isArray(parsed.prioritySkills) ? parsed.prioritySkills : null;
  const vocabularyGaps = Array.isArray(parsed.vocabularyGaps) ? parsed.vocabularyGaps : null;
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
  return {
    plan: parseStudyPlanContent(JSON.stringify(data.plan)),
    generatedAt: asString(data.generatedAt, 'generatedAt'),
    model: asString(data.model, 'model'),
    sourceSummary: {
      screenerResponseCount: asNumber(
        asObject(data.sourceSummary, 'sourceSummary').screenerResponseCount,
        'sourceSummary.screenerResponseCount'
      ),
      diagnosticResponseCount: asNumber(
        asObject(data.sourceSummary, 'sourceSummary').diagnosticResponseCount,
        'sourceSummary.diagnosticResponseCount'
      ),
      flaggedSkillCount: asNumber(
        asObject(data.sourceSummary, 'sourceSummary').flaggedSkillCount,
        'sourceSummary.flaggedSkillCount'
      ),
      domainScoreCount: asNumber(
        asObject(data.sourceSummary, 'sourceSummary').domainScoreCount,
        'sourceSummary.domainScoreCount'
      )
    }
  };
}

export async function getLatestStudyPlan(userId: string): Promise<StudyPlanDocument | null> {
  const planSnapshot = await getDoc(getStudyPlanDocRef(userId));

  if (!planSnapshot.exists()) {
    return null;
  }

  return normalizeStudyPlanDocument(planSnapshot.data() as Record<string, unknown>);
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

  const [profileSnapshot, scoreInputs] = await Promise.all([
    getDoc(doc(db, 'users', userId)),
    fetchGlobalScoreInputs(userId)
  ]);

  const profile = (profileSnapshot.exists() ? profileSnapshot.data() : {}) as UserProfileDoc;

  if (!profile.screenerComplete) {
    throw new Error('Complete the screener before generating a study guide.');
  }

  const domainLookup = buildDomainLookup(domains);
  const skillLookup = buildSkillLookup(skills);
  const studyInputs = normalizeStudyInputs(scoreInputs, domainLookup, skillLookup);

  if (studyInputs.diagnosticResponses.length === 0) {
    throw new Error('Complete a diagnostic or full assessment before generating a study guide.');
  }

  const globalScores = calculateGlobalScoresFromData(scoreInputs);
  const prompt = buildPrompt({
    screenerSummary: profile.screenerResults,
    globalScores,
    studyInputs
  });

  const response = await fetch('/api/study-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ prompt })
  });

  const responseBody = (await response.json().catch(() => ({}))) as { content?: string; error?: string };

  if (!response.ok || typeof responseBody.content !== 'string') {
    throw new Error(responseBody.error || 'Study plan generation failed. Please retry.');
  }

  const plan = parseStudyPlanContent(responseBody.content);
  const studyPlanDocument: StudyPlanDocument = {
    plan,
    generatedAt: new Date().toISOString(),
    model: STUDY_PLAN_MODEL,
    sourceSummary: {
      screenerResponseCount: studyInputs.screenerResponses.length,
      diagnosticResponseCount: studyInputs.diagnosticResponses.length,
      flaggedSkillCount: globalScores.flaggedSkills.length,
      domainScoreCount: Object.keys(globalScores.domainScores).length
    }
  };

  await setDoc(getStudyPlanDocRef(userId), studyPlanDocument);

  return studyPlanDocument;
}
