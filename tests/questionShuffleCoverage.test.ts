// Guards against the exact regression found in the 2026-07-09 QA audit: two
// question-rendering surfaces (Redemption Rounds, Learning Path mini-quizzes)
// shipped WITHOUT any answer-option shuffle, so the bank's ~70%-"B"
// stored-correct-answer skew (src/utils/optionShuffle.ts) was fully exploitable
// there ("always guess B" scores ~70% with zero content knowledge). Fixed by
// wiring those two into the same withShuffledOptions() helper already used by
// AdaptiveDiagnostic/ScreenerAssessment/FullAssessment since decef8e (2026-06-10).
//
// If this test starts failing because you added a new component that shows a
// bank question's answer choices to a test-taker, either wire it into
// withShuffledOptions() (preferred) or add it to COMPONENTS_WITH_OWN_SHUFFLE with
// a comment explaining its independent shuffle mechanism.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const COMPONENTS_USING_SHARED_SHUFFLE = [
  'src/components/AdaptiveDiagnostic.tsx',
  'src/components/ScreenerAssessment.tsx',
  'src/components/FullAssessment.tsx',
  'src/components/RedemptionRoundSession.tsx',
  'src/components/LearningPathModulePage.tsx',
];

// PracticeSession pre-dates optionShuffle.ts and re-shuffles option order itself
// (Math.random(), per question load) rather than the shared deterministic helper.
const COMPONENTS_WITH_OWN_SHUFFLE = ['src/components/PracticeSession.tsx'];

describe('question-rendering surfaces defeat the stored answer-letter skew', () => {
  it.each(COMPONENTS_USING_SHARED_SHUFFLE)(
    '%s imports and calls withShuffledOptions',
    (relPath) => {
      const src = readFileSync(join(root, relPath), 'utf8');
      expect(src, `${relPath} does not import withShuffledOptions`).toMatch(
        /from ['"].*optionShuffle['"]/,
      );
      expect(src, `${relPath} does not call withShuffledOptions(`).toContain(
        'withShuffledOptions(',
      );
    },
  );

  it.each(COMPONENTS_WITH_OWN_SHUFFLE)(
    '%s has its own option-shuffle mechanism',
    (relPath) => {
      const src = readFileSync(join(root, relPath), 'utf8');
      expect(src, `${relPath} has no shuffle logic of any kind`).toMatch(/shuffl/i);
    },
  );
});
