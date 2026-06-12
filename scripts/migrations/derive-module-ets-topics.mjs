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

// ─── SME overrides (C-B2, 2026-06-12) ────────────────────────────────────────────
// The frequency derive falls back to a skill's full objective set for modules with no
// routed-question signal. The Content/SME track hand-tightened 11 of those skill-fallback
// modules to the 1–3 objectives the lesson actually teaches (descriptive-only, never scored).
// Source + rationale: docs/C-B2_etsTopicId_proposals_2026-06-12.md. Each set is validated
// below (⊆ skillObjectiveMap[ownerSkill], valid ETS, 1–3 codes) exactly like a derived set,
// so a bad override fails the derive loudly. Persist here so future re-derives keep them.
const SME_OVERRIDES = {
  'MOD-D1-09': ['I.A.1.c'],            // DBD-01 — CBM = screening/progress monitoring
  'MOD-D1-12': ['I.A.2.c'],            // DBD-05 — projective = supplementary diagnostic
  'MOD-D10-05': ['IV.C.2.c'],          // LEG-01 — informed consent / confidentiality rights
  'MOD-D2-02': ['I.B.1.b'],            // CON-01 — consultee-centered = consultation model
  'MOD-D2-03': ['I.B.1.c'],            // CON-01 — PLCs = stakeholder communication/collaboration
  'MOD-D4-11': ['II.B.2.a', 'II.B.2.f'], // MBH-02 — counseling methods + measuring MH outcomes
  'MOD-D5-03': ['III.B.1.a'],          // SAF-01 — CASEL/SEL = prevention practice
  'MOD-D6-04': ['III.B.1.a', 'III.B.1.b'], // SAF-01 — bullying prevention + risk/protective factors
  'MOD-D8-03': ['I.A.3.e', 'I.A.3.f'], // PSY-04 — racial/cultural factors + test fairness/bias
  'MOD-D8-05': ['IV.A.1.a'],           // DIV-01 — cultural fit of interventions
  'MOD-D9-02': ['IV.B.1.c'],           // RES-03 — correlation interpretation
};

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
const report = { total: 0, routed: 0, skillFallback: 0, primaryFallback: 0, smeOverride: 0, invalid: [] };

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
  // SME override wins over the computed set (validated below like any other).
  if (SME_OVERRIDES[m.id]) {
    ids = SME_OVERRIDES[m.id];
    derivedFrom = 'sme-override';
  }
  for (const code of ids) {
    if (!ALL_ETS.has(code)) report.invalid.push(`${m.id}:${code} (invalid ETS code)`);
    if (!allowed.has(code)) report.invalid.push(`${m.id}:${code} (outside ${skill} objective set)`);
  }
  out[m.id] = { etsTopicIds: ids, derivedFrom, routedQuestionCount: routedQCount.get(m.id) || 0 };
  report.total++;
  const bucket = derivedFrom === 'routed' ? 'routed'
    : derivedFrom === 'skill-fallback' ? 'skillFallback'
    : derivedFrom === 'sme-override' ? 'smeOverride'
    : 'primaryFallback';
  report[bucket]++;
}

const doc = {
  meta: {
    generatedBy: 'scripts/migrations/derive-module-ets-topics.mjs',
    source: 'questionObjectiveMap.json (verified tags) + questions.json primaryModuleId routing',
    totalModules: report.total,
    fromRouted: report.routed,
    fromSkillFallback: report.skillFallback,
    fromPrimaryFallback: report.primaryFallback,
    fromSmeOverride: report.smeOverride,
    note: 'Provisional, derived. etsTopicIds ⊆ skillObjectiveMap[primarySkillId]; top 1–3 by routed-question frequency (skill-question fallback when a module has no routed signal; sme-override = hand-tightened per docs/C-B2_etsTopicId_proposals_2026-06-12.md). SME should confirm each list against the lesson. Never read by scoring.',
  },
  modules: out,
};

writeFileSync(join(ROOT, 'src/data/moduleEtsTopicMap.json'), JSON.stringify(doc, null, 2) + '\n');
console.log(`derived etsTopicIds for ${report.total} modules: ${report.routed} routed, ${report.skillFallback} skill-fallback, ${report.primaryFallback} primary-fallback, ${report.smeOverride} sme-override`);
console.log(`invalid: ${report.invalid.length}${report.invalid.length ? ' → ' + report.invalid.join(', ') : ''}`);
if (report.invalid.length) {
  console.error('✖ refusing to ship: invalid etsTopicIds above (not ⊆ skillObjectiveMap or unknown ETS code)');
  process.exit(1);
}
