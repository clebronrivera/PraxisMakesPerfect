import { describe, it, expect } from 'vitest';
import {
  applySkillAttemptDedup,
  type DedupedSkillCounters,
  type SkillAttemptInput,
} from '../src/brain/learning-state';
import { getSkillProficiency } from '../src/utils/skillProficiency';

// Minimal base-skill shape accepted by applySkillAttemptDedup.
type Base = Parameters<typeof applySkillAttemptDedup>[0];

// Apply a sequence of attempts, threading the deduped result forward as the next base.
function chain(initial: Base, inputs: SkillAttemptInput[]): DedupedSkillCounters {
  let acc: Base = initial;
  let last!: DedupedSkillCounters;
  for (const inp of inputs) {
    last = applySkillAttemptDedup(acc, inp);
    acc = last;
  }
  return last;
}

const FRESH: Base = { attempts: 0, correct: 0 };

describe('applySkillAttemptDedup — module mini-quiz / practice double-count', () => {
  it('does NOT double-count the same question answered in mini-quiz then practice', () => {
    const r = chain(FRESH, [
      { isCorrect: false, questionId: 'Q1', confidence: 'medium', source: 'module', now: 1 },
      { isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 2 },
    ]);
    expect(r.attempts).toBe(1); // not 2
    expect(r.correct).toBe(1); // latest attempt wins (correct)
    expect(r.score).toBe(1);
    expect(r.attemptHistory).toHaveLength(1); // recency window also deduped
    expect(r.attemptHistory[0].source).toBe('practice'); // latest source retained
  });

  it('counts the same question once regardless of order (practice then mini-quiz)', () => {
    const r = chain(FRESH, [
      { isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 1 },
      { isCorrect: false, questionId: 'Q1', confidence: 'medium', source: 'module', now: 2 },
    ]);
    expect(r.attempts).toBe(1);
    expect(r.correct).toBe(0); // latest wins (incorrect)
  });

  it('counts distinct practice questions normally', () => {
    const r = chain(FRESH, [
      { isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 1 },
      { isCorrect: true, questionId: 'Q2', confidence: 'medium', source: 'practice', now: 2 },
      { isCorrect: false, questionId: 'Q3', confidence: 'medium', source: 'practice', now: 3 },
    ]);
    expect(r.attempts).toBe(3);
    expect(r.correct).toBe(2);
  });

  it('applies latest-wins when the same question is re-answered', () => {
    const r = chain(FRESH, [
      { isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 1 },
      { isCorrect: false, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 2 },
    ]);
    expect(r.attempts).toBe(1);
    expect(r.correct).toBe(0);
    expect(r.attemptHistory).toHaveLength(1);
  });

  it('preserves pre-dedup (legacy) totals so existing progress is not lost', () => {
    // Existing record created before dedup: counters present, no questionOutcomes.
    const legacyBase: Base = { attempts: 10, correct: 7 };
    const r = applySkillAttemptDedup(legacyBase, {
      isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'practice', now: 1,
    });
    expect(r.legacyAttempts).toBe(10);
    expect(r.legacyCorrect).toBe(7);
    expect(r.attempts).toBe(11); // 10 legacy + 1 new unique
    expect(r.correct).toBe(8);

    // Re-answering Q1 must not add another attempt.
    const r2 = applySkillAttemptDedup(r, {
      isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'module', now: 2,
    });
    expect(r2.attempts).toBe(11);
    expect(r2.correct).toBe(8);
  });

  it('always counts attempts with no questionId (e.g. manual nudges)', () => {
    const r = chain(FRESH, [
      { isCorrect: true, confidence: 'low', source: 'practice', now: 1 },
      { isCorrect: true, confidence: 'low', source: 'practice', now: 2 },
    ]);
    expect(r.attempts).toBe(2); // distinct synthetic keys, no dedup
  });

  it('records the attempt source for analytics', () => {
    const r = applySkillAttemptDedup(FRESH, {
      isCorrect: true, questionId: 'Q9', confidence: 'high', source: 'module', now: 1,
    });
    expect(r.attemptHistory[0].source).toBe('module');
  });

  it('proficiency/readiness is not inflated by a duplicated question', () => {
    // 5 distinct correct answers → 5/5 = proficient.
    const distinct = chain(FRESH, [1, 2, 3, 4, 5].map((n) => ({
      isCorrect: true, questionId: `Q${n}`, confidence: 'medium' as const, source: 'practice' as const, now: n,
    })));
    expect(distinct.attempts).toBe(5);
    expect(getSkillProficiency(distinct.score, distinct.attempts)).toBe('proficient');

    // Same five, but Q1 also answered in the mini-quiz: still 5 attempts, still proficient.
    const withDup = chain(distinct, [
      { isCorrect: true, questionId: 'Q1', confidence: 'medium', source: 'module', now: 6 },
    ]);
    expect(withDup.attempts).toBe(5); // not 6
    expect(getSkillProficiency(withDup.score, withDup.attempts)).toBe('proficient');
  });
});
