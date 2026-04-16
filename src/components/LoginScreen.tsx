import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../config/admin';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';

// ─── Entry flow phase ────────────────────────────────────────────────────────
type EntryPhase = 'select' | 'boot' | 'hero';

// ─── Skill data for grids ────────────────────────────────────────────────────
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

// ─── Boot sequence terminal lines ────────────────────────────────────────────
const BOOT_LINES: Array<{ text: string; cls: string }> = [
  { text: '> Initializing Praxis 5403 configuration...', cls: 'text-emerald-400' },
  { text: '✓ ETS blueprint loaded — school_psych_5403.json', cls: 'text-emerald-300' },
  { text: '> Parsing domain architecture...', cls: 'text-slate-400' },
  ...DOMAIN_SKILL_COUNTS.map((d, i) => ({
    text: `  DOMAIN_0${d.id} ${d.name.padEnd(30)} [${String(d.count).padStart(2)} skills]`,
    cls: ['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-purple-400'][i],
  })),
  { text: `✓ ${ALL_SKILLS.length} skills registered`, cls: 'text-emerald-300' },
  { text: '> Loading item bank...', cls: 'text-slate-400' },
  { text: '✓ 1,150 items validated', cls: 'text-emerald-300' },
  { text: '> Calibrating adaptive engine...', cls: 'text-slate-400' },
  { text: '  Confidence signal weighting: ENABLED', cls: 'text-cyan-400' },
  { text: '✓ Adaptive engine calibrated', cls: 'text-emerald-300' },
  { text: '> Configuring spaced review scheduler...', cls: 'text-slate-400' },
  { text: '✓ SRS intervals: [1d, 3d, 7d, 14d, 30d]', cls: 'text-emerald-300' },
  { text: '✓✓ All systems operational — platform ready', cls: 'text-emerald-400 font-bold' },
];

// ─── Exam cards ──────────────────────────────────────────────────────────────
const EXAM_OPTIONS = [
  { id: 'praxis_5403', name: 'Praxis 5403', sub: 'School Psychology', detail: '45 skills · 1,150 items · 4 domains', live: true },
  { id: 'ftce_school_psych', name: 'FTCE School Psych', sub: 'PK-12', detail: 'Coming Soon', live: false },
  { id: 'ftce_gkt', name: 'FTCE General Knowledge', sub: 'GKT', detail: 'Coming Soon', live: false },
  { id: 'ftce_prof_ed', name: 'FTCE Professional Ed', sub: 'Test', detail: 'Coming Soon', live: false },
  { id: 'school_counselor', name: 'School Counselor', sub: 'SEC', detail: 'Coming Soon', live: false },
  { id: 'edu_leadership', name: 'Educational Leadership', sub: 'FELE', detail: 'Coming Soon', live: false },
];

const ROLE_OPTIONS = [
  'Graduate Student',
  'Cert-Only / Alt Route',
  'Internship Year',
  'Retake Candidate',
];

// ─── Boot Sequence Component ─────────────────────────────────────────────────

function BootSequence({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [litCells, setLitCells] = useState<Set<number>>(new Set());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((_, i) => {
      lineTimers.push(setTimeout(() => {
        setVisibleLines(prev => prev + 1);
        terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
      }, 250 * (i + 1)));
    });

    // Light up skill cells in domain groups
    let cellIndex = 0;
    let domainDelay = 600; // start after first few lines
    for (const domain of PROGRESS_DOMAINS) {
      const skills = getProgressSkillsForDomain(domain.id);
      for (let j = 0; j < skills.length; j++) {
        const idx = cellIndex;
        lineTimers.push(setTimeout(() => {
          setLitCells(prev => new Set([...prev, idx]));
        }, domainDelay + j * 50));
        cellIndex++;
      }
      domainDelay += skills.length * 50 + 300;
    }

    // Auto-advance after all lines + 1s
    const advanceTimer = setTimeout(onComplete, BOOT_LINES.length * 250 + 1200);
    lineTimers.push(advanceTimer);

    return () => lineTimers.forEach(clearTimeout);
  }, [onComplete]);

  const progressPct = Math.min((visibleLines / BOOT_LINES.length) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-6 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex justify-end mb-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
        >
          Skip →
        </button>
      </div>

      <div className="flex-1 flex gap-6 max-w-6xl mx-auto w-full">
        {/* Terminal */}
        <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-5 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] text-slate-600 ml-2 font-mono">pass_engine v1.0</span>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs leading-relaxed">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <p key={i} className={line.cls}>
                <span className="text-slate-600">[{String(Math.floor(i * 0.5)).padStart(2, '0')}:{String((i * 30) % 60).padStart(2, '0')}]</span>{' '}
                {line.text}
              </p>
            ))}
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
                    litCells.has(i) ? `${color.boot}/80` : 'bg-slate-800'
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
        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
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

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, resetPassword, error, loading, clearError } = useAuth();

  // ── Preserved auth state ───────────────────────────────────────────────────
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // ── Entry flow state ───────────────────────────────────────────────────────
  const [entryPhase, setEntryPhase] = useState<EntryPhase>('select');
  const [chosenExam, setChosenExam] = useState<string | null>(null);
  const [chosenRole, setChosenRole] = useState<string | null>(null);

  // ── Preserved keyboard shortcut ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdminEntry((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Preserved auth handlers ────────────────────────────────────────────────
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

  const focusAccountPanel = (nextMode: 'login' | 'signup') => {
    clearError();
    setResetEmailSent(false);
    setMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById('account-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleBootComplete = useCallback(() => setEntryPhase('hero'), []);
  const handleBootSkip = useCallback(() => setEntryPhase('hero'), []);

  const inputClassName =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/70';

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1: SELECT
  // ══════════════════════════════════════════════════════════════════════════
  if (entryPhase === 'select') {
    const canProceed = chosenExam !== null && chosenRole !== null;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-3xl space-y-8">
          {/* Brand */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">PASS</h1>
            <p className="text-sm text-slate-500 mt-1">Platform for Adaptive Study Sessions</p>
          </div>

          {/* Section heading */}
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-600 mb-2">Configure your adaptive platform</p>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Select your exam and training path. The engine will map your complete skill architecture before you begin.
            </p>
          </div>

          {/* Exam cards */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select exam</p>
            <div className="grid grid-cols-3 gap-3">
              {EXAM_OPTIONS.map(exam => (
                <button
                  key={exam.id}
                  type="button"
                  disabled={!exam.live}
                  onClick={() => setChosenExam(exam.id)}
                  className={`relative rounded-xl p-4 text-left transition-all ${
                    exam.live
                      ? chosenExam === exam.id
                        ? 'border-2 border-amber-500 bg-white shadow-sm'
                        : 'border-2 border-transparent bg-white shadow-sm hover:border-amber-300 cursor-pointer'
                      : 'border border-slate-200 bg-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {exam.live && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                      Live
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                    exam.live ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {exam.live ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <p className={`text-sm font-bold ${exam.live ? 'text-slate-900' : 'text-slate-500'}`}>{exam.name}</p>
                  <p className={`text-[11px] mt-0.5 ${exam.live ? 'text-slate-500' : 'text-slate-400'}`}>{exam.sub}</p>
                  <p className={`text-[10px] mt-1 ${exam.live ? 'text-slate-400' : 'text-slate-300'}`}>{exam.detail}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Role pills */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select your path</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setChosenRole(role)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    chosenRole === role
                      ? 'border-2 border-amber-500 bg-amber-50 text-amber-800 font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setEntryPhase('boot')}
              className={`px-8 py-3.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 ${
                canProceed
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-amber-600/40 text-white/60 cursor-not-allowed'
              }`}
            >
              Initialize Platform →
            </button>
          </div>

          {/* Already have an account? */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setEntryPhase('hero'); setMode('login'); }}
              className="font-semibold text-amber-700 hover:text-amber-800"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2: BOOT SEQUENCE
  // ══════════════════════════════════════════════════════════════════════════
  if (entryPhase === 'boot') {
    return <BootSequence onComplete={handleBootComplete} onSkip={handleBootSkip} />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3: HERO + AUTH
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">PASS</p>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Praxis 5403</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Platform Configured
            </span>
            <button
              type="button"
              onClick={() => focusAccountPanel('login')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_26rem]">
          {/* ── Left: Hero content ────────────────────────────────────────── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Platform Configured — Adaptive engine ready</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                Master the Praxis 5403 with{' '}
                <span className="font-black text-amber-600">precision.</span>
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
                An adaptive diagnostic that maps your exact knowledge gaps across all 45 skills — then builds a personalized study path through question differentiation, spaced repetition, targeted vocabulary practice, and second-chance redemption rounds. Every time you practice, your dashboard evolves.
              </p>
            </div>

            {/* Proof pills */}
            <div className="flex flex-wrap gap-2">
              {['1,150+ calibrated questions', '45 skills tracked', '4 domains covered', 'Adaptive diagnostic engine'].map(pill => (
                <span key={pill} className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
                  {pill}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => focusAccountPanel('signup')}
                className="px-6 py-3 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                Start Free — Begin Diagnostic
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => focusAccountPanel('login')}
                className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-amber-300 transition-colors"
              >
                Sign In
              </button>
            </div>

            {/* Domain weight pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Professional Practices 28%', cls: 'bg-amber-100 text-amber-800' },
                { label: 'Student-Level Services 34%', cls: 'bg-emerald-100 text-emerald-800' },
                { label: 'Systems-Level Services 24%', cls: 'bg-blue-100 text-blue-800' },
                { label: 'Foundations 14%', cls: 'bg-purple-100 text-purple-800' },
              ].map(d => (
                <span key={d.label} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${d.cls}`}>{d.label}</span>
              ))}
            </div>

            {/* Skill grid */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Extracted skills — loaded from Praxis 5403 blueprint · {ALL_SKILLS.length} skills
              </p>
              <div className="grid grid-cols-9 gap-1.5">
                {ALL_SKILLS.map((skill, i) => {
                  const color = DOMAIN_COLORS[skill.domainId];
                  const domainName = PROGRESS_DOMAINS.find(d => d.id === skill.domainId)?.name ?? '';
                  return (
                    <div
                      key={skill.skillId}
                      title={`${skill.fullLabel}\nDomain: ${domainName}\nSkill: ${skill.skillId}`}
                      className={`rounded-lg ${color.cell} border ${color.border} p-1 text-center cursor-default`}
                      style={{ animationDelay: `${i * 16}ms` }}
                    >
                      <span className={`text-[8px] font-bold ${color.text}`}>{skill.skillId}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Journey cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { step: '01', title: 'Diagnose', desc: 'Adaptive diagnostic maps all 45 skills in one session.', cls: 'bg-amber-100 text-amber-800' },
                { step: '02', title: 'Practice', desc: 'Practice where it counts — by domain, skill, or learning path.', cls: 'bg-emerald-100 text-emerald-800' },
                { step: '03', title: 'Track', desc: 'Watch your readiness evolve with each session.', cls: 'bg-blue-100 text-blue-800' },
              ].map(card => (
                <div key={card.step} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${card.cls}`}>{card.step}</span>
                  <p className="mt-3 text-sm font-bold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Auth form ──────────────────────────────────────────── */}
          <aside id="account-panel" className="xl:sticky xl:top-20 xl:self-start">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Account</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'reset' && 'Reset your password'}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {mode === 'login' && 'Sign in to return to your dashboard, practice history, and saved study guidance.'}
                {mode === 'signup' && 'Create an account to save your baseline, unlock the guided practice flow, and keep your study plan across devices.'}
                {mode === 'reset' && 'Enter your email and we will send a secure password reset link.'}
              </p>

              {/* Success / error banners */}
              {resetEmailSent && !error && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Reset email sent</p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                        Check {email} for instructions to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 text-sm font-medium leading-relaxed text-rose-700">{error}</div>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-lg leading-none text-rose-500 transition-colors hover:text-rose-700"
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Reset form */}
              {mode === 'reset' ? (
                <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={inputClassName}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
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
                      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Login / Signup form */}
                  <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className={inputClassName}
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label className="block text-sm font-semibold text-slate-700">Password</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={switchToReset}
                            className="shrink-0 text-xs font-semibold text-amber-700 transition-colors hover:text-amber-800"
                          >
                            Forgot password
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
                        className={inputClassName}
                      />
                      {mode === 'signup' && (
                        <p className="mt-2 text-sm text-slate-500">Use at least 6 characters.</p>
                      )}
                    </div>

                    {mode === 'signup' && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={e => setConsentChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs leading-relaxed text-slate-600">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'terms'; }}
                            className="font-medium text-amber-700 underline hover:text-amber-800"
                          >
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); window.location.hash = 'privacy'; }}
                            className="font-medium text-amber-700 underline hover:text-amber-800"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email || !password || (mode === 'signup' && !consentChecked)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {mode === 'login' ? 'Signing in' : 'Creating account'}
                        </>
                      ) : (
                        <>
                          {mode === 'login' ? 'Sign in' : 'Create account'}
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Toggle login/signup */}
                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                      className="text-sm font-medium text-slate-500 transition-colors hover:text-amber-700"
                    >
                      {mode === 'login' ? (
                        <>Need an account? <span className="font-semibold text-amber-700">Sign up</span></>
                      ) : (
                        <>Already have an account? <span className="font-semibold text-amber-700">Sign in</span></>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Benefits */}
              <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Included with your account</p>
                <div className="space-y-2">
                  {[
                    'Saved progress across diagnostic and practice',
                    'One shared readiness view across all surfaces',
                    'Learning path ordered by your biggest gaps',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <p className="text-xs leading-relaxed text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs leading-relaxed text-slate-500">
                  An account is required to save progress across devices.
                </p>
                <p className="text-center text-[11px] leading-relaxed text-amber-700 font-semibold">
                  Currently in beta. Not responsible for loss of data during the beta period.
                </p>
              </div>

              {/* Admin entry */}
              {mode === 'login' && showAdminEntry && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setEmail(PRIMARY_ADMIN_EMAIL)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-amber-200 hover:text-amber-700"
                    title="Admin sign in"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin sign in
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
