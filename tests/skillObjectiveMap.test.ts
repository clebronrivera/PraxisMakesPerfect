import { describe, it, expect } from 'vitest';
import {
  skillObjectiveMap,
  primaryObjectiveBySkill,
  ALL_MAPPED_CODES,
} from '../src/data/skillObjectiveMap';
import { PROGRESS_SKILLS } from '../src/utils/progressTaxonomy';
import etsData from '../src/data/ets-content-topics.json';

// ─── Reference data derived from the canonical ETS outline ──────────────────────
const ALL_ETS_CODES = new Set<string>();
for (const domain of (etsData as { domains: { sections: { topics: { code: string }[] }[] }[] }).domains) {
  for (const section of domain.sections) {
    for (const topic of section.topics) ALL_ETS_CODES.add(topic.code);
  }
}

const PREFIX_TO_DOMAIN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
const prefixOf = (code: string) => code.split('.')[0];
const skillDomain: Record<string, number> = Object.fromEntries(
  PROGRESS_SKILLS.map((s) => [s.skillId, s.domainId]),
);

describe('skillObjectiveMap coverage invariants', () => {
  it('the ETS outline has exactly 79 topics', () => {
    expect(ALL_ETS_CODES.size).toBe(79);
  });

  it('all 45 progress skills are mapped with at least one objective', () => {
    const missing = PROGRESS_SKILLS.map((s) => s.skillId).filter(
      (id) => !skillObjectiveMap[id] || skillObjectiveMap[id].length === 0,
    );
    expect(missing, `skills with no objective: ${missing.join(', ')}`).toEqual([]);
  });

  it('the map contains no unknown skill keys', () => {
    const validSkills = new Set(PROGRESS_SKILLS.map((s) => s.skillId));
    const unknown = Object.keys(skillObjectiveMap).filter((id) => !validSkills.has(id));
    expect(unknown, `unknown skill keys: ${unknown.join(', ')}`).toEqual([]);
  });

  it('every mapped ETS code is a real topic in ets-content-topics.json', () => {
    const invalid: string[] = [];
    for (const [skill, codes] of Object.entries(skillObjectiveMap)) {
      for (const code of codes) if (!ALL_ETS_CODES.has(code)) invalid.push(`${skill}:${code}`);
    }
    expect(invalid, `invalid ETS codes: ${invalid.join(', ')}`).toEqual([]);
  });

  it('every skill maps only to objectives in its own app domain', () => {
    const crossDomain: string[] = [];
    for (const [skill, codes] of Object.entries(skillObjectiveMap)) {
      const expectedDomain = skillDomain[skill];
      for (const code of codes) {
        if (PREFIX_TO_DOMAIN[prefixOf(code)] !== expectedDomain) {
          crossDomain.push(`${skill}(D${expectedDomain})→${code}`);
        }
      }
    }
    expect(crossDomain, `cross-domain mappings: ${crossDomain.join(', ')}`).toEqual([]);
  });

  it('every one of the 79 ETS topics is owned by at least one skill', () => {
    const owned = new Set(ALL_MAPPED_CODES);
    const orphans = [...ALL_ETS_CODES].filter((code) => !owned.has(code));
    expect(orphans, `unowned ETS topics: ${orphans.join(', ')}`).toEqual([]);
  });

  it('ALL_MAPPED_CODES is exactly the 79 ETS codes, de-duplicated', () => {
    expect(new Set(ALL_MAPPED_CODES).size).toBe(ALL_MAPPED_CODES.length); // no dupes
    expect(ALL_MAPPED_CODES.length).toBe(79);
  });

  it('primaryObjectiveBySkill covers all 45 skills, each value valid and within its array', () => {
    for (const skill of PROGRESS_SKILLS.map((s) => s.skillId)) {
      const primary = primaryObjectiveBySkill[skill];
      expect(primary, `${skill} has no primary objective`).toBeTruthy();
      expect(ALL_ETS_CODES.has(primary), `${skill} primary ${primary} is not a real ETS code`).toBe(true);
      expect(
        skillObjectiveMap[skill].includes(primary),
        `${skill} primary ${primary} is not in its skillObjectiveMap array`,
      ).toBe(true);
    }
  });

  it('every array lists its primary objective first (array-order convention)', () => {
    for (const [skill, codes] of Object.entries(skillObjectiveMap)) {
      expect(codes[0], `${skill} array[0] should equal its primary`).toBe(primaryObjectiveBySkill[skill]);
    }
  });
});
