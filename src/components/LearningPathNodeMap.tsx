// src/components/LearningPathNodeMap.tsx
//
// Visual node-based Learning Path map.
//
// ─── Visual design ───────────────────────────────────────────────────────────
//   • Winding vertical road: nodes alternate left / right along a central
//     dotted SVG path, creating an S-curve "road" effect.
//   • Each node is a circular card showing skill name, status badge,
//     accuracy %, and a lock icon when inactive.
//   • Color rules:
//       Mastered      → emerald (green), inactive / non-clickable
//       Demonstrating → emerald, clickable
//       Approaching   → amber, clickable
//       Emerging      → rose, clickable
//       Not started   → slate (grey), clickable
//
// ─── Ordering rule ───────────────────────────────────────────────────────────
//   Nodes are sorted by accuracy ascending (lowest = top = first priority).
//   Mastered skills sink to the bottom and are inactive (cannot open module).
//
// ─── Interaction ─────────────────────────────────────────────────────────────
//   Clicking a non-mastered node calls onNodeClick(skillId).
// ─────────────────────────────────────────────────────────────────────────────

import { useLayoutEffect, useRef, useState } from 'react';
import { Lock, CheckCircle, BookOpen } from 'lucide-react';
import type { LearningPathSkillRecord, LearningPathStatus } from '../hooks/useLearningPathSupabase';
import { getPrimaryModuleForSkill } from '../data/learningModules';
import { getSkillProficiency, PROFICIENCY_META } from '../utils/skillProficiency';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';
import type { UserProfile } from '../hooks/useFirebaseProgress';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillNode {
  skillId: string;
  fullLabel: string;
  shortLabel: string;
  moduleId: string | null;
  // From user_progress.skill_scores (overall accuracy, all practice modes)
  overallScore: number | null;
  overallAttempts: number;
  overallTier: ReturnType<typeof getSkillProficiency>;
  // From learning_path_progress (lesson-specific progress)
  lpStatus: LearningPathStatus;
  lpAccuracy: number | null;
  lpLessonViewed: boolean;
}

interface LearningPathNodeMapProps {
  profile: UserProfile;
  /** Per-skill learning path progress from Supabase hook */
  lpProgress: Record<string, LearningPathSkillRecord>;
  /** Called when user taps a non-mastered node */
  onNodeClick: (skillId: string) => void;
}

// ─── Node color config ────────────────────────────────────────────────────────

interface NodeStyle {
  ring: string;
  bg: string;
  badge: string;
  label: string;
  connector: string; // SVG stroke color
}

function getNodeStyle(lpStatus: LearningPathStatus, overallTier: ReturnType<typeof getSkillProficiency>): NodeStyle {
  // If LP status is mastered, always green-inactive
  if (lpStatus === 'mastered' || overallTier === 'proficient') {
    return {
      ring: 'ring-emerald-500/50',
      bg: 'bg-emerald-950/60',
      badge: 'bg-emerald-500/20 text-emerald-400',
      label: 'text-emerald-400',
      connector: '#10b981',
    };
  }
  if (lpStatus === 'demonstrating') {
    return {
      ring: 'ring-emerald-400/70',
      bg: 'bg-emerald-900/50',
      badge: 'bg-emerald-500/20 text-emerald-300',
      label: 'text-emerald-300',
      connector: '#34d399',
    };
  }
  if (lpStatus === 'approaching') {
    return {
      ring: 'ring-amber-400/70',
      bg: 'bg-amber-950/50',
      badge: 'bg-amber-500/20 text-amber-300',
      label: 'text-amber-300',
      connector: '#fbbf24',
    };
  }
  // Map overall tier when no LP questions submitted yet
  if (overallTier === 'approaching') {
    return {
      ring: 'ring-amber-400/60',
      bg: 'bg-amber-950/40',
      badge: 'bg-amber-500/15 text-amber-300',
      label: 'text-amber-300',
      connector: '#fbbf24',
    };
  }
  if (lpStatus === 'emerging' || overallTier === 'emerging') {
    return {
      ring: 'ring-rose-400/70',
      bg: 'bg-rose-950/50',
      badge: 'bg-rose-500/20 text-rose-300',
      label: 'text-rose-300',
      connector: '#fb7185',
    };
  }
  // not_started / unstarted
  return {
    ring: 'ring-slate-600/60',
    bg: 'bg-navy-800/60',
    badge: 'bg-slate-700/50 text-slate-400',
    label: 'text-slate-400',
    connector: '#475569',
  };
}

function statusLabel(lpStatus: LearningPathStatus, overallTier: ReturnType<typeof getSkillProficiency>): string {
  if (lpStatus !== 'not_started') {
    const map: Record<LearningPathStatus, string> = {
      not_started: 'Not Started',
      emerging: PROFICIENCY_META.emerging.label,
      approaching: PROFICIENCY_META.approaching.label,
      demonstrating: PROFICIENCY_META.proficient.label,
      mastered: 'Mastered',
    };
    return map[lpStatus];
  }
  // Fall back to overall practice tier label
  return PROFICIENCY_META[overallTier].label;
}

// ─── Build node list ──────────────────────────────────────────────────────────

function buildNodes(
  profile: UserProfile,
  lpProgress: Record<string, LearningPathSkillRecord>
): SkillNode[] {
  const nodes: SkillNode[] = [];

  for (const domain of PROGRESS_DOMAINS) {
    for (const s of getProgressSkillsForDomain(domain.id)) {
      const perf = profile.skillScores?.[s.skillId];
      const attempts = perf?.attempts ?? 0;
      const score = attempts > 0 ? (perf?.score ?? 0) : null;
      const tier = getSkillProficiency(score ?? 0, attempts);
      const lp = lpProgress[s.skillId];
      const primaryModule = getPrimaryModuleForSkill(s.skillId);

      nodes.push({
        skillId: s.skillId,
        fullLabel: s.fullLabel,
        shortLabel: s.shortLabel,
        moduleId: primaryModule?.id ?? null,
        overallScore: score,
        overallAttempts: attempts,
        overallTier: tier,
        lpStatus: lp?.status ?? 'not_started',
        lpAccuracy: lp?.accuracy ?? null,
        lpLessonViewed: lp?.lessonViewed ?? false,
      });
    }
  }

  // Sort: mastered/demonstrating last (they sink); others by lowest accuracy first
  const isMastered = (n: SkillNode) =>
    n.lpStatus === 'mastered' || n.overallTier === 'proficient';

  return nodes.sort((a, b) => {
    const aMastered = isMastered(a);
    const bMastered = isMastered(b);
    if (aMastered && !bMastered) return 1;
    if (!aMastered && bMastered) return -1;
    // Within active: lowest overall score first (null/unstarted last)
    if (a.overallScore === null && b.overallScore === null) return a.skillId.localeCompare(b.skillId);
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return a.overallScore - b.overallScore;
  });
}

// ─── SVG connector path ───────────────────────────────────────────────────────
// Per-segment bezier paths are computed inline in useLayoutEffect above.
// This helper is kept for reference but individual segments are built there.

// ─── Single node card ─────────────────────────────────────────────────────────

function NodeCard({
  node,
  index,
  isActive,
  onClick,
}: {
  node: SkillNode;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const style = getNodeStyle(node.lpStatus, node.overallTier);
  const isMastered = node.lpStatus === 'mastered' || node.overallTier === 'proficient';
  const displayAccuracy =
    node.lpAccuracy !== null
      ? `${Math.round(node.lpAccuracy * 100)}%`
      : node.overallScore !== null
        ? `${Math.round(node.overallScore * 100)}%`
        : null;

  return (
    <button
      onClick={isMastered ? undefined : onClick}
      disabled={isMastered}
      className={`
        relative flex flex-col items-center text-center w-full
        p-3 rounded-2xl ring-2 transition-all duration-200
        ${style.ring} ${style.bg}
        ${isMastered ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.02] active:scale-[0.98] hover:brightness-110'}
        ${isActive ? 'shadow-lg shadow-cyan-500/20' : ''}
      `}
    >
      {/* Lesson-viewed dot */}
      {node.lpLessonViewed && !isMastered && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" title="Lesson viewed" />
      )}

      {/* Node icon circle */}
      <div className={`
        w-10 h-10 rounded-full ring-2 flex items-center justify-center mb-2 shrink-0
        ${style.ring} ${style.bg}
      `}>
        {isMastered ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        ) : (
          <BookOpen className={`w-4 h-4 ${style.label}`} />
        )}
      </div>

      {/* Skill label */}
      <p className={`text-[10px] font-semibold leading-snug mb-1.5 line-clamp-2 ${style.label}`}>
        {node.fullLabel}
      </p>

      {/* Module code */}
      {node.moduleId && (
        <p className="text-[8px] font-mono text-slate-600 mb-1.5">{node.moduleId}</p>
      )}

      {/* Status badge + accuracy */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${style.badge}`}>
          {statusLabel(node.lpStatus, node.overallTier)}
        </span>
        {displayAccuracy && (
          <span className={`text-[8px] font-bold tabular-nums ${style.label}`}>
            {displayAccuracy}
          </span>
        )}
      </div>

      {/* Lock overlay for mastered */}
      {isMastered && (
        <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
          <Lock className="w-3 h-3 text-emerald-700" />
        </div>
      )}

      {/* Rank badge */}
      {!isMastered && (
        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-navy-900 border border-navy-600/60 flex items-center justify-center">
          <span className="text-[7px] font-bold text-slate-500 tabular-nums">{index + 1}</span>
        </div>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const NODE_H = 140;     // approximate node card height
const V_GAP  = 48;      // vertical gap between node rows

export default function LearningPathNodeMap({
  profile,
  lpProgress,
  onNodeClick,
}: LearningPathNodeMapProps) {
  const nodes = buildNodes(profile, lpProgress);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<Array<{ d: string; color: string }>>([]);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [containerH, setContainerH] = useState(0);

  // After layout, measure node positions and compute SVG connector paths
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const positions: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < nodeRefs.current.length; i++) {
      const el = nodeRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      positions.push({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      });
    }

    if (positions.length < 2) return;

    // Build one compound path for all nodes, plus extract colors per segment
    const paths: Array<{ d: string; color: string }> = [];
    for (let i = 0; i < positions.length - 1; i++) {
      const from = positions[i];
      const to = positions[i + 1];
      const midY = (from.y + to.y) / 2;
      const d = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
      const style = getNodeStyle(nodes[i + 1].lpStatus, nodes[i + 1].overallTier);
      paths.push({ d, color: style.connector });
    }

    setSvgPaths(paths);
    setContainerH(containerRect.height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, JSON.stringify(Object.keys(lpProgress))]);

  const activeCount = nodes.filter(
    n => n.lpStatus !== 'mastered' && n.overallTier !== 'proficient'
  ).length;
  const masteredCount = nodes.length - activeCount;

  return (
    <div className="space-y-3">
      {/* Legend + count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-slate-600 leading-relaxed">
          {activeCount} skills to strengthen · {masteredCount} mastered
        </p>
        <div className="flex items-center gap-2">
          {[
            { color: 'bg-rose-500', label: 'Emerging' },
            { color: 'bg-amber-400', label: 'Approaching' },
            { color: 'bg-emerald-400', label: 'Demonstrating' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1 text-[8px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable node map container */}
      <div className="overflow-y-auto max-h-[70vh] rounded-2xl">
        <div ref={containerRef} className="relative" style={{ minHeight: nodes.length * (NODE_H + V_GAP) }}>

          {/* SVG overlay — connector lines */}
          {svgPaths.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height={containerH || nodes.length * (NODE_H + V_GAP)}
              style={{ overflow: 'visible' }}
            >
              {/* Shadow layer for depth */}
              {svgPaths.map((p, i) => (
                <path
                  key={`shadow-${i}`}
                  d={p.d}
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              ))}
              {/* Main connector lines — dashed "road" */}
              {svgPaths.map((p, i) => (
                <path
                  key={`line-${i}`}
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  opacity={0.6}
                />
              ))}
            </svg>
          )}

          {/* Node cards, alternating left/right */}
          {nodes.map((node, i) => {
            const isLeft = i % 2 === 0;
            // Alternating position: left nodes at ~5%, right nodes at ~55%
            const leftPct = isLeft ? '3%' : '53%';

            return (
              <div
                key={node.skillId}
                ref={el => { nodeRefs.current[i] = el; }}
                style={{
                  position: 'absolute',
                  top: i * (NODE_H + V_GAP),
                  left: leftPct,
                  width: '44%',
                }}
              >
                <NodeCard
                  node={node}
                  index={i}
                  isActive={false}
                  onClick={() => onNodeClick(node.skillId)}
                />
              </div>
            );
          })}

          {/* Spacer to ensure container height includes last node */}
          <div style={{ height: nodes.length * (NODE_H + V_GAP) + NODE_H }} />
        </div>
      </div>
    </div>
  );
}
