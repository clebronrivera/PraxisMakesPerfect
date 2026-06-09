import { describe, it, expect } from 'vitest';
import skillExamWeights from '../src/data/skillExamWeights.json';
import { examWeightForSkill } from '../src/utils/moduleCatalog';
import { PROGRESS_SKILLS } from '../src/utils/progressTaxonomy';
import { skillObjectiveMap } from '../src/data/skillObjectiveMap';

const doc = skillExamWeights as {
  meta: { categoryWeights: Record<string, number>; skillsInCategory: Record<string, number> };
  skills: Record<string, { examWeight: number; category: string; categoryWeightPct: number; skillsInCategory: number }>;
};
const CANONICAL = PROGRESS_SKILLS.map((s) => s.skillId);

describe('skillExamWeights (blueprint-anchored exam weights)', () => {
  it('covers exactly the 45 canonical skills', () => {
    const keys = new Set(Object.keys(doc.skills));
    const missing = CANONICAL.filter((s) => !keys.has(s));
    const extra = [...keys].filter((s) => !CANONICAL.includes(s));
    expect(missing, `missing: ${missing.join(', ')}`).toEqual([]);
    expect(extra, `extra: ${extra.join(', ')}`).toEqual([]);
  });

  it('uses the official Praxis 5403 content-category weights', () => {
    expect(doc.meta.categoryWeights).toEqual({ I: 0.32, II: 0.23, III: 0.2, IV: 0.25 });
  });

  it("each skill's category matches the Roman prefix of its objectives", () => {
    const bad: string[] = [];
    for (const s of CANONICAL) {
      const cats = [...new Set((skillObjectiveMap[s] ?? []).map((c) => c.split('.')[0]))];
      if (cats.length !== 1) bad.push(`${s} spans ${cats.join('/')}`);
      else if (doc.skills[s].category !== cats[0]) bad.push(`${s}: map=${doc.skills[s].category} objectives=${cats[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it('all weights are positive and normalized to mean 1', () => {
    const vals = Object.values(doc.skills).map((v) => v.examWeight);
    expect(vals.every((w) => w > 0)).toBe(true);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    expect(mean).toBeCloseTo(1, 2);
  });

  it('within a category, every skill gets the same weight (equal split)', () => {
    const byCat: Record<string, Set<number>> = {};
    for (const v of Object.values(doc.skills)) (byCat[v.category] ??= new Set()).add(v.examWeight);
    for (const [cat, weights] of Object.entries(byCat)) {
      expect(weights.size, `category ${cat} has differing weights`).toBe(1);
    }
  });

  it('examWeightForSkill reads the map; unknown skill falls back to 1', () => {
    for (const s of CANONICAL) expect(examWeightForSkill(s)).toBe(doc.skills[s].examWeight);
    expect(examWeightForSkill('ZZZ-99')).toBe(1);
  });
});
