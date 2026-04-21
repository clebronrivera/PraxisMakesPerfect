// src/components/ModuleLessonViewer.tsx
//
// Renders a single learning module lesson with full content.
// Used inside LearningPathModulePage (full) and SkillHelpDrawer (compact).

import { useCallback, useMemo } from 'react';
import { CheckCircle, Circle, Clock, Info } from 'lucide-react';
import type { LearningModule, ModuleSection } from '../data/learningModules';
import { buildHighlighter } from '../utils/glossaryHighlighter';
import glossaryData from '../data/master-glossary.json';
import {
  ScenarioSorter,
  DragToOrder,
  TermMatcher,
  ClickSelector,
  CardFlip,
} from './ModuleInteractives';
import type { InteractiveResult } from '../hooks/useModuleVisitTracking';

type Density = 'normal' | 'tight' | 'compact';
type Variant = 'atelier' | 'editorial';

interface ModuleLessonViewerProps {
  module: LearningModule;
  isViewed: boolean;
  secondsSpent: number;
  onSetViewed: (viewed: boolean) => void;
  relatedModules?: Array<{ id: string; title: string }>;
  onOpenRelated?: (moduleId: string) => void;
  onInteractiveComplete?: (sectionIndex: number, result: InteractiveResult) => void;
  sectionRefs?: React.MutableRefObject<Array<HTMLDivElement | null>>;
  completedInteractives?: Record<number, { score: number; completed: boolean }>;
  /** @deprecated Use density='compact' instead. Kept for backward compatibility. */
  compact?: boolean;
  /** Controls spacing and text sizing:
   *  - 'normal' (default): generous spacing for standalone viewing
   *  - 'tight': reduced spacing for LearningPathModulePage accordion
   *  - 'compact': smallest — for SkillHelpDrawer */
  density?: Density;
  /**
   * Vocabulary terms for the current skill (from skill-vocabulary-map.json).
   * When provided, matching terms in paragraph/anchor/list/comparison text are
   * wrapped in GlossaryTooltip so hovering reveals the official definition.
   * Omit (or pass undefined) to disable highlighting — used by SkillHelpDrawer.
   */
  skillTerms?: string[];
  /** Visual variant — 'editorial' (default, light) for LearningPathModulePage,
   *  'atelier' (dark navy + pastel accents) for SkillHelpDrawer. */
  variant?: Variant;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SectionRenderer({
  section,
  index,
  density = 'normal',
  variant = 'editorial',
  highlight,
  onInteractiveComplete,
  completedInteractives,
}: {
  section: ModuleSection;
  index: number;
  density?: Density;
  variant?: Variant;
  highlight?: (text: string) => React.ReactNode;
  onInteractiveComplete?: (sectionIndex: number, result: InteractiveResult) => void;
  completedInteractives?: Record<number, { score: number; completed: boolean }>;
}) {
  const hl = highlight ?? ((t: string) => t);
  const completed = completedInteractives?.[index];
  const isA = variant === 'atelier';

  const bodyBase = isA ? 'text-slate-200' : 'text-slate-700';
  const bodyText = density === 'compact'
    ? `text-sm ${bodyBase} leading-relaxed`
    : density === 'tight'
      ? `text-[15px] ${bodyBase} leading-snug`
      : `text-base ${bodyBase} leading-relaxed`;

  // Token mapping per variant
  const anchorShell = isA
    ? 'rounded-r-xl border-l-2 border-[color:var(--d1-peach)]/60 bg-[color:var(--d1-peach)]/10 px-4 py-3 space-y-1'
    : 'rounded-r-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 space-y-1';
  const anchorIcon = isA ? 'w-3.5 h-3.5 shrink-0 text-[color:var(--d1-peach)]' : 'w-3.5 h-3.5 text-amber-600 shrink-0';
  const anchorLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--d1-peach)]'
    : 'text-xs font-black uppercase tracking-wider text-amber-700';

  const listLabel = anchorLabel;
  const listBullet = isA ? 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--d1-peach)]' : 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500';

  const compLeftShell = isA
    ? 'bg-white/5 rounded-xl border border-white/10 overflow-hidden'
    : 'bg-slate-50 rounded-xl border border-slate-200 overflow-hidden';
  const compLeftHead = isA
    ? 'bg-white/5 px-4 py-2 border-b border-white/10'
    : 'bg-slate-100 px-4 py-2 border-b border-slate-200';
  const compLeftLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300'
    : 'text-xs font-black uppercase tracking-wider text-slate-600';
  const compLeftDot = isA ? 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40' : 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400';
  const compLeftText = isA ? 'text-sm text-slate-200 leading-relaxed' : 'text-sm text-slate-700 leading-relaxed';

  const compRightShell = isA
    ? 'bg-[color:var(--d1-peach)]/10 rounded-xl border border-[color:var(--d1-peach)]/30 overflow-hidden'
    : 'bg-amber-50 rounded-xl border border-amber-200 overflow-hidden';
  const compRightHead = isA
    ? 'bg-[color:var(--d1-peach)]/15 px-4 py-2 border-b border-[color:var(--d1-peach)]/30'
    : 'bg-amber-100 px-4 py-2 border-b border-amber-200';
  const compRightLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--d1-peach)]'
    : 'text-xs font-black uppercase tracking-wider text-amber-700';
  const compRightDot = isA ? 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--d1-peach)]' : 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400';
  const compRightText = isA ? 'text-sm text-slate-200 leading-relaxed' : 'text-sm text-slate-700 leading-relaxed';

  const visualShell = isA
    ? 'rounded-xl border border-white/10 bg-white/5 p-4'
    : 'rounded-xl border border-slate-200 bg-slate-50 p-4';
  const visualText = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-500 italic';

  switch (section.type) {
    case 'paragraph':
      return <p className={bodyText}>{hl(section.text)}</p>;

    case 'anchor':
      return (
        <div className={anchorShell}>
          {section.label && (
            <div className="flex items-center gap-1.5">
              <Info className={anchorIcon} />
              <p className={anchorLabel}>
                {section.label}
              </p>
            </div>
          )}
          <p className={bodyText}>{hl(section.text)}</p>
        </div>
      );

    case 'list':
      return (
        <div className="space-y-2">
          {section.label && (
            <p className={listLabel}>
              {section.label}
            </p>
          )}
          <ul className="space-y-2">
            {(section.items ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={listBullet} />
                <span className={bodyText}>{hl(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'comparison': {
      // Split rows into left/right for two-card layout
      const rows = section.rows ?? [];
      return (
        <div className="space-y-2">
          {section.label && (
            <p className={listLabel}>
              {section.label}
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <div className={compLeftShell}>
              <div className={compLeftHead}>
                <p className={compLeftLabel}>
                  {section.leftHeader}
                </p>
              </div>
              <ul className="p-4 space-y-2">
                {rows.map((row, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={compLeftDot} />
                    <span className={compLeftText}>{hl(row.left)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={compRightShell}>
              <div className={compRightHead}>
                <p className={compRightLabel}>
                  {section.rightHeader}
                </p>
              </div>
              <ul className="p-4 space-y-2">
                {rows.map((row, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={compRightDot} />
                    <span className={compRightText}>{hl(row.right)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    case 'interactive': {
      const completionBadge = completed?.completed ? (
        <div
          className={
            isA
              ? 'flex items-center gap-1.5 rounded-lg bg-[color:var(--d2-mint)]/10 border border-[color:var(--d2-mint)]/30 px-3 py-1.5 mt-3'
              : 'flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 mt-3'
          }
        >
          <CheckCircle
            className={isA ? 'w-3.5 h-3.5 text-[color:var(--d2-mint)]' : 'w-3.5 h-3.5 text-emerald-600'}
          />
          <span className={isA ? 'text-xs font-bold text-[color:var(--d2-mint)]' : 'text-xs font-bold text-emerald-700'}>
            Completed{completed.score != null ? ` · ${Math.round(completed.score * 100)}%` : ''}
          </span>
        </div>
      ) : null;

      const interactiveLabel = isA
        ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--d1-peach)] mb-3'
        : 'text-xs font-black uppercase tracking-wider text-amber-700 mb-3';

      const interactiveWrapper = (label: string | undefined, children: React.ReactNode) => (
        <div>
          {label && (
            <p className={interactiveLabel}>
              {label}
            </p>
          )}
          {children}
          {completionBadge}
        </div>
      );

      if (section.interactiveType === 'scenario-sorter' && section.scenarios && section.categories) {
        return interactiveWrapper(section.label, (
          <ScenarioSorter
            scenarios={section.scenarios}
            categories={section.categories}
            prompt={section.prompt}
            variant={variant}
            onComplete={(categorization) => {
              if (!onInteractiveComplete) return;
              const scenarios = section.scenarios!;
              const total = scenarios.length;
              let correct = 0;
              scenarios.forEach(scenario => {
                if (!scenario.category) { correct++; return; }
                Object.entries(categorization).forEach(([cat, ids]) => {
                  if (ids.includes(scenario.id) && cat.toUpperCase().startsWith(scenario.category!.toUpperCase())) {
                    correct++;
                  }
                });
              });
              onInteractiveComplete(index, {
                interactiveType: 'scenario-sorter',
                score: total > 0 ? correct / total : 1,
                completed: true,
                attempts: 1,
                data: { categorization },
              });
            }}
          />
        ));
      }
      if (section.interactiveType === 'drag-to-order' && section.items) {
        return interactiveWrapper(section.label, (
          <DragToOrder
            items={section.items}
            prompt={section.prompt}
            variant={variant}
            onComplete={(orderedItems) => {
              if (!onInteractiveComplete) return;
              const correct = orderedItems.filter((item, i) => item === section.items![i]).length;
              const total = orderedItems.length;
              onInteractiveComplete(index, {
                interactiveType: 'drag-to-order',
                score: total > 0 ? correct / total : 1,
                completed: true,
                attempts: 1,
                data: { submittedOrder: orderedItems },
              });
            }}
          />
        ));
      }
      if (section.interactiveType === 'term-matcher' && section.pairs) {
        return interactiveWrapper(section.label, (
          <TermMatcher
            pairs={section.pairs}
            prompt={section.prompt}
            variant={variant}
            onComplete={(correctMatches) => {
              if (!onInteractiveComplete) return;
              const total = section.pairs!.length;
              onInteractiveComplete(index, {
                interactiveType: 'term-matcher',
                score: total > 0 ? correctMatches / total : 1,
                completed: true,
                attempts: 1,
                data: { correctMatches, total },
              });
            }}
          />
        ));
      }
      if (section.interactiveType === 'click-selector' && section.options) {
        return interactiveWrapper(section.label, (
          <ClickSelector
            options={section.options.map(o => ({ ...o, isCorrect: (o as { isCorrect?: boolean }).isCorrect }))}
            prompt={section.prompt}
            variant={variant}
            onComplete={(selectedIds) => {
              if (!onInteractiveComplete) return;
              const opts = section.options!;
              const hasCorrectAnswers = opts.some(o => (o as { isCorrect?: boolean }).isCorrect);
              let score = 1;
              if (hasCorrectAnswers) {
                const correctIds = opts.filter(o => (o as { isCorrect?: boolean }).isCorrect).map(o => o.id);
                score = selectedIds.every(id => correctIds.includes(id)) && selectedIds.length === correctIds.length ? 1 : 0;
              }
              onInteractiveComplete(index, {
                interactiveType: 'click-selector',
                score,
                completed: true,
                attempts: 1,
                data: { selectedIds },
              });
            }}
          />
        ));
      }
      if (section.interactiveType === 'card-flip' && section.cards) {
        return interactiveWrapper(section.label, (
          <CardFlip
            cards={section.cards}
            prompt={section.prompt}
            variant={variant}
            onComplete={(result) => {
              if (!onInteractiveComplete) return;
              const total = section.cards!.length;
              onInteractiveComplete(index, {
                interactiveType: 'card-flip',
                score: total > 0 ? result.flipped / total : 1,
                completed: true,
                attempts: 1,
                data: { flipped: result.flipped, total },
              });
            }}
          />
        ));
      }
      return null;
    }

    case 'visual':
      return (
        <div className={visualShell}>
          <p className={visualText}>[Visual: {section.visualType}]</p>
        </div>
      );

    default:
      return null;
  }
}

// Build the official definitions lookup once at module level (not per render)
const OFFICIAL_DEFINITIONS: Record<string, string> = {};
for (const entry of (glossaryData as { terms: { term: string; definition: string }[] }).terms) {
  OFFICIAL_DEFINITIONS[entry.term] = entry.definition;
}

export default function ModuleLessonViewer({
  module,
  isViewed,
  secondsSpent,
  onSetViewed,
  relatedModules,
  onOpenRelated,
  onInteractiveComplete,
  sectionRefs,
  completedInteractives,
  compact = false,
  density: densityProp,
  skillTerms,
  variant = 'editorial',
}: ModuleLessonViewerProps) {
  // Resolve density: explicit prop wins, else map compact boolean, else 'normal'
  const density: Density = densityProp ?? (compact ? 'compact' : 'normal');
  const isA = variant === 'atelier';

  // Build the highlight function once per skillTerms change (memoized)
  const highlight = useMemo(
    () => skillTerms ? buildHighlighter(skillTerms, OFFICIAL_DEFINITIONS) : undefined,
    [skillTerms?.join(',')]
  );

  const assignRef = useCallback(
    (el: HTMLDivElement | null, i: number) => {
      if (sectionRefs) sectionRefs.current[i] = el;
    },
    [sectionRefs]
  );

  // Spacing / sizing maps keyed by density
  const headerPad = density === 'compact' ? 'px-4 pt-4 pb-3' : density === 'tight' ? 'px-5 pt-5 pb-3' : 'px-6 pt-6 pb-4';
  const titleSize = density === 'compact' ? 'text-lg' : density === 'tight' ? 'text-xl' : 'text-2xl';
  const contentPad = density === 'compact' ? 'px-4 pt-4 pb-4' : density === 'tight' ? 'px-5 pt-4 pb-5' : 'px-6 pt-5 pb-6';
  const contentGap = density === 'compact' ? 'space-y-4' : density === 'tight' ? 'space-y-3' : 'space-y-5';

  // Variant-scoped chrome
  const shellCls = isA
    ? 'bg-[rgba(10,22,40,0.55)] backdrop-blur-[14px] rounded-2xl border border-white/8 overflow-hidden'
    : 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden';
  const headerBorder = isA ? 'border-b border-white/8' : 'border-b border-slate-100';
  const moduleIdPill = isA
    ? 'bg-[color:var(--d1-peach)]/15 text-[color:var(--d1-peach)] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-[color:var(--d1-peach)]/30'
    : 'bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider';
  const timeCls = isA
    ? 'flex items-center gap-1 text-xs text-slate-400 ml-auto no-print'
    : 'flex items-center gap-1 text-xs text-slate-400 ml-auto no-print';
  const titleCls = isA
    ? `font-black text-white tracking-tight leading-snug ${titleSize}`
    : `font-black text-slate-900 tracking-tight leading-snug ${titleSize}`;
  const relatedBorder = isA ? 'pt-3 border-t border-white/8 space-y-2' : 'pt-3 border-t border-slate-100 space-y-2';
  const seeAlsoLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400'
    : 'text-xs font-black uppercase tracking-wider text-slate-400';
  const relatedBtn = isA
    ? 'w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)]'
    : 'w-full text-left px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors';
  const relatedId = isA
    ? 'text-[10px] font-mono text-[color:var(--d1-peach)] mr-2'
    : 'text-[10px] font-mono text-amber-700 mr-2';
  const relatedTitle = isA ? 'text-xs text-slate-300' : 'text-xs text-slate-600';
  const viewedBorder = isA ? 'pt-3 border-t border-white/8' : 'pt-3 border-t border-slate-100';
  const viewedOn = isA
    ? 'bg-[color:var(--d2-mint)]/10 border-[color:var(--d2-mint)]/50 text-[color:var(--d2-mint)] hover:bg-[color:var(--d2-mint)]/15'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
  const viewedOff = isA
    ? 'bg-white/5 border-white/10 text-slate-300 hover:border-[color:var(--d1-peach)]/40 hover:text-white hover:bg-white/10'
    : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-slate-800';

  return (
    <div className={shellCls}>
      {/* ── Module header ── */}
      <div className={`${headerBorder} ${headerPad}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={moduleIdPill}>
            {module.id}
          </span>
          {secondsSpent > 0 && (
            <span className={timeCls}>
              <Clock className="w-3 h-3" />
              {formatTime(secondsSpent)}
            </span>
          )}
        </div>
        <h2 className={titleCls}>
          {module.title}
        </h2>
      </div>

      {/* ── Content sections ── */}
      <div className={`${contentGap} ${contentPad}`}>
        {module.sections.map((section, i) => (
          <div key={i} ref={el => assignRef(el, i)}>
            <SectionRenderer
              section={section}
              index={i}
              density={density}
              variant={variant}
              highlight={highlight}
              onInteractiveComplete={onInteractiveComplete}
              completedInteractives={completedInteractives}
            />
          </div>
        ))}

        {/* ── Related modules ── */}
        {relatedModules && relatedModules.length > 0 && onOpenRelated && (
          <div className={relatedBorder}>
            <p className={seeAlsoLabel}>See also</p>
            <div className="space-y-1.5">
              {relatedModules.map(m => (
                <button
                  key={m.id}
                  onClick={() => onOpenRelated(m.id)}
                  className={relatedBtn}
                >
                  <span className={relatedId}>{m.id}</span>
                  <span className={relatedTitle}>{m.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mark as viewed ── */}
        <div className={viewedBorder}>
          <button
            onClick={() => onSetViewed(!isViewed)}
            className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 font-bold text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--d1-peach)] ${
              isViewed ? viewedOn : viewedOff
            }`}
          >
            {isViewed ? (
              <><CheckCircle className="w-4 h-4" />Marked as viewed</>
            ) : (
              <><Circle className="w-4 h-4" />Mark as viewed</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
