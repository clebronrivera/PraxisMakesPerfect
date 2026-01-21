// Rationale Builder - Generates explanations for generated questions
// Combines key principle, decision rule, and distractor explanations

import { Distractor } from './answer-generator';

export interface RationaleInput {
  correctAnswer: string;
  correctAnswerLetter: string; // e.g., "B"
  keyPrinciple: string; // From template
  decisionRule: string; // From skill
  whyDistractorsWrong: Distractor[]; // Array of distractors with explanations
  slotValues?: Record<string, string>; // Context for applying decision rule
}

/**
 * Builds a rationale explanation for a generated question
 * Format: "Option {X} is correct. {keyPrinciple}. {decisionRule applied to this context}. The other options are incorrect because: {brief distractor explanations}."
 */
export function buildRationale(input: RationaleInput): string {
  const {
    correctAnswer,
    correctAnswerLetter,
    keyPrinciple,
    decisionRule,
    whyDistractorsWrong,
    slotValues
  } = input;

  // Start with correct answer identification
  let rationale = `Option (${correctAnswerLetter}) is correct. `;

  // Add key principle
  if (keyPrinciple) {
    rationale += `${keyPrinciple} `;
  }

  // Apply decision rule to context
  if (decisionRule) {
    let appliedRule = decisionRule;
    
    // If we have slot values, try to contextualize the rule
    if (slotValues && Object.keys(slotValues).length > 0) {
      // Replace generic terms with specific context where appropriate
      // This is a simple implementation - could be enhanced
      appliedRule = applyRuleToContext(decisionRule, slotValues);
    }
    
    rationale += `${appliedRule}. `;
  }

  // Add distractor explanations
  if (whyDistractorsWrong.length > 0) {
    rationale += "The other options are incorrect because: ";
    
    const distractorExplanations = whyDistractorsWrong.map((distractor, index) => {
      // Use a brief version of the explanation
      const briefExplanation = distractor.explanation.length > 100
        ? distractor.explanation.substring(0, 100) + "..."
        : distractor.explanation;
      
      return briefExplanation.toLowerCase();
    });

    // Join with appropriate punctuation
    if (distractorExplanations.length === 1) {
      rationale += distractorExplanations[0];
    } else if (distractorExplanations.length === 2) {
      rationale += `${distractorExplanations[0]} and ${distractorExplanations[1]}`;
    } else {
      const last = distractorExplanations.pop();
      rationale += `${distractorExplanations.join(", ")}, and ${last}`;
    }
    
    rationale += ".";
  }

  return rationale.trim();
}

/**
 * Applies decision rule to specific context from slot values
 * This is a simple implementation - could be enhanced with more sophisticated NLP
 */
function applyRuleToContext(
  rule: string,
  slotValues: Record<string, string>
): string {
  let applied = rule;

  // Replace generic terms with specific values where it makes sense
  // For example, if rule mentions "measurement context" and we have a specific context
  
  // This is a placeholder - in a full implementation, we'd have more sophisticated
  // context application logic
  for (const [key, value] of Object.entries(slotValues)) {
    // Simple replacement for common patterns
    if (applied.includes(`{${key}}`)) {
      applied = applied.replace(`{${key}}`, value);
    }
  }

  return applied;
}

/**
 * Builds a more detailed rationale with full explanations
 */
export function buildDetailedRationale(input: RationaleInput): string {
  const {
    correctAnswer,
    correctAnswerLetter,
    keyPrinciple,
    decisionRule,
    whyDistractorsWrong,
    slotValues
  } = input;

  let rationale = `Option (${correctAnswerLetter}) is correct: ${correctAnswer}. `;

  if (keyPrinciple) {
    rationale += `\n\nKey Principle: ${keyPrinciple}`;
  }

  if (decisionRule) {
    let appliedRule = applyRuleToContext(decisionRule, slotValues || {});
    rationale += `\n\nDecision Rule: ${appliedRule}`;
  }

  if (whyDistractorsWrong.length > 0) {
    rationale += `\n\nThe other options are incorrect:\n`;
    whyDistractorsWrong.forEach((distractor, index) => {
      rationale += `\n• ${distractor.text}: ${distractor.explanation}`;
    });
  }

  return rationale.trim();
}
