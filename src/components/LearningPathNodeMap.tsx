// src/components/LearningPathNodeMap.tsx
//
// Learning Path skill list — editorial card layout.
//
// ─── Visual design ───────────────────────────────────────────────────────────
//   • Vertical card list matching the mockup-user-flow Screen 10 editorial
//     design. Each skill is an `editorial-surface` card with a numbered circle,
//     status badge, and domain subtitle.
//   • Skills are grouped visually by status: active skills first, then mastered.
//
// ─── Ordering rule ───────────────────────────────────────────────────────────
//   Tiles are sorted by overall deficit first (lowest scores first, then
//   unstarted), with already-demonstrating/mastered skills at the bottom.
//
// ─── Interaction ─────────────────────────────────────────────────────────────
//   Clicking a non-mastered card opens that skill's learning-path module.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import type { LearningPathSkillRecord, LearningPathStatus } from '../hooks/useLearningPathSupabase';
import { getPrimaryModuleForSkill } from '../data/learningModules';
import { getSkillProficiency, PROFICIENCY_META } from '../utils/skillProficiency';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import type { UserProfile } from '../hooks/useProgressTracking';
import { getSkillPhaseDEntry } from '../data/skillPhaseDLookup';
import { getPrereqDepth, prereqGraph } from '../data/skillPrereqGraph';

interface SkillNode {
  skillId: string;
  fullLabel: string;
  shortLabel: string;
  moduleId: string | null;
  overallScore: number | null;
  overallTier: ReturnType<typeof getSkillProficiency>;
  lpStatus: LearningPathStatus;
  lpLessonViewed: boolean;
  visitCount: number;
  interactivesDone: boolean;
  domainId: number;
  domainName: string;
}

interface LearningPathNodeMapProps {
  profile: UserProfile;
  lpProgress: Record<string, LearningPathSkillRecord>;
  onNodeClick: (skillId: string) => void;
}

function statusLabel(lpStatus: LearningPathStatus, overallTier: ReturnType<typeof getSkillProficiency>): string {
  if (lpStatus !== 'not_started') {
    const map: Record<LearningPathStatus, string> = {
      not_started: PROFICIENCY_META.unstarted.label,
      emerging: PROFICIENCY_META.emerging.label,
      approaching: PROFICIENCY_META.approaching.label,
      demonstrating: PROFICIENCY_META.proficient.label,
      mastered: PROFICIENCY_META.proficient.label,
    };

    return map[lpStatus];
  }

  return PROFICIENCY_META[overallTier].label;
}

/** Badge color scheme keyed to status */
function getBadgeStyle(lpStatus: LearningPathStatus, overallTier: ReturnType<typeof getSkillProficiency>): {
  circleBg: string;
  circleText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  cardBorder: string;
} {
  const isMastered = lpStatus === 'mastered' || overallTier === 'proficient';
  const isDemonstrating = lpStatus === 'demonstrating';
  const isInProgress =
    lpStatus === 'approaching' ||
    lpStatus === 'emerging' ||
    overallTier === 'approaching' ||
    overallTier === 'emerging';

  if (isMastered || isDemonstrating) {
    return {
      circleBg: 'bg-emerald-100',
      circleText: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-700',
      cardBorder: '',
    };
  }

  if (isInProgress) {
    return {
      circleBg: 'bg-amber-100',
      circleText: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      badgeText: 'text-amber-700',
      cardBorder: 'border-amber-300',
    };
  }

  // Not started
  return {
    circleBg: 'bg-slate-100',
    circleText: 'text-slate-500',
    badgeBg: 'bg-slate-50',
    badgeBorder: 'border-slate-200',
    badgeText: 'text-slate-500',
    cardBorder: '',
  };
}

function buildNodes(
  profile: UserProfile,
  lpProgress: Record<string, LearningPathSkillRecord>
): SkillNode[] {
  const nodes: SkillNode[] = [];

  for (const domain of PROGRESS_DOMAINS) {
    for (const skill of getProgressSkillsForDomain(domain.id)) {
      const perf = profile.skillScores?.[skill.skillId];
      const attempts = perf?.attempts ?? 0;
      const score = attempts > 0 ? (perf?.score ?? 0) : null;
      const overallTier = getSkillProficiency(score ?? 0, attempts, perf?.weightedAccuracy);
      const lp = lpProgress[skill.skillId];
      const primaryModule = getPrimaryModuleForSkill(skill.skillId);

      nodes.push({
        skillId: skill.skillId,
        fullLabel: skill.fullLabel,
        shortLabel: skill.shortLabel,
        moduleId: primaryModule?.id ?? null,
        overallScore: score,
        overallTier,
        lpStatus: lp?.status ?? 'not_started',
        lpLessonViewed: lp?.lessonViewed ?? false,
        visitCount: (lp as any)?.visitCount ?? 0,
        interactivesDone: ((lp as any)?.interactiveExercisesCompleted ?? 0) > 0 &&
          ((lp as any)?.interactiveExercisesCompleted ?? 0) >= ((lp as any)?.interactiveExercisesTotal ?? 1),
        domainId: domain.id,
        domainName: domain.name,
      });
    }
  }

  const isMastered = (node: SkillNode) =>
    node.lpStatus === 'mastered' || node.overallTier === 'proficient';

  return nodes.sort((a, b) => {
    const aMastered = isMastered(a);
    const bMastered = isMastered(b);

    // Mastered skills always sink to the end.
    if (aMastered && !bMastered) return 1;
    if (!aMastered && bMastered) return -1;

    // Among non-mastered skills, sort more foundational skills (lower prereq
    // depth) earlier so learners encounter prerequisites before dependents.
    const aDepth = getPrereqDepth(a.skillId, prereqGraph);
    const bDepth = getPrereqDepth(b.skillId, prereqGraph);
    if (aDepth !== bDepth) return aDepth - bDepth;

    // Within the same prereq depth, surface weakest skills first.
    if (a.overallScore === null && b.overallScore === null) return a.skillId.localeCompare(b.skillId);
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return a.overallScore - b.overallScore;
  });
}

function NodeCard({
  node,
  index,
  onClick,
}: {
  node: SkillNode;
  index: number;
  onClick: () => void;
}) {
  const isMastered = node.lpStatus === 'mastered' || node.overallTier === 'proficient';
  const isNotStarted = node.lpStatus === 'not_started' && node.overallTier === 'unstarted';
  const tileStatus = statusLabel(node.lpStatus, node.overallTier);
  const style = getBadgeStyle(node.lpStatus, node.overallTier);

  // Phase D: prerequisite tooltip
  const phaseD = getSkillPhaseDEntry(node.skillId);
  const prereqNarrative = phaseD?.prereq_chain_narrative;
  const tooltipText = prereqNarrative
    ? `${node.fullLabel}\n\nPrerequisites: ${prereqNarrative}`
    : node.fullLabel;

  // Domain subtitle
  const domainLabel = PROGRESS_DOMAINS.find(d => d.id === node.domainId);
  const accuracyStr = node.overallScore !== null
    ? `${Math.round(node.overallScore * 100)}% accuracy`
    : 'No data yet';
  const subtitle = `Domain ${node.domainId} · ${domainLabel?.shortName ?? domainLabel?.name ?? ''} · ${accuracyStr}`;

  // Badge icon/text
  let badgeContent: React.ReactNode;
  if (isMastered) {
    badgeContent = (
      <span className={`flex items-center gap-1 rounded-full ${style.badgeBg} border ${style.badgeBorder} px-2 py-0.5 text-[10px] font-black uppercase ${style.badgeText}`}>
        <CheckCircle className="h-2.5 w-2.5" />
        Complete
      </span>
    );
  } else if (isNotStarted) {
    badgeContent = (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
        <Lock className="h-2.5 w-2.5" />
        Not Started
      </span>
    );
  } else {
    badgeContent = (
      <span className={`rounded-full ${style.badgeBg} border ${style.badgeBorder} px-2 py-0.5 text-[10px] font-black uppercase ${style.badgeText}`}>
        {tileStatus}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={isMastered ? undefined : onClick}
      disabled={isMastered}
      title={tooltipText}
      className={`
        editorial-surface relative flex w-full items-start gap-4 p-4 text-left transition-all duration-200
        ${style.cardBorder ? `!border-${style.cardBorder.replace('border-', '')}` : ''}
        ${isNotStarted ? 'opacity-50' : ''}
        ${isMastered ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]'}
      `}
      style={
        style.cardBorder
          ? { borderColor: style.cardBorder === 'border-amber-300' ? '#fcd34d' : undefined }
          : undefined
      }
    >
      {/* Numbered circle */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.circleBg}`}>
        {isMastered ? (
          <CheckCircle className={`h-4 w-4 ${style.circleText}`} />
        ) : (
          <span className={`text-xs font-bold ${style.circleText}`}>{index + 1}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">
              {node.shortLabel}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
          {badgeContent}
        </div>

        {/* Detail row for in-progress skills */}
        {!isMastered && !isNotStarted && (
          <div className="mt-2.5 editorial-surface-soft px-3 py-2">
            <p className="text-xs leading-relaxed text-slate-600">
              {node.lpLessonViewed && (
                <span className="mr-2 inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle className="inline h-3 w-3" /> Lesson viewed
                </span>
              )}
              {node.interactivesDone && (
                <span className="mr-2 inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle className="inline h-3 w-3" /> Exercises done
                </span>
              )}
              {node.visitCount > 1 && (
                <span className="text-slate-500">
                  {node.visitCount} visits
                </span>
              )}
              {!node.lpLessonViewed && !node.interactivesDone && node.visitCount <= 1 && (
                <span className="text-slate-500">In progress — continue where you left off</span>
              )}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

export default function LearningPathNodeMap({
  profile,
  lpProgress,
  onNodeClick,
}: LearningPathNodeMapProps) {
  const nodes = useMemo(() => buildNodes(profile, lpProgress), [profile, lpProgress]);

  const activeCount = nodes.filter(
    node => node.lpStatus !== 'mastered' && node.overallTier !== 'proficient'
  ).length;
  const masteredCount = nodes.length - activeCount;

  return (
    <div className="space-y-4">
      {/* Legend bar */}
      <div className="editorial-surface-soft flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-600">
          {activeCount} skills to strengthen · {masteredCount} {PROFICIENCY_META.proficient.label}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { color: 'bg-emerald-500', label: 'Complete' },
            { color: 'bg-amber-400', label: 'In Progress' },
            { color: 'bg-slate-400', label: 'Not Started' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Skill card list */}
      <div className="flex max-h-[72vh] flex-col gap-3 overflow-y-auto rounded-[2rem] border border-slate-200 bg-[#fbfaf7] p-3 sm:p-4">
        {nodes.map((node, index) => (
          <NodeCard
            key={node.skillId}
            node={node}
            index={index}
            onClick={() => onNodeClick(node.skillId)}
          />
        ))}
      </div>
    </div>
  );
}
