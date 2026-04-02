import { describe, it, expect } from 'vitest';
import { getPrereqDepth } from '../src/data/skillPrereqGraph';

/**
 * Minimal reproduction of the sort logic from LearningPathNodeMap.tsx buildNodes().
 * The actual function is embedded inside a React component and cannot be imported
 * directly, so we re-implement the same comparator here for unit testing.
 */

interface SortableSkill {
  skillId: string;
  overallScore: number | null;
  isMastered: boolean;
}

function sortByDeficit(
  items: SortableSkill[],
  depthGraph: Record<string, string[]>,
): SortableSkill[] {
  return [...items].sort((a, b) => {
    // Mastered skills always sink to the end.
    if (a.isMastered && !b.isMastered) return 1;
    if (!a.isMastered && b.isMastered) return -1;

    // Among non-mastered skills, lower prereq depth sorts first.
    const aDepth = getPrereqDepth(a.skillId, depthGraph);
    const bDepth = getPrereqDepth(b.skillId, depthGraph);
    if (aDepth !== bDepth) return aDepth - bDepth;

    // Within same depth, lower score sorts first.
    if (a.overallScore === null && b.overallScore === null) return a.skillId.localeCompare(b.skillId);
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return a.overallScore - b.overallScore;
  });
}

// A flat graph where all skills have depth 0 (no prereqs).
const flatGraph: Record<string, string[]> = {
  S1: [], S2: [], S3: [], S4: [], S5: [],
};

// A layered graph: S1 is foundational (depth 0), S2 depends on S1 (depth 1).
const layeredGraph: Record<string, string[]> = {
  S1: [],
  S2: ['S1'],
  S3: ['S1', 'S2'],
  S4: [],
  S5: [],
};

describe('learningPathSort (sortByDeficit comparator)', () => {
  it('mastered skills always sort after non-mastered', () => {
    const items: SortableSkill[] = [
      { skillId: 'S1', overallScore: 0.9, isMastered: true },
      { skillId: 'S2', overallScore: 0.3, isMastered: false },
      { skillId: 'S3', overallScore: 0.5, isMastered: false },
    ];
    const sorted = sortByDeficit(items, flatGraph);
    // Non-mastered first, mastered last
    expect(sorted[0].isMastered).toBe(false);
    expect(sorted[1].isMastered).toBe(false);
    expect(sorted[2].isMastered).toBe(true);
  });

  it('among non-mastered, lower prereq depth sorts first', () => {
    const items: SortableSkill[] = [
      { skillId: 'S3', overallScore: 0.5, isMastered: false }, // depth 2
      { skillId: 'S1', overallScore: 0.5, isMastered: false }, // depth 0
      { skillId: 'S2', overallScore: 0.5, isMastered: false }, // depth 1
    ];
    const sorted = sortByDeficit(items, layeredGraph);
    expect(sorted[0].skillId).toBe('S1'); // depth 0
    expect(sorted[1].skillId).toBe('S2'); // depth 1
    expect(sorted[2].skillId).toBe('S3'); // depth 2
  });

  it('within same depth, lower score sorts first', () => {
    const items: SortableSkill[] = [
      { skillId: 'S1', overallScore: 0.7, isMastered: false }, // depth 0
      { skillId: 'S4', overallScore: 0.3, isMastered: false }, // depth 0
      { skillId: 'S5', overallScore: 0.5, isMastered: false }, // depth 0
    ];
    const sorted = sortByDeficit(items, flatGraph);
    expect(sorted[0].skillId).toBe('S4'); // 0.3
    expect(sorted[1].skillId).toBe('S5'); // 0.5
    expect(sorted[2].skillId).toBe('S1'); // 0.7
  });

  it('skills with null scores sort after scored skills within same mastery/depth tier', () => {
    const items: SortableSkill[] = [
      { skillId: 'S1', overallScore: null, isMastered: false },
      { skillId: 'S4', overallScore: 0.4, isMastered: false },
      { skillId: 'S5', overallScore: null, isMastered: false },
    ];
    const sorted = sortByDeficit(items, flatGraph);
    // Scored skill first, then null-scored skills alphabetically
    expect(sorted[0].skillId).toBe('S4'); // scored
    expect(sorted[1].skillId).toBe('S1'); // null, alphabetically first
    expect(sorted[2].skillId).toBe('S5'); // null, alphabetically second
  });
});
