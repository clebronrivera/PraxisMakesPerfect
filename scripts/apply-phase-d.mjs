/**
 * apply-phase-d.mjs
 *
 * Applies Phase D content (nasp_domain_primary, skill_prerequisites, prereq_chain_narrative)
 * from content-authoring/phase-D/output/*.json into src/data/skill-phase-d.json.
 *
 * skill-phase-d.json is keyed by skill ID (ACA-02, CON-01, etc.) — the same format
 * as questions.json current_skill_id. It is created on first run if it doesn't exist.
 *
 * 4-category logging per field:
 *   applied    — field was empty/missing, now written
 *   skipped    — field already matches incoming value (idempotent)
 *   mismatched — field has different existing content (NOT overwritten — review manually)
 *   missing    — skill_id from JSON not in the known 45-skill list
 *
 * Also validates nasp_domain_primary against NASP-1 through NASP-10.
 *
 * Usage:
 *   node scripts/apply-phase-d.mjs [--dry-run] [--force-mismatches]
 *
 * --dry-run          skips writing skill-phase-d.json. All logging still runs.
 * --force-mismatches overwrites existing content when incoming differs.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const JSON_DIR = join(ROOT, 'content-authoring', 'phase-D', 'output');
const OUTPUT_PATH = join(ROOT, 'src', 'data', 'skill-phase-d.json');

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_MISMATCHES = process.argv.includes('--force-mismatches');

// All 45 known skill IDs
const KNOWN_SKILLS = new Set([
  'ACA-02','ACA-03','ACA-04','ACA-06','ACA-07','ACA-08','ACA-09',
  'CON-01',
  'DBD-01','DBD-03','DBD-05','DBD-06','DBD-07','DBD-08','DBD-09','DBD-10',
  'DEV-01',
  'DIV-01','DIV-03','DIV-05',
  'ETH-01','ETH-02','ETH-03',
  'FAM-02','FAM-03',
  'LEG-01','LEG-02','LEG-03','LEG-04',
  'MBH-02','MBH-03','MBH-04','MBH-05',
  'PSY-01','PSY-02','PSY-03','PSY-04',
  'RES-02','RES-03',
  'SAF-01','SAF-03','SAF-04',
  'SWP-02','SWP-03','SWP-04',
]);

// Valid NASP domain codes
const VALID_NASP = new Set([
  'NASP-1','NASP-2','NASP-3','NASP-4','NASP-5',
  'NASP-6','NASP-7','NASP-8','NASP-9','NASP-10',
]);

const FIELDS = ['nasp_domain_primary', 'skill_prerequisites', 'prereq_chain_narrative'];

// ── Load input JSON files ─────────────────────────────────────────────────────
let jsonFiles;
try {
  jsonFiles = readdirSync(JSON_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
} catch (err) {
  console.error(`ERROR: Cannot read input directory: ${JSON_DIR}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

console.log(`\nPhase D Apply Script${DRY_RUN ? ' [DRY RUN]' : ''}`);
console.log(`Input directory : ${JSON_DIR}`);
console.log(`Input files     : ${jsonFiles.length}`);
console.log(`Output file     : ${OUTPUT_PATH}\n`);

if (jsonFiles.length === 0) {
  console.log('No phase-D JSON files found. Add JSON files to content-authoring/phase-D/output/ and re-run.');
  process.exit(0);
}

// Build incoming map: skill_id → { nasp_domain_primary, skill_prerequisites, prereq_chain_narrative }
const incoming = new Map();
const loadErrors = [];
const validationWarnings = [];

for (const file of jsonFiles) {
  const filePath = join(JSON_DIR, file);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    loadErrors.push(`  [parse error] ${file}: ${err.message}`);
    continue;
  }

  if (!Array.isArray(data)) {
    loadErrors.push(`  [bad format] ${file}: expected a JSON array, got ${typeof data}`);
    continue;
  }

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const sid = entry?.skill_id?.trim();

    if (!sid) {
      loadErrors.push(`  [missing skill_id] ${file} index ${i}`);
      continue;
    }

    if (!KNOWN_SKILLS.has(sid)) {
      loadErrors.push(`  [unknown skill] ${file} index ${i}: skill_id="${sid}" not in 45-skill list`);
      continue;
    }

    if (incoming.has(sid)) {
      loadErrors.push(`  [duplicate] ${file} index ${i}: skill_id="${sid}" already seen (first occurrence wins)`);
      continue;
    }

    // Validate nasp_domain_primary
    const nasp = entry.nasp_domain_primary?.trim() ?? '';
    if (nasp && !VALID_NASP.has(nasp)) {
      validationWarnings.push(`  [invalid NASP code] ${file} index ${i}: skill_id="${sid}" nasp_domain_primary="${nasp}" — expected NASP-1 through NASP-10`);
    }

    // skill_prerequisites may be a \n-delimited string or an array of strings
    const rawPrereqs = entry.skill_prerequisites ?? '';
    const prereqs = Array.isArray(rawPrereqs)
      ? rawPrereqs.join('\n')
      : String(rawPrereqs).trim();

    incoming.set(sid, {
      nasp_domain_primary:    nasp,
      skill_prerequisites:    prereqs,
      prereq_chain_narrative: (entry.prereq_chain_narrative ?? '').trim(),
      sourceFile: file,
    });
  }
}

if (loadErrors.length > 0) {
  console.log('── Load errors / warnings ─────────────────────────────────────────────────');
  loadErrors.forEach(e => console.log(e));
  console.log();
}

if (validationWarnings.length > 0) {
  console.log('── Validation warnings ────────────────────────────────────────────────────');
  validationWarnings.forEach(w => console.log(w));
  console.log();
}

console.log(`Skills loaded from input files: ${incoming.size}\n`);

// ── Load or initialize skill-phase-d.json ─────────────────────────────────────
let skillData = {};
if (existsSync(OUTPUT_PATH)) {
  try {
    skillData = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    console.log(`Loaded existing skill-phase-d.json (${Object.keys(skillData).length} skills)\n`);
  } catch (err) {
    console.error(`ERROR: Cannot parse existing ${OUTPUT_PATH}: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log('skill-phase-d.json does not exist — will be created on first write.\n');
}

// ── Apply ─────────────────────────────────────────────────────────────────────
const counts = { applied: 0, skipped: 0, mismatched: 0, missing: 0 };
const mismatches = [];

for (const [sid, data] of incoming) {
  if (!skillData[sid]) {
    skillData[sid] = { skill_id: sid };
  }

  const entry = skillData[sid];

  for (const field of FIELDS) {
    const existing = (entry[field] ?? '').trim();
    const incomingVal = data[field];

    if (!incomingVal) continue;

    if (!existing) {
      entry[field] = incomingVal;
      counts.applied++;
    } else if (existing === incomingVal) {
      counts.skipped++;
    } else if (FORCE_MISMATCHES) {
      entry[field] = incomingVal;
      counts.applied++;
      mismatches.push(
        `  OVERWRITTEN [${sid}] field="${field}" source="${data.sourceFile}"\n` +
        `    was      : ${existing.slice(0, 120)}${existing.length > 120 ? '…' : ''}\n` +
        `    replaced : ${incomingVal.slice(0, 120)}${incomingVal.length > 120 ? '…' : ''}`
      );
    } else {
      counts.mismatched++;
      mismatches.push(
        `  MISMATCH [${sid}] field="${field}" source="${data.sourceFile}"\n` +
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
console.log(`  missing    : ${counts.missing} (skill_id not in 45-skill list — already reported above)`);
console.log();

if (mismatches.length > 0) {
  console.log('── Mismatches ─────────────────────────────────────────────────────────────');
  mismatches.forEach(m => console.log(m));
  console.log();
}

// Coverage summary
const populated = Object.values(skillData).filter(s =>
  s.nasp_domain_primary && s.skill_prerequisites && s.prereq_chain_narrative
).length;
console.log(`── Coverage ───────────────────────────────────────────────────────────────`);
console.log(`  Skills with all 3 Phase D fields: ${populated} / ${KNOWN_SKILLS.size}`);
console.log();

// ── Write ─────────────────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('[DRY RUN] skill-phase-d.json not written. Remove --dry-run to apply.');
} else if (counts.applied === 0) {
  console.log('Nothing to write — no new fields applied.');
} else {
  if (existsSync(OUTPUT_PATH)) {
    const backupPath = OUTPUT_PATH + '.backup.' + Date.now();
    writeFileSync(backupPath, readFileSync(OUTPUT_PATH));
    console.log(`Backup written: ${backupPath}`);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(skillData, null, 2));
  console.log(`skill-phase-d.json written with ${counts.applied} field updates.`);
  console.log(`Total skills in file: ${Object.keys(skillData).length}`);
}

if (counts.mismatched > 0) {
  console.log('\n⚠  Mismatches found. Inspect the MISMATCH lines above before proceeding.');
  process.exit(1);
}
