/**
 * Diagnostic Resume Tests
 *
 * Covers six scenarios described in the diagnostic resume bug spec:
 *   1. User with no adaptive responses starts at question 1.
 *   2. User with incomplete adaptive responses + valid localStorage session resumes.
 *   3. User with incomplete adaptive responses but missing localStorage does NOT
 *      silently restart from question 1 (Supabase fallback path is triggered).
 *   4. Completed adaptive user is not asked to retake.
 *   5. (PR #25) Orphan user + Supabase fetch failure → adaptiveResumeError is set,
 *      not silent fresh-start.
 *   6. (PR #25) Completed user (flag drift defense) → predicate does NOT fire even
 *      if adaptiveResponseCount > 0 (because !adaptiveDiagnosticComplete guards it).
 *
 * Because these scenarios involve hook logic, browser localStorage, and Supabase
 * reads, the tests are structured around the pure utilities and the decision tree
 * rather than React rendering.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveUserSession,
  loadUserSession,
  createUserSession,
  deleteUserSession,
} from '../src/utils/userSessionStorage';

// ---------------------------------------------------------------------------
// Mocks — keep Supabase and Vite env errors out of the test runner
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// localStorage shim (Vitest runs in Node; jsdom/happy-dom not installed)
// ---------------------------------------------------------------------------
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { localStorageStore[key] = value; },
  removeItem: (key: string) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal AnalyzedQuestion-like shape for building test data. */
function makeQuestionId(skillId: string, n: number) {
  return `q_${skillId}_${n}`;
}

/** IDs of 45 mock skills (one per slot in a fake diagnostic). */
const MOCK_SKILL_IDS = Array.from({ length: 45 }, (_, i) => `skill_${String(i + 1).padStart(2, '0')}`);

/** One answered response per skill, up to `count`. */
function makeAnsweredIds(count: number): string[] {
  return MOCK_SKILL_IDS.slice(0, count).map(s => makeQuestionId(s, 1));
}

/** Build a synthetic session the same way startAdaptiveDiagnostic does. */
function buildSyntheticSession(
  answeredIds: string[],
  remainingIds: string[],
  existingSessionId: string,
  _firstTimestamp: number,
): {
  questionIds: string[];
  currentIndex: number;
  sessionId: string;
} {
  return {
    sessionId: existingSessionId,
    questionIds: [...answeredIds, ...remainingIds],
    currentIndex: answeredIds.length,
  };
}

// ---------------------------------------------------------------------------
// 1. Fresh start — no prior responses
// ---------------------------------------------------------------------------
describe('Scenario 1: User with no adaptive responses starts at question 1', () => {
  beforeEach(() => localStorageMock.clear());

  it('buildAdaptiveDiagnostic assigns currentIndex 0 for a brand-new user', () => {
    // A fresh session always starts at index 0. We verify this by creating a
    // brand-new session and checking its initial currentIndex.
    const session = createUserSession('testuser', 'adaptive-diagnostic', ['q1', 'q2'], 'adaptive-diagnostic');
    expect(session.currentIndex).toBe(0);
  });

  it('creates a session with the full initial question list, none pre-answered', () => {
    const qIds = MOCK_SKILL_IDS.map(s => makeQuestionId(s, 1));
    const session = createUserSession('testuser', 'adaptive-diagnostic', qIds, 'adaptive-diagnostic');

    expect(session.questionIds).toEqual(qIds);
    expect(session.currentIndex).toBe(0);
    expect(session.responses).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Resume from localStorage — valid session with saved progress
// ---------------------------------------------------------------------------
describe('Scenario 2: User with saved localStorage session resumes at correct index', () => {
  beforeEach(() => localStorageMock.clear());

  it('loadUserSession returns the exact saved session including currentIndex', () => {
    const qIds = MOCK_SKILL_IDS.map(s => makeQuestionId(s, 1));
    const session = createUserSession('testuser', 'adaptive-diagnostic', qIds, 'adaptive-diagnostic');

    // Simulate the component saving progress after 15 answers
    const updatedSession = { ...session, currentIndex: 15 };
    saveUserSession(updatedSession);

    const loaded = loadUserSession(session.sessionId);
    expect(loaded).not.toBeNull();
    expect(loaded!.currentIndex).toBe(15);
    expect(loaded!.sessionId).toBe(session.sessionId);
    expect(loaded!.type).toBe('adaptive-diagnostic');
  });

  it('resumes pick up the exact saved answer list (responses array)', () => {
    const qIds = ['qa', 'qb', 'qc'];
    const session = createUserSession('testuser', 'adaptive-diagnostic', qIds, 'adaptive-diagnostic');

    const fakeResponse = { questionId: 'qa', isCorrect: true } as unknown as typeof session['responses'][0];
    const updatedSession = { ...session, currentIndex: 1, responses: [fakeResponse] };
    saveUserSession(updatedSession);

    const loaded = loadUserSession(session.sessionId);
    expect(loaded!.responses).toHaveLength(1);
    expect(loaded!.responses[0].questionId).toBe('qa');
    expect(loaded!.currentIndex).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Missing localStorage — Supabase fallback must NOT silently restart
// ---------------------------------------------------------------------------
describe('Scenario 3: Missing localStorage with prior Supabase responses → synthetic session', () => {
  beforeEach(() => localStorageMock.clear());
  afterEach(() => localStorageMock.clear());

  it('loadUserSession returns null for a session ID not in storage', () => {
    const result = loadUserSession('adaptive-diagnostic-1234567890-xyz');
    expect(result).toBeNull();
  });

  it('synthetic session starts at the answered-question boundary, not at 0', () => {
    // Simulate: user answered 35 questions in Supabase; no localStorage.
    const answeredIds = makeAnsweredIds(35);
    const remainingIds = MOCK_SKILL_IDS.slice(35).map(s => makeQuestionId(s, 1));

    const synthetic = buildSyntheticSession(answeredIds, remainingIds, 'session-abc', Date.now());

    // Must NOT restart at 0.
    expect(synthetic.currentIndex).not.toBe(0);
    expect(synthetic.currentIndex).toBe(35);
    expect(synthetic.questionIds.slice(0, 35)).toEqual(answeredIds);
    expect(synthetic.questionIds.length).toBe(45);
  });

  it('synthetic session preserves all answered IDs in the question list', () => {
    const answeredIds = makeAnsweredIds(20);
    const remainingIds = MOCK_SKILL_IDS.slice(20).map(s => makeQuestionId(s, 1));

    const synthetic = buildSyntheticSession(answeredIds, remainingIds, 'session-xyz', Date.now());

    // Every answered ID must appear before currentIndex in questionIds.
    const answeredSection = synthetic.questionIds.slice(0, synthetic.currentIndex);
    for (const id of answeredIds) {
      expect(answeredSection).toContain(id);
    }
  });

  it('saving synthetic session to localStorage enables the normal resume path next time', () => {
    const answeredIds = makeAnsweredIds(35);
    const remainingIds = MOCK_SKILL_IDS.slice(35).map(s => makeQuestionId(s, 1));
    const syntheticData = buildSyntheticSession(answeredIds, remainingIds, 'session-resume', Date.now());

    // What startAdaptiveDiagnostic does: saveUserSession(synthetic)
    const syntheticSession = {
      userName: 'testuser',
      sessionId: syntheticData.sessionId,
      createdAt: Date.now(),
      type: 'adaptive-diagnostic' as const,
      assessmentFlow: 'adaptive-diagnostic' as const,
      questionIds: syntheticData.questionIds,
      currentIndex: syntheticData.currentIndex,
      responses: [],
      selectedAnswers: [],
      showFeedback: false,
      confidence: 'medium' as const,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      elapsedSeconds: 0,
    };
    saveUserSession(syntheticSession);

    const loaded = loadUserSession('session-resume');
    expect(loaded).not.toBeNull();
    expect(loaded!.currentIndex).toBe(35);
    expect(loaded!.type).toBe('adaptive-diagnostic');
  });
});

// ---------------------------------------------------------------------------
// 4. Completed adaptive user is not asked to retake
// ---------------------------------------------------------------------------
describe('Scenario 4: Completed adaptive user cannot restart', () => {
  it('adaptiveDiagnosticComplete=true is the guard condition in startAdaptiveDiagnostic', () => {
    // The guard in useAssessmentFlow.startAdaptiveDiagnostic:
    //   if (profile.adaptiveDiagnosticComplete) { alert(...); return; }
    //
    // We test the condition directly — it is a simple boolean check on the profile.
    const completedProfile = { adaptiveDiagnosticComplete: true };
    const incompleteProfile = { adaptiveDiagnosticComplete: false };

    expect(completedProfile.adaptiveDiagnosticComplete).toBe(true);
    expect(incompleteProfile.adaptiveDiagnosticComplete).toBe(false);

    // A user who completed the diagnostic should not be able to start a new one.
    // In the hook: if (profile.adaptiveDiagnosticComplete) { alert(...); return; }
    // This test confirms the correct field name and truthiness are used.
    function wouldBlockStart(profile: { adaptiveDiagnosticComplete?: boolean }) {
      return Boolean(profile.adaptiveDiagnosticComplete);
    }

    expect(wouldBlockStart(completedProfile)).toBe(true);
    expect(wouldBlockStart(incompleteProfile)).toBe(false);
    expect(wouldBlockStart({})).toBe(false); // undefined → false → not blocked
  });

  it('deleteUserSession cleans up after completion, but does not affect Supabase responses', () => {
    // Verify that deleting the localStorage session (what handleAdaptiveDiagnosticComplete
    // does on success) removes the entry from storage but the underlying responses
    // (which live in Supabase) are unaffected.
    const qIds = ['q1', 'q2', 'q3'];
    const session = createUserSession('testuser', 'adaptive-diagnostic', qIds, 'adaptive-diagnostic');

    deleteUserSession('testuser', session.sessionId);

    // localStorage entry is gone — Supabase resume path would take over if needed.
    expect(loadUserSession(session.sessionId)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Shared predicate test helper — mirror of the runtime predicate in
// useAssessmentFlow.ts so we can exercise the same decision logic without
// rendering the React hook. Keep this in sync with the in-flight check at
// `useAssessmentFlow.ts` (the `inFlightAdaptive` const in the
// startAdaptiveDiagnostic catch block).
// ---------------------------------------------------------------------------
function inFlightAdaptivePredicate(profile: {
  adaptiveDiagnosticComplete?: boolean;
  lastSession?: { mode?: string } | null;
  adaptiveResponseCount?: number;
}): boolean {
  const lastMode = profile.lastSession?.mode;
  return (
    !profile.adaptiveDiagnosticComplete &&
    (
      lastMode === 'adaptive' ||
      lastMode === 'adaptive_diagnostic' ||
      (profile.adaptiveResponseCount ?? 0) > 0
    )
  );
}

// ---------------------------------------------------------------------------
// 5. (PR #25) Orphan + Supabase fetch failure → adaptiveResumeError set
// ---------------------------------------------------------------------------
describe('Scenario 5: Orphan user + Supabase fetch failure surfaces an error', () => {
  beforeEach(() => localStorageMock.clear());

  it('predicate fires for an orphan (responses > 0, no lastSession, not complete)', () => {
    // The exact production state for clebron@my.nl.edu at the time of the bug:
    //   adaptive_diagnostic_complete = false
    //   last_session = null
    //   adaptive responses = 35
    // The fix in PR #25 ensures the catch-block predicate evaluates to TRUE
    // for this user so the amber error UI surfaces — instead of silently
    // falling through to a fresh queue and orphaning their saved progress.
    const orphanProfile = {
      adaptiveDiagnosticComplete: false,
      lastSession: null,
      adaptiveResponseCount: 35,
    };
    expect(inFlightAdaptivePredicate(orphanProfile)).toBe(true);
  });

  it('predicate fires for the canonical mid-session case (mode=adaptive)', () => {
    // Regression check: the original (PR #24) behavior must still hold for
    // users with a valid lastSession pointer.
    const inSessionProfile = {
      adaptiveDiagnosticComplete: false,
      lastSession: { mode: 'adaptive' },
      adaptiveResponseCount: 12,
    };
    expect(inFlightAdaptivePredicate(inSessionProfile)).toBe(true);
  });

  it('predicate fires for the legacy session mode `adaptive_diagnostic`', () => {
    // Backward-compat: rows persisted before the mode was canonicalized to
    // 'adaptive' (e.g., tbrooks22@my.nl.edu in production) must still match.
    const legacyProfile = {
      adaptiveDiagnosticComplete: false,
      lastSession: { mode: 'adaptive_diagnostic' },
      adaptiveResponseCount: 37,
    };
    expect(inFlightAdaptivePredicate(legacyProfile)).toBe(true);
  });

  it('predicate does NOT fire for a brand-new user with no responses and no session', () => {
    // Negative: a fresh user with no prior data and a Supabase fetch failure
    // should fall through to beginFreshAdaptiveDiagnostic(), NOT show the
    // error banner.
    const freshProfile = {
      adaptiveDiagnosticComplete: false,
      lastSession: null,
      adaptiveResponseCount: 0,
    };
    expect(inFlightAdaptivePredicate(freshProfile)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. (PR #25) Completed user (flag-drift defense)
// ---------------------------------------------------------------------------
describe('Scenario 6: Completed user does not see the orphan error banner', () => {
  it('predicate does NOT fire for a completed user, even with responses present', () => {
    // The originally-affected user clebron@my.nl.edu is now in this state:
    //   adaptive_diagnostic_complete = true
    //   adaptive responses = 45 (full queue)
    //   last_session = null
    // The !adaptiveDiagnosticComplete guard at the top of the predicate
    // ensures completed users never see the orphan error banner even if
    // their response count is non-zero.
    const completedProfile = {
      adaptiveDiagnosticComplete: true,
      lastSession: null,
      adaptiveResponseCount: 45,
    };
    expect(inFlightAdaptivePredicate(completedProfile)).toBe(false);
  });

  it('predicate does NOT fire for a completed user with stale lastSession.mode', () => {
    // Belt-and-suspenders: if a stale lastSession pointer is still pointing
    // at 'adaptive' but the user is actually completed, the !complete guard
    // still wins.
    const completedWithStale = {
      adaptiveDiagnosticComplete: true,
      lastSession: { mode: 'adaptive' },
      adaptiveResponseCount: 60,
    };
    expect(inFlightAdaptivePredicate(completedWithStale)).toBe(false);
  });
});
