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
      return generateFunctionConfusionDistractor(correctAnswer, context);
    
    case "case-confusion":
      return generateCaseConfusionDistractor(correctAnswer, context);
    
    case "sequence-error":
      return generateSequenceErrorDistractor(correctAnswer, context);
    
    case "function-mismatch":
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

  // Try to generate distractors using allowed patterns
  for (const patternId of template.allowedDistractorPatterns) {
    if (distractors.length >= count) break;
    if (usedPatterns.has(patternId)) continue;

    const pattern = getPatternById(patternId);
    if (!pattern) continue;

    const distractor = generateDistractor(correctAnswer, pattern, context);
    if (distractor && !distractors.some(d => d.text === distractor.text)) {
      distractors.push(distractor);
      usedPatterns.add(patternId);
    }
  }

  // If we don't have enough, try other patterns
  if (distractors.length < count) {
    const allPatterns = Object.values(DISTRACTOR_PATTERNS);
    for (const pattern of allPatterns) {
      if (distractors.length >= count) break;
      if (usedPatterns.has(pattern.patternId)) continue;

      const distractor = generateDistractor(correctAnswer, pattern, context);
      if (distractor && !distractors.some(d => d.text === distractor.text)) {
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

  // Check length appropriateness (distractors shouldn't be drastically different lengths)
  const correctLength = correctAnswer.length;
  for (const distractor of distractors) {
    const ratio = distractor.text.length / correctLength;
    if (ratio < 0.3 || ratio > 3.0) {
      issues.push(`Distractor length inappropriate: "${distractor.text}" (ratio: ${ratio.toFixed(2)})`);
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
  // If correct answer involves assessment/data review, suggest an action instead
  if (correctAnswer.toLowerCase().includes("review") ||
      correctAnswer.toLowerCase().includes("analyze") ||
      correctAnswer.toLowerCase().includes("assess") ||
      correctAnswer.toLowerCase().includes("collect")) {
    
    const actions = [
      "Contact the student's parents immediately",
      "Implement an intervention program",
      "Refer the student for special education evaluation",
      "Begin counseling sessions with the student",
      "Schedule a meeting with school administration"
    ];

    return {
      text: actions[Math.floor(Math.random() * actions.length)],
      explanation: "This answer skips the crucial first step of assessment or data collection. School psychologists must understand the problem before taking action.",
      patternId: "premature-action"
    };
  }
  return null;
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
  const dataIgnorantActions = [
    "Make a recommendation based on teacher observations alone",
    "Implement an intervention without reviewing assessment data",
    "Decide on placement without examining evaluation results",
    "Make a determination based solely on parent report",
    "Recommend services without analyzing progress monitoring data"
  ];

  return {
    text: dataIgnorantActions[Math.floor(Math.random() * dataIgnorantActions.length)],
    explanation: "School psychologists practice data-based decision making. Decisions should be informed by reviewing and analyzing relevant data first.",
    patternId: "data-ignorance"
  };
}

function generateExtremeLanguageDistractor(
  correctAnswer: string,
  context: AnswerGenerationContext
): Distractor | null {
  // Add extreme language to a correct principle
  const extremeModifiers = ["always", "never", "only", "must", "all", "every"];
  const modifier = extremeModifiers[Math.floor(Math.random() * extremeModifiers.length)];
  
  // Create a statement with extreme language
  const extremeStatements = [
    `School psychologists must ${modifier} use standardized assessments`,
    `Interventions ${modifier} require parent consent`,
    `Students ${modifier} need comprehensive evaluations before intervention`,
    `Assessment ${modifier} determines eligibility`,
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
  // Use correct approach but wrong context
  const mismatchedContexts = [
    "Use curriculum-based measurement for comprehensive evaluation",
    "Use a screening tool to determine eligibility",
    "Use an individual assessment for universal screening",
    "Use progress monitoring tools for program evaluation",
    "Use a diagnostic assessment for weekly monitoring"
  ];

  return {
    text: mismatchedContexts[Math.floor(Math.random() * mismatchedContexts.length)],
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
