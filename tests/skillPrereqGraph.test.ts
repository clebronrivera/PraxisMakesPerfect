import { describe, it, expect } from 'vitest';
import { prereqGraph, getPrereqDepth } from '../src/data/skillPrereqGraph';

describe('skillPrereqGraph', () => {
  // ── Specific depth values ───────────────────────────────────────────────────
  it('ETH-01 has depth 0 (no prereqs)', () => {
    expect(getPrereqDepth('ETH-01', prereqGraph)).toBe(0);
  });

  it('ETH-02 has depth > 0 (depends on ETH-01)', () => {
    expect(getPrereqDepth('ETH-02', prereqGraph)).toBeGreaterThan(0);
  });

  it('SWP-04 has depth 3 (transitive deps: SWP-01, SWP-02, SWP-03)', () => {
    expect(getPrereqDepth('SWP-04', prereqGraph)).toBe(3);
  });

  it('LEG-03 or LEG-04 has the highest depth (4)', () => {
    const allDepths = Object.keys(prereqGraph).map(k => getPrereqDepth(k, prereqGraph));
    const maxDepth = Math.max(...allDepths);
    expect(maxDepth).toBe(4);
    // SWP-04 is not the absolute max — LEG-03/LEG-04/SAF-04 have depth 4
    expect(getPrereqDepth('LEG-03', prereqGraph)).toBe(maxDepth);
  });

  // ── Cycle safety ────────────────────────────────────────────────────────────
  it('handles circular graphs without hanging', () => {
    const circular: Record<string, string[]> = { A: ['B'], B: ['A'] };
    // Should complete within the test timeout (not infinite loop)
    const depth = getPrereqDepth('A', circular);
    // A depends on B, B depends on A → visited = {B, A} = 2 unique nodes
    expect(depth).toBe(2); // BFS visits B then A → visited = {B, A}
  });

  // ── Unknown skill ──────────────────────────────────────────────────────────
  it('unknown skill returns 0', () => {
    expect(getPrereqDepth('FAKE-99', prereqGraph)).toBe(0);
  });

  // ── Graph completeness ─────────────────────────────────────────────────────
  it('all 45 skills are in prereqGraph', () => {
    expect(Object.keys(prereqGraph).length).toBe(45);
  });
});
