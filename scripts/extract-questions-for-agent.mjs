#!/usr/bin/env node
/**
 * extract-questions-for-agent.mjs
 *
 * Extracts all questions for a given skill (or all skills) from questions.json
 * and writes a clean, agent-readable text file ready to paste into an LLM chat.
 *
 * Usage:
 *   node scripts/extract-questions-for-agent.mjs CON-01
 *   node scripts/extract-questions-for-agent.mjs LEG-02
 *   node scripts/extract-questions-for-agent.mjs ALL            ← all 1,150 questions (large)
 *   node scripts/extract-questions-for-agent.mjs --gaps-only     ← only questions missing classifications
 *
 * Output:
 *   [SKILL-ID]-questions-for-agent.txt in the project root
 *
 * Each question is rendered in a format the LLM agent can read without
 * any knowledge of the codebase or JSON schema.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const skillArg = args.find(a => !a.startsWith('--')) || null;
const gapsOnly = args.includes('--gaps-only');

if (!skillArg) {
  console.error('Usage: node scripts/extract-questions-for-agent.mjs [SKILL-ID | ALL] [--gaps-only]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/extract-questions-for-agent.mjs CON-01');
  console.error('  node scripts/extract-questions-for-agent.mjs MBH-03 --gaps-only');
  console.error('  node scripts/extract-questions-for-agent.mjs ALL --gaps-only');
  process.exit(1);
}

// ── Load questions ────────────────────────────────────────────────────────────
const questionsPath = join(__dirname, '../src/data/questions.json');
let allQuestions;
try {
  allQuestions = JSON.parse(readFileSync(questionsPath, 'utf-8'));
} catch (e) {
  console.error('Could not read questions.json:', e.message);
  process.exit(1);
}

// ── Filter to requested skill(s) ──────────────────────────────────────────────
const questions = skillArg === 'ALL'
  ? allQuestions
  : allQuestions.filter(q => q.current_skill_id === skillArg);

if (questions.length === 0) {
  const known = [...new Set(allQuestions.map(q => q.current_skill_id))].sort();
  console.error(`No questions found for skill: ${skillArg}`);
  console.error(`Known skill IDs: ${known.join(', ')}`);
  process.exit(1);
}

// ── Helper: determine which options are wrong and which fields are missing ────
function getWrongOptions(q) {
  const correct = new Set(
    (q.correct_answers || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
  return ['A', 'B', 'C', 'D', 'E', 'F'].filter(
    l => q[l] && q[l].trim() && q[l] !== 'UNUSED' && !correct.has(l)
  );
}

function isClassified(q, letter) {
  const tier = q[`distractor_tier_${letter}`];
  const errType = q[`distractor_error_type_${letter}`];
  const misc = q[`distractor_misconception_${letter}`];
  const deficit = q[`distractor_skill_deficit_${letter}`];
  const hasRealTier = tier && tier !== '' && !tier.startsWith('CORRECT') && !tier.startsWith('UNUSED');
  const hasRealErr = errType && errType !== '' && errType !== 'CORRECT' && errType !== 'UNUSED';
  const hasRealMisc = misc && misc !== '' && misc !== 'CORRECT' && misc !== 'UNUSED'
    && !misc.startsWith('Student mistakenly selects an option related to');
  const hasRealDeficit = deficit && deficit !== '' && deficit !== 'CORRECT' && deficit !== 'UNUSED';
  return hasRealTier && hasRealErr && hasRealMisc && hasRealDeficit;
}

function questionNeedsClassification(q) {
  return getWrongOptions(q).some(l => !isClassified(q, l));
}

// ── Apply gaps-only filter ────────────────────────────────────────────────────
const toProcess = gapsOnly ? questions.filter(questionNeedsClassification) : questions;

if (toProcess.length === 0) {
  console.log(`All ${questions.length} questions for ${skillArg} are already classified. Nothing to extract.`);
  process.exit(0);
}

// ── Build output ──────────────────────────────────────────────────────────────
const skillLabel = skillArg === 'ALL' ? 'ALL-SKILLS' : skillArg;
let out = '';

out += `════════════════════════════════════════════════════════════════════════════\n`;
out += `QUESTION DATA EXTRACT — ${skillLabel}\n`;
out += `Generated for LLM content-authoring agent use\n`;
out += `Extracted: ${toProcess.length} question(s)`;
if (gapsOnly) out += ` (gaps only — missing distractor classification)`;
out += `\n`;
out += `Total in skill: ${questions.length} | Total in bank: ${allQuestions.length}\n`;
out += `════════════════════════════════════════════════════════════════════════════\n\n`;

toProcess.forEach((q, idx) => {
  const correctSet = new Set(
    (q.correct_answers || '').split(',').map(s => s.trim()).filter(Boolean)
  );
  const allOptions = ['A', 'B', 'C', 'D', 'E', 'F'].filter(
    l => q[l] && q[l].trim() && q[l] !== 'UNUSED'
  );
  const wrongOptions = allOptions.filter(l => !correctSet.has(l));
  const isMulti = q.correct_answer_count > 1 || q.is_multi_select === 'True';

  out += `────────────────────────────────────────────────────────────────────────────\n`;
  out += `QUESTION ${idx + 1} of ${toProcess.length}\n`;
  out += `ID: ${q.UNIQUEID}\n`;
  out += `Skill: ${q.current_skill_id}\n`;
  out += `Cognitive Complexity: ${q.cognitive_complexity || 'NOT SET'}\n`;
  out += `Foundational: ${q.is_foundational}\n`;
  out += `Format: ${isMulti ? 'Multi-Select (select all that apply)' : 'Single-Select'}\n`;

  if (q.has_case_vignette === 'True' || q.has_case_vignette === true) {
    out += `Case Vignette: YES\n`;
    if (q.case_text && q.case_text.trim()) {
      out += `\nVIGNETTE:\n${q.case_text.trim()}\n`;
    }
  }

  out += `\nSTEM:\n${q.question_stem}\n\n`;

  allOptions.forEach(letter => {
    const label = correctSet.has(letter) ? '[CORRECT]' : '[WRONG]';
    out += `${letter} ${label}: ${q[letter]}\n`;
  });

  out += `\nCORRECT EXPLANATION:\n${q.CORRECT_Explanation || '(none)'}\n`;

  // Show existing classification if present
  wrongOptions.forEach(letter => {
    const classified = isClassified(q, letter);
    if (classified) {
      out += `\nOPTION ${letter} — ALREADY CLASSIFIED:\n`;
      out += `  distractor_tier: ${q[`distractor_tier_${letter}`]}\n`;
      out += `  distractor_error_type: ${q[`distractor_error_type_${letter}`]}\n`;
      out += `  distractor_misconception: ${q[`distractor_misconception_${letter}`]}\n`;
      out += `  distractor_skill_deficit: ${q[`distractor_skill_deficit_${letter}`]}\n`;
    }
  });

  const needsClassification = wrongOptions.filter(l => !isClassified(q, l));
  if (needsClassification.length > 0) {
    out += `\nNEEDS CLASSIFICATION: Options ${needsClassification.join(', ')}\n`;
  } else {
    out += `\n[ALL OPTIONS CLASSIFIED]\n`;
  }

  // Show which pedagogical fields are missing
  const missingPedagogy = [];
  if (!q.complexity_rationale || q.complexity_rationale.trim() === '') missingPedagogy.push('complexity_rationale');
  if (!q.construct_actually_tested || q.construct_actually_tested.trim() === '') missingPedagogy.push('construct_actually_tested');
  if (!q.dominant_error_pattern || q.dominant_error_pattern.trim() === '') missingPedagogy.push('dominant_error_pattern');
  if (!q.error_cluster_tag || q.error_cluster_tag.trim() === '') missingPedagogy.push('error_cluster_tag');
  if (!q.instructional_red_flags || q.instructional_red_flags.trim() === '') missingPedagogy.push('instructional_red_flags');

  if (missingPedagogy.length > 0) {
    out += `MISSING PEDAGOGY FIELDS: ${missingPedagogy.join(', ')}\n`;
  }

  out += `\n`;
});

// ── Summary stats ─────────────────────────────────────────────────────────────
const totalWrong = toProcess.reduce((s, q) => s + getWrongOptions(q).length, 0);
const alreadyDone = toProcess.reduce(
  (s, q) => s + getWrongOptions(q).filter(l => isClassified(q, l)).length, 0
);
const toDo = totalWrong - alreadyDone;

out += `════════════════════════════════════════════════════════════════════════════\n`;
out += `SUMMARY\n`;
out += `Questions extracted: ${toProcess.length}\n`;
out += `Total wrong-answer options: ${totalWrong}\n`;
out += `Already classified: ${alreadyDone}\n`;
out += `Needs classification: ${toDo}\n`;
out += `════════════════════════════════════════════════════════════════════════════\n`;

// ── Write file ────────────────────────────────────────────────────────────────
const outFilename = `${skillLabel}-questions-for-agent.txt`;
const outPath = join(__dirname, '..', outFilename);
writeFileSync(outPath, out, 'utf-8');

console.log(`✓ Extracted ${toProcess.length} questions → ${outFilename}`);
console.log(`  Wrong-answer slots to classify: ${toDo}`);
console.log(`  File size: ${(out.length / 1024).toFixed(1)} KB`);
console.log(`  Path: ${outPath}`);
