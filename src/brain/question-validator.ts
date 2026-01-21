// Question Validator - Checks generated questions for quality
// Ensures questions meet quality standards before being served to users

import { GeneratedQuestion } from './question-generator';

export interface ValidationResult {
  valid: boolean;
  confidence: "high" | "medium" | "low";
  issues: string[];
  suggestions: string[];
}

const MIN_STEM_LENGTH = 20;
const MAX_STEM_LENGTH = 500;
const MIN_CHOICE_LENGTH = 5;
const MAX_CHOICE_LENGTH = 200;
const MIN_CHOICES = 3;
const MAX_CHOICES = 6;

/**
 * Validates a generated question
 */
export function validateQuestion(question: GeneratedQuestion): ValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 1. Stem completeness - no unreplaced placeholders
  const unreplacedPlaceholders = question.question.match(/\{(\w+)\}/g);
  if (unreplacedPlaceholders && unreplacedPlaceholders.length > 0) {
    issues.push(`Stem contains unreplaced placeholders: ${unreplacedPlaceholders.join(', ')}`);
  }

  // 2. Answer validity - correct answer appears in choices
  const correctAnswerLetter = question.correct_answer[0];
  if (!question.choices[correctAnswerLetter]) {
    issues.push(`Correct answer letter ${correctAnswerLetter} not found in choices`);
  } else {
    // Check that correct answer text matches
    const correctAnswerText = question.choices[correctAnswerLetter];
    // This is a basic check - in practice, we'd want to verify it matches the expected answer
  }

  // 3. Distractor quality checks
  const choiceValues = Object.values(question.choices).filter(c => c.trim().length > 0);
  
  // Check minimum number of choices
  if (choiceValues.length < MIN_CHOICES) {
    issues.push(`Too few answer choices: ${choiceValues.length} (minimum ${MIN_CHOICES})`);
  }

  // Check maximum number of choices
  if (choiceValues.length > MAX_CHOICES) {
    issues.push(`Too many answer choices: ${choiceValues.length} (maximum ${MAX_CHOICES})`);
  }

  // Check that all choices are unique
  const uniqueChoices = new Set(choiceValues.map(c => c.toLowerCase().trim()));
  if (uniqueChoices.size !== choiceValues.length) {
    issues.push("Some answer choices are duplicates");
  }

  // Check that all choices are non-empty
  const emptyChoices = choiceValues.filter(c => c.trim().length === 0);
  if (emptyChoices.length > 0) {
    issues.push(`Found ${emptyChoices.length} empty answer choice(s)`);
  }

  // Check choice lengths
  choiceValues.forEach((choice, index) => {
    if (choice.length < MIN_CHOICE_LENGTH) {
      issues.push(`Answer choice ${String.fromCharCode(65 + index)} is too short: ${choice.length} characters`);
      suggestions.push(`Consider expanding choice ${String.fromCharCode(65 + index)}`);
    }
    if (choice.length > MAX_CHOICE_LENGTH) {
      issues.push(`Answer choice ${String.fromCharCode(65 + index)} is too long: ${choice.length} characters`);
      suggestions.push(`Consider shortening choice ${String.fromCharCode(65 + index)}`);
    }
  });

  // 4. Stem length appropriateness
  if (question.question.length < MIN_STEM_LENGTH) {
    issues.push(`Stem is too short: ${question.question.length} characters (minimum ${MIN_STEM_LENGTH})`);
    suggestions.push("Consider adding more context to the question stem");
  }
  if (question.question.length > MAX_STEM_LENGTH) {
    issues.push(`Stem is too long: ${question.question.length} characters (maximum ${MAX_STEM_LENGTH})`);
    suggestions.push("Consider shortening the question stem");
  }

  // 5. Logical consistency - check for contradictions in slot values
  // This would require domain-specific logic, so we'll do basic checks
  if (question.metadata.slotValues) {
    const slotValues = question.metadata.slotValues;
    
    // Example: Check for grade-appropriate combinations
    // (This would be expanded with domain-specific rules)
    
    // Check that slot values make sense together
    // For example, if we have "kindergarten student" and "high school", that's inconsistent
    const gradeDescriptions = Object.values(slotValues).filter(v => 
      v.includes("grade") || v.includes("kindergarten") || v.includes("high school")
    );
    
    if (gradeDescriptions.length > 1) {
      // Check for contradictions (this is a simplified check)
      const hasElementary = gradeDescriptions.some(g => g.includes("elementary") || g.includes("kindergarten"));
      const hasHighSchool = gradeDescriptions.some(g => g.includes("high school"));
      
      if (hasElementary && hasHighSchool) {
        issues.push("Potential grade level inconsistency in slot values");
      }
    }
  }

  // 6. Grammar check - basic checks
  const grammarIssues = checkGrammar(question);
  issues.push(...grammarIssues);

  // 7. Rationale quality
  if (!question.rationale || question.rationale.trim().length < 20) {
    issues.push("Rationale is too short or missing");
    suggestions.push("Ensure rationale explains why the correct answer is correct");
  }

  // Determine confidence level
  let confidence: "high" | "medium" | "low" = "high";
  
  // Critical issues that make question unusable
  const criticalIssues = issues.filter(issue => 
    issue.includes("unreplaced placeholders") ||
    issue.includes("not found in choices") ||
    issue.includes("Too few answer choices") ||
    issue.includes("duplicates")
  );

  if (criticalIssues.length > 0) {
    confidence = "low";
  } else if (issues.length > 3) {
    confidence = "medium";
  } else if (issues.length > 0) {
    confidence = "medium";
  }

  return {
    valid: criticalIssues.length === 0,
    confidence,
    issues,
    suggestions
  };
}

/**
 * Basic grammar checks
 */
function checkGrammar(question: GeneratedQuestion): string[] {
  const issues: string[] = [];

  // Check for incomplete sentences in stem
  const stem = question.question;
  if (!stem.match(/[.!?]$/)) {
    // Stem should end with punctuation (unless it's a question that continues)
    if (!stem.includes("?")) {
      issues.push("Stem may be missing ending punctuation");
    }
  }

  // Check for mismatched articles (basic check)
  // "a" before consonant sounds, "an" before vowel sounds
  const articleIssues = stem.match(/\b(a|an)\s+[aeiouAEIOU]/g);
  if (articleIssues) {
    // This is a simplified check - would need more sophisticated logic
    // to properly detect article mismatches
  }

  // Check for double spaces
  if (stem.includes("  ")) {
    issues.push("Stem contains double spaces");
  }

  // Check answer choices for basic grammar
  Object.entries(question.choices).forEach(([letter, choice]) => {
    if (choice.trim().length === 0) return;

    // Check for capitalization (choices should typically start with capital)
    if (choice[0] && choice[0] === choice[0].toLowerCase() && /[a-z]/.test(choice[0])) {
      // This might be okay depending on style, so we'll just note it
    }

    // Check for very short incomplete phrases
    if (choice.split(' ').length < 3 && choice.length < 15) {
      // Might be okay, but could be incomplete
    }
  });

  return issues;
}

/**
 * Validates multiple questions and returns summary
 */
export function validateQuestions(questions: GeneratedQuestion[]): {
  total: number;
  valid: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  commonIssues: Record<string, number>;
} {
  const results = questions.map(q => validateQuestion(q));
  
  const commonIssues: Record<string, number> = {};
  
  results.forEach(result => {
    result.issues.forEach(issue => {
      commonIssues[issue] = (commonIssues[issue] || 0) + 1;
    });
  });

  return {
    total: questions.length,
    valid: results.filter(r => r.valid).length,
    highConfidence: results.filter(r => r.confidence === "high").length,
    mediumConfidence: results.filter(r => r.confidence === "medium").length,
    lowConfidence: results.filter(r => r.confidence === "low").length,
    commonIssues
  };
}
