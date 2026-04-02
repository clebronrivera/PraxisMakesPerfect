import { describe, it, expect } from 'vitest';
import { getSkillPhaseDEntry, skillPhaseDMap } from '../src/data/skillPhaseDLookup';

describe('skillPhaseDLookup', () => {
  it('getSkillPhaseDEntry returns an object with all 4 fields for ACA-02', () => {
    const entry = getSkillPhaseDEntry('ACA-02');
    expect(entry).toBeDefined();
    expect(entry).toHaveProperty('skill_id');
    expect(entry).toHaveProperty('nasp_domain_primary');
    expect(entry).toHaveProperty('skill_prerequisites');
    expect(entry).toHaveProperty('prereq_chain_narrative');
  });

  it('getSkillPhaseDEntry returns undefined for nonexistent skill', () => {
    expect(getSkillPhaseDEntry('NONEXISTENT')).toBeUndefined();
  });

  it('all 45 skills are accessible in skillPhaseDMap', () => {
    expect(Object.keys(skillPhaseDMap).length).toBe(45);
  });

  it('every entry has non-empty nasp_domain_primary', () => {
    for (const [skillId, entry] of Object.entries(skillPhaseDMap)) {
      expect(entry.nasp_domain_primary, `${skillId} has empty nasp_domain_primary`).toBeTruthy();
    }
  });
});
