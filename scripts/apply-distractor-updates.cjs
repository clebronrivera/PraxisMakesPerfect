/**
 * Apply distractor updates from questions-with-new-distractors.json
 * back to the main questions.json file
 */

const fs = require('fs');
const path = require('path');

const MAIN_QUESTIONS_PATH = path.join(__dirname, '../src/data/questions.json');
const UPDATED_QUESTIONS_PATH = path.join(__dirname, '../quality-reports/questions-with-new-distractors.json');

function applyUpdates() {
  console.log('Applying distractor updates...\n');
  
  // Load both files
  const mainQuestions = JSON.parse(fs.readFileSync(MAIN_QUESTIONS_PATH, 'utf-8'));
  const updatedQuestions = JSON.parse(fs.readFileSync(UPDATED_QUESTIONS_PATH, 'utf-8'));
  
  console.log(`Main file: ${mainQuestions.length} questions`);
  console.log(`Updated file: ${updatedQuestions.length} questions\n`);
  
  // Create a map of updated questions by ID
  const updatedMap = new Map();
  for (const q of updatedQuestions) {
    updatedMap.set(q.id, q);
  }
  
  // Apply updates
  let updateCount = 0;
  const result = mainQuestions.map(q => {
    const updated = updatedMap.get(q.id);
    if (updated) {
      // Check if choices actually changed
      const choicesChanged = JSON.stringify(q.choices) !== JSON.stringify(updated.choices);
      if (choicesChanged) {
        updateCount++;
        return updated;
      }
    }
    return q;
  });
  
  // Backup original
  const backupPath = MAIN_QUESTIONS_PATH + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, JSON.stringify(mainQuestions, null, 2));
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Write updated file
  fs.writeFileSync(MAIN_QUESTIONS_PATH, JSON.stringify(result, null, 2));
  console.log(`✅ Updated ${updateCount} questions in ${MAIN_QUESTIONS_PATH}\n`);
  
  console.log('Done!');
}

applyUpdates();
