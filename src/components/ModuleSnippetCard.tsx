// src/components/ModuleSnippetCard.tsx
//
// Shown in two contexts:
//   1. After a wrong answer — surfaces the module text passage that teaches the concept.
//   2. As a hint panel — user proactively unlocks module context before answering.
//      Opening the hint marks the question hint-used, so the answer won't count toward score.

import { BookOpen, Lightbulb, X, ExternalLink } from 'lucide-react';
import type { ModuleRef } from '../brain/question-analyzer';

interface ModuleSnippetCardProps {
  /** The primary verbatim module text that addresses this question. */
  snippet: string | null | undefined;
  /** Title of the primary module. */
  moduleTitle: string | null | undefined;
  /** ID of the primary module (e.g. MOD-D2-01). */
  moduleId: string | null | undefined;
  /** All module refs — used to show secondary modules when question is multi-module. */
  moduleRefs?: ModuleRef[];
  /** 'feedback' = shown after wrong answer. 'hint' = shown proactively before submitting. */
  mode: 'feedback' | 'hint';
  /** Only relevant in hint mode — called when the user dismisses the hint. */
  onDismiss?: () => void;
  /** Called when user clicks "Open full module". */
  onOpenModule?: (moduleId: string) => void;
}

export default function ModuleSnippetCard({
  snippet,
  moduleTitle,
  moduleId,
  moduleRefs,
  mode,
  onDismiss,
  onOpenModule,
}: ModuleSnippetCardProps) {
  if (!snippet && !moduleTitle) return null;

  const isHint = mode === 'hint';

  // Secondary modules (all refs beyond the primary)
  const secondaryRefs = (moduleRefs ?? []).filter(
    r => r.moduleId !== moduleId && r.snippet
  );

  const accentVar = isHint ? 'var(--d1-peach)' : 'var(--d3-ice)';

  return (
    <div
      className="rounded-2xl border backdrop-blur-[14px] p-4 space-y-3"
      style={{
        background: `color-mix(in srgb, ${accentVar} 8%, rgba(10,22,40,0.55))`,
        borderColor: `color-mix(in srgb, ${accentVar} 30%, transparent)`,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isHint ? (
            <Lightbulb className="h-4 w-4 flex-shrink-0" style={{ color: accentVar }} />
          ) : (
            <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: accentVar }} />
          )}
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accentVar }}
          >
            {isHint ? 'Hint — Module Reference' : 'What the module says'}
          </span>
        </div>
        {isHint && onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--d1-peach)]"
            title="Dismiss hint"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Module name ── */}
      {moduleTitle && (
        <p
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: `color-mix(in srgb, ${accentVar} 80%, white)` }}
        >
          {moduleId} — {moduleTitle}
        </p>
      )}

      {/* ── Primary snippet ── */}
      {snippet && (
        <blockquote
          className="border-l-2 pl-3 text-sm leading-relaxed text-slate-200"
          style={{ borderColor: `color-mix(in srgb, ${accentVar} 50%, transparent)` }}
        >
          <span className="underline decoration-2 underline-offset-2 decoration-white/20">{snippet}</span>
        </blockquote>
      )}

      {/* ── Secondary module snippets (multi-module questions) ── */}
      {secondaryRefs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Also covered in
          </p>
          {secondaryRefs.slice(0, 2).map(ref => (
            <div key={ref.moduleId} className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-300">
                {ref.moduleId} — {ref.moduleTitle}
              </p>
              <blockquote
                className="border-l-2 pl-3 text-xs leading-relaxed text-slate-400"
                style={{ borderColor: `color-mix(in srgb, ${accentVar} 30%, transparent)` }}
              >
                <span className="underline decoration-2 underline-offset-2 decoration-white/15">{ref.snippet}</span>
              </blockquote>
            </div>
          ))}
        </div>
      )}

      {/* ── Open module button ── */}
      {moduleId && onOpenModule && (
        <button
          onClick={() => onOpenModule(moduleId)}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--d1-peach)] rounded"
          style={{ color: accentVar }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Study the full module
        </button>
      )}

      {/* ── Hint mode scoring notice ── */}
      {isHint && (
        <p
          className="text-[11px] italic"
          style={{ color: `color-mix(in srgb, ${accentVar} 70%, white)` }}
        >
          Hint opened — this answer will not count toward your score.
        </p>
      )}
    </div>
  );
}
