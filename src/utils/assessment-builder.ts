// Assessment Builder - Single source for building pre and full assessments from question bank.
// Uses Praxis distribution for full assessment; fixed per-domain count for pre-assessment.
// Content source: questions from question bank (analyzedQuestions); domain taxonomy from knowledge-base.

import { AnalyzedQuestion } from '../brain/question-analyzer';

/**
 * Praxis test content area percentages and domain mappings
 * Based on official Praxis School Psychologist test structure
 */
const PRAXIS_DISTRIBUTION = {
  // Professional Practices That Permeate All Aspects of Service Delivery — ~32% (~40 questions)
  professionalPractices: {
    percentage: 0.32,
    domains: [1], // Professional Practices
    targetQuestions: 40
  },
  // Direct and Indirect Services for Children, Families, and Schools — Student-Level — ~23% (~28 questions)
  studentLevel: {
    percentage: 0.23,
    domains: [2], // Student-Level Services
    targetQuestions: 28
  },
  // Direct and Indirect Services for Children, Families, and Schools — Systems-Level — ~20% (~25 questions)
  systemsLevel: {
    percentage: 0.20,
    domains: [3], // Systems-Level Services
    targetQuestions: 25
  },
  // Foundations of School Psychological Service Delivery — ~25% (~32 questions)
  foundations: {
    percentage: 0.25,
    domains: [4], // Foundations
    targetQuestions: 32
  }
};

/**
 * Calculate domain distribution using Praxis percentages
 * Distributes questions according to official Praxis test structure
 * Ensures total always equals targetCount (125)
 */
function calculateDomainDistribution(
  targetCount: number,
  analyzedQuestions: AnalyzedQuestion[],
  excludeQuestionIds: Set<string> = new Set(),
  customDistribution?: Record<string, { percentage: number; domains: number[] }>
): Record<number, number> {
  const activeDomainIds = [...new Set(analyzedQuestions.map(q => q.domain as number))].filter(d => d !== undefined);
  
  // Use custom distribution if provided, otherwise fall back to Praxis distribution
  const distributionConfig = customDistribution || PRAXIS_DISTRIBUTION;
  
  // First, calculate target questions per content area
  const areaTargets: Record<string, number> = {};
  for (const [key, area] of Object.entries(distributionConfig)) {
    areaTargets[key] = Math.round(area.percentage * targetCount);
  }
  
  // Adjust to ensure total equals targetCount (largest remainder method)
  const total = Object.values(areaTargets).reduce((a, b) => a + b, 0);
  const remainder = targetCount - total;
  
  // Distribute remainder to areas with largest fractional parts
  if (remainder !== 0) {
    const areaFractions = Object.entries(distributionConfig).map(([area, config]) => ({
      area,
      frac: (config.percentage * targetCount) - areaTargets[area]
    }));
    
    areaFractions.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < Math.abs(remainder); i++) {
      if (remainder > 0) {
        areaTargets[areaFractions[i].area as keyof typeof areaTargets] += 1;
      } else {
        areaTargets[areaFractions[i].area as keyof typeof areaTargets] -= 1;
      }
    }
  }
  
  // Now distribute questions within each content area to domains
  // Count available questions per domain (after exclusions)
  const availableByDomain: Record<number, number> = {};
  activeDomainIds.forEach(domain => {
    availableByDomain[domain] = analyzedQuestions.filter(
      q => q.domains?.includes(domain) && !excludeQuestionIds.has(q.id)
    ).length;
  });
  
  // Calculate domain distribution within each content area
  const domainAlloc: Record<number, number> = {};
  for (const domain of activeDomainIds) {
    domainAlloc[domain] = 0;
  }
  
  // Dynamically distribute between domains based on available questions in each area
  for (const [key, areaConfig] of Object.entries(distributionConfig)) {
    const targetForArea = areaTargets[key] || 0;
    if (targetForArea <= 0) continue;
    
    const availableInArea = areaConfig.domains.map(d => availableByDomain[d] || 0);
    const totalAvailableInArea = availableInArea.reduce((sum, count) => sum + count, 0);
    
    if (totalAvailableInArea > 0) {
      let allocatedForArea = 0;
      const domainsWithCount = areaConfig.domains.map((d, index) => ({ domain: d, available: availableInArea[index] }));
      
      for (let i = 0; i < domainsWithCount.length; i++) {
        const d = domainsWithCount[i];
        if (i === domainsWithCount.length - 1) {
          domainAlloc[d.domain] = targetForArea - allocatedForArea;
        } else {
          const allocation = Math.round((d.available / totalAvailableInArea) * targetForArea);
          domainAlloc[d.domain] = allocation;
          allocatedForArea += allocation;
        }
      }
    }
  }
  
  // Cap allocations to available questions and track deficit
  let totalDeficit = 0;
  const floorAlloc: Record<number, number> = {};
  
  for (const domain of activeDomainIds) {
    const available = availableByDomain[domain] ?? 0;
    const requested = domainAlloc[domain] ?? 0;
    floorAlloc[domain] = Math.min(requested, available);
    totalDeficit += Math.max(0, requested - available);
  }
  
  // Redistribute deficit to domains with remaining capacity
  if (totalDeficit > 0) {
    const domainsWithCapacity = Object.entries(availableByDomain)
      .map(([domain, available]) => ({
        domain: parseInt(domain),
        available,
        current: floorAlloc[parseInt(domain)] ?? 0,
        remaining: available - (floorAlloc[parseInt(domain)] ?? 0)
      }))
      .filter(d => d.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
    
    let deficitRemaining = totalDeficit;
    for (const domainInfo of domainsWithCapacity) {
      if (deficitRemaining <= 0) break;
      const toAdd = Math.min(deficitRemaining, domainInfo.remaining);
      floorAlloc[domainInfo.domain] += toAdd;
      deficitRemaining -= toAdd;
    }
    
    // If still have deficit, we'll log a warning but proceed
    if (deficitRemaining > 0) {
      console.warn(`[AssessmentBuilder] Could not fully redistribute ${deficitRemaining} question deficit`);
    }
  }
  
  // Final verification: ensure total equals targetCount
  const finalTotal = Object.values(floorAlloc).reduce((a, b) => a + b, 0);
  if (finalTotal !== targetCount) {
    console.warn(`[AssessmentBuilder] Distribution total (${finalTotal}) does not equal target (${targetCount})`);
    
    // Adjust to match targetCount exactly
    const diff = targetCount - finalTotal;
    if (diff !== 0) {
      const domainsWithCapacity = Object.entries(availableByDomain)
        .map(([domain, available]) => ({
          domain: parseInt(domain),
          available,
          current: floorAlloc[parseInt(domain)] ?? 0,
          remaining: available - (floorAlloc[parseInt(domain)] ?? 0)
        }))
        .filter(d => d.remaining > 0)
        .sort((a, b) => b.remaining - a.remaining);
      
      let remainingDiff = diff;
      for (const domainInfo of domainsWithCapacity) {
        if (remainingDiff === 0) break;
        const toAdd = remainingDiff > 0 
          ? Math.min(remainingDiff, domainInfo.remaining)
          : Math.max(remainingDiff, -domainInfo.current);
        floorAlloc[domainInfo.domain] += toAdd;
        remainingDiff -= toAdd;
      }
    }
  }
  
  return floorAlloc;
}

/**
 * Build a full assessment with Praxis-aligned domain distribution
 * Distributes 125 questions according to official Praxis test percentages:
 * - Professional Practices (32%, ~40 questions): Domains 1-2
 * - Student-Level Services (23%, ~28 questions): Domains 3-4
 * - Systems-Level Services (20%, ~25 questions): Domains 5-7
 * - Foundations (25%, ~32 questions): Domains 8-10
 * Uses availability caps to handle question bank limitations
 */
export function buildFullAssessment(
  analyzedQuestions: AnalyzedQuestion[],
  targetCount: number,
  excludeQuestionIds: string[] = [],
  customDistribution?: Record<string, { percentage: number; domains: number[] }>
): AnalyzedQuestion[] {
  const activeDomainIds = [...new Set(analyzedQuestions.map(q => q.domain as number))].filter(d => d !== undefined);
  const excludeSet = new Set(excludeQuestionIds);
  const selectedIds = new Set<string>();
  const selected: AnalyzedQuestion[] = [];
  
  // Calculate domain distribution
  const distribution = calculateDomainDistribution(targetCount, analyzedQuestions, excludeSet, customDistribution);
  
  // Sample questions per domain without replacement
  for (const domain of activeDomainIds) {
    const targetCountForDomain = distribution[domain] ?? 0;
    
    if (targetCountForDomain === 0) continue;
    
    // Get available questions for this domain
    const domainQuestions = analyzedQuestions.filter(
      q => q.domains?.includes(domain) && 
           !excludeSet.has(q.id) && 
           !selectedIds.has(q.id)
    );
    
    if (domainQuestions.length === 0) {
      console.warn(`[AssessmentBuilder] No available questions for domain ${domain}`);
      continue;
    }
    
    // Shuffle and take target count
    const shuffled = [...domainQuestions].sort(() => Math.random() - 0.5);
    const toTake = Math.min(targetCountForDomain, shuffled.length);
    const domainSelected = shuffled.slice(0, toTake);
    
    domainSelected.forEach(q => {
      selected.push(q);
      selectedIds.add(q.id);
    });
    
    if (domainSelected.length < targetCountForDomain) {
      console.warn(
        `[AssessmentBuilder] Domain ${domain}: requested ${targetCountForDomain}, got ${domainSelected.length}`
      );
    }
  }
  
  // Final verification
  if (selected.length !== targetCount || selectedIds.size !== targetCount) {
    console.warn(
      `[AssessmentBuilder] Expected ${targetCount} questions, got ${selected.length} (unique: ${selectedIds.size})`
    );
  }
  
  // Shuffle final selection
  return selected.sort(() => Math.random() - 0.5);
}

/**
 * Build pre-assessment (Quick Diagnostic): questionsPerDomain per NASP domain, then shuffle.
 * Single assessment builder - use this instead of inline logic in App.
 */
export function buildPreAssessment(
  analyzedQuestions: AnalyzedQuestion[],
  questionsPerDomain: number = 4,
  excludeQuestionIds: Set<string> = new Set()
): AnalyzedQuestion[] {
  const activeDomainIds = [...new Set(analyzedQuestions.map(q => q.domain as number))].filter(d => d !== undefined);
  const selected: AnalyzedQuestion[] = [];
  const usedQuestionIds = new Set<string>(excludeQuestionIds);

  for (const domain of activeDomainIds) {
    const domainQuestions = analyzedQuestions.filter(
      q => q.domains?.includes(domain) && !usedQuestionIds.has(q.id)
    );
    if (domainQuestions.length === 0) continue;
    const shuffled = [...domainQuestions].sort(() => Math.random() - 0.5);
    const take = shuffled.slice(0, questionsPerDomain);
    take.forEach(q => {
      selected.push(q);
      usedQuestionIds.add(q.id);
    });
  }

  const targetTotal = activeDomainIds.length * questionsPerDomain;
  if (selected.length < targetTotal) {
    const remaining = targetTotal - selected.length;
    const available = analyzedQuestions.filter(q => !usedQuestionIds.has(q.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    shuffled.slice(0, remaining).forEach(q => {
      selected.push(q);
      usedQuestionIds.add(q.id);
    });
  }

  return selected.sort(() => Math.random() - 0.5);
}

/**
 * Build a screener assessment: exactly 50 questions based on blueprint logic.
 * Follows domain and skill allocation, with best-effort cognitive complexity enforcement.
 * Excludes questions already marked as seen.
 * Returns questions interleaved by domain.
 */
export function buildScreener(
  analyzedQuestions: AnalyzedQuestion[],
  excludeQuestionIds: string[] = []
): AnalyzedQuestion[] {
  // Add a SKILL_BLUEPRINT constant at the top of the function
  const SKILL_BLUEPRINT: Record<string, { domain: number; slots: number; recallTarget?: number }> = {
    // Domain 1: 16 questions, 5 Recall + 11 Application (13 skills)
    'CON-01': { domain: 1, slots: 2, recallTarget: 5 },
    'DBD-01': { domain: 1, slots: 2, recallTarget: 5 },
    'DBD-03': { domain: 1, slots: 2, recallTarget: 5 },
    'DBD-05': { domain: 1, slots: 1, recallTarget: 5 },
    'DBD-06': { domain: 1, slots: 1, recallTarget: 5 },
    'DBD-07': { domain: 1, slots: 1, recallTarget: 5 },
    'DBD-08': { domain: 1, slots: 1, recallTarget: 5 },
    'DBD-09': { domain: 1, slots: 1, recallTarget: 5 },
    'DBD-10': { domain: 1, slots: 1, recallTarget: 5 },
    'PSY-01': { domain: 1, slots: 1, recallTarget: 5 },
    'PSY-02': { domain: 1, slots: 1, recallTarget: 5 },
    'PSY-03': { domain: 1, slots: 1, recallTarget: 5 },
    'PSY-04': { domain: 1, slots: 1, recallTarget: 5 },

    // Domain 2: 12 questions, 3 Recall + 9 Application (12 skills)
    'ACA-02': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-03': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-04': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-06': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-07': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-08': { domain: 2, slots: 1, recallTarget: 3 },
    'ACA-09': { domain: 2, slots: 1, recallTarget: 3 },
    'DEV-01': { domain: 2, slots: 1, recallTarget: 3 },
    'MBH-02': { domain: 2, slots: 1, recallTarget: 3 },
    'MBH-03': { domain: 2, slots: 1, recallTarget: 3 },
    'MBH-04': { domain: 2, slots: 1, recallTarget: 3 },
    'MBH-05': { domain: 2, slots: 1, recallTarget: 3 },

    // Domain 3: 10 questions, 3 Recall + 7 Application (8 skills)
    'SAF-01': { domain: 3, slots: 2, recallTarget: 3 },
    'SWP-04': { domain: 3, slots: 2, recallTarget: 3 },
    'FAM-02': { domain: 3, slots: 1, recallTarget: 3 },
    'FAM-03': { domain: 3, slots: 1, recallTarget: 3 },
    'SAF-03': { domain: 3, slots: 1, recallTarget: 3 },
    'SAF-04': { domain: 3, slots: 1, recallTarget: 3 },
    'SWP-02': { domain: 3, slots: 1, recallTarget: 3 },
    'SWP-03': { domain: 3, slots: 1, recallTarget: 3 },

    // Domain 4: 12 questions, 4 Recall + 8 Application (12 skills)
    'DIV-01': { domain: 4, slots: 1, recallTarget: 4 },
    'DIV-03': { domain: 4, slots: 1, recallTarget: 4 },
    'DIV-05': { domain: 4, slots: 1, recallTarget: 4 },
    'ETH-01': { domain: 4, slots: 1, recallTarget: 4 },
    'ETH-02': { domain: 4, slots: 1, recallTarget: 4 },
    'ETH-03': { domain: 4, slots: 1, recallTarget: 4 },
    'LEG-01': { domain: 4, slots: 1, recallTarget: 4 },
    'LEG-02': { domain: 4, slots: 1, recallTarget: 4 },
    'LEG-03': { domain: 4, slots: 1, recallTarget: 4 },
    'LEG-04': { domain: 4, slots: 1, recallTarget: 4 },
    'RES-02': { domain: 4, slots: 1, recallTarget: 4 },
    'RES-03': { domain: 4, slots: 1, recallTarget: 4 }
  };

  const excludeSet = new Set(excludeQuestionIds);

  // 1. Filter: exclude IDs
  const filteredQuestions = analyzedQuestions.filter(q => !excludeSet.has(q.id));

  // 2. Group by skillId for pool selection
  const poolBySkill = new Map<string, AnalyzedQuestion[]>();
  filteredQuestions.forEach(q => {
    if (q.skillId) {
      if (!poolBySkill.has(q.skillId)) {
        poolBySkill.set(q.skillId, []);
      }
      poolBySkill.get(q.skillId)!.push(q);
    }
  });

  const domainQuestions: Record<number, AnalyzedQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
  const skillRemainingPools = new Map<string, AnalyzedQuestion[]>();

  // 3. Selection per skill based on slots
  for (const [skillId, config] of Object.entries(SKILL_BLUEPRINT)) {
    const skillPool = poolBySkill.get(skillId) || [];
    if (skillPool.length === 0) {
      console.warn(`[AssessmentBuilder] Skill ${skillId} has no available questions.`);
      continue;
    }

    const singleSelect = skillPool.filter(q => q.isMultiSelect !== true);
    const multiSelect = skillPool.filter(q => q.isMultiSelect === true);

    const shuffledSingle = [...singleSelect].sort(() => Math.random() - 0.5);
    const shuffledMulti = [...multiSelect].sort(() => Math.random() - 0.5);

    // Prioritize single-select, use multi-select as fallback
    const combined = [...shuffledSingle, ...shuffledMulti];
    const selection = combined.slice(0, config.slots);
    const remaining = combined.slice(config.slots);

    domainQuestions[config.domain].push(...selection);
    skillRemainingPools.set(skillId, remaining);
  }

  // 4. Complexity enforcement per domain
  for (let d = 1; d <= 4; d++) {
    // Determine recall target for this domain (shared by all skill entries in that domain)
    const domainSkills = Object.entries(SKILL_BLUEPRINT).filter(([_, config]) => config.domain === d);
    const recallTarget = domainSkills[0]?.[1]?.recallTarget || 0;
    
    const currentQuestions = domainQuestions[d];
    const getRecallCount = () => currentQuestions.filter(q => q.cognitiveComplexity === 'Recall').length;
    
    let recallCount = getRecallCount();

    if (recallCount < recallTarget) {
      // Need more Recall: swap Application questions for Recall from remaining pools
      let needed = recallTarget - recallCount;
      for (let i = 0; i < currentQuestions.length && needed > 0; i++) {
        const q = currentQuestions[i];
        if (q.cognitiveComplexity !== 'Application') continue;

        const pool = skillRemainingPools.get(q.skillId!) || [];
        const recallIdx = pool.findIndex(p => p.cognitiveComplexity === 'Recall');

        if (recallIdx !== -1) {
          const recallQuestion = pool.splice(recallIdx, 1)[0];
          currentQuestions[i] = recallQuestion;
          needed--;
        }
      }
    } else if (recallCount > recallTarget) {
      // Need fewer Recall: swap Recall questions for Application from remaining pools
      let toReduce = recallCount - recallTarget;
      for (let i = 0; i < currentQuestions.length && toReduce > 0; i++) {
        const q = currentQuestions[i];
        if (q.cognitiveComplexity !== 'Recall') continue;

        const pool = skillRemainingPools.get(q.skillId!) || [];
        const appIdx = pool.findIndex(p => p.cognitiveComplexity === 'Application');

        if (appIdx !== -1) {
          const appQuestion = pool.splice(appIdx, 1)[0];
          currentQuestions[i] = appQuestion;
          toReduce--;
        }
      }
    }
  }

  // 5. Interleave interleaved questions (round-robin)
  // Ensure each domain list is independently randomized before interleaving
  const d1 = [...domainQuestions[1]].sort(() => Math.random() - 0.5);
  const d2 = [...domainQuestions[2]].sort(() => Math.random() - 0.5);
  const d3 = [...domainQuestions[3]].sort(() => Math.random() - 0.5);
  const d4 = [...domainQuestions[4]].sort(() => Math.random() - 0.5);

  const result: AnalyzedQuestion[] = [];
  const lists = [d1, d2, d3, d4];
  
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    for (const list of lists) {
      if (list.length > 0) {
        result.push(list.shift()!);
        hasItems = true;
      }
    }
  }

  return result;
}

/**
 * Build a 120-question Full Diagnostic assessment.
 * - Both single and multi-select eligible.
 * - Excludes screener IDs.
 * - Prioritizes multi-select first per skill.
 * - Interleaves domains round-robin.
 */
export function buildDiagnostic(
  analyzedQuestions: AnalyzedQuestion[],
  usedScreenerIds: string[]
): AnalyzedQuestion[] {
  const DIAG_BLUEPRINT: Record<string, { domain: number; slots: number; recallTarget?: number }> = {
    // Domain 1: 38 questions, 9 Recall + 29 Application
    'CON-01': { domain: 1, slots: 3, recallTarget: 9 },
    'DBD-01': { domain: 1, slots: 3, recallTarget: 9 },
    'DBD-03': { domain: 1, slots: 3, recallTarget: 9 },
    'DBD-05': { domain: 1, slots: 2, recallTarget: 9 },
    'DBD-06': { domain: 1, slots: 3, recallTarget: 9 },
    'DBD-07': { domain: 1, slots: 2, recallTarget: 9 },
    'DBD-08': { domain: 1, slots: 3, recallTarget: 9 },
    'DBD-09': { domain: 1, slots: 2, recallTarget: 9 },
    'DBD-10': { domain: 1, slots: 2, recallTarget: 9 },
    'PSY-01': { domain: 1, slots: 3, recallTarget: 9 },
    'PSY-02': { domain: 1, slots: 2, recallTarget: 9 },
    'PSY-03': { domain: 1, slots: 3, recallTarget: 9 },
    'PSY-04': { domain: 1, slots: 3, recallTarget: 9 },

    // Domain 2: 28 questions, 7 Recall + 21 Application
    'ACA-02': { domain: 2, slots: 2, recallTarget: 7 },
    'ACA-03': { domain: 2, slots: 2, recallTarget: 7 },
    'ACA-04': { domain: 2, slots: 2, recallTarget: 7 },
    'ACA-06': { domain: 2, slots: 3, recallTarget: 7 },
    'ACA-07': { domain: 2, slots: 2, recallTarget: 7 },
    'ACA-08': { domain: 2, slots: 2, recallTarget: 7 },
    'ACA-09': { domain: 2, slots: 2, recallTarget: 7 },
    'DEV-01': { domain: 2, slots: 2, recallTarget: 7 },
    'MBH-02': { domain: 2, slots: 2, recallTarget: 7 },
    'MBH-03': { domain: 2, slots: 3, recallTarget: 7 },
    'MBH-04': { domain: 2, slots: 2, recallTarget: 7 },
    'MBH-05': { domain: 2, slots: 2, recallTarget: 7 },

    // Domain 3: 24 questions, 6 Recall + 18 Application
    'FAM-02': { domain: 3, slots: 3, recallTarget: 6 },
    'FAM-03': { domain: 3, slots: 2, recallTarget: 6 },
    'SAF-01': { domain: 3, slots: 4, recallTarget: 6 },
    'SAF-03': { domain: 3, slots: 4, recallTarget: 6 },
    'SAF-04': { domain: 3, slots: 3, recallTarget: 6 },
    'SWP-02': { domain: 3, slots: 2, recallTarget: 6 },
    'SWP-03': { domain: 3, slots: 3, recallTarget: 6 },
    'SWP-04': { domain: 3, slots: 3, recallTarget: 6 },

    // Domain 4: 30 questions, 8 Recall + 22 Application
    'DIV-01': { domain: 4, slots: 2, recallTarget: 8 },
    'DIV-03': { domain: 4, slots: 2, recallTarget: 8 },
    'DIV-05': { domain: 4, slots: 2, recallTarget: 8 },
    'ETH-01': { domain: 4, slots: 3, recallTarget: 8 },
    'ETH-02': { domain: 4, slots: 2, recallTarget: 8 },
    'ETH-03': { domain: 4, slots: 2, recallTarget: 8 },
    'LEG-01': { domain: 4, slots: 2, recallTarget: 8 },
    'LEG-02': { domain: 4, slots: 3, recallTarget: 8 },
    'LEG-03': { domain: 4, slots: 2, recallTarget: 8 },
    'LEG-04': { domain: 4, slots: 2, recallTarget: 8 },
    'RES-02': { domain: 4, slots: 3, recallTarget: 8 },
    'RES-03': { domain: 4, slots: 3, recallTarget: 8 }
  };

  const excludeSet = new Set(usedScreenerIds);

  // 1. Filter: exclude IDs
  const filteredQuestions = analyzedQuestions.filter(q => !excludeSet.has(q.id));

  // 2. Group by skillId for pool selection
  const poolBySkill = new Map<string, AnalyzedQuestion[]>();
  filteredQuestions.forEach(q => {
    if (q.skillId) {
      if (!poolBySkill.has(q.skillId)) {
        poolBySkill.set(q.skillId, []);
      }
      poolBySkill.get(q.skillId)!.push(q);
    }
  });

  const domainQuestions: Record<number, AnalyzedQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
  const skillRemainingPools = new Map<string, AnalyzedQuestion[]>();

  // 3. Selection per skill based on slots, prioritizing multi-select first
  for (const [skillId, config] of Object.entries(DIAG_BLUEPRINT)) {
    const skillPool = poolBySkill.get(skillId) || [];
    if (skillPool.length < config.slots) {
      console.warn(`[AssessmentBuilder] Skill ${skillId} pool is smaller than blueprint slots (${skillPool.length} < ${config.slots}).`);
    }

    const multiSelect = skillPool.filter(q => q.isMultiSelect === true);
    const singleSelect = skillPool.filter(q => q.isMultiSelect !== true);

    const shuffledMulti = [...multiSelect].sort(() => Math.random() - 0.5);
    const shuffledSingle = [...singleSelect].sort(() => Math.random() - 0.5);

    const combined = [...shuffledMulti, ...shuffledSingle];
    const selection = combined.slice(0, config.slots);
    const remaining = combined.slice(config.slots);

    domainQuestions[config.domain].push(...selection);
    skillRemainingPools.set(skillId, remaining);
  }

  // 4. Complexity enforcement per domain
  for (let d = 1; d <= 4; d++) {
    const domainSkills = Object.entries(DIAG_BLUEPRINT).filter(([_, config]) => config.domain === d);
    const recallTarget = domainSkills[0]?.[1]?.recallTarget || 0;
    
    const currentQuestions = domainQuestions[d];
    const getRecallCount = () => currentQuestions.filter(q => q.cognitiveComplexity === 'Recall').length;
    
    let recallCount = getRecallCount();

    if (recallCount < recallTarget) {
      // Need more Recall
      let needed = recallTarget - recallCount;
      for (let i = 0; i < currentQuestions.length && needed > 0; i++) {
        const q = currentQuestions[i];
        if (q.cognitiveComplexity !== 'Application') continue;

        const pool = skillRemainingPools.get(q.skillId!) || [];
        const recallIdx = pool.findIndex(p => p.cognitiveComplexity === 'Recall');

        if (recallIdx !== -1) {
          const recallQuestion = pool.splice(recallIdx, 1)[0];
          currentQuestions[i] = recallQuestion;
          needed--;
        }
      }
    } else if (recallCount > recallTarget) {
      // Need fewer Recall
      let toReduce = recallCount - recallTarget;
      for (let i = 0; i < currentQuestions.length && toReduce > 0; i++) {
        const q = currentQuestions[i];
        if (q.cognitiveComplexity !== 'Recall') continue;

        const pool = skillRemainingPools.get(q.skillId!) || [];
        const appIdx = pool.findIndex(p => p.cognitiveComplexity === 'Application');

        if (appIdx !== -1) {
          const appQuestion = pool.splice(appIdx, 1)[0];
          currentQuestions[i] = appQuestion;
          toReduce--;
        }
      }
    }
  }

  // 5. Interleave interleaved questions (round-robin)
  const d1 = [...domainQuestions[1]].sort(() => Math.random() - 0.5);
  const d2 = [...domainQuestions[2]].sort(() => Math.random() - 0.5);
  const d3 = [...domainQuestions[3]].sort(() => Math.random() - 0.5);
  const d4 = [...domainQuestions[4]].sort(() => Math.random() - 0.5);

  const result: AnalyzedQuestion[] = [];
  const lists = [d1, d2, d3, d4];
  
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    for (const list of lists) {
      if (list.length > 0) {
        result.push(list.shift()!);
        hasItems = true;
      }
    }
  }

  return result;
}
