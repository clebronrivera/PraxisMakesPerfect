/**
 * Global score calculator — retake (A4) replace/latest-wins semantics.
 *
 * Locks in the Phase 2 Decision A4 contract verified 2026-06-12:
 *   - A retake supersedes screener+diagnostic for the skills/domains it covers
 *     (latest-wins, NOT averaged with the stale baseline).
 *   - Practice still blends in at its 0.30 weight on top of the retake.
 *   - `diagnosticSkillScores` is screener+diagnostic ONLY (never retake/practice),
 *     because the retake-unlock gate (App.tsx) uses it to identify baseline deficits.
 *
 * These were previously uncovered despite being pure, deterministic functions.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateGlobalScoresFromData,
  type GlobalScoreInputs,
} from '../src/utils/globalScoreCalculator';

const inputs = (over: Partial<GlobalScoreInputs>): GlobalScoreInputs => ({
  screenerResponses: [],
  responseLogs: [],
  ...over,
});

describe('calculateGlobalScoresFromData — retake replace semantics (A4)', () => {
  it('retake supersedes screener+diagnostic for the skill it covers (latest-wins, not averaged)', () => {
    const result = calculateGlobalScoresFromData(
      inputs({
        responseLogs: [
          // Baseline diagnostic: 0/3 on DIV-01 (a deficit skill).
          { assessmentType: 'diagnostic', domainId: 4, skillId: 'DIV-01', isCorrect: false },
          { assessmentType: 'diagnostic', domainId: 4, skillId: 'DIV-01', isCorrect: false },
          { assessmentType: 'diagnostic', domainId: 4, skillId: 'DIV-01', isCorrect: false },
          // Retake: 3/3 on DIV-01.
          { assessmentType: 'retake', domainId: 4, skillId: 'DIV-01', isCorrect: true },
          { assessmentType: 'retake', domainId: 4, skillId: 'DIV-01', isCorrect: true },
          { assessmentType: 'retake', domainId: 4, skillId: 'DIV-01', isCorrect: true },
        ],
      })
    );

    // Replace, not average: a 50/50 average of 0% and 100% would be 50.
    expect(result.skillScores['DIV-01']).toBe(100);
    expect(result.domainScores[4]).toBe(100);
    // The unlock gate must still see the ORIGINAL deficit (0%), unaffected by the retake.
    expect(result.diagnosticSkillScores['DIV-01']).toBe(0);
  });

  it('retake still blends with practice at the practice weight (0.70 / 0.30)', () => {
    const result = calculateGlobalScoresFromData(
      inputs({
        responseLogs: [
          // Retake 4/4 = 100% (weight 0.70).
          ...Array.from({ length: 4 }, () => ({
            assessmentType: 'retake' as const,
            domainId: 2,
            skillId: 'PSY-01',
            isCorrect: true,
          })),
          // Practice 0/4 = 0% (weight 0.30).
          ...Array.from({ length: 4 }, () => ({
            assessmentType: 'practice' as const,
            domainId: 2,
            skillId: 'PSY-01',
            isCorrect: false,
          })),
        ],
      })
    );

    // (1.0 * 0.70 + 0.0 * 0.30) / (0.70 + 0.30) = 0.70 → 70.
    expect(result.skillScores['PSY-01']).toBe(70);
    // No screener/diagnostic data for this skill → not a tracked baseline skill.
    expect(result.diagnosticSkillScores['PSY-01']).toBeUndefined();
  });

  it('with no retake, scores blend screener (0.20) + diagnostic (0.50) as before', () => {
    const result = calculateGlobalScoresFromData(
      inputs({
        screenerResponses: [
          { domain_id: 1, skill_id: 'DBD-09', is_correct: true }, // 1/1 = 100% @ 0.20
        ],
        responseLogs: [
          { assessmentType: 'diagnostic', domainId: 1, skillId: 'DBD-09', isCorrect: true },
          { assessmentType: 'diagnostic', domainId: 1, skillId: 'DBD-09', isCorrect: false }, // 1/2 = 50% @ 0.50
        ],
      })
    );

    // (1.0 * 0.20 + 0.5 * 0.50) / 0.70 = 0.642857… → 64.
    expect(result.skillScores['DBD-09']).toBe(64);
    expect(result.diagnosticSkillScores['DBD-09']).toBe(64);
  });

  it('records a 0% baseline skill in diagnosticSkillScores so the unlock gate can track it', () => {
    const result = calculateGlobalScoresFromData(
      inputs({
        responseLogs: [
          { assessmentType: 'diagnostic', domainId: 3, skillId: 'FAM-02', isCorrect: false },
          { assessmentType: 'diagnostic', domainId: 3, skillId: 'FAM-02', isCorrect: false },
        ],
      })
    );

    // 0% must be present (not dropped) — it is a deficit the retake gate watches.
    expect(result.diagnosticSkillScores).toHaveProperty('FAM-02');
    expect(result.diagnosticSkillScores['FAM-02']).toBe(0);
  });
});
