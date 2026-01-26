/**
 * scripts/batch-fix-strategy.cjs
 * Automated strategy for clearing remaining distractor issues
 * 
 * Outputs:
 * 1. List of question IDs from bad templates (for regeneration)
 * 2. Length-fix plan for remaining questions
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_PATH = path.join(__dirname, '../src/data/questions.json');
const AUDIT_PATH = path.join(__dirname, '../DISTRACTOR_AUDIT_REPORT.md');
const OUTPUT_DIR = path.join(__dirname, '../quality-reports');

// Templates with systemic issues - regenerate all questions from these
const BAD_TEMPLATES = ['CC-T10', 'RES-T11', 'DBDM-T22', 'FSC-T05', 'CC-T09'];

// Length ratio thresholds
const MIN_LENGTH_RATIO = 0.5;
const MAX_LENGTH_RATIO = 1.5;

function analyzeQuestions() {
  console.log('📊 Batch Fix Strategy Generator\n');
  
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
  console.log(`Loaded ${questions.length} questions\n`);

  // === PART 1: Bad Template Questions ===
  console.log('=== PART 1: Bad Template Analysis ===\n');
  
  const badTemplateQuestions = questions.filter(q => {
    // Check if question ID contains any bad template
    return BAD_TEMPLATES.some(t => q.id && q.id.includes(t));
  });

  console.log(`Found ${badTemplateQuestions.length} questions from bad templates:\n`);
  
  const byTemplate = {};
  for (const t of BAD_TEMPLATES) {
    byTemplate[t] = badTemplateQuestions.filter(q => q.id.includes(t));
    console.log(`  ${t}: ${byTemplate[t].length} questions`);
  }

  // === PART 2: Length Mismatch Analysis ===
  console.log('\n=== PART 2: Length Mismatch Analysis ===\n');

  const lengthIssues = [];
  
  for (const q of questions) {
    // Skip bad template questions (they'll be regenerated)
    if (BAD_TEMPLATES.some(t => q.id && q.id.includes(t))) continue;
    
    const choices = q.choices || {};
    const correctLetter = q.correct_answer?.[0];
    const correctText = choices[correctLetter] || '';
    const correctLength = correctText.length;
    
    if (correctLength === 0) continue;
    
    const issues = [];
    
    for (const [letter, text] of Object.entries(choices)) {
      if (letter === correctLetter) continue;
      if (!text) continue;
      
      const ratio = text.length / correctLength;
      
      if (ratio < MIN_LENGTH_RATIO) {
        issues.push({
          letter,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          length: text.length,
          correctLength,
          ratio: ratio.toFixed(2),
          action: 'EXPAND'
        });
      } else if (ratio > MAX_LENGTH_RATIO) {
        issues.push({
          letter,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          length: text.length,
          correctLength,
          ratio: ratio.toFixed(2),
          action: 'SHORTEN'
        });
      }
    }
    
    if (issues.length > 0) {
      lengthIssues.push({
        id: q.id,
        skillId: q.skillId,
        source: q.id.startsWith('GEN-') ? 'generated' : 'ETS',
        issues
      });
    }
  }

  console.log(`Found ${lengthIssues.length} questions with length issues\n`);
  
  const etsLength = lengthIssues.filter(q => q.source === 'ETS');
  const genLength = lengthIssues.filter(q => q.source === 'generated');
  
  console.log(`  ETS questions: ${etsLength.length}`);
  console.log(`  Generated questions: ${genLength.length}`);

  // === GENERATE OUTPUT FILES ===
  console.log('\n=== Generating Output Files ===\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Bad template IDs for regeneration
  const regenIds = badTemplateQuestions.map(q => q.id);
  const regenFile = path.join(OUTPUT_DIR, 'regenerate-ids.json');
  fs.writeFileSync(regenFile, JSON.stringify(regenIds, null, 2));
  console.log(`✅ ${regenFile} (${regenIds.length} IDs)`);

  // 2. Length fix plan
  const lengthPlan = {
    summary: {
      total: lengthIssues.length,
      ets: etsLength.length,
      generated: genLength.length,
      expandNeeded: lengthIssues.filter(q => q.issues.some(i => i.action === 'EXPAND')).length,
      shortenNeeded: lengthIssues.filter(q => q.issues.some(i => i.action === 'SHORTEN')).length
    },
    questions: lengthIssues
  };
  const lengthFile = path.join(OUTPUT_DIR, 'length-fix-plan.json');
  fs.writeFileSync(lengthFile, JSON.stringify(lengthPlan, null, 2));
  console.log(`✅ ${lengthFile}`);

  // 3. Summary CSV for easy review
  const csvRows = ['id,source,skillId,issue_count,actions'];
  for (const q of lengthIssues) {
    const actions = [...new Set(q.issues.map(i => i.action))].join(';');
    csvRows.push(`${q.id},${q.source},${q.skillId},${q.issues.length},${actions}`);
  }
  const csvFile = path.join(OUTPUT_DIR, 'length-issues-summary.csv');
  fs.writeFileSync(csvFile, csvRows.join('\n'));
  console.log(`✅ ${csvFile}`);

  // 4. Template-specific ID lists
  for (const [template, qs] of Object.entries(byTemplate)) {
    if (qs.length > 0) {
      const ids = qs.map(q => q.id);
      const tFile = path.join(OUTPUT_DIR, `regen-${template}.json`);
      fs.writeFileSync(tFile, JSON.stringify(ids, null, 2));
      console.log(`✅ ${tFile} (${ids.length} IDs)`);
    }
  }

  // === FINAL RECOMMENDATIONS ===
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDED ACTIONS');
  console.log('='.repeat(60) + '\n');

  console.log('Step 1: Regenerate Bad Template Questions');
  console.log(`   Run: npx tsx regenerate-distractors.ts`);
  console.log(`   Target: ${regenIds.length} questions from ${BAD_TEMPLATES.length} templates\n`);

  console.log('Step 2: Review Length Issues');
  console.log(`   ETS questions (${etsLength.length}): Manual review recommended`);
  console.log(`   Generated questions (${genLength.length}): Can be auto-fixed\n`);

  console.log('Step 3: Re-run Audit');
  console.log('   Run: npx tsx scripts/audit-distractor-quality.ts\n');

  console.log('Expected Outcome:');
  console.log(`   - Eliminate ~${regenIds.length * 2} issues from bad templates`);
  console.log(`   - Remaining issues: ~${etsLength.length * 1.5} (mostly ETS edge cases)`);
  console.log(`   - Target: <50 total issues (<17% flag rate)\n`);
}

analyzeQuestions();
