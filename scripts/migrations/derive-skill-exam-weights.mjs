/**
 * Migration: derive src/data/skillExamWeights.json
 *
 * Replaces the `examWeight === SKILL_BLUEPRINT.slots` proxy in moduleCatalog (slots are the
 * diagnostic's 1–2 question budget, NOT an exam-blueprint weight — it underweights high-stakes
 * domains like Mental/Behavioral Health). Instead, anchor examWeight to the REAL Praxis 5403
 * blueprint.
 *
 * Source (authoritative): ETS "The Praxis Study Companion — School Psychologist (5403)",
 * Test at a Glance, content-category weights (125 selected-response questions):
 *   I.   Professional Practices that Permeate All Aspects of Service Delivery   40 q  32%
 *   II.  Direct & Indirect Services — Student-Level Services                    28 q  23%
 *   III. Direct & Indirect Services — Systems-Level Services                    25 q  20%
 *   IV.  Foundations of School Psychological Service Delivery                   32 q  25%
 * The ETS objective codes carry these as their leading Roman numeral (I/II/III/IV), and every
 * skill's objectives sit in exactly one category (verified), so each skill maps to one category.
 *
 * Rollup. ETS publishes weights ONLY at the 4-category level — no per-skill or per-domain split —
 * so we distribute each category's weight EQUALLY across its skills (the most defensible sub-split;
 * question-bank volume is an authoring artifact, not a blueprint signal). Result is normalized to
 * mean 1 across the 45 skills, so it stays in the old slots scale and the existing
 * `defaultExamWeight: 1` fallback sits at the average.
 *
 *   examWeight(skill) = (categoryWeight[cat] / #skillsInCategory[cat]) / mean(allRaw)
 *
 * Run:  npx tsx scripts/migrations/derive-skill-exam-weights.mjs
 * Deterministic: skills sorted; no Date/random. Writes: src/data/skillExamWeights.json — committed.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { skillObjectiveMap } from '../../src/data/skillObjectiveMap.ts';
import { PROGRESS_SKILLS } from '../../src/utils/progressTaxonomy.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Official ETS Praxis 5403 content-category weights (Test at a Glance).
const CATEGORY_WEIGHT = { I: 0.32, II: 0.23, III: 0.20, IV: 0.25 };

const skills = PROGRESS_SKILLS.map((s) => s.skillId).sort();

// Category per skill = leading Roman numeral of its objectives (single-category, verified).
const categoryOf = {};
const offenders = [];
for (const s of skills) {
  const cats = [...new Set((skillObjectiveMap[s] || []).map((c) => c.split('.')[0]))];
  if (cats.length !== 1 || !(cats[0] in CATEGORY_WEIGHT)) offenders.push(`${s}: [${cats.join(',')}]`);
  categoryOf[s] = cats[0];
}
if (offenders.length) {
  console.error('✖ skills not in exactly one valid category:', offenders.join(' | '));
  process.exit(1);
}

const skillsInCategory = { I: 0, II: 0, III: 0, IV: 0 };
for (const s of skills) skillsInCategory[categoryOf[s]]++;

const raw = {};
for (const s of skills) raw[s] = CATEGORY_WEIGHT[categoryOf[s]] / skillsInCategory[categoryOf[s]];
const mean = Object.values(raw).reduce((a, b) => a + b, 0) / skills.length;

const out = {};
for (const s of skills) {
  out[s] = {
    examWeight: +(raw[s] / mean).toFixed(3),
    category: categoryOf[s],
    categoryWeightPct: Math.round(CATEGORY_WEIGHT[categoryOf[s]] * 100),
    skillsInCategory: skillsInCategory[categoryOf[s]],
  };
}

const doc = {
  meta: {
    generatedBy: 'scripts/migrations/derive-skill-exam-weights.mjs',
    source: 'ETS Praxis 5403 Study Companion — Test at a Glance content-category weights (I 32%, II 23%, III 20%, IV 25%)',
    method: 'category weight ÷ #skills-in-category, normalized to mean 1 across the 45 skills',
    categoryWeights: CATEGORY_WEIGHT,
    skillsInCategory,
    totalSkills: skills.length,
    note: 'Blueprint-anchored relative exam weight per skill. Feeds moduleCatalog priorityScore (examWeight × gap × learnability) — ranking only, never mastery scoring. ETS does not publish below-category weights, so within a category skills are weighted equally.',
  },
  skills: out,
};

writeFileSync(join(ROOT, 'src/data/skillExamWeights.json'), JSON.stringify(doc, null, 2) + '\n');
const vals = Object.values(out).map((o) => o.examWeight).sort((a, b) => a - b);
console.log(`derived exam weights for ${skills.length} skills | category sizes ${JSON.stringify(skillsInCategory)}`);
console.log(`examWeight range ${vals[0]}–${vals[vals.length - 1]} (mean 1.0 by construction)`);
