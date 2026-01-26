import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read questions.json
const questionsPath = path.join(__dirname, 'src/data/questions.json');
const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
const questions = questionsData.questions || questionsData;

// Read skill-map.ts
const skillMapPath = path.join(__dirname, 'src/brain/skill-map.ts');
const skillMapContent = fs.readFileSync(skillMapPath, 'utf-8');

// Extract skill IDs from skill-map.ts
// Look for patterns like skillId: "DBDM-S01" or "SP5403_SK001" etc.
const skillIdPattern = /skillId:\s*["']([^"']+)["']/g;
const validSkillIds = new Set<string>();
let match;
while ((match = skillIdPattern.exec(skillMapContent)) !== null) {
  validSkillIds.add(match[1]);
}

// Create output array to collect all output
const output: string[] = [];

function log(message: string) {
  console.log(message);
  output.push(message);
}

log('='.repeat(80));
log('PART 2: Question-Skill Mapping Health');
log('='.repeat(80));
log('');

// 1. Count total questions
const totalQuestions = questions.length;
log(`1. Total questions: ${totalQuestions}`);
log('');

// 2. Count questions with valid skillId
let validSkillIdCount = 0;
const invalidQuestions: Array<{id: string, skillId?: string, reason: string}> = [];
const questionIds = new Set<string>();
const duplicateIds: string[] = [];

questions.forEach((q: any) => {
  // Check for duplicate IDs
  if (questionIds.has(q.id)) {
    duplicateIds.push(q.id);
  } else {
    questionIds.add(q.id);
  }

  // Check skillId validity
  if (!q.skillId) {
    invalidQuestions.push({
      id: q.id,
      reason: 'Missing skillId'
    });
  } else if (!validSkillIds.has(q.skillId)) {
    invalidQuestions.push({
      id: q.id,
      skillId: q.skillId,
      reason: `Invalid skillId (not found in skill-map.ts)`
    });
  } else {
    validSkillIdCount++;
  }
});

log(`2. Questions with valid skillId: ${validSkillIdCount}`);
log(`   Questions with invalid/missing skillId: ${invalidQuestions.length}`);
log('');

// 3. List questions with missing or invalid skillId
if (invalidQuestions.length > 0) {
  log('3. Questions with missing or invalid skillId:');
  invalidQuestions.forEach(q => {
    log(`   - ${q.id}: ${q.reason}${q.skillId ? ` (skillId: ${q.skillId})` : ''}`);
  });
} else {
  log('3. All questions have valid skillIds ✓');
}
log('');

// 4. Check for duplicate question IDs
if (duplicateIds.length > 0) {
  log(`4. Duplicate question IDs found: ${duplicateIds.length}`);
  const uniqueDuplicates = [...new Set(duplicateIds)];
  uniqueDuplicates.forEach(id => {
    log(`   - ${id}`);
  });
} else {
  log('4. No duplicate question IDs found ✓');
}
log('');

log('='.repeat(80));
log('PART 3: Skill Coverage');
log('='.repeat(80));
log('');

// Count questions per skill
const skillQuestionCounts = new Map<string, number>();
questions.forEach((q: any) => {
  if (q.skillId && validSkillIds.has(q.skillId)) {
    skillQuestionCounts.set(q.skillId, (skillQuestionCounts.get(q.skillId) || 0) + 1);
  }
});

// Get all valid skill IDs and sort them
const allSkills = Array.from(validSkillIds).sort();
log(`Total skills in skill-map.ts: ${allSkills.length}`);
log('');

// Count skills with 0 questions
const skillsWithZeroQuestions: string[] = [];
allSkills.forEach(skillId => {
  const count = skillQuestionCounts.get(skillId) || 0;
  if (count === 0) {
    skillsWithZeroQuestions.push(skillId);
  }
});

log(`Skills with 0 questions: ${skillsWithZeroQuestions.length}`);
if (skillsWithZeroQuestions.length > 0) {
  log('');
  log('Skills with 0 questions:');
  skillsWithZeroQuestions.forEach(skillId => {
    log(`   - ${skillId}`);
  });
}
log('');

// Show distribution
const counts = Array.from(skillQuestionCounts.values());
const maxQuestions = Math.max(...counts, 0);
const minQuestions = Math.min(...counts, 0);
const avgQuestions = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;

log('Question distribution per skill:');
log(`   Min: ${minQuestions}`);
log(`   Max: ${maxQuestions}`);
log(`   Avg: ${avgQuestions.toFixed(2)}`);
log('');

// Show top skills by question count
const sortedSkills = Array.from(skillQuestionCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

log('Top 10 skills by question count:');
sortedSkills.forEach(([skillId, count]) => {
  log(`   ${skillId}: ${count} questions`);
});
log('');

log('='.repeat(80));
log('PART 4: Show Generated Questions');
log('='.repeat(80));
log('');

// Find questions with ID > SP5403_Q160 or GEN-* pattern
const generatedQuestions = questions.filter((q: any) => {
  const id = q.id;
  // Check for GEN-* pattern
  if (id.startsWith('GEN-')) {
    return true;
  }
  // Check for ID > SP5403_Q160 (assuming format like SP5403_Q161, SP5403_Q162, etc.)
  if (id.match(/^SP5403_Q(\d+)$/)) {
    const match = id.match(/^SP5403_Q(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > 160;
    }
  }
  return false;
});

log(`Total generated questions found: ${generatedQuestions.length}`);
log('');

generatedQuestions.forEach((q: any) => {
  log(`ID: ${q.id}`);
  log(`Skill ID: ${q.skillId || 'MISSING'}`);
  log(`Question Stem: ${q.stem || q.question || 'N/A'}`);
  
  // Handle correct_answer field (array format)
  let correctAnswerDisplay = 'N/A';
  if (q.correct_answer && Array.isArray(q.correct_answer) && q.correct_answer.length > 0) {
    const answerLetters = q.correct_answer.join(', ');
    const answerTexts = q.correct_answer.map((letter: string) => {
      return q.choices && q.choices[letter] ? `${letter}: ${q.choices[letter]}` : letter;
    });
    correctAnswerDisplay = `${answerLetters} (${answerTexts.join('; ')})`;
  } else if (q.correctAnswer) {
    correctAnswerDisplay = q.correctAnswer;
  } else if (q.answer) {
    correctAnswerDisplay = q.answer;
  }
  
  log(`Correct Answer: ${correctAnswerDisplay}`);
  log('-'.repeat(80));
});

log('');
log('Health check complete!');

// Write to file
const reportPath = path.join(__dirname, 'HEALTH_CHECK_REPORT.txt');
fs.writeFileSync(reportPath, output.join('\n'), 'utf-8');
log(`\nFull report saved to: ${reportPath}`);
