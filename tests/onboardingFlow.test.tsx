// @vitest-environment jsdom
//
// Integration tests for OnboardingFlow (src/components/OnboardingFlow.tsx) —
// Phase 4 behavior pinning ahead of the Phase 5 App.tsx decomposition.
//
// Pins step-gating validation (canAdvance + the inline missing-field hints),
// the role-dependent step sequence, and the submit/error contract. The
// component is pure props — no mocks needed.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingFlow from '../src/components/OnboardingFlow';

function renderOnboarding(overrides: Partial<React.ComponentProps<typeof OnboardingFlow>> = {}) {
  const onComplete = vi.fn().mockResolvedValue(undefined);
  const onSkip = vi.fn();
  render(
    <OnboardingFlow
      displayName="Test User"
      onComplete={onComplete}
      onSkip={onSkip}
      {...overrides}
    />
  );
  return { onComplete, onSkip };
}

const nextButton = () => screen.getByRole('button', { name: /Next/ });
const finishButton = () => screen.getByRole('button', { name: /Finish/ });

describe('OnboardingFlow — validation gating', () => {
  it('blocks step 1 until a role is chosen, with a named-field hint', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    expect(nextButton()).toBeDisabled();
    expect(screen.getByText('Choose the option that best describes you.')).toBeInTheDocument();

    await user.click(screen.getByText('Graduate Student'));
    expect(nextButton()).toBeEnabled();
  });

  it('names every missing required field on the grad-student pathway step', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.click(screen.getByText('Graduate Student'));
    await user.click(nextButton());

    expect(screen.getByText('Your program & background')).toBeInTheDocument();
    expect(nextButton()).toBeDisabled();
    expect(screen.getByText('Please select your program type, delivery mode, training stage to continue.')).toBeInTheDocument();

    // State/program selects are optional — only the three radios gate the step.
    await user.click(screen.getByText('Ed.S.'));
    await user.click(screen.getByText('On-campus'));
    expect(screen.getByText('Please select your training stage to continue.')).toBeInTheDocument();
    await user.click(screen.getByText('Early Program'));
    expect(nextButton()).toBeEnabled();
  });
});

describe('OnboardingFlow — step sequence', () => {
  it('walks a graduate student through 4 steps and submits the collected data', async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOnboarding();

    // Step 1 — role. The pathway step only exists for grad/cert roles, so the
    // step count grows from 3 to 4 when Graduate Student is selected.
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await user.click(screen.getByText('Graduate Student'));
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    await user.click(nextButton());

    // Step 2 — pathway
    await user.click(screen.getByText('Ed.S.'));
    await user.click(screen.getByText('On-campus'));
    await user.click(screen.getByText('Early Program'));
    await user.click(nextButton());

    // Step 3 — exam
    expect(screen.getByText('About your exam')).toBeInTheDocument();
    expect(nextButton()).toBeDisabled();
    await user.click(screen.getByText('Praxis 5403'));
    await user.click(screen.getByText('First attempt'));
    await user.click(nextButton());

    // Step 4 — goals
    expect(screen.getByText('Goals & study habits')).toBeInTheDocument();
    expect(finishButton()).toBeDisabled();
    await user.click(screen.getByText('Pass the exam'));
    await user.click(screen.getByText('3–5 hrs / week'));
    await user.click(finishButton());

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      account_role: 'graduate_student',
      program_type: 'eds',
      delivery_mode: 'on_campus',
      training_stage: 'early_program',
      primary_exam: 'praxis_5403',
      retake_status: 'first_attempt',
      study_goals: ['pass_exam'],
      weekly_study_hours: '3_5',
    }));
  });

  it('skips the pathway step for the "Other" role', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.click(screen.getByText('Other'));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    await user.click(nextButton());
    expect(screen.getByText('About your exam')).toBeInTheDocument();
  });

  it('reveals the prior-attempts field only when Retake is selected', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.click(screen.getByText('Other'));
    await user.click(nextButton());

    expect(screen.queryByText('Number of prior attempts')).not.toBeInTheDocument();
    await user.click(screen.getByText('Retake'));
    expect(screen.getByText('Number of prior attempts')).toBeInTheDocument();
  });
});

describe('OnboardingFlow — submit and skip', () => {
  it('surfaces a save error and re-enables Finish for retry', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn().mockRejectedValueOnce(new Error('network down'));
    renderOnboarding({ onComplete });

    await user.click(screen.getByText('Other'));
    await user.click(nextButton());
    await user.click(screen.getByText('Praxis 5403'));
    await user.click(screen.getByText('First attempt'));
    await user.click(nextButton());
    await user.click(screen.getByText('Pass the exam'));
    await user.click(screen.getByText('3–5 hrs / week'));
    await user.click(finishButton());

    expect(await screen.findByText('Something went wrong saving your profile. Please try again.')).toBeInTheDocument();
    expect(finishButton()).toBeEnabled();
  });

  it('calls onSkip from the first step', async () => {
    const user = userEvent.setup();
    const { onSkip } = renderOnboarding();

    await user.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
