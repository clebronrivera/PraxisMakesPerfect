import { describe, it, expect } from 'vitest';
import {
  computeFragilityFlag,
  computeUncertainSkillFlag,
  computeRapidGuessCount,
  countRecentHighConfidenceWrong,
  RAPID_THRESHOLD_SECONDS,
  type SkillAttempt,
} from '../src/brain/learning-state';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeAttempt(
  overrides: Partial<SkillAttempt> = {}
): SkillAttempt {
  return {
    questionId: 'q1',
    correct: true,
    confidence: 'medium',
    timestamp: Date.now(),
    timeSpent: 30,
    ...overrides,
  };
}

// ─── computeFragilityFlag ────────────────────────────────────────────────────

describe('computeFragilityFlag', () => {
  it('returns false when fewer than 6 attempts', () => {
    const history = Array.from({ length: 5 }, () =>
      makeAttempt({ confidence: 'low', correct: true })
    );
    expect(computeFragilityFlag(history)).toBe(false);
  });

  it('returns true when >= 50% of last 6 are low-confidence correct', () => {
    // 3 low-correct + 3 medium-correct = 50% low-correct in last 6
    const history = [
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
    ];
    expect(computeFragilityFlag(history)).toBe(true);
  });

  it('returns false when less than 50% of last 6 are low-confidence correct', () => {
    // 2 low-correct + 4 medium-correct = 33% low-correct
    const history = [
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
    ];
    expect(computeFragilityFlag(history)).toBe(false);
  });

  it('only considers last 6 attempts, not earlier ones', () => {
    // 10 old medium-correct, then 4 low-correct + 2 medium in last 6
    const old = Array.from({ length: 10 }, () =>
      makeAttempt({ confidence: 'medium', correct: true })
    );
    const recent = [
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'low', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'medium', correct: true }),
    ];
    // 4/6 = 67% low-correct in last 6
    expect(computeFragilityFlag([...old, ...recent])).toBe(true);
  });

  it('does not count low-confidence wrong as fragility', () => {
    // 3 low-wrong + 3 low-correct = only 3 low-correct / 6 = 50% → true
    // But: 3 low-wrong + 3 high-correct → 0 low-correct / 6 = 0%
    const history = [
      makeAttempt({ confidence: 'low', correct: false }),
      makeAttempt({ confidence: 'low', correct: false }),
      makeAttempt({ confidence: 'low', correct: false }),
      makeAttempt({ confidence: 'high', correct: true }),
      makeAttempt({ confidence: 'high', correct: true }),
      makeAttempt({ confidence: 'high', correct: true }),
    ];
    expect(computeFragilityFlag(history)).toBe(false);
  });
});

// ─── computeUncertainSkillFlag ───────────────────────────────────────────────

describe('computeUncertainSkillFlag', () => {
  it('returns false when fewer than 6 attempts', () => {
    const history = Array.from({ length: 5 }, () =>
      makeAttempt({ confidence: 'high' })
    );
    expect(computeUncertainSkillFlag(history)).toBe(false);
  });

  it('returns true when both high and low rates >= 25%', () => {
    // 2 high + 2 low + 4 medium = 8 total → high=25%, low=25%
    const history = [
      makeAttempt({ confidence: 'high' }),
      makeAttempt({ confidence: 'high' }),
      makeAttempt({ confidence: 'low' }),
      makeAttempt({ confidence: 'low' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
    ];
    expect(computeUncertainSkillFlag(history)).toBe(true);
  });

  it('returns false when all answers are high confidence', () => {
    const history = Array.from({ length: 8 }, () =>
      makeAttempt({ confidence: 'high' })
    );
    expect(computeUncertainSkillFlag(history)).toBe(false);
  });

  it('returns false when all answers are medium confidence', () => {
    const history = Array.from({ length: 8 }, () =>
      makeAttempt({ confidence: 'medium' })
    );
    expect(computeUncertainSkillFlag(history)).toBe(false);
  });

  it('returns false when high rate < 25% even if low rate >= 25%', () => {
    // 1 high + 3 low + 4 medium = 8 total → high=12.5%, low=37.5%
    const history = [
      makeAttempt({ confidence: 'high' }),
      makeAttempt({ confidence: 'low' }),
      makeAttempt({ confidence: 'low' }),
      makeAttempt({ confidence: 'low' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
      makeAttempt({ confidence: 'medium' }),
    ];
    expect(computeUncertainSkillFlag(history)).toBe(false);
  });
});

// ─── computeRapidGuessCount ──────────────────────────────────────────────────

describe('computeRapidGuessCount', () => {
  it('counts attempts with timeSpent in (0, RAPID_THRESHOLD_SECONDS)', () => {
    const history = [
      makeAttempt({ timeSpent: 2 }),   // rapid
      makeAttempt({ timeSpent: 3 }),   // rapid
      makeAttempt({ timeSpent: 5 }),   // not rapid
      makeAttempt({ timeSpent: 30 }),  // not rapid
    ];
    expect(computeRapidGuessCount(history)).toBe(2);
  });

  it('excludes timeSpent === 0 (sentinel for "not recorded")', () => {
    const history = [
      makeAttempt({ timeSpent: 0 }),
      makeAttempt({ timeSpent: 0 }),
      makeAttempt({ timeSpent: 2 }),
    ];
    expect(computeRapidGuessCount(history)).toBe(1);
  });

  it('excludes timeSpent exactly at threshold', () => {
    const history = [
      makeAttempt({ timeSpent: RAPID_THRESHOLD_SECONDS }), // exactly 4 — not rapid
    ];
    expect(computeRapidGuessCount(history)).toBe(0);
  });

  it('returns 0 for empty history', () => {
    expect(computeRapidGuessCount([])).toBe(0);
  });
});

// ─── countRecentHighConfidenceWrong ──────────────────────────────────────────

describe('countRecentHighConfidenceWrong', () => {
  it('counts high-confidence wrong in the last 10 attempts by default', () => {
    const history = [
      ...Array.from({ length: 8 }, () => makeAttempt({ confidence: 'medium', correct: true })),
      makeAttempt({ confidence: 'high', correct: false }),
      makeAttempt({ confidence: 'high', correct: false }),
    ];
    expect(countRecentHighConfidenceWrong(history)).toBe(2);
  });

  it('ignores high-confidence wrong outside the window', () => {
    // 3 old high-wrong + 10 recent medium-correct
    const old = Array.from({ length: 3 }, () =>
      makeAttempt({ confidence: 'high', correct: false })
    );
    const recent = Array.from({ length: 10 }, () =>
      makeAttempt({ confidence: 'medium', correct: true })
    );
    expect(countRecentHighConfidenceWrong([...old, ...recent])).toBe(0);
  });

  it('does not count high-confidence correct as a flag', () => {
    const history = Array.from({ length: 10 }, () =>
      makeAttempt({ confidence: 'high', correct: true })
    );
    expect(countRecentHighConfidenceWrong(history)).toBe(0);
  });

  it('does not count low-confidence wrong as a flag', () => {
    const history = Array.from({ length: 10 }, () =>
      makeAttempt({ confidence: 'low', correct: false })
    );
    expect(countRecentHighConfidenceWrong(history)).toBe(0);
  });

  it('respects custom window size', () => {
    const history = [
      makeAttempt({ confidence: 'high', correct: false }), // outside window=3
      makeAttempt({ confidence: 'high', correct: false }), // outside window=3
      makeAttempt({ confidence: 'medium', correct: true }),
      makeAttempt({ confidence: 'high', correct: false }),
      makeAttempt({ confidence: 'medium', correct: true }),
    ];
    expect(countRecentHighConfidenceWrong(history, 3)).toBe(1);
  });

  it('returns 0 for empty history', () => {
    expect(countRecentHighConfidenceWrong([])).toBe(0);
  });
});
