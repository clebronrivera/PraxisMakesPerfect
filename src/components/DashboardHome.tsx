// src/components/DashboardHome.tsx
// Post-diagnostic dashboard home — atelier design-first rewrite.
//
// Structure (top to bottom):
//   1. Welcome + readiness arc hero          — one clear number, one phase label
//   2. Today's Focus — single priority + "Then" rows
//   3. This Week stats strip + Redemption moon (only when bank > 0)
//   4. The Four Domains (constellation rows)
//   5. The Toolshed (5 feature tiles)
//
// Props interface is preserved 1:1 with the old component so App.tsx needs no changes.

import { useMemo } from 'react';
import { Zap, BookOpen, Map as MapIcon, ClipboardList, MessageCircle } from 'lucide-react';
import { PROGRESS_SKILLS, PROGRESS_DOMAINS } from '../utils/progressTaxonomy';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import { PROFICIENCY_META, TOTAL_SKILLS, APPROACHING_THRESHOLD, DEMONSTRATING_THRESHOLD } from '../utils/skillProficiency';
import type { ProgressSummary } from '../utils/progressSummaries';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface DashboardHomeProps {
  firstName: string | null;

  // Readiness
  demonstratingCount: number;
  readinessTarget: number;
  readinessPhase: string;
  skillsToReadiness: number;

  // SRS
  srsOverdueSkills: Array<{ skillId: string; name: string }>;

  // Today's Focus
  weakestSkill: { skillId: string; name: string; domain: string; emergingCount: number } | null;
  weakestDomain: { id: number; name: string } | null;

  // Weekly stats
  dailyQuestionCount: number;
  dailyGoal: number;
  weeklyUsageSeconds: number;
  weeklyQuestionCount: number;
  weeklyAccuracy: number | null;

  // Redemption
  redemptionBankCount: number;
  redemptionCredits: number;
  questionsToNextCredit: number;
  redemptionHighScore: number;
  missedSkillIds?: string[];

  // Domains
  progressSummary: ProgressSummary;

  // Actions
  onStartPractice: (domainId?: number) => void;
  onStartSkillPractice: (skillId: string) => void;
  onOpenLearningPathModule: (skillId: string) => void;
  onStartRedemption: () => void;
  onNavigate: (mode: string) => void;
}

// ─── Atelier domain colors (match engine-node palette) ──────────────────────
// Preserved for direct use in inline styles. Keyed by Praxis domainId (1..4).

const DOMAIN_COLOR: Record<number, string> = {
  1: '#d97706',
  2: '#059669',
  3: '#0284c7',
  4: '#6366f1',
};

// ─── Readiness arc ──────────────────────────────────────────────────────────

function ReadinessArc({ pct, phase }: { pct: number; phase: string }) {
  // Circumference of r=84 ≈ 527.79; dasharray = full, dashoffset = (1 - pct) * circ
  const circumference = 527.79;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative w-[188px] h-[188px] flex-shrink-0">
<svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="84" fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-amber-600 text-[44px] font-semibold tracking-tight leading-none">{pct}%</p>
        <p className="eyebrow mt-1">{phase}</p>
      </div>
    </div>
  );
}

// ─── Domain row (constellation) ─────────────────────────────────────────────

function DomainRow({
  color,
  name,
  pct,
  strongerCount,
  activeCount,
  profLabel,
  onClick,
}: {
  color: string;
  name: string;
  pct: number;
  strongerCount: number;
  activeCount: number;
  profLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full grid gap-4 items-center py-3.5 px-4 rounded-xl hover:bg-slate-50 transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      style={{ gridTemplateColumns: '14px 1fr 72px minmax(90px, 110px) 120px' }}
    >
      {/* pulsing dot */}
      <span className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
        <span
          className="block w-2.5 h-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}, 0 0 20px ${color}` }}
        />
      </span>
      {/* name + meta */}
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-900 truncate">{name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {activeCount} skill{activeCount !== 1 ? 's' : ''} active
        </p>
      </div>
      {/* pct */}
      <p className="text-[15px] font-semibold" style={{ color }}>{pct}%</p>
      {/* gradient bar */}
      <div className="h-1.5 rounded-full overflow-hidden bg-slate-200">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 65%, transparent), ${color})`,
            boxShadow: `0 0 10px color-mix(in srgb, ${color} 55%, transparent)`,
          }}
        />
      </div>
      {/* proficiency tier */}
      <p className="text-[10px] text-slate-400 text-right tabular-num">
        {strongerCount}/{activeCount} <span className="text-slate-500">{profLabel}</span>
      </p>
    </button>
  );
}

// ─── Redemption "eclipsed moon" — only when bank > 0 ────────────────────────

function RedemptionMoon({
  bankCount,
  credits,
  questionsToNextCredit,
  highScore,
  missedSkillIds,
  onStart,
}: {
  bankCount: number;
  credits: number;
  questionsToNextCredit: number;
  highScore: number;
  missedSkillIds: string[];
  onStart: () => void;
}) {
  const bestCorrect = highScore > 0 ? Math.round((highScore / 100) * bankCount) : 0;
  const progressPct = ((20 - questionsToNextCredit) / 20) * 100;

  // Domain breakdown (cached)
  const domainCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const skillId of missedSkillIds) {
      const skill = PROGRESS_SKILLS.find((s) => s.skillId === skillId);
      if (skill) counts[skill.domainId] = (counts[skill.domainId] ?? 0) + 1;
    }
    return PROGRESS_DOMAINS.map((d) => ({ ...d, count: counts[d.id] ?? 0 })).filter((d) => d.count > 0);
  }, [missedSkillIds]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: '#0f172a', border: '1px solid rgba(216,180,254,0.22)' }}
    >
      {/* crescent glow */}
      <span
        aria-hidden="true"
        className="absolute -top-14 -right-14 w-40 h-40 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(251,207,232,0.3) 0%, rgba(216,180,254,0.2) 35%, rgba(6,13,26,0) 72%)',
          filter: 'blur(2px)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -top-8 -right-20 w-36 h-36 rounded-full"
        style={{ background: '#0f172a' }}
      />

      <div className="relative z-10">
        <p className="eyebrow mb-2" style={{ color: '#f43f5e' }}>
          Quarantine · Redemption
        </p>
        <p className="text-[32px] font-semibold text-white leading-none">
          {bankCount} <span className="text-base text-slate-500 font-normal">in queue</span>
        </p>
        <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
          Questions flagged through hints or repeated misses. Clear them through focused redemption rounds.
        </p>

        <div className="flex items-center gap-2 mt-4 mb-2">
          <span className="text-[11px] font-semibold" style={{ color: '#6366f1' }}>
            {credits} credit{credits !== 1 ? 's' : ''}
          </span>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-1 rounded-full"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #f43f5e)',
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{20 - questionsToNextCredit}/20</span>
        </div>

        {highScore > 0 && (
          <div className="flex items-center justify-between mt-3 mb-4 text-[11px]">
            <span className="text-slate-500">Best run</span>
            <span className="text-white font-medium">
              {bestCorrect} / {bankCount} · {Math.round(highScore)}%
            </span>
          </div>
        )}

        {domainCounts.length > 0 && (
          <div className="flex items-center gap-1 mt-3 mb-4">
            {domainCounts.map((d) => (
              <span
                key={d.id}
                className="h-1.5 rounded-full"
                style={{ flex: d.count, background: DOMAIN_COLOR[d.id] }}
                title={`${d.name}: ${d.count}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={onStart}
          disabled={credits <= 0}
          className="w-full rounded-lg py-2.5 text-[12px] font-semibold transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          style={{
            color: '#1e1b3a',
            background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
          }}
        >
          Enter Redemption →
        </button>
      </div>
    </div>
  );
}

// ─── Feature tile ───────────────────────────────────────────────────────────

function FeatureTile({
  icon,
  label,
  hint,
  accent,
  onClick,
  chip,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  accent: string;
  onClick: () => void;
  chip?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-4 text-left border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full"
        style={{ background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`, opacity: 0.6 }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: `color-mix(in srgb, ${accent} 16%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
              color: accent,
            }}
          >
            {icon}
          </div>
          {chip && (
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full"
              style={{
                color: accent,
                border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              }}
            >
              {chip}
            </span>
          )}
        </div>
        <p className="text-[13px] font-semibold text-slate-900 mb-1 leading-tight">{label}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>
      </div>
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function DashboardHome({
  firstName,
  demonstratingCount,
  readinessTarget,
  readinessPhase,
  skillsToReadiness,
  srsOverdueSkills,
  weakestSkill,
  dailyQuestionCount,
  dailyGoal,
  weeklyUsageSeconds,
  weeklyQuestionCount,
  weeklyAccuracy,
  redemptionBankCount,
  redemptionCredits,
  questionsToNextCredit,
  redemptionHighScore,
  missedSkillIds = [],
  progressSummary,
  onStartPractice,
  onStartSkillPractice,
  onOpenLearningPathModule,
  onStartRedemption,
  onNavigate,
}: DashboardHomeProps) {
  const readinessPct =
    readinessTarget > 0 ? Math.min(Math.round((demonstratingCount / readinessTarget) * 100), 100) : 0;

  const nextModuleSkill = weakestSkill;
  const greetingName = firstName?.trim() || 'there';

  const dailyPct = dailyGoal > 0 ? Math.min(Math.round((dailyQuestionCount / dailyGoal) * 100), 100) : 0;

  return (
    <div className="space-y-6 pb-14">
      {/* ── Welcome + readiness hero ──────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-1">Welcome back</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Hi, <span className="text-amber-600">{greetingName}</span>.
            </h1>
          </div>
          <div className="text-right">
            <p className="eyebrow">This week</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">
              {weeklyQuestionCount} <span className="text-slate-500 text-sm font-normal">questions</span>
              {weeklyAccuracy != null && (
                <>
                  <span className="text-slate-600 mx-2">·</span>
                  <span className="text-amber-600">{weeklyAccuracy}%</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="editorial-surface p-7 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <ReadinessArc pct={readinessPct} phase={readinessPhase} />

          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-2">Exam Readiness</p>
            <h2 className="text-2xl font-semibold text-slate-900 leading-tight">
              <span className="text-amber-600">{demonstratingCount}</span> of {TOTAL_SKILLS} skills<br className="hidden sm:block" />
              at {PROFICIENCY_META.proficient.label}.
            </h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-md">
              {skillsToReadiness === 0
                ? 'You\u2019ve cleared the readiness threshold — keep your skills warm with spaced review.'
                : `${skillsToReadiness} more skill${skillsToReadiness !== 1 ? 's' : ''} to hit your readiness target of ${readinessTarget}.`}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[12px]">
              <div>
                <span className="text-slate-500 text-[11px]">Phase</span>
                <span className="block text-slate-900 font-medium capitalize">{readinessPhase}</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-slate-500 text-[11px]">Target</span>
                <span className="block text-slate-900 font-medium">{readinessTarget} skills</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-slate-500 text-[11px]">Daily</span>
                <span className="block text-slate-900 font-medium">
                  {dailyQuestionCount}/{dailyGoal} <span className="text-slate-500">({dailyPct}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('practice-hub')}
              className="editorial-button-primary"
            >
              Start Practice →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="editorial-button-secondary text-center"
            >
              View full report
            </button>
          </div>
        </div>
      </section>

      {/* ── Today's Focus + This Week / Redemption ───────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Focus (2/3) */}
        <div className="lg:col-span-2 editorial-surface p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">Today's Focus</h3>
            <span className="eyebrow">Chained by priority</span>
          </div>

          {/* Priority hero (peach glow) */}
          {weakestSkill ? (
            <div className="rounded-2xl p-[18px_20px] bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-amber-100 border border-amber-200">
                  <svg className="w-5 h-5" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1.5" fill="#d97706" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="eyebrow" style={{ color: '#d97706' }}>
                      Priority · {PROFICIENCY_META.emerging.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{weakestSkill.domain}</span>
                  </div>
                  <p className="text-[15px] font-semibold text-slate-900 leading-tight">{weakestSkill.name}</p>
                  <p className="text-[12px] text-slate-600 mt-1">
                    {weakestSkill.emergingCount} skill{weakestSkill.emergingCount !== 1 ? 's' : ''} below 60% in this domain — start here.
                  </p>
                </div>
                <button
                  onClick={() => onStartSkillPractice(weakestSkill.skillId)}
                  className="editorial-button-primary shrink-0 text-[11px] px-4 py-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  Practice →
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-slate-400 italic">
              You've caught up on priority skills — head to Practice to keep your rhythm.
            </p>
          )}

          {/* Chained "Then" rows */}
          <div className="mt-3 space-y-2">
            {srsOverdueSkills.length > 0 && (
              <button
                onClick={() => onStartSkillPractice(srsOverdueSkills[0].skillId)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                <span className="eyebrow w-14 shrink-0 text-left" style={{ color: '#0284c7' }}>
                  Then
                </span>
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-100">
                  <svg className="w-4 h-4" fill="none" stroke="#0284c7" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-medium text-slate-900">
                    Spaced review · {srsOverdueSkills.length} skill{srsOverdueSkills.length !== 1 ? 's' : ''} due
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {srsOverdueSkills.slice(0, 3).map((s) => s.name).join(', ')}
                    {srsOverdueSkills.length > 3 && ` + ${srsOverdueSkills.length - 3} more`}
                  </p>
                </div>
                <span className="text-slate-500 group-hover:text-slate-900 text-sm">→</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('glossary')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              <span className="eyebrow w-14 shrink-0 text-left" style={{ color: '#059669' }}>
                Then
              </span>
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-100">
                <svg className="w-4 h-4" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-medium text-slate-900">Vocabulary review</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Revisit terms from recent practice</p>
              </div>
              <span className="text-slate-500 group-hover:text-slate-900 text-sm">→</span>
            </button>
          </div>
        </div>

        {/* This Week + Redemption (1/3) */}
        <div className="flex flex-col gap-5">
          <div className="editorial-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">This Week</h3>
              <span className="eyebrow">7d</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-slate-400">Questions</span>
                <span className="text-[17px] font-semibold text-slate-900 tabular-num">{weeklyQuestionCount}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-slate-400">Accuracy</span>
                <span className="text-[17px] font-semibold text-amber-600 tabular-num">
                  {weeklyAccuracy != null ? `${weeklyAccuracy}%` : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-slate-400">Study time</span>
                <span className="text-[17px] font-semibold text-slate-900 tabular-num">
                  {weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m'}
                </span>
              </div>
              <div className="h-px my-1 bg-slate-200" />
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12px] text-slate-500">Today's goal</span>
                  <span className="text-[13px] font-semibold text-slate-900 tabular-num">
                    {dailyQuestionCount} / {dailyGoal}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${dailyPct}%`,
                      background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {redemptionBankCount > 0 && (
            <RedemptionMoon
              bankCount={redemptionBankCount}
              credits={redemptionCredits}
              questionsToNextCredit={questionsToNextCredit}
              highScore={redemptionHighScore}
              missedSkillIds={missedSkillIds}
              onStart={onStartRedemption}
            />
          )}
        </div>
      </section>

      {/* ── Four domains ──────────────────────────────────────────────── */}
      <section className="editorial-surface p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">The Four Domains</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Click any domain to drill in</p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-[11px] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 rounded"
            style={{ color: '#d97706' }}
          >
            Full report →
          </button>
        </div>

        <div className="space-y-0.5">
          {progressSummary.domains.map((domain) => {
            const pct =
              domain.activeSkillCount > 0
                ? Math.round((domain.strongerSkillCount / domain.activeSkillCount) * 100)
                : 0;
            const profLabel =
              pct >= DEMONSTRATING_THRESHOLD * 100
                ? PROFICIENCY_META.proficient.label
                : pct >= APPROACHING_THRESHOLD * 100
                  ? PROFICIENCY_META.approaching.label
                  : PROFICIENCY_META.emerging.label;

            return (
              <DomainRow
                key={domain.domainId}
                color={DOMAIN_COLOR[domain.domainId] ?? '#d97706'}
                name={domain.domainName}
                pct={pct}
                strongerCount={domain.strongerSkillCount}
                activeCount={domain.activeSkillCount}
                profLabel={profLabel}
                onClick={() => onStartPractice(domain.domainId)}
              />
            );
          })}
        </div>
      </section>

      {/* ── The Toolshed ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">The Toolshed</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Every tool at hand</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FeatureTile
            icon={<Zap className="w-5 h-5" />}
            label="Fluency Drill"
            hint="Rapid-fire cases, terms, concepts"
            accent="#d97706"
            chip="New"
            onClick={() => onNavigate('glossary')}
          />
          <FeatureTile
            icon={<BookOpen className="w-5 h-5" />}
            label="Vocab Quiz"
            hint="Review terms from practice"
            accent="#0284c7"
            onClick={() => onNavigate('glossary')}
          />
          <FeatureTile
            icon={<MapIcon className="w-5 h-5" />}
            label="Learning Path"
            hint={nextModuleSkill ? `Next: ${nextModuleSkill.skillId}` : 'Structured by gap'}
            accent="#059669"
            chip={nextModuleSkill ? 'Next' : undefined}
            onClick={() => {
              if (nextModuleSkill) onOpenLearningPathModule(nextModuleSkill.skillId);
              else onNavigate('practice-hub');
            }}
          />
          <FeatureTile
            icon={<ClipboardList className="w-5 h-5" />}
            label="Study Guide"
            hint="AI-generated plan from your data"
            accent="#6366f1"
            onClick={() => onNavigate('study-guide')}
          />
          <FeatureTile
            icon={<MessageCircle className="w-5 h-5" />}
            label="AI Tutor"
            hint="Ask anything, get quizzed"
            accent="#f43f5e"
            chip="AI"
            onClick={() => onNavigate('tutor')}
          />
        </div>
      </section>
    </div>
  );
}
