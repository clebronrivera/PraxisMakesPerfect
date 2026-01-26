/**
 * Integration Script for Blue Questions
 * 
 * Adds high-quality "blue questions" to the main questions.json file.
 * These questions are more realistic and better formatted than generated ones.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Question {
  id: string;
  question: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string[];
  rationale: string;
  skillId: string;
  domain?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  questionsJsonPath: './src/data/questions.json',
  blueQuestionsPath: './quality-reports/blue-questions.json', // We'll create this
  outputPath: './src/data/questions.json',
};

// ============================================================================
// DOMAIN MAPPING
// ============================================================================

/**
 * Get domain number from skillId prefix
 */
function getDomainFromSkillId(skillId: string): number {
  const domainMap: Record<string, number> = {
    'DBDM': 1,
    'CC': 2,
    'ACAD': 3,
    'MBH': 4,
    'SWP': 5,
    'PC': 6,
    'FSC': 7,
    'DIV': 8,
    'RES': 9,
    'LEG': 10,
    'NEW-1': 1,  // Data-Based Decision Making
    'NEW-3': 3,  // Academic Interventions
    'NEW-4': 4,  // Mental & Behavioral Health
    'NEW-5': 5,  // School-Wide Practices
    'NEW-6': 6,  // Prevention & Crisis
    'NEW-7': 7,  // Family-School Collaboration
    'NEW-8': 8,  // Diversity in Development
    'NEW-9': 9,  // Research & Program Evaluation
    'NEW-10': 10, // Legal, Ethical & Professional
  };

  // Extract prefix (handle both "DBDM-S02" and "NEW-1-PerformanceAssessment" formats)
  const parts = skillId.split('-');
  if (parts[0] === 'NEW' && parts.length > 1) {
    const newPrefix = `${parts[0]}-${parts[1]}`;
    if (domainMap[newPrefix]) {
      return domainMap[newPrefix];
    }
  }
  
  const prefix = parts[0];
  return domainMap[prefix] || 1; // Default to domain 1 if unknown
}

// ============================================================================
// QUESTION PROCESSING
// ============================================================================

/**
 * Process blue questions: add domain field and validate
 */
function processBlueQuestions(blueQuestions: Question[]): Question[] {
  return blueQuestions.map(q => {
    // Add domain if not present
    if (!q.domain) {
      q.domain = getDomainFromSkillId(q.skillId);
    }
    
    // Validate structure
    if (!q.id || !q.question || !q.choices || !q.correct_answer || !q.rationale || !q.skillId) {
      throw new Error(`Invalid question structure for ${q.id || 'unknown'}`);
    }
    
    // Validate choices
    const requiredChoices = ['A', 'B', 'C', 'D'];
    for (const letter of requiredChoices) {
      if (!q.choices[letter as keyof typeof q.choices]) {
        throw new Error(`Missing choice ${letter} for question ${q.id}`);
      }
    }
    
    return q;
  });
}

/**
 * Check for ID conflicts
 */
function findConflicts(
  existingQuestions: Question[],
  newQuestions: Question[]
): { conflicts: string[]; warnings: string[] } {
  const existingIds = new Set(existingQuestions.map(q => q.id));
  const conflicts: string[] = [];
  const warnings: string[] = [];
  
  for (const newQ of newQuestions) {
    if (existingIds.has(newQ.id)) {
      conflicts.push(newQ.id);
    }
    
    // Check for similar IDs (same skillId with different suffixes)
    const sameSkillQuestions = existingQuestions.filter(
      q => q.skillId === newQ.skillId && q.id !== newQ.id
    );
    if (sameSkillQuestions.length > 0) {
      warnings.push(
        `Question ${newQ.id} (${newQ.skillId}) - ${sameSkillQuestions.length} existing questions with same skillId`
      );
    }
  }
  
  return { conflicts, warnings };
}

// ============================================================================
// MAIN INTEGRATION
// ============================================================================

/**
 * Integrate blue questions into main questions.json
 */
function integrateQuestions(
  existingQuestions: Question[],
  blueQuestions: Question[]
): Question[] {
  // Process blue questions
  const processedBlueQuestions = processBlueQuestions(blueQuestions);
  
  // Check for conflicts
  const { conflicts, warnings } = findConflicts(existingQuestions, processedBlueQuestions);
  
  if (conflicts.length > 0) {
    console.error(`\n❌ Found ${conflicts.length} ID conflicts:`);
    conflicts.forEach(id => console.error(`   - ${id}`));
    throw new Error('Cannot integrate questions with conflicting IDs. Please resolve conflicts first.');
  }
  
  if (warnings.length > 0) {
    console.warn(`\n⚠️  Found ${warnings.length} warnings:`);
    warnings.slice(0, 10).forEach(w => console.warn(`   - ${w}`));
    if (warnings.length > 10) {
      console.warn(`   ... and ${warnings.length - 10} more warnings`);
    }
  }
  
  // Merge questions
  const merged = [...existingQuestions, ...processedBlueQuestions];
  
  // Sort by domain, then by skillId, then by id for consistency
  merged.sort((a, b) => {
    const domainA = a.domain || getDomainFromSkillId(a.skillId);
    const domainB = b.domain || getDomainFromSkillId(b.skillId);
    
    if (domainA !== domainB) return domainA - domainB;
    if (a.skillId !== b.skillId) return a.skillId.localeCompare(b.skillId);
    return a.id.localeCompare(b.id);
  });
  
  return merged;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('Blue Questions Integration');
  console.log('=========================\n');

  // Read existing questions
  const questionsPath = path.resolve(CONFIG.questionsJsonPath);
  if (!fs.existsSync(questionsPath)) {
    console.error(`❌ Questions file not found: ${questionsPath}`);
    process.exit(1);
  }

  const existingQuestions: Question[] = JSON.parse(
    fs.readFileSync(questionsPath, 'utf-8')
  );
  console.log(`✓ Loaded ${existingQuestions.length} existing questions`);

  // Read blue questions (from user-provided data)
  // For now, we'll accept them as a parameter or read from a file
  // The user provided them in the query, so we'll create a temporary file or accept as argument
  
  // Blue questions are provided in the user query - we'll need to save them first
  // or accept them as command-line argument
  
  console.log('\nTo integrate blue questions:');
  console.log('1. Save the blue questions JSON array to a file');
  console.log('2. Run: ts-node scripts/integrate-blue-questions.ts <path-to-blue-questions.json>');
  console.log('\nOr modify this script to include the questions directly.');
  
  // Check for command-line argument
  const blueQuestionsPath = process.argv[2] || CONFIG.blueQuestionsPath;
  
  if (!fs.existsSync(blueQuestionsPath)) {
    console.error(`\n❌ Blue questions file not found: ${blueQuestionsPath}`);
    console.log('\nPlease provide the path to blue questions JSON file as an argument.');
    console.log('Example: ts-node scripts/integrate-blue-questions.ts ./blue-questions.json');
    process.exit(1);
  }

  const blueQuestions: Question[] = JSON.parse(
    fs.readFileSync(blueQuestionsPath, 'utf-8')
  );
  console.log(`✓ Loaded ${blueQuestions.length} blue questions`);

  // Integrate questions
  console.log('\nIntegrating questions...');
  const mergedQuestions = integrateQuestions(existingQuestions, blueQuestions);

  // Write merged questions
  const outputPath = path.resolve(CONFIG.outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(mergedQuestions, null, 2));
  console.log(`\n✅ Successfully integrated ${blueQuestions.length} blue questions`);
  console.log(`   Total questions: ${mergedQuestions.length}`);
  console.log(`   Saved to: ${outputPath}`);

  // Summary by domain
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY BY DOMAIN');
  console.log('='.repeat(60));
  
  const domainCounts: Record<number, { total: number; new: number }> = {};
  
  for (const q of mergedQuestions) {
    const domain = q.domain || getDomainFromSkillId(q.skillId);
    if (!domainCounts[domain]) {
      domainCounts[domain] = { total: 0, new: 0 };
    }
    domainCounts[domain].total++;
    
    // Check if it's a blue question (by checking if ID matches pattern)
    if (blueQuestions.some(bq => bq.id === q.id)) {
      domainCounts[domain].new++;
    }
  }
  
  const domainNames: Record<number, string> = {
    1: 'Data-Based Decision Making',
    2: 'Consultation & Collaboration',
    3: 'Academic Interventions',
    4: 'Mental & Behavioral Health',
    5: 'School-Wide Practices',
    6: 'Prevention & Crisis',
    7: 'Family-School Collaboration',
    8: 'Diversity in Development',
    9: 'Research & Program Evaluation',
    10: 'Legal, Ethical & Professional',
  };
  
  for (let domain = 1; domain <= 10; domain++) {
    const counts = domainCounts[domain] || { total: 0, new: 0 };
    if (counts.total > 0) {
      console.log(
        `Domain ${domain} (${domainNames[domain]}): ${counts.total} total (+${counts.new} new)`
      );
    }
  }

  console.log('\n✅ Integration complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
