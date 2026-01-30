// Assessment Builder - Builds assessments from question bank with domain balancing
// Uses Praxis test percentages for distribution with availability caps

import { AnalyzedQuestion } from '../brain/question-analyzer';

/**
 * Praxis test content area percentages and domain mappings
 * Based on official Praxis School Psychologist test structure
 */
const PRAXIS_DISTRIBUTION = {
  // Professional Practices That Permeate All Aspects of Service Delivery — ~32% (~40 questions)
  professionalPractices: {
    percentage: 0.32,
    domains: [1, 2], // DBDM, Consultation & Collaboration
    targetQuestions: 40
  },
  // Direct and Indirect Services for Children, Families, and Schools — Student-Level — ~23% (~28 questions)
  studentLevel: {
    percentage: 0.23,
    domains: [3, 4], // Academic Interventions, Mental & Behavioral Health
    targetQuestions: 28
  },
  // Direct and Indirect Services for Children, Families, and Schools — Systems-Level — ~20% (~25 questions)
  systemsLevel: {
    percentage: 0.20,
    domains: [5, 6, 7], // School-Wide Practices, Preventive & Responsive, Family-School Collaboration
    targetQuestions: 25
  },
  // Foundations of School Psychological Service Delivery — ~25% (~32 questions)
  foundations: {
    percentage: 0.25,
    domains: [8, 9, 10], // Diversity & Equity, Research & Evaluation, Legal/Ethics/Professional
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
  excludeQuestionIds: Set<string> = new Set()
): Record<number, number> {
  // First, calculate target questions per Praxis content area
  const areaTargets = {
    professionalPractices: Math.round(PRAXIS_DISTRIBUTION.professionalPractices.percentage * targetCount),
    studentLevel: Math.round(PRAXIS_DISTRIBUTION.studentLevel.percentage * targetCount),
    systemsLevel: Math.round(PRAXIS_DISTRIBUTION.systemsLevel.percentage * targetCount),
    foundations: Math.round(PRAXIS_DISTRIBUTION.foundations.percentage * targetCount)
  };
  
  // Adjust to ensure total equals targetCount (largest remainder method)
  const total = Object.values(areaTargets).reduce((a, b) => a + b, 0);
  const remainder = targetCount - total;
  
  // Distribute remainder to areas with largest fractional parts
  if (remainder !== 0) {
    const areaFractions = [
      { area: 'professionalPractices', frac: (PRAXIS_DISTRIBUTION.professionalPractices.percentage * targetCount) - areaTargets.professionalPractices },
      { area: 'studentLevel', frac: (PRAXIS_DISTRIBUTION.studentLevel.percentage * targetCount) - areaTargets.studentLevel },
      { area: 'systemsLevel', frac: (PRAXIS_DISTRIBUTION.systemsLevel.percentage * targetCount) - areaTargets.systemsLevel },
      { area: 'foundations', frac: (PRAXIS_DISTRIBUTION.foundations.percentage * targetCount) - areaTargets.foundations }
    ];
    
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
  for (let domain = 1; domain <= 10; domain++) {
    availableByDomain[domain] = analyzedQuestions.filter(
      q => q.domains.includes(domain) && !excludeQuestionIds.has(q.id)
    ).length;
  }
  
  // Calculate domain distribution within each content area
  const domainAlloc: Record<number, number> = {};
  for (let domain = 1; domain <= 10; domain++) {
    domainAlloc[domain] = 0;
  }
  
  // Professional Practices: distribute between domains 1 and 2
  const profPracticesTotal = availableByDomain[1] + availableByDomain[2];
  if (profPracticesTotal > 0) {
    domainAlloc[1] = Math.round((availableByDomain[1] / profPracticesTotal) * areaTargets.professionalPractices);
    domainAlloc[2] = areaTargets.professionalPractices - domainAlloc[1];
  }
  
  // Student-Level: distribute between domains 3 and 4
  const studentLevelTotal = availableByDomain[3] + availableByDomain[4];
  if (studentLevelTotal > 0) {
    domainAlloc[3] = Math.round((availableByDomain[3] / studentLevelTotal) * areaTargets.studentLevel);
    domainAlloc[4] = areaTargets.studentLevel - domainAlloc[3];
  }
  
  // Systems-Level: distribute between domains 5, 6, and 7
  const systemsLevelTotal = availableByDomain[5] + availableByDomain[6] + availableByDomain[7];
  if (systemsLevelTotal > 0) {
    domainAlloc[5] = Math.round((availableByDomain[5] / systemsLevelTotal) * areaTargets.systemsLevel);
    const remaining56 = areaTargets.systemsLevel - domainAlloc[5];
    const domain67Total = availableByDomain[6] + availableByDomain[7];
    if (domain67Total > 0) {
      domainAlloc[6] = Math.round((availableByDomain[6] / domain67Total) * remaining56);
      domainAlloc[7] = remaining56 - domainAlloc[6];
    }
  }
  
  // Foundations: distribute between domains 8, 9, and 10
  const foundationsTotal = availableByDomain[8] + availableByDomain[9] + availableByDomain[10];
  if (foundationsTotal > 0) {
    domainAlloc[8] = Math.round((availableByDomain[8] / foundationsTotal) * areaTargets.foundations);
    const remaining89 = areaTargets.foundations - domainAlloc[8];
    const domain910Total = availableByDomain[9] + availableByDomain[10];
    if (domain910Total > 0) {
      domainAlloc[9] = Math.round((availableByDomain[9] / domain910Total) * remaining89);
      domainAlloc[10] = remaining89 - domainAlloc[9];
    }
  }
  
  // Cap allocations to available questions and track deficit
  let totalDeficit = 0;
  const floorAlloc: Record<number, number> = {};
  
  for (let domain = 1; domain <= 10; domain++) {
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
  excludeQuestionIds: string[] = []
): AnalyzedQuestion[] {
  const excludeSet = new Set(excludeQuestionIds);
  const selectedIds = new Set<string>();
  const selected: AnalyzedQuestion[] = [];
  
  // Calculate domain distribution
  const distribution = calculateDomainDistribution(targetCount, analyzedQuestions, excludeSet);
  
  // Sample questions per domain without replacement
  for (let domain = 1; domain <= 10; domain++) {
    const targetCountForDomain = distribution[domain] ?? 0;
    
    if (targetCountForDomain === 0) continue;
    
    // Get available questions for this domain
    const domainQuestions = analyzedQuestions.filter(
      q => q.domains.includes(domain) && 
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
