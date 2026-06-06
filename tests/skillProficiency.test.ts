import { describe, it, expect } from 'vitest';
import {
  getSkillProficiency,
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
} from '../src/utils/skillProficiency';

describe('getSkillProficiency', () => {
  // ── attempts === 0 always returns unstarted ──────────────────────────────
  it('returns unstarted when attempts is 0 regardless of score', () => {
    expect(getSkillProficiency(1.0, 0)).toBe('unstarted');
    expect(getSkillProficiency(0.0, 0)).toBe('unstarted');
    expect(getSkillProficiency(0.8, 0)).toBe('unstarted');
  });

  it('returns unstarted when attempts is 0 even with weightedAccuracy', () => {
    expect(getSkillProficiency(0.9, 0, 0.95)).toBe('unstarted');
  });

  // ── Boundary values (raw score, no weightedAccuracy) ─────────────────────
  it('returns proficient at exactly the demonstrating threshold', () => {
    expect(getSkillProficiency(DEMONSTRATING_THRESHOLD, 10)).toBe('proficient');
  });

  it('returns approaching just below the demonstrating threshold', () => {
    expect(getSkillProficiency(0.79, 10)).toBe('approaching');
  });

  it('returns approaching at exactly the approaching threshold', () => {
    expect(getSkillProficiency(APPROACHING_THRESHOLD, 10)).toBe('approaching');
  });

  it('returns emerging just below the approaching threshold', () => {
    expect(getSkillProficiency(0.59, 10)).toBe('emerging');
  });

  it('returns proficient well above the threshold', () => {
    expect(getSkillProficiency(0.95, 20)).toBe('proficient');
  });

  it('returns emerging at 0 score with attempts', () => {
    expect(getSkillProficiency(0, 5)).toBe('emerging');
  });

  // ── weightedAccuracy takes precedence over raw score ─────────────────────
  it('uses weightedAccuracy when provided and differs from score', () => {
    // Raw score = 0.5 (emerging), but weighted = 0.85 (proficient)
    expect(getSkillProficiency(0.5, 10, 0.85)).toBe('proficient');
  });

  it('weightedAccuracy can downgrade from raw score', () => {
    // Raw score = 0.85 (proficient), but weighted = 0.55 (emerging)
    expect(getSkillProficiency(0.85, 10, 0.55)).toBe('emerging');
  });

  it('weightedAccuracy at boundary values works correctly', () => {
    expect(getSkillProficiency(0.5, 10, 0.80)).toBe('proficient');
    expect(getSkillProficiency(0.5, 10, 0.79)).toBe('approaching');
    expect(getSkillProficiency(0.5, 10, 0.60)).toBe('approaching');
    expect(getSkillProficiency(0.5, 10, 0.59)).toBe('emerging');
  });

  // ── Legacy fallback: undefined weightedAccuracy uses raw score ───────────
  it('falls back to raw score when weightedAccuracy is undefined', () => {
    expect(getSkillProficiency(0.85, 10, undefined)).toBe('proficient');
    expect(getSkillProficiency(0.70, 10, undefined)).toBe('approaching');
    expect(getSkillProficiency(0.40, 10, undefined)).toBe('emerging');
  });

  // ── Explicit five-case boundary contract ─────────────────────────────────
  // Guards the single source of truth that every call site now defers to.
  // The tiers are: below 0.6 → emerging, [0.6, 0.8) → approaching, ≥ 0.8 → proficient.
  describe('threshold boundary contract', () => {
    it('below the approaching threshold → emerging', () => {
      expect(getSkillProficiency(APPROACHING_THRESHOLD - 0.0001, 10)).toBe('emerging');
    });
    it('exactly at the approaching threshold (0.6) → approaching (inclusive)', () => {
      expect(getSkillProficiency(APPROACHING_THRESHOLD, 10)).toBe('approaching');
    });
    it('between the thresholds (0.6 ≤ score < 0.8) → approaching', () => {
      expect(getSkillProficiency(0.7, 10)).toBe('approaching');
    });
    it('exactly at the demonstrating threshold (0.8) → proficient (inclusive)', () => {
      expect(getSkillProficiency(DEMONSTRATING_THRESHOLD, 10)).toBe('proficient');
    });
    it('above the demonstrating threshold → proficient', () => {
      expect(getSkillProficiency(DEMONSTRATING_THRESHOLD + 0.0001, 10)).toBe('proficient');
    });
  });
});

// ── Percent-scale equivalence ──────────────────────────────────────────────
// Several UI surfaces compare a 0–100 percentage against `THRESHOLD * 100`.
// This guards the assumption that those constants land on exact integer
// boundaries (no IEEE-754 drift) so the percent call sites behave identically
// to the 0–1 ones at the exact boundary values 60 and 80.
describe('percent-scale threshold constants', () => {
  it('THRESHOLD * 100 yields exact integer boundaries', () => {
    expect(DEMONSTRATING_THRESHOLD * 100).toBe(80);
    expect(APPROACHING_THRESHOLD * 100).toBe(60);
  });

  it('boundary percents classify on the inclusive side', () => {
    // 80% is Demonstrating; 79% is not. 60% is Approaching; 59% is not.
    expect(80 >= DEMONSTRATING_THRESHOLD * 100).toBe(true);
    expect(79 >= DEMONSTRATING_THRESHOLD * 100).toBe(false);
    expect(60 >= APPROACHING_THRESHOLD * 100).toBe(true);
    expect(59 >= APPROACHING_THRESHOLD * 100).toBe(false);
  });
});
