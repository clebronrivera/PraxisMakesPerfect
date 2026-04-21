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
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
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
  // Mastered / proficient — mint
  if (lpStatus === 'mastered' || overallTier === 'proficient' || lpStatus === 'demonstrating') {
    return {
      ring: 'border-[color:var(--d2-mint)]/40',
      bg: 'bg-[color:var(--d2-mint)]/10',
      badge: 'bg-[color:var(--d2-mint)]/20 text-[color:var(--d2-mint)]',
      label: 'text-white',
      connector: '#b8f2d8',
    };
  }

  // Approaching — peach
  if (lpStatus === 'approaching' || overallTier === 'approaching') {
    return {
      ring: 'border-[color:var(--d1-peach)]/40',
      bg: 'bg-[color:var(--d1-peach)]/10',
      badge: 'bg-[color:var(--d1-peach)]/20 text-[color:var(--d1-peach)]',
      label: 'text-white',
      connector: '#fcd5b4',
    };
  }

  // Emerging — rose
  if (lpStatus === 'emerging' || overallTier === 'emerging') {
    return {
      ring: 'border-[color:var(--accent-rose)]/40',
      bg: 'bg-[color:var(--accent-rose)]/10',
      badge: 'bg-[color:var(--accent-rose)]/20 text-[color:var(--accent-rose)]',
      label: 'text-white',
      connector: '#fbcfe8',
    };
  }

  // Unstarted — neutral
  return {
    ring: 'border-white/10',
    bg: 'bg-white/5',
    badge: 'bg-white/10 text-slate-400',
    label: 'text-slate-300',
    connector: 'rgba(255,255,255,0.25)',
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
        visitCount: (lp as LearningPathSkillRecord & { visitCount?: number })?.visitCount ?? 0,
        interactivesDone: ((lp as LearningPathSkillRecord & { interactiveExercisesCompleted?: number })?.interactiveExercisesCompleted ?? 0) > 0 &&
          ((lp as LearningPathSkillRecord & { interactiveExercisesCompleted?: number })?.interactiveExercisesCompleted ?? 0) >= ((lp as LearningPathSkillRecord & { interactiveExercisesTotal?: number })?.interactiveExercisesTotal ?? 1),
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
  const phaseD = getSkillPhaseDEntry(node.skillId);
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
        relative flex min-h-[120px] w-full flex-col items-start gap-3 rounded-2xl border p-3.5 text-left backdrop-blur-[14px] transition-all duration-200 sm:min-h-[128px]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)]
        ${style.ring} ${style.bg}
        ${isMastered
          ? 'cursor-not-allowed opacity-60'
          : 'hover:-translate-y-0.5 hover:bg-white/8 active:scale-[0.98]'}
      `}
      style={{ boxShadow: isMastered ? undefined : '0 4px 24px -8px rgba(0,0,0,0.4)' }}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-[rgba(10,22,40,0.4)] ${style.ring}`}>
          {isMastered ? (
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--d2-mint)' }} />
          ) : (
            <BookOpen className={`h-4 w-4 ${style.label}`} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {node.lpLessonViewed && !isMastered && (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: 'var(--d1-peach)' }}
              title="Lesson viewed"
            />
          )}
          {!isMastered && (
            <div className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full border border-[color:var(--d1-peach)]/40 bg-[rgba(10,22,40,0.6)] px-1.5">
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: 'var(--d1-peach)' }}
              >
                {index + 1}
              </span>
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
          <span
            className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
            style={{
              background: 'color-mix(in srgb, var(--d4-lavender) 18%, transparent)',
              color: 'var(--d4-lavender)',
            }}
          >
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
            <span
              className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-300"
              title={`${node.visitCount} visits`}
            >
              {node.visitCount}x
            </span>
          )}
          {node.interactivesDone && !isMastered && (
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: 'color-mix(in srgb, var(--d3-ice) 20%, transparent)' }}
              title="Exercises complete"
            >
              <CheckCircle className="h-2.5 w-2.5" style={{ color: 'var(--d3-ice)' }} />
            </span>
          )}
          {isMastered && <Lock className="h-3.5 w-3.5" style={{ color: 'var(--d2-mint)' }} />}
        </div>
      </div>
    </button>
  );
}

type LPSortMode = 'weakest' | 'quick-wins' | 'by-domain';

function sortNodes(nodes: SkillNode[], mode: LPSortMode): SkillNode[] {
  if (mode === 'weakest') return nodes; // buildNodes already sorts weakest first
  const sorted = [...nodes];
  if (mode === 'quick-wins') {
    // Approaching skills closest to 80% first
    return sorted.sort((a, b) => {
      const aMastered = a.lpStatus === 'mastered' || a.overallTier === 'proficient';
      const bMastered = b.lpStatus === 'mastered' || b.overallTier === 'proficient';
      if (aMastered && !bMastered) return 1;
      if (!aMastered && bMastered) return -1;
      const aApproaching = a.overallTier === 'approaching' ? 1 : 0;
      const bApproaching = b.overallTier === 'approaching' ? 1 : 0;
      if (aApproaching !== bApproaching) return bApproaching - aApproaching;
      if (a.overallTier === 'approaching' && b.overallTier === 'approaching') {
        return (b.overallScore ?? 0) - (a.overallScore ?? 0);
      }
      return (a.overallScore ?? 0) - (b.overallScore ?? 0);
    });
  }
  // by-domain
  return sorted.sort((a, b) => {
    const aDomain = PROGRESS_DOMAINS.findIndex(d => getProgressSkillsForDomain(d.id).some(s => s.skillId === a.skillId));
    const bDomain = PROGRESS_DOMAINS.findIndex(d => getProgressSkillsForDomain(d.id).some(s => s.skillId === b.skillId));
    if (aDomain !== bDomain) return aDomain - bDomain;
    return (a.overallScore ?? 0) - (b.overallScore ?? 0);
  });
}

export default function LearningPathNodeMap({
  profile,
  lpProgress,
  onNodeClick,
}: LearningPathNodeMapProps) {
  const [sortMode, setSortMode] = useState<LPSortMode>('weakest');
  const [masteredExpanded, setMasteredExpanded] = useState(false);
  const rawNodes = useMemo(() => buildNodes(profile, lpProgress), [profile, lpProgress]);
  const nodes = useMemo(() => sortNodes(rawNodes, sortMode), [rawNodes, sortMode]);
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

  const masteredNodes = nodes.filter(n => n.lpStatus === 'mastered' || n.overallTier === 'proficient');

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sort</span>
        <div className="flex gap-0.5 bg-white/5 border border-white/8 rounded-lg p-0.5">
          {([
            { id: 'weakest' as const, label: 'Weakest First' },
            { id: 'quick-wins' as const, label: 'Quick Wins' },
            { id: 'by-domain' as const, label: 'By Domain' },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setSortMode(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] ${
                sortMode === opt.id
                  ? 'bg-[color:var(--d1-peach)]/15 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">{activeCount} active · {masteredCount} mastered</span>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.45)] backdrop-blur-[14px] flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-300">
          {activeCount} skills to strengthen · {masteredCount} {PROFICIENCY_META.proficient.label}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { color: 'var(--accent-rose)', label: PROFICIENCY_META.emerging.label },
            { color: 'var(--d1-peach)', label: PROFICIENCY_META.approaching.label },
            { color: 'var(--d2-mint)', label: PROFICIENCY_META.proficient.label },
            { color: 'rgba(255,255,255,0.4)', label: PROFICIENCY_META.unstarted.label },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-h-[72vh] overflow-y-auto rounded-2xl border border-white/8 bg-[rgba(10,22,40,0.5)] backdrop-blur-[14px] p-3 sm:p-4">
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
                  stroke="rgba(255,255,255,0.06)"
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
                  opacity={0.55}
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

      {/* ── Mastered skills collapsed section ──────────────────────────── */}
      {masteredNodes.length > 0 && (
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => setMasteredExpanded(prev => !prev)}
            className="flex items-center gap-2 w-full text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] rounded"
          >
            {masteredExpanded
              ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--d2-mint)' }} />
              : <ChevronDown className="w-4 h-4" style={{ color: 'var(--d2-mint)' }} />}
            <span className="text-sm font-semibold" style={{ color: 'var(--d2-mint)' }}>
              {masteredNodes.length} mastered skill{masteredNodes.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-500 group-hover:text-slate-300">
              {masteredExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </button>
          {masteredExpanded && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 opacity-80">
              {masteredNodes.map(node => (
                <button
                  key={node.skillId}
                  onClick={() => onNodeClick(node.skillId)}
                  className="rounded-xl border border-[color:var(--d2-mint)]/30 bg-[color:var(--d2-mint)]/10 p-2.5 text-center transition-all hover:bg-[color:var(--d2-mint)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]"
                >
                  <CheckCircle
                    className="w-3.5 h-3.5 mx-auto mb-1"
                    style={{ color: 'var(--d2-mint)' }}
                  />
                  <div className="text-[10px] font-bold text-white">{node.shortLabel}</div>
                  {node.overallScore !== null && (
                    <div className="text-[9px]" style={{ color: 'var(--d2-mint)' }}>
                      {Math.round(node.overallScore * 100)}%
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
