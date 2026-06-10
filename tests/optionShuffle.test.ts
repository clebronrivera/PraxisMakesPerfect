import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  deterministicOptionOrder,
  withShuffledOptions,
} from '../src/utils/optionShuffle';
import type { AnalyzedQuestion } from '../src/brain/question-analyzer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

type RawQuestion = Record<string, string>;
const bank: RawQuestion[] = JSON.parse(
  readFileSync(join(root, 'src/data/questions.json'), 'utf8')
);

describe('deterministicOptionOrder', () => {
  it('is a pure permutation — same multiset of letters', () => {
    const letters = ['A', 'B', 'C', 'D'];
    const order = deterministicOptionOrder('PQ_TEST_1', letters);
    expect([...order].sort()).toEqual([...letters].sort());
    expect(order).toHaveLength(letters.length);
  });

  it('is deterministic — same id yields the same order every call', () => {
    const a = deterministicOptionOrder('PQ_DBD-10_3', ['A', 'B', 'C', 'D']);
    const b = deterministicOptionOrder('PQ_DBD-10_3', ['A', 'B', 'C', 'D']);
    expect(a).toEqual(b);
  });

  it('different ids generally yield different orders', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(deterministicOptionOrder(`PQ_X_${i}`, ['A', 'B', 'C', 'D']).join(''));
    }
    // Expect a healthy spread of permutations, not one fixed order.
    expect(seen.size).toBeGreaterThan(10);
  });

  it('never returns the identity order for a 2+ option item', () => {
    // The rotate-on-identity guard ensures the displayed order always differs
    // from the stored order (so a correct-is-B item never displays B-as-B).
    for (let i = 0; i < 200; i++) {
      const letters = ['A', 'B', 'C', 'D'];
      const order = deterministicOptionOrder(`PQ_ID_${i}`, letters);
      expect(order).not.toEqual(letters);
    }
  });

  it('handles 1-option and empty inputs without throwing', () => {
    expect(deterministicOptionOrder('x', ['A'])).toEqual(['A']);
    expect(deterministicOptionOrder('x', [])).toEqual([]);
  });
});

describe('withShuffledOptions', () => {
  const q: AnalyzedQuestion = {
    id: 'PQ_DEMO_1',
    choices: { A: 'alpha', B: 'beta', C: 'gamma', D: 'delta' },
    correct_answer: ['B'],
  } as unknown as AnalyzedQuestion;

  it('preserves canonical letter→text pairing, only reorders', () => {
    const out = withShuffledOptions(q);
    expect(out.options).toBeDefined();
    const pairs = Object.fromEntries(out.options!.map(o => [o.letter, o.text]));
    expect(pairs).toEqual({ A: 'alpha', B: 'beta', C: 'gamma', D: 'delta' });
  });

  it('does not mutate the original question', () => {
    const before = JSON.stringify(q);
    withShuffledOptions(q);
    expect(JSON.stringify(q)).toEqual(before);
  });

  it('leaves choices canonical so keyed lookups are unaffected', () => {
    const out = withShuffledOptions(q);
    expect(out.choices).toEqual(q.choices);
  });
});

describe('bank-wide bias is defeated by display shuffle', () => {
  // The stored bank is ~66% B. After deterministic display-shuffle, the
  // correct answer's DISPLAYED position must be far more uniform.
  it('correct-answer display position is no longer dominated by one slot', () => {
    const slotCounts: Record<number, number> = {};
    let total = 0;

    for (const raw of bank) {
      const correct = (raw.correct_answers || '').trim();
      if (!correct || correct.includes(',')) continue; // single-select only
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'].filter(
        l => (raw[l] || '').trim().length > 0
      );
      if (letters.length < 2) continue;

      const id = raw.UNIQUEID || '';
      const order = deterministicOptionOrder(id, letters);
      const displayIndex = order.indexOf(correct);
      if (displayIndex < 0) continue;
      slotCounts[displayIndex] = (slotCounts[displayIndex] || 0) + 1;
      total++;
    }

    expect(total).toBeGreaterThan(1000);

    // No single display slot should hold more than 40% of correct answers
    // (stored bank had 66% in slot B). Uniform over 4 slots would be ~25%.
    const maxSlot = Math.max(...Object.values(slotCounts));
    const maxShare = maxSlot / total;
    expect(maxShare).toBeLessThan(0.4);
  });
});
