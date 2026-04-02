/**
 * fix-misconception-framing.mjs
 *
 * Reframes distractor_misconception_* fields in src/data/questions.json
 * so they all start with "The student" (belief-first language).
 *
 * Rules:
 *   Rule 1 — Verb-first: starts with an action verb
 *            → prepend "The student " + lowercase first letter
 *   Rule 2 — Noun/clause-first: starts with a noun, noun phrase, or subordinate clause
 *            → prepend "The student believed that " + lowercase first letter
 *   Rule 3 — CORRECT placeholder: value is literally "CORRECT"
 *            → set to ""
 *   Skip  — already starts with "The student" (case-insensitive), empty, or "UNUSED"
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../src/data/questions.json');

// ── Action verbs that identify Rule 1 (verb-first) entries ────────────────────
// Includes all forms in the task spec PLUS additional verbs observed in the data.
const ACTION_VERBS = new Set([
  // From the task spec
  'frames', 'equates', 'treats', 'misses', 'labels', 'confuses', 'assumes',
  'attributes', 'misreads', 'judges', 'chooses', 'reverses', 'overgeneralizes',
  'applies', 'ignores', 'conflates', 'mistakes', 'uses', 'selects', 'prioritizes',
  'associates', 'interprets', 'dismisses', 'defaults', 'underestimates',
  'overestimates', 'skips', 'focuses', 'fails', 'elevates', 'extends', 'narrows',
  'maps', 'links', 'relies', 'bases', 'substitutes', 'transfers', 'classifies',
  'assigns', 'places', 'reduces', 'sees', 'views', 'reads', 'takes', 'draws',
  'expects', 'requires', 'identifies', 'targets', 'designs', 'connects',
  'replaces', 'inverts', 'limits', 'separates', 'positions',

  // Additional verbs observed in the data (not in spec list but clearly verb-first)
  'claims', 'treated', 'defines', 'explains', 'calls', 'stops', 'attributed',
  'chose', 'mislabels', 'eliminates', 'discards', 'states', 'collapses',
  'equated', 'reduced', 'used', 'proposed', 'does', 'adds', 'restates',
  'duplicates', 'misclassifies', 'offers', 'predicts', 'withdraws', 'denies',
  'prematurely', 'plans', 'makes', 'escapes', 'pairs', 'invokes', 'disputes',
  'describes', 'splits', 'underuses', 'addresses', 'fragments', 'rejects',
  'concludes', 'centers', 'imports', 'proposes', 'credits', 'tags', 'scores',
  'keeps', 'imagines', 'merges', 'allows', 'defers', 'asserting', 'shelves',
  'invents', 'blames', 'recommends', 'praises', 'declares', 'promises',
  'projects', 'schedules', 'anchors', 'forces', 'recasts', 'implies', 'infers',
  'reframes', 'hijacks', 'asks', 'starts', 'leads', 'emphasizes', 'cites',
  'compares', 'overgeneralized', 'reversed', 'collapsed', 'misread', 'conflated',
  'privately', 'declared', 'over-individualized', 'set', 'shortcut', 'bypassed',
  'sidelined', 'defaulted', 'inverted', 'assigned', 'exported', 'split',
  'located', 'explained', 'reframed', 'operationalized', 'delayed', 'dismissed',
  'avoided', 'forced', 'applied', 'invented', 'lowered', 'dropped', 'withheld',
  'relied', 'approved', 'deferred', 'pathologized', 'generalized', 'left',
  'substituted', 'stereotyped', 'pitted', 'restricted', 'having',
  'partial', 'names', 'reframes', 'rejects', 'restates', 'reduced',
]);

// ── Fields to process ────────────────────────────────────────────────────────
const MISCONCEPTION_FIELDS = [
  'distractor_misconception_A',
  'distractor_misconception_B',
  'distractor_misconception_C',
  'distractor_misconception_D',
];

function lowercaseFirst(str) {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function classifyAndReframe(value) {
  const v = value.trim();

  // Already compliant
  if (!v) return { result: v, rule: 'skip_empty' };
  if (v === 'UNUSED') return { result: v, rule: 'skip_unused' };
  if (/^the student/i.test(v)) return { result: v, rule: 'skip_compliant' };

  // Rule 3: CORRECT placeholder
  if (/^CORRECT$/i.test(v)) return { result: '', rule: 'rule3' };

  // Identify first word
  const firstWord = v.split(/[\s,]/)[0].toLowerCase();

  if (ACTION_VERBS.has(firstWord)) {
    // Rule 1: verb-first → "The student <verb>..."
    return { result: 'The student ' + lowercaseFirst(v), rule: 'rule1' };
  } else {
    // Rule 2: noun/clause-first → "The student believed that <noun>..."
    return { result: 'The student believed that ' + lowercaseFirst(v), rule: 'rule2' };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`Reading ${DATA_PATH} …`);
const raw = readFileSync(DATA_PATH, 'utf8');
const data = JSON.parse(raw);

const questions = Array.isArray(data) ? data : (data.questions || Object.values(data));

let counts = {
  rule1: 0,
  rule2: 0,
  rule3: 0,
  skip_empty: 0,
  skip_unused: 0,
  skip_compliant: 0,
};

for (const q of questions) {
  for (const field of MISCONCEPTION_FIELDS) {
    if (q[field] === undefined || q[field] === null) continue;
    const original = String(q[field]);
    const { result, rule } = classifyAndReframe(original);
    counts[rule]++;
    if (result !== original) {
      q[field] = result;
    }
  }
}

// Write back with same formatting (2-space indent to match common JSON style)
const output = JSON.stringify(data, null, 2);
writeFileSync(DATA_PATH, output + '\n', 'utf8');

console.log('\n── Results ──────────────────────────────────────────────────');
console.log(`  Rule 1 (verb-first  → "The student <verb>…"):          ${counts.rule1}`);
console.log(`  Rule 2 (noun-first  → "The student believed that …"):  ${counts.rule2}`);
console.log(`  Rule 3 (CORRECT placeholder → ""):                     ${counts.rule3}`);
console.log(`  Skipped — already "The student…":                      ${counts.skip_compliant}`);
console.log(`  Skipped — empty string:                                 ${counts.skip_empty}`);
console.log(`  Skipped — UNUSED marker:                                ${counts.skip_unused}`);
console.log('─────────────────────────────────────────────────────────────');
console.log(`  Total fields processed:  ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
console.log(`  Total fields reframed:   ${counts.rule1 + counts.rule2 + counts.rule3}`);
console.log('\nDone. File written.');
