/**
 * apply-phase-b.mjs
 *
 * Applies Phase B content (complexity_rationale + construct_actually_tested)
 * from content-authoring/phase-B/output/*.csv into src/data/questions.json.
 *
 * 4-category logging per row:
 *   applied    — field was empty, now written
 *   skipped    — field already matches incoming value (idempotent)
 *   mismatched — field has different existing content (NOT overwritten — review manually)
 *   missing    — UNIQUEID from CSV not found in questions.json
 *
 * Usage:
 *   node scripts/apply-phase-b.mjs [--dry-run] [--force-mismatches]
 *
 * --dry-run          skips writing questions.json and the backup. All logging still runs.
 * --force-mismatches overwrites existing content when incoming differs (use after reviewing MISMATCH log).
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV_DIR = join(ROOT, 'content-authoring', 'phase-B', 'output');
const QUESTIONS_PATH = join(ROOT, 'src', 'data', 'questions.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_MISMATCHES = process.argv.includes('--force-mismatches');

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
        // Quoted field
        i++; // skip opening quote
        let field = '';
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; } // escaped quote
            else { i++; break; }                                 // closing quote
          } else {
            field += text[i++];
          }
        }
        row.push(field);
      } else {
        // Unquoted field
        let field = '';
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++];
        }
        row.push(field.trim());
      }
      if (i < len && text[i] === ',') { i++; continue; }
      if (i < len && text[i] === '\r') i++; // CRLF
      if (i < len && text[i] === '\n') i++;
      break;
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
  }
  return rows;
}

// ── Load CSVs ─────────────────────────────────────────────────────────────────
const csvFiles = readdirSync(CSV_DIR)
  .filter(f => f.endsWith('-phase-B.csv'))
  .sort();

console.log(`\nPhase B Apply Script${DRY_RUN ? ' [DRY RUN]' : ''}`);
console.log(`CSV directory : ${CSV_DIR}`);
console.log(`CSV files     : ${csvFiles.length}`);
console.log(`Questions file: ${QUESTIONS_PATH}\n`);

// Build incoming map: UNIQUEID → { complexity_rationale, construct_actually_tested }
const incoming = new Map();
const csvErrors = [];

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
  const idIdx = header.findIndex(h => h.trim() === 'UNIQUEID');
  const crIdx = header.findIndex(h => h.trim() === 'complexity_rationale');
  const ctIdx = header.findIndex(h => h.trim() === 'construct_actually_tested');

  if (idIdx === -1 || crIdx === -1 || ctIdx === -1) {
    csvErrors.push(`  [bad header] ${file}: expected UNIQUEID, complexity_rationale, construct_actually_tested — got: ${header.join(', ')}`);
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
    incoming.set(uid, {
      complexity_rationale: row[crIdx]?.trim() ?? '',
      construct_actually_tested: row[ctIdx]?.trim() ?? '',
      sourceFile: file,
    });
  }
}

if (csvErrors.length > 0) {
  console.log('── CSV warnings ───────────────────────────────────────────────────────────');
  csvErrors.forEach(e => console.log(e));
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

const FIELDS = ['complexity_rationale', 'construct_actually_tested'];

for (const [uid, data] of incoming) {
  const q = questionMap.get(uid);

  if (!q) {
    counts.missing++;
    missings.push(`  MISSING: ${uid}  (from ${data.sourceFile})`);
    continue;
  }

  for (const field of FIELDS) {
    const existing = (q[field] ?? '').trim();
    const incoming_val = data[field];

    if (!incoming_val) continue; // nothing to write for this field

    if (!existing) {
      // Apply
      q[field] = incoming_val;
      counts.applied++;
    } else if (existing === incoming_val) {
      // Already present and identical
      counts.skipped++;
    } else if (FORCE_MISMATCHES) {
      // Overwrite existing with incoming (use after reviewing mismatch log)
      q[field] = incoming_val;
      counts.applied++;
      mismatches.push(
        `  OVERWRITTEN [${uid}] field="${field}" source="${data.sourceFile}"\n` +
        `    was      : ${existing.slice(0, 120)}${existing.length > 120 ? '…' : ''}\n` +
        `    replaced : ${incoming_val.slice(0, 120)}${incoming_val.length > 120 ? '…' : ''}`
      );
    } else {
      // Conflict — do not overwrite
      counts.mismatched++;
      mismatches.push(
        `  MISMATCH [${uid}] field="${field}" source="${data.sourceFile}"\n` +
        `    existing : ${existing.slice(0, 120)}${existing.length > 120 ? '…' : ''}\n` +
        `    incoming : ${incoming_val.slice(0, 120)}${incoming_val.length > 120 ? '…' : ''}`
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
