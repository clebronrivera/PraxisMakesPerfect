import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId: string;
  dok?: number | null;
  frameworkType?: string | null;
  frameworkStep?: string | null;
}

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: number;
  suggestedFramework: string;
  suggestedFrameworkStep: string | null;
  confidence: string;
  reasoning: string;
  needsReview: boolean;
}

const QUESTIONS_FILE = path.join(__dirname, 'src/data/questions.json');
const BACKUP_FILE = path.join(__dirname, 'src/data/questions.backup.json');
const TAGGING_SUGGESTIONS_FILE = path.join(__dirname, 'src/data/tagging-suggestions.json');

function main() {
  console.log('Phase D: Applying Approved Tags\n');
  
  // Step 1: Create backup
  console.log('1. Creating backup...');
  if (fs.existsSync(QUESTIONS_FILE)) {
    fs.copyFileSync(QUESTIONS_FILE, BACKUP_FILE);
    console.log(`   ✓ Backup created: ${BACKUP_FILE}\n`);
  } else {
    console.error(`   ✗ Error: ${QUESTIONS_FILE} not found`);
    process.exit(1);
  }
  
  // Step 2: Read files
  console.log('2. Reading files...');
  const questions: Question[] = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  const taggingSuggestions: TaggingSuggestion[] = JSON.parse(
    fs.readFileSync(TAGGING_SUGGESTIONS_FILE, 'utf-8')
  );
  console.log(`   ✓ Loaded ${questions.length} questions`);
  console.log(`   ✓ Loaded ${taggingSuggestions.length} tagging suggestions\n`);
  
  // Step 3: Create mapping (skip items with needsReview: true)
  console.log('3. Creating mapping from tagging suggestions...');
  const suggestionMap = new Map<string, TaggingSuggestion>();
  let skippedCount = 0;
  
  for (const suggestion of taggingSuggestions) {
    if (suggestion.needsReview) {
      skippedCount++;
      continue;
    }
    suggestionMap.set(suggestion.questionId, suggestion);
  }
  
  console.log(`   ✓ Created mapping for ${suggestionMap.size} approved suggestions`);
  console.log(`   ⚠ Skipped ${skippedCount} items with needsReview: true\n`);
  
  // Step 4: Apply tags
  console.log('4. Applying tags to questions...');
  let updatedCount = 0;
  let notFoundCount = 0;
  const updatedQuestions: Question[] = [];
  
  for (const question of questions) {
    const suggestion = suggestionMap.get(question.id);
    
    if (suggestion) {
      // Apply tags
      question.dok = suggestion.suggestedDok;
      
      // Convert "none" to null for frameworkType
      question.frameworkType = suggestion.suggestedFramework === 'none' 
        ? null 
        : suggestion.suggestedFramework;
      
      question.frameworkStep = suggestion.suggestedFrameworkStep;
      
      updatedCount++;
      
      // Collect sample questions (first 5)
      if (updatedQuestions.length < 5) {
        updatedQuestions.push({ ...question });
      }
    } else {
      notFoundCount++;
    }
  }
  
  console.log(`   ✓ Updated ${updatedCount} questions`);
  if (notFoundCount > 0) {
    console.log(`   ⚠ ${notFoundCount} questions had no matching tagging suggestion\n`);
  } else {
    console.log();
  }
  
  // Step 5: Write updated questions
  console.log('5. Writing updated questions.json...');
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`   ✓ Updated ${QUESTIONS_FILE}\n`);
  
  // Step 6: Output summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total questions in file: ${questions.length}`);
  console.log(`Questions updated: ${updatedCount}`);
  console.log(`Questions skipped (needsReview: true): ${skippedCount}`);
  console.log(`Questions without matching suggestions: ${notFoundCount}`);
  console.log();
  
  console.log('Sample of 5 updated questions:');
  console.log('-'.repeat(60));
  updatedQuestions.forEach((q, idx) => {
    console.log(`\n${idx + 1}. ${q.id}`);
    console.log(`   DOK: ${q.dok}`);
    console.log(`   Framework Type: ${q.frameworkType ?? 'null'}`);
    console.log(`   Framework Step: ${q.frameworkStep ?? 'null'}`);
    console.log(`   Question: ${q.question.substring(0, 80)}...`);
  });
  console.log('\n' + '='.repeat(60));
  console.log('Phase D Complete!');
}

main();
