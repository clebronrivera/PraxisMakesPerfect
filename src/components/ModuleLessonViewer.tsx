// src/components/ModuleLessonViewer.tsx
//
// Renders a single learning module lesson with full content.
// Used inside both the Learning Path lesson panel and the Skill Help Drawer.
//
// ─── Module Lesson Viewer ─────────────────────────────────────────────────────
//   - Renders all typed sections (paragraph, anchor, comparison, list, interactive)
//   - Section refs for IntersectionObserver-based engagement tracking
//   - Wires onComplete callbacks to all interactive components
//   - Shows completion indicators on interactive sections
//   - "Mark as viewed" checkbox at the bottom
//   - Shows cumulative time spent badge
//   - No storage logic here — parent passes callbacks
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { LearningModule, ModuleSection } from '../data/learningModules';
import {
  ScenarioSorter,
  DragToOrder,
  TermMatcher,
  ClickSelector,
  CardFlip,
} from './ModuleInteractives';
import type { InteractiveResult } from '../hooks/useModuleVisitTracking';

interface ModuleLessonViewerProps {
  module: LearningModule;
  isViewed: boolean;
  secondsSpent: number;
  onSetViewed: (viewed: boolean) => void;
  /** Additional modules linked to the same skill (shown as "See also" links) */
  relatedModules?: Array<{ id: string; title: string }>;
  onOpenRelated?: (moduleId: string) => void;
  /** Callback when an interactive exercise is completed */
  onInteractiveComplete?: (sectionIndex: number, result: InteractiveResult) => void;
  /** Ref array for section observation — assign via ref={el => sectionRefs[i] = el} */
  sectionRefs?: React.MutableRefObject<Array<HTMLDivElement | null>>;
  /** Map of sectionIndex → completion status for interactive sections */
  completedInteractives?: Record<number, { score: number; completed: boolean }>;
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
  onInteractiveComplete,
  completedInteractives,
}: {
  section: ModuleSection;
  index: number;
  onInteractiveComplete?: (sectionIndex: number, result: InteractiveResult) => void;
  completedInteractives?: Record<number, { score: number; completed: boolean }>;
}) {
  const completed = completedInteractives?.[index];

  switch (section.type) {
    case 'paragraph':
      return (
        <p className="text-sm text-slate-300 leading-relaxed">
          {section.text}
        </p>
      );

    case 'anchor':
      return (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 space-y-1">
          {section.label && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
              {section.label}
            </p>
          )}
          <p className="text-sm text-slate-300 leading-relaxed">{section.text}</p>
        </div>
      );

    case 'list':
      return (
        <div className="space-y-1.5">
          {section.label && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {section.label}
            </p>
          )}
          <ul className="space-y-2">
            {(section.items ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-2">
          {section.label && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {section.label}
            </p>
          )}
          <div className="rounded-xl overflow-hidden border border-navy-600/40">
            {/* Headers */}
            <div className="grid grid-cols-2 bg-navy-700/60">
              <div className="px-3 py-2 border-r border-navy-600/40">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {section.leftHeader}
                </p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {section.rightHeader}
                </p>
              </div>
            </div>
            {/* Rows */}
            {(section.rows ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-2 border-t border-navy-600/30">
                <div className="px-3 py-2.5 border-r border-navy-600/30 bg-navy-800/40">
                  <p className="text-xs text-slate-300 leading-relaxed">{row.left}</p>
                </div>
                <div className="px-3 py-2.5 bg-navy-800/20">
                  <p className="text-xs text-slate-300 leading-relaxed">{row.right}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'interactive': {
      // Completion badge shown after exercise is done
      const completionBadge = completed?.completed ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 mt-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-300">
            Completed{completed.score != null ? ` · ${Math.round(completed.score * 100)}%` : ''}
          </span>
        </div>
      ) : null;

      if (section.interactiveType === 'scenario-sorter' && section.scenarios && section.categories) {
        return (
          <div className="space-y-2">
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {section.label}
              </p>
            )}
            <ScenarioSorter
              scenarios={section.scenarios}
              categories={section.categories}
              prompt={section.prompt}
              onComplete={(categorization) => {
                if (!onInteractiveComplete) return;
                const total = section.scenarios!.length;
                // Score: count how many scenarios the user sorted
                // (ScenarioSorter doesn't have a correctAnswer field, so completion = engagement)
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
            {completionBadge}
          </div>
        );
      }
      if (section.interactiveType === 'drag-to-order' && section.items) {
        return (
          <div className="space-y-2">
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {section.label}
              </p>
            )}
            <DragToOrder
              items={section.items}
              prompt={section.prompt}
              onComplete={(orderedItems) => {
                if (!onInteractiveComplete) return;
                // Score: compare to original (correct) order
                const correct = orderedItems.filter(
                  (item, i) => item === section.items![i]
                ).length;
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
            {completionBadge}
          </div>
        );
      }
      if (section.interactiveType === 'term-matcher' && section.pairs) {
        return (
          <div className="space-y-2">
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {section.label}
              </p>
            )}
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
            {completionBadge}
          </div>
        );
      }
      if (section.interactiveType === 'click-selector' && section.options) {
        return (
          <div className="space-y-2">
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {section.label}
              </p>
            )}
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
                  const allCorrectSelected = selectedIds.every(id =>
                    correctIds.includes(id)
                  ) && selectedIds.length === correctIds.length;
                  score = allCorrectSelected ? 1 : 0;
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
            {completionBadge}
          </div>
        );
      }
      if (section.interactiveType === 'card-flip' && section.cards) {
        return (
          <div className="space-y-2">
            {section.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {section.label}
              </p>
            )}
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
            {completionBadge}
          </div>
        );
      }
      return null;
    }

    case 'visual':
      // Placeholder for visual components (diagrams, charts)
      return (
        <div className="rounded-xl border border-slate-600/40 bg-slate-900/20 p-4">
          <p className="text-sm text-slate-400 italic">
            [Visual: {section.visualType}]
          </p>
        </div>
      );

    default:
      return null;
  }
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
}: ModuleLessonViewerProps) {
  const assignRef = useCallback(
    (el: HTMLDivElement | null, i: number) => {
      if (sectionRefs) {
        sectionRefs.current[i] = el;
      }
    },
    [sectionRefs]
  );

  return (
    <div className="space-y-5">
      {/* Module ID badge + time spent */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-navy-700/80 border border-navy-600/40 text-[10px] font-mono font-bold text-cyan-400">
          {module.id}
        </span>
        {secondsSpent > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            {formatTime(secondsSpent)} spent
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-slate-100 leading-snug">
        {module.title}
      </h3>

      {/* Content sections */}
      <div className="space-y-4">
        {module.sections.map((section, i) => (
          <div key={i} ref={el => assignRef(el, i)}>
            <SectionRenderer
              section={section}
              index={i}
              onInteractiveComplete={onInteractiveComplete}
              completedInteractives={completedInteractives}
            />
          </div>
        ))}
      </div>

      {/* Related modules */}
      {relatedModules && relatedModules.length > 0 && onOpenRelated && (
        <div className="pt-2 border-t border-navy-700/50 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            See also
          </p>
          <div className="space-y-1.5">
            {relatedModules.map(m => (
              <button
                key={m.id}
                onClick={() => onOpenRelated(m.id)}
                className="w-full text-left px-3 py-2 rounded-xl bg-navy-800/40 border border-navy-700/30 hover:border-cyan-500/20 transition-colors"
              >
                <span className="text-[10px] font-mono text-cyan-500 mr-2">{m.id}</span>
                <span className="text-xs text-slate-400">{m.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mark as viewed */}
      <div className="pt-3 border-t border-navy-700/50">
        <button
          onClick={() => onSetViewed(!isViewed)}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border transition-all text-sm font-semibold ${
            isViewed
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15'
              : 'bg-navy-800/60 border-navy-600/40 text-slate-400 hover:border-cyan-500/25 hover:text-slate-300'
          }`}
        >
          {isViewed ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Marked as viewed
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" />
              Mark as viewed
            </>
          )}
        </button>
      </div>
    </div>
  );
}
