/**
 * Migration: derive src/data/moduleEtsTopicMap.json  (Pack 4)
 *
 * Populates each learning module's ETS objective ids (`etsTopicIds`) — the question→objective→
 * lesson connection. For every module it aggregates the VERIFIED objective tags
 * (questionObjectiveMap.json, method:"manual") of the questions that route to it
 * (questions.json `primaryModuleId`), restricted to the module owner skill's objective set
 * (skillObjectiveMap[primarySkillId]), and keeps the top 1–3 by frequency.
 *
 * Modules with no routed-question signal (e.g. the 9 Pack-2 modules — no question's
 * primaryModuleId points at them yet) fall back to the objectives the owner skill's own
 * questions most test. So every module gets 1–3 ids, all ⊆ skillObjectiveMap[primarySkillId].
 *
 * Output is a SEPARATE generated map (not inlined into learningModules.ts literals, so
 * re-derivation never churns that 1,700-line file). It is provisional and SME-confirmable;
 * it is NEVER read by scoring/mastery logic.
 *
 * Run (imports TS, so use tsx):
 *   npx tsx scripts/migrations/derive-module-ets-topics.mjs
 *
 * Deterministic: modules sorted by id; codes by count desc then code asc. No Date/random.
 * Re-run whenever questionObjectiveMap.json or the module list changes (coverage test fails
 * loudly if stale). moduleRefs (secondary references) are intentionally NOT used — only the
 * primary routing signal, to keep attribution clean.
 *
 * Writes: src/data/moduleEtsTopicMap.json — committed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { skillObjectiveMap, primaryObjectiveBySkill } from '../../src/data/skillObjectiveMap.ts';
import { LEARNING_MODULES } from '../../src/data/learningModules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const questions = JSON.parse(readFileSync(join(ROOT, 'src/data/questions.json'), 'utf-8'));
const objMap = JSON.parse(readFileSync(join(ROOT, 'src/data/questionObjectiveMap.json'), 'utf-8')).questions;
const etsData = JSON.parse(readFileSync(join(ROOT, 'src/data/ets-content-topics.json'), 'utf-8'));

const ALL_ETS = new Set();
for (const d of etsData.domains) for (const s of d.sections) for (const t of s.topics) ALL_ETS.add(t.code);

const TOP_N = 3;
const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);

// ─── Tally objective frequencies, by routed module and by skill (fallback) ───────
const routedByModule = new Map(); // moduleId → Map<code, count>
const routedQCount = new Map();   // moduleId → #questions routing here (primaryModuleId)
const bySkill = new Map();        // skillId → Map<code, count>  (Pack-1 codes ⊆ skill's set)
for (const q of questions) {
  const tags = objMap[q.UNIQUEID]?.ets_topics || [];
  const mod = q.primaryModuleId;
  if (mod) {
    routedQCount.set(mod, (routedQCount.get(mod) || 0) + 1);
    if (!routedByModule.has(mod)) routedByModule.set(mod, new Map());
    for (const code of tags) inc(routedByModule.get(mod), code);
  }
  const skill = q.current_skill_id;
  if (skill) {
    if (!bySkill.has(skill)) bySkill.set(skill, new Map());
    for (const code of tags) inc(bySkill.get(skill), code);
  }
}

const topCodes = (counts, allowed) =>
  [...counts.entries()]
    .filter(([code]) => allowed.has(code))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, TOP_N)
    .map(([code]) => code);

// ─── Per module: routed signal → skill fallback → primary objective ──────────────
const sorted = [...LEARNING_MODULES].sort((a, b) => (a.id < b.id ? -1 : 1));
const out = {};
const report = { total: 0, routed: 0, skillFallback: 0, primaryFallback: 0, invalid: [] };

for (const m of sorted) {
  const skill = m.primarySkillId;
  const allowed = new Set(skillObjectiveMap[skill] || []);
  let ids = topCodes(routedByModule.get(m.id) || new Map(), allowed);
  let derivedFrom = 'routed';
  if (ids.length === 0) {
    ids = topCodes(bySkill.get(skill) || new Map(), allowed);
    derivedFrom = 'skill-fallback';
  }
  if (ids.length === 0) {
    const fb = primaryObjectiveBySkill[skill] || (skillObjectiveMap[skill] || [])[0];
    ids = fb ? [fb] : [];
    derivedFrom = 'primary-fallback';
  }
  for (const code of ids) {
    if (!ALL_ETS.has(code)) report.invalid.push(`${m.id}:${code} (invalid ETS code)`);
    if (!allowed.has(code)) report.invalid.push(`${m.id}:${code} (outside ${skill} objective set)`);
  }
  out[m.id] = { etsTopicIds: ids, derivedFrom, routedQuestionCount: routedQCount.get(m.id) || 0 };
  report.total++;
  report[derivedFrom === 'routed' ? 'routed' : derivedFrom === 'skill-fallback' ? 'skillFallback' : 'primaryFallback']++;
}

const doc = {
  meta: {
    generatedBy: 'scripts/migrations/derive-module-ets-topics.mjs',
    source: 'questionObjectiveMap.json (verified tags) + questions.json primaryModuleId routing',
    totalModules: report.total,
    fromRouted: report.routed,
    fromSkillFallback: report.skillFallback,
    fromPrimaryFallback: report.primaryFallback,
    note: 'Provisional, derived. etsTopicIds ⊆ skillObjectiveMap[primarySkillId]; top 1–3 by routed-question frequency (skill-question fallback when a module has no routed signal). SME should confirm each list against the lesson. Never read by scoring.',
  },
  modules: out,
};

writeFileSync(join(ROOT, 'src/data/moduleEtsTopicMap.json'), JSON.stringify(doc, null, 2) + '\n');
console.log(`derived etsTopicIds for ${report.total} modules: ${report.routed} routed, ${report.skillFallback} skill-fallback, ${report.primaryFallback} primary-fallback`);
console.log(`invalid: ${report.invalid.length}${report.invalid.length ? ' → ' + report.invalid.join(', ') : ''}`);
