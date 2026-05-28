import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Brain, Loader2, Mail, Shield } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../config/admin';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';

// ─── Entry flow phase ────────────────────────────────────────────────────────
// Intake deleted (Atelier step 3). Boot is now an easter-egg, gated by ?boot=1.
type EntryPhase = 'boot' | 'hero';

// ─── Skill data for boot-sequence grid ───────────────────────────────────────
const DOMAIN_COLORS: Record<number, { cell: string; border: string; text: string; boot: string }> = {
  1: { cell: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', boot: 'bg-amber-500' },
  2: { cell: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', boot: 'bg-emerald-500' },
  3: { cell: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', boot: 'bg-blue-500' },
  4: { cell: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700', boot: 'bg-purple-500' },
};

const ALL_SKILLS = PROGRESS_DOMAINS.flatMap(d =>
  getProgressSkillsForDomain(d.id).map(s => ({ ...s, domainId: d.id }))
);

const DOMAIN_SKILL_COUNTS = PROGRESS_DOMAINS.map(d => ({
  ...d,
  count: getProgressSkillsForDomain(d.id).length,
}));

/** Login hero marketing copy — platform-level only (no exam counts, bank size, or calibration claims). */
const LOGIN_HERO_FEATURES = [
  'Adaptive diagnostic',
  'Personalized study path',
  'Progress tracking',
] as const;

const LOGIN_HERO_STEPS = [
  'Complete a short diagnostic to establish your starting point.',
  'Get a personalized study path focused on your highest-impact gaps.',
  'Track progress and adjust your plan as your performance improves.',
] as const;

// ─── Boot sequence terminal lines ────────────────────────────────────────────
// Each line has an optional `delay` (ms) — the time to wait *before* showing
// this line. Defaults to 450ms. Section-end checkmarks get 900ms so the eye
// has a beat to register completion before the next phase starts.
const BOOT_LINES: Array<{ text: string; cls: string; delay?: number }> = [
  // Phase 1 — Blueprint load
  { text: '> Loading ETS Praxis 5403 blueprint...', cls: 'text-emerald-400' },
  { text: '✓ Blueprint integrity verified — sha256 OK', cls: 'text-emerald-300', delay: 900 },
  { text: '> Parsing test specification...', cls: 'text-slate-400' },
  { text: '  Found: exam blueprint + skill architecture', cls: 'text-cyan-400' },

  // Phase 2 — Domain + skill registration
  { text: '> Registering domain architecture...', cls: 'text-slate-400' },
  ...DOMAIN_SKILL_COUNTS.map((d, i) => ({
    text: `  DOMAIN_0${d.id} ${d.name.padEnd(30)} [${String(d.count).padStart(2)} skills]`,
    cls: ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'][i],
  })),
  { text: `✓ ${ALL_SKILLS.length} skills registered across ${PROGRESS_DOMAINS.length} domains`, cls: 'text-emerald-300', delay: 900 },

  // Phase 3 — Module linkage
  { text: '> Linking skills to adaptive modules...', cls: 'text-slate-400' },
  { text: '  ↳ Adaptive Diagnostic Engine', cls: 'text-cyan-400' },
  { text: '  ↳ Practice by Skill', cls: 'text-cyan-400' },
  { text: '  ↳ Practice by Domain', cls: 'text-cyan-400' },
  { text: '  ↳ Redemption Rounds (quarantine loop)', cls: 'text-cyan-400' },
  { text: '  ↳ Study Guide Generator', cls: 'text-cyan-400' },
  { text: `✓ Module linkage complete — ${ALL_SKILLS.length}/${ALL_SKILLS.length} skills covered`, cls: 'text-emerald-300', delay: 900 },

  // Phase 4 — Adaptivity + psychometrics
  { text: '> Loading psychometric parameters...', cls: 'text-slate-400' },
  { text: '  2PL IRT model · difficulty + discrimination per item', cls: 'text-cyan-400' },
  { text: '  Confidence signal weighting: ENABLED', cls: 'text-cyan-400' },
  { text: '✓ Adaptivity online — engine adjusts after each response', cls: 'text-emerald-300', delay: 900 },

  // Phase 5 — Scheduling + handoff
  { text: '> Configuring spaced review scheduler...', cls: 'text-slate-400' },
  { text: '✓ SRS intervals: [1d, 3d, 7d, 14d, 30d]', cls: 'text-emerald-300' },
  { text: '✓✓ Platform ready — serving personalized content', cls: 'text-emerald-400 font-bold', delay: 1200 },
];

// ─── Boot Sequence Component ─────────────────────────────────────────────────
// Unchanged in Step 3 — reached only when `?boot=1` is present in the URL.

const LINE_SHOW_AT: number[] = (() => {
  const out: number[] = [];
  let cumulative = 0;
  for (const line of BOOT_LINES) {
    cumulative += line.delay ?? 450;
    out.push(cumulative);
  }
  return out;
})();
const TOTAL_BOOT_MS = LINE_SHOW_AT[LINE_SHOW_AT.length - 1] ?? 0;

function BootSequence({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [litCells, setLitCells] = useState<Set<number>>(new Set());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    LINE_SHOW_AT.forEach((showAt) => {
      lineTimers.push(setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
      }, showAt));
    });

    let cellIndex = 0;
    let domainDelay = 600;
    for (const domain of PROGRESS_DOMAINS) {
      const skills = getProgressSkillsForDomain(domain.id);
      for (let j = 0; j < skills.length; j++) {
        const idx = cellIndex;
        lineTimers.push(setTimeout(() => {
          setLitCells(prev => new Set([...prev, idx]));
        }, domainDelay + j * 100));
        cellIndex++;
      }
      domainDelay += skills.length * 100 + 400;
    }

    const advanceTimer = setTimeout(onComplete, TOTAL_BOOT_MS + 1500);
    lineTimers.push(advanceTimer);

    return () => lineTimers.forEach(clearTimeout);
  }, [onComplete]);

  const progressPct = Math.min((visibleLines / BOOT_LINES.length) * 100, 100);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-slate-300 p-6 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex justify-end mb-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:border-slate-400 transition-colors"
        >
          Skip →
        </button>
      </div>

      <div className="flex-1 flex gap-6 max-w-6xl mx-auto w-full">
        {/* Terminal */}
        <div className="flex-1 rounded-xl border border-[#ece4d7] bg-[#fbfaf7] p-5 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] text-slate-600 ml-2 font-mono">pass_engine v1.0</span>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs leading-relaxed">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
              const elapsedSec = Math.floor((LINE_SHOW_AT[i] ?? 0) / 1000);
              const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
              const ss = String(elapsedSec % 60).padStart(2, '0');
              return (
                <p key={i} className={line.cls}>
                  <span className="text-slate-600">[{mm}:{ss}]</span>{' '}
                  {line.text}
                </p>
              );
            })}
            {visibleLines >= BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Skill grid */}
        <div className="w-72 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-3">
            Skill Architecture — {ALL_SKILLS.length} cells
          </p>
          <div className="grid grid-cols-9 gap-1">
            {ALL_SKILLS.map((skill, i) => {
              const color = DOMAIN_COLORS[skill.domainId];
              return (
                <div
                  key={skill.skillId}
                  className={`h-6 rounded transition-all duration-300 ${
                    litCells.has(i) ? `${color.boot}/80` : 'bg-white'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-3 space-y-1">
            {DOMAIN_SKILL_COUNTS.map((d, i) => {
              const bootColors = ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'];
              const dotColors = ['bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'];
              return (
                <div key={d.id} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-2.5 h-2.5 rounded ${dotColors[i]}`} />
                  <span className={bootColors[i]}>{d.name} ({d.count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full mt-6">
        <div className="h-1 rounded-full bg-white overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">Initializing adaptive engine...</p>
      </div>
    </div>
  );
}

// ─── Main LoginScreen ────────────────────────────────────────────────────────

/** Read ?boot=1 query param (SSR-safe). */
function shouldStartInBoot(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('boot') === '1';
}

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, resetPassword, error, loading, clearError } = useAuth();

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // ── Entry flow state ───────────────────────────────────────────────────────
  const [entryPhase, setEntryPhase] = useState<EntryPhase>(() =>
    shouldStartInBoot() ? 'boot' : 'hero'
  );

  // ── Admin keyboard shortcut (preserved) ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdminEntry((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Auth handlers (preserved) ──────────────────────────────────────────────
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

  const focusSignInPanel = useCallback((nextMode: 'login' | 'signup') => {
    clearError();
    setResetEmailSent(false);
    setMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById('signin-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [clearError]);

  const handleBootComplete = useCallback(() => setEntryPhase('hero'), []);
  const handleBootSkip = useCallback(() => setEntryPhase('hero'), []);

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE: BOOT (easter-egg, reached via ?boot=1)
  // ═════════════════════════════════════════════════════════════════════════
  if (entryPhase === 'boot') {
    return <BootSequence onComplete={handleBootComplete} onSkip={handleBootSkip} />;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE: HERO — platform landing + sign-in below
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen bg-[#f7f6f2] text-slate-900"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ══════ Top bar ══════ */}
      <header className="absolute top-0 left-0 right-0 z-40 border-b border-slate-200/70 bg-[#f7f6f2]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 md:px-10 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20" aria-hidden="true"><Brain className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-sm font-bold text-slate-900 tracking-wide">PASS</p>
              <p className="text-[10px] tracking-[0.22em] uppercase text-slate-600">Platform for Adaptive Study Sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-5">
            <span className="hidden md:inline rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-800">
              Beta
            </span>
            <button
              type="button"
              onClick={() => focusSignInPanel('login')}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-amber-500 rounded"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(251,191,36,0.12),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="flex-1 flex items-center px-6 md:px-10 relative z-30 pt-28 pb-16 md:pb-20">
          <div className="max-w-6xl w-full mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-left">
              <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-amber-700 mb-5">
                Adaptive · Personal · Built around your gaps
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.08] tracking-tight">
                A study platform<br />
                <span className="text-amber-600">that listens.</span>
              </h1>
              <p className="text-[17px] text-slate-700 mt-6 leading-relaxed max-w-xl">
                Start with a focused diagnostic, then move through personalized practice and a
                guided study plan that adapts to your performance over time.
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => focusSignInPanel('signup')}
                  className="editorial-button-primary px-6 py-3"
                >
                  Begin your diagnostic&nbsp;&nbsp;→
                </button>
                <button
                  type="button"
                  onClick={() => focusSignInPanel('login')}
                  className="editorial-button-secondary px-6 py-3"
                >
                  I have an account
                </button>
              </div>

              <ul className="mt-8 flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Platform highlights">
                {LOGIN_HERO_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-600 mb-5">
                How it works
              </p>
              <ol className="space-y-5 text-[15px] leading-relaxed text-slate-800 list-none p-0 m-0">
                {LOGIN_HERO_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3.5">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>

        <div className="relative z-30 pb-10 text-center text-xs tracking-wide text-slate-600">
          Already a candidate?{' '}
          <button
            type="button"
            onClick={() => focusSignInPanel('login')}
            className="font-semibold text-amber-800 hover:text-amber-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 rounded"
          >
            Sign in ↓
          </button>
        </div>
      </section>

      {/* ══════ SIGN IN ══════ */}
      <section id="signin-panel" className="relative min-h-screen flex flex-col border-t border-slate-200/80 bg-[#f3f1eb]">
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-20 md:py-28 relative z-30">
          <div className="max-w-md w-full">
            <div className="editorial-surface p-8 md:p-10 rounded-3xl">
              <div className="flex justify-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mx-auto" aria-hidden="true"><Brain className="h-7 w-7 text-white" /></div>
              </div>
              <div className="text-center mb-8">
                <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-amber-700 mb-2">
                  {mode === 'signup' ? 'Welcome' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
                </p>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {mode === 'signup' && 'Create your account.'}
                  {mode === 'login' && 'Pick up where you left off.'}
                  {mode === 'reset' && 'We\u2019ll send a secure link.'}
                </h2>
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                  {mode === 'signup' && 'Save your diagnostic baseline, study plan, and redemption queue.'}
                  {mode === 'login' && 'Your diagnostic, study plan, and redemption queue are saved.'}
                  {mode === 'reset' && 'Enter your email and we\u2019ll send a secure password reset link.'}
                </p>
              </div>

              {resetEmailSent && !error && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Reset email sent</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        Check {email} for instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 text-sm leading-relaxed text-rose-800">{error}</div>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-lg leading-none text-rose-700 transition-colors hover:text-rose-900"
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
                    <label htmlFor="reset-email" className="text-[11px] font-semibold tracking-wider uppercase text-slate-600 block mb-2">Email</label>
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="editorial-button-primary w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Send reset email</span>
                    )}
                  </button>
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 transition-colors hover:text-amber-900"
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
                        <label htmlFor="signup-name" className="text-[11px] font-semibold tracking-wider uppercase text-slate-600 block mb-2">Full name</label>
                        <input
                          id="signup-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="auth-email" className="text-[11px] font-semibold tracking-wider uppercase text-slate-600 block mb-2">Email</label>
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label htmlFor="auth-password" className="text-[11px] font-semibold tracking-wider uppercase text-slate-600">Password</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={switchToReset}
                            className="text-[11px] font-medium text-amber-800 hover:text-amber-900 hover:underline"
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                      />
                    </div>

                    {mode === 'signup' && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={e => setConsentChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/40"
                        />
                        <span className="text-xs leading-relaxed text-slate-700">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'terms'; }}
                            className="font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                          >
                            Terms
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'privacy'; }}
                            className="font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email || !password || (mode === 'signup' && !consentChecked)}
                      className="editorial-button-primary w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {mode === 'login' ? 'Signing in' : 'Creating account'}
                        </span>
                      ) : (
                        <span>
                          {mode === 'login' ? 'Sign in' : 'Create account'}&nbsp;&nbsp;→
                        </span>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-slate-800 border border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 transition"
                  >
                    {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
                  </button>
                </>
              )}

              <p className="text-center text-[11px] text-slate-600 mt-6 leading-relaxed">
                By continuing you agree to our{' '}
                <button
                  type="button"
                  onClick={() => (window.location.hash = 'terms')}
                  className="font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                >
                  Terms
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => (window.location.hash = 'privacy')}
                  className="font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2"
                >
                  Privacy Policy
                </button>.
              </p>

              <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-center text-[11px] leading-relaxed text-slate-700">
                Currently in beta. Not responsible for loss of data during the beta period.
              </p>

              {mode === 'login' && showAdminEntry && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setEmail(PRIMARY_ADMIN_EMAIL)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
                    title="Admin sign in"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin sign in
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-600 mt-6 tracking-wider uppercase">
              PASS · Beta · 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
