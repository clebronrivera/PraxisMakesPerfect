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
});
