import { readFileSync, writeFileSync } from 'fs';
import questionSkillMap from './src/data/question-skill-map.json';

/**
 * Syncs question IDs from question-skill-map.json into skill-map.ts
 * 
 * This script:
 * 1. Reads all mappings from question-skill-map.json
 * 2. Groups questions by skillId
 * 3. Updates the questionIds arrays in skill-map.ts
 * 4. Regenerates the visual tree
 */

interface MappingEntry {
  questionId: string;
  skillId: string;
  confidence: string;
  reasoning: string;
}

// Step 1: Group questions by skillId
const questionsBySkill = new Map<string, string[]>();

for (const entry of questionSkillMap.mappedQuestions) {
  const { questionId, skillId } = entry as MappingEntry;
  if (!questionsBySkill.has(skillId)) {
    questionsBySkill.set(skillId, []);
  }
  questionsBySkill.get(skillId)!.push(questionId);
}

// Sort question IDs for consistency
for (const [skillId, questionIds] of questionsBySkill.entries()) {
  questionIds.sort();
}

console.log(`📊 Found ${questionsBySkill.size} skills with mapped questions`);
console.log(`📝 Total mapping entries: ${questionSkillMap.mappedQuestions.length}`);
const uniqueQuestions = new Set(questionSkillMap.mappedQuestions.map((e: MappingEntry) => e.questionId));
console.log(`📋 Total unique questions: ${uniqueQuestions.size}`);

// Step 2: Read skill-map.ts line by line
const skillMapPath = './src/brain/skill-map.ts';
const lines = readFileSync(skillMapPath, 'utf-8').split('\n');

// Step 3: Process lines and update questionIds arrays
let currentSkillId: string | null = null;
let updateCount = 0;
let totalQuestionsAdded = 0;
const updatedLines: string[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track current skillId
  const skillIdMatch = line.match(/skillId:\s*"([^"]+)"/);
  if (skillIdMatch) {
    currentSkillId = skillIdMatch[1];
  }
  
  // Check if this line contains questionIds
  const questionIdsMatch = line.match(/questionIds:\s*\[([^\]]*)\]/);
  if (questionIdsMatch && currentSkillId) {
    const questionIds = questionsBySkill.get(currentSkillId) || [];
    
    if (questionIds.length > 0) {
      updateCount++;
      totalQuestionsAdded += questionIds.length;
      
      // Format as JSON array
      const formattedIds = questionIds.map(id => `"${id}"`).join(', ');
      const indent = line.match(/^(\s*)/)?.[1] || '';
      updatedLines.push(`${indent}questionIds: [${formattedIds}]`);
      continue;
    } else {
      // Keep empty array but ensure it's formatted correctly
      const indent = line.match(/^(\s*)/)?.[1] || '';
      updatedLines.push(`${indent}questionIds: []`);
      continue;
    }
  }
  
  // Keep original line
  updatedLines.push(line);
}

// Step 4: Write updated file
const updatedContent = updatedLines.join('\n');
writeFileSync(skillMapPath, updatedContent, 'utf-8');

console.log(`\n✅ Updated ${updateCount} skills with question IDs`);
console.log(`📊 Total questions added: ${totalQuestionsAdded}`);

// Step 5: Verify by checking a few skills
console.log('\n🔍 Sample verification:');
const sampleSkills = Array.from(questionsBySkill.entries()).slice(0, 5);
for (const [skillId, questionIds] of sampleSkills) {
  console.log(`  ${skillId}: ${questionIds.length} questions`);
}

console.log('\n✨ Sync complete! Run "npx tsx generate-visual-tree.ts" to regenerate the visual tree.');
