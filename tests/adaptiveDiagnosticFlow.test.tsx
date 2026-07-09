// @vitest-environment jsdom
//
// Integration tests for the adaptive-diagnostic assessment flow
// (src/components/AdaptiveDiagnostic.tsx) — the first React component tests in
// the repo (Phase 4 of docs/PLAN_2026-07-02_code-review-followups.md).
//
// Purpose: pin BEHAVIOR ahead of the Phase 5 App.tsx decomposition, not chase
// coverage. Supabase is mocked at the hook boundary (useAuth) and the service
// boundary (glossaryService); persistence callbacks (logResponse,
// updateSkillProgress, …) are the App-provided props, asserted as the seam.
// The post-completion practice/study-guide unlock lives in App.tsx and is
// exercised via the onComplete contract pinned here.
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdaptiveDiagnostic from '../src/components/AdaptiveDiagnostic';
import { ContentProvider } from '../src/contexts/ContentContext';
import { saveUserSession, type UserSession } from '../src/utils/userSessionStorage';
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

const SESSION_ID = 'adaptive-test-session';

function buildQueue() {
  const q1 = makeQuestion({ id: 'diag-q1', skillId: 'skill-1' });
  const q2 = makeQuestion({ id: 'diag-q2', skillId: 'skill-2' });
  return { q1, q2, initialQueue: [q1, q2] };
}

function renderDiagnostic(opts: {
  initialQueue: AnalyzedQuestion[];
  followUpPool?: Record<string, AnalyzedQuestion[]>;
} ) {
  const onComplete = vi.fn();
  const onPauseExit = vi.fn();
  const logResponse = vi.fn().mockResolvedValue(undefined);
  const updateSkillProgress = vi.fn().mockResolvedValue(undefined);
  const updateLastSession = vi.fn().mockResolvedValue(undefined);
  const recordDiagnosticMiss = vi.fn().mockResolvedValue({ wrongCount: 1, inRedemption: false });

  render(
    <ContentProvider>
      <AdaptiveDiagnostic
        initialQueue={opts.initialQueue}
        followUpPool={opts.followUpPool ?? {}}
        onComplete={onComplete}
        onPauseExit={onPauseExit}
        sessionId={SESSION_ID}
        currentUserName="Tester"
        logResponse={logResponse}
        updateSkillProgress={updateSkillProgress}
        updateLastSession={updateLastSession}
        recordDiagnosticMiss={recordDiagnosticMiss}
      />
    </ContentProvider>
  );

  return { onComplete, onPauseExit, logResponse, updateSkillProgress, updateLastSession, recordDiagnosticMiss };
}

/** Select an answer by its choice text, then submit. Waits for the submit round-trip. */
async function answerCurrentQuestion(user: ReturnType<typeof userEvent.setup>, choiceText: string) {
  await user.click(screen.getByText(choiceText));
  await user.click(screen.getByRole('button', { name: 'Submit Answer' }));
}

beforeEach(() => {
  localStorage.clear();
  // Suppress the first-run diagnostic tutorial overlay (lazy-loaded, out of scope).
  // Key derivation mirrors AdaptiveDiagnostic: `pmp-diagnostic-tutorial-seen-${sessionId.split('-')[0]}`.
  localStorage.setItem(`pmp-diagnostic-tutorial-seen-${SESSION_ID.split('-')[0]}`, '1');
});

describe('AdaptiveDiagnostic — start', () => {
  it('renders the first question with progress and writes the resume pointer on mount', async () => {
    const { initialQueue, q1 } = buildQueue();
    const { updateLastSession } = renderDiagnostic({ initialQueue });

    expect(screen.getByText(`Question stem for ${q1.id}?`)).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();

    // Mount-only lastSession write — this is what makes tab-close-before-first-answer resumable.
    await waitFor(() => {
      expect(updateLastSession).toHaveBeenCalledWith(SESSION_ID, 'adaptive', 0, 0);
    });
  });
});

describe('AdaptiveDiagnostic — answer', () => {
  it('logs a correct answer, updates skill progress, and auto-advances', async () => {
    const user = userEvent.setup();
    const { initialQueue, q1, q2 } = buildQueue();
    const { logResponse, updateSkillProgress, recordDiagnosticMiss } = renderDiagnostic({ initialQueue });

    await answerCurrentQuestion(user, correctChoiceText(q1));

    await screen.findByText(`Question stem for ${q2.id}?`);
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();

    expect(logResponse).toHaveBeenCalledTimes(1);
    expect(logResponse).toHaveBeenCalledWith(expect.objectContaining({
      questionId: q1.id,
      skillId: 'skill-1',
      assessmentType: 'adaptive',
      sessionId: SESSION_ID,
      isCorrect: true,
      is_followup: false,
      skill_question_index: 1,
      selectedAnswers: ['B'],
      correctAnswers: ['B'],
    }));
    expect(updateSkillProgress).toHaveBeenCalledWith('skill-1', true, 'medium', q1.id, expect.any(Number));
    expect(recordDiagnosticMiss).not.toHaveBeenCalled();
  });

  it('queues a same-skill follow-up on a wrong answer and flags it is_followup', async () => {
    const user = userEvent.setup();
    const { initialQueue, q1, q2 } = buildQueue();
    const followUp = makeQuestion({ id: 'diag-f1', skillId: 'skill-1' });
    const { logResponse, recordDiagnosticMiss, onComplete } = renderDiagnostic({
      initialQueue,
      followUpPool: { 'skill-1': [followUp] },
    });

    await answerCurrentQuestion(user, wrongChoiceText(q1));

    // Queue grew from 2 to 3 — progress switches to the "~" estimate.
    await screen.findByText(`Question stem for ${q2.id}?`);
    expect(screen.getByText('Question 2 of ~3')).toBeInTheDocument();
    expect(recordDiagnosticMiss).toHaveBeenCalledWith(q1.id, 'skill-1');
    expect(logResponse).toHaveBeenCalledWith(expect.objectContaining({
      questionId: q1.id,
      isCorrect: false,
      distractorPatternId: undefined,
    }));

    // The appended follow-up arrives last and is logged as a follow-up, question 2 of that skill.
    await answerCurrentQuestion(user, correctChoiceText(q2));
    await screen.findByText(`Question stem for ${followUp.id}?`);
    await answerCurrentQuestion(user, correctChoiceText(followUp));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(logResponse).toHaveBeenCalledWith(expect.objectContaining({
      questionId: followUp.id,
      is_followup: true,
      skill_question_index: 2,
    }));
  });

  it('caps a skill at 3 questions even with more follow-ups available', async () => {
    const user = userEvent.setup();
    const { initialQueue, q1, q2 } = buildQueue();
    const f1 = makeQuestion({ id: 'diag-f1', skillId: 'skill-1' });
    const f2 = makeQuestion({ id: 'diag-f2', skillId: 'skill-1' });
    const f3 = makeQuestion({ id: 'diag-f3', skillId: 'skill-1' });
    const { onComplete, logResponse } = renderDiagnostic({
      initialQueue,
      followUpPool: { 'skill-1': [f1, f2, f3] },
    });

    // Miss every skill-1 item: q1 → +f1, f1 → +f2, f2 → cap reached (3 for the skill).
    await answerCurrentQuestion(user, wrongChoiceText(q1));
    await screen.findByText(`Question stem for ${q2.id}?`);
    await answerCurrentQuestion(user, correctChoiceText(q2));
    await screen.findByText(`Question stem for ${f1.id}?`);
    await answerCurrentQuestion(user, wrongChoiceText(f1));
    await screen.findByText(`Question stem for ${f2.id}?`);
    await answerCurrentQuestion(user, wrongChoiceText(f2));

    // f3 must never be appended — the diagnostic completes after 4 questions.
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const responses = onComplete.mock.calls[0][0];
    expect(responses.map((r: { questionId: string }) => r.questionId)).toEqual([q1.id, q2.id, f1.id, f2.id]);
    expect(logResponse).toHaveBeenCalledWith(expect.objectContaining({
      questionId: f2.id,
      skill_question_index: 3,
    }));
  });
});

describe('AdaptiveDiagnostic — complete', () => {
  it('reports all responses to onComplete and clears the saved session', async () => {
    const user = userEvent.setup();
    const { initialQueue, q1, q2 } = buildQueue();
    const onComplete = vi.fn();

    // Mirror App.tsx: completion switches app mode, unmounting the diagnostic
    // in the same commit. (Keeping it mounted after onComplete would let the
    // save-session effect re-write the just-deleted resume entry.)
    function CompletionHarness() {
      const [done, setDone] = useState(false);
      if (done) return <p>Diagnostic complete</p>;
      return (
        <ContentProvider>
          <AdaptiveDiagnostic
            initialQueue={initialQueue}
            followUpPool={{}}
            onComplete={(responses) => { onComplete(responses); setDone(true); }}
            onPauseExit={() => {}}
            sessionId={SESSION_ID}
            currentUserName="Tester"
          />
        </ContentProvider>
      );
    }
    render(<CompletionHarness />);

    await answerCurrentQuestion(user, correctChoiceText(q1));
    await screen.findByText(`Question stem for ${q2.id}?`);
    await answerCurrentQuestion(user, correctChoiceText(q2));

    await screen.findByText('Diagnostic complete');
    expect(onComplete).toHaveBeenCalledTimes(1);
    const responses = onComplete.mock.calls[0][0];
    expect(responses).toHaveLength(2);
    expect(responses[0]).toMatchObject({ questionId: q1.id, isCorrect: true, confidence: 'medium' });
    expect(responses[1]).toMatchObject({ questionId: q2.id, isCorrect: true });

    // Local resume state is deleted on completion so no stale resume card appears.
    expect(localStorage.getItem(`praxis-session-${SESSION_ID}`)).toBeNull();
  });
});

describe('AdaptiveDiagnostic — pause & resume', () => {
  it('pause shows the overlay and Save & Exit persists the pointer before exiting', async () => {
    const user = userEvent.setup();
    const { initialQueue } = buildQueue();
    const { onPauseExit, updateLastSession } = renderDiagnostic({ initialQueue });

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Diagnostic Paused')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save & Exit to Dashboard' }));
    expect(onPauseExit).toHaveBeenCalledTimes(1);
    expect(updateLastSession).toHaveBeenCalledWith(SESSION_ID, 'adaptive', 0, expect.any(Number));
  });

  it('resumes a saved session at the stored index with a resume notice', () => {
    const { initialQueue, q1, q2 } = buildQueue();
    const saved: UserSession = {
      userName: 'Tester',
      sessionId: SESSION_ID,
      type: 'adaptive-diagnostic',
      assessmentFlow: 'adaptive-diagnostic',
      questionIds: [q1.id, q2.id],
      currentIndex: 1,
      responses: [{
        questionId: q1.id,
        selectedAnswers: ['B'],
        correctAnswers: ['B'],
        isCorrect: true,
        timeSpent: 12,
        confidence: 'medium',
        timestamp: 1000,
      }],
      selectedAnswers: [],
      showFeedback: false,
      confidence: 'medium',
      startTime: 1000,
      lastUpdated: 2000,
      createdAt: 1000,
      elapsedSeconds: 42,
      followUpPoolRemaining: {},
    };
    saveUserSession(saved);

    renderDiagnostic({ initialQueue });

    expect(screen.getByText(/Resumed from question 2/)).toBeInTheDocument();
    expect(screen.getByText(`Question stem for ${q2.id}?`)).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });
});
