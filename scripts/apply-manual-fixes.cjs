/**
 * scripts/apply-manual-fixes.cjs
 * Applies surgical manual fixes to specific questions identified in the 
 * Jan 2026 Audit (Phase 2).
 * 
 * Fixes include:
 * - Expanding short distractors to match correct answer length
 * - Correcting Skill ID mismatches (Legal -> Behavior tags)
 * - Fixing the specific broken answer key for SP5403_Q007
 * - Replacing irrelevant domain terms in distractors
 * 
 * Usage:
 *   node scripts/apply-manual-fixes.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const QUESTIONS_PATH = path.join(__dirname, '../src/data/questions.json');
const DRY_RUN = process.argv.includes('--dry-run');

// Define the specific fixes
const FIXES = {
  // --- Text Expansions & Clarifications ---
  'SP5403_Q011': {
    choices: {
      C: "Larry P. v. Riles (1979) regarding IQ testing"
    },
    note: "Expanding legal case reference (irrelevant-domain fix)"
  },
  'SP5403_Q012': {
    choices: {
      D: "Collaborate with teachers to establish data collection and progress monitoring procedures."
    },
    note: "Shortening the correct answer to remove fluff"
  },
  'SP5403_Q013': {
    choices: {
      B: "Monitoring the student's ongoing academic performance data"
    },
    note: "Expanding distractor text"
  },
  'SP5403_Q025': {
    choices: {
      A: "The student's true intellectual ability score is exactly 85 with zero error"
    },
    note: "Clarifying distractor text"
  },
  'SP5403_Q038': {
    choices: {
      B: "A large sample size randomly assigned to treatment groups",
      D: "Double-blind procedures to control for researcher bias"
    },
    note: "Expanding distractor options"
  },
  'SP5403_Q046': {
    choices: {
      C: "Refuse to complete the evaluation until the parent agrees to full disclosure"
    },
    note: "Expanding distractor text"
  },
  'SP5403_Q048': {
    choices: {
      A: "The arithmetic mean of the scores",
      B: "The standard deviation of the distribution"
    },
    note: "Clarifying statistical terms"
  },
  'SP5403_Q055': {
    choices: {
      A: "Phonemic awareness and advanced decoding skills"
    },
    note: "Expanding short distractor (length-mismatch fix)"
  },
  'SP5403_Q064': {
    choices: {
      D: "A universal reading screener for academic progress monitoring"
    },
    note: "Expanding distractor text"
  },
  'SP5403_Q065': {
    choices: {
      A: "The student definitely meets the criteria for a specific learning disability in reading"
    },
    note: "Expanding distractor text"
  },
  'SP5403_Q076': {
    choices: {
      C: "Intelligence is a fixed trait, whereas achievement is fluid and changes daily"
    },
    note: "Expanding distractor text"
  },
  'SP5403_Q079': {
    choices: {
      A: "Significant limitations in intellectual functioning without concurrent adaptive deficits"
    },
    note: "Expanding distractor (length-mismatch fix)"
  },
  'SP5403_Q091': {
    choices: {
      B: "The Average range",
      D: "Below Average"
    },
    note: "Clarifying distractor options"
  },
  'SP5403_Q102': {
    choices: {
      D: "To generate new research hypotheses for future experimental studies"
    },
    note: "Expanding distractor text"
  },

  // --- Skill ID & Tag Fixes ---
  'SP5403_Q077': {
    skillId: 'MBH-S02', // Was LEG-S01 (Legal), changed to Behavior
    choices: {
      A: "Providing the student with positive attention when they are on-task"
    },
    note: "Fixing skill ID (Legal -> Behavior) and expanding distractor"
  },
  'SP5403_Q097': {
    skillId: 'MBH-S02', // Was NEW-10-EducationLaw, changed to Behavior
    choices: {
      A: "Ignoring all of the student's behavior regardless of context"
    },
    note: "Fixing skill ID (Legal -> Behavior) and expanding distractor"
  },

  // --- Special Case: SP5403_Q007 (The "Missing E" Problem) ---
  'SP5403_Q007': {
    // Current Answer Key is A;B;E, but Choice E was missing from data.
    // Adding Choice E based on rationale text.
    choices: {
      D: "Focus strictly on individual counseling rather than systemic factors",
      E: "Be mindful of one's own biases and cultural assumptions"
    },
    note: "Adding missing choice E referenced in answer key"
  }
};

/**
 * Check if a fix is already applied to avoid redundant changes
 */
function isFixAlreadyApplied(question, fix) {
  // Check skillId
  if (fix.skillId && question.skillId === fix.skillId) {
    return true; // Skill ID already correct
  }

  // Check choices
  if (fix.choices) {
    for (const [letter, expectedText] of Object.entries(fix.choices)) {
      if (question.choices[letter] === expectedText) {
        return true; // This choice already matches
      }
    }
  }

  return false;
}

/**
 * Get a summary of what changed
 */
function getChangeSummary(question, fix) {
  const changes = [];
  
  if (fix.skillId && question.skillId !== fix.skillId) {
    changes.push(`skillId: ${question.skillId} → ${fix.skillId}`);
  }

  if (fix.choices) {
    for (const [letter, newText] of Object.entries(fix.choices)) {
      const oldText = question.choices[letter];
      if (oldText !== newText) {
        const oldPreview = oldText ? oldText.substring(0, 50) + '...' : '(missing)';
        const newPreview = newText.substring(0, 50) + '...';
        changes.push(`choice ${letter}: "${oldPreview}" → "${newPreview}"`);
      }
    }
  }

  return changes;
}

function applyFixes() {
  console.log('📦 Loading questions...');
  
  if (!fs.existsSync(QUESTIONS_PATH)) {
    console.error(`❌ File not found: ${QUESTIONS_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
  let questions = JSON.parse(rawData);
  let modifiedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  console.log(`🔍 Scanning ${questions.length} questions for fixes...`);
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }

  const questionMap = new Map(questions.map(q => [q.id, q]));

  questions = questions.map(q => {
    const fix = FIXES[q.id];
    
    if (!fix) return q; // No fix needed for this question

    // Check if question exists
    if (!questionMap.has(q.id)) {
      console.warn(`   ⚠️  Question ${q.id} not found in data`);
      notFoundCount++;
      return q;
    }

    // Check if fix is already applied
    if (isFixAlreadyApplied(q, fix)) {
      console.log(`   ⏭️  Skipping ${q.id} - fix already applied`);
      skippedCount++;
      return q;
    }

    console.log(`   ✨ Fixing ${q.id}...`);
    if (fix.note) {
      console.log(`      Note: ${fix.note}`);
    }
    
    const changes = getChangeSummary(q, fix);
    changes.forEach(change => {
      console.log(`      • ${change}`);
    });

    modifiedCount++;

    // Apply Skill ID change
    if (fix.skillId && q.skillId !== fix.skillId) {
      q.skillId = fix.skillId;
    }

    // Apply Choice updates
    if (fix.choices) {
      q.choices = { ...q.choices, ...fix.choices };
    }

    return q;
  });

  if (!DRY_RUN) {
    console.log('\n💾 Saving updates...');
    fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2));
  }

  console.log('\n✅ Done!');
  console.log(`   Fixed: ${modifiedCount} questions`);
  if (skippedCount > 0) {
    console.log(`   Skipped (already fixed): ${skippedCount} questions`);
  }
  if (notFoundCount > 0) {
    console.log(`   Not found: ${notFoundCount} questions`);
  }
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  }
}

applyFixes();
