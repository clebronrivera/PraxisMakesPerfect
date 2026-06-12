// src/utils/globalScoreCalculator.ts
// Computes and persists weighted domain / skill scores to Supabase after each
// answered question.  Weights: screener 20 %, full-assessment 50 %, practice 30 %.
// Retake (assessment_type='retake') uses REPLACE/latest-wins: it supersedes the
// screener+diagnostic score for the skills it covers — see Phase 2 Decision A4.
// A skill is flagged when high-confidence wrong answers exceed 30 % of attempts.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Constants for weighting
const SCREENER_WEIGHT = 0.20;
const DIAGNOSTIC_WEIGHT = 0.50;
const PRACTICE_WEIGHT = 0.30;
// Retake replaces the entire screener+diagnostic portion (latest-wins).
// Its weight equals the combined assessment weight so the scale stays identical.
const RETAKE_WEIGHT = SCREENER_WEIGHT + DIAGNOSTIC_WEIGHT; // 0.70
const HIGH_CONFIDENCE_WRONG_THRESHOLD = 0.30;

export interface GlobalScoreResult {
  domainScores: Record<number, number>;
  skillScores: Record<string, number>;
  globalReadiness: number;
  flaggedSkills: string[];
  /** Per-skill accuracy from diagnostic era (screener+diagnostic only, no practice/retake).
   *  Stored so the retake-unlock gate can identify which skills were deficit at baseline. */
  diagnosticSkillScores: Record<string, number>;
}

export interface ScreenerScoreInput {
  domain_id?: number | string;
  skill_id?: string;
  is_correct?: boolean;
  confidence?: string;
  selected_answers?: string[];
  question_id?: string;
}

export interface ResponseScoreInput {
  assessmentType?: 'screener' | 'diagnostic' | 'full' | 'practice' | 'retake' | string;
  domainIds?: Array<number | string>;
  domainId?: number | string;
  skillId?: string;
  isCorrect?: boolean;
  confidence?: string;
  selectedAnswers?: string[];
  questionId?: string;
}

export interface GlobalScoreInputs {
  screenerResponses: ScreenerScoreInput[];
  responseLogs: ResponseScoreInput[];
}

export async function fetchGlobalScoreInputsWithClient(
  client: SupabaseClient,
  userId: string
): Promise<GlobalScoreInputs> {
  if (!userId) {
    throw new Error('userId is required');
  }

  const { data: allResponseLogs, error } = await client
    .from('responses')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[fetchGlobalScoreInputsWithClient] Error fetching from Supabase:', error);
    return { screenerResponses: [], responseLogs: [] };
  }

  return mapRawLogsToGlobalInputs(allResponseLogs || []);
}

export async function fetchGlobalScoreInputs(userId: string): Promise<GlobalScoreInputs> {
  if (!userId) {
    throw new Error('userId is required');
  }

  // Fetch all responses (screener, diagnostic, practice) in one go
  const { data: allResponseLogs, error } = await supabase
    .from('responses')
    .select('*')
    .eq('user_id', userId);

  if (error) {
     console.error('[fetchGlobalScoreInputs] Error fetching from Supabase:', error);
     return { screenerResponses: [], responseLogs: [] };
  }

  return mapRawLogsToGlobalInputs(allResponseLogs || []);
}

function mapRawLogsToGlobalInputs(rawLogs: Record<string, unknown>[]): GlobalScoreInputs {

  const sharedScreenerResponses: ScreenerScoreInput[] = rawLogs
    .filter(log => (log as { assessment_type?: string }).assessment_type === 'screener')
    .flatMap((log) => {
      const row = log as {
        domain_ids?: unknown;
        domain_id?: unknown;
        skill_id?: string;
        is_correct?: boolean;
        confidence?: string;
        selected_answers?: string[];
        question_id?: string;
      };
      const domainIds = Array.isArray(row.domain_ids) && row.domain_ids.length > 0
        ? row.domain_ids
        : (row.domain_id !== undefined && row.domain_id !== null ? [row.domain_id] : []);

      const normalizedDomains: number[] = domainIds
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id));

      return normalizedDomains.map((domain_id: number) => ({
        domain_id,
        skill_id: row.skill_id,
        is_correct: row.is_correct,
        confidence: row.confidence,
        selected_answers: Array.isArray(row.selected_answers) ? row.selected_answers : undefined,
        question_id: row.question_id,
      }));
    });

  const responseLogs: ResponseScoreInput[] = rawLogs
    .filter(log => (log as { assessment_type?: string }).assessment_type !== 'screener')
    .map(log => {
      const row = log as {
        assessment_type?: string;
        domain_ids?: unknown;
        domain_id?: unknown;
        skill_id?: string;
        is_correct?: boolean;
        confidence?: string;
        selected_answers?: string[];
        question_id?: string;
      };
      return {
        assessmentType: row.assessment_type,
        domainIds: row.domain_ids as ResponseScoreInput['domainIds'],
        domainId: row.domain_id as ResponseScoreInput['domainId'],
        skillId: row.skill_id,
        isCorrect: row.is_correct,
        confidence: row.confidence,
        selectedAnswers: Array.isArray(row.selected_answers) ? row.selected_answers : undefined,
        questionId: row.question_id,
      };
    });

  return {
    screenerResponses: sharedScreenerResponses,
    responseLogs
  };
}

export function calculateGlobalScoresFromData({
  screenerResponses,
  responseLogs
}: GlobalScoreInputs): GlobalScoreResult {
  const screenerDocs = screenerResponses ?? [];
  const otherDocs = responseLogs ?? [];

  // Group by skill, domain, and type
  const stats = {
    screener:    { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
    diagnostic:  { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
    retake:      { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
    practice:    { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
  };

  // For high-confidence-wrong mismatch
  const skillConfidenceStats = {} as Record<string, { highConfWrong: number, total: number }>;

  // Process screener docs
  screenerDocs.forEach(r => {
    const domainId = Number(r.domain_id);
    const skillId = String(r.skill_id);
    const isCorrect = Boolean(r.is_correct);
    const conf = r.confidence;

    // domain
    if (!stats.screener.domains[domainId]) stats.screener.domains[domainId] = { correct: 0, total: 0 };
    stats.screener.domains[domainId].total++;
    if (isCorrect) stats.screener.domains[domainId].correct++;

    // skill
    if (!stats.screener.skills[skillId]) stats.screener.skills[skillId] = { correct: 0, total: 0 };
    stats.screener.skills[skillId].total++;
    if (isCorrect) stats.screener.skills[skillId].correct++;

    // confidence
    if (!skillConfidenceStats[skillId]) skillConfidenceStats[skillId] = { highConfWrong: 0, total: 0 };
    skillConfidenceStats[skillId].total++;
    if (!isCorrect && conf === 'high') {
      skillConfidenceStats[skillId].highConfWrong++;
    }
  });

  // Process other docs
  otherDocs.forEach(r => {
    // Determine type — retake uses latest-wins replace (A4); diagnostic/full go to diagnostic bucket.
    const type = r.assessmentType === 'retake'
      ? 'retake'
      : (r.assessmentType === 'diagnostic' || r.assessmentType === 'full' ? 'diagnostic' : 'practice');

    // Some logs might have multiple domains or a single domain.
    const rawDomainIds = Array.isArray(r.domainIds)
      ? r.domainIds
      : (r.domainId !== undefined && r.domainId !== null ? [r.domainId] : []);
    const domainIds = rawDomainIds
      .map(domainId => Number(domainId))
      .filter(domainId => Number.isFinite(domainId));
    const skillId = String(r.skillId || 'unknown');
    const isCorrect = Boolean(r.isCorrect);
    const conf = r.confidence;

    domainIds.forEach(domainId => {
      if (!stats[type].domains[domainId]) stats[type].domains[domainId] = { correct: 0, total: 0 };
      stats[type].domains[domainId].total++;
      if (isCorrect) stats[type].domains[domainId].correct++;
    });

    if (!stats[type].skills[skillId]) stats[type].skills[skillId] = { correct: 0, total: 0 };
    stats[type].skills[skillId].total++;
    if (isCorrect) stats[type].skills[skillId].correct++;

    if (!skillConfidenceStats[skillId]) skillConfidenceStats[skillId] = { highConfWrong: 0, total: 0 };
    skillConfidenceStats[skillId].total++;
    if (!isCorrect && conf === 'high') {
      skillConfidenceStats[skillId].highConfWrong++;
    }
  });

  // Calculate flagged skills
  const flaggedSkills: string[] = [];
  for (const [skillId, { highConfWrong, total }] of Object.entries(skillConfidenceStats)) {
    if (total > 0 && (highConfWrong / total) > HIGH_CONFIDENCE_WRONG_THRESHOLD) {
      flaggedSkills.push(skillId);
    }
  }

  // Calculate weighted domain scores and global readiness.
  // Retake replace logic (A4): for any domain that has retake data, skip screener+diagnostic.
  const domainScores: Record<number, number> = {};
  const allDomainIds = new Set<number>([
    ...Object.keys(stats.screener.domains).map(Number),
    ...Object.keys(stats.diagnostic.domains).map(Number),
    ...Object.keys(stats.retake.domains).map(Number),
    ...Object.keys(stats.practice.domains).map(Number),
  ]);

  let totalNumDomainsEvaluated = 0;
  let sumOfDomainScores = 0;

  allDomainIds.forEach(domainId => {
    let score = 0;
    let weight = 0;

    const rStats = stats.retake.domains[domainId];
    if (rStats && rStats.total > 0) {
      // Retake supersedes screener+diagnostic for this domain.
      score += (rStats.correct / rStats.total) * RETAKE_WEIGHT;
      weight += RETAKE_WEIGHT;
    } else {
      const sStats = stats.screener.domains[domainId];
      if (sStats && sStats.total > 0) {
        score += (sStats.correct / sStats.total) * SCREENER_WEIGHT;
        weight += SCREENER_WEIGHT;
      }
      const dStats = stats.diagnostic.domains[domainId];
      if (dStats && dStats.total > 0) {
        score += (dStats.correct / dStats.total) * DIAGNOSTIC_WEIGHT;
        weight += DIAGNOSTIC_WEIGHT;
      }
    }

    const pStats = stats.practice.domains[domainId];
    if (pStats && pStats.total > 0) {
      score += (pStats.correct / pStats.total) * PRACTICE_WEIGHT;
      weight += PRACTICE_WEIGHT;
    }

    if (weight > 0) {
      const normalizedScore = Math.round((score / weight) * 100);
      domainScores[domainId] = normalizedScore;
      sumOfDomainScores += normalizedScore;
      totalNumDomainsEvaluated++;
    }
  });

  const globalReadiness = totalNumDomainsEvaluated > 0 
    ? Math.round(sumOfDomainScores / totalNumDomainsEvaluated) 
    : 0;

  // Calculate weighted skill scores.
  // Retake replace logic (A4): for any skill that has retake data, skip screener+diagnostic.
  const skillScores: Record<string, number> = {};
  // diagnosticSkillScores: screener+diagnostic only, no practice/retake — used for retake-unlock gate.
  const diagnosticSkillScores: Record<string, number> = {};

  const allSkillIds = new Set<string>([
    ...Object.keys(stats.screener.skills),
    ...Object.keys(stats.diagnostic.skills),
    ...Object.keys(stats.retake.skills),
    ...Object.keys(stats.practice.skills),
  ]);

  allSkillIds.forEach(skillId => {
    let score = 0;
    let weight = 0;

    const rStats = stats.retake.skills[skillId];
    if (rStats && rStats.total > 0) {
      // Retake supersedes screener+diagnostic for this skill (latest-wins).
      score += (rStats.correct / rStats.total) * RETAKE_WEIGHT;
      weight += RETAKE_WEIGHT;
    } else {
      const sStats = stats.screener.skills[skillId];
      if (sStats && sStats.total > 0) {
        score += (sStats.correct / sStats.total) * SCREENER_WEIGHT;
        weight += SCREENER_WEIGHT;
      }
      const dStats = stats.diagnostic.skills[skillId];
      if (dStats && dStats.total > 0) {
        score += (dStats.correct / dStats.total) * DIAGNOSTIC_WEIGHT;
        weight += DIAGNOSTIC_WEIGHT;
      }
    }

    const pStats = stats.practice.skills[skillId];
    if (pStats && pStats.total > 0) {
      score += (pStats.correct / pStats.total) * PRACTICE_WEIGHT;
      weight += PRACTICE_WEIGHT;
    }

    if (weight > 0) {
      skillScores[skillId] = Math.round((score / weight) * 100);
    }

    // Diagnostic-era score (screener+diagnostic only — never retake or practice).
    const diagScore = (() => {
      let ds = 0, dw = 0;
      const s2 = stats.screener.skills[skillId];
      if (s2 && s2.total > 0) { ds += (s2.correct / s2.total) * SCREENER_WEIGHT; dw += SCREENER_WEIGHT; }
      const d2 = stats.diagnostic.skills[skillId];
      if (d2 && d2.total > 0) { ds += (d2.correct / d2.total) * DIAGNOSTIC_WEIGHT; dw += DIAGNOSTIC_WEIGHT; }
      return dw > 0 ? Math.round((ds / dw) * 100) : 0;
    })();
    if (diagScore > 0 || (stats.screener.skills[skillId]?.total ?? 0) + (stats.diagnostic.skills[skillId]?.total ?? 0) > 0) {
      diagnosticSkillScores[skillId] = diagScore;
    }
  });

  const result: GlobalScoreResult = {
    domainScores,
    skillScores,
    globalReadiness,
    flaggedSkills,
    diagnosticSkillScores,
  };

  return result;
}

async function saveGlobalScores(userId: string, result: GlobalScoreResult): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .update({ global_scores: result })
    .eq('user_id', userId);

  if (error) {
    console.error('[saveGlobalScores] Failed to persist global scores:', error);
  }
}

async function saveGlobalScoresWithClient(
  client: SupabaseClient,
  userId: string,
  result: GlobalScoreResult
): Promise<void> {
  const { error } = await client
    .from('user_progress')
    .update({ global_scores: result })
    .eq('user_id', userId);

  if (error) {
    console.error('[saveGlobalScoresWithClient] Failed to persist global scores:', error);
  }
}

export async function calculateAndSaveGlobalScores(userId: string): Promise<GlobalScoreResult> {
  const inputs = await fetchGlobalScoreInputs(userId);
  const result = calculateGlobalScoresFromData(inputs);
  await saveGlobalScores(userId, result);
  return result;
}

/** Server-side (e.g. Netlify admin) with a service-role or elevated client. */
export async function calculateAndSaveGlobalScoresWithClient(
  client: SupabaseClient,
  userId: string
): Promise<GlobalScoreResult> {
  const inputs = await fetchGlobalScoreInputsWithClient(client, userId);
  const result = calculateGlobalScoresFromData(inputs);
  await saveGlobalScoresWithClient(client, userId, result);
  return result;
}
