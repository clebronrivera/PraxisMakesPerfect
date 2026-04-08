import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../config/admin';

type PreviewTab = 'question' | 'skills' | 'plan';

const stats = [
  { icon: BookOpen, value: '1,150+', label: 'Practice questions' },
  { icon: Target, value: '45', label: 'Skills tracked' },
  { icon: BarChart3, value: '4', label: 'Domains covered' },
  { icon: Clock3, value: '15 min', label: 'Average session' },
];

const previewTabs: Array<{ key: PreviewTab; label: string; icon: typeof Zap }> = [
  { key: 'question', label: 'Practice', icon: Zap },
  { key: 'skills', label: 'Skill map', icon: BarChart3 },
  { key: 'plan', label: 'Study plan', icon: Brain },
];

const heroJourney = [
  {
    step: '01',
    title: 'Take the adaptive diagnostic',
    description: 'An assessment that adjusts to your strengths and weaknesses across all 45 skills.',
  },
  {
    step: '02',
    title: 'Follow your skill-based progression path',
    description: 'Your dashboard, practice modes, and learning path modules are personalized to the exact skills where your performance data shows the most need.',
  },
  {
    step: '03',
    title: 'Track your readiness',
    description: 'Watch your proficiency grow across all four exam domains with your learning path.',
  },
];

function MockQuestionCard() {
  const [selected, setSelected] = useState<string | null>('B');

  const options = [
    { key: 'A', text: 'Conduct a full psychoeducational evaluation immediately' },
    { key: 'B', text: 'Review records and consult with teachers before moving forward' },
    { key: 'C', text: 'Refer the student directly to special education' },
    { key: 'D', text: 'Administer an IQ test without parent consent' },
  ];

  return (
    <div className="editorial-surface-soft p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-700">
          Systems-Level Services
        </span>
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
          Question 12
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
        A teacher refers a third-grade student for reading difficulties. What is the
        <span className="font-bold text-amber-700"> most appropriate first step</span> for the school psychologist?
      </p>

      <div className="mt-5 space-y-2.5">
        {options.map((option) => {
          const isSelected = selected === option.key;
          const isCorrect = option.key === 'B';
          const showResult = selected !== null;

          let className = 'border-slate-200 bg-white text-slate-600 hover:border-amber-300';
          if (showResult && isSelected && isCorrect) {
            className = 'border-emerald-300 bg-emerald-50 text-emerald-800';
          } else if (showResult && isSelected && !isCorrect) {
            className = 'border-rose-300 bg-rose-50 text-rose-700';
          } else if (showResult && !isSelected && isCorrect) {
            className = 'border-emerald-200 bg-emerald-50/60 text-emerald-700';
          }

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelected(option.key)}
              className={`flex w-full items-start gap-3 rounded-[1.35rem] border px-4 py-3 text-left text-sm font-medium transition-all ${className}`}
            >
              <span className="mt-0.5 shrink-0 text-[11px] font-black uppercase tracking-[0.1em]">
                {option.key}
              </span>
              <span className="flex-1">{option.text}</span>
              {showResult && isCorrect && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium leading-relaxed text-emerald-800">
          Reviewing records and consulting first keeps the decision grounded in existing data and prereferral context.
        </p>
      </div>
    </div>
  );
}

function MockSkillPanel() {
  const skills = [
    { name: 'Eligibility Determination', pct: 88, tier: 'Demonstrating', accent: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { name: 'Cognitive Assessment', pct: 72, tier: 'Approaching', accent: 'bg-amber-500', badge: 'border-amber-200 bg-amber-50 text-amber-700' },
    { name: 'Behavioral Intervention', pct: 54, tier: 'Emerging', accent: 'bg-rose-500', badge: 'border-rose-200 bg-rose-50 text-rose-700' },
    { name: 'Consultation & Collaboration', pct: 91, tier: 'Demonstrating', accent: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="editorial-surface-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="editorial-overline">Skill mastery</p>
          <p className="mt-2 text-lg font-bold text-slate-900">Shared readiness view</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
          32 / 45
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">{skill.name}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${skill.badge}`}>
                {skill.tier}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ece8df]">
              <div className={`h-full rounded-full ${skill.accent}`} style={{ width: `${skill.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockStudyPlan() {
  const weeks = [
    { label: 'Week 1', focus: 'Cognitive assessment foundations', progress: 'Completed 3 of 3 sessions' },
    { label: 'Week 2', focus: 'Behavioral and social-emotional supports', progress: 'Completed 2 of 4 sessions' },
    { label: 'Week 3', focus: 'Legal frameworks and IDEA review', progress: 'Ready when you are' },
  ];

  return (
    <div className="editorial-panel-dark p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="editorial-overline text-slate-500">Study guide</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-white">AI Study Guide</p>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-300">
          Personalized
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {weeks.map((week) => (
          <div key={week.label} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">{week.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{week.focus}</p>
            <p className="mt-1 text-sm text-slate-400">{week.progress}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCarousel() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('question');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {previewTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-900'
                  : 'border border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === 'question' && <MockQuestionCard />}
      {activeTab === 'skills' && <MockSkillPanel />}
      {activeTab === 'plan' && <MockStudyPlan />}
    </div>
  );
}

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, resetPassword, error, loading, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdminEntry((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const switchToReset = () => {
    clearError();
    setResetEmailSent(false);
    setMode('reset');
  };

  const switchToLogin = () => {
    clearError();
    setResetEmailSent(false);
    setMode('login');
  };

  const openForm = (nextMode: 'login' | 'signup') => {
    clearError();
    setResetEmailSent(false);
    setMode(nextMode);
    setFormOpen(true);
  };

  const closeForm = () => {
    clearError();
    setFormOpen(false);
  };

  const inputClassName =
    'w-full rounded-[1.35rem] border border-slate-200 bg-[#fbfaf7] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/70';

  return (
    <div className="min-h-screen bg-[#f7f6f2]" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>

      {/* ── Top Nav ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-black text-xs">P</div>
          <span className="font-bold text-slate-900 text-sm">Praxis Makes Perfect</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openForm('login')}
            className="rounded-full border border-[#e6dfd4] bg-[#fffaf0] px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => openForm('signup')}
            className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-600 hover:text-white transition-colors"
          >
            Create account
          </button>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16 space-y-12">

        {/* Hero copy */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <span className="editorial-pill">Adaptive Diagnostic</span>
            <span className="editorial-pill">Skill-Based Progression</span>
            <span className="editorial-pill">Personalized Practice</span>
          </div>
          <p className="editorial-overline mb-2">PRAXIS 5403 PREP</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Master every skill. Adapt as you grow.
          </h1>
          <p className="text-base text-slate-500 leading-relaxed mb-6">
            An adaptive diagnostic maps your strengths and gaps across all 45 exam skills. Then your practice, learning path, and study guide adapt continuously — based on your accuracy, confidence, and progress over time. Built for Praxis 5403 school psychology candidates.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => openForm('signup')}
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-600 hover:text-white transition-colors"
            >
              Create account →
            </button>
            <button
              type="button"
              onClick={() => openForm('login')}
              className="rounded-full border border-[#e6dfd4] bg-[#fffaf0] px-6 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Why It Feels Different */}
        <div>
          <p className="editorial-overline text-center mb-6">BUILT FOR ADAPTIVE LEARNING</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="editorial-surface p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 border border-amber-200">
                <Target className="h-5 w-5 text-amber-700" />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Adaptive Diagnostic</p>
              <p className="text-xs text-slate-500 leading-relaxed">Starts with a 45-skill baseline assessment that adjusts to your responses, pinpointing exactly where you're strong and where foundational gaps remain.</p>
            </div>
            <div className="editorial-surface p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-200">
                <BarChart3 className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Skill-Based Progression</p>
              <p className="text-xs text-slate-500 leading-relaxed">Every practice session, learning path module, and study plan update is driven by your real performance data — not a generic one-size-fits-all schedule.</p>
            </div>
            <div className="editorial-surface p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 border border-blue-200">
                <Zap className="h-5 w-5 text-blue-700" />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">Printable Study Materials</p>
              <p className="text-xs text-slate-500 leading-relaxed">Generate a personalized AI study guide — covering priority skills, vocabulary, case patterns, and a week-by-week schedule — designed to print and use offline.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <p className="editorial-overline text-center mb-6">HOW IT WORKS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {heroJourney.map((item) => (
              <div key={item.step} className="editorial-surface-soft p-5">
                <div className="text-2xl font-black text-amber-500 mb-2">{item.step}</div>
                <p className="font-bold text-slate-800 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="editorial-surface p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}>
                  <div className="flex justify-center mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
                      <Icon className="h-4 w-4 text-amber-700" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">{stat.label}</div>
                  {stat.label === 'Domains covered' && (
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Professional Practices · Student-Level Services · Systems-Level Services · Foundations
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Carousel */}
        <div className="max-w-xl mx-auto">
          <p className="editorial-overline text-center mb-4">PREVIEW THE EXPERIENCE</p>
          <PreviewCarousel />
        </div>
      </div>

      {/* ── Auth Modal ──────────────────────────────────────── */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="editorial-surface w-full max-w-md p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="editorial-overline">Account</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'reset' && 'Reset your password'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {mode === 'login' && 'Sign in to return to your dashboard, practice history, and saved study guidance.'}
                  {mode === 'signup' && 'Create an account to save your baseline and unlock the full practice experience.'}
                  {mode === 'reset' && 'Enter your email and we will send a secure password reset link.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="ml-4 shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {resetEmailSent && !error && (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
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
              <div className="mt-5 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 text-sm font-medium leading-relaxed text-rose-700">{error}</div>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-lg leading-none text-rose-500 transition-colors hover:text-rose-700"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' ? (
              <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className={inputClassName}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="editorial-button-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send reset email
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleEmailSubmit} className="mt-5 space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
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
                      onChange={(event) => setEmail(event.target.value)}
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
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className={inputClassName}
                    />

                    {mode === 'signup' && (
                      <p className="mt-2 text-sm text-slate-500">Use at least 6 characters.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="editorial-button-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60"
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

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setMode(mode === 'login' ? 'signup' : 'login');
                    }}
                    className="text-sm font-medium text-slate-500 transition-colors hover:text-amber-700"
                  >
                    {mode === 'login' ? (
                      <>
                        Need an account? <span className="font-semibold text-amber-700">Sign up</span>
                      </>
                    ) : (
                      <>
                        Already have an account? <span className="font-semibold text-amber-700">Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
              <p className="text-center text-xs leading-relaxed text-slate-500">
                An account is required to save progress across devices.
              </p>
              <p className="text-center text-[11px] leading-relaxed text-amber-700 font-semibold">
                Currently in beta. Not responsible for loss of data during the beta period.
              </p>
            </div>

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
        </div>
      )}
    </div>
  );
}
