// Script to remove duplicate question IDs from questions.json
// Keeps the first occurrence of each ID and removes subsequent duplicates

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Question {
  id: string;
  [key: string]: any;
}

function deduplicateQuestions() {
  const questionsPath = join(__dirname, 'src/data/questions.json');
  const backupPath = join(__dirname, `src/data/questions.json.backup.${Date.now()}`);
  
  console.log('Reading questions.json...');
  const questions: Question[] = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  console.log(`Found ${questions.length} total questions\n`);
  
  // Create backup
  console.log(`Creating backup: ${backupPath}`);
  copyFileSync(questionsPath, backupPath);
  console.log('✓ Backup created\n');
  
  // Track seen IDs and duplicates
  const seenIds = new Map<string, number>();
  const duplicates: Array<{ id: string; indices: number[] }> = [];
  const keptQuestions: Question[] = [];
  const removedIndices: number[] = [];
  
  // First pass: identify duplicates
  questions.forEach((q, index) => {
    if (!seenIds.has(q.id)) {
      seenIds.set(q.id, index);
      keptQuestions.push(q);
    } else {
      const firstIndex = seenIds.get(q.id)!;
      const existing = duplicates.find(d => d.id === q.id);
      if (existing) {
        existing.indices.push(index);
      } else {
        duplicates.push({ id: q.id, indices: [firstIndex, index] });
      }
      removedIndices.push(index);
    }
  });
  
  console.log('='.repeat(80));
  console.log('DUPLICATE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Total questions: ${questions.length}`);
  console.log(`Unique question IDs: ${seenIds.size}`);
  console.log(`Duplicates found: ${duplicates.length}`);
  console.log(`Questions to remove: ${removedIndices.length}`);
  console.log(`Questions to keep: ${keptQuestions.length}`);
  console.log();
  
  if (duplicates.length > 0) {
    console.log('Duplicate IDs:');
    duplicates.forEach(({ id, indices }) => {
      console.log(`  ${id}: appears ${indices.length} times (keeping first at index ${indices[0]}, removing ${indices.length - 1} duplicates)`);
    });
    console.log();
    
    // Show sample of what will be removed
    console.log('Sample of questions to be removed:');
    removedIndices.slice(0, 5).forEach(index => {
      const q = questions[index];
      console.log(`  Index ${index}: ${q.id} - "${q.question?.substring(0, 60)}..."`);
    });
    if (removedIndices.length > 5) {
      console.log(`  ... and ${removedIndices.length - 5} more`);
    }
    console.log();
  }
  
  // Write deduplicated questions
  console.log('Writing deduplicated questions.json...');
  writeFileSync(questionsPath, JSON.stringify(keptQuestions, null, 2) + '\n', 'utf-8');
  console.log('✓ Deduplication complete!\n');
  
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Removed ${removedIndices.length} duplicate questions`);
  console.log(`Kept ${keptQuestions.length} unique questions`);
  console.log(`Backup saved to: ${backupPath}`);
  console.log();
  console.log('Next steps:');
  console.log('1. Review the deduplicated file');
  console.log('2. Run health check: npx tsx health-check.ts');
  console.log('3. If satisfied, delete backup file');
}

deduplicateQuestions();
