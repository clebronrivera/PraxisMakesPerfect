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

// ─── Shared landing className fragments ──────────────────────────────────────
const GTXT = 'bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent';
const GLASS = 'bg-white/[0.06] backdrop-blur-md border border-white/10';

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

  // Phase 4 — Adaptivity
  { text: '> Loading adaptive engine...', cls: 'text-slate-400' },
  { text: '  1 question per skill · adaptive follow-ups on missed skills', cls: 'text-cyan-400' },
  { text: '  Confidence signal weighting: ENABLED', cls: 'text-cyan-400' },
  { text: '✓ 1,150 items mapped to 45 skills — engine adapts per response', cls: 'text-emerald-300', delay: 900 },

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
  const [authOpen, setAuthOpen] = useState(false);

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

  const openAuth = useCallback((nextMode: 'login' | 'signup') => {
    clearError();
    setResetEmailSent(false);
    setMode(nextMode);
    setAuthOpen(true);
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
      className="min-h-screen text-white"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: '#0b0a1c',
        backgroundImage:
          'radial-gradient(40% 40% at 84% 8%, rgba(232,121,249,.34), transparent 62%),' +
          'radial-gradient(40% 44% at 8% 6%, rgba(167,139,250,.34), transparent 60%),' +
          'radial-gradient(40% 40% at 90% 60%, rgba(6,5,14,.7), transparent 55%),' +
          'linear-gradient(180deg,#2a2052 0%,#1b1540 30%,#120e2c 60%,#0b0a1c 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ══════ NAV ══════ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0a1c]/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2.5 mr-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center font-black text-sm">◑</div>
            <span className="font-extrabold tracking-wide">PASS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/65 font-medium">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#method" className="hover:text-white transition-colors">The method</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => openAuth('login')} className="text-sm font-semibold text-white/80 hover:text-white transition-colors">Sign in</button>
            <button type="button" onClick={() => openAuth('signup')} className="rounded-xl px-4 py-2 text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">Take your baseline →</button>
          </div>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-[0.92fr_1.08fr] gap-8 items-center pt-12 pb-20" style={{ minHeight: '86vh' }}>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/85 mb-6 bg-white/10 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Praxis 5403 · School Psychology
          </div>
          <h1 className="text-5xl md:text-[58px] font-extrabold leading-[1.03] tracking-tight mb-5">
            Find the exact skills<br /><span className={GTXT}>holding you back.</span>
          </h1>
          <p className="text-[16.5px] leading-relaxed text-white/75 max-w-xl mb-7">
            Take an adaptive baseline. A diagnostic algorithm — built by an educator with almost two decades of experience across classroom
            instruction, <span className="text-white font-semibold">MTSS</span>, and student support, grounded in the science of how we learn — pinpoints the exact{' '}
            <span className="text-white font-semibold">micro-skills</span> you&apos;re missing across the entire exam blueprint, then builds your plan around them.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <button type="button" onClick={() => openAuth('signup')} className="rounded-2xl px-6 py-3.5 text-sm font-bold text-indigo-700 bg-white shadow-xl shadow-indigo-900/40 hover:bg-indigo-50 transition">Take your adaptive baseline →</button>
            <button type="button" onClick={() => openAuth('login')} className="rounded-2xl px-6 py-3.5 text-sm font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition">I have an account</button>
          </div>
          <p className="text-[12.5px] text-white/45">Built by an educator — not a test-prep mill.</p>
        </div>

        {/* live product window */}
        <div className="relative h-[520px] hidden lg:block" style={{ perspective: '1900px' }} aria-hidden="true">
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] rounded-2xl overflow-hidden border border-white/15"
            style={{ transform: 'rotateY(-13deg) rotateX(5deg)', boxShadow: '0 50px 120px -28px rgba(6,5,16,.75), 0 30px 70px -36px rgba(217,70,239,.4)' }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#15122a] border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[10px] text-white/40 font-medium rounded-md bg-white/5 px-3 py-0.5">app.pass.study/dashboard</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>
            </div>
            {/* compact dashboard snapshot */}
            <div className="bg-[#f7f6f8] p-4 h-[340px]">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Welcome back</p>
              <p className="text-lg font-extrabold text-slate-900 mb-3">Hi, Carlos.</p>
              <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700 p-4 text-white mb-3">
                <p className="text-[9px] font-black uppercase tracking-wide text-indigo-100">Exam readiness</p>
                <p className="text-xl font-extrabold leading-tight mt-0.5">13 skills <span className="font-semibold text-indigo-100">at Demonstrating</span></p>
                <p className="text-[11px] text-indigo-100 mt-1">19 more to reach your readiness target.</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { g: 'from-cyan-500 to-blue-600', t: 'Professional', p: '41%' },
                  { g: 'from-emerald-500 to-teal-600', t: 'Student-Level', p: '78%' },
                  { g: 'from-rose-500 to-pink-600', t: 'Systems-Level', p: '34%' },
                  { g: 'from-amber-500 to-orange-600', t: 'Foundations', p: '62%' },
                ].map((d) => (
                  <div key={d.t} className="rounded-xl bg-white border border-slate-200 p-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${d.g} mb-2`} />
                    <p className="text-[8px] font-black uppercase text-slate-500 leading-tight">{d.t}</p>
                    <p className="text-[10px] font-bold text-slate-900">{d.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* floating: micro-skill pinpointed */}
          <div className="bob absolute left-1 bottom-2 w-[300px] rounded-2xl bg-white text-slate-900 p-4 z-20" style={{ boxShadow: '0 26px 55px -16px rgba(6,5,16,.6)' }}>
            <div className="flex items-center gap-1.5 mb-2"><span className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white text-[10px]">✦</span><span className="text-[10px] font-black uppercase tracking-wide text-violet-700">Micro-skill pinpointed</span></div>
            <p className="text-[15px] font-bold leading-snug mb-1">Norm- vs. criterion-referenced interpretation</p>
            <p className="text-[11.5px] text-slate-500 mb-3">a micro-skill inside <b className="text-slate-700">Assessment &amp; Data Use</b> · not the whole topic</p>
            <div className="flex items-center gap-2"><span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">Tier 2 · targeted</span><span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">drives 3 recent misses</span></div>
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how" className="max-w-7xl mx-auto px-6 md:px-10 py-20">
        <p className="text-center text-[12px] font-black uppercase tracking-[.2em] text-fuchsia-300 mb-3">How it works</p>
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight mb-3">From &quot;study everything&quot; to &quot;study <span className={GTXT}>this.</span>&quot;</h2>
        <p className="text-center text-white/60 max-w-2xl mx-auto mb-12">Three steps that mirror how strong practitioners actually move: baseline, pinpoint, then target.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { g: 'from-cyan-500 to-blue-600', icon: '◎', step: 'Step 1', sc: 'text-cyan-300', h: 'Take an adaptive baseline', b: 'An adaptive set that grows with you — one question per skill, plus targeted follow-ups exactly where you slip. No fixed-length slog.' },
            { g: 'from-violet-500 to-fuchsia-600', icon: '⌖', step: 'Step 2', sc: 'text-fuchsia-300', h: 'See your micro-skill map', b: 'The algorithm isolates the precise micro-skills and error patterns behind your misses — not "weak in assessment," but the actual gap.' },
            { g: 'from-emerald-500 to-teal-600', icon: '↗', step: 'Step 3', sc: 'text-emerald-300', h: 'Study what moves readiness', b: 'A personalized plan + adaptive practice, sequenced by what raises your readiness fastest and spaced so it actually sticks.' },
          ].map((s) => (
            <div key={s.step} className={GLASS + ' rounded-2xl p-6'}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.g} grid place-items-center text-white text-lg mb-4`}>{s.icon}</div>
              <p className={`text-[11px] font-black mb-1 ${s.sc}`}>{s.step}</p>
              <h3 className="text-lg font-bold mb-2">{s.h}</h3>
              <p className="text-[14px] text-white/65 leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ MICRO-SKILL PRECISION ══════ */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-violet-300 mb-3">Micro-skill precision</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">We don&apos;t stop at skills.<br />We target the <span className={GTXT}>micro-skill.</span></h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-5">
            Generic prep tells you you&apos;re &quot;weak in assessment.&quot; PASS pinpoints that it&apos;s <span className="text-white font-semibold">norm- vs. criterion-referenced interpretation</span>, and that you keep confusing <span className="text-white font-semibold">screening with evaluation consent</span> — then targets exactly that, not the whole topic.
          </p>
          <ul className="space-y-2.5 text-[14.5px] text-white/75">
            <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> Every exam skill broken down to its micro-skills</li>
            <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> The exact micro-skill each question probes</li>
            <li className="flex gap-2.5"><span className="text-emerald-300">✓</span> Repeated error patterns named and targeted</li>
          </ul>
        </div>
        <div className={GLASS + ' rounded-3xl p-5'}>
          <div className="flex items-center justify-between mb-3"><p className="text-[11px] font-black uppercase tracking-wide text-white/50">Your weakest micro-skills</p><span className="text-[10px] text-white/40">live</span></div>
          <div className="space-y-2.5">
            {[
              { bar: 'from-rose-500 to-pink-600', t: 'Norm- vs. criterion-referenced interpretation', s: 'Assessment & Data Use · 28%', tier: 'Tier 2', tc: 'bg-rose-500/20 text-rose-200' },
              { bar: 'from-rose-500 to-pink-600', t: 'Function vs. topography in FBA', s: 'Behavioral Assessment · 33%', tier: 'Tier 2', tc: 'bg-rose-500/20 text-rose-200' },
              { bar: 'from-amber-500 to-orange-600', t: 'Screening vs. evaluation consent', s: 'Ethics & Law · 55%', tier: 'Tier 1', tc: 'bg-amber-500/20 text-amber-200' },
            ].map((m) => (
              <div key={m.t} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <span className={`w-2 h-8 rounded bg-gradient-to-b ${m.bar}`} />
                <div className="flex-1"><p className="text-sm font-semibold">{m.t}</p><p className="text-[11px] text-white/45">{m.s}</p></div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.tc}`}>{m.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ THE METHOD ══════ */}
      <section id="method" className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className={'order-2 lg:order-1 rounded-3xl p-6 ' + GLASS}>
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50 mb-4">The engine mirrors practitioner workflow</p>
          <div className="space-y-3">
            {[
              { g: 'from-cyan-500 to-blue-600', n: '1', t: 'Baseline', d: '— adaptive diagnostic' },
              { g: 'from-violet-500 to-fuchsia-600', n: '2', t: 'Pinpoint', d: '— micro-skill + error analysis' },
              { g: 'from-rose-500 to-pink-600', n: '3', t: 'Target', d: '— tiered, sequenced practice' },
              { g: 'from-emerald-500 to-teal-600', n: '4', t: 'Progress-monitor', d: '— spaced review + re-check' },
            ].map((r, i) => (
              <div key={r.n}>
                <div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.g} grid place-items-center text-white text-xs font-black`}>{r.n}</span><p className="text-sm font-semibold">{r.t} <span className="text-white/45 font-normal">{r.d}</span></p></div>
                {i < 3 && <div className="ml-4 h-3 w-px bg-white/20" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
            {['~2 decades educator · MTSS', 'Spacing', 'Retrieval practice', 'Interleaving'].map((c) => (
              <span key={c} className="rounded-full px-3 py-1 text-[11px] font-bold bg-white/10 border border-white/20">{c}</span>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-cyan-300 mb-3">The method</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Grounded in MTSS,<br />not guesswork.</h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
            Every decision the engine makes mirrors how effective school-based practitioners actually work — <span className="text-white font-semibold">baseline → pinpoint → target → progress-monitor.</span>
          </p>
          <p className="text-[15.5px] text-white/70 leading-relaxed">
            It was built by an educator with <span className="text-white font-semibold">almost two decades across classroom instruction, MTSS, intervention, and school-based student support</span> — with sequencing and review grounded in the science of learning: <span className="text-white font-semibold">spacing, retrieval practice, and interleaving</span>. Not flashcards. Not a generic question dump.
          </p>
        </div>
      </section>

      {/* ══════ WHY IT'S FASTER ══════ */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-amber-300 mb-3">Why it&apos;s faster</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Stop re-studying<br />what you already know.</h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-4">
            Because our test algorithm isolates the <span className="text-white font-semibold">micro-skills</span> you&apos;re missing — not broad topics — every minute you study goes to a gap that&apos;s actually costing you points. No grinding back through material you&apos;ve already mastered.
          </p>
          <p className="text-[15.5px] text-white/70 leading-relaxed">
            Generic prep makes you review every topic, end to end, on every pass. PASS sends you straight to the handful of micro-skills standing between you and a pass.
          </p>
        </div>
        <div className={GLASS + ' rounded-3xl p-6'}>
          <p className="text-[11px] font-black uppercase tracking-wide text-white/50 mb-5">Where your study hours go</p>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-semibold text-white/70">Generic prep</span><span className="text-[11px] text-white/40">reviews all of it</span></div>
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div className="bg-white/10 flex items-center pl-2" style={{ width: '78%' }}><span className="text-[10px] text-white/45 font-medium">material you already know</span></div>
              <div className="bg-gradient-to-r from-rose-500 to-pink-600" style={{ width: '22%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-semibold text-white">With PASS</span><span className="text-[11px] text-emerald-300">straight to your micro-gaps</span></div>
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div className="bg-gradient-to-r from-rose-500 to-pink-600" style={{ width: '22%' }} />
              <div className="bg-gradient-to-r from-emerald-500/60 to-teal-600/60 flex items-center pl-2" style={{ width: '78%' }}><span className="text-[10px] font-bold text-white/90">time back in your week</span></div>
            </div>
          </div>
          <p className="text-[11px] text-white/40 mt-4 text-center">Same exam. Same gaps closed. A fraction of the hours.</p>
        </div>
      </section>

      {/* ══════ PLAN + PRACTICE ══════ */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-emerald-300 mb-3">Your plan</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">A plan built from your data —<br />not a template.</h2>
          <p className="text-[15.5px] text-white/70 leading-relaxed mb-5">
            Two candidates never get the same plan. PASS sequences your weeks by what raises readiness fastest, quarantines what you keep missing for focused review, and resurfaces it on a spaced schedule so it sticks.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[{ t: 'Micro', s: 'skill targeting' }, { t: '1:1', s: 'plan per learner' }, { t: 'Spaced', s: 'for retention' }].map((x) => (
              <div key={x.t} className={GLASS + ' rounded-xl p-3'}><p className={'text-2xl font-extrabold ' + GTXT}>{x.t}</p><p className="text-[11px] text-white/55">{x.s}</p></div>
            ))}
          </div>
        </div>
        <div className={GLASS + ' rounded-3xl p-5'}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700 p-4 mb-3">
            <p className="text-[10px] uppercase tracking-wide text-indigo-200 font-bold mb-1">This week · sequenced by impact</p>
            <p className="text-sm font-semibold">Lock Assessment &amp; Data Use → +5% readiness</p>
          </div>
          <div className="space-y-2">
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3"><span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center text-white text-xs">↻</span><p className="text-[13px] flex-1">Redemption · 6 quarantined items</p><span className="text-[11px] text-white/40">~9 min</span></div>
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3"><span className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 grid place-items-center text-white text-xs">▦</span><p className="text-[13px] flex-1">Spaced review · 3 skills due</p><span className="text-[11px] text-white/40">~6 min</span></div>
          </div>
        </div>
      </section>

      {/* ══════ FOUNDER'S NOTE ══════ */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-20">
        <div className={GLASS + ' rounded-3xl p-8 md:p-10 relative overflow-hidden'}>
          <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(232,121,249,.22), transparent 70%)' }} />
          <p className="text-[12px] font-black uppercase tracking-[.2em] text-fuchsia-300 mb-6 relative">Why I built PASS</p>
          <div className="flex items-center gap-4 mb-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400/30 to-fuchsia-500/25 border border-white/20 grid place-items-center text-white/70 text-lg font-bold shrink-0">CLR</div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">Carlos Lebron Rivera</p>
              <p className="text-[12.5px] text-white/55 mt-0.5 leading-snug">Educational Consultant · Reading Specialist · Special Education Specialist &amp; Advocate · Educational Assessor</p>
            </div>
          </div>
          <div className="space-y-4 text-[16px] leading-relaxed text-white/80 relative">
            <p>For years I&apos;ve worked the hardest end of education — <span className="text-white font-semibold">complex case management</span>, special-education advocacy, and the school–parent conflicts no one else wants to touch. Giving educators a way to study <span className="text-white font-semibold">efficiently</span> and reclaim their time became my passion.</p>
            <p>PASS came from the coaching room. Too often, teachers were pushed to <span className="text-white font-semibold">perform</span> for whatever the district was chasing that month — a theatrical show instead of real learning. But when a teacher came to a coaching cycle genuinely <span className="text-white font-semibold">curious</span> — owning a perceived gap, naming the challenge themselves — everything changed. Their own idea of what to improve told us exactly which <span className="text-white font-semibold">data to look at</span> and which <span className="text-white font-semibold">specific skills and behaviors to target.</span></p>
            <p>That&apos;s the engine behind PASS. It leverages <span className="text-white font-semibold">AI and the science of learning</span>, but it works the way a strong interventionist does — <span className="text-white font-semibold">triage</span> the real problem, <span className="text-white font-semibold">triangulate</span> across every signal, respond to the data. Deliberate about every move and every selection, pulling the maximum signal from <span className="text-white font-semibold">every response</span> — so that everything you do here <span className="text-white font-semibold">adapts to the way you learn,</span> not the average test-taker. From that, the <span className="text-white font-semibold">Platform for Adaptive Study Sessions</span> was born.</p>
          </div>
          <div className="flex items-center gap-3 mt-7 relative">
            <div className="h-px w-8 bg-white/30" />
            <p className="text-[14px] text-white/70"><span className="font-bold text-white">Carlos Lebron Rivera</span> · Founder, PASS</p>
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1 55%,#4338ca)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(40% 80% at 85% 20%, rgba(232,121,249,.45), transparent 60%)' }} />
          <div className="relative px-8 md:px-14 py-14 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">See your baseline in one sitting.</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-7">Stop guessing what to review. Find the exact skills between you and your license — then close them.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" onClick={() => openAuth('signup')} className="rounded-2xl px-7 py-3.5 text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 shadow-xl">Take your adaptive baseline →</button>
              <button type="button" onClick={() => openAuth('login')} className="rounded-2xl px-7 py-3.5 text-sm font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20">I have an account</button>
            </div>
            <p className="text-[12px] text-white/60 mt-5">One sitting · pick up on any device · currently in beta</p>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center gap-4 justify-between text-white/50 text-sm">
          <div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center font-black text-xs">◑</div><span className="font-bold text-white/80">PASS</span><span className="text-white/35">· Platform for Adaptive Study Sessions</span></div>
          <p className="text-[12px]">Currently in beta. Not responsible for loss of data during the beta period. · © 2026</p>
        </div>
      </footer>

      {/* ══════ AUTH MODAL ══════ */}
      {authOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-8 sm:py-12"
          role="dialog"
          aria-modal="true"
          onClick={() => setAuthOpen(false)}
        >
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              ×
            </button>
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
                    <label htmlFor="reset-email" className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Email</label>
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
                        <label htmlFor="signup-name" className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Full name</label>
                        <input
                          id="signup-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="field-input"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="auth-email" className="text-[11px] font-medium tracking-wider uppercase text-slate-400 block mb-2">Email</label>
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
                        className="field-input"
                      />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <label htmlFor="auth-password" className="text-[11px] font-medium tracking-wider uppercase text-slate-400">Password</label>
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
                        id="auth-password"
                        name="password"
                        type="password"
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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

          </div>
        </div>
      )}
    </div>
  );
}
