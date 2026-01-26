/**
 * Question Generation Script from Manifest
 * 
 * Reads quality-reports/generation-manifest.json and generates questions
 * for skills in wave1 and wave2 using decisionRule and commonWrongRules.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getSkillById, Skill, SkillId } from '../src/brain/skill-map';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ManifestTarget {
  skillId: string;
  domain: number;
  current: number;
  add: number;
  domainName: string;
}

interface Manifest {
  generated: string;
  summary: {
    wave1_skills: number;
    wave1_questions: number;
    wave2_skills: number;
    wave2_questions: number;
    total_new_questions: number;
  };
  wave1: {
    description: string;
    targets: ManifestTarget[];
  };
  wave2: {
    description: string;
    targets: ManifestTarget[];
  };
}

interface GeneratedQuestion {
  id: string;
  question: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string[];
  rationale: string;
  skillId: string;
  domain: number;
  metadata?: {
    generatedAt: number;
    source: 'manifest-generation';
    wave: 'wave1' | 'wave2';
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  manifestPath: './quality-reports/generation-manifest.json',
  outputPath: './quality-reports/wave1-generated.json',
  auditScript: './scripts/audit-distractor-quality.ts',
};

// ============================================================================
// QUALITY GATES
// ============================================================================

/**
 * Check if distractor meets minimum length requirement
 */
function meetsMinLength(distractor: string): boolean {
  return distractor.length >= 25;
}

/**
 * Check if distractor length is within acceptable range relative to correct answer
 */
function meetsLengthRatio(correctAnswer: string, distractor: string): boolean {
  const correctLength = correctAnswer.length;
  const distractorLength = distractor.length;
  
  if (correctLength === 0) return false;
  
  const ratio = distractorLength / correctLength;
  return ratio >= 0.5 && ratio <= 1.75;
}

/**
 * Check if distractor is a complete sentence/phrase (not single word)
 */
function isCompletePhrase(text: string): boolean {
  // Check if it contains spaces or punctuation (indicating it's more than a single word)
  return text.includes(' ') || text.includes('.') || text.includes(',') || text.includes(';');
}

/**
 * Validate all distractors against quality gates
 */
function validateDistractors(
  correctAnswer: string,
  distractors: string[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (let i = 0; i < distractors.length; i++) {
    const distractor = distractors[i];

    if (!meetsMinLength(distractor)) {
      issues.push(`Distractor ${i + 1} is too short (${distractor.length} chars, minimum 25)`);
    }

    if (!meetsLengthRatio(correctAnswer, distractor)) {
      const ratio = (distractor.length / correctAnswer.length).toFixed(2);
      issues.push(
        `Distractor ${i + 1} length ratio ${ratio}x is outside acceptable range (0.5-1.75)`
      );
    }

    if (!isCompletePhrase(distractor)) {
      issues.push(`Distractor ${i + 1} is a single word, not a complete phrase`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// QUESTION GENERATION
// ============================================================================

/**
 * Generate a question stem based on skill information
 */
function generateQuestionStem(skill: Skill, domainName: string, questionNumber: number): string {
  // Create a question stem that tests the decisionRule
  // Use the skill description and decisionRule to craft a scenario-based question
  
  // Extract key concept from decisionRule for more specific stems
  const decisionRuleSentences = skill.decisionRule.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyConcept = decisionRuleSentences.length > 0 
    ? decisionRuleSentences[0].substring(0, 100).trim()
    : skill.name;
  
  const stemTemplates = [
    `A school psychologist is working in the context of ${domainName}. ${skill.description} Which of the following best demonstrates the correct application of this principle?`,
    `In the context of ${domainName}, a school psychologist needs to apply knowledge about ${skill.name.toLowerCase()}. ${skill.description} Which of the following represents the most appropriate approach?`,
    `A school psychologist is considering how to apply ${skill.name.toLowerCase()} in a ${domainName} situation. ${skill.description} Which of the following is the most accurate statement?`,
    `When working with ${domainName} scenarios, a school psychologist must understand ${skill.name.toLowerCase()}. ${skill.description} Which of the following best reflects correct understanding of this principle?`,
    `A school psychologist encounters a situation requiring knowledge of ${skill.name.toLowerCase()} in ${domainName}. ${skill.description} Which of the following demonstrates the correct application of this knowledge?`,
  ];

  // Use skillId + questionNumber to pick template consistently but vary across questions
  const hash = (skill.skillId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + questionNumber) % stemTemplates.length;
  const template = stemTemplates[hash];
  
  return template;
}

/**
 * Generate correct answer from decisionRule
 */
function generateCorrectAnswer(skill: Skill): string {
  // Extract the key principle from decisionRule
  // The decisionRule often contains the answer embedded in it
  // We'll create a concise answer that reflects the decisionRule
  
  // Try to extract a key statement from decisionRule
  const sentences = skill.decisionRule.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length > 0) {
    // Use the first substantial sentence
    let answer = sentences[0].trim();
    
    // If the answer is very short (< 50 chars), try to include more context
    // to make it easier to create appropriately-sized distractors
    if (answer.length < 50 && sentences.length > 1) {
      // Combine first two sentences if they're both reasonable length
      const combined = `${answer} ${sentences[1].trim()}`;
      if (combined.length <= 200) {
        answer = combined;
      }
    }
    
    // If it's too long, try to shorten it
    if (answer.length > 200) {
      // Take first clause or simplify
      const clauses = answer.split(',').filter(c => c.trim().length > 30);
      if (clauses.length > 0) {
        answer = clauses[0].trim();
      } else {
        // Fallback: take first 150 chars at sentence boundary
        const truncated = answer.substring(0, 150);
        const lastPeriod = truncated.lastIndexOf('.');
        answer = lastPeriod > 50 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
      }
    }
    
    // Ensure minimum length for better distractor matching
    if (answer.length < 40) {
      // Try to expand with additional context from description or decisionRule
      const additionalContext = skill.description.length > answer.length 
        ? skill.description.substring(0, 60 - answer.length)
        : '';
      if (additionalContext) {
        answer = `${answer} ${additionalContext}`.substring(0, 100).trim();
      }
    }
    
    // Ensure it's a complete statement
    if (!answer.endsWith('.') && !answer.endsWith('!') && !answer.endsWith('?')) {
      answer += '.';
    }
    
    return answer;
  }
  
  // Fallback: use decisionRule directly, truncated if needed
  let answer = skill.decisionRule.endsWith('.') ? skill.decisionRule : skill.decisionRule + '.';
  
  // If still very short, try to expand
  if (answer.length < 40) {
    const expanded = `${answer} This principle guides appropriate practice in school psychology.`;
    answer = expanded.length <= 150 ? expanded : answer;
  }
  
  if (answer.length > 200) {
    // Truncate at sentence boundary
    const truncated = answer.substring(0, 200);
    const lastPeriod = truncated.lastIndexOf('.');
    answer = lastPeriod > 100 
      ? truncated.substring(0, lastPeriod + 1)
      : truncated + '...';
  }
  
  return answer;
}

/**
 * Generate distractors from commonWrongRules
 */
function generateDistractors(skill: Skill, correctAnswer: string): string[] {
  const distractors: string[] = [];
  const usedIndices = new Set<number>();
  const targetLength = correctAnswer.length;
  const isShortAnswer = targetLength < 80;
  
  // Convert commonWrongRules into complete distractor statements
  // Handle different types of wrong rules (some are already sentences, some are phrases)
  // Use shorter templates for short answers
  const distractorTemplates = isShortAnswer ? [
    // Short templates for short answers
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule.length <= targetLength * 1.75 ? rule : rule.substring(0, Math.floor(targetLength * 1.75)) + '...';
      }
      // Create concise distractor
      if (rule.length <= 50) {
        return `${rule}.`;
      }
      return rule.substring(0, 50).trim() + '...';
    },
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule.length <= targetLength * 1.75 ? rule : rule.substring(0, Math.floor(targetLength * 1.75)) + '...';
      }
      const lowerRule = rule.toLowerCase();
      if (lowerRule.startsWith('not ')) {
        return `This fails to ${lowerRule.substring(4)}.`;
      }
      return `This incorrectly ${lowerRule}.`;
    },
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule.length <= targetLength * 1.75 ? rule : rule.substring(0, Math.floor(targetLength * 1.75)) + '...';
      }
      return `This reflects ${rule.toLowerCase()}.`;
    },
  ] : [
    (rule: string) => {
      // If rule already looks like a complete sentence, use it directly
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule;
      }
      // If rule starts with a verb (gerund form), use "This approach involves..."
      if (rule.toLowerCase().startsWith('confusing') || rule.toLowerCase().startsWith('not ') || 
          rule.toLowerCase().startsWith('believing') || rule.toLowerCase().startsWith('using')) {
        return `This approach involves ${rule.toLowerCase()}.`;
      }
      // Otherwise, frame as misconception
      return `This approach incorrectly assumes that ${rule.toLowerCase()}.`;
    },
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule;
      }
      return `A common misconception is that ${rule.toLowerCase()}, which is not supported by evidence-based practice.`;
    },
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule;
      }
      // Check if rule is a noun phrase or action
      if (rule.toLowerCase().includes('confusing') || rule.toLowerCase().includes('not ')) {
        return `This response reflects ${rule.toLowerCase()}, which does not align with best practices.`;
      }
      return `This option demonstrates ${rule.toLowerCase()}, which is inconsistent with the correct approach.`;
    },
    (rule: string) => {
      if (rule.endsWith('.') || rule.endsWith('!') || rule.endsWith('?')) {
        return rule;
      }
      // Make it a complete statement
      const lowerRule = rule.toLowerCase();
      if (lowerRule.startsWith('not ')) {
        return `This approach fails to recognize that ${lowerRule.substring(4)}.`;
      }
      return `This response incorrectly applies ${lowerRule}.`;
    },
  ];
  
  // Try to generate 3 distractors
  for (let attempt = 0; attempt < skill.commonWrongRules.length && distractors.length < 3; attempt++) {
    // Find best unused rule
    let bestRule: string | null = null;
    let bestIndex = -1;
    let bestDistractor: string | null = null;
    let bestLengthDiff = Infinity;
    
    for (let i = 0; i < skill.commonWrongRules.length; i++) {
      if (usedIndices.has(i)) continue;
      
      const rule = skill.commonWrongRules[i];
      
      // Try each template to find best fit
      for (const template of distractorTemplates) {
        const candidate = template(rule);
        
        // Check quality gates
        if (!meetsMinLength(candidate)) continue;
        if (!meetsLengthRatio(correctAnswer, candidate)) continue;
        if (!isCompletePhrase(candidate)) continue;
        
        // Prefer distractors closer to target length
        const lengthDiff = Math.abs(candidate.length - targetLength);
        if (lengthDiff < bestLengthDiff) {
          bestRule = rule;
          bestIndex = i;
          bestDistractor = candidate;
          bestLengthDiff = lengthDiff;
        }
      }
    }
    
    // If we found a good distractor, use it
    if (bestDistractor && bestIndex >= 0) {
      distractors.push(bestDistractor);
      usedIndices.add(bestIndex);
    } else {
      // Try to use any remaining rule, expanding it if needed
      for (let i = 0; i < skill.commonWrongRules.length && distractors.length < 3; i++) {
        if (usedIndices.has(i)) continue;
        
        const rule = skill.commonWrongRules[i];
        let distractor = distractorTemplates[0](rule); // Use first template
        
        // Fix length if needed
        if (distractor.length < 25) {
          distractor = `This approach incorrectly assumes that ${rule.toLowerCase()}, which is not supported by evidence-based practice in school psychology.`;
        }
        
        // Ensure proper punctuation
        if (!distractor.endsWith('.') && !distractor.endsWith('!') && !distractor.endsWith('?')) {
          distractor += '.';
        }
        
        distractors.push(distractor);
        usedIndices.add(i);
        break;
      }
    }
  }
  
  // If still don't have 3, try to create variations
  while (distractors.length < 3 && skill.commonWrongRules.length > 0) {
    // Use a rule we haven't used yet, or reuse one with variation
    for (let i = 0; i < skill.commonWrongRules.length && distractors.length < 3; i++) {
      const rule = skill.commonWrongRules[i];
      const variation = `This response incorrectly reflects ${rule.toLowerCase()}, which does not accurately represent the correct approach.`;
      
      // Check if this variation is sufficiently different from existing distractors
      const isDuplicate = distractors.some(d => {
        const similarity = calculateSimilarity(d.toLowerCase(), variation.toLowerCase());
        return similarity > 0.8;
      });
      
      if (!isDuplicate) {
        distractors.push(variation);
        break;
      }
    }
    
    // If we can't create more unique distractors, break
    if (distractors.length < 3) break;
  }
  
  return distractors.slice(0, 3); // Ensure exactly 3
}

/**
 * Simple similarity calculation (Jaccard-like)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Generate a single question for a skill
 */
function generateQuestion(
  skill: Skill,
  target: ManifestTarget,
  questionNumber: number
): GeneratedQuestion | null {
  // Generate question stem
  const questionStem = generateQuestionStem(skill, target.domainName, questionNumber);
  
  // Generate correct answer from decisionRule
  const correctAnswer = generateCorrectAnswer(skill);
  
  // Generate distractors from commonWrongRules
  const distractorTexts = generateDistractors(skill, correctAnswer);
  
  // Validate distractors
  const validation = validateDistractors(correctAnswer, distractorTexts);
  
  if (!validation.valid) {
    console.warn(`  ⚠️  Quality gate failed for question ${questionNumber}:`);
    validation.issues.forEach(issue => console.warn(`     - ${issue}`));
    
    // Try to fix distractors
    const fixedDistractors = fixDistractors(correctAnswer, distractorTexts, skill);
    const fixedValidation = validateDistractors(correctAnswer, fixedDistractors);
    
    if (!fixedValidation.valid) {
      console.error(`  ❌ Could not fix quality issues, skipping question ${questionNumber}`);
      return null;
    }
    
    distractorTexts.length = 0;
    distractorTexts.push(...fixedDistractors);
  }
  
  // Ensure we have exactly 3 distractors
  if (distractorTexts.length !== 3) {
    console.warn(`  ⚠️  Expected 3 distractors, got ${distractorTexts.length}`);
    if (distractorTexts.length < 3) {
      console.error(`  ❌ Not enough distractors, skipping question ${questionNumber}`);
      return null;
    }
    // If more than 3, take first 3
    distractorTexts.splice(3);
  }
  
  // Combine correct answer and distractors
  const allAnswers = [correctAnswer, ...distractorTexts];
  
  // Shuffle answers (using deterministic shuffle based on skillId + questionNumber)
  const seed = skill.skillId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + questionNumber;
  const shuffled = shuffleArray(allAnswers, seed);
  
  // Find correct answer position
  const correctIndex = shuffled.findIndex(a => a === correctAnswer);
  const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, or D
  
  // Build choices object
  const choices = {
    A: shuffled[0],
    B: shuffled[1],
    C: shuffled[2],
    D: shuffled[3],
  };
  
  // Generate rationale
  const rationale = `Option (${correctLetter}) is correct. ${skill.decisionRule} The other options are incorrect because they reflect common misconceptions: ${distractorTexts.map((d, i) => `option ${String.fromCharCode(65 + shuffled.indexOf(d))} ${skill.commonWrongRules[i] || 'does not accurately reflect the principle'}`).join('; ')}.`;
  
  // Generate question ID
  const questionId = `GEN-${skill.skillId}-${Date.now()}-${questionNumber}`;
  
  return {
    id: questionId,
    question: questionStem,
    choices,
    correct_answer: [correctLetter],
    rationale,
    skillId: skill.skillId,
    domain: target.domain,
    metadata: {
      generatedAt: Date.now(),
      source: 'manifest-generation',
      wave: 'wave1',
    },
  };
}

/**
 * Try to fix distractors that failed quality gates
 */
function fixDistractors(
  correctAnswer: string,
  distractors: string[],
  skill: Skill
): string[] {
  const fixed: string[] = [];
  const targetLength = correctAnswer.length;
  const minLength = Math.max(25, Math.floor(targetLength * 0.5));
  const maxLength = Math.floor(targetLength * 1.75);
  
  // If correct answer is very short, we need to make distractors similarly concise
  // but still meet minimum length requirement
  const isShortAnswer = targetLength < 50;
  
  for (let i = 0; i < distractors.length; i++) {
    const distractor = distractors[i];
    let fixedDistractor = distractor.trim();
    
    // If correct answer is short, create concise distractors
    if (isShortAnswer) {
      // Use a shorter template for short answers
      const shortTemplates = [
        (rule: string) => {
          if (rule.length < 20) return rule;
          // Extract key phrase
          const words = rule.split(' ');
          return words.slice(0, 8).join(' ') + '.';
        },
        (rule: string) => {
          // Make it concise but complete
          if (rule.length <= 40) return rule.endsWith('.') ? rule : rule + '.';
          return rule.substring(0, 40).trim() + '...';
        },
      ];
      
      // Try to create a concise version from commonWrongRules
      if (i < skill.commonWrongRules.length) {
        const rule = skill.commonWrongRules[i];
        const concise = shortTemplates[i % shortTemplates.length](rule);
        fixedDistractor = concise.length >= minLength && concise.length <= maxLength 
          ? concise 
          : fixedDistractor;
      }
    }
    
    // Fix length issues
    if (fixedDistractor.length < minLength) {
      // Expand short distractors, but keep them proportional
      if (isShortAnswer) {
        // For short answers, add minimal context
        fixedDistractor = `${fixedDistractor} This is incorrect.`;
      } else {
        fixedDistractor = `This approach incorrectly assumes that ${fixedDistractor.toLowerCase()}, which is not supported by evidence-based practice.`;
      }
    }
    
    // Check length ratio
    const ratio = fixedDistractor.length / targetLength;
    if (ratio < 0.5) {
      // Too short - add more context
      if (isShortAnswer) {
        fixedDistractor = `${fixedDistractor} This does not align with best practices.`;
      } else {
        fixedDistractor = `A common misconception is that ${fixedDistractor.toLowerCase()}, but this does not align with best practices in school psychology.`;
      }
    } else if (ratio > 1.75) {
      // Too long - truncate at sentence boundary
      const truncated = fixedDistractor.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastComma = truncated.lastIndexOf(',');
      const boundary = Math.max(lastPeriod, lastComma);
      
      if (boundary > maxLength * 0.5) {
        fixedDistractor = truncated.substring(0, boundary + (lastPeriod === boundary ? 1 : 0));
      } else {
        // No good boundary, truncate and add ellipsis
        fixedDistractor = truncated.trim() + '...';
      }
    }
    
    // Ensure it's a complete phrase
    if (!isCompletePhrase(fixedDistractor)) {
      fixedDistractor = `This approach incorrectly uses ${fixedDistractor.toLowerCase()}.`;
    }
    
    // Ensure it ends with punctuation
    if (!fixedDistractor.endsWith('.') && !fixedDistractor.endsWith('!') && !fixedDistractor.endsWith('?')) {
      fixedDistractor += '.';
    }
    
    // Final length check - if still outside range, try one more time
    const finalRatio = fixedDistractor.length / targetLength;
    if (finalRatio < 0.5 || finalRatio > 1.75) {
      // Last resort: create a simple statement
      if (i < skill.commonWrongRules.length) {
        const rule = skill.commonWrongRules[i];
        fixedDistractor = `This approach reflects ${rule.toLowerCase()}.`;
        
        // If still too long, truncate
        if (fixedDistractor.length > maxLength) {
          fixedDistractor = fixedDistractor.substring(0, maxLength - 3) + '...';
        }
      }
    }
    
    fixed.push(fixedDistractor);
  }
  
  return fixed;
}

/**
 * Shuffle array deterministically
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let rng = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    rng = (rng * 9301 + 49297) % 233280;
    const j = Math.floor((rng / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// ============================================================================
// DISTRACTOR AUDIT
// ============================================================================

interface AuditIssue {
  questionId: string;
  skillId: string | null;
  type: 'min-length' | 'length-ratio' | 'single-word' | 'other';
  distractor: string;
  choiceLetter: string;
  details: string;
}

interface AuditResult {
  totalQuestions: number;
  passing: number;
  failing: number;
  issues: AuditIssue[];
  failingQuestions: Array<{
    id: string;
    skillId: string | null;
    issues: AuditIssue[];
  }>;
}

/**
 * Run distractor audit on generated questions
 */
function runDistractorAudit(questions: GeneratedQuestion[]): AuditResult {
  const issues: AuditIssue[] = [];
  const failingQuestions: Array<{ id: string; skillId: string | null; issues: AuditIssue[] }> = [];
  
  for (const question of questions) {
    const questionIssues: AuditIssue[] = [];
    
    // Get correct answer
    const correctAnswer = question.choices[question.correct_answer[0] as keyof typeof question.choices];
    
    // Check each distractor
    for (const [letter, choice] of Object.entries(question.choices)) {
      if (letter === question.correct_answer[0]) continue; // Skip correct answer
      
      // Check minimum length
      if (!meetsMinLength(choice)) {
        const issue: AuditIssue = {
          questionId: question.id,
          skillId: question.skillId,
          type: 'min-length',
          distractor: choice,
          choiceLetter: letter,
          details: `Distractor is ${choice.length} characters, minimum is 25`,
        };
        issues.push(issue);
        questionIssues.push(issue);
      }
      
      // Check length ratio
      if (!meetsLengthRatio(correctAnswer, choice)) {
        const ratio = (choice.length / correctAnswer.length).toFixed(2);
        const issue: AuditIssue = {
          questionId: question.id,
          skillId: question.skillId,
          type: 'length-ratio',
          distractor: choice,
          choiceLetter: letter,
          details: `Length ratio ${ratio}x is outside acceptable range (0.5-1.75)`,
        };
        issues.push(issue);
        questionIssues.push(issue);
      }
      
      // Check if complete phrase
      if (!isCompletePhrase(choice)) {
        const issue: AuditIssue = {
          questionId: question.id,
          skillId: question.skillId,
          type: 'single-word',
          distractor: choice,
          choiceLetter: letter,
          details: 'Distractor is a single word, not a complete phrase',
        };
        issues.push(issue);
        questionIssues.push(issue);
      }
    }
    
    if (questionIssues.length > 0) {
      failingQuestions.push({
        id: question.id,
        skillId: question.skillId,
        issues: questionIssues,
      });
    }
  }
  
  return {
    totalQuestions: questions.length,
    passing: questions.length - failingQuestions.length,
    failing: failingQuestions.length,
    issues,
    failingQuestions,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Question Generation from Manifest');
  console.log('================================\n');

  // Load manifest
  const manifestPath = path.resolve(CONFIG.manifestPath);
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest file not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`Loaded manifest: ${manifest.wave1.targets.length} skills in wave1\n`);

  const generatedQuestions: GeneratedQuestion[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process wave1 targets
  console.log('Generating questions for Wave 1 (critical gaps)...\n');
  
  for (const target of manifest.wave1.targets) {
    // Look up skill
    const skill = getSkillById(target.skillId as SkillId);
    
    if (!skill) {
      console.error(`❌ Skill not found: ${target.skillId}`);
      failCount += target.add;
      continue;
    }

    console.log(`Processing ${target.skillId} (Domain ${target.domain}: ${target.domainName})`);
    console.log(`  Skill: ${skill.name}`);
    console.log(`  Target: Generate ${target.add} questions`);

    let skillSuccessCount = 0;
    
    // Generate the specified number of questions
    for (let i = 1; i <= target.add; i++) {
      const question = generateQuestion(skill, target, i);
      
      if (question) {
        generatedQuestions.push(question);
        skillSuccessCount++;
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`  ✅ Generated ${skillSuccessCount} questions for ${target.skillId} (Domain ${target.domain})\n`);
  }

  // Save generated questions
  const outputPath = path.resolve(CONFIG.outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(generatedQuestions, null, 2));
  console.log(`\n✅ Saved ${generatedQuestions.length} questions to ${outputPath}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total questions generated: ${successCount}`);
  console.log(`Failed generations: ${failCount}`);
  console.log(`Success rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);

  // Run distractor audit
  console.log('\n' + '='.repeat(60));
  console.log('RUNNING DISTRACTOR AUDIT');
  console.log('='.repeat(60));
  
  const auditResults = runDistractorAudit(generatedQuestions);
  
  console.log('\nAudit Results:');
  console.log(`  Total questions audited: ${auditResults.totalQuestions}`);
  console.log(`  Questions passing: ${auditResults.passing}`);
  console.log(`  Questions failing: ${auditResults.failing}`);
  console.log(`  Pass rate: ${((auditResults.passing / auditResults.totalQuestions) * 100).toFixed(1)}%`);
  
  if (auditResults.issues.length > 0) {
    console.log(`\n  Issues found:`);
    const issuesByType = auditResults.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [type, count] of Object.entries(issuesByType)) {
      console.log(`    ${type}: ${count}`);
    }
    
    if (auditResults.failingQuestions.length > 0) {
      console.log(`\n  Questions with issues:`);
      auditResults.failingQuestions.slice(0, 10).forEach(q => {
        console.log(`    - ${q.id} (${q.skillId || 'unknown'}): ${q.issues.length} issues`);
      });
      if (auditResults.failingQuestions.length > 10) {
        console.log(`    ... and ${auditResults.failingQuestions.length - 10} more`);
      }
    }
  }

  console.log('\n✅ Generation complete!\n');
}

main().catch(console.error);
