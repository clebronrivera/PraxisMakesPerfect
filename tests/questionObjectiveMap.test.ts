import { describe, it, expect } from 'vitest';
import objectiveMap from '../src/data/questionObjectiveMap.json';
import questions from '../src/data/questions.json';
import { skillObjectiveMap } from '../src/data/skillObjectiveMap';
import etsData from '../src/data/ets-content-topics.json';

const ALL_ETS_CODES = new Set<string>();
for (const domain of (etsData as { domains: { sections: { topics: { code: string }[] }[] }[] }).domains) {
  for (const section of domain.sections) {
    for (const topic of section.topics) ALL_ETS_CODES.add(topic.code);
  }
}

const entries = (objectiveMap as { questions: Record<string, { ets_topics: string[]; method: string; verified: boolean }> }).questions;
const VALID_METHODS = new Set(['seeded', 'fallback', 'manual']);
const skillOf = new Map(questions.map((q) => [q.UNIQUEID, q.current_skill_id]));

describe('questionObjectiveMap (seeded objective tags)', () => {
  it('exact ID parity: every question is mapped and no stale/extra ids exist', () => {
    const questionIds = new Set(questions.map((q) => q.UNIQUEID));
    const mapIds = new Set(Object.keys(entries));
    const missing = [...questionIds].filter((id) => !mapIds.has(id));
    const extra = [...mapIds].filter((id) => !questionIds.has(id));
    expect(missing, `unmapped questions (re-run the seeder): ${missing.slice(0, 10).join(', ')}`).toEqual([]);
    expect(extra, `stale map entries (re-run the seeder): ${extra.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it('every assigned code is a real ETS topic', () => {
    const invalid: string[] = [];
    for (const [id, e] of Object.entries(entries)) {
      for (const code of e.ets_topics) if (!ALL_ETS_CODES.has(code)) invalid.push(`${id}:${code}`);
    }
    expect(invalid, `invalid ETS codes: ${invalid.join(', ')}`).toEqual([]);
  });

  it('every assigned code is allowed by the question\'s skill (skillObjectiveMap)', () => {
    const violations: string[] = [];
    for (const [id, e] of Object.entries(entries)) {
      const skill = skillOf.get(id);
      const allowed = new Set(skill ? skillObjectiveMap[skill] ?? [] : []);
      for (const code of e.ets_topics) {
        if (!allowed.has(code)) violations.push(`${id}(${skill}):${code}`);
      }
    }
    expect(violations, `codes outside the skill's objective set: ${violations.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it('every question has 1–2 objectives and a valid method', () => {
    const bad: string[] = [];
    for (const [id, e] of Object.entries(entries)) {
      if (!Array.isArray(e.ets_topics) || e.ets_topics.length < 1 || e.ets_topics.length > 2) {
        bad.push(`${id}: ${e.ets_topics?.length} topics`);
      }
      if (!VALID_METHODS.has(e.method)) bad.push(`${id}: method="${e.method}"`);
      if (e.verified !== false) bad.push(`${id}: verified=${e.verified}`);
    }
    expect(bad, `malformed entries: ${bad.slice(0, 10).join(', ')}`).toEqual([]);
  });

  it('reports provisional-tag metrics (informational, non-failing)', () => {
    const all = Object.values(entries);
    const seeded = all.filter((e) => e.method === 'seeded').length;
    const fallback = all.filter((e) => e.method === 'fallback').length;
    const multi = all.filter((e) => e.ets_topics.length > 1).length;
    const unverified = all.filter((e) => e.verified === false).length;
    // These are provisional, machine-seeded tags — none are human-verified yet.
    // method:"fallback" is the prioritized human-review queue.
    console.info(
      `  ℹ questionObjectiveMap: ${seeded} seeded, ${fallback} fallback, ${multi} multi-tagged, ${unverified} unverified (human-review queue = fallback)`,
    );
    expect(unverified).toBe(all.length); // nothing is verified yet, by design
  });
});
