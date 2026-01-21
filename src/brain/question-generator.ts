// Question Generator - Produces complete questions from templates
// Main entry point for generating questions

import { SkillId, getSkillById } from './skill-map';
import { QuestionTemplate, validateTemplate } from './template-schema';
import { domain1Templates, domain1TemplateMap } from './templates/domain-1-templates';
import { domain2Templates } from './templates/domain-2-templates';
import { domain3Templates } from './templates/domain-3-templates';
import { domain4Templates } from './templates/domain-4-templates';
import { domain5Templates } from './templates/domain-5-templates';
import { domain6Templates } from './templates/domain-6-templates';
import { domain7Templates } from './templates/domain-7-templates';
import { domain8Templates } from './templates/domain-8-templates';
import { domain9Templates } from './templates/domain-9-templates';
import { domain10Templates } from './templates/domain-10-templates';
import { getSlotValues, getRandomSlotValue } from './slot-libraries';
import { generateDistractors, validateDistractors, Distractor } from './answer-generator';
import { buildRationale } from './rationale-builder';
import { validateQuestion } from './question-validator';

export interface GenerateQuestionOptions {
  templateId?: string; // Specific template to use (otherwise random)
  slotValues?: Record<string, string>; // Specific slot values (otherwise random)
  seed?: number; // For reproducible generation
  distractorCount?: number; // Number of distractors (default 3)
}

export interface GeneratedQuestion {
  id: string; // "GEN-{templateId}-{hash}"
  question: string; // Rendered stem text
  choices: Record<string, string>; // { A: "...", B: "...", C: "...", D: "..." }
  correct_answer: string[]; // ["B"]
  rationale: string; // Generated explanation
  metadata: {
    skillId: SkillId;
    templateId: string;
    slotValues: Record<string, string>;
    generatedAt: number;
    isGenerated: true;
  };
}

// Simple hash function for generating question IDs
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

// Combine all domain templates
const allTemplates: QuestionTemplate[] = [
  ...domain1Templates,
  ...domain2Templates,
  ...domain3Templates,
  ...domain4Templates,
  ...domain5Templates,
  ...domain6Templates,
  ...domain7Templates,
  ...domain8Templates,
  ...domain9Templates,
  ...domain10Templates
];

/**
 * Get templates for a skill
 */
function getTemplatesForSkill(skillId: SkillId): QuestionTemplate[] {
  return allTemplates.filter(t => t.skillId === skillId);
}

/**
 * Select slot values for a template
 */
function selectSlotValues(
  template: QuestionTemplate,
  providedValues?: Record<string, string>,
  seed?: number
): Record<string, string> {
  const values: Record<string, string> = {};
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;

  // Use provided values where available
  if (providedValues) {
    Object.assign(values, providedValues);
  }

  // Fill in missing slots
  for (const [slotName, slotDef] of Object.entries(template.slots)) {
    if (values[slotName]) continue; // Already provided

    // Get possible values for this slot
    const possibleValues = slotDef.possibleValues;
    if (possibleValues.length === 0) continue;

    // Check constraints
    let selectedValue: string | null = null;
    let attempts = 0;
    const maxAttempts = 50;

    while (!selectedValue && attempts < maxAttempts) {
      const candidate = possibleValues[Math.floor(rng() * possibleValues.length)];
      
      // Check if this value satisfies constraints
      if (template.slotConstraints) {
        const testValues = { ...values, [slotName]: candidate };
        const satisfiesConstraints = template.slotConstraints.every(constraint => {
          // Check if this slot is involved in the constraint
          if (!constraint.slots.includes(slotName)) return true;
          return constraint.rule(testValues);
        });

        if (satisfiesConstraints) {
          selectedValue = candidate;
        }
      } else {
        selectedValue = candidate;
      }

      attempts++;
    }

    if (selectedValue) {
      values[slotName] = selectedValue;
    } else {
      // Fallback to first value if constraints can't be satisfied
      values[slotName] = possibleValues[0];
    }
  }

  return values;
}

/**
 * Render the stem by replacing slot placeholders
 */
function renderStem(template: QuestionTemplate, slotValues: Record<string, string>): string {
  let stem = template.stem;

  // Replace all {slot_name} placeholders
  for (const [slotName, value] of Object.entries(slotValues)) {
    const placeholder = `{${slotName}}`;
    stem = stem.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // Check for any unreplaced placeholders
  const remainingPlaceholders = stem.match(/\{(\w+)\}/g);
  if (remainingPlaceholders && remainingPlaceholders.length > 0) {
    console.warn(`Warning: Unreplaced placeholders in stem: ${remainingPlaceholders.join(', ')}`);
  }

  return stem;
}

/**
 * Compute correct answer using template logic
 */
function computeCorrectAnswer(
  template: QuestionTemplate,
  slotValues: Record<string, string>
): string {
  return template.correctAnswerLogic.evaluate(slotValues);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Main function to generate a question
 */
export function generateQuestion(
  skillId: SkillId,
  options: GenerateQuestionOptions = {}
): GeneratedQuestion | null {
  const {
    templateId,
    slotValues: providedSlotValues,
    seed,
    distractorCount = 3
  } = options;

  // Look up the skill
  const skill = getSkillById(skillId);
  if (!skill) {
    console.error(`Skill not found: ${skillId}`);
    return null;
  }

  // Find templates that test this skill
  const availableTemplates = getTemplatesForSkill(skillId);
  if (availableTemplates.length === 0) {
    console.error(`No templates found for skill: ${skillId}`);
    return null;
  }

  // Select a template
  let template: QuestionTemplate;
  if (templateId) {
    template = availableTemplates.find(t => t.templateId === templateId) || availableTemplates[0];
  } else {
    const rng = seed !== undefined ? seededRandom(seed) : Math.random;
    template = availableTemplates[Math.floor(rng() * availableTemplates.length)];
  }

  // Validate template
  const templateValidation = validateTemplate(template);
  if (!templateValidation.valid) {
    console.warn(`Template validation issues: ${templateValidation.issues.join(', ')}`);
  }

  // Select slot values
  const slotValues = selectSlotValues(template, providedSlotValues, seed);

  // Build the stem
  const questionText = renderStem(template, slotValues);

  // Compute correct answer
  const correctAnswerText = computeCorrectAnswer(template, slotValues);

  // Generate distractors
  const distractors = generateDistractors(
    correctAnswerText,
    template,
    slotValues,
    skill.decisionRule,
    distractorCount
  );

  // Validate distractors
  const distractorValidation = validateDistractors(correctAnswerText, distractors);
  if (!distractorValidation.valid) {
    console.warn(`Distractor validation issues: ${distractorValidation.issues.join(', ')}`);
  }

  // Create answer choices
  const allAnswers = [correctAnswerText, ...distractors.map(d => d.text)];
  const shuffledAnswers = shuffleArray(allAnswers, seed);
  
  // Find correct answer position
  const correctIndex = shuffledAnswers.findIndex(a => a === correctAnswerText);
  const correctLetter = String.fromCharCode(65 + correctIndex); // A, B, C, D...

  // Build choices object
  const choices: Record<string, string> = {};
  shuffledAnswers.forEach((answer, index) => {
    const letter = String.fromCharCode(65 + index);
    choices[letter] = answer;
  });

  // Generate rationale
  const rationale = buildRationale({
    correctAnswer: correctAnswerText,
    correctAnswerLetter: correctLetter,
    keyPrinciple: template.keyPrinciple,
    decisionRule: skill.decisionRule,
    whyDistractorsWrong: distractors,
    slotValues
  });

  // Generate question ID
  const slotValuesHash = JSON.stringify(slotValues);
  const hash = simpleHash(`${template.templateId}-${slotValuesHash}`);
  const questionId = `GEN-${template.templateId}-${hash}`;

  // Create question object
  const generatedQuestion: GeneratedQuestion = {
    id: questionId,
    question: questionText,
    choices,
    correct_answer: [correctLetter],
    rationale,
    metadata: {
      skillId,
      templateId: template.templateId,
      slotValues,
      generatedAt: Date.now(),
      isGenerated: true
    }
  };

  // Validate the complete question
  const questionValidation = validateQuestion(generatedQuestion);
  if (!questionValidation.valid) {
    console.warn(`Question validation issues: ${questionValidation.issues.join(', ')}`);
    if (questionValidation.confidence === "low") {
      console.error("Question failed validation - not suitable for use");
      return null;
    }
  }

  return generatedQuestion;
}

/**
 * Generate multiple questions for a skill
 */
export function generateQuestions(
  skillId: SkillId,
  count: number,
  options: GenerateQuestionOptions = {}
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const usedSlotCombinations = new Set<string>();

  for (let i = 0; i < count; i++) {
    const questionOptions = {
      ...options,
      seed: options.seed !== undefined ? options.seed + i : undefined
    };

    const question = generateQuestion(skillId, questionOptions);
    
    if (question) {
      // Check for duplicate slot combinations
      const slotHash = JSON.stringify(question.metadata.slotValues);
      if (!usedSlotCombinations.has(slotHash)) {
        questions.push(question);
        usedSlotCombinations.add(slotHash);
      }
    }
  }

  return questions;
}
