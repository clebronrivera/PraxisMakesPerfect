import { generateQuestions } from '../brain/question-generator';
import {
  getAllSkills,
  getTemplatesForSkill
} from './diagnostic-utils';

export interface DistractorAuditSummary {
  skillId: string;
  name: string;
  patternsUsed: number;
  availablePatterns: number;
  uniqueDistractors: number;
  totalQuestions: number;
  positionDistribution: Record<string, number>;
  issues: string[];
}

export interface DistractorAuditReport {
  summaries: DistractorAuditSummary[];
  issues: string[];
}

export function runDistractorAudit(): DistractorAuditReport {
  const summaries: DistractorAuditSummary[] = [];
  const issues: string[] = [];

  for (const skill of getAllSkills()) {
    const templates = getTemplatesForSkill(skill.skillId);
    if (templates.length === 0) continue;

    const availablePatterns = new Set<string>();
    for (const template of templates) {
      template.allowedDistractorPatterns.forEach(pattern => availablePatterns.add(pattern));
    }

    const questions = generateQuestions(skill.skillId, 20);
    if (questions.length === 0) continue;

    const usedPatterns = new Set<string>();
    const uniqueDistractors = new Set<string>();
    const positionDistribution: Record<string, number> = {};

    for (const question of questions) {
      for (const distractor of question.distractors) {
        usedPatterns.add(distractor.patternId);
        uniqueDistractors.add(distractor.text);
      }

      const correctLetter = question.correct_answer[0];
      if (correctLetter) {
        positionDistribution[correctLetter] = (positionDistribution[correctLetter] ?? 0) + 1;
      }
    }

    const totalPositions = Object.values(positionDistribution).reduce((sum, value) => sum + value, 0);
    const skewed = Object.entries(positionDistribution).some(([letter, count]) => {
      const ratio = totalPositions === 0 ? 0 : count / totalPositions;
      return ratio > 0.4 || ratio < 0.15;
    });

    const summaryIssues: string[] = [];

    if (
      availablePatterns.size > 0 &&
      usedPatterns.size / availablePatterns.size < 1
    ) {
      summaryIssues.push('LOW pattern variety');
      issues.push(`${skill.skillId}: add more distractor patterns`);
    }

    if (uniqueDistractors.size < 8) {
      summaryIssues.push('REPETITIVE distractors');
      issues.push(`${skill.skillId}: increase unique distractor text`);
    }

    if (skewed) {
      summaryIssues.push('SKEWED answer positions');
      issues.push(`${skill.skillId}: randomize correct answer position`);
    }

    summaries.push({
      skillId: skill.skillId,
      name: skill.name,
      patternsUsed: usedPatterns.size,
      availablePatterns: availablePatterns.size,
      uniqueDistractors: uniqueDistractors.size,
      totalQuestions: questions.length,
      positionDistribution,
      issues: summaryIssues
    });
  }

  console.log('DISTRACTOR AUDIT');
  console.log('================');
  console.log('');

  for (const summary of summaries) {
    const distributionText = ['A', 'B', 'C', 'D']
      .map(letter => `${letter}=${summary.positionDistribution[letter] ?? 0}`)
      .join(', ');

    console.log(`${summary.skillId}: ${summary.name}`);
    console.log(
      `  Distractor patterns used: ${summary.patternsUsed} of ${summary.availablePatterns} available${
        summary.patternsUsed < summary.availablePatterns ? ' ← LOW' : ' ✓'
      }`
    );
    console.log(
      `  Unique distractors: ${summary.uniqueDistractors} across ${summary.totalQuestions} questions${
        summary.uniqueDistractors < 8 ? ' ← REPETITIVE' : ' ✓'
      }`
    );
    console.log(
      `  Answer position distribution: ${distributionText}${
        summary.issues.includes('SKEWED answer positions') ? ' ← SKEWED' : ' ✓'
      }`
    );
    console.log('');
  }

  console.log('ISSUES:');
  if (issues.length === 0) {
    console.log('  (none)');
  } else {
    const uniqueIssues = Array.from(new Set(issues));
    uniqueIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  return {
    summaries,
    issues
  };
}

if (import.meta.main) {
  runDistractorAudit();
}
