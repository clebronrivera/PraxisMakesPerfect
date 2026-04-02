// src/components/DashboardHome.tsx
// Post-diagnostic dashboard home tab — matches mockup-dashboard.html layout.
// Replaces the isFullyUnlocked inline JSX in App.tsx.

import { Zap, BookOpen, Map as MapIcon, ClipboardList, MessageCircle } from 'lucide-react';
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

  // Domains
  progressSummary: ProgressSummary;

  // Actions
  onStartPractice: (domainId?: number) => void;
  onStartSkillPractice: (skillId: string) => void;
  onOpenLearningPathModule: (skillId: string) => void;
  onStartRedemption: () => void;
  onNavigate: (mode: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardHome({
  demonstratingCount,
  readinessTarget,
  readinessPhase,
  skillsToReadiness,
  srsOverdueSkills,
  weakestSkill,
  weakestDomain: _weakestDomain,
  dailyQuestionCount,
  dailyGoal,
  weeklyUsageSeconds,
  weeklyQuestionCount,
  weeklyAccuracy,
  redemptionBankCount,
  redemptionCredits,
  questionsToNextCredit,
  progressSummary,
  onStartPractice,
  onStartSkillPractice,
  onOpenLearningPathModule,
  onStartRedemption,
  onNavigate,
}: DashboardHomeProps) {

  const readinessPct = readinessTarget > 0
    ? Math.min(Math.round((demonstratingCount / readinessTarget) * 100), 100)
    : 0;

  // Next learning path module (first weakest skill)
  const nextModuleSkill = weakestSkill;

  return (
    <div className="space-y-5 pb-12">

      {/* ── Readiness Banner ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-700">Exam Readiness</span>
              <span className="text-sm font-bold text-indigo-600">
                {demonstratingCount} of {TOTAL_SKILLS} skills at {PROFICIENCY_META.proficient.label}
              </span>
            </div>
            <div className="w-full rounded-full bg-slate-100 h-2.5">
              <div
                className="h-2.5 rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-extrabold text-indigo-600">{readinessPct}%</div>
              <div className="text-xs text-slate-400">{readinessPhase}</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-200" />
            <div className="hidden sm:block text-right">
              <div className="text-xs text-slate-400 mb-0.5">Readiness target: {readinessTarget}</div>
              <div className="text-xs font-medium text-emerald-600">
                {skillsToReadiness === 0
                  ? 'Target reached!'
                  : `${skillsToReadiness} more to close the gap`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column: Today's Focus + Quick Stats / Redemption ───── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Today's Focus (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <span className="text-sm font-bold text-slate-800">Today's Focus</span>
            <span className="ml-auto text-xs text-slate-400">Based on your weakest areas</span>
          </div>

          {/* SRS Spaced Review (if overdue) */}
          {srsOverdueSkills.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-0.5">
                  Spaced Review · {srsOverdueSkills.length} skill{srsOverdueSkills.length !== 1 ? 's' : ''} overdue
                </div>
                <div className="text-sm font-bold text-slate-800">Skills due for review</div>
                <div className="mt-0.5 text-xs text-slate-500 truncate">
                  {srsOverdueSkills.slice(0, 3).map(s => s.name).join(', ')}
                  {srsOverdueSkills.length > 3 && ` + ${srsOverdueSkills.length - 3} more`}
                  {' — spacing strengthens long-term retention'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (srsOverdueSkills[0]) onStartSkillPractice(srsOverdueSkills[0].skillId);
                }}
                className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
              >
                Review Now →
              </button>
            </div>
          )}

          {/* Priority skill card */}
          {weakestSkill && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-0.5">
                  Priority · {PROFICIENCY_META.emerging.label}
                </div>
                <div className="text-sm font-bold text-slate-800">{weakestSkill.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Domain: {weakestSkill.domain} · {weakestSkill.emergingCount} skill{weakestSkill.emergingCount !== 1 ? 's' : ''} below 60%
                </div>
              </div>
              <button
                onClick={() => onStartSkillPractice(weakestSkill.skillId)}
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Practice →
              </button>
            </div>
          )}

          {/* Vocab quiz suggestion */}
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-0.5">
                Then · Vocab Review
              </div>
              <div className="text-sm font-bold text-slate-800">Vocabulary Quiz</div>
              <div className="mt-0.5 text-xs text-slate-500">
                Review terms from your recent sessions
              </div>
            </div>
            <button
              onClick={() => onNavigate('glossary')}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Quiz Now →
            </button>
          </div>
        </div>

        {/* Right column: Quick Stats + Redemption (1/3 width) */}
        <div className="flex flex-col gap-3">
          {/* This Week stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">This Week</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Questions</span>
                <span className="font-bold text-slate-800">{weeklyQuestionCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Accuracy</span>
                <span className="font-bold text-emerald-600">
                  {weeklyAccuracy != null ? `${weeklyAccuracy}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Study time</span>
                <span className="font-bold text-slate-800">
                  {weeklyUsageSeconds > 0 ? formatStudyTime(weeklyUsageSeconds) : '0m'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Daily goal</span>
                <span className="font-bold text-amber-700">{dailyQuestionCount} / {dailyGoal}</span>
              </div>
            </div>
          </div>

          {/* Redemption card */}
          {redemptionBankCount > 0 && (
            <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🧠</span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Redemption</span>
              </div>
              <div className="text-sm font-bold text-slate-800 mb-1">Ready to test your memory?</div>
              <div className="text-xs text-slate-500 mb-2">
                {redemptionBankCount} question{redemptionBankCount !== 1 ? 's' : ''} waiting · See what's sticking
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-purple-600">
                  {redemptionCredits} credit{redemptionCredits !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-purple-400 transition-all"
                    style={{ width: `${((20 - questionsToNextCredit) / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{questionsToNextCredit}/20 to next</span>
              </div>
              <button
                onClick={onStartRedemption}
                disabled={redemptionCredits <= 0}
                className={`w-full rounded-lg py-2 text-xs font-bold text-white transition ${
                  redemptionCredits > 0
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-300 cursor-not-allowed'
                }`}
              >
                Enter Redemption →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Feature Tiles (5-card grid) ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Fluency Drill */}
        <button
          onClick={() => onNavigate('glossary')}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 transition group-hover:bg-orange-200">
            <Zap className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-0.5">NEW</div>
          <div className="text-sm font-bold leading-tight text-slate-800 mb-1">Fluency Drill</div>
          <div className="text-xs text-slate-500">Rapid-fire cases, terms & concepts</div>
        </button>

        {/* Vocab Quiz */}
        <button
          onClick={() => onNavigate('glossary')}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 transition group-hover:bg-blue-200">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-sm font-bold leading-tight text-slate-800 mb-1">Vocab Quiz</div>
          <div className="text-xs text-slate-500">Review terms from practice</div>
        </button>

        {/* Learning Path */}
        <button
          onClick={() => {
            if (nextModuleSkill) onOpenLearningPathModule(nextModuleSkill.skillId);
            else onNavigate('practice-hub');
          }}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 transition group-hover:bg-emerald-200">
            <MapIcon className="h-5 w-5 text-emerald-600" />
          </div>
          {nextModuleSkill && (
            <div className="text-xs text-emerald-500 mb-0.5">Next: {nextModuleSkill.skillId}</div>
          )}
          <div className="text-sm font-bold leading-tight text-slate-800 mb-1">Learning Path</div>
          <div className="text-xs text-slate-500">
            {nextModuleSkill ? nextModuleSkill.name : 'Structured modules by gap'}
          </div>
        </button>

        {/* Study Guide */}
        <button
          onClick={() => onNavigate('study-guide')}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 transition group-hover:bg-purple-200">
            <ClipboardList className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-sm font-bold leading-tight text-slate-800 mb-1">Study Guide</div>
          <div className="text-xs text-slate-500">AI-generated plan from your data</div>
        </button>

        {/* AI Tutor */}
        <button
          onClick={() => onNavigate('tutor')}
          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-200 hover:bg-amber-50"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 transition group-hover:bg-amber-200">
            <MessageCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-xs text-amber-500 mb-0.5">AI-powered</div>
          <div className="text-sm font-bold leading-tight text-slate-800 mb-1">AI Tutor</div>
          <div className="text-xs text-slate-500">Ask anything, get quizzed</div>
        </button>
      </div>

      {/* ── Domain Performance ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800">Domain Performance</span>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs text-indigo-600 hover:underline"
          >
            Full report →
          </button>
        </div>
        <div className="space-y-3">
          {progressSummary.domains.map(domain => {
            const pct = domain.activeSkillCount > 0
              ? Math.round((domain.strongerSkillCount / domain.activeSkillCount) * 100)
              : 0;
            const barColor = pct >= 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
            const labelColor = pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-500';
            const profLabel = pct >= 80 ? PROFICIENCY_META.proficient.label
              : pct >= 60 ? PROFICIENCY_META.approaching.label
              : PROFICIENCY_META.emerging.label;

            return (
              <div
                key={domain.domainId}
                className="cursor-pointer rounded-lg px-2 py-1 -mx-2 transition hover:bg-slate-50"
                onClick={() => onStartPractice(domain.domainId)}
              >
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{domain.domainName}</span>
                  <span className={`font-semibold ${labelColor}`}>
                    {pct}% · {profLabel}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
