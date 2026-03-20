// src/components/ModuleLessonViewer.tsx
//
// Renders a single learning module lesson with full content.
// Used inside both the Learning Path lesson panel and the Skill Help Drawer.
//
// ─── Module Lesson Viewer ─────────────────────────────────────────────────────
//   - Renders all typed sections (paragraph, anchor, comparison, list)
//   - "Mark as viewed" checkbox at the bottom
//   - Shows cumulative time spent badge
//   - No storage logic here — parent passes callbacks
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { LearningModule, ModuleSection } from '../data/learningModules';

interface ModuleLessonViewerProps {
  module: LearningModule;
  isViewed: boolean;
  secondsSpent: number;
  onSetViewed: (viewed: boolean) => void;
  /** Additional modules linked to the same skill (shown as "See also" links) */
  relatedModules?: Array<{ id: string; title: string }>;
  onOpenRelated?: (moduleId: string) => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SectionRenderer({ section }: { section: ModuleSection }) {
  switch (section.type) {
    case 'paragraph':
      return (
        <p className="text-sm leading-relaxed text-slate-700">
          {section.text}
        </p>
      );

    case 'anchor':
      return (
        <div className="space-y-1 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3">
          {section.label && (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
              {section.label}
            </p>
          )}
          <p className="text-sm leading-relaxed text-slate-700">{section.text}</p>
        </div>
      );

    case 'list':
      return (
        <div className="space-y-1.5">
          {section.label && (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              {section.label}
            </p>
          )}
          <ul className="space-y-2">
            {(section.items ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-sm leading-relaxed text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-2">
          {section.label && (
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              {section.label}
            </p>
          )}
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
            {/* Headers */}
            <div className="grid grid-cols-2 bg-[#fbfaf7]">
              <div className="border-r border-slate-200 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {section.leftHeader}
                </p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {section.rightHeader}
                </p>
              </div>
            </div>
            {/* Rows */}
            {(section.rows ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-2 border-t border-slate-200">
                <div className="border-r border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-slate-700">{row.left}</p>
                </div>
                <div className="bg-[#fbfaf7] px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-slate-700">{row.right}</p>
                </div>
              </div>
            ))}
          </div>
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
}: ModuleLessonViewerProps) {
  return (
    <div className="space-y-5">
      {/* Module ID badge + time spent */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-700">
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
      <h3 className="text-base font-bold leading-snug text-slate-900">
        {module.title}
      </h3>

      {/* Content sections */}
      <div className="space-y-4">
        {module.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </div>

      {/* Related modules */}
      {relatedModules && relatedModules.length > 0 && onOpenRelated && (
        <div className="space-y-2 border-t border-slate-200 pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            See also
          </p>
          <div className="space-y-1.5">
            {relatedModules.map(m => (
              <button
                key={m.id}
                onClick={() => onOpenRelated(m.id)}
                className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-amber-300 hover:bg-amber-50"
              >
                <span className="mr-2 text-[10px] font-mono text-amber-700">{m.id}</span>
                <span className="text-xs text-slate-600">{m.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mark as viewed */}
      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={() => onSetViewed(!isViewed)}
          className={`flex w-full items-center justify-center gap-2.5 rounded-[1.5rem] border py-3 text-sm font-semibold transition-all ${
            isViewed
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
              : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-slate-900'
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
