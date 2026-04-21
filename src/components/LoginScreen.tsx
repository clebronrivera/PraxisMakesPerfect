import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Loader2, Mail, Shield } from 'lucide-react';
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

// ─── Atelier domain palette for hero engine nodes ────────────────────────────
const DOMAIN_NODE_COLORS: Record<number, string> = {
  1: '#fcd5b4', // peach — Professional Practices
  2: '#b8f2d8', // mint — Student-Level Services
  3: '#cde9f5', // ice — Systems-Level Services
  4: '#d8d5fc', // lavender — Foundations
};

// Engine-box nodes mapped to the 4 domains. Domain 1 → NW, 2 → NE, 3 → SE, 4 → SW
// (matches mockup-entry-A-atelier.html).
const ENGINE_NODES = PROGRESS_DOMAINS.map((d, i) => {
  const positionIdx = i + 1;                // 1..4
  const skillCount = getProgressSkillsForDomain(d.id).length;
  return {
    domainId: d.id,
    name: d.name,
    count: skillCount,
    positionClass: `node-d${positionIdx}`,
    color: DOMAIN_NODE_COLORS[d.id] ?? '#fcd5b4',
  };
});

// ─── Boot sequence terminal lines ────────────────────────────────────────────
// Each line has an optional `delay` (ms) — the time to wait *before* showing
// this line. Defaults to 450ms. Section-end checkmarks get 900ms so the eye
// has a beat to register completion before the next phase starts.
const BOOT_LINES: Array<{ text: string; cls: string; delay?: number }> = [
  // Phase 1 — Blueprint load
  { text: '> Loading ETS Praxis 5403 blueprint...', cls: 'text-emerald-400' },
  { text: '✓ Blueprint integrity verified — sha256 OK', cls: 'text-emerald-300', delay: 900 },
  { text: '> Parsing test specification...', cls: 'text-slate-400' },
  { text: `  Found: 4 domains · ${ALL_SKILLS.length} skills · 1,150 items`, cls: 'text-cyan-400' },

  // Phase 2 — Domain + skill registration
  { text: '> Registering domain architecture...', cls: 'text-slate-400' },
  ...DOMAIN_SKILL_COUNTS.map((d, i) => ({
    text: `  DOMAIN_0${d.id} ${d.name.padEnd(30)} [${String(d.count).padStart(2)} skills]`,
    cls: ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'][i],
  })),
  { text: `✓ ${ALL_SKILLS.length} skills registered across 4 domains`, cls: 'text-emerald-300', delay: 900 },

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
  { text: '✓ 1,150 items calibrated — engine adapts per response', cls: 'text-emerald-300', delay: 900 },

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
    <div className="min-h-screen bg-navy-900 text-slate-300 p-6 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex justify-end mb-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-white border border-navy-700 hover:border-slate-500 transition-colors"
        >
          Skip →
        </button>
      </div>

      <div className="flex-1 flex gap-6 max-w-6xl mx-auto w-full">
        {/* Terminal */}
        <div className="flex-1 rounded-xl border border-navy-700 bg-navy-950 p-5 overflow-hidden flex flex-col">
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
                    litCells.has(i) ? `${color.boot}/80` : 'bg-navy-800'
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
        <div className="h-1 rounded-full bg-navy-800 overflow-hidden">
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
  // PHASE: HERO — atelier landing (replaces the old select + hero + signin views)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen text-slate-200"
      style={{ background: 'var(--navy-900)', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="starfield" aria-hidden="true" />

      {/* ══════ Top bar ══════ */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-10 py-5 md:py-6">
        <div className="flex items-center gap-3">
          <div className="mini-orb" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-white tracking-wide">PASS</p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-slate-500">Platform for Adaptive Study Sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-5">
          <span className="hidden md:inline text-[10px] tracking-[0.25em] uppercase text-slate-500">Praxis 5403 · Beta</span>
          <button
            type="button"
            onClick={() => focusSignInPanel('login')}
            className="text-sm text-slate-300 hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[color:var(--d1-peach)] rounded"
          >
            Sign in
          </button>
        </div>
      </div>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 relative z-30 pt-28 pb-16">
          <div className="max-w-6xl w-full grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-12 items-center">

            {/* Left — copy + CTAs */}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.32em] uppercase text-[color:var(--d1-peach)]/85 mb-6">
                Adaptive · Personal · Built around your gaps
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
                A study plan<br />
                <span className="gradient-text">that listens.</span>
              </h1>
              <p className="text-base text-slate-400 mt-6 leading-relaxed max-w-md">
                Four domains. 45 skills. 1,150 calibrated items — feeding one adaptive
                engine that rebuilds itself around your gaps, one answer at a time.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-9">
                <button
                  type="button"
                  onClick={() => focusSignInPanel('signup')}
                  className="btn-soft-glow"
                >
                  Begin your diagnostic&nbsp;&nbsp;→
                </button>
                <button
                  type="button"
                  onClick={() => focusSignInPanel('login')}
                  className="btn-ghost-atelier"
                >
                  I have an account
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-10 text-[11px] text-slate-500">
                <span><span className="text-[color:var(--d1-peach)] font-semibold">4</span> domains</span>
                <span className="text-slate-700">·</span>
                <span><span className="text-[color:var(--d2-mint)] font-semibold">45</span> skills</span>
                <span className="text-slate-700">·</span>
                <span><span className="text-[color:var(--d3-ice)] font-semibold">1,150</span> calibrated items</span>
                <span className="text-slate-700">·</span>
                <span><span className="text-[color:var(--d4-lavender)] font-semibold">IRT</span>-calibrated</span>
              </div>
            </div>

            {/* Right — engine visualization */}
            <div className="flex items-center justify-center" aria-hidden="true">
              <div className="engine-box">

                {/* SVG gradient feeder paths */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 560 560"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                >
                  <defs>
                    <linearGradient id="pathD1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fcd5b4" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#fcd5b4" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="pathD2" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b8f2d8" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#b8f2d8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="pathD3" x1="1" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#cde9f5" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#cde9f5" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="pathD4" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d8d5fc" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#d8d5fc" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 100 100 Q 170 180, 280 280" stroke="url(#pathD1)" strokeWidth="1.5" fill="none" />
                  <path d="M 460 100 Q 390 180, 280 280" stroke="url(#pathD2)" strokeWidth="1.5" fill="none" />
                  <path d="M 460 460 Q 390 380, 280 280" stroke="url(#pathD3)" strokeWidth="1.5" fill="none" />
                  <path d="M 100 460 Q 170 380, 280 280" stroke="url(#pathD4)" strokeWidth="1.5" fill="none" />
                </svg>

                {/* Central orb */}
                <div className="engine-orb-halo" />
                <div className="engine-orb">
                  <div className="engine-orb-inner" />
                </div>

                {/* Domain nodes at 4 corners */}
                {ENGINE_NODES.map(node => (
                  <div
                    key={node.domainId}
                    className={`domain-node ${node.positionClass}`}
                    style={{ ['--node-color' as unknown as string]: node.color } as React.CSSProperties}
                  >
                    {node.positionClass === 'node-d1' || node.positionClass === 'node-d4' ? (
                      <>
                        <div className="node-label">
                          <p className="name">{node.name}</p>
                          <p className="count">{node.count} SKILLS</p>
                        </div>
                        <div className="node-dot" />
                      </>
                    ) : (
                      <>
                        <div className="node-dot" />
                        <div className="node-label">
                          <p className="name">{node.name}</p>
                          <p className="count">{node.count} SKILLS</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <div className="engine-caption">
                  <p className="text-[10px] tracking-[0.32em] uppercase text-slate-500">The Adaptive Engine</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-slate-600">
          Already a candidate? <button type="button" onClick={() => focusSignInPanel('login')} className="text-slate-400 hover:text-[color:var(--d1-peach)] ml-2 underline-offset-4 hover:underline">Sign in ↓</button>
        </div>
      </section>

      {/* ══════ SIGN IN ══════ */}
      <section id="signin-panel" className="relative min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-24 md:py-28 relative z-30">
          <div className="max-w-md w-full">
            <div className="glass p-8 md:p-10">
              <div className="flex justify-center mb-6">
                <div className="mini-orb" style={{ width: 56, height: 56 }} aria-hidden="true" />
              </div>
              <div className="text-center mb-8">
                <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--d1-peach)]/85 mb-2">
                  {mode === 'signup' ? 'Welcome' : mode === 'reset' ? 'Reset password' : 'Welcome back'}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-white">
                  {mode === 'signup' && 'Create your account.'}
                  {mode === 'login' && 'Pick up where you left off.'}
                  {mode === 'reset' && 'We\u2019ll send a secure link.'}
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {mode === 'signup' && 'Save your diagnostic baseline, study plan, and redemption queue.'}
                  {mode === 'login' && 'Your diagnostic, study plan, and redemption queue are saved.'}
                  {mode === 'reset' && 'Enter your email and we\u2019ll send a secure password reset link.'}
                </p>
              </div>

              {resetEmailSent && !error && (
                <div className="mb-6 rounded-xl border border-[color:var(--d2-mint)]/30 bg-[color:var(--d2-mint)]/10 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--d2-mint)]" />
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--d2-mint)]">Reset email sent</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">
                        Check {email} for instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl border border-[color:var(--accent-rose)]/30 bg-[color:var(--accent-rose)]/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 text-sm leading-relaxed text-[color:var(--accent-rose)]">{error}</div>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-lg leading-none text-[color:var(--accent-rose)] transition-colors hover:text-white"
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
                    <label className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="field-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="btn-soft-glow w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--d1-peach)] transition-colors hover:text-white"
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
                        <label className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Full name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="field-input"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="field-input"
                      />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Password</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={switchToReset}
                            className="text-[11px] text-[color:var(--d1-peach)] hover:underline"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="field-input"
                      />
                    </div>

                    {mode === 'signup' && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={e => setConsentChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-transparent text-[color:var(--d1-peach)] focus:ring-[color:var(--d1-peach)]/50"
                        />
                        <span className="text-xs leading-relaxed text-slate-400">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'terms'; }}
                            className="text-slate-300 hover:text-[color:var(--d1-peach)] underline underline-offset-2"
                          >
                            Terms
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'privacy'; }}
                            className="text-slate-300 hover:text-[color:var(--d1-peach)] underline underline-offset-2"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email || !password || (mode === 'signup' && !consentChecked)}
                      className="btn-soft-glow w-full mt-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div className="flex-1 h-px bg-slate-700/40" />
                    <span className="text-[10px] tracking-widest uppercase text-slate-600">or</span>
                    <div className="flex-1 h-px bg-slate-700/40" />
                  </div>

                  <button
                    type="button"
                    onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                    className="w-full py-3 rounded-xl text-sm font-medium text-slate-300 border border-slate-700/50 hover:border-[color:var(--d1-peach)]/50 hover:text-white transition"
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
                  className="text-slate-400 hover:text-[color:var(--d1-peach)] underline underline-offset-2"
                >
                  Terms
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => (window.location.hash = 'privacy')}
                  className="text-slate-400 hover:text-[color:var(--d1-peach)] underline underline-offset-2"
                >
                  Privacy Policy
                </button>.
              </p>

              {mode === 'login' && showAdminEntry && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setEmail(PRIMARY_ADMIN_EMAIL)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-transparent px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-[color:var(--d1-peach)]/50 hover:text-white"
                    title="Admin sign in"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin sign in
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-700 mt-6 tracking-wider uppercase">
              PASS · Beta · 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
