// Script to generate questions for uncovered ETS topics
// Generates questions and adds them to questions.json

import { generateQuestions } from './src/brain/question-generator';
import { getSkillById } from './src/brain/skill-map';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Phase 1 skills (27 questions total - added MBH-S03 and NEW-4-GroupCounseling)
const phase1Skills = [
  { skillId: 'NEW-2-FamilyCollaboration', count: 3 }, // Domain 2
  { skillId: 'NEW-2-CommunityAgencies', count: 3 },   // Domain 2
  { skillId: 'NEW-3-AccommodationsModifications', count: 3 }, // Domain 3
  { skillId: 'NEW-3-AcademicProgressFactors', count: 3 }, // Domain 3
  { skillId: 'NEW-3-BioCulturalInfluences', count: 3 }, // Domain 3
  { skillId: 'NEW-4-DevelopmentalInterventions', count: 3 }, // Domain 4
  { skillId: 'NEW-4-MentalHealthImpact', count: 3 }, // Domain 4
  { skillId: 'NEW-4-GroupCounseling', count: 3 }, // Domain 4 - Group Counseling Dynamics
  { skillId: 'MBH-S03', count: 3 }, // Domain 4 - Replacement Behavior Selection
];

// Phase 2 skills (15 questions total)
const phase2Skills = [
  { skillId: 'NEW-5-EducationalPolicies', count: 3 }, // Domain 5
  { skillId: 'NEW-5-EBPImportance', count: 3 }, // Domain 5
  { skillId: 'NEW-6-SchoolClimateMeasurement', count: 3 }, // Domain 6
  { skillId: 'NEW-7-InteragencyCollaboration', count: 3 }, // Domain 7
  { skillId: 'NEW-7-ParentingInterventions', count: 3 }, // Domain 7
];

// Phase 3 skills (18 questions total)
const phase3Skills = [
  { skillId: 'NEW-1-BackgroundInformation', count: 3 }, // Domain 1
  { skillId: 'NEW-1-ProblemSolvingFramework', count: 3 }, // Domain 1
  { skillId: 'NEW-1-LowIncidenceExceptionalities', count: 3 }, // Domain 1
  { skillId: 'NEW-9-ImplementationFidelity', count: 3 }, // Domain 9
  { skillId: 'NEW-9-ProgramEvaluation', count: 3 }, // Domain 9
  { skillId: 'NEW-10-ProfessionalGrowth', count: 3 }, // Domain 10
];

function convertToQuestionsJsonFormat(generatedQ: any) {
  // Convert GeneratedQuestion format to questions.json format
  const skill = getSkillById(generatedQ.metadata.skillId);
  const dokRange = skill?.dokRange || [2, 3];
  // Use middle of DOK range, or 2 if range is [2,3]
  const dok = dokRange[0] === dokRange[1] ? dokRange[0] : Math.round((dokRange[0] + dokRange[1]) / 2);
  
  return {
    id: generatedQ.id,
    question: generatedQ.question,
    choices: generatedQ.choices,
    correct_answer: generatedQ.correct_answer,
    rationale: generatedQ.rationale,
    skillId: generatedQ.metadata.skillId,
    dok: dok,
    frameworkType: null, // Will be tagged later
    frameworkStep: null
  };
}

async function generateAndSaveQuestions() {
  const questionsPath = join(__dirname, 'src/data/questions.json');
  const skillMapPath = join(__dirname, 'src/data/question-skill-map.json');
  
  const existingQuestions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  const skillMapData = JSON.parse(readFileSync(skillMapPath, 'utf-8'));
  
  // Create set of existing question IDs to prevent duplicates
  const existingIds = new Set(existingQuestions.map((q: any) => q.id));
  const existingSkillMapIds = new Set(skillMapData.mappedQuestions.map((m: any) => m.questionId));
  
  console.log(`Found ${existingIds.size} existing questions\n`);
  
  const allNewQuestions: any[] = [];
  const newMappings: any[] = [];
  const skippedDuplicates: string[] = [];
  const skillCounts: Record<string, number> = {};
  let seed = Date.now();
  
  // Helper function to process questions for a skill
  function processSkillQuestions(skillId: string, count: number, seed: number) {
    const questions = generateQuestions(skillId, count, { seed });
    const converted = questions.map(convertToQuestionsJsonFormat);
    
    // Filter out duplicates
    const newQuestions = converted.filter(q => {
      if (existingIds.has(q.id)) {
        skippedDuplicates.push(q.id);
        return false;
      }
      existingIds.add(q.id); // Track newly added IDs
      return true;
    });
    
    // Track counts and create mappings
    skillCounts[skillId] = (skillCounts[skillId] || 0) + newQuestions.length;
    for (const q of newQuestions) {
      if (!existingSkillMapIds.has(q.id)) {
        const skill = getSkillById(skillId);
        newMappings.push({
          questionId: q.id,
          skillId: skillId,
          confidence: "high",
          reasoning: `Auto-generated question from template for skill: ${skill?.name || skillId}. Question tests ${skill?.description || 'skill knowledge'}.`
        });
        existingSkillMapIds.add(q.id);
      }
    }
    
    return newQuestions;
  }
  
  console.log('Generating Phase 1 questions (27 total)...\n');
  for (const { skillId, count } of phase1Skills) {
    console.log(`Generating ${count} questions for ${skillId}...`);
    const newQuestions = processSkillQuestions(skillId, count, seed);
    allNewQuestions.push(...newQuestions);
    seed += count;
    console.log(`  ✓ Generated ${newQuestions.length} new questions\n`);
  }
  
  console.log('Generating Phase 2 questions (15 total)...\n');
  for (const { skillId, count } of phase2Skills) {
    console.log(`Generating ${count} questions for ${skillId}...`);
    const newQuestions = processSkillQuestions(skillId, count, seed);
    allNewQuestions.push(...newQuestions);
    seed += count;
    console.log(`  ✓ Generated ${newQuestions.length} new questions\n`);
  }
  
  console.log('Generating Phase 3 questions (18 total)...\n');
  for (const { skillId, count } of phase3Skills) {
    console.log(`Generating ${count} questions for ${skillId}...`);
    const newQuestions = processSkillQuestions(skillId, count, seed);
    allNewQuestions.push(...newQuestions);
    seed += count;
    console.log(`  ✓ Generated ${newQuestions.length} new questions\n`);
  }
  
  // Combine existing and new questions
  const allQuestions = [...existingQuestions, ...allNewQuestions];
  
  // Write questions back to file
  writeFileSync(questionsPath, JSON.stringify(allQuestions, null, 2) + '\n', 'utf-8');
  
  // Update question-skill-map.json
  if (newMappings.length > 0) {
    skillMapData.mappedQuestions.push(...newMappings);
    skillMapData.totalQuestions = skillMapData.mappedQuestions.length;
    writeFileSync(skillMapPath, JSON.stringify(skillMapData, null, 2) + '\n', 'utf-8');
  }
  
  console.log(`\n✅ Successfully generated and added ${allNewQuestions.length} questions!`);
  console.log(`   Total questions: ${allQuestions.length} (was ${existingQuestions.length})`);
  console.log(`   Added ${newMappings.length} mappings to question-skill-map.json`);
  if (skippedDuplicates.length > 0) {
    console.log(`   ⚠ Skipped ${skippedDuplicates.length} duplicate IDs`);
  }
  
  console.log(`\n📊 Questions Generated Per Skill:`);
  for (const [skillId, count] of Object.entries(skillCounts).sort()) {
    const skill = getSkillById(skillId);
    console.log(`   ${skillId} (${skill?.name || 'Unknown'}): ${count} questions`);
  }
}

generateAndSaveQuestions().catch(console.error);
