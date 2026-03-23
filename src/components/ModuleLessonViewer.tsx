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
  highlight,
  onInteractiveComplete,
  completedInteractives,
}: {
  section: ModuleSection;
  index: number;
  density?: Density;
  highlight?: (text: string) => React.ReactNode;
  onInteractiveComplete?: (sectionIndex: number, result: InteractiveResult) => void;
  completedInteractives?: Record<number, { score: number; completed: boolean }>;
}) {
  const hl = highlight ?? ((t: string) => t);
  const completed = completedInteractives?.[index];
  const bodyText = density === 'compact'
    ? 'text-sm text-slate-700 leading-relaxed'
    : density === 'tight'
      ? 'text-[15px] text-slate-700 leading-snug'
      : 'text-base text-slate-700 leading-relaxed';

  switch (section.type) {
    case 'paragraph':
      return <p className={bodyText}>{hl(section.text)}</p>;

    case 'anchor':
      return (
        <div className="rounded-r-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 space-y-1">
          {section.label && (
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">
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
            <p className="text-xs font-black uppercase tracking-wider text-amber-700">
              {section.label}
            </p>
          )}
          <ul className="space-y-2">
            {(section.items ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
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
            <p className="text-xs font-black uppercase tracking-wider text-amber-700">
              {section.label}
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                  {section.leftHeader}
                </p>
              </div>
              <ul className="p-4 space-y-2">
                {rows.map((row, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-700 leading-relaxed">{hl(row.left)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
              <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
                <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                  {section.rightHeader}
                </p>
              </div>
              <ul className="p-4 space-y-2">
                {rows.map((row, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-700 leading-relaxed">{hl(row.right)}</span>
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
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 mt-3">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">
            Completed{completed.score != null ? ` · ${Math.round(completed.score * 100)}%` : ''}
          </span>
        </div>
      ) : null;

      const interactiveWrapper = (label: string | undefined, children: React.ReactNode) => (
        <div>
          {label && (
            <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-3">
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
            onComplete={(categorization) => {
              if (!onInteractiveComplete) return;
              const total = section.scenarios!.length;
              const sorted = Object.values(categorization).flat().length;
              onInteractiveComplete(index, {
                interactiveType: 'scenario-sorter',
                score: total > 0 ? sorted / total : 1,
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
            options={section.options.map(o => ({ ...o, isCorrect: (o as any).isCorrect }))}
            prompt={section.prompt}
            onComplete={(selectedIds) => {
              if (!onInteractiveComplete) return;
              const opts = section.options!;
              const hasCorrectAnswers = opts.some(o => (o as any).isCorrect);
              let score = 1;
              if (hasCorrectAnswers) {
                const correctIds = opts.filter(o => (o as any).isCorrect).map(o => o.id);
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
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500 italic">[Visual: {section.visualType}]</p>
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
}: ModuleLessonViewerProps) {
  // Resolve density: explicit prop wins, else map compact boolean, else 'normal'
  const density: Density = densityProp ?? (compact ? 'compact' : 'normal');

  // Build the highlight function once per skillTerms change (memoized)
  const highlight = useMemo(
    () => skillTerms ? buildHighlighter(skillTerms, OFFICIAL_DEFINITIONS) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* ── Module header ── */}
      <div className={`border-b border-slate-100 ${headerPad}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
            {module.id}
          </span>
          {secondsSpent > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto no-print">
              <Clock className="w-3 h-3" />
              {formatTime(secondsSpent)}
            </span>
          )}
        </div>
        <h2 className={`font-black text-slate-900 tracking-tight leading-snug ${titleSize}`}>
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
              highlight={highlight}
              onInteractiveComplete={onInteractiveComplete}
              completedInteractives={completedInteractives}
            />
          </div>
        ))}

        {/* ── Related modules ── */}
        {relatedModules && relatedModules.length > 0 && onOpenRelated && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">See also</p>
            <div className="space-y-1.5">
              {relatedModules.map(m => (
                <button
                  key={m.id}
                  onClick={() => onOpenRelated(m.id)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors"
                >
                  <span className="text-[10px] font-mono text-amber-700 mr-2">{m.id}</span>
                  <span className="text-xs text-slate-600">{m.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Mark as viewed ── */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => onSetViewed(!isViewed)}
            className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
              isViewed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-slate-800'
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
