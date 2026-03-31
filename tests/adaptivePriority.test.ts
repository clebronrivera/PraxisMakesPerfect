/**
 * Adaptive Priority Tests — SRS Rule 3 integration
 *
 * Verifies that the SRS overdue-review signal (Rule 3) correctly raises the
 * priority of skills whose nextReviewDate is at or before today, and that the
 * boost stacks correctly with Rules 1 and 2.
 *
 * Priority model recap:
 *   Base: score < 0.6 → +3 | score 0.6–0.8 → +2 | score >= 0.8 → +1
 *   Rule 1: recentHighConfidenceWrongCount >= 2 → +2.0 | === 1 → +1.0
 *   Rule 2: fragilityFlag (>= 50% last-6 low-confidence correct) → +1.0
 *   Rule 3: nextReviewDate <= today → +1.5
 */

import { describe, it, expect, vi } from 'vitest';

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

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
import type { AnalyzedQuestion } from '../src/brain/question-analyzer';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const TOMORROW  = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const PAST_WEEK = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

function makeSkillPerf(overrides: Partial<SkillPerformance> = {}): SkillPerformance {
  return {
    score: 0.5,
    attempts: 5,
    correct: 3,
    consecutiveCorrect: 0,
    history: [],
    learningState: 'developing',
    attemptHistory: [],
    recentHighConfidenceWrongCount: 0,
    ...overrides,
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

let _qSeq = 0;
function makeQuestion(skillId: string, overrides: Partial<AnalyzedQuestion> = {}): AnalyzedQuestion {
  _qSeq++;
  return {
    id: `pq${_qSeq}`,
    isGenerated: false,
    domains: [1],
    skillId,
    ...overrides,
  } as AnalyzedQuestion;
}

// ── SRS Rule 3: priority boost ────────────────────────────────────────────────

describe('SRS Rule 3 — overdue review priority boost (+1.5)', () => {
  it('overdue skill is preferred over a higher-accuracy skill with no review date', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-overdue: accuracy 0.65 (approaching, base +2) + SRS overdue (+1.5) = 3.5
    // skill-weak:    accuracy 0.4  (emerging, base +3) + no SRS           = 3.0
    // skill-overdue should rank higher despite better raw accuracy
    const profile = makeProfile({
      'skill-overdue': makeSkillPerf({ score: 0.65, attempts: 8, nextReviewDate: YESTERDAY }),
      'skill-weak':    makeSkillPerf({ score: 0.40, attempts: 8 }),
    });

    // 2 skills → cutoff = max(1, floor(2 * 0.3)) = 1 → top 1 returned
    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-overdue');
    expect(weakest).not.toContain('skill-weak');
  });

  it('skill with future nextReviewDate gets no SRS boost', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-future:  accuracy 0.65 (base +2) + no SRS boost (tomorrow) = 2.0
    // skill-weak:    accuracy 0.4  (base +3) + no boost                = 3.0
    // skill-weak should rank higher
    const profile = makeProfile({
      'skill-future': makeSkillPerf({ score: 0.65, attempts: 8, nextReviewDate: TOMORROW }),
      'skill-weak':   makeSkillPerf({ score: 0.40, attempts: 8 }),
    });

    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-weak');
    expect(weakest).not.toContain('skill-future');
  });

  it('skill with nextReviewDate === today is overdue (inclusive boundary)', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // TODAY should trigger the boost (nextReviewDate <= today is true when equal)
    // skill-today:  0.65 + 1.5 = 3.5 > skill-weak: 0.4 base = 3.0
    const profile = makeProfile({
      'skill-today': makeSkillPerf({ score: 0.65, attempts: 8, nextReviewDate: TODAY }),
      'skill-weak':  makeSkillPerf({ score: 0.40, attempts: 8 }),
    });

    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-today');
    expect(weakest).not.toContain('skill-weak');
  });

  it('skill with no nextReviewDate (new/never reviewed) gets no SRS boost', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-no-date: accuracy 0.65 + no SRS (undefined nextReviewDate) = 2.0
    // skill-weak:    accuracy 0.4 = 3.0
    const profile = makeProfile({
      'skill-no-date': makeSkillPerf({ score: 0.65, attempts: 8 }),   // no nextReviewDate
      'skill-weak':    makeSkillPerf({ score: 0.40, attempts: 8 }),
    });

    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-weak');
    expect(weakest).not.toContain('skill-no-date');
  });

  it('SRS boost stacks correctly with Rule 1 (high-confidence wrong)', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-stacked: accuracy 0.7 (base +2) + Rule1 HCW=2 (+2) + SRS overdue (+1.5) = 5.5
    // skill-very-weak: accuracy 0.1 (base +3) + no other signals               = 3.0
    // skill-stacked wins despite better accuracy because of combined signal weight
    const profile = makeProfile({
      'skill-stacked':   makeSkillPerf({
        score: 0.7,
        attempts: 10,
        recentHighConfidenceWrongCount: 2,
        nextReviewDate: PAST_WEEK,
      }),
      'skill-very-weak': makeSkillPerf({ score: 0.1, attempts: 10 }),
    });

    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-stacked');
    expect(weakest).not.toContain('skill-very-weak');
  });

  it('SRS boost stacks correctly with Rule 2 (fragility flag)', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-fragile-overdue: score 0.75 (base +2) + fragility (+1) + SRS (+1.5) = 4.5
    // skill-weak: score 0.3 (base +3) = 3.0
    // skill-fragile-overdue wins despite higher raw accuracy
    const lowConfCorrect = Array.from({ length: 6 }, () => ({
      questionId: 'q',
      correct: true,
      confidence: 'low' as const,
      timestamp: Date.now(),
      timeSpent: 30,
    }));

    const profile = makeProfile({
      'skill-fragile-overdue': makeSkillPerf({
        score: 0.75,
        attempts: 10,
        attemptHistory: lowConfCorrect,
        nextReviewDate: YESTERDAY,
      }),
      'skill-weak': makeSkillPerf({ score: 0.30, attempts: 10 }),
    });

    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-fragile-overdue');
    expect(weakest).not.toContain('skill-weak');
  });
});

// ── Adaptive selection reflects SRS priority ──────────────────────────────────

describe('selectNextQuestion — SRS overdue skill is preferred', () => {
  it('selects questions for overdue skill over non-overdue skill of similar accuracy', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    // Both skills are "emerging" (score < 0.6), but skill-overdue gets +1.5 SRS boost
    // so it should be the sole entry in weakestSkills (cutoff=1)
    const profile = makeProfile({
      'skill-overdue': makeSkillPerf({ score: 0.45, attempts: 8, nextReviewDate: PAST_WEEK }),
      'skill-current': makeSkillPerf({ score: 0.50, attempts: 8 }), // no SRS boost
    });

    const qOverdue  = makeQuestion('skill-overdue');
    const qCurrent  = makeQuestion('skill-current');
    const questions = [qOverdue, qCurrent];

    let overdueCount = 0;
    for (let i = 0; i < 40; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result?.skillId === 'skill-overdue') overdueCount++;
    }

    // skill-overdue: 3 (base) + 1.5 (SRS) = 4.5 > skill-current: 3 (base) = 3.0
    // skill-overdue is the sole entry in weakestSkills (cutoff=1)
    // → qOverdue is selected in both 70% and 30% branches → 100%
    expect(overdueCount).toBeGreaterThanOrEqual(36); // >= 90%
  });
});
