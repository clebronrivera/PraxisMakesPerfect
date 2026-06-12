import { describe, it, expect } from 'vitest';
import {
  LEARNING_MODULES,
  SKILL_MODULE_MAP,
  MODULE_PRIMARY_OVERRIDES,
} from '../src/data/learningModules';
import { PROGRESS_SKILLS } from '../src/utils/progressTaxonomy';

const VALID_SKILLS = new Set(PROGRESS_SKILLS.map((s) => s.skillId));

// module id → skills that reference it anywhere in SKILL_MODULE_MAP (the many-to-many index)
const referencedBy = new Map<string, string[]>();
for (const [skill, moduleIds] of Object.entries(SKILL_MODULE_MAP)) {
  for (const mid of moduleIds) {
    if (!referencedBy.has(mid)) referencedBy.set(mid, []);
    referencedBy.get(mid)!.push(skill);
  }
}

describe('module primarySkillId', () => {
  it('every module declares a primarySkillId that is a valid progress skill', () => {
    const bad = LEARNING_MODULES.filter((m) => !m.primarySkillId || !VALID_SKILLS.has(m.primarySkillId));
    expect(
      bad.map((m) => `${m.id}:${m.primarySkillId}`),
      'modules with missing/invalid primarySkillId',
    ).toEqual([]);
  });

  it('every module is referenced by at least one skill in SKILL_MODULE_MAP (no orphans)', () => {
    const orphans = LEARNING_MODULES.filter((m) => !(referencedBy.get(m.id)?.length));
    expect(orphans.map((m) => m.id), 'orphan modules').toEqual([]);
  });

  it('primarySkillId references the module, or is a documented curated override', () => {
    // Preserves many-to-many: a curated owner may differ from the volume default, but only
    // with an explicit rationale (and it must still be one of the referencing skills).
    const violations: string[] = [];
    for (const m of LEARNING_MODULES) {
      const refs = referencedBy.get(m.id) ?? [];
      if (refs.includes(m.primarySkillId)) continue; // owner references the module — fine
      const override = MODULE_PRIMARY_OVERRIDES[m.id];
      if (!override || !override.rationale || override.skillId !== m.primarySkillId) {
        violations.push(`${m.id}: owner ${m.primarySkillId} not in [${refs.join(',')}] and no override rationale`);
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('every curated override is valid, has a rationale, and stays within the referencing skills', () => {
    for (const [moduleId, ov] of Object.entries(MODULE_PRIMARY_OVERRIDES)) {
      const module = LEARNING_MODULES.find((m) => m.id === moduleId);
      expect(module, `override targets unknown module ${moduleId}`).toBeTruthy();
      expect(module!.primarySkillId, `${moduleId} primarySkillId must match its override`).toBe(ov.skillId);
      expect(VALID_SKILLS.has(ov.skillId), `${moduleId} override skill invalid`).toBe(true);
      expect(ov.rationale.length, `${moduleId} override needs a rationale`).toBeGreaterThan(0);
      expect(referencedBy.get(moduleId)?.includes(ov.skillId), `${moduleId} override must be a referencing skill`).toBe(true);
    }
  });
});
