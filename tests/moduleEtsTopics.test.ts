import { describe, it, expect } from 'vitest';
import { LEARNING_MODULES } from '../src/data/learningModules';
import moduleEtsTopicMap from '../src/data/moduleEtsTopicMap.json';
import { skillObjectiveMap } from '../src/data/skillObjectiveMap';
import etsData from '../src/data/ets-content-topics.json';

const ALL_ETS_CODES = new Set<string>();
for (const domain of (etsData as { domains: { sections: { topics: { code: string }[] }[] }[] }).domains) {
  for (const section of domain.sections) {
    for (const topic of section.topics) ALL_ETS_CODES.add(topic.code);
  }
}

const map = (moduleEtsTopicMap as {
  modules: Record<string, { etsTopicIds: string[]; derivedFrom: string; routedQuestionCount: number }>;
}).modules;

describe('moduleEtsTopicMap (Pack 4 — derived module objectives)', () => {
  it('exact parity: every module has an entry and there are no stale entries', () => {
    const moduleIds = new Set(LEARNING_MODULES.map((m) => m.id));
    const mapIds = new Set(Object.keys(map));
    const missing = [...moduleIds].filter((id) => !mapIds.has(id));
    const stale = [...mapIds].filter((id) => !moduleIds.has(id));
    expect(missing, `modules with no derived entry (re-run derive-module-ets-topics): ${missing.join(', ')}`).toEqual([]);
    expect(stale, `stale map entries (re-run derive-module-ets-topics): ${stale.join(', ')}`).toEqual([]);
  });

  it('every module has 1–3 objective ids, all real ETS codes', () => {
    const bad: string[] = [];
    for (const [id, e] of Object.entries(map)) {
      if (!Array.isArray(e.etsTopicIds) || e.etsTopicIds.length < 1 || e.etsTopicIds.length > 3) {
        bad.push(`${id}: ${e.etsTopicIds?.length} ids`);
      }
      for (const code of e.etsTopicIds ?? []) {
        if (!ALL_ETS_CODES.has(code)) bad.push(`${id}: invalid code ${code}`);
      }
    }
    expect(bad, `malformed entries: ${bad.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it("every module's etsTopicIds ⊆ skillObjectiveMap[primarySkillId]", () => {
    const owner = new Map(LEARNING_MODULES.map((m) => [m.id, m.primarySkillId]));
    const violations: string[] = [];
    for (const [id, e] of Object.entries(map)) {
      const skill = owner.get(id);
      const allowed = new Set(skill ? skillObjectiveMap[skill] ?? [] : []);
      for (const code of e.etsTopicIds ?? []) {
        if (!allowed.has(code)) violations.push(`${id}(${skill}):${code}`);
      }
    }
    expect(violations, `objectives outside the owner skill's set: ${violations.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it('the derived ids are wired onto the live LEARNING_MODULES objects', () => {
    const mismatches: string[] = [];
    for (const m of LEARNING_MODULES) {
      const expected = map[m.id]?.etsTopicIds ?? [];
      const actual = m.etsTopicIds ?? [];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        mismatches.push(`${m.id}: module=${JSON.stringify(actual)} map=${JSON.stringify(expected)}`);
      }
    }
    expect(mismatches, `module.etsTopicIds out of sync with the map: ${mismatches.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('reports derivation provenance (informational)', () => {
    const all = Object.values(map);
    const routed = all.filter((e) => e.derivedFrom === 'routed').length;
    const skillFallback = all.filter((e) => e.derivedFrom === 'skill-fallback').length;
    const primaryFallback = all.filter((e) => e.derivedFrom === 'primary-fallback').length;
    const smeOverride = all.filter((e) => e.derivedFrom === 'sme-override').length;
    console.info(
      `  ℹ moduleEtsTopicMap: ${all.length} modules — ${routed} routed, ${skillFallback} skill-fallback, ${primaryFallback} primary-fallback, ${smeOverride} sme-override`,
    );
    expect(routed + skillFallback + primaryFallback + smeOverride).toBe(all.length);
  });
});
