/**
 * Adaptive Selection Integration Tests
 *
 * Tests the adaptive question selection system activated in Step 5:
 *   - Priority scoring correctly ranks weak skills above strong skills
 *   - selectNextQuestion prefers weak-skill questions
 *   - Foundational questions are preferred for low-attempt skills
 *   - Redemption blacklist is never violated (hard guarantee)
 *   - Pool-exhaustion fallback still respects the blacklist
 *
 * Approach: vi.mock('react') replaces useCallback with a passthrough so the
 * hook can run outside a React component tree without throwing.
 */

import { describe, it, expect, vi } from 'vitest';

// ── Mocks (hoisted by Vitest before all imports) ─────────────────────────────

// Replace useCallback with an identity passthrough so the hook works in Node
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, useCallback: (fn: unknown) => fn };
});

// Prevent env-var crash: supabase.ts throws when VITE_* vars are absent
// in a Vite/Vitest environment. Replace the whole module with a minimal stub.
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
import type { AnalyzedQuestion } from '../src/brain/question-analyzer';
import type { SkillPerformance } from '../src/brain/learning-state';
import type { UserProfile } from '../src/hooks/useProgressTracking';

// ── Test helpers ──────────────────────────────────────────────────────────────

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
    weakestDomains: [],            // will fall back to activeDomainIds
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
function makeQuestion(overrides: Partial<AnalyzedQuestion> = {}): AnalyzedQuestion {
  _qSeq++;
  return {
    id: `q${_qSeq}`,
    isGenerated: false,
    domains: [1],
    ...overrides,
  } as AnalyzedQuestion;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getWeakestSkills — priority ordering', () => {
  it('returns the weakest skill (lowest accuracy) as top priority', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    const profile = makeProfile({
      'skill-weak': makeSkillPerf({ score: 0.1, attempts: 5 }),
      'skill-strong': makeSkillPerf({ score: 0.9, attempts: 5 }),
    });

    const weakest = getWeakestSkills(profile);
    // cutoff = max(1, floor(2 * 0.3)) = max(1, 0) = 1 → only the single weakest
    expect(weakest).toContain('skill-weak');
    expect(weakest).not.toContain('skill-strong');
  });

  it('boosts priority for skills with recent high-confidence wrong answers (Rule 1)', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    // skill-hcw has medium accuracy but Rule-1 boost (+2 for hcw >= 2)
    // skill-low has low accuracy but no Rule-1 boost
    // Both score < 0.6 → base priority 3. skill-hcw gets +2 → total 5.
    // skill-low gets total 3. skill-hcw should rank higher.
    const profile = makeProfile({
      'skill-hcw': makeSkillPerf({ score: 0.55, attempts: 10, recentHighConfidenceWrongCount: 2 }),
      'skill-low': makeSkillPerf({ score: 0.4,  attempts: 10, recentHighConfidenceWrongCount: 0 }),
      'skill-ok':  makeSkillPerf({ score: 0.85, attempts: 10, recentHighConfidenceWrongCount: 0 }),
    });

    // 3 skills → cutoff = max(1, floor(3 * 0.3)) = max(1, 0) = 1
    const weakest = getWeakestSkills(profile);
    expect(weakest).toContain('skill-hcw');
    expect(weakest).not.toContain('skill-ok');
  });

  it('returns no skills when there are no attempts at all', () => {
    const { getWeakestSkills } = useAdaptiveLearning();

    const profile = makeProfile({
      'skill-a': makeSkillPerf({ score: 0, attempts: 0 }),
      'skill-b': makeSkillPerf({ score: 0, attempts: 0 }),
    });

    // filter(s => s.attempts > 0) → empty array
    const weakest = getWeakestSkills(profile);
    expect(weakest).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('selectNextQuestion — adaptive skill preference', () => {
  it('always selects questions for the weakest skill when a clear weak skill exists', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const weakSkill  = 'skill-weak';
    const strongSkill = 'skill-strong';

    const profile = makeProfile({
      [weakSkill]:  makeSkillPerf({ score: 0.1, attempts: 5 }),
      [strongSkill]: makeSkillPerf({ score: 0.9, attempts: 5 }),
    });

    const q1 = makeQuestion({ skillId: weakSkill,  domains: [1] });
    const q2 = makeQuestion({ skillId: strongSkill, domains: [1] });
    const questions = [q1, q2];

    // Run 40 trials — adaptive selection should consistently prefer the weak skill.
    // Even in the 30% "random domain" branch, the skill-weakness filter still fires.
    let weakCount = 0;
    for (let i = 0; i < 40; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result?.skillId === weakSkill) weakCount++;
    }

    // Deterministic path: skill-weak is the only entry in weakestSkills →
    // skillCandidates = [q1] in both the 70% and 30% branches → 100% q1.
    // Allow a small tolerance for any edge case.
    expect(weakCount).toBeGreaterThanOrEqual(36); // >= 90%
  });

  it('returns null only when the entire static pool is exhausted AND blacklisted', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const profile = makeProfile({});
    const q = makeQuestion({ isGenerated: false });
    const blacklist = new Set([q.id]);

    // q is blacklisted and no history → available = [] → fallback → allStaticQuestions = [] → null
    const result = selectNextQuestion(profile, [q], [], blacklist);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('selectNextQuestion — foundational question preference', () => {
  it('prefers foundational questions for skills with < 3 attempts', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-new';
    const profile = makeProfile({
      [skillId]: makeSkillPerf({ score: 0.1, attempts: 1 }), // < 3 attempts
    });

    const qFoundational = makeQuestion({ skillId, isFoundational: true,  domains: [1] });
    const qRegular      = makeQuestion({ skillId, isFoundational: false, domains: [1] });
    const questions = [qFoundational, qRegular];

    // Both questions target the same weak skill. Foundational should win because
    // lowAttemptSkills includes skillId (attempts=1 < 3).
    let foundationalCount = 0;
    for (let i = 0; i < 30; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result?.id === qFoundational.id) foundationalCount++;
    }

    // foundationalCandidates = [qFoundational] → deterministic pick
    expect(foundationalCount).toBe(30);
  });

  it('does NOT gate on foundational for skills with >= 3 attempts', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-experienced';
    const profile = makeProfile({
      [skillId]: makeSkillPerf({ score: 0.2, attempts: 5 }), // >= 3 attempts
    });

    const qFoundational = makeQuestion({ skillId, isFoundational: true,  domains: [1] });
    const qRegular      = makeQuestion({ skillId, isFoundational: false, domains: [1] });
    const questions = [qFoundational, qRegular];

    // With >= 3 attempts, lowAttemptSkills won't include this skill →
    // foundationalCandidates = [] → random from skillCandidates
    const ids = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const result = selectNextQuestion(profile, questions, []);
      if (result) ids.add(result.id);
    }

    // Both questions should appear in 40 trials (random from 2-element set)
    expect(ids.has(qFoundational.id)).toBe(true);
    expect(ids.has(qRegular.id)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('selectNextQuestion — redemption blacklist (hard guarantee)', () => {
  it('NEVER returns a blacklisted question in normal selection', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const skillId = 'skill-a';
    const profile = makeProfile({
      [skillId]: makeSkillPerf({ score: 0.2, attempts: 5 }),
    });

    const q1 = makeQuestion({ skillId, domains: [1] }); // eligible
    const q2 = makeQuestion({ skillId, domains: [1] }); // blacklisted
    const q3 = makeQuestion({ skillId, domains: [1] }); // blacklisted
    const q4 = makeQuestion({ skillId, domains: [1] }); // eligible
    const q5 = makeQuestion({ skillId, domains: [1] }); // eligible

    const blacklist = new Set([q2.id, q3.id]);
    const questions = [q1, q2, q3, q4, q5];

    for (let i = 0; i < 50; i++) {
      const result = selectNextQuestion(profile, questions, [], blacklist);
      expect(result).not.toBeNull();
      expect(blacklist.has(result!.id)).toBe(false);
    }
  });

  it('NEVER returns a blacklisted question in pool-exhaustion fallback', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const profile = makeProfile({});

    const q1 = makeQuestion({ domains: [1] }); // blacklisted
    const q2 = makeQuestion({ domains: [1] }); // in session history

    const blacklist = new Set([q1.id]);
    const history   = [q2.id]; // q2 seen this session → excluded from available

    // available = questions filtered by excludeIds = {q1 (blacklist), q2 (history)} → []
    // fallback = allStaticQuestions filtered by !blacklisted = [q2]
    // q1 must NEVER appear
    for (let i = 0; i < 20; i++) {
      const result = selectNextQuestion(profile, [q1, q2], history, blacklist);
      expect(result?.id).toBe(q2.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('selectNextQuestion — pool exhaustion fallback', () => {
  it('returns a question when all questions are in session history (no blacklist)', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const profile = makeProfile({});
    const q1 = makeQuestion({ domains: [1] });
    const q2 = makeQuestion({ domains: [1] });

    // Both questions seen this session → available = [] → fallback
    const result = selectNextQuestion(profile, [q1, q2], [q1.id, q2.id]);
    expect(result).not.toBeNull();
    expect([q1.id, q2.id]).toContain(result!.id);
  });

  it('returns null when the only question is both in history and in the blacklist', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const profile = makeProfile({});
    const q = makeQuestion({ isGenerated: false });

    const blacklist = new Set([q.id]);
    const history   = [q.id];

    // available = [] → fallback = allStaticQuestions where !blacklisted = [] → null
    const result = selectNextQuestion(profile, [q], history, blacklist);
    expect(result).toBeNull();
  });

  it('excludes assessment question IDs from the available pool', () => {
    const { selectNextQuestion } = useAdaptiveLearning();

    const q1 = makeQuestion({ domains: [1] }); // assessment item
    const q2 = makeQuestion({ domains: [1] }); // practice only

    const profile = makeProfile(
      { 'skill-x': makeSkillPerf() },
      { fullAssessmentQuestionIds: [q1.id] }
    );

    // q1 excluded by assessment list → only q2 is available
    for (let i = 0; i < 20; i++) {
      const result = selectNextQuestion(profile, [q1, q2], []);
      expect(result?.id).toBe(q2.id);
    }
  });
});
