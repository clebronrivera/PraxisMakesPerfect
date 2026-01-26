// Template Schema - Defines how question templates work
// Templates are patterns that generate questions, not questions themselves

import { SkillId } from './skill-map';

export type TemplateType = 
  | "context-matching"
  | "first-step-scenario"
  | "definition-recognition"
  | "best-selection"
  | "characteristic-identification"
  | "interpretation";

export type PatternId = 
  | "premature-action"
  | "role-confusion"
  | "similar-concept"
  | "data-ignorance"
  | "extreme-language"
  | "context-mismatch"
  | "incomplete-response"
  | "legal-overreach"
  | "correlation-as-causation"
  | "function-confusion"
  | "case-confusion"
  | "sequence-error"
  | "function-mismatch"
  | "model-confusion"
  | "instruction-only"
  | "adult-criteria"
  | "inclusion-error"
  | "optimal-education"
  | "general-concerns"
  | "investigation"
  | "delay"
  | "punishment-focus"
  | "absolute-rules"
  | "law-confusion"
  | "no-access"
  | "insufficient-hours"
  | "full-release"
  | "definition-error";

export interface SlotDefinition {
  name: string;
  description: string;
  possibleValues: string[];
  metadata?: Record<string, any>; // Grade-appropriateness, domain-relevance, etc.
}

export interface SlotConstraint {
  slots: string[]; // Which slots are constrained together
  rule: (values: Record<string, string>) => boolean; // Function that returns true if combination is valid
  description: string; // Human-readable explanation of the constraint
}

export interface CorrectAnswerLogic {
  // Maps slot value combinations to correct answers
  // Can be a function or a lookup table
  evaluate: (slotValues: Record<string, string>) => string;
  description: string; // How the logic works
}

export interface QuestionTemplate {
  templateId: string; // e.g., "DBDM-T01"
  skillId: SkillId; // Which skill this template tests
  templateType: TemplateType;
  stem: string; // Question text with {slot_name} placeholders
  slots: Record<string, SlotDefinition>; // Object defining each variable slot
  slotConstraints?: SlotConstraint[]; // Rules about which slot values can combine (optional)
  correctAnswerLogic: CorrectAnswerLogic; // Rules mapping slot combinations to correct answers
  allowedDistractorPatterns: PatternId[]; // Which error patterns generate distractors for this template
  keyPrinciple: string; // The underlying concept being tested (for feedback)
  exampleSlotValues?: Record<string, string>; // Example values for documentation
}

export type TemplateMap = Record<string, QuestionTemplate>;

// Helper function to validate a template
export function validateTemplate(template: QuestionTemplate): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check that all slots in stem are defined
  const slotMatches = template.stem.match(/\{(\w+)\}/g) || [];
  const slotNames = slotMatches.map(match => match.slice(1, -1));
  const definedSlots = Object.keys(template.slots);

  for (const slotName of slotNames) {
    if (!definedSlots.includes(slotName)) {
      issues.push(`Stem references undefined slot: ${slotName}`);
    }
  }

  // Check that all defined slots are used in stem (warning, not error)
  for (const slotName of definedSlots) {
    if (!slotNames.includes(slotName)) {
      issues.push(`Warning: Slot ${slotName} is defined but not used in stem`);
    }
  }

  // Check that correctAnswerLogic can handle slot combinations
  // This is a basic check - full validation would test actual combinations

  // Check that allowedDistractorPatterns are valid
  const validPatterns: PatternId[] = [
    "premature-action",
    "role-confusion",
    "similar-concept",
    "data-ignorance",
    "extreme-language",
    "context-mismatch",
    "incomplete-response",
    "legal-overreach",
    "correlation-as-causation",
    "function-confusion",
    "case-confusion",
    "sequence-error",
    "function-mismatch",
    "model-confusion",
    "instruction-only",
    "adult-criteria",
    "inclusion-error",
    "optimal-education",
    "general-concerns",
    "investigation",
    "delay",
    "punishment-focus",
    "absolute-rules",
    "law-confusion",
    "no-access",
    "insufficient-hours",
    "full-release",
    "definition-error"
  ];

  for (const pattern of template.allowedDistractorPatterns) {
    if (!validPatterns.includes(pattern)) {
      issues.push(`Invalid distractor pattern: ${pattern}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
