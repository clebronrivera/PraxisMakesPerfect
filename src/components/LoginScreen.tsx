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
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../config/admin';

type PreviewTab = 'question' | 'skills' | 'plan';

const stats = [
  { icon: BookOpen, value: '450+', label: 'Practice questions' },
  { icon: Target, value: '45', label: 'Skills tracked' },
  { icon: BarChart3, value: '4', label: 'Domains covered' },
  { icon: Clock3, value: '15 min', label: 'Average session' },
];

const previewTabs: Array<{ key: PreviewTab; label: string; icon: typeof Zap }> = [
  { key: 'question', label: 'Practice', icon: Zap },
  { key: 'skills', label: 'Skill map', icon: BarChart3 },
  { key: 'plan', label: 'Study plan', icon: Brain },
];

const featureCards = [
  {
    icon: Target,
    title: 'Adaptive diagnostic',
    description: 'An assessment that adapts to your responses across all 45 skills. Strong areas go fast, weaker areas get more attention.',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    icon: TrendingUp,
    title: 'Start practicing immediately',
    description: 'No gates or waitlists. Jump into practice the moment you sign up, even before finishing the diagnostic.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    icon: Sparkles,
    title: 'Learning path & skill tracking',
    description: 'A structured learning path ordered by your biggest gaps, with progress tracked across all four exam domains.',
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

const heroProofPoints = [
  'Built specifically for Praxis School Psychology 5403',
  'Tracks progress across all 45 testable skills',
  'Start practicing immediately — no waiting required',
];

const heroJourney = [
  {
    step: '01',
    title: 'Take the adaptive diagnostic',
    description: 'An assessment that adjusts to your strengths and weaknesses across all 45 skills.',
  },
  {
    step: '02',
    title: 'Practice where it counts',
    description: 'Jump into domain or skill practice at any time, even before finishing the diagnostic.',
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
          Domain 3
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
          <p className="mt-2 text-xl font-bold tracking-tight text-white">AI Study Guide (Coming Soon)</p>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

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

  const focusAccountPanel = (nextMode: 'login' | 'signup') => {
    clearError();
    setResetEmailSent(false);
    setMode(nextMode);

    window.requestAnimationFrame(() => {
      document.getElementById('account-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const inputClassName =
    'w-full rounded-[1.35rem] border border-slate-200 bg-[#fbfaf7] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/70';

  return (
    <div className="editorial-shell relative h-screen overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_35%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto lg:bg-[#0f172a] lg:shadow-2xl">
          <div className="p-8">
            <div className="group flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 opacity-20 blur-lg transition-opacity group-hover:opacity-60" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold italic tracking-tight text-white">
                  Praxis<span className="text-amber-500">.</span>Ai
                </p>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">School Psychology 5403</p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <p className="editorial-overline text-slate-500">Why learners use it</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                  A Praxis 5403 study system, not another generic quiz app.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  The product is designed to show school psychology candidates what to study next, why it matters, and how close they are to real readiness.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  'Adaptive diagnostic that adjusts to your performance',
                  '45-skill tracking with one shared readiness vocabulary',
                  'Start practicing immediately — pause and resume any time',
                ].map((item) => (
                  <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15">
                        <CheckCircle2 className="h-4 w-4 text-amber-300" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-white">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-white/5 bg-black/20 p-6">
            <div className="rounded-[1.75rem] border border-white/5 bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">How it opens up</p>
              <p className="mt-3 text-sm font-bold text-white">Create an account, take the adaptive diagnostic, and everything unlocks immediately.</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Dashboard, Practice, Progress, and Study Guide all share one readiness view so you always know where to focus.
              </p>
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex-1 overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f7f6f2]/85 backdrop-blur-md">
            <div className="mx-auto max-w-[92rem] px-5 py-3.5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold tracking-tight text-slate-900">Praxis Study</p>
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">School Psychology 5403</p>
                  </div>
                </div>

                <div className="hidden flex-wrap items-center gap-2 md:flex">
                  <span className="editorial-pill">Adaptive practice</span>
                  <span className="editorial-pill">Shared progress view</span>
                  <span className="editorial-pill">Learning path</span>
                </div>

                <button
                  type="button"
                  onClick={() => focusAccountPanel('login')}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 cursor-pointer hover:border-amber-300 hover:text-amber-700 transition-colors"
                >
                  Sign in to continue
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[92rem] px-5 py-5 sm:px-8 sm:py-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_26rem]">
              <div className="space-y-6">
                <section className="editorial-surface relative overflow-hidden p-7 lg:p-8">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.06),_transparent_38%)]" />
                  <div className="relative">
                    <div className="flex flex-wrap gap-2">
                      <span className="editorial-pill">Built for school psychology candidates</span>
                      <span className="editorial-pill">Adaptive diagnostic</span>
                      <span className="editorial-pill">Practice any time</span>
                    </div>

                    <p className="editorial-overline mt-6">Praxis 5403 prep</p>
                    <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 lg:text-[3.25rem]">
                      Stop guessing what to study for Praxis 5403.
                    </h1>
                    <p className="mt-5 max-w-3xl text-base font-medium leading-relaxed text-slate-600 lg:text-lg">
                      Praxis Study gives you a clear baseline, targeted practice, and a personalized next-step plan so each session moves the weakest skills forward instead of wasting time on random review.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button type="button" onClick={() => focusAccountPanel('signup')} className="editorial-button-primary px-6 py-3">
                        Create account
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => focusAccountPanel('login')} className="editorial-button-secondary px-6 py-3">
                        Sign in
                      </button>
                    </div>

                    <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
                      <div className="editorial-surface-soft p-5">
                        <p className="editorial-overline">Why it feels different</p>
                        <div className="mt-4 space-y-3">
                          {heroProofPoints.map((point) => (
                            <div key={point} className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
                                <CheckCircle2 className="h-4 w-4 text-amber-700" />
                              </div>
                              <p className="text-sm font-medium leading-relaxed text-slate-700">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="editorial-panel-dark p-5">
                        <p className="editorial-overline text-slate-500">How it works</p>
                        <div className="mt-4 space-y-4">
                          {heroJourney.map((item) => (
                            <div key={item.step} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                              <div className="flex items-start gap-3">
                                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-amber-300">
                                  {item.step}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-white">{item.title}</p>
                                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-4 md:grid-cols-4">
                    {stats.map((stat) => {
                      const Icon = stat.icon;

                      return (
                        <div key={stat.label} className="editorial-surface-soft p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
                            <Icon className="h-4 w-4 text-amber-700" />
                          </div>
                          <p className="mt-4 text-2xl font-black italic tracking-tight text-slate-900">{stat.value}</p>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{stat.label}</p>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </section>

                <section className="editorial-surface p-7 lg:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="editorial-overline">Preview</p>
                      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">See what unlocks after you start</h2>
                    </div>
                    <p className="max-w-md text-sm font-medium leading-relaxed text-slate-500">
                      Preview the practice flow, readiness tracking, and bigger study-plan view before you create an account.
                    </p>
                  </div>

                  <div className="mt-6">
                    <PreviewCarousel />
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  {featureCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <div key={card.title} className="editorial-surface p-5">
                        <div className={`inline-flex rounded-2xl border p-3 ${card.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-lg font-bold text-slate-900">{card.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.description}</p>
                      </div>
                    );
                  })}
                </section>
              </div>

              <aside id="account-panel" className="xl:sticky xl:top-[4.5rem] xl:self-start">
                <div className="editorial-surface p-6 sm:p-7">
                  <div>
                    <p className="editorial-overline">Account</p>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                      {mode === 'login' && 'Welcome back'}
                      {mode === 'signup' && 'Create your account'}
                      {mode === 'reset' && 'Reset your password'}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                      {mode === 'login' && 'Sign in to return to your dashboard, practice history, and saved study guidance.'}
                      {mode === 'signup' && 'Create an account to save your baseline, unlock the guided practice flow, and keep your study plan across devices.'}
                      {mode === 'reset' && 'Enter your email and we will send a secure password reset link.'}
                    </p>
                  </div>

                  {resetEmailSent && !error && (
                    <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
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
                    <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 text-sm font-medium leading-relaxed text-rose-700">{error}</div>
                        <button
                          type="button"
                          onClick={clearError}
                          className="text-lg leading-none text-rose-500 transition-colors hover:text-rose-700"
                          aria-label="Dismiss error"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'reset' ? (
                    <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
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
                      <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
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

                        {mode === 'signup' && (
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={consentChecked}
                              onChange={(e) => setConsentChecked(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-xs leading-relaxed text-slate-600">
                              I agree to the{' '}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); window.location.hash = 'terms'; }}
                                className="font-medium text-amber-700 underline hover:text-amber-800"
                              >
                                Terms of Service
                              </button>{' '}
                              and{' '}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); window.location.hash = 'privacy'; }}
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

                      <div className="mt-5 text-center">
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

                  <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-[#fbfaf7] p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Included with your account</p>
                      <div className="mt-3 space-y-3">
                        {[
                          'Saved progress across diagnostic and practice',
                          'One shared readiness view across Dashboard, Practice, and Progress',
                          'Learning path ordered by your biggest gaps',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <p className="text-sm leading-relaxed text-slate-600">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-center text-xs leading-relaxed text-slate-500">
                      An account is required to save progress across devices.
                    </p>
                    <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-700 font-semibold">
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
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
