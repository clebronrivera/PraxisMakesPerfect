// src/components/StudyModesSection.tsx
//
// Practice tab: stats strip, readiness bar, three-mode selector.
//
// ─── Practice Modes ──────────────────────────────────────────────────────────
//   By Domain      — practice questions scoped to one of the 4 Praxis domains
//   By Skill       — practice questions scoped to a single skill; each row
//                    has a Practice button AND a help icon that opens the
//                    SkillHelpDrawer with the micro-lesson for that skill
//   Learning Path  — ordered list of skill-based micro-lessons arranged from
//                    lowest-performing to highest-performing skill; mastered
//                    skills appear greyed/inactive and locked
//
// ─── Learning Path design rules ──────────────────────────────────────────────
//   • Ordered by user deficit (lowest accuracy first)
//   • Mastered skills (tier === 'proficient') shown in green and INACTIVE
//   • Each skill row shows the primary module ID (MOD-Dx-xx) and title
//   • "View Lesson" expands to show the full micro-lesson inline
//   • Lesson: mark as viewed ✓ + cumulative time tracking
//   • Users must scroll/read to find what they need
//
// ─── By Skill design rules ───────────────────────────────────────────────────
//   • Each skill row: Practice button → launches question practice
//   • Help icon → opens SkillHelpDrawer (full lesson, separate from practice)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  BookOpen, Layers, Lock, Target, TrendingUp,
  HelpCircle, RefreshCw,
} from 'lucide-react';
import { getDomainColor } from '../utils/domainColors';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import {
  getSkillProficiency,
  PROFICIENCY_META,
  TOTAL_SKILLS,
  READINESS_TARGET,
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
} from '../utils/skillProficiency';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import {
  getPrimaryModuleForSkill,
} from '../data/learningModules';
import SkillHelpDrawer from './SkillHelpDrawer';
import LearningPathNodeMap from './LearningPathNodeMap';
import { useLearningPathSupabase } from '../hooks/useLearningPathSupabase';
import type { UserProfile } from '../hooks/useProgressTracking';

// ─── Constants ────────────────────────────────────────────────────────────────
// TOTAL_SKILLS and READINESS_TARGET are imported from skillProficiency — do not redeclare.

// Light-surface equivalents for PROFICIENCY_META badge/text tokens.
// PROFICIENCY_META uses dark-mode colours; these overrides apply when
// badges are rendered on white/glass backgrounds.
const LIGHT_BADGE: Record<string, { badge: string; text: string }> = {
  proficient:  { badge: 'bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/30 text-[color:var(--d2-mint)]', text: 'text-[color:var(--d2-mint)]' },
  approaching: { badge: 'bg-[color:var(--d1-peach)]/10 border border-[color:var(--d1-peach)]/30 text-[color:var(--d1-peach)]',       text: 'text-[color:var(--d1-peach)]'   },
  emerging:    { badge: 'bg-[color:var(--accent-rose)]/10 border border-[color:var(--accent-rose)]/30 text-[color:var(--accent-rose)]',           text: 'text-[color:var(--accent-rose)]'    },
  unstarted:   { badge: 'bg-white/8 border border-white/10 text-slate-500',       text: 'text-slate-500'   },
};

// ─── Date helpers ────────────────────────────────────────────────────────────
// Uses local date parts (not UTC) so "today" matches the user's wall clock.

function getLocalDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(dateStr: string): string {
  // Add noon offset so timezone shifts don't flip the displayed day.
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudyModesSectionProps {
  profile: UserProfile;
  userId: string | null;
  weeklyAvgSeconds?: number;
  totalQuestionsSeen?: number;
  onDomainSelect: (domainId: number) => void;
  /** Launches By Skill question practice for a specific skill */
  onStartSkillPractice: (skillId: string) => void;
  /** Opens the full Learning Path module page for a skill node */
  onNodeClick?: (skillId: string) => void;
  /** Called from locked panels to send the user to the adaptive diagnostic */
  onStartScreener?: () => void;
  onStartDiagnostic?: () => void;
  /** Legacy props kept for App.tsx compatibility — no longer used in this panel */
  onSkillReviewOpen?: () => void;
  onLearningPathOpen?: () => void;
  onGenerateStudyPlan?: () => void;
  studyPlanExists?: boolean;
}

type PracticeMode = 'domain' | 'skill' | 'path';

// ─── Domain stat computation ──────────────────────────────────────────────────

interface DomainStat {
  domain: typeof PROGRESS_DOMAINS[number];
  totalSkills: number;
  demonstratingCount: number;
  approachingCount: number;
  emergingCount: number;
  unstartedCount: number;
  demonstratingPct: number;
}

function buildDomainStats(profile: UserProfile): DomainStat[] {
  return PROGRESS_DOMAINS.map((domain) => {
    const skills = getProgressSkillsForDomain(domain.id);
    let demonstratingCount = 0;
    let approachingCount = 0;
    let emergingCount = 0;
    let unstartedCount = 0;

    for (const s of skills) {
      const perf = profile.skillScores?.[s.skillId];
      const tier = getSkillProficiency(perf?.score ?? 0, perf?.attempts ?? 0, perf?.weightedAccuracy);
      if (tier === 'proficient') demonstratingCount++;
      else if (tier === 'approaching') approachingCount++;
      else if (tier === 'emerging') emergingCount++;
      else unstartedCount++;
    }

    return {
      domain,
      totalSkills: skills.length,
      demonstratingCount,
      approachingCount,
      emergingCount,
      unstartedCount,
      demonstratingPct: Math.round((demonstratingCount / Math.max(skills.length, 1)) * 100),
    };
  }).sort((a, b) => {
    if (a.demonstratingPct !== b.demonstratingPct) return a.demonstratingPct - b.demonstratingPct;
    return a.domain.id - b.domain.id;
  });
}

// ─── Skill row data ───────────────────────────────────────────────────────────

interface SkillRow {
  skillId: string;
  fullLabel: string;
  score: number | null;
  attempts: number;
  tier: ReturnType<typeof getSkillProficiency>;
  nextReviewDate?: string;
  srsBox?: number;
}

function buildAllSkillRows(profile: UserProfile): SkillRow[] {
  const rows: SkillRow[] = [];
  for (const domain of PROGRESS_DOMAINS) {
    for (const s of getProgressSkillsForDomain(domain.id)) {
      const perf = profile.skillScores?.[s.skillId];
      const attempts = perf?.attempts ?? 0;
      const score = attempts > 0 ? (perf?.score ?? 0) : null;
      rows.push({
        skillId: s.skillId,
        fullLabel: s.fullLabel,
        score,
        attempts,
        tier: getSkillProficiency(score ?? 0, attempts, perf?.weightedAccuracy),
        nextReviewDate: perf?.nextReviewDate,
        srsBox: perf?.srsBox,
      });
    }
  }
  // Sort: lowest accuracy first; unstarted last
  return rows.sort((a, b) => {
    if (a.score === null && b.score === null) return a.skillId.localeCompare(b.skillId);
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return a.score - b.score;
  });
}

// ─── Domain Panel ────────────────────────────────────────────────────────────

function DomainPanel({
  profile,
  isLocked,
  onDomainSelect,
  onStartDiagnostic,
}: {
  profile: UserProfile;
  isLocked: boolean;
  onDomainSelect: (domainId: number) => void;
  onStartDiagnostic?: () => void;
}) {
  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--d1-peach)]/10">
          <Lock className="w-4 h-4 text-[color:var(--d1-peach)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock domain-based practice across all four Praxis sections.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="btn-soft-glow flex items-center gap-2 px-4 py-2 text-sm"
          >
            Take the adaptive diagnostic
          </button>
        )}
      </div>
    );
  }

  const stats = buildDomainStats(profile);

  return (
    <div className="space-y-3">
      <p className="eyebrow flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-[color:var(--d1-peach)]" />
        Domain overview — most concern first
      </p>
      <div className="space-y-2.5">
        {stats.map((stat) => {
          const color = getDomainColor(stat.domain.id);
          const barPct = stat.demonstratingPct;
          const barColor = barPct >= 70 ? 'bg-[color:var(--d2-mint)]' : barPct >= 50 ? 'bg-[color:var(--d1-peach)]' : 'bg-[color:var(--accent-rose)]';
          const labelColor = barPct >= 70 ? 'text-[color:var(--d2-mint)]' : barPct >= 50 ? 'text-[color:var(--d1-peach)]' : 'text-[color:var(--accent-rose)]';

          return (
            <div
              key={stat.domain.id}
              className="glass relative overflow-hidden p-4"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />
              <div className="flex items-start justify-between gap-3 mb-3 pl-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-tight text-white">{stat.domain.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{stat.totalSkills} skills</p>
                </div>
                <button
                  onClick={() => onDomainSelect(stat.domain.id)}
                  className="btn-ghost-atelier shrink-0 px-3 py-1.5 text-sm"
                >
                  Practice
                </button>
              </div>
              <div className="relative h-1.5 mb-2" style={{ overflow: 'visible' }}>
                <div className="absolute inset-0 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-[color:var(--d1-peach)]/100/70"
                  style={{ left: '70%' }}
                  title="70% mastery goal"
                />
              </div>
              <div className="flex items-center justify-between pl-2">
                <p className={`text-sm font-semibold ${labelColor}`}>
                  {stat.demonstratingCount} of {stat.totalSkills} skills {PROFICIENCY_META.proficient.label}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {stat.emergingCount > 0 && (
                    <span className="rounded-full bg-[color:var(--accent-rose)]/10 border border-[color:var(--accent-rose)]/30 px-1.5 py-0.5 text-[11px] font-medium text-[color:var(--accent-rose)]">
                      {stat.emergingCount} {PROFICIENCY_META.emerging.label}
                    </span>
                  )}
                  {stat.approachingCount > 0 && (
                    <span className="rounded-full bg-[color:var(--d1-peach)]/10 border border-[color:var(--d1-peach)]/30 px-1.5 py-0.5 text-[11px] font-medium text-[color:var(--d1-peach)]">
                      {stat.approachingCount} {PROFICIENCY_META.approaching.label}
                    </span>
                  )}
                  {stat.demonstratingCount > 0 && (
                    <span className="rounded-full bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/30 px-1.5 py-0.5 text-[11px] font-medium text-[color:var(--d2-mint)]">
                      {stat.demonstratingCount} {PROFICIENCY_META.proficient.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skill Panel ─────────────────────────────────────────────────────────────

type SkillFilter = 'all' | 'proficient' | 'approaching' | 'emerging' | 'unstarted' | 'overdue';

function SkillPanel({
  profile,
  isLocked,
  filter,
  onFilterChange,
  srsOverdueCount,
  onStartSkillPractice,
  onOpenHelp,
  onStartDiagnostic,
}: {
  profile: UserProfile;
  isLocked: boolean;
  filter: SkillFilter;
  onFilterChange: (f: SkillFilter) => void;
  srsOverdueCount: number;
  onStartSkillPractice: (skillId: string) => void;
  onOpenHelp: (skillId: string, skillLabel: string) => void;
  onStartDiagnostic?: () => void;
}) {

  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--d1-peach)]/10">
          <Lock className="w-4 h-4 text-[color:var(--d1-peach)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock targeted skill-by-skill practice across all 45 skills.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="btn-soft-glow flex items-center gap-2 px-4 py-2 text-sm"
          >
            Take the adaptive diagnostic
          </button>
        )}
      </div>
    );
  }

  const allRows = buildAllSkillRows(profile);
  const assessedRows = allRows.filter(r => r.attempts > 0);
  const demonstratingCount = assessedRows.filter(r => r.tier === 'proficient').length;
  const approachingCount = assessedRows.filter(r => r.tier === 'approaching').length;
  const emergingCount = assessedRows.filter(r => r.tier === 'emerging').length;

  const today = getLocalDateStr();
  const displayed =
    filter === 'all'     ? allRows :
    filter === 'overdue' ? allRows.filter(r => r.attempts > 0 && !!r.nextReviewDate && r.nextReviewDate <= today) :
                           allRows.filter(r => r.tier === filter);

  const filterButtons: Array<{ id: SkillFilter; label: string; count: number; css: string; activeCss: string }> = [
    { id: 'all',       label: 'All',                            count: allRows.length,    css: 'text-slate-500 border-white/10',   activeCss: 'bg-[color:var(--d1-peach)]/10 border-[color:var(--d1-peach)]/50 text-white'    },
    { id: 'emerging',  label: PROFICIENCY_META.emerging.label,  count: emergingCount,     css: 'text-[color:var(--accent-rose)] border-[color:var(--accent-rose)]/30',     activeCss: 'bg-[color:var(--accent-rose)]/10 border-[color:var(--accent-rose)]/50 text-[color:var(--accent-rose)]'       },
    { id: 'approaching',label: PROFICIENCY_META.approaching.label, count: approachingCount, css: 'text-[color:var(--d1-peach)] border-[color:var(--d1-peach)]/30', activeCss: 'bg-[color:var(--d1-peach)]/10 border-[color:var(--d1-peach)]/50 text-[color:var(--d1-peach)]'    },
    { id: 'proficient',label: PROFICIENCY_META.proficient.label, count: demonstratingCount, css: 'text-[color:var(--d2-mint)] border-[color:var(--d2-mint)]/30', activeCss: 'bg-[color:var(--d2-mint)]/10 border-[color:var(--d2-mint)]/50 text-[color:var(--d2-mint)]' },
    ...(srsOverdueCount > 0 ? [{
      id: 'overdue' as SkillFilter,
      label: `Due (${srsOverdueCount})`,
      count: srsOverdueCount,
      css: 'text-violet-700 border-violet-200',
      activeCss: 'bg-violet-50 border-violet-300 text-violet-700',
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Assessed', value: assessedRows.length, css: 'text-white' },
          { label: PROFICIENCY_META.emerging.label, value: emergingCount, css: 'text-[color:var(--accent-rose)]' },
          { label: PROFICIENCY_META.approaching.label, value: approachingCount, css: 'text-[color:var(--d1-peach)]' },
          { label: PROFICIENCY_META.proficient.label, value: demonstratingCount, css: 'text-[color:var(--d2-mint)]' },
        ].map(stat => (
          <div
            key={stat.label}
            className="glass px-3 py-3 text-center"
          >
            <p className={`text-lg font-bold tabular-nums ${stat.css}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Usage hint */}
      <p className="flex items-center gap-1.5 text-sm text-slate-500">
        <HelpCircle className="w-3 h-3 shrink-0 text-[color:var(--d1-peach)]" />
        Tap Practice for questions · tap the help icon to open the skill lesson
      </p>

      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => onFilterChange(btn.id)}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              filter === btn.id ? btn.activeCss : `bg-transparent ${btn.css} hover:opacity-80`
            }`}
          >
            {btn.id === 'overdue' ? btn.label : (
              <>{btn.label} {btn.count > 0 && <span className="opacity-70">({btn.count})</span>}</>
            )}
          </button>
        ))}
      </div>

      {/* Skill grid */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
        {displayed.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">No skills in this level yet.</p>
        ) : (
          displayed.map(row => {
            const meta = PROFICIENCY_META[row.tier];
            const pct = row.score !== null ? Math.round(row.score * 100) : null;
            const primaryModule = getPrimaryModuleForSkill(row.skillId);

            const lightBadge = LIGHT_BADGE[row.tier] ?? LIGHT_BADGE.unstarted;
            return (
              <div
                key={row.skillId}
                className="glass flex items-center gap-3 px-3 py-3"
              >
                {/* Skill label + module code */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm leading-snug text-slate-200">
                    {row.fullLabel}
                  </p>
                  {primaryModule && (
                    <p className="mt-0.5 text-[11px] font-mono text-slate-500">{primaryModule.id}</p>
                  )}
                </div>

                {/* Proficiency + score */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${lightBadge.badge}`}>
                    {meta.label}
                  </span>
                  {pct !== null && (
                    <span className={`text-[11px] font-bold tabular-nums ${lightBadge.text}`}>{pct}%</span>
                  )}
                </div>

                {/* SRS chip — only for skills with attempts and a near/past review date */}
                {(() => {
                  if (!row.nextReviewDate || row.attempts === 0) return null;
                  const daysOut = Math.round(
                    (new Date(row.nextReviewDate + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime())
                    / 86_400_000
                  );
                  if (daysOut < 0) return (
                    <span className="rounded-full px-1.5 py-0.5 text-[11px] font-medium bg-[color:var(--d1-peach)]/10 border border-[color:var(--d1-peach)]/30 text-[color:var(--d1-peach)] shrink-0">
                      Overdue
                    </span>
                  );
                  if (daysOut === 0) return (
                    <span className="rounded-full px-1.5 py-0.5 text-[11px] font-medium bg-[color:var(--d1-peach)]/10 border border-[color:var(--d1-peach)]/30 text-[color:var(--d1-peach)] shrink-0">
                      Due today
                    </span>
                  );
                  if (daysOut <= 3) return (
                    <span className="rounded-full px-1.5 py-0.5 text-[11px] font-medium bg-violet-50 border border-violet-200 text-violet-700 shrink-0">
                      Due {formatShortDate(row.nextReviewDate)}
                    </span>
                  );
                  return null;
                })()}

                {/* Help button — opens SkillHelpDrawer */}
                <button
                  onClick={() => onOpenHelp(row.skillId, row.fullLabel)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[color:var(--d1-peach)]/10 hover:text-[color:var(--d1-peach)]"
                  title="View skill lesson"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {/* Practice button — launches question practice */}
                <button
                  onClick={() => onStartSkillPractice(row.skillId)}
                  className="btn-ghost-atelier shrink-0 px-3 py-1.5 text-sm"
                >
                  Practice
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Learning Path Panel ──────────────────────────────────────────────────────
//
// Wraps LearningPathNodeMap with a locked state and Supabase progress loading.
// Node clicks are forwarded to the parent via onNodeClick (→ opens module page).
// ─────────────────────────────────────────────────────────────────────────────

function LearningPathPanel({
  profile,
  userId,
  isLocked,
  onNodeClick,
  onStartDiagnostic,
}: {
  profile: UserProfile;
  userId: string | null;
  isLocked: boolean;
  onNodeClick: (skillId: string) => void;
  onStartDiagnostic?: () => void;
}) {
  const { progress: lpProgress } = useLearningPathSupabase(userId);

  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--d1-peach)]/10">
          <Lock className="w-4 h-4 text-[color:var(--d1-peach)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock your personalized learning path, ordered by your areas of greatest need.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="btn-soft-glow flex items-center gap-2 px-4 py-2 text-sm"
          >
            Take the adaptive diagnostic
          </button>
        )}
      </div>
    );
  }

  return (
    <LearningPathNodeMap
      profile={profile}
      lpProgress={lpProgress}
      onNodeClick={onNodeClick}
    />
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function StudyModesSection({
  profile,
  userId,
  weeklyAvgSeconds = 0,
  totalQuestionsSeen,
  onDomainSelect,
  onStartSkillPractice,
  onNodeClick,
  onStartDiagnostic,
}: StudyModesSectionProps) {
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('domain');
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('all');

  // Skill Help Drawer state (By Skill tab → help icon)
  const [helpSkillId, setHelpSkillId] = useState<string | null>(null);
  const [helpSkillLabel, setHelpSkillLabel] = useState<string>('');
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);

  const fullAssessmentComplete = Boolean(profile.fullAssessmentComplete);

  // ── Stats strip ──────────────────────────────────────────────────────────
  const allEntries = Object.entries(profile.skillScores ?? {});
  const totalAttempts = allEntries.reduce((s, [, p]) => s + p.attempts, 0);
  const totalCorrect = allEntries.reduce((s, [, p]) => s + p.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  // ── Readiness bar ────────────────────────────────────────────────────────
  const demonstratingCount = allEntries.filter(
    ([, p]) => getSkillProficiency(p.score ?? 0, p.attempts ?? 0, p.weightedAccuracy) === 'proficient'
  ).length;
  const readinessBarPct = Math.min(Math.round((demonstratingCount / READINESS_TARGET) * 100), 100);

  // ── SRS: skills due for review ────────────────────────────────────────
  const today = getLocalDateStr();
  const srsOverdueCount = allEntries.filter(
    ([, p]) => p.nextReviewDate && p.nextReviewDate <= today && p.attempts > 0
  ).length;

  const tabs: Array<{
    id: PracticeMode;
    label: string;
    sublabel: string;
    locked: boolean;
    lockReason: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'domain',
      label: 'By Domain',
      sublabel: 'Practice by Praxis section — 4 domains, weakest first',
      locked: !fullAssessmentComplete,
      lockReason: 'Requires adaptive diagnostic',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'skill',
      label: 'By Skill',
      sublabel: 'Target any of 45 skills — sorted weakest to strongest',
      locked: !fullAssessmentComplete,
      lockReason: 'Requires adaptive diagnostic',
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      id: 'path',
      label: 'Learning Path',
      sublabel: 'Structured micro-lessons ordered by your gaps',
      locked: !fullAssessmentComplete,
      lockReason: 'Requires adaptive diagnostic',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <section className="space-y-4">

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          {
            label: 'Questions answered',
            value: (totalQuestionsSeen ?? totalAttempts).toLocaleString(),
            css: 'text-cyan-700',
          },
          {
            label: 'Avg study time / day',
            value: weeklyAvgSeconds > 0 ? formatStudyTime(weeklyAvgSeconds) : '—',
            css: 'text-violet-700',
          },
          {
            label: 'Overall accuracy',
            value: overallAccuracy !== null ? `${overallAccuracy}%` : '—',
            css: overallAccuracy !== null && overallAccuracy >= DEMONSTRATING_THRESHOLD * 100
              ? 'text-[color:var(--d2-mint)]'
              : overallAccuracy !== null && overallAccuracy >= APPROACHING_THRESHOLD * 100
                ? 'text-[color:var(--d1-peach)]'
                : 'text-[color:var(--accent-rose)]',
          },
        ].map(stat => (
          <div key={stat.label} className="glass p-3 text-center">
            <p className={`text-lg font-bold tabular-nums ${stat.css}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Zero-data welcome nudge ─────────────────────────────────────── */}
      {totalAttempts === 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-normal">
          No data yet — your stats will appear here as soon as you answer your first question.
          Start with the baseline assessment on the Dashboard, or jump straight into practice to get going.
        </div>
      )}

      {/* ── Readiness bar ───────────────────────────────────────────────── */}
      <div className="glass p-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-200">Praxis Readiness</p>
          <p className={`text-sm font-bold tabular-nums ${demonstratingCount >= READINESS_TARGET ? 'text-[color:var(--d2-mint)]' : 'text-slate-500'}`}>
            {demonstratingCount} / {READINESS_TARGET} {PROFICIENCY_META.proficient.label}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className={`h-full rounded-full transition-all duration-700 ${demonstratingCount >= READINESS_TARGET ? 'bg-[color:var(--d2-mint)]/100' : 'bg-[color:var(--d1-peach)]/100'}`}
            style={{ width: `${readinessBarPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Goal: {READINESS_TARGET} of {TOTAL_SKILLS} skills {PROFICIENCY_META.proficient.label}</p>
      </div>

      {/* ── SRS due-for-review nudge ─────────────────────────────────────── */}
      {srsOverdueCount > 0 && fullAssessmentComplete && (
        <button
          onClick={() => { setSelectedMode('skill'); setSkillFilter('overdue'); }}
          className="w-full flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-left transition-colors hover:bg-violet-100"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0 text-violet-600" />
          <div>
            <p className="text-sm text-violet-800">
              <span className="font-semibold">Spaced Review — {srsOverdueCount} skill{srsOverdueCount !== 1 ? 's' : ''} due today</span>
            </p>
            <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
              Previously-answered questions reappear at research-optimized intervals — 1 day, 3 days, 7 days. Spaced practice is 2–3× more effective for long-term retention than blocked practice.
            </p>
          </div>
        </button>
      )}

      {/* ── Term Sprint info ─────────────────────────────────────────────── */}
      {fullAssessmentComplete && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5">
          <p className="text-xs font-bold text-blue-800">Term Sprint</p>
          <p className="text-xs text-blue-700 mt-0.5">396 school psychology terms · 10 seconds each · both directions</p>
        </div>
      )}

      {/* ── Tab selector ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {tabs.map((tab) => {
          const isActive = selectedMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedMode(tab.id)}
              className={`
                p-3 rounded-xl border text-left transition-all
                ${isActive
                  ? 'bg-[color:var(--d1-peach)]/10 border-[color:var(--d1-peach)]/50'
                  : 'bg-white/5 border-white/10 hover:border-[color:var(--d1-peach)]/30'}
              `}
            >
              <div className={`flex items-center gap-1.5 mb-1 ${
                isActive ? 'text-[color:var(--d1-peach)]' : tab.locked ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {tab.locked ? <Lock className="w-3 h-3" /> : tab.icon}
                <p className={`text-sm font-semibold truncate ${
                  isActive ? 'text-white' : tab.locked ? 'text-slate-500' : 'text-slate-200'
                }`}>
                  {tab.label}
                </p>
              </div>
              <p className="truncate text-[11px] leading-tight text-slate-500">{tab.sublabel}</p>
              {tab.locked && (
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{tab.lockReason}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="min-h-[200px]">
        {selectedMode === 'domain' && (
          <DomainPanel
            profile={profile}
            isLocked={!fullAssessmentComplete}
            onDomainSelect={onDomainSelect}
            onStartDiagnostic={onStartDiagnostic}
          />
        )}
        {selectedMode === 'skill' && (
          <SkillPanel
            profile={profile}
            isLocked={!fullAssessmentComplete}
            filter={skillFilter}
            onFilterChange={setSkillFilter}
            srsOverdueCount={srsOverdueCount}
            onStartSkillPractice={onStartSkillPractice}
            onStartDiagnostic={onStartDiagnostic}
            onOpenHelp={(skillId, skillLabel) => {
              setHelpSkillId(skillId);
              setHelpSkillLabel(skillLabel);
              setHelpDrawerOpen(true);
            }}
          />
        )}
        {selectedMode === 'path' && (
          <LearningPathPanel
            profile={profile}
            userId={userId}
            isLocked={!fullAssessmentComplete}
            onNodeClick={onNodeClick ?? (() => {})}
            onStartDiagnostic={onStartDiagnostic}
          />
        )}
      </div>

      {/* ── Skill Help Drawer (By Skill tab) ─────────────────────────────── */}
      <SkillHelpDrawer
        skillId={helpSkillId}
        skillLabel={helpSkillLabel}
        isOpen={helpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
        userId={userId}
      />
    </section>
  );
}
