// Assessment Builder - Builds assessments using generated questions
// Converts GeneratedQuestion to AnalyzedQuestion and builds complete assessments

import { generateQuestion, GeneratedQuestion, GenerateQuestionOptions } from './question-generator';
import { SkillId, getSkillById, getSkillsForDomain, DomainId } from './skill-map';
import { AnalyzedQuestion } from './question-analyzer';

/**
 * Convert a GeneratedQuestion to AnalyzedQuestion format
 */
export function convertToAnalyzedQuestion(
  generated: GeneratedQuestion,
  skillId: SkillId
): AnalyzedQuestion {
  const domain = getDomainFromSkillId(skillId);
  const skill = getSkillById(skillId);
  
  // Detect question type from stem
  const questionText = generated.question.toLowerCase();
  const isScenario = questionText.includes('school psychologist') || 
                     questionText.includes('teacher') || 
                     questionText.includes('student') ||
                     questionText.length > 150;
  
  // Detect stem type
  let stemType = 'Generated';
  if (questionText.includes('first step') || questionText.includes('should first')) {
    stemType = 'First Step';
  } else if (questionText.includes('most appropriate')) {
    stemType = 'Most Appropriate';
  } else if (questionText.includes('best example')) {
    stemType = 'Best Example';
  } else if (questionText.includes('best describes')) {
    stemType = 'Best Description';
  }
  
  // Estimate DOK from skill or default to 2
  const dok = skill?.dokRange ? Math.floor((skill.dokRange[0] + skill.dokRange[1]) / 2) : 2;
  
  return {
    id: generated.id,
    question: generated.question,
    choices: generated.choices,
    correct_answer: generated.correct_answer,
    rationale: generated.rationale,
    skillId,
    domains: [domain],
    dok,
    questionType: isScenario ? 'Scenario-Based' : 'Direct Knowledge',
    stemType,
    keyConcepts: [],
    isGenerated: true
  };
}

/**
 * Get domain number from skill ID
 */
function getDomainFromSkillId(skillId: SkillId): DomainId {
  const skill = getSkillById(skillId);
  if (!skill) return 1;
  
  // Map skill IDs to domains based on prefix
  const domainMap: Record<string, number> = {
    'DBDM': 1, 'CC': 2, 'ACAD': 3, 'MBH': 4, 'SWP': 5,
    'PC': 6, 'FSC': 7, 'DIV': 8, 'RES': 9, 'LEG': 10
  };
  
  const prefix = skillId.split('-')[0];
  return (domainMap[prefix] || 1) as DomainId;
}

/**
 * Options for building an assessment
 */
export interface BuildAssessmentOptions {
  /** Number of questions per domain (e.g., 2 for pre-assessment) */
  questionsPerDomain?: number;
  /** Total number of questions (alternative to questionsPerDomain) */
  totalQuestions?: number;
  /** Specific domains to include (1-10). If not provided, includes all domains */
  domains?: DomainId[];
  /** Specific skills to target. If provided, overrides domain selection */
  targetSkills?: SkillId[];
  /** Options to pass to question generator */
  generatorOptions?: Omit<GenerateQuestionOptions, 'templateId' | 'slotValues'>;
  /** Maximum attempts to generate a valid question before giving up */
  maxAttemptsPerQuestion?: number;
}

/**
 * Build an assessment using generated questions
 * Returns an array of AnalyzedQuestion ready for use in assessments
 */
export function buildAssessmentFromGenerated(
  options: BuildAssessmentOptions = {}
): AnalyzedQuestion[] {
  const {
    questionsPerDomain,
    totalQuestions,
    domains = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as DomainId[],
    targetSkills,
    generatorOptions = {},
    maxAttemptsPerQuestion = 10
  } = options;

  const questions: AnalyzedQuestion[] = [];
  const usedQuestionIds = new Set<string>();
  let seed = generatorOptions.seed || Date.now();

  // If specific skills are provided, use those
  if (targetSkills && targetSkills.length > 0) {
    for (const skillId of targetSkills) {
      if (totalQuestions && questions.length >= totalQuestions) break;
      
      let attempts = 0;
      let question: AnalyzedQuestion | null = null;
      
      while (attempts < maxAttemptsPerQuestion && !question) {
        const generated = generateQuestion(skillId, {
          ...generatorOptions,
          seed: seed++
        });
        
        if (generated && !usedQuestionIds.has(generated.id)) {
          question = convertToAnalyzedQuestion(generated, skillId);
          usedQuestionIds.add(generated.id);
        }
        attempts++;
      }
      
      if (question) {
        questions.push(question);
      }
    }
    
    return questions;
  }

  // Otherwise, build by domain
  if (questionsPerDomain) {
    // Build X questions per domain
    for (const domain of domains) {
      const domainSkills = getSkillsForDomain(domain);
      
      if (domainSkills.length === 0) {
        console.warn(`No skills found for domain ${domain}`);
        continue;
      }
      
      // Shuffle skills to get variety
      const shuffledSkills = [...domainSkills].sort(() => Math.random() - 0.5);
      
      let questionsGenerated = 0;
      let skillIndex = 0;
      
      while (questionsGenerated < questionsPerDomain && skillIndex < shuffledSkills.length) {
        const skillId = shuffledSkills[skillIndex].skillId;
        let attempts = 0;
        let question: AnalyzedQuestion | null = null;
        
        while (attempts < maxAttemptsPerQuestion && !question) {
          const generated = generateQuestion(skillId, {
            ...generatorOptions,
            seed: seed++
          });
          
          if (generated && !usedQuestionIds.has(generated.id)) {
            question = convertToAnalyzedQuestion(generated, skillId);
            usedQuestionIds.add(generated.id);
            questionsGenerated++;
          }
          attempts++;
        }
        
        if (question) {
          questions.push(question);
        }
        
        skillIndex++;
        
        // If we've tried all skills and still need more questions, cycle back
        if (skillIndex >= shuffledSkills.length && questionsGenerated < questionsPerDomain) {
          skillIndex = 0;
          // Prevent infinite loop if we can't generate enough unique questions
          if (attempts >= maxAttemptsPerQuestion * shuffledSkills.length) {
            console.warn(`Could not generate ${questionsPerDomain} questions for domain ${domain}`);
            break;
          }
        }
      }
    }
  } else if (totalQuestions) {
    // Build totalQuestions questions distributed across domains
    const questionsPerDomainCount = Math.ceil(totalQuestions / domains.length);
    const domainQuestions: AnalyzedQuestion[] = [];
    
    // First pass: try to get questionsPerDomainCount from each domain
    for (const domain of domains) {
      const domainSkills = getSkillsForDomain(domain);
      
      if (domainSkills.length === 0) continue;
      
      const shuffledSkills = [...domainSkills].sort(() => Math.random() - 0.5);
      let questionsGenerated = 0;
      let skillIndex = 0;
      
      while (questionsGenerated < questionsPerDomainCount && skillIndex < shuffledSkills.length) {
        const skillId = shuffledSkills[skillIndex].skillId;
        let attempts = 0;
        let question: AnalyzedQuestion | null = null;
        
        while (attempts < maxAttemptsPerQuestion && !question) {
          const generated = generateQuestion(skillId, {
            ...generatorOptions,
            seed: seed++
          });
          
          if (generated && !usedQuestionIds.has(generated.id)) {
            question = convertToAnalyzedQuestion(generated, skillId);
            usedQuestionIds.add(generated.id);
            questionsGenerated++;
          }
          attempts++;
        }
        
        if (question) {
          domainQuestions.push(question);
        }
        
        skillIndex++;
        
        if (skillIndex >= shuffledSkills.length && questionsGenerated < questionsPerDomainCount) {
          skillIndex = 0;
          if (attempts >= maxAttemptsPerQuestion * shuffledSkills.length) {
            break;
          }
        }
      }
    }
    
    // Shuffle and take totalQuestions
    const shuffled = domainQuestions.sort(() => Math.random() - 0.5);
    questions.push(...shuffled.slice(0, totalQuestions));
  } else {
    // Default: 2 questions per domain
    return buildAssessmentFromGenerated({
      ...options,
      questionsPerDomain: 2
    });
  }

  // Shuffle final result
  return questions.sort(() => Math.random() - 0.5);
}

/**
 * Build a pre-assessment (20 questions: 2 per domain)
 */
export function buildPreAssessment(
  generatorOptions?: Omit<GenerateQuestionOptions, 'templateId' | 'slotValues'>
): AnalyzedQuestion[] {
  return buildAssessmentFromGenerated({
    questionsPerDomain: 2,
    generatorOptions
  });
}

/**
 * Build a full assessment (125 questions: ~12-13 per domain)
 */
export function buildFullAssessment(
  generatorOptions?: Omit<GenerateQuestionOptions, 'templateId' | 'slotValues'>
): AnalyzedQuestion[] {
  return buildAssessmentFromGenerated({
    totalQuestions: 125,
    generatorOptions
  });
}

/**
 * Build a custom assessment targeting specific skills
 */
export function buildCustomAssessment(
  targetSkills: SkillId[],
  generatorOptions?: Omit<GenerateQuestionOptions, 'templateId' | 'slotValues'>
): AnalyzedQuestion[] {
  return buildAssessmentFromGenerated({
    targetSkills,
    generatorOptions
  });
}
