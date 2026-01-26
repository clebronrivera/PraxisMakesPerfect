/**
 * Phase B: Rule-Based Validation
 * 
 * Validates tagging suggestions against logical rules to flag potential errors.
 * Outputs violations to tagging-validation-report.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FRAMEWORK_STEPS, FrameworkType } from '../src/brain/framework-definitions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: 1 | 2 | 3;
  suggestedFramework: FrameworkType | 'none';
  suggestedFrameworkStep: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  needsReview: boolean;
}

interface Question {
  id: string;
  question: string;
  rationale: string;
}

interface ValidationViolation {
  questionId: string;
  rule: string;
  ruleDescription: string;
  violation: string;
  suggestion: TaggingSuggestion;
  questionText: string;
}

function validateRule1(question: Question, suggestion: TaggingSuggestion): ValidationViolation | null {
  // Rule 1: If question contains "first step" or "next step" → should be DOK 3 and have a framework
  const text = question.question.toLowerCase();
  const hasStepPhrasing = text.includes('first step') || 
                          text.includes('next step') || 
                          text.includes('initial') ||
                          text.includes('should first');

  if (hasStepPhrasing) {
    const violations: string[] = [];
    
    if (suggestion.suggestedDok !== 3) {
      violations.push(`Expected DOK 3 (strategic thinking) but got DOK ${suggestion.suggestedDok}`);
    }
    
    if (suggestion.suggestedFramework === 'none') {
      violations.push('Expected a framework (process question) but got "none"');
    }

    if (violations.length > 0) {
      return {
        questionId: question.id,
        rule: 'Rule 1: Step Process Rule',
        ruleDescription: 'Questions with "first step", "next step", or "initial" should be DOK 3 and have a framework',
        violation: violations.join('; '),
        suggestion,
        questionText: question.question.substring(0, 150) + '...'
      };
    }
  }

  return null;
}

function validateRule2(question: Question, suggestion: TaggingSuggestion): ValidationViolation | null {
  // Rule 2: If question asks about definitions/terms only → should be DOK 1
  const text = question.question.toLowerCase();
  const rationale = question.rationale.toLowerCase();
  const combined = `${text} ${rationale}`.toLowerCase();

  const definitionIndicators = [
    'is defined as', 'refers to', 'definition', 'which court case',
    'what is', 'which of the following is', 'identify the term',
    'recognize the', 'name the'
  ];

  const isDefinitionQuestion = definitionIndicators.some(indicator => 
    text.includes(indicator)
  ) && !combined.includes('school psychologist') && 
      !combined.includes('should') &&
      !combined.includes('first step') &&
      question.question.length < 200;

  if (isDefinitionQuestion && suggestion.suggestedDok !== 1) {
    return {
      questionId: question.id,
      rule: 'Rule 2: Definition Rule',
      ruleDescription: 'Questions asking for definitions or terms should be DOK 1 (recall)',
      violation: `Expected DOK 1 (definition/recall) but got DOK ${suggestion.suggestedDok}`,
      suggestion,
      questionText: question.question.substring(0, 150) + '...'
    };
  }

  return null;
}

function validateRule3(suggestion: TaggingSuggestion): ValidationViolation | null {
  // Rule 3: If framework is FBA → step should be one of the FBA steps (not problem-solving steps)
  if (suggestion.suggestedFramework === 'fba' && suggestion.suggestedFrameworkStep) {
    const step = FRAMEWORK_STEPS[suggestion.suggestedFrameworkStep];
    
    if (!step) {
      return {
        questionId: suggestion.questionId,
        rule: 'Rule 3: Step Hierarchy Rule',
        ruleDescription: 'Framework step must belong to the assigned framework type',
        violation: `Step "${suggestion.suggestedFrameworkStep}" not found in framework definitions`,
        suggestion,
        questionText: ''
      };
    }

    if (step.frameworkType !== 'fba') {
      return {
        questionId: suggestion.questionId,
        rule: 'Rule 3: Step Hierarchy Rule',
        ruleDescription: 'Framework step must belong to the assigned framework type',
        violation: `FBA framework assigned but step "${suggestion.suggestedFrameworkStep}" belongs to ${step.frameworkType} framework`,
        suggestion,
        questionText: ''
      };
    }
  }

  // Check all frameworks, not just FBA
  if (suggestion.suggestedFramework !== 'none' && suggestion.suggestedFrameworkStep) {
    const step = FRAMEWORK_STEPS[suggestion.suggestedFrameworkStep];
    
    if (step && step.frameworkType !== suggestion.suggestedFramework) {
      return {
        questionId: suggestion.questionId,
        rule: 'Rule 3: Step Hierarchy Rule',
        ruleDescription: 'Framework step must belong to the assigned framework type',
        violation: `${suggestion.suggestedFramework} framework assigned but step "${suggestion.suggestedFrameworkStep}" belongs to ${step.frameworkType} framework`,
        suggestion,
        questionText: ''
      };
    }
  }

  return null;
}

function validateRule4(suggestion: TaggingSuggestion): ValidationViolation | null {
  // Rule 4: If DOK is 3 → should have a framework (strategic thinking implies process)
  if (suggestion.suggestedDok === 3 && suggestion.suggestedFramework === 'none') {
    return {
      questionId: suggestion.questionId,
      rule: 'Rule 4: Strategic Thinking Rule',
      ruleDescription: 'DOK 3 (strategic thinking) questions should have a framework (process-based)',
      violation: 'DOK 3 assigned but framework is "none" - strategic thinking implies a process framework',
      suggestion,
      questionText: ''
    };
  }

  return null;
}

function validateRule5(suggestion: TaggingSuggestion, skillMapping: any): ValidationViolation | null {
  // Rule 5: ETS Cross-Check (already implemented in Phase A, but flag inconsistencies here)
  if (!suggestion.questionId.startsWith('ETS_Q') || !skillMapping) {
    return null;
  }

  // This rule was already applied in Phase A, but we can flag it again for visibility
  if (suggestion.confidence === 'low' && suggestion.reasoning.includes('WARNING')) {
    return {
      questionId: suggestion.questionId,
      rule: 'Rule 5: ETS Consistency Rule',
      ruleDescription: 'ETS questions should align with domain expectations from skill mapping',
      violation: suggestion.reasoning,
      suggestion,
      questionText: ''
    };
  }

  return null;
}

function generateValidationReport(
  violations: ValidationViolation[],
  suggestions: TaggingSuggestion[]
): string {
  const report: string[] = [];
  
  report.push('# Tagging Validation Report');
  report.push('');
  report.push(`**Generated:** ${new Date().toLocaleString()}`);
  report.push(`**Total Questions Analyzed:** ${suggestions.length}`);
  report.push(`**Total Violations Found:** ${violations.length}`);
  report.push('');

  // Group violations by rule
  const violationsByRule = new Map<string, ValidationViolation[]>();
  for (const violation of violations) {
    if (!violationsByRule.has(violation.rule)) {
      violationsByRule.set(violation.rule, []);
    }
    violationsByRule.get(violation.rule)!.push(violation);
  }

  // Summary by rule
  report.push('## Summary by Rule');
  report.push('');
  report.push('| Rule | Violations | Percentage |');
  report.push('|------|------------|------------|');
  
  for (const [rule, ruleViolations] of violationsByRule.entries()) {
    const percentage = Math.round((ruleViolations.length / suggestions.length) * 100);
    report.push(`| ${rule} | ${ruleViolations.length} | ${percentage}% |`);
  }
  report.push('');

  // Detailed violations by rule
  for (const [rule, ruleViolations] of violationsByRule.entries()) {
    report.push(`## ${rule}`);
    report.push('');
    report.push(`**Count:** ${ruleViolations.length} violations`);
    report.push('');

    for (const violation of ruleViolations) {
      report.push(`### ${violation.questionId}`);
      report.push('');
      report.push(`**Violation:** ${violation.violation}`);
      report.push('');
      report.push(`**Current Suggestion:**`);
      report.push(`- DOK: ${violation.suggestion.suggestedDok}`);
      report.push(`- Framework: ${violation.suggestion.suggestedFramework}`);
      report.push(`- Step: ${violation.suggestion.suggestedFrameworkStep || 'none'}`);
      report.push(`- Confidence: ${violation.suggestion.confidence}`);
      report.push('');
      if (violation.questionText) {
        report.push(`**Question:** ${violation.questionText}`);
        report.push('');
      }
      report.push('---');
      report.push('');
    }
  }

  // Questions with multiple violations
  const violationCounts = new Map<string, number>();
  for (const violation of violations) {
    violationCounts.set(
      violation.questionId,
      (violationCounts.get(violation.questionId) || 0) + 1
    );
  }

  const multipleViolations = Array.from(violationCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (multipleViolations.length > 0) {
    report.push('## Questions with Multiple Violations');
    report.push('');
    report.push('These questions violate multiple rules and should be prioritized for review:');
    report.push('');
    report.push('| Question ID | Violation Count |');
    report.push('|-------------|-----------------|');
    
    for (const [questionId, count] of multipleViolations) {
      report.push(`| ${questionId} | ${count} |`);
    }
    report.push('');
  }

  return report.join('\n');
}

function main() {
  console.log('Phase B: Rule-Based Validation...\n');

  // Load data files
  const suggestionsPath = path.join(__dirname, '../src/data/tagging-suggestions.json');
  const questionsPath = path.join(__dirname, '../src/data/questions.json');
  const skillMapPath = path.join(__dirname, '../src/data/question-skill-map.json');
  const outputPath = path.join(__dirname, '../src/data/tagging-validation-report.md');

  const suggestions: TaggingSuggestion[] = JSON.parse(
    fs.readFileSync(suggestionsPath, 'utf-8')
  );
  const questions: Question[] = JSON.parse(
    fs.readFileSync(questionsPath, 'utf-8')
  );
  const skillMapData: { mappedQuestions: any[] } = JSON.parse(
    fs.readFileSync(skillMapPath, 'utf-8')
  );

  // Create lookup maps
  const questionLookup = new Map<string, Question>();
  for (const question of questions) {
    questionLookup.set(question.id, question);
  }

  const skillMappingLookup = new Map<string, any>();
  for (const mapping of skillMapData.mappedQuestions) {
    skillMappingLookup.set(mapping.questionId, mapping);
  }

  // Validate each suggestion
  const violations: ValidationViolation[] = [];

  for (const suggestion of suggestions) {
    const question = questionLookup.get(suggestion.questionId);
    if (!question) {
      console.warn(`Warning: Question ${suggestion.questionId} not found in questions.json`);
      continue;
    }

    const skillMapping = skillMappingLookup.get(suggestion.questionId);

    // Apply all validation rules
    const rule1Violation = validateRule1(question, suggestion);
    if (rule1Violation) violations.push(rule1Violation);

    const rule2Violation = validateRule2(question, suggestion);
    if (rule2Violation) violations.push(rule2Violation);

    const rule3Violation = validateRule3(suggestion);
    if (rule3Violation) violations.push(rule3Violation);

    const rule4Violation = validateRule4(suggestion);
    if (rule4Violation) violations.push(rule4Violation);

    const rule5Violation = validateRule5(suggestion, skillMapping);
    if (rule5Violation) violations.push(rule5Violation);
  }

  // Generate report
  const report = generateValidationReport(violations, suggestions);
  fs.writeFileSync(outputPath, report, 'utf-8');

  console.log(`✓ Validated ${suggestions.length} suggestions`);
  console.log(`✓ Found ${violations.length} violations`);
  console.log(`✓ Generated validation report: ${outputPath}\n`);

  // Summary statistics
  const violationsByRule = new Map<string, number>();
  for (const violation of violations) {
    violationsByRule.set(
      violation.rule,
      (violationsByRule.get(violation.rule) || 0) + 1
    );
  }

  console.log('=== VALIDATION SUMMARY ===\n');
  console.log('Violations by Rule:');
  for (const [rule, count] of Array.from(violationsByRule.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule}: ${count}`);
  }

  const uniqueQuestions = new Set(violations.map(v => v.questionId));
  console.log(`\nUnique questions with violations: ${uniqueQuestions.size}`);
  console.log(`\n✓ Phase B Complete! Review tagging-validation-report.md before proceeding to Phase C.`);
}

main();
