import { describe, it, expect } from 'vitest';
import { prereqGraph, getPrereqDepth } from '../src/data/skillPrereqGraph';
import { PROGRESS_SKILLS } from '../src/utils/progressTaxonomy';

const CANONICAL = new Set(PROGRESS_SKILLS.map((s) => s.skillId));

describe('skillPrereqGraph — structure (re-keyed to the 45 canonical skills)', () => {
  it('keys are exactly the 45 canonical skills — no phantom or missing entries', () => {
    const keys = new Set(Object.keys(prereqGraph));
    const phantom = [...keys].filter((k) => !CANONICAL.has(k));
    const missing = [...CANONICAL].filter((k) => !keys.has(k));
    expect(phantom, `phantom keys (not real skills): ${phantom.join(', ')}`).toEqual([]);
    expect(missing, `missing skills (no entry): ${missing.join(', ')}`).toEqual([]);
    expect(keys.size).toBe(45);
  });

  it('every prerequisite edge points to a canonical skill (no dangling refs)', () => {
    const bad: string[] = [];
    for (const [skill, deps] of Object.entries(prereqGraph)) {
      for (const dep of deps) if (!CANONICAL.has(dep)) bad.push(`${skill} -> ${dep}`);
    }
    expect(bad, `edges to non-canonical skills: ${bad.join(', ')}`).toEqual([]);
  });

  it('has no self-edges and no duplicate prerequisites', () => {
    const bad: string[] = [];
    for (const [skill, deps] of Object.entries(prereqGraph)) {
      if (deps.includes(skill)) bad.push(`${skill} depends on itself`);
      if (new Set(deps).size !== deps.length) bad.push(`${skill} has duplicate prereqs`);
    }
    expect(bad).toEqual([]);
  });

  it('is acyclic (a cycle would perma-block both skills in the unblocker)', () => {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>(Object.keys(prereqGraph).map((k) => [k, WHITE]));
    const cycles: string[] = [];
    const visit = (node: string, path: string[]) => {
      color.set(node, GRAY);
      for (const dep of prereqGraph[node] ?? []) {
        if (color.get(dep) === GRAY) cycles.push([...path, node, dep].join(' -> '));
        else if (color.get(dep) === WHITE) visit(dep, [...path, node]);
      }
      color.set(node, BLACK);
    };
    for (const node of Object.keys(prereqGraph)) if (color.get(node) === WHITE) visit(node, []);
    expect(cycles, `cycle(s) found: ${cycles.join(' | ')}`).toEqual([]);
  });
});

describe('skillPrereqGraph — getPrereqDepth semantics', () => {
  it('ETH-01 has depth 0 (root, no prereqs)', () => {
    expect(getPrereqDepth('ETH-01', prereqGraph)).toBe(0);
  });

  it('ETH-02 has depth > 0 (depends on ETH-01)', () => {
    expect(getPrereqDepth('ETH-02', prereqGraph)).toBeGreaterThan(0);
  });

  it('SWP-04 depth is 2 after the repair (transitive: SWP-02, SWP-03 — phantom SWP-01 removed)', () => {
    expect(getPrereqDepth('SWP-04', prereqGraph)).toBe(2);
  });

  it('max depth is 4 (e.g. LEG-03 → LEG-02 → {ETH-01, ETH-02, LEG-01})', () => {
    const allDepths = Object.keys(prereqGraph).map((k) => getPrereqDepth(k, prereqGraph));
    const maxDepth = Math.max(...allDepths);
    expect(maxDepth).toBe(4);
    expect(getPrereqDepth('LEG-03', prereqGraph)).toBe(maxDepth);
  });

  it('there are foundational roots (depth 0)', () => {
    const roots = Object.keys(prereqGraph).filter((k) => getPrereqDepth(k, prereqGraph) === 0);
    expect(roots.length).toBeGreaterThan(0);
  });

  it('handles circular graphs without hanging (cycle-safe)', () => {
    const circular: Record<string, string[]> = { A: ['B'], B: ['A'] };
    expect(getPrereqDepth('A', circular)).toBe(2);
  });

  it('unknown skill returns 0', () => {
    expect(getPrereqDepth('FAKE-99', prereqGraph)).toBe(0);
  });
});
