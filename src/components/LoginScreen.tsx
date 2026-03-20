// src/components/LoginScreen.tsx
// Redesigned landing + sign-in page for Praxis Makes Perfect Study App

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail, ArrowLeft, Loader2, Shield, Brain, CheckCircle,
  BarChart3, BookOpen, Zap, ChevronRight, Star, TrendingUp,
  Clock, Target, Award
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../config/admin';

// ─── Mock UI: Sample Question Card ──────────────────────────────────────────
function MockQuestionCard() {
  const [selected, setSelected] = useState<string | null>('B');

  const options = [
    { key: 'A', text: 'Conduct a full psychoeducational evaluation immediately' },
    { key: 'B', text: 'Review existing records and consult with teachers first' },
    { key: 'C', text: 'Refer the student directly to special education' },
    { key: 'D', text: 'Administer an IQ test without parental consent' },
  ];

  return (
    <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Domain 3 · Eligibility
        </span>
        <span className="text-xs text-slate-500">Question 12 of 60</span>
      </div>
      <p className="text-slate-200 text-sm leading-relaxed mb-4">
        A teacher refers a 3rd-grade student for evaluation due to reading difficulties.
        As the school psychologist, what is the <strong className="text-amber-300">most appropriate first step</strong>?
      </p>
      <div className="space-y-2">
        {options.map(opt => {
          const isSelected = selected === opt.key;
          const isCorrect = opt.key === 'B';
          const showResult = selected !== null;
          let cls = 'border border-slate-600/60 bg-slate-700/40 text-slate-300';
          if (showResult && isSelected && isCorrect) cls = 'border border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
          else if (showResult && isSelected && !isCorrect) cls = 'border border-red-500/60 bg-red-500/10 text-red-300';
          else if (showResult && !isSelected && isCorrect) cls = 'border border-emerald-500/40 bg-emerald-500/5 text-emerald-400/70';
          return (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-2 ${cls}`}
            >
              <span className="font-bold mt-0.5 shrink-0">{opt.key}.</span>
              <span>{opt.text}</span>
              {showResult && isCorrect && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0 mt-0.5 text-emerald-400" />}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-300 leading-relaxed">
            <strong>Correct!</strong> Pre-referral interventions and record review ensure informed decision-making before pursuing formal evaluation under IDEA.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Mock UI: Skill Mastery Panel ────────────────────────────────────────────
function MockSkillPanel() {
  const skills = [
    { name: 'Eligibility Determination', pct: 88, tier: 'Demonstrating', color: 'emerald' },
    { name: 'Cognitive Assessment', pct: 72, tier: 'Approaching', color: 'amber' },
    { name: 'Behavioral Intervention', pct: 54, tier: 'Emerging', color: 'orange' },
    { name: 'Consultation & Collaboration', pct: 91, tier: 'Demonstrating', color: 'emerald' },
    { name: 'Legal & Ethical Practices', pct: 63, tier: 'Approaching', color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
  };
  const badgeMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-200">Skill Mastery</span>
        <span className="text-xs text-slate-400">32 / 45 skills tracked</span>
      </div>
      <div className="space-y-2.5">
        {skills.map(skill => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 truncate max-w-[65%]">{skill.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${badgeMap[skill.color]}`}>
                {skill.tier}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700">
              <div
                className={`h-1.5 rounded-full ${colorMap[skill.color]}`}
                style={{ width: `${skill.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mock UI: Mini Study Plan ─────────────────────────────────────────────────
function MockStudyPlan() {
  const weeks = [
    { label: 'Week 1', focus: 'Cognitive Assessment Foundations', sessions: 3, done: 3 },
    { label: 'Week 2', focus: 'Behavioral & Social-Emotional', sessions: 4, done: 2 },
    { label: 'Week 3', focus: 'Legal Frameworks & IDEA', sessions: 3, done: 0 },
  ];

  return (
    <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-slate-200">AI Study Plan</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Personalized
        </span>
      </div>
      <div className="space-y-2">
        {weeks.map(week => (
          <div key={week.label} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-700/30 border border-slate-600/30">
            <div className="shrink-0 mt-0.5">
              {week.done === week.sessions ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : week.done > 0 ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-slate-300">{week.label}</span>
                <span className="text-xs text-slate-500">· {week.sessions} sessions</span>
              </div>
              <span className="text-xs text-slate-400 truncate">{week.focus}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-xs text-indigo-300 text-center">
          🎯 On track for exam readiness in <strong>6 weeks</strong>
        </p>
      </div>
    </div>
  );
}

// ─── Feature Highlights ───────────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: 'AI-Powered Study Plans',
    desc: 'Claude AI generates a personalized weekly plan based on your skill gaps and exam timeline.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Adaptive Practice',
    desc: 'Questions adapt to your performance across all 4 domains and 45 Praxis skills.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Skill-Level Mastery Tracking',
    desc: 'See exactly where you stand — Emerging, Approaching, or Demonstrating — for every skill.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Target,
    title: 'Exam-Focused Questions',
    desc: 'Practice with case-based vignettes and multi-select items that mirror the real Praxis 5403.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
];

// ─── Stats Row ────────────────────────────────────────────────────────────────
const stats = [
  { icon: BookOpen, value: '450+', label: 'Practice Questions' },
  { icon: Target, value: '45', label: 'Skills Tracked' },
  { icon: Award, value: '4', label: 'Domains Covered' },
  { icon: Clock, value: '15 min', label: 'Avg. Session' },
];

// ─── Preview Carousel ─────────────────────────────────────────────────────────
function PreviewCarousel() {
  const [activeTab, setActiveTab] = useState<'question' | 'skills' | 'plan'>('question');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'question', label: 'Practice Q', icon: Zap },
          { key: 'skills', label: 'Skill Map', icon: BarChart3 },
          { key: 'plan', label: 'Study Plan', icon: Brain },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Preview panel */}
      <div className="transition-all duration-300">
        {activeTab === 'question' && <MockQuestionCard />}
        {activeTab === 'skills' && <MockSkillPanel />}
        {activeTab === 'plan' && <MockStudyPlan />}
      </div>
    </div>
  );
}

// ─── Main LoginScreen Component ───────────────────────────────────────────────
export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail, resetPassword, error, loading, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminEntry(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (_err) {
      // Error is handled in context
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setResetEmailSent(false);
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (_err) {
      // Error is handled in context
    }
  };

  const switchToReset = () => { clearError(); setResetEmailSent(false); setMode('reset'); };
  const switchToLogin = () => { clearError(); setResetEmailSent(false); setMode('login'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col lg:flex-row">

      {/* ── LEFT PANEL: Marketing / Info ── */}
      <div className="flex-1 flex flex-col justify-between px-8 py-10 lg:px-14 lg:py-14 max-w-3xl">

        {/* Logo / wordmark */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Praxis Makes Perfect</h1>
              <p className="text-xs text-amber-400 font-medium tracking-wide uppercase">Study App</p>
            </div>
          </div>

          {/* Hero headline */}
          <div className="mt-10 mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
              Ace the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Praxis 5403
              </span>{' '}
              with AI-powered practice
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xl">
              Built specifically for school psychology candidates. Adaptive questions,
              skill-level mastery tracking, and a personalized AI study plan — all in one place.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-3 text-center">
                  <Icon className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* App preview carousel */}
          <div className="mb-10">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              See it in action
            </p>
            <PreviewCarousel />
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(feat => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className={`${feat.bg} border border-slate-700/30 rounded-xl p-4`}>
                  <div className={`${feat.color} mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">{feat.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom testimonial / social proof */}
        <div className="mt-10 flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/30 rounded-xl">
          <div className="flex -space-x-2 shrink-0">
            {['🎓', '📚', '🏆'].map((em, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-sm">
                {em}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Trusted by school psychology candidates preparing for national certification exams.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center px-8 py-10 lg:py-14 lg:border-l lg:border-slate-800/60 bg-slate-900/40 backdrop-blur-sm">

        <div className="max-w-sm mx-auto w-full">

          {/* Panel header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-1">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset your password'}
            </h3>
            <p className="text-slate-400 text-sm">
              {mode === 'login' && 'Sign in to continue your study journey'}
              {mode === 'signup' && 'Start studying smarter today — it\'s free'}
              {mode === 'reset' && 'We\'ll send a reset link to your email'}
            </p>
          </div>

          {/* Success message */}
          {resetEmailSent && !error && (
            <div className="mb-5 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium mb-0.5">Reset email sent!</p>
                  <p className="text-emerald-200/80 text-xs">
                    Check <strong>{email}</strong> for instructions to reset your password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
              <div className="flex-1">{error}</div>
              <button onClick={clearError} className="text-red-400 hover:text-red-200 text-lg leading-none" aria-label="Dismiss error">×</button>
            </div>
          )}

          {/* Reset form */}
          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Mail className="w-4 h-4" /> Send Reset Email</>}
              </button>
              <div className="text-center">
                <button type="button" onClick={switchToLogin} className="text-sm text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* Login / Signup form */}
          {mode !== 'reset' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm text-slate-400">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={switchToReset} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
                  ) : (
                    <>{mode === 'login' ? 'Sign In' : 'Create Free Account'} <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Toggle */}
              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                  className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {mode === 'login'
                    ? <>Don't have an account? <span className="text-amber-400 font-medium">Sign up free</span></>
                    : <>Already have an account? <span className="text-amber-400 font-medium">Sign in</span></>
                  }
                </button>
              </div>
            </>
          )}

          {/* Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              An account is required to save progress and access your personalized study plan across devices.
            </p>
          </div>

          {/* Admin entry (hidden) */}
          {mode === 'login' && showAdminEntry && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setEmail(PRIMARY_ADMIN_EMAIL)}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                title="Admin sign in"
              >
                <Shield className="w-3 h-3" />
                Admin sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
