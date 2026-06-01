import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail, Shield, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PRIMARY_ADMIN_EMAIL } from '../../config/admin';
import type { AuthMode } from './landingData';

interface AuthModalProps {
  /** Which mode to open in (login / signup / reset). */
  initialMode: AuthMode;
  /** Close the modal (backdrop, ESC, or × button). */
  onClose: () => void;
  /** Whether the hidden admin sign-in affordance is armed (Ctrl+Shift+A). */
  showAdminEntry: boolean;
}

// Self-contained violet/dark styling so the modal stays cohesive with the landing
// and is NOT coupled to the app's (separately-themed) global classes.
const INPUT =
  'w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50';
const PRIMARY_BTN =
  'w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Auth form (login / signup / reset) presented as a modal overlay on the landing.
 * Ported from the former inline #signin-panel in LoginScreen.tsx — Supabase wiring
 * (signInWithEmail / signUpWithEmail / resetPassword) is preserved verbatim.
 */
export default function AuthModal({ initialMode, onClose, showAdminEntry }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, resetPassword, error, loading, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // ── Auth handlers (preserved from LoginScreen) ──────────────────────────────
  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      }
    } catch {
      // Auth context owns user-facing error state.
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setResetEmailSent(false);
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch {
      // Auth context owns user-facing error state.
    }
  };

  const switchToReset = () => { clearError(); setResetEmailSent(false); setMode('reset'); };
  const switchToLogin = () => { clearError(); setResetEmailSent(false); setMode('login'); };

  const handleClose = useCallback(() => { clearError(); onClose(); }, [clearError, onClose]);

  // ── ESC to close + body scroll lock ─────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleClose]);

  // ── Focus management: move focus in on open, restore on close ────────────────
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const firstInput = panelRef.current?.querySelector<HTMLElement>('input, button');
    firstInput?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, []);

  // ── Minimal focus trap ──────────────────────────────────────────────────────
  const handleTrapKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0b0a1c]/80 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Sign in'}
        onKeyDown={handleTrapKeyDown}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/12 bg-[#181332]/95 backdrop-blur-xl p-8 md:p-10 shadow-2xl"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500"
            style={{ boxShadow: '0 0 24px rgba(192,132,252,.45)' }}
            aria-hidden="true"
          />
        </div>
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-fuchsia-300 mb-2">
            {mode === 'signup' ? 'Welcome' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
          </p>
          <h3 className="text-2xl font-extrabold text-white">
            {mode === 'signup' && 'Create your account.'}
            {mode === 'login' && 'Pick up where you left off.'}
            {mode === 'reset' && 'We’ll send a secure link.'}
          </h3>
          <p className="text-sm text-white/60 mt-2 leading-relaxed">
            {mode === 'signup' && 'Save your diagnostic baseline, study plan, and redemption queue.'}
            {mode === 'login' && 'Your diagnostic, study plan, and redemption queue are saved.'}
            {mode === 'reset' && 'Enter your email and we’ll send a secure password reset link.'}
          </p>
        </div>

        {resetEmailSent && !error && (
          <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">Reset email sent</p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">
                  Check {email} for instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 text-sm leading-relaxed text-rose-200">{error}</div>
              <button
                type="button"
                onClick={clearError}
                className="text-lg leading-none text-rose-200 transition-colors hover:text-white"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {mode === 'reset' ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="text-[11px] font-medium tracking-wider uppercase text-white/50 block mb-2">Email</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={INPUT}
              />
            </div>
            <button type="submit" disabled={loading || !email} className={PRIMARY_BTN}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending</>
              ) : (
                <><Mail className="h-4 w-4" /> Send reset email</>
              )}
            </button>
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={switchToLogin}
                className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="signup-name" className="text-[11px] font-medium tracking-wider uppercase text-white/50 block mb-2">Full name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className={INPUT}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="text-[11px] font-medium tracking-wider uppercase text-white/50 block mb-2">Email</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete={mode === 'signup' ? 'email' : 'username'}
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={INPUT}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label htmlFor="auth-password" className="text-[11px] font-medium tracking-wider uppercase text-white/50">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={switchToReset}
                      className="text-[11px] text-violet-300 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className={INPUT}
                />
              </div>

              {mode === 'signup' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={e => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-violet-500 focus:ring-violet-400/50"
                  />
                  <span className="text-xs leading-relaxed text-white/55">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.location.hash = 'terms'; }}
                      className="text-white/80 hover:text-violet-300 underline underline-offset-2"
                    >
                      Terms
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); window.location.hash = 'privacy'; }}
                      className="text-white/80 hover:text-violet-300 underline underline-offset-2"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password || (mode === 'signup' && !consentChecked)}
                className={PRIMARY_BTN}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Signing in' : 'Creating account'}
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}&nbsp;&nbsp;→</span>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[10px] tracking-widest uppercase text-white/40">or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            <button
              type="button"
              onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }}
              className="w-full py-3 rounded-xl text-sm font-medium text-white/80 border border-white/15 hover:border-violet-400/50 hover:text-white transition"
            >
              {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
            </button>
          </>
        )}

        <p className="text-center text-[11px] text-white/40 mt-6 leading-relaxed">
          By continuing you agree to our{' '}
          <button
            type="button"
            onClick={() => (window.location.hash = 'terms')}
            className="text-white/60 hover:text-violet-300 underline underline-offset-2"
          >
            Terms
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => (window.location.hash = 'privacy')}
            className="text-white/60 hover:text-violet-300 underline underline-offset-2"
          >
            Privacy Policy
          </button>.
        </p>

        {mode === 'login' && showAdminEntry && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setEmail(PRIMARY_ADMIN_EMAIL)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:border-violet-400/50 hover:text-white"
              title="Admin sign in"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
