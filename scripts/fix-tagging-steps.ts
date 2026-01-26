/**
 * Fix Tagging Step Names
 * 
 * 1. Change intervention-design → intervention-selection where framework is problem-solving
 * 2. Change communication → consultation-planning for SP5403_Q071
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TaggingSuggestion {
  questionId: string;
  suggestedDok: 1 | 2 | 3;
  suggestedFramework: string;
  suggestedFrameworkStep: string | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  needsReview: boolean;
}

function main() {
  console.log('Fixing Tagging Step Names...\n');

  const suggestionsPath = path.join(__dirname, '../src/data/tagging-suggestions.json');
  const suggestions: TaggingSuggestion[] = JSON.parse(
    fs.readFileSync(suggestionsPath, 'utf-8')
  );

  let fixedCount = 0;

  for (const suggestion of suggestions) {
    // Fix 1: Change intervention-design → intervention-selection for problem-solving
    if (suggestion.suggestedFramework === 'problem-solving' && 
        suggestion.suggestedFrameworkStep === 'intervention-design') {
      suggestion.suggestedFrameworkStep = 'intervention-selection';
      fixedCount++;
      console.log(`  Fixed ${suggestion.questionId}: intervention-design → intervention-selection`);
    }

    // Fix 2: Change communication → consultation-planning for SP5403_Q071
    if (suggestion.questionId === 'SP5403_Q071' && 
        suggestion.suggestedFrameworkStep === 'communication') {
      suggestion.suggestedFrameworkStep = 'consultation-planning';
      fixedCount++;
      console.log(`  Fixed ${suggestion.questionId}: communication → consultation-planning`);
    }
  }

  // Save updated suggestions
  fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2), 'utf-8');

  console.log(`\n✓ Fixed ${fixedCount} step name issues`);
  console.log(`✓ Updated tagging-suggestions.json`);
}

main();
