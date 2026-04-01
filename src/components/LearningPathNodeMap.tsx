// src/components/LearningPathNodeMap.tsx
//
// Responsive snake-grid Learning Path map.
//
// ─── Visual design ───────────────────────────────────────────────────────────
//   • Compact skill tiles arranged in a left-to-right snake that reverses every
//     other row to keep the path visually continuous.
//   • Tiles communicate state primarily through color and status chips rather
//     than raw mastery percentages.
//   • Mastered / demonstrating skills sink to the end and become inactive.
//
// ─── Ordering rule ───────────────────────────────────────────────────────────
//   Tiles are sorted by overall deficit first (lowest scores first, then
//   unstarted), with already-demonstrating/mastered skills at the bottom.
//
// ─── Interaction ─────────────────────────────────────────────────────────────
//   Clicking a non-mastered tile opens that skill's learning-path module.
// ─────────────────────────────────────────────────────────────────────────────

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle, Lock } from 'lucide-react';
import type { LearningPathSkillRecord, LearningPathStatus } from '../hooks/useLearningPathSupabase';
import { getPrimaryModuleForSkill } from '../data/learningModules';
import { getSkillProficiency, PROFICIENCY_META } from '../utils/skillProficiency';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import type { UserProfile } from '../hooks/useProgressTracking';
import skillPhaseDRaw from '../data/skill-phase-d.json';

const skillPhaseD = skillPhaseDRaw as Record<string, { nasp_domain_primary?: string; prereq_chain_narrative?: string }>;

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
}

interface LearningPathNodeMapProps {
  profile: UserProfile;
  lpProgress: Record<string, LearningPathSkillRecord>;
  onNodeClick: (skillId: string) => void;
}

interface NodeStyle {
  ring: string;
  bg: string;
  badge: string;
  label: string;
  connector: string;
}

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 6;
const TILE_MIN_WIDTH = 150;
const TILE_GAP_PX = 16;

function getNodeStyle(lpStatus: LearningPathStatus, overallTier: ReturnType<typeof getSkillProficiency>): NodeStyle {
  if (lpStatus === 'mastered' || overallTier === 'proficient') {
    return {
      ring: 'border-emerald-300',
      bg: 'bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'text-emerald-800',
      connector: '#10b981',
    };
  }

  if (lpStatus === 'demonstrating') {
    return {
      ring: 'border-emerald-300',
      bg: 'bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'text-emerald-800',
      connector: '#34d399',
    };
  }

  if (lpStatus === 'approaching' || overallTier === 'approaching') {
    return {
      ring: 'border-amber-300',
      bg: 'bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
      label: 'text-amber-800',
      connector: '#fbbf24',
    };
  }

  if (lpStatus === 'emerging' || overallTier === 'emerging') {
    return {
      ring: 'border-rose-300',
      bg: 'bg-rose-50',
      badge: 'bg-rose-100 text-rose-700',
      label: 'text-rose-800',
      connector: '#fb7185',
    };
  }

  return {
    ring: 'border-slate-200',
    bg: 'bg-white',
    badge: 'bg-slate-100 text-slate-500',
    label: 'text-slate-600',
    connector: '#94a3b8',
  };
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
      });
    }
  }

  const isMastered = (node: SkillNode) =>
    node.lpStatus === 'mastered' || node.overallTier === 'proficient';

  return nodes.sort((a, b) => {
    const aMastered = isMastered(a);
    const bMastered = isMastered(b);

    if (aMastered && !bMastered) return 1;
    if (!aMastered && bMastered) return -1;
    if (a.overallScore === null && b.overallScore === null) return a.skillId.localeCompare(b.skillId);
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return a.overallScore - b.overallScore;
  });
}

function arrangeSnake(nodes: SkillNode[], columns: number): SkillNode[] {
  const rows: SkillNode[][] = [];

  for (let index = 0; index < nodes.length; index += columns) {
    const slice = nodes.slice(index, index + columns);
    rows.push(rows.length % 2 === 1 ? slice.reverse() : slice);
  }

  return rows.flat();
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
  const style = getNodeStyle(node.lpStatus, node.overallTier);
  const isMastered = node.lpStatus === 'mastered' || node.overallTier === 'proficient';
  const tileStatus = statusLabel(node.lpStatus, node.overallTier);

  // Phase D: prerequisite tooltip and NASP domain badge
  const phaseD = skillPhaseD[node.skillId];
  const naspDomain = phaseD?.nasp_domain_primary;
  const prereqNarrative = phaseD?.prereq_chain_narrative;
  const tooltipText = prereqNarrative
    ? `${node.fullLabel}\n\nPrerequisites: ${prereqNarrative}`
    : node.fullLabel;

  return (
    <button
      type="button"
      onClick={isMastered ? undefined : onClick}
      disabled={isMastered}
      title={tooltipText}
      className={`
        relative flex min-h-[120px] w-full flex-col items-start gap-3 rounded-[1.6rem] border p-3.5 text-left shadow-sm transition-all duration-200 sm:min-h-[128px]
        ${style.ring} ${style.bg}
        ${isMastered ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]'}
      `}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${style.ring} bg-white/70`}>
          {isMastered ? (
            <CheckCircle className="h-4 w-4 text-emerald-700" />
          ) : (
            <BookOpen className={`h-4 w-4 ${style.label}`} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {node.lpLessonViewed && !isMastered && (
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" title="Lesson viewed" />
          )}
          {!isMastered && (
            <div className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full border border-amber-200 bg-white px-1.5 shadow-sm">
              <span className="text-[11px] font-bold tabular-nums text-amber-700">{index + 1}</span>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className={`line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px] ${style.label}`}>
          {node.shortLabel}
        </p>
        {node.moduleId && (
          <p className="mt-1 text-[11px] font-mono text-slate-500">{node.moduleId}</p>
        )}
        {naspDomain && (
          <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600">
            {naspDomain}
          </span>
        )}
      </div>

      <div className="mt-auto flex w-full items-end justify-between gap-2">
        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${style.badge}`}>
          {tileStatus}
        </span>
        <div className="flex items-center gap-1.5">
          {node.visitCount > 1 && !isMastered && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500" title={`${node.visitCount} visits`}>
              {node.visitCount}x
            </span>
          )}
          {node.interactivesDone && !isMastered && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-100" title="Exercises complete">
              <CheckCircle className="h-2.5 w-2.5 text-cyan-700" />
            </span>
          )}
          {isMastered && <Lock className="h-3.5 w-3.5 text-emerald-700" />}
        </div>
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
  const gridRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [columnCount, setColumnCount] = useState(4);
  const [svgPaths, setSvgPaths] = useState<Array<{ d: string; color: string }>>([]);
  const [containerH, setContainerH] = useState(0);

  const orderedNodes = useMemo(
    () => arrangeSnake(nodes, columnCount),
    [nodes, columnCount]
  );

  useLayoutEffect(() => {
    const element = gridRef.current;
    if (!element) return;

    const updateColumns = () => {
      const width = element.clientWidth;
      const next = Math.max(
        MIN_COLUMNS,
        Math.min(
          MAX_COLUMNS,
          Math.floor((width + TILE_GAP_PX) / (TILE_MIN_WIDTH + TILE_GAP_PX)) || MIN_COLUMNS
        )
      );
      setColumnCount(current => (current === next ? current : next));
    };

    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const nodeSignature = useMemo(
    () => orderedNodes
      .map(node => `${node.skillId}:${node.lpStatus}:${node.overallTier}:${node.lpLessonViewed ? 1 : 0}`)
      .join('|'),
    [orderedNodes]
  );

  useLayoutEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    const positions = nodeRefs.current
      .slice(0, orderedNodes.length)
      .map(element => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        return {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      })
      .filter((position): position is { x: number; y: number } => position !== null);

    if (positions.length < 2) {
      setSvgPaths([]);
      setContainerH(container.offsetHeight);
      return;
    }

    const nextPaths = positions.slice(0, -1).map((from, index) => {
      const to = positions[index + 1];
      const midY = (from.y + to.y) / 2;
      const style = getNodeStyle(orderedNodes[index + 1].lpStatus, orderedNodes[index + 1].overallTier);

      return {
        d: `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`,
        color: style.connector,
      };
    });

    setSvgPaths(nextPaths);
    setContainerH(container.offsetHeight);
  }, [columnCount, nodeSignature, orderedNodes]);

  const activeCount = nodes.filter(
    node => node.lpStatus !== 'mastered' && node.overallTier !== 'proficient'
  ).length;
  const masteredCount = nodes.length - activeCount;

  return (
    <div className="space-y-4">
      <div className="editorial-surface-soft flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-600">
          {activeCount} skills to strengthen · {masteredCount} {PROFICIENCY_META.proficient.label}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { color: 'bg-rose-500', label: PROFICIENCY_META.emerging.label },
            { color: 'bg-amber-400', label: PROFICIENCY_META.approaching.label },
            { color: 'bg-emerald-400', label: PROFICIENCY_META.proficient.label },
            { color: 'bg-slate-400', label: PROFICIENCY_META.unstarted.label },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-h-[72vh] overflow-y-auto rounded-[2rem] border border-slate-200 bg-[#fbfaf7] p-3 sm:p-4">
        <div ref={gridRef} className="relative">
          {svgPaths.length > 0 && (
            <svg
              className="pointer-events-none absolute inset-0"
              width="100%"
              height={containerH}
              style={{ overflow: 'visible' }}
            >
              {svgPaths.map((path, index) => (
                <path
                  key={`shadow-${index}`}
                  d={path.d}
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.10)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              ))}
              {svgPaths.map((path, index) => (
                <path
                  key={`path-${index}`}
                  d={path.d}
                  fill="none"
                  stroke={path.color}
                  strokeWidth={2}
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                  opacity={0.75}
                />
              ))}
            </svg>
          )}

          <div
            className="relative grid gap-3 sm:gap-4"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {orderedNodes.map((node, index) => (
              <div
                key={node.skillId}
                ref={element => {
                  nodeRefs.current[index] = element;
                }}
              >
                <NodeCard
                  node={node}
                  index={index}
                  onClick={() => onNodeClick(node.skillId)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
