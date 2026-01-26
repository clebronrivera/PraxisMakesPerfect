// Script to output questions that were generated from content topics
// Filters questions with IDs starting with "GEN-" or skillIds starting with "NEW-" or "MBH-"

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSkillById } from './src/brain/skill-map';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
}

function isGeneratedFromContentTopic(q: Question): boolean {
  // Check if ID starts with "GEN-" (generated questions)
  if (q.id.startsWith('GEN-')) {
    return true;
  }
  
  // Check if skillId starts with "NEW-" or "MBH-" (new skills from content topics)
  if (q.skillId && (q.skillId.startsWith('NEW-') || q.skillId.startsWith('MBH-'))) {
    return true;
  }
  
  return false;
}

function formatQuestion(q: Question, index: number): string {
  const skill = q.skillId ? getSkillById(q.skillId) : null;
  const skillName = skill ? skill.name : 'Unknown Skill';
  
  let output = `\n${'='.repeat(80)}\n`;
  output += `Question ${index + 1}\n`;
  output += `${'='.repeat(80)}\n\n`;
  output += `ID: ${q.id}\n`;
  output += `Skill ID: ${q.skillId || 'N/A'}\n`;
  output += `Skill Name: ${skillName}\n`;
  output += `\nQuestion:\n${q.question}\n\n`;
  output += `Choices:\n`;
  
  Object.entries(q.choices).forEach(([letter, text]) => {
    if (text) {
      const isCorrect = q.correct_answer.includes(letter);
      const marker = isCorrect ? ' ✓ CORRECT' : '';
      output += `  ${letter}. ${text}${marker}\n`;
    }
  });
  
  output += `\nRationale:\n${q.rationale}\n`;
  output += `\n${'-'.repeat(80)}\n`;
  
  return output;
}

function groupBySkill(questions: Question[]): Map<string, Question[]> {
  const grouped = new Map<string, Question[]>();
  
  questions.forEach(q => {
    const skillId = q.skillId || 'Unknown';
    if (!grouped.has(skillId)) {
      grouped.set(skillId, []);
    }
    grouped.get(skillId)!.push(q);
  });
  
  return grouped;
}

async function outputContentTopicQuestions() {
  const questionsPath = join(__dirname, 'src/data/questions.json');
  const allQuestions: Question[] = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  
  // Filter questions generated from content topics
  const contentTopicQuestions = allQuestions.filter(isGeneratedFromContentTopic);
  
  console.log(`Found ${contentTopicQuestions.length} questions generated from content topics\n`);
  
  // Group by skill
  const groupedBySkill = groupBySkill(contentTopicQuestions);
  
  let output = `# Questions Generated from Content Topics\n\n`;
  output += `Total Questions: ${contentTopicQuestions.length}\n`;
  output += `Generated: ${new Date().toLocaleString()}\n\n`;
  output += `${'='.repeat(80)}\n\n`;
  
  // Output grouped by skill
  const sortedSkills = Array.from(groupedBySkill.entries()).sort((a, b) => {
    const skillA = getSkillById(a[0]);
    const skillB = getSkillById(b[0]);
    if (!skillA || !skillB) return 0;
    
    // Sort by domain first, then by skill name
    if (skillA.skillId.split('-')[0] !== skillB.skillId.split('-')[0]) {
      return skillA.skillId.localeCompare(skillB.skillId);
    }
    return skillA.name.localeCompare(skillB.name);
  });
  
  let questionIndex = 0;
  for (const [skillId, questions] of sortedSkills) {
    const skill = getSkillById(skillId);
    const skillName = skill ? skill.name : 'Unknown Skill';
    const domainId = skillId.startsWith('NEW-') ? skillId.split('-')[1] : 
                     skillId.startsWith('MBH-') ? '4' : 'Unknown';
    
    output += `\n${'#'.repeat(2)} Skill: ${skillName}\n`;
    output += `Skill ID: ${skillId}\n`;
    output += `Domain: ${domainId}\n`;
    output += `Questions: ${questions.length}\n`;
    output += `${'='.repeat(80)}\n`;
    
    questions.forEach(q => {
      output += formatQuestion(q, questionIndex);
      questionIndex++;
    });
  }
  
  // Write to file
  const outputPath = join(__dirname, 'content-topic-questions-output.txt');
  writeFileSync(outputPath, output, 'utf-8');
  
  console.log(`✅ Output written to: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total questions: ${contentTopicQuestions.length}`);
  console.log(`  Skills covered: ${groupedBySkill.size}`);
  
  // Print summary by skill
  console.log(`\nQuestions by Skill:`);
  sortedSkills.forEach(([skillId, questions]) => {
    const skill = getSkillById(skillId);
    const skillName = skill ? skill.name : 'Unknown Skill';
    console.log(`  ${skillName} (${skillId}): ${questions.length} questions`);
  });
}

outputContentTopicQuestions().catch(console.error);
