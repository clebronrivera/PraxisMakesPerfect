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
  ChevronRight,
} from 'lucide-react';
import { getDomainColor } from '../utils/domainColors';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import { getSkillProficiency, PROFICIENCY_META } from '../utils/skillProficiency';
import { formatStudyTime } from '../hooks/useDailyStudyTime';
import {
  getPrimaryModuleForSkill,
} from '../data/learningModules';
import LearningPathNodeMap from './LearningPathNodeMap';
import { useLearningPathSupabase } from '../hooks/useLearningPathSupabase';
import type { UserProfile } from '../hooks/useFirebaseProgress';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SKILLS = 45;
const READINESS_TARGET = Math.ceil(TOTAL_SKILLS * 0.7); // 32

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudyModesSectionProps {
  profile: UserProfile;
  userId: string | null;
  weeklyAvgSeconds?: number;
  totalQuestionsSeen?: number;
  onDomainSelect: (domainId: number) => void;
  /** Opens the skill's Learning Module page (lesson + practice) */
  onOpenSkillModule: (skillId: string) => void;
  /** Launches By Skill question practice for a specific skill (legacy fallback) */
  onStartSkillPractice?: (skillId: string) => void;
  /** Opens the full Learning Path module page for a skill node */
  onNodeClick?: (skillId: string) => void;
  /** Legacy props kept for App.tsx compatibility — no longer used in this panel */
  onSkillReviewOpen?: () => void;
  onLearningPathOpen?: () => void;
  onGenerateStudyPlan?: () => void;
  onStartSpicyPractice?: () => void;
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
      const tier = getSkillProficiency(perf?.score ?? 0, perf?.attempts ?? 0);
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
        tier: getSkillProficiency(score ?? 0, attempts),
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
}: {
  profile: UserProfile;
  isLocked: boolean;
  onDomainSelect: (domainId: number) => void;
}) {
  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the screener</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-relaxed text-slate-500">
            Complete the 50-question screener to unlock domain-based practice across all four Praxis sections.
          </p>
        </div>
      </div>
    );
  }

  const stats = buildDomainStats(profile);

  return (
    <div className="space-y-3">
      <p className="editorial-overline flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-amber-700" />
        Domain overview — most concern first
      </p>
      <div className="space-y-2.5">
        {stats.map((stat) => {
          const color = getDomainColor(stat.domain.id);
          const barPct = stat.demonstratingPct;
          const barColor = barPct >= 70 ? 'bg-emerald-400' : barPct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
          const labelColor = barPct >= 70 ? 'text-emerald-400' : barPct >= 50 ? 'text-amber-400' : 'text-rose-400';

          return (
            <div
              key={stat.domain.id}
              className="editorial-surface relative overflow-hidden p-4"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />
              <div className="flex items-start justify-between gap-3 mb-3 pl-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-tight text-slate-900">{stat.domain.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{stat.totalSkills} skills</p>
                </div>
                <button
                  onClick={() => onDomainSelect(stat.domain.id)}
                  className="editorial-button-secondary shrink-0 px-3 py-1.5 text-sm"
                >
                  Practice
                </button>
              </div>
              <div className="relative h-1.5 mb-2" style={{ overflow: 'visible' }}>
                <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-amber-500/70"
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
                    <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-medium text-rose-300">
                      {stat.emergingCount} {PROFICIENCY_META.emerging.label}
                    </span>
                  )}
                  {stat.approachingCount > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
                      {stat.approachingCount} {PROFICIENCY_META.approaching.label}
                    </span>
                  )}
                  {stat.demonstratingCount > 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300">
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
//
// Each skill card shows:
//   • A colored left bar that grades from rose (low accuracy) → amber → emerald
//   • The skill name prominently
//   • Accuracy % (no proficiency label — just the number)
//   • Module ID in mono below
//   • A chevron to indicate the card is tappable
//
// Tapping the card opens the skill's Learning Module page (lesson + questions).
//
// ─────────────────────────────────────────────────────────────────────────────

type SkillFilter = 'all' | 'proficient' | 'approaching' | 'emerging' | 'unstarted';

/** Returns a CSS hex color string interpolated red→amber→green by score 0–1 */
function skillPriorityColor(score: number | null): string {
  if (score === null) return '#94a3b8'; // slate-400 — unstarted
  if (score >= 0.8) return '#10b981';  // emerald-500 — low priority
  if (score >= 0.6) return '#f59e0b';  // amber-500 — medium priority
  return '#f43f5e';                     // rose-500 — high priority (most urgent)
}

function SkillPanel({
  profile,
  isLocked,
  onOpenSkillModule,
}: {
  profile: UserProfile;
  isLocked: boolean;
  onOpenSkillModule: (skillId: string) => void;
}) {
  const [filter, setFilter] = useState<SkillFilter>('all');

  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the full diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-relaxed text-slate-500">
            Complete the 125-question full diagnostic to unlock targeted skill-by-skill practice across all 45 skills.
          </p>
        </div>
      </div>
    );
  }

  const allRows = buildAllSkillRows(profile);
  const assessedRows = allRows.filter(r => r.attempts > 0);
  const demonstratingCount = assessedRows.filter(r => r.tier === 'proficient').length;
  const approachingCount = assessedRows.filter(r => r.tier === 'approaching').length;
  const emergingCount = assessedRows.filter(r => r.tier === 'emerging').length;

  const displayed = filter === 'all' ? allRows : allRows.filter(r => r.tier === filter);

  const filterButtons: Array<{ id: SkillFilter; label: string; count: number; css: string; activeCss: string }> = [
    { id: 'all', label: 'All', count: allRows.length, css: 'text-slate-500 border-slate-200', activeCss: 'bg-amber-50 border-amber-300 text-slate-900' },
    { id: 'emerging', label: 'High Priority', count: emergingCount, css: 'text-rose-400 border-rose-500/20', activeCss: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
    { id: 'approaching', label: 'In Progress', count: approachingCount, css: 'text-amber-400 border-amber-500/20', activeCss: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
    { id: 'proficient', label: 'Strong', count: demonstratingCount, css: 'text-emerald-400 border-emerald-500/20', activeCss: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Assessed', value: assessedRows.length, css: 'text-slate-900' },
          { label: 'High Priority', value: emergingCount, css: 'text-rose-600' },
          { label: 'In Progress', value: approachingCount, css: 'text-amber-700' },
          { label: 'Strong', value: demonstratingCount, css: 'text-emerald-600' },
        ].map(stat => (
          <div
            key={stat.label}
            className="editorial-surface px-3 py-3 text-center"
          >
            <p className={`text-lg font-bold tabular-nums ${stat.css}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Usage hint */}
      <p className="text-[11px] text-slate-400">
        Tap a skill to open its Learning Module — lesson content and practice questions together.
        Skills are ordered highest priority first (lowest accuracy at the top).
      </p>

      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              filter === btn.id ? btn.activeCss : `bg-transparent ${btn.css} hover:opacity-80`
            }`}
          >
            {btn.label} {btn.count > 0 && <span className="opacity-70">({btn.count})</span>}
          </button>
        ))}
      </div>

      {/* Skill cards — color-coded by priority, fully tappable */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
        {displayed.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">No skills in this category yet.</p>
        ) : (
          displayed.map(row => {
            const pct = row.score !== null ? Math.round(row.score * 100) : null;
            const primaryModule = getPrimaryModuleForSkill(row.skillId);
            const barColor = skillPriorityColor(row.score);

            return (
              <button
                key={row.skillId}
                onClick={() => onOpenSkillModule(row.skillId)}
                className="editorial-surface w-full flex items-center gap-3 px-3 py-3 text-left transition-all hover:border-amber-200 hover:shadow-sm active:scale-[0.99]"
              >
                {/* Priority color bar */}
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: barColor, minHeight: '2rem' }}
                />

                {/* Skill label + module code */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium leading-snug text-slate-800">
                    {row.fullLabel}
                  </p>
                  {primaryModule && (
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">{primaryModule.id}</p>
                  )}
                </div>

                {/* Accuracy % */}
                <div className="shrink-0 text-right">
                  {pct !== null ? (
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: barColor }}
                    >
                      {pct}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </div>

                {/* Navigation chevron */}
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-300" />
              </button>
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
}: {
  profile: UserProfile;
  userId: string | null;
  isLocked: boolean;
  onNodeClick: (skillId: string) => void;
}) {
  const { progress: lpProgress } = useLearningPathSupabase(userId);

  if (isLocked) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the full diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-relaxed text-slate-500">
            Complete the full diagnostic to unlock your personalized learning path, ordered by your areas of greatest need.
          </p>
        </div>
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
  onOpenSkillModule,
  onNodeClick,
}: StudyModesSectionProps) {
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('domain');

  const screenerComplete = Boolean(profile.screenerComplete);
  const fullAssessmentComplete = Boolean(profile.fullAssessmentComplete);

  // ── Stats strip ──────────────────────────────────────────────────────────
  const allEntries = Object.entries(profile.skillScores ?? {});
  const totalAttempts = allEntries.reduce((s, [, p]) => s + p.attempts, 0);
  const totalCorrect = allEntries.reduce((s, [, p]) => s + p.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  // ── Readiness bar ────────────────────────────────────────────────────────
  const demonstratingCount = allEntries.filter(
    ([, p]) => getSkillProficiency(p.score ?? 0, p.attempts ?? 0) === 'proficient'
  ).length;
  const readinessBarPct = Math.min(Math.round((demonstratingCount / READINESS_TARGET) * 100), 100);

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
      sublabel: '4 sections · Praxis structure',
      locked: !screenerComplete,
      lockReason: 'Requires screener',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'skill',
      label: 'By Skill',
      sublabel: '45 skills · targeted',
      locked: !fullAssessmentComplete,
      lockReason: 'Requires full diagnostic',
      icon: <Target className="w-3.5 h-3.5" />,
    },
    {
      id: 'path',
      label: 'Learning Path',
      sublabel: 'Deficit-first · micro-lessons',
      locked: !fullAssessmentComplete,
      lockReason: 'Requires full diagnostic',
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
            css: 'text-cyan-400',
          },
          {
            label: 'Avg time this week',
            value: weeklyAvgSeconds > 0 ? formatStudyTime(weeklyAvgSeconds) : '—',
            css: 'text-violet-400',
          },
          {
            label: 'Overall accuracy',
            value: overallAccuracy !== null ? `${overallAccuracy}%` : '—',
            css: overallAccuracy !== null && overallAccuracy >= 70
              ? 'text-emerald-400'
              : overallAccuracy !== null && overallAccuracy >= 50
                ? 'text-amber-400'
                : 'text-rose-400',
          },
        ].map(stat => (
          <div key={stat.label} className="editorial-surface p-3 text-center">
            <p className={`text-lg font-bold tabular-nums ${stat.css}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Readiness bar ───────────────────────────────────────────────── */}
      <div className="editorial-surface p-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Praxis Readiness</p>
          <p className={`text-sm font-bold tabular-nums ${demonstratingCount >= READINESS_TARGET ? 'text-emerald-600' : 'text-slate-500'}`}>
            {demonstratingCount} / {READINESS_TARGET} {PROFICIENCY_META.proficient.label}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${demonstratingCount >= READINESS_TARGET ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${readinessBarPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Goal: {READINESS_TARGET} of {TOTAL_SKILLS} skills {PROFICIENCY_META.proficient.label}</p>
      </div>

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
                  ? 'bg-amber-50 border-amber-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-200'}
              `}
            >
              <div className={`flex items-center gap-1.5 mb-1 ${
                isActive ? 'text-amber-700' : tab.locked ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {tab.locked ? <Lock className="w-3 h-3" /> : tab.icon}
                <p className={`text-sm font-semibold truncate ${
                  isActive ? 'text-slate-900' : tab.locked ? 'text-slate-500' : 'text-slate-700'
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
            isLocked={!screenerComplete}
            onDomainSelect={onDomainSelect}
          />
        )}
        {selectedMode === 'skill' && (
          <SkillPanel
            profile={profile}
            isLocked={!fullAssessmentComplete}
            onOpenSkillModule={onOpenSkillModule}
          />
        )}
        {selectedMode === 'path' && (
          <LearningPathPanel
            profile={profile}
            userId={userId}
            isLocked={!fullAssessmentComplete}
            onNodeClick={onNodeClick ?? (() => {})}
          />
        )}
      </div>
    </section>
  );
}
