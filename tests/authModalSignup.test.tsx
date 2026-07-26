// @vitest-environment jsdom
//
// Regression tests for the signup confirmation path in AuthModal.
//
// The bug these pin: `handleEmailSubmit` used to `await signUpWithEmail(...)`
// and then do nothing. With email confirmation enabled, Supabase returns a user
// but NO session, so `onAuthStateChange` never fires and the modal never
// unmounts — the spinner just stopped and the form sat there. A new user had no
// way to tell whether the account was created. The reset-password path in the
// same file always had a confirmation panel; signup did not.
//
// These tests pin both branches, because the correct behavior differs:
//   - no session  -> show "check your inbox" (nothing else will happen)
//   - session     -> show nothing (the auth listener unmounts the modal)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../src/components/landing/AuthModal';
import { SIGNUP_SENT_KEY } from '../src/components/landing/landingData';

const signUpWithEmail = vi.fn();
const signInWithEmail = vi.fn().mockResolvedValue(undefined);
const resetPassword = vi.fn().mockResolvedValue(undefined);
const clearError = vi.fn();

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    clearError,
    error: null,
    loading: false,
  }),
}));

function renderModal() {
  render(<AuthModal initialMode="signup" onClose={vi.fn()} showAdminEntry={false} />);
}

async function fillAndSubmitSignup(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Email/i), 'newuser@example.com');
  await user.type(screen.getByLabelText(/Password/i), 'hunter2222');
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /Create account/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('AuthModal — signup confirmation', () => {
  it('tells the user to check their inbox when signup returns no session', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockResolvedValue({ needsEmailConfirmation: true });
    renderModal();

    await fillAndSubmitSignup(user);

    await waitFor(() => {
      expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    });
    // The address is echoed back so a typo is recoverable.
    expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
    // The form is replaced, not left sitting there — the account already exists,
    // so re-submitting it would only produce "User already registered".
    expect(screen.queryByRole('button', { name: /Create account/i })).not.toBeInTheDocument();
  });

  it('shows no confirmation panel when signup returns a session', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockResolvedValue({ needsEmailConfirmation: false });
    renderModal();

    await fillAndSubmitSignup(user);

    await waitFor(() => expect(signUpWithEmail).toHaveBeenCalled());
    // Auto-confirm projects get a session, so the auth listener unmounts this
    // modal. Rendering "check your inbox" here would be a lie.
    expect(screen.queryByText('Confirmation email sent')).not.toBeInTheDocument();
  });

  it('clears the confirmation panel when returning to sign in', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockResolvedValue({ needsEmailConfirmation: true });
    renderModal();

    await fillAndSubmitSignup(user);
    await waitFor(() => {
      expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Back to sign in/i }));

    expect(screen.queryByText('Confirmation email sent')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign in/i })).toBeInTheDocument();
  });

  // The regression that a component-only fix silently misses. Submitting flips
  // AuthContext `loading`, App.tsx swaps to its global loading screen, and this
  // whole tree unmounts mid-request — taking any local useState flag with it.
  // The confirmation must be persisted, or a successful signup drops the user
  // back on the landing page with nothing shown.
  it('persists the confirmation across the unmount the auth flow forces', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockResolvedValue({ needsEmailConfirmation: true });
    const { unmount } = render(
      <AuthModal initialMode="signup" onClose={vi.fn()} showAdminEntry={false} />
    );

    await fillAndSubmitSignup(user);
    await waitFor(() => {
      expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    });

    expect(window.sessionStorage.getItem(SIGNUP_SENT_KEY)).toBe('newuser@example.com');

    // Simulate the loading-screen swap: unmount, then remount fresh.
    unmount();
    renderModal();

    expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    // The address survives too, so the "check for typos" hint stays useful.
    expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
  });

  it('does not reopen the confirmation panel once dismissed', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockResolvedValue({ needsEmailConfirmation: true });
    renderModal();

    await fillAndSubmitSignup(user);
    await waitFor(() => {
      expect(screen.getByText('Confirmation email sent')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Back to sign in/i }));
    expect(window.sessionStorage.getItem(SIGNUP_SENT_KEY)).toBeNull();
  });

  it('does not show the confirmation panel when signup fails', async () => {
    const user = userEvent.setup();
    signUpWithEmail.mockRejectedValue(new Error('User already registered'));
    renderModal();

    await fillAndSubmitSignup(user);

    await waitFor(() => expect(signUpWithEmail).toHaveBeenCalled());
    expect(screen.queryByText('Confirmation email sent')).not.toBeInTheDocument();
  });
});
