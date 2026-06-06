import { describe, it, expect } from 'vitest';
import { buildDrillScopes, MIN_TERMS } from '../src/utils/drillScopes';

describe('buildDrillScopes', () => {
  it('always offers an "All terms" scope with the most terms', () => {
    const scopes = buildDrillScopes({});
    const all = scopes.find((s) => s.id === 'all');
    expect(all).toBeDefined();
    expect(all!.termCount).toBeGreaterThanOrEqual(MIN_TERMS);
    // "all" should have the largest term count of any scope
    const max = Math.max(...scopes.map((s) => s.termCount));
    expect(all!.termCount).toBe(max);
  });

  it('offers content-area scopes, each above the minimum', () => {
    const scopes = buildDrillScopes({});
    const areas = scopes.filter((s) => s.id.startsWith('area:'));
    expect(areas.length).toBeGreaterThan(0);
    for (const a of areas) expect(a.termCount).toBeGreaterThanOrEqual(MIN_TERMS);
  });

  it('surfaces a "weak" scope when the user has emerging skills with terms', () => {
    // Mark a broad swath of skills as emerging (low score, with attempts).
    const scores: Record<string, { score: number; attempts: number }> = {};
    const all = buildDrillScopes({}); // discover skill IDs via the "all" scope
    for (const id of all.find((s) => s.id === 'all')!.skillIds) {
      scores[id] = { score: 0.2, attempts: 5 };
    }
    const scopes = buildDrillScopes(scores);
    const weak = scopes.find((s) => s.id === 'weak');
    expect(weak).toBeDefined();
    expect(weak!.termCount).toBeGreaterThanOrEqual(MIN_TERMS);
  });

  it('omits weak/sharpen when there is no qualifying data', () => {
    const scopes = buildDrillScopes({});
    // With no scores, no skill is emerging/approaching → no weak/sharpen scopes
    expect(scopes.find((s) => s.id === 'weak')).toBeUndefined();
    expect(scopes.find((s) => s.id === 'sharpen')).toBeUndefined();
  });
});
