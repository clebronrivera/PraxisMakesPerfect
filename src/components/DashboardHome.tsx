// src/components/DashboardHome.tsx
// Post-diagnostic dashboard home — indigo/violet light re-theme.
// Visual reference: public/mockup-retheme-allscreens.html (#dashboard).
//
// Structure (top to bottom):
//   1. Welcome + readiness hero            — full violet→indigo gradient panel
//   2. The Four Domains                    — white surface cards, per-domain hue
//   3. Today's Focus + This Week / Redemption
//   4. The Toolshed (5 feature tiles)
//
// Props interface is preserved 1:1 with the old component so App.tsx needs no changes.

import { useMemo } from 'react';
import { Zap, BookOpen, Map as MapIcon, ClipboardList, MessageCircle, Target, RotateCcw, BookMarked } from 'lucide-react';
import { PROGRESS_SKILLS, PROGRESS_DOMAINS } from '../utils/progressTaxonomy';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import { PROFICIENCY_META, TOTAL_SKILLS } from '../utils/skillProficiency';
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

// ─── Domain hue maps (Praxis domainId 1..4 → brighter gradient set) ──────────

const DOMAIN_GRAD: Record<number, string> = {
  1: 'from-cyan-500 to-blue-600',
  2: 'from-emerald-500 to-teal-600',
  3: 'from-rose-500 to-pink-600',
  4: 'from-amber-500 to-orange-600',
};
const DOMAIN_TEXT: Record<number, string> = {
  1: 'text-cyan-700',
  2: 'text-emerald-700',
  3: 'text-rose-700',
  4: 'text-amber-700',
};
const DOMAIN_GLYPH: Record<number, string> = { 1: '◐', 2: '◑', 3: '◒', 4: '◓' };

const profLabelFor = (pct: number) =>
  pct >= 80
    ? PROFICIENCY_META.proficient.label
    : pct >= 60
      ? PROFICIENCY_META.approaching.label
      : PROFICIENCY_META.emerging.label;

// ─── Readiness ring (conic gradient, white-on-indigo inside hero) ────────────

function ReadinessRing({ pct, phase }: { pct: number; phase: string }) {
  return (
    <div className="relative w-32 h-32 shrink-0">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(255,255,255,.95) 0%, rgba(255,255,255,.95) ${pct}%, rgba(255,255,255,.22) ${pct}%)`,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-[10px] rounded-full bg-indigo-600 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white leading-none">{pct}%</span>
        <span className="text-[10px] tracking-wide text-indigo-100 uppercase font-bold mt-1 capitalize">{phase}</span>
      </div>
    </div>
  );
}

// ─── Domain card ─────────────────────────────────────────────────────────────

function DomainCard({
  domainId,
  name,
  pct,
  onClick,
}: {
  domainId: number;
  name: string;
  pct: number;
  onClick: () => void;
}) {
  const grad = DOMAIN_GRAD[domainId] ?? DOMAIN_GRAD[1];
  const text = DOMAIN_TEXT[domainId] ?? DOMAIN_TEXT[1];
  return (
    <button
      onClick={onClick}
      className="editorial-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white mb-3`}>
        {DOMAIN_GLYPH[domainId] ?? '◆'}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-wide ${text}`}>{name}</p>
      <p className="text-xs text-slate-500 mt-1">{pct}% · {profLabelFor(pct)}</p>
      <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${grad}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

// ─── Redemption card — only when bank > 0 (light restyle) ────────────────────

function RedemptionCard({
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

  const domainCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const skillId of missedSkillIds) {
      const skill = PROGRESS_SKILLS.find((s) => s.skillId === skillId);
      if (skill) counts[skill.domainId] = (counts[skill.domainId] ?? 0) + 1;
    }
    return PROGRESS_DOMAINS.map((d) => ({ ...d, count: counts[d.id] ?? 0 })).filter((d) => d.count > 0);
  }, [missedSkillIds]);

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100 mb-2">Quarantine · Redemption</p>
      <p className="text-[32px] font-semibold leading-none">
        {bankCount} <span className="text-base text-indigo-100 font-normal">in orbit</span>
      </p>
      <p className="text-[12px] text-indigo-100 mt-2 leading-relaxed">
        Questions flagged through hints or repeated misses. Clear them through focused redemption rounds.
      </p>

      <div className="flex items-center gap-2 mt-4 mb-2">
        <span className="text-[11px] font-semibold text-white">
          {credits} credit{credits !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 h-1 rounded-full bg-white/20">
          <div className="h-1 rounded-full bg-white" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-[10px] text-indigo-100">{20 - questionsToNextCredit}/20</span>
      </div>

      {highScore > 0 && (
        <div className="flex items-center justify-between mt-3 mb-4 text-[11px]">
          <span className="text-indigo-100">Best run</span>
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
              className={`h-1.5 rounded-full bg-gradient-to-r ${DOMAIN_GRAD[d.id] ?? DOMAIN_GRAD[1]}`}
              style={{ flex: d.count }}
              title={`${d.name}: ${d.count}`}
            />
          ))}
        </div>
      )}

      <button
        onClick={onStart}
        disabled={credits <= 0}
        className="w-full rounded-lg py-2.5 text-[12px] font-semibold text-indigo-700 bg-white transition hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Enter Redemption →
      </button>
    </div>
  );
}

// ─── Feature tile (light surface) ─────────────────────────────────────────────

function FeatureTile({
  icon,
  label,
  hint,
  grad,
  onClick,
  chip,
  chipTone = 'solid',
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  grad: string;
  onClick: () => void;
  chip?: string;
  chipTone?: 'solid' | 'muted';
}) {
  return (
    <button
      onClick={onClick}
      className="editorial-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${grad} text-white`}>
          {icon}
        </div>
        {chip && (
          chipTone === 'muted'
            ? <span className="text-[10px] font-bold text-slate-400">{chip}</span>
            : <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">{chip}</span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-slate-900 mb-1 leading-tight">{label}</p>
      <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>
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
  weakestDomain,
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

  const priorityGrad = DOMAIN_GRAD[weakestDomain?.id ?? 3] ?? DOMAIN_GRAD[3];

  return (
    <div className="space-y-6 pb-14">
      {/* ── Welcome + readiness hero ──────────────────────────────────── */}
      <section>
        <p className="eyebrow text-indigo-600 mb-1">Welcome back</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
          Hi, <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">{greetingName}.</span>
        </h1>

        <div className="rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/20 bg-gradient-to-br from-violet-500 via-indigo-600 to-indigo-700">
          <div className="p-6 flex flex-col md:flex-row items-center gap-8 text-white">
            <ReadinessRing pct={readinessPct} phase={readinessPhase} />

            <div className="flex-1 min-w-0">
              <p className="eyebrow text-indigo-100 mb-1">Exam readiness</p>
              <h2 className="text-2xl font-bold leading-snug">
                <span className="text-white">{demonstratingCount}</span> of {TOTAL_SKILLS} skills<br className="hidden sm:block" />
                at {PROFICIENCY_META.proficient.label}.
              </h2>
              <p className="text-sm text-indigo-100 mt-2 max-w-md">
                {skillsToReadiness === 0
                  ? 'You’ve cleared the readiness threshold — keep your skills warm with spaced review.'
                  : `${skillsToReadiness} more skill${skillsToReadiness !== 1 ? 's' : ''} to reach your readiness target of ${readinessTarget}.`}
              </p>

              <div className="flex flex-wrap gap-6 mt-4 pt-3 border-t border-white/20">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-indigo-200">Readiness phase</p>
                  <p className="text-sm font-bold capitalize">{readinessPhase}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-indigo-200">Target</p>
                  <p className="text-sm font-bold">{readinessTarget} skills</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-indigo-200">Accuracy</p>
                  <p className="text-sm font-bold">{weeklyAccuracy != null ? `${weeklyAccuracy}%` : '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('practice-hub')}
                className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg"
              >
                Start Practice →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('results')}
                className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white bg-white/15 border border-white/30 hover:bg-white/25"
              >
                View full report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Four Domains ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">The Four Domains</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Click any domain to drill in</p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-[11px] font-semibold text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 rounded"
          >
            Full report →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {progressSummary.domains.map((domain) => {
            const pct =
              domain.activeSkillCount > 0
                ? Math.round((domain.strongerSkillCount / domain.activeSkillCount) * 100)
                : 0;
            return (
              <DomainCard
                key={domain.domainId}
                domainId={domain.domainId}
                name={domain.domainName}
                pct={pct}
                onClick={() => onStartPractice(domain.domainId)}
              />
            );
          })}
        </div>
      </section>

      {/* ── Today's Focus + This Week / Redemption ───────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Focus (2/3) */}
        <div className="lg:col-span-2 editorial-surface p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">Today's Focus</h3>
            <span className="eyebrow text-slate-400">Chained by priority</span>
          </div>

          {/* Priority hero (weakest-domain gradient) */}
          {weakestSkill ? (
            <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${priorityGrad} p-4 flex items-center gap-4 text-white shadow-lg shadow-rose-500/20`}>
              <div className="shrink-0 w-11 h-11 rounded-xl bg-white/25 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-wide uppercase text-white/80">
                  Priority · {PROFICIENCY_META.emerging.label} · {weakestSkill.domain}
                </p>
                <p className="font-semibold leading-tight">{weakestSkill.name}</p>
                <p className="text-xs text-white/80 mt-0.5">
                  {weakestSkill.emergingCount} skill{weakestSkill.emergingCount !== 1 ? 's' : ''} below 60% in this domain — start here.
                </p>
              </div>
              <button
                onClick={() => onStartSkillPractice(weakestSkill.skillId)}
                className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 bg-white hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Practice →
              </button>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500 italic">
              You've caught up on priority skills — head to Practice to keep your rhythm.
            </p>
          )}

          {/* Chained "Then" rows */}
          <div className="mt-3 space-y-2">
            {srsOverdueSkills.length > 0 && (
              <button
                onClick={() => onStartSkillPractice(srsOverdueSkills[0].skillId)}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-200 hover:bg-slate-50 transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              >
                <span className="text-[10px] font-black uppercase text-slate-400 w-10 shrink-0 text-left">Then</span>
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    Spaced review · {srsOverdueSkills.length} skill{srsOverdueSkills.length !== 1 ? 's' : ''} due
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {srsOverdueSkills.slice(0, 3).map((s) => s.name).join(', ')}
                    {srsOverdueSkills.length > 3 && ` + ${srsOverdueSkills.length - 3} more`}
                  </p>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 text-sm">→</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('glossary')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-200 hover:bg-slate-50 transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              <span className="text-[10px] font-black uppercase text-slate-400 w-10 shrink-0 text-left">Then</span>
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white">
                <BookMarked className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900">Vocabulary review</p>
                <p className="text-xs text-slate-500">Revisit terms from recent practice</p>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-600 text-sm">→</span>
            </button>
          </div>
        </div>

        {/* This Week + Redemption (1/3) */}
        <div className="flex flex-col gap-5">
          <div className="editorial-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">This Week</h3>
              <span className="text-[10px] text-slate-400">7D</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Questions</span>
                <span className="font-bold text-slate-900 tabular-num">{weeklyQuestionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Study time</span>
                <span className="font-bold text-slate-900 tabular-num">
                  {weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accuracy</span>
                <span className="font-bold text-indigo-600 tabular-num">
                  {weeklyAccuracy != null ? `${weeklyAccuracy}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Today's goal</span>
                <span className="font-bold text-slate-900 tabular-num">{dailyQuestionCount} / {dailyGoal}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            </div>
          </div>

          {redemptionBankCount > 0 && (
            <RedemptionCard
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

      {/* ── The Toolshed ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-slate-900 tracking-[0.02em]">The Toolshed</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Every tool at hand</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FeatureTile
            icon={<Zap className="w-5 h-5" />}
            label="Fluency Drill"
            hint="Rapid-fire cases, terms, concepts"
            grad="from-amber-500 to-orange-600"
            chip="New"
            onClick={() => onNavigate('fluency-drill')}
          />
          <FeatureTile
            icon={<BookOpen className="w-5 h-5" />}
            label="Vocab Quiz"
            hint="Now part of the Fluency Drill"
            grad="from-sky-500 to-cyan-600"
            onClick={() => onNavigate('fluency-drill')}
          />
          <FeatureTile
            icon={<MapIcon className="w-5 h-5" />}
            label="Learning Path"
            hint={nextModuleSkill ? `Next: ${nextModuleSkill.skillId}` : 'Structured by gap'}
            grad="from-emerald-500 to-teal-600"
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
            grad="from-violet-500 to-indigo-600"
            onClick={() => onNavigate('study-guide')}
          />
          <FeatureTile
            icon={<MessageCircle className="w-5 h-5" />}
            label="AI Tutor"
            hint="Ask anything, get quizzed"
            grad="from-rose-500 to-pink-600"
            chip="AI"
            onClick={() => onNavigate('tutor')}
          />
        </div>
      </section>
    </div>
  );
}
