// Export flagged questions with all data for manual audit
import { readFileSync, writeFileSync } from 'fs';

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId: string;
  templateId?: string;
}

interface FlaggedIssue {
  questionId: string;
  skillId: string;
  templateId: string;
  issueType: string;
  distractor: string;
  recommendation: string;
}

// Read questions
const questions: Question[] = JSON.parse(readFileSync('src/data/questions.json', 'utf-8'));

// Read audit report
const auditReport = readFileSync('DISTRACTOR_AUDIT_REPORT.md', 'utf-8');

// Parse flagged questions from the markdown table
const flaggedIssues: FlaggedIssue[] = [];
const tableLines = auditReport.split('\n').filter(line => line.startsWith('| SP5403_') || line.startsWith('| GEN-'));

for (const line of tableLines) {
  const parts = line.split('|').map(p => p.trim()).filter(p => p);
  if (parts.length >= 5) {
    flaggedIssues.push({
      questionId: parts[0],
      skillId: parts[1],
      templateId: parts[2],
      issueType: parts[3],
      distractor: parts[4],
      recommendation: parts[5] || ''
    });
  }
}

// Get unique flagged question IDs
const flaggedIds = [...new Set(flaggedIssues.map(f => f.questionId))];
console.log(`Found ${flaggedIds.length} unique flagged questions with ${flaggedIssues.length} total issues\n`);

// Build question lookup
const questionMap = new Map<string, Question>();
for (const q of questions) {
  questionMap.set(q.id, q);
}

// Aggregate issues per question
const issuesByQuestion = new Map<string, FlaggedIssue[]>();
for (const issue of flaggedIssues) {
  if (!issuesByQuestion.has(issue.questionId)) {
    issuesByQuestion.set(issue.questionId, []);
  }
  issuesByQuestion.get(issue.questionId)!.push(issue);
}

// Create CSV with all data
const csvRows: string[] = [];

// Header
csvRows.push([
  'id',
  'source',
  'skillId',
  'templateId',
  'issue_types',
  'issue_count',
  'stem',
  'choiceA',
  'choiceB', 
  'choiceC',
  'choiceD',
  'correct_answer',
  'correct_text',
  'choiceA_length',
  'choiceB_length',
  'choiceC_length',
  'choiceD_length',
  'correct_length',
  'flagged_distractors',
  'recommendations',
  'rationale'
].join(','));

// Data rows
for (const qId of flaggedIds) {
  const q = questionMap.get(qId);
  const issues = issuesByQuestion.get(qId) || [];
  
  if (!q) {
    console.log(`Warning: Question ${qId} not found in questions.json`);
    continue;
  }
  
  const source = qId.startsWith('GEN-') ? 'generated' : 'ETS';
  const issueTypes = [...new Set(issues.map(i => i.issueType))].join('; ');
  const flaggedDistractors = issues.map(i => i.distractor).join(' | ');
  const recommendations = [...new Set(issues.map(i => i.recommendation))].join(' | ');
  
  const correctLetter = q.correct_answer[0];
  const correctText = q.choices[correctLetter] || '';
  
  // Escape CSV fields
  const escape = (s: string) => `"${(s || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  
  csvRows.push([
    q.id,
    source,
    q.skillId,
    issues[0]?.templateId || 'N/A',
    escape(issueTypes),
    issues.length.toString(),
    escape(q.question),
    escape(q.choices.A || ''),
    escape(q.choices.B || ''),
    escape(q.choices.C || ''),
    escape(q.choices.D || ''),
    q.correct_answer.join(';'),
    escape(correctText),
    (q.choices.A || '').length.toString(),
    (q.choices.B || '').length.toString(),
    (q.choices.C || '').length.toString(),
    (q.choices.D || '').length.toString(),
    correctText.length.toString(),
    escape(flaggedDistractors),
    escape(recommendations),
    escape(q.rationale || '')
  ].join(','));
}

// Write CSV
const outputPath = 'quality-reports/flagged-questions-audit.csv';
writeFileSync(outputPath, csvRows.join('\n'));

console.log(`Exported ${flaggedIds.length} flagged questions to ${outputPath}`);
console.log(`\nBreakdown by source:`);

const etsList = flaggedIds.filter(id => id.startsWith('SP5403'));
const genList = flaggedIds.filter(id => id.startsWith('GEN-'));

console.log(`  ETS questions: ${etsList.length}`);
console.log(`  Generated questions: ${genList.length}`);

console.log(`\nBreakdown by issue type:`);
const issueTypeCounts: Record<string, number> = {};
for (const issue of flaggedIssues) {
  issueTypeCounts[issue.issueType] = (issueTypeCounts[issue.issueType] || 0) + 1;
}
for (const [type, count] of Object.entries(issueTypeCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
