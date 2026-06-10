import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { frameworkRegistry } from '../src/data/frameworkRegistry';
import { progressToMetadataId } from '../src/data/skillIdMap';
import { skillObjectiveMap } from '../src/data/skillObjectiveMap';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Canonical skill IDs ────────────────────────────────────────────────────
const CANONICAL_SKILL_IDS = new Set(Object.keys(progressToMetadataId));

// ── All valid ETS objective IDs across the 45 skills ─────────────────────
const ALL_OBJECTIVE_IDS = new Set(
  Object.values(skillObjectiveMap).flat()
);

describe('frameworkRegistry — structural integrity', () => {
  it('has at least one entry', () => {
    expect(frameworkRegistry.length).toBeGreaterThan(0);
  });

  it('every entry has a non-empty id, name, citation, summary, keyHolding, applicability, and guardedMisconception', () => {
    const bad: string[] = [];
    for (const f of frameworkRegistry) {
      const missing = (['id', 'name', 'citation', 'summary', 'keyHolding', 'applicability', 'guardedMisconception'] as const)
        .filter(k => !f[k]?.trim());
      if (missing.length) bad.push(`${f.id}: missing ${missing.join(', ')}`);
    }
    expect(bad, `entries with missing required text fields: ${bad.join('; ')}`).toEqual([]);
  });

  it('ids are globally unique', () => {
    const ids = frameworkRegistry.map(f => f.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate ids: ${dupes.join(', ')}`).toEqual([]);
  });

  it('every skillId is in the canonical 45', () => {
    const unknown: string[] = [];
    for (const f of frameworkRegistry) {
      for (const sid of f.skillIds) {
        if (!CANONICAL_SKILL_IDS.has(sid)) unknown.push(`${f.id}:${sid}`);
      }
    }
    expect(unknown, `unknown skill ids: ${unknown.join(', ')}`).toEqual([]);
  });

  it('every etsTopicId exists in skillObjectiveMap', () => {
    const unknown: string[] = [];
    for (const f of frameworkRegistry) {
      for (const oid of f.etsTopicIds) {
        if (!ALL_OBJECTIVE_IDS.has(oid)) unknown.push(`${f.id}:${oid}`);
      }
    }
    expect(unknown, `unknown ETS objective ids: ${unknown.join(', ')}`).toEqual([]);
  });

  it('every entry has at least one skillId and one etsTopicId', () => {
    const bad = frameworkRegistry.filter(f => f.skillIds.length === 0 || f.etsTopicIds.length === 0);
    expect(
      bad.map(f => f.id),
      `entries with empty skillIds or etsTopicIds: ${bad.map(f => f.id).join(', ')}`
    ).toEqual([]);
  });

  it('reports coverage (informational)', () => {
    const coveredSkills = new Set(frameworkRegistry.flatMap(f => f.skillIds));
    console.info(
      `  ℹ frameworkRegistry: ${frameworkRegistry.length} entries, ${coveredSkills.size}/45 skills covered`
    );
    expect(frameworkRegistry.length).toBeGreaterThan(0);
  });
});

describe('frameworkRegistry — boundary guard', () => {
  const SCORING_FILES = [
    'src/hooks/useAdaptiveLearning.ts',
    'src/hooks/useProgressTracking.ts',
    'src/brain/learning-state.ts',
    'src/utils/skillProficiency.ts',
    'src/utils/assessmentReport.ts',
    'src/utils/studyPlanPreprocessor.ts',
    'src/utils/questionDifficulty.ts',
  ];

  it('no scoring file imports frameworkRegistry', () => {
    const violators: string[] = [];
    for (const rel of SCORING_FILES) {
      const src = readFileSync(join(root, rel), 'utf8');
      if (/from\s+['"][^'"]*frameworkRegistry['"]/.test(src)) violators.push(rel);
    }
    expect(
      violators,
      `scoring files must not import frameworkRegistry: ${violators.join(', ')}`
    ).toEqual([]);
  });
});
