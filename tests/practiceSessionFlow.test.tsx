// @vitest-environment jsdom
//
// Integration tests for PracticeSession (src/components/PracticeSession.tsx) —
// Phase 4 behavior pinning ahead of the Phase 5 App.tsx decomposition.
//
// Pins the highest-risk wiring: answer/streak/session-stats, question
// retirement (localStorage), and the Redemption Rounds integration contract
// (onAnswerSubmitted / onWrongAnswer / onHintRedemption / blacklist exclusion).
// Supabase is mocked at the hook boundary (useAuth) and service boundary
// (glossaryService); progress persistence arrives via props and is asserted
// as the seam, exactly as App.tsx wires it.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PracticeSession from '../src/components/PracticeSession';
import { ContentProvider } from '../src/contexts/ContentContext';
import type { UserProfile } from '../src/hooks/useProgressTracking';
import type { AnalyzedQuestion } from '../src/brain/question-analyzer';
import { makeQuestion, correctChoiceText, wrongChoiceText } from './helpers/questionFixture';

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'tester@example.com' },
    loading: false,
    error: null,
    signInWithEmail: async () => {},
    signUpWithEmail: async () => {},
    resetPassword: async () => {},
    logout: async () => {},
    clearError: () => {},
  }),
}));

vi.mock('../src/services/glossaryService', () => ({
  addTermsFromWrongAnswer: vi.fn().mockResolvedValue(undefined),
}));

const RETIRE_STORE_KEY = 'pmp-qretire-user-1';

function buildPool(): AnalyzedQuestion[] {
  // p1/p2 share a skill so the wrong-answer follow-up narrows to a non-empty pool.
  return [
    makeQuestion({
      id: 'prac-p1',
      skillId: 'skill-1',
      primaryModuleId: 'MOD-T-01',
      primarySnippet: 'Module snippet that teaches prac-p1.',
      moduleRefs: [{ moduleId: 'MOD-T-01', moduleTitle: 'Test Module One', snippet: 'Module snippet that teaches prac-p1.' }],
    }),
    makeQuestion({ id: 'prac-p2', skillId: 'skill-1' }),
    makeQuestion({ id: 'prac-p3', skillId: 'skill-2' }),
  ];
}

function makeProfile(): UserProfile {
  return {
    domainScores: {},
    skillScores: {},
    weakestDomains: [],
    factualGaps: [],
    errorPatterns: [],
    totalQuestionsSeen: 0,
    streak: 0,
    flaggedQuestions: {},
    distractorErrors: {},
    skillDistractorErrors: {},
  } as unknown as UserProfile;
}

function renderPractice(opts: { pool?: AnalyzedQuestion[]; redemptionBlacklistIds?: Set<string> } = {}) {
  const pool = opts.pool ?? buildPool();
  const updateSkillProgress = vi.fn().mockResolvedValue(undefined);
  const logResponse = vi.fn().mockResolvedValue(undefined);
  const updateLastSession = vi.fn().mockResolvedValue(undefined);
  const savePracticeResponse = vi.fn().mockResolvedValue(undefined);
  const onAnswerSubmitted = vi.fn();
  const onWrongAnswer = vi.fn();
  const onHintRedemption = vi.fn();
  const onExitPractice = vi.fn();
  // Deterministic selector: first pool question not yet in history.
  const selectNextQuestion = vi.fn(
    (_profile: UserProfile, questions: AnalyzedQuestion[], history: string[]) =>
      questions.find(q => !history.includes(q.id)) ?? null
  );

  render(
    <ContentProvider>
      <PracticeSession
        userProfile={makeProfile()}
        updateSkillProgress={updateSkillProgress}
        logResponse={logResponse}
        updateLastSession={updateLastSession}
        savePracticeResponse={savePracticeResponse}
        analyzedQuestions={pool}
        selectNextQuestion={selectNextQuestion}
        onExitPractice={onExitPractice}
        onAnswerSubmitted={onAnswerSubmitted}
        onWrongAnswer={onWrongAnswer}
        onHintRedemption={onHintRedemption}
        redemptionBlacklistIds={opts.redemptionBlacklistIds}
      />
    </ContentProvider>
  );

  return {
    pool, updateSkillProgress, logResponse, updateLastSession, savePracticeResponse,
    onAnswerSubmitted, onWrongAnswer, onHintRedemption, onExitPractice, selectNextQuestion,
  };
}

async function answerCurrentQuestion(user: ReturnType<typeof userEvent.setup>, choiceText: string) {
  await user.click(screen.getByText(choiceText));
  await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
}

beforeEach(() => {
  localStorage.clear();
});

describe('PracticeSession — answering', () => {
  it('renders the selected question with the session header', async () => {
    const { pool } = renderPractice();
    expect(await screen.findByText(`Question stem for ${pool[0].id}?`)).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Correct: 0')).toBeInTheDocument();
    expect(screen.getByText('Wrong: 0')).toBeInTheDocument();
  });

  it('correct answer updates stats, persists, and counts toward redemption credit', async () => {
    const user = userEvent.setup();
    const { pool, updateSkillProgress, logResponse, savePracticeResponse, onAnswerSubmitted, onWrongAnswer } = renderPractice();
    const p1 = pool[0];
    await screen.findByText(`Question stem for ${p1.id}?`);

    await answerCurrentQuestion(user, correctChoiceText(p1));

    expect(await screen.findByText('Correct: 1')).toBeInTheDocument();
    expect(onAnswerSubmitted).toHaveBeenCalledTimes(1);
    expect(onWrongAnswer).not.toHaveBeenCalled();
    expect(updateSkillProgress).toHaveBeenCalledWith('skill-1', true, 'medium', p1.id, expect.any(Number));
    expect(logResponse).toHaveBeenCalledWith(expect.objectContaining({
      questionId: p1.id,
      assessmentType: 'practice',
      isCorrect: true,
    }));
    expect(savePracticeResponse).toHaveBeenCalledWith(
      'practice-general-user-1',
      p1.id,
      expect.objectContaining({ is_correct: true, consecutive_correct: 1, skill_id: 'skill-1' })
    );

    // Feedback phase → advance to the next question.
    await user.click(screen.getByRole('button', { name: /Next Question/ }));
    expect(await screen.findByText(`Question stem for ${pool[1].id}?`)).toBeInTheDocument();
  });

  it('shows the streak banner after two consecutive correct answers', async () => {
    const user = userEvent.setup();
    const { pool } = renderPractice();
    await screen.findByText(`Question stem for ${pool[0].id}?`);

    await answerCurrentQuestion(user, correctChoiceText(pool[0]));
    await user.click(await screen.findByRole('button', { name: /Next Question/ }));
    await screen.findByText(`Question stem for ${pool[1].id}?`);
    await answerCurrentQuestion(user, correctChoiceText(pool[1]));

    expect(await screen.findByText('2 in a row')).toBeInTheDocument();
  });

  it('wrong answer tracks toward the redemption miss threshold and updates stats', async () => {
    const user = userEvent.setup();
    const { pool, onWrongAnswer, onAnswerSubmitted, updateSkillProgress } = renderPractice();
    const p1 = pool[0];
    await screen.findByText(`Question stem for ${p1.id}?`);

    await answerCurrentQuestion(user, wrongChoiceText(p1));

    expect(await screen.findByText('Wrong: 1')).toBeInTheDocument();
    expect(onWrongAnswer).toHaveBeenCalledWith(p1.id, 'skill-1');
    expect(onAnswerSubmitted).toHaveBeenCalledTimes(1); // non-hint answers always count toward credit
    expect(updateSkillProgress).toHaveBeenCalledWith('skill-1', false, 'medium', p1.id, expect.any(Number));
  });
});

describe('PracticeSession — hint quarantine', () => {
  it('hint-used answers do not score, and quarantine fires once on transition', async () => {
    const user = userEvent.setup();
    const { pool, updateSkillProgress, onAnswerSubmitted, onWrongAnswer, onHintRedemption } = renderPractice();
    const p1 = pool[0];
    await screen.findByText(`Question stem for ${p1.id}?`);

    // Open the hint — irreversible "hint used" marking.
    await user.click(screen.getByRole('button', { name: /Open module hint/ }));
    expect(screen.getByText('(used)')).toBeInTheDocument();
    expect(screen.getByText('Module snippet that teaches prac-p1.')).toBeInTheDocument();

    await answerCurrentQuestion(user, correctChoiceText(p1));

    // Hint-used: excluded from score, credit counter, and miss tracking.
    expect(await screen.findByText(/Hint was used — this answer didn't count/)).toBeInTheDocument();
    expect(updateSkillProgress).not.toHaveBeenCalled();
    expect(onAnswerSubmitted).not.toHaveBeenCalled();
    expect(onWrongAnswer).not.toHaveBeenCalled();
    expect(onHintRedemption).not.toHaveBeenCalled(); // fires on transition, not on submit

    await user.click(screen.getByRole('button', { name: /Next Question/ }));
    expect(onHintRedemption).toHaveBeenCalledTimes(1);
    expect(onHintRedemption).toHaveBeenCalledWith(p1.id, 'skill-1');
    expect(await screen.findByText('Quarantined to a Redemption Round')).toBeInTheDocument();
  });
});

describe('PracticeSession — redemption blacklist', () => {
  it('quarantined questions are excluded from the selection pool', async () => {
    const { pool, selectNextQuestion } = renderPractice({
      redemptionBlacklistIds: new Set(['prac-p1']),
    });

    // First rendered question skips the quarantined p1.
    expect(await screen.findByText(`Question stem for ${pool[1].id}?`)).toBeInTheDocument();
    expect(screen.queryByText(`Question stem for ${pool[0].id}?`)).not.toBeInTheDocument();

    // The selector is never offered the quarantined question.
    const offeredIds = selectNextQuestion.mock.calls[0][1].map((q: AnalyzedQuestion) => q.id);
    expect(offeredIds).not.toContain('prac-p1');
    expect(offeredIds).toEqual(expect.arrayContaining(['prac-p2', 'prac-p3']));
  });
});

describe('PracticeSession — question retirement', () => {
  it('retires a question on its 2nd correct answer once the first pass is complete', async () => {
    const user = userEvent.setup();
    const pool = buildPool();
    // Seed: every question seen once (first pass done); p1 already correct once.
    localStorage.setItem(RETIRE_STORE_KEY, JSON.stringify({
      'prac-p1': { times_seen: 1, times_correct: 1, retired: false, last_seen_at: 1 },
      'prac-p2': { times_seen: 1, times_correct: 0, retired: false, last_seen_at: 1 },
      'prac-p3': { times_seen: 1, times_correct: 0, retired: false, last_seen_at: 1 },
    }));

    renderPractice({ pool });
    await screen.findByText(`Question stem for ${pool[0].id}?`);
    await answerCurrentQuestion(user, correctChoiceText(pool[0]));

    // 2nd all-time correct + first pass complete → retired (weak p2/p3 untouched).
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(RETIRE_STORE_KEY) ?? '{}');
      expect(stored['prac-p1']).toMatchObject({ times_seen: 2, times_correct: 2, retired: true });
      expect(stored['prac-p2'].retired).toBe(false);
    });
    // Retirement progress pill reflects the pool state.
    expect(await screen.findByText('Retired')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });
});
