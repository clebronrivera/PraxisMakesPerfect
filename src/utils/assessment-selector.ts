// src/utils/assessment-selector.ts
// Utility for selecting questions from existing bank with domain-balanced distribution

import { AnalyzedQuestion } from '../brain/question-analyzer';

export interface AssessmentSelectionOptions {
  totalQuestions: number;
  excludeQuestionIds?: Set<string>; // For future: exclude questions already in practice pool
  minPerDomain?: number; // Minimum questions per domain (default: 0)
}

/**
 * Build a domain-balanced full assessment from existing questions
 * Uses largest remainder method to ensure exact total and proportional distribution
 */
export function buildFullAssessment(
  analyzedQuestions: AnalyzedQuestion[],
  options: AssessmentSelectionOptions
): AnalyzedQuestion[] {
  const { totalQuestions, excludeQuestionIds = new Set(), minPerDomain = 0 } = options;

  // Group questions by domain
  const questionsByDomain = new Map<number, AnalyzedQuestion[]>();
  
  // Initialize all 10 domains
  for (let domain = 1; domain <= 10; domain++) {
    questionsByDomain.set(domain, []);
  }

  // Filter and group questions
  analyzedQuestions.forEach(q => {
    // Skip excluded questions
    if (excludeQuestionIds.has(q.id)) {
      return;
    }

    // Add question to all its domains
    q.domains.forEach(domain => {
      const domainQuestions = questionsByDomain.get(domain) || [];
      // Avoid duplicates within domain
      if (!domainQuestions.find(existing => existing.id === q.id)) {
        domainQuestions.push(q);
        questionsByDomain.set(domain, domainQuestions);
      }
    });
  });

  // Calculate proportional allocation using largest remainder method
  const domainAllocations: Array<{ domain: number; quota: number; remainder: number; allocated: number }> = [];
  
  // Step 1: Calculate base quota (proportional share)
  const totalAvailable = Array.from(questionsByDomain.values())
    .reduce((sum, questions) => sum + questions.length, 0);
  
  if (totalAvailable === 0) {
    console.error('No questions available for assessment');
    return [];
  }

  // Calculate proportional quotas
  for (let domain = 1; domain <= 10; domain++) {
    const domainQuestions = questionsByDomain.get(domain) || [];
    const available = domainQuestions.length;
    
    // Proportional share
    const quota = (available / totalAvailable) * totalQuestions;
    const baseQuota = Math.floor(quota);
    const remainder = quota - baseQuota;
    
    // Ensure minimum per domain
    const minQuota = Math.max(baseQuota, minPerDomain);
    
    domainAllocations.push({
      domain,
      quota: minQuota,
      remainder,
      allocated: 0
    });
  }

  // Step 2: Allocate base quotas
  let allocatedSoFar = domainAllocations.reduce((sum, d) => sum + d.quota, 0);

  // Step 3: Largest remainder method to fill remaining slots
  const remaining = totalQuestions - allocatedSoFar;
  
  if (remaining > 0) {
    // Sort by remainder (descending) to allocate remaining slots
    const sortedByRemainder = [...domainAllocations].sort((a, b) => b.remainder - a.remainder);
    
    for (let i = 0; i < remaining && i < sortedByRemainder.length; i++) {
      sortedByRemainder[i].quota += 1;
      allocatedSoFar += 1;
    }
  }

  // Step 4: Select questions from each domain
  const selected: AnalyzedQuestion[] = [];
  const usedQuestionIds = new Set<string>(); // Global deduplication

  for (const allocation of domainAllocations) {
    const domainQuestions = questionsByDomain.get(allocation.domain) || [];
    
    // Filter out already-used questions
    const available = domainQuestions.filter(q => !usedQuestionIds.has(q.id));
    
    // Shuffle and select
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const toSelect = Math.min(allocation.quota, shuffled.length);
    
    for (let i = 0; i < toSelect; i++) {
      const question = shuffled[i];
      selected.push(question);
      usedQuestionIds.add(question.id);
    }

    // Warn if we couldn't get enough questions for this domain
    if (toSelect < allocation.quota) {
      console.warn(
        `Domain ${allocation.domain}: requested ${allocation.quota}, ` +
        `but only ${toSelect} questions available after deduplication`
      );
    }
  }

  // Sanity check
  if (selected.length === 0) {
    console.error('No questions selected for full assessment');
    return [];
  }

  if (selected.length !== totalQuestions) {
    console.warn(
      `Requested ${totalQuestions} questions, but selected ${selected.length} ` +
      `(some domains may have insufficient questions)`
    );
  }

  // Final shuffle to randomize order across domains
  return selected.sort(() => Math.random() - 0.5);
}

/**
 * Build a quick diagnostic (40 questions: 4 per domain)
 * Uses fixed allocation instead of proportional
 */
export function buildQuickDiagnostic(
  analyzedQuestions: AnalyzedQuestion[],
  questionsPerDomain: number = 4,
  excludeQuestionIds?: Set<string>
): AnalyzedQuestion[] {
  return buildFullAssessment(analyzedQuestions, {
    totalQuestions: questionsPerDomain * 10, // 4 * 10 = 40
    excludeQuestionIds,
    minPerDomain: questionsPerDomain
  });
}
