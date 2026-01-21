// Test script for question generation system
// Generates 3 questions for each skill and displays full details

import { generateQuestions } from './src/brain/question-generator';
import { validateQuestion } from './src/brain/question-validator';
import { getSkillById } from './src/brain/skill-map';

const skillsToTest = [
  'DBDM-S01', // Reliability Type Selection
  'MBH-S02',  // Function of Behavior Identification
  'LEG-S01'   // Court Case Recognition
];

function formatQuestionOutput(q: any, index: number, skillId: string) {
  const skill = getSkillById(skillId);
  const validation = validateQuestion(q);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Question ${index + 1} for ${skillId} (${skill?.name || 'Unknown'})`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📝 Question Stem:`);
  console.log(`   ${q.question}`);
  
  console.log(`\n📋 Answer Choices:`);
  Object.entries(q.choices).forEach(([letter, text]) => {
    const marker = q.correct_answer.includes(letter) ? '✓' : ' ';
    console.log(`   ${marker} ${letter}. ${text}`);
  });
  
  console.log(`\n✅ Correct Answer: ${q.correct_answer.join(', ')}`);
  
  console.log(`\n💡 Rationale:`);
  console.log(`   ${q.rationale}`);
  
  console.log(`\n🔍 Validation Result:`);
  console.log(`   Valid: ${validation.valid ? '✓ YES' : '✗ NO'}`);
  console.log(`   Confidence: ${validation.confidence.toUpperCase()}`);
  if (validation.issues.length > 0) {
    console.log(`   Issues:`);
    validation.issues.forEach(issue => console.log(`     - ${issue}`));
  }
  if (validation.suggestions.length > 0) {
    console.log(`   Suggestions:`);
    validation.suggestions.forEach(suggestion => console.log(`     - ${suggestion}`));
  }
  
  console.log(`\n📊 Metadata:`);
  console.log(`   Template ID: ${q.metadata.templateId}`);
  console.log(`   Slot Values: ${JSON.stringify(q.metadata.slotValues, null, 2).split('\n').join('\n   ')}`);
  console.log(`   Question ID: ${q.id}`);
}

async function runTest() {
  console.log('\n🧪 QUESTION GENERATION SYSTEM TEST');
  console.log('='.repeat(80));
  console.log(`Testing ${skillsToTest.length} skills with 3 questions each\n`);
  
  for (const skillId of skillsToTest) {
    const skill = getSkillById(skillId);
    if (!skill) {
      console.error(`\n❌ Skill not found: ${skillId}`);
      continue;
    }
    
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`# Testing Skill: ${skillId} - ${skill.name}`);
    console.log(`# ${skill.description}`);
    console.log(`${'#'.repeat(80)}\n`);
    
    try {
      const questions = generateQuestions(skillId, 3, { seed: Date.now() });
      
      if (questions.length === 0) {
        console.log(`⚠️  No questions generated for ${skillId}`);
        continue;
      }
      
      questions.forEach((q, index) => {
        formatQuestionOutput(q, index, skillId);
      });
      
      // Summary for this skill
      const validations = questions.map(q => validateQuestion(q));
      const validCount = validations.filter(v => v.valid).length;
      const highConfidenceCount = validations.filter(v => v.confidence === 'high').length;
      
      console.log(`\n📈 Summary for ${skillId}:`);
      console.log(`   Generated: ${questions.length}/3 questions`);
      console.log(`   Valid: ${validCount}/${questions.length}`);
      console.log(`   High Confidence: ${highConfidenceCount}/${questions.length}`);
      
    } catch (error) {
      console.error(`\n❌ Error generating questions for ${skillId}:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Test Complete');
  console.log(`${'='.repeat(80)}\n`);
}

// Run the test
runTest().catch(console.error);
