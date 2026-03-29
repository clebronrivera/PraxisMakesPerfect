import { describe, it, expect } from 'vitest';
import { calculateSrsUpdate } from '../src/utils/srsEngine';

const TODAY = '2026-03-29';

describe('calculateSrsUpdate', () => {
  // ── Correct answer advances box ──────────────────────────────────────────
  it('advances box 0 → 1 on correct', () => {
    const result = calculateSrsUpdate(0, true, TODAY);
    expect(result.newBox).toBe(1);
  });

  it('advances box 1 → 2 on correct', () => {
    const result = calculateSrsUpdate(1, true, TODAY);
    expect(result.newBox).toBe(2);
  });

  it('advances box 2 → 3 on correct', () => {
    const result = calculateSrsUpdate(2, true, TODAY);
    expect(result.newBox).toBe(3);
  });

  it('advances box 3 → 4 on correct', () => {
    const result = calculateSrsUpdate(3, true, TODAY);
    expect(result.newBox).toBe(4);
  });

  // ── Box 4 (max) stays at 4 on correct ───────────────────────────────────
  it('caps at box 4 on correct when already at max', () => {
    const result = calculateSrsUpdate(4, true, TODAY);
    expect(result.newBox).toBe(4);
  });

  // ── Wrong answer resets to box 0 ────────────────────────────────────────
  it('resets box 1 → 0 on wrong', () => {
    const result = calculateSrsUpdate(1, false, TODAY);
    expect(result.newBox).toBe(0);
  });

  it('resets box 3 → 0 on wrong', () => {
    const result = calculateSrsUpdate(3, false, TODAY);
    expect(result.newBox).toBe(0);
  });

  it('resets box 4 → 0 on wrong', () => {
    const result = calculateSrsUpdate(4, false, TODAY);
    expect(result.newBox).toBe(0);
  });

  it('stays at box 0 on wrong when already at 0', () => {
    const result = calculateSrsUpdate(0, false, TODAY);
    expect(result.newBox).toBe(0);
  });

  // ── undefined/null currentBox treated as box 0 ──────────────────────────
  it('treats undefined currentBox as box 0 (correct → 1)', () => {
    const result = calculateSrsUpdate(undefined, true, TODAY);
    expect(result.newBox).toBe(1);
  });

  it('treats null currentBox as box 0 (wrong → 0)', () => {
    const result = calculateSrsUpdate(null, false, TODAY);
    expect(result.newBox).toBe(0);
  });

  // ── nextReviewDate matches expected interval per box ────────────────────
  it('box 0 → correct → box 1 → next review in 3 days', () => {
    const result = calculateSrsUpdate(0, true, TODAY);
    // Box 1 interval = 3 days. 2026-03-29 + 3 = 2026-04-01
    expect(result.nextReviewDate).toBe('2026-04-01');
  });

  it('box 1 → correct → box 2 → next review in 7 days', () => {
    const result = calculateSrsUpdate(1, true, TODAY);
    // Box 2 interval = 7 days. 2026-03-29 + 7 = 2026-04-05
    expect(result.nextReviewDate).toBe('2026-04-05');
  });

  it('box 2 → correct → box 3 → next review in 14 days', () => {
    const result = calculateSrsUpdate(2, true, TODAY);
    // Box 3 interval = 14 days. 2026-03-29 + 14 = 2026-04-12
    expect(result.nextReviewDate).toBe('2026-04-12');
  });

  it('box 3 → correct → box 4 → next review in 30 days', () => {
    const result = calculateSrsUpdate(3, true, TODAY);
    // Box 4 interval = 30 days. 2026-03-29 + 30 = 2026-04-28
    expect(result.nextReviewDate).toBe('2026-04-28');
  });

  it('wrong answer → box 0 → next review in 1 day', () => {
    const result = calculateSrsUpdate(3, false, TODAY);
    // Box 0 interval = 1 day. 2026-03-29 + 1 = 2026-03-30
    expect(result.nextReviewDate).toBe('2026-03-30');
  });

  // ── lastReviewDate is always the provided "now" ─────────────────────────
  it('lastReviewDate equals the provided now date', () => {
    const result = calculateSrsUpdate(2, true, TODAY);
    expect(result.lastReviewDate).toBe(TODAY);
  });

  // ── Date format is always ISO date-only ─────────────────────────────────
  it('returns ISO date-only strings (YYYY-MM-DD)', () => {
    const result = calculateSrsUpdate(0, true, '2026-12-30');
    expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.lastReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // ── Out-of-range box is clamped ─────────────────────────────────────────
  it('clamps negative box to 0', () => {
    const result = calculateSrsUpdate(-5, true, TODAY);
    expect(result.newBox).toBe(1); // 0 → correct → 1
  });

  it('clamps box above max to max', () => {
    const result = calculateSrsUpdate(99, true, TODAY);
    expect(result.newBox).toBe(4); // clamped to 4, correct → stays 4
  });
});
