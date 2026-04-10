#!/usr/bin/env node
/**
 * apply-content-authoring-output.mjs
 *
 * Applies Phase A/B/C/D content-authoring outputs into src/data/questions.json.
 *
 * Usage:
 *   node scripts/apply-content-authoring-output.mjs --phase=A --file=content-authoring/output/phase-A/MBH-03-phase-A.csv
 *   node scripts/apply-content-authoring-output.mjs --phase=B --file=content-authoring/output/phase-B/MBH-03-phase-B.csv
 *   node scripts/apply-content-authoring-output.mjs --phase=C --file=content-authoring/output/phase-C/MBH-03-phase-C.csv
 *   node scripts/apply-content-authoring-output.mjs --phase=D --file=content-authoring/output/phase-D/all-skills-phase-D.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const questionsPath = join(repoRoot, 'src/data/questions.json');

const VALID_TIERS = new Set(['L1', 'L2', 'L3']);
const VALID_ERROR_TYPES = new Set(['Conceptual', 'Procedural', 'Lexical']);
const VALID_NASP = new Set([
  'NASP-1',
  'NASP-2',
  'NASP-3',
  'NASP-4',
  'NASP-5',
  'NASP-6',
  'NASP-7',
  'NASP-8',
  'NASP-9',
  'NASP-10'
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Map();
  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.replace(/^--/, '').split('=');
    flags.set(k, v ?? 'true');
  }
  const phase = flags.get('phase');
  const file = flags.get('file');
  if (!phase || !file) {
    console.error('Required args: --phase=A|B|C|D --file=<path>');
    process.exit(1);
  }
  return {
    phase: phase.toUpperCase(),
    file: join(repoRoot, file)
  };
}

function loadQuestions() {
  return JSON.parse(readFileSync(questionsPath, 'utf-8'));
}

function saveQuestions(questions) {
  writeFileSync(questionsPath, `${JSON.stringify(questions, null, 2)}\n`);
}

function questionMap(questions) {
  return new Map(questions.map((q) => [q.UNIQUEID, q]));
}

function requireNonEmpty(value, field, rowRef) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing/empty ${field} in ${rowRef}`);
  }
  return value.trim();
}

function parseCsv(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (values[i] ?? '').trim();
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;

  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i += 1;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      i += 1;
      continue;
    }
    cur += ch;
    i += 1;
  }
  out.push(cur);
  return out;
}

function applyPhaseA(questions, rows) {
  const qById = questionMap(questions);
  let updated = 0;

  for (const row of rows) {
    const id = requireNonEmpty(row.UNIQUEID, 'UNIQUEID', 'phase A row');
    const letter = requireNonEmpty(row.distractor_letter, 'distractor_letter', id).toUpperCase();
    if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(letter)) {
      throw new Error(`Invalid distractor_letter "${letter}" for ${id}`);
    }
    const tier = requireNonEmpty(row.distractor_tier, 'distractor_tier', id);
    const errType = requireNonEmpty(row.distractor_error_type, 'distractor_error_type', id);
    const misconception = requireNonEmpty(row.distractor_misconception, 'distractor_misconception', id);
    const deficit = requireNonEmpty(row.distractor_skill_deficit, 'distractor_skill_deficit', id);

    if (!VALID_TIERS.has(tier)) throw new Error(`Invalid distractor_tier "${tier}" for ${id}/${letter}`);
    if (!VALID_ERROR_TYPES.has(errType)) throw new Error(`Invalid distractor_error_type "${errType}" for ${id}/${letter}`);

    const q = qById.get(id);
    if (!q) throw new Error(`UNIQUEID not found in questions.json: ${id}`);

    q[`distractor_tier_${letter}`] = tier;
    q[`distractor_error_type_${letter}`] = errType;
    q[`distractor_misconception_${letter}`] = misconception;
    q[`distractor_skill_deficit_${letter}`] = deficit;
    updated += 1;
  }
  return { updated_rows: updated };
}

function applyPhaseB(questions, rows) {
  const qById = questionMap(questions);
  let updated = 0;

  for (const row of rows) {
    const id = requireNonEmpty(row.UNIQUEID, 'UNIQUEID', 'phase B row');
    const complexity = requireNonEmpty(row.complexity_rationale, 'complexity_rationale', id);
    const construct = requireNonEmpty(row.construct_actually_tested, 'construct_actually_tested', id);

    const q = qById.get(id);
    if (!q) throw new Error(`UNIQUEID not found in questions.json: ${id}`);

    q.complexity_rationale = complexity;
    q.construct_actually_tested = construct;
    updated += 1;
  }
  return { updated_rows: updated };
}

function applyPhaseC(questions, rows) {
  const qById = questionMap(questions);
  let updated = 0;

  for (const row of rows) {
    const id = requireNonEmpty(row.UNIQUEID, 'UNIQUEID', 'phase C row');
    const dominant = requireNonEmpty(row.dominant_error_pattern, 'dominant_error_pattern', id);
    const tag = requireNonEmpty(row.error_cluster_tag, 'error_cluster_tag', id);
    const flags = requireNonEmpty(row.instructional_red_flags, 'instructional_red_flags', id);

    if (!/^[a-z0-9]+(-[a-z0-9]+){0,3}$/.test(tag)) {
      throw new Error(`Invalid error_cluster_tag "${tag}" for ${id}`);
    }

    const q = qById.get(id);
    if (!q) throw new Error(`UNIQUEID not found in questions.json: ${id}`);

    q.dominant_error_pattern = dominant;
    q.error_cluster_tag = tag;
    q.instructional_red_flags = flags;
    updated += 1;
  }
  return { updated_rows: updated };
}

function applyPhaseD(questions, records) {
  if (!Array.isArray(records)) {
    throw new Error('Phase D input must be a JSON array');
  }

  const bySkill = new Map();
  for (const q of questions) {
    if (!bySkill.has(q.current_skill_id)) bySkill.set(q.current_skill_id, []);
    bySkill.get(q.current_skill_id).push(q);
  }

  let updatedQuestions = 0;
  let updatedSkills = 0;
  for (const rec of records) {
    const skillId = requireNonEmpty(rec.skill_id, 'skill_id', 'phase D record');
    const nasp = requireNonEmpty(rec.nasp_domain_primary, 'nasp_domain_primary', skillId);
    const prereq = requireNonEmpty(rec.skill_prerequisites, 'skill_prerequisites', skillId);
    const narrative = requireNonEmpty(rec.prereq_chain_narrative, 'prereq_chain_narrative', skillId);
    if (!VALID_NASP.has(nasp)) {
      throw new Error(`Invalid nasp_domain_primary "${nasp}" for skill ${skillId}`);
    }
    const skillQuestions = bySkill.get(skillId);
    if (!skillQuestions || skillQuestions.length === 0) {
      throw new Error(`Skill not found in questions.json: ${skillId}`);
    }
    for (const q of skillQuestions) {
      q.nasp_domain_primary = nasp;
      q.skill_prerequisites = prereq;
      q.prereq_chain_narrative = narrative;
      updatedQuestions += 1;
    }
    updatedSkills += 1;
  }

  return { updated_skills: updatedSkills, updated_questions: updatedQuestions };
}

function main() {
  const { phase, file } = parseArgs();
  const questions = loadQuestions();
  let result;

  if (phase === 'A') {
    result = applyPhaseA(questions, parseCsv(file));
  } else if (phase === 'B') {
    result = applyPhaseB(questions, parseCsv(file));
  } else if (phase === 'C') {
    result = applyPhaseC(questions, parseCsv(file));
  } else if (phase === 'D') {
    const json = JSON.parse(readFileSync(file, 'utf-8'));
    result = applyPhaseD(questions, json);
  } else {
    throw new Error(`Unsupported phase: ${phase}`);
  }

  saveQuestions(questions);
  console.log(`Applied phase ${phase} from ${file}`);
  console.log(JSON.stringify(result, null, 2));
}

main();
