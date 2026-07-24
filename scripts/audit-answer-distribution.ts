// Answer Distribution Audit
//
// Checks the correct-answer letter distribution in src/data/questions.json.
//
// Was broken (always printed "Total Questions: 0") because it read legacy field
// names (`q.correct_answer` as an array, `q.choices` as a nested object) that
// don't match the actual on-disk schema: `correct_answers` is a plain string,
// and options live in flat `A`-`F` fields. Rewritten 2026-07-09 to read the real
// schema directly, the same way tests/questionsJsonSchema.test.ts does.
//
// Reports TWO distributions:
//   - RAW: the letter stored in `correct_answers`. This is skewed (~70% "B" for
//     the PQ_ batch) by design — see src/utils/optionShuffle.ts. Per decef8e
//     (2026-06-10) the fix is deliberately render-only, not a data rewrite, so
//     this number is expected to stay skewed and is informational only.
//   - EFFECTIVE: the DISPLAY position a test-taker actually sees, computed via
//     the same deterministicOptionOrder() every shuffled surface uses. This is
//     the number that matters for "can a user exploit letter-guessing," and the
//     script exits non-zero if it drifts out of balance.

import QUESTIONS_DATA from '../src/data/questions.json';
import { deterministicOptionOrder } from '../src/utils/optionShuffle';

interface RawQuestion {
  UNIQUEID?: string;
  correct_answers?: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  F?: string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface DistributionStats {
  total: number;
  byLetter: Record<string, number>;
  percentages: Record<string, number>;
}

function emptyStats(): DistributionStats {
  return {
    total: 0,
    byLetter: { A: 0, B: 0, C: 0, D: 0 },
    percentages: { A: 0, B: 0, C: 0, D: 0 },
  };
}

function finalizePercentages(stats: DistributionStats) {
  (['A', 'B', 'C', 'D'] as const).forEach((letter) => {
    stats.percentages[letter] = stats.total > 0 ? (stats.byLetter[letter] / stats.total) * 100 : 0;
  });
}

function auditAnswerDistribution() {
  const questions = QUESTIONS_DATA as RawQuestion[];

  const rawOverall = emptyStats();
  const rawByPrefix: Record<string, DistributionStats> = {};
  const effectiveOverall = emptyStats();

  for (const q of questions) {
    const correct = (q.correct_answers || '').trim();
    if (!correct || correct.includes(',')) continue; // single-select only
    if (!(['A', 'B', 'C', 'D'] as const).includes(correct as 'A' | 'B' | 'C' | 'D')) continue;

    const uniqueId = q.UNIQUEID || '';
    const prefix = uniqueId.split('_')[0] || 'unknown';

    // RAW distribution — stored letter, ignoring display shuffle
    rawOverall.total++;
    rawOverall.byLetter[correct]++;
    rawByPrefix[prefix] ??= emptyStats();
    rawByPrefix[prefix].total++;
    rawByPrefix[prefix].byLetter[correct]++;

    // EFFECTIVE distribution — where the answer actually lands on screen
    const letters = LETTERS.filter((l) => (q[l] || '').trim().length > 0);
    if (letters.length < 2) continue;
    const order = deterministicOptionOrder(uniqueId, letters);
    const displayIndex = order.indexOf(correct);
    if (displayIndex < 0 || displayIndex > 3) continue;
    const displayLetter = LETTERS[displayIndex];
    effectiveOverall.total++;
    effectiveOverall.byLetter[displayLetter]++;
  }

  finalizePercentages(rawOverall);
  Object.values(rawByPrefix).forEach(finalizePercentages);
  finalizePercentages(effectiveOverall);

  return { rawOverall, rawByPrefix, effectiveOverall };
}

function printBar(letter: string, count: number, pct: number) {
  const bar = '█'.repeat(Math.round(pct / 2));
  console.log(`  ${letter}: ${count.toString().padStart(4)} (${pct.toFixed(1).padStart(5)}%) ${bar}`);
}

function printDistributionReport(result: ReturnType<typeof auditAnswerDistribution>) {
  console.log('\n' + '='.repeat(80));
  console.log('ANSWER DISTRIBUTION AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('📦 RAW DISTRIBUTION (stored `correct_answers` letter — informational only)');
  console.log('-'.repeat(80));
  console.log(`Total Questions: ${result.rawOverall.total}`);
  console.log('');
  (['A', 'B', 'C', 'D'] as const).forEach((letter) =>
    printBar(letter, result.rawOverall.byLetter[letter], result.rawOverall.percentages[letter]),
  );
  console.log('');

  console.log('📦 RAW DISTRIBUTION BY UNIQUEID PREFIX');
  console.log('-'.repeat(80));
  for (const [prefix, stats] of Object.entries(result.rawByPrefix).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`\n${prefix} (${stats.total} questions):`);
    (['A', 'B', 'C', 'D'] as const).forEach((letter) => printBar(letter, stats.byLetter[letter], stats.percentages[letter]));
  }
  console.log('');

  console.log('🎯 EFFECTIVE DISTRIBUTION (what a test-taker actually sees, post display-shuffle)');
  console.log('-'.repeat(80));
  console.log(`Total Questions: ${result.effectiveOverall.total}`);
  console.log('');
  (['A', 'B', 'C', 'D'] as const).forEach((letter) =>
    printBar(letter, result.effectiveOverall.byLetter[letter], result.effectiveOverall.percentages[letter]),
  );
  console.log('');

  const imbalanced = (['A', 'B', 'C', 'D'] as const).filter((letter) => result.effectiveOverall.percentages[letter] > 35);

  if (imbalanced.length > 0) {
    console.log('⚠️  EFFECTIVE IMBALANCE DETECTED (this is the number that matters)');
    console.log('-'.repeat(80));
    imbalanced.forEach((letter) => {
      console.log(`  ${letter}: ${result.effectiveOverall.percentages[letter].toFixed(1)}% exceeds the 35% ceiling`);
    });
    console.log('');
  } else {
    console.log('✅ Effective (displayed) distribution is balanced — no letter exceeds 35%');
    console.log('');
  }

  console.log('='.repeat(80) + '\n');

  return imbalanced.length === 0;
}

const result = auditAnswerDistribution();
const ok = printDistributionReport(result);

process.exit(ok ? 0 : 1);
