import { describe, it, expect } from 'vitest';
import { computeSkillNudges, REPEAT_MISS_THRESHOLD, type VocabDrillResult } from '../src/services/vocabDrillService';

function miss(term: string, skillIds: string[]): VocabDrillResult {
  return { term, skillIds, correct: false, timedOut: false, direction: 'term' };
}
function hit(term: string, skillIds: string[]): VocabDrillResult {
  return { term, skillIds, correct: true, timedOut: false, direction: 'term' };
}

describe('computeSkillNudges', () => {
  it('nudges a skill only after the repeat-miss threshold', () => {
    const results = [miss('a', ['S1']), miss('b', ['S1'])]; // 2 misses on S1
    expect(REPEAT_MISS_THRESHOLD).toBe(2);
    expect(computeSkillNudges(results)).toEqual(['S1']);
  });

  it('does NOT nudge on a single miss (dampening)', () => {
    expect(computeSkillNudges([miss('a', ['S1'])])).toEqual([]);
  });

  it('ignores correct answers', () => {
    const results = [hit('a', ['S1']), hit('b', ['S1']), miss('c', ['S1'])];
    expect(computeSkillNudges(results)).toEqual([]);
  });

  it('counts a multi-skill term toward every owning skill', () => {
    const results = [miss('a', ['S1', 'S2']), miss('b', ['S1', 'S2'])];
    expect(computeSkillNudges(results).sort()).toEqual(['S1', 'S2']);
  });

  it('handles terms with no skills without throwing', () => {
    expect(computeSkillNudges([miss('a', []), miss('b', [])])).toEqual([]);
  });
});
