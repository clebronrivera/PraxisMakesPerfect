#!/usr/bin/env node
/**
 * content-authoring-multi-agent.mjs
 *
 * Builds a concrete multi-agent execution manifest and extraction packets
 * aligned with docs/CONTENT_AUTHORING_HANDOFF.md priority guidance.
 *
 * Usage:
 *   node scripts/content-authoring-multi-agent.mjs plan
 *   node scripts/content-authoring-multi-agent.mjs plan --top=8 --gaps-only
 *   node scripts/content-authoring-multi-agent.mjs plan --skills=MBH-03,LEG-02
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const questionsPath = join(repoRoot, 'src/data/questions.json');
const outputRoot = join(repoRoot, 'content-authoring/output');
const planDir = join(repoRoot, 'content-authoring/plan');
const packetsDir = join(planDir, 'packets');
const manifestsDir = join(planDir, 'manifests');

const DEFAULT_PRIORITY = [
  'MBH-03',
  'LEG-02',
  'CON-01',
  'DBD-03',
  'ETH-01',
  'DBD-01',
  'SAF-03',
  'SWP-04'
];

const LANE_RULES = [
  {
    lane: 'agent-1-clinical',
    phases: ['A', 'B', 'C'],
    skillPrefixes: ['MBH', 'SAF', 'PSY']
  },
  {
    lane: 'agent-2-legal-ethics',
    phases: ['A', 'B', 'C'],
    skillPrefixes: ['LEG', 'ETH']
  },
  {
    lane: 'agent-3-data-academic-systems',
    phases: ['A', 'B', 'C'],
    skillPrefixes: ['DBD', 'ACA', 'SWP', 'RES', 'DIV', 'DEV', 'FAM', 'CON']
  },
  {
    lane: 'agent-4-phase-d-standards',
    phases: ['D'],
    skillPrefixes: []
  }
];

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'plan';
  const flags = new Map();

  for (const arg of args.slice(1)) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.replace(/^--/, '').split('=');
    flags.set(k, v ?? 'true');
  }

  return {
    command,
    gapsOnly: flags.get('gaps-only') === 'true',
    top: flags.has('top') ? Number(flags.get('top')) : null,
    skills: flags.has('skills')
      ? flags
          .get('skills')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null
  };
}

function loadQuestions() {
  return JSON.parse(readFileSync(questionsPath, 'utf-8'));
}

function ensureDirs() {
  mkdirSync(join(outputRoot, 'phase-A'), { recursive: true });
  mkdirSync(join(outputRoot, 'phase-B'), { recursive: true });
  mkdirSync(join(outputRoot, 'phase-C'), { recursive: true });
  mkdirSync(join(outputRoot, 'phase-D'), { recursive: true });
  mkdirSync(planDir, { recursive: true });
  mkdirSync(packetsDir, { recursive: true });
  mkdirSync(manifestsDir, { recursive: true });
}

function getCorrectSet(q) {
  return new Set(
    (q.correct_answers || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function getWrongOptions(q) {
  const correct = getCorrectSet(q);
  return ['A', 'B', 'C', 'D', 'E', 'F'].filter(
    (l) => q[l] && q[l].trim() && q[l] !== 'UNUSED' && !correct.has(l)
  );
}

function isClassified(q, letter) {
  const tier = q[`distractor_tier_${letter}`];
  const errType = q[`distractor_error_type_${letter}`];
  const misc = q[`distractor_misconception_${letter}`];
  const deficit = q[`distractor_skill_deficit_${letter}`];
  const hasRealTier = tier && tier !== '' && !tier.startsWith('CORRECT') && !tier.startsWith('UNUSED');
  const hasRealErr = errType && errType !== '' && errType !== 'CORRECT' && errType !== 'UNUSED';
  const hasRealMisc =
    misc &&
    misc !== '' &&
    misc !== 'CORRECT' &&
    misc !== 'UNUSED' &&
    !misc.startsWith('Student mistakenly selects an option related to');
  const hasRealDeficit = deficit && deficit !== '' && deficit !== 'CORRECT' && deficit !== 'UNUSED';
  return hasRealTier && hasRealErr && hasRealMisc && hasRealDeficit;
}

function hasPhaseBGap(q) {
  return !q.complexity_rationale?.trim() || !q.construct_actually_tested?.trim();
}

function hasPhaseCGap(q) {
  return !q.dominant_error_pattern?.trim() || !q.error_cluster_tag?.trim() || !q.instructional_red_flags?.trim();
}

function hasPhaseAGap(q) {
  return getWrongOptions(q).some((l) => !isClassified(q, l));
}

function deriveSkillStats(questions) {
  const bySkill = new Map();
  for (const q of questions) {
    const skill = q.current_skill_id;
    if (!bySkill.has(skill)) {
      bySkill.set(skill, {
        skill_id: skill,
        question_count: 0,
        phaseA_question_gaps: 0,
        phaseA_slot_gaps: 0,
        phaseB_question_gaps: 0,
        phaseC_question_gaps: 0,
        has_phaseD_gap: false
      });
    }
    const row = bySkill.get(skill);
    row.question_count += 1;
    if (hasPhaseAGap(q)) {
      row.phaseA_question_gaps += 1;
      row.phaseA_slot_gaps += getWrongOptions(q).filter((l) => !isClassified(q, l)).length;
    }
    if (hasPhaseBGap(q)) row.phaseB_question_gaps += 1;
    if (hasPhaseCGap(q)) row.phaseC_question_gaps += 1;
    if (!q.nasp_domain_primary?.trim() || !q.skill_prerequisites?.trim() || !q.prereq_chain_narrative?.trim()) {
      row.has_phaseD_gap = true;
    }
  }
  return [...bySkill.values()];
}

function selectSkills(stats, opts) {
  if (opts.skills?.length) return opts.skills;
  if (opts.top) {
    return [...stats]
      .sort((a, b) => b.phaseA_slot_gaps - a.phaseA_slot_gaps)
      .slice(0, opts.top)
      .map((s) => s.skill_id);
  }
  return DEFAULT_PRIORITY;
}

function laneForSkill(skillId, phase) {
  if (phase === 'D') return 'agent-4-phase-d-standards';
  const prefix = skillId.split('-')[0];
  const lane = LANE_RULES.find((l) => l.skillPrefixes.includes(prefix));
  return lane ? lane.lane : 'agent-3-data-academic-systems';
}

function writePhasePacket(skill, phase, questionsForSkill, gapsOnly) {
  let rows = questionsForSkill;
  if (phase === 'A' && gapsOnly) rows = rows.filter(hasPhaseAGap);
  if (phase === 'B' && gapsOnly) rows = rows.filter(hasPhaseBGap);
  if (phase === 'C' && gapsOnly) rows = rows.filter(hasPhaseCGap);

  const packet = {
    phase,
    skill_id: skill,
    gaps_only: gapsOnly,
    question_count: rows.length,
    unique_ids: rows.map((q) => q.UNIQUEID)
  };

  const outPath = join(packetsDir, `${skill}-phase-${phase}.json`);
  writeFileSync(outPath, JSON.stringify(packet, null, 2));
  return {
    phase,
    skill_id: skill,
    packet_file: `content-authoring/plan/packets/${skill}-phase-${phase}.json`,
    question_count: rows.length,
    output_file: `content-authoring/output/phase-${phase}/${skill}-phase-${phase}.csv`,
    lane: laneForSkill(skill, phase)
  };
}

function runPlan(opts) {
  ensureDirs();
  const questions = loadQuestions();
  const stats = deriveSkillStats(questions);
  const selectedSkills = selectSkills(stats, opts);
  const bySkill = new Map(stats.map((s) => [s.skill_id, s]));
  const questionBySkill = new Map();

  for (const q of questions) {
    const k = q.current_skill_id;
    if (!questionBySkill.has(k)) questionBySkill.set(k, []);
    questionBySkill.get(k).push(q);
  }

  const tasks = [];
  for (const skill of selectedSkills) {
    const rows = questionBySkill.get(skill) || [];
    tasks.push(writePhasePacket(skill, 'A', rows, opts.gapsOnly));
    tasks.push(writePhasePacket(skill, 'B', rows, opts.gapsOnly));
    tasks.push(writePhasePacket(skill, 'C', rows, opts.gapsOnly));
  }

  const phaseDSkills = stats.filter((s) => s.has_phaseD_gap).map((s) => s.skill_id);
  tasks.push({
    phase: 'D',
    skill_id: 'ALL',
    packet_file: 'content-authoring/plan/packets/ALL-phase-D.json',
    question_count: 0,
    output_file: 'content-authoring/output/phase-D/all-skills-phase-D.json',
    lane: 'agent-4-phase-d-standards',
    skill_count: phaseDSkills.length
  });
  writeFileSync(
    join(packetsDir, 'ALL-phase-D.json'),
    JSON.stringify({ phase: 'D', skills: phaseDSkills, skill_count: phaseDSkills.length }, null, 2)
  );

  const manifest = {
    generated_at: new Date().toISOString(),
    mode: 'plan',
    gaps_only: opts.gapsOnly,
    selected_skills: selectedSkills,
    selected_skill_stats: selectedSkills.map((id) => bySkill.get(id)).filter(Boolean),
    tasks
  };

  const fileName = `content-authoring-manifest-${Date.now()}.json`;
  writeFileSync(join(manifestsDir, fileName), JSON.stringify(manifest, null, 2));

  console.log(`Created manifest: content-authoring/plan/manifests/${fileName}`);
  console.log(`Selected skills: ${selectedSkills.join(', ')}`);
  console.log(`Tasks generated: ${tasks.length}`);
}

function main() {
  const opts = parseArgs();
  if (opts.command !== 'plan') {
    console.error(`Unsupported command: ${opts.command}`);
    process.exit(1);
  }
  runPlan(opts);
}

main();
