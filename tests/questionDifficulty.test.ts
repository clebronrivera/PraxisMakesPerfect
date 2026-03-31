/**
 * Question Difficulty Tier Tests (Step 8)
 *
 * Tests the two-tier difficulty system and its integration into adaptive selection.
 *
 * Tier assignment:
 *   cognitiveComplexity === 'Recall'      → Tier 1
 *   cognitiveComplexity === 'Application' → Tier 2
 *   missing / unknown                     → null (untiered, always eligible)
 *
 * Routing rule:
 *   skill accuracy < 40%  → prefer Tier 1 (Recall)
 *   skill accuracy >= 40% → prefer Tier 2 (Application)
 *   no tier-matched questions → fallback to full candidate pool
 */

import { describe, it, expect, vi } from 'vitest';

// ── Pure utility tests (no React mocks needed) ────────────────────────────────
import {
  getQuestionTier,
  getPreferredTier,
  filterByPreferredTier,
} from '../src/utils/questionDifficulty';
import type { AnalyzedQuestion } from '../src/brain/question-analyzer';

// ── Hook integration tests (React mock required) ──────────────────────────────

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useCallback: (fn: unknown) => fn };
});

vi.mock('../src/config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

import { useAdaptiveLearning } from '../src/hooks/useAdaptiveLearning';
import type { SkillPerformance } from '../src/brain/learning-state';
import type { UserProfile } from '../src/hooks/useProgressTracking';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQ(
  id: string,
  cognitiveComplexity?: string,
  overrides: Partial<AnalyzedQuestion> = {}
): AnalyzedQuestion {
  return {
    id,
    isGenerated: false,
    domains: [1],
    cognitiveComplexity,
    ...overrides,
  } as AnalyzedQuestion;
}

function makeSkillPerf(score: number, attempts = 8): SkillPerformance {
  return {
    score,
    attempts,
    correct: Math.round(score * attempts),
    consecutiveCorrect: 0,
    history: [],
    learningState: 'developing',
    attemptHistory: [],
    recentHighConfidenceWrongCount: 0,
  };
}

function makeProfile(
  skillScores: Record<string, SkillPerformance>,
  overrides: Partial<UserProfile> = {}
): UserProfile {
  return {
    skillScores: skillScores as UserProfile['skillScores'],
    weakestDomains: [],
    domainScores: {},
    factualGaps: [],
    errorPatterns: [],
    totalQuestionsSeen: 0,
    streak: 0,
    flaggedQuestions: {},
    distractorErrors: {},
    skillDistractorErrors: {},
    preAssessmentQuestionIds: [],
    fullAssessmentQuestionIds: [],
    recentPracticeQuestionIds: [],
    screenerItemIds: [],
    ...overrides,
  } as UserProfile;
}

// ── getQuestionTier ───────────────────────────────────────────────────────────

describe('getQuestionTier', () => {
  it("returns 1 for cognitiveComplexity === 'Recall'", () => {
    expect(getQuestionTier(makeQ('q1', 'Recall'))).toBe(1);
  });

  it("returns 2 for cognitiveComplexity === 'Application'", () => {
    expect(getQuestionTier(makeQ('q2', 'Application'))).toBe(2);
  });

  it('returns null when cognitiveComplexity is missing', () => {
    expect(getQuestionTier(makeQ('q3'))).toBeNull();
  });

  it('returns null for an unrecognised cognitiveComplexity value', () => {
    expect(getQuestionTier(makeQ('q4', 'Analysis'))).toBeNull();
  });
});

// ── getPreferredTier ──────────────────────────────────────────────────────────

describe('getPreferredTier', () => {
  it('returns 1 (Recall) for accuracy < 0.40', () => {
    expect(getPreferredTier(0.0)).toBe(1);
    expect(getPreferredTier(0.2)).toBe(1);
    expect(getPreferredTier(0.39)).toBe(1);
  });

  it('returns 2 (Application) for accuracy === 0.40 (inclusive boundary)', () => {
    expect(getPreferredTier(0.40)).toBe(2);
  });

  it('returns 2 (Application) for accuracy > 0.40', () => {
    expect(getPreferredTier(0.5)).toBe(2);
    expect(getPreferredTier(0.8)).toBe(2);
    expect(getPreferredTier(1.0)).toBe(2);
  });
});

// ── filterByPreferredTier ─────────────────────────────────────────────────────

describe('filterByPreferredTier', () => {
  const qRecall = makeQ('r1', 'Recall');
  const qApp    = makeQ('a1', 'Application');
  const qNoTier = makeQ('n1');          // no cognitiveComplexity
  const pool    = [qRecall, qApp, qNoTier];

  it('returns only Recall questions when accuracy < 0.40', () => {
    const result = filterByPreferredTier(pool, 0.3);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('returns only Application questions when accuracy >= 0.40', () => {
    const result = filterByPreferredTier(pool, 0.55);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('falls back to the full pool when no tier-matched questions exist', () => {
    // Pool has only untiered question — neither tier has a match
    const noTierPool = [qNoTier];
    const result = filterByPreferredTier(noTierPool, 0.3);
    // fallback: returns full pool
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });

  it('falls back when the preferred tier is entirely absent', () => {
    // Pool has only Application and untiered — but accuracy < 0.40 wants Recall
    const appOnly = [qApp, qNoTier];
    const result = filterByPreferredTier(appOnly, 0.2);
    // No Recall → fallback to full [qApp, qNoTier]
    expect(result).toHaveLength(2);
  });
});

// ── Integration: selectNextQuestion applies tier routing ──────────────────────

describe('selectNextQuestion — difficulty tier routing (Step 8)', () => {
  it('prefers Recall questions for a skill with accuracy < 40%', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-low';
    const profile = makeProfile({
      [skillId]: makeSkillPerf(0.25, 10), // 25% — should prefer Recall
    });

    const qRecall = makeQ('r1', 'Recall',      { skillId, domains: [1] });
    const qApp    = makeQ('a1', 'Application', { skillId, domains: [1] });
    const questions = [qRecall, qApp];

    let recallCount = 0;
    for (let i = 0; i < 30; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result?.id === qRecall.id) recallCount++;
    }

    // filterByPreferredTier(candidates, 0.25) → Recall tier → [qRecall] → always qRecall
    expect(recallCount).toBe(30);
  });

  it('prefers Application questions for a skill with accuracy >= 40%', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-mid';
    const profile = makeProfile({
      [skillId]: makeSkillPerf(0.60, 10), // 60% — should prefer Application
    });

    const qRecall = makeQ('r2', 'Recall',      { skillId, domains: [1] });
    const qApp    = makeQ('a2', 'Application', { skillId, domains: [1] });
    const questions = [qRecall, qApp];

    let appCount = 0;
    for (let i = 0; i < 30; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result?.id === qApp.id) appCount++;
    }

    // filterByPreferredTier(candidates, 0.60) → Application tier → [qApp] → always qApp
    expect(appCount).toBe(30);
  });

  it('falls back to any question when no tier-matched questions exist for the skill', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-no-recall';
    const profile = makeProfile({
      [skillId]: makeSkillPerf(0.2, 10), // 20% — wants Recall, but none available
    });

    // All questions are Application → tier fallback → both are eligible
    const qA1 = makeQ('ap1', 'Application', { skillId, domains: [1] });
    const qA2 = makeQ('ap2', 'Application', { skillId, domains: [1] });
    const questions = [qA1, qA2];

    const resultIds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result) resultIds.add(result.id);
    }

    // Fallback: both Application questions are eligible, both should appear
    expect(resultIds.has('ap1')).toBe(true);
    expect(resultIds.has('ap2')).toBe(true);
  });

  it('tier routing does not affect foundational gating (foundational still wins when < 3 attempts)', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-new';
    const profile = makeProfile({
      [skillId]: makeSkillPerf(0.2, 1), // 1 attempt → isFoundational gating still active
    });

    // foundational=true Application question — even though accuracy < 40% wants Recall,
    // the foundational gate fires first and should return this question
    const qFoundApp  = makeQ('f1', 'Application', { skillId, isFoundational: true,  domains: [1] });
    const qRegRecall = makeQ('r3', 'Recall',       { skillId, isFoundational: false, domains: [1] });
    const questions = [qFoundApp, qRegRecall];

    // foundationalCandidates = [qFoundApp] (only foundational question)
    // That branch returns before reaching tier routing
    for (let i = 0; i < 20; i++) {
      const result = selectNextQuestion(profile, questions, []);
      expect(result?.id).toBe('f1');
    }
  });
});
