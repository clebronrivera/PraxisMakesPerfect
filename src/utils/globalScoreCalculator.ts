import { supabase } from '../config/supabase';

// Constants for weighting
const SCREENER_WEIGHT = 0.20;
const DIAGNOSTIC_WEIGHT = 0.50;
const PRACTICE_WEIGHT = 0.30;
const HIGH_CONFIDENCE_WRONG_THRESHOLD = 0.30;

export interface GlobalScoreResult {
  domainScores: Record<number, number>;
  skillScores: Record<string, number>;
  globalReadiness: number;
  flaggedSkills: string[];
}

export interface ScreenerScoreInput {
  domain_id?: number | string;
  skill_id?: string;
  is_correct?: boolean;
  confidence?: string;
}

export interface ResponseScoreInput {
  assessmentType?: 'screener' | 'diagnostic' | 'full' | 'practice' | string;
  domainIds?: Array<number | string>;
  domainId?: number | string;
  skillId?: string;
  isCorrect?: boolean;
  confidence?: string;
}

export interface GlobalScoreInputs {
  screenerResponses: ScreenerScoreInput[];
  responseLogs: ResponseScoreInput[];
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

  const rawLogs = allResponseLogs || [];

  const sharedScreenerResponses: ScreenerScoreInput[] = rawLogs
    .filter(log => log.assessment_type === 'screener')
    .flatMap((log) => {
      const domainIds = Array.isArray(log.domain_ids) && log.domain_ids.length > 0
        ? log.domain_ids
        : (log.domain_id !== undefined && log.domain_id !== null ? [log.domain_id] : []);
        
      const normalizedDomains: number[] = domainIds
        .map((id: any) => Number(id))
        .filter((id: number) => Number.isFinite(id));

      return normalizedDomains.map((domain_id: number) => ({
        domain_id,
        skill_id: log.skill_id,
        is_correct: log.is_correct,
        confidence: log.confidence
      }));
    });

  const responseLogs: ResponseScoreInput[] = rawLogs
    .filter(log => log.assessment_type !== 'screener')
    .map(log => ({
       assessmentType: log.assessment_type,
       domainIds: log.domain_ids,
       domainId: log.domain_id,
       skillId: log.skill_id,
       isCorrect: log.is_correct,
       confidence: log.confidence
    }));

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
    screener: { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
    diagnostic: { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> },
    practice: { domains: {} as Record<number, { correct: number, total: number }>, skills: {} as Record<string, { correct: number, total: number }> }
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
    // Determine type: it's in assessmentType property
    const type = r.assessmentType === 'diagnostic' || r.assessmentType === 'full' ? 'diagnostic' : 'practice';

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

  // Calculate weighted domain scores and global readiness
  const domainScores: Record<number, number> = {};
  const allDomainIds = new Set<number>([
    ...Object.keys(stats.screener.domains).map(Number),
    ...Object.keys(stats.diagnostic.domains).map(Number),
    ...Object.keys(stats.practice.domains).map(Number)
  ]);

  let totalNumDomainsEvaluated = 0;
  let sumOfDomainScores = 0;

  allDomainIds.forEach(domainId => {
    let score = 0;
    let weight = 0;

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

  // Calculate weighted skill scores
  const skillScores: Record<string, number> = {};
  const allSkillIds = new Set<string>([
    ...Object.keys(stats.screener.skills),
    ...Object.keys(stats.diagnostic.skills),
    ...Object.keys(stats.practice.skills)
  ]);

  allSkillIds.forEach(skillId => {
    let score = 0;
    let weight = 0;

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

    const pStats = stats.practice.skills[skillId];
    if (pStats && pStats.total > 0) {
      score += (pStats.correct / pStats.total) * PRACTICE_WEIGHT;
      weight += PRACTICE_WEIGHT;
    }

    if (weight > 0) {
      skillScores[skillId] = Math.round((score / weight) * 100);
    }
  });

  const result: GlobalScoreResult = {
    domainScores,
    skillScores,
    globalReadiness,
    flaggedSkills
  };

  return result;
}

async function saveGlobalScores(_userId: string, result: GlobalScoreResult): Promise<void> {
  // If we wanted to store the global scores persistently in Supabase:
  /*
  const { error } = await supabase
    .from('user_progress')
    .update({ global_scores: result })
    .eq('user_id', _userId);
  */
  console.log('[saveGlobalScores] Supabase Global Scores calculation produced:', result);
}

export async function calculateAndSaveGlobalScores(userId: string): Promise<GlobalScoreResult> {
  const inputs = await fetchGlobalScoreInputs(userId);
  const result = calculateGlobalScoresFromData(inputs);
  await saveGlobalScores(userId, result);
  return result;
}
