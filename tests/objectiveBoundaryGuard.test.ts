import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Architectural boundary guard.
 *
 * The objective layer (skillObjectiveMap / questionObjectiveMap) is DESCRIPTIVE / routing
 * metadata only. The 45 skills remain the scored/mastery unit. To keep that contract
 * mechanically true, no scoring / mastery / proficiency / readiness / adaptive-selection
 * source file may import the objective maps. This test fails if one ever does.
 *
 * When the objective layer is intentionally promoted into scoring (a deliberate future
 * decision, only after the maps are human-reviewed), update this list with that change.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// The canonical scoring / mastery / adaptive-selection boundary (verified clean today).
const GUARDED_FILES = [
  'src/hooks/useAdaptiveLearning.ts',
  'src/hooks/useProgressTracking.ts',
  'src/hooks/useRedemptionRounds.ts',
  'src/brain/learning-state.ts',
  'src/utils/questionDifficulty.ts',
  'src/utils/skillProficiency.ts',
  'src/utils/progressSummaries.ts',
  'src/utils/assessmentReport.ts',
  'src/utils/studyPlanPreprocessor.ts',
  'src/utils/globalScoreCalculator.ts',
  'src/utils/rebuildProgressFromResponses.ts',
  'src/utils/srsEngine.ts',
  'src/components/PracticeSession.tsx',
];

const FORBIDDEN = /from\s+['"][^'"]*(?:skillObjectiveMap|questionObjectiveMap)['"]/;

describe('objective → scoring boundary guard', () => {
  it.each(GUARDED_FILES)('%s does not import the objective maps', (rel) => {
    const content = readFileSync(join(root, rel), 'utf-8');
    expect(
      FORBIDDEN.test(content),
      `${rel} imports an objective map — objectives must not influence scoring/mastery/selection`,
    ).toBe(false);
  });

  it('all guarded files exist (the boundary list is not silently stale)', () => {
    for (const rel of GUARDED_FILES) {
      expect(() => readFileSync(join(root, rel), 'utf-8'), `${rel} is missing`).not.toThrow();
    }
  });
});
