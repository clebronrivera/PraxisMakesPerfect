// src/components/StudyModesSection.tsx
//
// Practice Hub: editorial-design Practice page with three tab modes.
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
  Lock,
  HelpCircle, RefreshCw,
} from 'lucide-react';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import {
  getSkillProficiency,
  PROFICIENCY_META,
  READINESS_TARGET,
  DEMONSTRATING_THRESHOLD,
  APPROACHING_THRESHOLD,
} from '../utils/skillProficiency';
// formatStudyTime and getPrimaryModuleForSkill available if needed:
// import { formatStudyTime } from '../hooks/useDailyStudyTime';
// import { getPrimaryModuleForSkill } from '../data/learningModules';
import SkillHelpDrawer from './SkillHelpDrawer';
import LearningPathNodeMap from './LearningPathNodeMap';
import { useLearningPathSupabase } from '../hooks/useLearningPathSupabase';
import type { UserProfile } from '../hooks/useProgressTracking';

// ─── Constants ────────────────────────────────────────────────────────────────
// TOTAL_SKILLS and READINESS_TARGET are imported from skillProficiency — do not redeclare.

// Light-surface equivalents for PROFICIENCY_META badge/text tokens.
// PROFICIENCY_META uses dark-mode colours; these overrides apply when
// badges are rendered on white/editorial-surface backgrounds.
// Proficiency badge styles matching the mockup
const PROF_BADGE_STYLES: Record<string, string> = {
  proficient:  'rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700',
  approaching: 'rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700',
  emerging:    'rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase text-rose-700',
  unstarted:   'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500',
};

// Percentage label color per tier
const PROF_PCT_COLOR: Record<string, string> = {
  proficient:  'text-emerald-600',
  approaching: 'text-amber-600',
  emerging:    'text-rose-500',
  unstarted:   'text-slate-400',
};

// Hover border color per tier
const PROF_HOVER_BORDER: Record<string, string> = {
  proficient:  'hover:border-emerald-200',
  approaching: 'hover:border-amber-200',
  emerging:    'hover:border-rose-200',
  unstarted:   'hover:border-slate-300',
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
  /** Overall accuracy across all skills in this domain (0–100), null if no attempts */
  overallAccuracyPct: number | null;
  /** Proficiency tier for the domain overall */
  overallTier: ReturnType<typeof getSkillProficiency>;
}

function buildDomainStats(profile: UserProfile): DomainStat[] {
  return PROGRESS_DOMAINS.map((domain) => {
    const skills = getProgressSkillsForDomain(domain.id);
    let demonstratingCount = 0;
    let approachingCount = 0;
    let emergingCount = 0;
    let unstartedCount = 0;
    let totalCorrect = 0;
    let totalAttempts = 0;

    for (const s of skills) {
      const perf = profile.skillScores?.[s.skillId];
      const tier = getSkillProficiency(perf?.score ?? 0, perf?.attempts ?? 0, perf?.weightedAccuracy);
      if (tier === 'proficient') demonstratingCount++;
      else if (tier === 'approaching') approachingCount++;
      else if (tier === 'emerging') emergingCount++;
      else unstartedCount++;
      totalCorrect += perf?.correct ?? 0;
      totalAttempts += perf?.attempts ?? 0;
    }

    const overallAccuracyPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
    const overallScore = overallAccuracyPct !== null ? overallAccuracyPct / 100 : 0;
    const overallTier = totalAttempts > 0
      ? (overallScore >= DEMONSTRATING_THRESHOLD ? 'proficient' as const
        : overallScore >= APPROACHING_THRESHOLD ? 'approaching' as const
        : 'emerging' as const)
      : 'unstarted' as const;

    return {
      domain,
      totalSkills: skills.length,
      demonstratingCount,
      approachingCount,
      emergingCount,
      unstartedCount,
      demonstratingPct: Math.round((demonstratingCount / Math.max(skills.length, 1)) * 100),
      overallAccuracyPct,
      overallTier,
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
  domainId: number;
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
        domainId: domain.id,
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock domain-based practice across all four Praxis sections.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="editorial-button-primary flex items-center gap-2 px-4 py-2 text-sm"
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
      {stats.map((stat) => {
        const tier = stat.overallTier;
        const hoverBorder = PROF_HOVER_BORDER[tier] ?? PROF_HOVER_BORDER.unstarted;
        const badgeStyle = PROF_BADGE_STYLES[tier] ?? PROF_BADGE_STYLES.unstarted;
        const pctColor = PROF_PCT_COLOR[tier] ?? PROF_PCT_COLOR.unstarted;
        const pctDisplay = stat.overallAccuracyPct !== null ? `${stat.overallAccuracyPct}%` : '--';

        return (
          <div
            key={stat.domain.id}
            onClick={() => onDomainSelect(stat.domain.id)}
            className={`editorial-surface p-5 cursor-pointer transition ${hoverBorder}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">
                  Domain {stat.domain.id} &middot; {stat.domain.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stat.totalSkills} skills
                </p>
              </div>
              <div className="text-right">
                <span className={badgeStyle}>
                  {PROFICIENCY_META[tier]?.label ?? 'Not started'}
                </span>
                <div className={`text-sm font-bold mt-1 ${pctColor}`}>
                  {pctDisplay}
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock targeted skill-by-skill practice across all 45 skills.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="editorial-button-primary flex items-center gap-2 px-4 py-2 text-sm"
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
    { id: 'all',       label: 'All',                            count: allRows.length,    css: 'text-slate-500 border-slate-200',   activeCss: 'bg-amber-50 border-amber-300 text-slate-900'    },
    { id: 'emerging',  label: PROFICIENCY_META.emerging.label,  count: emergingCount,     css: 'text-rose-600 border-rose-200',     activeCss: 'bg-rose-50 border-rose-300 text-rose-700'       },
    { id: 'approaching',label: PROFICIENCY_META.approaching.label, count: approachingCount, css: 'text-amber-700 border-amber-200', activeCss: 'bg-amber-50 border-amber-300 text-amber-700'    },
    { id: 'proficient',label: PROFICIENCY_META.proficient.label, count: demonstratingCount, css: 'text-emerald-700 border-emerald-200', activeCss: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
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
      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {filterButtons.map(btn => (
          <button
            key={btn.id}
            onClick={() => onFilterChange(btn.id)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
              filter === btn.id ? btn.activeCss : `bg-transparent ${btn.css} hover:opacity-80`
            }`}
          >
            {btn.id === 'overdue' ? btn.label : (
              <>{btn.label} {btn.count > 0 && <span className="opacity-70">({btn.count})</span>}</>
            )}
          </button>
        ))}
      </div>

      {/* Skill list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
        {displayed.length === 0 ? (
          <p className="py-4 text-center text-sm italic text-slate-500">No skills in this level yet.</p>
        ) : (
          displayed.map(row => {
            const pct = row.score !== null ? Math.round(row.score * 100) : null;
            const barColor = row.tier === 'proficient'
              ? 'bg-emerald-400'
              : row.tier === 'approaching'
                ? 'bg-amber-400'
                : row.tier === 'emerging'
                  ? 'bg-rose-400'
                  : 'bg-slate-200';
            const pctColor = row.tier === 'proficient'
              ? 'text-emerald-600'
              : row.tier === 'approaching'
                ? 'text-amber-600'
                : row.tier === 'emerging'
                  ? 'text-rose-600'
                  : 'text-slate-400';
            const hoverBorder = PROF_HOVER_BORDER[row.tier] ?? PROF_HOVER_BORDER.unstarted;

            return (
              <div
                key={row.skillId}
                onClick={() => onStartSkillPractice(row.skillId)}
                className={`editorial-surface p-4 flex justify-between items-center cursor-pointer transition ${hoverBorder}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{row.fullLabel}</p>
                  <p className="text-xs text-slate-500">D{row.domainId}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {pct !== null && (
                    <>
                      <div className="w-20 h-1.5 rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${pctColor}`}>{pct}%</span>
                    </>
                  )}
                  {/* Help button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenHelp(row.skillId, row.fullLabel); }}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                    title="View skill lesson"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Unlocks after the adaptive diagnostic</p>
          <p className="mt-1 max-w-xs mx-auto text-xs leading-normal text-slate-500">
            Complete the adaptive diagnostic to unlock your personalized learning path, ordered by your areas of greatest need.
          </p>
        </div>
        {onStartDiagnostic && (
          <button
            onClick={onStartDiagnostic}
            className="editorial-button-primary flex items-center gap-2 px-4 py-2 text-sm"
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
  weeklyAvgSeconds: _weeklyAvgSeconds = 0,
  totalQuestionsSeen: _totalQuestionsSeen,
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

  // ── Stats computation (kept for data availability) ──────────────────────
  const allEntries = Object.entries(profile.skillScores ?? {});
  const totalAttempts = allEntries.reduce((s, [, p]) => s + p.attempts, 0);
  const totalCorrect = allEntries.reduce((s, [, p]) => s + p.correct, 0);
  // Overall accuracy — kept for future use / data availability
  void _weeklyAvgSeconds; void _totalQuestionsSeen;
  const _overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
  void _overallAccuracy;

  // ── Readiness computation (kept for data availability) ──────────────────
  const demonstratingCount = allEntries.filter(
    ([, p]) => getSkillProficiency(p.score ?? 0, p.attempts ?? 0, p.weightedAccuracy) === 'proficient'
  ).length;
  const _readinessBarPct = Math.min(Math.round((demonstratingCount / READINESS_TARGET) * 100), 100);
  void _readinessBarPct;

  // ── SRS: skills due for review ────────────────────────────────────────
  const today = getLocalDateStr();
  const srsOverdueCount = allEntries.filter(
    ([, p]) => p.nextReviewDate && p.nextReviewDate <= today && p.attempts > 0
  ).length;

  const tabs: Array<{
    id: PracticeMode;
    label: string;
    locked: boolean;
  }> = [
    { id: 'domain',  label: 'By Domain',     locked: !fullAssessmentComplete },
    { id: 'skill',   label: 'By Skill',      locked: !fullAssessmentComplete },
    { id: 'path',    label: 'Learning Path',  locked: !fullAssessmentComplete },
  ];

  return (
    <section className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Practice Hub</h2>
        <p className="text-sm text-slate-500">
          Choose how you want to practice. Skills are sorted by weakest first.
        </p>
      </div>

      {/* ── Tab pills ──────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = selectedMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedMode(tab.id)}
              className={`
                inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all border
                ${isActive
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'}
              `}
            >
              {tab.locked && <Lock className="w-3 h-3" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── SRS due-for-review nudge ─────────────────────────────────────── */}
      {srsOverdueCount > 0 && fullAssessmentComplete && (
        <button
          onClick={() => { setSelectedMode('skill'); setSkillFilter('overdue'); }}
          className="w-full flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-left transition-colors hover:bg-violet-100"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0 text-violet-600" />
          <p className="text-sm text-violet-800">
            <span className="font-semibold">{srsOverdueCount} skill{srsOverdueCount !== 1 ? 's' : ''} due for spaced review</span>
            {' '}&mdash; tap to view them now.
          </p>
        </button>
      )}

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
