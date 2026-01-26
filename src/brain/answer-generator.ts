// Answer Generator - Generates answer choices for templates
// Uses distractor patterns to create plausible wrong answers

import { PatternId } from './template-schema';
import { DistractorPattern, getPatternById, DISTRACTOR_PATTERNS } from './distractor-patterns';
import { QuestionTemplate } from './template-schema';

export interface Distractor {
  text: string;
  explanation: string; // Why this answer is wrong
  patternId: PatternId; // Which pattern generated this distractor
}

export interface AnswerGenerationContext {
  correctAnswer: string;
  template: QuestionTemplate;
  slotValues: Record<string, string>;
  skillDecisionRule?: string;
}

/**
 * Generates a distractor using a specific pattern
 */
export function generateDistractor(
  correctAnswer: string,
  pattern: DistractorPattern,
  context: AnswerGenerationContext
): Distractor | null {
  const { template, slotValues } = context;

  // Apply pattern-specific logic transforms
  switch (pattern.patternId) {
    case "premature-action":
      return generatePrematureActionDistractor(correctAnswer, context);
    
    case "role-confusion":
      return generateRoleConfusionDistractor(correctAnswer, context);
    
    case "similar-concept":
      return generateSimilarConceptDistractor(correctAnswer, context);
    
    case "data-ignorance":
      return generateDataIgnoranceDistractor(correctAnswer, context);
    
    case "extreme-language":
      return generateExtremeLanguageDistractor(correctAnswer, context);
    
    case "context-mismatch":
      return generateContextMismatchDistractor(correctAnswer, context);
    
    case "incomplete-response":
      return generateIncompleteResponseDistractor(correctAnswer, context);
    
    case "legal-overreach":
      return generateLegalOverreachDistractor(correctAnswer, context);
    
    case "correlation-as-causation":
      return generateCorrelationAsCausationDistractor(correctAnswer, context);
    
    case "function-confusion":
      if (!isBehavioralDomain(context.template.skillId)) return null;
      return generateFunctionConfusionDistractor(correctAnswer, context);
    
    case "case-confusion":
      if (!isLegalDomain(context.template.skillId)) return null;
      return generateCaseConfusionDistractor(correctAnswer, context);
    
    case "sequence-error":
      return generateSequenceErrorDistractor(correctAnswer, context);
    
    case "function-mismatch":
      if (!isBehavioralDomain(context.template.skillId)) return null;
      return generateFunctionMismatchDistractor(correctAnswer, context);
    
    case "model-confusion":
      return generateModelConfusionDistractor(correctAnswer, context);
    
    case "instruction-only":
      return generateInstructionOnlyDistractor(correctAnswer, context);
    
    case "adult-criteria":
      return generateAdultCriteriaDistractor(correctAnswer, context);
    
    case "inclusion-error":
      return generateInclusionErrorDistractor(correctAnswer, context);
    
    case "optimal-education":
      return generateOptimalEducationDistractor(correctAnswer, context);
    
    case "general-concerns":
      return generateGeneralConcernsDistractor(correctAnswer, context);
    
    case "investigation":
      return generateInvestigationDistractor(correctAnswer, context);
    
    case "delay":
      return generateDelayDistractor(correctAnswer, context);
    
    case "punishment-focus":
      return generatePunishmentFocusDistractor(correctAnswer, context);
    
    case "absolute-rules":
      return generateAbsoluteRulesDistractor(correctAnswer, context);
    
    case "law-confusion":
      if (!isLegalDomain(context.template.skillId)) return null;
      return generateLawConfusionDistractor(correctAnswer, context);
    
    case "no-access":
      return generateNoAccessDistractor(correctAnswer, context);
    
    case "insufficient-hours":
      return generateInsufficientHoursDistractor(correctAnswer, context);
    
    case "full-release":
      return generateFullReleaseDistractor(correctAnswer, context);
    
    default:
      return null;
  }
}

/**
 * Truncates a distractor to 150 characters at the nearest sentence boundary
 */
function truncateDistractor(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last sentence boundary (period, exclamation, question mark) before maxLength
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastBoundary = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastBoundary > maxLength * 0.5) {
    // If we found a sentence boundary reasonably close to maxLength, use it
    return text.substring(0, lastBoundary + 1).trim();
  }
  
  // Otherwise, truncate at maxLength and add ellipsis
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Balances distractor length relative to correct answer
 * Returns null if distractor should be rejected (too short to fix)
 * Target: distractors within 50-150% of correct answer length
 */
function balanceDistractorLength(text: string, correctAnswer: string): string | null {
  const targetLength = correctAnswer.length;
  const minLength = Math.max(20, Math.floor(targetLength * 0.5));
  const maxLength = Math.min(150, Math.floor(targetLength * 1.5));
  const currentLength = text.length;

  // Reject single words or very short distractors that can't be expanded
  if (currentLength < 15 || text.split(' ').length <= 2) {
    // Exception for known short valid answers (acronyms, terms)
    const validShortTerms = ['FERPA', 'IDEA', 'ADA', 'FAPE', 'IEP', 'BIP', 'FBA', 'RTI', 'MTSS'];
    if (!validShortTerms.some(term => text.toUpperCase().includes(term))) {
      return null; // Signal to try another distractor
    }
  }

  // If within acceptable range, return as-is
  if (currentLength >= minLength && currentLength <= maxLength) {
    return text;
  }

  // If too long, truncate intelligently
  if (currentLength > maxLength) {
    return truncateDistractor(text, maxLength);
  }

  // If too short but not rejectable, return as-is
  return text;
}

// Banned terms by domain (from banned-terms-check.ts)
const BANNED_TERMS: Record<string, string[]> = {
  consultation: [
    'Tarasoff', 'IDEA', 'Mills', 'Larry P.', 'Lau', 'FERPA', 
    'Section 504', ' v. ', 'Rowley', 'PARC', 'FAPE', 'due process', 'IEP'
  ],
  therapy: [
    'Tarasoff', 'Mills', 'Larry P.', 'Lau', ' v. ', 'IDEA', 'FERPA'
  ],
  intervention: [
    'Tarasoff', 'Mills', 'Larry P.', ' v. ', 'IDEA'
  ],
  fba: [
    'Tarasoff', 'IDEA', 'Mills', ' v. ', 'Larry P.', 'Lau'
  ],
  assessment: [
    'Tarasoff', ' v. '
  ],
  psychometric: [
    'Tarasoff', ' v. '
  ],
  legal: [] // Legal domain can have legal terms, so no bans
};

// Map skills to their expected domains (from audit script)
const SKILL_TO_DOMAIN_MAP: Record<string, string[]> = {
  'DBDM-S01': ['psychometric'],
  'DBDM-S02': ['psychometric'],
  'DBDM-S03': ['psychometric'],
  'DBDM-S04': ['psychometric'],
  'DBDM-S05': ['assessment', 'psychometric'],
  'DBDM-S06': ['assessment'],
  'DBDM-S07': ['assessment'],
  'DBDM-S08': ['assessment'],
  'DBDM-S09': ['assessment'],
  'DBDM-S10': ['assessment'],
  'NEW-1-BackgroundInformation': ['assessment'],
  'NEW-1-DynamicAssessment': ['assessment'],
  'NEW-1-IQvsAchievement': ['psychometric', 'assessment'],
  'NEW-1-LowIncidenceExceptionalities': ['assessment'],
  'NEW-1-PerformanceAssessment': ['assessment'],
  'NEW-1-ProblemSolvingFramework': ['intervention'],
  'CC-S01': ['consultation'],
  'CC-S03': ['consultation'],
  'NEW-2-ConsultationProcess': ['consultation'],
  'NEW-2-ProblemSolvingSteps': ['consultation'],
  'NEW-2-CommunicationStrategies': ['consultation'],
  'NEW-2-FamilyCollaboration': ['consultation'],
  'NEW-2-CommunityAgencies': ['consultation'],
  'ACAD-S01': ['intervention'],
  'ACAD-S02': ['intervention'],
  'ACAD-S03': ['intervention'],
  'ACAD-S04': ['intervention'],
  'ACAD-S05': ['assessment', 'intervention'],
  'NEW-3-AccommodationsModifications': ['intervention'],
  'NEW-3-AcademicProgressFactors': ['intervention'],
  'NEW-3-BioCulturalInfluences': ['intervention'],
  'NEW-3-InstructionalHierarchy': ['intervention'],
  'NEW-3-MetacognitiveStrategies': ['intervention'],
  'MBH-S01': ['fba'],
  'MBH-S02': ['fba'],
  'MBH-S03': ['fba'],
  'MBH-S04': ['therapy'],
  'MBH-S05': ['therapy'],
  'MBH-S06': ['intervention', 'fba'],
  'NEW-4-Psychopathology': ['therapy'],
  'NEW-4-DevelopmentalInterventions': ['therapy'],
  'NEW-4-MentalHealthImpact': ['therapy'],
  'NEW-4-GroupCounseling': ['therapy'],
  'SWP-S01': ['intervention'],
  'SWP-S02': ['intervention'],
  'SWP-S03': ['intervention'],
  'SWP-S04': ['intervention'],
  'NEW-5-EducationalPolicies': ['legal', 'assessment'],
  'NEW-5-EBPImportance': ['intervention'],
  'NEW-5-SchoolClimate': ['intervention'],
  'RES-S01': ['intervention'],
  'RES-S02': ['intervention'],
  'RES-S03': ['intervention'],
  'RES-S04': ['intervention'],
  'RES-S05': ['intervention'],
  'RES-S06': ['intervention'],
  'NEW-6-BullyingPrevention': ['intervention'],
  'NEW-6-TraumaInformed': ['intervention'],
  'NEW-6-SchoolClimateMeasurement': ['assessment', 'intervention'],
  'FSC-S01': ['consultation'],
  'FSC-S02': ['consultation'],
  'FSC-S03': ['therapy'],
  'FSC-S04': ['consultation'],
  'NEW-7-BarriersToEngagement': ['consultation'],
  'NEW-7-FamilySystems': ['consultation'],
  'NEW-7-InteragencyCollaboration': ['consultation'],
  'NEW-7-ParentingInterventions': ['consultation', 'intervention'],
  'DIV-S01': ['assessment'],
  'DIV-S02': ['assessment'],
  'DIV-S03': ['psychometric'],
  'DIV-S04': ['assessment'],
  'DIV-S05': ['assessment'],
  'DIV-S06': ['assessment'],
  'DIV-S07': ['intervention'],
  'NEW-8-Acculturation': ['assessment'],
  'NEW-8-LanguageAcquisition': ['assessment'],
  'NEW-8-SocialJustice': ['legal'],
  'NEW-9-DescriptiveStats': ['psychometric'],
  'NEW-9-ValidityThreats': ['psychometric'],
  'NEW-9-StatisticalTests': ['psychometric'],
  'NEW-9-Variables': ['psychometric'],
  'NEW-9-ProgramEvaluation': ['assessment'],
  'NEW-9-ImplementationFidelity': ['intervention'],
  'LEG-S01': ['legal'],
  'LEG-S02': ['legal'],
  'LEG-S03': ['legal'],
  'LEG-S04': ['legal'],
  'LEG-S05': ['legal'],
  'LEG-S06': ['legal'],
  'LEG-S07': ['legal'],
  'PC-S01': ['assessment'],
  'PC-S02': ['assessment'],
  'PC-S03': ['legal'],
  'PC-S04': ['intervention'],
  'PC-S05': ['legal'],
  'NEW-10-EducationLaw': ['legal'],
  'NEW-10-EthicalProblemSolving': ['legal'],
  'NEW-10-RecordKeeping': ['legal'],
  'NEW-10-TestSecurity': ['legal'],
  'NEW-10-Supervision': ['legal'],
  'NEW-10-ProfessionalGrowth': ['legal'],
};

// Domain-specific distractor pools - ensures distractors match question domain
const DOMAIN_DISTRACTOR_POOLS: Record<string, string[]> = {
  consultation: [
    "Implementing the intervention immediately without baseline data or consultation",
    "Focusing solely on the student without seeking teacher input or collaboration",
    "Making decisions unilaterally without collaboration or family partnership",
    "Skipping the entry and contracting phase to move directly to intervention",
    "Using a one-size-fits-all approach without considering cultural context",
    "Prescribing solutions before understanding the problem or building rapport",
    "Providing recommendations without observing the classroom environment",
    "Ending consultation after providing a single recommendation"
  ],
  therapy: [
    "Focusing only on academic performance without addressing emotional needs",
    "Using punishment-based approaches without understanding underlying causes",
    "Applying adult diagnostic criteria without considering developmental variations",
    "Ignoring cultural factors and family context in treatment planning",
    "Using a single intervention approach without considering individual needs",
    "Implementing interventions without understanding function or maintaining factors",
    "Providing therapy without establishing rapport or treatment goals",
    "Using techniques inappropriate for the student's developmental level"
  ],
  fba: [
    "Implementing intervention without conducting functional assessment first",
    "Selecting replacement behavior that serves a different function",
    "Focusing on topography rather than function of behavior",
    "Using punishment without teaching alternative behaviors",
    "Ignoring setting events and antecedent conditions",
    "Assuming behavior is attention-maintained without data",
    "Collecting frequency data when duration would be more appropriate",
    "Defining target behavior in vague or subjective terms"
  ],
  assessment: [
    "Using curriculum-based measurement for comprehensive evaluation",
    "Using a screening tool to determine eligibility",
    "Using an individual assessment for universal screening",
    "Using progress monitoring tools for program evaluation",
    "Recommend services without analyzing progress monitoring data",
    "Selecting assessment tools based on convenience rather than purpose",
    "Interpreting results without considering the referral question"
  ],
  psychometric: [
    "Interpreting scores without considering standard error of measurement",
    "Comparing scores from different norm groups directly",
    "Using a single score to make high-stakes decisions",
    "Ignoring confidence intervals in score interpretation",
    "Treating subtest scores as more reliable than composite scores",
    "Assuming test scores represent fixed traits",
    "Ignoring practice effects in repeated testing"
  ],
  intervention: [
    "Implementing intervention without baseline data",
    "Selecting intervention based on availability rather than evidence",
    "Moving to more intensive intervention without trying less intensive first",
    "Providing intervention without progress monitoring",
    "Using the same intervention for all students regardless of need",
    "Discontinuing intervention immediately after seeing improvement",
    "Implementing multiple interventions simultaneously without rationale"
  ],
  legal: [
    "Making decisions without considering procedural requirements",
    "Exceeding professional scope of practice",
    "Sharing information without proper consent",
    "Failing to document decision-making process",
    "Ignoring timeline requirements for evaluations",
    "Making placement decisions without team input",
    "Denying services based on disability category alone"
  ]
};

// Get domain-appropriate distractors for a skill
function getDomainDistractors(skillId: string): string[] {
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || [];
  const distractors: string[] = [];
  
  for (const domain of domains) {
    const pool = DOMAIN_DISTRACTOR_POOLS[domain];
    if (pool) {
      distractors.push(...pool);
    }
  }
  
  // Fallback to generic intervention distractors if no domain match
  if (distractors.length === 0) {
    return DOMAIN_DISTRACTOR_POOLS['intervention'] || [];
  }
  
  return distractors;
}

// Check if skill is in legal domain
function isLegalDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('LEG-') || 
         skillId.startsWith('NEW-10-') || 
         skillId === 'PC-S03' || 
         skillId === 'PC-S05' ||
         skillId === 'NEW-8-SocialJustice';
}

// Check if skill is in behavioral/FBA domain
function isBehavioralDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('MBH-') || 
         skillId === 'NEW-4-GroupCounseling' ||
         skillId === 'NEW-4-DevelopmentalInterventions';
}

// Check if skill is in consultation domain
function isConsultationDomain(skillId: string): boolean {
  if (!skillId) return false;
  return skillId.startsWith('CC-') || 
         skillId.startsWith('FSC-') ||
         skillId.startsWith('NEW-2-') ||
         skillId.startsWith('NEW-7-');
}

/**
 * Check if a distractor contains banned terms for the given skill's domains
 */
function containsBannedTerms(text: string, skillId: string): boolean {
  const expectedDomains = SKILL_TO_DOMAIN_MAP[skillId] || [];
  const textLower = text.toLowerCase();
  
  for (const domain of expectedDomains) {
    const bannedTerms = BANNED_TERMS[domain] || [];
    for (const bannedTerm of bannedTerms) {
      if (textLower.includes(bannedTerm.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Generate distractors for a template
 */
export function generateDistractors(
  correctAnswer: string,
  template: QuestionTemplate,
  slotValues: Record<string, string>,
  skillDecisionRule?: string,
  count: number = 3
): Distractor[] {
  const context: AnswerGenerationContext = {
    correctAnswer,
    template,
    slotValues,
    skillDecisionRule
  };

  const distractors: Distractor[] = [];
  const usedPatterns = new Set<PatternId>();
  const maxAttempts = 100; // Increased to account for filtering
  let attempts = 0;

  // Try to generate distractors using allowed patterns first
  const allowedPatterns = [...template.allowedDistractorPatterns];
  const allPatterns = Object.values(DISTRACTOR_PATTERNS);
  
  // Shuffle patterns to ensure variety
  const shuffledPatterns = [...allowedPatterns].sort(() => Math.random() - 0.5);
  const shuffledAllPatterns = [...allPatterns].sort(() => Math.random() - 0.5);

  // First pass: use allowed patterns
  for (const patternId of shuffledPatterns) {
    if (distractors.length >= count || attempts >= maxAttempts) break;
    if (usedPatterns.has(patternId)) continue;

    const pattern = getPatternById(patternId);
    if (!pattern) continue;

    attempts++;
    const distractor = generateDistractor(correctAnswer, pattern, context);
    if (distractor && !distractors.some(d => d.text.toLowerCase().trim() === distractor.text.toLowerCase().trim())) {
      // Filter out banned terms
      if (containsBannedTerms(distractor.text, template.skillId)) {
        continue;
      }
      
      // Balance length relative to correct answer - null means reject
      const balancedText = balanceDistractorLength(distractor.text, correctAnswer);
      if (balancedText === null) {
        continue; // Skip this distractor, try another
      }
      distractor.text = balancedText;
      
      // Final length check - truncate if still too long
      if (distractor.text.length > 150) {
        distractor.text = truncateDistractor(distractor.text, 150);
      }
      
      distractors.push(distractor);
      usedPatterns.add(patternId);
    }
  }

  // Second pass: use other patterns if needed
  if (distractors.length < count && attempts < maxAttempts) {
    for (const pattern of shuffledAllPatterns) {
      if (distractors.length >= count || attempts >= maxAttempts) break;
      if (usedPatterns.has(pattern.patternId)) continue;

      attempts++;
      const distractor = generateDistractor(correctAnswer, pattern, context);
      if (distractor && !distractors.some(d => d.text.toLowerCase().trim() === distractor.text.toLowerCase().trim())) {
        // Filter out banned terms
        if (containsBannedTerms(distractor.text, template.skillId)) {
          continue;
        }
        
        // Balance length relative to correct answer - null means reject
        const balancedText = balanceDistractorLength(distractor.text, correctAnswer);
        if (balancedText === null) {
          continue; // Skip this distractor, try another
        }
        distractor.text = balancedText;
        
        // Final length check
        if (distractor.text.length > 150) {
          distractor.text = truncateDistractor(distractor.text, 150);
        }
        
        distractors.push(distractor);
        usedPatterns.add(pattern.patternId);
      }
    }
  }

  return distractors.slice(0, count);
}

/**
 * Validates that distractors meet quality criteria
 */
export function validateDistractors(
  correctAnswer: string,
  distractors: Distractor[]
): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check that no distractor matches correct answer
  for (const distractor of distractors) {
    if (distractor.text.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      issues.push(`Distractor matches correct answer: "${distractor.text}"`);
    }
  }

  // Check that all distractors are unique
  const texts = distractors.map(d => d.text.toLowerCase().trim());
  const uniqueTexts = new Set(texts);
  if (texts.length !== uniqueTexts.size) {
    issues.push("Some distractors are duplicates");
  }

  // Check that all distractors are non-empty
  for (const distractor of distractors) {
    if (!distractor.text || distractor.text.trim().length === 0) {
      issues.push("Found empty distractor");
    }
  }

  // Check length appropriateness (distractors should be within 50-150% of correct answer)
  const correctLength = correctAnswer.length;
  for (const distractor of distractors) {
    const ratio = correctLength > 0 ? distractor.text.length / correctLength : 1;
    // Allow some flexibility for very short answers (like "FERPA")
    if (correctLength > 10 && (ratio < 0.5 || ratio > 1.5)) {
      issues.push(`Distractor length inappropriate: "${distractor.text}" (ratio: ${ratio.toFixed(2)})`);
    }
    
    // Warn if distractor exceeds 150 characters
    if (distractor.text.length > 150) {
      issues.push(`Distractor exceeds recommended length (${distractor.text.length} chars): "${distractor.text.substring(0, 50)}..."`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// Pattern-specific generators

function generatePrematureActionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Only generate if correct answer involves assessment/data review
  const assessmentKeywords = ['review', 'analyze', 'assess', 'collect', 'gather', 'examine', 'evaluate', 'observe'];
  const hasAssessmentKeyword = assessmentKeywords.some(kw => 
    correctAnswer.toLowerCase().includes(kw)
  );
  
  if (!hasAssessmentKeyword) return null;
  
  // Domain-specific premature actions
  const domainSpecificActions: Record<string, string[]> = {
    consultation: [
      "Immediately provide intervention recommendations to the teacher",
      "Begin implementing changes before completing problem identification",
      "Schedule a follow-up meeting before gathering baseline data"
    ],
    therapy: [
      "Begin counseling sessions before completing intake assessment",
      "Implement treatment protocol before establishing treatment goals",
      "Start group therapy before conducting individual screening"
    ],
    fba: [
      "Implement behavior intervention before identifying function",
      "Begin extinction procedure before collecting baseline data",
      "Select replacement behavior before completing functional assessment"
    ],
    assessment: [
      "Contact the student's parents immediately with recommendations",
      "Refer the student for special education evaluation",
      "Begin intervention program before completing assessment"
    ],
    intervention: [
      "Implement Tier 3 intervention before trying Tier 2",
      "Begin intensive support before universal screening",
      "Start specialized services before documenting Tier 1 response"
    ]
  };
  
  // Get domain(s) for this skill
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || ['assessment'];
  
  // Collect applicable actions
  let applicable: string[] = [];
  for (const domain of domains) {
    if (domainSpecificActions[domain]) {
      applicable.push(...domainSpecificActions[domain]);
    }
  }
  
  // Fallback
  if (applicable.length === 0) {
    applicable = domainSpecificActions['assessment'];
  }
  
  return {
    text: applicable[Math.floor(Math.random() * applicable.length)],
    explanation: "This answer skips the crucial first step of assessment or data collection. School psychologists must understand the problem before taking action.",
    patternId: "premature-action"
  };
}

function generateRoleConfusionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const roleActions = [
    "Take over teaching the student directly",
    "Prescribe medication for the student",
    "Make disciplinary decisions about the student",
    "Provide direct instruction in reading",
    "Diagnose the student with a medical condition",
    "Assign homework to the student"
  ];

  return {
    text: roleActions[Math.floor(Math.random() * roleActions.length)],
    explanation: "School psychologists consult, collaborate, and assess. They do not take over roles of teachers, administrators, or medical professionals.",
    patternId: "role-confusion"
  };
}

function generateSimilarConceptDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template, slotValues } = context;
  
  // Special handling for sensitivity/specificity questions (DBDM-T04)
  if (template.templateId === "DBDM-T04" && slotValues.sensitivity_value && slotValues.specificity_value) {
    const sensitivity = slotValues.sensitivity_value;
    const specificity = slotValues.specificity_value;
    
    // Generate distractors that swap values, use wrong metrics, or confuse concepts
    const distractors = [
      `Sensitivity is ${specificity} and specificity is ${sensitivity}`, // Swap values
      `Positive predictive value is ${sensitivity} and negative predictive value is ${specificity}`, // Wrong metrics
      `The test has high reliability with a coefficient of ${sensitivity}`, // Wrong concept entirely
      `Sensitivity is ${sensitivity} and specificity is ${sensitivity}` // Use same value for both
    ];
    
    // Filter out the correct answer if it happens to match
    const filteredDistractors = distractors.filter(d => 
      d.toLowerCase() !== correctAnswer.toLowerCase()
    );
    
    if (filteredDistractors.length > 0) {
      return {
        text: filteredDistractors[Math.floor(Math.random() * filteredDistractors.length)],
        explanation: "This answer confuses sensitivity and specificity, uses the wrong statistical metrics, or doesn't match the values described in the question.",
        patternId: "similar-concept"
      };
    }
  }
  
  // Domain-specific distractors based on skillId
  const skillId = template.skillId;
  
  // Consultation domain (Domain 2) - CC-T09, CC-T10, etc.
  if (skillId?.startsWith('CC-') || skillId?.startsWith('NEW-2-') || skillId?.startsWith('FSC-')) {
    const consultationDistractors = [
      "Implementing the intervention immediately without baseline data or consultation",
      "Focusing solely on the student without seeking teacher input or collaboration",
      "Prescribing solutions before understanding the problem or building rapport",
      "Skipping the entry and contracting phase to move directly to intervention",
      "Collecting data before establishing rapport and understanding family values",
      "Using a one-size-fits-all approach without considering cultural or contextual factors",
      "Making decisions unilaterally without collaboration or family partnership",
      "Rushing to action before problem identification and relationship building"
    ];
    
    // Filter out if matches correct answer
    const filtered = consultationDistractors.filter(d => 
      d.toLowerCase() !== correctAnswer.toLowerCase()
    );
    
    if (filtered.length > 0) {
      return {
        text: filtered[Math.floor(Math.random() * filtered.length)],
        explanation: "While this approach may seem related, it doesn't match the specific consultation context described in the question.",
        patternId: "similar-concept"
      };
    }
  }
  
  // Therapy/Mental Health domain (Domain 4) - MBH-T16, etc.
  if (skillId?.startsWith('MBH-') || skillId?.startsWith('NEW-4-')) {
    const therapyDistractors = [
      "Focusing only on academic performance without addressing emotional or social needs",
      "Using punishment-based approaches to address behavior without understanding underlying causes",
      "Implementing interventions without understanding the underlying function or maintaining factors",
      "Applying adult diagnostic criteria without considering developmental variations and age-appropriate presentations",
      "Relying solely on medication without behavioral supports or environmental modifications",
      "Ignoring cultural factors and family context in treatment planning and intervention design",
      "Using a single intervention approach without considering individual needs or response patterns"
    ];
    
    const filtered = therapyDistractors.filter(d => 
      d.toLowerCase() !== correctAnswer.toLowerCase()
    );
    
    if (filtered.length > 0) {
      return {
        text: filtered[Math.floor(Math.random() * filtered.length)],
        explanation: "While this approach may seem related, it doesn't match the specific mental health context described in the question.",
        patternId: "similar-concept"
      };
    }
  }
  
  // Generate related but incorrect concepts based on the correct answer
  const conceptMap: Record<string, string[]> = {
    "interobserver agreement": ["Test-retest reliability", "Internal consistency", "Interrater reliability"],
    "test-retest reliability": ["Internal consistency", "Interobserver agreement", "Split-half reliability"],
    "internal consistency": ["Test-retest reliability", "Interobserver agreement", "Interrater reliability"],
    "content validity": ["Construct validity", "Face validity", "Criterion validity"],
    "construct validity": ["Content validity", "Face validity", "Criterion validity"],
    "criterion validity": ["Content validity", "Construct validity", "Face validity"],
    "screening": ["Diagnostic assessment", "Progress monitoring", "Comprehensive evaluation"],
    "progress monitoring": ["Screening", "Diagnostic assessment", "Summative assessment"],
    "formative": ["Summative assessment", "Diagnostic assessment", "Single-subject assessment"],
    "norm-referenced": ["Criterion-referenced", "Standardized", "Informal assessment"],
    "criterion-referenced": ["Norm-referenced", "Standardized", "Informal assessment"]
  };

  // Find matching concept
  for (const [key, alternatives] of Object.entries(conceptMap)) {
    if (correctAnswer.toLowerCase().includes(key.toLowerCase())) {
      return {
        text: alternatives[Math.floor(Math.random() * alternatives.length)],
        explanation: "While this concept is related, it doesn't match the specific context described in the question. The correct answer is more appropriate for this situation.",
        patternId: "similar-concept"
      };
    }
  }

  return null;
}

function generateDataIgnoranceDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Domain-specific data ignorance examples
  const domainSpecificIgnorance: Record<string, string[]> = {
    consultation: [
      "Make a recommendation based on teacher report alone without observation",
      "Implement an intervention without gathering baseline data first",
      "Conclude consultation after a single meeting without follow-up data"
    ],
    therapy: [
      "Select treatment approach without conducting intake assessment",
      "Determine diagnosis based on presenting complaint alone",
      "Discharge from services without measuring treatment outcomes"
    ],
    fba: [
      "Identify behavior function based on assumption rather than data",
      "Select replacement behavior without analyzing antecedent patterns",
      "Develop BIP without sufficient baseline observation data"
    ],
    assessment: [
      "Make a recommendation based on teacher observations alone",
      "Decide on placement without examining evaluation results",
      "Recommend services without analyzing progress monitoring data"
    ],
    intervention: [
      "Implement an intervention without reviewing assessment data",
      "Select intervention tier without screening data",
      "Discontinue services without progress monitoring results"
    ]
  };
  
  // Get domain(s) for this skill
  const domains = SKILL_TO_DOMAIN_MAP[skillId] || ['assessment'];
  
  // Collect applicable distractors
  let applicable: string[] = [];
  for (const domain of domains) {
    if (domainSpecificIgnorance[domain]) {
      applicable.push(...domainSpecificIgnorance[domain]);
    }
  }
  
  // Fallback if no domain match
  if (applicable.length === 0) {
    applicable = domainSpecificIgnorance['assessment'];
  }
  
  // Filter out similar to correct answer
  const filtered = applicable.filter(d => 
    d.toLowerCase() !== correctAnswer.toLowerCase()
  );
  
  if (filtered.length === 0) return null;

  return {
    text: filtered[Math.floor(Math.random() * filtered.length)],
    explanation: "School psychologists practice data-based decision making. Decisions should be informed by reviewing and analyzing relevant data first.",
    patternId: "data-ignorance"
  };
}

function generateExtremeLanguageDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  // Add extreme language to a correct principle
  const extremeModifiers = ["always", "never", "only", "all", "every"];
  const modifier = extremeModifiers[Math.floor(Math.random() * extremeModifiers.length)];
  
  // Create a statement with extreme language
  // Fixed grammar: "must determine" not "must determines"
  const extremeStatements = [
    `School psychologists ${modifier} use standardized assessments`,
    `Interventions ${modifier} require parent consent`,
    `Students ${modifier} need comprehensive evaluations before intervention`,
    `Assessment must determine eligibility`, // Fixed grammar
    `Data collection ${modifier} comes before intervention`
  ];

  return {
    text: extremeStatements[Math.floor(Math.random() * extremeStatements.length)],
    explanation: "Best practices in school psychology allow for flexibility and exceptions. Absolute statements are rarely correct.",
    patternId: "extreme-language"
  };
}

function generateContextMismatchDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Get domain-appropriate distractors
  const domainDistractors = getDomainDistractors(skillId);
  
  // Filter out anything too similar to correct answer
  const filtered = domainDistractors.filter(d => {
    const dLower = d.toLowerCase();
    const correctLower = correctAnswer.toLowerCase();
    return dLower !== correctLower &&
           !dLower.includes(correctLower.substring(0, 20)) &&
           !correctLower.includes(dLower.substring(0, 20));
  });
  
  if (filtered.length === 0) return null;
  
  return {
    text: filtered[Math.floor(Math.random() * filtered.length)],
    explanation: "While this approach is valid in general, it doesn't match the specific context or purpose described in this question.",
    patternId: "context-mismatch"
  };
}

function generateIncompleteResponseDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  // If correct answer has multiple parts, use just one part
  if (correctAnswer.includes("and") || correctAnswer.includes(",")) {
    const parts = correctAnswer.split(/and|,/).map(p => p.trim());
    if (parts.length > 1) {
      return {
        text: parts[0],
        explanation: "This answer is partially correct but incomplete. The full answer requires additional steps or components.",
        patternId: "incomplete-response"
      };
    }
  }
  return null;
}

function generateLegalOverreachDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const overreachActions = [
    "Share student records with outside agencies without consent",
    "Make a medical diagnosis",
    "Disclose confidential information to unauthorized personnel",
    "Make placement decisions without team input",
    "Prescribe treatment without proper authorization"
  ];

  return {
    text: overreachActions[Math.floor(Math.random() * overreachActions.length)],
    explanation: "This action exceeds the school psychologist's legal authority or violates ethical/legal guidelines such as FERPA, confidentiality, or IDEA requirements.",
    patternId: "legal-overreach"
  };
}

function generateCorrelationAsCausationDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const causationStatements = [
    "The intervention caused the improvement because it was followed by better scores",
    "Reading difficulties cause behavior problems because they are correlated",
    "Low scores lead to special education placement because they are related",
    "The program resulted in improvement because scores increased after implementation"
  ];

  return {
    text: causationStatements[Math.floor(Math.random() * causationStatements.length)],
    explanation: "Correlation does not imply causation. Just because two things are related doesn't mean one causes the other. Additional evidence is needed to establish causation.",
    patternId: "correlation-as-causation"
  };
}

function generateFunctionConfusionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const functions = ["Attention", "Escape/Avoidance", "Tangible", "Sensory"];
  const wrongFunction = functions.find(f => f !== correctAnswer) || functions[0];
  
  return {
    text: wrongFunction,
    explanation: "Behavior functions are determined by what maintains the behavior. The consequence described indicates a different function than this answer.",
    patternId: "function-confusion"
  };
}

function generateCaseConfusionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Only use case-confusion for legal/ethical domains (Domain 10, LEG-*, PC-S03, NEW-10-*)
  if (!skillId?.startsWith('LEG-') && 
      !skillId?.startsWith('PC-S03') && 
      !skillId?.startsWith('NEW-10-') &&
      !skillId?.startsWith('NEW-8-SocialJustice')) {
    // Don't use legal cases for non-legal questions
    return null;
  }
  
  const cases = ["Tarasoff", "Larry P.", "Rowley", "Brown v. Board", "Endrew F."];
  const wrongCase = cases.find(c => c !== correctAnswer) || cases[0];
  
  return {
    text: wrongCase,
    explanation: "While this is a significant legal case, it doesn't match the specific legal principle or ruling described in the question.",
    patternId: "case-confusion"
  };
}

function generateSequenceErrorDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  // For ABC model, swap elements
  if (correctAnswer.includes("Antecedent-Behavior-Consequence")) {
    return {
      text: "Behavior-Antecedent-Consequence",
      explanation: "The elements are correct but the sequence is wrong. The proper order matters for this process.",
      patternId: "sequence-error"
    };
  }
  
  return {
    text: "Intervention before assessment",
    explanation: "The elements are correct but the sequence is wrong. Assessment should come before intervention.",
    patternId: "sequence-error"
  };
}

function generateFunctionMismatchDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "A replacement behavior that serves a different function",
    explanation: "Replacement behaviors must serve the SAME function as the problem behavior to be effective.",
    patternId: "function-mismatch"
  };
}

function generateModelConfusionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const models = ["Cognitive Behavioral Therapy", "Solution-Focused Brief Therapy", "Dialectical Behavior Therapy", "Behavioral Consultation"];
  const wrongModel = models.find(m => !correctAnswer.includes(m)) || models[0];
  
  return {
    text: wrongModel,
    explanation: "While this is a valid model, it doesn't match the specific techniques or approaches described in the question.",
    patternId: "model-confusion"
  };
}

function generateInstructionOnlyDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Provide direct instruction only",
    explanation: "Effective skill teaching requires more than instruction alone. Modeling, practice, and feedback are essential components.",
    patternId: "instruction-only"
  };
}

function generateAdultCriteriaDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Apply adult diagnostic criteria directly to children",
    explanation: "Child psychopathology often presents differently than adult psychopathology. Developmental variations must be considered.",
    patternId: "adult-criteria"
  };
}

function generateInclusionErrorDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Include students with severe conduct disorders in group counseling",
    explanation: "This answer doesn't match the appropriate inclusion/exclusion criteria for this situation.",
    patternId: "inclusion-error"
  };
}

function generateOptimalEducationDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Provide the best possible education",
    explanation: "FAPE requires appropriate education, not optimal or best possible education.",
    patternId: "optimal-education"
  };
}

function generateGeneralConcernsDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Breach confidentiality for general concerns about student well-being",
    explanation: "Confidentiality should only be breached for imminent danger to self or others, not general concerns.",
    patternId: "general-concerns"
  };
}

function generateInvestigationDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Investigate the abuse allegations before reporting",
    explanation: "The legal duty is to report suspected abuse immediately to CPS, not to investigate first.",
    patternId: "investigation"
  };
}

function generateDelayDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Schedule assessment for next week",
    explanation: "Some situations require immediate action and cannot be delayed.",
    patternId: "delay"
  };
}

function generatePunishmentFocusDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Determine appropriate punishment for the behavior",
    explanation: "This process is about understanding cause, not about punishment or discipline.",
    patternId: "punishment-focus"
  };
}

function generateAbsoluteRulesDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Apply the rule absolutely without considering context",
    explanation: "Ethical decision-making requires considering context and cultural factors, not applying absolute rules.",
    patternId: "absolute-rules"
  };
}

function generateLawConfusionDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  const { template } = context;
  const skillId = template.skillId;
  
  // Only use law-confusion for legal/ethical domains (Domain 10, LEG-*, PC-S03, NEW-10-*)
  if (!skillId?.startsWith('LEG-') && 
      !skillId?.startsWith('PC-S03') && 
      !skillId?.startsWith('PC-S05') &&
      !skillId?.startsWith('NEW-10-') &&
      !skillId?.startsWith('NEW-8-SocialJustice')) {
    // Don't use legal laws for non-legal questions
    return null;
  }
  
  const laws = ["IDEA", "Section 504", "FERPA", "ADA"];
  const wrongLaw = laws.find(l => !correctAnswer.includes(l)) || laws[0];
  
  return {
    text: wrongLaw,
    explanation: "While this is a valid law, it doesn't match the specific legal requirement or distinction described in the question.",
    patternId: "law-confusion"
  };
}

function generateNoAccessDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Deny access to records without legal basis",
    explanation: "Parents generally have rights to access records unless there is a specific legal basis to deny access.",
    patternId: "no-access"
  };
}

function generateInsufficientHoursDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Provide less than the required supervision hours",
    explanation: "NASP and professional standards specify minimum requirements that must be met.",
    patternId: "insufficient-hours"
  };
}

function generateFullReleaseDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  return {
    text: "Allow full copying and release of test protocols",
    explanation: "Test security and copyright laws require balancing parent rights with protection of test materials. Full release may violate test security.",
    patternId: "full-release"
  };
}
