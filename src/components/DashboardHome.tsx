// src/components/DashboardHome.tsx
// Post-diagnostic dashboard home tab — matches mockup-user-flow.html Screen 6.
// Replaces the isFullyUnlocked inline JSX in App.tsx.

import { Zap, BookOpen, Map as MapIcon, ClipboardList, MessageCircle, CheckCircle2 } from 'lucide-react';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import { PROFICIENCY_META, TOTAL_SKILLS } from '../utils/skillProficiency';
import type { ProgressSummary } from '../utils/progressSummaries';
import { SkillProgressBar } from './SkillProgressBar';
import { getProgressSkillsForDomain } from '../utils/progressTaxonomy';

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
  /** Baseline skill scores captured at diagnostic completion. Keyed by skillId, score is 0-1. */
  baselineSnapshot?: Record<string, { score: number; attempts: number; correct: number }> | null;

  // Post-assessment readiness banner (shows when demonstratingCount >= readinessTarget
  // AND postAssessmentSnapshot is null). See docs/WORKFLOW_GROUNDING.md section 3.10.
  postAssessmentSnapshot?: Record<string, unknown> | null;
  onStartPostAssessment?: () => void;
  onViewPostAssessmentReport?: () => void;

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
  baselineSnapshot,
  postAssessmentSnapshot,
  onStartPostAssessment,
  onViewPostAssessmentReport,
  onStartPractice,
  onStartSkillPractice,
  onOpenLearningPathModule,
  onStartRedemption,
  onNavigate,
}: DashboardHomeProps) {

  const readinessPct = readinessTarget > 0
    ? Math.min(Math.round((demonstratingCount / readinessTarget) * 100), 100)
    : 0;

  // Show the post-assessment CTA banner only when readiness has been reached
  // and the user has not yet completed the post-assessment retake.
  const showPostAssessmentBanner =
    demonstratingCount >= readinessTarget && !postAssessmentSnapshot;

  // Show the "view your growth report" link when post-assessment IS complete.
  const showPostAssessmentReportLink = Boolean(postAssessmentSnapshot);

  // Next learning path module (first weakest skill)
  const nextModuleSkill = weakestSkill;

  return (
    <div className="space-y-5 pb-12">

      {/* ── Post-Assessment Readiness Banner ─────────────────────────── */}
      {/* Per public/mockup-post-assessment.html Screen 1 — only renders when    */}
      {/* the user has hit the 32-of-45 threshold and not yet retaken.           */}
      {showPostAssessmentBanner && onStartPostAssessment && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-indigo-50 p-5 shadow-sm">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-emerald-800">You've reached readiness!</h3>
                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  {demonstratingCount}/{TOTAL_SKILLS} skills
                </span>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                You've demonstrated mastery across {demonstratingCount} of {TOTAL_SKILLS} skills — the readiness threshold. Take the post-assessment to officially measure your growth since Day 1.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onStartPostAssessment}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Start Post-Assessment →
                </button>
                <button
                  className="text-xs text-slate-500 transition hover:text-slate-700"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-Assessment Complete (link to growth report) ─────────── */}
      {showPostAssessmentReportLink && onViewPostAssessmentReport && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-700" />
            <div>
              <p className="text-sm font-bold text-indigo-900">Your Growth Report is ready</p>
              <p className="text-xs text-indigo-700/70">Compare your post-assessment to your diagnostic baseline.</p>
            </div>
          </div>
          <button
            onClick={onViewPostAssessmentReport}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            View Report →
          </button>
        </div>
      )}

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
        {/* Legend row */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-indigo-900" /> Baseline (Day 1)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-indigo-500" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-0.5 bg-slate-600" /> Mastery line (80%)
          </span>
        </div>
        <div className="space-y-4">
          {progressSummary.domains.map(domain => {
            // Current domain accuracy: average of skill scores within this domain
            const domainSkillIds = getProgressSkillsForDomain(domain.domainId).map(s => s.skillId);
            const skillsWithAttempts = domain.skills.filter(s => s.attempted > 0);
            const currentDomainScore = skillsWithAttempts.length > 0
              ? skillsWithAttempts.reduce((sum, s) => sum + (s.attempted > 0 ? s.correct / s.attempted : 0), 0) / skillsWithAttempts.length
              : 0;

            // Baseline domain score: average of baseline skill scores for skills in this domain
            let baselineDomainScore: number | null = null;
            if (baselineSnapshot) {
              const baselineSkillsInDomain = domainSkillIds
                .map(sid => baselineSnapshot[sid])
                .filter((s): s is { score: number; attempts: number; correct: number } => Boolean(s) && s.attempts > 0);
              if (baselineSkillsInDomain.length > 0) {
                baselineDomainScore = baselineSkillsInDomain.reduce((sum, s) => sum + s.score, 0) / baselineSkillsInDomain.length;
              }
            }

            return (
              <div
                key={domain.domainId}
                className="cursor-pointer rounded-lg px-2 py-1 -mx-2 transition hover:bg-slate-50"
                onClick={() => onStartPractice(domain.domainId)}
              >
                <SkillProgressBar
                  label={domain.domainName}
                  current={currentDomainScore}
                  baseline={baselineDomainScore}
                  showMasteryLine={true}
                  legend={false}
                  size="md"
                />
              </div>
            );
          })}
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

          {/* Spaced Review persistent card */}
          {srsOverdueSkills.length > 0 ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔁</span>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Spaced Review</span>
              </div>
              <div className="text-sm font-bold text-slate-800 mb-1">
                {srsOverdueSkills.length} skill{srsOverdueSkills.length !== 1 ? 's' : ''} overdue for review
              </div>
              <div className="text-xs text-slate-500 mb-3">Spacing strengthens long-term retention</div>
              <button
                onClick={() => {
                  if (srsOverdueSkills[0]) onStartSkillPractice(srsOverdueSkills[0].skillId);
                }}
                className="w-full rounded-lg bg-violet-600 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
              >
                Review Now →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔁</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Spaced Review</span>
              </div>
              <p className="text-xs text-slate-400">Nothing due — come back for review later.</p>
            </div>
          )}

          {/* Redemption card — always visible with 3 states */}
          {redemptionBankCount === 0 ? (
            /* State A — Inactive */
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Redemption Rounds</p>
              <p className="mt-1 text-xs text-slate-400">No questions in redemption yet — keep practicing!</p>
            </div>
          ) : redemptionCredits > 0 ? (
            /* State B — Active with credits */
            <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🧠</span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Redemption</span>
              </div>
              <span className="text-lg font-black text-purple-700">
                {redemptionCredits} credit{redemptionCredits !== 1 ? 's' : ''}
              </span>
              <div className="text-sm font-bold text-slate-800 mb-1 mt-1">Ready to test your memory?</div>
              <div className="text-xs text-slate-500 mb-2">
                {redemptionBankCount} question{redemptionBankCount !== 1 ? 's' : ''} waiting · See what's sticking
              </div>
              <div className="flex items-center gap-2 mb-3">
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
                className="w-full rounded-lg bg-purple-600 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
              >
                Enter Redemption →
              </button>
            </div>
          ) : (
            /* State C — Pending (bank > 0, no credits yet) */
            <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm opacity-80">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🧠</span>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-500">Redemption</span>
              </div>
              <div className="text-sm font-bold text-slate-700 mb-1">
                {redemptionBankCount} question{redemptionBankCount !== 1 ? 's' : ''} waiting
              </div>
              <div className="text-xs text-slate-500 mb-2">Keep practicing to earn a credit</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-purple-300 transition-all"
                    style={{ width: `${((20 - questionsToNextCredit) / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{questionsToNextCredit}/20 to next</span>
              </div>
              <button
                disabled
                className="w-full rounded-lg bg-purple-300 py-2 text-xs font-bold text-white cursor-not-allowed"
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

    </div>
  );
}
