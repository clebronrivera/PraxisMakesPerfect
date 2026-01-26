/**
 * Phase C: Generate Review Report
 * 
 * Consolidates automated findings into a human-readable document for final approval.
 * Includes: low confidence items, rule violations, spot-check sample, and summary statistics.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: 1 | 2 | 3;
  suggestedFramework: string;
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
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateReviewReport(
  suggestions: TaggingSuggestion[],
  questions: Question[],
  violations: ValidationViolation[]
): string {
  const report: string[] = [];

  // Header
  report.push('# DOK/Framework Tagging Review Report');
  report.push('');
  report.push(`**Generated:** ${new Date().toLocaleString()}`);
  report.push(`**Total Questions:** ${suggestions.length}`);
  report.push('');

  // Summary Dashboard
  report.push('## Summary Dashboard');
  report.push('');

  // DOK Distribution
  const dokDistribution = { 1: 0, 2: 0, 3: 0 };
  for (const suggestion of suggestions) {
    dokDistribution[suggestion.suggestedDok]++;
  }

  report.push('### DOK Distribution');
  report.push('');
  report.push('| DOK Level | Count | Percentage |');
  report.push('|----------|-------|------------|');
  report.push(`| DOK 1 (Recall) | ${dokDistribution[1]} | ${Math.round(dokDistribution[1] / suggestions.length * 100)}% |`);
  report.push(`| DOK 2 (Application) | ${dokDistribution[2]} | ${Math.round(dokDistribution[2] / suggestions.length * 100)}% |`);
  report.push(`| DOK 3 (Strategic Thinking) | ${dokDistribution[3]} | ${Math.round(dokDistribution[3] / suggestions.length * 100)}% |`);
  report.push('');

  // Framework Distribution
  const frameworkDistribution: Record<string, number> = {};
  for (const suggestion of suggestions) {
    frameworkDistribution[suggestion.suggestedFramework] = 
      (frameworkDistribution[suggestion.suggestedFramework] || 0) + 1;
  }

  report.push('### Framework Distribution');
  report.push('');
  report.push('| Framework | Count | Percentage |');
  report.push('|-----------|-------|------------|');
  for (const [framework, count] of Object.entries(frameworkDistribution).sort((a, b) => b[1] - a[1])) {
    report.push(`| ${framework} | ${count} | ${Math.round(count / suggestions.length * 100)}% |`);
  }
  report.push('');

  // Confidence Distribution
  const confidenceDistribution = { high: 0, medium: 0, low: 0 };
  for (const suggestion of suggestions) {
    confidenceDistribution[suggestion.confidence]++;
  }

  report.push('### Confidence Distribution');
  report.push('');
  report.push('| Confidence Level | Count | Percentage |');
  report.push('|------------------|-------|------------|');
  report.push(`| High | ${confidenceDistribution.high} | ${Math.round(confidenceDistribution.high / suggestions.length * 100)}% |`);
  report.push(`| Medium | ${confidenceDistribution.medium} | ${Math.round(confidenceDistribution.medium / suggestions.length * 100)}% |`);
  report.push(`| Low | ${confidenceDistribution.low} | ${Math.round(confidenceDistribution.low / suggestions.length * 100)}% |`);
  report.push('');

  // Violation Summary
  const violationsByRule = new Map<string, number>();
  for (const violation of violations) {
    violationsByRule.set(
      violation.rule,
      (violationsByRule.get(violation.rule) || 0) + 1
    );
  }

  report.push('### Validation Violations Summary');
  report.push('');
  report.push('| Rule | Violations |');
  report.push('|------|------------|');
  for (const [rule, count] of Array.from(violationsByRule.entries()).sort((a, b) => b[1] - a[1])) {
    report.push(`| ${rule} | ${count} |`);
  }
  report.push('');

  // High Priority Review Section
  report.push('## High Priority Review');
  report.push('');
  report.push('### Low Confidence Items');
  report.push('');
  report.push(`**Total:** ${suggestions.filter(s => s.confidence === 'low').length} items`);
  report.push('');
  report.push('These items were flagged as low confidence and require manual review:');
  report.push('');

  const lowConfidenceItems = suggestions.filter(s => s.confidence === 'low');
  const questionLookup = new Map<string, Question>();
  for (const question of questions) {
    questionLookup.set(question.id, question);
  }

  for (const item of lowConfidenceItems) {
    const question = questionLookup.get(item.questionId);
    report.push(`#### ${item.questionId}`);
    report.push('');
    if (question) {
      report.push(`**Question:** ${question.question.substring(0, 200)}${question.question.length > 200 ? '...' : ''}`);
      report.push('');
    }
    report.push(`**Suggested Tags:**`);
    report.push(`- DOK: ${item.suggestedDok}`);
    report.push(`- Framework: ${item.suggestedFramework}`);
    report.push(`- Step: ${item.suggestedFrameworkStep || 'none'}`);
    report.push('');
    report.push(`**Reasoning:** ${item.reasoning}`);
    report.push('');
    report.push('---');
    report.push('');
  }

  // Rule Violations
  report.push('### Rule Violations');
  report.push('');
  report.push(`**Total:** ${violations.length} violations across ${new Set(violations.map(v => v.questionId)).size} questions`);
  report.push('');
  report.push('These items violate validation rules and need correction:');
  report.push('');

  const violationsByQuestion = new Map<string, ValidationViolation[]>();
  for (const violation of violations) {
    if (!violationsByQuestion.has(violation.questionId)) {
      violationsByQuestion.set(violation.questionId, []);
    }
    violationsByQuestion.get(violation.questionId)!.push(violation);
  }

  for (const [questionId, questionViolations] of Array.from(violationsByQuestion.entries()).sort()) {
    const question = questionLookup.get(questionId);
    const suggestion = suggestions.find(s => s.questionId === questionId);
    
    report.push(`#### ${questionId}`);
    report.push('');
    if (question) {
      report.push(`**Question:** ${question.question.substring(0, 200)}${question.question.length > 200 ? '...' : ''}`);
      report.push('');
    }
    
    if (suggestion) {
      report.push(`**Current Suggestion:**`);
      report.push(`- DOK: ${suggestion.suggestedDok}`);
      report.push(`- Framework: ${suggestion.suggestedFramework}`);
      report.push(`- Step: ${suggestion.suggestedFrameworkStep || 'none'}`);
      report.push('');
    }

    report.push(`**Violations (${questionViolations.length}):**`);
    for (const violation of questionViolations) {
      report.push(`- **${violation.rule}**: ${violation.violation}`);
    }
    report.push('');
    report.push('---');
    report.push('');
  }

  // Spot-Check Section (10% random sample of high confidence)
  report.push('## Spot-Check Sample');
  report.push('');
  report.push('Random 10% sample of HIGH confidence suggestions for verification:');
  report.push('');

  const highConfidenceItems = suggestions.filter(s => s.confidence === 'high');
  const spotCheckCount = Math.max(1, Math.floor(highConfidenceItems.length * 0.1));
  const shuffledHigh = shuffleArray(highConfidenceItems);
  const spotCheckSample = shuffledHigh.slice(0, spotCheckCount);

  for (const item of spotCheckSample) {
    const question = questionLookup.get(item.questionId);
    report.push(`#### ${item.questionId}`);
    report.push('');
    if (question) {
      report.push(`**Question:** ${question.question.substring(0, 200)}${question.question.length > 200 ? '...' : ''}`);
      report.push('');
    }
    report.push(`**Suggested Tags:**`);
    report.push(`- DOK: ${item.suggestedDok}`);
    report.push(`- Framework: ${item.suggestedFramework}`);
    report.push(`- Step: ${item.suggestedFrameworkStep || 'none'}`);
    report.push('');
    report.push(`**Reasoning:** ${item.reasoning}`);
    report.push('');
    report.push('---');
    report.push('');
  }

  // Review Instructions
  report.push('## Review Instructions');
  report.push('');
  report.push('### How to Review');
  report.push('');
  report.push('1. **Review Low Confidence Items**: Check each low confidence suggestion and verify the tags are correct.');
  report.push('2. **Fix Rule Violations**: Address all validation rule violations by updating tags in `tagging-suggestions.json`.');
  report.push('3. **Spot-Check High Confidence**: Verify the random sample of high confidence items to ensure baseline accuracy.');
  report.push('4. **Mark for Review**: In `tagging-suggestions.json`, set `needsReview: true` for any items that need manual correction.');
  report.push('5. **Approve Ready Items**: Items with `needsReview: false` will be applied in Phase D.');
  report.push('');

  report.push('### Editing tagging-suggestions.json');
  report.push('');
  report.push('To mark an item for review:');
  report.push('```json');
  report.push('{');
  report.push('  "questionId": "SP5403_Q001",');
  report.push('  "needsReview": true,  // Set to true to skip in Phase D');
  report.push('  // ... other fields');
  report.push('}');
  report.push('```');
  report.push('');

  report.push('### Next Steps');
  report.push('');
  report.push('After completing the review:');
  report.push('1. Update `tagging-suggestions.json` with corrections');
  report.push('2. Set `needsReview: false` for approved items');
  report.push('3. Set `needsReview: true` for items that need manual tagging');
  report.push('4. Proceed to **Phase D: Apply Approved Tags**');
  report.push('');

  return report.join('\n');
}

function main() {
  console.log('Phase C: Generating Review Report...\n');

  // Load data files
  const suggestionsPath = path.join(__dirname, '../src/data/tagging-suggestions.json');
  const questionsPath = path.join(__dirname, '../src/data/questions.json');
  const validationReportPath = path.join(__dirname, '../src/data/tagging-validation-report.md');
  const outputPath = path.join(__dirname, '../TAGGING_REVIEW.md');

  const suggestions: TaggingSuggestion[] = JSON.parse(
    fs.readFileSync(suggestionsPath, 'utf-8')
  );
  const questions: Question[] = JSON.parse(
    fs.readFileSync(questionsPath, 'utf-8')
  );

  // Parse violations from validation report
  const validationReport = fs.readFileSync(validationReportPath, 'utf-8');
  const violations: ValidationViolation[] = [];
  
  // Extract violations from markdown
  const sections = validationReport.split(/^## /m);
  
  for (const section of sections) {
    if (!section.includes('Rule')) continue;
    
    const ruleMatch = section.match(/^(.+?)\n/);
    if (!ruleMatch) continue;
    
    const ruleName = ruleMatch[1].trim();
    const questionMatches = section.matchAll(/### (SP5403_Q\d+|ETS_Q\d+)\n\n\*\*Violation:\*\* (.+?)\n/g);
    
    for (const match of questionMatches) {
      violations.push({
        questionId: match[1],
        rule: ruleName,
        ruleDescription: '',
        violation: match[2]
      });
    }
  }

  // Generate report
  const report = generateReviewReport(suggestions, questions, violations);
  fs.writeFileSync(outputPath, report, 'utf-8');

  console.log(`✓ Generated review report: ${outputPath}`);
  console.log(`✓ Included ${suggestions.filter(s => s.confidence === 'low').length} low confidence items`);
  console.log(`✓ Included ${violations.length} rule violations`);
  console.log(`✓ Included ${Math.floor(suggestions.filter(s => s.confidence === 'high').length * 0.1)} spot-check items`);
  console.log(`\n✓ Phase C Complete! Review TAGGING_REVIEW.md and update tagging-suggestions.json before proceeding to Phase D.`);
}

main();
