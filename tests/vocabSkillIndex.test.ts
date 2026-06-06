import { describe, it, expect } from 'vitest';
import {
  skillsForTerm,
  termsForSkill,
  termsForSkills,
  countTermsForScope,
  allDrillSkillIds,
  ALL_DRILL_TERMS,
} from '../src/utils/vocabSkillIndex';

describe('vocabSkillIndex', () => {
  it('exposes a non-empty, lowercase-unique set of drillable terms', () => {
    expect(ALL_DRILL_TERMS.length).toBeGreaterThan(0);
    const lowers = ALL_DRILL_TERMS.map((t) => t.toLowerCase());
    expect(new Set(lowers).size).toBe(lowers.length);
  });

  it('round-trips term → skills → terms', () => {
    const sampleSkill = allDrillSkillIds()[0];
    const terms = termsForSkill(sampleSkill);
    expect(terms.length).toBeGreaterThan(0);
    // each of that skill's terms maps back to include the skill
    for (const term of terms) {
      expect(skillsForTerm(term)).toContain(sampleSkill);
    }
  });

  it('skillsForTerm is case-insensitive', () => {
    const term = ALL_DRILL_TERMS[0];
    expect(skillsForTerm(term.toUpperCase())).toEqual(skillsForTerm(term.toLowerCase()));
  });

  it('returns empty for unknown term / skill', () => {
    expect(skillsForTerm('definitely-not-a-real-term-xyz')).toEqual([]);
    expect(termsForSkill('NO-SUCH-SKILL')).toEqual([]);
  });

  it('countTermsForScope de-dupes terms shared across skills', () => {
    const ids = allDrillSkillIds();
    const naiveSum = ids.reduce((n, id) => n + termsForSkill(id).length, 0);
    const deduped = countTermsForScope(ids);
    // global de-duped count equals the size of the union and never exceeds the naive sum
    expect(deduped).toBe(ALL_DRILL_TERMS.length);
    expect(deduped).toBeLessThanOrEqual(naiveSum);
  });

  it('termsForSkills union contains each member skill\'s terms', () => {
    const ids = allDrillSkillIds().slice(0, 3);
    const union = new Set(termsForSkills(ids).map((t) => t.toLowerCase()));
    for (const id of ids) {
      for (const term of termsForSkill(id)) {
        expect(union.has(term.toLowerCase())).toBe(true);
      }
    }
  });
});
