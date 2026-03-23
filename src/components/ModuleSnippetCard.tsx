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

  return (
    <div
      className={`rounded-[1.25rem] border ${
        isHint
          ? 'border-amber-200 bg-amber-50'
          : 'border-sky-200 bg-sky-50'
      } p-4 space-y-3`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isHint ? (
            <Lightbulb className="h-4 w-4 flex-shrink-0 text-amber-600" />
          ) : (
            <BookOpen className="h-4 w-4 flex-shrink-0 text-sky-600" />
          )}
          <span
            className={`text-xs font-black uppercase tracking-[0.1em] ${
              isHint ? 'text-amber-700' : 'text-sky-700'
            }`}
          >
            {isHint ? 'Hint — Module Reference' : 'What the module says'}
          </span>
        </div>
        {isHint && onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-amber-500 hover:bg-amber-100 hover:text-amber-800 transition-colors"
            title="Dismiss hint"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Module name ── */}
      {moduleTitle && (
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            isHint ? 'text-amber-600' : 'text-sky-600'
          }`}
        >
          {moduleId} — {moduleTitle}
        </p>
      )}

      {/* ── Primary snippet ── */}
      {snippet && (
        <blockquote
          className={`border-l-4 pl-3 text-sm leading-relaxed ${
            isHint
              ? 'border-amber-400 text-amber-900'
              : 'border-sky-400 text-sky-900'
          }`}
        >
          <span className="underline decoration-2 underline-offset-2">{snippet}</span>
        </blockquote>
      )}

      {/* ── Secondary module snippets (multi-module questions) ── */}
      {secondaryRefs.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-sky-200">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-500">
            Also covered in
          </p>
          {secondaryRefs.slice(0, 2).map(ref => (
            <div key={ref.moduleId} className="space-y-1">
              <p className="text-[11px] font-semibold text-sky-600">
                {ref.moduleId} — {ref.moduleTitle}
              </p>
              <blockquote className="border-l-4 border-sky-300 pl-3 text-xs leading-relaxed text-sky-800">
                <span className="underline decoration-2 underline-offset-2">{ref.snippet}</span>
              </blockquote>
            </div>
          ))}
        </div>
      )}

      {/* ── Open module button ── */}
      {moduleId && onOpenModule && (
        <button
          onClick={() => onOpenModule(moduleId)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
            isHint
              ? 'text-amber-700 hover:text-amber-900'
              : 'text-sky-700 hover:text-sky-900'
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Study the full module
        </button>
      )}

      {/* ── Hint mode scoring notice ── */}
      {isHint && (
        <p className="text-[11px] text-amber-600 italic">
          Hint opened — this answer will not count toward your score.
        </p>
      )}
    </div>
  );
}
