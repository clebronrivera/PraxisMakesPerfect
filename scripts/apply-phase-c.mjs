/**
 * apply-phase-c.mjs
 *
 * Applies Phase C content (dominant_error_pattern, error_cluster_tag, instructional_red_flags)
 * from content-authoring/phase-C/output/*.csv into src/data/questions.json.
 *
 * 4-category logging per row:
 *   applied    — field was empty, now written
 *   skipped    — field already matches incoming value (idempotent)
 *   mismatched — field has different existing content (NOT overwritten — review manually)
 *   missing    — UNIQUEID from CSV not found in questions.json
 *
 * Also warns on unknown error_cluster_tag values (not in approved list).
 *
 * Usage:
 *   node scripts/apply-phase-c.mjs [--dry-run] [--force-mismatches]
 *
 * --dry-run          skips writing questions.json. All logging still runs.
 * --force-mismatches overwrites existing content when incoming differs (use after reviewing MISMATCH log).
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_DIR = join(ROOT, 'content-authoring', 'phase-C', 'output');
const QUESTIONS_PATH = join(ROOT, 'src', 'data', 'questions.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_MISMATCHES = process.argv.includes('--force-mismatches');

// Approved error_cluster_tag values from content-authoring/TAG_GLOSSARY.md
const APPROVED_TAGS = new Set([
  'model-conflation',
  'scope-overgeneralization',
  'scope-undergeneralization',
  'sequence-inversion',
  'component-confusion',
  'indirect-direct-confusion',
  'purpose-confusion',
  'prerequisite-skipping',
  'label-retrieval',
  'overgeneralization',
  'population-confusion',
  'role-confusion',
  'causation-correlation',
  'validity-reliability-confusion',
  'norm-criterion-confusion',
  'tier-level-confusion',
  'eligibility-criteria-confusion',
  'consent-confidentiality-confusion',
  'developmental-stage-mismatch',
  'treatment-assessment-confusion',
]);

// ── Minimal CSV parser ────────────────────────────────────────────────────────
// Handles RFC 4180 quoted fields (including embedded commas and newlines).
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    while (i < len) {
      if (text[i] === '"') {
        i++; // skip opening quote
        let field = '';
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else {
            field += text[i++];
          }
        }
        row.push(field);
      } else {
        let field = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++];
        }
        row.push(field.trim());
      }
      if (i < len && text[i] === ',') { i++; continue; }
      if (i < len && text[i] === '\r') i++;
      if (i < len && text[i] === '\n') i++;
      break;
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
  }
  return rows;
}

// ── Load CSVs ─────────────────────────────────────────────────────────────────
let csvFiles;
try {
  csvFiles = readdirSync(CSV_DIR)
    .filter(f => f.endsWith('.csv') && f.includes('phase-C'))
    .sort();
} catch (err) {
  console.error(`ERROR: Cannot read CSV directory: ${CSV_DIR}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

console.log(`\nPhase C Apply Script${DRY_RUN ? ' [DRY RUN]' : ''}`);
console.log(`CSV directory : ${CSV_DIR}`);
console.log(`CSV files     : ${csvFiles.length}`);
console.log(`Questions file: ${QUESTIONS_PATH}\n`);

if (csvFiles.length === 0) {
  console.log('No phase-C CSV files found. Add CSVs to content-authoring/phase-C/output/ and re-run.');
  process.exit(0);
}

// Build incoming map: UNIQUEID → { dominant_error_pattern, error_cluster_tag, instructional_red_flags }
const incoming = new Map();
const csvErrors = [];
const tagWarnings = [];

for (const file of csvFiles) {
  const filePath = join(CSV_DIR, file);
  let rows;
  try {
    rows = parseCSV(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    csvErrors.push(`  [parse error] ${file}: ${err.message}`);
    continue;
  }

  if (rows.length < 2) {
    csvErrors.push(`  [empty] ${file}: only ${rows.length} rows (no data after header)`);
    continue;
  }

  const header = rows[0];
  const idIdx   = header.findIndex(h => h.trim() === 'UNIQUEID');
  const depIdx  = header.findIndex(h => h.trim() === 'dominant_error_pattern');
  const tagIdx  = header.findIndex(h => h.trim() === 'error_cluster_tag');
  const rfIdx   = header.findIndex(h => h.trim() === 'instructional_red_flags');

  if (idIdx === -1 || depIdx === -1 || tagIdx === -1 || rfIdx === -1) {
    csvErrors.push(
      `  [bad header] ${file}: expected UNIQUEID, dominant_error_pattern, error_cluster_tag, instructional_red_flags\n` +
      `    got: ${header.join(', ')}`
    );
    continue;
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const uid = row[idIdx]?.trim();
    if (!uid) continue;

    if (incoming.has(uid)) {
      csvErrors.push(`  [duplicate] ${file} row ${r + 1}: UNIQUEID ${uid} already seen (first occurrence wins)`);
      continue;
    }

    const tag = row[tagIdx]?.trim() ?? '';
    if (tag && !APPROVED_TAGS.has(tag)) {
      tagWarnings.push(`  [unknown tag] ${file} row ${r + 1}: UNIQUEID=${uid} tag="${tag}" — not in TAG_GLOSSARY.md`);
    }

    incoming.set(uid, {
      dominant_error_pattern:  row[depIdx]?.trim() ?? '',
      error_cluster_tag:       tag,
      instructional_red_flags: row[rfIdx]?.trim() ?? '',
      sourceFile: file,
    });
  }
}

if (csvErrors.length > 0) {
  console.log('── CSV warnings ───────────────────────────────────────────────────────────');
  csvErrors.forEach(e => console.log(e));
  console.log();
}

if (tagWarnings.length > 0) {
  console.log('── Unknown error_cluster_tag values (check TAG_GLOSSARY.md) ───────────────');
  tagWarnings.forEach(w => console.log(w));
  console.log('  → Add new tags to content-authoring/TAG_GLOSSARY.md before applying.');
  console.log();
}

console.log(`Rows loaded from CSVs: ${incoming.size}\n`);

// ── Load questions.json ───────────────────────────────────────────────────────
const questions = JSON.parse(readFileSync(QUESTIONS_PATH, 'utf-8'));
const questionMap = new Map(questions.map(q => [q.UNIQUEID, q]));
console.log(`Questions in bank: ${questions.length}\n`);

// ── Apply ─────────────────────────────────────────────────────────────────────
const counts = { applied: 0, skipped: 0, mismatched: 0, missing: 0 };
const mismatches = [];
const missings = [];

const FIELDS = ['dominant_error_pattern', 'error_cluster_tag', 'instructional_red_flags'];

for (const [uid, data] of incoming) {
  const q = questionMap.get(uid);

  if (!q) {
    counts.missing++;
    missings.push(`  MISSING: ${uid}  (from ${data.sourceFile})`);
    continue;
  }

  for (const field of FIELDS) {
    const existing = (q[field] ?? '').trim();
    const incomingVal = data[field];

    if (!incomingVal) continue;

    if (!existing) {
      q[field] = incomingVal;
      counts.applied++;
    } else if (existing === incomingVal) {
      counts.skipped++;
    } else if (FORCE_MISMATCHES) {
      q[field] = incomingVal;
      counts.applied++;
      mismatches.push(
        `  OVERWRITTEN [${uid}] field="${field}" source="${data.sourceFile}"\n` +
        `    was      : ${existing.slice(0, 120)}${existing.length > 120 ? '…' : ''}\n` +
        `    replaced : ${incomingVal.slice(0, 120)}${incomingVal.length > 120 ? '…' : ''}`
      );
    } else {
      counts.mismatched++;
      mismatches.push(
        `  MISMATCH [${uid}] field="${field}" source="${data.sourceFile}"\n` +
        `    existing : ${existing.slice(0, 120)}${existing.length > 120 ? '…' : ''}\n` +
        `    incoming : ${incomingVal.slice(0, 120)}${incomingVal.length > 120 ? '…' : ''}`
      );
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log('── Results ────────────────────────────────────────────────────────────────');
console.log(`  applied    : ${counts.applied} field writes`);
console.log(`  skipped    : ${counts.skipped} (already present and matching)`);
console.log(`  mismatched : ${counts.mismatched} (existing content differs — NOT overwritten)`);
console.log(`  missing    : ${counts.missing} (UNIQUEID from CSV not in questions.json)`);
console.log();

if (mismatches.length > 0) {
  console.log('── Mismatches (review manually before re-running) ─────────────────────────');
  mismatches.forEach(m => console.log(m));
  console.log();
}

if (missings.length > 0) {
  console.log('── Missing question IDs ───────────────────────────────────────────────────');
  missings.forEach(m => console.log(m));
  console.log();
}

// ── Write ─────────────────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('[DRY RUN] questions.json not written. Remove --dry-run to apply.');
} else if (counts.applied === 0) {
  console.log('Nothing to write — no new fields applied.');
} else {
  const backupPath = QUESTIONS_PATH + '.backup.' + Date.now();
  writeFileSync(backupPath, readFileSync(QUESTIONS_PATH));
  console.log(`Backup written: ${backupPath}`);

  writeFileSync(QUESTIONS_PATH, JSON.stringify(questions, null, 2));
  console.log(`questions.json updated with ${counts.applied} field writes.`);
}

if (counts.mismatched > 0) {
  console.log('\n⚠  Mismatches found. Inspect the MISMATCH lines above before proceeding.');
  process.exit(1);
}
