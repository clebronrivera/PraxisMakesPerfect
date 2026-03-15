import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeForFirestore } from './firestore';

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

  const screenerRef = collection(db, 'responses', userId, 'screener');
  const screenerSnap = await getDocs(screenerRef);
  const legacyScreenerResponses = screenerSnap.docs.map(d => d.data() as ScreenerScoreInput);

  const responsesRef = collection(db, 'users', userId, 'responses');
  const responsesSnap = await getDocs(responsesRef);
  const allResponseLogs = responsesSnap.docs.map(d => d.data() as ResponseScoreInput);

  const sharedScreenerResponses: ScreenerScoreInput[] = allResponseLogs
    .filter(log => log.assessmentType === 'screener')
    .flatMap((log) => {
      const domainIds = Array.isArray(log.domainIds)
        ? log.domainIds
        : (log.domainId !== undefined && log.domainId !== null ? [log.domainId] : []);
      const normalizedDomains = domainIds
        .map(domainId => Number(domainId))
        .filter(domainId => Number.isFinite(domainId));

      return normalizedDomains.map(domainId => ({
        domain_id: domainId,
        skill_id: log.skillId,
        is_correct: log.isCorrect,
        confidence: log.confidence
      }));
    });

  const responseLogs = allResponseLogs.filter(log => log.assessmentType !== 'screener');
  const screenerResponses = sharedScreenerResponses.length > 0
    ? sharedScreenerResponses
    : legacyScreenerResponses;

  return {
    screenerResponses,
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

async function saveGlobalScores(userId: string, result: GlobalScoreResult): Promise<void> {
  const docRef = doc(db, 'userProgress', userId, 'globalScores', 'latest');
  await setDoc(docRef, sanitizeForFirestore(result));
}

export async function calculateAndSaveGlobalScores(userId: string): Promise<GlobalScoreResult> {
  const inputs = await fetchGlobalScoreInputs(userId);
  const result = calculateGlobalScoresFromData(inputs);
  await saveGlobalScores(userId, result);
  return result;
}
