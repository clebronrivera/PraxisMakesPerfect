import { supabase } from '../config/supabase';
import { Domain, Skill } from '../types/content';
import {
  GlobalScoreInputs,
  calculateGlobalScoresFromData,
  fetchGlobalScoreInputs
} from '../utils/globalScoreCalculator';
import { type StudyPlanApiRequest } from '../types/studyPlanApi';
import {
  type StudyPlanDocumentV2,
  type StudyConstraints,
  type PrecomputedCluster,
  type WeeklyScheduleFrame,
} from '../types/studyPlanTypes';
import {
  computeStudentSkillStates,
  buildPrecomputedClusters,
  computeStudyTimeBudget,
  buildWeeklyScheduleFrame,
  enrichClusterSkillNames,
  buildDomainSummaries,
  type RawSkillResponse,
} from '../utils/studyPlanPreprocessor';

// ─── Constants ────────────────────────────────────────────────────────────────

const FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD = 60;
const STUDY_PLAN_BACKGROUND_PATHS = [
  '/api/study-plan-background',
  '/.netlify/functions/study-plan-background'
] as const;
const STUDY_PLAN_API_UNAVAILABLE_MESSAGE =
  'Study plan API route is unavailable. On Netlify, verify the /api rewrite. In local development, run the app with Netlify dev so the study-plan function is available.';
const BACKGROUND_POLL_INTERVAL_MS = 4000;
const BACKGROUND_POLL_TIMEOUT_MS  = 240_000; // 4 minutes

const FALLBACK_DOMAIN_NAMES: Record<number, string> = {
  1: 'Data-Based Decision Making & Accountability',
  2: 'Consultation & Collaboration',
  3: 'Academic Interventions & Instructional Support',
  4: 'Mental & Behavioral Health Services',
  5: 'School-Wide Practices to Promote Learning',
  6: 'Preventive & Responsive Services',
  7: 'Family-School Collaboration Services',
  8: 'Diversity in Development & Learning',
  9: 'Research & Program Evaluation',
  10: 'Legal, Ethical & Professional Practice',
};

// ─── Exported types (used by components) ─────────────────────────────────────

export type { StudyPlanDocumentV2 };

// Re-export top-level section types for component use
export type {
  ReadinessSnapshot,
  DataInterpretation,
  PriorityCluster,
  DomainStudyMap,
  VocabEntry,
  CasePattern,
  WeeklyPlanWeek,
  TacticalInstructions,
  CheckpointLogic,
  StudyConstraints,
  StudentSkillState,
  StudentSkillStatus,
  TrendDirection,
} from '../types/studyPlanTypes';

// ─── Internal helpers ─────────────────────────────────────────────────────────

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
  question_id?: string;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
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
    if (!lookup.has(numericId) || lookup.get(numericId) === `Domain ${numericId}`) {
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
  if (response.isCorrect === true || response.is_correct === true) return null;
  if (typeof response.selected_answer === 'string') {
    return response.selected_answer.split(',').map(v => v.trim()).find(Boolean) ?? null;
  }
  const selected = Array.isArray(response.selectedAnswers) ? response.selectedAnswers : [];
  const correct  = Array.isArray(response.correctAnswers)  ? response.correctAnswers  : [];
  return selected.find(a => !correct.includes(a)) ?? selected[0] ?? null;
}

// ─── Normalize raw score inputs to unified format ─────────────────────────────

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
      const skillId  = String(response.skill_id || 'unknown');
      if (!Number.isFinite(domainId)) return null;
      return {
        skill_id:    skillId,
        skill_name:  skillLookup.get(skillId) || `Skill ${skillId}`,
        domain_id:   domainId,
        domain_name: domainLookup.get(domainId) || `Domain ${domainId}`,
        is_correct:  Boolean(response.is_correct),
        confidence:  response.confidence || 'unknown',
        distractor_selected: getDistractorSelected(response),
        assessment_type: 'screener' as const,
        question_id: (response as any).question_id ?? undefined,
      };
    })
    .filter(isDefined);

  const assessmentResponses: StudyInputResponse[] = scoreInputs.responseLogs
    .filter(r => r.assessmentType === 'diagnostic' || r.assessmentType === 'full')
    .flatMap(response => {
      const domainIds = Array.isArray(response.domainIds)
        ? response.domainIds.map(Number).filter(Number.isFinite)
        : response.domainId !== undefined
          ? [Number(response.domainId)].filter(Number.isFinite)
          : [];
      const skillId     = String(response.skillId || 'unknown');
      const assessType: StudyInputResponse['assessment_type'] =
        response.assessmentType === 'full' ? 'full' : 'diagnostic';

      return domainIds.map(domainId => ({
        skill_id:    skillId,
        skill_name:  skillLookup.get(skillId) || `Skill ${skillId}`,
        domain_id:   domainId,
        domain_name: domainLookup.get(domainId) || `Domain ${domainId}`,
        is_correct:  Boolean(response.isCorrect),
        confidence:  response.confidence || 'unknown',
        distractor_selected: getDistractorSelected(response),
        assessment_type: assessType,
        question_id: (response as any).questionId ?? undefined,
      }));
    });

  return { screenerResponses, assessmentResponses };
}

// ─── Convert normalized responses → preprocessor input ───────────────────────

function toRawSkillResponses(responses: StudyInputResponse[]): RawSkillResponse[] {
  return responses.map(r => ({
    skillId:            r.skill_id,
    skillName:          r.skill_name,
    domainId:           r.domain_id,
    domainName:         r.domain_name,
    isCorrect:          r.is_correct,
    confidence:         r.confidence,
    distractorSelected: r.distractor_selected,
    questionId:         r.question_id,
  }));
}

// ─── Prompt builder (Layer 3: synthesis instructions only) ───────────────────

/**
 * Builds the prompt for Claude.
 *
 * The preprocessing layer has already done the analysis. Claude's job:
 *   - Interpret what the data pattern means (not re-narrate scores)
 *   - Write explanation, sequencing language, and concise synthesis
 *   - Fill text fields in the pre-structured output schema
 *   - Do NOT invent external resources, URLs, or unstated data
 */
function buildPromptV2({
  precomputedClusters,
  scheduleFrame,
  domainSummaries,
  studyConstraints,
  assessmentState,
}: {
  precomputedClusters: PrecomputedCluster[];
  scheduleFrame: WeeklyScheduleFrame[];
  domainSummaries: ReturnType<typeof buildDomainSummaries>;
  studyConstraints: StudyConstraints | null;
  assessmentState: {
    screenerComplete: boolean;
    assessmentComplete: boolean;
    totalResponses: number;
    flaggedSkillCount: number;
  };
}): string {

  // ── Section boundaries (prevent Claude from duplicating across sections) ──
  const SECTION_RULES = `
OUTPUT SECTION RULES — read before generating:
- readinessSnapshot: Short status only. Readiness level, timeline, 2–3 blockers, strongest area, single next move. NO analysis.
- dataInterpretation: Interpretation only. What the data PATTERN means, not score narration. 3–5 inferences. 2–3 urgent insights. NO scores repeated. NO action items.
- priorityClusters: Cross-domain groupings. Write whyItMatters and blockingNote per cluster. Fill recommendedContentTypes from: vocabulary, concept-explanation, case-application, law-memorization, compare-and-contrast, wrong-answer-analysis, mixed-retrieval. Do NOT duplicate domain maps.
- domainStudyMaps: Domain-by-domain content only. Write interpretation, contentToKnow, commonTraps, masteryIndicator. Pull keyVocabulary and caseTypesToRecognize from the retrieved content in each cluster. Do NOT repeat priority cluster text.
- vocabulary: Retrieval targets only. Only terms from weak skills and retrieved content. Do NOT repeat terms from domain maps.
- casePatterns: Scenario recognition only. Generate case archetypes from provided case types. Do NOT include vocabulary definitions or study tips.
- weeklyStudyPlan: Fill weekGoal, session focus, and 2–3 specific tasks per session based on cluster focus and session type. The session types and durations are pre-set — do NOT change them.
- tacticalInstructions: Exact actions for the next 1–2 study sessions (immediateActions), this week's goals (thisWeekGoals), and 2–3 things to avoid (avoidList).
- checkpointLogic: What to assess at week 2 (week2Check), what counts as meaningful progress midpoint (midpointAssessment), when to shift from remediation to mixed practice (shiftSignal), what signals readiness for full assessment (readinessSignal).
`.trim();

  // ── Precomputed payload ───────────────────────────────────────────────────
  const payload = {
    assessmentState,
    studyConstraints: studyConstraints ?? { intensity: 'moderate' },
    domainSummaries: domainSummaries.map(d => ({
      domainId:          d.domainId,
      domainName:        d.domainName,
      score:             d.score,
      deficitSkillCount: d.deficitSkillCount,
      skillCount:        d.skillCount,
    })),
    precomputedClusters: precomputedClusters.map(c => ({
      clusterName:             c.clusterName,
      urgency:                 c.urgency,
      allocatedMinutes:        c.allocatedMinutes,
      skills:                  c.skills,
      retrievedVocabulary:     c.retrievedVocabulary,
      retrievedMisconceptions: c.retrievedMisconceptions,
      retrievedCaseArchetypes: c.retrievedCaseArchetypes,
      retrievedLawsFrameworks: c.retrievedLawsFrameworks,
    })),
    weeklyScheduleFrame: scheduleFrame.map(w => ({
      weekNumber:      w.weekNumber,
      datesLabel:      w.datesLabel,
      clusterFocus:    w.clusterFocus,
      allocatedMinutes: w.allocatedMinutes,
      sessions:        w.sessions,
    })),
  };

  // ── Output schema ─────────────────────────────────────────────────────────
  const schema = {
    readinessSnapshot: {
      readinessLevel: 'early | developing | approaching | ready',
      summary: 'string',
      testTimeline: 'string or null',
      majorBlockers: ['string'],
      strongestArea: 'string',
      nextBestMove: 'string'
    },
    dataInterpretation: {
      headline: 'string — one sentence overall interpretation',
      patterns: ['string — 3 to 5 specific inferences about the data pattern'],
      urgentInsights: ['string — 2 to 3 things requiring immediate attention']
    },
    priorityClusters: [{
      clusterName: 'string — match provided cluster name',
      urgency: 'urgent_now | important_next | maintain',
      skills: [{ skillId: 'string', skillName: 'string', status: 'string', accuracy: 0, trend: 'string' }],
      whyItMatters: 'string — why this cluster matters for this student specifically',
      blockingNote: 'string or null — only if this cluster blocks assessment readiness',
      allocatedMinutes: 0,
      recommendedContentTypes: ['vocabulary | concept-explanation | case-application | law-memorization | compare-and-contrast | wrong-answer-analysis | mixed-retrieval']
    }],
    domainStudyMaps: [{
      domainId: 0,
      domainName: 'string',
      domainScore: 0,
      interpretation: 'string — WHY is this domain weak, not just that it is weak',
      contentToKnow: ['string — specific concepts, not generic study tips'],
      keyVocabulary: ['string — pulled from retrieved vocabulary for this domain'],
      caseTypesToRecognize: ['string — scenario types from retrieved case archetypes'],
      commonTraps: ['string — specific mistakes students make in this domain'],
      masteryIndicator: 'string — what consistent success looks like in this domain'
    }],
    vocabulary: [{
      term: 'string',
      plainDefinition: 'string — accessible, no jargon',
      whyItMatters: 'string — why this term shows up on the exam',
      whereItShowsUp: 'string — which skill or domain context',
      confusionRisk: 'string or null — similar term that trips students up'
    }],
    casePatterns: [{
      patternName: 'string',
      domainContext: 'string',
      cluesInScenario: ['string — what to notice in the vignette'],
      likelyQuestionAngle: 'string — what the question is probably testing',
      commonMistake: 'string — typical wrong interpretation'
    }],
    weeklyStudyPlan: [{
      weekNumber: 0,
      datesLabel: 'string or null',
      clusterFocus: 'string — match provided cluster focus',
      allocatedMinutes: 0,
      weekGoal: 'string',
      sessions: [{
        sessionLabel: 'string — match provided session label',
        durationMinutes: 0,
        sessionType: 'string — match provided session type',
        focus: 'string — specific focus for this session',
        tasks: ['string — 2 to 3 specific actionable tasks']
      }],
      checkpointQuestion: 'string — how will you know if you improved this week?'
    }],
    tacticalInstructions: {
      immediateActions: ['string — what to do in the next 1 to 2 study sessions'],
      thisWeekGoals: ['string — what to accomplish this week'],
      avoidList: ['string — 2 to 3 common time wasters for this specific student profile']
    },
    checkpointLogic: {
      week2Check: 'string — what to assess at week 2',
      midpointAssessment: 'string — what counts as meaningful progress at the midpoint',
      shiftSignal: 'string — when to shift from remediation to mixed practice',
      readinessSignal: 'string — what indicates readiness for the full assessment'
    }
  };

  return [
    'You are generating an evidence-based Praxis School Psychology study guide.',
    '',
    'The preprocessing layer has already done the analysis.',
    'Your role: write interpretation, explanation, sequencing language, and concise synthesis.',
    'Do NOT re-narrate scores. Do NOT invent external links, books, or websites.',
    'Do NOT change the session types, durations, or cluster structure — those are pre-set.',
    'Only use content from the provided retrieved vocabulary, misconceptions, and case archetypes.',
    '',
    SECTION_RULES,
    '',
    'Return JSON only. No markdown fences. No commentary before or after.',
    'Use the exact top-level schema:',
    JSON.stringify(schema, null, 2),
    '',
    'Rules:',
    '- All priorityClusters items must use the clusterName from the provided precomputedClusters.',
    '- All weeklyStudyPlan items must use the weekNumber, clusterFocus, and session structure from weeklyScheduleFrame.',
    '- vocabulary terms must come from retrievedVocabulary in the precomputedClusters. Do not add arbitrary terms.',
    '- casePatterns must be grounded in retrievedCaseArchetypes. Generate 1 pattern per archetype, max 8 total.',
    '- domainStudyMaps must cover every domain in domainSummaries with a score below 70 or a deficitSkillCount > 0.',
    '- Provide 3 to 6 items per array unless the data clearly supports fewer.',
    '- Keep strings concise and actionable. Avoid filler phrases.',
    '- For skills with fragilityFlag=true: append note to whyItMatters saying "This student answers correctly but self-rates low confidence — prioritize active retrieval practice."',
    '- schemaVersion must be "2".',
    '',
    'Assessment data (pre-processed):',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}

// ─── Parse and validate the Claude response ───────────────────────────────────

function asObject(v: unknown, p: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`Invalid field: ${p}`);
  return v as Record<string, unknown>;
}
function asString(v: unknown, p: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Invalid field: ${p}`);
  return v.trim();
}
function asNullableString(v: unknown, _p: string): string | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'string' ? v.trim() || null : null;
}
function asNumber(v: unknown, p: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`Invalid field: ${p}`);
  return v;
}
function asNullableNumber(v: unknown, _p: string): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  return null;
}
function asNullableStringArray(v: unknown, _p: string): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
}

function extractJsonObject(content: string): string {
  const stripped = content.trim()
    .replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = stripped.indexOf('{');
  const last  = stripped.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) throw new Error('No valid JSON in response.');
  return stripped.slice(first, last + 1);
}

function parseStudyPlanV2(rawContent: string): Omit<StudyPlanDocumentV2, 'generatedAt' | 'model' | 'sourceSummary' | 'studyConstraints' | 'schemaVersion'> {
  const parsed = JSON.parse(extractJsonObject(rawContent)) as Record<string, unknown>;

  // readinessSnapshot
  const rs = asObject(parsed.readinessSnapshot, 'readinessSnapshot');
  const readinessLevel = asString(rs.readinessLevel, 'readinessSnapshot.readinessLevel');
  if (!['early', 'developing', 'approaching', 'ready'].includes(readinessLevel)) {
    throw new Error(`Invalid readinessLevel: ${readinessLevel}`);
  }

  const readinessSnapshot = {
    readinessLevel: readinessLevel as StudyPlanDocumentV2['readinessSnapshot']['readinessLevel'],
    summary:       asString(rs.summary, 'readinessSnapshot.summary'),
    testTimeline:  asNullableString(rs.testTimeline, 'readinessSnapshot.testTimeline'),
    majorBlockers: asNullableStringArray(rs.majorBlockers, 'readinessSnapshot.majorBlockers'),
    strongestArea: asString(rs.strongestArea, 'readinessSnapshot.strongestArea'),
    nextBestMove:  asString(rs.nextBestMove, 'readinessSnapshot.nextBestMove'),
  };

  // dataInterpretation
  const di = asObject(parsed.dataInterpretation, 'dataInterpretation');
  const dataInterpretation = {
    headline:       asString(di.headline, 'dataInterpretation.headline'),
    patterns:       asNullableStringArray(di.patterns, 'dataInterpretation.patterns'),
    urgentInsights: asNullableStringArray(di.urgentInsights, 'dataInterpretation.urgentInsights'),
  };

  // priorityClusters
  const pcRaw = Array.isArray(parsed.priorityClusters) ? parsed.priorityClusters : [];
  const priorityClusters = pcRaw.map((item: unknown, i: number) => {
    const s = asObject(item, `priorityClusters[${i}]`);
    const urgency = asString(s.urgency, `priorityClusters[${i}].urgency`);
    if (!['urgent_now', 'important_next', 'maintain'].includes(urgency)) {
      throw new Error(`Invalid urgency at priorityClusters[${i}]: ${urgency}`);
    }
    return {
      clusterName:      asString(s.clusterName, `priorityClusters[${i}].clusterName`),
      urgency:          urgency as 'urgent_now' | 'important_next' | 'maintain',
      skills:           Array.isArray(s.skills) ? s.skills.map((sk: unknown, j: number) => {
        const skObj = asObject(sk, `priorityClusters[${i}].skills[${j}]`);
        return {
          skillId:   asString(skObj.skillId,   `...skills[${j}].skillId`),
          skillName: asString(skObj.skillName, `...skills[${j}].skillName`),
          status:    asString(skObj.status,    `...skills[${j}].status`) as any,
          accuracy:  asNullableNumber(skObj.accuracy, `...skills[${j}].accuracy`),
          trend:     asString(skObj.trend,     `...skills[${j}].trend`) as any,
        };
      }) : [],
      whyItMatters:             asString(s.whyItMatters, `priorityClusters[${i}].whyItMatters`),
      blockingNote:             asNullableString(s.blockingNote, `priorityClusters[${i}].blockingNote`),
      allocatedMinutes:         asNumber(s.allocatedMinutes, `priorityClusters[${i}].allocatedMinutes`),
      recommendedContentTypes:  asNullableStringArray(s.recommendedContentTypes, `priorityClusters[${i}].recommendedContentTypes`),
    };
  });

  // domainStudyMaps
  const dsmRaw = Array.isArray(parsed.domainStudyMaps) ? parsed.domainStudyMaps : [];
  const domainStudyMaps = dsmRaw.map((item: unknown, i: number) => {
    const s = asObject(item, `domainStudyMaps[${i}]`);
    return {
      domainId:              asNumber(s.domainId, `domainStudyMaps[${i}].domainId`),
      domainName:            asString(s.domainName, `domainStudyMaps[${i}].domainName`),
      domainScore:           asNullableNumber(s.domainScore, `domainStudyMaps[${i}].domainScore`),
      interpretation:        asString(s.interpretation, `domainStudyMaps[${i}].interpretation`),
      contentToKnow:         asNullableStringArray(s.contentToKnow, `domainStudyMaps[${i}].contentToKnow`),
      keyVocabulary:         asNullableStringArray(s.keyVocabulary, `domainStudyMaps[${i}].keyVocabulary`),
      caseTypesToRecognize:  asNullableStringArray(s.caseTypesToRecognize, `domainStudyMaps[${i}].caseTypesToRecognize`),
      commonTraps:           asNullableStringArray(s.commonTraps, `domainStudyMaps[${i}].commonTraps`),
      masteryIndicator:      asString(s.masteryIndicator, `domainStudyMaps[${i}].masteryIndicator`),
    };
  });

  // vocabulary
  const vocRaw = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
  const vocabulary = vocRaw.map((item: unknown, i: number) => {
    const s = asObject(item, `vocabulary[${i}]`);
    return {
      term:             asString(s.term, `vocabulary[${i}].term`),
      plainDefinition:  asString(s.plainDefinition, `vocabulary[${i}].plainDefinition`),
      whyItMatters:     asString(s.whyItMatters, `vocabulary[${i}].whyItMatters`),
      whereItShowsUp:   asString(s.whereItShowsUp, `vocabulary[${i}].whereItShowsUp`),
      confusionRisk:    asNullableString(s.confusionRisk, `vocabulary[${i}].confusionRisk`),
    };
  });

  // casePatterns
  const cpRaw = Array.isArray(parsed.casePatterns) ? parsed.casePatterns : [];
  const casePatterns = cpRaw.map((item: unknown, i: number) => {
    const s = asObject(item, `casePatterns[${i}]`);
    return {
      patternName:          asString(s.patternName, `casePatterns[${i}].patternName`),
      domainContext:        asString(s.domainContext, `casePatterns[${i}].domainContext`),
      cluesInScenario:      asNullableStringArray(s.cluesInScenario, `casePatterns[${i}].cluesInScenario`),
      likelyQuestionAngle:  asString(s.likelyQuestionAngle, `casePatterns[${i}].likelyQuestionAngle`),
      commonMistake:        asString(s.commonMistake, `casePatterns[${i}].commonMistake`),
    };
  });

  // weeklyStudyPlan
  const wRaw = Array.isArray(parsed.weeklyStudyPlan) ? parsed.weeklyStudyPlan : [];
  const weeklyStudyPlan = wRaw.map((item: unknown, i: number) => {
    const s = asObject(item, `weeklyStudyPlan[${i}]`);
    const sessions = Array.isArray(s.sessions) ? s.sessions.map((sess: unknown, j: number) => {
      const ssObj = asObject(sess, `weeklyStudyPlan[${i}].sessions[${j}]`);
      return {
        sessionLabel:    asString(ssObj.sessionLabel, `...sessions[${j}].sessionLabel`),
        durationMinutes: asNumber(ssObj.durationMinutes, `...sessions[${j}].durationMinutes`),
        sessionType:     asString(ssObj.sessionType, `...sessions[${j}].sessionType`) as any,
        focus:           asString(ssObj.focus, `...sessions[${j}].focus`),
        tasks:           asNullableStringArray(ssObj.tasks, `...sessions[${j}].tasks`),
      };
    }) : [];
    return {
      weekNumber:      asNumber(s.weekNumber, `weeklyStudyPlan[${i}].weekNumber`),
      datesLabel:      asNullableString(s.datesLabel, `weeklyStudyPlan[${i}].datesLabel`),
      clusterFocus:    asString(s.clusterFocus, `weeklyStudyPlan[${i}].clusterFocus`),
      allocatedMinutes: asNumber(s.allocatedMinutes, `weeklyStudyPlan[${i}].allocatedMinutes`),
      weekGoal:        asString(s.weekGoal, `weeklyStudyPlan[${i}].weekGoal`),
      sessions,
      checkpointQuestion: asString(s.checkpointQuestion, `weeklyStudyPlan[${i}].checkpointQuestion`),
    };
  });

  // tacticalInstructions
  const ti = asObject(parsed.tacticalInstructions, 'tacticalInstructions');
  const tacticalInstructions = {
    immediateActions: asNullableStringArray(ti.immediateActions, 'tacticalInstructions.immediateActions'),
    thisWeekGoals:   asNullableStringArray(ti.thisWeekGoals, 'tacticalInstructions.thisWeekGoals'),
    avoidList:       asNullableStringArray(ti.avoidList, 'tacticalInstructions.avoidList'),
  };

  // checkpointLogic
  const cl = asObject(parsed.checkpointLogic, 'checkpointLogic');
  const checkpointLogic = {
    week2Check:          asString(cl.week2Check, 'checkpointLogic.week2Check'),
    midpointAssessment:  asString(cl.midpointAssessment, 'checkpointLogic.midpointAssessment'),
    shiftSignal:         asString(cl.shiftSignal, 'checkpointLogic.shiftSignal'),
    readinessSignal:     asString(cl.readinessSignal, 'checkpointLogic.readinessSignal'),
  };

  return {
    readinessSnapshot,
    dataInterpretation,
    priorityClusters,
    domainStudyMaps,
    vocabulary,
    casePatterns,
    weeklyStudyPlan,
    tacticalInstructions,
    checkpointLogic,
  };
}


// ─── Normalize from Supabase (handles schema version mismatch) ────────────────

function normalizeStudyPlanDocument(data: Record<string, unknown>): StudyPlanDocumentV2 | null {
  // If stored plan is old schema (v1), return null to force regeneration
  if (data.schemaVersion !== '2') return null;

  try {
    const parsed = parseStudyPlanV2(JSON.stringify(data));
    return {
      schemaVersion:    '2',
      ...parsed,
      generatedAt:      typeof data.generatedAt === 'string' ? data.generatedAt : new Date().toISOString(),
      model:            typeof data.model === 'string' ? data.model : 'unknown',
      studyConstraints: (data.studyConstraints as StudyConstraints) ?? null,
      sourceSummary:    (data.sourceSummary as StudyPlanDocumentV2['sourceSummary']) ?? {
        screenerResponseCount: 0,
        assessmentResponseCount: 0,
        flaggedSkillCount: 0,
        domainScoreCount: 0,
        deficitSkillCount: 0,
        clusterCount: 0,
      },
    };
  } catch (err) {
    console.error('[normalizeStudyPlanDocument] Parse error:', err);
    return null;
  }
}

// ─── Background polling ───────────────────────────────────────────────────────

async function requestStudyPlanBackground(
  requestBody: StudyPlanApiRequest,
  idToken: string,
  userId: string
): Promise<StudyPlanDocumentV2> {
  const requestedAt = requestBody.requestedAt ?? new Date().toISOString();

  let triggered = false;
  for (const endpoint of STUDY_PLAN_BACKGROUND_PATHS) {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(requestBody),
      });
    } catch {
      continue;
    }

    if (res.status === 202 || res.ok) { triggered = true; break; }

    const rawBody = await res.text().catch(() => '');
    const isUnavailable = res.status === 404 || res.status === 405 || rawBody.trim().toLowerCase().startsWith('<!doctype');
    if (isUnavailable) continue;

    const payload = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    throw new Error(payload?.error ?? 'Background study plan request failed.');
  }

  if (!triggered) throw new Error(STUDY_PLAN_API_UNAVAILABLE_MESSAGE);

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
    const doc = normalizeStudyPlanDocument(rawDocument);
    if (!doc) {
      console.error('[StudyPlan] Polled plan failed schema normalization');
      throw new Error('Study plan data could not be parsed after generation. Please try again.');
    }
    return doc;
  }

  throw new Error('Study plan generation timed out after 4 minutes. Please try again.');
}

// ─── Public: load study plan history ─────────────────────────────────────────

export interface StudyPlanHistoryEntry {
  id: string;
  createdAt: string;
  plan: StudyPlanDocumentV2;
}

export async function getStudyPlanHistory(userId: string, limit = 10): Promise<StudyPlanHistoryEntry[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('id, created_at, plan_document')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error('[getStudyPlanHistory] Supabase error:', error);
    return [];
  }

  const result: StudyPlanHistoryEntry[] = [];
  for (const row of data) {
    const doc = normalizeStudyPlanDocument(row.plan_document as Record<string, unknown>);
    if (doc) result.push({ id: row.id as string, createdAt: row.created_at as string, plan: doc });
  }
  return result;
}

/** @deprecated Use getStudyPlanHistory instead */
export async function getLatestStudyPlan(userId: string): Promise<StudyPlanDocumentV2 | null> {
  const history = await getStudyPlanHistory(userId, 1);
  return history[0]?.plan ?? null;
}

// ─── Public: generate new study plan ─────────────────────────────────────────

interface GenerateStudyPlanArgs {
  userId: string;
  idToken: string;
  skills: Skill[];
  domains: Domain[];
  studyConstraints?: StudyConstraints;
}

export async function generateStudyPlan({
  userId,
  idToken,
  skills,
  domains,
  studyConstraints,
}: GenerateStudyPlanArgs): Promise<StudyPlanDocumentV2> {
  if (!userId)  throw new Error('userId is required');
  if (!idToken) throw new Error('idToken is required');

  // ── Rate limit: 1 generation per 7 days ─────────────────────────────────
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentPlan } = await supabase
    .from('study_plans')
    .select('created_at')
    .eq('user_id', userId)
    .gt('created_at', oneWeekAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentPlan) {
    const nextAvailable = new Date(
      new Date(recentPlan.created_at as string).getTime() + 7 * 24 * 60 * 60 * 1000
    );
    throw new Error(
      `Study guide already generated this week. Next generation available ${nextAvailable.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
    );
  }

  // ── Load user profile ────────────────────────────────────────────────────
  const { data: profileRow } = await supabase
    .from('user_progress')
    .select('screener_complete, screener_results')
    .eq('user_id', userId)
    .single();

  const profile = profileRow ? {
    screenerComplete: profileRow.screener_complete as boolean | undefined,
    screenerResults:  profileRow.screener_results as any,
  } : {} as UserProfileDoc;

  if (!profile.screenerComplete) {
    throw new Error('Complete the screener before generating a study guide.');
  }

  // ── Fetch score inputs ───────────────────────────────────────────────────
  const scoreInputs = await fetchGlobalScoreInputs(userId);

  const domainLookup = buildDomainLookup(domains);
  const skillLookup  = buildSkillLookup(skills);
  const studyInputs  = normalizeStudyInputs(scoreInputs, domainLookup, skillLookup);

  if (studyInputs.assessmentResponses.length === 0) {
    throw new Error('Complete the full assessment before generating a study guide.');
  }

  // ── Layer 1: deterministic preprocessing ────────────────────────────────
  const globalScores = calculateGlobalScoresFromData(scoreInputs);

  // Build skill → domain mapping
  const skillDomainMap = new Map<string, number>();
  for (const r of [...studyInputs.screenerResponses, ...studyInputs.assessmentResponses]) {
    if (!skillDomainMap.has(r.skill_id)) {
      skillDomainMap.set(r.skill_id, r.domain_id);
    }
  }

  const domainNames: Record<number, string> = {};
  for (const [id, name] of domainLookup.entries()) {
    domainNames[id] = name;
  }

  // Compute skill states from all responses (chronological order)
  const allResponses = toRawSkillResponses([
    ...studyInputs.screenerResponses,
    ...studyInputs.assessmentResponses,
  ]);
  const skillStates = computeStudentSkillStates(allResponses);

  // Domain summaries
  const domainSummaries = buildDomainSummaries(
    skillStates,
    globalScores.domainScores,
    domainNames,
    skillDomainMap
  );

  // Time budget
  const constraints = studyConstraints ?? {};
  const clusterSeed = Object.values(
    skillMetadataV1Clusters(skillStates)
  );
  const timeBudget = computeStudyTimeBudget(constraints, clusterSeed);

  // Build clusters (needs time budget for allocation)
  const rawClusters = buildPrecomputedClusters(skillStates, timeBudget);
  const clusters = enrichClusterSkillNames(rawClusters, skillLookup);

  // Rebuild time budget with actual cluster urgencies (two-pass is fine)
  const finalTimeBudget = computeStudyTimeBudget(
    constraints,
    clusters.map(c => ({ clusterId: c.clusterId, urgency: c.urgency }))
  );
  const finalClusters = clusters.map(c => ({
    ...c,
    allocatedMinutes: finalTimeBudget.clusterAllocation.find(a => a.clusterId === c.clusterId)?.allocatedMinutes ?? c.allocatedMinutes,
  }));

  // Weekly schedule frame
  const scheduleFrame = buildWeeklyScheduleFrame(constraints, finalClusters, finalTimeBudget);

  // ── Source summary ───────────────────────────────────────────────────────
  const deficitCount = Object.values(globalScores.skillScores)
    .filter(s => s < FINAL_FULL_ASSESSMENT_UNLOCK_THRESHOLD).length;

  const sourceSummary: StudyPlanDocumentV2['sourceSummary'] = {
    screenerResponseCount:   studyInputs.screenerResponses.length,
    assessmentResponseCount: studyInputs.assessmentResponses.length,
    flaggedSkillCount:       globalScores.flaggedSkills.length,
    domainScoreCount:        Object.keys(globalScores.domainScores).length,
    deficitSkillCount:       deficitCount,
    clusterCount:            finalClusters.length,
  };

  // ── Layer 3: build prompt for model synthesis ────────────────────────────
  const prompt = buildPromptV2({
    precomputedClusters: finalClusters,
    scheduleFrame,
    domainSummaries,
    studyConstraints: studyConstraints ?? null,
    assessmentState: {
      screenerComplete:   Boolean(profile.screenerComplete),
      assessmentComplete: studyInputs.assessmentResponses.length > 0,
      totalResponses:     allResponses.length,
      flaggedSkillCount:  globalScores.flaggedSkills.length,
    },
  });

  // ── Fire background function ─────────────────────────────────────────────
  const requestedAt = new Date().toISOString();
  const requestBody: StudyPlanApiRequest = {
    userId,
    prompt,
    sourceSummary,
    requestedAt,
    preComputedAddons: {
      scheduleFrame,
      precomputedClusters: finalClusters,
      domainSummaries,
      studyConstraints: studyConstraints ?? undefined,
    },
  };

  return await requestStudyPlanBackground(requestBody, idToken, userId);
}

// ─── Helper: seed cluster urgency before building (fast pass) ─────────────────

import { skillMetadataV1 as _skillMeta } from '../data/skill-metadata-v1';
import { toMetadataId } from '../data/skillIdMap';
import type { ContentCluster } from '../types/studyPlanTypes';

function skillMetadataV1Clusters(
  skillStates: ReturnType<typeof computeStudentSkillStates>
): Record<string, { clusterId: ContentCluster; urgency: 'urgent_now' | 'important_next' | 'maintain' }> {
  const result: Record<string, { clusterId: ContentCluster; urgency: 'urgent_now' | 'important_next' | 'maintain' }> = {};
  for (const state of skillStates) {
    const meta = _skillMeta[state.skillId] ?? _skillMeta[toMetadataId(state.skillId) ?? ''];
    if (!meta) continue;
    const cluster = meta.contentCluster;
    if (!result[cluster]) {
      result[cluster] = { clusterId: cluster, urgency: 'maintain' };
    }
    if (state.status === 'misconception' || state.status === 'unstable' || state.status === 'unlearned') {
      result[cluster].urgency = 'urgent_now';
    } else if (state.status === 'developing' && result[cluster].urgency !== 'urgent_now') {
      result[cluster].urgency = 'important_next';
    }
  }
  return result;
}
