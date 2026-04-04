// src/components/PreAssessmentGateway.tsx
//
// Pre-assessment gateway screen — matches mockup-user-flow.html Screen 3.
// Shown for new users and users who completed the screener but not the full diagnostic.

import type { ReactNode } from 'react';

interface PreAssessmentGatewayProps {
  firstName: string | null;
  onStartDiagnostic: () => void;
  onStartSpicy: () => void;
  onBrowsePractice: () => void;
  hasAssessmentInProgress: boolean;
  sessionResumeCard: ReactNode | null;
  isScreenerDone?: boolean;
}

export default function PreAssessmentGateway({
  firstName,
  onStartDiagnostic,
  onStartSpicy,
  onBrowsePractice,
  hasAssessmentInProgress,
  sessionResumeCard,
  isScreenerDone = false,
}: PreAssessmentGatewayProps) {
  const greeting = isScreenerDone
    ? (firstName ? `Nice work, ${firstName}.` : 'Baseline complete.')
    : (firstName ? `Welcome, ${firstName}.` : 'Welcome.');

  const subtitle = isScreenerDone
    ? "Your initial baseline is recorded. Take the adaptive diagnostic for deeper skill-level insights, or jump straight into practice."
    : "Let's find your starting point so you're never practicing the wrong things.";

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-12 space-y-5">
      {/* Greeting */}
      <div className="text-center mb-2">
        <span className="text-4xl">{isScreenerDone ? '🎯' : '👋'}</span>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">{greeting}</h2>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Session resume card (if any) */}
      {sessionResumeCard}

      {/* Adaptive Diagnostic Card */}
      <div className="editorial-surface p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-indigo-600 font-bold text-lg">📋</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">Adaptive Diagnostic</h3>
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700">
                Recommended
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Maps your strengths and gaps across all 45 skills. The engine adapts — strong areas go fast, weaker areas get follow-ups.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="editorial-surface-soft p-3 text-center">
            <div className="text-lg font-black text-slate-800">45–90</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">questions</div>
          </div>
          <div className="editorial-surface-soft p-3 text-center">
            <div className="text-lg font-black text-slate-800">25–45</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">minutes</div>
          </div>
          <div className="editorial-surface-soft p-3 text-center">
            <div className="text-lg font-black text-slate-800">∞</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">pause</div>
          </div>
        </div>

        {/* Unlock badges */}
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-600 mb-2">
          Unlocks Everything
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">🎯 Skill Practice</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">🗺️ Learning Path</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">🤖 AI Tutor</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">📊 Study Guide</span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">📈 Full Dashboard</span>
        </div>

        {/* CTA */}
        {!hasAssessmentInProgress ? (
          <button
            onClick={onStartDiagnostic}
            className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Start Diagnostic →
          </button>
        ) : (
          <p className="text-sm font-medium text-amber-700 text-center">
            Diagnostic in progress — use the Resume card above.
          </p>
        )}
        <p className="text-center text-xs text-slate-400 mt-3">
          Can save and resume any time. No pressure.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">or preview first</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Feeling Spicy Card */}
      <div className="editorial-surface p-5" style={{ borderColor: '#fed7aa' }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            🌶️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">Feeling Spicy?</h3>
              <span className="rounded-full bg-orange-100 border border-orange-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-orange-700">
                Preview
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Not ready to commit? Try random questions from the full bank. You'll see feedback, hints, and explanations — just like the real thing.
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-[10px] text-slate-400 mb-3">
          <span>✓ Full feedback</span>
          <span>✓ Hints</span>
          <span>✓ Progress saved</span>
          <span>✗ No unlocks</span>
        </div>
        <button
          onClick={onStartSpicy}
          className="editorial-button-secondary w-full justify-center text-xs"
        >
          Try a Random Question →
        </button>
      </div>

      {/* Browse practice link */}
      <div className="text-center">
        <button
          onClick={onBrowsePractice}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition"
        >
          Or browse by domain or skill →
        </button>
      </div>
    </div>
  );
}
